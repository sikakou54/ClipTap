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
 * @see lib/hooks/screens/useProfilesScreen.ts - ビジネスロジック
 */

import React, { useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTranslation } from '@cliptap/shared'
import { FlashList, ListRenderItemInfo } from '@mobile-types/flashlist';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@lib/themeSystem';
import { useProfilesScreen } from '@hooks/screens/useProfilesScreen';
import { Profile } from '@cliptap/shared';
import EmptyState from '@components/common/EmptyState';
import { Header } from '@components/common/Header';
import { commonStyles, listStyles } from '@lib/styles/commonStyles';
import { UI_CONSTANTS } from '@constants/ui';

export default function ProfileManagementScreen() {
  const { t } = useTranslation();
  const { colors, responsiveFontSizes, responsiveLineHeights } = useTheme();

  const {
    refreshing,
    allProfiles,
    handleRefresh,
    handleCreateProfile,
    handleEditProfile,
    handleDeleteProfile,
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

            {/* 削除ボタン（デフォルトプロファイル以外） */}
            {!item.isDefault && (
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation();
                  handleDeleteProfile(item);
                }}
                hitSlop={UI_CONSTANTS.HIT_SLOP.DEFAULT}
                style={commonStyles.actionButton}
              >
                <Ionicons name="trash-outline" size={20} color={colors.error} />
              </TouchableOpacity>
            )}
          </TouchableOpacity>
          {/* セパレーター（最後のアイテム以外） */}
          {index < allProfiles.length - 1 && (
            <View style={[listStyles.separator, { backgroundColor: colors.border }]} />
          )}
        </>
      );
    },
    [allProfiles.length, colors, responsiveFontSizes, responsiveLineHeights, t, isProfileEnabled, handleEditProfile, handleDeleteProfile]
  );

  const headerRightAction = (
    <TouchableOpacity onPress={handleCreateProfile} style={commonStyles.addButton}>
      <Ionicons name="add" size={24} color={colors.primary} />
    </TouchableOpacity>
  );

  if (allProfiles.length === 0) {
    /* 空状態（プロファイルがない場合） */
    return (
      <View style={[commonStyles.container, { backgroundColor: colors.background }]}>
        <Header title={t('profile.title')} backIcon="arrow-back" rightAction={headerRightAction} />
        <EmptyState icon="people-outline" message={t('profile.no_profiles')} description={t('profile.add_hint')} />
      </View>
    );
  }

  /* プロファイル管理画面 */
  return (
    <View style={[commonStyles.container, { backgroundColor: colors.background }]}>
      <Header title={t('profile.title')} backIcon="arrow-back" rightAction={headerRightAction} />
      {/* プロファイル一覧（FlashList） */}
      <FlashList
        data={allProfiles}
        keyExtractor={(item) => item.id}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        contentContainerStyle={styles.list}
        estimatedItemSize={70}
        renderItem={renderItem}
      />
    </View>
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
