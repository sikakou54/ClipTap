import { getMainDbAdapter, type DbAdapter } from '../adapters/DbAdapter';
import {
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
 */
export class SystemVariableFormatMapper {
  static getAll(): SystemVariableFormats {
    return this.getAllFrom(getMainDbAdapter());
  }

  static getAllFrom(db: DbAdapter): SystemVariableFormats {
    if (!db.get<{ name: string }>(SystemVariableFormatQueries.SELECT_TABLE)) return {};
    return toFormats(db.all<SystemVariableFormatRow>(SystemVariableFormatQueries.SELECT_ALL));
  }

  static loadRegistry(): SystemVariableFormats {
    const formats = this.getAll();
    SystemVariableFormatRegistry.replace(formats);
    return formats;
  }

  static upsert(variableKey: SystemVariableKey, pattern: string): void {
    if (!isValidSystemVariableFormat(variableKey, pattern)) {
      throw new Error(`Invalid system variable format for ${variableKey}`);
    }

    getMainDbAdapter().run(SystemVariableFormatQueries.UPSERT, [
      variableKey,
      pattern,
      getCurrentTimestamp(),
    ]);
    this.loadRegistry();
  }

  static delete(variableKey: SystemVariableKey): void {
    getMainDbAdapter().run(SystemVariableFormatQueries.DELETE_BY_KEY, [variableKey]);
    this.loadRegistry();
  }

  static deleteAll(): void {
    getMainDbAdapter().run(SystemVariableFormatQueries.DELETE_ALL);
    SystemVariableFormatRegistry.clear();
  }

  static replaceAll(nextFormats: SystemVariableFormats): void {
    const db = getMainDbAdapter();
    db.transaction(() => {
      db.run(SystemVariableFormatQueries.DELETE_ALL);
      for (const [variableKey, pattern] of Object.entries(nextFormats)) {
        if (!isValidSystemVariableFormat(variableKey as SystemVariableKey, pattern)) continue;
        db.run(SystemVariableFormatQueries.UPSERT, [
          variableKey,
          pattern,
          getCurrentTimestamp(),
        ]);
      }
    });
    this.loadRegistry();
  }

  /** 呼び出し側のトランザクション内で、日時を含めて逐語復元する。 */
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
