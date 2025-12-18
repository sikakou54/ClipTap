/**
 * プロファイル編集モーダル
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../lib/themeSystem';
import { useProfiles } from '../../lib/hooks/useProfiles';
import { useSubscription } from '../../lib/hooks/useSubscription';
import { Header } from '../../components/common/Header';
import { commonStyles } from '../../lib/styles/commonStyles';
import { UI_CONSTANTS } from '../../lib/constants/ui';
import { FREE_PROFILES_LIMIT } from '../../lib/services/PurchaseService';
import { showAlert, showConfirm } from '../../lib/utils/alerts';

export default function ProfileEditModal() {
  const { t } = useTranslation();
  const { colors, responsiveFontSizes, responsiveLineHeights } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams();

  const { profiles, createProfile, updateProfile } = useProfiles();
  const { canAddProfile } = useSubscription();
  const [profileName, setProfileName] = useState('');
  const [saving, setSaving] = useState(false);

  // 編集モードの判定
  const profileId = params.id as string | undefined;
  const isEdit = !!profileId;
  const profile = profiles.find(p => p.id === profileId);

  useEffect(() => {
    if (profile && profileId) {
      setProfileName(profile.name);
    } else {
      setProfileName('');
    }
  }, [profile, profileId]);

  const handleSave = async () => {
    if (!profileName.trim()) {
      showAlert('', t('error.empty_content'), undefined, 'error');
      return;
    }

    // 新規作成時のみ制限チェック
    if (!isEdit && !canAddProfile(profiles.length)) {
      showConfirm(
        t('profile.limit_message', { limit: FREE_PROFILES_LIMIT }),
        () => router.push('/subscription/paywall'),
        undefined,
        'warning'
      );
      return;
    }

    setSaving(true);
    try {
      if (isEdit && profileId) {
        await updateProfile(profileId, {
          name: profileName.trim(),
        });
      } else {
        await createProfile({
          name: profileName.trim(),
        });
      }
      router.back();
    } catch (error: any) {
      showAlert('', error.message, undefined, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={[commonStyles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      <Header
        title={isEdit ? t('profile.edit') : t('profile.create')}
        isModal={true}
        rightAction={
          <TouchableOpacity
            onPress={handleSave}
            disabled={saving || !profileName.trim()}
            style={styles.saveButton}
          >
            <Text
              style={[
                styles.saveText,
                {
                  color: (saving || !profileName.trim()) ? colors.textSecondary : colors.primary,
                  fontSize: responsiveFontSizes.base,
                }
              ]}
            >
              {t('common.save')}
            </Text>
          </TouchableOpacity>
        }
      />

      <ScrollView style={styles.content}>
        {/* プロファイル名 */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.textSecondary, fontSize: responsiveFontSizes.sm }]}>
            {t('profile.name')}
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.surface,
                color: colors.text,
                borderColor: colors.border,
                fontSize: responsiveFontSizes.base,
              }
            ]}
            value={profileName}
            onChangeText={setProfileName}
            placeholder={t('profile.name_placeholder')}
            placeholderTextColor={colors.textSecondary}
            autoFocus={!isEdit}
            maxLength={UI_CONSTANTS.INPUT_LIMITS.PROFILE_NAME_MAX}
          />
          <Text style={[styles.charCount, { color: colors.textSecondary, fontSize: responsiveFontSizes.xs }]}>
            {profileName.length}/{UI_CONSTANTS.INPUT_LIMITS.PROFILE_NAME_MAX}
          </Text>
        </View>
      </ScrollView>
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
    fontWeight: UI_CONSTANTS.FONT_WEIGHT.SEMIBOLD,
    marginBottom: UI_CONSTANTS.GAP.MD,
    textTransform: 'uppercase',
  },
  input: {
    borderWidth: UI_CONSTANTS.BORDER_WIDTH.THIN,
    borderRadius: UI_CONSTANTS.BORDER_RADIUS.MD,
    padding: UI_CONSTANTS.GAP.BASE,
  },
  charCount: {
    marginTop: UI_CONSTANTS.GAP.XS,
    textAlign: 'right',
  },
  saveButton: {
    padding: UI_CONSTANTS.GAP.MD,
  },
  saveText: {
    fontWeight: UI_CONSTANTS.FONT_WEIGHT.SEMIBOLD,
  },
});
