import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../lib/themeSystem';
import { SnippetSortBy } from '../../lib/types/snippet';
import { UI_CONSTANTS } from '../../lib/constants/ui';

interface SortMenuProps {
  currentSort: SnippetSortBy;
  onSortChange: (sort: SnippetSortBy) => void;
}

export function SortMenu({ currentSort, onSortChange }: SortMenuProps) {
  const { t } = useTranslation();
  const { colors, responsiveFontSizes, responsiveLineHeights } = useTheme();
  const [visible, setVisible] = useState(false);

  const sortOptions: { value: SnippetSortBy; label: string; icon: string }[] = [
    { value: 'recent', label: t('sort.recent'), icon: 'time' },
    { value: 'title', label: t('sort.title_sort'), icon: 'text' },
  ];

  const handlePress = () => {
    setVisible(true);
  };

  const handleSelect = (value: SnippetSortBy) => {
    onSortChange(value);
    setVisible(false);
  };

  const currentOption = sortOptions.find((opt) => opt.value === currentSort);

  return (
    <>
      <TouchableOpacity
        style={[styles.button, { backgroundColor: colors.surface }]}
        onPress={handlePress}
      >
        <Ionicons
          name={currentOption?.icon as any}
          size={18}
          color={colors.text}
        />
        <Text style={[styles.label, { color: colors.text, fontSize: responsiveFontSizes.sm, lineHeight: responsiveLineHeights.sm }]}>
          {currentOption?.label}
        </Text>
        <Ionicons name="chevron-down" size={18} color={colors.textSecondary} />
      </TouchableOpacity>

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setVisible(false)}>
          <Pressable style={[styles.modal, { backgroundColor: colors.surface }]} onPress={(e) => e.stopPropagation()}>
            <Text style={[styles.modalTitle, { color: colors.text, fontSize: responsiveFontSizes.lg, lineHeight: responsiveLineHeights.lg }]}>
              {t('sort.title')}
            </Text>
            {sortOptions.map((option, index) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.option,
                  index < sortOptions.length - 1 && styles.optionBorder,
                  { borderBottomColor: colors.border }
                ]}
                onPress={() => handleSelect(option.value)}
              >
                <Ionicons
                  name={option.icon as any}
                  size={22}
                  color={currentSort === option.value ? colors.primary : colors.text}
                />
                <Text style={[
                  styles.optionText,
                  {
                    color: currentSort === option.value ? colors.primary : colors.text,
                    fontSize: responsiveFontSizes.base,
                    lineHeight: responsiveLineHeights.base
                  }
                ]}>
                  {option.label}
                </Text>
                {currentSort === option.value && (
                  <Ionicons name="checkmark" size={22} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
    </>
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
    fontWeight: '500',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    width: '80%',
    maxWidth: 360,
    borderRadius: UI_CONSTANTS.BORDER_RADIUS.LG,
    padding: UI_CONSTANTS.SPACING.LG,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalTitle: {
    fontWeight: UI_CONSTANTS.FONT_WEIGHT.BOLD,
    marginBottom: UI_CONSTANTS.GAP.LG,
    textAlign: 'center',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: UI_CONSTANTS.GAP.MD,
    paddingVertical: UI_CONSTANTS.GAP.LG,
  },
  optionBorder: {
    borderBottomWidth: UI_CONSTANTS.BORDER_WIDTH.THIN,
  },
  optionText: {
    flex: 1,
    fontWeight: UI_CONSTANTS.FONT_WEIGHT.MEDIUM,
  },
});
