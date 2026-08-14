/**
 * エクスポートサービス
 *
 * @description
 * プラットフォーム共通のエクスポートロジックを提供する。
 * プラットフォーム固有の処理はExportAdapter経由で注入。
 *
 * @module ExportService
 */

import { getExportAdapter, hasExportAdapter } from '../adapters/ExportAdapter';
import { getCryptoAdapter, type CryptoAdapter } from '../adapters/CryptoAdapter';
import { getFileIOAdapter } from '../adapters/FileIOAdapter';
import { getTempDbAdapter, hasTempDbAdapter } from '../adapters/DbAdapter';
import {
  buildPasswordHashInput,
  buildChecksumPayload,
  base64ToDoubleBase64,
} from '../utils/exportImportUtils';
import { SCHEMA_VERSION } from '../database/schema';
import { Logger } from '../utils/logger';
import {
  DatabasePathNotFoundError,
  ExportFailedError,
} from '../errors';
import { ExportMapper, type ExportSelection } from '../mappers/ExportMapper';

/**
 * エクスポート実行結果（内部型）
 */
interface ExportExecutionResult {
  filePath: string;
}

/**
 * エクスポートデータ形式（内部型）
 */
interface ExportData {
  /** スキーマバージョン */
  s: number;
  /** エクスポート日時（ISO 8601） */
  t: string;
  /** パスワードハッシュ（SHA-256） */
  h: string;
  /** データ（二重Base64エンコード） */
  d: string;
  /** チェックサム（SHA-256） */
  c: string;
}

/**
 * エクスポートサービスクラス
 *
 * @description
 * プラットフォーム共通のエクスポートロジックを提供。
 * ExportAdapterを使用してプラットフォーム固有の処理を実行。
 * すべて静的メソッドで提供。
 */
export class ExportService {
  private static get crypto(): CryptoAdapter {
    return getCryptoAdapter();
  }

  /**
   * 共通のエクスポートデータ構築ロジック
   *
   * @param doubleBase64 - 二重Base64エンコード済みのデータベースバイナリ
   * @param password - エクスポートに使用するパスワード
   * @returns エクスポートファイルへ書き出すJSON文字列
   */
  private static async buildExportData(doubleBase64: string, password: string): Promise<string> {
    const exportDate = new Date().toISOString();

    const passwordHash = await ExportService.crypto.sha256(
      buildPasswordHashInput(password, SCHEMA_VERSION)
    );

    const dataToHash = buildChecksumPayload({
      s: SCHEMA_VERSION,
      t: exportDate,
      h: passwordHash,
      d: doubleBase64,
    });

    const checksum = await ExportService.crypto.sha256(dataToHash);

    const data: ExportData = {
      s: SCHEMA_VERSION,
      t: exportDate,
      h: passwordHash,
      d: doubleBase64,
      c: checksum,
    };

    return JSON.stringify(data);
  }

  /**
   * Base64文字列形式のデータベースからエクスポートデータを作成（内部メソッド）
   *
   * @param dbBase64 - SQLiteデータベースのBase64文字列
   * @param password - エクスポートに使用するパスワード
   * @returns エクスポートファイルへ書き出すJSON文字列
   */
  private static async createExportDataFromBase64(dbBase64: string, password: string): Promise<string> {
    const doubleBase64 = base64ToDoubleBase64(dbBase64);
    return ExportService.buildExportData(doubleBase64, password);
  }

