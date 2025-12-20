/**
 * Shared Package 初期化モジュール
 *
 * sharedパッケージの初期化を一元管理。
 * アダプター登録とSubscriptionServiceの設定を行う。
 *
 * @module init
 */

import type { AllAdapters, SetAllAdaptersOptions } from './adapters/AdapterRegistry';
import type { ValidFlagsUpdater } from './services/SubscriptionService';
import { setAllAdapters } from './adapters/AdapterRegistry';
import { SubscriptionService } from './services/SubscriptionService';
import { ProfileMapper } from './mappers/ProfileMapper';
import { VariableMapper } from './mappers/VariableMapper';
import { hasMainDbAdapter } from './adapters/DbAdapter';

export interface SharedInitOptions {
  adapters: AllAdapters;
  adapterOptions?: SetAllAdaptersOptions;
  validFlagsUpdater?: ValidFlagsUpdater;
}

/**
 * デフォルトのValidFlagsUpdater実装
 */
const defaultValidFlagsUpdater: ValidFlagsUpdater = {
  updateProfileValidFlags: (limit: number) => ProfileMapper.updateValidFlags(limit),
  updateVariableValidFlags: (limit: number) => VariableMapper.updateValidFlags(limit),
  getActiveProfile: () => ProfileMapper.getActive(),
  getProfileById: (id: string) => ProfileMapper.getById(id),
  getDefaultProfile: () => ProfileMapper.getDefault(),
  setActiveProfile: (id: string) => ProfileMapper.setActive(id),
  hasDbAdapter: () => hasMainDbAdapter(),
};

let initialized = false;

export function isInitialized(): boolean {
  return initialized;
}

/**
 * sharedパッケージを初期化（アプリ起動時に1回呼び出す）
 */
export function init(options: SharedInitOptions): void {
  const { adapters, adapterOptions, validFlagsUpdater } = options;

  setAllAdapters(adapters, adapterOptions);
  SubscriptionService.setValidFlagsUpdater(validFlagsUpdater ?? defaultValidFlagsUpdater);

  initialized = true;
}
