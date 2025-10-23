import { View } from 'react-native';
import { useTheme } from '../lib/themeSystem';
import CommonButton, { ButtonType } from './common/CommonButton';
import { useTranslation } from 'react-i18next';

interface ModalFooterProps {
  onConfirm: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
  confirmDisabled?: boolean;
  showCancel?: boolean;
  confirmType?: ButtonType;
}

export const ModalFooter = ({
  onConfirm,
  onCancel,
  confirmText,
  cancelText,
  confirmDisabled = false,
  showCancel = true,
  confirmType = 'primary'
}: ModalFooterProps) => {
  const { spacing } = useTheme();
  const { t } = useTranslation();

  const finalConfirmText = confirmText || t('common.confirm');
  const finalCancelText = cancelText || t('common.cancel');

  return (
    <View style={{
      flexDirection: 'row',
      gap: spacing.md,
      marginTop: spacing.lg,
      paddingBottom: spacing.md
    }}>
      {showCancel && onCancel && (
        <View style={{ flex: 1 }}>
          <CommonButton
            title={finalCancelText}
            onPress={onCancel}
            type="secondary"
            size="medium"
            fullWidth
          />
        </View>
      )}
      <View style={{ flex: 1 }}>
        <CommonButton
          title={finalConfirmText}
          onPress={onConfirm}
          type={confirmType}
          size="medium"
          fullWidth
          disabled={confirmDisabled}
        />
      </View>
    </View>
  );
};

export default ModalFooter;