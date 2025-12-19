/**
 * 認証エラー処理ユーティリティ
 *
 * @module authErrors
 * @remarks
 * Google/Apple Sign-Inのエラー判定・ハンドリングを標準化。
 * Mobile/Web両方で共通利用可能。
 *
 * 主な機能:
 * - ユーザーキャンセルの検出（エラーメッセージを表示しない）
 * - エラーコードの定数化
 * - i18nキーの自動解決
 */

/**
 * 認証エラーコード定数
 *
 * @remarks
 * 各プロバイダー固有のエラーコードを定数化。
 * AuthServiceでエラーをスローする際に使用。
 */
export const AUTH_ERROR_CODES = {
  /** Googleサインイン: ユーザーキャンセル */
  GOOGLE_CANCELLED: 'GOOGLE_SIGN_IN_CANCELLED',
  /** Googleサインイン: 失敗 */
  GOOGLE_FAILED: 'GOOGLE_SIGN_IN_FAILED',
  /** Appleサインイン: ユーザーキャンセル */
  APPLE_CANCELLED: 'ERR_REQUEST_CANCELED',
  /** Appleサインイン: Androidで非サポート */
  APPLE_NOT_SUPPORTED: 'APPLE_SIGN_IN_NOT_SUPPORTED_ON_ANDROID',
  /** Appleサインイン: 失敗 */
  APPLE_FAILED: 'APPLE_SIGN_IN_FAILED',
} as const;

const CANCEL_KEYWORDS = ['CANCELLED', 'cancelled', 'CANCEL', 'cancel'];
const CANCEL_CODES = ['ERR_REQUEST_CANCELED', 'ERR_CANCELED'];

/**
 * ユーザーがキャンセルした認証エラーかどうかを判定
 *
 * @param error - 判定対象のエラー
 * @returns ユーザーキャンセルの場合true
 * @remarks
 * キャンセルの場合はエラーメッセージを表示する必要がないため、
 * この関数で事前にチェックする。
 *
 * 判定基準:
 * 1. エラーコードがCANCEL_CODESに含まれる
 * 2. エラーメッセージにCANCEL_KEYWORDSが含まれる
 */
export function isAuthCancelledError(error: unknown): boolean {
  if (!error) return false;

  const errorObj = error as { message?: string; code?: string } | null;
  const errorMessage = errorObj?.message || String(error);
  const errorCode = errorObj?.code || '';

  if (CANCEL_CODES.includes(errorCode)) {
    return true;
  }

  return CANCEL_KEYWORDS.some((keyword) => errorMessage.includes(keyword));
}

/**
 * 認証エラーのi18nメッセージキーを取得
 *
 * @param error - 判定対象のエラー
 * @returns i18nキー、キャンセルの場合はnull（メッセージ不要）
 * @remarks
 * キャンセルの場合はユーザーが意図的にキャンセルしたため、
 * エラーメッセージは不要。nullを返してメッセージ表示をスキップ。
 */
export function getAuthErrorMessageKey(error: unknown): string | null {
  if (isAuthCancelledError(error)) {
    return null;
  }
  return 'error.account_auth_failed_message';
}
