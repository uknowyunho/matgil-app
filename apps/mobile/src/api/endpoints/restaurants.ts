import { apiClient } from '../client';
import type {
  ApiResponse,
  Restaurant,
  RestaurantListQuery,
  RestaurantListResponse,
  CreateRestaurantRequest,
  UpdateRestaurantRequest,
} from '../../types';

export async function getRestaurants(
  query?: RestaurantListQuery,
): Promise<RestaurantListResponse> {
  const { data } = await apiClient.get<ApiResponse<RestaurantListResponse>>('/restaurants', {
    params: query,
  });
  return data.data!;
}

export async function getRestaurant(id: string): Promise<Restaurant> {
  const { data } = await apiClient.get<ApiResponse<Restaurant>>(`/restaurants/${id}`);
  return data.data!;
}

export async function createRestaurant(
  payload: CreateRestaurantRequest,
): Promise<Restaurant> {
  const { data } = await apiClient.post<ApiResponse<Restaurant>>('/restaurants', payload);
  return data.data!;
}

export async function updateRestaurant(
  id: string,
  payload: UpdateRestaurantRequest,
): Promise<Restaurant> {
  const { data } = await apiClient.patch<ApiResponse<Restaurant>>(
    `/restaurants/${id}`,
    payload,
  );
  return data.data!;
}

export async function deleteRestaurant(id: string): Promise<void> {
  await apiClient.delete(`/restaurants/${id}`);
}
