/**
 * ClipTap - 検索画面
 * フェードアニメーションで表示される専用検索画面
 */

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, Text } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../lib/themeSystem';
import { useSearch } from '../lib/hooks/useSearch';
import { useProfiles } from '../lib/hooks/useProfiles';
import { snippetService } from '../lib/services/SnippetService';
import { SnippetList } from '../components/snippet/SnippetList';
import { SearchBar } from '../components/snippet/SearchBar';
import { Snippet } from '../lib/types/snippet';
import { Profile } from '../lib/types/profile';
import { commonStyles } from '../lib/styles/commonStyles';
import { getMaxContentWidth } from '../lib/utils/responsive';
import { showError } from '../lib/utils/alerts';
import { UI_CONSTANTS } from '../lib/constants/ui';

export default function SearchScreen() {
  const { t } = useTranslation();
  const { colors, isTablet, responsive, responsiveSpacing, responsiveFontSizes } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // レスポンシブレイアウト設定
  const maxContentWidth = getMaxContentWidth();

  const [refreshing, setRefreshing] = useState(false);
  const [allSnippets, setAllSnippets] = useState<Snippet[]>([]);

  const { profiles, activeProfile } = useProfiles();
  const { query, setQuery, results } = useSearch();

  // デフォルトでアクティブプロファイルを選択
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(activeProfile?.id || null);

  // 全環境の定型文を取得（環境フィルタなし）
  const loadAllSnippets = async () => {
    try {
      const snippets = await snippetService.getAllWithoutProfileFilter();
      setAllSnippets(snippets);
    } catch (error) {
      console.error('Failed to load snippets:', error);
    }
  };

  // 画面がフォーカスされた時にデータをロード
  useFocusEffect(
    React.useCallback(() => {
      loadAllSnippets();
    }, [])
  );

  // アクティブプロファイルが変更された時に選択を更新
  useEffect(() => {
    if (activeProfile?.id) {
      setSelectedProfileId(activeProfile.id);
    }
  }, [activeProfile?.id]);

  // 検索結果またはすべての定型文
  const baseSnippets = query.trim() ? results : allSnippets;

  // 各環境の定型文件数を計算
  const getProfileSnippetCount = (profileId: string): number => {
    return baseSnippets.filter(snippet => {
      if (!snippet.profileIds || snippet.profileIds.length === 0) return true;
      return snippet.profileIds.includes(profileId);
    }).length;
  };

  // 選択中の環境でフィルタリング
  const displaySnippets = selectedProfileId
    ? baseSnippets.filter(snippet => {
      // 環境未設定の定型文は全ての環境で表示
      if (!snippet.profileIds || snippet.profileIds.length === 0) return true;
      // 選択した環境に設定されている定型文のみ表示
      return snippet.profileIds.includes(selectedProfileId);
    })
    : baseSnippets; // 環境が選択されていない場合は全て表示（通常は起こらない）

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAllSnippets();
    setRefreshing(false);
  };

  // コピー機能（選択中の環境の変数を使用）
  const handleCopySnippet = async (snippet: Snippet) => {
    try {
      await snippetService.copyToClipboard(snippet.id, selectedProfileId || undefined);
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
      await snippetService.delete(snippet.id);
      await loadAllSnippets();
    } catch (error) {
      showError(t('error.generic'));
    }
  };

  const handleClose = () => {
    router.back();
  };

  return (
    <View
      style={[
        commonStyles.container,
        {
          backgroundColor: colors.background,
        },
      ]}
    >
      {/* コンテンツコンテナ（大画面で中央配置） */}
      <View
        style={[
          styles.contentContainer,
          maxContentWidth && {
            maxWidth: maxContentWidth,
            alignSelf: 'center',
            width: '100%',
          },
        ]}
      >
        <View
          style={[
            styles.header,
            {
              backgroundColor: colors.background,
              paddingTop: isTablet ? insets.top + 12 : insets.top,
              paddingBottom: isTablet ? 12 : 8,
              paddingHorizontal: responsiveSpacing.containerPadding,
            },
          ]}
        >
          <View style={styles.searchRow}>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons
                name="close"
                size={responsive.header.iconSize}
                color={colors.text}
              />
            </TouchableOpacity>
            <View style={styles.searchContainer}>
              <SearchBar value={query} onChangeText={setQuery} autoFocus />
            </View>
          </View>
        </View>

        {/* 環境フィルター */}
        {profiles.length > 1 && (() => {
          const hasSearchQuery = query.trim().length > 0;

          // 検索クエリがある場合は検索結果がある環境のみ表示
          const filteredProfiles = hasSearchQuery
            ? profiles.filter((p: Profile) => getProfileSnippetCount(p.id) > 0)
            : profiles;

          if (filteredProfiles.length === 0) return null;

          return (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.profileFilter}
              contentContainerStyle={[
                styles.profileFilterContent,
                { paddingHorizontal: responsiveSpacing.containerPadding }
              ]}
            >
              {filteredProfiles.map((profile: Profile) => {
                const isSelected = selectedProfileId === profile.id;
                const count = getProfileSnippetCount(profile.id);

                return (
                  <TouchableOpacity
                    key={profile.id}
                    style={[
                      styles.profileChip,
                      {
                        borderColor: isSelected ? colors.primary : colors.border,
                        backgroundColor: isSelected ? colors.primary : colors.surface,
                      }
                    ]}
                    onPress={() => setSelectedProfileId(profile.id)}
                  >
                    <Text
                      style={[
                        styles.profileChipText,
                        {
                          color: isSelected ? '#FFFFFF' : colors.text,
                          fontSize: responsiveFontSizes.sm,
                        }
                      ]}
                    >
                      {profile.name}
                    </Text>
                    {hasSearchQuery && (
                      <View
                        style={[
                          styles.countBadge,
                          {
                            backgroundColor: isSelected ? 'rgba(255, 255, 255, 0.3)' : colors.border,
                          }
                        ]}
                      >
                        <Text
                          style={[
                            styles.countBadgeText,
                            {
                              color: isSelected ? '#FFFFFF' : colors.textSecondary,
                              fontSize: responsiveFontSizes.xs,
                            }
                          ]}
                        >
                          {count}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          );
        })()}

        <View style={styles.listContainer}>
          <SnippetList
            snippets={displaySnippets}
            onPress={handleCopySnippet}
            onEdit={handleEditSnippet}
            onDelete={handleDeleteSnippet}
            refreshing={refreshing}
            onRefresh={handleRefresh}
            disableCopy={false}
            overrideProfileId={selectedProfileId}
          />
        </View>
      </View>
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
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  searchContainer: {
    flex: 1,
  },
  closeButton: {
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileFilter: {
    maxHeight: 50,
  },
  profileFilterContent: {
    gap: UI_CONSTANTS.GAP.SM,
    paddingTop: UI_CONSTANTS.GAP.SM,
    paddingBottom: UI_CONSTANTS.GAP.LG,
  },
  profileChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: UI_CONSTANTS.GAP.MD,
    paddingVertical: UI_CONSTANTS.GAP.SM,
    borderRadius: UI_CONSTANTS.BORDER_RADIUS.XL,
    borderWidth: UI_CONSTANTS.BORDER_WIDTH.THIN,
    gap: UI_CONSTANTS.GAP.SM,
  },
  profileChipText: {
    fontWeight: UI_CONSTANTS.FONT_WEIGHT.SEMIBOLD,
  },
  countBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countBadgeText: {
    fontWeight: UI_CONSTANTS.FONT_WEIGHT.BOLD,
  },
  listContainer: {
    flex: 1,
  },
});
