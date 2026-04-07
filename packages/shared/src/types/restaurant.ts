import { Category } from './category';

export interface Restaurant {
  id: string;
  userId: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  phone?: string;
  memo?: string;
  rating?: number;
  lastVisitedAt?: string;
  thumbnailUrl?: string;
  categories: Category[];
  images?: Array<{
    id: string;
    url: string;
    thumbnailUrl: string;
    sortOrder: number;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRestaurantRequest {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  phone?: string;
  memo?: string;
  rating?: number;
  categoryIds: string[];
}

export interface UpdateRestaurantRequest {
  name?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
  memo?: string;
  rating?: number;
  categoryIds?: string[];
}

export interface RestaurantListQuery {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  minRating?: number;
  sortBy?: 'recent' | 'name' | 'rating' | 'lastVisited';
}

export interface RestaurantListResponse {
  items: Restaurant[];
  total: number;
  page: number;
  limit: number;
}

export interface RecommendationRequest {
  latitude: number;
  longitude: number;
  radius?: number;
  excludeCategoryIds?: string[];
}

export interface RecommendationResponse {
  restaurants: (Restaurant & { distance: number })[];
}
