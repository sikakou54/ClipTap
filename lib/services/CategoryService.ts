import { categoryMapper } from '../mappers/CategoryMapper';
import { Category, CreateCategoryInput, UpdateCategoryInput } from '../types/category';
import i18next from 'i18next';

export class CategoryService {
  async getAll(): Promise<Category[]> {
    return categoryMapper.getAll();
  }

  async getById(id: string): Promise<Category | null> {
    return categoryMapper.getById(id);
  }

  async create(input: CreateCategoryInput): Promise<Category> {
    // 名前をトリムして検証
    const trimmedName = input.name.trim();
    if (!trimmedName) {
      throw new Error(i18next.t('error.empty_content'));
    }

    // 同じ名前のカテゴリが存在しないかチェック
    const existing = await categoryMapper.getByName(trimmedName);
    if (existing) {
      throw new Error(i18next.t('error.duplicate_category_name'));
    }

    return categoryMapper.create({ ...input, name: trimmedName });
  }

  async update(id: string, data: Partial<Omit<Category, 'id' | 'createdAt'>>): Promise<Category> {
    // 名前変更の場合、トリムと重複チェック
    if (data.name) {
      const trimmedName = data.name.trim();
      if (!trimmedName) {
        throw new Error(i18next.t('error.empty_content'));
      }

      const existing = await categoryMapper.getByName(trimmedName);
      if (existing && existing.id !== id) {
        throw new Error(i18next.t('error.duplicate_category_name'));
      }

      data = { ...data, name: trimmedName };
    }

    return categoryMapper.update({ id, ...data });
  }

  async delete(id: string): Promise<void> {
    return categoryMapper.delete(id);
  }

  async reorder(categoryIds: string[]): Promise<void> {
    // カテゴリの並び順を更新
    for (let i = 0; i < categoryIds.length; i++) {
      await categoryMapper.update({
        id: categoryIds[i],
        sortOrder: i,
      });
    }
  }
}

export const categoryService = new CategoryService();
