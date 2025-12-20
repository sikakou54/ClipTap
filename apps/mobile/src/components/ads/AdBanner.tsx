/**
 * AdMobバナー広告コンポーネント
 *
 * 画面下部に表示されるAdMobバナー広告。
 * iOS/Android両対応、ATT（App Tracking Transparency）対応。
 *
 * 主な機能:
 * - iOS: ATTステータスに基づくパーソナライズ広告の制御
 * - Android: 非パーソナライズ広告のみ
 * - 開発時: テスト広告IDを使用
 * - Proプラン: 広告非表示
 * - SafeArea対応（下部余白）
 *
 * 表示条件:
 * - 無料プランのユーザーのみ
 * - トラッキングステータス取得完了後
 *
 * @see useSubscription - サブスクリプション状態管理
 * @see useTracking - ATTトラッキング管理
 */

import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';
import { useTheme } from '@lib/themeSystem';
import { useTracking } from '@hooks/useTracking';
import { Logger } from '@cliptap/shared';
import { useSubscription } from '@providers/SubscriptionProvider';

/* ========================================
   Props定義
   ======================================== */

/**
 * AdBannerのProps
 * @property style - カスタムスタイル（オプション）
 */
interface AdBannerProps {
  style?: any;
}

/* ========================================
   定数定義
   ======================================== */

/**
 * AdMob広告ユニットID（プラットフォーム別）
 * 本番環境でのみ使用される
 */
const AD_UNIT_IDS = {
  ios: 'ca-app-pub-5616727577619398/2326888854',
  android: 'ca-app-pub-5616727577619398/1768536958',
};

export function AdBanner({ style }: AdBannerProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { shouldShowAds } = useSubscription();
  const { getTrackingStatus } = useTracking();

  const [trackingStatus, setTrackingStatus] = useState<string | null>(null);

  /**
   * ATT権限ステータスの取得
   * iOS: ATTダイアログの結果を取得（パーソナライズ広告の可否を決定）
   * Android: 'unknown'を設定（ATTなし、SDK側で自動制御）
   */
  useEffect(() => {
    async function checkTrackingStatus() {
      const status = await getTrackingStatus();
      setTrackingStatus(status);
    }

    if (Platform.OS === 'ios') {
      checkTrackingStatus().catch((error) =>
        Logger.error('Check tracking status failed:', error)
      );
    } else {
      setTrackingStatus('unknown');
    }
  }, [getTrackingStatus]);

  /**
   * 広告ユニットID
   * 開発時: テストID、本番時: プラットフォーム別の本番ID
   */
  const adUnitId = __DEV__
    ? TestIds.ADAPTIVE_BANNER
    : Platform.select({
        ios: AD_UNIT_IDS.ios,
        android: AD_UNIT_IDS.android,
      })!;

  if (!shouldShowAds()) {
    return null;
  }

  if (Platform.OS === 'ios' && !trackingStatus) {
    return null;
  }

  /* AdMobバナー広告コンテナ（画面下部に表示） */
  return (
    <View style={[
      styles.container,
      {
        backgroundColor: colors.background,
        paddingBottom: insets.bottom,
      },
      style
    ]}>
      {/* AdMobバナー広告 */}
      <BannerAd
        unitId={adUnitId}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{
          requestNonPersonalizedAdsOnly: trackingStatus !== 'granted',
        }}
        onAdLoaded={() => {
          Logger.debug('Ad loaded successfully');
        }}
        onAdFailedToLoad={(error) => {
          Logger.error('Ad failed to load:', error);
        }}
      />
    </View>
  );
}

/* ========================================
   スタイル定義
   ======================================== */
const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
});
