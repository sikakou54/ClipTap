/**
 * Web用DbAdapter
 *
 * @description
 * sql.js（WASM SQLite）をラップして、共通DbAdapterインターフェースを実装。
 * Mobile版のDatabaseAdapterと同じ構造で、open(path)で動的にデータベースを開く。
 *
 * @module WebDatabaseAdapter
 */

import type { DbAdapter, DbRunResult } from '@cliptap/shared';
import { getDirectoryPath, isOpfsPath, OPFS_PREFIX } from '@cliptap/shared';
import type { Database } from 'sql.js';
import { SQLiteWasm } from '@src/mappers/sqliteWasm';
import type { WebFileIOAdapter } from '@adapters/WebFileIOAdapter';

/**
 * WebDatabaseAdapterのコンストラクタオプション
 */
export interface WebDatabaseAdapterOptions {
  /**
   * WebFileIOAdapter（OPFS操作用）
   */
  fileIO: WebFileIOAdapter;
  /**
   * 書き込み操作後に呼ばれるコールバック（キャッシュ保存用）
   */
  onWrite?: () => void;
}

/**
 * Web用DbAdapter実装クラス
 *
 * @description
 * Mobile版のDatabaseAdapterと同じ構造。
 * open(path)で動的にデータベースを開く。
 * メインDBも一時DBも同じ方法でアクセス可能。
 */
export class WebDatabaseAdapter implements DbAdapter {
  /** 開かれたDBインスタンス */
  private db: Database | null = null;

  /** 現在開いているDBのパス */
  private currentPath: string | null = null;

  /** WebFileIOAdapter（OPFS操作用） */
  private fileIO: WebFileIOAdapter;

  /** 書き込み操作後に呼ばれるコールバック */
  private onWrite?: () => void;

  constructor(options: WebDatabaseAdapterOptions) {
    this.fileIO = options.fileIO;
    this.onWrite = options.onWrite;
  }


  /**
   * データベースを非同期で開く
   *
   * @param path - データベースファイルのパス（opfs://プレフィックス付き）
   */
  async open(path: string): Promise<void> {
    /* 既に開かれている場合は閉じる */
    if (this.db) {
      this.db.close();
      this.db = null;
      this.currentPath = null;
    }

    /* OPFSパスの場合 */
    if (isOpfsPath(path)) {
      /* ディレクトリ作成（必要な場合） */
      const dirPath = getDirectoryPath(path);
      if (dirPath.length >= OPFS_PREFIX.length && dirPath !== path) {
        const exists = await this.fileIO.exists(dirPath);
        if (!exists) {
          await this.fileIO.makeDirectory(dirPath);
        }
      }

      /* ファイルが存在する場合は読み込んでDBを作成 */
      const fileExists = await this.fileIO.exists(path);
      if (fileExists) {
        const fileData = await this.fileIO.readBytes(path);
        this.db = SQLiteWasm.createDatabase(fileData);
      } else {
        /* 存在しない場合は空のDBを作成（スキーマなし） */
        this.db = SQLiteWasm.createDatabase();
      }
    } else {
      /* その他のパスは空のDBを作成 */
      this.db = SQLiteWasm.createDatabase();
    }

    this.currentPath = path;
  }

  /**
   * データベース接続を閉じる
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.currentPath = null;
    }
  }

  /**
   * データベースが開かれているかを確認
   * @returns 開かれている場合はtrue
   */
  isOpen(): boolean {
    return this.db !== null;
  }

  /**
   * DBインスタンスを取得
   */
  private getDb(): Database {
    if (!this.db) {
      throw new Error('WebDatabaseAdapter: Database is not opened. Call open(path) first.');
    }
    return this.db;
  }

  /**
   * 1行取得（SELECT）
   */
  get<T = unknown>(sql: string, params: unknown[] = []): T | null {
    const db = this.getDb();
    const stmt = db.prepare(sql);
    stmt.bind(params as (string | number | null)[]);
    if (stmt.step()) {
      const row = stmt.getAsObject() as T;
      stmt.free();
      return row;
    }
    stmt.free();
    return null;
  }

  /**
   * 複数行取得（SELECT）
   */
  all<T = unknown>(sql: string, params: unknown[] = []): T[] {
    const db = this.getDb();
    const results: T[] = [];
    const stmt = db.prepare(sql);
    stmt.bind(params as (string | number | null)[]);
    while (stmt.step()) {
      results.push(stmt.getAsObject() as T);
    }
    stmt.free();
    return results;
  }

  /**
   * 更新系クエリ実行（INSERT/UPDATE/DELETE）
   */
  run(sql: string, params: unknown[] = []): DbRunResult {
    const db = this.getDb();
    db.run(sql, params as (string | number | null)[]);

    const lastIdStmt = db.prepare('SELECT last_insert_rowid() as id');
    lastIdStmt.step();
    const lastId = lastIdStmt.getAsObject() as { id: number };
    lastIdStmt.free();

    const changesStmt = db.prepare('SELECT changes() as changes');
    changesStmt.step();
    const changes = changesStmt.getAsObject() as { changes: number };
    changesStmt.free();

    /* 書き込み後のコールバックを呼び出し（キャッシュ保存用） */
    /* BEGIN/COMMIT/ROLLBACKはトランザクション制御なのでスキップ */
    const upperSql = sql.trim().toUpperCase();
    if (!upperSql.startsWith('BEGIN') && !upperSql.startsWith('COMMIT') && !upperSql.startsWith('ROLLBACK')) {
      this.onWrite?.();
    }

    return {
      lastInsertRowId: lastId?.id ?? 0,
      changes: changes?.changes ?? 0,
    };
  }

  /**
   * トランザクション実行
   */
  transaction<T>(fn: () => T): T {
    const db = this.getDb();
    db.run('BEGIN TRANSACTION');
    try {
      const result = fn();
      db.run('COMMIT');
      return result;
    } catch (error) {
      db.run('ROLLBACK');
      throw error;
    }
  }

  /**
   * SQL実行（DDL/複数文対応）
   */
  async exec(sql: string): Promise<void> {
    const db = this.getDb();
    db.run(sql);

    /* DDL（ALTER TABLE等）やPRAGMA user_versionもDBを変更するため、run()と同様に保存をスケジュールする */
    this.onWrite?.();
  }

  /**
   * メモリ上の変更をOPFSファイルへ書き戻す
   *
   * @description
   * sql.jsはopen()時にファイル全体をメモリへ複製するため、
   * close()すると exec()/run() による変更が失われる。
   * 一時DBのマイグレーション結果のように、
   * 開き直したあとも変更を引き継ぐ必要がある場合に呼び出す。
   */
  async persist(): Promise<void> {
    /* OPFS以外のパス（Blob URL等）は書き戻し先が無いため何もしない */
    if (!this.currentPath || !isOpfsPath(this.currentPath)) {
      return;
    }

    await this.fileIO.writeBytes(this.currentPath, this.exportDatabase());
  }

  /**
   * 現在のDBをUint8Arrayとしてエクスポート
   */
  exportDatabase(): Uint8Array {
    const db = this.getDb();
    return db.export();
  }

  /**
   * データベースをBase64文字列としてエクスポート
   */
  async exportAsBase64(): Promise<string> {
    const bytes = this.exportDatabase();
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * 現在開いているDBのパスを取得
   */
  getCurrentPath(): string | null {
    return this.currentPath;
  }
}
