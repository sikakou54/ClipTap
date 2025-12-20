import { useState, useEffect, useRef } from 'react';
import {
  Logger,
  type UseAppInitializationReturn,
} from '@cliptap/shared';
import { database } from '@database/database';

/**
 * アプリデータ初期化フック（Web版）
 *
 * AuthProvider内で使用。
 * 
 * Web版の特徴:
 * - 初回起動時に1回だけデータベースを初期化
 * - IndexedDBからのキャッシュ復元に対応
 * - ログインの有無でキャッシュは変わらない（同じキャッシュを使用）
 * 
 * 初期化フロー:
 * - 初回起動時: キャッシュがあれば復元、なければHome画面で.cliptapファイル読み込みを待機
 * - ログイン/ログアウト時: データベースは再初期化しない（既存のキャッシュを継続使用）
 * 
 * 注意: Mobile版とは実装が大きく異なります。
 * Mobile版は認証状態に依存せず、デバイスベースでデータベースを管理します。
 * 
 * @see apps/mobile/src/hooks/screens/useAppInitialization.ts - Mobile版の実装
 */
export function useAppInitialization(): UseAppInitializationReturn {
  /* 初期化処理中フラグ */
  const [isInitializing, setIsInitializing] = useState(true);
  /* データベースロード完了フラグ（キャッシュから復元された場合にtrue） */
  const [isLoaded, setLoaded] = useState(false);
  /* 初期化済みフラグ（初回起動時のみ初期化するため） */
  const hasInitializedRef = useRef(false);

  useEffect(() => {
    /* 既に初期化済みの場合はスキップ */
    if (hasInitializedRef.current) {
      setIsInitializing(false);
      return;
    }

    /* 初期化処理を実行する非同期関数（初回起動時のみ） */
    const initialize = async () => {
      setIsInitializing(true);
      hasInitializedRef.current = true;

      try {
        /* database.init()でDB初期化（ログイン状態に関係なく同じキャッシュを使用） */
        await database.init();

        /* ログアウトによりDBがリセットされた場合は処理を中断 */
        if (!database.isReady()) return;

        /* キャッシュから復元されたかどうかを取得 */
        const hasCache = database.hasCache();

        /* 初期化完了: 状態を更新 */
        setLoaded(hasCache);
        setIsInitializing(false);

        if (hasCache) {
          Logger.success('🗃️ Database initialized successfully (cache restored)');
        } else {
          Logger.info('🌐 Database initialized (waiting for .cliptap file)');
        }
      } catch (err) {
        Logger.error('Failed to initialize:', err);
        setIsInitializing(false);
      }
    };

    initialize();
  }, []);

  return {
    isAppReady: !isInitializing,
    isLoaded,
    setLoaded,
  };
}
