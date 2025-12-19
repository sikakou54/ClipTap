import { database } from '../database/database';
import { Snippet, CreateSnippetInput, UpdateSnippetInput, SnippetSortBy } from '../types/snippet';
import { VariableParser } from '../services/VariableParser';
import { generateUniqueId, getCurrentTimestamp } from '../utils/dateHelpers';
import { Logger } from '../logger';

class SnippetMapper {

  async getById(id: string): Promise<Snippet | null> {
    try {
      const db = database.getDB();
      const result = await db.getFirstAsync<any>(
        'SELECT * FROM snippets WHERE id = ?',
        [id]
      );
      if (!result) return null;

      // snippet_profilesテーブルから環境IDを取得
      const profileIds = await this.getProfileIds(id);

      return this.mapToSnippet(result, profileIds);
    } catch (error) {
      Logger.error('Failed to get snippet by id:', error);
      throw error;
    }
  }

  private async getProfileIds(snippetId: string): Promise<string[]> {
    try {
      const db = database.getDB();
      const results = await db.getAllAsync<{ profileId: string }>(
        'SELECT profileId FROM snippet_profiles WHERE snippetId = ?',
        [snippetId]
      );
      return results.map(row => row.profileId);
    } catch (error) {
      Logger.error('Failed to get profile IDs:', error);
      return [];
    }
  }

  async getAll(filterByProfileId?: string | null): Promise<Snippet[]> {
    try {
      const db = database.getDB();
      let sql = 'SELECT * FROM snippets';
      let params: any[] = [];

      // 環境フィルタが指定されている場合
      if (filterByProfileId) {
        sql = `
          SELECT DISTINCT s.* FROM snippets s
          WHERE s.id NOT IN (SELECT snippetId FROM snippet_profiles)
             OR s.id IN (SELECT snippetId FROM snippet_profiles WHERE profileId = ?)
          ORDER BY s.createdAt ASC
        `;
        params = [filterByProfileId];
      } else {
        sql += ' ORDER BY createdAt ASC';
      }

      const results = await db.getAllAsync<any>(sql, params);
      return Promise.all(results.map(async row => {
        const profileIds = await this.getProfileIds(row.id);
        return this.mapToSnippet(row, profileIds);
      }));
    } catch (error) {
      Logger.error('Failed to get all snippets:', error);
      throw error;
    }
  }

  async getByCategoryId(categoryId: string | null, filterByProfileId?: string | null): Promise<Snippet[]> {
    try {
      const db = database.getDB();
      let sql: string;
      let params: any[] = [];

      // 環境フィルタが指定されている場合
      if (filterByProfileId) {
        if (categoryId === null) {
          sql = `
            SELECT DISTINCT s.* FROM snippets s
            WHERE s.categoryId IS NULL
              AND (s.id NOT IN (SELECT snippetId FROM snippet_profiles)
                   OR s.id IN (SELECT snippetId FROM snippet_profiles WHERE profileId = ?))
            ORDER BY s.createdAt ASC
          `;
          params = [filterByProfileId];
        } else {
          sql = `
            SELECT DISTINCT s.* FROM snippets s
            WHERE s.categoryId = ?
              AND (s.id NOT IN (SELECT snippetId FROM snippet_profiles)
                   OR s.id IN (SELECT snippetId FROM snippet_profiles WHERE profileId = ?))
            ORDER BY s.createdAt ASC
          `;
          params = [categoryId, filterByProfileId];
        }
      } else {
        if (categoryId === null) {
          sql = 'SELECT * FROM snippets WHERE categoryId IS NULL ORDER BY createdAt ASC';
        } else {
          sql = 'SELECT * FROM snippets WHERE categoryId = ? ORDER BY createdAt ASC';
          params = [categoryId];
        }
      }

      const results = await db.getAllAsync<any>(sql, params);
      return Promise.all(results.map(async row => {
        const profileIds = await this.getProfileIds(row.id);
        return this.mapToSnippet(row, profileIds);
      }));
    } catch (error) {
      Logger.error('Failed to get snippets by category:', error);
      throw error;
    }
  }

