/**
 * @module SelectionCategoryItem
 * @description 選択カテゴリアイテムコンポーネント
 *
 * インポート/エクスポートでカテゴリを選択するための個別表示。
 * カラードットとチェックボックスによる選択をサポート。
 * オプションで無効化とカスタムメッセージ表示が可能。
 *
 * @see app/settings/select-import-data.tsx - インポートデータ選択画面
 * @see app/settings/select-export-data.tsx - エクスポートデータ選択画面
 */

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { type ImportTabType, type SelectionCategoryData } from '@cliptap/shared';
import { dataItemStyles as styles } from './dataItemStyles';

export type { SelectionCategoryData } from '@cliptap/shared';

interface SelectionCategoryItemProps {
  item: SelectionCategoryData;
  isSelected: boolean;
  isDisabled?: boolean;
  disabledMessage?: string;
  onToggleSelection: (id: string, type: ImportTabType) => void;
  colors: any;
}

export const SelectionCategoryItem = React.memo(({
  item,
  isSelected,
  isDisabled = false,
  disabledMessage,
  onToggleSelection,
  colors,
}: SelectionCategoryItemProps) => (
  /* 選択カテゴリアイテム */
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
      {/* 無効化メッセージ（オプション） */}
      {isDisabled && disabledMessage && (
        <Text style={[styles.duplicateText, { color: colors.error }]}>
          {disabledMessage}
        </Text>
      )}
    </View>
  </TouchableOpacity>
));
