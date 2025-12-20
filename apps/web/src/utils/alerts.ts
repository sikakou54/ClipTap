/**
 * @module alerts
 * @description
 * Web版アラート表示ユーティリティ
 *
 * window.alert/window.confirmのラッパーとして実装。
 * Mobile版とAPI互換性を保つために、同じインターフェースを提供します。
 *
 * 主な機能:
 * - 確認ダイアログ（showConfirm）
 * - カスタムアラート（showAlert）
 * - エラーアラート（showErrorAlert）
 *
 * i18nextとの統合:
 * 翻訳キーを受け取る関数は、内部でI18nAdapterを使用して翻訳します。
 * 翻訳済みメッセージを受け取る関数も提供されています。
 */

import { getI18nAdapter } from '@cliptap/shared';

/* ======================================== */
/* 内部ヘルパー関数 */
/* ======================================== */

/**
 * 単一ボタンのアラートを表示する内部関数
 */
const showSingleButtonAlert = (title: string, message: string, onClose?: () => void): void => {
  /* タイトルとメッセージを結合 */
  const fullMessage = title ? `${title}\n\n${message}` : message;
  window.alert(fullMessage);
  onClose?.();
};

/**
 * 確認ダイアログを表示する内部関数
 */
const showConfirmAlert = (message: string, onConfirm: () => void, onCancel?: () => void): void => {
  const confirmed = window.confirm(message);
  if (confirmed) {
    onConfirm();
  } else {
    onCancel?.();
  }
};

/* ======================================== */
/* 公開API */
/* ======================================== */

/**
 * 確認ダイアログを表示
 *
 * @param messageKey - i18next翻訳キー（確認メッセージ）
 * @param onConfirm - OKボタンが押された時のコールバック
 * @param onCancel - キャンセルボタンが押された時のコールバック
 */
export const showConfirm = (
  messageKey: string,
  onConfirm: () => void,
  onCancel?: () => void
): void => {
  try {
    const i18nAdapter = getI18nAdapter();
    const message = i18nAdapter.translate(messageKey);
    showConfirmAlert(message, onConfirm, onCancel);
  } catch {
    /* I18nAdapterが未登録の場合はキーをそのまま使用 */
    showConfirmAlert(messageKey, onConfirm, onCancel);
  }
};

/**
 * 確認ダイアログを表示（翻訳済みメッセージ版）
 *
 * 既に翻訳済みのメッセージを受け取ります。
 * この関数は、translateError()などで翻訳済みのメッセージを表示する際に使用します。
 *
 * @param message - 確認メッセージ（翻訳済み）
 * @param onConfirm - OKボタンが押された時のコールバック
 * @param onCancel - キャンセルボタンが押された時のコールバック
 */
export const showConfirmMessage = (
  message: string,
  onConfirm: () => void,
  onCancel?: () => void
): void => {
  showConfirmAlert(message, onConfirm, onCancel);
};

/**
 * カスタムアラートを表示
 *
 * 任意のタイトル・メッセージでAlertダイアログを表示します。
 * 翻訳済みテキストを表示する場合に使用します。
 *
 * @param title - アラートタイトル
 * @param message - アラートメッセージ
 * @param onClose - ボタンが押された時のコールバック
 */
export const showAlert = (title: string, message: string, onClose?: () => void): void => {
  showSingleButtonAlert(title || '', message, onClose);
};

/**
 * エラーアラートダイアログを表示
 *
 * window.alertを使用してエラーメッセージを表示します。
 * タイトルは自動的に「エラー」になります。
 *
 * この関数は、translateError()で翻訳済みのエラーメッセージを受け取ることを想定しています。
 *
 * @param message - エラーメッセージ（翻訳済み）
 * @param onClose - OKボタンが押された時のコールバック
 */
export const showErrorAlert = (message: string, onClose?: () => void): void => {
  try {
    const i18nAdapter = getI18nAdapter();
    const title = i18nAdapter.translate('common.error');
    showSingleButtonAlert(title, message, onClose);
  } catch {
    /* I18nAdapterが未登録の場合はデフォルトタイトルを使用 */
    showSingleButtonAlert('エラー', message, onClose);
  }
};

