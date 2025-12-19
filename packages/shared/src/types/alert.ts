/**
 * アラート関連の共通型定義
 *
 * Mobile/Web共通で使用するアラートの型を定義します。
 */

/**
 * アラートのタイプ
 *
 * - info: 情報表示用
 * - warning: 警告表示用
 * - error: エラー表示用
 * - danger: 危険な操作（削除など）の確認用
 */
export type AlertType = 'info' | 'warning' | 'error' | 'danger';

/**
 * 基本アラートオプション
 */
export interface BaseAlertOptions {
  title?: string;
  message: string;
  buttonText?: string;
  onClose?: () => void;
}

/**
 * 確認ダイアログオプション
 */
export interface ConfirmOptions {
  message: string;
  onConfirm: () => void;
  onCancel?: () => void;
  type?: AlertType;
}
