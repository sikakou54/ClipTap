/**
 * ClipTap - メイン画面
 * 定型文一覧・管理
 */

import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../lib/themeSystem';
import { useSnippets } from '../lib/hooks/useSnippets';
import { useCategories } from '../lib/hooks/useCategories';
import { useSearch } from '../lib/hooks/useSearch';
import { SnippetList } from '../components/snippet/SnippetList';
import { SearchBar } from '../components/snippet/SearchBar';
import { CategoryFilter } from '../components/category/CategoryFilter';
import { Snippet } from '../lib/types/snippet';
import { database } from '../lib/database/database';
import { AdBanner } from '../components/ads/AdBanner';

export default function HomeScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const router = useRouter();

  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const { categories, refresh: refreshCategories } = useCategories();
  const {
    snippets,
    loading,
    refresh,
    copySnippet,
    deleteSnippet,
  } = useSnippets(selectedCategoryId === null ? undefined : selectedCategoryId);

  // 全ての定型文を取得して使用されているカテゴリを抽出
  const { snippets: allSnippets, refresh: refreshAllSnippets } = useSnippets();

  const { query, setQuery, results, hasQuery } = useSearch(selectedCategoryId || undefined);

  const displaySnippets = hasQuery ? results : snippets;

  // 定型文が存在するカテゴリのみをフィルタ
  const usedCategoryIds = new Set(
    allSnippets
      .map(s => s.categoryId)
      .filter((id): id is string => id !== null && id !== undefined)
  );
  const filteredCategories = categories.filter(c => usedCategoryIds.has(c.id));

  const handleRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const handleCopySnippet = async (snippet: Snippet) => {
    try {
      await copySnippet(snippet.id);
    } catch (error) {
      Alert.alert(t('error.generic'));
    }
  };

  const handleEditSnippet = (snippet: Snippet) => {
    router.push({
      pathname: '/snippet/edit',
      params: { id: snippet.id },
    });
  };

  const handleDeleteSnippet = async (snippet: Snippet) => {
    try {
      await deleteSnippet(snippet.id);
      // 全ての定型文をリフレッシュしてカテゴリフィルターを更新
      await refreshAllSnippets();
    } catch (error) {
      Alert.alert(t('error.generic'));
    }
  };


  // データベース初期化を確認
  React.useEffect(() => {
    database.init()
      .then(() => console.log('Database initialized in HomeScreen'))
      .catch(console.error);
  }, []);

  // 画面がフォーカスされた時にデータをリフレッシュ
  useFocusEffect(
    React.useCallback(() => {
      refresh();
      refreshAllSnippets();
      refreshCategories();
    }, [refresh, refreshAllSnippets, refreshCategories])
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={styles.searchContainer}>
          <SearchBar value={query} onChangeText={setQuery} />
        </View>
        <TouchableOpacity
          onPress={() => router.push('/settings')}
          style={styles.settingsButton}
        >
          <Ionicons name="settings-outline" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <CategoryFilter
        categories={filteredCategories}
        selectedCategoryId={selectedCategoryId}
        onSelectCategory={setSelectedCategoryId}
      />

      <View style={styles.listContainer}>
        <SnippetList
          snippets={displaySnippets}
          onPress={handleCopySnippet}
          onEdit={handleEditSnippet}
          onDelete={handleDeleteSnippet}
          refreshing={refreshing}
          onRefresh={handleRefresh}
        />
      </View>

      {/* 画面下部のバナー広告 */}
      <AdBanner />

      {/* 右下の追加ボタン */}
      <TouchableOpacity
        onPress={() => router.push('/snippet/create')}
        style={[styles.fab, { backgroundColor: colors.primary }]}
      >
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    borderBottomWidth: 1,
    paddingTop: 50,
    paddingBottom: 8,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchContainer: {
    flex: 1,
  },
  settingsButton: {
    padding: 4,
  },
  listContainer: {
    flex: 1,
  },
  fab: {
    position: 'absolute',
    bottom: 120, // 広告の高さ + Safe Area + マージン分上に配置
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
});
