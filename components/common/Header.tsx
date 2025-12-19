/**
 * 共通ヘッダーコンポーネント
 *
 * アプリ全体で使用される統一されたヘッダー。
 * バックボタン、タイトル、右側アクションを配置。
 *
 * 主な機能:
 * - バックボタン（アイコンカスタマイズ可能）
 * - タイトル表示（中央揃え）
 * - 右側アクションボタン（カスタムコンポーネント）
 * - SafeAreaInsets対応
 * - タブレット/モーダル対応
 *
 * @see commonStyles - 共通スタイル定義
 * @see headerStyles - ヘッダー専用スタイル
 */

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@lib/themeSystem';
import { commonStyles, headerStyles } from '@lib/styles/commonStyles';
import { UI_CONSTANTS } from '@constants/ui';

/*
 * ========================================
 * Props定義
 * ========================================
 */

/**
 * HeaderのProps
 * @property title - ヘッダータイトル
 * @property showBackButton - バックボタンを表示するか（デフォルト: true）
 * @property backIcon - バックボタンのアイコン名（タブレット時は自動的にarrow-backになる）
 * @property onBack - バックボタン押下時のカスタムハンドラー
 * @property rightAction - 右側のアクションボタン（React要素）
 * @property backgroundColor - ヘッダーの背景色を上書き
 * @property isModal - モーダル画面かどうか（trueの場合paddingTopを0にする）
 */
interface HeaderProps {
  title: string;
  showBackButton?: boolean;
  backIcon?: keyof typeof Ionicons.glyphMap;
  onBack?: () => void;
  rightAction?: React.ReactNode;
  backgroundColor?: string;
  isModal?: boolean;
}

export function Header({
  title,
  showBackButton = true,
  backIcon = 'close',
  onBack,
  rightAction,
  backgroundColor,
  isModal = false,
}: HeaderProps) {
  /*
   * ========================================
   * Hooks & コンテキスト
   * ========================================
   */
  const { colors, isTablet, responsiveFontSizes } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  /*
   * ========================================
   * イベントハンドラ
   * ========================================
   */

  /**
   * バックボタン押下時の処理
   * カスタムハンドラーがあればそれを呼び、なければrouter.back()
   */
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  /*
   * ========================================
   * 派生データ（計算値）
   * ========================================
   */

  /**
   * 表示するバックアイコンを決定
   * モーダル時は常にclose、タブレット時はarrow-back、その他は指定されたアイコン
   */
  const displayBackIcon = isModal ? 'close' : (isTablet ? 'arrow-back' : backIcon);
  const iconSize = isTablet ? 32 : 28;

  /*
   * ========================================
   * レンダリング
   * ========================================
   */

  /* 共通ヘッダーコンテナ */
  return (
    <View
      style={[
        headerStyles.header,
        {
          backgroundColor: backgroundColor || colors.background,
          borderBottomColor: colors.border,
          paddingTop: isModal ? UI_CONSTANTS.GAP.BASE : isTablet ? insets.top + UI_CONSTANTS.GAP.BASE : insets.top,
          paddingBottom: isModal ? UI_CONSTANTS.GAP.MD : UI_CONSTANTS.GAP.MD,
        },
      ]}
    >
      {/* バックボタンまたはプレースホルダー */}
      {showBackButton ? (
        <TouchableOpacity onPress={handleBack} style={commonStyles.backButton}>
          <Ionicons name={displayBackIcon} size={iconSize} color={colors.text} />
        </TouchableOpacity>
      ) : (
        <View style={commonStyles.placeholder} />
      )}

      {/* タイトル */}
      <Text
        style={[
          commonStyles.headerTitle,
          {
            color: colors.text,
            fontSize: responsiveFontSizes.lg,
          },
        ]}
        numberOfLines={UI_CONSTANTS.NUMBER_OF_LINES.SINGLE}
      >
        {title}
      </Text>

      {/* 右側アクションまたはプレースホルダー */}
      {rightAction ? (
        rightAction
      ) : (
        <View style={commonStyles.placeholder} />
      )}
    </View>
  );
}
