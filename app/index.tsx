/**
 * ClipTap - メイン画面
 * 定型文一覧・管理
 */

import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../lib/themeSystem';
import { useSnippets } from '../lib/hooks/useSnippets';
import { useCategories } from '../lib/hooks/useCategories';
import { useSubscription } from '../lib/hooks/useSubscription';
import { SnippetList } from '../components/snippet/SnippetList';
import { CategoryFilter } from '../components/category/CategoryFilter';
import { ProfileSelector } from '../components/profile/ProfileSelector';
import { Snippet } from '../lib/types/snippet';
import { AdBanner } from '../components/ads/AdBanner';
import { commonStyles } from '../lib/styles/commonStyles';
import { getFABPosition, getMaxContentWidth } from '../lib/utils/responsive';
import { showError } from '../lib/utils/alerts';

export default function HomeScreen() {
  const { t } = useTranslation();
  const { colors, isTablet, responsive, responsiveSpacing } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { shouldShowAds } = useSubscription();

  // レスポンシブレイアウト設定
  const maxContentWidth = getMaxContentWidth();
  const fabPosition = getFABPosition(shouldShowAds());

  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const { categories, refresh: refreshCategories } = useCategories();
  const {
    snippets,
    refresh,
    copySnippet,
    deleteSnippet,
  } = useSnippets(selectedCategoryId === null ? undefined : selectedCategoryId);

  // 全ての定型文を取得して使用されているカテゴリを抽出
  const { snippets: allSnippets, refresh: refreshAllSnippets } = useSnippets();

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
      showError(t('error.generic'));
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
      showError(t('error.generic'));
    }
  };

  // 画面がフォーカスされた時にデータをリフレッシュ
  useFocusEffect(
    React.useCallback(() => {
      refresh();
      refreshAllSnippets();
      refreshCategories();
    }, [refresh, refreshAllSnippets, refreshCategories])
  );

  // 選択されたカテゴリが削除された場合、選択をクリア
  React.useEffect(() => {
    if (selectedCategoryId && !categories.find(c => c.id === selectedCategoryId)) {
      setSelectedCategoryId(null);
    }
  }, [categories, selectedCategoryId]);

  return (
    <View style={[commonStyles.container, { backgroundColor: colors.background }]}>
      {/* コンテンツコンテナ（大画面で中央配置） */}
      <View style={[
        styles.contentContainer,
        maxContentWidth && { maxWidth: maxContentWidth, alignSelf: 'center', width: '100%' }
      ]}>
        <View style={[
          styles.header,
          {
            backgroundColor: colors.background,
            paddingTop: isTablet ? insets.top + 12 : insets.top,
            paddingBottom: isTablet ? 12 : 8,
            paddingHorizontal: responsiveSpacing.containerPadding,
          }
        ]}>
          {/* 環境切り替えとアイコン */}
          <View style={styles.topRow}>
            <View style={styles.profileContainer}>
              <ProfileSelector />
            </View>
            <View style={styles.iconGroup}>
              <TouchableOpacity
                onPress={() => router.push('/search')}
                style={styles.searchIconButton}
              >
                <Ionicons
                  name="search-outline"
                  size={responsive.header.iconSize}
                  color={colors.text}
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => router.push('/settings')}
                style={styles.settingsButton}
              >
                <Ionicons
                  name="settings-outline"
                  size={responsive.header.iconSize}
                  color={colors.text}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <CategoryFilter
          categories={filteredCategories}
          selectedCategoryId={selectedCategoryId}
          onSelectCategory={setSelectedCategoryId}
        />

        <View style={styles.listContainer}>
          <SnippetList
            snippets={snippets}
            onPress={handleCopySnippet}
            onEdit={handleEditSnippet}
            onDelete={handleDeleteSnippet}
            refreshing={refreshing}
            onRefresh={handleRefresh}
          />
        </View>
      </View>

      {/* 画面下部のバナー広告 */}
      <AdBanner />

      {/* 右下の追加ボタン */}
      <TouchableOpacity
        onPress={() => router.push('/snippet/create')}
        style={[
          styles.fab,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            width: responsive.fab.size,
            height: responsive.fab.size,
            borderRadius: responsive.fab.size / 2,
            right: fabPosition.right,
            bottom: fabPosition.bottom + insets.bottom,
          }
        ]}
      >
        <Ionicons
          name="add"
          size={isTablet ? 32 : 28}
          color={colors.primary}
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    flex: 1,
  },
  header: {
    paddingBottom: 8,
    flexDirection: 'column',
    gap: 8,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  profileContainer: {
    flexShrink: 1,
    minWidth: 0,
  },
  iconGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexShrink: 0,
  },
  searchIconButton: {
    padding: 4,
  },
  settingsButton: {
    padding: 4,
  },
  listContainer: {
    flex: 1,
  },
  fab: {
    position: 'absolute',
    borderWidth: 2,
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
