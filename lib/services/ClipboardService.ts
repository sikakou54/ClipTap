import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { Logger } from '../logger';
import { Snippet } from '../types/snippet';

export class ClipboardService {
  /**
   * テキストをクリップボードにコピー
   */
  async copyToClipboard(text: string): Promise<void> {
    try {
      await Clipboard.setStringAsync(text);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      Logger.error('Failed to copy to clipboard:', error);
      throw error;
    }
  }

  /**
   * スニペットをクリップボードにコピー（タイトル付き/なし対応）
   */
  async copySnippetToClipboard(snippet: Snippet): Promise<void> {
    try {
      let textToCopy: string;

      if (snippet.copyWithTitle && snippet.title) {
        // タイトル付きでコピー（タイトルと内容を改行で結合）
        textToCopy = `${snippet.title}\n${snippet.content}`;
      } else {
        // 内容のみコピー
        textToCopy = snippet.content;
      }

      await Clipboard.setStringAsync(textToCopy);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      Logger.error('Failed to copy snippet to clipboard:', error);
      throw error;
    }
  }

  async getFromClipboard(): Promise<string> {
    try {
      const text = await Clipboard.getStringAsync();
      return text;
    } catch (error) {
      Logger.error('Failed to get from clipboard:', error);
      throw error;
    }
  }

  async hasString(): Promise<boolean> {
    try {
      return await Clipboard.hasStringAsync();
    } catch (error) {
      Logger.error('Failed to check clipboard:', error);
      return false;
    }
  }
}

export const clipboardService = new ClipboardService();
