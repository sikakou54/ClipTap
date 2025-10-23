import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../lib/themeSystem';
import { Category } from '../../lib/types/category';

interface CategoryFilterProps {
  categories: Category[];
  selectedCategoryId: string | null;
  onSelectCategory: (categoryId: string | null) => void;
}

export function CategoryFilter({
  categories,
  selectedCategoryId,
  onSelectCategory,
}: CategoryFilterProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const allOption = {
    id: null,
    name: t('category.all'),
    icon: 'grid-outline',
  };

  const options = [allOption, ...categories];

  return (
    <View style={styles.wrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.container}
      >
        {options.map((option) => {
        const isSelected = option.id === selectedCategoryId;
        const categoryColor = option.id ? (categories.find(c => c.id === option.id)?.color || colors.primary) : colors.primary;

        return (
          <TouchableOpacity
            key={option.id || 'all'}
            style={[
              styles.chip,
              {
                backgroundColor: isSelected ? categoryColor : colors.surface,
                borderColor: isSelected ? categoryColor : colors.border,
              },
            ]}
            onPress={() => onSelectCategory(option.id)}
          >
            {option.icon && (
              <Ionicons
                name={option.icon as any}
                size={16}
                color={isSelected ? '#FFFFFF' : colors.text}
                style={styles.icon}
              />
            )}
            <Text
              style={[
                styles.text,
                { color: isSelected ? '#FFFFFF' : colors.text },
              ]}
            >
              {option.name}
            </Text>
          </TouchableOpacity>
        );
      })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingTop: 16,
    paddingBottom: 4,
  },
  container: {
    paddingHorizontal: 16,
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    height: 32,
  },
  icon: {
    marginRight: 4,
  },
  text: {
    fontSize: 13,
    fontWeight: '500',
  },
});
