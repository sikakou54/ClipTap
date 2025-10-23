/**
 * 数値選択ピッカーコンポーネント
 */

import React, { useState, useEffect } from 'react';
import { View, Text } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useTheme } from '../../lib/themeSystem';
import { BottomSheetModal } from '../UnifiedModal';
import { ModalFooter } from '../ModalFooter';
import { BasePickerProps } from './PickerTypes';

interface NumberPickerProps extends BasePickerProps {
  value?: number;
  onValueChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
}

const NumberPicker: React.FC<NumberPickerProps> = ({
  visible,
  onClose,
  title,
  subtitle,
  value,
  onValueChange,
  min = 0,
  max = 100,
  step = 1,
  unit = '',
  confirmText,
  cancelText,
  showCancel = true,
}) => {
  const { colors, spacing, typography } = useTheme();
  const [tempValue, setTempValue] = useState<number>(value || min);

  useEffect(() => {
    setTempValue(value || min);
  }, [value, min]);

  const generateNumberOptions = () => {
    const options = [];
    for (let i = min; i <= max; i += step) {
      options.push({
        label: `${i}${unit}`,
        value: i,
      });
    }
    return options;
  };

  const numberOptions = generateNumberOptions();

  const handleConfirm = () => {
    onValueChange(tempValue);
    onClose();
  };

  if (!visible) return null;

  return (
    <BottomSheetModal
      visible={visible}
      onClose={onClose}
      title={title}
      showCloseButton={false}
      showHandle={true}
      maxHeight="50%"
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

      <View style={{
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.sm,
        minHeight: 180
      }}>
        <Picker
          selectedValue={tempValue}
          onValueChange={(itemValue) => setTempValue(itemValue)}
          style={{
            color: colors.textPrimary,
            backgroundColor: colors.surface,
            height: 180,
            width: '100%'
          }}
          itemStyle={{
            color: colors.textPrimary,
            fontSize: 18,
            height: 120
          }}
        >
          {numberOptions.map((option, index) => (
            <Picker.Item
              key={index}
              label={option.label}
              value={option.value}
              color={colors.textPrimary}
            />
          ))}
        </Picker>
      </View>

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

export default NumberPicker;
