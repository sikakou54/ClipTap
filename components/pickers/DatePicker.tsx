/**
 * 日付ピッカーコンポーネント
 */

import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../lib/themeSystem';
import { BottomSheetModal } from '../UnifiedModal';
import { ModalFooter } from '../ModalFooter';

interface DatePickerProps {
  label?: string;
  value: Date;
  onChange: (date: Date) => void;
  minimumDate?: Date;
  maximumDate?: Date;
}

const DatePicker: React.FC<DatePickerProps> = ({
  label,
  value,
  onChange,
  minimumDate,
  maximumDate,
}) => {
  const { t } = useTranslation();
  const { colors, spacing, typography } = useTheme();
  const [showPicker, setShowPicker] = useState(false);
  const [tempDate, setTempDate] = useState(value);

  useEffect(() => {
    setTempDate(value);
  }, [value]);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const handlePress = () => {
    setTempDate(value);
    setShowPicker(true);
  };

  const handleChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
      if (event.type === 'set' && selectedDate) {
        onChange(selectedDate);
      }
    } else {
      if (selectedDate) {
        setTempDate(selectedDate);
      }
    }
  };

  const handleConfirm = () => {
    onChange(tempDate);
    setShowPicker(false);
  };

  const handleCancel = () => {
    setShowPicker(false);
  };

  return (
    <View>
      {label && (
        <Text style={[typography.label, { color: colors.text, marginBottom: spacing.xs }]}>
          {label}
        </Text>
      )}

      <TouchableOpacity
        onPress={handlePress}
        style={[
          styles.button,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            paddingHorizontal: spacing.sm,
            paddingVertical: spacing.sm,
          }
        ]}
      >
        <Ionicons name="calendar-outline" size={20} color={colors.textSecondary} />
        <Text style={[typography.body, { color: colors.text, marginLeft: spacing.sm }]}>
          {formatDate(value)}
        </Text>
      </TouchableOpacity>

      {Platform.OS === 'ios' && (
        <BottomSheetModal
          visible={showPicker}
          onClose={handleCancel}
          title={t('common.select_date')}
          showCloseButton={false}
          showHandle={true}
          maxHeight="50%"
        >
          <View style={styles.pickerContainer}>
            <DateTimePicker
              value={tempDate}
              mode="date"
              display="spinner"
              onChange={handleChange}
              minimumDate={minimumDate}
              maximumDate={maximumDate}
              locale="ja-JP"
              style={styles.picker}
              themeVariant={colors.background === '#FFFFFF' ? 'light' : 'dark'}
            />
          </View>

          <ModalFooter
            onConfirm={handleConfirm}
            onCancel={handleCancel}
            confirmText={t('common.confirm_button')}
            cancelText={t('common.cancel')}
            showCancel={true}
          />
        </BottomSheetModal>
      )}

      {Platform.OS === 'android' && showPicker && (
        <DateTimePicker
          value={value}
          mode="date"
          display="default"
          onChange={handleChange}
          minimumDate={minimumDate}
          maximumDate={maximumDate}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    height: 44,
  },
  pickerContainer: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 16,
  },
  picker: {
    width: '100%',
    height: 200,
  },
});

export default DatePicker;
