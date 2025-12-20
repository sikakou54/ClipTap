/**
 * Paywall画面カスタムフック
 *
 * サブスクリプション購入画面のビジネスロジックを管理するフック。
 * UI層からRevenueCat購入処理・Offerings読み込みを分離する。
 *
 * 主な責務:
 * - RevenueCatからOfferings（購入可能なプラン）を取得
 * - 月額/年間プランの状態管理
 * - 購入処理・復元処理の実行
 * - 購入中のスワイプバック無効化
 *
 * @see app/subscription/paywall.tsx - Paywall画面UI
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useNavigation } from 'expo-router';
import { useTranslation } from '@cliptap/shared';
import { useSubscriptionService, type SubscriptionPlan } from '@cliptap/shared';
import { showAlert, showErrorAlert } from '@utils/alerts';
import { Logger } from '@cliptap/shared';

/* ======================================== */
/* 型定義 */
/* ======================================== */

/** プラン選択の型 */
export type PlanType = 'monthly' | 'yearly';

/** 現在のプラン種別 */
export type CurrentPlanType = 'monthly' | 'annual' | null;

/** usePaywallScreen フックの返却値 */
export interface UsePaywallScreenReturn {
  /* 状態 */
  /** Offerings読み込み中フラグ */
  loading: boolean;
  /** 購入/復元処理中フラグ */
  purchasing: boolean;
  /** 月額プランパッケージ */
  monthlyPackage: SubscriptionPlan | null;
  /** 年間プランパッケージ */
  yearlyPackage: SubscriptionPlan | null;
  /** 選択中のプラン */
  selectedPlan: PlanType;
  /** 現在購読中のプラン種別 */
  currentPlan: CurrentPlanType;
  /** サブスクリプション状態 */
  isSubscribed: boolean;

  /* ハンドラ */
  /** プラン選択 */
  selectPlan: (plan: PlanType) => void;
  /** 購入処理 */
  handlePurchase: () => Promise<void>;
  /** 購入復元 */
  handleRestore: () => Promise<void>;
  /** 利用規約画面へ遷移 */
  navigateToTerms: () => void;
  /** プライバシーポリシー画面へ遷移 */
  navigateToPrivacy: () => void;
}

/* ======================================== */
/* フック実装 */
/* ======================================== */

export function usePaywallScreen(): UsePaywallScreenReturn {
  const { t } = useTranslation();
  const router = useRouter();
  const navigation = useNavigation();
  const {
    isSubscribed,
    status,
    refresh,
    getPlans,
    purchase,
    restore,
  } = useSubscriptionService();

  /* ======================================== */
  /* 状態管理 */
  /* ======================================== */
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [monthlyPackage, setMonthlyPackage] = useState<SubscriptionPlan | null>(null);
  const [yearlyPackage, setYearlyPackage] = useState<SubscriptionPlan | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<PlanType>('yearly');
  const [currentPlan, setCurrentPlan] = useState<CurrentPlanType>(null);

  /* ======================================== */
  /* データ読み込み */
  /* ======================================== */

  const loadCurrentPlan = useCallback(async () => {
    try {
      await refresh();
    } catch (error) {
      Logger.error('[usePaywallScreen] Failed to load current plan:', error);
    }
  }, [refresh]);

  useEffect(() => {
    const planType = status?.activePlanId as CurrentPlanType;
    setCurrentPlan(planType);
  }, [status]);

  const loadOfferings = useCallback(async () => {
    try {
      setLoading(true);
      const plans = await getPlans();

      if (plans && plans.length > 0) {
        const monthly = plans.find(
          (pkg) => pkg.interval === 'month'
        );
        const yearly = plans.find(
          (pkg) => pkg.interval === 'year'
        );

        setMonthlyPackage(monthly || null);
        setYearlyPackage(yearly || null);
      }
    } catch (error) {
      Logger.error('[usePaywallScreen] Failed to load offerings:', error);
      showErrorAlert(t('error.generic'));
    } finally {
      setLoading(false);
    }
  }, [getPlans, t]);

  /* ======================================== */
  /* 初期化 */
  /* ======================================== */
  useEffect(() => {
    void loadCurrentPlan();
    void loadOfferings();
  }, [loadCurrentPlan, loadOfferings]);

  /** 購入/復元処理中はスワイプバックを無効化 */
  useEffect(() => {
    navigation.setOptions({
      gestureEnabled: !purchasing,
    });
  }, [purchasing, navigation]);

  /* ======================================== */
  /* イベントハンドラ */
  /* ======================================== */

  const selectPlan = useCallback((plan: PlanType) => {
    const targetPlan = plan === 'monthly' ? 'monthly' : 'annual';
    if (currentPlan !== targetPlan) {
      setSelectedPlan(plan);
    }
  }, [currentPlan]);

  const handlePurchase = useCallback(async () => {
    try {
      setPurchasing(true);

      const pkg = selectedPlan === 'monthly' ? monthlyPackage : yearlyPackage;

      if (!pkg) {
        showErrorAlert(t('error.generic'));
        return;
      }

      const result = await purchase(pkg.id);

      if (result.success) {
        showAlert('', t('subscription.purchase_success'), undefined, () => {
          router.back();
        });
      } else if (result.isCancelled) {
        /* ユーザーキャンセルは何もしない */
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      showErrorAlert(t('subscription.purchase_failed'));
    } finally {
      setPurchasing(false);
    }
  }, [selectedPlan, monthlyPackage, yearlyPackage, purchase, router, t]);

  const handleRestore = useCallback(async () => {
    try {
      setPurchasing(true);
      await restore();
      showAlert('', t('subscription.restore_success'), undefined, () => {
        router.back();
      });
    } catch (error) {
      Logger.error('[usePaywallScreen] Restore failed:', error);
      showErrorAlert(t('subscription.restore_failed'));
    } finally {
      setPurchasing(false);
    }
  }, [restore, router, t]);

  const navigateToTerms = useCallback(() => {
    router.push({
      pathname: '/webview',
      params: { file: 'terms', title: t('settings.terms') },
    });
  }, [router, t]);

  const navigateToPrivacy = useCallback(() => {
    router.push({
      pathname: '/webview',
      params: { file: 'privacy', title: t('settings.privacy') },
    });
  }, [router, t]);

  return {
    loading,
    purchasing,
    monthlyPackage,
    yearlyPackage,
    selectedPlan,
    currentPlan,
    isSubscribed,
    selectPlan,
    handlePurchase,
    handleRestore,
    navigateToTerms,
    navigateToPrivacy,
  };
}
