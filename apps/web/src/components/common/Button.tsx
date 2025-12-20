/**
 * 汎用ボタンコンポーネント
 *
 * @description
 * 全画面で共通のボタンスタイルを提供。
 * primary, secondary, danger の3バリエーション。
 */

import type { ReactNode, ButtonHTMLAttributes } from 'react';
import { LoadingSpinner } from './LoadingSpinner';

/* ========================================
   型定義
   ======================================== */

export type ButtonVariant = 'primary' | 'secondary' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className'> {
  /** ボタンバリアント（デフォルト: primary） */
  variant?: ButtonVariant;
  /** ボタンサイズ（デフォルト: md） */
  size?: ButtonSize;
  /** 子要素 */
  children: ReactNode;
  /** ローディング状態（trueの場合、スピナーを表示してボタンを無効化） */
  loading?: boolean;
  /** フル幅表示 */
  fullWidth?: boolean;
  /** 追加のクラス名 */
  className?: string;
}

/* ========================================
   定数
   ======================================== */

/* 全バリアント共通のベースクラス（フォント、角丸、トランジション、フォーカスアウトライン） */
const BASE_CLASSES = 'font-medium rounded-xl transition-colors focus:outline-none';

/* バリアント別のクラス（有効時と無効時で異なるスタイルを適用） */
const VARIANT_CLASSES: Record<ButtonVariant, { enabled: string; disabled: string }> = {
  primary: {
    enabled: 'bg-blue-600 dark:bg-blue-500 text-white hover:bg-blue-700 dark:hover:bg-blue-600',
    disabled: 'bg-gray-300 dark:bg-surface-secondary text-gray-500 dark:text-text-subtle cursor-not-allowed',
  },
  secondary: {
    enabled: 'border border-gray-300 dark:border-border-default text-gray-700 dark:text-text-muted hover:bg-gray-50 dark:hover:bg-surface-secondary',
    disabled: 'border border-gray-200 dark:border-border-default text-gray-400 dark:text-text-subtle cursor-not-allowed',
  },
  danger: {
    enabled: 'bg-red-600 dark:bg-red-500 text-white hover:bg-red-700 dark:hover:bg-red-600',
    disabled: 'bg-gray-300 dark:bg-surface-secondary text-gray-500 dark:text-text-subtle cursor-not-allowed',
  },
};

/* サイズ別のクラス（パディングとフォントサイズを調整） */
const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'py-2 px-3 text-sm',
  md: 'py-3 px-4',
  lg: 'py-4 px-6 text-lg',
};

/* ========================================
   コンポーネント
   ======================================== */

export function Button({
  variant = 'primary',
  size = 'md',
  children,
  loading = false,
  fullWidth = false,
  disabled,
  className = '',
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const variantClasses = isDisabled
    ? VARIANT_CLASSES[variant].disabled
    : VARIANT_CLASSES[variant].enabled;

  /* 汎用ボタンコンポーネント */
  return (
    <button
      className={`
        ${BASE_CLASSES}
        ${variantClasses}
        ${SIZE_CLASSES[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `.trim().replace(/\s+/g, ' ')}
      disabled={isDisabled}
      {...props}
    >
      {/* ローディング状態（スピナー + テキスト） */}
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <LoadingSpinner size="small" />
          {children}
        </span>
      ) : (
        children
      )}
    </button>
  );
}
