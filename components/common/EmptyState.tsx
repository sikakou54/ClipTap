/**
 * 空状態表示コンポーネント
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../lib/themeSystem';
import CommonButton from './CommonButton';

type EmptyStateVariant = 'default' | 'compact' | 'large';

interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  message: string;
  description?: string;
  variant?: EmptyStateVariant;
  actionLabel?: string;
  onActionPress?: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon = 'file-tray-outline',
  message,
  description,
  variant = 'default',
  actionLabel,
  onActionPress,
}) => {
  const { colors, spacing, typography } = useTheme();

  const getIconSize = () => {
    switch (variant) {
      case 'compact': return 40;
      case 'large': return 80;
      default: return 60;
    }
  };

  const getPadding = () => {
    switch (variant) {
      case 'compact': return spacing.lg;
      case 'large': return spacing.xxl;
      default: return spacing.xl;
    }
  };

  return (
    <View style={[
      styles.container,
      { padding: getPadding() }
    ]}>
      <Ionicons
        name={icon}
        size={getIconSize()}
        color={colors.textTertiary}
        style={{ marginBottom: spacing.md }}
      />

      <Text style={[
        variant === 'compact' ? typography.body : typography.h3,
        { color: colors.text, textAlign: 'center', marginBottom: spacing.xs }
      ]}>
        {message}
      </Text>

      {description && (
        <Text style={[
          typography.bodySmall,
          { color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.md }
        ]}>
          {description}
        </Text>
      )}

      {actionLabel && onActionPress && (
        <CommonButton
          title={actionLabel}
          onPress={onActionPress}
          type="primary"
          size="medium"
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default EmptyState;
