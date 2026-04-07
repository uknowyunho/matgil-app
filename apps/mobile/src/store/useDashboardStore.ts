import { create } from 'zustand';
import type {
  DashboardStats,
  DailyExpense,
  CreateFoodExpenseRequest,
} from '../types';
import * as dashboardApi from '../api/endpoints/dashboard';
import { getItem, setItem, removeItem } from '../utils/storage';

export interface LocalExpense {
  id: string;
  date: string;
  amount: number;
  memo?: string;
  mealType?: string;
  restaurantId?: string;
  isCorporate?: boolean;
}

function budgetKey(year: number, month: number): string {
  return `budget.${year}.${month}`;
}

function loadBudget(year: number, month: number): number | null {
  const raw = getItem(budgetKey(year, month));
  if (raw == null) return null;
  const parsed = parseInt(raw, 10);
  return isNaN(parsed) ? null : parsed;
}

interface DashboardState {
  stats: DashboardStats | null;
  localExpenses: LocalExpense[];
  isLoading: boolean;
  error: string | null;
  year: number;
  month: number;
  budgetGoal: number | null;

  setMonth: (year: number, month: number) => void;
  setBudgetGoal: (amount: number | null) => void;
  fetchDashboardStats: () => Promise<void>;
  addFoodExpense: (data: CreateFoodExpenseRequest) => void;
  updateLocalExpense: (id: string, data: { amount: number; memo?: string; mealType?: string; restaurantId?: string; isCorporate?: boolean }) => void;
  deleteLocalExpense: (id: string) => void;
  getExpensesForDate: (date: string) => LocalExpense[];
  getMergedDailyExpenses: () => DailyExpense[];
  getMergedMonthlyTotal: () => number;
  getMergedDailyAverage: () => number;
}

let localIdCounter = 0;

const now = new Date();

export const useDashboardStore = create<DashboardState>((set, get) => ({
  stats: null,
  localExpenses: [],
  isLoading: false,
  error: null,
  year: now.getFullYear(),
  month: now.getMonth() + 1,
  budgetGoal: loadBudget(now.getFullYear(), now.getMonth() + 1),

  setMonth: (year, month) => {
    set({ year, month, budgetGoal: loadBudget(year, month) });
  },

  setBudgetGoal: (amount) => {
    const { year, month } = get();
    if (amount == null) {
      removeItem(budgetKey(year, month));
    } else {
      setItem(budgetKey(year, month), String(amount));
    }
    set({ budgetGoal: amount });
  },

  fetchDashboardStats: async () => {
    set({ isLoading: true, error: null });
    try {
      const { year, month } = get();
      const [stats, serverExpenses] = await Promise.all([
        dashboardApi.getDashboardStats({ year, month }),
        dashboardApi.getMonthlyExpenses({ year, month }),
      ]);

      // Convert server expenses to LocalExpense format (normalize date to YYYY-MM-DD)
      const serverLocalExpenses: LocalExpense[] = serverExpenses.map((e) => ({
        id: e.id,
        date: e.date.includes('T') ? e.date.split('T')[0] : e.date,
        amount: e.amount,
        memo: e.memo ?? undefined,
        mealType: e.mealType ?? undefined,
        restaurantId: e.restaurantId ?? undefined,
        isCorporate: e.isCorporate ?? false,
      }));

      set((state) => ({
        stats,
        isLoading: false,
        // Keep unsync'd local expenses + replace rest with server data
        localExpenses: [
          ...state.localExpenses.filter((e) => e.id.startsWith('local-')),
          ...serverLocalExpenses,
        ],
      }));
    } catch (_error) {
      set({ isLoading: false });
    }
  },

  addFoodExpense: (data) => {
    const localId = `local-${++localIdCounter}-${Date.now()}`;
    const newExpense: LocalExpense = {
      id: localId,
      date: data.date,
      amount: data.amount,
      memo: data.memo,
      mealType: data.mealType,
      restaurantId: data.restaurantId,
      isCorporate: data.isCorporate,
    };
    set((state) => ({
      localExpenses: [...state.localExpenses, newExpense],
    }));
    dashboardApi
      .createFoodExpense(data)
      .then((serverExpense) => {
        // 로컬 ID를 서버 ID로 교체, 서버 응답의 isCorporate 값으로 동기화
        set((state) => ({
          localExpenses: state.localExpenses.map((e) =>
            e.id === localId
              ? { ...e, id: serverExpense.id, isCorporate: serverExpense.isCorporate ?? e.isCorporate }
              : e,
          ),
        }));
      })
      .catch((err) => {
        console.error('[addFoodExpense] API 실패:', err?.response?.data ?? err?.message);
      });
  },

  updateLocalExpense: (id, data) => {
    set((state) => ({
      localExpenses: state.localExpenses.map((e) =>
        e.id === id
          ? { ...e, amount: data.amount, memo: data.memo, mealType: data.mealType, restaurantId: data.restaurantId ?? e.restaurantId, isCorporate: data.isCorporate }
          : e,
      ),
    }));
    if (!id.startsWith('local-')) {
      dashboardApi
        .updateFoodExpense(id, data)
        .then(() => get().fetchDashboardStats())
        .catch((err) => {
          console.error('[update 400]', JSON.stringify(err?.response?.data));
          get().fetchDashboardStats();
        });
    }
  },

  deleteLocalExpense: (id) => {
    set((state) => ({
      localExpenses: state.localExpenses.filter((e) => e.id !== id),
    }));
    if (!id.startsWith('local-')) {
      dashboardApi
        .deleteFoodExpense(id)
        .then(() => get().fetchDashboardStats())
        .catch(() => {});
    }
  },

  getExpensesForDate: (date) => {
    return get().localExpenses.filter((e) => e.date === date);
  },

  getMergedDailyExpenses: () => {
    const { localExpenses, year, month } = get();
    const dailyMap = new Map<string, number>();
    const mealTypeMap = new Map<string, Set<string>>();

    // localExpenses에는 서버 동기화 항목 + 미동기화 로컬 항목이 모두 포함됨
    // isCorporate(법카) 항목은 집계에서 제외
    const monthPrefix = `${year}-${String(month).padStart(2, '0')}-`;
    for (const e of localExpenses) {
      if (!e.date.startsWith(monthPrefix)) continue;

      // 법카는 금액 집계 제외, 식사 타입 표시는 유지
      if (!e.isCorporate) {
        dailyMap.set(e.date, (dailyMap.get(e.date) ?? 0) + e.amount);
      }
      if (e.mealType) {
        const set = mealTypeMap.get(e.date) ?? new Set<string>();
        set.add(e.mealType);
        mealTypeMap.set(e.date, set);
      }
    }

    // 법카 항목만 있는 날짜도 mealType 표시를 위해 dailyMap에 0으로 등록
    for (const date of mealTypeMap.keys()) {
      if (!dailyMap.has(date)) {
        dailyMap.set(date, 0);
      }
    }

    return Array.from(dailyMap.entries())
      .map(([date, amount]) => ({
        date,
        amount,
        ...(mealTypeMap.has(date)
          ? { mealTypes: Array.from(mealTypeMap.get(date)!) }
          : {}),
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  },

  getMergedMonthlyTotal: () => {
    return get()
      .getMergedDailyExpenses()
      .reduce((sum, d) => sum + d.amount, 0);
  },

  getMergedDailyAverage: () => {
    const { year, month } = get();
    const total = get().getMergedMonthlyTotal();
    const daysInMonth = new Date(year, month, 0).getDate();
    return daysInMonth > 0 ? Math.round(total / daysInMonth) : 0;
  },
}));
