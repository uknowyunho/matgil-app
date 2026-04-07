import { create } from 'zustand';
import type { Restaurant } from '../types';
import { apiClient } from '../api/client';

interface RecommendedRestaurant extends Restaurant {
  distance: number;
}

interface ScoredRestaurant {
  restaurant: Restaurant;
  score: number;
  distanceMeters: number;
  breakdown: {
    rating: number;
    distance: number;
    freshness: number;
    diversity: number;
    random: number;
  };
}

interface RecommendState {
  recommendations: RecommendedRestaurant[];
  isLoading: boolean;
  radius: number;
  excludedCategoryIds: string[];

  fetchRecommendations: (latitude: number, longitude: number) => Promise<void>;
  setRadius: (radius: number) => void;
  setExcludedCategories: (categoryIds: string[]) => void;
  refreshRecommendations: (latitude: number, longitude: number) => Promise<void>;
}

function mapResponse(scored: ScoredRestaurant[]): RecommendedRestaurant[] {
  const seen = new Set<string>();
  return scored
    .map(({ restaurant, distanceMeters }) => ({
      ...restaurant,
      distance: distanceMeters,
      thumbnailUrl:
        restaurant.thumbnailUrl ||
        (restaurant.images && restaurant.images.length > 0
          ? restaurant.images.sort((a, b) => a.sortOrder - b.sortOrder)[0].url
          : undefined),
    }))
    .filter((r) => {
      if (seen.has(r.id)) return false;
      seen.add(r.id);
      return true;
    });
}

export const useRecommendStore = create<RecommendState>((set, get) => ({
  recommendations: [],
  isLoading: false,
  radius: 50000,
  excludedCategoryIds: [],

  fetchRecommendations: async (latitude, longitude) => {
    const { radius, excludedCategoryIds } = get();
    set({ isLoading: true });
    try {
      const { data } = await apiClient.post<{ success: boolean; data: ScoredRestaurant[] }>(
        '/recommendations',
        {
          lat: latitude,
          lng: longitude,
          radius,
          excludeCategoryIds: excludedCategoryIds.length > 0 ? excludedCategoryIds : undefined,
        },
      );
      set({
        recommendations: mapResponse(data.data ?? []),
        isLoading: false,
      });
    } catch {
      set({ isLoading: false });
    }
  },

  setRadius: (radius) => {
    set({ radius });
  },

  setExcludedCategories: (categoryIds) => {
    set({ excludedCategoryIds: categoryIds });
  },

  refreshRecommendations: async (latitude, longitude) => {
    const { radius, excludedCategoryIds } = get();
    set({ isLoading: true });
    try {
      const { data } = await apiClient.post<{ success: boolean; data: ScoredRestaurant[] }>(
        '/recommendations',
        {
          lat: latitude,
          lng: longitude,
          radius,
          excludeCategoryIds: excludedCategoryIds.length > 0 ? excludedCategoryIds : undefined,
        },
      );
      set({
        recommendations: mapResponse(data.data ?? []),
        isLoading: false,
      });
    } catch {
      set({ isLoading: false });
    }
  },
}));
