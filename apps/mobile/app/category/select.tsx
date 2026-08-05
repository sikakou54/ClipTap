/**
 * @module CategorySelectModal
 * @description カテゴリ選択モーダル
 *
 * 定型文に関連付けるカテゴリを選択するためのモーダル画面。
 *
 * @features
 * - 既存カテゴリの一覧表示
 * - 「なし」オプションによるカテゴリ未設定
 * - 新規カテゴリ作成への導線
 * - 現在選択中のカテゴリのハイライト表示
 *
 * @see lib/hooks/screens/useCategorySelectScreen.ts - ビジネスロジック
 */

import React, { useCallback } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, ListRenderItem } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from '@cliptap/shared'
import { Ionicons } from '@expo/vector-icons';
import {
  useCategorySelectScreen,
  CategoryOption,
} from '@hooks/screens/useCategorySelectScreen';
import { ScreenContainer } from '@components/common/ScreenContainer';

export default function CategorySelectModal() {
  const { t } = useTranslation();
  const params = useLocalSearchParams();

  const selectedId = params.selectedId as string | undefined;

  const {
    options,
    selectedCategoryId,
    colors,
    responsiveFontSizes,
    handleItemPress,
  } = useCategorySelectScreen({ selectedId });

  const renderItem: ListRenderItem<CategoryOption> = useCallback(
    ({ item }) => {
      const isSelected = item.id === selectedCategoryId;
      const categoryColor = item.color || colors.primary;
      const isCreateNew = item.id === 'create-new';

      /* カテゴリ選択アイテム */
      return (
        <TouchableOpacity
          style={[
            styles.item,
            { borderBottomColor: colors.border },
            isCreateNew && styles.createNewItem,
          ]}
          onPress={() => handleItemPress(item)}
        >
          <View style={styles.itemLeft}>
            {/* 新規作成アイコンまたはカラーインジケーター */}
            {isCreateNew ? (
              <View style={styles.iconContainer}>
                <Ionicons name="add-circle" size={32} color={colors.primary} />
              </View>
            ) : (
              <View style={[styles.colorIndicator, { backgroundColor: categoryColor }]} />
            )}
            {/* カテゴリ名 */}
            <Text
              style={[
                styles.itemText,
                {
                  color: isCreateNew ? colors.primary : colors.text,
                  fontSize: responsiveFontSizes.base,
                },
              ]}
            >
              {item.name}
            </Text>
          </View>
          {/* 選択中のチェックマーク */}
          {isSelected && !isCreateNew && (
            <Ionicons name="checkmark" size={24} color={colors.primary} />
          )}
        </TouchableOpacity>
      );
    },
    [selectedCategoryId, colors, responsiveFontSizes, handleItemPress]
  );

  /* カテゴリ選択モーダル */
  return (
    <ScreenContainer title={t('category.select')} isModal>
      {/* カテゴリ一覧（FlatList） */}
      <FlatList
        data={options}
        keyExtractor={(item) => item.id || 'uncategorized'}
        renderItem={renderItem}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  colorIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
  },
  iconContainer: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  itemText: {},
  createNewItem: {
    borderBottomWidth: 0,
  },
});
