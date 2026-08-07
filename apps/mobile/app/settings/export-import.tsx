/**
 * @module ExportImportScreen
 * @description エクスポート・インポート画面
 *
 * データのバックアップと復元を行う画面。
 *
 * @features
 * - データのエクスポート（.cliptapファイル形式）
 * - データのインポート（フルリストア/部分インポート）
 * - パスワード一致とチェックサムによるファイル確認（暗号化ではない）
 *
 * @security
 * - パスワード + スキーマバージョンのSHA-256ハッシュ化
 * - 全フィールドのチェックサム検証
 *
 * @see lib/services/ExportImportService.ts - ビジネスロジック
 */
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  TouchableWithoutFeedback,
  Keyboard,
  ActivityIndicator
} from 'react-native';
import { useTranslation } from '@cliptap/shared';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@lib/themeSystem';
import { SCHEMA_VERSION } from '@database/schema';
import { ScreenContainer } from '@components/common/ScreenContainer';
import { UI_CONSTANTS } from '@constants/ui';
import { useExportImportScreen } from '@hooks/screens/useExportImportScreen';

export default function ExportImportScreen() {
  const { t } = useTranslation();
  const { colors, responsiveFontSizes, responsiveLineHeights } = useTheme();

  const {
    showPasswordModal,
    modalMode,
    password,
    isProcessing,
    showImportModeModal,
    setPassword,
    handleExportBackup,
    handleImportBackup,
    handlePasswordSubmit,
    closePasswordModal,
    closeImportModeModal,
    executeFullRestore,
    preparePartialImport,
  } = useExportImportScreen();

  const menuItems = [
    {
      id: 'export',
      icon: 'cloud-upload-outline' as const,
      label: t('export_import.export'),
      description: t('export_import.export_description'),
      onPress: handleExportBackup,
    },
    {
      id: 'import',
      icon: 'cloud-download-outline' as const,
      label: t('export_import.import'),
      description: t('export_import.import_description'),
      onPress: handleImportBackup,
    },
  ];

  return (
    <ScreenContainer title={t('export_import.title')} backIcon="arrow-back">
      <ScrollView style={styles.content}>
        {/* バージョン情報セクション */}
        <View style={styles.infoSection}>
          <View style={[styles.versionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.versionHeader}>
              <Ionicons name="information-circle-outline" size={24} color={colors.primary} />
              <Text style={[styles.versionLabel, { color: colors.text, fontSize: responsiveFontSizes.base, lineHeight: responsiveLineHeights.base }]}>
                {t('export_import.schema_version')} : {SCHEMA_VERSION}
              </Text>
            </View>
          </View>

          <View style={[styles.noticeCard, { backgroundColor: colors.warning + '15', borderColor: colors.warning + '40' }]}>
            <Ionicons name="warning-outline" size={20} color={colors.warning} style={styles.noticeIcon} />
            <Text style={[styles.noticeText, { color: colors.text, fontSize: responsiveFontSizes.sm, lineHeight: responsiveLineHeights.sm }]}>
              {t('export_import.version_notice')}
            </Text>
          </View>
        </View>

        {/* メニューセクション */}
        <View style={styles.menuSection}>
          <View style={[styles.menuGroup, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {menuItems.map((item, index) => (
              <React.Fragment key={item.id}>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={item.onPress}
                  activeOpacity={0.7}
                  disabled={isProcessing}
                >
                  <View style={styles.menuLeft}>
                    <View style={[styles.iconContainer, { backgroundColor: colors.primary + '15' }]}>
                      <Ionicons name={item.icon} size={24} color={isProcessing ? colors.textSecondary : colors.primary} />
                    </View>
                    <View style={styles.menuTextContainer}>
                      <Text style={[styles.menuLabel, { color: isProcessing ? colors.textSecondary : colors.text, fontSize: responsiveFontSizes.base, lineHeight: responsiveLineHeights.base }]}>
                        {item.label}
                      </Text>
                      <Text style={[styles.menuDescription, { color: colors.textSecondary, fontSize: responsiveFontSizes.sm, lineHeight: responsiveLineHeights.sm }]}>
                        {item.description}
                      </Text>
                    </View>
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

        {/* 使い方ガイド */}
        <View style={styles.helpSection}>
          <Text style={[styles.helpTitle, { color: colors.text, fontSize: responsiveFontSizes.base, lineHeight: responsiveLineHeights.base }]}>
            {t('export_import.how_to_use')}
          </Text>
          <View style={[styles.helpCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.helpItem}>
              <View style={[styles.helpNumber, { backgroundColor: colors.primary }]}>
                <Text style={styles.helpNumberText}>1</Text>
              </View>
              <Text style={[styles.helpText, { color: colors.text, fontSize: responsiveFontSizes.sm, lineHeight: responsiveLineHeights.sm }]}>
                {t('export_import.step1')}
              </Text>
            </View>
            <View style={styles.helpItem}>
              <View style={[styles.helpNumber, { backgroundColor: colors.primary }]}>
                <Text style={styles.helpNumberText}>2</Text>
              </View>
              <Text style={[styles.helpText, { color: colors.text, fontSize: responsiveFontSizes.sm, lineHeight: responsiveLineHeights.sm }]}>
                {t('export_import.step2')}
              </Text>
            </View>
            <View style={styles.helpItem}>
              <View style={[styles.helpNumber, { backgroundColor: colors.primary }]}>
                <Text style={styles.helpNumberText}>3</Text>
              </View>
              <Text style={[styles.helpText, { color: colors.text, fontSize: responsiveFontSizes.sm, lineHeight: responsiveLineHeights.sm }]}>
                {t('export_import.step3')}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* ローディングオーバーレイ */}
      {isProcessing && (
        <View style={styles.loadingOverlay}>
          <View style={[styles.loadingContainer, { backgroundColor: colors.surface }]}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.text }]}>
              {t('common.processing')}
            </Text>
          </View>
        </View>
      )}

      {/* パスワード入力モーダル */}
      <Modal
        visible={showPasswordModal}
        transparent
        animationType="fade"
        onRequestClose={closePasswordModal}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
              <View style={styles.modalHeader}>
                <Ionicons
                  name={modalMode === 'export' ? 'cloud-upload' : 'cloud-download'}
                  size={48}
                  color={colors.primary}
                />
                <Text style={[styles.modalTitle, { color: colors.text, fontSize: responsiveFontSizes.lg }]}>
                  {modalMode === 'export' ? t('export_import.export_title') : t('export_import.import_title')}
                </Text>
              </View>

              <View style={styles.passwordInputContainer}>
                <Text style={[styles.passwordLabel, { color: colors.text, fontSize: responsiveFontSizes.base }]}>
                  {t('export_import.enter_password')}
                </Text>
                <Text style={[styles.passwordHint, { color: colors.textSecondary, fontSize: responsiveFontSizes.sm }]}>
                  {modalMode === 'export'
                    ? t('export_import.export_password_hint')
                    : t('export_import.import_password_hint')}
                </Text>
                <TextInput
                  style={[
                    styles.passwordInput,
                    {
                      backgroundColor: colors.background,
                      borderColor: colors.border,
                      color: colors.text,
                      fontSize: responsiveFontSizes.base,
                    },
                  ]}
                  value={password}
                  onChangeText={setPassword}
                  placeholder={t('export_import.password_placeholder')}
                  placeholderTextColor={colors.textSecondary}
                  autoFocus
                  returnKeyType="done"
                  secureTextEntry
                />
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: colors.border }]}
                  onPress={closePasswordModal}
                >
                  <Text style={[styles.modalButtonText, { color: colors.text, fontSize: responsiveFontSizes.base }]}>
                    {t('common.cancel')}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: colors.primary }]}
                  onPress={handlePasswordSubmit}
                >
                  <Text style={[styles.modalButtonText, { fontSize: responsiveFontSizes.base }]}>
                    {t('common.ok')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* インポートモード選択モーダル */}
      <Modal
        visible={showImportModeModal}
        transparent
        animationType="fade"
        onRequestClose={closeImportModeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Ionicons name="options-outline" size={48} color={colors.primary} />
              <Text style={[styles.modalTitle, { color: colors.text, fontSize: responsiveFontSizes.lg }]}>
                {t('backup.import_mode_title')}
              </Text>
            </View>

            <View style={styles.modeSelectionContainer}>
              <TouchableOpacity
                style={[styles.modeButton, { borderColor: colors.border }]}
                onPress={executeFullRestore}
              >
                <View style={[styles.iconContainer, { backgroundColor: colors.error + '15' }]}>
                  <Ionicons name="refresh-circle" size={32} color={colors.error} />
                </View>
                <View style={styles.modeTextContainer}>
                  <Text style={[styles.modeTitle, { color: colors.text }]}>{t('backup.mode_restore')}</Text>
                  <Text style={[styles.modeDescription, { color: colors.textSecondary }]}>
                    {t('backup.mode_restore_desc')}
                  </Text>
                  <Text style={[styles.modeDescription, { color: colors.textSecondary }]}>
                    {t('export_import.restore_includes_formats')}
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modeButton, { borderColor: colors.border }]}
                onPress={preparePartialImport}
              >
                <View style={[styles.iconContainer, { backgroundColor: colors.primary + '15' }]}>
                  <Ionicons name="add-circle" size={32} color={colors.primary} />
                </View>
                <View style={styles.modeTextContainer}>
                  <Text style={[styles.modeTitle, { color: colors.text }]}>{t('backup.mode_merge')}</Text>
                  <Text style={[styles.modeDescription, { color: colors.textSecondary }]}>
                    {t('backup.mode_merge_desc')}
                  </Text>
                  <Text style={[styles.modeDescription, { color: colors.textSecondary }]}>
                    {t('export_import.partial_excludes_formats')}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.border }]}
                onPress={closeImportModeModal}
              >
                <Text style={[styles.modalButtonText, { color: colors.text }]}>
                  {t('common.cancel')}
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
    flex: 1,
  },
  infoSection: {
    padding: UI_CONSTANTS.GAP.LG,
    gap: UI_CONSTANTS.GAP.BASE,
  },
  versionCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: UI_CONSTANTS.GAP.LG,
    borderRadius: UI_CONSTANTS.BORDER_RADIUS.LG,
    borderWidth: UI_CONSTANTS.BORDER_WIDTH.THIN,
  },
  versionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: UI_CONSTANTS.GAP.MD,
  },
  versionLabel: {
    fontWeight: UI_CONSTANTS.FONT_WEIGHT.MEDIUM,
  },
  noticeCard: {
    flexDirection: 'row',
    padding: UI_CONSTANTS.GAP.BASE,
    borderRadius: UI_CONSTANTS.BORDER_RADIUS.BASE,
    borderWidth: UI_CONSTANTS.BORDER_WIDTH.THIN,
    gap: UI_CONSTANTS.GAP.MD,
  },
  noticeIcon: {
    marginTop: 2,
  },
  noticeText: {
    flex: 1,
  },
  menuSection: {
    paddingHorizontal: UI_CONSTANTS.GAP.LG,
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
    marginLeft: 72,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: UI_CONSTANTS.GAP.BASE,
    flex: 1,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: UI_CONSTANTS.BORDER_RADIUS.BASE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuTextContainer: {
    flex: 1,
    gap: UI_CONSTANTS.GAP.XXS,
  },
  menuLabel: {
    fontWeight: UI_CONSTANTS.FONT_WEIGHT.MEDIUM,
  },
  menuDescription: {},
  helpSection: {
    padding: UI_CONSTANTS.GAP.LG,
    gap: UI_CONSTANTS.GAP.BASE,
  },
  helpTitle: {
    fontWeight: UI_CONSTANTS.FONT_WEIGHT.SEMIBOLD,
    marginLeft: UI_CONSTANTS.GAP.XS,
  },
  helpCard: {
    borderRadius: UI_CONSTANTS.BORDER_RADIUS.LG,
    borderWidth: UI_CONSTANTS.BORDER_WIDTH.THIN,
    padding: UI_CONSTANTS.GAP.LG,
    gap: UI_CONSTANTS.GAP.LG,
  },
  helpItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: UI_CONSTANTS.GAP.BASE,
  },
  helpNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  helpNumberText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  helpText: {
    flex: 1,
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
  passwordInputContainer: {
    gap: 12,
    marginBottom: 24,
  },
  passwordLabel: {
    fontWeight: '600',
  },
  passwordHint: {
    lineHeight: 20,
  },
  passwordInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  loadingOverlay: {
    /* RN 0.86でStyleSheet.absoluteFillObjectが削除されたため明示指定 */
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingContainer: {
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontWeight: '600',
  },
  modeSelectionContainer: {
    gap: 16,
    marginBottom: 24,
  },
  modeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 16,
  },
  modeTextContainer: {
    flex: 1,
    gap: 4,
  },
  modeTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  modeDescription: {
    fontSize: 12,
  },
});
