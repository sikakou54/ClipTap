/**
 * 汎用入力コンポーネント
 *
 * @description
 * 全画面で共通の入力フィールドスタイルを提供。
 * text, password, email 等をサポート。
 */

import { forwardRef } from 'react';
import type { InputHTMLAttributes } from 'react';

/* ========================================
   型定義
   ======================================== */

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'className'> {
  /** ラベル */
  label?: string;
  /** エラーメッセージ */
  error?: string;
  /** 追加のクラス名 */
  className?: string;
  /** 入力フィールドの追加クラス */
  inputClassName?: string;
}

/* ========================================
   定数
   ======================================== */

const BASE_INPUT_CLASSES = `
  w-full px-4 py-3
  border border-gray-300 dark:border-border-default
  rounded-xl
  focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400
  bg-white dark:bg-surface-primary
  text-gray-900 dark:text-white
  placeholder-gray-400 dark:placeholder-text-subtle
  transition-colors
`.trim().replace(/\s+/g, ' ');

const ERROR_INPUT_CLASSES = 'border-red-500 dark:border-red-500 focus:ring-red-500';
const LABEL_CLASSES = 'block text-sm font-medium text-gray-700 dark:text-text-muted mb-2';
const ERROR_MESSAGE_CLASSES = 'mt-1 text-sm text-red-600 dark:text-red-400';

/* ========================================
   コンポーネント
   ======================================== */

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', inputClassName = '', ...props }, ref) => {
    const inputClasses = `
      ${BASE_INPUT_CLASSES}
      ${error ? ERROR_INPUT_CLASSES : ''}
      ${inputClassName}
    `.trim().replace(/\s+/g, ' ');

    /* 汎用入力コンポーネントコンテナ */
    return (
      <div className={className}>
        {/* ラベル（オプション） */}
        {label && (
          <label className={LABEL_CLASSES}>
            {label}
          </label>
        )}
        {/* 入力フィールド */}
        <input
          ref={ref}
          className={inputClasses}
          {...props}
        />
        {/* エラーメッセージ（エラーがある場合のみ表示） */}
        {error && (
          <p className={ERROR_MESSAGE_CLASSES}>
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
