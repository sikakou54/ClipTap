/**
 * 空状態表示コンポーネント
 *
 * データが存在しない場合に表示する空状態UI。
 * アイコン、メッセージ、説明文を表示。
 *
 * 主な機能:
 * - アイコン表示（カスタマイズ可能）
 * - メッセージ表示
 * - 詳細説明文（オプション）
 *
 * @see SnippetList - スニペット空状態での使用例
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@lib/themeSystem';

/** 空状態アイコンのサイズ */
const EMPTY_STATE_ICON_SIZE = 60;

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
 */
interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  message: string;
  description?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon = 'file-tray-outline',
  message,
  description,
}) => {
  /*
   * ========================================
   * Hooks & コンテキスト
   * ========================================
   */
  const { colors, spacing, typography } = useTheme();

  /*
   * ========================================
   * レンダリング
   * ========================================
   */

  /* 空状態表示コンテナ */
  return (
    <View style={[
      styles.container,
      { padding: spacing.xl }
    ]}>
      {/* アイコン */}
      <Ionicons
        name={icon}
        size={EMPTY_STATE_ICON_SIZE}
        color={colors.textTertiary}
        style={{ marginBottom: spacing.md }}
      />

      {/* メインメッセージ */}
      <Text style={[
        typography.h3,
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
