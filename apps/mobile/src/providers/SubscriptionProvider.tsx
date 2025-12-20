/**
 * サブスクリプション状態管理Provider（Mobile版）
 *
 * @description
 * Mobile版のサブスクリプション状態管理を提供するProvider。
 * sharedのSubscriptionProviderをラップし、Mobile固有のplatformAdapterを注入。
 * RevenueCat SDKを使用したサブスクリプション状態管理と購入処理を提供。
 *
 * @module SubscriptionProvider
 */

import { useMemo, type ReactNode } from 'react';
import {
  SubscriptionProvider as SharedSubscriptionProvider,
  useSharedSubscription,
  SubscriptionService,
  AuthService,
  Logger,
  type SubscriptionPlatformAdapter,
  type SubscriptionContextValue,
} from '@cliptap/shared';
import { purchaseService } from '@services/PurchaseService';
import { type MobileSubscriptionAdapter, type PurchaseServiceCallbacks } from '@adapters/MobileSubscriptionAdapter';
import { keyboardExtensionService } from '@services/KeyboardExtensionService';
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
     * 1. MobileSubscriptionAdapterにコールバックをセット
     * 2. SubscriptionServiceに制限設定を注入
     * 3. validフラグ更新用ヘルパー関数を注入
     * 4. RevenueCat SDK初期化
     * 5. アプリ再インストール後の認証状態復元時にRevenueCatと連携
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
     * サブスクリプション状態を確認
     */
    checkSubscription: async () => {
      return SubscriptionService.isSubscribed();
    },

    /**
     * サブスク状態を最新化
     */
    refresh: async () => {
      await SubscriptionService.refreshCustomerInfo();
    },

    /**
     * 有効期限を取得
     */
    getExpirationDate: () => purchaseService.getExpirationDate(),

    /**
     * 現在のプラン種別を取得
     */
    getCurrentPlanType: () => purchaseService.getCurrentPlanType(),

    /**
     * 購入を復元
     */
    restorePurchases: async () => {
      await purchaseService.restorePurchases();
    },

    /**
     * 購入可能なプランを取得
     */
    getOfferings: async () => purchaseService.getOfferings(),

    /**
     * パッケージを購入
     */
    purchasePackage: async (pkg: unknown) => {
      await purchaseService.purchasePackage(pkg as PurchasesPackage);
    },

    /**
     * サブスク状態変更時のコールバックを登録
     */
    onSubscriptionChange: (callback: (isSubscribed: boolean) => void) => {
      purchaseService.setOnSubscriptionChange(callback);
      return () => {
        purchaseService.setOnSubscriptionChange(null);
      };
    },

    /**
     * サブスク状態変更時のMobile固有処理
     * KeyboardExtensionへのサブスク状態同期
     */
    onSubscriptionStateChanged: (isSubscribed: boolean, expirationDate: Date | null) => {
      keyboardExtensionService.saveSubscriptionStatus(isSubscribed, expirationDate);
    },

    /**
     * 開発用: サブスク状態のオーバーライド値を取得
     */
    getDevSubscriptionOverride: () => purchaseService.getDevSubscriptionOverride(),

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

/* ========================================
   フック
   ======================================== */

/**
 * サブスクリプションコンテキストを取得するカスタムフック
 * sharedのuseSubscriptionをそのままエクスポート
 */
export function useSubscription(): SubscriptionContextValue {
  return useSharedSubscription();
}
