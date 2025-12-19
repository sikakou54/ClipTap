/**
 * インポートパーサーサービス
 *
 * @description
 * プラットフォーム共通のインポート検証ロジックを提供する。
 * プラットフォーム固有の処理（暗号化）はアダプター経由で注入。
 *
 * @module ImportParserService
 */

import { getCryptoAdapter, type CryptoAdapter } from '../adapters/CryptoAdapter';
import type { ClipTapExportData } from '../schema';
import {
  buildPasswordHashInput,
  buildChecksumPayload,
  decodeDoubleBase64ToUint8Array,
} from '../utils/exportImportUtils';
import { SCHEMA_VERSION } from '../database/schema';
import {
  ChecksumMismatchError,
  NewerVersionError,
  IncorrectPasswordError,
  InvalidFileFormatError,
} from '../errors';

/**
 * 検証結果
 */
export interface ValidationResult {
  /** 検証成功フラグ */
  success: true;
  /** デコードされたSQLiteバイナリ */
  dbBytes: Uint8Array;
  /** エクスポートデータ */
  exportData: ClipTapExportData;
}

/**
 * インポートパーサーサービスクラス
 *
 * @description
 * プラットフォーム共通のインポート検証ロジックを提供。
 * 暗号化アダプターはsetAllAdaptersで設定済みのものを使用。
 */
export class ImportParserService {
  constructor() {
    /* 依存関係はsetAllAdaptersで設定済み */
  }

  private get crypto(): CryptoAdapter {
    return getCryptoAdapter();
  }

  /**
   * ファイル名が.cliptap拡張子を持つか判定
   *
   * @param filename - ファイル名
   * @returns .cliptapファイルの場合true
   */
  isClipTapFile(filename: string): boolean {
    return filename.endsWith('.cliptap');
  }

  /**
   * JSONテキストを解析・検証してSQLiteバイナリを取得
   *
   * @param jsonText - .cliptapファイルのJSONテキスト
   * @param password - パスワード
   * @returns 検証結果
   * @throws {InvalidFileFormatError} JSONパースに失敗した場合
   * @throws {NewerVersionError} ファイルバージョンが現在のスキーマより新しい場合
   * @throws {IncorrectPasswordError} パスワードが間違っている場合
   * @throws {ChecksumMismatchError} チェックサムが一致しない場合
   */
  async parseAndValidate(jsonText: string, password: string): Promise<ValidationResult> {
    /* Step 1: JSONパース */
    let data: ClipTapExportData;
    try {
      data = JSON.parse(jsonText);
    } catch {
      throw new InvalidFileFormatError();
    }

    /* Step 2: スキーマバージョンチェック */
    /* ファイルバージョンが現在のスキーマより大きい場合はアプリ更新が必要 */
    if (data.s > SCHEMA_VERSION) {
      throw new NewerVersionError(SCHEMA_VERSION, data.s);
    }

    /* Step 3: パスワードハッシュ検証 */
    const passwordHash = await this.crypto.sha256(buildPasswordHashInput(password, data.s));
    if (passwordHash !== data.h) {
      throw new IncorrectPasswordError();
    }

    /* Step 4: チェックサム検証（データ改竄チェック） */
    if (data.c) {
      const dataToHash = buildChecksumPayload({
        s: data.s,
        t: data.t,
        h: data.h,
        d: data.d,
      });
      const calculatedChecksum = await this.crypto.sha256(dataToHash);
      if (calculatedChecksum !== data.c) {
        throw new ChecksumMismatchError();
      }
    }

    /* Step 5: バイナリデコード（二重Base64デコード → SQLiteバイナリ） */
    const dbBytes = decodeDoubleBase64ToUint8Array(data.d);

    return {
      success: true,
      dbBytes,
      exportData: data,
    };
  }

  /**
   * SHA-256ハッシュを計算（エクスポート用に公開）
   *
   * @param input - ハッシュ対象の文字列
   * @returns ハッシュ値
   */
  async calculateSHA256(input: string): Promise<string> {
    return this.crypto.sha256(input);
  }

  /**
   * 現在のスキーマバージョンを取得
   *
   * @returns スキーマバージョン
   */
  getSchemaVersion(): number {
    return SCHEMA_VERSION;
  }
}
