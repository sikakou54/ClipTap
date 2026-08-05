/**
 * @module ProfileEditModal
 * @description プロファイル（環境）編集モーダル
 *
 * プロファイルの新規作成・編集を行うモーダル画面。
 *
 * @features
 * - プロファイル名の入力（最大50文字）
 * - 新規作成/編集モードの自動判定
 * - 重複プロファイル名のバリデーション
 * - 無料プラン制限チェック
 *
 * @see lib/hooks/screens/useProfileEditScreen.ts - ビジネスロジック
 */

import React from 'react';
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
import { useProfileEditScreen } from '@hooks/screens/useProfileEditScreen';
import { ScreenContainer } from '@components/common/ScreenContainer';
import { UI_CONSTANTS } from '@constants/ui';

export default function ProfileEditModal() {
  const { t } = useTranslation();
  const { colors, responsiveFontSizes } = useTheme();
  const params = useLocalSearchParams();

  const profileId = params.id as string | undefined;

  const {
    profileName,
    setProfileName,
    saving,
    isEdit,
    canSave,
    handleSave,
  } = useProfileEditScreen({ profileId });

  /* プロファイル編集モーダル */
  return (
    <ScreenContainer
      title={isEdit ? t('profile.edit') : t('profile.create')}
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
                color: saving || !canSave ? colors.textSecondary : colors.primary,
                fontSize: responsiveFontSizes.base,
              },
            ]}
          >
            {t('common.save')}
          </Text>
        </TouchableOpacity>
      }
    >
      {/* スクロール可能なコンテンツエリア */}
      <ScrollView style={styles.content}>
        {/* プロファイル名入力セクション */}
        <View style={styles.section}>
          {/* ラベルと文字数カウンター */}
          <View style={styles.labelRow}>
            <Text
              style={[
                styles.label,
                { color: colors.textSecondary, fontSize: responsiveFontSizes.sm },
              ]}
            >
              {t('profile.name')}
            </Text>
            <Text
              style={[
                styles.charCount,
                { color: colors.textSecondary, fontSize: responsiveFontSizes.xs },
              ]}
            >
              {profileName.length}/{UI_CONSTANTS.INPUT_LIMITS.PROFILE_NAME_MAX}
            </Text>
          </View>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.surface,
                color: colors.text,
                borderColor: colors.border,
                fontSize: responsiveFontSizes.base,
              },
            ]}
            value={profileName}
            onChangeText={setProfileName}
            placeholder={t('profile.name_placeholder')}
            placeholderTextColor={colors.textSecondary}
            autoFocus={!isEdit}
            maxLength={UI_CONSTANTS.INPUT_LIMITS.PROFILE_NAME_MAX}
          />
        </View>
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
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: UI_CONSTANTS.GAP.MD,
  },
  label: {
    fontWeight: UI_CONSTANTS.FONT_WEIGHT.SEMIBOLD,
    textTransform: 'uppercase',
  },
  input: {
    borderWidth: UI_CONSTANTS.BORDER_WIDTH.THIN,
    borderRadius: UI_CONSTANTS.BORDER_RADIUS.MD,
    padding: UI_CONSTANTS.GAP.BASE,
  },
  charCount: {},
  saveButton: {
    padding: UI_CONSTANTS.GAP.MD,
  },
  saveText: {
    fontWeight: UI_CONSTANTS.FONT_WEIGHT.SEMIBOLD,
  },
});
