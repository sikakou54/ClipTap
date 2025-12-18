import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../lib/themeSystem';
import { commonStyles, headerStyles } from '../../lib/styles/commonStyles';
import { UI_CONSTANTS } from '../../lib/constants/ui';

interface HeaderProps {
  title: string;
  /** バックボタンを表示するか */
  showBackButton?: boolean;
  /** バックボタンのアイコン名（タブレット時は自動的にarrow-backになる） */
  backIcon?: keyof typeof Ionicons.glyphMap;
  /** バックボタン押下時のカスタムハンドラー */
  onBack?: () => void;
  /** 右側のアクションボタン */
  rightAction?: React.ReactNode;
  /** ヘッダーの背景色を上書き */
  backgroundColor?: string;
  /** モーダル画面かどうか（trueの場合paddingTopを0にする） */
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
  const { colors, isTablet, responsiveFontSizes } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  // モーダルの場合は常にclose、それ以外はタブレットならarrow-back、スマホなら指定されたアイコン
  const displayBackIcon = isModal ? 'close' : (isTablet ? 'arrow-back' : backIcon);
  const iconSize = isTablet ? 32 : 28;

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
      {showBackButton ? (
        <TouchableOpacity onPress={handleBack} style={commonStyles.backButton}>
          <Ionicons name={displayBackIcon} size={iconSize} color={colors.text} />
        </TouchableOpacity>
      ) : (
        <View style={commonStyles.placeholder} />
      )}

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

      {rightAction ? (
        rightAction
      ) : (
        <View style={commonStyles.placeholder} />
      )}
    </View>
  );
}
