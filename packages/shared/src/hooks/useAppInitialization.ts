/**
 * アプリデータ初期化フック（共通型定義・ロジック）
 *
 * @description
 * useAppInitializationフックの共通インターフェースと共通ロジックを定義。
 * プラットフォーム固有の実装は各アプリで提供される。
 *
 * @module useAppInitialization
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Logger } from '../utils/logger';

/* ======================================== */
/* 型定義 */
/* ======================================== */

/**
 * useAppInitialization フックの返却値
 */
export interface UseAppInitializationReturn {
  /** アプリデータ初期化完了フラグ */
  isAppReady: boolean;
  /** データベースがロード済みかどうか（キャッシュから復元したか、シードデータ投入時など） */
  isLoaded: boolean;
  /** データベースのロード状態を変更 */
  setLoaded: (loaded: boolean) => void;
}

/**
 * 共通初期化処理のオプション
 */
export interface AppInitializationOptions {
  /** データベース初期化関数 */
  initializeDatabase: () => Promise<void>;
  /** データベースがロード済みかどうかを判定する関数 */
  checkDatabaseLoaded: () => boolean;
  /** 初期化後の追加処理（開発モードでのシードデータ投入など） */
  onPostInit?: () => Promise<void>;
}

/**
 * 共通アプリ初期化フック
 *
 * Mobile/Webで共通の初期化パターンを提供します。
 * プラットフォーム固有の処理はオプション引数で注入します。
 *
 * @param options - 初期化オプション
 * @returns UseAppInitializationReturn
 */
export function useBaseAppInitialization(
  options: AppInitializationOptions
): UseAppInitializationReturn {
  const { initializeDatabase, checkDatabaseLoaded, onPostInit } = options;

  /* 初期化処理中フラグ */
  const [isInitializing, setIsInitializing] = useState(true);
  /* データベースロード完了フラグ */
  const [isLoaded, setLoaded] = useState(false);
  /* 初期化済みフラグ（初回起動時のみ初期化するため） */
  const hasInitializedRef = useRef(false);

  /* setLoadedをメモ化 */
  const handleSetLoaded = useCallback((loaded: boolean) => {
    setLoaded(loaded);
  }, []);

  useEffect(() => {
    /* 既に初期化済みの場合はスキップ */
    if (hasInitializedRef.current) {
      setIsInitializing(false);
      return;
    }

    const initialize = async () => {
      setIsInitializing(true);
      hasInitializedRef.current = true;

      try {
        /* データベース初期化 */
        await initializeDatabase();

        /* 初期化後の追加処理 */
        if (onPostInit) {
          await onPostInit();
        }

        /* ロード状態を判定 */
        const loaded = checkDatabaseLoaded();
        setLoaded(loaded);
        setIsInitializing(false);

        if (loaded) {
          Logger.success('[useBaseAppInitialization] Database initialized (loaded)');
        } else {
          Logger.info('[useBaseAppInitialization] Database initialized (awaiting data)');
        }
      } catch (err) {
        Logger.error('[useBaseAppInitialization] Failed to initialize:', err);
        setIsInitializing(false);
      }
    };

    void initialize();
  }, [initializeDatabase, checkDatabaseLoaded, onPostInit]);

  return {
    isAppReady: !isInitializing,
    isLoaded,
    setLoaded: handleSetLoaded,
  };
}

