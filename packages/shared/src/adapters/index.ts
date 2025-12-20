/**
 * Adaptersモジュール エクスポート
 *
 * @description
 * packages/shared/src/adapters/ 配下のすべてのアダプター型・関数を再エクスポート。
 * Mobile/Webアプリからは `import { ... } from '@shared/adapters'` で利用可能。
 *
 * @module adapters
 */

/* ======================================== */
/* SubscriptionAdapter（サブスクリプション管理） */
/* ======================================== */
export type { SubscriptionAdapter, SubscriptionListener } from './SubscriptionAdapter';
export {
  setSubscriptionAdapter,
  type SubscriptionAdapterOptions,
  setAllAdapters,
  type AllAdapters,
  type SetAllAdaptersOptions,
} from './AdapterRegistry';

/* ======================================== */
/* AuthAdapter（認証） */
/* ======================================== */
export {
  type AuthAdapter,
  type AuthStateListener,
  setAuthAdapter,
  getAuthAdapter,
  hasAuthAdapter,
} from './AuthAdapter';

/* ======================================== */
/* CryptoAdapter（暗号化処理） */
/* ======================================== */
export {
  type CryptoAdapter,
  setCryptoAdapter,
  getCryptoAdapter,
  hasCryptoAdapter,
} from './CryptoAdapter';

/* ======================================== */
/* DbAdapter（データベース操作） */
/* ======================================== */
export {
  type DbAdapter,
  type DbRunResult,
  setMainDbAdapter,
  getMainDbAdapter,
  hasMainDbAdapter,
  setSystemDbAdapter,
  getSystemDbAdapter,
  hasSystemDbAdapter,
  setTempDbAdapter,
  getTempDbAdapter,
  hasTempDbAdapter,
} from './DbAdapter';

/* ======================================== */
/* ClipboardAdapter（クリップボード操作） */
/* ======================================== */
export {
  type ClipboardAdapter,
  setClipboardAdapter,
  getClipboardAdapter,
  hasClipboardAdapter,
} from './ClipboardAdapter';

/* ======================================== */
/* FileIOAdapter（ファイル入出力操作） */
/* ======================================== */
export {
  type FileIOAdapter,
  type FileInfo,
  setFileIOAdapter,
  getFileIOAdapter,
  hasFileIOAdapter,
} from './FileIOAdapter';

/* ======================================== */
/* FileShareAdapter（ファイル共有） */
/* ======================================== */
export {
  type FileShareAdapter,
  setFileShareAdapter,
  getFileShareAdapter,
  hasFileShareAdapter,
} from './FileShareAdapter';

/* ======================================== */
/* FilePickerAdapter（ファイル選択） */
/* ======================================== */
export {
  type FilePickerAdapter,
  type FilePickOptions,
  type FilePickResult,
  setFilePickerAdapter,
  getFilePickerAdapter,
  hasFilePickerAdapter,
} from './FilePickerAdapter';

/* ======================================== */
/* LocaleAdapter（ロケール・言語設定） */
/* ======================================== */
export {
  type LocaleAdapter,
  setLocaleAdapter,
  getLocaleAdapter,
  hasLocaleAdapter,
} from './LocaleAdapter';

/* ======================================== */
/* I18nAdapter（i18n翻訳機能） */
/* ======================================== */
export {
  type I18nAdapter,
  type LanguageChangeListener,
  setI18nAdapter,
  getI18nAdapter,
  hasI18nAdapter,
} from './I18nAdapter';

/* ======================================== */
/* ExportAdapter（エクスポート処理） */
/* ======================================== */
export {
  type ExportAdapter,
  setExportAdapter,
  getExportAdapter,
  hasExportAdapter,
} from './ExportAdapter';

/* ======================================== */
/* ImportAdapter（インポート処理） */
/* ======================================== */
export {
  type ImportAdapter,
  setImportAdapter,
  getImportAdapter,
  hasImportAdapter,
} from './ImportAdapter';

