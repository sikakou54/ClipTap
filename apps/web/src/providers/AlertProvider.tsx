/**
 * @module AlertProvider
 * @description
 * Web版のアラートダイアログのProvider
 *
 * sharedのAlertProviderを再エクスポートし、Web版では
 * ブラウザのalert/confirmをデフォルトで使用します。
 *
 * useAlert()フックでアラート機能にアクセスできます。
 */

export {
  AlertProvider,
  useAlert,
  type AlertContextType,
  type AlertOptions,
  type AlertType,
} from '@cliptap/shared';

