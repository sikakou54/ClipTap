/**
 * @module ImportCategoryItem
 * @description インポートカテゴリアイテムコンポーネント
 *
 * バックアップファイルからインポートするカテゴリの個別表示。
 * カラードットとチェックボックスによる選択をサポート。
 * 重複カテゴリは無効化され、警告メッセージを表示。
 *
 * @see app/settings/import-preview.tsx - インポートプレビュー画面
 */

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { type ImportCandidateCategory, type ImportTabType } from '@cliptap/shared';
import { dataItemStyles as styles } from '@components/common/dataItemStyles';

interface ImportCategoryItemProps {
  item: ImportCandidateCategory;
  isSelected: boolean;
  isDisabled: boolean;
  onToggleSelection: (id: string, type: ImportTabType) => void;
  colors: any;
  t: (key: string) => string;
}

export const ImportCategoryItem = React.memo(({
  item,
  isSelected,
  isDisabled,
  onToggleSelection,
  colors,
  t
}: ImportCategoryItemProps) => (
  /* インポートカテゴリアイテム */
  <TouchableOpacity
    style={[
      styles.itemCentered,
      { borderBottomColor: colors.border, backgroundColor: colors.background },
      isDisabled && styles.disabledItem,
    ]}
    disabled={isDisabled}
    onPress={() => {
      if (isDisabled) return;
      onToggleSelection(item.id, 'categories');
    }}
  >
    {/* チェックボックス */}
    <View style={styles.checkContainer}>
      <Ionicons
        name={isSelected ? "checkbox" : "square-outline"}
        size={24}
        color={isSelected ? colors.primary : colors.textSecondary}
      />
    </View>
    <View style={styles.itemContent}>
      <View style={styles.row}>
        {/* カテゴリカラードット */}
        <View style={[styles.colorDot, { backgroundColor: item.color || colors.primary }]} />
        {/* カテゴリ名 */}
        <Text style={[styles.itemTitle, { color: colors.text }]}>
          {item.name}
        </Text>
      </View>
      {/* 重複警告メッセージ（無効化されている場合） */}
      {isDisabled && (
        <Text style={[styles.duplicateText, { color: colors.error }]}>
          {t('backup.already_registered_category')}
        </Text>
      )}
    </View>
  </TouchableOpacity>
));
