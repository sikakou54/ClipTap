/**
 * ロケールアダプター
 *
 * @description
 * プラットフォーム固有のロケール情報を取得するAdapterパターン実装。
 *
 * 必要な理由:
 * - shared層のVariableService等が言語情報を必要とするが、i18nextへの直接依存を避けるため
 * - 日付フォーマット等のロケール依存処理を実行するために現在の言語を取得
 *
 * 使用方法:
 * 1. アプリ起動時にプラットフォーム固有の実装を登録: setLocaleAdapter()
 * 2. VariableService等から getLocaleAdapter() で取得して言語情報を取得
 *
 * @module LocaleAdapter
 */

/**
 * ロケールアダプターインターフェース
 */
export interface LocaleAdapter {
  /**
   * 現在の言語コードを取得
   *
   * @returns 言語コード（例: 'ja', 'en'）
   */
  getLanguage(): string;
}

/* ======================================== */
/* アダプターインスタンス管理 */
/* ======================================== */

let currentLocaleAdapter: LocaleAdapter | null = null;

export function setLocaleAdapter(adapter: LocaleAdapter): void {
  currentLocaleAdapter = adapter;
}

export function getLocaleAdapter(): LocaleAdapter {
  if (!currentLocaleAdapter) {
    throw new Error('LocaleAdapter is not set. Call setLocaleAdapter() at startup.');
  }
  return currentLocaleAdapter;
}

export function hasLocaleAdapter(): boolean {
  return currentLocaleAdapter !== null;
}
