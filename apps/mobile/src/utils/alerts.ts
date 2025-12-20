/**
 * モバイルアプリ向けアラート表示ユーティリティ
 *
 * React Native標準のAlertを使用した各種ダイアログ表示機能を提供します。
 * すべてのメッセージはi18nextを通じて多言語対応されています。
 */

import { Alert, AlertButton } from 'react-native';
import i18next from '@i18n/config';
import type { AlertType } from '@cliptap/shared';

export type { AlertType, BaseAlertOptions, ConfirmOptions } from '@cliptap/shared';

/**
 * 単一ボタンのアラートを表示
 */
const showSingleButtonAlert = (
  title: string,
  message: string,
  buttonText?: string,
  onClose?: () => void
): void => {
  Alert.alert(title, message, [
    {
      text: buttonText || i18next.t('common.ok'),
      onPress: onClose,
    },
  ]);
};

/**
 * 確認ダイアログを表示
 */
const showConfirmAlert = (
  message: string,
  onConfirm: () => void,
  onCancel?: () => void,
  isDestructive = false
): void => {
  const buttons: AlertButton[] = [
    {
      text: i18next.t('common.cancel'),
      style: 'cancel',
      onPress: onCancel,
    },
    {
      text: i18next.t('common.ok'),
      style: isDestructive ? 'destructive' : 'default',
      onPress: onConfirm,
    },
  ];

  Alert.alert('', message, buttons);
};

/**
 * 確認ダイアログを表示
 *
 * @param messageKey - i18next翻訳キー
 * @param onConfirm - OKボタン押下時のコールバック
 * @param onCancel - キャンセルボタン押下時のコールバック
 * @param type - ダイアログのタイプ（dangerは削除確認など）
 */
export const showConfirm = (
  messageKey: string,
  onConfirm: () => void,
  onCancel?: () => void,
  type: AlertType = 'warning'
): void => {
  const message = i18next.t(messageKey);
  showConfirmAlert(message, onConfirm, onCancel, type === 'danger');
};

/**
 * 情報アラートを表示
 *
 * @param messageKey - i18next翻訳キー（メッセージ本文）
 * @param titleKey - i18next翻訳キー（タイトル、省略可）
 * @param onClose - OKボタン押下時のコールバック
 */
export const showInfo = (
  messageKey: string,
  titleKey?: string,
  onClose?: () => void
): void => {
  const message = i18next.t(messageKey);
  const title = titleKey ? i18next.t(titleKey) : '';
  showSingleButtonAlert(title, message, undefined, onClose);
};

/**
 * カスタムアラートを表示
 *
 * i18nextを通さない生のテキストを表示する場合に使用します。
 *
 * @param title - アラートタイトル
 * @param message - アラートメッセージ
 * @param buttonText - ボタンテキスト（省略時は'common.ok'の翻訳）
 * @param onClose - ボタン押下時のコールバック
 */
export const showAlert = (
  title: string,
  message: string,
  buttonText?: string,
  onClose?: () => void
): void => {
  showSingleButtonAlert(title || '', message, buttonText, onClose);
};

/**
 * エラーアラートを表示
 *
 * タイトルは自動的に「エラー」（common.error）になります。
 *
 * @param message - エラーメッセージ（翻訳済み）
 * @param onClose - OKボタン押下時のコールバック
 */
export const showErrorAlert = (
  message: string,
  onClose?: () => void
): void => {
  showSingleButtonAlert(i18next.t('common.error'), message, undefined, onClose);
};

/**
 * 警告アラートを表示
 *
 * タイトルは自動的に「警告」（common.warning）になります。
 *
 * @param message - 警告メッセージ（翻訳済み）
 * @param onClose - OKボタン押下時のコールバック
 */
export const showWarningAlert = (
  message: string,
  onClose?: () => void
): void => {
  showSingleButtonAlert(i18next.t('common.warning'), message, undefined, onClose);
};
