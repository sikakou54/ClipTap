/**
 * @module ShortcutValueEditModal
 * @description ショートカット値編集モーダル
 *
 * ショートカットが持つ値1件（値名と値）を追加・編集するモーダル画面。
 *
 * @features
 * - 値名の入力（必須）
 * - 挿入する値の複数行入力
 * - 入力内容は親画面（shortcut/edit）へ返し、DBへは親画面の保存時にまとめて反映
 *
 * @see src/hooks/screens/useShortcutValueEditScreen.ts - ビジネスロジック
 * @see app/shortcut/edit.tsx - 呼び出し元
 */

import { View, Text, TextInput, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from '@cliptap/shared';
import { useTheme } from '@lib/themeSystem';
import { useShortcutValueEditScreen } from '@hooks/screens/useShortcutValueEditScreen';
import { ScreenContainer } from '@components/common/ScreenContainer';
import { UI_CONSTANTS } from '@constants/ui';

/** キーボード回避のためにヘッダー分だけ持ち上げる高さ（iOSのみ） */
const KEYBOARD_VERTICAL_OFFSET = 90;

export default function ShortcutValueEditModal() {
  const { t } = useTranslation();
  const { colors, responsiveFontSizes, responsiveLineHeights } = useTheme();
  const params = useLocalSearchParams();

  const valueKey = (params.valueKey as string) || '';
  const initialName = (params.valueName as string) || '';
  const initialValue = (params.value as string) || '';

  const { valueName, setValueName, value, setValue, isEdit, canSave, handleSave } =
    useShortcutValueEditScreen({ valueKey, initialName, initialValue });

  /* ショートカット値編集モーダル */
  return (
    <ScreenContainer
      title={isEdit ? t('shortcut.value_edit') : t('shortcut.value_create')}
      isModal={true}
      keyboardAvoiding
      keyboardVerticalOffset={Platform.OS === 'ios' ? KEYBOARD_VERTICAL_OFFSET : 0}
      rightAction={
        <TouchableOpacity onPress={handleSave} disabled={!canSave} style={styles.saveButton}>
          <Text
            style={[
              styles.saveText,
              {
                color: canSave ? colors.primary : colors.textSecondary,
                fontSize: responsiveFontSizes.base,
                lineHeight: responsiveLineHeights.base,
              },
            ]}
          >
            {t('common.done')}
          </Text>
        </TouchableOpacity>
      }
    >
      <View style={styles.content}>
        {/* 値名入力セクション */}
        <View style={styles.section}>
          {/* ラベルと文字数カウンター */}
          <View style={styles.labelRow}>
            <Text
              style={[
                styles.label,
                { color: colors.textSecondary, fontSize: responsiveFontSizes.sm },
              ]}
            >
              {t('shortcut.value_name')}
            </Text>
            <Text
              style={[
                styles.charCount,
                { color: colors.textSecondary, fontSize: responsiveFontSizes.xs },
              ]}
            >
              {valueName.length}/{UI_CONSTANTS.INPUT_LIMITS.SHORTCUT_VALUE_NAME_MAX}
            </Text>
          </View>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.surface,
                color: colors.text,
                fontSize: responsiveFontSizes.base,
              },
            ]}
            value={valueName}
            onChangeText={setValueName}
            placeholder={t('shortcut.value_name_placeholder')}
            placeholderTextColor={colors.textSecondary}
            autoFocus={!isEdit}
            maxLength={UI_CONSTANTS.INPUT_LIMITS.SHORTCUT_VALUE_NAME_MAX}
          />
        </View>

        {/* 値入力セクション */}
        <View style={styles.valueSection}>
          <Text
            style={[
              styles.label,
              { color: colors.textSecondary, fontSize: responsiveFontSizes.sm },
            ]}
          >
            {t('shortcut.value_value')}
          </Text>
          <TextInput
            style={[
              styles.valueInput,
              {
                backgroundColor: colors.surface,
                color: colors.text,
                fontSize: responsiveFontSizes.base,
                lineHeight: responsiveFontSizes.base * 1.5,
              },
            ]}
            value={value}
            onChangeText={setValue}
            placeholder={t('shortcut.value_value_placeholder')}
            placeholderTextColor={colors.textSecondary}
            multiline
            textAlignVertical="top"
            scrollEnabled={true}
          />
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  saveButton: {
    padding: UI_CONSTANTS.SPACING.XS,
  },
  saveText: {
    fontWeight: UI_CONSTANTS.FONT_WEIGHT.SEMIBOLD,
  },
  content: {
    flex: 1,
    paddingTop: UI_CONSTANTS.SPACING.LG,
    paddingHorizontal: UI_CONSTANTS.SPACING.LG,
    paddingBottom: UI_CONSTANTS.SPACING.LG,
  },
  section: {
    marginBottom: UI_CONSTANTS.SPACING.XXL,
  },
  valueSection: {
    flex: 1,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: UI_CONSTANTS.GAP.MD,
  },
  label: {
    fontWeight: UI_CONSTANTS.FONT_WEIGHT.MEDIUM,
    marginBottom: UI_CONSTANTS.GAP.MD,
  },
  charCount: {
    marginBottom: UI_CONSTANTS.GAP.MD,
  },
  input: {
    borderRadius: UI_CONSTANTS.BORDER_RADIUS.BASE,
    padding: UI_CONSTANTS.SPACING.BASE,
    minHeight: UI_CONSTANTS.BUTTON_HEIGHT.MEDIUM,
  },
  valueInput: {
    flex: 1,
    borderRadius: UI_CONSTANTS.BORDER_RADIUS.BASE,
    padding: UI_CONSTANTS.SPACING.BASE,
    minHeight: UI_CONSTANTS.BUTTON_HEIGHT.LARGE,
  },
});
