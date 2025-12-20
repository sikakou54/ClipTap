/**
 * スニペット一覧表示コンポーネント
 *
 * FlashListを使用した高パフォーマンスなスニペット一覧。
 * タブレットでは2カラム、スマートフォンでは1カラムで表示。
 *
 * 主な機能:
 * - 仮想化リスト（FlashList）による大量データの効率的なレンダリング
 * - プルリフレッシュ対応
 * - レスポンシブレイアウト（タブレット/スマートフォン）
 * - 空状態の表示
 *
 * @see SnippetCard - 各スニペットのカード表示
 * @see app/(tabs)/index.tsx - メイン画面での使用例
 */

import React, { useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { useTranslation } from '@cliptap/shared';
import { FlashList, ListRenderItemInfo } from '@mobile-types/flashlist';
import { useTheme } from '@lib/themeSystem';
import { SnippetCard } from './SnippetCard';
import EmptyState from '@components/common/EmptyState';
import { SnippetWithDisplay } from '@cliptap/shared';
import { Category } from '@cliptap/shared';

/**
 * SnippetListのProps
 * @property snippets - 表示するスニペット配列
 * @property onPress - スニペットタップ時のコールバック（コピー処理）
 * @property onEdit - 編集ボタンタップ時のコールバック
 * @property onDelete - 削除ボタンタップ時のコールバック
 * @property refreshing - プルリフレッシュ中フラグ（省略可、デフォルト: false）
 * @property onRefresh - プルリフレッシュ時のコールバック（省略可）
 * @property disableCopy - コピー機能を無効化（省略可、デフォルト: false）
 * @property categories - カテゴリ一覧（省略可：パフォーマンス最適化のため親から渡す）
 */
interface SnippetListProps {
  snippets: SnippetWithDisplay[];
  onPress: (snippet: SnippetWithDisplay) => void;
  onEdit: (snippet: SnippetWithDisplay) => void;
  onDelete: (snippet: SnippetWithDisplay) => void;
  refreshing?: boolean;
  onRefresh?: () => void;
  disableCopy?: boolean;
  overrideProfileId?: string | null;
  categories?: Category[];
}

export function SnippetList({
  snippets,
  onPress,
  onEdit,
  onDelete,
  refreshing = false,
  onRefresh,
  disableCopy = false,
  categories,
}: SnippetListProps) {
  const { t } = useTranslation();
  const { responsiveSpacing, isTablet } = useTheme();

  const numColumns = isTablet ? 2 : 1;
  const columnGap = responsiveSpacing.cardGap;

  /**
   * カテゴリIDをキーとしたMapを作成
   * FlashListのrenderItem内でO(1)検索を可能にする（パフォーマンス最適化）
   */
  const categoryMap = React.useMemo(() => {
    if (!categories) return new Map();
    return new Map(categories.map(cat => [cat.id, cat]));
  }, [categories]);

  const renderItem = useCallback(
    ({ item, index }: ListRenderItemInfo<SnippetWithDisplay>) => {
      const category = item.categoryId ? categoryMap.get(item.categoryId) : null;

      /* スニペットカードラッパー（タブレットでは2カラム表示） */
      return (
        <View
          style={[
            styles.cardWrapper,
            {
              width: isTablet ? '50%' : '100%',
              paddingRight: isTablet && index % 2 === 0 ? columnGap : 0,
            },
          ]}
        >
          <SnippetCard
            snippet={item}
            onPress={onPress}
            onEdit={onEdit}
            onDelete={onDelete}
            disableCopy={disableCopy}
            category={category}
          />
        </View>
      );
    },
    [categoryMap, isTablet, columnGap, onPress, onEdit, onDelete, disableCopy]
  );

  if (snippets.length === 0) {
    /* 空状態（スニペットがない場合） */
    return (
      <View style={styles.emptyContainer}>
        <EmptyState
          icon="document-text-outline"
          message={t('snippet.no_snippets')}
        />
      </View>
    );
  }

  /* スニペット一覧コンテナ */
  return (
    <View style={styles.listStyle}>
      {/* FlashList: FlatListの代替として使用（大量データでも高速） */}
      <FlashList<SnippetWithDisplay>
        data={snippets}
        estimatedItemSize={120}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          paddingHorizontal: responsiveSpacing.containerPadding,
          paddingBottom: responsiveSpacing.sectionGap,
          paddingTop: 8,
        }}
        numColumns={numColumns}
        key={numColumns}
        refreshing={refreshing}
        onRefresh={onRefresh}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  listStyle: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardWrapper: {
    marginBottom: 12,
  },
});
