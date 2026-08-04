/**
 * サブスクリプション関連の定数
 *
 * @description
 * Web版のプラン判定で使用する設定値を一元管理。
 * プラン判定は ClipTap API（Cloudflare Worker）経由で行うため、
 * 課金プロバイダの認証情報はブラウザ側に一切保持しない。
 */

/**
 * ClipTap API のベースURL
 * 環境変数 VITE_API_BASE_URL で指定する（未設定の場合は無料プランとして扱う）
 */
export const SUBSCRIPTION_API_BASE_URL: string =
  import.meta.env.VITE_API_BASE_URL ?? '';
