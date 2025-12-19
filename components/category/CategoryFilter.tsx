/**
 * カテゴリフィルターコンポーネント
 *
 * スニペット一覧をカテゴリでフィルタリングするための水平スクロール可能なチップ。
 * メイン画面の上部に配置され、ワンタップでフィルター切り替え。
 *
 * 主な機能:
 * - 「すべて」オプション（フィルターなし）
 * - カテゴリ別チップ（色付き）
 * - 選択状態の視覚的フィードバック
 * - 水平スクロール対応
 *
 * @see app/(tabs)/index.tsx - メイン画面での使用
 */

import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useTranslation } from '@cliptap/shared';
import { useTheme } from '@lib/themeSystem';
import { Category } from '@cliptap/shared';
import { UI_CONSTANTS } from '@constants/ui';

/* ========================================
   Props定義
   ======================================== */

/**
 * CategoryFilterのProps
 * @property categories - フィルター対象のカテゴリ一覧
 * @property selectedCategoryId - 現在選択中のカテゴリID（nullで「すべて」）
 * @property onSelectCategory - カテゴリ選択時のコールバック
 */
interface CategoryFilterProps {
  categories: Category[];
  selectedCategoryId: string | null;
  onSelectCategory: (categoryId: string | null) => void;
}

export function CategoryFilter({
  categories,
  selectedCategoryId,
  onSelectCategory,
}: CategoryFilterProps) {
  const { t } = useTranslation();
  const { colors, responsiveFontSizes } = useTheme();

  const allOption = {
    id: null,
    name: t('category.all'),
  };

  const options = [allOption, ...categories];

  /* カテゴリフィルターコンテナ */
  return (
    <View style={styles.wrapper}>
      {/* 水平スクロール可能なカテゴリチップ一覧 */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.container}
      >
        {options.map((option) => {
          const isSelected = option.id === selectedCategoryId;
          const categoryColor = option.id ? (categories.find(c => c.id === option.id)?.color || colors.primary) : colors.primary;

          /* カテゴリチップ */
          return (
            <TouchableOpacity
              key={option.id || 'all'}
              style={[
                styles.chip,
                {
                  backgroundColor: isSelected ? categoryColor : colors.surface,
                  borderColor: isSelected ? categoryColor : colors.border,
                },
              ]}
              onPress={() => onSelectCategory(option.id)}
            >
              {/* カテゴリ名 */}
              <Text
                style={[
                  styles.text,
                  {
                    color: isSelected ? '#FFFFFF' : colors.text,
                    fontSize: responsiveFontSizes.xs,
                  },
                ]}
              >
                {option.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

/* ========================================
   スタイル定義
   ======================================== */
const styles = StyleSheet.create({
  wrapper: {
    paddingTop: 0,
    paddingBottom: UI_CONSTANTS.GAP.BASE,
  },
  container: {
    paddingHorizontal: UI_CONSTANTS.SPACING.LG,
    gap: UI_CONSTANTS.GAP.MD,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: UI_CONSTANTS.GAP.BASE,
    paddingVertical: UI_CONSTANTS.GAP.SM,
    borderRadius: UI_CONSTANTS.BORDER_RADIUS.XL,
    borderWidth: UI_CONSTANTS.BORDER_WIDTH.THIN,
    height: UI_CONSTANTS.SIZE.ICON_CONTAINER_MD,
  },
  text: {
    fontWeight: UI_CONSTANTS.FONT_WEIGHT.MEDIUM,
  },
});
