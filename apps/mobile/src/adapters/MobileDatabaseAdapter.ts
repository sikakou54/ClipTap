/**
 * Mobile用DbAdapter
 *
 * @description
 * expo-sqliteをラップして、共通DbAdapterインターフェースを実装。
 * open(path)で動的にデータベースを開く（メインDB/一時DB両対応）。
 *
 * @module MobileDatabaseAdapter
 */

import * as SQLite from 'expo-sqlite';
import { type DbAdapter, type DbRunResult, type FileIOAdapter, getFileName, getDirectoryPath, Logger } from '@cliptap/shared';

export interface MobileDatabaseAdapterOptions {
  fileIO: FileIOAdapter;
}

export class MobileDatabaseAdapter implements DbAdapter {
  private db: SQLite.SQLiteDatabase | null = null;
  private currentPath: string | null = null;
  private fileIO: FileIOAdapter | null = null;

  constructor(options: MobileDatabaseAdapterOptions) {
    this.fileIO = options.fileIO;
  }

  async open(path: string): Promise<void> {
    /* 既に開いているデータベースがある場合は先に閉じる（複数DBの切り替え対応） */
    if (this.db) {
      this.close();
    }

    /* パスからファイル名とディレクトリパスを抽出 */
    const fileName = getFileName(path);
    const dirPath = getDirectoryPath(path);

    /* ディレクトリが存在しない場合は作成（一時DB用のディレクトリ確保） */
    if (this.fileIO) {
      const exists = await this.fileIO.exists(dirPath);
      if (!exists) {
        await this.fileIO.makeDirectory(dirPath);
      }
    }

    /* expo-sqlite: openDatabaseAsync(fileName, options, dirPath)形式で開く */
    this.db = await SQLite.openDatabaseAsync(fileName, undefined, dirPath);
    this.currentPath = path;
  }

  close(): void {
    if (!this.db) return;

    try {
      /* DbAdapterの同期close契約を守り、直後の再openや一時ファイル削除との競合を防ぐ */
      this.db.closeSync();
    } catch (error) {
      /* closeはfinallyから呼ばれるため、ここで送出すると本来のエラーを置き換えてしまう */
      Logger.warn('[MobileDatabaseAdapter] Failed to close database:', error);
    } finally {
      /* close失敗でも参照を捨て、壊れたハンドルを以降のopenで触らせない */
      this.db = null;
      this.currentPath = null;
    }
  }

  /**
   * データベースインスタンスを取得（nullチェック付き）
   * @returns 開かれているデータベースインスタンス
   * @throws {Error} データベースが開かれていない場合
   */
  private getDb(): SQLite.SQLiteDatabase {
    if (!this.db) {
      throw new Error('MobileDatabaseAdapter: Database is not opened. Call open(path) first.');
    }
    return this.db;
  }

  get<T = unknown>(sql: string, params: unknown[] = []): T | null {
    return this.getDb().getFirstSync<T>(sql, params as (string | number | null)[]);
  }

  all<T = unknown>(sql: string, params: unknown[] = []): T[] {
    return this.getDb().getAllSync<T>(sql, params as (string | number | null)[]);
  }

  run(sql: string, params: unknown[] = []): DbRunResult {
    const result = this.getDb().runSync(sql, params as (string | number | null)[]);

    return {
      lastInsertRowId: result.lastInsertRowId,
      changes: result.changes,
    };
  }

  transaction<T>(fn: () => T): T {
    const db = this.getDb();
    let result: T;

    /* トランザクション開始 */
    db.execSync('BEGIN TRANSACTION;');

    try {
      /* トランザクション内で関数を実行 */
      result = fn();
      /* 正常終了時はコミット */
      db.execSync('COMMIT;');
    } catch (error) {
      /* エラー発生時はロールバック（変更を破棄） */
      db.execSync('ROLLBACK;');
      throw error;
    }

    return result;
  }

  async exec(sql: string): Promise<void> {
    await this.getDb().execAsync(sql);
  }

  async exportAsBase64(): Promise<string> {
    /* データベースパスが設定されているか確認（一時DBのエクスポート用） */
    if (!this.currentPath) {
      throw new Error('MobileDatabaseAdapter: No database path. Call open(path) first.');
    }

    /* FileIOAdapterが設定されているか確認（バイナリ読み込みに必要） */
    if (!this.fileIO) {
      throw new Error('MobileDatabaseAdapter: FileIOAdapter not provided for exportAsBase64.');
    }

    /* データベースファイルをバイナリとして読み込み、Base64エンコードして返す */
    return await this.fileIO.readBinary(this.currentPath);
  }
}
