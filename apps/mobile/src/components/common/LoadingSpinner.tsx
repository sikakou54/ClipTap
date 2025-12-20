/**
 * ローディングスピナーコンポーネント
 *
 * 処理中の状態を示すインジケーター。
 * インライン表示とフルスクリーン表示の両方に対応。
 *
 * 主な機能:
 * - 3サイズ対応（small, medium, large）
 * - オプションのメッセージ表示
 * - フルスクリーンオーバーレイモード
 * - テーマカラー対応
 *
 * 使用場面:
 * - データ読み込み中
 * - 保存処理中
 * - 画面遷移中
 *
 * @see SnippetFormScreen - 使用例
 */

import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { useTheme } from '@lib/themeSystem';

/*
 * ========================================
 * 型定義
 * ========================================
 */

/**
 * スピナーサイズ
 * - small: 小さめ（インライン表示向け）
 * - medium: 中サイズ（デフォルト）
 * - large: 大きめ（フルスクリーン向け）
 */
type LoadingSize = 'small' | 'medium' | 'large';

/*
 * ========================================
 * Props定義
 * ========================================
 */

/**
 * LoadingSpinnerのProps
 * @property message - スピナー下部に表示するメッセージ
 * @property size - スピナーのサイズ（デフォルト: medium）
 * @property fullScreen - フルスクリーンオーバーレイ表示（デフォルト: false）
 */
interface LoadingSpinnerProps {
  message?: string;
  size?: LoadingSize;
  fullScreen?: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message,
  size = 'medium',
  fullScreen = false,
}) => {
  /*
   * ========================================
   * Hooks & コンテキスト
   * ========================================
   */
  const { colors, spacing, typography } = useTheme();

  /*
   * ========================================
   * ヘルパー関数
   * ========================================
   */

  /**
   * サイズプロパティをActivityIndicatorの形式に変換
   * React NativeのActivityIndicatorは'small'と'large'のみサポート
   */
  const getSizeValue = (): 'small' | 'large' => {
    return size === 'small' ? 'small' : 'large';
  };

  /*
   * ========================================
   * レンダリング
   * ========================================
   */

  /* ローディングスピナーコンテンツ */
  const content = (
    <View style={[
      styles.container,
      fullScreen && styles.fullScreen,
      { gap: spacing.sm }
    ]}>
      {/* アクティビティインジケーター */}
      <ActivityIndicator
        size={getSizeValue()}
        color={colors.primary}
      />
      {/* メッセージ（オプション） */}
      {message && (
        <Text style={[
          typography.body,
          { color: colors.textSecondary }
        ]}>
          {message}
        </Text>
      )}
    </View>
  );

  if (fullScreen) {
    /* フルスクリーンオーバーレイコンテナ */
    return (
      <View style={[
        styles.fullScreenContainer,
        { backgroundColor: colors.background }
      ]}>
        {content}
      </View>
    );
  }

  return content;
};

/*
 * ========================================
 * スタイル定義
 * ========================================
 */
const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  fullScreen: {
    flex: 1,
  },
  /** zIndex: 1000で最前面に配置 */
  fullScreenContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
});

export default LoadingSpinner;
