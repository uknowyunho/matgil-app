import { create } from 'zustand';
import type { User } from '../types';
import * as authApi from '../api/endpoints/auth';
import {
  setAccessToken,
  setRefreshToken,
  getAccessToken,
  getRefreshToken,
  clearTokens,
  getOnboardingCompleted,
  setOnboardingCompleted,
} from '../utils/storage';
import * as categoriesApi from '../api/endpoints/categories';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasCompletedOnboarding: boolean;

  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, nickname: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  setUser: (user: User | null) => void;
  completeOnboarding: () => Promise<void>;
  updateProfile: (data: { nickname?: string; latitude?: number; longitude?: number }) => Promise<void>;
  deleteAccount: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  hasCompletedOnboarding: false,

  login: async (email, password) => {
    const response = await authApi.login(email, password);
    setAccessToken(response.accessToken);
    setRefreshToken(response.refreshToken);
    
    // 로그인 성공 후 로딩 연출을 위해 의도적인 딜레이 추가 (2.5초)
    await new Promise(resolve => setTimeout(resolve, 2500));
    
    set({ 
      user: response.user, 
      isAuthenticated: true, 
      hasCompletedOnboarding: getOnboardingCompleted() 
    });
  },

  register: async (email, password, nickname) => {
    const response = await authApi.register(email, password, nickname);
    setAccessToken(response.accessToken);
    setRefreshToken(response.refreshToken);
    set({ user: response.user, isAuthenticated: true, hasCompletedOnboarding: false });
  },

  logout: async () => {
    // Fire server-side logout (best-effort, don't block UI)
    authApi.logout().catch(() => {});

    // Immediately clear local state → navigates to login screen
    clearTokens();
    set({ user: null, isAuthenticated: false, isLoading: false, hasCompletedOnboarding: false });
  },

  checkAuth: async () => {
    const accessToken = getAccessToken();
    const refreshTokenValue = getRefreshToken();

    if (!accessToken && !refreshTokenValue) {
      set({ isAuthenticated: false, isLoading: false });
      return;
    }

    try {
      // If we have a refresh token, refresh it to verify the session is valid
      if (refreshTokenValue) {
        const response = await authApi.refreshToken(refreshTokenValue);
        setAccessToken(response.accessToken);
        setRefreshToken(response.refreshToken);
      }

      // Fetch user profile
      const user = await authApi.getMe();
      set({
        user,
        isAuthenticated: true,
        isLoading: false,
        hasCompletedOnboarding: getOnboardingCompleted(),
      });
    } catch {
      clearTokens();
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  completeOnboarding: async () => {
    try {
      const defaultCategories = [
        { name: '한식', colorHex: '#E8663D' },
        { name: '일식', colorHex: '#C93B3B' },
        { name: '중식', colorHex: '#D4952B' },
        { name: '양식', colorHex: '#3B7FC9' },
        { name: '카페', colorHex: '#8B6EC0' },
        { name: '기타', colorHex: '#9C9488' },
      ];
      for (const cat of defaultCategories) {
        await categoriesApi.createCategory(cat);
      }
    } catch {
      // silently fail - categories can be added later
    }
    setOnboardingCompleted(true);
    set({ hasCompletedOnboarding: true });
  },

  updateProfile: async (data) => {
    try {
      const result = await authApi.updateProfile(data);
      set((state) => ({
        user: state.user ? { ...state.user, ...result } : null,
      }));
    } catch (error) {
      throw error;
    }
  },

  deleteAccount: async () => {
    try {
      await authApi.deleteAccount();
      clearTokens();
      set({ user: null, isAuthenticated: false, isLoading: false, hasCompletedOnboarding: false });
    } catch (error) {
      throw error;
    }
  },

  setUser: (user) => {
    set({ user, isAuthenticated: !!user });
  },
}));
