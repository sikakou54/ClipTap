/**
 * @module HomeScreen
 * @description メイン画面（ホーム画面）
 *
 * 登録された定型文の一覧表示とワンタップコピー機能を提供。
 *
 * @features
 * - 定型文一覧の表示（FlashListによる高速レンダリング）
 * - ワンタップでクリップボードにコピー
 * - カテゴリによるフィルタリング
 * - プロファイル（環境）の切り替え
 * - スワイプによる編集・削除操作
 *
 * @navigation
 * - ショートカットアイコン → /shortcut
 * - 設定アイコン → /settings
 * - 検索アイコン → /search（モーダル）
 * - 追加アイコン → /snippet/create（モーダル）
 *
 * @see src/hooks/screens/useHomeScreen.ts - ビジネスロジック
 * @see src/components/snippet/SnippetList.tsx - 一覧表示コンポーネント
 */

import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@lib/themeSystem';
import { useHomeScreen } from '@hooks/screens/useHomeScreen';
import { ScreenContainer } from '@components/common/ScreenContainer';
import { SnippetList } from '@components/snippet/SnippetList';
import { CategoryFilter } from '@components/category/CategoryFilter';
import { ProfileSelector } from '@components/profile/ProfileSelector';
import { SortMenu } from '@components/snippet/SortMenu';
import { AdBanner } from '@components/ads/AdBanner';

export default function HomeScreen() {
  const { colors, isTablet, responsive, responsiveSpacing, maxContentWidth } = useTheme();

  const {
    selectedCategoryId,
    activeProfileId,
    snippets,
    categories,
    filteredCategories,
    handleCategorySelect,
    handleRefresh,
    handleCopySnippet,
    handleCopySnippetTitle,
    handleEditSnippet,
    handleDeleteSnippet,
    handleNavigateToShortcuts,
    handleNavigateToSettings,
    handleNavigateToSearch,
    handleNavigateToCreate,
    handleProfileChange,
    currentSort,
    handleSortChange,
  } = useHomeScreen();

  /* ヘッダー（プロファイル選択・アクションボタン）。上部インセットはScreenContainerが確保するため内部余白のみ持つ */
  const header = (
    <View
      style={[
        styles.header,
        maxContentWidth !== undefined && { maxWidth: maxContentWidth, alignSelf: 'center', width: '100%' },
        {
          backgroundColor: colors.background,
          paddingTop: isTablet ? 20 : 8,
          paddingBottom: 12,
          paddingHorizontal: responsiveSpacing.containerPadding,
        },
      ]}
    >
      <View style={styles.topRow}>
        {/* プロファイル選択（環境切り替え） */}
        <View style={styles.profileContainer}>
          <ProfileSelector onProfileChange={handleProfileChange} />
        </View>

        {/* アクションボタン（ショートカット・設定・検索・追加）。
            アイコン群は縮まずプロファイル名だけが縮む配置のため、狭い端末でプロファイル名が
            読めなくならないよう4個に保つ。入出力（バックアップ）は設定画面から開く */}
        <View style={styles.iconGroup}>
          {/* ショートカット一覧への遷移 */}
          <TouchableOpacity onPress={handleNavigateToShortcuts} style={styles.iconButton}>
            <Ionicons
              name="flash-outline"
              size={responsive.header.iconSize + 2}
              color={colors.text}
            />
          </TouchableOpacity>

          {/* 設定画面への遷移 */}
          <TouchableOpacity onPress={handleNavigateToSettings} style={styles.iconButton}>
            <Ionicons
              name="settings-outline"
              size={responsive.header.iconSize + 2}
              color={colors.text}
            />
          </TouchableOpacity>

          {/* 検索画面への遷移 */}
          <TouchableOpacity onPress={handleNavigateToSearch} style={styles.iconButton}>
            <Ionicons
              name="search-outline"
              size={responsive.header.iconSize + 2}
              color={colors.text}
            />
          </TouchableOpacity>

          {/* 新規作成画面への遷移 */}
          <TouchableOpacity onPress={handleNavigateToCreate} style={styles.iconButton}>
            <Ionicons
              name="add-circle-outline"
              size={responsive.header.iconSize + 8}
              color={colors.primary}
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <ScreenContainer customHeader={header}>
      {/* メインコンテンツエリア（タブレットでは最大幅を制限） */}
      <View
        style={[
          styles.contentContainer,
          maxContentWidth !== undefined && { maxWidth: maxContentWidth, alignSelf: 'center', width: '100%' },
        ]}
      >
        {/* カテゴリフィルター（横スクロール可能なカテゴリ一覧）+ ソートメニュー */}
        <CategoryFilter
          categories={filteredCategories}
          selectedCategoryId={selectedCategoryId}
          onSelectCategory={handleCategorySelect}
          sortMenu={
            <SortMenu currentSort={currentSort} onSortChange={handleSortChange} />
          }
        />

        {/* スニペット一覧（FlashListによる高速レンダリング） */}
        <View style={styles.listContainer}>
          <SnippetList
            snippets={snippets}
            onPress={handleCopySnippet}
            onEdit={handleEditSnippet}
            onDelete={handleDeleteSnippet}
            onPressTitle={handleCopySnippetTitle}
            onRefresh={handleRefresh}
            categories={categories}
            overrideProfileId={activeProfileId}
            extraData={currentSort}
          />
        </View>
      </View>

      {/* 広告バナー（無料プランのみ表示） */}
      <AdBanner />
    </ScreenContainer>
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
  iconButton: {
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    flex: 1,
  },
});
