/**
 * 統一ボタンコンポーネント
 * 一貫性のあるインタラクションを提供
 */

import React, { useMemo } from 'react';
import { TouchableOpacity, Text, ActivityIndicator, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../lib/themeSystem';

export type ButtonType =
  | 'primary'      // メインアクション（青）
  | 'secondary'    // サブアクション（グレー）
  | 'danger'       // 注意アクション（赤）
  | 'success'      // 完了アクション（緑）
  | 'ghost'        // 透明背景
  | 'outline'      // 枠線のみ
  | 'warning';     // 警告アクション（オレンジ）

export type ButtonSize = 'small' | 'medium' | 'large';

interface CommonButtonProps {
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

const CommonButton: React.FC<CommonButtonProps> = ({
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
}) => {
  const { isDark, fontSizes } = useTheme();

  const buttonStyle = useMemo((): ViewStyle => {
    const sizeConfig = {
      small: { height: 36, paddingHorizontal: 12, fontSize: fontSizes.sm },
      medium: { height: 44, paddingHorizontal: 16, fontSize: fontSizes.md },
      large: { height: 52, paddingHorizontal: 20, fontSize: fontSizes.lg }
    }[size];

    const baseStyle: ViewStyle = {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 12,
      height: sizeConfig.height,
      paddingHorizontal: sizeConfig.paddingHorizontal,
      minWidth: fullWidth ? undefined : sizeConfig.height * 2,
      width: fullWidth ? '100%' : undefined,
      opacity: (disabled || loading) ? 0.6 : 1,
    };

    let typeStyle: ViewStyle = {};

    if (disabled || loading) {
      typeStyle.backgroundColor = isDark ? '#374151' : '#9CA3AF';
    } else {
      switch (type) {
        case 'primary':
          typeStyle.backgroundColor = '#3B82F6';
          break;
        case 'secondary':
          typeStyle.backgroundColor = isDark ? '#374151' : '#F3F4F6';
          typeStyle.borderWidth = 1;
          typeStyle.borderColor = isDark ? '#4B5563' : '#D1D5DB';
          break;
        case 'danger':
          typeStyle.backgroundColor = '#EF4444';
          break;
        case 'success':
          typeStyle.backgroundColor = '#10B981';
          break;
        case 'warning':
          typeStyle.backgroundColor = '#F59E0B';
          break;
        case 'ghost':
          typeStyle.backgroundColor = 'transparent';
          break;
        case 'outline':
          typeStyle.backgroundColor = 'transparent';
          typeStyle.borderWidth = 1;
          typeStyle.borderColor = '#3B82F6';
          break;
      }
    }

    return { ...baseStyle, ...typeStyle };
  }, [disabled, loading, isDark, type, size, fullWidth, fontSizes]);

  const getTextColor = (): string => {
    if (disabled || loading) return isDark ? '#9CA3AF' : '#6B7280';

    switch (type) {
      case 'primary':
      case 'danger':
      case 'success':
      case 'warning':
        return '#FFFFFF';
      case 'secondary':
        return isDark ? '#FFFFFF' : '#111827';
      case 'ghost':
      case 'outline':
        return '#3B82F6';
      default:
        return '#FFFFFF';
    }
  };

  const getIconSize = (): number => {
    return { small: 16, medium: 18, large: 20 }[size];
  };

  const renderContent = () => {
    if (loading) {
      return (
        <>
          <ActivityIndicator
            size="small"
            color={getTextColor()}
            style={{ marginRight: 8 }}
          />
          <Text style={{ color: getTextColor(), fontWeight: '600' }}>
            処理中...
          </Text>
        </>
      );
    }

    return (
      <>
        {icon && iconPosition === 'left' && (
          <Ionicons
            name={icon}
            size={getIconSize()}
            color={getTextColor()}
            style={{ marginRight: 8 }}
          />
        )}
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit={true}
          minimumFontScale={0.8}
          style={{
            color: getTextColor(),
            fontWeight: '600',
            fontSize: { small: fontSizes.sm, medium: fontSizes.md, large: fontSizes.lg }[size]
          }}
        >
          {title}
        </Text>
        {icon && iconPosition === 'right' && (
          <Ionicons
            name={icon}
            size={getIconSize()}
            color={getTextColor()}
            style={{ marginLeft: 8 }}
          />
        )}
      </>
    );
  };

  return (
    <TouchableOpacity
      style={[
        buttonStyle,
        maxWidth ? { maxWidth } : undefined,
        style
      ]}
      onPress={() => {
        if (enableHaptics && !disabled && !loading) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
};

export default CommonButton;
