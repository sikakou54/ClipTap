/**
 * インポートパーサーサービス
 *
 * @description
 * プラットフォーム共通のインポート検証ロジックを提供する。
 * プラットフォーム固有のハッシュ処理はアダプター経由で注入。
 *
 * @module ImportParserService
 */

import { getCryptoAdapter, type CryptoAdapter } from '../adapters/CryptoAdapter';
import { ClipTapExportDataSchema, type ClipTapExportData } from '../schema';
import {
  buildPasswordHashInput,
  buildChecksumPayload,
  decodeDoubleBase64ToUint8Array,
} from '../utils/exportImportUtils';
import { MIN_SUPPORTED_SCHEMA_VERSION, SCHEMA_VERSION } from '../database/schema';
import {
  ChecksumMismatchError,
  NewerVersionError,
  IncorrectPasswordError,
  InvalidFileFormatError,
  VersionMismatchError,
} from '../errors';

/** SQLiteファイルの固定ヘッダー */
const SQLITE_HEADER = new Uint8Array([
  0x53, 0x51, 0x4c, 0x69, 0x74, 0x65, 0x20, 0x66,
  0x6f, 0x72, 0x6d, 0x61, 0x74, 0x20, 0x33, 0x00,
]);

/** デコード結果がSQLiteファイルか判定 */
function hasSqliteHeader(bytes: Uint8Array): boolean {
  return bytes.length >= SQLITE_HEADER.length
    && SQLITE_HEADER.every((byte, index) => bytes[index] === byte);
}

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
 * ハッシュアダプターはsetAllAdaptersで設定済みのものを使用。
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
    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(jsonText);
    } catch {
      throw new InvalidFileFormatError();
    }

    const parseResult = ClipTapExportDataSchema.safeParse(parsedJson);
    if (!parseResult.success) {
      throw new InvalidFileFormatError();
    }
    const data = parseResult.data;

    /* Step 2: スキーマバージョンチェック */
    /* ファイルバージョンが現在のスキーマより大きい場合はアプリ更新が必要 */
    if (data.s > SCHEMA_VERSION) {
      throw new NewerVersionError(SCHEMA_VERSION, data.s);
    }
    if (data.s < MIN_SUPPORTED_SCHEMA_VERSION) {
      throw new VersionMismatchError(MIN_SUPPORTED_SCHEMA_VERSION, data.s);
    }

    /* Step 3: パスワードハッシュ検証 */
    const passwordHash = await this.crypto.sha256(buildPasswordHashInput(password, data.s));
    if (passwordHash !== data.h) {
      throw new IncorrectPasswordError();
    }

    /* Step 4: チェックサム検証（データ改竄チェック） */
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

    /* Step 5: バイナリデコード（二重Base64デコード → SQLiteバイナリ） */
    let dbBytes: Uint8Array;
    try {
      dbBytes = decodeDoubleBase64ToUint8Array(data.d);
    } catch {
      throw new InvalidFileFormatError();
    }
    if (!hasSqliteHeader(dbBytes)) {
      throw new InvalidFileFormatError();
    }

    return {
      success: true,
      dbBytes,
      exportData: data,
    };
  }
}
