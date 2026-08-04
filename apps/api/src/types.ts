/**
 * ClipTap API の型定義
 *
 * @description
 * Worker のバインディング型と、RevenueCat REST API のレスポンス型、
 * クライアントへ返却するサブスクリプション状態の型を定義する。
 *
 * @module types
 */

/**
 * Worker の環境バインディング
 * vars は wrangler.toml、secret は `wrangler secret put` で設定する
 */
export interface Bindings {
  /** 実行環境識別子（production / development） */
  ENVIRONMENT: string;
  /** Firebase プロジェクトID（IDトークンの issuer / audience 検証に使用） */
  FIREBASE_PROJECT_ID: string;
  /** Proプランの Entitlement 識別子 */
  ENTITLEMENT_ID: string;
  /** RevenueCat Secret API Key（クライアントには絶対に公開しない） */
  REVENUECAT_API_KEY: string;
}

/**
 * Hono アプリケーションの環境型
 */
export type AppEnv = {
  Bindings: Bindings;
};

/**
 * RevenueCat v1 Subscribers API の Entitlement 要素
 */
export interface RevenueCatEntitlement {
  /** 有効期限（ISO8601）。null の場合は無期限（ライフタイム購入） */
  expires_date: string | null;
  /** 権限を付与している商品識別子 */
  product_identifier?: string;
}

/**
 * RevenueCat v1 Subscribers API の Subscription 要素
 */
export interface RevenueCatSubscription {
  /** 解約が検知された日時（ISO8601）。null なら自動更新が有効 */
  unsubscribe_detected_at: string | null;
}

/**
 * RevenueCat v1 Subscribers API のレスポンス
 */
export interface RevenueCatSubscriberResponse {
  subscriber?: {
    /** Entitlement 識別子をキーとするマップ */
    entitlements?: Record<string, RevenueCatEntitlement>;
    /** 商品識別子をキーとするサブスクリプションのマップ */
    subscriptions?: Record<string, RevenueCatSubscription>;
    /** ストアの購読管理画面URL */
    management_url?: string | null;
  };
}

/**
 * クライアントへ返却するサブスクリプション状態
 * shared の SubscriptionStatus と同じ構造にすることで、Web側での変換を不要にする
 */
export interface SubscriptionStatusPayload {
  /** Proプラン契約中かどうか */
  isSubscribed: boolean;
  /** 有効期限（ISO8601）。無期限購入の場合は null */
  expirationDate: string | null;
  /** 有効な商品識別子 */
  activePlanId: string | null;
  /** 次回自動更新されるかどうか */
  willRenew: boolean;
  /** ストアの購読管理画面URL */
  managementURL: string | null;
}
