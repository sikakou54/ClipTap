import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../lib/themeSystem';
import { useProfiles } from '../../lib/hooks/useProfiles';
import { useSubscription } from '../../lib/hooks/useSubscription';
import { Profile } from '../../lib/types/profile';
import EmptyState from '../../components/common/EmptyState';
import { Header } from '../../components/common/Header';
import { commonStyles, listStyles } from '../../lib/styles/commonStyles';
import { showConfirm, showError, showSuccess } from '../../lib/utils/alerts';
import { UI_CONSTANTS } from '../../lib/constants/ui';
import { FREE_PROFILES_LIMIT } from '../../lib/services/PurchaseService';

export default function ProfileManagementScreen() {
  const { t } = useTranslation();
  const { colors, responsiveFontSizes, responsiveLineHeights } = useTheme();
  const router = useRouter();
  const [refreshing, setRefreshing] = React.useState(false);
  const [allProfiles, setAllProfiles] = React.useState<Profile[]>([]);

  const { refresh, deleteProfile, getAllProfilesIncludingInvalid } = useProfiles();
  const { canAddProfile, isSubscribed } = useSubscription();

  // 全データを読み込む（無効なものも含む）
  const loadAllProfiles = () => {
    const profiles = getAllProfilesIncludingInvalid();
    setAllProfiles(profiles);
  };

  // 画面がフォーカスされた時にリフレッシュ
  useFocusEffect(
    React.useCallback(() => {
      loadAllProfiles();
      // refresh()はupdateProfile/deleteProfile等で既に呼ばれているため、ここでは呼ばない
    }, [])
  );

  // 環境が有効かどうかを判定（validフラグで判定）
  const isProfileEnabled = (profile: Profile): boolean => {
    return profile.valid;
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    loadAllProfiles();
    refresh();
    setRefreshing(false);
  };

  const handleCreateProfile = () => {
    // 有効な環境数をカウント
    const validProfilesCount = allProfiles.filter(p => p.valid).length;

    // 3つ制限チェック（無料版）
    if (!canAddProfile(validProfilesCount)) {
      showConfirm(
        t('profile.limit_message', { limit: FREE_PROFILES_LIMIT }),
        () => router.push('/subscription/paywall'),
        undefined,
        'warning'
      );
      return;
    }

    router.push('/profile/edit');
  };

  const handleEditProfile = (profile: Profile, enabled: boolean) => {
    if (!enabled) {
      // 無効な環境をタップした場合はPaywallに誘導
      showConfirm(
        t('profile.disabled_message'),
        () => router.push('/subscription/paywall'),
        undefined,
        'warning'
      );
      return;
    }

    router.push({
      pathname: '/profile/edit',
      params: { id: profile.id },
    });
  };

  const handleDeleteProfile = (profile: Profile) => {
    // 標準環境は削除不可
    if (profile.isDefault) {
      showError(t('profile.delete_default_error'));
      return;
    }

    showConfirm(
      t('profile.delete_confirm', { name: profile.name }),
      async () => {
        try {
          await deleteProfile(profile.id);
          loadAllProfiles();
        } catch (error) {
          showError();
        }
      },
      undefined,
      'danger'
    );
  };

  if (allProfiles.length === 0) {
    return (
      <View style={[commonStyles.container, { backgroundColor: colors.background }]}>
        <Header
          title={t('profile.title')}
          backIcon="arrow-back"
          rightAction={
            <TouchableOpacity onPress={handleCreateProfile} style={commonStyles.addButton}>
              <Ionicons name="add" size={24} color={colors.primary} />
            </TouchableOpacity>
          }
        />

        <EmptyState
          icon="people-outline"
          message={t('profile.no_profiles')}
          description={t('profile.add_hint')}
        />
      </View>
    );
  }

  return (
    <View style={[commonStyles.container, { backgroundColor: colors.background }]}>
      <Header
        title={t('profile.title')}
        backIcon="arrow-back"
        rightAction={
          <TouchableOpacity onPress={handleCreateProfile} style={commonStyles.addButton}>
            <Ionicons name="add" size={24} color={colors.primary} />
          </TouchableOpacity>
        }
      />

      <FlatList
        data={allProfiles}
        keyExtractor={(item) => item.id}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        contentContainerStyle={styles.list}
        style={[listStyles.listContainer, { backgroundColor: colors.surface }]}
        removeClippedSubviews={false}
        initialNumToRender={50}
        maxToRenderPerBatch={50}
        windowSize={21}
        renderItem={({ item, index }) => {
          const enabled = isProfileEnabled(item);

          return (
            <>
              <TouchableOpacity
                style={[
                  listStyles.listItem,
                  {
                    opacity: enabled ? 1 : 0.5,
                  },
                ]}
                onPress={() => handleEditProfile(item, enabled)}
                activeOpacity={0.7}
              >
                <View style={styles.profileLeft}>
                  <View style={styles.profileInfo}>
                    <View style={styles.profileHeader}>
                      {item.isDefault && (
                        <View style={[styles.defaultBadge, { backgroundColor: colors.primary + '15' }]}>
                          <Text style={[styles.defaultBadgeText, { color: colors.primary, fontSize: responsiveFontSizes.xs, lineHeight: responsiveLineHeights.xs }]}>
                            {t('profile.default_badge')}
                          </Text>
                        </View>
                      )}
                      <Text style={[styles.profileName, { color: colors.text, fontSize: responsiveFontSizes.base, lineHeight: responsiveLineHeights.base }]}>
                        {item.name}
                      </Text>
                      {!enabled && (
                        <View style={[styles.disabledBadge, { backgroundColor: colors.error + '20' }]}>
                          <Text style={[styles.disabledBadgeText, { color: colors.error, fontSize: responsiveFontSizes.xs, lineHeight: responsiveLineHeights.xs }]}>
                            {t('settings.variable_disabled')}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>

                {/* 標準環境以外は削除ボタンを表示 */}
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
              {index < allProfiles.length - 1 && (
                <View style={[listStyles.separator, { backgroundColor: colors.border }]} />
              )}
            </>
          );
        }}
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
