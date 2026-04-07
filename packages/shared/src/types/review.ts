export interface Review {
  id: string;
  userId: string;
  restaurantId: string;
  content: string;
  rating: number;
  amount?: number;
  visitedDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReviewRequest {
  restaurantId: string;
  content: string;
  rating: number;
  amount?: number;
  visitedDate?: string;
}

export interface UpdateReviewRequest {
  content?: string;
  rating?: number;
  amount?: number;
  visitedDate?: string;
}
