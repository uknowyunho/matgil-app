import type { NavigatorScreenParams } from '@react-navigation/native';

// Re-export all shared types
export type {
  User,
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  TokenRefreshRequest,
  TokenRefreshResponse,
  Restaurant,
  CreateRestaurantRequest,
  UpdateRestaurantRequest,
  RestaurantListQuery,
  RestaurantListResponse,
  RecommendationRequest,
  RecommendationResponse,
  Category,
  CreateCategoryRequest,
  UpdateCategoryRequest,
  Review,
  CreateReviewRequest,
  UpdateReviewRequest,
  Image,
  ApiResponse,
  PaginatedResponse,
  SyncPullResponse,
  SyncPushRequest,
  FoodExpense,
  CreateFoodExpenseRequest,
  UpdateFoodExpenseRequest,
  TopVisitedRestaurant,
  DailyExpense,
  DashboardStats,
  DashboardQuery,
  NearbyRestaurant,
  NearbySearchMeta,
  NearbySearchResponse,
  NearbyBucket,
  NearbyGroupedResponse,
} from '@matjip/shared';

// ─── Navigation Types ─────────────────────────────────────────────

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  Onboarding: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type MainTabParamList = {
  Home: NavigatorScreenParams<HomeStackParamList>;
  Recommend: NavigatorScreenParams<RecommendStackParamList> | undefined;
  Profile: undefined;
};

export type RecommendStackParamList = {
  RecommendMain: { initialTab?: 'nearby' | 'my' } | undefined;
  RestaurantDetail: { restaurantId: string };
  RestaurantAdd: undefined;
  RestaurantEdit: { restaurantId: string };
};

export type HomeStackParamList = {
  HomeMain: undefined;
  Search: undefined;
  RestaurantDetail: { restaurantId: string };
  RestaurantAdd: undefined;
  RestaurantEdit: { restaurantId: string };
};

export type ProfileStackParamList = {
  ProfileMain: undefined;
  CategoryManage: undefined;
};
