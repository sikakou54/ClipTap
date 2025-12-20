/**
 * サブスクリプション関連のドメインモデル
 *
 * @remarks
 * - RevenueCatなどの外部SDKに依存しない、アプリ固有の型定義
 * - プラットフォーム間でのデータ共有に使用
 */

/**
 * サブスクリプションプランの間隔
 */
export type SubscriptionInterval = 'month' | 'year';

/**
 * サブスクリプションプラン情報
 *
 * @remarks
 * - App Store/Play Storeの商品情報を抽象化
 * - priceStringは通貨記号付き（例: "¥1,000"）
 * - currencyCodeはISO 4217形式（例: "JPY"）
 */
export interface SubscriptionPlan {
  id: string;
  productId: string;
  priceString: string;
  currencyCode: string;
  price: number;
  interval: SubscriptionInterval;
  description?: string;
  /** RevenueCat等の元データ（デバッグ用） */
  originalObject?: unknown;
}

/**
 * サブスクリプションの状態
 *
 * @remarks
 * - expirationDate, activePlanIdはnull許容（未加入の場合null）
 * - managementURLはプラットフォーム別のサブスク管理画面URL
 */
export interface SubscriptionStatus {
  isSubscribed: boolean;
  expirationDate: string | null;
  activePlanId: string | null;
  willRenew: boolean;
  managementURL: string | null;
}

/**
 * 購入処理の結果
 *
 * @remarks
 * - success=false かつ isCancelled=true の場合はユーザーキャンセル
 * - success=false かつ isCancelled=false の場合はエラー発生
 */
export interface PurchaseResult {
  success: boolean;
  isCancelled: boolean;
  status?: SubscriptionStatus;
  error?: string;
}

