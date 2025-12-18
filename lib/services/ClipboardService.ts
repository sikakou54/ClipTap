import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { Logger } from '../logger';

export class ClipboardService {
  async copyToClipboard(text: string): Promise<void> {
    try {
      await Clipboard.setStringAsync(text);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      Logger.error('Failed to copy to clipboard:', error);
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
