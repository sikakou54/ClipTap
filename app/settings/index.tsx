import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../lib/themeSystem';
import { useSubscription } from '../../lib/hooks/useSubscription';
import { database } from '../../lib/database/database';
import { SCHEMA_VERSION } from '../../lib/database/schema';
import { runSeed } from '../../lib/database/seed';
import * as Updates from 'expo-updates';
import { Header } from '../../components/common/Header';
import { commonStyles } from '../../lib/styles/commonStyles';
import { UI_CONSTANTS } from '../../lib/constants/ui';
import { showAlert, showConfirm } from '../../lib/utils/alerts';

export default function SettingsScreen() {
  const { t } = useTranslation();
  const { colors, responsiveFontSizes, responsiveLineHeights } = useTheme();
  const router = useRouter();
  const { isSubscribed, getDevSubscriptionOverride, setDevSubscriptionOverride } = useSubscription();
  const [devOverride, setDevOverride] = useState<boolean | null>(
    getDevSubscriptionOverride()
  );

  // 開発者メニュー：プラン切り替え（簡易実装）
  const handleDevSubscriptionToggle = async () => {
    Alert.alert(
      'Subscription Override',
      'Choose subscription status',
      [
        {
          text: 'Free Plan',
          onPress: async () => {
            await setDevSubscriptionOverride(false);
            setDevOverride(false);
            Alert.alert('Dev Mode', 'Switched to Free Plan');
          },
        },
        {
          text: 'Pro Plan',
          onPress: async () => {
            await setDevSubscriptionOverride(true);
            setDevOverride(true);
            Alert.alert('Dev Mode', 'Switched to Pro Plan');
          },
        },
        {
          text: 'Use Real Status',
          onPress: async () => {
            await setDevSubscriptionOverride(null);
            setDevOverride(null);
            Alert.alert('Dev Mode', 'Using real subscription status');
          },
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  // 開発者メニュー：データベースリセット
  const handleResetDatabase = async () => {
    showConfirm(
      'This will delete ALL data and runSeed test data. App will reload. Continue?',
      async () => {
        try {
          console.log('[Dev] Resetting database...');
          await database.reset();
          console.log('[Dev] Seeding test data...');
          await runSeed();
          console.log('[Dev] Database reset complete!');

          showAlert(
            'Success',
            'Database reset complete! App will reload now.',
            undefined,
            'success',
            async () => {
              // アプリをリロード
              if (__DEV__) {
                await Updates.reloadAsync();
              }
            }
          );
        } catch (error) {
          console.error('[Dev] Failed to reset database:', error);
          showAlert('Error', 'Failed to reset database: ' + String(error), undefined, 'error');
        }
      },
      undefined,
      'danger'
    );
  };

  // 開発者メニュー：データベースファイル完全削除
  const handleDeleteDatabase = async () => {
    showConfirm(
      'This will COMPLETELY DELETE the database file and recreate it. All data will be lost. App will reload. Continue?',
      async () => {
        try {
          console.log('[Dev] Deleting database file...');
          await database.deleteAndRecreate();
          console.log('[Dev] Seeding test data...');
          await runSeed();
          console.log('[Dev] Database recreated complete!');

          showAlert(
            'Success',
            'Database file deleted and recreated! App will reload now.',
            undefined,
            'success',
            async () => {
              // アプリをリロード
              if (__DEV__) {
                await Updates.reloadAsync();
              }
            }
          );
        } catch (error) {
          console.error('[Dev] Failed to delete database:', error);
          showAlert('Error', 'Failed to delete database: ' + String(error), undefined, 'error');
        }
      },
      undefined,
      'danger'
    );
  };

  // 開発者メニュー：スキーマバージョン変更
  const handleChangeSchemaVersion = async () => {
    try {
      const currentVersion = await database.getVersion();

      Alert.alert(
        'Change Schema Version',
        `Current: ${currentVersion} / Target: ${SCHEMA_VERSION}\n\nChange database version to:`,
        [
          {
            text: 'Version 0 (New DB)',
            onPress: async () => {
              await database.setVersionManually(0);
              Alert.alert('Success', 'Version changed to 0. Reload app to trigger migration.');
            },
          },
          {
            text: 'Version 1 (Old Schema)',
            onPress: async () => {
              await database.setVersionManually(1);
              Alert.alert('Success', 'Version changed to 1. Reload app to trigger V1→V2 migration.');
            },
          },
          {
            text: `Version ${SCHEMA_VERSION} (Current)`,
            onPress: async () => {
              await database.setVersionManually(SCHEMA_VERSION);
              Alert.alert('Success', `Version changed to ${SCHEMA_VERSION}`);
            },
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ]
      );
    } catch (error) {
      console.error('[Dev] Failed to change schema version:', error);
      Alert.alert('Error', 'Failed to change version: ' + String(error));
    }
  };

  const menuItems = [
    {
      id: 'profiles',
      icon: 'options-outline' as const,
      label: t('settings.profiles'),
      onPress: () => router.push('/settings/profiles'),
      isPro: false,
    },
    {
      id: 'variables',
      icon: 'code-outline' as const,
      label: t('settings.variables'),
      onPress: () => router.push('/settings/variables'),
      isPro: false, // 無料版でも5つまで使えるのでfalse
    },
    {
      id: 'categories',
      icon: 'folder-outline' as const,
      label: t('category.title'),
      onPress: () => router.push('/settings/categories'),
      isPro: false,
    },
    {
      id: 'terms',
      icon: 'document-text-outline' as const,
      label: t('settings.terms'),
      onPress: () => router.push({
        pathname: '/webview',
        params: { file: 'terms', title: t('settings.terms') },
      }),
      isPro: false,
    },
    {
      id: 'privacy',
      icon: 'shield-checkmark-outline' as const,
      label: t('settings.privacy'),
      onPress: () => router.push({
        pathname: '/webview',
        params: { file: 'privacy', title: t('settings.privacy') },
      }),
      isPro: false,
    },
  ];

  return (
    <View style={[commonStyles.container, { backgroundColor: colors.background }]}>
      <Header title={t('settings.title')} backIcon="arrow-back" />

      <ScrollView style={styles.content}>
        {/* メニュー項目 */}
        <View style={styles.menuSection}>
          <View style={[styles.menuGroup, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {menuItems.map((item, index) => (
              <React.Fragment key={item.id}>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={item.onPress}
                  activeOpacity={0.7}
                >
                  <View style={styles.menuLeft}>
                    <Ionicons name={item.icon} size={24} color={colors.text} />
                    <Text style={[styles.menuLabel, { color: colors.text, fontSize: responsiveFontSizes.base, lineHeight: responsiveLineHeights.base }]}>{item.label}</Text>
                    {item.isPro && !isSubscribed && (
                      <View style={[styles.proBadge, { backgroundColor: colors.primary }]}>
                        <Text style={[styles.proBadgeText, { fontSize: responsiveFontSizes.xs, lineHeight: responsiveLineHeights.xs }]}>Pro</Text>
                      </View>
                    )}
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
                {index < menuItems.length - 1 && (
                  <View style={[styles.separator, { backgroundColor: colors.border }]} />
                )}
              </React.Fragment>
            ))}
          </View>
        </View>

        {/* サブスクリプションセクション */}
        <View style={styles.menuSection}>
          <TouchableOpacity
            style={[
              styles.subscriptionCard,
              {
                backgroundColor: isSubscribed ? colors.primary + '20' : colors.surface,
                borderColor: isSubscribed ? colors.primary : colors.border,
              },
            ]}
            onPress={() => router.push(isSubscribed ? '/subscription/manage' : '/subscription/paywall')}
            activeOpacity={0.7}
          >
            <View style={styles.subscriptionLeft}>
              <Ionicons
                name={isSubscribed ? 'diamond' : 'diamond-outline'}
                size={32}
                color={colors.primary}
              />
              <View style={styles.subscriptionText}>
                <Text style={[styles.subscriptionTitle, { color: colors.text, fontSize: responsiveFontSizes.base, lineHeight: responsiveLineHeights.base }]}>
                  {isSubscribed ? t('subscription.subscribed') : t('subscription.title')}
                </Text>
                <Text style={{ color: colors.textSecondary, fontSize: responsiveFontSizes.sm, lineHeight: responsiveLineHeights.sm }}>
                  {isSubscribed
                    ? t('subscription.manage')
                    : t('subscription.subscribe')}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* 開発者メニュー（開発時のみ表示） */}
        {__DEV__ && (
          <View style={styles.menuSection}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary, fontSize: responsiveFontSizes.xs, lineHeight: responsiveLineHeights.xs }]}>
              Developer Menu
            </Text>
            <View style={[styles.menuGroup, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={handleDevSubscriptionToggle}
                activeOpacity={0.7}
              >
                <View style={styles.menuLeft}>
                  <Ionicons name="bug-outline" size={24} color={colors.text} />
                  <View style={styles.devMenuText}>
                    <Text style={[styles.devMenuTitle, { color: colors.text, fontSize: responsiveFontSizes.base, lineHeight: responsiveLineHeights.base }]}>
                      Subscription Override
                    </Text>
                    <Text style={{ color: colors.textSecondary, fontSize: responsiveFontSizes.sm, lineHeight: responsiveLineHeights.sm }}>
                      {devOverride === null
                        ? 'Using real status'
                        : devOverride
                          ? 'Pro Plan (Manual)'
                          : 'Free Plan (Manual)'}
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
              </TouchableOpacity>

              <View style={[styles.separator, { backgroundColor: colors.border }]} />

              <TouchableOpacity
                style={styles.menuItem}
                onPress={handleResetDatabase}
                activeOpacity={0.7}
              >
                <View style={styles.menuLeft}>
                  <Ionicons name="refresh-outline" size={24} color={colors.error || '#FF6B6B'} />
                  <View style={styles.devMenuText}>
                    <Text style={[styles.devMenuTitle, { color: colors.error || '#FF6B6B', fontSize: responsiveFontSizes.base, lineHeight: responsiveLineHeights.base }]}>
                      Reset Database
                    </Text>
                    <Text style={{ color: colors.textSecondary, fontSize: responsiveFontSizes.sm, lineHeight: responsiveLineHeights.sm }}>
                      Delete all data and runSeed test data
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
              </TouchableOpacity>

              <View style={[styles.separator, { backgroundColor: colors.border }]} />

              <TouchableOpacity
                style={styles.menuItem}
                onPress={handleDeleteDatabase}
                activeOpacity={0.7}
              >
                <View style={styles.menuLeft}>
                  <Ionicons name="trash-outline" size={24} color={colors.error || '#FF6B6B'} />
                  <View style={styles.devMenuText}>
                    <Text style={[styles.devMenuTitle, { color: colors.error || '#FF6B6B', fontSize: responsiveFontSizes.base, lineHeight: responsiveLineHeights.base }]}>
                      Delete Database File
                    </Text>
                    <Text style={{ color: colors.textSecondary, fontSize: responsiveFontSizes.sm, lineHeight: responsiveLineHeights.sm }}>
                      Completely delete database file and recreate
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
              </TouchableOpacity>

              <View style={[styles.separator, { backgroundColor: colors.border }]} />

              <TouchableOpacity
                style={styles.menuItem}
                onPress={handleChangeSchemaVersion}
                activeOpacity={0.7}
              >
                <View style={styles.menuLeft}>
                  <Ionicons name="git-branch-outline" size={24} color={colors.text} />
                  <View style={styles.devMenuText}>
                    <Text style={[styles.devMenuTitle, { color: colors.text, fontSize: responsiveFontSizes.base, lineHeight: responsiveLineHeights.base }]}>
                      Change Schema Version
                    </Text>
                    <Text style={{ color: colors.textSecondary, fontSize: responsiveFontSizes.sm, lineHeight: responsiveLineHeights.sm }}>
                      Test database migrations (Current: {SCHEMA_VERSION})
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
  menuSection: {
    padding: UI_CONSTANTS.GAP.LG,
  },
  menuGroup: {
    borderRadius: UI_CONSTANTS.BORDER_RADIUS.LG,
    borderWidth: UI_CONSTANTS.BORDER_WIDTH.THIN,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: UI_CONSTANTS.GAP.LG,
  },
  separator: {
    height: UI_CONSTANTS.BORDER_WIDTH.THIN,
    marginLeft: 56,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: UI_CONSTANTS.GAP.BASE,
  },
  menuLabel: {
    fontWeight: UI_CONSTANTS.FONT_WEIGHT.MEDIUM,
  },
  proBadge: {
    paddingHorizontal: UI_CONSTANTS.GAP.MD,
    paddingVertical: UI_CONSTANTS.GAP.XXS,
    borderRadius: UI_CONSTANTS.BORDER_RADIUS.SM,
    marginLeft: UI_CONSTANTS.GAP.MD,
  },
  proBadgeText: {
    color: '#FFFFFF',
    fontWeight: UI_CONSTANTS.FONT_WEIGHT.SEMIBOLD,
  },
  subscriptionCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: UI_CONSTANTS.GAP.XL,
    borderRadius: UI_CONSTANTS.BORDER_RADIUS.XL,
    borderWidth: UI_CONSTANTS.BORDER_WIDTH.THICK,
  },
  subscriptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: UI_CONSTANTS.GAP.LG,
  },
  subscriptionText: {
    gap: UI_CONSTANTS.GAP.XS,
  },
  subscriptionTitle: {
    fontWeight: UI_CONSTANTS.FONT_WEIGHT.SEMIBOLD,
  },
  sectionTitle: {
    fontWeight: UI_CONSTANTS.FONT_WEIGHT.SEMIBOLD,
    marginBottom: UI_CONSTANTS.GAP.MD,
    marginLeft: UI_CONSTANTS.GAP.XS,
    textTransform: 'uppercase',
  },
  devMenuText: {
    gap: UI_CONSTANTS.GAP.XS,
  },
  devMenuTitle: {
    fontWeight: UI_CONSTANTS.FONT_WEIGHT.SEMIBOLD,
  },
});
