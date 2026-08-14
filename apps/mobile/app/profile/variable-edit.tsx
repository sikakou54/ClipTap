/**
 * @module ProfileVariableEditModal
 * @description プロファイル変数編集モーダル
 *
 * 特定のプロファイル（環境）に対する変数値を編集するモーダル画面。
 *
 * @features
 * - 環境固有の変数値の編集
 * - 複数行テキスト入力対応
 * - 値のプレビュー表示
 *
 * @see src/hooks/screens/useProfileVariableEditScreen.ts - ビジネスロジック
 */

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from '@cliptap/shared'
import { useTheme } from '@lib/themeSystem';
import { useProfileVariableEditScreen } from '@hooks/screens/useProfileVariableEditScreen';
import { ScreenContainer } from '@components/common/ScreenContainer';
import { UI_CONSTANTS } from '@constants/ui';

export default function ProfileVariableEditModal() {
  const { t } = useTranslation();
  const { colors, responsiveFontSizes } = useTheme();
  const params = useLocalSearchParams();

  const profileId = params.profileId as string;
  const variableId = params.variableId as string | undefined;

  const {
    variableName,
    setVariableName,
    variableValue,
    setVariableValue,
    saving,
    isEdit,
    canSave,
    handleSave,
  } = useProfileVariableEditScreen({ profileId, variableId });

  /* プロファイル変数編集モーダル */
  return (
    <ScreenContainer
      title={isEdit ? t('profile.edit_variable') : t('profile.add_variable')}
      isModal={true}
      keyboardAvoiding
      rightAction={
        <TouchableOpacity
          onPress={handleSave}
          disabled={saving || !canSave}
          style={styles.saveButton}
        >
          <Text
            style={[
              styles.saveText,
              {
                color: (saving || !canSave) ? colors.textSecondary : colors.primary,
                fontSize: responsiveFontSizes.base,
              }
            ]}
          >
            {t('common.save')}
          </Text>
        </TouchableOpacity>
      }
    >
      {/* スクロール可能なコンテンツエリア */}
      <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
        {/* 変数名入力セクション */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.textSecondary, fontSize: responsiveFontSizes.sm }]}>
            {t('profile.variable_name')}
          </Text>
          {/* 変数名入力（{{ }}で囲む） */}
          <View style={styles.inputWrapper}>
            <Text style={[styles.prefix, { color: colors.textSecondary, fontSize: responsiveFontSizes.base }]}>
              {'{{'}
            </Text>
            <TextInput
              style={[
                styles.input,
                styles.nameInput,
                {
                  backgroundColor: colors.surface,
                  color: colors.text,
                  borderColor: colors.border,
                  fontSize: responsiveFontSizes.base,
                }
              ]}
              value={variableName}
              onChangeText={setVariableName}
              placeholder={t('profile.variable_name_placeholder')}
              placeholderTextColor={colors.textSecondary}
              autoFocus={!isEdit}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Text style={[styles.suffix, { color: colors.textSecondary, fontSize: responsiveFontSizes.base }]}>
              {'}}'}
            </Text>
          </View>
          {/* 変数名フォーマットのヒント */}
          <Text style={[styles.hint, { color: colors.textSecondary, fontSize: responsiveFontSizes.xs }]}>
            {t('variables.name_format_hint')}
          </Text>
        </View>

        {/* 変数値入力セクション */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.textSecondary, fontSize: responsiveFontSizes.sm }]}>
            {t('profile.variable_value')}
          </Text>
          <TextInput
            style={[
              styles.input,
              styles.textArea,
              {
                backgroundColor: colors.surface,
                color: colors.text,
                borderColor: colors.border,
                fontSize: responsiveFontSizes.base,
              }
            ]}
            value={variableValue}
            onChangeText={setVariableValue}
            placeholder={t('profile.variable_value_placeholder')}
            placeholderTextColor={colors.textSecondary}
            multiline
            numberOfLines={UI_CONSTANTS.NUMBER_OF_LINES.DESCRIPTION}
          />
        </View>

        {/* プレビューセクション（変数名と値が入力されている場合のみ表示） */}
        {variableName && variableValue && (
          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.textSecondary, fontSize: responsiveFontSizes.sm }]}>
              {t('common.preview')}
            </Text>
            <View style={[styles.preview, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={{ color: colors.textSecondary, fontSize: responsiveFontSizes.sm }}>
                {`{{${variableName}}}`}
              </Text>
              <Text style={{ color: colors.text, fontSize: responsiveFontSizes.base }}>
                ↓
              </Text>
              <Text style={{ color: colors.text, fontSize: responsiveFontSizes.base }}>
                {variableValue}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
  section: {
    padding: 16,
  },
  label: {
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  prefix: {
    fontFamily: 'monospace',
    fontWeight: '600',
  },
  suffix: {
    fontFamily: 'monospace',
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },
  nameInput: {
    flex: 1,
    fontFamily: 'monospace',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  hint: {
    marginTop: 4,
    fontStyle: 'italic',
  },
  saveButton: {
    padding: 8,
  },
  saveText: {
    fontWeight: '600',
  },
  preview: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 16,
    gap: 8,
    alignItems: 'center',
  },
});
