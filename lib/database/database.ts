import * as SQLite from 'expo-sqlite';
import { CREATE_TABLES, CREATE_INDEXES, DROP_TABLES, SCHEMA_VERSION } from './schema';

class Database {
  private db: SQLite.SQLiteDatabase | null = null;
  private isInitialized = false;

  async init(): Promise<void> {
    if (this.isInitialized) return;

    try {
      this.db = await SQLite.openDatabaseAsync('cliptap.db');
      await this.createTables();
      await this.createIndexes();
      this.isInitialized = true;
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Failed to initialize database:', error);
      throw error;
    }
  }

  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      // テーブルを作成順に実行（外部キー制約を考慮）
      await this.db.execAsync(CREATE_TABLES.categories);
      await this.db.execAsync(CREATE_TABLES.snippets);
      await this.db.execAsync(CREATE_TABLES.tags);
      await this.db.execAsync(CREATE_TABLES.snippetTags);
    } catch (error) {
      console.error('Failed to create tables:', error);
      throw error;
    }
  }

  private async createIndexes(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      for (const indexSQL of Object.values(CREATE_INDEXES)) {
        await this.db.execAsync(indexSQL);
      }
    } catch (error) {
      console.error('Failed to create indexes:', error);
      throw error;
    }
  }

  async dropAllTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      for (const dropSQL of Object.values(DROP_TABLES)) {
        await this.db.execAsync(dropSQL);
      }
      console.log('All tables dropped successfully');
    } catch (error) {
      console.error('Failed to drop tables:', error);
      throw error;
    }
  }

  async transaction<T>(callback: () => Promise<T>): Promise<T> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      await this.db.execAsync('BEGIN TRANSACTION;');
      const result = await callback();
      await this.db.execAsync('COMMIT;');
      return result;
    } catch (error) {
      await this.db.execAsync('ROLLBACK;');
      throw error;
    }
  }

  getDB(): SQLite.SQLiteDatabase {
    if (!this.db) throw new Error('Database not initialized');
    return this.db;
  }

  async reset(): Promise<void> {
    await this.dropAllTables();
    await this.createTables();
    await this.createIndexes();
    console.log('Database reset successfully');
  }
}

export const database = new Database();
