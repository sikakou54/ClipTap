/**
 * 環境（プロファイル）スイッチャーコンポーネント
 *
 * 左右の矢印ボタンでプロファイルを順番に切り替えられるコンパクトなUI。
 * メイン画面のヘッダーなど、限られたスペースでの使用を想定。
 *
 * 主な機能:
 * - 現在のプロファイル名表示
 * - 左右矢印でプロファイル順送り/逆送り
 * - プロファイル1つ以下の場合は非表示
 *
 * @see app/(tabs)/index.tsx - メイン画面での使用
 * @see useProfiles - プロファイル管理フック
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from '@cliptap/shared';
import { useTheme } from '@lib/themeSystem';
import { UI_CONSTANTS } from '@constants/ui';
import { useProfileSwitcher } from '@hooks/components/useProfileSwitcher';

interface ProfileSwitcherProps {
  /** プロファイル変更時のコールバック */
  onProfileChange?: () => void;
}

export function ProfileSwitcher({ onProfileChange }: ProfileSwitcherProps) {
  /* ========================================
     Hooks & コンテキスト
     ======================================== */
  const { t } = useTranslation();
  const { colors, responsiveFontSizes } = useTheme();

  /* フックからロジックを取得 */
  const {
    activeProfile,
    shouldShow,
    handleNext,
    handlePrevious,
  } = useProfileSwitcher({ onProfileChange });

  /* ========================================
     早期リターン
     ======================================== */

  if (!shouldShow) {
    return null;
  }

  /* ========================================
     レンダリング
     ======================================== */

  /* プロファイルスイッチャーコンテナ */
  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {/* 前のプロファイルボタン */}
      <TouchableOpacity
        onPress={handlePrevious}
        style={styles.arrowButton}
        hitSlop={UI_CONSTANTS.HIT_SLOP.DEFAULT}
      >
        <Ionicons name="chevron-back" size={20} color={colors.text} />
      </TouchableOpacity>

      {/* プロファイル情報（中央） */}
      <View style={styles.profileInfo}>
        {/* 人物アイコン */}
        <Ionicons name="person" size={16} color={colors.primary} style={styles.icon} />
        {/* プロファイル名 */}
        <Text style={[styles.profileName, { color: colors.text, fontSize: responsiveFontSizes.sm }]} numberOfLines={UI_CONSTANTS.NUMBER_OF_LINES.SINGLE}>
          {activeProfile?.name || t('profile.environment')}
        </Text>
      </View>

      {/* 次のプロファイルボタン */}
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

/* ========================================
   スタイル定義
   ======================================== */
const styles = StyleSheet.create({
  /** コンテナ（横並び、ボーダー付き） */
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
  },
  /** 矢印ボタン */
  arrowButton: {
    padding: 4,
  },
  /** プロファイル情報（中央配置） */
  profileInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  /** 人物アイコン */
  icon: {
    marginRight: 2,
  },
  /** プロファイル名テキスト */
  profileName: {
    fontWeight: '500',
  },
});
