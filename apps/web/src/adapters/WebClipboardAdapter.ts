/**
 * Web用クリップボードアダプター
 *
 * @description
 * navigator.clipboardをラップして、共通ClipboardAdapterインターフェースを実装。
 *
 * @module WebClipboardAdapter
 */

import type { ClipboardAdapter } from '@cliptap/shared';

/**
 * Web用ClipboardAdapter実装クラス
 * ブラウザのClipboard APIを使用してクリップボード操作を提供する
 */
export class WebClipboardAdapter implements ClipboardAdapter {
  /**
   * テキストをクリップボードにコピー
   * @param text - クリップボードにコピーする文字列
   */
  async copy(text: string): Promise<void> {
    try {
      /* Clipboard APIを使用してテキストをクリップボードに書き込む */
      /* ブラウザのセキュリティ制約により、ユーザー操作（クリック等）のコンテキスト内でのみ動作する場合がある */
      await navigator.clipboard.writeText(text);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      /* エラーを再スロー（呼び出し元でトースト表示などのハンドリングを行うため） */
      throw error;
    }
  }

  /**
   * クリップボードからテキストを取得
   * @returns クリップボードに保存されているテキスト
   */
  async read(): Promise<string> {
    try {
      /* Clipboard APIを使用してテキストをクリップボードから読み取る */
      /* ブラウザによっては許可ダイアログが表示される */
      return await navigator.clipboard.readText();
    } catch (error) {
      console.error('Failed to read from clipboard:', error);
      /* エラーを再スロー */
      throw error;
    }
  }

  /**
   * クリップボードにテキストが含まれているかチェック
   * @returns テキストが存在する場合はtrue、存在しない場合はfalse
   */
  async hasText(): Promise<boolean> {
    try {
      /* クリップボードからテキストを読み取る */
      const text = await navigator.clipboard.readText();
      /* テキストが1文字以上存在するかをチェック */
      return text.length > 0;
    } catch {
      /* エラーが発生した場合（権限がない等）はfalseを返す */
      return false;
    }
  }
}
