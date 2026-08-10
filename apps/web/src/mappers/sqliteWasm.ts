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
/*
 * WASM本体はインストール済みのsql.jsから直接読み込む。
 * public/へ手動コピーすると、sql.js更新時にglue側が要求するファイル名や中身と
 * ずれても気付けず、実行時に静かに壊れるため（実際に1.13→1.14で
 * sql-wasm.wasm → sql-wasm-browser.wasm へ改名され読み込み不能になった）。
 * ブラウザ向けエントリ（package.jsonのbrowser条件）が読むファイルを明示的に指定する。
 */
import sqlWasmUrl from 'sql.js/dist/sql-wasm-browser.wasm?url';

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
      /* バンドラが出力したWASMのURLを渡す（ドキュメントのパス階層に依存しない） */
      locateFile: () => sqlWasmUrl,
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
}
