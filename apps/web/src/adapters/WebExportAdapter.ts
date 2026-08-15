/**
 * Web用ExportAdapter
 *
 * @description
 * エクスポート処理で必要なプラットフォーム固有の機能を提供。
 * shared層のExportServiceから呼び出される。
 *
 * Adapterはプラットフォーム固有の処理（ファイルI/O、DB操作）のみを担当し、
 * ビジネスロジック（データ削除など）はService層で実行する。
 *
 * @module WebExportAdapter
 */

import {
  type ExportAdapter,
  type FileShareAdapter,
  getMainDbAdapter,
  toOpfsPath,
} from '@cliptap/shared';
import type { WebDatabaseAdapter } from './WebDatabaseAdapter';
import type { WebFileIOAdapter } from './WebFileIOAdapter';

/**
 * Web用ExportAdapter実装クラス
 */
export class WebExportAdapter implements ExportAdapter {
  private fileShare: FileShareAdapter;
  private fileIO: WebFileIOAdapter;

  constructor(fileShare: FileShareAdapter, fileIO: WebFileIOAdapter) {
    this.fileShare = fileShare;
    this.fileIO = fileIO;
  }

  /**
   * エクスポートデータをファイルとして保存（ダウンロード）
   */
  async saveExportFile(fileName: string, content: string): Promise<string> {
    /* BlobとURLを作成 */
    const blob = new Blob([content], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);

    /* ダウンロード */
    await this.fileShare.shareFile(url, fileName);

    /* URLを解放 */
    URL.revokeObjectURL(url);

    return url;
  }

  /**
   * 部分エクスポート用の一時データベースファイルを作成
   *
   * @description
   * 現在のメインDBをOPFSに一時ファイルとして保存する。
   * WebDatabaseAdapter.open()がOPFSパスを正しく処理できるようにする。
   *
   * @returns 一時データベースファイルのパス（opfs://プレフィックス付き）
   */
  async createTempDbFile(): Promise<string> {
    /* 現在のメインDBをエクスポート */
    const mainDbAdapter = getMainDbAdapter() as WebDatabaseAdapter;
    const currentData = mainDbAdapter.exportDatabase();

    /* 一時ファイル名を生成（UUIDを使用） */
    const tempFileName = `temp_export_${Date.now()}_${Math.random().toString(36).substring(2, 9)}.db`;
    const tempPath = toOpfsPath(tempFileName);

    /* OPFSに一時ファイルとして保存 */
    await this.fileIO.writeBytes(tempPath, currentData);

    return tempPath;
  }
}
