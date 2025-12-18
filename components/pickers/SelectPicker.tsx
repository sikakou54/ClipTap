/**
 * 選択ピッカーコンポーネント（単一選択・複数選択）
 */

import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../lib/themeSystem';
import { BottomSheetModal } from '../UnifiedModal';
import { ModalFooter } from '../ModalFooter';
import { BasePickerProps, PickerOption, PickerValue } from './PickerTypes';
import { UI_CONSTANTS } from '../../lib/constants/ui';

interface SelectPickerProps<T = PickerValue> extends BasePickerProps {
  options: PickerOption<T>[];
  value?: T | T[];
  onValueChange: (value: T | T[]) => void;
  multiSelect?: boolean;
  maxSelections?: number;
}

const SelectPicker: React.FC<SelectPickerProps> = ({
  visible,
  onClose,
  title,
  subtitle,
  options,
  value,
  onValueChange,
  multiSelect = false,
  maxSelections,
  confirmText,
  cancelText,
  showCancel = true,
  maxHeight = '65%',
}) => {
  const { colors, spacing, typography } = useTheme();
  const [tempValue, setTempValue] = useState(value);
  const [selectedOptions, setSelectedOptions] = useState<PickerValue[]>(
    Array.isArray(value) ? value : []
  );

  useEffect(() => {
    setTempValue(value);
    if (Array.isArray(value)) {
      setSelectedOptions(value);
    }
  }, [value]);

  const handleConfirm = () => {
    const finalValue = multiSelect ? selectedOptions : tempValue;
    if (finalValue !== undefined) {
      onValueChange(finalValue);
    }
    onClose();
  };

  if (!visible) return null;

  if (multiSelect) {
    return (
      <BottomSheetModal
        visible={visible}
        onClose={onClose}
        title={title}
        showCloseButton={false}
        showHandle={true}
        maxHeight={maxHeight}
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

        <ScrollView style={{
          minHeight: 300,
          maxHeight: 350,
          paddingVertical: spacing.md
        }}
        contentContainerStyle={{ paddingBottom: spacing.lg }}
        showsVerticalScrollIndicator={true}>
          {options.map((option, index) => {
            const isSelected = selectedOptions.includes(option.value);
            const canSelect = !maxSelections || selectedOptions.length < maxSelections || isSelected;

            return (
              <TouchableOpacity
                key={index}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: spacing.md,
                  paddingHorizontal: spacing.lg,
                  backgroundColor: isSelected ? colors.primary + '20' : 'transparent',
                  borderRadius: UI_CONSTANTS.BORDER_RADIUS.MD,
                  marginBottom: spacing.xs,
                  opacity: canSelect ? 1 : 0.5,
                }}
                onPress={() => {
                  if (!canSelect && !isSelected) return;

                  let newSelected = [...selectedOptions];
                  if (isSelected) {
                    newSelected = newSelected.filter(v => v !== option.value);
                  } else {
                    newSelected.push(option.value);
                  }
                  setSelectedOptions(newSelected);
                }}
                disabled={option.disabled}
              >
                <View style={{
                  width: 24,
                  height: 24,
                  borderRadius: UI_CONSTANTS.BORDER_RADIUS.BASE,
                  borderWidth: UI_CONSTANTS.BORDER_WIDTH.THICK,
                  borderColor: isSelected ? colors.primary : colors.border,
                  backgroundColor: isSelected ? colors.primary : 'transparent',
                  marginRight: spacing.md,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  {isSelected && (
                    <Ionicons name="checkmark" size={16} color={colors.textInverse} />
                  )}
                </View>
                <Text style={[typography.bodyMedium, {
                  color: isSelected ? colors.primary : colors.textPrimary,
                  fontWeight: isSelected ? UI_CONSTANTS.FONT_WEIGHT.SEMIBOLD : UI_CONSTANTS.FONT_WEIGHT.NORMAL,
                  flex: 1,
                }]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            );
          })}
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
  }

  // 単一選択
  return (
    <BottomSheetModal
      visible={visible}
      onClose={onClose}
      title={title}
      showCloseButton={false}
      showHandle={true}
      maxHeight={maxHeight}
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

      <ScrollView style={{
        minHeight: 280,
        maxHeight: 320,
        paddingVertical: spacing.md
      }}
      contentContainerStyle={{ paddingBottom: spacing.lg }}
      showsVerticalScrollIndicator={true}>
        {options.map((option, index) => {
          const isSelected = tempValue === option.value;

          return (
            <TouchableOpacity
              key={index}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: spacing.lg,
                paddingHorizontal: spacing.lg,
                backgroundColor: isSelected ? colors.primary + '20' : 'transparent',
                borderRadius: UI_CONSTANTS.BORDER_RADIUS.MD,
                marginBottom: spacing.xs,
              }}
              onPress={() => setTempValue(option.value)}
              disabled={option.disabled}
            >
              <View style={{
                width: 24,
                height: 24,
                borderRadius: UI_CONSTANTS.BORDER_RADIUS.BASE,
                borderWidth: UI_CONSTANTS.BORDER_WIDTH.THICK,
                borderColor: isSelected ? colors.primary : colors.border,
                backgroundColor: isSelected ? colors.primary : 'transparent',
                marginRight: spacing.md,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                {isSelected && (
                  <Ionicons name="checkmark" size={16} color={colors.textInverse} />
                )}
              </View>
              <Text style={[typography.bodyLarge, {
                color: isSelected ? colors.primary : colors.textPrimary,
                fontWeight: isSelected ? UI_CONSTANTS.FONT_WEIGHT.SEMIBOLD : UI_CONSTANTS.FONT_WEIGHT.NORMAL,
                flex: 1,
              }]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
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

export default SelectPicker;
