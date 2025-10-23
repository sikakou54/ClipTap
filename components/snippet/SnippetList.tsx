import React from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
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
}

export function SnippetList({
  snippets,
  onPress,
  onEdit,
  onDelete,
  refreshing = false,
  onRefresh,
}: SnippetListProps) {
  const { t } = useTranslation();

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
      renderItem={({ item}) => (
        <SnippetCard
          snippet={item}
          onPress={onPress}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      )}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.container}
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
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
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
});
