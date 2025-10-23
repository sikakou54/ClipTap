/**
 * 時刻選択ピッカーコンポーネント
 */

import React, { useState, useEffect } from 'react';
import { View, Text } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '../../lib/themeSystem';
import { BottomSheetModal } from '../UnifiedModal';
import { ModalFooter } from '../ModalFooter';
import { BasePickerProps } from './PickerTypes';
import { formatTime } from '../../lib/utils/dateHelpers';

interface TimePickerProps extends BasePickerProps {
  value?: string; // HH:MM format
  onValueChange: (timeString: string) => void;
  format24?: boolean;
}

const TimePicker: React.FC<TimePickerProps> = ({
  visible,
  onClose,
  title,
  subtitle,
  value,
  onValueChange,
  format24 = true,
  confirmText,
  cancelText,
  showCancel = true,
}) => {
  const { colors, spacing, typography } = useTheme();
  const [tempValue, setTempValue] = useState<string>(value || '09:00');

  useEffect(() => {
    setTempValue(value || '09:00');
  }, [value]);

  const timeValue = tempValue ? new Date(`2000-01-01T${tempValue}`) : new Date();

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
        alignItems: 'center',
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.sm
      }}>
        <DateTimePicker
          value={timeValue}
          mode="time"
          is24Hour={format24}
          display="spinner"
          onChange={(_event, selectedTime) => {
            if (selectedTime) {
              const timeString = formatTime(selectedTime);
              setTempValue(timeString);
            }
          }}
          themeVariant={colors.background === '#FFFFFF' ? 'light' : 'dark'}
          style={{
            backgroundColor: colors.surface,
            borderRadius: 12,
            height: 180,
            width: '100%'
          }}
        />
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

export default TimePicker;
