/**
 * @module VariableEditModal
 * @description カスタム変数編集モーダル
 *
 * カスタム変数の新規作成・編集を行うモーダル画面。
 *
 * @features
 * - 変数名の入力（英数字とアンダースコアのみ、予約語不可）
 * - 表示ラベルの入力
 * - アイコンの選択（80種類以上のIonicons）
 * - プロファイルごとの値設定（テーブル形式）
 *
 * @see src/hooks/screens/useVariableEditScreen.ts - ビジネスロジック
 */

import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
} from 'react-native';
import { FlashList } from '@mobile-types/flashlist';
import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from '@cliptap/shared'
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@lib/themeSystem';
import { useVariableEditScreen } from '@hooks/screens/useVariableEditScreen';
import { Profile } from '@cliptap/shared';
import { ScreenContainer } from '@components/common/ScreenContainer';
import { UI_CONSTANTS, VARIABLE_ICONS } from '@constants/ui';

export default function VariableEditModal() {
  const { t } = useTranslation();
  const { colors, isTablet, responsiveFontSizes, responsiveLineHeights } = useTheme();
  const params = useLocalSearchParams();

  const variableId = params.id as string | undefined;

  const {
    name,
    setName,
    label,
    setLabel,
    value,
    selectedIcon,
    showIconModal,
    setShowIconModal,
    profileValues,
    isEdit,
    canSave,
    isNameValid,
    nameErrorMessage,
    profiles,
    handleSave,
    handleOpenValueEdit,
    handleSelectIcon,
    getDisplayValue,
  } = useVariableEditScreen({ variableId });

  const renderProfileValueItem = ({ item: profile }: { item: Profile }) => {
    const displayValue = getDisplayValue(profile);

    return (
      <View style={[styles.tableRow, { borderBottomColor: colors.border }]}>
        <View style={styles.tableCell}>
          <View style={styles.profileNameContainer}>
            <Text
              style={[styles.tableCellText, { color: colors.text, fontSize: responsiveFontSizes.sm }]}
              numberOfLines={UI_CONSTANTS.NUMBER_OF_LINES.SINGLE}
              ellipsizeMode="tail"
            >
              {profile.name}
            </Text>
            {profile.isDefault && (
              <View style={[styles.standardBadge, { backgroundColor: colors.primary + '20' }]}>
                <Text
                  style={[
                    styles.standardBadgeText,
                    { color: colors.primary, fontSize: responsiveFontSizes.xs },
                  ]}
                >
                  {t('profile.default_badge')}
                </Text>
              </View>
            )}
          </View>
        </View>
        <TouchableOpacity
          style={[styles.tableCell, styles.valueCell]}
          onPress={() => handleOpenValueEdit(profile)}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.valueText,
              {
                color: displayValue ? colors.text : colors.textSecondary,
                fontSize: responsiveFontSizes.sm,
              },
            ]}
            numberOfLines={UI_CONSTANTS.NUMBER_OF_LINES.DOUBLE}
          >
            {displayValue || t('variables.enter_value')}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <ScreenContainer
      title={isEdit ? t('settings.variable_edit') : t('settings.variable_add')}
      isModal={true}
      keyboardAvoiding
      rightAction={
        <TouchableOpacity onPress={handleSave} style={styles.saveButton} disabled={!canSave}>
          <Text
            style={[
              styles.saveText,
              {
                color: canSave ? colors.primary : colors.textSecondary,
                fontSize: responsiveFontSizes.base,
              },
            ]}
          >
            {t('common.save')}
          </Text>
        </TouchableOpacity>
      }
    >
      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingHorizontal: isTablet ? 32 : 12 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.section}>
          {/* ラベルと文字数カウンター */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text
              style={[
                styles.label,
                {
                  color: colors.text,
                  fontSize: responsiveFontSizes.sm,
                  lineHeight: responsiveLineHeights.sm,
                },
              ]}
            >
              {t('settings.variable_name')} *
            </Text>
            <Text style={{ color: !isNameValid ? colors.error : colors.textSecondary, fontSize: responsiveFontSizes.xs }}>
              {name.length}/{UI_CONSTANTS.INPUT_LIMITS.VARIABLE_NAME_MAX}
            </Text>
          </View>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.surface,
                color: colors.text,
                borderWidth: !isNameValid ? 2 : 0,
                borderColor: colors.error,
                fontSize: responsiveFontSizes.base,
                padding: isTablet ? 16 : 12,
              },
            ]}
            value={name}
            onChangeText={setName}
            placeholder={t('settings.variable_name_placeholder')}
            placeholderTextColor={colors.textSecondary}
            autoCapitalize="none"
            editable={true}
            maxLength={UI_CONSTANTS.INPUT_LIMITS.VARIABLE_NAME_MAX}
          />
          {/* ヒント/エラーメッセージ */}
          <Text
            style={{
              color: !isNameValid ? colors.error : colors.textSecondary,
              fontSize: responsiveFontSizes.xs,
              marginTop: UI_CONSTANTS.GAP.XS,
            }}
          >
            {nameErrorMessage || t('settings.variable_usage_hint', { name: name || t('settings.variable_name') })}
          </Text>
        </View>

        <View style={styles.section}>
          <Text
            style={[
              styles.label,
              {
                color: colors.text,
                fontSize: responsiveFontSizes.sm,
                lineHeight: responsiveLineHeights.sm,
              },
            ]}
          >
            {t('settings.variable_label')}
            <Text style={{ color: colors.textSecondary, fontSize: responsiveFontSizes.xs }}>
              {' '}({label.length}/{UI_CONSTANTS.INPUT_LIMITS.VARIABLE_LABEL_MAX})
            </Text>
          </Text>
          <View style={styles.labelWithIconRow}>
            <TouchableOpacity
              style={[
                styles.iconSelectButton,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  padding: isTablet ? 16 : 12,
                },
              ]}
              onPress={() => setShowIconModal(true)}
            >
              <Ionicons name={selectedIcon} size={isTablet ? 20 : 18} color={colors.primary} />
            </TouchableOpacity>
            <TextInput
              style={[
                styles.input,
                styles.labelInput,
                {
                  backgroundColor: colors.surface,
                  color: colors.text,
                  fontSize: responsiveFontSizes.base,
                  padding: isTablet ? 16 : 12,
                },
              ]}
              value={label}
              onChangeText={setLabel}
              placeholder={t('settings.variable_label_placeholder')}
              placeholderTextColor={colors.textSecondary}
              maxLength={UI_CONSTANTS.INPUT_LIMITS.VARIABLE_LABEL_MAX}
            />
          </View>
          <Text
            style={[
              styles.hint,
              {
                color: colors.textSecondary,
                fontSize: responsiveFontSizes.xs,
                lineHeight: responsiveLineHeights.xs,
              },
            ]}
          >
            {t('settings.variable_label_hint')}
          </Text>
        </View>

        <View style={styles.section}>
          <Text
            style={[
              styles.label,
              {
                color: colors.text,
                fontSize: responsiveFontSizes.sm,
                lineHeight: responsiveLineHeights.sm,
              },
            ]}
          >
            {t('settings.variable_value')} *
          </Text>

          <View style={[styles.tableContainer, { borderColor: colors.border }]}>
            <View
              style={[
                styles.tableHeader,
                { backgroundColor: colors.surface, borderBottomColor: colors.border },
              ]}
            >
              <View style={styles.tableCell}>
                <Text
                  style={[
                    styles.tableHeaderText,
                    { color: colors.text, fontSize: responsiveFontSizes.sm },
                  ]}
                >
                  {t('variables.environment_header')}
                </Text>
              </View>
              <View style={[styles.tableCell, styles.valueCell]}>
                <Text
                  style={[
                    styles.tableHeaderText,
                    { color: colors.text, fontSize: responsiveFontSizes.sm },
                  ]}
                >
                  {t('variables.value_header')}
                </Text>
              </View>
            </View>

            <FlashList
              data={profiles}
              renderItem={renderProfileValueItem}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              estimatedItemSize={60}
              /* FlashList は data（profiles）の同一性しか監視しないため、profiles が変わらないまま value / profileValues だけ更新されたケースを extraData で再描画対象として明示している */
              extraData={[value, profileValues]}
            />
          </View>

          <View style={{ marginTop: 8 }}>
            <Text
              style={[
                styles.hint,
                {
                  color: colors.textSecondary,
                  fontSize: responsiveFontSizes.xs,
                  lineHeight: responsiveLineHeights.xs,
                },
              ]}
            >
              {t('variables.environment_values_hint_1')}
            </Text>
            <Text
              style={[
                styles.hint,
                {
                  color: colors.textSecondary,
                  fontSize: responsiveFontSizes.xs,
                  lineHeight: responsiveLineHeights.xs,
                },
              ]}
            >
              {t('variables.environment_values_hint_2')}
            </Text>
          </View>
        </View>
      </ScrollView>

      <Modal
        visible={showIconModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowIconModal(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.background, shadowColor: colors.shadow }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text
                style={[
                  styles.modalTitle,
                  { color: colors.text, fontSize: responsiveFontSizes.lg },
                ]}
              >
                {t('settings.variable_icon')}
              </Text>
              <TouchableOpacity
                onPress={() => setShowIconModal(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={28} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScrollView}>
              <View style={styles.iconGrid}>
                {VARIABLE_ICONS.map((icon) => (
                  <TouchableOpacity
                    key={icon}
                    style={[
                      styles.iconButton,
                      {
                        backgroundColor: selectedIcon === icon ? colors.primary : colors.surface,
                        borderColor: colors.border,
                        width: isTablet ? 64 : 56,
                        height: isTablet ? 64 : 56,
                      },
                    ]}
                    onPress={() => handleSelectIcon(icon)}
                  >
                    <Ionicons
                      name={icon}
                      size={isTablet ? 28 : 24}
                      color={selectedIcon === icon ? colors.onPrimary : colors.text}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  saveButton: {
    padding: UI_CONSTANTS.GAP.XS,
  },
  saveText: {
    fontWeight: UI_CONSTANTS.FONT_WEIGHT.SEMIBOLD,
  },
  content: {
    flex: 1,
    paddingVertical: 16,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontWeight: UI_CONSTANTS.FONT_WEIGHT.SEMIBOLD,
    marginBottom: UI_CONSTANTS.GAP.MD,
  },
  labelWithIconRow: {
    flexDirection: 'row',
    gap: UI_CONSTANTS.GAP.BASE,
    alignItems: 'center',
  },
  iconSelectButton: {
    borderRadius: UI_CONSTANTS.BORDER_RADIUS.BASE,
    borderWidth: UI_CONSTANTS.BORDER_WIDTH.THIN,
    justifyContent: 'center',
    alignItems: 'center',
    aspectRatio: 1,
  },
  labelInput: {
    flex: 1,
  },
  input: {
    borderRadius: UI_CONSTANTS.BORDER_RADIUS.BASE,
  },
  hint: {
    marginTop: UI_CONSTANTS.GAP.XS,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: UI_CONSTANTS.GAP.BASE,
    padding: 16,
  },
  iconButton: {
    borderRadius: UI_CONSTANTS.BORDER_RADIUS.LG,
    borderWidth: UI_CONSTANTS.BORDER_WIDTH.THIN,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tableContainer: {
    borderRadius: UI_CONSTANTS.BORDER_RADIUS.BASE,
    borderWidth: UI_CONSTANTS.BORDER_WIDTH.THIN,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: UI_CONSTANTS.BORDER_WIDTH.THICK,
  },
  tableHeaderText: {
    fontWeight: UI_CONSTANTS.FONT_WEIGHT.SEMIBOLD,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: UI_CONSTANTS.BORDER_WIDTH.THIN,
    minHeight: 60,
  },
  tableCell: {
    flex: 1,
    justifyContent: 'center',
    paddingRight: UI_CONSTANTS.GAP.MD,
  },
  valueCell: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingLeft: UI_CONSTANTS.GAP.MD,
    paddingRight: 0,
  },
  tableCellText: {
    fontWeight: UI_CONSTANTS.FONT_WEIGHT.MEDIUM,
    flexShrink: 1,
  },
  profileNameContainer: {
    flexDirection: 'column',
    gap: UI_CONSTANTS.GAP.XS,
    width: '100%',
  },
  standardBadge: {
    paddingHorizontal: UI_CONSTANTS.GAP.SM,
    paddingVertical: UI_CONSTANTS.GAP.XXS,
    borderRadius: UI_CONSTANTS.BORDER_RADIUS.SM,
    alignSelf: 'flex-start',
  },
  standardBadgeText: {
    fontWeight: UI_CONSTANTS.FONT_WEIGHT.SEMIBOLD,
  },
  valueText: {
    flex: 1,
    textAlign: 'left',
  },
  /** モーダルオーバーレイ（背景色は使用箇所でテーマの overlay を重ねる） */
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  /** モーダル本体（背景色と影の色は使用箇所でテーマから重ねる） */
  modalContent: {
    borderTopLeftRadius: UI_CONSTANTS.BORDER_RADIUS.XXL,
    borderTopRightRadius: UI_CONSTANTS.BORDER_RADIUS.XXL,
    minHeight: '60%',
    maxHeight: '80%',
    paddingBottom: 20,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: UI_CONSTANTS.BORDER_RADIUS.BASE,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: UI_CONSTANTS.BORDER_WIDTH.THIN,
  },
  modalTitle: {
    fontWeight: UI_CONSTANTS.FONT_WEIGHT.SEMIBOLD,
  },
  modalCloseButton: {
    padding: UI_CONSTANTS.GAP.XS,
  },
  modalScrollView: {
    flex: 1,
  },
});
