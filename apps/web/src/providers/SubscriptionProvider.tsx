/**
 * サブスクリプション状態管理Provider（Web版）
 *
 * @description
 * Web版のサブスクリプション状態管理を提供するProvider。
 * sharedのSubscriptionProviderをラップし、Web固有のplatformAdapterを注入。
 *
 * @module SubscriptionProvider
 */

import { useMemo, type ReactNode } from 'react';
import {
  SubscriptionProvider as SharedSubscriptionProvider,
  useSharedSubscription,
  useAuth,
  type SubscriptionPlatformAdapter,
  type SubscriptionContextValue,
} from '@cliptap/shared';
import { subscriptionService } from '@services/SubscriptionService';

interface SubscriptionProviderProps {
  children: ReactNode;
}

/**
 * Web版用のplatformAdapterを作成
 *
 * @param userId - FirebaseのユーザーID
 * @returns SubscriptionPlatformAdapter
 */
function createWebPlatformAdapter(userId: string | null): SubscriptionPlatformAdapter {
  return {
    /**
     * 初期化処理
     */
    initialize: async () => { },

    /**
     * サブスクリプション状態を確認
     */
    checkSubscription: async () => {
      if (!userId) {
        return false;
      }
      const subscribed = await subscriptionService.checkSubscription(userId);
      if (subscriptionService.hasVerificationFailed()) {
        throw new Error('Subscription verification failed');
      }
      return subscribed;
    },

    /**
     * サブスク状態を最新化
     */
    refresh: async () => {
      if (userId) {
        await subscriptionService.checkSubscription(userId);
        if (subscriptionService.hasVerificationFailed()) {
          throw new Error('Subscription verification failed');
        }
      }
    },

    /**
     * 有効期限を取得
     * Web版では未サポート（モバイルアプリでの購入のみ対応）
     */
    getExpirationDate: () => null,

    /**
     * 現在のプラン種別を取得
     * Web版では未サポート（モバイルアプリでの購入のみ対応）
     */
    getCurrentPlanType: () => null,

    /**
     * 購入を復元
     * Web版では未サポート（モバイルアプリでの購入のみ対応）
     */
    restorePurchases: async () => {
      /* Web版では購入機能なし - 何もしない */
    },

    /**
     * 購入可能なプランを取得
     * Web版では未サポート（モバイルアプリでの購入のみ対応）
     */
    getOfferings: async () => null,

    /**
     * パッケージを購入
     * Web版では未サポート（モバイルアプリでの購入のみ対応）
     */
    purchasePackage: async () => {
      throw new Error('Web版では購入機能をサポートしていません。モバイルアプリからご購入ください。');
    },

    /**
     * サブスク状態変更時のコールバックを登録
     */
    onSubscriptionChange: (callback: (isSubscribed: boolean) => void) => {
      return subscriptionService.subscribe(callback);
    },

  };
}

/**
 * サブスクリプション状態管理Provider
 * sharedのSubscriptionProviderをラップし、Web固有のアダプターを注入
 */
export function SubscriptionProvider({ children }: SubscriptionProviderProps) {
  const { user } = useAuth();

  /* ユーザーIDに基づいてplatformAdapterを作成 */
  const platformAdapter = useMemo(
    () => createWebPlatformAdapter(user?.uid ?? null),
    [user?.uid]
  );

  /* サブスクリプションプロバイダー（Web版platformAdapter注入） */
  return (
    <SharedSubscriptionProvider platformAdapter={platformAdapter}>
      {children}
    </SharedSubscriptionProvider>
  );
}

/**
 * サブスクリプションコンテキストを取得するカスタムフック
 * sharedのuseSubscriptionをそのままエクスポート
 */
export function useSubscription(): SubscriptionContextValue {
  return useSharedSubscription();
}
