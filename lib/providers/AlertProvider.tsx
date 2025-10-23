/**
 * アラートプロバイダー
 */

import React, { createContext, useContext, useState, useCallback } from 'react';
import { Modal, View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../themeSystem';
import CommonButton from '../../components/common/CommonButton';

interface AlertOptions {
  title: string;
  message: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
  type?: 'default' | 'warning' | 'danger';
}

interface AlertContextType {
  showAlert: (options: AlertOptions) => void;
  hideAlert: () => void;
}

const AlertContext = createContext<AlertContextType | null>(null);

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within AlertProvider');
  }
  return context;
};

export const AlertProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [visible, setVisible] = useState(false);
  const [options, setOptions] = useState<AlertOptions | null>(null);
  const { colors, spacing, typography } = useTheme();

  const showAlert = useCallback((opts: AlertOptions) => {
    setOptions(opts);
    setVisible(true);
  }, []);

  const hideAlert = useCallback(() => {
    setVisible(false);
    setTimeout(() => setOptions(null), 300);
  }, []);

  const handleConfirm = () => {
    options?.onConfirm?.();
    hideAlert();
  };

  const handleCancel = () => {
    options?.onCancel?.();
    hideAlert();
  };

  const getButtonType = () => {
    switch (options?.type) {
      case 'warning': return 'warning' as const;
      case 'danger': return 'danger' as const;
      default: return 'primary' as const;
    }
  };

  return (
    <AlertContext.Provider value={{ showAlert, hideAlert }}>
      {children}
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={hideAlert}
      >
        <View style={styles.overlay}>
          <View style={[
            styles.alertBox,
            { backgroundColor: colors.surface, borderColor: colors.border }
          ]}>
            <Text style={[
              typography.h3,
              { color: colors.text, marginBottom: spacing.sm }
            ]}>
              {options?.title}
            </Text>
            <Text style={[
              typography.body,
              { color: colors.textSecondary, marginBottom: spacing.xl }
            ]}>
              {options?.message}
            </Text>
            <View style={[styles.buttonRow, { gap: spacing.sm }]}>
              {options?.onCancel && (
                <CommonButton
                  title={options.cancelText || 'キャンセル'}
                  onPress={handleCancel}
                  type="secondary"
                  fullWidth
                />
              )}
              <CommonButton
                title={options?.confirmText || 'OK'}
                onPress={handleConfirm}
                type={getButtonType()}
                fullWidth
              />
            </View>
          </View>
        </View>
      </Modal>
    </AlertContext.Provider>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  alertBox: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
  },
  buttonRow: {
    flexDirection: 'row',
  },
});
