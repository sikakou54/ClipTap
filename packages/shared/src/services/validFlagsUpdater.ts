/**
 * ValidFlagsUpdater ファクトリ
 *
 * @module validFlagsUpdater
 * @description
 * SubscriptionService用のValidFlagsUpdater実装を提供。
 * Mobile/Web両方で共通使用するため、shared パッケージに配置。
 *
 * @remarks
 * Mapper操作を抽象化し、SubscriptionServiceからの直接Mapper依存を回避。
 */

import { ProfileMapper } from '../mappers/ProfileMapper';
import { VariableMapper } from '../mappers/VariableMapper';
import { hasMainDbAdapter } from '../adapters/DbAdapter';
import type { ValidFlagsUpdater } from './SubscriptionService';

/**
 * ValidFlagsUpdater の共通実装を作成
 *
 * @returns ValidFlagsUpdater インスタンス
 * @remarks
 * Mobile/Web両方のSubscriptionProviderで使用する共通実装。
 * プロファイル・変数の有効フラグ更新をMapper経由で実行。
 */
export function createValidFlagsUpdater(): ValidFlagsUpdater {
  return {
    updateProfileValidFlags: (limit: number) => ProfileMapper.updateValidFlags(limit),
    updateVariableValidFlags: (limit: number) => VariableMapper.updateValidFlags(limit),
    getActiveProfile: () => ProfileMapper.getActive(),
    getProfileById: (id: string) => ProfileMapper.getById(id),
    getDefaultProfile: () => ProfileMapper.getDefault(),
    setActiveProfile: (id: string) => ProfileMapper.setActive(id),
    hasDbAdapter: () => hasMainDbAdapter(),
  };
}
