/**
 * アダプター初期化フック（共通実装）
 *
 * @description
 * アダプター初期化の共通部分を提供するフック。
 * プラットフォーム固有の処理は含まない。
 *
 * 主な責務:
 * - アダプター初期化の実行（init()）
 * - 初期化済みフラグの管理
 *
 * @module useAdapterInitialization
 */

import { useState, useEffect, useRef } from 'react';
import { init, isInitialized, type SharedInitOptions } from '../init';
import { Logger } from '../utils/logger';

/* ======================================== */
/* 型定義 */
/* ======================================== */

/**
 * useAdapterInitialization フックの返却値
 */
export interface UseAdapterInitializationReturn {
  /** アダプター初期化完了フラグ */
  isAdaptersReady: boolean;
}

/* ======================================== */
/* フック実装 */
/* ======================================== */

/**
 * アダプター初期化の共通部分
 *
 * プラットフォーム固有の処理は含まない。
 * アダプター設定は各プラットフォームから渡される。
 *
 * @param options - アダプター初期化オプション
 * @returns アダプター初期化状態
 */
export function useAdapterInitialization(
  options: SharedInitOptions
): UseAdapterInitializationReturn {
  const [isAdaptersReady, setIsAdaptersReady] = useState(isInitialized());
  const optionsRef = useRef(options);

  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  useEffect(() => {
    if (isInitialized()) {
      setIsAdaptersReady(true);
      return;
    }

    try {
      init(optionsRef.current);
      Logger.success('🚀 App adapters initialized successfully');
      setIsAdaptersReady(true);
    } catch (error) {
      Logger.error('App adapter initialization error:', error);
      setIsAdaptersReady(true);
    }
  }, []);

  return { isAdaptersReady };
}

