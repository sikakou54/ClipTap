/**
 * Database - SQLiteデータベース管理クラス
 *
 * ClipTapアプリのデータベース操作を一元管理します。
 *
 * 使用方法:
 * ```typescript
 * import { database } from './database';
 * await database.init(); // 初期化（アプリ起動時に1回のみ）
 * const db = database.getDB(); // SQLiteインスタンス取得
 * ```
 */

import * as SQLite from 'expo-sqlite';
import {
  type FileIOAdapter,
  getFileIOAdapter,
  getMainDbAdapter,
  getSystemDbAdapter,
  Logger,
  createDefaultProfileIfNeeded,
  createTablesWithDb,
  createIndexesWithDb,
  SystemVariableFormatMapper,
} from '@cliptap/shared';
import { DROP_TABLES, SCHEMA_VERSION } from './schema';
import {
  checkMainDatabaseExists,
  checkSystemDatabaseExists,
  getSharedDatabaseFile,
  getSystemDatabaseFile,
} from './DatabaseFileManager';
import { runMigrations, getSchemaVersionFromDb } from './DatabaseMigrations';

/**
 * Databaseクラス - SQLiteデータベースの管理クラス
 *
 * シングルトンパターンで実装され、アプリ全体で1つのインスタンスを共有します。
 * データベースの初期化・マイグレーション・トランザクション処理を担当します。
 */
class Database {
  /* データベースインスタンス（初期化されるまではnull） */
  private db: SQLite.SQLiteDatabase | null = null;
  /* 初期化完了フラグ（重複初期化を防ぐ） */
  private isInitialized = false;
  /* FileIOAdapterインスタンス（依存注入） */
  private fileIO: FileIOAdapter | null = null;

  /**
   * 共有コンテナDBを初期セットアップ
   *
   * アプリ初回起動時（DBが存在しない場合）に実行されます。
   * テーブル・インデックス・デフォルトプロファイルを作成します。
   */
  private async setupDatabase(): Promise<void> {
    Logger.info('[Setup Shared Container DB] Starting initial setup...');

    const dbPath = await this.getDatabaseFilePath('main');
    const mainDB = getMainDbAdapter();
    const systemDB = getSystemDbAdapter();
    const systemDbPath = await this.getDatabaseFilePath('system');

    /* DBをオープン */
    await mainDB.open(dbPath);
    await systemDB.open(systemDbPath);

    try {
      /* 1. 全テーブルを作成（categories, snippets, profiles等） */
      await createTablesWithDb(mainDB);

      /* 2. 全インデックスを作成（検索高速化用） */
      await createIndexesWithDb(mainDB);

      /* 3. デフォルトプロファイル（Main）を作成 */
      await createDefaultProfileIfNeeded(mainDB);

      /* 4. データベースバージョンを最新バージョンに設定 */
      await systemDB.exec(`PRAGMA user_version = ${SCHEMA_VERSION}`);

      Logger.success(`[Setup Shared Container DB] Setup completed with version ${SCHEMA_VERSION}`);
    } finally {
      mainDB.close();
      systemDB.close();
    }
  }

