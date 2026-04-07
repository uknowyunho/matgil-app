import { create } from 'zustand';
import type { Review, CreateReviewRequest, UpdateReviewRequest } from '../types';
import * as reviewsApi from '../api/endpoints/reviews';

interface ReviewState {
  reviews: Review[];
  isLoading: boolean;
  error: string | null;

  fetchReviews: (restaurantId: string) => Promise<void>;
  createReview: (
    restaurantId: string,
    data: Omit<CreateReviewRequest, 'restaurantId'>,
  ) => Promise<Review>;
  updateReview: (id: string, data: UpdateReviewRequest) => Promise<Review>;
  deleteReview: (id: string) => Promise<void>;
}

export const useReviewStore = create<ReviewState>((set, get) => ({
  reviews: [],
  isLoading: false,
  error: null,

  fetchReviews: async (restaurantId) => {
    set({ isLoading: true, error: null });
    try {
      const reviews = await reviewsApi.getReviews(restaurantId);
      set({ reviews, isLoading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch reviews';
      set({ error: message, isLoading: false });
    }
  },

  createReview: async (restaurantId, data) => {
    set({ isLoading: true, error: null });
    try {
      const review = await reviewsApi.createReview(restaurantId, data);
      set((state) => ({
        reviews: [review, ...state.reviews],
        isLoading: false,
      }));
      return review;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create review';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  updateReview: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const review = await reviewsApi.updateReview(id, data);
      set((state) => ({
        reviews: state.reviews.map((r) => (r.id === id ? review : r)),
        isLoading: false,
      }));
      return review;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update review';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  deleteReview: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await reviewsApi.deleteReview(id);
      set((state) => ({
        reviews: state.reviews.filter((r) => r.id !== id),
        isLoading: false,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete review';
      set({ error: message, isLoading: false });
      throw error;
    }
  },
}));
