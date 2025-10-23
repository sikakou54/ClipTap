/**
 * 共通型定義
 */

// ===============================
// 基本型
// ===============================

export type ID = string;

export type Timestamp = string; // ISO 8601形式

// ===============================
// UI型
// ===============================

export type ButtonVariant = 'primary' | 'secondary' | 'success' | 'danger' | 'ghost' | 'outline';

export type ButtonSize = 'small' | 'medium' | 'large';

export type InputType = 'text' | 'email' | 'password' | 'number' | 'multiline';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export type AlertType = 'default' | 'warning' | 'danger';

// ===============================
// データベース型
// ===============================

export interface BaseEntity {
  id: ID;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface SampleEntity extends BaseEntity {
  name: string;
  description?: string;
}

// ===============================
// API型
// ===============================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// ===============================
// フォーム型
// ===============================

export interface FormField<T = any> {
  value: T;
  error?: string;
  touched: boolean;
  dirty: boolean;
}

export interface FormState<T extends Record<string, any>> {
  fields: {
    [K in keyof T]: FormField<T[K]>;
  };
  isValid: boolean;
  isDirty: boolean;
  isSubmitting: boolean;
}

// ===============================
// バリデーション型
// ===============================

export interface ValidationRule<T = any> {
  validate: (value: T) => boolean;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

// ===============================
// ナビゲーション型
// ===============================

export type RootStackParamList = {
  index: undefined;
  // 他の画面パラメータをここに追加
};

// ===============================
// ユーティリティ型
// ===============================

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type Nullable<T> = T | null;

export type Optional<T> = T | undefined;

export type ArrayElement<T> = T extends (infer U)[] ? U : never;
