import { apiClient } from '../client';
import type {
  ApiResponse,
  Category,
  CreateCategoryRequest,
  UpdateCategoryRequest,
} from '../../types';

export async function getCategories(): Promise<Category[]> {
  const { data } = await apiClient.get<ApiResponse<Category[]>>('/categories');
  return data.data!;
}

export async function createCategory(payload: CreateCategoryRequest): Promise<Category> {
  const { data } = await apiClient.post<ApiResponse<Category>>('/categories', payload);
  return data.data!;
}

export async function updateCategory(
  id: string,
  payload: UpdateCategoryRequest,
): Promise<Category> {
  const { data } = await apiClient.patch<ApiResponse<Category>>(`/categories/${id}`, payload);
  return data.data!;
}

export async function deleteCategory(id: string): Promise<void> {
  await apiClient.delete(`/categories/${id}`);
}
