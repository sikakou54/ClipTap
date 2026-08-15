/**
 * ファイル共有アダプター
 *
 * @description
 * プラットフォーム固有のファイル共有機能を抽象化するAdapterパターン実装。
 * Mobile: システム共有シート（expo-sharing）、Web: ブラウザダウンロード
 *
 * 使用方法:
 * ExportAdapterの実装がコンストラクタで受け取って使用する。
 *
 * @module FileShareAdapter
 */

/**
 * ファイル共有アダプターインターフェース
 *
 * @description
 * エクスポートファイルの保存・共有処理をプラットフォーム固有の方法で実行。
 * MobileとWebで異なるUI（共有シート vs ダウンロード）を統一的に扱う。
 */
export interface FileShareAdapter {
  /**
   * ファイルを共有またはダウンロード
   *
   * @param uri - ファイルのURI
   * @param filename - 共有・ダウンロード時のファイル名。
   *                   プラットフォームがファイル名の指定に対応しない場合は無視してよい
   */
  shareFile(uri: string, filename?: string): Promise<void>;
}
