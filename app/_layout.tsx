/**
 * ルートレイアウト
 * アプリ全体のプロバイダーとレイアウトを管理
 */

import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { ThemeProvider } from '../lib/themeSystem';
import { AlertProvider } from '../lib/providers/AlertProvider';
import { ToastProvider } from '../lib/providers/ToastProvider';
import { database as oldDatabase } from '../lib/database';
import { database } from '../lib/database/database';
import { initI18n } from '../lib/i18n/config';
import { Logger } from '../lib/logger';

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    async function initialize() {
      try {
        // 既存のデータベース初期化（互換性のため）
        try {
          await oldDatabase.initialize();
        } catch (err) {
          console.log('Old database initialization skipped:', err);
        }

        // 新しいデータベース初期化
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

  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
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
  );
}