  /**
   * データベースの初期化
   *
   * アプリ起動時に1回だけ呼び出す必要があります。
   * 新規インストールの場合はセットアップを実行し、
   * 既存DBがある場合はマイグレーションを実行します。
   *
   * 注意: この関数を呼び出す前に、shared.init()でFileIOAdapterを登録しておく必要があります。
   */
  async init(): Promise<void> {
    /* 既に初期化済みの場合は何もしない（重複初期化を防ぐ） */
    if (this.isInitialized) return;

    /* AdapterRegistryからFileIOAdapterを取得 */
    const fileIO = getFileIOAdapter();

    /* FileIOAdapterを保持（内部のメソッドで使用するため） */
    this.fileIO = fileIO;

    try {
      /* 1. メインDBとSystemDB（旧DB）の存在確認 */
      const mainDbExists = await checkMainDatabaseExists(fileIO);
      const systemDbExists = await checkSystemDatabaseExists(fileIO);

      /* 2. どちらのDBも存在しない場合は新規インストールと判断 */
      if (!mainDbExists && !systemDbExists) {

        /* 新規インストール開始ログを出力 */
        Logger.info('[Init] First install setting database...');

        /* データベースの初期セットアップを実行（テーブル作成など） */
        await this.setupDatabase();

        /* 新規インストール完了ログを出力 */
        Logger.success(`[Init] First install completed version ${SCHEMA_VERSION}`);

      } else {

        /* (V1→V2→...→CurrentVersion へのアップデート) */
        Logger.success('[Init] Run Migration');

        /* マイグレーション処理を実行 */
        await this.runMigrations();

        /* マイグレーション完了ログを出力 */
        Logger.success('[Init] Migration completed');
      }

      /* 5. mainDbAdapter（DbAdapter）でDBを開く */
      /* AdapterRegistryに登録済みのDbAdapterを取得してopen()を呼び出す */
      const dbPath = await this.getDatabaseFilePath('main');
      const mainDbAdapter = getMainDbAdapter();
      await mainDbAdapter.open(dbPath);

      /* 同期展開用の書式レジストリをDBから初期化 */
      SystemVariableFormatMapper.loadRegistry();

      /* 6. 初期化完了フラグを立てる */
      this.isInitialized = true;

      /* 初期化完了ログを出力 */
      Logger.success('Database initialized successfully');
    } catch (error) {
      /* エラーが発生した場合はログ出力して再スロー */
      Logger.error('Failed to initialize database:', error);
      throw error;
    }
  }

  /**
   * マイグレーション実行
   *
   * DatabaseMigrationsモジュールにマイグレーション設定を渡して実行します。
   * 注意: init()内で this.fileIO が設定された後に呼び出されることを前提としています。
   */
  private async runMigrations(): Promise<void> {

    /* DBパスを取得 */
    const mainDbPath = await this.getDatabaseFilePath('main');
    const systemDbPath = await this.getDatabaseFilePath('system');

    /* DBアダプターを取得 */
    const mainDB = getMainDbAdapter();
    const systemDB = getSystemDbAdapter();

    await mainDB.open(mainDbPath);
    await systemDB.open(systemDbPath);

    try {
      /* マイグレーション実行 */
      /* user_versionが0の場合はV1として扱う（Mobile版はV1以降をサポート） */
      const dbVersion = getSchemaVersionFromDb(systemDB);
      const fromVersion = dbVersion === 0 ? 1 : dbVersion;
      await runMigrations(mainDB, systemDB, fromVersion);
    } finally {
      /* DBをクローズ */
      mainDB.close();
      systemDB.close();
    }
  }

  /**
   * データベースが新規作成されたかどうかを返す
   */
  /**
   * データベースが新規作成されたかどうかを返す
   *
   * user_versionが0の場合は新規作成されたDBと判断します。
   * （実際には使用されていない可能性があります）
   */
  isNewDatabase(): boolean {
    try {
      /* PRAGMA user_versionでバージョン番号を取得 */
      const version = this.db?.getFirstSync<{ user_version: number }>('PRAGMA user_version');
      /* バージョンが0の場合は新規DBと判断 */
      return version?.user_version === 0;
    } catch {
      /* エラーが発生した場合はfalseを返す */
      return false;
    }
  }

  /**
   * 現在のスキーマバージョンを取得（開発者メニュー用）
   */
  async getSchemaVersion(): Promise<number> {
    if (!this.db) throw new Error('Database not initialized');
    const result = this.db.getFirstSync<{ user_version: number }>('PRAGMA user_version');
    return result?.user_version ?? 0;
  }

  /**
   * データベースバージョンを手動で変更（開発者メニュー用）
   *
   * デバッグ目的でバージョンを変更する機能です。
   * マイグレーションのテストなどで使用されます。
   */
  async setVersionManually(version: number): Promise<void> {
    /* データベースが初期化されていない場合はエラー */
    if (!this.db) throw new Error('Database not initialized');

    /* 警告ログを出力（手動変更は通常の運用では行わない） */
    Logger.warn(`[Dev] Manually changing database version to ${version}`);
    /* PRAGMA user_versionでバージョン番号を設定 */
    await this.db.execAsync(`PRAGMA user_version = ${version}`);
    /* バージョン変更完了ログを出力 */
    Logger.success(`[Dev] Database version changed to ${version}`);
  }

