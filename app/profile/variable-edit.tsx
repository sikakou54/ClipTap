/**
 * プロファイル変数編集モーダル
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../lib/themeSystem';
import { useProfiles } from '../../lib/hooks/useProfiles';
import { useVariables } from '../../lib/hooks/useVariables';
import { Header } from '../../components/common/Header';
import { commonStyles } from '../../lib/styles/commonStyles';
import { UI_CONSTANTS } from '../../lib/constants/ui';
import { showAlert } from '../../lib/utils/alerts';

export default function ProfileVariableEditModal() {
  const { t } = useTranslation();
  const { colors, responsiveFontSizes, responsiveLineHeights } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams();

  const { getProfileWithVariables } = useProfiles();
  const { getAllCustomVariables, upsertVariableMetadata, upsertVariableValuesForProfiles } = useVariables();
  const [variableName, setVariableName] = useState('');
  const [variableValue, setVariableValue] = useState('');
  const [variableId, setVariableId] = useState<string | undefined>(undefined);
  const [saving, setSaving] = useState(false);

  // パラメータ
  const profileId = params.profileId as string;
  const profileVariableId = params.variableId as string | undefined;
  const isEdit = !!profileVariableId;

  useEffect(() => {
    if (profileVariableId && profileId) {
      const profileWithVars = getProfileWithVariables(profileId);
      const profileVariable = profileWithVars?.variables.find(v => v.id === profileVariableId);

      if (profileVariable) {
        // variableIdから変数名を取得
        const customVariables = getAllCustomVariables();
        const variable = customVariables.find(v => v.id === profileVariable.variableId);
        if (variable) {
          setVariableName(variable.name);
          setVariableId(variable.id);
        }
        setVariableValue(profileVariable.value);
      }
    }
  }, [profileVariableId, profileId, getProfileWithVariables, getAllCustomVariables]);

  const handleSave = async () => {
    if (!variableName.trim()) {
      showAlert(t('error.generic'), t('variables.name_required'), undefined, 'error');
      return;
    }

    if (!variableValue.trim()) {
      showAlert(t('error.generic'), t('variables.value_required'), undefined, 'error');
      return;
    }

    // 変数名のバリデーション（英数字とアンダースコアのみ）
    const namePattern = /^[a-zA-Z0-9_]+$/;
    if (!namePattern.test(variableName)) {
      showAlert(t('error.generic'), t('variables.name_format_error'), undefined, 'error');
      return;
    }

    setSaving(true);
    try {
      // 1. 変数メタデータを作成または取得
      let savedVariable;
      if (variableId) {
        // 既存の変数を取得
        const customVariables = getAllCustomVariables();
        savedVariable = customVariables.find(v => v.id === variableId);
        if (!savedVariable) {
          throw new Error('Variable not found');
        }
      } else {
        // 新規作成
        savedVariable = await upsertVariableMetadata(
          undefined,
          variableName.trim()
        );
      }

      // 2. このプロファイルの変数値を作成/更新
      await upsertVariableValuesForProfiles(savedVariable.id, {
        [profileId]: variableValue.trim()
      });

      router.back();
    } catch (error: any) {
      showAlert(t('error.generic'), error.message, undefined, 'error');
    } finally {
      setSaving(false);
    }
  };

  const canSave = variableName.trim() && variableValue.trim();

  return (
    <SafeAreaView style={[commonStyles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
      <Header
        title={isEdit ? t('profile.edit_variable') : t('profile.add_variable')}
        isModal={true}
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
      />

      <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
        {/* 変数名 */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.textSecondary, fontSize: responsiveFontSizes.sm }]}>
            {t('profile.variable_name')}
          </Text>
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
          <Text style={[styles.hint, { color: colors.textSecondary, fontSize: responsiveFontSizes.xs }]}>
            {t('variables.name_format_hint')}
          </Text>
        </View>

        {/* 値 */}
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

        {/* プレビュー */}
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
      </KeyboardAvoidingView>
    </SafeAreaView>
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
