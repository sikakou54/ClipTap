/**
 * ClipTapアプリ用の基底例外クラス
 */

/**
 * エラーの重要度を表す型定義
 * - error: 深刻なエラー（処理を中断する必要がある）
 * - warning: 警告（処理は続行可能だが注意が必要）
 * - info: 情報（エラーではないが通知が必要）
 */
export type ErrorSeverity = 'error' | 'warning' | 'info';

/**
 * ClipTapアプリ用の基底例外クラス
 *
 * すべてのカスタム例外はこのクラスを継承します。
 * `instanceof ClipTapError` で全てのアプリ固有エラーを捕捉できます。
 */
export class ClipTapError extends Error {
  /** エラーコード（i18next翻訳キーとしても使用） */
  readonly code: string;

  /** エラーの重要度（error/warning/info） */
  readonly severity: ErrorSeverity;

  /** 元となった例外（エラーチェーン用） */
  readonly cause?: unknown;

  constructor(message: string, code: string, severity: ErrorSeverity = 'error', cause?: unknown) {
    super(message);
    this.name = 'ClipTapError';
    this.code = code;
    this.severity = severity;
    this.cause = cause;

    Object.setPrototypeOf(this, new.target.prototype);
  }
}
