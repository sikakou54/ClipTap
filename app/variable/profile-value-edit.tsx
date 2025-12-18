/**
 * プロファイル別変数値編集モーダル（標準値編集も対応）
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Text,
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
import { Logger } from '../../lib/logger';

export default function ProfileValueEditModal() {
  const { t } = useTranslation();
  const { colors, responsiveFontSizes, responsiveLineHeights } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams();

  const { defaultProfile } = useProfiles();
  const { getAllCustomVariables, upsertVariableValuesForProfiles } = useVariables();
  const [value, setValue] = useState('');
  const textInputRef = useRef<TextInput>(null);

  // パラメータ
  const profileId = params.profileId as string;
  const variableName = params.variableName as string;
  const profileName = params.profileName as string;
  const isStandard = params.isStandard === 'true';
  const currentValue = params.currentValue as string || '';

  useEffect(() => {
    // 初期値を設定
    setValue(currentValue);
  }, [currentValue]);

  // 自動フォーカス
  useEffect(() => {
    setTimeout(() => {
      textInputRef.current?.focus();
    }, 100);
  }, []);

  const handleSave = async () => {
    try {
      const customVariables = getAllCustomVariables();
      const variable = customVariables.find(v => v.name === variableName);

      if (!variable) {
        // 変数がまだ存在しない場合（新規作成中）は編集画面に値を返すだけ
        Logger.info('[ProfileValueEdit] Variable not yet created, returning value to edit screen');
        Logger.info('[ProfileValueEdit] Callback data:', { profileId, isStandard, value });
        global.variableValueCallbackData = {
          profileId: profileId,
          isStandard: isStandard,
          newValue: value
        };
        Logger.info('[ProfileValueEdit] Set global.variableValueCallbackData:', global.variableValueCallbackData);
        router.back();
        return;
      }

      // 標準値・プロファイル固有値どちらもupsertVariableValuesForProfilesで処理
      const targetProfileId = isStandard
        ? (defaultProfile?.id || profileId) // 標準値の場合はデフォルトプロファイル
        : profileId; // プロファイル固有値の場合は指定されたプロファイル

      await upsertVariableValuesForProfiles(variable.id, {
        [targetProfileId]: value
      });

      // 編集画面に値を通知（画面更新用）
      Logger.info('[ProfileValueEdit] Setting callback data for existing variable:', { profileId, isStandard, value });
      global.variableValueCallbackData = {
        profileId: profileId,
        isStandard: isStandard,
        newValue: value
      };

      router.back();
    } catch (error) {
      Logger.error('Failed to save variable value:', error);
      showAlert(t('error.generic'), String(error));
    }
  };

  return (
    <SafeAreaView
      style={[commonStyles.container, { backgroundColor: colors.background }]}
      edges={['top', 'left', 'right']}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <Header
        title={isStandard ? t('variables.standard_value') : profileName || t('variables.value')}
        isModal={true}
        rightAction={
          <TouchableOpacity
            onPress={handleSave}
            style={styles.saveButton}
          >
            <Text
              style={[
                styles.saveText,
                {
                  color: colors.primary,
                  fontSize: responsiveFontSizes.base,
                  lineHeight: responsiveLineHeights.base,
                }
              ]}
            >
              {t('common.done')}
            </Text>
          </TouchableOpacity>
        }
      />

      <View style={styles.contentWrapper}>
        <TextInput
          ref={textInputRef}
          value={value}
          onChangeText={setValue}
          placeholder={t('variables.enter_value_placeholder')}
          placeholderTextColor={colors.textSecondary}
          style={[
            styles.input,
            {
              color: colors.text,
              fontSize: responsiveFontSizes.base,
              lineHeight: responsiveFontSizes.base * 1.5,
            }
          ]}
          multiline
          textAlignVertical="top"
          scrollEnabled={true}
        />
      </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  saveButton: {
    padding: 4,
  },
  saveText: {
    fontWeight: '600',
  },
  contentWrapper: {
    flex: 1,
  },
  input: {
    flex: 1,
    padding: 16,
  },
});
