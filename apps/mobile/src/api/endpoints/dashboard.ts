import { apiClient } from '../client';
import type {
  ApiResponse,
  DashboardStats,
  DashboardQuery,
  FoodExpense,
  CreateFoodExpenseRequest,
  UpdateFoodExpenseRequest,
} from '../../types';

export async function getDashboardStats(
  query: DashboardQuery,
): Promise<DashboardStats> {
  const { data } = await apiClient.get<ApiResponse<DashboardStats>>(
    '/dashboard/stats',
    { params: query },
  );
  return data.data!;
}

export async function createFoodExpense(
  payload: CreateFoodExpenseRequest,
): Promise<FoodExpense> {
  const { data } = await apiClient.post<ApiResponse<FoodExpense>>(
    '/dashboard/expenses',
    payload,
  );
  return data.data!;
}

export async function updateFoodExpense(
  id: string,
  payload: UpdateFoodExpenseRequest,
): Promise<FoodExpense> {
  const { data } = await apiClient.patch<ApiResponse<FoodExpense>>(
    `/dashboard/expenses/${id}`,
    payload,
  );
  return data.data!;
}

export async function deleteFoodExpense(id: string): Promise<void> {
  await apiClient.delete(`/dashboard/expenses/${id}`);
}

export async function getMonthlyExpenses(
  query: DashboardQuery,
): Promise<FoodExpense[]> {
  const { data } = await apiClient.get<ApiResponse<FoodExpense[]>>(
    '/dashboard/expenses',
    { params: query },
  );
  return data.data!;
}

export async function getExpensesByRestaurant(
  restaurantId: string,
): Promise<FoodExpense[]> {
  const { data } = await apiClient.get<ApiResponse<FoodExpense[]>>(
    `/dashboard/restaurants/${restaurantId}/expenses`,
  );
  return data.data!;
}