  async create(input: CreateSnippetInput): Promise<Snippet> {
    const id = generateUniqueId();
    const now = getCurrentTimestamp();

    try {
      const db = database.getDB();
      await db.runAsync(
        `INSERT INTO snippets (id, title, content, categoryId, copyWithTitle, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [id, input.title || null, input.content, input.categoryId || null, input.copyWithTitle ? 1 : 0, now, now]
      );

      // snippet_profilesテーブルに環境を登録
      if (input.profileIds && input.profileIds.length > 0) {
        for (const profileId of input.profileIds) {
          await db.runAsync(
            'INSERT INTO snippet_profiles (snippetId, profileId) VALUES (?, ?)',
            [id, profileId]
          );
        }
      }

      const snippet = await this.getById(id);
      if (!snippet) throw new Error('Failed to create snippet');
      return snippet;
    } catch (error) {
      Logger.error('Failed to create snippet:', error);
      throw error;
    }
  }

  async update(input: UpdateSnippetInput): Promise<Snippet> {
    const existing = await this.getById(input.id);
    if (!existing) throw new Error('Snippet not found');

    const updates: string[] = ['updatedAt = ?'];
    const params: any[] = [getCurrentTimestamp()];

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
    if (input.copyWithTitle !== undefined) {
      updates.push('copyWithTitle = ?');
      params.push(input.copyWithTitle ? 1 : 0);
    }

    params.push(input.id);

    try {
      const db = database.getDB();
      await db.runAsync(
        `UPDATE snippets SET ${updates.join(', ')} WHERE id = ?`,
        params
      );

      // profileIdsが指定されている場合、snippet_profilesテーブルを更新
      if (input.profileIds !== undefined) {
        // 既存の関連を削除
        await db.runAsync('DELETE FROM snippet_profiles WHERE snippetId = ?', [input.id]);

        // 新しい関連を追加
        if (input.profileIds.length > 0) {
          for (const profileId of input.profileIds) {
            await db.runAsync(
              'INSERT INTO snippet_profiles (snippetId, profileId) VALUES (?, ?)',
              [input.id, profileId]
            );
          }
        }
      }

      const updated = await this.getById(input.id);
      if (!updated) throw new Error('Failed to update snippet');
      return updated;
    } catch (error) {
      Logger.error('Failed to update snippet:', error);
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const db = database.getDB();
      await db.runAsync('DELETE FROM snippets WHERE id = ?', [id]);
    } catch (error) {
      Logger.error('Failed to delete snippet:', error);
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

      sql += ' ORDER BY s.createdAt ASC';

      const results = await db.getAllAsync<any>(sql, params);
      return Promise.all(results.map(async row => {
        const profileIds = await this.getProfileIds(row.id);
        return this.mapToSnippet(row, profileIds);
      }));
    } catch (error) {
      Logger.error('Failed to search snippets:', error);
      throw error;
    }
  }

  async getSorted(sortBy: SnippetSortBy): Promise<Snippet[]> {
    let orderClause = '';
    switch (sortBy) {
      case 'recent':
        orderClause = 'ORDER BY updatedAt DESC';
        break;
      case 'title':
        orderClause = 'ORDER BY title ASC NULLS LAST';
        break;
      default:
        orderClause = 'ORDER BY updatedAt DESC';
    }

    try {
      const db = database.getDB();
      const results = await db.getAllAsync<any>(
        `SELECT * FROM snippets ${orderClause}`
      );
      return Promise.all(results.map(async row => {
        const profileIds = await this.getProfileIds(row.id);
        return this.mapToSnippet(row, profileIds);
      }));
    } catch (error) {
      Logger.error('Failed to get sorted snippets:', error);
      throw error;
    }
  }

  async bulkCreate(snippets: CreateSnippetInput[]): Promise<void> {
    try {
      for (const snippet of snippets) {
        await this.create(snippet);
      }
    } catch (error) {
      Logger.error('Failed to bulk create snippets:', error);
      throw error;
    }
  }

  private mapToSnippet(row: any, profileIds: string[] = []): Snippet {
    return {
      id: row.id,
      title: row.title,
      content: row.content,
      categoryId: row.categoryId,
      profileIds: profileIds,  // 複数の環境ID
      copyWithTitle: row.copyWithTitle === 1,  // SQLiteのINTEGERをbooleanに変換
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}

export const snippetMapper = new SnippetMapper();
