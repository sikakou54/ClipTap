/**
 * Database - SQLiteデータベース管理クラス
 *
 * ClipTapアプリのデータベース操作を一元管理します。
 *
 * 公開しているのは init() / dropAllTables() / getDatabaseFilePath() / reset() の4つで、
 * SQLiteインスタンス自体は外へ出さない。DB操作はアダプター（getMainDbAdapter 等）を
 * 経由させ、呼び出し側がコネクションを直接握らないようにするため。
 *
 * init() の呼び出し元はアプリ起動処理（useAppInitialization）の1箇所のみ。
 * 二重初期化は isInitialized フラグで弾いている。
 */

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
  getSchemaVersionFromDb,
  runMigrations,
} from '@cliptap/shared';
import { DROP_TABLES, SCHEMA_VERSION } from './schema';
import {
  checkMainDatabaseExists,
  checkSystemDatabaseExists,
  getSharedDatabaseFile,
  getSystemDatabaseFile,
} from './DatabaseFileManager';

/**
 * Databaseクラス - SQLiteデータベースの管理クラス
 *
 * シングルトンパターンで実装され、アプリ全体で1つのインスタンスを共有します。
 * データベースの初期化・マイグレーション・トランザクション処理を担当します。
 */
class Database {
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
   * @cliptap/shared の runMigrations にマイグレーション設定を渡して実行します。
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

  /**
   * データベースを初期状態へリセット
   *
   * @remarks
   * リセット後もDBは開いたままにする（init() と同様、以降の操作でそのまま使い続けるため close しない）。
   * setupDatabase / runMigrations が finally で close() を呼ぶのとは非対称である点に注意。
   */
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

    await this.dropAllTables();
    await createTablesWithDb(mainDbAdapter);
    await createIndexesWithDb(mainDbAdapter);
    await createDefaultProfileIfNeeded(mainDbAdapter);
    const systemDbAdapter = getSystemDbAdapter();
    const systemDbPath = await this.getDatabaseFilePath('system');
    await systemDbAdapter.open(systemDbPath);
    await systemDbAdapter.exec(`PRAGMA user_version = ${SCHEMA_VERSION}`);
    Logger.info(`Database reset successfully to version ${SCHEMA_VERSION}`);
  }

}

export const database = new Database();
