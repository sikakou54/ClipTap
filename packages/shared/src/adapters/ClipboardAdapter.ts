/**
 * クリップボードアダプター
 *
 * @description
 * Mobile（expo-clipboard）とWeb（navigator.clipboard）の差異を吸収する共通インターフェース。
 * スニペットのワンタップコピー機能と、変数展開時のクリップボード参照で使用する。
 *
 * @module ClipboardAdapter
 */

/**
 * クリップボードアダプターインターフェース
 */
export interface ClipboardAdapter {
  /**
   * テキストをクリップボードにコピー
   * @param text - コピーするテキスト
   */
  copy(text: string): Promise<void>;

  /**
   * クリップボードからテキストを取得
   * @returns クリップボードに保存されているテキスト
   */
  read(): Promise<string>;

  /**
   * クリップボードにテキストが含まれているかチェック
   * @returns テキストが含まれている場合はtrue、それ以外はfalse
   */
  hasText(): Promise<boolean>;
}

/* ======================================== */
/* アダプターインスタンス管理 */
/* ======================================== */

let currentClipboardAdapter: ClipboardAdapter | null = null;

/**
 * ClipboardAdapterを登録
 * @param adapter - プラットフォーム固有のClipboardAdapter実装
 */
export function setClipboardAdapter(adapter: ClipboardAdapter): void {
  currentClipboardAdapter = adapter;
}

/**
 * 登録済みのClipboardAdapterを取得
 * @returns 登録済みのClipboardAdapter
 * @throws {Error} ClipboardAdapterが未登録の場合
 */
export function getClipboardAdapter(): ClipboardAdapter {
  if (!currentClipboardAdapter) {
    throw new Error('ClipboardAdapter is not set. Call setClipboardAdapter() at startup.');
  }
  return currentClipboardAdapter;
}

/**
 * ClipboardAdapterが登録済みか確認
 * @returns 登録済みの場合true
 */
export function hasClipboardAdapter(): boolean {
  return currentClipboardAdapter !== null;
}
