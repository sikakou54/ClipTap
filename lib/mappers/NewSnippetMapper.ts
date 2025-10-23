import { database } from '../database/database';
import { Snippet, CreateSnippetInput, UpdateSnippetInput, SnippetSortBy } from '../types/snippet';

class NewSnippetMapper {
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private getCurrentTimestamp(): string {
    return new Date().toISOString();
  }

  async getById(id: string): Promise<Snippet | null> {
    try {
      const db = database.getDB();
      const result = await db.getFirstAsync<any>(
        'SELECT * FROM snippets WHERE id = ?',
        [id]
      );
      if (!result) return null;
      return this.mapToSnippet(result);
    } catch (error) {
      console.error('Failed to get snippet by id:', error);
      throw error;
    }
  }

  async getAll(): Promise<Snippet[]> {
    try {
      const db = database.getDB();
      const results = await db.getAllAsync<any>(
        'SELECT * FROM snippets ORDER BY isPinned DESC, updatedAt DESC'
      );
      return results.map(row => this.mapToSnippet(row));
    } catch (error) {
      console.error('Failed to get all snippets:', error);
      throw error;
    }
  }

  async getByCategoryId(categoryId: string | null): Promise<Snippet[]> {
    try {
      const db = database.getDB();
      let results;
      if (categoryId === null) {
        results = await db.getAllAsync<any>(
          'SELECT * FROM snippets WHERE categoryId IS NULL ORDER BY isPinned DESC, updatedAt DESC'
        );
      } else {
        results = await db.getAllAsync<any>(
          'SELECT * FROM snippets WHERE categoryId = ? ORDER BY isPinned DESC, updatedAt DESC',
          [categoryId]
        );
      }
      return results.map(row => this.mapToSnippet(row));
    } catch (error) {
      console.error('Failed to get snippets by category:', error);
      throw error;
    }
  }

  async create(input: CreateSnippetInput): Promise<Snippet> {
    const id = this.generateId();
    const now = this.getCurrentTimestamp();

    try {
      const db = database.getDB();
      await db.runAsync(
        `INSERT INTO snippets (id, title, content, categoryId, isPinned, usageCount, lastUsedAt, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, 0, 0, NULL, ?, ?)`,
        [id, input.title || null, input.content, input.categoryId || null, now, now]
      );

      const snippet = await this.getById(id);
      if (!snippet) throw new Error('Failed to create snippet');
      return snippet;
    } catch (error) {
      console.error('Failed to create snippet:', error);
      throw error;
    }
  }

  async update(input: UpdateSnippetInput): Promise<Snippet> {
    const existing = await this.getById(input.id);
    if (!existing) throw new Error('Snippet not found');

    const updates: string[] = ['updatedAt = ?'];
    const params: any[] = [this.getCurrentTimestamp()];

    if (input.title !== undefined) {
      updates.push('title = ?');
      params.push(input.title);
    }
    if (input.content !== undefined) {
      updates.push('content = ?');
      params.push(input.content);
    }
    if (input.categoryId !== undefined) {
      updates.push('categoryId = ?');
      params.push(input.categoryId);
    }
    if (input.isPinned !== undefined) {
      updates.push('isPinned = ?');
      params.push(input.isPinned ? 1 : 0);
    }

    params.push(input.id);

    try {
      const db = database.getDB();
      await db.runAsync(
        `UPDATE snippets SET ${updates.join(', ')} WHERE id = ?`,
        params
      );

      const updated = await this.getById(input.id);
      if (!updated) throw new Error('Failed to update snippet');
      return updated;
    } catch (error) {
      console.error('Failed to update snippet:', error);
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const db = database.getDB();
      await db.runAsync('DELETE FROM snippet_tags WHERE snippetId = ?', [id]);
      await db.runAsync('DELETE FROM snippets WHERE id = ?', [id]);
    } catch (error) {
      console.error('Failed to delete snippet:', error);
      throw error;
    }
  }

  async incrementUsageCount(id: string): Promise<void> {
    const now = this.getCurrentTimestamp();
    try {
      const db = database.getDB();
      await db.runAsync(
        'UPDATE snippets SET usageCount = usageCount + 1, lastUsedAt = ? WHERE id = ?',
        [now, id]
      );
    } catch (error) {
      console.error('Failed to increment usage count:', error);
      throw error;
    }
  }

  async search(query: string, categoryId?: string): Promise<Snippet[]> {
    try {
      const db = database.getDB();
      const searchPattern = `%${query}%`;
      let sql = `
        SELECT DISTINCT s.* FROM snippets s
        WHERE (s.title LIKE ? OR s.content LIKE ?)
      `;
      const params: any[] = [searchPattern, searchPattern];

      if (categoryId) {
        sql += ' AND s.categoryId = ?';
        params.push(categoryId);
      }

      sql += ' ORDER BY s.isPinned DESC, s.usageCount DESC';

      const results = await db.getAllAsync<any>(sql, params);
      return results.map(row => this.mapToSnippet(row));
    } catch (error) {
      console.error('Failed to search snippets:', error);
      throw error;
    }
  }

  async getSorted(sortBy: SnippetSortBy): Promise<Snippet[]> {
    let orderClause = '';
    switch (sortBy) {
      case 'pinned':
        orderClause = 'ORDER BY isPinned DESC, updatedAt DESC';
        break;
      case 'recent':
        orderClause = 'ORDER BY updatedAt DESC';
        break;
      case 'usage':
        orderClause = 'ORDER BY usageCount DESC, updatedAt DESC';
        break;
      case 'title':
        orderClause = 'ORDER BY title ASC NULLS LAST';
        break;
      default:
        orderClause = 'ORDER BY isPinned DESC, updatedAt DESC';
    }

    try {
      const db = database.getDB();
      const results = await db.getAllAsync<any>(
        `SELECT * FROM snippets ${orderClause}`
      );
      return results.map(row => this.mapToSnippet(row));
    } catch (error) {
      console.error('Failed to get sorted snippets:', error);
      throw error;
    }
  }

  async bulkCreate(snippets: CreateSnippetInput[]): Promise<void> {
    try {
      for (const snippet of snippets) {
        await this.create(snippet);
      }
    } catch (error) {
      console.error('Failed to bulk create snippets:', error);
      throw error;
    }
  }

  private mapToSnippet(row: any): Snippet {
    return {
      id: row.id,
      title: row.title,
      content: row.content,
      categoryId: row.categoryId,
      isPinned: row.isPinned === 1,
      usageCount: row.usageCount,
      lastUsedAt: row.lastUsedAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}

export const snippetMapper = new NewSnippetMapper();
