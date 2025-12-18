/**
 * サブスクリプション購入画面（Paywall）
 * Proプランの機能説明と購入UI
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useRouter, useNavigation } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../lib/themeSystem';
import { useSubscription } from '../../lib/hooks/useSubscription';
import { Logger } from '../../lib/logger';
import { Header } from '../../components/common/Header';
import { commonStyles } from '../../lib/styles/commonStyles';
import type { PurchasesPackage } from 'react-native-purchases';
import { showAlert } from '../../lib/utils/alerts';

export default function PaywallScreen() {
  const { t } = useTranslation();
  const { colors, responsiveFontSizes, responsiveLineHeights } = useTheme();
  const router = useRouter();
  const navigation = useNavigation();
  const { isSubscribed, refresh, getCurrentPlanType, getOfferings, purchasePackage, restorePurchases } = useSubscription();

  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [monthlyPackage, setMonthlyPackage] = useState<PurchasesPackage | null>(null);
  const [yearlyPackage, setYearlyPackage] = useState<PurchasesPackage | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly');
  const [currentPlan, setCurrentPlan] = useState<'monthly' | 'annual' | null>(null);

  useEffect(() => {
    loadCurrentPlan();
    loadOfferings();
  }, []);

  // 購入処理中はスワイプバックを無効化
  useEffect(() => {
    navigation.setOptions({
      gestureEnabled: !purchasing,
    });
  }, [purchasing, navigation]);

  const loadCurrentPlan = async () => {
    try {
      // CustomerInfoを最新の状態に更新
      await refresh();
      const planType = getCurrentPlanType();
      setCurrentPlan(planType);
    } catch (error) {
      Logger.error('[PaywallScreen] Failed to load current plan:', error);
    }
  };

  const loadOfferings = async () => {
    try {
      setLoading(true);
      const offering = await getOfferings();

      if (offering) {
        // 月額プランと年間プランを取得
        const monthly = offering.availablePackages.find(
          (pkg: PurchasesPackage) => pkg.packageType === 'MONTHLY'
        );
        const yearly = offering.availablePackages.find(
          (pkg: PurchasesPackage) => pkg.packageType === 'ANNUAL'
        );

        setMonthlyPackage(monthly || null);
        setYearlyPackage(yearly || null);
      }
    } catch (error) {
      Logger.error('[PaywallScreen] Failed to load offerings:', error);
      showAlert('', t('error.generic'), undefined, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async () => {
    try {
      setPurchasing(true);

      const pkg = selectedPlan === 'monthly' ? monthlyPackage : yearlyPackage;

      if (!pkg) {
        showAlert('', t('error.generic'), undefined, 'error');
        return;
      }

      await purchasePackage(pkg);

      showAlert('', t('subscription.purchase_success'), undefined, 'success', () => {
        router.back();
      });
    } catch (error: any) {
      if (error.userCancelled) {
        // ユーザーがキャンセルした場合は何もしない
        return;
      }
      showAlert('', t('subscription.purchase_failed'), undefined, 'error');
    } finally {
      setPurchasing(false);
    }
  };

  const handleRestore = async () => {
    try {
      setPurchasing(true);
      await restorePurchases();

      if (isSubscribed) {
        showAlert('', t('subscription.restore_success'), undefined, 'success', () => {
          router.back();
        });
      } else {
        showAlert('', t('subscription.restore_failed'), undefined, 'error');
      }
    } catch (error) {
      showAlert('', t('subscription.restore_failed'), undefined, 'error');
    } finally {
      setPurchasing(false);
    }
  };

  if (loading) {
    return (
      <View style={[commonStyles.container, { backgroundColor: colors.background }]}>
        <Header title="" backgroundColor={colors.background} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={[commonStyles.container, { backgroundColor: colors.background }]}>
      <Header title="" backgroundColor={colors.background} />

      <ScrollView contentContainerStyle={styles.content}>
        {/* タイトル */}
        <View style={styles.titleSection}>
          <Ionicons name="diamond" size={48} color={colors.primary} />
          <Text style={[styles.title, { color: colors.text, fontSize: responsiveFontSizes.xxl, lineHeight: responsiveLineHeights.xxl }]}>
            {t('subscription.title')}
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary, fontSize: responsiveFontSizes.base, lineHeight: responsiveLineHeights.base }]}>
            {t('subscription.features_title')}
          </Text>
        </View>

        {/* 機能一覧 */}
        <View style={styles.featuresSection}>
          <FeatureItem
            icon="close-circle-outline"
            title={t('subscription.feature_no_ads')}
            description={t('subscription.feature_no_ads_desc')}
            colors={colors}
            responsiveFontSizes={responsiveFontSizes}
            responsiveLineHeights={responsiveLineHeights}
          />
          <FeatureItem
            icon="options-outline"
            title={t('subscription.feature_unlimited_profiles')}
            description={t('subscription.feature_unlimited_profiles_desc')}
            colors={colors}
            responsiveFontSizes={responsiveFontSizes}
            responsiveLineHeights={responsiveLineHeights}
          />
          <FeatureItem
            icon="code-slash-outline"
            title={t('subscription.feature_custom_variables')}
            description={t('subscription.feature_custom_variables_desc')}
            colors={colors}
            responsiveFontSizes={responsiveFontSizes}
            responsiveLineHeights={responsiveLineHeights}
          />
        </View>

        {/* プラン選択 */}
        <View style={styles.plansSection}>
          {/* 年間プラン */}
          {yearlyPackage && (
            <View
              style={[
                styles.planCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: selectedPlan === 'yearly' ? colors.primary : colors.border,
                  borderWidth: selectedPlan === 'yearly' ? 2 : 1,
                },
                currentPlan === 'annual' && styles.disabledPlan,
              ]}
            >
              {currentPlan === 'annual' && (
                <View style={[styles.disabledOverlay, { backgroundColor: colors.background }]} />
              )}
              <TouchableOpacity
                onPress={() => {
                  if (currentPlan !== 'annual') {
                    setSelectedPlan('yearly');
                  }
                }}
                activeOpacity={currentPlan === 'annual' ? 1 : 0.7}
                disabled={currentPlan === 'annual'}
                style={styles.planCardInner}
              >
                <View style={styles.planHeader}>
                  <View style={styles.planTitleRow}>
                    <Ionicons
                      name={selectedPlan === 'yearly' ? 'radio-button-on' : 'radio-button-off'}
                      size={24}
                      color={currentPlan === 'annual' ? colors.textSecondary : (selectedPlan === 'yearly' ? colors.primary : colors.textSecondary)}
                    />
                    <Text style={[styles.planTitle, { color: currentPlan === 'annual' ? colors.textSecondary : colors.text, fontSize: responsiveFontSizes.md, lineHeight: responsiveLineHeights.md }]}>
                      {t('subscription.yearly')}
                    </Text>
                    {currentPlan === 'annual' && (
                      <View style={[styles.activeBadge, { backgroundColor: colors.primary + '20', borderColor: colors.primary }]}>
                        <Text style={[styles.activeBadgeText, { color: colors.primary, fontSize: responsiveFontSizes.xs, lineHeight: responsiveLineHeights.xs }]}>
                          {t('subscription.subscribed')}
                        </Text>
                      </View>
                    )}
                  </View>
                  {currentPlan !== 'annual' && (
                    <View style={[styles.badge, { backgroundColor: colors.success }]}>
                      <Text style={[styles.badgeText, { fontSize: responsiveFontSizes.xs, lineHeight: responsiveLineHeights.xs }]}>{t('subscription.yearly_discount')}</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.planPrice, { color: currentPlan === 'annual' ? colors.textSecondary : colors.text, fontSize: responsiveFontSizes.base, lineHeight: responsiveLineHeights.base }]}>
                  {yearlyPackage.product.priceString}{t('subscription.per_year')}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* 月額プラン */}
          {monthlyPackage && (
            <View
              style={[
                styles.planCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: selectedPlan === 'monthly' ? colors.primary : colors.border,
                  borderWidth: selectedPlan === 'monthly' ? 2 : 1,
                },
                currentPlan === 'monthly' && styles.disabledPlan,
              ]}
            >
              {currentPlan === 'monthly' && (
                <View style={[styles.disabledOverlay, { backgroundColor: colors.background }]} />
              )}
              <TouchableOpacity
                onPress={() => {
                  if (currentPlan !== 'monthly') {
                    setSelectedPlan('monthly');
                  }
                }}
                activeOpacity={currentPlan === 'monthly' ? 1 : 0.7}
                disabled={currentPlan === 'monthly'}
                style={styles.planCardInner}
              >
                <View style={styles.planHeader}>
                  <View style={styles.planTitleRow}>
                    <Ionicons
                      name={selectedPlan === 'monthly' ? 'radio-button-on' : 'radio-button-off'}
                      size={24}
                      color={currentPlan === 'monthly' ? colors.textSecondary : (selectedPlan === 'monthly' ? colors.primary : colors.textSecondary)}
                    />
                    <Text style={[styles.planTitle, { color: currentPlan === 'monthly' ? colors.textSecondary : colors.text, fontSize: responsiveFontSizes.md, lineHeight: responsiveLineHeights.md }]}>
                      {t('subscription.monthly')}
                    </Text>
                    {currentPlan === 'monthly' && (
                      <View style={[styles.activeBadge, { backgroundColor: colors.primary + '20', borderColor: colors.primary }]}>
                        <Text style={[styles.activeBadgeText, { color: colors.primary, fontSize: responsiveFontSizes.xs, lineHeight: responsiveLineHeights.xs }]}>
                          {t('subscription.subscribed')}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
                <Text style={[styles.planPrice, { color: currentPlan === 'monthly' ? colors.textSecondary : colors.text, fontSize: responsiveFontSizes.base, lineHeight: responsiveLineHeights.base }]}>
                  {monthlyPackage.product.priceString}{t('subscription.per_month')}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* 購入ボタン */}
        <TouchableOpacity
          style={[styles.purchaseButton, { backgroundColor: colors.primary }]}
          onPress={handlePurchase}
          disabled={purchasing}
        >
          {purchasing ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={[styles.purchaseButtonText, { fontSize: responsiveFontSizes.md, lineHeight: responsiveLineHeights.md }]}>
              {t('subscription.subscribe')}
            </Text>
          )}
        </TouchableOpacity>

        {/* 復元ボタン */}
        <TouchableOpacity
          style={styles.restoreButton}
          onPress={handleRestore}
          disabled={purchasing}
        >
          <Text style={[styles.restoreButtonText, { color: colors.primary, fontSize: responsiveFontSizes.md, lineHeight: responsiveLineHeights.md }]}>
            {t('subscription.restore')}
          </Text>
        </TouchableOpacity>

        {/* 利用規約とプライバシーポリシーへのリンク */}
        <View style={styles.legalLinksContainer}>
          <TouchableOpacity
            onPress={() => router.push({
              pathname: '/webview',
              params: { file: 'terms', title: t('settings.terms') }
            })}
            disabled={purchasing}
          >
            <Text style={[styles.legalLinkText, { color: colors.textSecondary, fontSize: responsiveFontSizes.sm, lineHeight: responsiveLineHeights.sm }]}>
              {t('settings.terms')}
            </Text>
          </TouchableOpacity>
          <Text style={[styles.legalSeparator, { color: colors.textSecondary, fontSize: responsiveFontSizes.sm, lineHeight: responsiveLineHeights.sm }]}>
            {' • '}
          </Text>
          <TouchableOpacity
            onPress={() => router.push({
              pathname: '/webview',
              params: { file: 'privacy', title: t('settings.privacy') }
            })}
            disabled={purchasing}
          >
            <Text style={[styles.legalLinkText, { color: colors.textSecondary, fontSize: responsiveFontSizes.sm, lineHeight: responsiveLineHeights.sm }]}>
              {t('settings.privacy')}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* 購入処理中のオーバーレイローディング */}
      <Modal
        visible={purchasing}
        transparent
        animationType="fade"
        statusBarTranslucent
      >
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </Modal>
    </View>
  );
}

