import { useState, useEffect, useCallback } from 'react';
import { categoryService } from '../services/CategoryService';
import { Category, CreateCategoryInput, UpdateCategoryInput } from '../types/category';
import { Logger } from '../logger';

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await categoryService.getAll();
      setCategories(data);
    } catch (err) {
      setError(err as Error);
      Logger.error('Failed to load categories:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const createCategory = useCallback(async (input: CreateCategoryInput) => {
    try {
      const newCategory = await categoryService.create(input);
      await loadCategories();
      return newCategory;
    } catch (err) {
      Logger.error('Failed to create category:', err);
      throw err;
    }
  }, [loadCategories]);

  const updateCategory = useCallback(async (id: string, data: Partial<Omit<Category, 'id' | 'createdAt'>>) => {
    try {
      const updated = await categoryService.update(id, data);
      await loadCategories();
      return updated;
    } catch (err) {
      Logger.error('Failed to update category:', err);
      throw err;
    }
  }, [loadCategories]);

  const deleteCategory = useCallback(async (id: string) => {
    try {
      await categoryService.delete(id);
      await loadCategories();
    } catch (err) {
      Logger.error('Failed to delete category:', err);
      throw err;
    }
  }, [loadCategories]);

  const reorderCategories = useCallback(async (categoryIds: string[]) => {
    try {
      await categoryService.reorder(categoryIds);
      await loadCategories();
    } catch (err) {
      Logger.error('Failed to reorder categories:', err);
      throw err;
    }
  }, [loadCategories]);

  return {
    categories,
    loading,
    error,
    refresh: loadCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    reorderCategories,
  };
}
