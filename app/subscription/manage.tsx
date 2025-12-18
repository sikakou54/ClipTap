/**
 * サブスクリプション管理画面
 * 現在のプラン情報と解約方法の案内
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Linking,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../lib/themeSystem';
import { useSubscription } from '../../lib/hooks/useSubscription';
import { Header } from '../../components/common/Header';
import { commonStyles } from '../../lib/styles/commonStyles';
import { showAlert, showConfirm } from '../../lib/utils/alerts';

export default function ManageSubscriptionScreen() {
  const { t } = useTranslation();
  const { colors, responsiveFontSizes, responsiveLineHeights } = useTheme();
  const router = useRouter();
  const { isSubscribed, refresh, getExpirationDate, getCurrentPlanType, restorePurchases } = useSubscription();

  const [expirationDate, setExpirationDate] = useState<Date | null>(null);
  const [currentPlan, setCurrentPlan] = useState<'monthly' | 'annual' | null>(null);
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    loadSubscriptionInfo();
  }, []);

  const loadSubscriptionInfo = () => {
    const expiration = getExpirationDate();
    const planType = getCurrentPlanType();
    setExpirationDate(expiration);
    setCurrentPlan(planType);
  };

  // サブスクリプション設定を開く
  const handleOpenSubscriptionSettings = () => {
    const url = Platform.select({
      ios: 'https://apps.apple.com/account/subscriptions',
      android: 'https://play.google.com/store/account/subscriptions',
    });

    showConfirm(
      t('subscription.manage_description'),
      () => {
        if (url) {
          Linking.openURL(url);
        }
      },
      undefined,
      'info'
    );
  };

  // 購入を復元
  const handleRestore = async () => {
    try {
      setRestoring(true);
      await restorePurchases();

      if (isSubscribed) {
        showAlert('', t('subscription.restore_success'), undefined, 'success');
        loadSubscriptionInfo();
      } else {
        showAlert('', t('subscription.restore_failed'), undefined, 'error');
      }
    } catch (error) {
      showAlert('', t('subscription.restore_failed'), undefined, 'error');
    } finally {
      setRestoring(false);
    }
  };

  return (
    <View style={[commonStyles.container, { backgroundColor: colors.background }]}>
      <Header title={t('subscription.manage')} backIcon="arrow-back" />

      <ScrollView contentContainerStyle={styles.content}>
        {/* プラン状態 */}
        <View style={[styles.statusCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.statusHeader}>
            <Ionicons
              name={isSubscribed ? 'checkmark-circle' : 'information-circle-outline'}
              size={48}
              color={isSubscribed ? colors.success : colors.textSecondary}
            />
            <Text style={[styles.statusTitle, { color: colors.text, fontSize: responsiveFontSizes.base, lineHeight: responsiveLineHeights.base }]}>
              {isSubscribed ? t('subscription.subscribed') : t('subscription.not_subscribed')}
            </Text>
          </View>

          {isSubscribed && currentPlan && (
            <View style={styles.statusInfo}>
              <View style={[styles.currentPlanBadge, { backgroundColor: colors.primary + '20', borderColor: colors.primary }]}>
                <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
                <Text style={[styles.currentPlanText, { color: colors.primary, fontSize: responsiveFontSizes.base, lineHeight: responsiveLineHeights.base }]}>
                  {currentPlan === 'monthly' ? t('subscription.monthly') : t('subscription.yearly')} - {t('subscription.subscribed')}
                </Text>
              </View>
              {expirationDate && (
                <View style={styles.dateInfo}>
                  <Text style={[styles.statusLabel, { color: colors.textSecondary, fontSize: responsiveFontSizes.sm, lineHeight: responsiveLineHeights.sm }]}>
                    {t('subscription.next_billing_date')}
                  </Text>
                  <Text style={[styles.statusValue, { color: colors.text, fontSize: responsiveFontSizes.base, lineHeight: responsiveLineHeights.base }]}>
                    {expirationDate.toLocaleDateString('ja-JP', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* 機能一覧 */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text, fontSize: responsiveFontSizes.base, lineHeight: responsiveLineHeights.base }]}>
            {t('subscription.features_title')}
          </Text>

          <View style={[styles.featureCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name="close-circle-outline" size={24} color={colors.primary} />
            <View style={styles.featureText}>
              <Text style={[styles.featureTitle, { color: colors.text, fontSize: responsiveFontSizes.base, lineHeight: responsiveLineHeights.base }]}>
                {t('subscription.feature_no_ads')}
              </Text>
              <Text style={[styles.featureDescription, { color: colors.textSecondary, fontSize: responsiveFontSizes.sm, lineHeight: responsiveLineHeights.sm }]}>
                {t('subscription.feature_no_ads_desc')}
              </Text>
            </View>
          </View>

          <View style={[styles.featureCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name="options-outline" size={24} color={colors.primary} />
            <View style={styles.featureText}>
              <Text style={[styles.featureTitle, { color: colors.text, fontSize: responsiveFontSizes.base, lineHeight: responsiveLineHeights.base }]}>
                {t('subscription.feature_unlimited_profiles')}
              </Text>
              <Text style={[styles.featureDescription, { color: colors.textSecondary, fontSize: responsiveFontSizes.sm, lineHeight: responsiveLineHeights.sm }]}>
                {t('subscription.feature_unlimited_profiles_desc')}
              </Text>
            </View>
          </View>

          <View style={[styles.featureCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name="code-slash-outline" size={24} color={colors.primary} />
            <View style={styles.featureText}>
              <Text style={[styles.featureTitle, { color: colors.text, fontSize: responsiveFontSizes.base, lineHeight: responsiveLineHeights.base }]}>
                {t('subscription.feature_custom_variables')}
              </Text>
              <Text style={[styles.featureDescription, { color: colors.textSecondary, fontSize: responsiveFontSizes.sm, lineHeight: responsiveLineHeights.sm }]}>
                {t('subscription.feature_custom_variables_desc')}
              </Text>
            </View>
          </View>
        </View>

        {/* 管理ボタン */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text, fontSize: responsiveFontSizes.base, lineHeight: responsiveLineHeights.base }]}>
            {t('subscription.manage_subscription')}
          </Text>

          {isSubscribed && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={handleOpenSubscriptionSettings}
            >
              <Ionicons name="settings-outline" size={24} color={colors.text} />
              <Text style={[styles.actionButtonText, { color: colors.text, fontSize: responsiveFontSizes.base, lineHeight: responsiveLineHeights.base }]}>
                {t('subscription.open_settings')}
              </Text>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={handleRestore}
            disabled={restoring}
          >
            <Ionicons name="refresh-outline" size={24} color={colors.text} />
            <Text style={[styles.actionButtonText, { color: colors.text, fontSize: responsiveFontSizes.base, lineHeight: responsiveLineHeights.base }]}>
              {t('subscription.restore')}
            </Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          {!isSubscribed && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.primary }]}
              onPress={() => router.push('/subscription/paywall')}
            >
              <Ionicons name="star" size={24} color="#FFFFFF" />
              <Text style={[styles.actionButtonText, { color: '#FFFFFF', fontSize: responsiveFontSizes.base, lineHeight: responsiveLineHeights.base }]}>
                {t('subscription.subscribe')}
              </Text>
              <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          )}
        </View>

        {/* 解約方法の説明 */}
        {isSubscribed && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text, fontSize: responsiveFontSizes.base, lineHeight: responsiveLineHeights.base }]}>
              {t('subscription.how_to_cancel')}
            </Text>
            <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[{ color: colors.textSecondary, fontSize: responsiveFontSizes.sm, lineHeight: responsiveLineHeights.sm }]}>
                {Platform.OS === 'ios' ? t('subscription.cancel_steps_ios') : t('subscription.cancel_steps_android')}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
  },
  statusCard: {
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 24,
    alignItems: 'center',
  },
  statusHeader: {
    alignItems: 'center',
    gap: 12,
  },
  statusTitle: {
    
    fontWeight: '600',
  },
  statusInfo: {
    marginTop: 16,
    alignItems: 'center',
    gap: 12,
    width: '100%',
  },
  currentPlanBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  currentPlanText: {
    
    fontWeight: '600',
  },
  dateInfo: {
    alignItems: 'center',
    gap: 4,
  },
  statusLabel: {
    
  },
  statusValue: {
    
    fontWeight: '600',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    
    fontWeight: '600',
    marginBottom: 16,
  },
  featureCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    gap: 12,
  },
  featureText: {
    flex: 1,
    gap: 4,
  },
  featureTitle: {
    
    fontWeight: '600',
  },
  featureDescription: {
    
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    gap: 12,
  },
  actionButtonText: {
    flex: 1,
    
    fontWeight: '500',
  },
  infoCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
});
