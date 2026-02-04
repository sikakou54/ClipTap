/**
 * Mobile用UsageTrackingAdapter実装
 *
 * iOSネイティブブリッジ（FullAccessBridge）をラップして、
 * 共通UsageTrackingAdapterインターフェースを実装。
 *
 * @module MobileUsageTrackingAdapter
 */

import type { UsageTrackingAdapter } from '@cliptap/shared';
import { FullAccessAdapter } from './FullAccessAdapter';

/**
 * Mobile用UsageTrackingAdapter実装クラス
 */
export class MobileUsageTrackingAdapter implements UsageTrackingAdapter {
  /**
   * 使用頻度追跡が有効かどうかを取得
   *
   * @returns 使用頻度追跡が有効な場合はtrue
   */
  async isUsageTrackingEnabled(): Promise<boolean> {
    return FullAccessAdapter.isUsageTrackingEnabled();
  }
}
