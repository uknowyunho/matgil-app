// Re-export all types
export * from './user';
export * from './auth';
export * from './restaurant';
export * from './category';
export * from './review';

// Image
export interface Image {
  id: string;
  restaurantId: string;
  userId: string;
  url: string;
  thumbnailUrl: string;
  s3Key: string;
  fileSize: number;
  mimeType: string;
  sortOrder: number;
  createdAt: string;
}

// Generic API response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    statusCode: number;
  };
}

// Generic paginated response
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

// Sync types
export interface SyncPullResponse {
  restaurants: import('./restaurant').Restaurant[];
  categories: import('./category').Category[];
  reviews: import('./review').Review[];
  images: Image[];
  lastSyncedAt: string;
}

// ─── Food Expense ────────────────────────────────────────────────
export interface FoodExpense {
  id: string;
  userId: string;
  restaurantId?: string;
  date: string;
  amount: number;
  memo?: string;
  mealType?: string;
  isCorporate?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFoodExpenseRequest {
  date: string;
  amount: number;
  memo?: string;
  mealType?: string;
  restaurantId?: string;
  isCorporate?: boolean;
}

export interface UpdateFoodExpenseRequest {
  date?: string;
  amount?: number;
  memo?: string;
  mealType?: string;
  restaurantId?: string;
  isCorporate?: boolean;
}

// ─── Dashboard ───────────────────────────────────────────────────
export interface TopVisitedRestaurant {
  restaurantId: string;
  name: string;
  visitCount: number;
  rating: number | null;
  categoryName?: string;
}

export interface DailyExpense {
  date: string;
  amount: number;
  mealTypes?: string[];
}

export interface DashboardStats {
  totalRestaurantCount: number;
  topVisitedRestaurants: TopVisitedRestaurant[];
  monthlyExpenseTotal: number;
  dailyAverage: number;
  dailyExpenses: DailyExpense[];
}

export interface DashboardQuery {
  year: number;
  month: number;
}

// ─── Nearby (Kakao Local API) ────────────────────────────────────
export interface NearbyRestaurant {
  kakaoId: string;
  name: string;
  categoryName: string;
  phone: string;
  address: string;
  roadAddress: string;
  longitude: number;
  latitude: number;
  placeUrl: string;
  distance: number;
}

export interface NearbySearchMeta {
  totalCount: number;
  isEnd: boolean;
  currentPage: number;
}

export interface NearbySearchResponse {
  restaurants: NearbyRestaurant[];
  meta: NearbySearchMeta;
}

export interface NearbyBucket {
  label: string;
  restaurants: NearbyRestaurant[];
}

export interface NearbyGroupedResponse {
  buckets: NearbyBucket[];
}

export interface SyncPushRequest {
  restaurants: {
    created: import('./restaurant').CreateRestaurantRequest[];
    updated: (import('./restaurant').UpdateRestaurantRequest & { id: string })[];
    deleted: string[];
  };
  categories: {
    created: import('./category').CreateCategoryRequest[];
    updated: (import('./category').UpdateCategoryRequest & { id: string })[];
    deleted: string[];
  };
  reviews: {
    created: import('./review').CreateReviewRequest[];
    updated: (import('./review').UpdateReviewRequest & { id: string })[];
    deleted: string[];
  };
  lastSyncedAt: string;
}
