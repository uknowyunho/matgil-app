import { apiClient } from '../client';
import type { ApiResponse, AuthResponse, TokenRefreshResponse } from '../../types';

export async function login(email: string, password: string): Promise<AuthResponse> {
  const { data } = await apiClient.post<ApiResponse<AuthResponse>>('/auth/login', {
    email,
    password,
  });
  return data.data!;
}

export async function register(
  email: string,
  password: string,
  nickname: string,
): Promise<AuthResponse> {
  const { data } = await apiClient.post<ApiResponse<AuthResponse>>('/auth/register', {
    email,
    password,
    nickname,
  });
  return data.data!;
}

export async function refreshToken(token: string): Promise<TokenRefreshResponse> {
  const { data } = await apiClient.post<ApiResponse<TokenRefreshResponse>>('/auth/refresh', {
    refreshToken: token,
  });
  return data.data!;
}

export async function logout(): Promise<void> {
  await apiClient.post('/auth/logout');
}

export async function getMe(): Promise<{ id: string; email: string; nickname: string; profileImageUrl: string | null }> {
  const { data } = await apiClient.get<ApiResponse<{ id: string; email: string; nickname: string; profileImageUrl: string | null }>>('/auth/me');
  return data.data!;
}

export async function updateProfile(data: {
  nickname?: string;
  latitude?: number;
  longitude?: number;
}): Promise<{ id: string; email: string; nickname: string; profileImageUrl: string | null }> {
  const { data: response } = await apiClient.patch<ApiResponse<{ id: string; email: string; nickname: string; profileImageUrl: string | null }>>('/auth/profile', data);
  return response.data!;
}

export async function deleteAccount(): Promise<void> {
  await apiClient.delete('/auth/profile');
}
