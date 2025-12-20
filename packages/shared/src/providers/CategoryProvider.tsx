/**
 * カテゴリ管理Provider
 *
 * @description
 * カテゴリのグローバル状態を管理するProvider。
 * すべての画面で同じデータを参照でき、一箇所で更新すると全画面に即座に反映される。
 *
 * @module CategoryProvider
 */

import { createContext, useContext, useState, useEffect, useCallback, useMemo, type ReactNode } from 'react';
import { CategoryService } from '../services/CategoryService';
import { Logger } from '../utils/logger';
import { useDatabase } from './DatabaseProvider';
import type { Category, CreateCategoryInput, UpdateCategoryInput } from '../schema';

/* ======================================== */
/* 型定義 */
/* ======================================== */

/**
 * CategoryContextの型定義
 */
export interface CategoryContextValue {
  /** カテゴリ一覧（displayOrder順） */
  categories: Category[];
  /** データ読み込み中フラグ */
  loading: boolean;
  /** エラー情報（エラーなしの場合null） */
  error: Error | null;
  /** データ再読み込み関数 */
  refresh: () => void;
  /** カテゴリ作成 */
  createCategory: (input: CreateCategoryInput) => Category;
  /** カテゴリ更新 */
  updateCategory: (input: UpdateCategoryInput) => Category;
  /** カテゴリ削除 */
  deleteCategory: (id: string) => void;
  /** カテゴリ並び替え */
  reorderCategories: (categoryIds: string[]) => void;
  /** IDで取得 */
  getById: (id: string) => Category | null;
  /** 名前で取得 */
  getByName: (name: string) => Category | null;
}

/**
 * CategoryProviderのProps
 */
interface CategoryProviderProps {
  /** 子コンポーネント */
  children: ReactNode;
}

/* ======================================== */
/* Context */
/* ======================================== */

const CategoryContext = createContext<CategoryContextValue | null>(null);

/* ======================================== */
/* Provider */
/* ======================================== */

/**
 * カテゴリ管理Provider
 *
 * @param props - CategoryProviderProps
 */
export function CategoryProvider({ children }: CategoryProviderProps) {
  /* ======================================== */
  /* 状態管理 */
  /* ======================================== */
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  /* データベース初期化状態（DatabaseProviderが必須） */
  const { isLoaded: isDatabaseLoaded } = useDatabase();

  /* ======================================== */
  /* データ読み込み */
  /* ======================================== */
  const loadCategories = useCallback(() => {
    try {
      setLoading(true);
      const allCategories = CategoryService.getAll();
      setCategories(allCategories);
      setError(null);
    } catch (err) {
      Logger.error('[CategoryProvider] Failed to load categories:', err);
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, []);

  /* データベースが初期化された後にデータを読み込む */
  useEffect(() => {
    if (!isDatabaseLoaded) return;
    loadCategories();
  }, [loadCategories, isDatabaseLoaded]);

  /* ======================================== */
  /* CRUD操作 */
  /* ======================================== */

  /**
   * カテゴリ作成
   * @throws {EmptyContentError} カテゴリ名が空の場合
   * @throws {DuplicateNameError} 同名のカテゴリが既に存在する場合
   */
  const createCategory = useCallback(
    (input: CreateCategoryInput): Category => {
      const category = CategoryService.create(input);
      loadCategories();
      return category;
    },
    [loadCategories]
  );

  /**
   * カテゴリ更新
   * @throws {EmptyContentError} カテゴリ名が空の場合
   * @throws {DuplicateNameError} 同名のカテゴリが既に存在する場合（自分以外）
   */
  const updateCategory = useCallback(
    (input: UpdateCategoryInput): Category => {
      const category = CategoryService.update(input);
      loadCategories();
      return category;
    },
    [loadCategories]
  );

  /**
   * カテゴリ削除
   * @remarks 関連するスニペットのcategoryIdはnullに更新される
   */
  const deleteCategory = useCallback(
    (id: string): void => {
      CategoryService.delete(id);
      loadCategories();
    },
    [loadCategories]
  );

  /**
   * カテゴリ並び替え
   * @param categoryIds - 新しい順序のカテゴリIDの配列
   */
  const reorderCategories = useCallback(
    (categoryIds: string[]): void => {
      CategoryService.reorder(categoryIds);
      loadCategories();
    },
    [loadCategories]
  );

  /* ======================================== */
  /* ユーティリティ */
  /* ======================================== */

  const getById = useCallback((id: string): Category | null => CategoryService.getById(id), []);

  const getByName = useCallback((name: string): Category | null => CategoryService.getByName(name), []);

  /* ======================================== */
  /* Context Value */
  /* ======================================== */
  const value = useMemo<CategoryContextValue>(
    () => ({
      categories,
      loading,
      error,
      refresh: loadCategories,
      createCategory,
      updateCategory,
      deleteCategory,
      reorderCategories,
      getById,
      getByName,
    }),
    [categories, loading, error, loadCategories, createCategory, updateCategory, deleteCategory, reorderCategories, getById, getByName]
  );

  return <CategoryContext.Provider value={value}>{children}</CategoryContext.Provider>;
}

/* ======================================== */
/* Hook */
/* ======================================== */

/**
 * カテゴリ状態を取得するフック
 *
 * @returns カテゴリ状態とアクション
 * @throws Provider外で使用された場合にエラー
 */
export function useCategories(): CategoryContextValue {
  const context = useContext(CategoryContext);
  if (!context) {
    throw new Error('useCategories must be used within CategoryProvider');
  }
  return context;
}
