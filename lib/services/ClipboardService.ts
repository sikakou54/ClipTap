import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';

export class ClipboardService {
  async copyToClipboard(text: string): Promise<void> {
    try {
      await Clipboard.setStringAsync(text);
      // 振動フィードバック（1タップコピーのフィードバック）
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      throw error;
    }
  }

  async getFromClipboard(): Promise<string> {
    try {
      const text = await Clipboard.getStringAsync();
      return text;
    } catch (error) {
      console.error('Failed to get from clipboard:', error);
      throw error;
    }
  }

  async hasString(): Promise<boolean> {
    try {
      return await Clipboard.hasStringAsync();
    } catch (error) {
      console.error('Failed to check clipboard:', error);
      return false;
    }
  }
}

export const clipboardService = new ClipboardService();
