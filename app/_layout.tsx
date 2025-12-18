/**
 * ルートレイアウト
 * アプリ全体のプロバイダーとレイアウトを管理
 */

import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { View, StyleSheet, Platform, StatusBar } from 'react-native';
import * as SystemUI from 'expo-system-ui';
import * as ScreenOrientation from 'expo-screen-orientation';
import { ThemeProvider } from '../lib/themeSystem';
import { AlertProvider } from '../lib/providers/AlertProvider';
import { ToastProvider } from '../lib/providers/ToastProvider';
import { SubscriptionProvider } from '../lib/hooks/useSubscription';
import { ProfileProvider } from '../lib/hooks/useProfiles';
import { useTracking } from '../lib/hooks/useTracking';
import { database } from '../lib/database/database';
import { runSeed } from '../lib/database/seed';
import { initI18n } from '../lib/i18n/config';
import { Logger } from '../lib/logger';
import { SplashScreen } from '../components/common/SplashScreen';
import { isTablet } from '../lib/utils/responsive';

// ルート要素のスタイル
const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: '#1F2937', // 常に背景色を設定
  },
});

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const { requestTrackingPermission } = useTracking();

  // タブレットかどうかを判定
  const isTabletDevice = isTablet();

  useEffect(() => {
    async function initialize() {
      try {
        // StatusBarの設定（Androidのedge-to-edge対応）
        if (Platform.OS === 'android') {
          await SystemUI.setBackgroundColorAsync('transparent');
          StatusBar.setTranslucent(true);
          StatusBar.setBarStyle('dark-content');
        }

        // 画面の向きを制御（タブレットは全方向、携帯はポートレートのみ）
        if (isTabletDevice) {
          // タブレット: 一旦ポートレートに設定してから全方向許可
          await ScreenOrientation.lockAsync(
            ScreenOrientation.OrientationLock.PORTRAIT_UP
          );
          // 少し待ってから全方向許可
          setTimeout(async () => {
            await ScreenOrientation.unlockAsync();
          }, 100);
        } else {
          // 携帯: ポートレートのみ
          await ScreenOrientation.lockAsync(
            ScreenOrientation.OrientationLock.PORTRAIT_UP
          );
        }

        // ATT権限をリクエスト (iOS専用、広告表示前に必須)
        await requestTrackingPermission();

        // データベース初期化
        await database.init();

        // 開発モードで新規データベースの場合、テストデータをシード
        if (__DEV__) {
          await runSeed();
        }

        // 多言語システム初期化
        await initI18n();

        Logger.success('🚀 App initialized successfully');
        setIsReady(true);
      } catch (error) {
        Logger.error('App initialization error:', error);
        setIsReady(true); // エラーでも画面を表示
      }
    }

    initialize();
  }, [isTabletDevice]);

  return (
    <>
      {/* メイン画面を常にレンダリング（スプラッシュの下） */}
      {isReady && (
        <View style={styles.rootContainer}>
          <ThemeProvider>
            <SubscriptionProvider>
              <ProfileProvider>
                <AlertProvider>
                  <ToastProvider>
                    <Stack screenOptions={{ headerShown: false }}>
                      <Stack.Screen name="index" />
                      <Stack.Screen
                        name="search"
                        options={{
                          presentation: 'transparentModal',
                          headerShown: false,
                          animation: 'fade',
                        }}
                      />
                      <Stack.Screen
                        name="snippet/create"
                        options={{
                          presentation: isTabletDevice ? 'card' : 'modal',
                          headerShown: false,
                          animation: !isTabletDevice ? 'slide_from_bottom' : undefined
                        }}
                      />
                      <Stack.Screen
                        name="snippet/edit"
                        options={{
                          presentation: isTabletDevice ? 'card' : 'modal',
                          headerShown: false,
                          animation: !isTabletDevice ? 'slide_from_bottom' : undefined
                        }}
                      />
                      <Stack.Screen
                        name="snippet/content-input"
                        options={{
                          presentation: isTabletDevice ? 'card' : 'modal',
                          headerShown: false,
                          animation: !isTabletDevice ? 'slide_from_bottom' : undefined
                        }}
                      />
                      <Stack.Screen
                        name="category/edit"
                        options={{
                          presentation: 'modal',
                          headerShown: false,
                          animation: 'slide_from_bottom'
                        }}
                      />
                      <Stack.Screen
                        name="category/select"
                        options={{
                          presentation: 'modal',
                          headerShown: false,
                          animation: 'slide_from_bottom'
                        }}
                      />
                      <Stack.Screen
                        name="variable/edit"
                        options={{
                          presentation: 'modal',
                          headerShown: false,
                          animation: 'slide_from_bottom'
                        }}
                      />
                      <Stack.Screen
                        name="profile/edit"
                        options={{
                          presentation: 'modal',
                          headerShown: false,
                          animation: 'slide_from_bottom'
                        }}
                      />
                      <Stack.Screen
                        name="profile/variable-edit"
                        options={{
                          presentation: 'modal',
                          headerShown: false,
                          animation: 'slide_from_bottom'
                        }}
                      />
                      <Stack.Screen
                        name="variable/profile-value-edit"
                        options={{
                          presentation: 'modal',
                          headerShown: false,
                          animation: 'slide_from_bottom'
                        }}
                      />
                      <Stack.Screen
                        name="snippet/profile-select"
                        options={{
                          presentation: 'modal',
                          headerShown: false,
                          animation: 'slide_from_bottom'
                        }}
                      />
                      <Stack.Screen
                        name="snippet/title-input"
                        options={{
                          presentation: isTabletDevice ? 'card' : 'modal',
                          headerShown: false,
                          animation: !isTabletDevice ? 'slide_from_bottom' : undefined
                        }}
                      />
                      {/* Settings screens - nested routing handled by settings/_layout.tsx */}
                      <Stack.Screen
                        name="settings"
                        options={{
                          headerShown: false,
                        }}
                      />
                      {/* Subscription screens - modal presentation */}
                      <Stack.Screen
                        name="subscription/paywall"
                        options={{
                          presentation: 'fullScreenModal',
                          headerShown: false,
                        }}
                      />
                      <Stack.Screen
                        name="subscription/manage"
                        options={{
                          headerShown: false,
                        }}
                      />
                      {/* WebView - full screen modal for documents */}
                      <Stack.Screen
                        name="webview"
                        options={{
                          headerShown: false,
                        }}
                      />
                    </Stack>
                  </ToastProvider>
                </AlertProvider>
              </ProfileProvider>
            </SubscriptionProvider>
          </ThemeProvider>
        </View>
      )}

      {/* スプラッシュスクリーンをオーバーレイ表示 */}
      {showSplash && (
        <SplashScreen
          onFinish={() => setShowSplash(false)}
          isLoading={!isReady}
        />
      )}
    </>
  );
}
