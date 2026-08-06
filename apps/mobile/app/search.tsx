/**
 * @module SearchScreen
 * @description 検索画面
 *
 * 定型文をキーワードで検索するためのモーダル画面。
 *
 * @features
 * - リアルタイム検索（300msデバウンス）
 * - タイトル・本文の全文検索
 * - 検索結果のワンタップコピー
 * - 検索結果から編集画面への遷移
 *
 * @ux
 * - フェードアニメーションでの表示
 * - 自動フォーカスでキーボード即時表示
 * - 検索結果がない場合のEmpty State表示
 *
 * @see lib/hooks/screens/useSearchScreen.ts - ビジネスロジック
 */

import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@lib/themeSystem';
import { useSearchScreen } from '@hooks/screens/useSearchScreen';
import { SnippetList } from '@components/snippet/SnippetList';
import { SearchBar } from '@components/snippet/SearchBar';
import { ProfileChipSelector } from '@components/profile/ProfileChipSelector';
import { commonStyles } from '@lib/styles/commonStyles';
import { getMaxContentWidth } from '@utils/responsive';

export default function SearchScreen() {
  const { colors, isTablet, responsive, responsiveSpacing } = useTheme();
  const insets = useSafeAreaInsets();
  const maxContentWidth = getMaxContentWidth();

  const {
    query,
    setQuery,
    selectedProfileId,
    setSelectedProfileId,
    displaySnippets,
    profiles,
    filteredProfiles,
    categories,
    getProfileSnippetCount,
    hasSearchQuery,
    handleRefresh,
    handleCopySnippet,
    handleCopySnippetTitle,
    handleEditSnippet,
    handleDeleteSnippet,
    handleClose,
  } = useSearchScreen();

  /* 検索画面コンテナ */
  return (
    <View style={[commonStyles.container, { backgroundColor: colors.background }]}>
      {/* メインコンテンツエリア（タブレットでは最大幅を制限） */}
      <View
        style={[
          styles.contentContainer,
          maxContentWidth && { maxWidth: maxContentWidth, alignSelf: 'center', width: '100%' },
        ]}
      >
        {/* ヘッダー（閉じるボタンと検索バー） */}
        <View
          style={[
            styles.header,
            {
              backgroundColor: colors.background,
              paddingTop: isTablet ? insets.top + 20 : insets.top + 8,
              paddingBottom: 12,
              paddingHorizontal: responsiveSpacing.containerPadding,
            },
          ]}
        >
          <View style={styles.searchRow}>
            {/* 閉じるボタン */}
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={responsive.header.iconSize} color={colors.text} />
            </TouchableOpacity>
            {/* 検索バー */}
            <View style={styles.searchContainer}>
              <SearchBar value={query} onChangeText={setQuery} autoFocus />
            </View>
          </View>
        </View>

        {/* プロファイルチップセレクター（複数プロファイルがある場合のみ表示） */}
        {profiles.length > 1 && filteredProfiles.length > 0 && (
          <ProfileChipSelector
            profiles={filteredProfiles}
            selectedProfileId={selectedProfileId}
            onSelectProfile={setSelectedProfileId}
            showCount={hasSearchQuery}
            getCount={getProfileSnippetCount}
            containerPadding={responsiveSpacing.containerPadding}
          />
        )}

        {/* 検索結果一覧 */}
        <View style={styles.listContainer}>
          <SnippetList
            snippets={displaySnippets}
            onPress={handleCopySnippet}
            onEdit={handleEditSnippet}
            onDelete={handleDeleteSnippet}
            onPressTitle={handleCopySnippetTitle}
            onRefresh={handleRefresh}
            disableCopy={false}
            overrideProfileId={selectedProfileId}
            categories={categories}
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
  listContainer: {
    flex: 1,
  },
});
