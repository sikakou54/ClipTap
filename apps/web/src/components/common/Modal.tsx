/**
 * 汎用モーダルコンポーネント
 *
 * @description
 * 全モーダルで共通のオーバーレイとコンテナ構造を提供。
 * ExportModal, SnippetEditModal, VariableEditModal 等で使用。
 *
 * アクセシビリティ対応:
 * - ESCキーでモーダルを閉じる
 * - aria-labelによる支援技術への情報提供
 * - モーダル表示中は背景のスクロールをロック
 */

import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { useBodyScrollLock } from '@hooks/useBodyScrollLock';

/* ========================================
   型定義
   ======================================== */

export interface ModalProps {
  /** モーダル表示状態 */
  isOpen: boolean;
  /** 閉じる時のコールバック関数 */
  onClose: () => void;
  /** 子要素 */
  children: ReactNode;
  /** 最大幅（sm=384px, md=448px, lg=512px, xl=576px, 2xl=672px） */
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  /** オーバーレイクリックで閉じるか（デフォルト: true） */
  closeOnOverlayClick?: boolean;
}

interface ModalHeaderProps {
  children: ReactNode;
}

interface ModalTitleProps {
  children: ReactNode;
}

interface ModalCloseButtonProps {
  onClick: () => void;
}

interface ModalBodyProps {
  children: ReactNode;
  className?: string;
}

interface ModalFooterProps {
  children: ReactNode;
}

/* ========================================
   定数
   ======================================== */

const MAX_WIDTH_CLASSES = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
} as const;

/* ========================================
   サブコンポーネント
   ======================================== */

function ModalHeader({ children }: ModalHeaderProps) {
  /* モーダルヘッダー（タイトルと閉じるボタンのコンテナ） */
  return (
    <div className="flex items-center justify-between mb-4">
      {children}
    </div>
  );
}

function ModalTitle({ children }: ModalTitleProps) {
  /* モーダルタイトル */
  return (
    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
      {children}
    </h2>
  );
}

function ModalCloseButton({ onClick }: ModalCloseButtonProps) {
  /* モーダル閉じるボタン（×アイコン） */
  return (
    <button
      onClick={onClick}
      className="p-2 text-gray-400 dark:text-text-subtle hover:text-gray-600 dark:hover:text-text-muted hover:bg-gray-100 dark:hover:bg-surface-secondary rounded-lg transition-colors"
      aria-label="Close"
    >
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  );
}

function ModalBody({ children, className = '' }: ModalBodyProps) {
  /* モーダル本文（コンテンツエリア） */
  return (
    <div className={`mb-6 ${className}`}>
      {children}
    </div>
  );
}

function ModalFooter({ children }: ModalFooterProps) {
  /* モーダルフッター（アクションボタンエリア） */
  return (
    <div className="flex gap-3">
      {children}
    </div>
  );
}

/* ========================================
   メインコンポーネント
   ======================================== */

export function Modal({
  isOpen,
  onClose,
  children,
  maxWidth = 'md',
  closeOnOverlayClick = true,
}: ModalProps) {
  useBodyScrollLock(isOpen);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleOverlayClick = () => {
    if (closeOnOverlayClick) {
      onClose();
    }
  };

  /* モーダルオーバーレイ（背景クリックで閉じる、ESCキーでも閉じる） */
  return (
    <div
      className="fixed inset-0 bg-black/50 dark:bg-black/80 flex items-center justify-center p-4 z-50"
      onClick={handleOverlayClick}
    >
      {/* モーダルコンテナ（最大幅制限、クリックイベントの伝播を停止） */}
      <div
        className={`bg-white dark:bg-surface-primary rounded-2xl ${MAX_WIDTH_CLASSES[maxWidth]} w-full p-6`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

Modal.Header = ModalHeader;
Modal.Title = ModalTitle;
Modal.CloseButton = ModalCloseButton;
Modal.Body = ModalBody;
Modal.Footer = ModalFooter;
