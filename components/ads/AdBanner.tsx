/**
 * AdBanner - AdMob バナー広告コンポーネント (iOS/Android対応)
 * ATT (App Tracking Transparency) 対応
 */

import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';
import { useTheme } from '../../lib/themeSystem';
import { useTracking } from '../../lib/hooks/useTracking';
import { useSubscription } from '../../lib/hooks/useSubscription';
import { Logger } from '../../lib/logger';

interface AdBannerProps {
  style?: any;
}

// AdMob広告ユニットID
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

  // ATT権限ステータスを取得 (iOSのみ)
  useEffect(() => {
    async function checkTrackingStatus() {
      const status = await getTrackingStatus();
      setTrackingStatus(status);
    }

    if (Platform.OS === 'ios') {
      checkTrackingStatus();
    } else {
      // Androidではトラッキングステータスを'unknown'に設定
      setTrackingStatus('unknown');
    }
  }, [getTrackingStatus]);

  // 開発時はテストID、本番時はプラットフォーム別のIDを使用
  const adUnitId = __DEV__
    ? TestIds.ADAPTIVE_BANNER
    : Platform.select({
        ios: AD_UNIT_IDS.ios,
        android: AD_UNIT_IDS.android,
      })!;

  // Proプランに加入している場合は広告を表示しない
  if (!shouldShowAds()) {
    return null;
  }

  // トラッキングステータスが取得できるまで待機
  if (Platform.OS === 'ios' && !trackingStatus) {
    return null;
  }

  return (
    <View style={[
      styles.container,
      {
        backgroundColor: colors.background,
        paddingBottom: insets.bottom, // bottom safeエリアを確保
      },
      style
    ]}>
      <BannerAd
        unitId={adUnitId}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{
          // ATTで拒否された場合は非パーソナライズ広告のみ
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

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
});
