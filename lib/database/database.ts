/**
 * Database - SQLiteデータベース管理クラス
 *
 * ClipTapアプリのデータベース操作を一元管理します。
 * 主な機能:
 * - データベースの初期化・接続管理
 * - スキーマのバージョン管理
 * - マイグレーション実行
 * - トランザクション管理
 * - テーブル作成・削除
 *
 * 使用方法:
 * ```typescript
 * import { database } from './database';
 * await database.init(); // 初期化（アプリ起動時に1回のみ）
 * const db = database.getDB(); // SQLiteインスタンス取得
 * ```
 */

import * as SQLite from 'expo-sqlite';
import * as FileSystem from 'expo-file-system';
import { CREATE_TABLES, CREATE_INDEXES, DROP_TABLES, SCHEMA_VERSION } from './schema';
import { Logger } from '../logger';
import { generateUniqueId, getCurrentTimestamp } from '../utils/dateHelpers';

class Database {
  /** SQLiteデータベースインスタンス */
  private db: SQLite.SQLiteDatabase | null = null;

  /** 初期化済みフラグ（重複初期化を防ぐ） */
  private isInitialized = false;

  /**
   * データベースの初期化
   *
   * アプリ起動時に1回だけ呼び出す必要があります。
   * 新規データベースの場合はテーブル作成、既存データベースの場合はマイグレーションを実行します。
   *
   * @throws {Error} データベース初期化に失敗した場合
   */
  async init(): Promise<void> {
    if (this.isInitialized) return;

    try {
      this.db = await SQLite.openDatabaseAsync('cliptap.db');

      // データベース状態を判定
      const dbState = await this.detectDatabaseState();
      Logger.info(`[Database State] ${dbState}`);

      // 状態に応じて処理を分岐
      if (dbState === 'first_install') {
        // 初回インストール：テーブルを作成
        Logger.info('[Init] First install detected, creating tables...');
        await this.createTables();
        await this.createIndexes();
        await this.createDefaultProfileIfNeeded();
        await this.setVersion(SCHEMA_VERSION);
        Logger.success(`[Init] Database initialized with version ${SCHEMA_VERSION}`);
      } else if (dbState === 'needs_migration') {
        // マイグレーション必要：V1→V2マイグレーションを実行
        Logger.info('[Init] Migration needed, running V1→V2 migration...');
        await this.runMigrations();
        Logger.success('[Init] Migration completed');
      } else {
        // マイグレーション不要：バージョンチェックのみ
        Logger.info('[Init] Database is up-to-date, no migration needed');
      }

      this.isInitialized = true;
      Logger.success('Database initialized successfully');
    } catch (error) {
      Logger.error('Failed to initialize database:', error);
      throw error;
    }
  }

  /**
   * データベースの状態を判定
   *
   * @returns 'first_install' | 'needs_migration' | 'up_to_date'
   */
  private async detectDatabaseState(): Promise<'first_install' | 'needs_migration' | 'up_to_date'> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      // 1. snippetsテーブルが存在するか確認
      const tableExists = await this.tableExists('snippets');

      if (!tableExists) {
        // snippetsテーブルがない → 初回インストール
        Logger.info('[Detect] snippets table does not exist → first_install');
        return 'first_install';
      }

      // 2. snippetsテーブルにisPinnedカラムが存在するか確認
      const columns = await this.db.getAllAsync<{ name: string }>(
        `PRAGMA table_info('snippets')`
      );
      const columnNames = columns.map(c => c.name);
      const hasIsPinned = columnNames.includes('isPinned');

