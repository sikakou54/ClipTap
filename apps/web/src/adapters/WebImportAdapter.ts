/**
 * Web用ImportAdapter
 *
 * @description
 * インポート処理で必要なプラットフォーム固有の機能を提供。
 * shared層のImportServiceから呼び出される。
 *
 * OPFS (Origin Private File System) を使用して一時ファイルを管理。
 * これによりMobileと同様のファイルパスベースのロジックが使用可能。
 *
 * @module WebImportAdapter
 */

import { type ImportAdapter, type FileIOAdapter, getMainDbAdapter, toOpfsPath } from '@cliptap/shared';
import type { WebFileIOAdapter } from './WebFileIOAdapter';
import type { WebDatabaseAdapter } from './WebDatabaseAdapter';
import { base64ToUint8Array } from '@utils/base64';

/**
 * Web用ImportAdapter実装クラス
 */
export class WebImportAdapter implements ImportAdapter {
  private fileIO: FileIOAdapter;

  constructor(fileIO: FileIOAdapter) {
    this.fileIO = fileIO;
  }

  /**
   * インポートファイルを読み込む
   * WebではOPFSパスからテキストを読み取る
   */
  async readImportFile(fileUri: string): Promise<string> {
    return await this.fileIO.readFile(fileUri);
  }

  /**
   * 一時データベースファイルを作成
   * OPFSにBase64をデコードして保存
   *
   * @returns OPFSパス（opfs://filename）
   */
  async writeTempDatabase(fileName: string, base64Data: string): Promise<string> {
    const bytes = base64ToUint8Array(base64Data);
    /* OPFSパスを生成してファイルを書き込み */
    const opfsPath = toOpfsPath(fileName);
    await (this.fileIO as WebFileIOAdapter).writeBytes(opfsPath, bytes);
    return opfsPath;
  }

  /**
   * 本番データベースのパス（Blob URL）を取得
   * WebではメモリDBからBlobを作成してURLを返す
   */
  async getDatabasePath(): Promise<string> {
    const mainDbAdapter = getMainDbAdapter() as WebDatabaseAdapter;
    const data = mainDbAdapter.exportDatabase();
    const blob = new Blob([data.buffer as ArrayBuffer], { type: 'application/octet-stream' });
    return URL.createObjectURL(blob);
  }

  /**
   * ファイルをコピー
   * OPFSまたはBlob URL間でコピー
   */
  async copyFile(source: string, destination: string): Promise<void> {
    await (this.fileIO as WebFileIOAdapter).copyFile(source, destination);
  }

  /**
   * ファイルを削除
   * OPFSまたはBlob URLを削除
   */
  async deleteFile(path: string): Promise<void> {
    await (this.fileIO as WebFileIOAdapter).deleteFile(path);
  }
}
