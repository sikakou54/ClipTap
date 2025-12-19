/**
 * i18nアダプター
 *
 * @description
 * プラットフォーム固有のi18nライブラリ（i18next）を抽象化するAdapterパターン実装。
 *
 * 必要な理由:
 * - shared層のErrorUtils等がエラーメッセージ翻訳を行うため、i18nextへの依存を抽象化
 * - Mobile/WebでそれぞれのストレージAPI（AsyncStorage/localStorage）を使い分ける必要がある
 *
 * 使用方法:
 * 1. アプリ起動時にプラットフォーム固有の実装を登録: setI18nAdapter()
 * 2. ErrorUtils等から getI18nAdapter() で取得して翻訳実行
 *
 * @module I18nAdapter
 */

/**
 * 言語変更リスナーの型定義
 */
export type LanguageChangeListener = (language: string) => void;

/**
 * i18nアダプターインターフェース
 */
export interface I18nAdapter {
  /**
   * 翻訳キーを翻訳して返す
   *
   * @param key - i18n翻訳キー（例: 'error.incorrect_password'）
   * @param options - デフォルト値または補間パラメータ
   * @returns 翻訳された文字列
   */
  translate(key: string, options?: string | { defaultValue?: string; [key: string]: unknown }): string;

  /**
   * 現在の言語コードを取得
   *
   * @returns 言語コード（例: 'ja', 'en'）
   */
  getLanguage(): string;

  /**
   * 言語を変更し、プラットフォーム固有のストレージに永続化
   *
   * @param language - 変更先の言語コード
   */
  changeLanguage(language: string): Promise<void>;

  /**
   * 言語変更リスナーを登録
   *
   * @param listener - 言語変更時に呼び出されるコールバック
   * @returns リスナー解除用の関数
   */
  onLanguageChanged?(listener: LanguageChangeListener): () => void;
}

/* ======================================== */
/* アダプターインスタンス管理 */
/* ======================================== */

let currentI18nAdapter: I18nAdapter | null = null;

export function setI18nAdapter(adapter: I18nAdapter): void {
  currentI18nAdapter = adapter;
}

export function getI18nAdapter(): I18nAdapter {
  if (!currentI18nAdapter) {
    throw new Error('I18nAdapter is not set. Call setI18nAdapter() at startup.');
  }
  return currentI18nAdapter;
}

export function hasI18nAdapter(): boolean {
  return currentI18nAdapter !== null;
}

