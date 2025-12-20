/**
 * @module ProfileSelectScreen
 * @description プロファイル（環境）選択画面
 *
 * 定型文を表示するプロファイルを複数選択するためのモーダル画面。
 *
 * @features
 * - 利用可能なプロファイルの一覧表示
 * - 複数選択によるプロファイル指定
 * - 「全ての環境」オプション（空配列=全プロファイルで表示）
 *
 * @see lib/hooks/screens/useProfileSelectScreen.ts - ビジネスロジック
 */

import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from '@cliptap/shared'
import { useTheme } from '@lib/themeSystem';
import { useProfileSelectScreen } from '@hooks/screens/useProfileSelectScreen';
import { Profile } from '@cliptap/shared';
import { Header } from '@components/common/Header';
import { commonStyles } from '@lib/styles/commonStyles';
import { UI_CONSTANTS } from '@constants/ui';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProfileSelectScreen() {
  const { t } = useTranslation();
  const { colors, isTablet, responsiveFontSizes } = useTheme();
  const params = useLocalSearchParams();

  const selectedIds = params.selectedIds
    ? typeof params.selectedIds === 'string'
      ? params.selectedIds.split(',').filter((id) => id !== '')
      : params.selectedIds
    : [];

  const {
    tempSelectedIds,
    profiles,
    toggleProfile,
    handleSelectAll,
    handleSave,
  } = useProfileSelectScreen({ selectedIds: Array.isArray(selectedIds) ? selectedIds : [] });

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
        <Text style={[styles.description, { color: colors.textSecondary, fontSize: responsiveFontSizes.sm }]}>
          {t('snippet.select_profiles_description')}
        </Text>

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
  saveButton: {
    padding: UI_CONSTANTS.GAP.XS,
  },
  saveText: {
    fontWeight: UI_CONSTANTS.FONT_WEIGHT.SEMIBOLD,
  },
});