      if (hasIsPinned) {
        // isPinnedカラムが存在する → V1スキーマ、マイグレーション必要
        Logger.info('[Detect] snippets table has isPinned column → needs_migration');
        Logger.info(`[Detect] Current columns: ${columnNames.join(', ')}`);
        return 'needs_migration';
      } else {
        // isPinnedカラムが存在しない → V2スキーマ、マイグレーション不要
        Logger.info('[Detect] snippets table does not have isPinned column → up_to_date');
        return 'up_to_date';
      }
    } catch (error) {
      Logger.error('Failed to detect database state:', error);
      // エラー時は安全のためマイグレーション不要として扱う
      return 'up_to_date';
    }
  }

  /**
   * データベースが新規作成されたかどうかを返す
   *
   * @returns {boolean} 新規作成の場合true、既存DBの場合false
   */
  isNewDatabase(): boolean {
    try {
      const version = this.db?.getFirstSync<{ user_version: number }>('PRAGMA user_version');
      return version?.user_version === 0;
    } catch {
      return false;
    }
  }

  /**
   * 現在のデータベースバージョンを取得
   *
   * SQLiteのPRAGMA user_versionを使用してバージョン管理を行います。
   *
   * @returns {Promise<number>} 現在のバージョン番号（新規の場合は0）
   */
  private async getCurrentVersion(): Promise<number> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      // user_versionテーブルから現在のバージョンを取得
      const result = await this.db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
      return result?.user_version || 0;
    } catch (error) {
      Logger.error('Failed to get current version:', error);
      return 0;
    }
  }

  /**
   * 現在のデータベースバージョンを取得（public）
   *
   * 開発者メニューで使用
   */
  async getVersion(): Promise<number> {
    return await this.getCurrentVersion();
  }

  /**
   * データベースバージョンを設定
   *
   * @param {number} version - 設定するバージョン番号
   */
  private async setVersion(version: number): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    await this.db.execAsync(`PRAGMA user_version = ${version}`);
  }

  /**
   * データベースバージョンを手動で変更（開発者メニュー用）
   *
   * 注意: 危険な操作です。マイグレーションのテストにのみ使用してください。
   *
   * @param {number} version - 設定するバージョン番号
   */
  async setVersionManually(version: number): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    Logger.warn(`[Dev] Manually changing database version to ${version}`);
    await this.db.execAsync(`PRAGMA user_version = ${version}`);
    Logger.success(`[Dev] Database version changed to ${version}`);
  }

  /**
   * マイグレーション実行
   *
   * Version 1 → Version 2 の変更内容:
   * 【削除】
   * - categories.icon
   * - snippets.isPinned, usageCount, lastUsedAt, hasVariables
   * - tags, snippet_tags テーブル全体
   *
   * 【追加】
   * - variables テーブル（変数メタデータ）
   * - profiles テーブル（環境プロファイル）
   * - profile_variables テーブル（プロファイル別変数値）
   * - snippet_profiles テーブル（スニペット・プロファイル関連）
   * - snippets.profileId カラム（後で snippet_profiles に移行して削除）
   *
   * 冪等性: すべての操作は複数回実行しても安全
   */
  private async runMigrations(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const currentVersion = await this.getCurrentVersion();
    Logger.info(`Current database version: ${currentVersion}, Target version: ${SCHEMA_VERSION}`);

    // Version 1 → 2: 一括マイグレーション
    if (currentVersion < 2) {
      Logger.info('Running migration: Version 1 → 2');
      await this.migrateFromV1ToV2();
    }

    // バージョンを更新
    if (currentVersion < SCHEMA_VERSION) {
      await this.setVersion(SCHEMA_VERSION);
      Logger.info(`Database migrated to version ${SCHEMA_VERSION}`);
    }
  }

  /**
   * Version 1 → Version 2 マイグレーション
   *
   * V1スキーマ（初期バージョン）:
   * - categories: id, name, color, icon, sortOrder, createdAt
   * - snippets: id, title, content, categoryId, isPinned, usageCount, lastUsedAt, createdAt, updatedAt
   * - tags: id, name
   * - snippet_tags: snippetId, tagId
   *
   * V2スキーマ（現行バージョン）:
   * - categories: id, name, color, sortOrder, createdAt  ← icon削除
   * - snippets: id, title, content, categoryId, profileId, createdAt, updatedAt  ← isPinned, usageCount, lastUsedAt削除
   * - variables: 新規追加（カスタム変数定義）
   * - profiles: 新規追加（環境プロファイル）
   * - profile_variables: 新規追加（プロファイル別変数値）
   * - snippet_profiles: 新規追加（スニペット・プロファイル多対多関連）
   * - tags, snippet_tags: 削除
   *
   * 実行順序:
   * 1. 不要テーブル削除（tags, snippet_tags）
   * 2. categoriesテーブル整理（icon削除）
   * 3. snippetsテーブル整理（isPinned, usageCount, lastUsedAt削除、profileId追加）
   * 4. 新規テーブル作成（variables, profiles, profile_variables, snippet_profiles）
   * 5. デフォルトプロファイル作成
   * 6. 既存スニペットをデフォルトプロファイルに紐付け
   *
   * 冪等性: すべての操作は複数回実行しても安全
   */
  private async migrateFromV1ToV2(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    Logger.info('[Migration V1→V2] Starting migration...');

    // ステップ1: 不要テーブル削除（tags, snippet_tags）
    await this.dropTagsTables();

    // ステップ2: categoriesテーブル整理（icon削除）
    await this.cleanupCategories();

    // ステップ3: snippetsテーブル整理
    await this.migrateSnippetsTable();

    // ステップ4: 新規テーブル作成
    await this.createNewTablesForV2();

    // ステップ5: デフォルトプロファイル作成
    await this.createDefaultProfileIfNeeded();

    Logger.success('[Migration V1→V2] Migration completed successfully');
  }

  /**
   * snippetsテーブルのマイグレーション（V1→V2）
   *
   * 削除するカラム: isPinned, usageCount, lastUsedAt, profileId
   * 注意: profileIdはsnippet_profilesテーブルで多対多管理するため不要
   */
  private async migrateSnippetsTable(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    Logger.info('[Migration V1→V2] Migrating snippets table...');

    try {
      // 現在のカラム構成を取得
      const columns = await this.db.getAllAsync<{ name: string }>(
        `SELECT name FROM pragma_table_info('snippets')`
      );
      const columnNames = columns.map(c => c.name);

      // V1の不要カラムが存在するかチェック
      const columnsToRemove = ['isPinned', 'usageCount', 'lastUsedAt', 'profileId'];
      const hasV1Columns = columnsToRemove.some(col => columnNames.includes(col));

      if (hasV1Columns) {
        Logger.info('Removing V1 columns from snippets table...');

        // V1のインデックスを削除（カラム削除前に必要）
        const v1Indexes = ['idx_snippets_pinned', 'idx_snippets_usage'];
        for (const indexName of v1Indexes) {
          try {
            await this.db.execAsync(`DROP INDEX IF EXISTS ${indexName};`);
            Logger.info(`Dropped index: ${indexName}`);
          } catch (error) {
            Logger.warn(`Failed to drop index ${indexName}:`, error);
          }
        }

        // 不要なカラムを削除
        for (const columnName of columnsToRemove) {
          if (columnNames.includes(columnName)) {
            try {
              await this.db.execAsync(`ALTER TABLE snippets DROP COLUMN ${columnName};`);
              Logger.info(`Dropped column: ${columnName}`);
            } catch (error) {
              Logger.warn(`Failed to drop column ${columnName}, it may not exist:`, error);
            }
          }
        }

        Logger.success('snippets table migrated to V2 schema');
      } else {
        Logger.info('snippets table already has V2 schema');
      }

      // インデックスを作成（存在しない場合のみ）
      await this.db.execAsync(`
        CREATE INDEX IF NOT EXISTS idx_snippets_category ON snippets(categoryId);
      `);
      await this.db.execAsync(`
        CREATE INDEX IF NOT EXISTS idx_snippets_updated ON snippets(updatedAt DESC);
      `);
    } catch (error) {
      Logger.error('Failed to migrate snippets table:', error);
      throw error;
    }
  }

  /**
   * V2で追加される新規テーブルを作成
   * - variables（カスタム変数定義）
   * - profiles（環境プロファイル）
   * - profile_variables（プロファイル別変数値）
   */
  private async createNewTablesForV2(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    Logger.info('[Migration V1→V2] Creating new tables...');

    // variablesテーブル
    const variablesExists = await this.tableExists('variables');
    if (!variablesExists) {
      await this.db.execAsync(CREATE_TABLES.variables);
      Logger.info('Created variables table');
    } else {
      Logger.info('Variables table already exists');
    }

    // profilesテーブル
    const profilesExists = await this.tableExists('profiles');
    if (!profilesExists) {
      await this.db.execAsync(CREATE_TABLES.profiles);
      Logger.info('Created profiles table');

      // profile_variablesテーブル
      await this.db.execAsync(CREATE_TABLES.profileVariables);
      Logger.info('Created profile_variables table');

      // インデックス作成
      await this.db.execAsync(CREATE_INDEXES.profilesActive);
      await this.db.execAsync(CREATE_INDEXES.profileVariablesProfile);
      Logger.info('Created profile indexes');
    } else {
      Logger.info('Profiles table already exists');

      // 既存profilesテーブルにisDefaultカラムがない場合は追加
      const columns = await this.db.getAllAsync<{ name: string }>(
        `SELECT name FROM pragma_table_info('profiles')`
      );
      const hasIsDefault = columns.some(c => c.name === 'isDefault');

      if (!hasIsDefault) {
        await this.db.execAsync(`
          ALTER TABLE profiles ADD COLUMN isDefault INTEGER DEFAULT 0;
        `);
        Logger.info('Added isDefault column to profiles table');

        // 最初のプロファイルをデフォルトに設定
        await this.db.execAsync(`
          UPDATE profiles
          SET isDefault = 1
          WHERE id = (SELECT id FROM profiles ORDER BY createdAt ASC LIMIT 1);
        `);
        Logger.info('Set first profile as default');
      }
    }

    try {
      // snippet_profiles テーブルを作成
      await this.db.execAsync(CREATE_TABLES.snippetProfiles);
      Logger.info('Created snippet_profiles table');

      // インデックスを作成
      await this.db.execAsync(CREATE_INDEXES.snippetProfilesSnippet);
      await this.db.execAsync(CREATE_INDEXES.snippetProfilesProfile);
      Logger.info('Created snippet_profiles indexes');

    } catch (error) {
      Logger.error('Failed to migrate snippet_profiles:', error);
      throw error;
    }

    Logger.success('New tables created successfully');
  }

  private async dropTagsTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      // snippet_tagsテーブルを先に削除（外部キー制約のため）
      const snippetTagsExists = await this.tableExists('snippet_tags');
      if (snippetTagsExists) {
        Logger.info('Dropping unused snippet_tags table...');
        await this.db.execAsync('DROP TABLE IF EXISTS snippet_tags;');
        Logger.success('snippet_tags table dropped');
      }

      // tagsテーブルを削除
      const tagsExists = await this.tableExists('tags');
      if (tagsExists) {
        Logger.info('Dropping unused tags table...');
        await this.db.execAsync('DROP TABLE IF EXISTS tags;');
        Logger.success('tags table dropped');
      }

      if (!snippetTagsExists && !tagsExists) {
        Logger.info('Tags tables do not exist, skipping');
      }
    } catch (error) {
      Logger.error('Failed to drop tags tables:', error);
      // エラーが発生しても処理を続行
    }
  }

  /**
   * デフォルトプロファイルを作成（存在しない場合のみ）
   */
  private async createDefaultProfileIfNeeded(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    Logger.info('[Migration] Checking for default profile...');

    try {
      // プロファイル数を確認
      const result = await this.db.getFirstAsync<{ count: number }>(
        'SELECT COUNT(*) as count FROM profiles'
      );
      const profileCount = result?.count || 0;

      if (profileCount === 0) {
        Logger.info('No profiles found, creating default profile...');

        const id = generateUniqueId();
        const now = getCurrentTimestamp();

        // デフォルトプロファイルを作成（直接SQL実行）
        await this.db.runAsync(
          `INSERT INTO profiles (id, name, isActive, isDefault, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [id, 'Main', 1, 1, now, now]
        );

        Logger.success(`Created default profile: ${id}`);
      } else {
        Logger.info(`Profiles already exist (count: ${profileCount})`);
      }
    } catch (error) {
      Logger.error('Failed to create default profile:', error);
      throw error;
    }
  }

  /**
   * snippet_profilesテーブル作成
   */
  private async migrateSnippetProfiles(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    Logger.info('[Migration] Creating snippet_profiles table...');

    try {
      // snippet_profiles テーブルを作成
      await this.db.execAsync(CREATE_TABLES.snippetProfiles);
      Logger.info('Created snippet_profiles table');

      // インデックスを作成
      await this.db.execAsync(CREATE_INDEXES.snippetProfilesSnippet);
      await this.db.execAsync(CREATE_INDEXES.snippetProfilesProfile);
      Logger.info('Created snippet_profiles indexes');

    } catch (error) {
      Logger.error('Failed to migrate snippet_profiles:', error);
      throw error;
    }
  }

  /**
   * categoriesテーブルの整理（V1→V2）
   *
   * V1の不要カラムを削除: icon
   */
  private async cleanupCategories(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    Logger.info('[Migration V1→V2] Cleaning up categories table...');

    try {
      // カラム情報を取得
      const columns = await this.db.getAllAsync<{ name: string }>(
        `SELECT name FROM pragma_table_info('categories')`
      );

      const columnNames = columns.map(c => c.name);
      const hasIconColumn = columnNames.includes('icon');

      if (hasIconColumn) {
        Logger.info('Removing icon column from categories...');

        // SQLiteはALTER TABLE DROP COLUMNをサポートしていないため、テーブルを再作成
        await this.db.execAsync(`
          CREATE TABLE categories_backup AS
          SELECT id, name, color, sortOrder, createdAt
          FROM categories;
        `);

        await this.db.execAsync('DROP TABLE categories;');

        await this.db.execAsync(`
          CREATE TABLE categories (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL UNIQUE,
            color TEXT,
            sortOrder INTEGER DEFAULT 0,
            createdAt TEXT NOT NULL
          );
        `);

        await this.db.execAsync(`
          INSERT INTO categories (id, name, color, sortOrder, createdAt)
          SELECT id, name, color, sortOrder, createdAt
          FROM categories_backup;
        `);

        await this.db.execAsync('DROP TABLE categories_backup;');

        Logger.success('icon column removed from categories');
      } else {
        Logger.info('categories table already has V2 schema');
      }
    } catch (error) {
      Logger.error('Failed to cleanup categories:', error);
      throw error;
    }
  }

  private async tableExists(tableName: string): Promise<boolean> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const result = await this.db.getFirstAsync<{ count: number }>(
        `SELECT COUNT(*) as count FROM sqlite_master WHERE type='table' AND name=?`,
        [tableName]
      );
      return (result?.count ?? 0) > 0;
    } catch (error) {
      Logger.error(`Failed to check if table ${tableName} exists:`, error);
      return false;
    }
  }

  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      // テーブルを作成順に実行（外部キー制約を考慮）
      await this.db.execAsync(CREATE_TABLES.categories);
      await this.db.execAsync(CREATE_TABLES.snippets);
      await this.db.execAsync(CREATE_TABLES.variables);
      await this.db.execAsync(CREATE_TABLES.profiles);
      await this.db.execAsync(CREATE_TABLES.profileVariables);
      await this.db.execAsync(CREATE_TABLES.snippetProfiles);
    } catch (error) {
      Logger.error('Failed to create tables:', error);
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
      Logger.error('Failed to create indexes:', error);
      throw error;
    }
  }

  async dropAllTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      for (const dropSQL of Object.values(DROP_TABLES)) {
        await this.db.execAsync(dropSQL);
      }
      Logger.info('All tables dropped successfully');
    } catch (error) {
      Logger.error('Failed to drop tables:', error);
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

  // 同期的にクエリを実行して最初の行を取得
  getFirstSync<T = any>(query: string, params: any[] = []): T | null {
    if (!this.db) throw new Error('Database not initialized');
    return this.db.getFirstSync<T>(query, params);
  }

  // 同期的にクエリを実行して全ての行を取得
  getAllSync<T = any>(query: string, params: any[] = []): T[] {
    if (!this.db) throw new Error('Database not initialized');
    return this.db.getAllSync<T>(query, params);
  }

  // 同期的にクエリを実行（INSERT, UPDATE, DELETE）
  runSync(query: string, params: any[] = []): SQLite.SQLiteRunResult {
    if (!this.db) throw new Error('Database not initialized');
    return this.db.runSync(query, params);
  }

  async reset(): Promise<void> {
    await this.dropAllTables();
    await this.createTables();
    await this.createIndexes();
    await this.createDefaultProfileIfNeeded();
    await this.setVersion(SCHEMA_VERSION);
    Logger.info(`Database reset successfully to version ${SCHEMA_VERSION}`);
  }

  /**
   * データベースファイルを完全に削除して再作成
   */
  async deleteAndRecreate(): Promise<void> {
    try {
      // データベース接続をクローズ
      if (this.db) {
        await this.db.closeAsync();
        this.db = null;
      }
      this.isInitialized = false;

      // データベースファイルのパスを取得
      const dbPath = `${FileSystem.documentDirectory}SQLite/cliptap.db`;

      // ファイルが存在する場合は削除
      const fileInfo = await FileSystem.getInfoAsync(dbPath);
      if (fileInfo.exists) {
        await FileSystem.deleteAsync(dbPath);
        Logger.info('Database file deleted');
      }

      // WALファイルとSHMファイルも削除
      const walPath = `${dbPath}-wal`;
      const shmPath = `${dbPath}-shm`;

      const walInfo = await FileSystem.getInfoAsync(walPath);
      if (walInfo.exists) {
        await FileSystem.deleteAsync(walPath);
      }

      const shmInfo = await FileSystem.getInfoAsync(shmPath);
      if (shmInfo.exists) {
        await FileSystem.deleteAsync(shmPath);
      }

      // データベースを再初期化
      await this.init();
      Logger.info('Database recreated successfully');
    } catch (error) {
      Logger.error('Failed to delete and recreate database:', error);
      throw error;
    }
  }
}

export const database = new Database();
