/**
 * WebView Screen
 * HTMLファイルを表示
 */

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { WebView } from 'react-native-webview';
import * as FileSystem from 'expo-file-system';
import { Asset } from 'expo-asset';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../lib/themeSystem';
import { Header } from '../components/common/Header';
import { commonStyles } from '../lib/styles/commonStyles';
import { Logger } from '../lib/logger';

export default function WebViewScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams();
  const { file, title } = params;
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHtmlFile();
  }, [file]);

  const loadHtmlFile = async () => {
    try {
      let assetModule;

      if (file === 'terms') {
        assetModule = require('../assets/web/terms.html');
      } else if (file === 'privacy') {
        assetModule = require('../assets/web/privacy.html');
      } else {
        assetModule = require('../assets/web/index.html');
      }

      const asset = Asset.fromModule(assetModule);
      await asset.downloadAsync();

      if (asset.localUri) {
        const content = await FileSystem.readAsStringAsync(asset.localUri);
        setHtmlContent(content);
      }
    } catch (error) {
      Logger.error('Failed to load HTML file:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <View style={[commonStyles.container, { backgroundColor: colors.background }]}>
        <Header title={(title as string) || 'ClipTap'} backIcon="arrow-back" />

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
