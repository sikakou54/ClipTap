import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../lib/themeSystem';
import { SnippetSortBy } from '../../lib/types/snippet';

interface SortMenuProps {
  currentSort: SnippetSortBy;
  onSortChange: (sort: SnippetSortBy) => void;
}

export function SortMenu({ currentSort, onSortChange }: SortMenuProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const sortOptions: { value: SnippetSortBy; label: string; icon: string }[] = [
    { value: 'recent', label: t('sort.recent'), icon: 'time' },
    { value: 'usage', label: t('sort.usage'), icon: 'trending-up' },
    { value: 'title', label: t('sort.title_sort'), icon: 'text' },
  ];

  const handlePress = () => {
    Alert.alert(
      t('sort.title'),
      undefined,
      sortOptions.map((option) => ({
        text: option.label,
        onPress: () => onSortChange(option.value),
        style: currentSort === option.value ? 'default' : undefined,
      }))
    );
  };

  const currentOption = sortOptions.find((opt) => opt.value === currentSort);

  return (
    <TouchableOpacity
      style={[styles.button, { backgroundColor: colors.surface }]}
      onPress={handlePress}
    >
      <Ionicons
        name={currentOption?.icon as any}
        size={18}
        color={colors.text}
      />
      <Text style={[styles.label, { color: colors.text }]}>
        {currentOption?.label}
      </Text>
      <Ionicons name="chevron-down" size={18} color={colors.textSecondary} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
  },
});
