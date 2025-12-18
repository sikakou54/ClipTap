import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../lib/themeSystem';
import { useCategories } from '../../lib/hooks/useCategories';
import { Category } from '../../lib/types/category';
import EmptyState from '../../components/common/EmptyState';
import { Header } from '../../components/common/Header';
import { commonStyles, listStyles } from '../../lib/styles/commonStyles';
import { showConfirm, showError } from '../../lib/utils/alerts';
import { UI_CONSTANTS } from '../../lib/constants/ui';

export default function CategoryManagementScreen() {
  const { t } = useTranslation();
  const { colors, responsiveFontSizes, responsiveLineHeights } = useTheme();
  const router = useRouter();

  const { categories, loading, refresh, deleteCategory } = useCategories();

  // 画面がフォーカスされた時にリフレッシュ
  useFocusEffect(
    React.useCallback(() => {
      refresh();
    }, [refresh])
  );

  const handleCreateCategory = () => {
    router.push('/category/edit');
  };

  const handleEditCategory = (category: Category) => {
    router.push({
      pathname: '/category/edit',
      params: { id: category.id },
    });
  };

  const handleDeleteCategory = (category: Category) => {
    showConfirm(
      'category.delete_confirm',
      async () => {
        try {
          await deleteCategory(category.id);
        } catch (error) {
          showError();
        }
      }
    );
  };

  if (categories.length === 0 && !loading) {
    return (
      <View style={[commonStyles.container, { backgroundColor: colors.background }]}>
        <Header
          title={t('category.title')}
          backIcon="arrow-back"
          rightAction={
            <TouchableOpacity onPress={handleCreateCategory} style={commonStyles.addButton}>
              <Ionicons name="add" size={24} color={colors.primary} />
            </TouchableOpacity>
          }
        />

        <EmptyState
          icon="folder-outline"
          message={t('category.no_categories')}
        />
      </View>
    );
  }

  return (
    <View style={[commonStyles.container, { backgroundColor: colors.background }]}>
      <Header
        title={t('category.title')}
        backIcon="arrow-back"
        rightAction={
          <TouchableOpacity onPress={handleCreateCategory} style={commonStyles.addButton}>
            <Ionicons name="add" size={24} color={colors.primary} />
          </TouchableOpacity>
        }
      />

      <FlatList
        data={categories}
        keyExtractor={(item) => item.id}
        refreshing={loading}
        onRefresh={refresh}
        contentContainerStyle={styles.list}
        style={[listStyles.listContainer, { backgroundColor: colors.surface }]}
        removeClippedSubviews={false}
        initialNumToRender={50}
        maxToRenderPerBatch={50}
        windowSize={21}
        renderItem={({ item, index }) => {
          const categoryColor = item.color || colors.primary;

          return (
            <>
              <TouchableOpacity
                style={listStyles.listItem}
                onPress={() => handleEditCategory(item)}
                activeOpacity={0.7}
              >
                <View style={styles.categoryLeft}>
                  <View
                    style={[
                      styles.colorIndicator,
                      { backgroundColor: categoryColor },
                    ]}
                  />
                  <Text style={[styles.categoryName, { color: colors.text, fontSize: responsiveFontSizes.base, lineHeight: responsiveLineHeights.base }]}>
                    {item.name}
                  </Text>
                </View>

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
              {index < categories.length - 1 && (
                <View style={[listStyles.separator, { backgroundColor: colors.border }]} />
              )}
            </>
          );
        }}
      />
    </View>
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
