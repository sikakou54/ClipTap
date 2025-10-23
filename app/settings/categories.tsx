import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../lib/themeSystem';
import { useCategories } from '../../lib/hooks/useCategories';
import { Category } from '../../lib/types/category';
import { CreateCategoryModal } from '../../components/category/CreateCategoryModal';
import { EditCategoryModal } from '../../components/category/EditCategoryModal';
import EmptyState from '../../components/common/EmptyState';

export default function CategoryManagementScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const router = useRouter();

  const { categories, loading, refresh, deleteCategory } = useCategories();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  const handleEditCategory = (category: Category) => {
    setSelectedCategory(category);
    setShowEditModal(true);
  };

  const handleDeleteCategory = (category: Category) => {
    Alert.alert(
      t('category.delete_confirm'),
      undefined,
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteCategory(category.id);
            } catch (error) {
              Alert.alert(t('error.generic'));
            }
          },
        },
      ]
    );
  };

  if (categories.length === 0 && !loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>{t('category.title')}</Text>
          <TouchableOpacity
            onPress={() => setShowCreateModal(true)}
            style={styles.addButton}
          >
            <Ionicons name="add" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>

        <EmptyState
          icon="folder-outline"
          message={t('category.no_categories')}
        />

        <CreateCategoryModal
          visible={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={refresh}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('category.title')}</Text>
        <TouchableOpacity
          onPress={() => setShowCreateModal(true)}
          style={styles.addButton}
        >
          <Ionicons name="add" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={categories}
        keyExtractor={(item) => item.id}
        refreshing={loading}
        onRefresh={refresh}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const categoryColor = item.color || colors.primary;

          return (
            <View
              style={[
                styles.categoryCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <View style={styles.categoryLeft}>
                <View
                  style={[
                    styles.colorIndicator,
                    { backgroundColor: categoryColor },
                  ]}
                />
                <View>
                  <Text style={[styles.categoryName, { color: colors.text }]}>
                    {item.name}
                  </Text>
                </View>
              </View>

              <View style={styles.categoryActions}>
                <TouchableOpacity
                  onPress={() => handleEditCategory(item)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  style={styles.actionButton}
                >
                  <Ionicons name="pencil-outline" size={20} color={colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleDeleteCategory(item)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  style={styles.actionButton}
                >
                  <Ionicons name="trash-outline" size={20} color={colors.error} />
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
      />

      <CreateCategoryModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={refresh}
      />

      <EditCategoryModal
        visible={showEditModal}
        category={selectedCategory}
        onClose={() => {
          setShowEditModal(false);
          setSelectedCategory(null);
        }}
        onSuccess={refresh}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  addButton: {
    padding: 4,
  },
  list: {
    padding: 16,
  },
  categoryCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  categoryLeft: {
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
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
  },
  categoryActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionButton: {
    padding: 4,
  },
});
