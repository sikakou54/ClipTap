/**
 * @module adapters
 * @description
 * Webアプリ用プラットフォーム固有アダプターのエクスポート
 * 各アダプターはsharedパッケージで定義されたインターフェースを実装し、
 * Web固有のAPI（Web Crypto API、Clipboard API、File API等）を使用する
 */

/* === Subscription（サブスクリプション管理） === */
/* RevenueCat Web SDKを使用したサブスクリプション管理アダプターをエクスポート */
export { WebSubscriptionAdapter } from './WebSubscriptionAdapter';

/* === Database（データベース操作） === */
/* sql.js（WASM SQLite）を使用したデータベース操作アダプター */
export { WebDatabaseAdapter, type WebDatabaseAdapterOptions } from './WebDatabaseAdapter';
/* データベースのキャッシュ管理（IndexedDBへの自動保存）をエクスポート */
export { webDbCacheManager, WebDbCacheManager } from './WebDbCacheManager';

/* === Crypto（暗号化処理） === */
/* Web Crypto APIを使用した暗号化アダプターをエクスポート */
export { WebCryptoAdapter } from './WebCryptoAdapter';

/* === Clipboard（クリップボード操作） === */
/* Clipboard APIを使用したクリップボード操作アダプターをエクスポート */
export { WebClipboardAdapter } from './WebClipboardAdapter';

/* === Locale（言語設定） === */
/* i18nextを使用した言語設定アダプターをエクスポート */
export { WebLocaleAdapter } from './WebLocaleAdapter';

/* === File I/O（ファイル入出力） === */
/* File API、Blob、URL APIを使用したファイル操作アダプターをエクスポート */
export { WebFileIOAdapter } from './WebFileIOAdapter';
/* ファイル共有（ダウンロード）アダプターをエクスポート */
export { WebFileShareAdapter } from './WebFileShareAdapter';
/* ファイル選択アダプターをエクスポート */
export { WebFilePickerAdapter } from './WebFilePickerAdapter';

/* === Auth（認証） === */
/* Firebase認証アダプターをエクスポート */
export { WebAuthAdapter } from './WebAuthAdapter';

/* === Shared Adapters（共通アダプター登録） === */
/* ExportAdapter - shared層のExportServiceから使用されるエクスポート処理アダプター */
export { WebExportAdapter } from './WebExportAdapter';
/* ImportAdapter - shared層のImportServiceから使用されるインポート処理アダプター */
export { WebImportAdapter } from './WebImportAdapter';

/* === SortPreference（ソート設定） === */
/* localStorageを使用したソート設定アダプターをエクスポート */
export { WebSortPreferenceAdapter } from './WebSortPreferenceAdapter';
