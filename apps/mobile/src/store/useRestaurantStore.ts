import { create } from 'zustand';
import type { Restaurant, RestaurantListQuery } from '../types';
import * as restaurantsApi from '../api/endpoints/restaurants';

function withThumbnail(r: Restaurant): Restaurant {
  if (r.thumbnailUrl) return r;
  const first = r.images?.slice().sort((a, b) => a.sortOrder - b.sortOrder)[0];
  return first ? { ...r, thumbnailUrl: first.url } : r;
}

interface RestaurantFilters {
  search?: string;
  categoryId?: string;
  sortBy?: RestaurantListQuery['sortBy'];
}

interface RestaurantState {
  restaurants: Restaurant[];
  selectedRestaurant: Restaurant | null;
  isLoading: boolean;
  error: string | null;
  filters: RestaurantFilters;
  total: number;
  page: number;

  fetchRestaurants: (query?: RestaurantListQuery) => Promise<void>;
  fetchRestaurant: (id: string) => Promise<void>;
  createRestaurant: (data: Parameters<typeof restaurantsApi.createRestaurant>[0]) => Promise<Restaurant>;
  updateRestaurant: (
    id: string,
    data: Parameters<typeof restaurantsApi.updateRestaurant>[1],
  ) => Promise<Restaurant>;
  deleteRestaurant: (id: string) => Promise<void>;
  setFilters: (filters: RestaurantFilters) => void;
}

export const useRestaurantStore = create<RestaurantState>((set, get) => ({
  restaurants: [],
  selectedRestaurant: null,
  isLoading: false,
  error: null,
  filters: {},
  total: 0,
  page: 1,

  fetchRestaurants: async (query) => {
    set({ isLoading: true, error: null });
    try {
      const { filters } = get();
      const mergedQuery: RestaurantListQuery = {
        search: filters.search,
        categoryId: filters.categoryId,
        sortBy: filters.sortBy,
        ...query,
      };
      const response = await restaurantsApi.getRestaurants(mergedQuery);
      set({
        restaurants: response.items.map(withThumbnail),
        total: response.total,
        page: response.page,
        isLoading: false,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch restaurants';
      set({ error: message, isLoading: false });
    }
  },

  fetchRestaurant: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const restaurant = await restaurantsApi.getRestaurant(id);
      set({ selectedRestaurant: restaurant, isLoading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch restaurant';
      set({ error: message, isLoading: false });
    }
  },

  createRestaurant: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const restaurant = withThumbnail(await restaurantsApi.createRestaurant(data));
      set((state) => ({
        restaurants: [restaurant, ...state.restaurants],
        isLoading: false,
      }));
      return restaurant;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create restaurant';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  updateRestaurant: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const restaurant = withThumbnail(await restaurantsApi.updateRestaurant(id, data));
      set((state) => ({
        restaurants: state.restaurants.map((r) => (r.id === id ? restaurant : r)),
        selectedRestaurant:
          state.selectedRestaurant?.id === id ? restaurant : state.selectedRestaurant,
        isLoading: false,
      }));
      return restaurant;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update restaurant';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  deleteRestaurant: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await restaurantsApi.deleteRestaurant(id);
      set((state) => ({
        restaurants: state.restaurants.filter((r) => r.id !== id),
        selectedRestaurant:
          state.selectedRestaurant?.id === id ? null : state.selectedRestaurant,
        isLoading: false,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete restaurant';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  setFilters: (filters) => {
    set({ filters });
  },
}));
