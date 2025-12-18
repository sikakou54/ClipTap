/**
 * ProfileSwitcher - フラットな環境切り替えコンポーネント
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../lib/themeSystem';
import { useProfiles } from '../../lib/hooks/useProfiles';
import { Profile } from '../../lib/types/profile';
import { showError } from '../../lib/utils/alerts';
import { UI_CONSTANTS } from '../../lib/constants/ui';

export function ProfileSwitcher() {
  const { t } = useTranslation();
  const { colors, responsiveFontSizes } = useTheme();
  const { profiles, activeProfile, setActiveProfile } = useProfiles();

  // プロファイルが1つ以下の場合は表示しない
  if (profiles.length <= 1) {
    return null;
  }

  const handleNext = async () => {
    const currentIndex = profiles.findIndex(p => p.isActive);
    const nextIndex = (currentIndex + 1) % profiles.length;
    const nextProfile = profiles[nextIndex];

    try {
      await setActiveProfile(nextProfile.id);
    } catch (error) {
      showError();
    }
  };

  const handlePrevious = async () => {
    const currentIndex = profiles.findIndex(p => p.isActive);
    const previousIndex = currentIndex === 0 ? profiles.length - 1 : currentIndex - 1;
    const previousProfile = profiles[previousIndex];

    try {
      await setActiveProfile(previousProfile.id);
    } catch (error) {
      showError();
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <TouchableOpacity
        onPress={handlePrevious}
        style={styles.arrowButton}
        hitSlop={UI_CONSTANTS.HIT_SLOP.DEFAULT}
      >
        <Ionicons name="chevron-back" size={20} color={colors.text} />
      </TouchableOpacity>

      <View style={styles.profileInfo}>
        <Ionicons name="person" size={16} color={colors.primary} style={styles.icon} />
        <Text style={[styles.profileName, { color: colors.text, fontSize: responsiveFontSizes.sm }]} numberOfLines={UI_CONSTANTS.NUMBER_OF_LINES.SINGLE}>
          {activeProfile?.name || t('profile.environment')}
        </Text>
      </View>

      <TouchableOpacity
        onPress={handleNext}
        style={styles.arrowButton}
        hitSlop={UI_CONSTANTS.HIT_SLOP.DEFAULT}
      >
        <Ionicons name="chevron-forward" size={20} color={colors.text} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
  },
  arrowButton: {
    padding: 4,
  },
  profileInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  icon: {
    marginRight: 2,
  },
  profileName: {
    fontWeight: '500',
  },
});
