/**
 * SQLite WebAssembly (sql.js) ラッパークラス
 *
 * @description
 * ブラウザ上でSQLiteを動作させるためのsql.jsの初期化とDatabase作成を提供。
 * Mobile版のexpo-sqliteと同様に、DBインスタンスを作成して返すシンプルな設計。
 *
 * 主な機能:
 * - SQLite Wasmの初期化（WASMファイル読み込み）
 * - データベースインスタンスの作成
 *
 * @module sqliteWasm
 */
import initSqlJs from 'sql.js';
import type { Database, SqlJsStatic } from 'sql.js';

/**
 * SQLite WebAssemblyラッパークラス
 *
 * @class SQLiteWasm
 *
 * @description
 * sql.jsを使用したSQLiteデータベース操作を提供するクラス。
 * Mobile版と同様に、DBインスタンスを作成して返すシンプルな設計。
 * staticメンバでグローバルDBを保持しない。
 */
export class SQLiteWasm {
  /** sql.jsの静的インスタンス（初期化後に使用） */
  private static SQL: SqlJsStatic | null = null;

  /**
   * SQLite Wasmを初期化（アプリ起動時に1回だけ実行）
   * @throws WASMファイルの読み込みに失敗した場合
   */
  static async init(): Promise<void> {
    /* 既に初期化済みなら何もしない */
    if (SQLiteWasm.SQL) return;

    /* sql.jsを初期化（WASMファイルをロード） */
    SQLiteWasm.SQL = await initSqlJs({
      /* WASMファイルのパスを指定（publicディレクトリから） */
      locateFile: (file) => `./${file}`,
    });
  }

  /**
   * SQLiteが初期化済みかどうかを確認
   */
  static isInitialized(): boolean {
    return SQLiteWasm.SQL !== null;
  }

  /**
   * 新しいDatabaseインスタンスを作成
   *
   * @param data - SQLiteデータベースのバイナリデータ（省略時は空のDB）
   * @returns 作成されたDatabaseインスタンス
   * @throws 初期化前に呼び出された場合
   */
  static createDatabase(data?: Uint8Array): Database {
    if (!SQLiteWasm.SQL) {
      throw new Error('SQLite not initialized. Call SQLiteWasm.init() first.');
    }

    /* データがあればそれを使用、なければ空のDBを作成 */
    return data && data.length > 0
      ? new SQLiteWasm.SQL.Database(data)
      : new SQLiteWasm.SQL.Database();
  }

  /**
   * 新しいUUID（v4）を生成
   * @returns UUID文字列
   */
  static generateUUID(): string {
    /* Web Crypto APIを使用 */
    return crypto.randomUUID();
  }
}
