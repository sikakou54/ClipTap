/**
 * 環境選択画面
 * 定型文に関連付ける環境を複数選択
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../lib/themeSystem';
import { useProfiles } from '../../lib/hooks/useProfiles';
import { Profile } from '../../lib/types/profile';
import { Header } from '../../components/common/Header';
import { commonStyles } from '../../lib/styles/commonStyles';
import { UI_CONSTANTS } from '../../lib/constants/ui';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProfileSelectScreen() {
  const { t } = useTranslation();
  const { colors, isTablet, responsiveFontSizes } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams();
  const { profiles } = useProfiles();

  // パラメータから選択中のIDを取得
  const selectedIds = params.selectedIds
    ? (typeof params.selectedIds === 'string'
      ? params.selectedIds.split(',').filter(id => id !== '')
      : params.selectedIds)
    : [];

  const [tempSelectedIds, setTempSelectedIds] = useState<string[]>(
    Array.isArray(selectedIds) ? selectedIds : []
  );

  const toggleProfile = (profileId: string) => {
    if (tempSelectedIds.includes(profileId)) {
      setTempSelectedIds(tempSelectedIds.filter(id => id !== profileId));
    } else {
      setTempSelectedIds([...tempSelectedIds, profileId]);
    }
  };

  const handleSelectAll = () => {
    setTempSelectedIds([]);
  };

  const handleSave = () => {
    // グローバルコールバックで選択結果を返す
    if (global.profileSelectCallback) {
      global.profileSelectCallback(tempSelectedIds);
      global.profileSelectCallback = undefined;
    }
    router.back();
  };

  return (
    <SafeAreaView style={[commonStyles.container, { backgroundColor: colors.background }]}>
      <Header
        title={t('snippet.select_profiles_title')}
        isModal={!isTablet}
        rightAction={
          <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
            <Text style={[styles.saveText, { color: colors.primary, fontSize: responsiveFontSizes.base }]}>
              {t('common.save')}
            </Text>
          </TouchableOpacity>
        }
      />

      <ScrollView style={styles.content}>
        {/* 説明 */}
        <Text style={[styles.description, { color: colors.textSecondary, fontSize: responsiveFontSizes.sm }]}>
          {t('snippet.select_profiles_description')}
        </Text>

        {/* 全ての環境 */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <TouchableOpacity
            style={[styles.profileOption, { borderBottomColor: colors.border, borderBottomWidth: 1 }]}
            onPress={handleSelectAll}
          >
            <View style={styles.profileOptionLeft}>
              <Ionicons
                name={tempSelectedIds.length === 0 ? 'checkbox' : 'square-outline'}
                size={24}
                color={tempSelectedIds.length === 0 ? colors.primary : colors.textSecondary}
                style={styles.checkbox}
              />
              <Text style={[styles.profileName, { color: colors.text, fontSize: responsiveFontSizes.base }]}>
                {t('snippet.all_profiles')}
              </Text>
            </View>
          </TouchableOpacity>

          {/* 個別の環境（有効な環境のみ） */}
          {profiles.map((profile: Profile, index: number) => {
            const isSelected = tempSelectedIds.includes(profile.id);
            const isLastItem = index === profiles.length - 1;

            return (
              <TouchableOpacity
                key={profile.id}
                style={[
                  styles.profileOption,
                  !isLastItem && { borderBottomColor: colors.border, borderBottomWidth: 1 }
                ]}
                onPress={() => toggleProfile(profile.id)}
              >
                <View style={styles.profileOptionLeft}>
                  <Ionicons
                    name={isSelected ? 'checkbox' : 'square-outline'}
                    size={24}
                    color={isSelected ? colors.primary : colors.textSecondary}
                    style={styles.checkbox}
                  />
                  <View style={styles.profileInfo}>
                    <Text style={[styles.profileName, { color: colors.text, fontSize: responsiveFontSizes.base }]}>
                      {profile.name}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  description: {
    marginBottom: 16,
    lineHeight: 20,
  },
  section: {
    borderRadius: UI_CONSTANTS.BORDER_RADIUS.BASE,
    overflow: 'hidden',
    marginBottom: 16,
  },
  profileOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  profileOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  checkbox: {
    marginRight: UI_CONSTANTS.GAP.BASE,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontWeight: UI_CONSTANTS.FONT_WEIGHT.MEDIUM,
  },
  profileDescription: {
    marginTop: 2,
  },
  profileIcon: {
    fontSize: 24,
    marginLeft: UI_CONSTANTS.GAP.BASE,
  },
  saveButton: {
    padding: UI_CONSTANTS.GAP.XS,
  },
  saveText: {
    fontWeight: UI_CONSTANTS.FONT_WEIGHT.SEMIBOLD,
  },
});
