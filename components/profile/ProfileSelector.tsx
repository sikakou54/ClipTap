/**
 * ProfileSelector - プロファイル切り替えコンポーネント
 */

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../lib/themeSystem';
import { useProfiles } from '../../lib/hooks/useProfiles';
import { useTranslation } from 'react-i18next';
import { Profile } from '../../lib/types/profile';
import { showError } from '../../lib/utils/alerts';
import { UI_CONSTANTS } from '../../lib/constants/ui';

export function ProfileSelector() {
  const { t } = useTranslation();
  const { colors, responsiveFontSizes, responsiveLineHeights } = useTheme();
  const { profiles, activeProfile, setActiveProfile } = useProfiles();
  const [showModal, setShowModal] = useState(false);

  // プロファイルが1つもない場合は表示しない
  if (profiles.length === 0) {
    return null;
  }

  const handleSelectProfile = async (profile: Profile) => {
    if (activeProfile?.id === profile.id) {
      setShowModal(false);
      return;
    }

    try {
      await setActiveProfile(profile.id);
      setShowModal(false);
    } catch (error) {
      showError();
    }
  };

  return (
    <>
      <TouchableOpacity
        style={styles.container}
        onPress={() => setShowModal(true)}
        activeOpacity={0.7}
      >
        <Ionicons name="options-outline" size={18} color={colors.primary} />
        <Text style={[styles.text, { color: colors.text, fontSize: responsiveFontSizes.base }]} numberOfLines={UI_CONSTANTS.NUMBER_OF_LINES.SINGLE}>
          {activeProfile?.name || t('profile.no_profiles')}
        </Text>
        <Ionicons name="chevron-down" size={18} color={colors.textSecondary} />
      </TouchableOpacity>

      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
        statusBarTranslucent={true}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.backdrop}
            activeOpacity={1}
            onPress={() => setShowModal(false)}
          />
          <View style={[styles.bottomSheet, { backgroundColor: colors.surface }]}>
            <View style={styles.sheetHeader}>
              <Text style={[styles.sheetTitle, { color: colors.text, fontSize: responsiveFontSizes.lg }]}>
                {t('profile.switch_environment')}
              </Text>
              <TouchableOpacity
                onPress={() => setShowModal(false)}
                style={styles.closeButton}
                hitSlop={UI_CONSTANTS.HIT_SLOP.DEFAULT}
              >
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={profiles}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.profileList}
              style={styles.profileListContainer}
              renderItem={({ item }) => {
                const isActive = activeProfile?.id === item.id;
                return (
                  <TouchableOpacity
                    style={[
                      styles.profileItem,
                      isActive && { backgroundColor: colors.primary + '10' },
                    ]}
                    onPress={() => handleSelectProfile(item)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.profileItemLeft}>
                      <Ionicons
                        name={isActive ? 'radio-button-on' : 'radio-button-off'}
                        size={20}
                        color={isActive ? colors.primary : colors.textSecondary}
                      />
                      <View style={styles.profileItemInfo}>
                        <Text style={[styles.profileItemName, { color: colors.text, fontSize: responsiveFontSizes.base }]}>
                          {item.name}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 1,
  },
  text: {
    fontWeight: '500',
    flexShrink: 1,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  bottomSheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    paddingBottom: 34, // Safe area用
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    position: 'relative',
  },
  sheetTitle: {
    fontWeight: '600',
    textAlign: 'center',
  },
  closeButton: {
    position: 'absolute',
    right: 20,
    top: 16,
  },
  profileListContainer: {
    minHeight: 400,
  },
  profileList: {
    paddingVertical: 8,
  },
  profileItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    minHeight: 60,
  },
  profileItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  profileItemInfo: {
    flex: 1,
    gap: 2,
  },
  profileItemName: {
    fontWeight: '500',
  },
});
