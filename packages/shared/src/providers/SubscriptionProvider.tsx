/**
 * サブスクリプションプロバイダー（共通実装）
 *
 * @description
 * プラットフォーム非依存のサブスクリプション状態管理Provider。
 * プラットフォーム固有の実装はアダプター経由で提供される。
 *
 * 主な機能:
 * - サブスクリプション状態の管理
 * - 機能制限チェック（変数数・プロファイル数）
 * - 購入・復元処理の抽象化
 *
 * @module SubscriptionProvider
 */

import { createContext, useContext, useState, useEffect, useCallback, useMemo, type ReactNode } from 'react';
import { SubscriptionService, FREE_PROFILES_LIMIT, FREE_VARIABLES_LIMIT, createValidFlagsUpdater } from '../services';
import { Logger } from '../utils/logger';

/* ======================================== */
/* 型定義 */
/* ======================================== */

/**
 * サブスクリプションコンテキストの型定義
 */
export interface SubscriptionContextValue {
  /** Pro版加入状態 */
  isSubscribed: boolean;
  /** 初期化中フラグ */
  isLoading: boolean;
  /** 広告を表示すべきか判定 */
  shouldShowAds: () => boolean;
  /** カスタム変数を追加可能か判定 */
  canAddCustomVariable: (currentCount: number) => boolean;
  /** プロファイルを追加可能か判定 */
  canAddProfile: (currentCount: number) => boolean;
  /** サブスク状態を最新化 */
  refresh: () => Promise<void>;
  /** 有効期限を取得 */
  getExpirationDate: () => Date | null;
  /** 現在のプラン種別を取得 */
  getCurrentPlanType: () => 'monthly' | 'annual' | null;
  /** 購入を復元 */
  restorePurchases: () => Promise<void>;
  /** 購入可能なプランを取得 */
  getOfferings: () => Promise<unknown>;
  /** パッケージを購入 */
  purchasePackage: (pkg: unknown) => Promise<void>;
  /** 開発者オーバーライド状態を取得（DEVのみ、未実装の場合はnull） */
  getDevSubscriptionOverride: () => boolean | null;
  /** 開発者オーバーライドを設定（DEVのみ） */
  setDevSubscriptionOverride: (value: boolean | null) => Promise<void>;
}

/**
 * サブスクリプションプラットフォームアダプター
 * プラットフォーム固有の実装を抽象化
 */
export interface SubscriptionPlatformAdapter {
  /** 初期化処理 */
  initialize: () => Promise<void>;
  /** サブスクリプション状態を確認 */
  checkSubscription: () => Promise<boolean>;
  /** サブスク状態を最新化 */
  refresh: () => Promise<void>;
  /** 有効期限を取得 */
  getExpirationDate: () => Date | null;
  /** 現在のプラン種別を取得 */
  getCurrentPlanType: () => 'monthly' | 'annual' | null;
  /** 購入を復元 */
  restorePurchases: () => Promise<void>;
  /** 購入可能なプランを取得 */
  getOfferings: () => Promise<unknown>;
  /** パッケージを購入 */
  purchasePackage: (pkg: unknown) => Promise<void>;
  /** サブスク状態変更時のコールバックを登録 */
  onSubscriptionChange?: (callback: (isSubscribed: boolean) => void) => () => void;

  /* ======================================== */
  /* オプショナルなコールバック（Mobile固有機能など） */
  /* ======================================== */

  /** サブスク状態変更時に追加で実行する処理（KeyboardExtension同期など） */
  onSubscriptionStateChanged?: (isSubscribed: boolean, expirationDate: Date | null) => void;
  /** 初期化完了後に実行する処理（validFlags更新など） */
  onInitializeComplete?: () => void;
  /** DEVオーバーライド状態を取得（開発環境用） */
  getDevSubscriptionOverride?: () => boolean | null;
  /** DEVオーバーライドを設定（開発環境用） */
  setDevSubscriptionOverride?: (value: boolean | null) => Promise<void>;
}

/**
 * SubscriptionProviderのProps
 */
export interface SubscriptionProviderProps {
  /** 子コンポーネント */
  children: ReactNode;
  /** プラットフォームアダプター */
  platformAdapter: SubscriptionPlatformAdapter;
  /** 初期化完了時のコールバック（オプション） */
  onInitialized?: () => void;
}

/* ======================================== */
/* Context */
/* ======================================== */

const SubscriptionContext = createContext<SubscriptionContextValue | null>(null);

/* ======================================== */
/* Provider */
/* ======================================== */

/**
 * サブスクリプション状態管理Provider
 *
 * @param props - SubscriptionProviderProps
 */
