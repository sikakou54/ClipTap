/**
 * ルートレイアウト
 * アプリ全体のプロバイダーとレイアウトを管理
 */

import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { ThemeProvider } from '../lib/themeSystem';
import { AlertProvider } from '../lib/providers/AlertProvider';
import { ToastProvider } from '../lib/providers/ToastProvider';
import { database } from '../lib/database/database';
import { initI18n } from '../lib/i18n/config';
import { Logger } from '../lib/logger';
import { SplashScreen } from '../components/common/SplashScreen';
import { TrackingService } from '../lib/services/TrackingService';

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

  useEffect(() => {
    async function initialize() {
      try {
        // ATT権限をリクエスト (iOS専用、広告表示前に必須)
        await TrackingService.requestTrackingPermission();

        // データベース初期化
        await database.init();

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
  }, []);

  return (
    <>
      {/* メイン画面を常にレンダリング（スプラッシュの下） */}
      {isReady && (
        <View style={styles.rootContainer}>
          <ThemeProvider>
            <AlertProvider>
              <ToastProvider>
                <Stack screenOptions={{ headerShown: false }}>
                  <Stack.Screen name="index" />
                  <Stack.Screen
                    name="snippet/create"
                    options={{
                      presentation: 'modal',
                      headerShown: false
                    }}
                  />
                  <Stack.Screen
                    name="snippet/edit"
                    options={{
                      presentation: 'modal',
                      headerShown: false
                    }}
                  />
                  <Stack.Screen name="settings" />
                </Stack>
              </ToastProvider>
            </AlertProvider>
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
