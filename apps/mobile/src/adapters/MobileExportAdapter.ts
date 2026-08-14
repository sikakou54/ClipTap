/**
 * Mobile用ExportAdapter
 *
 * @description
 * エクスポート処理で必要なプラットフォーム固有の機能を提供。
 * shared層のExportServiceから呼び出される。
 *
 * @module MobileExportAdapter
 */

import {
  type ExportAdapter,
  type FileIOAdapter,
  type FileShareAdapter,
} from '@cliptap/shared';
import { getDatabasePath } from '@database/DatabaseFileManager';

export class MobileExportAdapter implements ExportAdapter {
  private fileIO: FileIOAdapter;
  private fileShare: FileShareAdapter;

  constructor(fileIO: FileIOAdapter, fileShare: FileShareAdapter) {
    this.fileIO = fileIO;
    this.fileShare = fileShare;
  }

  async getDatabasePath(): Promise<string> {
    return await getDatabasePath(this.fileIO);
  }

  async saveExportFile(fileName: string, content: string): Promise<string> {
    const exportFileUri = await this.fileIO.writeFile(fileName, content);

    /* Mobile: システム共有シートで保存先選択（iOS/Android標準UI） */
    /*
     * 共有シートのタイトルは仕様（docs/機能仕様書.md §8.13）でUI言語にかかわらず
     * 日本語固定と定められているため、意図的に i18next を経由しない。
     */
    await this.fileShare.shareFile(exportFileUri, 'エクスポートファイルを保存');

    await this.fileIO.deleteFile(exportFileUri).catch(() => { });

    return exportFileUri;
  }

  /**
   * 部分エクスポート用の一時データベースファイルを作成
   *
   * @returns 一時データベースファイルのパス（file://プレフィックスなし）
   */
  async createTempDbFile(): Promise<string> {
    const dbPath = await getDatabasePath(this.fileIO);

    const tempDbName = `export_temp_${new Date().getTime()}.db`;
    const cacheDir = this.fileIO.getCacheDirectory();
    const separator = cacheDir.endsWith('/') ? '' : '/';
    const tempDbPath = `${cacheDir}${separator}${tempDbName}`;
    const tempDbFullUri = `file://${tempDbPath}`;

    await this.fileIO.copyFile(dbPath, tempDbFullUri);

    return tempDbPath;
  }
}
