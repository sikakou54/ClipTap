/**
 * BaseDatabaseManager - データベース管理の共通基底クラス
 *
 * Mobile/Web共通のデータベース初期化ロジックを提供します。
 * プラットフォーム固有の処理はサブクラスで実装します。
 *
 * @module BaseDatabaseManager
 */

import type { DbAdapter } from '../adapters/DbAdapter';
import { Logger } from '../utils/logger';
import {
  runMigrations,
  getSchemaVersionFromDb,
  createTablesWithDb,
  createIndexesWithDb,
  createDefaultProfileIfNeeded,
} from './migrations';
import { SystemVariableFormatMapper } from '../mappers/SystemVariableFormatMapper';
import { SystemVariableFormatRegistry } from '../services/SystemVariableFormatRegistry';
import { SCHEMA_VERSION, DROP_TABLES } from './schema';

/**
 * データベース初期化オプション
 */
export interface DatabaseInitOptions {
  /** スキーマバージョンが0の場合のデフォルトバージョン（Mobile: 1, Web: 4） */
  defaultSchemaVersion?: number;
  /** 初回セットアップかどうか（trueの場合はマイグレーションをスキップ） */
  isFirstInstall?: boolean;
}

/**
 * データベース管理の共通基底クラス
 *
 * 初期化フロー:
 * 1. プラットフォーム固有の前処理（platformPreInit）
 * 2. DBアダプターのオープン
 * 3. 新規インストール時: テーブル作成、インデックス作成、デフォルトプロファイル作成
 * 4. 既存DB時: マイグレーション実行
 * 5. プラットフォーム固有の後処理（platformPostInit）
 */
export abstract class BaseDatabaseManager {
  /** 初期化完了フラグ */
  protected isInitialized = false;

  /**
   * 初期化済みかどうかを返す
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * データベースを初期化
   *
   * @param options - 初期化オプション
   */
  async init(options: DatabaseInitOptions = {}): Promise<void> {
    if (this.isInitialized) {
      Logger.info('[BaseDatabaseManager] Already initialized, skipping');
      return;
    }

    try {
      /* 1. プラットフォーム固有の前処理 */
      await this.platformPreInit();

      /* 2. DBアダプターを取得してオープン */
      const mainDbPath = await this.getMainDatabasePath();
      const systemDbPath = await this.getSystemDatabasePath();

      const mainDB = this.getMainDbAdapter();
      const systemDB = this.getSystemDbAdapter();

      await mainDB.open(mainDbPath);
      await systemDB.open(systemDbPath);

      /* 3. 新規インストールか既存DBかで分岐 */
      if (options.isFirstInstall) {
        await this.setupNewDatabase(mainDB, systemDB);
      } else {
        await this.migrateExistingDatabase(mainDB, systemDB, options);
      }

      /* 4. プラットフォーム固有の後処理 */
      await this.platformPostInit();

      SystemVariableFormatRegistry.replace(SystemVariableFormatMapper.getAllFrom(mainDB));

      /* 5. 初期化完了 */
      this.isInitialized = true;
      Logger.success('[BaseDatabaseManager] Database initialized successfully');
    } catch (error) {
      Logger.error('[BaseDatabaseManager] Failed to initialize database:', error);
      throw error;
    }
  }

  /**
   * 新規データベースのセットアップ
   */
  protected async setupNewDatabase(mainDB: DbAdapter, systemDB: DbAdapter): Promise<void> {
    Logger.info('[BaseDatabaseManager] Setting up new database...');

    try {
      /* テーブル作成 */
      await createTablesWithDb(mainDB);

      /* インデックス作成 */
      await createIndexesWithDb(mainDB);

      /* デフォルトプロファイル作成 */
      await createDefaultProfileIfNeeded(mainDB);

      /* バージョンを最新に設定 */
      await systemDB.exec(`PRAGMA user_version = ${SCHEMA_VERSION}`);

      Logger.success(`[BaseDatabaseManager] New database setup completed (version ${SCHEMA_VERSION})`);
    } finally {
      /* サブクラスでDBを継続使用する場合があるため、ここではクローズしない */
    }
  }

