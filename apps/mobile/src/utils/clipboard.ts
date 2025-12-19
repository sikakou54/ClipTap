/**
 * クリップボードユーティリティ
 *
 * クリップボードへのコピー操作と触覚フィードバックを提供します。
 * コピー成功時には軽い振動フィードバック（Haptics.Light）が発生します。
 */

import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { Logger } from '@cliptap/shared';

/**
 * テキストをクリップボードにコピー
 *
 * @param text - コピーするテキスト
 * @throws コピーに失敗した場合
 */
export async function copyToClipboard(text: string): Promise<void> {
  try {
    /* クリップボードにテキストをコピー */
    await Clipboard.setStringAsync(text);
    /* コピー成功時に軽い振動フィードバックを提供（ユーザーに操作完了を通知） */
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch (error) {
    Logger.error('Failed to copy to clipboard:', error);
    throw error;
  }
}

