/**
 * 共通コンポーネントのエクスポート
 *
 * apps/mobile/src/components/common/ の全コンポーネントを一括エクスポート。
 * Web版と同じ命名規則でエイリアスを提供。
 */

/* ======================================== */
/* ボタン */
/* ======================================== */
export { CommonButton, type CommonButtonProps, type ButtonType, type ButtonSize } from './CommonButton';

/* ======================================== */
/* 入力フィールド */
/* ======================================== */
export { default as CommonInput, type InputType } from './CommonInput';

/* ======================================== */
/* モーダル */
/* ======================================== */
export { UnifiedModal, type UnifiedModalProps } from './UnifiedModal';

/* ======================================== */
/* その他の共通コンポーネント */
/* ======================================== */
export { Drawer } from './Drawer';
export { default as EmptyState } from './EmptyState';
export { Header } from './Header';
export { default as LoadingSpinner } from './LoadingSpinner';
export { ModalFooter } from './ModalFooter';
export { SplashScreen } from './SplashScreen';
