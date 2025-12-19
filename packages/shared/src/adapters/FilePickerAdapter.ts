/**
 * ファイル選択アダプター
 *
 * @description
 * プラットフォーム固有のファイル選択機能を抽象化するAdapterパターン実装。
 * Mobile: expo-document-picker、Web: input[type="file"]
 *
 * 使用方法:
 * 1. アプリ起動時にプラットフォーム固有の実装を登録: setFilePickerAdapter()
 * 2. ImportService等から getFilePickerAdapter() で取得して使用
 *
 * @module FilePickerAdapter
 */

/**
 * ファイル選択オプション
 */
export interface FilePickOptions {
  mimeTypes?: string[];
  extensions?: string[];
}

/**
 * ファイル選択結果
 */
export interface FilePickResult {
  uri: string;
  name: string;
  size?: number;
  mimeType?: string;
  base64?: string;
}

/**
 * ファイル選択アダプターインターフェース
 *
 * @description
 * プラットフォームごとに異なるファイル選択UIの実装を統一的に扱う。
 */
export interface FilePickerAdapter {
  /**
   * システムのファイル選択UIを表示し、ユーザーにファイルを選択させる
   *
   * @param options - MIMEタイプや拡張子のフィルター
   * @returns 選択されたファイルの情報、キャンセル時はnull
   */
  pickFile(options?: FilePickOptions): Promise<FilePickResult | null>;
}

/* ======================================== */
/* アダプターインスタンス管理 */
/* ======================================== */

let currentFilePickerAdapter: FilePickerAdapter | null = null;

export function setFilePickerAdapter(adapter: FilePickerAdapter): void {
  currentFilePickerAdapter = adapter;
}

export function getFilePickerAdapter(): FilePickerAdapter {
  if (!currentFilePickerAdapter) {
    throw new Error('FilePickerAdapter has not been initialized. Call setFilePickerAdapter() first.');
  }
  return currentFilePickerAdapter;
}

export function hasFilePickerAdapter(): boolean {
  return currentFilePickerAdapter !== null;
}
