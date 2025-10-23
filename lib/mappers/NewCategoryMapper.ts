import { database } from '../database/database';
import { Category, CreateCategoryInput, UpdateCategoryInput } from '../types/category';

class NewCategoryMapper {
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private getCurrentTimestamp(): string {
    return new Date().toISOString();
  }

  async getById(id: string): Promise<Category | null> {
    try {
      const db = database.getDB();
      const result = await db.getFirstAsync<Category>(
        'SELECT * FROM categories WHERE id = ?',
        [id]
      );
      return result || null;
    } catch (error) {
      console.error('Failed to get category by id:', error);
      throw error;
    }
  }

  async getAll(): Promise<Category[]> {
    try {
      const db = database.getDB();
      const results = await db.getAllAsync<Category>(
        'SELECT * FROM categories ORDER BY sortOrder ASC, name ASC'
      );
      return results;
    } catch (error) {
      console.error('Failed to get all categories:', error);
      throw error;
    }
  }

  async create(input: CreateCategoryInput): Promise<Category> {
    const id = this.generateId();
    const createdAt = this.getCurrentTimestamp();
    const sortOrder = await this.getNextSortOrder();

    try {
      const db = database.getDB();
      await db.runAsync(
        `INSERT INTO categories (id, name, color, icon, sortOrder, createdAt)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [id, input.name, input.color || null, input.icon || null, sortOrder, createdAt]
      );

      const category = await this.getById(id);
      if (!category) throw new Error('Failed to create category');
      return category;
    } catch (error) {
      console.error('Failed to create category:', error);
      throw error;
    }
  }

  async update(input: UpdateCategoryInput): Promise<Category> {
    const existing = await this.getById(input.id);
    if (!existing) throw new Error('Category not found');

    const updates: string[] = [];
    const params: any[] = [];

    if (input.name !== undefined) {
      updates.push('name = ?');
      params.push(input.name);
    }
    if (input.color !== undefined) {
      updates.push('color = ?');
      params.push(input.color);
    }
    if (input.icon !== undefined) {
      updates.push('icon = ?');
      params.push(input.icon);
    }
    if (input.sortOrder !== undefined) {
      updates.push('sortOrder = ?');
      params.push(input.sortOrder);
    }

    if (updates.length === 0) return existing;

    params.push(input.id);

    try {
      const db = database.getDB();
      await db.runAsync(
        `UPDATE categories SET ${updates.join(', ')} WHERE id = ?`,
        params
      );

      const updated = await this.getById(input.id);
      if (!updated) throw new Error('Failed to update category');
      return updated;
    } catch (error) {
      console.error('Failed to update category:', error);
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const db = database.getDB();
      // カテゴリに紐づく定型文のcategoryIdをNULLに設定
      await db.runAsync('UPDATE snippets SET categoryId = NULL WHERE categoryId = ?', [id]);
      await db.runAsync('DELETE FROM categories WHERE id = ?', [id]);
    } catch (error) {
      console.error('Failed to delete category:', error);
      throw error;
    }
  }

  async getByName(name: string): Promise<Category | null> {
    try {
      const db = database.getDB();
      const result = await db.getFirstAsync<Category>(
        'SELECT * FROM categories WHERE name = ?',
        [name]
      );
      return result || null;
    } catch (error) {
      console.error('Failed to get category by name:', error);
      throw error;
    }
  }

  async bulkCreate(categories: CreateCategoryInput[]): Promise<void> {
    try {
      for (const category of categories) {
        await this.create(category);
      }
    } catch (error) {
      console.error('Failed to bulk create categories:', error);
      throw error;
    }
  }

  private async getNextSortOrder(): Promise<number> {
    try {
      const db = database.getDB();
      const result = await db.getFirstAsync<{ maxOrder: number }>(
        'SELECT MAX(sortOrder) as maxOrder FROM categories'
      );
      return (result?.maxOrder || 0) + 1;
    } catch (error) {
      console.error('Failed to get next sort order:', error);
      return 0;
    }
  }
}

export const categoryMapper = new NewCategoryMapper();
