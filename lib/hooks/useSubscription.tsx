/**
 * サブスクリプション状態管理
 * Context + Custom Hook パターン
 * UI層からservice層を隠蔽するための抽象化レイヤー
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { purchaseService } from '../services/PurchaseService';
import { Logger } from '../logger';

interface SubscriptionContextType {
  isSubscribed: boolean;
  isLoading: boolean;
  shouldShowAds: () => boolean;
  canAddCustomVariable: (currentCount: number) => boolean;
  canAddProfile: (currentCount: number) => boolean;
  refresh: () => Promise<void>;
  getExpirationDate: () => Date | null;
  getCurrentPlanType: () => 'monthly' | 'annual' | null;
  restorePurchases: () => Promise<void>;
  getOfferings: () => Promise<any>;
  purchasePackage: (pkg: any) => Promise<void>;
  getDevSubscriptionOverride: () => boolean | null;
  setDevSubscriptionOverride: (value: boolean | null) => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | null>(null);

interface Props {
  children: ReactNode;
}

export function SubscriptionProvider({ children }: Props) {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 初期化とサブスクリプション状態の取得
  useEffect(() => {
    initializePurchases();
  }, []);

  const initializePurchases = async () => {
    try {
      setIsLoading(true);

      // PurchaseServiceを初期化
      await purchaseService.initialize();

      // サブスクリプション状態を取得
      await refresh();

      // validフラグを更新（アプリ起動時）
      purchaseService.updateValidFlags();
    } catch (error) {
      Logger.error('[SubscriptionProvider] Failed to initialize:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refresh = async () => {
    try {
      const previousSubscriptionStatus = isSubscribed;
      await purchaseService.getCustomerInfo();
      const currentSubscriptionStatus = purchaseService.isSubscribed();
      setIsSubscribed(currentSubscriptionStatus);

      // サブスクリプション状態が変化した場合、validフラグを更新
      if (previousSubscriptionStatus !== currentSubscriptionStatus) {
        Logger.info('[SubscriptionProvider] Subscription status changed, updating valid flags');
        purchaseService.updateValidFlags();
      }
    } catch (error) {
      Logger.error('[SubscriptionProvider] Failed to refresh:', error);
    }
  };

  const shouldShowAds = (): boolean => {
    return purchaseService.shouldShowAds();
  };

  const canAddCustomVariable = (currentCount: number): boolean => {
    return purchaseService.canAddCustomVariable(currentCount);
  };

  const canAddProfile = (currentCount: number): boolean => {
    return purchaseService.canAddProfile(currentCount);
  };

  const getExpirationDate = (): Date | null => {
    return purchaseService.getExpirationDate();
  };

  const getCurrentPlanType = (): 'monthly' | 'annual' | null => {
    return purchaseService.getCurrentPlanType();
  };

  const restorePurchases = async (): Promise<void> => {
    await purchaseService.restorePurchases();
    await refresh();
  };

  const getOfferings = async (): Promise<any> => {
    return await purchaseService.getOfferings();
  };

  const purchasePackage = async (pkg: any): Promise<void> => {
    await purchaseService.purchasePackage(pkg);
    await refresh();
  };

  const getDevSubscriptionOverride = (): boolean | null => {
    return purchaseService.getDevSubscriptionOverride();
  };

  const setDevSubscriptionOverride = async (value: boolean | null): Promise<void> => {
    await purchaseService.setDevSubscriptionOverride(value);
    // refresh()を呼び出してisSubscribed状態を更新
    // setDevSubscriptionOverride内でupdateValidFlags()は既に呼ばれている
    const currentSubscriptionStatus = purchaseService.isSubscribed();
    setIsSubscribed(currentSubscriptionStatus);
  };

  const value: SubscriptionContextType = {
    isSubscribed,
    isLoading,
    shouldShowAds,
    canAddCustomVariable,
    canAddProfile,
    refresh,
    getExpirationDate,
    getCurrentPlanType,
    restorePurchases,
    getOfferings,
    purchasePackage,
    getDevSubscriptionOverride,
    setDevSubscriptionOverride,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription(): SubscriptionContextType {
  const context = useContext(SubscriptionContext);

  if (!context) {
    throw new Error('useSubscription must be used within SubscriptionProvider');
  }

  return context;
}
