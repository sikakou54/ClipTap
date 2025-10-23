import { categoryMapper } from '../mappers/NewCategoryMapper';
import { Category, CreateCategoryInput, UpdateCategoryInput } from '../types/category';

export class CategoryService {
  async getAll(): Promise<Category[]> {
    return await categoryMapper.getAll();
  }

  async getById(id: string): Promise<Category | null> {
    return await categoryMapper.getById(id);
  }

  async create(input: CreateCategoryInput): Promise<Category> {
    // 同じ名前のカテゴリが存在しないかチェック
    const existing = await categoryMapper.getByName(input.name);
    if (existing) {
      throw new Error('Category with this name already exists');
    }

    return await categoryMapper.create(input);
  }

  async update(id: string, data: Partial<Omit<Category, 'id' | 'createdAt'>>): Promise<Category> {
    // 名前変更の場合、同じ名前のカテゴリが存在しないかチェック
    if (data.name) {
      const existing = await categoryMapper.getByName(data.name);
      if (existing && existing.id !== id) {
        throw new Error('Category with this name already exists');
      }
    }

    return await categoryMapper.update({ id, ...data });
  }

  async delete(id: string): Promise<void> {
    await categoryMapper.delete(id);
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
