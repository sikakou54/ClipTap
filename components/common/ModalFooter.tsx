/**
 * @module ModalFooter
 * @description
 * モーダルフッターコンポーネント
 *
 * モーダル下部に表示する確定/キャンセルボタンを提供。
 * 統一されたレイアウトとスタイルでモーダルの操作エリアを構成。
 *
 * 機能:
 * - 確定ボタン（必須）
 * - キャンセルボタン（オプション）
 * - ボタンタイプのカスタマイズ（danger等）
 * - 確定ボタンの無効化
 *
 * @see UnifiedModal - 親モーダルコンポーネント
 * @see CommonButton - ボタンコンポーネント
 */

import { View } from 'react-native';
import { useTheme } from '@lib/themeSystem';
import { CommonButton, ButtonType } from './CommonButton';
import { useTranslation } from '@cliptap/shared';

/*
 * ========================================
 * Props定義
 * ========================================
 */

/**
 * ModalFooterのProps
 * @property onConfirm - 確定ボタン押下時のコールバック
 * @property onCancel - キャンセルボタン押下時のコールバック
 * @property confirmText - 確定ボタンのテキスト（デフォルト: '確定'）
 * @property cancelText - キャンセルボタンのテキスト（デフォルト: 'キャンセル'）
 * @property confirmDisabled - 確定ボタンを無効化するか
 * @property showCancel - キャンセルボタンを表示するか（デフォルト: true）
 * @property confirmType - 確定ボタンのタイプ（デフォルト: 'primary'）
 */
interface ModalFooterProps {
  onConfirm: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
  confirmDisabled?: boolean;
  showCancel?: boolean;
  confirmType?: ButtonType;
}

/*
 * ========================================
 * コンポーネント
 * ========================================
 */

/**
 * モーダルフッターコンポーネント
 *
 * キャンセル/確定ボタンを横並びで表示。
 * flexで均等幅に配置。
 */
export const ModalFooter = ({
  onConfirm,
  onCancel,
  confirmText,
  cancelText,
  confirmDisabled = false,
  showCancel = true,
  confirmType = 'primary'
}: ModalFooterProps) => {
  /*
   * ========================================
   * Hooks & コンテキスト
   * ========================================
   */
  const { spacing } = useTheme();
  const { t } = useTranslation();

  const finalConfirmText = confirmText || t('common.confirm');
  const finalCancelText = cancelText || t('common.cancel');

  /*
   * ========================================
   * レンダリング
   * ========================================
   */

  /* モーダルフッター（キャンセル/確定ボタン） */
  return (
    <View style={{
      flexDirection: 'row',
      gap: spacing.md,
      marginTop: spacing.lg,
      paddingBottom: spacing.md
    }}>
      {/* キャンセルボタン（オプション） */}
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
      {/* 確定ボタン */}
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