export function SubscriptionProvider({
  children,
  platformAdapter,
  onInitialized,
}: SubscriptionProviderProps) {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  /**
   * サブスク状態変更時の内部処理
   * 1. ローカル状態の更新
   * 2. プラットフォーム固有処理（KeyboardExtension同期など）
   * 3. 初期化完了後のvalidFlags更新
   */
  const handleSubscriptionChange = useCallback((subscribed: boolean) => {
    setIsSubscribed(subscribed);

    if (platformAdapter.onSubscriptionStateChanged) {
      platformAdapter.onSubscriptionStateChanged(
        subscribed,
        platformAdapter.getExpirationDate()
      );
    }

    /* プラットフォーム固有の状態変更時処理 */
    if (isInitialized && platformAdapter.onInitializeComplete) {
      platformAdapter.onInitializeComplete();
    }

    /* validFlags更新（共通処理） */
    if (isInitialized) {
      SubscriptionService.updateValidFlags();
    }
  }, [platformAdapter, isInitialized]);

  useEffect(() => {
    const initialize = async () => {
      setIsLoading(true);
      try {
        /* ValidFlagsUpdater を共通設定（未設定の場合のみ） */
        if (!SubscriptionService.hasValidFlagsUpdater()) {
          SubscriptionService.setValidFlagsUpdater(createValidFlagsUpdater());
        }

        /* アダプター制限値を共通設定 */
        const adapter = SubscriptionService.getAdapter();
        if (adapter) {
          SubscriptionService.setAdapter(adapter, {
            freeProfilesLimit: FREE_PROFILES_LIMIT,
            freeVariablesLimit: FREE_VARIABLES_LIMIT,
          });
        }

        await platformAdapter.initialize();
        const subscribed = await platformAdapter.checkSubscription();
        setIsSubscribed(subscribed);

        /* プラットフォーム固有の初期化完了処理 */
        if (platformAdapter.onInitializeComplete) {
          platformAdapter.onInitializeComplete();
        }

        /* validFlags更新（共通処理） */
        SubscriptionService.updateValidFlags();

        setIsInitialized(true);
        onInitialized?.();
      } catch (error) {
        Logger.error('[SubscriptionProvider] Init failed:', error);
        setIsSubscribed(false);
      } finally {
        setIsLoading(false);
      }
    };

    void initialize();
  }, [platformAdapter, onInitialized]);

  useEffect(() => {
    if (!platformAdapter.onSubscriptionChange) return;

    const unsubscribe = platformAdapter.onSubscriptionChange(handleSubscriptionChange);

    return unsubscribe;
  }, [platformAdapter, handleSubscriptionChange]);

  const refresh = useCallback(async () => {
    try {
      await platformAdapter.refresh();
      const subscribed = await platformAdapter.checkSubscription();
      handleSubscriptionChange(subscribed);
    } catch (error) {
      Logger.error('[SubscriptionProvider] Refresh failed:', error);
    }
  }, [platformAdapter, handleSubscriptionChange]);

  const restorePurchases = useCallback(async () => {
    await platformAdapter.restorePurchases();
    await refresh();
  }, [platformAdapter, refresh]);

  const purchasePackage = useCallback(async (pkg: unknown) => {
    await platformAdapter.purchasePackage(pkg);
    await refresh();
  }, [platformAdapter, refresh]);

  const setDevSubscriptionOverride = useCallback(async (value: boolean | null) => {
    if (platformAdapter.setDevSubscriptionOverride) {
      await platformAdapter.setDevSubscriptionOverride(value);
      await refresh();
    }
  }, [platformAdapter, refresh]);

  const value = useMemo<SubscriptionContextValue>(() => ({
    isSubscribed,
    isLoading,
    shouldShowAds: () => !SubscriptionService.isSubscribed(),
    canAddCustomVariable: (count) => SubscriptionService.canAddVariable(count),
    canAddProfile: (count) => SubscriptionService.canAddProfile(count),
    refresh,
    getExpirationDate: () => platformAdapter.getExpirationDate(),
    getCurrentPlanType: () => platformAdapter.getCurrentPlanType(),
    restorePurchases,
    getOfferings: () => platformAdapter.getOfferings(),
    purchasePackage,
    getDevSubscriptionOverride: () => platformAdapter.getDevSubscriptionOverride?.() ?? null,
    setDevSubscriptionOverride,
  }), [isSubscribed, isLoading, refresh, platformAdapter, restorePurchases, purchasePackage, setDevSubscriptionOverride]);

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

/* ======================================== */
/* Hook */
/* ======================================== */

/**
 * サブスクリプションコンテキストを取得するカスタムフック
 *
 * @returns SubscriptionContextValue
 * @throws Provider外で使用された場合にエラー
 */
export function useSubscription(): SubscriptionContextValue {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
}

/* ======================================== */
/* 定数のre-export */
/* ======================================== */

export { FREE_PROFILES_LIMIT, FREE_VARIABLES_LIMIT };