  /**
   * 既存データベースのマイグレーション
   */
  protected async migrateExistingDatabase(
    mainDB: DbAdapter,
    systemDB: DbAdapter,
    options: DatabaseInitOptions
  ): Promise<void> {
    Logger.info('[BaseDatabaseManager] Running migrations...');

    try {
      /* user_versionが0の場合のデフォルトバージョン */
      const defaultVersion = options.defaultSchemaVersion ?? 1;
      const dbVersion = getSchemaVersionFromDb(systemDB);
      const fromVersion = dbVersion === 0 ? defaultVersion : dbVersion;

      /* マイグレーション実行 */
      await runMigrations(mainDB, systemDB, fromVersion);

      Logger.success('[BaseDatabaseManager] Migrations completed');
    } finally {
      /* サブクラスでDBを継続使用する場合があるため、ここではクローズしない */
    }
  }

  /**
   * データベースをリセット
   *
   * 全テーブルを削除し、再作成します。
   */
  async reset(): Promise<void> {
    Logger.info('[BaseDatabaseManager] Resetting database...');

    try {
      /* プラットフォーム固有のリセット前処理 */
      await this.platformPreReset();

      const mainDB = this.getMainDbAdapter();

      /* 全テーブルを削除 */
      for (const dropSQL of Object.values(DROP_TABLES)) {
        await mainDB.exec(dropSQL);
      }

      /* テーブルを再作成 */
      await createTablesWithDb(mainDB);
      await createIndexesWithDb(mainDB);
      await createDefaultProfileIfNeeded(mainDB);

      /* バージョンを最新に設定 */
      const systemDB = this.getSystemDbAdapter();
      await systemDB.exec(`PRAGMA user_version = ${SCHEMA_VERSION}`);

      /* プラットフォーム固有のリセット後処理 */
      await this.platformPostReset();

      Logger.success(`[BaseDatabaseManager] Database reset completed (version ${SCHEMA_VERSION})`);
    } catch (error) {
      Logger.error('[BaseDatabaseManager] Failed to reset database:', error);
      throw error;
    }
  }

  /**
   * 初期化状態をクリア
   *
   * DBアダプターをクローズし、初期化フラグをリセットします。
   */
  async clear(): Promise<void> {
    try {
      this.getMainDbAdapter().close();
    } catch {
      /* アダプターが未初期化の場合は無視 */
    }

    try {
      this.getSystemDbAdapter().close();
    } catch {
      /* アダプターが未初期化の場合は無視 */
    }

    this.isInitialized = false;
    Logger.info('[BaseDatabaseManager] Database state cleared');
  }

  /* ======================================== */
  /* 抽象メソッド（サブクラスで実装） */
  /* ======================================== */

  /**
   * mainDBアダプターを取得
   */
  protected abstract getMainDbAdapter(): DbAdapter;

  /**
   * systemDBアダプターを取得
   */
  protected abstract getSystemDbAdapter(): DbAdapter;

  /**
   * mainDBファイルのパスを取得
   */
  protected abstract getMainDatabasePath(): Promise<string>;

  /**
   * systemDBファイルのパスを取得
   */
  protected abstract getSystemDatabasePath(): Promise<string>;

  /**
   * プラットフォーム固有の初期化前処理
   *
   * WebではSQLiteWasmの初期化、IndexedDBからのキャッシュ復元等を行います。
   * Mobileでは特に処理がない場合は空実装で構いません。
   */
  protected abstract platformPreInit(): Promise<void>;

  /**
   * プラットフォーム固有の初期化後処理
   */
  protected abstract platformPostInit(): Promise<void>;

  /**
   * プラットフォーム固有のリセット前処理
   */
  protected abstract platformPreReset(): Promise<void>;

  /**
   * プラットフォーム固有のリセット後処理
   */
  protected abstract platformPostReset(): Promise<void>;
}
