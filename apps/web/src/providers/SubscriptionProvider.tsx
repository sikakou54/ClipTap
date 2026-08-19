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
  useAuth,
  type SubscriptionPlatformAdapter,
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
     * 現在の加入状態を解決
     *
     * ClipTap APIへ問い合わせて検証する。検証に失敗した場合は例外を投げ、
     * ProviderにFree表示へのフォールバックと警告表示を行わせる
     */
    resolveSubscribed: async () => {
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
