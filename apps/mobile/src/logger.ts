/**
 * @module logger
 * @description
 * 構造化されたログシステム（Mobile版）
 *
 * 共通Loggerを使用し、React Nativeの__DEV__で環境判定を行う。
 * エモジ付きのログ出力で視認性を向上。
 */

import { initializeLogger, Logger } from '@cliptap/shared';

/* ======================================== */
/* 環境判定 */
/* ======================================== */

/**
 * 開発環境かどうかを判定
 *
 * React Nativeの__DEV__グローバル変数を使用。
 * __DEV__が定義されていない場合はfalse（本番環境）とみなす。
 */
const isDevelopment = typeof __DEV__ !== 'undefined' ? __DEV__ : false;

/* ======================================== */
/* Logger初期化 */
/* ======================================== */

/**
 * Loggerを初期化
 *
 * 設定:
 * - isDevelopment: 開発環境かどうか（開発環境のみログ出力）
 * - useEmoji: エモジを使用するか（視認性向上のため有効）
 */
/*
 * isDevelopment: 開発環境判定フラグ
 * useEmoji: エモジ有効化（例: 🐛 debug, ℹ️ info, ⚠️ warn, ❌ error, ✅ success）
 */
initializeLogger({
  isDevelopment,
  useEmoji: true,
});

/* ======================================== */
/* エクスポート */
/* ======================================== */

/**
 * 共通Loggerを再エクスポート
 *
 * 使用例:
 * - Logger.debug('デバッグ情報', { data });
 * - Logger.info('情報メッセージ');
 * - Logger.warn('警告メッセージ');
 * - Logger.error('エラーメッセージ', error);
 * - Logger.success('成功メッセージ');
 */
export { Logger };
