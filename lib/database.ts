/**
 * SQLiteデータベース管理
 * expo-sqliteを使用したデータベース操作
 */

import * as SQLite from 'expo-sqlite';
import { Logger } from './logger';

class Database {
  private db: SQLite.SQLiteDatabase | null = null;

  /**
   * データベース初期化
   */
  async initialize(dbName: string = 'app.db'): Promise<void> {
    try {
      this.db = await SQLite.openDatabaseAsync(dbName);
      Logger.info('🗿 Database initialized');

      // 初期テーブル作成
      await this.createTables();
    } catch (error) {
      Logger.error('Database initialization error:', error);
      throw error;
    }
  }

  /**
   * テーブル作成
   */
  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    // サンプルテーブル
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS samples (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      );
    `);

    Logger.debug('🗿 Tables created');
  }

  /**
   * クエリ実行（単一レコード取得）
   */
  getFirstSync<T = any>(query: string, params: any[] = []): T | null {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const result = this.db.getFirstSync<T>(query, params);
      return result ?? null;
    } catch (error) {
      Logger.error('getFirstSync error:', error);
      throw error;
    }
  }

  /**
   * クエリ実行（複数レコード取得）
   */
  getAllSync<T = any>(query: string, params: any[] = []): T[] {
    if (!this.db) throw new Error('Database not initialized');

    try {
      return this.db.getAllSync<T>(query, params);
    } catch (error) {
      Logger.error('getAllSync error:', error);
      throw error;
    }
  }

  /**
   * クエリ実行（INSERT/UPDATE/DELETE）
   */
  runSync(query: string, params: any[] = []): void {
    if (!this.db) throw new Error('Database not initialized');

    try {
      this.db.runSync(query, params);
    } catch (error) {
      Logger.error('runSync error:', error);
      throw error;
    }
  }

  /**
   * トランザクション実行
   */
  async transaction(callback: () => void): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      await this.db.withTransactionAsync(async () => {
        callback();
      });
    } catch (error) {
      Logger.error('Transaction error:', error);
      throw error;
    }
  }
}

export const database = new Database();
