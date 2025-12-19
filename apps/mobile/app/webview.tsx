/**
 * @module WebViewScreen
 * @description WebView画面
 *
 * 利用規約やプライバシーポリシーなどの静的HTMLコンテンツを表示。
 * アプリ内のassets/html/配下のHTMLファイルを読み込む。
 *
 * @param file - 表示するHTMLファイル名（拡張子なし）
 * @param title - ヘッダーに表示するタイトル
 *
 * @see assets/html/terms.html - 利用規約
 * @see assets/html/privacy.html - プライバシーポリシー
 */

import React from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { WebView } from 'react-native-webview';
import { useTheme } from '@lib/themeSystem';
import { Header } from '@components/common/Header';
import { commonStyles } from '@lib/styles/commonStyles';
import { useWebViewScreen } from '@hooks/screens/useWebViewScreen';

export default function WebViewScreen() {
  const { colors } = useTheme();
  const { file, title: paramTitle } = useLocalSearchParams<{ file: string; title: string }>();

  const { htmlContent, loading, title } = useWebViewScreen({
    file: file ?? '',
    title: paramTitle ?? 'ClipTap',
  });

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[commonStyles.container, { backgroundColor: colors.background }]}>
        <Header title={title} backIcon="arrow-back" />

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <WebView
            source={{ html: htmlContent }}
            style={styles.webview}
            originWhitelist={['*']}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={true}
          />
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  webview: {
    flex: 1,
  },
});