  /**
   * タイムスタンプ付きのエクスポートファイル名を生成
   *
   * @returns ファイル名（例: export_20251210143025.cliptap）
   */
  static generateFilename(): string {
    const now = new Date();
    const timestamp = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, '0'),
      String(now.getDate()).padStart(2, '0'),
      String(now.getHours()).padStart(2, '0'),
      String(now.getMinutes()).padStart(2, '0'),
      String(now.getSeconds()).padStart(2, '0'),
    ].join('');

    return `export_${timestamp}.cliptap`;
  }

  /**
   * データベース全体をエクスポート
   *
   * @param password - エクスポートに使用するパスワード
   * @returns エクスポート結果（ファイルパス）
   * @throws DatabasePathNotFoundError データベースファイルが存在しない場合
   * @throws ExportFailedError エクスポートに失敗した場合
   */
  static async exportDatabase(password: string): Promise<ExportExecutionResult> {
    if (!hasExportAdapter()) {
      throw new Error('ExportAdapter is required for exportDatabase. Call setExportAdapter() first.');
    }

    const adapter = getExportAdapter();
    const fileIO = getFileIOAdapter();

    try {
      Logger.info('[ExportService] Starting database export...');

      const dbPath = await adapter.getDatabasePath();
      if (!(await fileIO.exists(dbPath))) {
        throw new DatabasePathNotFoundError('Database file does not exist');
      }

      Logger.info(`[ExportService] Database file found: ${dbPath}`);

      const dbFileBase64 = await fileIO.readBinary(dbPath);
      Logger.info(`[ExportService] Database file loaded (${dbFileBase64.length} chars)`);

      const json = await ExportService.createExportDataFromBase64(dbFileBase64, password);
      const exportFileName = ExportService.generateFilename();

      Logger.info(`[ExportService] Export data created, filename: ${exportFileName}`);

      const exportFileUri = await adapter.saveExportFile(exportFileName, json);

      Logger.info(`[ExportService] Export file created: ${exportFileUri}`);

      return { filePath: exportFileUri };
    } catch (error) {
      Logger.error('[ExportService] Export failed:', error);
      if (error instanceof DatabasePathNotFoundError) {
        throw error;
      }
      throw new ExportFailedError(
        error instanceof Error ? error.message : 'Unknown error',
        error
      );
    }
  }

  /**
   * 選択されたデータのみをエクスポート（部分エクスポート）
   *
   * @param password - エクスポートに使用するパスワード
   * @param selection - エクスポートするデータのID選択
   * @returns エクスポート結果（ファイルパス）
   * @throws ExportFailedError エクスポートに失敗した場合
   */
  static async exportSelectedData(
    password: string,
    selection: ExportSelection
  ): Promise<ExportExecutionResult> {
    if (!hasExportAdapter()) {
      throw new Error('ExportAdapter is required for exportSelectedData. Call setExportAdapter() first.');
    }
    if (!hasTempDbAdapter()) {
      throw new Error('TempDbAdapter is required for exportSelectedData. Call setTempDbAdapter() first.');
    }

    const adapter = getExportAdapter();
    const fileIO = getFileIOAdapter();
    const tempDbAdapter = getTempDbAdapter();

    let tempDbPath: string | null = null;

    try {
      Logger.info('[ExportService] Starting partial export');

      tempDbPath = await adapter.createTempDbFile();
      await tempDbAdapter.open?.(tempDbPath);

      /* 選択されていないデータを削除してフィルタリング */
      const exportMapper = new ExportMapper(tempDbAdapter);
      exportMapper.deleteUnselectedData(selection);

      if (!tempDbAdapter.exportAsBase64) {
        throw new Error('TempDbAdapter.exportAsBase64 is required for exportSelectedData.');
      }
      const filteredDbBase64 = await tempDbAdapter.exportAsBase64();
      Logger.info(`[ExportService] Filtered DB loaded (${filteredDbBase64.length} chars)`);

      tempDbAdapter.close?.();

      const json = await this.createExportDataFromBase64(filteredDbBase64, password);
      const exportFileName = this.generateFilename();

      Logger.info(`[ExportService] Export data created, filename: ${exportFileName}`);

      const exportFileUri = await adapter.saveExportFile(exportFileName, json);

      Logger.info(`[ExportService] Export file created: ${exportFileUri}`);

      return { filePath: exportFileUri };
    } catch (error) {
      Logger.error('[ExportService] Partial export failed:', error);
      throw new ExportFailedError(
        error instanceof Error ? error.message : 'Unknown error',
        error
      );
    } finally {
      if (tempDbPath) {
        fileIO.deleteFile(tempDbPath).catch(() => { });
      }
    }
  }
}
