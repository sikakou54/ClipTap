/**
 * sql.js型定義ファイル
 *
 * @description
 * sql.jsライブラリ（SQLite WebAssembly実装）のTypeScript型定義。
 * 公式の@types/sql.jsが存在しないため、独自に定義している。
 */
declare module 'sql.js' {
  /** sql.jsの静的インスタンス（初期化後に取得） */
  export interface SqlJsStatic {
    /** Databaseコンストラクタ */
    Database: new (data?: ArrayLike<number> | Buffer | null) => Database;
  }

  /** SQLiteデータベースインスタンス */
  export interface Database {
    /** SQLクエリを実行（INSERT/UPDATE/DELETE/CREATE TABLE等） */
    run(sql: string, params?: unknown[]): Database;
    /** SQLクエリを実行して全結果を取得（exec形式） */
    exec(sql: string): QueryExecResult[];
    /** 行ごとにコールバックを実行 */
    each(sql: string, params: unknown[], callback: (row: ParamsObject) => void, done?: () => void): void;
    /** プリペアドステートメントを作成 */
    prepare(sql: string): Statement;
    /** データベースをバイナリデータとしてエクスポート */
    export(): Uint8Array;
    /** データベースを閉じる */
    close(): void;
    /** 最後のクエリで変更された行数を取得 */
    getRowsModified(): number;
  }

  /** プリペアドステートメント */
  export interface Statement {
    /** パラメータをバインド */
    bind(params?: unknown[]): boolean;
    /** 次の行へ進む（結果がある場合true） */
    step(): boolean;
    /** 現在の行をオブジェクトとして取得 */
    getAsObject(params?: ParamsObject): ParamsObject;
    /** 現在の行を配列として取得 */
    get(params?: unknown[]): unknown[];
    /** ステートメントを解放 */
    free(): boolean;
    /** ステートメントをリセット */
    reset(): void;
    /** ステートメントを実行 */
    run(params?: unknown[]): void;
  }

  /** クエリ実行結果 */
  export interface QueryExecResult {
    /** カラム名の配列 */
    columns: string[];
    /** 行データの配列 */
    values: unknown[][];
  }

  /** パラメータオブジェクト（カラム名 -> 値のマップ） */
  export interface ParamsObject {
    [key: string]: unknown;
  }

  /** sql.js初期化設定 */
  export interface SqlJsConfig {
    /** WASMファイルのパスを解決する関数 */
    locateFile?: (file: string) => string;
  }

  /** sql.jsを初期化してSqlJsStaticを返す */
  export default function initSqlJs(config?: SqlJsConfig): Promise<SqlJsStatic>;
}
