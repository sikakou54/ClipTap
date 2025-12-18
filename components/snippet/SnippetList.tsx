import React from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../lib/themeSystem';
import { SnippetCard } from './SnippetCard';
import EmptyState from '../common/EmptyState';
import { Snippet } from '../../lib/types/snippet';

interface SnippetListProps {
  snippets: Snippet[];
  onPress: (snippet: Snippet) => void;
  onEdit: (snippet: Snippet) => void;
  onDelete: (snippet: Snippet) => void;
  refreshing?: boolean;
  onRefresh?: () => void;
  disableCopy?: boolean;
  overrideProfileId?: string | null; // 変数解決時に使用するプロファイルID
}

export function SnippetList({
  snippets,
  onPress,
  onEdit,
  onDelete,
  refreshing = false,
  onRefresh,
  disableCopy = false,
  overrideProfileId,
}: SnippetListProps) {
  const { t } = useTranslation();
  const { responsiveSpacing, isTablet } = useTheme();

  // iPadでは2列、スマホでは1列
  const numColumns = isTablet ? 2 : 1;
  const columnGap = responsiveSpacing.cardGap;

  if (snippets.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <EmptyState
          icon="document-text-outline"
          message={t('snippet.no_snippets')}
        />
      </View>
    );
  }

  return (
    <FlatList
      style={styles.listStyle}
      data={snippets}
      renderItem={({ item, index }) => (
        <View
          style={[
            styles.cardWrapper,
            {
              width: isTablet ? '50%' : '100%',
              marginRight: isTablet && index % 2 === 0 ? columnGap : 0,
            }
          ]}
        >
          <SnippetCard
            snippet={item}
            onPress={onPress}
            onEdit={onEdit}
            onDelete={onDelete}
            disableCopy={disableCopy}
            overrideProfileId={overrideProfileId}
          />
        </View>
      )}
      keyExtractor={(item) => item.id}
      contentContainerStyle={[
        styles.container,
        {
          paddingHorizontal: responsiveSpacing.containerPadding,
          paddingBottom: responsiveSpacing.sectionGap,
        }
      ]}
      numColumns={numColumns}
      key={numColumns} // numColumnsが変わったときにリストを再レンダリング
      columnWrapperStyle={isTablet ? styles.row : undefined}
      refreshing={refreshing}
      onRefresh={onRefresh}
      initialNumToRender={15}
      maxToRenderPerBatch={10}
      windowSize={5}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 8,
    flexGrow: 1,
  },
  listStyle: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  row: {
    justifyContent: 'flex-start',
  },
  cardWrapper: {
    // Empty wrapper style for grid layout
  },
});
