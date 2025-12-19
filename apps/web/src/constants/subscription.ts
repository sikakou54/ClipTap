/**
 * サブスクリプション関連の定数
 *
 * @description
 * RevenueCat Web SDKで使用する設定値を一元管理。
 * SubscriptionServiceとWebSubscriptionAdapterで共有。
 */

/**
 * RevenueCat Web Billing Public API Key
 * 環境変数VITE_REVENUECAT_API_KEYが設定されていればそれを使用、なければデフォルト値
 */
export const REVENUECAT_API_KEY =
  import.meta.env.VITE_REVENUECAT_API_KEY || 'rcb_qcMuaWWCINBBdlypjHaNQwHsStkh';

/**
 * Proプランの権限（Entitlement）識別子
 * RevenueCatダッシュボードで設定した値と一致させる必要がある
 */
export const ENTITLEMENT_ID = 'Pro';
