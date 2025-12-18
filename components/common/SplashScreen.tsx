/**
 * カスタムスプラッシュスクリーン
 * アプリアイコンを1秒表示してフェードアウト
 */

import React, { useEffect, useRef } from 'react';
import { View, Image, Animated, StyleSheet } from 'react-native';

interface SplashScreenProps {
  onFinish: () => void;
  isLoading?: boolean;
  onReady?: () => void;
}

export function SplashScreen({ onFinish, isLoading, onReady }: SplashScreenProps) {
  const fadeAnim = useRef(new Animated.Value(1)).current; // 最初から表示状態
  const hasCalledReady = useRef(false);

  // コンポーネントがマウントされたらonReadyを呼ぶ
  useEffect(() => {
    if (!hasCalledReady.current && onReady) {
      hasCalledReady.current = true;
      // レンダリング完了を保証するため、複数フレーム待つ
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            onReady();
          });
        });
      });
    }
  }, [onReady]);

  useEffect(() => {
    // 初期化中は何もしない
    if (isLoading) {
      return;
    }

    // 初期化完了後、1秒後にフェードアウト開始
    const timer = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 500, // フェードアウト時間500ms
        useNativeDriver: false, // 背景色も含めてフェードさせるためfalseに設定
      }).start(() => {
        onFinish();
      });
    }, 1000);

    return () => clearTimeout(timer);
  }, [fadeAnim, onFinish, isLoading]);

  return (
    <View style={styles.wrapper} pointerEvents="none">
      <Animated.View
        style={[
          styles.container,
          {
            opacity: fadeAnim,
          },
        ]}
      >
        <Image
          source={require('../../assets/icon.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#1F2937',
    zIndex: 9999,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1F2937',
  },
  logo: {
    width: 200,
    height: 200
  },
});
