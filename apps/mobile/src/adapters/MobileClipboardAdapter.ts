/**
 * Mobile用クリップボードアダプター
 *
 * @description
 * expo-clipboardとexpo-hapticsをラップして、共通ClipboardAdapterインターフェースを実装。
 * コピー時には触覚フィードバック（Haptics.Light）が発生。
 *
 * @module MobileClipboardAdapter
 */

import * as Clipboard from 'expo-clipboard';
import type { ClipboardAdapter } from '@cliptap/shared';
import { Logger } from '@cliptap/shared';
import { copyToClipboard } from '@utils/clipboard';

/**
 * Mobile用ClipboardAdapter実装クラス
 */
export class MobileClipboardAdapter implements ClipboardAdapter {
  /**
   * テキストをクリップボードにコピー
   * コピー成功時には軽い振動フィードバックが発生
   *
   * @param text - コピーするテキスト
   */
  async copy(text: string): Promise<void> {
    /* ユーティリティ関数経由でコピー（Haptics.Lightの振動フィードバックを含む） */
    await copyToClipboard(text);
  }

  /**
   * クリップボードからテキストを読み取る
   *
   * @returns クリップボードの内容（エラー時は例外をスロー）
   */
  async read(): Promise<string> {
    try {
      return await Clipboard.getStringAsync();
    } catch (error) {
      Logger.error('Failed to read from clipboard:', error);
      throw error;
    }
  }

  /**
   * クリップボードにテキストが存在するか確認
   *
   * @returns テキストが存在する場合はtrue（エラー時はfalseを返す）
   */
  async hasText(): Promise<boolean> {
    try {
      return await Clipboard.hasStringAsync();
    } catch (error) {
      Logger.error('Failed to check clipboard:', error);
      return false;
    }
  }
}

