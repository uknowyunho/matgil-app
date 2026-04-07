import { create } from 'zustand';
import type { NearbyBucket, NearbyRestaurant } from '../types';
import { searchNearbyGrouped, searchKeyword } from '../api/endpoints/nearby';

interface NearbyState {
  buckets: NearbyBucket[];
  searchResults: NearbyRestaurant[];
  isLoading: boolean;
  error: string | null;

  fetchNearby: (lat: number, lng: number) => Promise<void>;
  searchNearby: (query: string, lat?: number, lng?: number) => Promise<void>;
  reset: () => void;
  clearSearch: () => void;
}

export const useNearbyStore = create<NearbyState>((set) => ({
  buckets: [],
  searchResults: [],
  isLoading: false,
  error: null,

  fetchNearby: async (lat, lng) => {
    set({ isLoading: true, error: null, searchResults: [] });
    try {
      const result = await searchNearbyGrouped(lat, lng);
      set({ buckets: result.buckets, isLoading: false });
    } catch {
      set({ isLoading: false, error: '주변 식당을 불러올 수 없습니다' });
    }
  },

  searchNearby: async (query, lat, lng) => {
    if (!query.trim()) {
      set({ searchResults: [] });
      return;
    }
    set({ isLoading: true, error: null });
    try {
      const results = await searchKeyword(query, lat, lng);
      set({ searchResults: results, isLoading: false });
    } catch {
      set({ isLoading: false, error: '검색 중 오류가 발생했습니다' });
    }
  },

  reset: () => {
    set({ buckets: [], searchResults: [], isLoading: false, error: null });
  },

  clearSearch: () => {
    set({ searchResults: [] });
  },
}));
