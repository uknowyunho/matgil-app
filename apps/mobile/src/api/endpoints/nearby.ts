import { apiClient } from '../client';
import type { ApiResponse, NearbySearchResponse, NearbyGroupedResponse, NearbyRestaurant } from '../../types';

interface NearbySearchParams {
  lat: number;
  lng: number;
  radius: number;
  page?: number;
}

export async function searchNearbyRestaurants(
  params: NearbySearchParams,
): Promise<NearbySearchResponse> {
  const { data } = await apiClient.get<ApiResponse<NearbySearchResponse>>(
    '/nearby/restaurants',
    { params },
  );
  return data.data!;
}

export async function searchKeyword(
  query: string,
  lat?: number,
  lng?: number,
): Promise<NearbyRestaurant[]> {
  const params: Record<string, string | number> = { query };
  if (lat != null && lng != null) {
    params.lat = lat;
    params.lng = lng;
  }
  const { data } = await apiClient.get<ApiResponse<NearbyRestaurant[]>>(
    '/nearby/search/keyword',
    { params },
  );
  return data.data!;
}

export async function searchNearbyGrouped(
  lat: number,
  lng: number,
): Promise<NearbyGroupedResponse> {
  const { data } = await apiClient.get<ApiResponse<NearbyGroupedResponse>>(
    '/nearby/restaurants/grouped',
    { params: { lat, lng } },
  );
  return data.data!;
}
