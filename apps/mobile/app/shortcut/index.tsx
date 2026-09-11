/**
 * @module ShortcutManagementScreen
 * @description ショートカット管理画面
 *
 * 拡張キーボードから呼び出すショートカットを一覧表示・管理。
 * ホーム画面ヘッダーのショートカットアイコンから開く。
 *
 * @features
 * - アクティブなプロファイルのショートカット一覧（FlashListによる高速レンダリング）
 * - プロファイルチップによる表示対象の切り替え
 * - ショートカットの新規作成/編集/削除
 * - Pull-to-refreshによるデータ更新
 *
 * @note 削除するとそのショートカットが持つ値もすべて削除される
 * @note 一覧はアクティブなプロファイルの分だけを表示する。新規作成もそのプロファイルへ登録するため、
 *       表示中のプロファイルと登録先は常に一致する
 *
 * @see src/hooks/screens/useShortcutsScreen.ts - ビジネスロジック
 * @see docs/機能仕様書.md §9.1 モバイル画面
 */

import { useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTranslation } from '@cliptap/shared';
import { FlashList, ListRenderItemInfo } from '@mobile-types/flashlist';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@lib/themeSystem';
import { useShortcutsScreen } from '@hooks/screens/useShortcutsScreen';
import { type Shortcut } from '@cliptap/shared';
import EmptyState from '@components/common/EmptyState';
import { ProfileChipSelector } from '@components/profile/ProfileChipSelector';
import { ScreenContainer } from '@components/common/ScreenContainer';
import { commonStyles, listStyles } from '@lib/styles/commonStyles';
import { UI_CONSTANTS } from '@constants/ui';

/**
 * 一覧の1行に表示する値の最大件数
 *
 * @remarks
 * 値が多いショートカットで1行が画面を埋め尽くさないよう、先頭の数件だけを見せる。
 * 全件は編集画面で確認できる。件数バッジは常に総数を表示するため、省略に気付ける。
 */
const PREVIEW_VALUE_COUNT = 3;

/** FlashListの1行の推定高さ（ショートカット名 + 値プレビュー3行分） */
const ESTIMATED_ITEM_SIZE = 108;

