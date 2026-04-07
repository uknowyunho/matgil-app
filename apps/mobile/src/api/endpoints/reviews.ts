import { apiClient } from '../client';
import type {
  ApiResponse,
  Review,
  CreateReviewRequest,
  UpdateReviewRequest,
} from '../../types';

export async function getReviews(restaurantId: string): Promise<Review[]> {
  const { data } = await apiClient.get<ApiResponse<Review[]>>(
    `/restaurants/${restaurantId}/reviews`,
  );
  return data.data!;
}

export async function createReview(
  restaurantId: string,
  payload: Omit<CreateReviewRequest, 'restaurantId'>,
): Promise<Review> {
  const { data } = await apiClient.post<ApiResponse<Review>>(
    `/restaurants/${restaurantId}/reviews`,
    payload,
  );
  return data.data!;
}

export async function updateReview(
  id: string,
  payload: UpdateReviewRequest,
): Promise<Review> {
  const { data } = await apiClient.patch<ApiResponse<Review>>(`/reviews/${id}`, payload);
  return data.data!;
}

export async function deleteReview(id: string): Promise<void> {
  await apiClient.delete(`/reviews/${id}`);
}
