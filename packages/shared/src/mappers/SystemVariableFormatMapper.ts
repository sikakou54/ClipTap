/**
 * SystemVariableFormatMapper
 *
 * @description
 * システム変数（日付・時刻など）の書式設定を system_variable_formats テーブルへ永続化する。
 * SystemVariableFormatRegistry（メモリ上のキャッシュ）との同期は書き込み系メソッドごとに異なる。
 * - upsert / delete: 処理後に loadRegistry() でDBから読み直す。
 * - deleteAll: DBから読み直さず Registry.clear() でキャッシュを空にする。
 * - restoreAllWithinTransaction: Registryを更新しない。呼び出し元がコミット後に同期する。
 *
 * @module SystemVariableFormatMapper
 */

import { getMainDbAdapter, type DbAdapter } from '../adapters/DbAdapter';
import {
  isSupportedSystemVariablePattern,
  isValidSystemVariableFormat,
  type SystemVariableFormats,
  type SystemVariableKey,
} from '../constants/systemVariableFormats';
import { SystemVariableFormatRegistry } from '../services/SystemVariableFormatRegistry';
import { getCurrentTimestamp } from '../utils/dateHelpers';

export interface SystemVariableFormatRow {
  variableKey: string;
  pattern: string;
  updatedAt: string;
}

const SystemVariableFormatQueries = {
  SELECT_TABLE: `
    SELECT name FROM sqlite_master
    WHERE type = 'table' AND name = 'system_variable_formats'
  `,
  SELECT_ALL: 'SELECT variableKey, pattern, updatedAt FROM system_variable_formats',
  UPSERT: `
    INSERT INTO system_variable_formats (variableKey, pattern, updatedAt)
    VALUES (?, ?, ?)
    ON CONFLICT(variableKey) DO UPDATE SET pattern = excluded.pattern, updatedAt = excluded.updatedAt
  `,
  DELETE_BY_KEY: 'DELETE FROM system_variable_formats WHERE variableKey = ?',
  DELETE_ALL: 'DELETE FROM system_variable_formats',
};

const toFormats = (rows: SystemVariableFormatRow[]): SystemVariableFormats => {
  const formats: SystemVariableFormats = {};

  for (const row of rows) {
    if (isValidSystemVariableFormat(row.variableKey, row.pattern)) {
      formats[row.variableKey] = row.pattern;
    }
  }

  return formats;
};

/**
 * システム変数の書式設定を扱うMapperです。
 *
 * @description
 * system_variable_formats テーブルに対するCRUD操作を提供する静的メソッド群。
 */
export class SystemVariableFormatMapper {
  /**
   * メインDBに保存されている書式設定を取得
   * @returns 変数キーと書式パターンの対応
   */
  static getAll(): SystemVariableFormats {
    return this.getAllFrom(getMainDbAdapter());
  }

  /**
   * 指定したアダプターのDBから書式設定を取得
   * @param db - 読み取り対象のDBアダプター
   * @returns 変数キーと書式パターンの対応（テーブル自体が存在しないDBでは空オブジェクト）
   */
  private static getAllFrom(db: DbAdapter): SystemVariableFormats {
    if (!db.get<{ name: string }>(SystemVariableFormatQueries.SELECT_TABLE)) return {};
    return toFormats(db.all<SystemVariableFormatRow>(SystemVariableFormatQueries.SELECT_ALL));
  }

  /**
   * DBから書式設定を読み直し、Registryの内容を置き換える
   * @returns 読み込んだ書式設定
   * @description
   * アプリ起動時のDB初期化（apps/mobile/src/database/database.ts、apps/web/src/database/database.ts）と、
   * 書式設定を表示・変更する画面から呼ばれる。
   */
  static loadRegistry(): SystemVariableFormats {
    const formats = this.getAll();
    SystemVariableFormatRegistry.replace(formats);
    return formats;
  }

  /**
   * 書式設定を登録または更新する
   * @param variableKey - システム変数のキー
   * @param pattern - 書式パターン
   * @description
   * サポート外のパターンはDBへ書き込まずErrorを投げる。
   * 書き込み後はloadRegistry()でRegistryをDBの内容へ合わせる。
   */
  static upsert(variableKey: SystemVariableKey, pattern: string): void {
    if (!isSupportedSystemVariablePattern(variableKey, pattern)) {
      throw new Error(`Invalid system variable format for ${variableKey}`);
    }

    getMainDbAdapter().run(SystemVariableFormatQueries.UPSERT, [
      variableKey,
      pattern,
      getCurrentTimestamp(),
    ]);
    this.loadRegistry();
  }

  /**
   * 指定した変数キーの書式設定を削除する
   * @param variableKey - システム変数のキー
   * @description
   * 削除後はloadRegistry()でRegistryをDBの内容へ合わせる。
   */
  static delete(variableKey: SystemVariableKey): void {
    getMainDbAdapter().run(SystemVariableFormatQueries.DELETE_BY_KEY, [variableKey]);
    this.loadRegistry();
  }

  /**
   * 書式設定を全件削除する
   * @description
   * upsert / delete と異なりloadRegistry()でDBを読み直さず、
   * Registry.clear()でメモリ上のキャッシュを空にする。
   */
  static deleteAll(): void {
    getMainDbAdapter().run(SystemVariableFormatQueries.DELETE_ALL);
    SystemVariableFormatRegistry.clear();
  }

  /**
   * 呼び出し側のトランザクション内で、日時を含めて逐語復元する。
   * @param rows - 復元する書式設定の行（不正なパターンの行は読み飛ばす）
   * @description
   * このメソッドはRegistryを更新しない。呼び出し元のImportService（全復元）が
   * トランザクションのコミット後にloadRegistry()を呼ぶ。
   */
  static restoreAllWithinTransaction(rows: SystemVariableFormatRow[]): void {
    const db = getMainDbAdapter();
    db.run(SystemVariableFormatQueries.DELETE_ALL);
    for (const row of rows) {
      if (!isValidSystemVariableFormat(row.variableKey, row.pattern)) continue;
      db.run(SystemVariableFormatQueries.UPSERT, [
        row.variableKey,
        row.pattern,
        row.updatedAt,
      ]);
    }
  }
}
