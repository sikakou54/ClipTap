import type { SystemVariableFormats } from '../constants/systemVariableFormats';

let formats: SystemVariableFormats = {};

/**
 * 同期展開経路が参照するシステム変数書式のメモリキャッシュです。
 */
export class SystemVariableFormatRegistry {
  static getAll(): SystemVariableFormats {
    return { ...formats };
  }

  static replace(nextFormats: SystemVariableFormats): void {
    formats = { ...nextFormats };
  }

  static clear(): void {
    formats = {};
  }
}
