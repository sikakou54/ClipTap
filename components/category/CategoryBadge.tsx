import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../lib/themeSystem';
import { Category } from '../../lib/types/category';

interface CategoryBadgeProps {
  category: Category;
  size?: 'small' | 'medium';
}

export function CategoryBadge({ category, size = 'medium' }: CategoryBadgeProps) {
  const { colors } = useTheme();
  const badgeColor = category.color || colors.primary;

  const iconSize = size === 'small' ? 14 : 16;
  const fontSize = size === 'small' ? 12 : 14;

  return (
    <View
      style={[
        styles.badge,
        size === 'small' ? styles.badgeSmall : styles.badgeMedium,
        { backgroundColor: `${badgeColor}20` },
      ]}
    >
      {category.icon && (
        <Ionicons
          name={category.icon as any}
          size={iconSize}
          color={badgeColor}
          style={styles.icon}
        />
      )}
      <Text style={[styles.text, { color: badgeColor, fontSize }]}>
        {category.name}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  badgeSmall: {
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  badgeMedium: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  icon: {
    marginRight: 4,
  },
  text: {
    fontWeight: '500',
  },
});
