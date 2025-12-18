/**
 * アラートユーティリティ
 * 標準のAlert.alertとToastを使用
 */

import { Alert } from 'react-native';
import i18next from '../i18n/config';

// ToastProviderへの参照を保持するためのグローバル変数
let toastShowFunction: ((options: { message: string; type?: 'success' | 'error' | 'info' | 'warning'; duration?: number }) => void) | null = null;

/**
 * Toastの表示関数を登録（ToastProviderから呼ばれる）
 */
export const registerToastShow = (showFn: typeof toastShowFunction) => {
  toastShowFunction = showFn;
};

/**
 * エラーアラートを表示（Toastを使用）
 */
export const showError = (messageKey?: string, details?: string) => {
  const message = messageKey ? i18next.t(messageKey) : i18next.t('error.generic');
  const fullMessage = details ? `${message}\n${details}` : message;

  if (toastShowFunction) {
    toastShowFunction({ message: fullMessage, type: 'error', duration: 3000 });
  }
};

/**
 * 成功アラートを表示（Toastを使用）
 */
export const showSuccess = (messageKey: string) => {
  const message = i18next.t(messageKey);

  if (toastShowFunction) {
    toastShowFunction({ message, type: 'success', duration: 2000 });
  }
};

/**
 * 確認ダイアログを表示
 */
export const showConfirm = (
  messageKey: string,
  onConfirm: () => void,
  onCancel?: () => void,
  type: 'warning' | 'danger' | 'info' = 'warning'
) => {
  const message = i18next.t(messageKey);

  // Androidでテキストが切れないように、タイトルとメッセージの両方を設定
  Alert.alert(
    '', // タイトルは空に
    message, // メッセージを第2引数に
    [
      {
        text: i18next.t('common.cancel'),
        style: 'cancel',
        onPress: onCancel,
      },
      {
        text: i18next.t('common.ok'),
        style: type === 'danger' ? 'destructive' : 'default',
        onPress: onConfirm,
      },
    ]
  );
};

/**
 * 情報アラートを表示
 */
export const showInfo = (
  messageKey: string,
  titleKey?: string,
  type: 'info' | 'success' | 'error' | 'warning' = 'info',
  onClose?: () => void
) => {
  const message = i18next.t(messageKey);

  // titleKeyがある場合はタイトルとメッセージの両方を表示
  // ない場合はメッセージを第2引数に（Androidでテキストが切れないように）
  if (titleKey) {
    const title = i18next.t(titleKey);
    Alert.alert(title, message, [
      {
        text: i18next.t('common.ok'),
        onPress: onClose,
      },
    ]);
  } else {
    // タイトルを空にして、メッセージを第2引数に設定
    Alert.alert('', message, [
      {
        text: i18next.t('common.ok'),
        onPress: onClose,
      },
    ]);
  }
};

/**
 * カスタムアラートを表示
 */
export const showAlert = (
  title: string,
  message: string,
  buttonText?: string,
  type: 'info' | 'success' | 'error' | 'warning' = 'info',
  onClose?: () => void
) => {
  // タイトルとメッセージを適切に表示
  // Androidでテキストが切れないように、常にメッセージを第2引数に設定
  Alert.alert(
    title || '', // タイトルがない場合は空文字
    message,
    [
      {
        text: buttonText || i18next.t('common.ok'),
        onPress: onClose,
      },
    ]
  );
};
