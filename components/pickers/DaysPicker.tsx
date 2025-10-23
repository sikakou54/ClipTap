/**
 * 曜日選択ピッカーコンポーネント
 */

import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../lib/themeSystem';
import { BottomSheetModal } from '../UnifiedModal';
import { ModalFooter } from '../ModalFooter';
import { BasePickerProps, PickerOption } from './PickerTypes';
import { useTranslation } from 'react-i18next';

interface DaysPickerProps extends BasePickerProps {
  value?: number[];
  onValueChange: (days: number[]) => void;
  maxSelections?: number;
}

const DaysPicker: React.FC<DaysPickerProps> = ({
  visible,
  onClose,
  title,
  subtitle,
  value,
  onValueChange,
  maxSelections,
  confirmText,
  cancelText,
  showCancel = true,
}) => {
  const { colors, spacing, typography } = useTheme();
  const { t } = useTranslation();
  const [selectedDays, setSelectedDays] = useState<number[]>(value ?? []);

  // プリセット選択肢
  const presetOptions = [
    { label: t('common.weekdays'), value: [1, 2, 3, 4, 5] },
    { label: t('common.weekends'), value: [0, 6] },
    { label: t('common.everyday'), value: [0, 1, 2, 3, 4, 5, 6] },
  ];

  const dayOptions: PickerOption<number>[] = [
    { label: t('common.sunday'), value: 0 },
    { label: t('common.monday'), value: 1 },
    { label: t('common.tuesday'), value: 2 },
    { label: t('common.wednesday'), value: 3 },
    { label: t('common.thursday'), value: 4 },
    { label: t('common.friday'), value: 5 },
    { label: t('common.saturday'), value: 6 },
  ];

  useEffect(() => {
    setSelectedDays(value ?? []);
  }, [value]);

  const handleConfirm = () => {
    onValueChange(selectedDays);
    onClose();
  };

  const handlePresetSelect = (presetDays: number[]) => {
    setSelectedDays(presetDays);
  };

  if (!visible) return null;

  return (
    <BottomSheetModal
      visible={visible}
      onClose={onClose}
      title={title}
      showCloseButton={false}
      showHandle={true}
      maxHeight="60%"
    >
      {subtitle && (
        <Text style={[typography.bodyMedium, {
          color: colors.textSecondary,
          textAlign: 'center',
          marginBottom: spacing.lg
        }]}>
          {subtitle}
        </Text>
      )}

      <ScrollView
        style={{ maxHeight: 400 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ paddingVertical: spacing.sm }}>
          {/* プリセット選択 */}
          <View style={{ marginBottom: spacing.lg }}>
            <Text style={[typography.h4, { color: colors.textPrimary, marginBottom: spacing.sm }]}>
              {t('time.commonPresets', 'よく使う設定')}
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
              {presetOptions.map((preset, index) => (
                <TouchableOpacity
                  key={`preset-${index}`}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: spacing.sm,
                    paddingHorizontal: spacing.md,
                    backgroundColor: colors.primary + '10',
                    borderRadius: 20,
                    borderWidth: 1,
                    borderColor: colors.primary + '30',
                    flexShrink: 1,
                  }}
                  onPress={() => handlePresetSelect(preset.value)}
                >
                  <Ionicons name="flash" size={16} color={colors.primary} style={{ marginRight: spacing.xs }} />
                  <Text style={[typography.caption, {
                    color: colors.primary,
                    fontWeight: '600',
                  }]}>
                    {preset.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* 個別曜日選択 */}
          <View>
            <Text style={[typography.h4, { color: colors.textPrimary, marginBottom: spacing.sm }]}>
              {t('time.individualSelect', '個別選択')}
            </Text>
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              paddingHorizontal: spacing.xs,
            }}>
              {dayOptions.map((option, index) => {
                const isSelected = selectedDays.includes(option.value);
                const canSelect = !maxSelections || selectedDays.length < maxSelections || isSelected;

                return (
                  <TouchableOpacity
                    key={index}
                    style={{
                      alignItems: 'center',
                      justifyContent: 'center',
                      flex: 1,
                      aspectRatio: 1,
                      marginHorizontal: spacing.xs / 2,
                      backgroundColor: isSelected ? colors.primary : colors.surface,
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: isSelected ? colors.primary : colors.border,
                      opacity: canSelect ? 1 : 0.5,
                    }}
                    onPress={() => {
                      if (!canSelect && !isSelected) return;

                      let newSelected = [...selectedDays];
                      if (isSelected) {
                        newSelected = newSelected.filter(v => v !== option.value);
                      } else {
                        newSelected.push(option.value);
                      }
                      setSelectedDays(newSelected);
                    }}
                    disabled={option.disabled}
                  >
                    <Text style={[typography.caption, {
                      color: isSelected ? colors.textInverse : colors.textPrimary,
                      fontWeight: isSelected ? '700' : '600',
                      textAlign: 'center',
                    }]}>
                      {option.label}
                    </Text>
                    {isSelected && (
                      <View style={{
                        position: 'absolute',
                        top: 2,
                        right: 2,
                        width: 12,
                        height: 12,
                        borderRadius: 6,
                        backgroundColor: colors.textInverse,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        <Ionicons
                          name="checkmark"
                          size={8}
                          color={colors.primary}
                        />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </ScrollView>

      <ModalFooter
        onConfirm={handleConfirm}
        onCancel={onClose}
        confirmText={confirmText}
        cancelText={cancelText}
        showCancel={showCancel}
      />
    </BottomSheetModal>
  );
};

export default DaysPicker;
