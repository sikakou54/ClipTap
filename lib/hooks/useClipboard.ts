import { useState, useCallback } from 'react';
import { clipboardService } from '../services/ClipboardService';

export function useClipboard() {
  const [copiedText, setCopiedText] = useState<string>('');
  const [lastCopiedAt, setLastCopiedAt] = useState<Date | null>(null);

  const copy = useCallback(async (text: string) => {
    try {
      await clipboardService.copyToClipboard(text);
      setCopiedText(text);
      setLastCopiedAt(new Date());
    } catch (error) {
      console.error('Failed to copy:', error);
      throw error;
    }
  }, []);

  const paste = useCallback(async () => {
    try {
      const text = await clipboardService.getFromClipboard();
      return text;
    } catch (error) {
      console.error('Failed to paste:', error);
      throw error;
    }
  }, []);

  const hasString = useCallback(async () => {
    try {
      return await clipboardService.hasString();
    } catch (error) {
      console.error('Failed to check clipboard:', error);
      return false;
    }
  }, []);

  return {
    copy,
    paste,
    hasString,
    copiedText,
    lastCopiedAt,
  };
}
