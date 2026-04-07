import { apiClient } from '../client';
import type { ApiResponse, Image } from '../../types';

export async function uploadImage(
  restaurantId: string,
  fileUri: string,
  sortOrder: number,
): Promise<Image> {
  const formData = new FormData();

  const response = await fetch(fileUri);
  const blob = await response.blob();
  formData.append('file', blob, `image_${sortOrder}.jpg`);

  const { data } = await apiClient.post<ApiResponse<Image>>(
    `/restaurants/${restaurantId}/images/upload?sortOrder=${sortOrder}`,
    formData,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
    },
  );
  return data.data!;
}

export async function deleteImage(id: string): Promise<void> {
  await apiClient.delete(`/images/${id}`);
}
