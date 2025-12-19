/**
 * カテゴリバッジコンポーネント
 *
 * カテゴリを視覚的に表現する小さなバッジ。
 * カテゴリの色を使用して背景色とテキスト色を設定。
 *
 * 主な機能:
 * - カテゴリ名の表示
 * - カテゴリカラーの反映（背景は20%透過）
 * - 2サイズ対応（small, medium）
 *
 * @see SnippetCard - スニペットカード内での使用
 * @see SnippetFormScreen - フォーム内での使用
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@lib/themeSystem';
import { Category } from '@cliptap/shared';

/* ========================================
   Props定義
   ======================================== */

/**
 * CategoryBadgeのProps
 * @property category - 表示するカテゴリオブジェクト
 * @property size - バッジサイズ（small: 小さめ, medium: 通常サイズ）
 */
interface CategoryBadgeProps {
  category: Category;
  size?: 'small' | 'medium';
}

export function CategoryBadge({ category, size = 'medium' }: CategoryBadgeProps) {
  const { colors } = useTheme();

  const badgeColor = category.color || colors.primary;
  const fontSize = size === 'small' ? 12 : 14;

  /* カテゴリバッジコンテナ */
  return (
    <View
      style={[
        styles.badge,
        size === 'small' ? styles.badgeSmall : styles.badgeMedium,
        { backgroundColor: `${badgeColor}20` },
      ]}
    >
      {/* カテゴリ名 */}
      <Text style={[
        styles.text,
        { color: badgeColor, fontSize }
      ]}>
        {category.name}
      </Text>
    </View>
  );
}

/* ========================================
   スタイル定義
   ======================================== */
const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  badgeSmall: {
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  badgeMedium: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  text: {
    fontWeight: '500',
  },
});
