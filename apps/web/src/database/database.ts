/**
 * Database - Web用SQLiteデータベース管理クラス
 *
 * ClipTap Webアプリのデータベース操作を一元管理します。
 * Mobile版と同様の構造を持ち、shared.init()の後に呼び出します。
 *
 * 使用方法:
 * ```typescript
 * import { database } from './database';
 *
 * // 1. shared.init()でアダプターを登録
 * // 2. データベース初期化
 * await database.init();
 * ```
 *
 * @module database
 */

import {
  Logger,
  SystemVariableFormatMapper,
  getFileIOAdapter,
  getMainDbAdapter,
  getSystemDbAdapter,
  ProfileService,
  SCHEMA_VERSION,
  setSchemaVersionToDb,
} from '@cliptap/shared';
import { SQLiteWasm } from '@src/mappers/sqliteWasm';
import { CacheService } from '@services/CacheService';
import type { WebDatabaseAdapter } from '@adapters/WebDatabaseAdapter';
import type { WebFileIOAdapter } from '@adapters/WebFileIOAdapter';
import { runMigrations, getSchemaVersionFromDb } from './DatabaseMigrations';
import { getMainDatabasePath, getSystemDatabasePath } from './DatabaseFileManager';

/**
 * Databaseクラス - Web用SQLiteデータベースの管理クラス
 *
 * シングルトンパターンで実装され、アプリ全体で1つのインスタンスを共有します。
 * IndexedDBからのキャッシュ復元とデータベース初期化を担当します。
 */
class Database {
  /** 初期化完了フラグ（重複初期化を防ぐ） */
  private isInitialized = false;
  /** キャッシュから復元したかどうかのフラグ */
  private restoredFromCache = false;

  /**
   * データベースの初期化
   *
   * 初回起動時に1回だけ呼び出される。
   * IndexedDBからキャッシュを復元し、OPFSに書き出してからDBを開きます。
   * ログインの有無でキャッシュは変わらない仕様のため、userIdパラメータは使用しません。
   *
   * 処理フロー:
   * 1. SQLiteWasm初期化（WASMファイル読み込み）
   * 2. IndexedDBからキャッシュを読み込み（ログイン状態に関係なく）
   * 3. キャッシュデータがあればOPFSに書き出し
   * 4. mainDbAdapter.open()でDBを開く
   * 5. キャッシュがある場合: バージョン確認・マイグレーション実行
   * 6. キャッシュがない場合: .cliptapファイルのインポートを待つ
   *
   * 注意:
   * - この関数を呼び出す前に、shared.init()でアダプターを登録しておく必要があります。
   * - キャッシュがない場合は空のDBファイルを削除し、.cliptapファイルのインポートを待ちます。
   * - ログイン/ログアウト時は再初期化されません（既存のキャッシュを継続使用）。
   * - バージョンが取得できない（破損した）キャッシュは自動でクリアされます。
   * - キャッシュから復元されたかどうかは hasCache() メソッドで取得できます。
   */
  async init(): Promise<void> {
    /* 既に初期化済みの場合は何もしない */
    if (this.isInitialized) {
      return;
    }

    try {
      /* 1. SQLite WebAssemblyを初期化（WASMファイル読み込み） */
      await SQLiteWasm.init();
      Logger.info('[Database] SQLiteWasm initialized');

      /* 2. IndexedDBからキャッシュを読み込み（ログイン状態に関係なく同じキャッシュを使用） */
      let dbData: Uint8Array | null = null;
      let systemDbData: Uint8Array | undefined;
      let legacySchemaVersion: number | undefined;
      const cached = await CacheService.load();

      if (cached) {
        /* キャッシュがあれば使用（ログイン状態に関係なく） */
        dbData = cached.data;
        systemDbData = cached.systemDbData;
        legacySchemaVersion = cached.schemaVersion;
        this.restoredFromCache = true;
        Logger.info(`[Database] Cache loaded from IndexedDB version = ${legacySchemaVersion}`);
      }

      /* 3. キャッシュデータがあればOPFSに書き出し */
      const fileIO = getFileIOAdapter() as WebFileIOAdapter;
      if (dbData && dbData.length > 0) {
        await fileIO.writeBytes(getMainDatabasePath(), dbData);
        Logger.info('[Database] mainDB cache written to OPFS');
      } else {
        /* キャッシュがない場合は空のDBファイルを削除（存在すれば） */
        const exists = await fileIO.exists(getMainDatabasePath());
        if (exists) {
          await fileIO.deleteFile(getMainDatabasePath());
        }
      }

      /* 3.5. systemDBキャッシュがあればOPFSに書き出し */
      if (systemDbData && systemDbData.length > 0) {
        await fileIO.writeBytes(getSystemDatabasePath(), systemDbData);
        Logger.info('[Database] systemDB cache written to OPFS');
      }

      /* 4. mainDbAdapterでDBを開く */
      const mainDbAdapter = getMainDbAdapter() as WebDatabaseAdapter;
      await mainDbAdapter.open(getMainDatabasePath());

      /* 5. systemDbAdapterを開く（user_version管理用） */
      const systemDbAdapter = getSystemDbAdapter() as WebDatabaseAdapter;
      await systemDbAdapter.open(getSystemDatabasePath());

      /* 6. キャッシュがある場合: バージョン確認・マイグレーション実行 */
      if (this.restoredFromCache) {
        try {
          /*
           * バージョン取得の優先順位:
           * 1. systemDBの PRAGMA user_version（新方式）
           * 2. IndexedDBキャッシュの schemaVersion（旧方式、移行用）
           * 3. デフォルト: V4（Web版の最小サポートバージョン）
           */
          let schemaVersion = getSchemaVersionFromDb(systemDbAdapter);
          if (schemaVersion === 0 && legacySchemaVersion && legacySchemaVersion > 0) {
            /* 旧方式からの移行: IndexedDBのバージョンを使用 */
            Logger.info(`[Database] Migrating from legacy schemaVersion (${legacySchemaVersion}) to systemDB`);
            schemaVersion = legacySchemaVersion;
          } else if (schemaVersion === 0) {
            /* Web版はV4以降をサポート */
            schemaVersion = 4;
          }

          /* バージョン確認・マイグレーション実行 */
          await runMigrations(mainDbAdapter, systemDbAdapter, schemaVersion);
          Logger.info('[Database] Database restored from cache and migrations applied');
        } catch (error) {
          Logger.error('[Database] Migration failed :', error);
        }
      } else {
        Logger.info('[Database] Database opened (waiting for .cliptap file import)');
      }

      SystemVariableFormatMapper.loadRegistry();

      /* 7. 初期化完了 */
      this.isInitialized = true;
      Logger.success('[Database] Database initialized successfully');
    } catch (error) {
      Logger.error('[Database] Failed to initialize database:', error);
      throw error;
    }
  }

