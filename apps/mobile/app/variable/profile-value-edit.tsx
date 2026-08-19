/**
 * @module ProfileValueEditModal
 * @description プロファイル別変数値編集モーダル
 *
 * カスタム変数の値をプロファイル（環境）ごとに編集するためのモーダル画面。
 *
 * @features
 * - 複数行テキスト入力
 * - 標準値の編集（デフォルトプロファイル用）
 * - プロファイル固有値の編集
 *
 * @see src/hooks/screens/useProfileValueEditScreen.ts - ビジネスロジック
 */

import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Text,
  Platform,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from '@cliptap/shared'
import { useTheme } from '@lib/themeSystem';
import { useProfileValueEditScreen } from '@hooks/screens/useProfileValueEditScreen';
import { ScreenContainer } from '@components/common/ScreenContainer';

export default function ProfileValueEditModal() {
  const { t } = useTranslation();
  const { colors, responsiveFontSizes, responsiveLineHeights } = useTheme();
  const params = useLocalSearchParams();

  const profileId = params.profileId as string;
  const variableName = params.variableName as string;
  const profileName = params.profileName as string;
  const isStandard = params.isStandard === 'true';
  const currentValue = (params.currentValue as string) || '';

  const {
    value,
    setValue,
    textInputRef,
    handleSave,
  } = useProfileValueEditScreen({
    profileId,
    variableName,
    profileName,
    isStandard,
    currentValue,
  });

  return (
    <ScreenContainer
      title={isStandard ? t('variables.standard_value') : profileName || t('variables.value')}
      isModal={true}
      keyboardAvoiding
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
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
    >
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
    </ScreenContainer>
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
