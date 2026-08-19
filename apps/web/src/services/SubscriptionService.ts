/**
 * サブスクリプション管理サービス（Web版）
 *
 * Web固有の機能を提供。主要な機能は @cliptap/shared の SubscriptionService に委譲。
 * 画面からの購読状態の参照は @cliptap/shared の useSharedSubscription（共通Context）に一本化しており、
 * このモジュールは Web の SubscriptionProvider とキャッシュ管理から使う薄いラッパーに限定する。
 */
import { SubscriptionService as SharedSubscriptionService } from '@cliptap/shared';
import type { WebSubscriptionAdapter } from '@adapters/WebSubscriptionAdapter';

/**
 * 登録済みのWebSubscriptionAdapterを取得するヘルパー
 * init()で登録されたアダプターをSharedSubscriptionService経由で取得
 */
function getWebSubscriptionAdapter(): WebSubscriptionAdapter | null {
  return SharedSubscriptionService.getAdapter() as WebSubscriptionAdapter | null;
}

/**
 * サブスクリプションサービスAPI
 * webSubscriptionAdapterへの薄いラッパー
 */
export const subscriptionService = {
  /** 現在のユーザーIDを取得（キャッシュキー用） */
  getCustomerId: () => getWebSubscriptionAdapter()?.getCustomerId() ?? null,
  hasVerificationFailed: () => getWebSubscriptionAdapter()?.hasVerificationFailed() ?? false,

  /** サブスクリプション状態を検証（Firebase IDトークンを添えて ClipTap API（Cloudflare Worker）へ購読状態を問い合わせる） */
  checkSubscription: (userId: string | null) => {
    const adapter = getWebSubscriptionAdapter();
    return adapter?.checkSubscription(userId) ?? Promise.resolve(false);
  },

  /** 状態変更リスナーを登録 */
  subscribe: (listener: (isSubscribed: boolean) => void): (() => void) => {
    const adapter = getWebSubscriptionAdapter();
    if (adapter) {
      return adapter.subscribe(listener);
    }
    /* アダプターがない場合は何もしないクリーンアップ関数を返す */
    return () => {};
  },
};

