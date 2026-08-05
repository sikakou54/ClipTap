/**
 * カスタムスプラッシュスクリーンコンポーネント
 *
 * アプリ起動時に表示されるスプラッシュ画面。
 * アプリアイコンを1秒表示した後、フェードアウトして終了。
 *
 * 動作フロー:
 * 1. コンポーネントマウント時にonReadyを呼び出し
 * 2. isLoadingがfalseになるまで待機
 * 3. 1秒間表示を維持
 * 4. 500msかけてフェードアウト
 * 5. onFinishコールバックで終了を通知
 *
 * 技術的ポイント:
 * - Animated.Valueでスムーズなフェードアウト
 * - useNativeDriver: false（背景色もアニメーション対象のため）
 * - pointerEvents="none"でタッチイベントを透過
 * - zIndex: 9999で最前面に表示
 *
 * @see app/_layout.tsx - 使用例
 */

import React, { useEffect, useRef, useState } from 'react';
import { View, Image, Animated, StyleSheet } from 'react-native';
import appIcon from '@assets/icon.png';

/*
 * ========================================
 * Props定義
 * ========================================
 */

/**
 * SplashScreenのProps
 * @property onFinish - スプラッシュ終了時のコールバック（メインコンテンツ表示開始）
 * @property isLoading - 初期化処理中フラグ（trueの間はフェードアウトを待機）
 * @property onReady - コンポーネント準備完了コールバック（ネイティブスプラッシュ非表示用）
 */
interface SplashScreenProps {
  onFinish: () => void;
  isLoading?: boolean;
  onReady?: () => void;
}

export function SplashScreen({ onFinish, isLoading, onReady }: SplashScreenProps) {
  /*
   * ========================================
   * Refs / State
   * ========================================
   */
  /** フェードアニメーション値（1=完全表示, 0=完全透明） */
  /* useStateの初期化子は初回マウント時のみ評価されるため、useRefと同じ単一インスタンスを保持する */
  const [fadeAnim] = useState(() => new Animated.Value(1));
  const hasCalledReady = useRef(false);

  /*
   * ========================================
   * 副作用（useEffect）
   * ========================================
   */

  /**
   * コンポーネント準備完了通知
   * requestAnimationFrameを3回ネストして確実に描画完了後にonReadyを実行
   */
  useEffect(() => {
    if (!hasCalledReady.current && onReady) {
      hasCalledReady.current = true;
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            onReady();
          });
        });
      });
    }
  }, [onReady]);

  /**
   * フェードアウトアニメーション制御
   * isLoadingがfalseになったら1秒待機後、500msかけてフェードアウト
   * useNativeDriver: false - 背景色もアニメーション対象のため
   */
  useEffect(() => {
    if (isLoading) {
      return;
    }

    const timer = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: false,
      }).start(() => {
        onFinish();
      });
    }, 1000);

    return () => clearTimeout(timer);
  }, [fadeAnim, onFinish, isLoading]);

  /*
   * ========================================
   * レンダリング
   * ========================================
   */

  /* スプラッシュスクリーン（最前面に表示、タッチイベント無効） */
  return (
    <View style={styles.wrapper} pointerEvents="none">
      {/* フェードアニメーションコンテナ */}
      <Animated.View
        style={[
          styles.container,
          {
            opacity: fadeAnim,
          },
        ]}
      >
        {/* アプリアイコン */}
        <Image
          source={appIcon}
          style={styles.logo}
          resizeMode="contain"
        />
      </Animated.View>
    </View>
  );
}

/*
 * ========================================
 * スタイル定義
 * ========================================
 */
const styles = StyleSheet.create({
  /** zIndex: 9999で最前面に配置 */
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
