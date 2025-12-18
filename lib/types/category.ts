// Category型定義
export interface Category {
  id: string;
  name: string;
  color: string | null;
  sortOrder: number;
  createdAt: string;
}

export interface CreateCategoryInput {
  name: string;
  color?: string;
}

export interface UpdateCategoryInput {
  id: string;
  name?: string;
  color?: string | null;
  sortOrder?: number;
}
