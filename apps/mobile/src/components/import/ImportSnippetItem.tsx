/**
 * @module ImportSnippetItem
 * @description インポートスニペットアイテムコンポーネント
 *
 * バックアップファイルからインポートするスニペットの個別表示。
 * チェックボックスによる選択とコンテンツの展開/折りたたみをサポート。
 * カテゴリ名をバッジで表示。
 *
 * @see app/settings/import-preview.tsx - インポートプレビュー画面
 */

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { type ImportCandidateSnippet, type ImportTabType } from '@cliptap/shared';
import { dataItemStyles as styles } from '@components/common/dataItemStyles';

interface ImportSnippetItemProps {
  item: ImportCandidateSnippet;
  isSelected: boolean;
  isExpanded: boolean;
  onToggleSelection: (id: string, type: ImportTabType) => void;
  onToggleExpand: (id: string) => void;
  colors: any;
  t: (key: string) => string;
}

export const ImportSnippetItem = React.memo(({
  item,
  isSelected,
  isExpanded,
  onToggleSelection,
  onToggleExpand,
  colors,
  t
}: ImportSnippetItemProps) => (
  /* インポートスニペットアイテム */
  <View style={[styles.item, { borderBottomColor: colors.border, backgroundColor: colors.background }]}>
    {/* チェックボックス */}
    <TouchableOpacity
      style={styles.checkContainer}
      onPress={() => onToggleSelection(item.id, 'snippets')}
    >
      <Ionicons
        name={isSelected ? "checkbox" : "square-outline"}
        size={24}
        color={isSelected ? colors.primary : colors.textSecondary}
      />
    </TouchableOpacity>
    {/* スニペットコンテンツ（展開/折りたたみ可能） */}
    <TouchableOpacity
      style={styles.itemContent}
      activeOpacity={0.8}
      onPress={() => onToggleExpand(item.id)}
    >
      {/* ヘッダー（タイトルと展開アイコン） */}
      <View style={styles.header}>
        {/* スニペットタイトル */}
        <Text style={[styles.itemTitle, { color: colors.text }]} numberOfLines={1}>
          {item.title || t('common.no_title')}
        </Text>
        {/* 展開/折りたたみアイコン */}
        <Ionicons
          name={isExpanded ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={colors.textSecondary}
        />
      </View>
      {/* スニペットコンテンツ */}
      <Text
        style={[styles.itemSubtitle, { color: colors.textSecondary }]}
        numberOfLines={isExpanded ? undefined : 2}
      >
        {item.content}
      </Text>
      {/* カテゴリバッジ */}
      <View style={styles.itemMeta}>
        <Text style={[styles.itemBadge, { color: colors.primary }]}>
          {item.categoryName || t('common.uncategorized')}
        </Text>
      </View>
    </TouchableOpacity>
  </View>
));
