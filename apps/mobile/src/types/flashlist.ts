/**
 * FlashList型定義ワークアラウンド
 *
 * @shopify/flash-listの型定義にestimatedItemSizeプロパティが欠けているため、
 * 正しい型定義を提供するワークアラウンド。
 *
 * @see https://shopify.github.io/flash-list/docs/usage
 */

import { FlashList as OriginalFlashList, FlashListProps, FlashListRef } from '@shopify/flash-list';
import type React from 'react';

/**
 * estimatedItemSizeを必須プロパティとして含むFlashList型
 *
 * estimatedItemSizeはリストアイテムの推定高さ/幅（ピクセル単位）を指定するプロパティで、
 * FlashListのビューポート計算とスクロール最適化に必須です。
 * 型レベルで必須化することで設定忘れを防ぎます。
 */
export const FlashList = OriginalFlashList as unknown as <T>(
  props: FlashListProps<T> & { estimatedItemSize: number; ref?: React.Ref<FlashListRef<T>> }
) => React.ReactElement;

export type { FlashListProps, FlashListRef } from '@shopify/flash-list';
export type { ListRenderItemInfo } from '@shopify/flash-list';
