/**
 * @module ImportVariableItem
 * @description インポート変数アイテムコンポーネント
 *
 * バックアップファイルからインポートする変数の個別表示。
 * チェックボックスによる選択とコンテンツの展開/折りたたみをサポート。
 * 展開時にプロファイル別の値一覧を表示。
 * 既存変数と同名の場合、左ボーダーとマージ警告を表示。
 *
 * @see app/settings/import-preview.tsx - インポートプレビュー画面
 */

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { type ImportCandidateVariable, type ImportTabType } from '@cliptap/shared';
import { dataItemStyles as styles } from '@components/common/dataItemStyles';

interface ImportVariableItemProps {
  item: ImportCandidateVariable;
  isSelected: boolean;
  isDuplicate: boolean;
  isExpanded: boolean;
  onToggleSelection: (id: string, type: ImportTabType) => void;
  onToggleExpand: (id: string) => void;
  colors: any;
  t: (key: string) => string;
}

export const ImportVariableItem = React.memo(({
  item,
  isSelected,
  isDuplicate,
  isExpanded,
  onToggleSelection,
  onToggleExpand,
  colors,
  t
}: ImportVariableItemProps) => (
  /* インポート変数アイテム（重複時は警告ボーダー表示） */
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
          <Text style={[styles.itemTitle, { color: colors.text }]}>
            {item.name}
          </Text>
          {/* 変数アイコン（オプション） */}
          {item.icon && (
            <Ionicons name={item.icon as any} size={16} color={colors.textSecondary} style={{ marginLeft: 8 }} />
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
        <Text style={[styles.itemSubtitle, { color: colors.textSecondary }]}>
          {item.label}
        </Text>
      )}
      {/* 重複警告メッセージ */}
      {isDuplicate && (
        <Text style={[styles.duplicateText, { color: colors.warning }]}>
          {t('backup.variable_merge_warning')}
        </Text>
      )}
      {/* プロファイル別値一覧（展開時のみ表示） */}
      {isExpanded && item.profileValues.length > 0 && (
        <View style={[styles.profileValueList, { borderTopColor: `${colors.border}40` }]}>
          {item.profileValues.map((pv, index) => (
            /* プロファイル値行 */
            <View key={`${pv.profileId}-${index}`} style={styles.profileValueRow}>
              {/* プロファイル名 */}
              <Text style={[styles.profileValueName, { color: colors.textSecondary }]}>
                {pv.profileName || t('profile.default_badge')}
              </Text>
              {/* プロファイル値 */}
              <Text style={[styles.profileValueText, { color: colors.text }]}>
                {pv.value || t('common.not_set')}
              </Text>
            </View>
          ))}
        </View>
      )}
    </TouchableOpacity>
  </View>
));
