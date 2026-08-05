/**
 * プロファイル選択コンポーネント
 *
 * ボトムシート形式でプロファイル一覧を表示し、切り替えを行う。
 *
 * 主な機能:
 * - 現在のプロファイル名をタップでモーダル表示
 * - FlashListによる効率的なリスト表示
 * - ラジオボタン形式の選択UI
 * - 選択中プロファイルのハイライト表示
 *
 * @see useProfiles - プロファイル管理フック
 */

import React, { useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FlashList } from '@mobile-types/flashlist';
import { useTheme } from '@lib/themeSystem';
import { useTranslation } from '@cliptap/shared';
import { Profile } from '@cliptap/shared';
import { UI_CONSTANTS } from '@constants/ui';
import { useProfileSelector } from '@hooks/components/useProfileSelector';

interface ProfileSelectorProps {
  /** プロファイル変更時のコールバック */
  onProfileChange?: () => void;
}

export function ProfileSelector({ onProfileChange }: ProfileSelectorProps) {
  /* ========================================
     Hooks & コンテキスト
     ======================================== */
  const { t } = useTranslation();
  const { colors, responsiveFontSizes } = useTheme();

  /* フックからロジックを取得 */
  const {
    profiles,
    activeProfile,
    loading,
    showModal,
    handleSelectProfile,
    openModal,
    closeModal,
    keyExtractor,
  } = useProfileSelector({ onProfileChange });

  /**
   * FlashListのrenderItem
   *
   * 早期リターンより前に定義する。
   * 早期リターンの後に置くとロード完了後に0件になった際にフックの呼び出し数が
   * 変化してReactがクラッシュするため。
   */
  const renderProfileItem = useCallback(({ item }: { item: Profile }) => {
    const isActive = activeProfile?.id === item.id;
    /* プロファイルアイテム */
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
          {/* ラジオボタンアイコン */}
          <Ionicons
            name={isActive ? 'radio-button-on' : 'radio-button-off'}
            size={20}
            color={isActive ? colors.primary : colors.textSecondary}
          />
          <View style={styles.profileItemInfo}>
            {/* プロファイル名 */}
            <Text style={[styles.profileItemName, { color: colors.text, fontSize: responsiveFontSizes.base }]}>
              {item.name}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }, [activeProfile?.id, colors.primary, colors.text, colors.textSecondary, handleSelectProfile, responsiveFontSizes.base]);

  /* ========================================
     早期リターン
     ======================================== */

  if (!loading && profiles.length === 0) {
    return null;
  }

  /* ========================================
     レンダリング
     ======================================== */

  return (
    <>
      {/* プロファイル選択トリガーボタン */}
      <TouchableOpacity
        style={styles.container}
        onPress={openModal}
        activeOpacity={0.7}
      >
        {/* オプションアイコン */}
        <Ionicons name="options-outline" size={18} color={colors.primary} />
        {/* プロファイル名 */}
        <Text style={[styles.text, { color: colors.text, fontSize: responsiveFontSizes.base }]} numberOfLines={UI_CONSTANTS.NUMBER_OF_LINES.SINGLE}>
          {activeProfile?.name || t('profile.no_profiles')}
        </Text>
        {/* ドロップダウンアイコン */}
        <Ionicons name="chevron-down" size={18} color={colors.textSecondary} />
      </TouchableOpacity>

      {/* プロファイル選択モーダル（ボトムシート形式） */}
      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={closeModal}
        statusBarTranslucent={true}
      >
        <View style={styles.modalOverlay}>
          {/* 背景オーバーレイ（タップで閉じる） */}
          <TouchableOpacity
            style={styles.backdrop}
            activeOpacity={1}
            onPress={closeModal}
          />

          {/* ボトムシートコンテンツ */}
          <View style={[styles.bottomSheet, { backgroundColor: colors.surface }]}>
            {/* シートヘッダー（タイトルと閉じるボタン） */}
            <View style={styles.sheetHeader}>
              <Text style={[styles.sheetTitle, { color: colors.text, fontSize: responsiveFontSizes.lg }]}>
                {t('profile.switch_environment')}
              </Text>
              {/* 閉じるボタン */}
              <TouchableOpacity
                onPress={closeModal}
                style={styles.closeButton}
                hitSlop={UI_CONSTANTS.HIT_SLOP.DEFAULT}
              >
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* プロファイル一覧（FlashList） */}
            <FlashList
              data={profiles}
              keyExtractor={keyExtractor}
              contentContainerStyle={styles.profileList}
              estimatedItemSize={60}
              extraData={activeProfile?.id}
              renderItem={renderProfileItem}
            />
          </View>
        </View>
      </Modal>
    </>
  );
}

/* ========================================
   スタイル定義
   ======================================== */
const styles = StyleSheet.create({
  /** トリガーボタンコンテナ */
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 1,
  },
  /** プロファイル名テキスト */
  text: {
    fontWeight: '500',
    flexShrink: 1,
  },
  /** モーダルオーバーレイ（下部配置） */
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  /** 背景オーバーレイ（半透明黒） */
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  /** ボトムシート本体 */
  bottomSheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    minHeight: 400,
    paddingBottom: 34,
  },
  /** シートヘッダー（中央配置） */
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    position: 'relative',
  },
  /** シートタイトル */
  sheetTitle: {
    fontWeight: '600',
    textAlign: 'center',
  },
  /** 閉じるボタン（右上に配置） */
  closeButton: {
    position: 'absolute',
    right: 20,
    top: 16,
  },
  /** プロファイル一覧コンテナ */
  profileList: {
    paddingVertical: 8,
  },
  /** プロファイルアイテム */
  profileItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    minHeight: 60,
  },
  /** アイテム左側（ラジオボタン + 名前） */
  profileItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  /** プロファイル情報コンテナ */
  profileItemInfo: {
    flex: 1,
    gap: 2,
  },
  /** プロファイル名 */
  profileItemName: {
    fontWeight: '500',
  },
});
