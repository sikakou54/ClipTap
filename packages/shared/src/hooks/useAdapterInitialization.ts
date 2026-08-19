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

import { useState } from 'react';
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
  /* init()は同期処理のため、初回レンダー時に初期化まで済ませる。
     effectで初期化して状態を切り替えると、初期化に待ち時間がないにもかかわらず
     1レンダー分だけ未完了状態が見えてしまう。
     useStateの遅延初期化は初回レンダーで1度だけ評価され、
     StrictModeの二重実行でもisInitialized()のガードで二重初期化を防げる */
  const [isAdaptersReady] = useState(() => {
    if (isInitialized()) {
      return true;
    }

    try {
      init(options);
      Logger.success('🚀 App adapters initialized successfully');
    } catch (error) {
      Logger.error('App adapter initialization error:', error);
    }

    /* 初期化の成否にかかわらず画面を進める（失敗時は各機能側でエラーを扱う） */
    return true;
  });

  return { isAdaptersReady };
}

