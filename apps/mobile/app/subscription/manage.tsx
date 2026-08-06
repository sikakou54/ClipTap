/**
 * @module ManageSubscriptionScreen
 * @description サブスクリプション管理画面
 *
 * 現在のサブスクリプション状態を表示し、プラン管理を行う画面。
 *
 * @features
 * - 現在のプラン状態表示（無料/月額/年間）
 * - 次回請求日の表示
 * - Proプランの機能一覧表示
 * - App Store/Google Playのサブスクリプション設定への誘導
 * - 購入復元機能
 *
 * @see lib/hooks/screens/useManageSubscriptionScreen.ts - ビジネスロジック
 */

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Modal,
} from 'react-native';
import { useTranslation } from '@cliptap/shared'
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@lib/themeSystem';
import { ScreenContainer } from '@components/common/ScreenContainer';
import { useManageSubscriptionScreen } from '@hooks/screens/useManageSubscriptionScreen';

export default function ManageSubscriptionScreen() {
  const { t } = useTranslation();
  const { colors, responsiveFontSizes, responsiveLineHeights } = useTheme();

  const {
    isSubscribed,
    expirationDate,
    currentPlan,
    restoring,
    showKeyboardGuide,
    setShowKeyboardGuide,
    handleOpenSubscriptionSettings,
    handleRestore,
    handleOpenKeyboardSettings,
    navigateToPaywall,
  } = useManageSubscriptionScreen();

  return (
    <ScreenContainer title={t('subscription.manage')} backIcon="arrow-back">
      <ScrollView contentContainerStyle={styles.content}>
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

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={handleOpenKeyboardSettings}
          >
            <Ionicons name="keypad-outline" size={24} color={colors.text} />
            <Text style={[styles.actionButtonText, { color: colors.text, fontSize: responsiveFontSizes.base, lineHeight: responsiveLineHeights.base }]}>
              {t('subscription.enable_keyboard')}
            </Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          {!isSubscribed && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.primary }]}
              onPress={navigateToPaywall}
            >
              <Ionicons name="star" size={24} color="#FFFFFF" />
              <Text style={[styles.actionButtonText, { color: '#FFFFFF', fontSize: responsiveFontSizes.base, lineHeight: responsiveLineHeights.base }]}>
                {t('subscription.subscribe')}
              </Text>
              <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          )}
        </View>

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

      {/* キーボード設定ガイドモーダル */}
      <Modal
        visible={showKeyboardGuide}
        transparent
        animationType="fade"
        onRequestClose={() => setShowKeyboardGuide(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Ionicons name="keypad" size={48} color={colors.primary} />
              <Text style={[styles.modalTitle, { color: colors.text, fontSize: responsiveFontSizes.lg }]}>
                {t(Platform.OS === 'ios' ? 'subscription.keyboard_guide_title_ios' : 'subscription.keyboard_guide_title_android')}
              </Text>
            </View>

            <View style={styles.guideSteps}>
              <View style={styles.guideStep}>
                <View style={[styles.stepNumber, { backgroundColor: colors.primary }]}>
                  <Text style={styles.stepNumberText}>1</Text>
                </View>
                <Text style={[styles.stepText, { color: colors.text, fontSize: responsiveFontSizes.base }]}>
                  {t(Platform.OS === 'ios' ? 'subscription.keyboard_guide_step1_ios' : 'subscription.keyboard_guide_step1_android')}
                </Text>
              </View>

              <View style={styles.guideStep}>
                <View style={[styles.stepNumber, { backgroundColor: colors.primary }]}>
                  <Text style={styles.stepNumberText}>2</Text>
                </View>
                <Text style={[styles.stepText, { color: colors.text, fontSize: responsiveFontSizes.base }]}>
                  {t(Platform.OS === 'ios' ? 'subscription.keyboard_guide_step2_ios' : 'subscription.keyboard_guide_step2_android')}
                </Text>
              </View>

              <View style={styles.guideStep}>
                <View style={[styles.stepNumber, { backgroundColor: colors.primary }]}>
                  <Text style={styles.stepNumberText}>3</Text>
                </View>
                <Text style={[styles.stepText, { color: colors.text, fontSize: responsiveFontSizes.base }]}>
                  {t(Platform.OS === 'ios' ? 'subscription.keyboard_guide_step3_ios' : 'subscription.keyboard_guide_step3_android')}
                </Text>
              </View>

              <View style={styles.guideStep}>
                <View style={[styles.stepNumber, { backgroundColor: colors.primary }]}>
                  <Text style={styles.stepNumberText}>4</Text>
                </View>
                <Text style={[styles.stepText, { color: colors.text, fontSize: responsiveFontSizes.base }]}>
                  {t(Platform.OS === 'ios' ? 'subscription.keyboard_guide_step4_ios' : 'subscription.keyboard_guide_step4_android')}
                </Text>
              </View>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.primary }]}
                onPress={() => setShowKeyboardGuide(false)}
              >
                <Text style={[styles.modalButtonText, { fontSize: responsiveFontSizes.base }]}>
                  {t('common.ok')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 24,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 24,
    gap: 12,
  },
  modalTitle: {
    fontWeight: '600',
    textAlign: 'center',
  },
  guideSteps: {
    gap: 16,
    marginBottom: 24,
  },
  guideStep: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  stepText: {
    flex: 1,
    lineHeight: 24,
  },
  modalButtons: {
    gap: 12,
  },
  modalButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  modalButtonSecondary: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  modalButtonSecondaryText: {
    fontWeight: '500',
  },
});
