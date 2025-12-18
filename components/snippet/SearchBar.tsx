import React from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../lib/themeSystem';
import { UI_CONSTANTS } from '../../lib/constants/ui';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onClear?: () => void;
  placeholder?: string;
  autoFocus?: boolean;
}

export function SearchBar({
  value,
  onChangeText,
  onClear,
  placeholder,
  autoFocus = false,
}: SearchBarProps) {
  const { t } = useTranslation();
  const { colors, responsiveFontSizes } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <Ionicons
        name="search"
        size={20}
        color={colors.textSecondary}
        style={styles.icon}
      />
      <TextInput
        style={[styles.input, { color: colors.text, fontSize: responsiveFontSizes.base }]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder || t('snippet.search_placeholder')}
        placeholderTextColor={colors.textSecondary}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
        autoFocus={autoFocus}
      />
      {value.length > 0 && (
        <TouchableOpacity
          onPress={onClear || (() => onChangeText(''))}
          style={styles.clearButton}
          hitSlop={UI_CONSTANTS.HIT_SLOP.DEFAULT}
        >
          <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 45,
  },
  icon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    padding: 0,
  },
  clearButton: {
    padding: 4,
  },
});
