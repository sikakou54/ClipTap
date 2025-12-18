/**
 * カテゴリ選択モーダル（expo-router modal）
 */

import React, { useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../lib/themeSystem';
import { useCategories } from '../../lib/hooks/useCategories';
import { Header } from '../../components/common/Header';
import { commonStyles } from '../../lib/styles/commonStyles';

export default function CategorySelectModal() {
  const { t } = useTranslation();
  const { colors, isTablet, responsiveFontSizes } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams();

  const { categories, refresh } = useCategories();

  // カテゴリ作成画面から戻ってきた時にカテゴリ一覧を再読み込み
  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );
  const selectedCategoryId = params.selectedId === 'null' ? null : (params.selectedId as string | undefined);

  const handleSelect = (categoryId: string | null) => {
    // グローバルコールバックで選択結果を返す
    if (global.categorySelectCallback) {
      global.categorySelectCallback(categoryId);
    }
    router.back();
  };

  const handleCreateNew = () => {
    router.push('/category/edit');
  };

  const uncategorizedOption = {
    id: null,
    name: t('category.uncategorized'),
    color: colors.textSecondary,
    icon: 'remove-circle-outline',
  };

  const createNewOption = {
    id: 'create-new',
    name: t('category.create'),
    color: colors.primary,
    icon: 'add-circle-outline',
  };

  const options = [uncategorizedOption, ...categories, createNewOption];

  return (
    <SafeAreaView
      style={[commonStyles.container, { backgroundColor: colors.background }]}
      edges={['top', 'left', 'right']}
    >
      <Header title={t('category.select')} isModal />

      <FlatList
        data={options}
        keyExtractor={(item) => item.id || 'uncategorized'}
        renderItem={({ item }) => {
          const isSelected = item.id === selectedCategoryId;
          const categoryColor = item.color || colors.primary;
          const isCreateNew = item.id === 'create-new';

          return (
            <TouchableOpacity
              style={[
                styles.item,
                {
                  borderBottomColor: colors.border,
                  backgroundColor: colors.surface,
                },
                isCreateNew && styles.createNewItem,
              ]}
              onPress={() => {
                if (isCreateNew) {
                  handleCreateNew();
                } else {
                  handleSelect(item.id);
                }
              }}
            >
              <View style={styles.itemLeft}>
                {isCreateNew ? (
                  <View style={styles.iconContainer}>
                    <Ionicons name="add-circle" size={32} color={colors.primary} />
                  </View>
                ) : (
                  <View
                    style={[
                      styles.colorIndicator,
                      { backgroundColor: categoryColor },
                    ]}
                  />
                )}
                <Text style={[
                  styles.itemText,
                  {
                    color: isCreateNew ? colors.primary : colors.text,
                    fontSize: responsiveFontSizes.base,
                  }
                ]}>
                  {item.name}
                </Text>
              </View>
              {isSelected && !isCreateNew && (
                <Ionicons name="checkmark" size={24} color={colors.primary} />
              )}
            </TouchableOpacity>
          );
        }}
      />
    </SafeAreaView>
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
  itemText: {
  },
  createNewItem: {
    borderBottomWidth: 0,
  },
});
