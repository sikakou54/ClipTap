/**
 * @module ImportProfileItem
 * @description インポートプロファイルアイテムコンポーネント
 *
 * バックアップファイルからインポートするプロファイルの個別表示。
 * チェックボックスによる選択/解除をサポート。
 * 重複プロファイルは無効化され、警告メッセージを表示。
 *
 * @see app/settings/import-preview.tsx - インポートプレビュー画面
 */

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { type ImportCandidateProfile, type ImportTabType } from '@cliptap/shared';
import { dataItemStyles as styles } from '@components/common/dataItemStyles';

interface ImportProfileItemProps {
  item: ImportCandidateProfile;
  isSelected: boolean;
  isDisabled: boolean;
  onToggleSelection: (id: string, type: ImportTabType) => void;
  colors: any;
  t: (key: string) => string;
}

export const ImportProfileItem = React.memo(({
  item,
  isSelected,
  isDisabled,
  onToggleSelection,
  colors,
  t
}: ImportProfileItemProps) => (
  /* インポートプロファイルアイテム */
  <TouchableOpacity
    style={[
      styles.itemCentered,
      { borderBottomColor: colors.border, backgroundColor: colors.background },
      isDisabled && styles.disabledItem,
    ]}
    disabled={isDisabled}
    onPress={() => {
      if (isDisabled) return;
      onToggleSelection(item.id, 'profiles');
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
      {/* プロファイル名 */}
      <Text style={[styles.itemTitle, { color: colors.text }]}>
        {item.name}
      </Text>
      {/* 重複警告メッセージ（無効化されている場合） */}
      {isDisabled && (
        <Text style={[styles.duplicateText, { color: colors.error }]}>
          {t('backup.already_registered_profile')}
        </Text>
      )}
    </View>
  </TouchableOpacity>
));
