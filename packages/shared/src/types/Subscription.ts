/**
 * サブスクリプション関連のドメインモデル
 *
 * @remarks
 * - RevenueCatなどの外部SDKに依存しない、アプリ固有の型定義
 * - プラットフォーム間でのデータ共有に使用
 */

import { z } from 'zod';

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
 * - ClipTap API（apps/api）がクライアントへ返すJSONの型でもある。
 *   API側はこの定義を型として再エクスポートするだけで、独自の手写し定義を持たない
 */
export interface SubscriptionStatus {
  /** Proプラン契約中かどうか */
  isSubscribed: boolean;
  /** 有効期限（ISO8601）。無期限購入・未加入の場合は null */
  expirationDate: string | null;
  /** 有効な商品識別子。未加入の場合は null */
  activePlanId: string | null;
  /** 次回自動更新されるかどうか */
  willRenew: boolean;
  /** ストアの購読管理画面URL */
  managementURL: string | null;
}

/**
 * サブスクリプション状態の形状検証スキーマ
 *
 * @remarks
 * ClipTap API（Cloudflare Worker）の応答を実行時に検証するために使う。
 * SubscriptionStatus と構造が乖離した場合は型エラーになるため、片方だけの変更を防げる。
 */
export const SubscriptionStatusSchema: z.ZodType<SubscriptionStatus> = z.object({
  isSubscribed: z.boolean(),
  expirationDate: z.string().nullable(),
  activePlanId: z.string().nullable(),
  willRenew: z.boolean(),
  managementURL: z.string().nullable(),
});

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

