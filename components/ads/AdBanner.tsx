/**
 * AdBanner - AdMob バナー広告コンポーネント (iOS専用)
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';
import { useTheme } from '../../lib/themeSystem';

interface AdBannerProps {
  style?: any;
}

// iOS用AdMob広告ユニットID
const IOS_AD_UNIT_ID = 'ca-app-pub-5616727577619398/2326888854';

export function AdBanner({ style }: AdBannerProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  // 開発時はテストID、本番時は実際のIDを使用
  const adUnitId = __DEV__ ? TestIds.ADAPTIVE_BANNER : IOS_AD_UNIT_ID;

  return (
    <View style={[
      styles.container,
      {
        backgroundColor: colors.surface,
        paddingBottom: insets.bottom, // bottom safeエリアを確保
      },
      style
    ]}>
      <BannerAd
        unitId={adUnitId}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{
          requestNonPersonalizedAdsOnly: true, // GDPR対応
        }}
        onAdLoaded={() => {
          console.log('Ad loaded successfully');
        }}
        onAdFailedToLoad={(error) => {
          console.error('Ad failed to load:', error);
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