  /**
   * データベースが初期化済みかどうかを返す
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * キャッシュから復元されたかどうかを返す
   *
   * init() 完了後に呼び出すことで、
   * IndexedDBからキャッシュが復元されたかどうかを確認できます。
   */
  hasCache(): boolean {
    return this.restoredFromCache;
  }

  /** 初回ファイル読込後のプロファイル状態とスキーマ版を確定する */
  async finalizeInitialLoad(): Promise<void> {
    ProfileService.ensureDefaultAndActive();
    await setSchemaVersionToDb(getSystemDbAdapter(), SCHEMA_VERSION);
  }

  /**
   * データベースをリセット（ログアウト時）
   * DBアダプターを閉じ、OPFSファイルを削除し、初期化フラグをリセットする
   */
  async reset(): Promise<void> {
    try {
      /* mainDBアダプターを閉じる */
      const mainDbAdapter = getMainDbAdapter() as WebDatabaseAdapter;
      mainDbAdapter.close();
    } catch {
      /* アダプターが未初期化の場合は無視 */
    }

    try {
      /* systemDBアダプターを閉じる */
      const systemDbAdapter = getSystemDbAdapter() as WebDatabaseAdapter;
      systemDbAdapter.close();
    } catch {
      /* アダプターが未初期化の場合は無視 */
    }

    try {
      /* OPFSのDBファイルを削除（再ログイン時に古いデータが残らないように） */
      const fileIO = getFileIOAdapter() as WebFileIOAdapter;

      /* mainDBファイル削除 */
      const mainDbExists = await fileIO.exists(getMainDatabasePath());
      if (mainDbExists) {
        await fileIO.deleteFile(getMainDatabasePath());
        Logger.info('[Database] OPFS main database file deleted');
      }

      /* systemDBファイル削除 */
      const systemDbExists = await fileIO.exists(getSystemDatabasePath());
      if (systemDbExists) {
        await fileIO.deleteFile(getSystemDatabasePath());
        Logger.info('[Database] OPFS system database file deleted');
      }
    } catch {
      /* ファイルIOアダプターが未初期化の場合は無視 */
    }

    this.isInitialized = false;
    this.restoredFromCache = false;
    Logger.info('[Database] Database state reset');
  }
}

export const database = new Database();
