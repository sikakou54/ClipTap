/**
 * インポートアダプター
 *
 * @description
 * インポート処理に必要なプラットフォーム固有のファイル操作を抽象化するAdapterパターン実装。
 *
 * 必要な理由:
 * - Mobile: FileSystem API経由でファイル読み込み・DB置換
 * - Web: File API + WASM SQLiteの初期化処理
 * - プラットフォームごとに全く異なるファイルパス・API体系を統一
 *
 * 使用方法:
 * 1. アプリ起動時にプラットフォーム固有の実装を登録: setImportAdapter()
 * 2. ImportServiceから getImportAdapter() で取得してファイル操作実行
 *
 * @module ImportAdapter
 */

/**
 * インポートアダプターインターフェース
 */
export interface ImportAdapter {
  /**
   * インポートファイルを読み込む
   *
   * @param fileUri - ファイルのURI（Mobile: file://, Web: blob:）
   * @returns ファイル内容（JSON文字列）
   */
  readImportFile(fileUri: string): Promise<string>;

  /**
   * 一時データベースファイルを作成
   *
   * @param fileName - 一時ファイル名
   * @param base64Data - Base64エンコードされたDBデータ
   * @returns 一時ファイルのパス
   */
  writeTempDatabase(fileName: string, base64Data: string): Promise<string>;

  /**
   * ファイルを削除
   */
  deleteFile(path: string): Promise<void>;

  /**
   * インポート元ファイル（キャッシュ内）を削除
   * Mobile専用: DocumentPickerでコピーされたキャッシュファイルを削除
   */
  deleteImportSourceFile?(fileUri: string): Promise<void>;
}

let importAdapter: ImportAdapter | null = null;

export function setImportAdapter(adapter: ImportAdapter): void {
  importAdapter = adapter;
}

export function getImportAdapter(): ImportAdapter {
  if (!importAdapter) {
    throw new Error('ImportAdapter is not set. Call setImportAdapter() first.');
  }
  return importAdapter;
}

export function hasImportAdapter(): boolean {
  return importAdapter !== null;
}
