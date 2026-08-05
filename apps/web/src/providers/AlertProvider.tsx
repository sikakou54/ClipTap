/**
 * @module AlertProvider
 * @description
 * Web版のアラートダイアログのProvider
 *
 * sharedのAlertProviderを再エクスポートし、Web版では
 * ブラウザのalert/confirmをデフォルトで使用します。
 *
 * アラート機能を呼び出す側は `@cliptap/shared` の `useAlert()` を直接使用します。
 */

export {
  AlertProvider,
  type AlertContextType,
  type AlertOptions,
  type AlertType,
} from '@cliptap/shared';

