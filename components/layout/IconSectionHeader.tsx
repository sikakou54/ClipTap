/**
 * アイコン付きセクションヘッダー
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../lib/themeSystem';

type HeaderVariant = 'primary' | 'success' | 'warning' | 'danger';

interface IconSectionHeaderProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  variant?: HeaderVariant;
  subtitle?: string;
}

const IconSectionHeader: React.FC<IconSectionHeaderProps> = ({
  icon,
  title,
  variant = 'primary',
  subtitle,
}) => {
  const { colors, spacing, typography } = useTheme();

  const getIconColor = () => {
    switch (variant) {
      case 'success': return colors.success;
      case 'warning': return colors.warning;
      case 'danger': return colors.danger;
      default: return colors.primary;
    }
  };

  return (
    <View style={[styles.container, { marginBottom: spacing.md }]}>
      <View style={styles.headerRow}>
        <Ionicons
          name={icon}
          size={24}
          color={getIconColor()}
          style={{ marginRight: spacing.sm }}
        />
        <Text style={[typography.h3, { color: colors.text }]}>
          {title}
        </Text>
      </View>
      {subtitle && (
        <Text style={[
          typography.bodySmall,
          { color: colors.textSecondary, marginLeft: 24 + spacing.sm }
        ]}>
          {subtitle}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {},
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default IconSectionHeader;
