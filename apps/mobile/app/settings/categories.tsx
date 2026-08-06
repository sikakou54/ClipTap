/**
 * @module CategoryManagementScreen
 * @description カテゴリ管理画面
 *
 * 定型文を分類するためのカテゴリを一覧表示・管理。
 *
 * @features
 * - カテゴリ一覧の表示（FlashListによる高速レンダリング）
 * - カテゴリの新規作成/編集/削除
 * - Pull-to-refreshによるデータ更新
 *
 * @note 削除時、紐づく定型文はカテゴリなしになる（ON DELETE SET NULL）
 *
 * @see lib/hooks/screens/useCategoriesScreen.ts - ビジネスロジック
 */

import { useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTranslation } from '@cliptap/shared'
import { FlashList, ListRenderItemInfo } from '@mobile-types/flashlist';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@lib/themeSystem';
import { useCategoriesScreen } from '@hooks/screens/useCategoriesScreen';
import { Category } from '@cliptap/shared';
import EmptyState from '@components/common/EmptyState';
import { ScreenContainer } from '@components/common/ScreenContainer';
import { commonStyles, listStyles } from '@lib/styles/commonStyles';
import { UI_CONSTANTS } from '@constants/ui';

export default function CategoryManagementScreen() {
  const { t } = useTranslation();
  const { colors, responsiveFontSizes, responsiveLineHeights } = useTheme();

  const {
    categories,
    loading,
    handleRefresh,
    handleCreateCategory,
    handleEditCategory,
    handleDeleteCategory,
  } = useCategoriesScreen();

  const renderItem = useCallback(
    ({ item, index }: ListRenderItemInfo<Category>) => {
      const categoryColor = item.color || colors.primary;

      return (
        <>
          {/* カテゴリアイテム */}
          <TouchableOpacity
            style={listStyles.listItem}
            onPress={() => handleEditCategory(item)}
            activeOpacity={0.7}
          >
            <View style={styles.categoryLeft}>
              {/* カテゴリカラーインジケーター */}
              <View style={[styles.colorIndicator, { backgroundColor: categoryColor }]} />
              {/* カテゴリ名 */}
              <Text
                style={[
                  styles.categoryName,
                  { color: colors.text, fontSize: responsiveFontSizes.base, lineHeight: responsiveLineHeights.base },
                ]}
              >
                {item.name}
              </Text>
            </View>

            {/* 削除ボタン */}
            <View style={styles.categoryActions}>
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation();
                  handleDeleteCategory(item);
                }}
                hitSlop={UI_CONSTANTS.HIT_SLOP.DEFAULT}
                style={commonStyles.actionButton}
              >
                <Ionicons name="trash-outline" size={20} color={colors.error} />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
          {/* セパレーター（最後のアイテム以外） */}
          {index < categories.length - 1 && (
            <View style={[listStyles.separator, { backgroundColor: colors.border }]} />
          )}
        </>
      );
    },
    [categories.length, colors, responsiveFontSizes, responsiveLineHeights, handleEditCategory, handleDeleteCategory]
  );

  const headerRightAction = (
    <TouchableOpacity onPress={handleCreateCategory} style={commonStyles.addButton}>
      <Ionicons name="add" size={24} color={colors.primary} />
    </TouchableOpacity>
  );

  if (categories.length === 0 && !loading) {
    /* 空状態（カテゴリがない場合） */
    return (
      <ScreenContainer title={t('category.title')} backIcon="arrow-back" rightAction={headerRightAction}>
        <EmptyState icon="folder-outline" message={t('category.no_categories')} />
      </ScreenContainer>
    );
  }

  /* カテゴリ管理画面 */
  return (
    <ScreenContainer title={t('category.title')} backIcon="arrow-back" rightAction={headerRightAction}>
      {/* カテゴリ一覧（FlashList） */}
      <FlashList
        data={categories}
        keyExtractor={(item) => item.id}
        onRefresh={handleRefresh}
        refreshing={false}
        contentContainerStyle={styles.list}
        estimatedItemSize={60}
        renderItem={renderItem}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  list: {
    flexGrow: 1,
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  colorIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 16,
  },
  categoryName: {
    fontWeight: '500',
  },
  categoryActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
});
