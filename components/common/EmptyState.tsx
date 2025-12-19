/**
 * 空状態表示コンポーネント
 *
 * データが存在しない場合に表示する空状態UI。
 * アイコン、メッセージ、説明文、アクションボタンを表示。
 *
 * 主な機能:
 * - アイコン表示（カスタマイズ可能）
 * - メッセージ表示
 * - 詳細説明文（オプション）
 * - アクションボタン（オプション）
 * - 3種類のサイズバリエーション
 *
 * バリエーション:
 * - default: 標準サイズ
 * - compact: コンパクトサイズ（リスト内など）
 * - large: 大きめサイズ（全画面空状態）
 *
 * @see SnippetList - スニペット空状態での使用例
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@lib/themeSystem';
import { CommonButton } from './CommonButton';

/*
 * ========================================
 * 型定義
 * ========================================
 */

/** 表示サイズバリエーション */
type EmptyStateVariant = 'default' | 'compact' | 'large';

/*
 * ========================================
 * Props定義
 * ========================================
 */

/**
 * EmptyStateのProps
 * @property icon - 表示するアイコン名（デフォルト: file-tray-outline）
 * @property message - メインメッセージ
 * @property description - 詳細説明文（オプション）
 * @property variant - サイズバリエーション
 * @property actionLabel - アクションボタンのラベル
 * @property onActionPress - アクションボタン押下時のコールバック
 */
interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  message: string;
  description?: string;
  variant?: EmptyStateVariant;
  actionLabel?: string;
  onActionPress?: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon = 'file-tray-outline',
  message,
  description,
  variant = 'default',
  actionLabel,
  onActionPress,
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

  /** バリエーションに応じたアイコンサイズを取得 */
  const getIconSize = () => {
    switch (variant) {
      case 'compact': return 40;
      case 'large': return 80;
      default: return 60;
    }
  };

  /** バリエーションに応じたパディングを取得 */
  const getPadding = () => {
    switch (variant) {
      case 'compact': return spacing.lg;
      case 'large': return spacing.xxl;
      default: return spacing.xl;
    }
  };

  /*
   * ========================================
   * レンダリング
   * ========================================
   */

  /* 空状態表示コンテナ */
  return (
    <View style={[
      styles.container,
      { padding: getPadding() }
    ]}>
      {/* アイコン */}
      <Ionicons
        name={icon}
        size={getIconSize()}
        color={colors.textTertiary}
        style={{ marginBottom: spacing.md }}
      />

      {/* メインメッセージ */}
      <Text style={[
        variant === 'compact' ? typography.body : typography.h3,
        { color: colors.text, textAlign: 'center', marginBottom: spacing.xs }
      ]}>
        {message}
      </Text>

      {/* 詳細説明文（オプション） */}
      {description && (
        <Text style={[
          typography.bodySmall,
          { color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.md }
        ]}>
          {description}
        </Text>
      )}

      {/* アクションボタン（オプション） */}
      {actionLabel && onActionPress && (
        <CommonButton
          title={actionLabel}
          onPress={onActionPress}
          type="primary"
          size="medium"
        />
      )}
    </View>
  );
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
  },
});

export default EmptyState;
