/**
 * アプリデータ初期化カスタムフック（Mobile版）
 *
 * AuthProvider内で使用し、アプリデータ初期化を担当。
 * アダプター初期化（useAdapterInitialization）完了後に使用する。
 *
 * Mobile版の特徴:
 * - 認証状態に依存しないシンプルな実装
 * - データベースはデバイスベースで管理（ユーザーごとに分離されない）
 * - サブスクリプションはデバイスベースで管理
 * - 開発モードでシードデータを自動投入
 *
 * 主な責務:
 * - データベース初期化（認証状態に関係なく1回のみ）
 * - サブスクリプション状態確認（認証状態に関係なく実行）
 * - 開発モードでのシードデータ投入
 *
 * 注意: 
 * - モバイルアプリではデータベースはユーザーごとに分離されていないため、
 *   ログアウト時やユーザー切り替え時にリセットする必要はありません。
 * - サブスクリプションはデバイスベースで管理されるため、
 *   ログインしていなくても利用可能です。
 *
 * @see apps/web/src/hooks/useAppInitialization.ts - Web版の実装（認証状態依存）
 * @see app/_layout.tsx - ルートレイアウトUI
 */

import { useState, useEffect } from 'react';
import { useAuth, Logger, SubscriptionService } from '@cliptap/shared';
import type { UseAppInitializationReturn } from '@cliptap/shared';
import { useSubscription } from '@providers/SubscriptionProvider';
import { database } from '@database/database';
import { runSeed } from '@database/seed';

/**
 * アプリデータ初期化フック
 *
 * AuthProvider内で使用し、アプリデータ初期化を担当。
 * データベースは1回だけ初期化し、認証状態に関係なく使用します。
 * サブスクリプション状態も認証状態に関係なく確認します。
 */
export function useAppInitialization(): UseAppInitializationReturn {
  const { loading: authLoading } = useAuth();
  const { isLoading: subscriptionLoading, verificationFailed } = useSubscription();
  const [isInitializing, setIsInitializing] = useState(true);
  const [isLoaded, setLoaded] = useState(false);
  const [isDbInitialized, setIsDbInitialized] = useState(false);

  /* ======================================== */
  /* データベース初期化（1回のみ実行） */
  /* ======================================== */
  useEffect(() => {
    if (isDbInitialized) return;

    const initializeDatabase = async () => {
      try {
        await database.init();

        /* 開発モードでテストデータをシード */
        if (__DEV__) {
          await runSeed();
        }

        setLoaded(true);
        setIsDbInitialized(true);
        Logger.success('🗃️ Database initialized successfully');
      } catch (err) {
        Logger.error('Failed to initialize database:', err);
        setIsDbInitialized(true);
      }
    };

    void initializeDatabase();
  }, [isDbInitialized]);

  /* ======================================== */
  /* 初期化完了判定 */
  /* ======================================== */
  useEffect(() => {
    if (authLoading || !isDbInitialized) return;
    setIsInitializing(false);
  }, [authLoading, isDbInitialized]);

  /* Providerの初回更新よりDB初期化が遅かった場合も、確定した権利で再計算する。 */
  useEffect(() => {
    if (!isDbInitialized || subscriptionLoading || verificationFailed) return;
    SubscriptionService.updateValidFlags();
  }, [isDbInitialized, subscriptionLoading, verificationFailed]);

  return {
    isAppReady: !isInitializing,
    isLoaded,
    setLoaded,
  };
}
