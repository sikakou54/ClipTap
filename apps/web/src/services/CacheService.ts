/**
 * IndexedDBキャッシュ管理サービス
 *
 * @description
 * SQLiteデータベースのバイナリをブラウザのIndexedDBに永続化。
 * ページリロード時のデータ復元に使用。
 *
 * 保存データ:
 * - data: SQLiteのバイナリデータ (Uint8Array)
 * - customerId: ユーザーID
 * - timestamp: 保存日時
 *
 * @module CacheService
 */
import { openDB } from 'idb';
import type { DBSchema, IDBPDatabase } from 'idb';

/**
 * ClipTap用のIndexedDBスキーマ定義
 * cacheオブジェクトストアに保存されるデータの型を定義
 */
interface ClipTapDB extends DBSchema {
  cache: {
    key: string;
    value: {
      data: Uint8Array; /* SQLiteデータベースのバイナリデータ（mainDB） */
      systemDbData?: Uint8Array; /* SQLiteデータベースのバイナリデータ（systemDB） */
      customerId: string | null; /* ユーザーID（ログインしていない場合はnull） */
      timestamp: number; /* 保存した日時（Unix時間） */
      schemaVersion?: number; /* SQLiteスキーマバージョン（旧方式、読み取り専用） */
    };
  };
}

/* IndexedDBのデータベース名 */
const DB_NAME = 'cliptap-cache';
/* データベースのバージョン番号（スキーマ変更時にインクリメント） */
const DB_VERSION = 1;
/* キャッシュデータを保存するキー名 */
const CACHE_KEY = 'sqlite-data';

/**
 * IndexedDBキャッシュ管理クラス
 *
 * @description
 * SQLiteデータベースのバイナリをIndexedDBに永続化。
 * シングルトンパターンで実装。
 */
class _CacheService {
  /* IndexedDBのデータベースインスタンス（初回アクセス時に初期化） */
  private db: IDBPDatabase<ClipTapDB> | null = null;

  /**
   * IndexedDBを初期化
   * @returns IndexedDBインスタンス
   */
  private async getDB(): Promise<IDBPDatabase<ClipTapDB>> {
    /* 1. すでに初期化済みの場合は既存のインスタンスを返す（シングルトン） */
    if (this.db) return this.db;

    /* 2. IndexedDBを開く */
    /* DB_NAME: 'cliptap-cache', DB_VERSION: 1 */
    this.db = await openDB<ClipTapDB>(DB_NAME, DB_VERSION, {
      /* データベースのバージョンが上がった場合や、初回作成時に実行される */
      upgrade(database) {
        /* 'cache'オブジェクトストアが存在しない場合は作成 */
        /* オブジェクトストアはRDBMSのテーブルのようなもの */
        if (!database.objectStoreNames.contains('cache')) {
          database.createObjectStore('cache');
        }
      },
    });

    /* 3. 初期化されたデータベースインスタンスを返す */
    return this.db;
  }

  /**
   * SQLiteデータをキャッシュに保存
   * @param data - SQLiteバイナリデータ（mainDB）
   * @param customerId - ユーザーID（ログインしていない場合はnull）
   * @param systemDbData - SQLiteバイナリデータ（systemDB、オプション）
   */
  async save(data: Uint8Array, customerId: string | null, systemDbData?: Uint8Array): Promise<void> {
    /* 1. データベースインスタンスを取得 */
    const database = await this.getDB();

    /* 2. 'cache'オブジェクトストアにデータを保存 */
    /* putメソッドは指定されたキーが存在すれば更新、なければ作成する */
    await database.put('cache', {
      data,
      systemDbData,
      customerId,
      timestamp: Date.now(),
    }, CACHE_KEY);
  }

  /**
   * キャッシュからSQLiteデータを取得
   * @returns キャッシュデータまたはnull
   */
  async load(): Promise<{ data: Uint8Array; systemDbData?: Uint8Array; customerId: string | null; schemaVersion?: number } | null> {
    /* データベースインスタンスを取得 */
    const database = await this.getDB();
    /* 'cache'オブジェクトストアから'sqlite-data'キーのデータを取得 */
    const cached = await database.get('cache', CACHE_KEY);

    /* データが存在しない場合はnullを返す */
    if (!cached) {
      return null;
    }

    /* データ、systemDbData、ユーザーID、schemaVersion（旧方式移行用）を返す */
    return {
      data: cached.data,
      systemDbData: cached.systemDbData,
      customerId: cached.customerId,
      schemaVersion: cached.schemaVersion,
    };
  }

  /**
   * キャッシュの存在確認
   * @returns キャッシュが存在するかどうか
   */
  async has(): Promise<boolean> {
    /* データベースインスタンスを取得 */
    const database = await this.getDB();
    /* 'cache'オブジェクトストアから'sqlite-data'キーのデータを取得 */
    const cached = await database.get('cache', CACHE_KEY);
    /* undefinedでなければtrue（存在する） */
    return cached !== undefined;
  }


  /**
   * キャッシュをクリア
   */
  async clear(): Promise<void> {
    /* データベースインスタンスを取得 */
    const database = await this.getDB();
    /* 'cache'オブジェクトストアから'sqlite-data'キーのデータを削除 */
    await database.delete('cache', CACHE_KEY);
  }


  /**
   * キャッシュを更新（SQLiteデータのみ）
   * @param data - 新しいSQLiteバイナリデータ（mainDB）
   * @param systemDbData - 新しいSQLiteバイナリデータ（systemDB、オプション）
   */
  async updateData(data: Uint8Array, systemDbData?: Uint8Array): Promise<void> {
    /* データベースインスタンスを取得 */
    const database = await this.getDB();
    /* 既存のキャッシュデータを取得 */
    const existing = await database.get('cache', CACHE_KEY);

    /* 既存データがある場合 */
    if (existing) {
      /* 既存データのcustomerIdを保持しつつ、dataを更新 */
      await database.put('cache', {
        ...existing,
        data,
        systemDbData,
        timestamp: Date.now(),
      }, CACHE_KEY);
    } else {
      /* 既存データがない場合は新規作成 */
      await database.put('cache', {
        data,
        systemDbData,
        customerId: null,
        timestamp: Date.now(),
      }, CACHE_KEY);
    }
  }
}

/**
 * CacheServiceのシングルトンインスタンス
 * アプリケーション全体で1つのインスタンスを共有
 */
export const CacheService = new _CacheService();
