/**
 * サイドメニュー（ドロワー）コンポーネント
 *
 * 画面左からスライドインするサイドメニュー。
 * 環境（プロファイル）切り替えと設定画面へのナビゲーションを提供。
 *
 * 主な機能:
 * - 環境（プロファイル）一覧表示と切り替え
 * - 設定画面へのリンク
 * - モーダルオーバーレイによる背景タップで閉じる
 * - フェードアニメーション
 *
 * @see app/(tabs)/index.tsx - メイン画面での使用例
 * @see useProfiles - 環境管理フック
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@lib/themeSystem';
import { useProfiles } from '@cliptap/shared';
import { useTranslation } from '@cliptap/shared';
import { useRouter } from 'expo-router';
import { Profile } from '@cliptap/shared';
import { UI_CONSTANTS } from '@constants/ui';

/*
 * ========================================
 * Props定義
 * ========================================
 */

/**
 * DrawerのProps
 * @property visible - ドロワーの表示状態
 * @property onClose - 閉じる時のコールバック
 */
interface DrawerProps {
  visible: boolean;
  onClose: () => void;
}

export function Drawer({ visible, onClose }: DrawerProps) {
  /*
   * ========================================
   * Hooks & コンテキスト
   * ========================================
   */
  const { t } = useTranslation();
  const { colors, responsiveFontSizes } = useTheme();
  const { profiles, setActiveProfile } = useProfiles();
  const router = useRouter();

  /*
   * ========================================
   * イベントハンドラ
   * ========================================
   */

  /**
   * 環境（プロファイル）選択時の処理
   * すでにアクティブな環境を選択した場合は何もしない
   * 選択した環境をアクティブに設定し、変数の参照先を切り替える
   */
  const handleSelectProfile = async (profile: Profile) => {
    if (profile.isActive) return;

    try {
      await setActiveProfile(profile.id);
    } catch (error) {
      /* エラーは無視（UIの状態は変更されない） */
    }
  };

  /**
   * 設定画面へ遷移
   * ドロワーを閉じてから設定画面に移動
   */
  const handleSettings = () => {
    onClose();
    router.push('/settings');
  };

  /*
   * ========================================
   * レンダリング
   * ========================================
   */

  /* サイドメニュー（ドロワー）モーダル */
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      {/* オーバーレイ（背景タップで閉じる） */}
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        {/* ドロワー本体 */}
        <TouchableOpacity
          style={[styles.drawer, { backgroundColor: colors.background }]}
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
        >
          <ScrollView style={styles.content}>
            {/* ヘッダー（タイトルと閉じるボタン） */}
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
              <Text style={[styles.headerTitle, { color: colors.text, fontSize: responsiveFontSizes.xl }]}>
                {t('drawer.menu')}
              </Text>
              {/* 閉じるボタン */}
              <TouchableOpacity
                onPress={onClose}
                hitSlop={UI_CONSTANTS.HIT_SLOP.DEFAULT}
              >
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* 環境（プロファイル）選択セクション */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.textSecondary, fontSize: responsiveFontSizes.sm }]}>
                {t('drawer.environment')}
              </Text>
              <View style={[styles.profileBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                {profiles.map((profile) => (
                  /* プロファイルアイテム */
                  <TouchableOpacity
                    key={profile.id}
                    style={[
                      styles.profileItem,
                      profile.isActive && { backgroundColor: colors.primary + '10' },
                    ]}
                    onPress={() => handleSelectProfile(profile)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.profileItemLeft}>
                      {/* ラジオボタンアイコン */}
                      <Ionicons
                        name={profile.isActive ? 'radio-button-on' : 'radio-button-off'}
                        size={20}
                        color={profile.isActive ? colors.primary : colors.textSecondary}
                      />
                      <View style={styles.profileItemInfo}>
                        {/* プロファイル名 */}
                        <Text style={[styles.profileItemName, { color: colors.text, fontSize: responsiveFontSizes.base }]}>
                          {profile.name}
                        </Text>
                      </View>
                    </View>
                    {/* アクティブプロファイルのチェックマーク */}
                    {profile.isActive && (
                      <Ionicons name="checkmark" size={20} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* 設定メニューセクション */}
            <View style={styles.section}>
              <TouchableOpacity
                style={[styles.menuItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={handleSettings}
                activeOpacity={0.7}
              >
                <Ionicons name="settings-outline" size={24} color={colors.text} />
                <Text style={[styles.menuItemText, { color: colors.text, fontSize: responsiveFontSizes.base }]}>
                  {t('settings.title')}
                </Text>
                <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </ScrollView>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

/*
 * ========================================
 * スタイル定義
 * ========================================
 */
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
  },
  drawer: {
    width: '80%',
    maxWidth: 320,
    height: '100%',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 2,
      height: 0,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: UI_CONSTANTS.GAP.LG,
    paddingTop: 60,
    borderBottomWidth: UI_CONSTANTS.BORDER_WIDTH.THIN,
  },
  headerTitle: {
    fontWeight: UI_CONSTANTS.FONT_WEIGHT.SEMIBOLD,
  },
  section: {
    padding: UI_CONSTANTS.GAP.LG,
  },
  sectionTitle: {
    fontWeight: UI_CONSTANTS.FONT_WEIGHT.SEMIBOLD,
    marginBottom: UI_CONSTANTS.GAP.MD,
    textTransform: 'uppercase',
  },
  profileBox: {
    borderRadius: UI_CONSTANTS.BORDER_RADIUS.LG,
    borderWidth: UI_CONSTANTS.BORDER_WIDTH.THIN,
    overflow: 'hidden',
  },
  profileItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: UI_CONSTANTS.GAP.BASE,
    paddingVertical: UI_CONSTANTS.GAP.BASE,
  },
  profileItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: UI_CONSTANTS.GAP.BASE,
    flex: 1,
  },
  profileItemInfo: {
    flex: 1,
    gap: UI_CONSTANTS.GAP.XXS,
  },
  profileItemName: {
    fontWeight: UI_CONSTANTS.FONT_WEIGHT.MEDIUM,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: UI_CONSTANTS.GAP.BASE,
    padding: UI_CONSTANTS.GAP.LG,
    borderRadius: UI_CONSTANTS.BORDER_RADIUS.LG,
    borderWidth: UI_CONSTANTS.BORDER_WIDTH.THIN,
  },
  menuItemText: {
    flex: 1,
    fontWeight: UI_CONSTANTS.FONT_WEIGHT.MEDIUM,
  },
});
