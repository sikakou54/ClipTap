/**
 * @module ProfileManagementScreen
 * @description プロファイル（環境）管理画面
 *
 * カスタム変数の値を切り替えるためのプロファイルを一覧表示・管理。
 *
 * @features
 * - プロファイル一覧の表示（FlashListによる高速レンダリング）
 * - プロファイルの新規作成/編集/削除
 * - Pull-to-refreshによるデータ更新
 *
 * @limits
 * - 無料プラン: 最大3つまで（超過分はvalid=0で無効化）
 * - デフォルトプロファイル（isDefault=1）は削除不可
 *
 * @see src/hooks/screens/useProfilesScreen.ts - ビジネスロジック
 */

import { useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTranslation } from '@cliptap/shared'
import { FlashList, ListRenderItemInfo } from '@mobile-types/flashlist';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@lib/themeSystem';
import { useProfilesScreen } from '@hooks/screens/useProfilesScreen';
import { Profile } from '@cliptap/shared';
import EmptyState from '@components/common/EmptyState';
import { ScreenContainer } from '@components/common/ScreenContainer';
import { commonStyles, listStyles } from '@lib/styles/commonStyles';
import { UI_CONSTANTS } from '@constants/ui';

export default function ProfileManagementScreen() {
  const { t } = useTranslation();
  const { colors, responsiveFontSizes, responsiveLineHeights } = useTheme();

  const {
    allProfiles,
    handleRefresh,
    handleCreateProfile,
    handleEditProfile,
    handleDeleteProfile,
    handleSetDefaultProfile,
    isProfileEnabled,
  } = useProfilesScreen();

  const renderItem = useCallback(
    ({ item, index }: ListRenderItemInfo<Profile>) => {
      const enabled = isProfileEnabled(item);

      return (
        <>
          {/* プロファイルアイテム */}
          <TouchableOpacity
            style={[listStyles.listItem, { opacity: enabled ? 1 : 0.5 }]}
            onPress={() => handleEditProfile(item, enabled)}
            activeOpacity={0.7}
          >
            <View style={styles.profileLeft}>
              <View style={styles.profileInfo}>
                <View style={styles.profileHeader}>
                  {/* デフォルトバッジ */}
                  {item.isDefault && (
                    <View style={[styles.defaultBadge, { backgroundColor: colors.primary + '15' }]}>
                      <Text
                        style={[
                          styles.defaultBadgeText,
                          { color: colors.primary, fontSize: responsiveFontSizes.xs, lineHeight: responsiveLineHeights.xs },
                        ]}
                      >
                        {t('profile.default_badge')}
                      </Text>
                    </View>
                  )}
                  {/* プロファイル名 */}
                  <Text
                    style={[
                      styles.profileName,
                      { color: colors.text, fontSize: responsiveFontSizes.base, lineHeight: responsiveLineHeights.base },
                    ]}
                  >
                    {item.name}
                  </Text>
                  {/* 無効化バッジ */}
                  {!enabled && (
                    <View style={[styles.disabledBadge, { backgroundColor: colors.error + '20' }]}>
                      <Text
                        style={[
                          styles.disabledBadgeText,
                          { color: colors.error, fontSize: responsiveFontSizes.xs, lineHeight: responsiveLineHeights.xs },
                        ]}
                      >
                        {t('settings.variable_disabled')}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </View>

            {/* 行アクション（標準にする・削除） */}
            <View style={styles.rowActions}>
              {/* 標準にするバッジ（標準以外かつ有効なプロファイルのみ） */}
              {!item.isDefault && enabled && (
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation();
                    handleSetDefaultProfile(item);
                  }}
                  hitSlop={UI_CONSTANTS.HIT_SLOP.DEFAULT}
                  style={[styles.setDefaultBadge, { borderColor: colors.border }]}
                  accessibilityRole="button"
                  accessibilityLabel={t('profile.set_default_action')}
                >
                  <Text
                    style={[
                      styles.setDefaultBadgeText,
                      { color: colors.textSecondary, fontSize: responsiveFontSizes.xs, lineHeight: responsiveLineHeights.xs },
                    ]}
                  >
                    {t('profile.set_default_action')}
                  </Text>
                </TouchableOpacity>
              )}
              {/* 削除ボタン（デフォルトプロファイル以外） */}
              {!item.isDefault && (
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation();
                    handleDeleteProfile(item);
                  }}
                  hitSlop={UI_CONSTANTS.HIT_SLOP.DEFAULT}
                  style={commonStyles.actionButton}
                  accessibilityRole="button"
                  accessibilityLabel={t('common.delete')}
                >
                  <Ionicons name="trash-outline" size={20} color={colors.error} />
                </TouchableOpacity>
              )}
            </View>
          </TouchableOpacity>
          {/* セパレーター（最後のアイテム以外） */}
          {index < allProfiles.length - 1 && (
            <View style={[listStyles.separator, { backgroundColor: colors.border }]} />
          )}
        </>
      );
    },
    [allProfiles.length, colors, responsiveFontSizes, responsiveLineHeights, t, isProfileEnabled, handleEditProfile, handleDeleteProfile, handleSetDefaultProfile]
  );

  const headerRightAction = (
    <TouchableOpacity onPress={handleCreateProfile} style={commonStyles.addButton}>
      <Ionicons name="add" size={24} color={colors.primary} />
    </TouchableOpacity>
  );

  if (allProfiles.length === 0) {
    /* 空状態（プロファイルがない場合） */
    return (
      <ScreenContainer title={t('profile.title')} backIcon="arrow-back" rightAction={headerRightAction}>
        <EmptyState icon="people-outline" message={t('profile.no_profiles')} description={t('profile.add_hint')} />
      </ScreenContainer>
    );
  }

  /* プロファイル管理画面 */
  return (
    <ScreenContainer title={t('profile.title')} backIcon="arrow-back" rightAction={headerRightAction}>
      {/* プロファイル一覧（FlashList） */}
      <FlashList
        data={allProfiles}
        keyExtractor={(item) => item.id}
        onRefresh={handleRefresh}
        contentContainerStyle={styles.list}
        estimatedItemSize={70}
        renderItem={renderItem}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  list: {
    flexGrow: 1,
  },
  profileLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  profileInfo: {
    flex: 1,
    gap: 4,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  /* 行アクションの並び。両ボタンのhitSlopが左右10dpずつ広がるため、
     間隔を20dp取って隣接ボタンとタップ領域が重ならないようにする。
     長い名前で操作が潰れないよう縮小もしない */
  rowActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: UI_CONSTANTS.GAP.XL,
    flexShrink: 0,
  },
  /* 標準にする操作のバッジ。状態表示の標準バッジと同形だが、枠線で操作であることを示す。
     文字高18dpに上下padding4dpで26dp、hitSlopの上下10dpを足して46dpのタップ領域を確保する */
  setDefaultBadge: {
    paddingHorizontal: UI_CONSTANTS.GAP.MD,
    paddingVertical: UI_CONSTANTS.GAP.XS,
    borderRadius: UI_CONSTANTS.BORDER_RADIUS.XS,
    borderWidth: 1,
  },
  setDefaultBadgeText: {
    fontWeight: UI_CONSTANTS.FONT_WEIGHT.SEMIBOLD,
  },
  profileName: {
    fontWeight: '500',
  },
  disabledBadge: {
    paddingHorizontal: UI_CONSTANTS.GAP.SM,
    paddingVertical: UI_CONSTANTS.GAP.XXS,
    borderRadius: UI_CONSTANTS.BORDER_RADIUS.XS,
  },
  disabledBadgeText: {
    fontWeight: UI_CONSTANTS.FONT_WEIGHT.SEMIBOLD,
  },
  defaultBadge: {
    paddingHorizontal: UI_CONSTANTS.GAP.SM,
    paddingVertical: UI_CONSTANTS.GAP.XXS,
    borderRadius: UI_CONSTANTS.BORDER_RADIUS.XS,
  },
  defaultBadgeText: {
    fontWeight: UI_CONSTANTS.FONT_WEIGHT.SEMIBOLD,
  },
});
