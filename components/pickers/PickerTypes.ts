/**
 * ピッカー共通型定義
 */

import { DimensionValue } from 'react-native';
import { ReactNode } from 'react';

export type PickerValue = string | number | boolean | Date;

export interface PickerOption<T = PickerValue> {
  label: string;
  value: T;
  disabled?: boolean;
  description?: string;
}

export interface BasePickerProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  confirmText?: string;
  cancelText?: string;
  showCancel?: boolean;
  maxHeight?: DimensionValue;
}

export interface PickerModalProps extends BasePickerProps {
  children: ReactNode;
  onConfirm: () => void;
  maxHeight?: DimensionValue;
}
