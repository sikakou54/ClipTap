/**
 * Mobile用ImportAdapter
 *
 * @description
 * インポート処理で必要なプラットフォーム固有の機能を提供。
 * shared層のImportServiceから呼び出される。
 *
 * @module MobileImportAdapter
 */

import { type ImportAdapter, type FileIOAdapter } from '@cliptap/shared';

export class MobileImportAdapter implements ImportAdapter {
  private fileIO: FileIOAdapter;

  constructor(fileIO: FileIOAdapter) {
    this.fileIO = fileIO;
  }

  async readImportFile(fileUri: string): Promise<string> {
    return await this.fileIO.readFile(fileUri);
  }

  /**
   * 一時データベースファイルを作成
   *
   * @returns file://プレフィックスなしのパス
   */
  async writeTempDatabase(fileName: string, base64Data: string): Promise<string> {
    const fileUri = await this.fileIO.writeFile(fileName, base64Data, { encoding: 'base64' });
    return fileUri.replace('file://', '');
  }

  async deleteFile(path: string): Promise<void> {
    await this.fileIO.deleteFile(path);
  }

  /**
   * インポート元ファイル（キャッシュ内）を削除
   */
  async deleteImportSourceFile(fileUri: string): Promise<void> {
    try {
      await this.fileIO.deleteFile(fileUri);
    } catch {
      /* 削除失敗は無視（DocumentPickerがキャッシュを管理するため） */
    }
  }
}