interface FeatureItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  colors: any;
  responsiveFontSizes: any;
  responsiveLineHeights: any;
}

function FeatureItem({ icon, title, description, colors, responsiveFontSizes, responsiveLineHeights }: FeatureItemProps) {
  return (
    <View style={styles.featureItem}>
      <View style={[styles.featureIcon, { backgroundColor: colors.primary + '20' }]}>
        <Ionicons name={icon} size={24} color={colors.primary} />
      </View>
      <View style={styles.featureContent}>
        <Text style={[styles.featureTitle, { color: colors.text, fontSize: responsiveFontSizes.md, lineHeight: responsiveLineHeights.md }]}>{title}</Text>
        <Text style={[{ color: colors.textSecondary, fontSize: responsiveFontSizes.sm, lineHeight: responsiveLineHeights.sm }]}>
          {description}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 24,
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
  },
  featuresSection: {
    marginBottom: 32,
    gap: 20,
  },
  featureItem: {
    flexDirection: 'row',
    gap: 16,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureContent: {
    flex: 1,
    gap: 4,
  },
  featureTitle: {
    fontWeight: '600',
  },
  plansSection: {
    marginBottom: 24,
    gap: 12,
  },
  planCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  planCardInner: {
    padding: 20,
    gap: 12,
  },
  disabledPlan: {
    opacity: 0.4,
  },
  disabledOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.7,
    zIndex: 1,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  planTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  planTitle: {
    fontWeight: '600',
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  activeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
  },
  activeBadgeText: {
    fontWeight: '600',
  },
  planPrice: {
    fontWeight: '700',
    marginLeft: 36,
  },
  purchaseButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  purchaseButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  restoreButton: {
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  restoreButtonText: {
    fontWeight: '600',
  },
  legalLinksContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 24,
  },
  legalLinkText: {
    textDecorationLine: 'underline',
  },
  legalSeparator: {
    marginHorizontal: 4,
  },
  loadingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
