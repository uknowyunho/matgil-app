export interface Category {
  id: string;
  userId: string;
  name: string;
  colorHex: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCategoryRequest {
  name: string;
  colorHex: string;
  sortOrder?: number;
}

export interface UpdateCategoryRequest {
  name?: string;
  colorHex?: string;
  sortOrder?: number;
}
