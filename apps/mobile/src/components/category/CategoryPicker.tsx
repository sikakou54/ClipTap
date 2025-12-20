/**
 * カテゴリ選択モーダルコンポーネント
 *
 * スニペット作成・編集時にカテゴリを選択するためのボトムシート形式モーダル。
 * カテゴリ一覧表示と新規カテゴリ作成機能を提供。
 *
 * 主な機能:
 * - 「カテゴリなし」オプション
 * - 既存カテゴリ一覧（色付きインジケーター）
 * - 新規カテゴリ作成（モーダル内モーダル）
 * - 選択中のカテゴリにチェックマーク表示
 *
 * @see SnippetFormScreen - スニペットフォームでの使用
 * @see CategoryModal - 新規作成用モーダル
 */

import React from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList, StyleSheet } from 'react-native';
import { useTranslation } from '@cliptap/shared';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@lib/themeSystem';
import { Category } from '@cliptap/shared';
import { CategoryModal } from './CategoryModal';
import { UI_CONSTANTS } from '@constants/ui';
import { useCategoryPicker } from '@hooks/components/useCategoryPicker';

/* ========================================
   Props定義
   ======================================== */

/**
 * CategoryPickerのProps
 * @property categories - 選択可能なカテゴリ一覧
 * @property selectedCategoryId - 現在選択中のカテゴリID（nullで「カテゴリなし」）
 * @property onSelect - カテゴリ選択時のコールバック
 * @property visible - モーダル表示状態
 * @property onClose - 閉じる時のコールバック
 * @property onCategoryCreated - 新規カテゴリ作成後のコールバック
 */
interface CategoryPickerProps {
  categories: Category[];
  selectedCategoryId: string | null;
  onSelect: (categoryId: string | null) => void;
  visible: boolean;
  onClose: () => void;
  onCategoryCreated?: () => void;
}

export function CategoryPicker({
  categories,
  selectedCategoryId,
  onSelect,
  visible,
  onClose,
  onCategoryCreated,
}: CategoryPickerProps) {
  const { t } = useTranslation();
  const { colors, responsiveFontSizes, responsiveLineHeights } = useTheme();

  /* フックからロジックを取得 */
  const {
    showCreateModal,
    options,
    handleSelect,
    handleOpenCreateModal,
    handleCloseCreateModal,
    handleCategoryCreated,
  } = useCategoryPicker({
    categories,
    selectedCategoryId,
    onSelect,
    onClose,
    onCategoryCreated,
  });

  /* カテゴリ選択モーダル（ボトムシート形式） */
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      {/* オーバーレイ */}
      <View style={styles.modalOverlay}>
        {/* モーダルコンテンツ */}
        <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
          {/* ヘッダー（タイトルと閉じるボタン） */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text, fontSize: responsiveFontSizes.md, lineHeight: responsiveLineHeights.md }]}>
              {t('category.select')}
            </Text>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={UI_CONSTANTS.HIT_SLOP.DEFAULT}
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* カテゴリ一覧（FlatList） */}
          <FlatList
            data={options}
            keyExtractor={(item) => item.id || 'uncategorized'}
            renderItem={({ item }) => {
              const isSelected = item.id === selectedCategoryId;
              const categoryColor = item.color || colors.primary;
              const isCreateNew = item.id === 'create-new';

              /* カテゴリアイテム */
              return (
                <TouchableOpacity
                  style={[
                    styles.item,
                    { borderBottomColor: colors.border },
                    isCreateNew && styles.createNewItem,
                  ]}
                  onPress={() => {
                    if (isCreateNew) {
                      handleOpenCreateModal();
                    } else {
                      handleSelect(item.id);
                    }
                  }}
                >
                  <View style={styles.itemLeft}>
                    {/* 新規作成アイコンまたはカラーインジケーター */}
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
                    {/* カテゴリ名 */}
                    <Text style={[
                      styles.itemText,
                      { color: isCreateNew ? colors.primary : colors.text }
                    ]}>
                      {item.name}
                    </Text>
                  </View>
                  {/* 選択中のチェックマーク */}
                  {isSelected && !isCreateNew && (
                    <Ionicons name="checkmark" size={24} color={colors.primary} />
                  )}
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </View>

      {/* 新規カテゴリ作成モーダル */}
      <CategoryModal
        visible={showCreateModal}
        category={null}
        onClose={handleCloseCreateModal}
        onSuccess={handleCategoryCreated}
      />
    </Modal>
  );
}

/* ========================================
   スタイル定義
   ======================================== */
const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
    minHeight: '50%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  title: {
    fontWeight: '600',
  },
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
