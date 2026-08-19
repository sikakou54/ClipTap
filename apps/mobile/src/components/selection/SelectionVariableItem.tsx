/**
 * @module SelectionVariableItem
 * @description 選択変数アイテムコンポーネント
 *
 * インポート/エクスポートで変数を選択するための個別表示。
 * チェックボックスによる選択とコンテンツの展開/折りたたみをサポート。
 * 展開時にプロファイル別の値一覧を表示。
 * オプションで重複警告（左ボーダー+メッセージ）を表示可能。
 *
 * @see app/settings/select-import-data.tsx - インポートデータ選択画面
 * @see app/settings/select-export-data.tsx - エクスポートデータ選択画面
 */

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { type ImportTabType, type SelectionVariableData, type SemanticColors } from '@cliptap/shared';
import { useTheme } from '@lib/themeSystem';
import { dataItemStyles as styles } from './dataItemStyles';

export type { SelectionVariableData, SelectionVariableProfileValue } from '@cliptap/shared';

interface SelectionVariableItemProps {
  item: SelectionVariableData;
  isSelected: boolean;
  isDuplicate?: boolean;
  duplicateMessage?: string;
  isExpanded: boolean;
  onToggleSelection: (id: string, type: ImportTabType) => void;
  onToggleExpand: (id: string) => void;
  colors: SemanticColors;
  t: (key: string) => string;
}

function SelectionVariableItemInner({
  item,
  isSelected,
  isDuplicate = false,
  duplicateMessage,
  isExpanded,
  onToggleSelection,
  onToggleExpand,
  colors,
  t
}: SelectionVariableItemProps) {
  /* 文字サイズはタブレットで拡大させるためテーマから取得する（色は呼び出し側からpropsで受け取る） */
  const { responsiveFontSizes } = useTheme();

  /* 選択変数アイテム（重複時は警告ボーダー表示） */
  return (
    <View
      style={[
        styles.item,
        { borderBottomColor: colors.border, backgroundColor: colors.background },
        isDuplicate && [styles.warningItem, { borderLeftColor: colors.warning }],
      ]}
    >
      {/* チェックボックス */}
      <TouchableOpacity
        style={styles.checkContainer}
        onPress={() => onToggleSelection(item.id, 'variables')}
      >
        <Ionicons
          name={isSelected ? "checkbox" : "square-outline"}
          size={24}
          color={isSelected ? colors.primary : colors.textSecondary}
        />
      </TouchableOpacity>
      {/* 変数コンテンツ（展開/折りたたみ可能） */}
      <TouchableOpacity
        style={styles.itemContent}
        onPress={() => onToggleExpand(item.id)}
        activeOpacity={0.8}
      >
        {/* ヘッダー（変数名、アイコン、展開アイコン） */}
        <View style={styles.header}>
          <View style={styles.row}>
            {/* 変数名 */}
            <Text style={[styles.itemTitle, { color: colors.text, fontSize: responsiveFontSizes.base }]}>
              {item.name}
            </Text>
            {/* 変数アイコン（オプション） */}
            {item.icon && (
              <Ionicons name={item.icon as keyof typeof Ionicons.glyphMap} size={16} color={colors.textSecondary} style={styles.variableIcon} />
            )}
          </View>
          {/* 展開/折りたたみアイコン */}
          <Ionicons
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={18}
            color={colors.textSecondary}
          />
        </View>
        {/* 変数ラベル（オプション） */}
        {item.label && (
          <Text style={{ color: colors.textSecondary, fontSize: responsiveFontSizes.sm }}>
            {item.label}
          </Text>
        )}
        {/* 重複警告メッセージ（オプション） */}
        {isDuplicate && duplicateMessage && (
          <Text style={[styles.duplicateText, { color: colors.warning, fontSize: responsiveFontSizes.xs }]}>
            {duplicateMessage}
          </Text>
        )}
        {/* プロファイル別値一覧（展開時のみ表示） */}
        {isExpanded && item.profileValues.length > 0 && (
          <View style={[styles.profileValueList, { borderTopColor: `${colors.border}40` }]}>
            {item.profileValues.map((pv, index) => (
              /* プロファイル値行 */
              <View key={`${pv.profileId}-${index}`} style={styles.profileValueRow}>
                {/* プロファイル名 */}
                <Text style={[styles.profileValueName, { color: colors.textSecondary, fontSize: responsiveFontSizes.xs }]}>
                  {pv.profileName || t('profile.default_badge')}
                </Text>
                {/* プロファイル値 */}
                <Text style={[styles.profileValueText, { color: colors.text, fontSize: responsiveFontSizes.xs }]}>
                  {pv.value || t('common.not_set')}
                </Text>
              </View>
            ))}
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

/** @description 選択変数アイテム（React.memoでメモ化） */
export const SelectionVariableItem = React.memo(SelectionVariableItemInner);
