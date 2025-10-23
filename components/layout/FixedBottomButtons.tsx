/**
 * 固定ボトムボタンコンポーネント
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../../lib/themeSystem';
import CommonButton from '../common/CommonButton';

interface FixedBottomButtonsProps {
  onCancel?: () => void;
  onSave: () => void;
  cancelLabel?: string;
  saveLabel?: string;
  loading?: boolean;
  disabled?: boolean;
  saveType?: 'primary' | 'success' | 'danger';
}

const FixedBottomButtons: React.FC<FixedBottomButtonsProps> = ({
  onCancel,
  onSave,
  cancelLabel = 'キャンセル',
  saveLabel = '保存',
  loading = false,
  disabled = false,
  saveType = 'primary',
}) => {
  const { colors, spacing } = useTheme();

  return (
    <View style={[
      styles.container,
      {
        backgroundColor: colors.background,
        borderTopColor: colors.border,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        gap: spacing.sm,
      }
    ]}>
      {onCancel && (
        <CommonButton
          title={cancelLabel}
          onPress={onCancel}
          type="secondary"
          size="large"
          fullWidth
          disabled={loading}
        />
      )}
      <CommonButton
        title={saveLabel}
        onPress={onSave}
        type={saveType}
        size="large"
        fullWidth
        loading={loading}
        disabled={disabled}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
});

export default FixedBottomButtons;
