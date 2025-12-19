/**
 * 統一ボタンコンポーネント
 *
 * アプリ全体で使用される一貫性のあるボタンUI。
 * 触覚フィードバック、ローディング状態、アイコン対応。
 *
 * 主な機能:
 * - 7種類のボタンタイプ（primary, secondary, danger, success, ghost, outline, warning）
 * - 3種類のサイズ（small, medium, large）
 * - 触覚フィードバック（Haptics）
 * - ローディング状態表示
 * - アイコン対応（左/右配置）
 * - アクセシビリティ対応
 */

import React, { useMemo } from 'react';
import { TouchableOpacity, Text, ActivityIndicator, ViewStyle, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { useTheme } from '@lib/themeSystem';
import { useTranslation } from '@cliptap/shared';
import { UI_CONSTANTS } from '@constants/ui';

/*
 * ========================================
 * 型定義
 * ========================================
 */

/**
 * ボタンタイプ
 * - primary: メインアクション（青）
 * - secondary: サブアクション（グレー）
 * - danger: 注意アクション（赤）
 * - success: 完了アクション（緑）
 * - ghost: 透明背景
 * - outline: 枠線のみ
 * - warning: 警告アクション（オレンジ）
 */
export type ButtonType =
  | 'primary'
  | 'secondary'
  | 'danger'
  | 'success'
  | 'ghost'
  | 'outline'
  | 'warning';

/** ボタンサイズ */
export type ButtonSize = 'small' | 'medium' | 'large';

/*
 * ========================================
 * Props定義
 * ========================================
 */

/**
 * CommonButtonのProps
 * @property title - ボタンテキスト
 * @property onPress - タップ時のコールバック
 * @property type - ボタンタイプ（デフォルト: primary）
 * @property size - ボタンサイズ（デフォルト: medium）
 * @property disabled - 無効状態
 * @property loading - ローディング状態
 * @property icon - アイコン名
 * @property iconPosition - アイコン位置（left/right）
 * @property fullWidth - 幅100%にするか
 * @property maxWidth - 最大幅
 * @property style - カスタムスタイル
 * @property enableHaptics - 触覚フィードバックを有効にするか
 */
export interface CommonButtonProps {
  title: string;
  onPress: () => void;
  type?: ButtonType;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  maxWidth?: number;
  style?: ViewStyle;
  enableHaptics?: boolean;
}

export function CommonButton({
  title,
  onPress,
  type = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  maxWidth,
  style,
  enableHaptics = true,
}: CommonButtonProps) {
  /*
   * ========================================
   * Hooks & コンテキスト
   * ========================================
   */
  const { t } = useTranslation();
  const { colors, responsiveFontSizes } = useTheme();

  /*
   * ========================================
   * メモ化されたスタイル計算
   * ========================================
   */

  /**
   * ボタンスタイルを計算
   * サイズ、タイプ、状態（disabled/loading）に基づいてスタイルを生成
   */
  const buttonStyle = useMemo((): ViewStyle => {
    const sizeConfig = {
      small: { height: 36, paddingHorizontal: 12 },
      medium: { height: 44, paddingHorizontal: 16 },
      large: { height: 52, paddingHorizontal: 20 }
    }[size];

    const baseStyle: ViewStyle = {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: UI_CONSTANTS.BORDER_RADIUS.LG,
      height: sizeConfig.height,
      paddingHorizontal: sizeConfig.paddingHorizontal,
      minWidth: fullWidth ? undefined : sizeConfig.height * 2,
      width: fullWidth ? '100%' : undefined,
      opacity: (disabled || loading) ? 0.6 : 1,
    };

    let typeStyle: ViewStyle = {};

    if (disabled || loading) {
      typeStyle.backgroundColor = colors.textTertiary;
    } else {
      switch (type) {
        case 'primary':
          typeStyle.backgroundColor = colors.primary;
          break;
        case 'secondary':
          typeStyle.backgroundColor = colors.surface;
          typeStyle.borderWidth = UI_CONSTANTS.BORDER_WIDTH.THIN;
          typeStyle.borderColor = colors.border;
          break;
        case 'danger':
          typeStyle.backgroundColor = colors.danger;
          break;
        case 'success':
          typeStyle.backgroundColor = colors.success;
          break;
        case 'warning':
          typeStyle.backgroundColor = colors.warning;
          break;
        case 'ghost':
          typeStyle.backgroundColor = 'transparent';
          break;
        case 'outline':
          typeStyle.backgroundColor = 'transparent';
          typeStyle.borderWidth = UI_CONSTANTS.BORDER_WIDTH.THIN;
          typeStyle.borderColor = colors.primary;
          break;
      }
    }

    return { ...baseStyle, ...typeStyle };
  }, [disabled, loading, colors, type, size, fullWidth]);

  /*
   * ========================================
   * ヘルパー関数
   * ========================================
   */

  /** タイプと状態に応じたテキスト色を取得 */
  const getTextColor = (): string => {
    if (disabled || loading) return colors.textSecondary;

    switch (type) {
      case 'primary':
      case 'danger':
      case 'success':
      case 'warning':
        return colors.textInverse;
      case 'secondary':
        return colors.text;
      case 'ghost':
      case 'outline':
        return colors.primary;
      default:
        return colors.textInverse;
    }
  };

  /** サイズに応じたアイコンサイズを取得 */
  const getIconSize = (): number => {
    return { small: 16, medium: 18, large: 20 }[size];
  };

  /** サイズに応じたフォントサイズを取得 */
  const getFontSize = (): number => {
    return {
      small: responsiveFontSizes.sm,
      medium: responsiveFontSizes.base,
      large: responsiveFontSizes.md
    }[size];
  };

  /*
   * ========================================
   * レンダリング関数
   * ========================================
   */

  /** ボタンコンテンツをレンダリング（ローディング/通常） */
  const renderContent = () => {
    if (loading) {
      return (
        <>
          {/* ローディングインジケーター */}
          <ActivityIndicator
            size="small"
            color={getTextColor()}
            style={styles.loadingIndicator}
          />
          {/* ローディング時のテキスト */}
          <Text style={[
            styles.text,
            {
              color: getTextColor(),
              fontSize: getFontSize(),
            }
          ]}>
            {t('common.processing')}
          </Text>
        </>
      );
    }

    return (
      <>
        {/* 左側アイコン（オプション） */}
        {icon && iconPosition === 'left' && (
          <Ionicons
            name={icon}
            size={getIconSize()}
            color={getTextColor()}
            style={styles.iconLeft}
          />
        )}
        {/* ボタンテキスト */}
        <Text
          numberOfLines={UI_CONSTANTS.NUMBER_OF_LINES.SINGLE}
          adjustsFontSizeToFit={true}
          minimumFontScale={0.8}
          style={[
            styles.text,
            {
              color: getTextColor(),
              fontSize: getFontSize(),
            }
          ]}
        >
          {title}
        </Text>
        {/* 右側アイコン（オプション） */}
        {icon && iconPosition === 'right' && (
          <Ionicons
            name={icon}
            size={getIconSize()}
            color={getTextColor()}
            style={styles.iconRight}
          />
        )}
      </>
    );
  };

  /* ボタン本体（触覚フィードバック、アクセシビリティ対応） */
  return (
    <TouchableOpacity
      style={[
        buttonStyle,
        maxWidth ? { maxWidth } : undefined,
        style
      ]}
      onPress={() => {
        if (enableHaptics && !disabled && !loading) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        }
        onPress();
      }}
      disabled={disabled || loading}
      activeOpacity={0.6}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{
        disabled: disabled || loading,
        busy: loading,
      }}
    >
      {renderContent()}
    </TouchableOpacity>
  );
}

/*
 * ========================================
 * スタイル定義
 * ========================================
 */
const styles = StyleSheet.create({
  text: {
    fontWeight: UI_CONSTANTS.FONT_WEIGHT.SEMIBOLD,
  },
  loadingIndicator: {
    marginRight: UI_CONSTANTS.GAP.MD,
  },
  iconLeft: {
    marginRight: UI_CONSTANTS.GAP.MD,
  },
  iconRight: {
    marginLeft: UI_CONSTANTS.GAP.MD,
  },
});