export default function ShortcutManagementScreen() {
  const { t } = useTranslation();
  const { colors, responsiveFontSizes, responsiveLineHeights, responsiveSpacing } = useTheme();

  const {
    shortcuts,
    loading,
    selectableProfiles,
    activeProfileId,
    handleSelectProfile,
    handleRefresh,
    handleCreateShortcut,
    handleEditShortcut,
    handleDeleteShortcut,
  } = useShortcutsScreen();

  /* プロファイルチップ（複数ある場合のみ表示）。
     どのプロファイルのショートカットを見ているかを示し、同時に切り替えもできる */
  const profileSelector =
    selectableProfiles.length > 1 ? (
      <ProfileChipSelector
        profiles={selectableProfiles}
        selectedProfileId={activeProfileId}
        onSelectProfile={handleSelectProfile}
        containerPadding={responsiveSpacing.containerPadding}
      />
    ) : null;

  const renderItem = useCallback(
    ({ item, index }: ListRenderItemInfo<Shortcut>) => {
      const previewValues = item.values.slice(0, PREVIEW_VALUE_COUNT);

      return (
        <>
          {/* ショートカットアイテム */}
          <TouchableOpacity
            style={[listStyles.listItem, styles.shortcutItem]}
            onPress={() => handleEditShortcut(item)}
            activeOpacity={0.7}
          >
            <View style={styles.shortcutMain}>
              {/* ショートカット名と登録値数 */}
              <View style={styles.shortcutHeader}>
                <Text
                  style={[
                    styles.shortcutName,
                    {
                      color: colors.text,
                      fontSize: responsiveFontSizes.base,
                      lineHeight: responsiveLineHeights.base,
                    },
                  ]}
                  numberOfLines={UI_CONSTANTS.NUMBER_OF_LINES.SINGLE}
                >
                  {item.name}
                </Text>
                <View style={[styles.countBadge, { backgroundColor: colors.surface }]}>
                  <Text
                    style={[
                      styles.countBadgeText,
                      {
                        color: colors.textSecondary,
                        fontSize: responsiveFontSizes.xs,
                        lineHeight: responsiveLineHeights.xs,
                      },
                    ]}
                  >
                    {t('shortcut.value_count', { count: item.values.length })}
                  </Text>
                </View>
              </View>

              {/* 登録されている値のプレビュー（値名と値） */}
              {previewValues.map((value) => (
                <View key={value.id} style={styles.valueRow}>
                  <Text
                    style={[
                      styles.valueName,
                      {
                        color: colors.textSecondary,
                        fontSize: responsiveFontSizes.sm,
                        lineHeight: responsiveLineHeights.sm,
                      },
                    ]}
                    numberOfLines={UI_CONSTANTS.NUMBER_OF_LINES.SINGLE}
                  >
                    {value.name}
                  </Text>
                  <Text
                    style={[
                      styles.valueText,
                      {
                        color: colors.textSecondary,
                        fontSize: responsiveFontSizes.sm,
                        lineHeight: responsiveLineHeights.sm,
                      },
                    ]}
                    numberOfLines={UI_CONSTANTS.NUMBER_OF_LINES.SINGLE}
                  >
                    {value.value}
                  </Text>
                </View>
              ))}
            </View>

            {/* 削除ボタン */}
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                handleDeleteShortcut(item);
              }}
              hitSlop={UI_CONSTANTS.HIT_SLOP.DEFAULT}
              style={commonStyles.deleteButton}
            >
              <Ionicons name="trash-outline" size={UI_CONSTANTS.ICON_SIZE.SM} color={colors.error} />
            </TouchableOpacity>
          </TouchableOpacity>
          {/* セパレーター（最後のアイテム以外） */}
          {index < shortcuts.length - 1 && (
            <View style={[listStyles.separator, { backgroundColor: colors.border }]} />
          )}
        </>
      );
    },
    [
      shortcuts.length,
      colors,
      responsiveFontSizes,
      responsiveLineHeights,
      handleEditShortcut,
      handleDeleteShortcut,
      t,
    ]
  );

  const headerRightAction = (
    <TouchableOpacity onPress={handleCreateShortcut} style={commonStyles.addButton}>
      <Ionicons name="add" size={UI_CONSTANTS.ICON_SIZE.LG} color={colors.primary} />
    </TouchableOpacity>
  );

  if (shortcuts.length === 0 && !loading) {
    /* 空状態（ショートカットがない場合） */
    return (
      <ScreenContainer
        title={t('shortcut.title')}
        backIcon="arrow-back"
        rightAction={headerRightAction}
      >
        {profileSelector}
        <EmptyState
          icon="flash-outline"
          message={t('shortcut.empty')}
          description={t('shortcut.empty_hint')}
        />
      </ScreenContainer>
    );
  }

  /* ショートカット管理画面 */
  return (
    <ScreenContainer
      title={t('shortcut.title')}
      backIcon="arrow-back"
      rightAction={headerRightAction}
    >
      {profileSelector}

      {/* ショートカット一覧（FlashList） */}
      <FlashList
        data={shortcuts}
        keyExtractor={(item) => item.id}
        onRefresh={handleRefresh}
        refreshing={false}
        contentContainerStyle={styles.list}
        estimatedItemSize={ESTIMATED_ITEM_SIZE}
        renderItem={renderItem}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  list: {
    flexGrow: 1,
  },
  shortcutItem: {
    alignItems: 'flex-start',
  },
  shortcutMain: {
    flex: 1,
    gap: UI_CONSTANTS.GAP.XS,
    paddingRight: UI_CONSTANTS.GAP.BASE,
  },
  shortcutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: UI_CONSTANTS.GAP.MD,
  },
  shortcutName: {
    flexShrink: 1,
    fontWeight: UI_CONSTANTS.FONT_WEIGHT.MEDIUM,
  },
  countBadge: {
    paddingHorizontal: UI_CONSTANTS.GAP.SM,
    paddingVertical: UI_CONSTANTS.GAP.XXS,
    borderRadius: UI_CONSTANTS.BORDER_RADIUS.XS,
  },
  countBadgeText: {
    fontWeight: UI_CONSTANTS.FONT_WEIGHT.SEMIBOLD,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: UI_CONSTANTS.GAP.BASE,
  },
  valueName: {
    /** 値名の欄幅を揃え、値の開始位置を行ごとにずらさない */
    width: 72,
  },
  valueText: {
    flex: 1,
    fontFamily: 'monospace',
  },
});
