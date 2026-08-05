/**
 * @module PickerTypes
 * @description
 * ピッカーコンポーネント共通の型定義
 *
 * ピッカーコンポーネントで使用される共通の型定義を提供。
 *
 * 使用箇所:
 * - DatePicker
 *
 * @see UnifiedModal - ピッカーが利用するモーダルコンポーネント
 */

import { DimensionValue } from 'react-native';
import { ReactNode } from 'react';

/* ======================================== */
/* 値の型定義 */
/* ======================================== */

/**
 * ピッカーで選択可能な値の型
 * 文字列、数値、真偽値、日付に対応
 */
export type PickerValue = string | number | boolean | Date;

/**
 * ピッカーの選択オプション
 * @template T - オプションの値の型（デフォルト: PickerValue）
 */
export interface PickerOption<T = PickerValue> {
  /** 表示ラベル */
  label: string;
  /** 実際の値 */
  value: T;
  /** 選択不可フラグ（グレーアウト表示） */
  disabled?: boolean;
  /** 補足説明テキスト */
  description?: string;
}

/* ======================================== */
/* Props型定義 */
/* ======================================== */

/**
 * ピッカー基底Props
 * 全てのピッカーコンポーネントで共通のプロパティ
 */
export interface BasePickerProps {
  /** モーダルの表示状態 */
  visible: boolean;
  /** 閉じる時のコールバック */
  onClose: () => void;
  /** モーダルのタイトル */
  title: string;
  /** サブタイトル（オプション） */
  subtitle?: string;
  /** 確定ボタンのテキスト（デフォルト: '確定'） */
  confirmText?: string;
  /** キャンセルボタンのテキスト（デフォルト: 'キャンセル'） */
  cancelText?: string;
  /** キャンセルボタンの表示（デフォルト: true） */
  showCancel?: boolean;
  /** モーダルコンテンツの最大高さ */
  maxHeight?: DimensionValue;
}

/**
 * ピッカーモーダルProps
 * 共通モーダルラッパーコンポーネント用のプロパティ
 */
export interface PickerModalProps extends BasePickerProps {
  /** モーダル内に表示するコンテンツ */
  children: ReactNode;
  /** 確定ボタン押下時のコールバック */
  onConfirm: () => void;
  /** モーダルコンテンツの最大高さ（オーバーライド用） */
  maxHeight?: DimensionValue;
}
