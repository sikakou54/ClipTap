/**
 * サブスクリプション状態管理Provider（Mobile版）
 *
 * @description
 * Mobile版のサブスクリプション状態管理を提供するProvider。
 * sharedのSubscriptionProviderをラップし、Mobile固有のplatformAdapterを注入する。
 * 加入状態の参照は shared の useSharedSubscription を各画面から直接使う。
 * 購入・復元・プラン取得はここではなく SubscriptionService / MobileSubscriptionAdapter が担う。
 *
 * @module SubscriptionProvider
 */

import { useMemo, type ReactNode } from 'react';
import {
  SubscriptionProvider as SharedSubscriptionProvider,
  SubscriptionService,
  AuthService,
  Logger,
  type SubscriptionPlatformAdapter,
} from '@cliptap/shared';
import { purchaseService } from '@services/PurchaseService';
import { type MobileSubscriptionAdapter, type PurchaseServiceCallbacks } from '@adapters/MobileSubscriptionAdapter';
import type { PurchasesPackage } from 'react-native-purchases';

/* ========================================
   型定義
   ======================================== */

interface SubscriptionProviderProps {
  children: ReactNode;
}

/* ========================================
   依存注入設定
   ======================================== */

/**
 * PurchaseServiceへのコールバック
 *
 * MobileSubscriptionAdapterからPurchaseServiceへの依存注入。
 * Adapter→Service間の循環依存を回避。
 */
const purchaseServiceCallbacks: PurchaseServiceCallbacks = {
  isSubscribed: () => purchaseService.isSubscribed(),
  getCustomerInfo: () => purchaseService.getCustomerInfo(),
  linkAccount: (userId: string) => purchaseService.linkAccount(userId),
  logout: () => purchaseService.logout(),
  getOfferings: () => purchaseService.getOfferings(),
  purchasePackage: (pkg: unknown) => purchaseService.purchasePackage(pkg as PurchasesPackage),
  restorePurchases: () => purchaseService.restorePurchases(),
  getExpirationDate: () => purchaseService.getExpirationDate(),
  getCurrentPlanType: () => purchaseService.getCurrentPlanType(),
};


/* ========================================
   Platform Adapter
   ======================================== */

/**
 * Mobile版用のplatformAdapterを作成
 *
 * RevenueCat SDK初期化、購入/復元処理、状態変更コールバックを実装。
 */
function createMobilePlatformAdapter(): SubscriptionPlatformAdapter {
  return {
    /**
     * 初期化処理
     *
     * 1. 登録済みのMobileSubscriptionAdapterにPurchaseServiceへのコールバックをセット
     * 2. RevenueCat SDK初期化
     * 3. Firebase認証が既に復元済みなら、そのUIDをRevenueCatへ紐付け
     *
     * アダプター登録と無料プラン上限の設定は起動時のinit()で済んでいるため、ここでは行わない。
     */
    initialize: async () => {
      const adapter = SubscriptionService.getAdapter() as MobileSubscriptionAdapter | null;
      if (adapter?.setCallbacks) {
        adapter.setCallbacks(purchaseServiceCallbacks);
      }

      await purchaseService.initialize();

      /* Firebase認証が既に復元されている場合、RevenueCatにユーザーを識別させる */
      const currentUser = AuthService.getCurrentUser();
      if (currentUser) {
        Logger.info('[MobileSubscriptionProvider] Linking existing user to RevenueCat:', currentUser.uid);
        try {
          await purchaseService.linkAccount(currentUser.uid);
        } catch (error) {
          Logger.warn('[MobileSubscriptionProvider] Failed to link account on init:', error);
        }
      }

      Logger.info('[MobileSubscriptionProvider] Initialized');
    },

    /**
     * 現在の加入状態を解決
     *
     * RevenueCatのCustomerInfoは初期化時に取得済みのため、ここでは通信せずキャッシュを読む
     */
    resolveSubscribed: async () => {
      return SubscriptionService.isSubscribed();
    },

    /**
     * サブスク状態を最新化
     */
    refresh: async () => {
      await SubscriptionService.refreshCustomerInfo();
    },

    /**
     * サブスク状態変更時のコールバックを登録
     */
    onSubscriptionChange: (callback: (isSubscribed: boolean) => void) => {
      purchaseService.setOnSubscriptionChange((isSubscribed) => {
        /* Context（useSharedSubscription）とService層リスナー（useSubscriptionService）の両方へ伝播させる。
           片方だけに配ると、ペイウォールや契約管理画面を開いたままの権利変更が反映されない */
        callback(isSubscribed);
        const adapter = SubscriptionService.getAdapter() as MobileSubscriptionAdapter | null;
        adapter?.notifyListeners();
      });
      return () => {
        purchaseService.setOnSubscriptionChange(null);
      };
    },

    /**
     * 開発用: サブスク状態をオーバーライド
     */
    setDevSubscriptionOverride: async (value: boolean | null) => {
      await purchaseService.setDevSubscriptionOverride(value);
    },
  };
}

/* ========================================
   Provider コンポーネント
   ======================================== */

/**
 * サブスクリプション状態管理Provider
 * sharedのSubscriptionProviderをラップし、Mobile固有のアダプターを注入
 */
export function SubscriptionProvider({ children }: SubscriptionProviderProps) {
  /* platformAdapterをメモ化（一度だけ作成） */
  const platformAdapter = useMemo(() => createMobilePlatformAdapter(), []);

  /* サブスクリプションプロバイダー（Mobile版platformAdapter注入） */
  return (
    <SharedSubscriptionProvider platformAdapter={platformAdapter}>
      {children}
    </SharedSubscriptionProvider>
  );
}
