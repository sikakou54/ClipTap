/**
 * サブスクリプション管理サービス（Web版）
 *
 * Web固有の機能を提供。主要な機能は @cliptap/shared の SubscriptionService に委譲。
 */
import { useState, useEffect } from 'react';
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

  /** サブスクリプション状態を検証（Firebase認証経由でRevenueCatに問い合わせ） */
  checkSubscription: (userId: string | null) => {
    const adapter = getWebSubscriptionAdapter();
    return adapter?.checkSubscription(userId) ?? Promise.resolve(false);
  },

  /** 状態をリセット（ログアウト時などに使用） */
  reset: () => getWebSubscriptionAdapter()?.reset?.(),

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

/**
 * React Hook用のサブスクリプション状態取得
 * @returns isSubscribed: サブスクリプション状態、isLoading: ローディング状態、checkSubscription: 検証関数
 */
export function useSubscription() {
  /* サブスクリプション状態を管理（初期値は共通サービスから取得） */
  const [isSubscribed, setIsSubscribed] = useState(SharedSubscriptionService.isSubscribed());
  /* ローディング状態を管理（初期値は共通サービスから取得） */
  const [isLoading, setIsLoading] = useState(SharedSubscriptionService.isLoading());

  /* コンポーネントのマウント時に共通サービスの状態変更を購読 */
  useEffect(() => {
    /* 共通サービスの状態変更を購読（サブスクリプション状態が変わったら通知される） */
    const unsubscribe = SharedSubscriptionService.subscribe((subscribed) => {
      /* サブスクリプション状態を更新 */
      setIsSubscribed(subscribed);
      /* ローディング状態を更新 */
      setIsLoading(SharedSubscriptionService.isLoading());
    });
    /* コンポーネントのアンマウント時に購読を解除（メモリリーク防止） */
    return unsubscribe;
  }, []); /* 依存配列が空なのでマウント時のみ実行 */

  /* サブスクリプション状態とチェック関数を返す */
  return {
    isSubscribed, /* サブスクリプション状態（true: Pro会員、false: 無料会員） */
    isLoading, /* ローディング状態（true: 検証中、false: 検証完了） */
    checkSubscription: SharedSubscriptionService.checkSubscription.bind(SharedSubscriptionService), /* サブスクリプション検証関数 */
  };
}