  /**
   * 全テーブル削除
   *
   * データベースリセット時に使用されます。
   * 全テーブルをDROP TABLEで削除します。
   */
  async dropAllTables(): Promise<void> {
    const mainDbAdapter = getMainDbAdapter();

    try {
      /* DROP_TABLESオブジェクトの全DROP TABLE文を実行 */
      for (const dropSQL of Object.values(DROP_TABLES)) {
        await mainDbAdapter.exec(dropSQL);
      }
      /* テーブル削除完了ログを出力 */
      Logger.info('All tables dropped successfully');
    } catch (error) {
      /* エラーが発生した場合はログ出力して再スロー */
      Logger.error('Failed to drop tables:', error);
      throw error;
    }
  }

  /**
   * トランザクション実行
   *
   * 複数のデータベース操作を1つのまとまりとして実行し、
   * 途中でエラーが発生した場合は全ての変更を取り消します。
   */
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

  /**
   * データベースファイルのパスを取得
   *
   * @description
   * 指定されたデータベースタイプに応じたファイルのフルパスを返す。
   * DatabaseAdapterのopen()で使用される。
   *
   * @param type データベースタイプ（'main' | 'system'）デフォルトは 'main'
   * @returns データベースファイルのパス
   */
  async getDatabaseFilePath(type: 'main' | 'system' = 'main'): Promise<string> {
    if (!this.fileIO) {
      throw new Error('FileIOAdapter not initialized. Call init() first.');
    }

    if (type === 'system') {
      return await getSystemDatabaseFile(this.fileIO);
    }

    return await getSharedDatabaseFile(this.fileIO);
  }

  getFirstSync<T = any>(query: string, params: any[] = []): T | null {
    if (!this.db) throw new Error('Database not initialized');
    return this.db.getFirstSync<T>(query, params);
  }

  getAllSync<T = any>(query: string, params: any[] = []): T[] {
    if (!this.db) throw new Error('Database not initialized');
    return this.db.getAllSync<T>(query, params);
  }

  runSync(query: string, params: any[] = []): SQLite.SQLiteRunResult {
    if (!this.db) throw new Error('Database not initialized');
    return this.db.runSync(query, params);
  }

  async reset(): Promise<void> {
    /* FileIOAdapterが初期化されていない場合はエラー */
    if (!this.fileIO) {
      throw new Error('FileIOAdapter not initialized. Call init() first.');
    }

    const mainDbAdapter = getMainDbAdapter();
    const dbPath = await this.getDatabaseFilePath('main');

    /* データベースを開く（既に開かれている場合は閉じてから開き直す） */
    try {
      mainDbAdapter.close();
    } catch {
      /* 閉じる際のエラーは無視（既に閉じられている可能性がある） */
    }
    await mainDbAdapter.open(dbPath);

    try {
      await this.dropAllTables();
      await createTablesWithDb(mainDbAdapter);
      await createIndexesWithDb(mainDbAdapter);
      await createDefaultProfileIfNeeded(mainDbAdapter);
      await mainDbAdapter.exec(`PRAGMA user_version = ${SCHEMA_VERSION}`);
      Logger.info(`Database reset successfully to version ${SCHEMA_VERSION}`);
    } finally {
      /* リセット後もデータベースは開いたままにしておく（init()と同様） */
      /* 必要に応じて close() を呼び出すが、通常は開いたままにしておく */
    }
  }

  /**
   * データベースファイルを完全に削除して再作成
   *
   * 注: この機能は現在使用していません。reset() を使用してください。
   */
  async deleteAndRecreate(): Promise<void> {
    await this.reset();
    Logger.info('Database recreated successfully');
  }
}

export const database = new Database();
