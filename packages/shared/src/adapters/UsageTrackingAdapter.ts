/**
 * 使用頻度追跡アダプター
 *
 * @description
 * プラットフォーム固有の使用頻度追跡設定を取得するAdapterパターン実装。
 *
 * 必要な理由:
 * - Mobileアプリ（iOSのネイティブブリッジ経由）とWebアプリ（常にfalse）で異なる実装
 * - shared層からプラットフォーム固有の実装に依存しないため
 *
 * 使用方法:
 * 1. アプリ起動時にプラットフォーム固有の実装を登録: setUsageTrackingAdapter()
 * 2. 各画面から getUsageTrackingAdapter() で取得して使用頻度追跡設定を取得
 *
 * @module UsageTrackingAdapter
 */

/**
 * 使用頻度追跡アダプターインターフェース
 */
export interface UsageTrackingAdapter {
  /**
   * 使用頻度追跡が有効かどうかを取得
   *
   * @returns 使用頻度追跡が有効な場合はtrue
   */
  isUsageTrackingEnabled(): Promise<boolean>;
}

/* ======================================== */
/* アダプターインスタンス管理 */
/* ======================================== */

let currentUsageTrackingAdapter: UsageTrackingAdapter | null = null;

export function setUsageTrackingAdapter(adapter: UsageTrackingAdapter): void {
  currentUsageTrackingAdapter = adapter;
}

export function getUsageTrackingAdapter(): UsageTrackingAdapter {
  if (!currentUsageTrackingAdapter) {
    throw new Error('UsageTrackingAdapter is not set. Call setUsageTrackingAdapter() at startup.');
  }
  return currentUsageTrackingAdapter;
}

export function hasUsageTrackingAdapter(): boolean {
  return currentUsageTrackingAdapter !== null;
}
