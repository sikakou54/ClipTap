/**
 * サブスクリプション管理画面カスタムフック
 *
 * サブスクリプション管理画面のビジネスロジックを管理するフック。
 * UI層からサブスクリプション情報の取得・復元処理を分離する。
 *
 * 主な責務:
 * - サブスクリプション情報の取得（有効期限・プラン種別）
 * - 購入復元処理
 * - App Store/Google Playのサブスクリプション設定を開く
 *
 * @see app/subscription/manage.tsx - サブスクリプション管理画面UI
 */

import { useState, useEffect, useCallback } from 'react';
import { Linking, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from '@cliptap/shared';
import { useSubscriptionService } from '@cliptap/shared';
import { showConfirm, showAlert, showErrorAlert } from '@utils/alerts';
import { Logger } from '@cliptap/shared';

/* ======================================== */
/* 型定義 */
/* ======================================== */

/** 現在のプラン種別 */
export type CurrentPlanType = 'monthly' | 'annual' | null;

/** useManageSubscriptionScreen フックの返却値 */
export interface UseManageSubscriptionScreenReturn {
  /* 状態 */
  /** サブスクリプション状態 */
  isSubscribed: boolean;
  /** 有効期限/次回請求日 */
  expirationDate: Date | null;
  /** 現在のプラン種別 */
  currentPlan: CurrentPlanType;
  /** 復元処理中フラグ */
  restoring: boolean;
  /** キーボード設定ガイドモーダル表示フラグ */
  showKeyboardGuide: boolean;
  /** キーボード設定ガイドモーダル表示フラグのセッター */
  setShowKeyboardGuide: (value: boolean) => void;

  /* ハンドラ */
  /** App Store/Google Playの設定を開く */
  handleOpenSubscriptionSettings: () => void;
  /** 購入復元 */
  handleRestore: () => Promise<void>;
  /** Paywall画面へ遷移 */
  navigateToPaywall: () => void;
  /** キーボード設定を開く */
  handleOpenKeyboardSettings: () => void;
}

/* ======================================== */
/* フック実装 */
/* ======================================== */

export function useManageSubscriptionScreen(): UseManageSubscriptionScreenReturn {
  const { t } = useTranslation();
  const router = useRouter();
  const {
    isSubscribed,
    status,
    refresh,
    restore,
  } = useSubscriptionService();

  /* ======================================== */
  /* 状態管理 */
  /* ======================================== */
  const [expirationDate, setExpirationDate] = useState<Date | null>(null);
  const [currentPlan, setCurrentPlan] = useState<CurrentPlanType>(null);
  const [restoring, setRestoring] = useState(false);
  const [showKeyboardGuide, setShowKeyboardGuide] = useState(false);

  /* ======================================== */
  /* データ読み込み */
  /* ======================================== */

  const loadSubscriptionInfo = useCallback(() => {
    if (status) {
      const expiration = status.expirationDate ? new Date(status.expirationDate) : null;
      const planType = status.activePlanId as CurrentPlanType;

      setExpirationDate(expiration);
      setCurrentPlan(planType);
    } else {
        void refresh();
    }
  }, [status, refresh]);

  useEffect(() => {
    loadSubscriptionInfo();
  }, [loadSubscriptionInfo]);

  /* ======================================== */
  /* イベントハンドラ */
  /* ======================================== */

  const handleRestore = useCallback(async () => {
      try {
        setRestoring(true);
        await restore();
        showAlert('', t('subscription.restore_success'));
        void refresh();
      } catch (error) {
        Logger.error('[useManageSubscriptionScreen] Restore failed:', error);
        showErrorAlert(t('subscription.restore_failed'));
      } finally {
        setRestoring(false);
      }
    }, [restore, refresh, t]);

  const handleOpenSubscriptionSettings = useCallback(() => {
    const url = Platform.select({
      ios: 'https://apps.apple.com/account/subscriptions',
      android: 'https://play.google.com/store/account/subscriptions',
    });

    showConfirm(
      t('subscription.manage_description'),
      () => {
        if (url) {
          Linking.openURL(url).catch((error) =>
            Logger.error('Open URL failed:', error)
          );
        }
      },
      undefined,
      'info'
    );
  }, [t]);

  const navigateToPaywall = useCallback(() => {
    router.push('/subscription/paywall');
  }, [router]);

  /** キーボード設定を開く（ガイドモーダルを表示） */
  const handleOpenKeyboardSettings = useCallback(() => {
    setShowKeyboardGuide(true);
  }, []);

  return {
    isSubscribed,
    expirationDate,
    currentPlan,
    restoring,
    showKeyboardGuide,
    setShowKeyboardGuide,
    handleOpenSubscriptionSettings,
    handleRestore,
    navigateToPaywall,
    handleOpenKeyboardSettings,
  };
}
