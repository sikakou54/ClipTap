/**
 * プロファイル管理画面のビジネスロジックフック
 *
 * プロファイル（環境）一覧の表示・管理に必要な状態管理とロジックを提供。
 * UIコンポーネント（settings/profiles.tsx）から完全に分離されたビジネスロジック層。
 *
 * 主な責務:
 * - プロファイル一覧の取得・更新
 * - Pull-to-refresh処理
 * - 新規作成・編集・削除処理
 * - 無料プラン制限チェック
 *
 * @see app/settings/profiles.tsx - UIコンポーネント
 * @see lib/hooks/useProfiles.tsx - プロファイルCRUD操作
 */

import { useState, useCallback } from 'react';
import { useRouter, useFocusEffect } from 'expo-router';
import {
  useTranslation,
  ProfileService,
  FREE_PROFILES_LIMIT,
  useProfiles,
  Logger,
  type Profile,
} from '@cliptap/shared';
import { useSubscription } from '@providers/SubscriptionProvider';
import { showConfirm, showErrorAlert } from '@utils/alerts';

/**
 * useProfilesScreenの戻り値の型
 */
export interface UseProfilesScreenReturn {
  /* 状態 */
  refreshing: boolean;
  allProfiles: Profile[];

  /* ハンドラ */
  handleRefresh: () => Promise<void>;
  handleCreateProfile: () => void;
  handleEditProfile: (profile: Profile, enabled: boolean) => void;
  handleDeleteProfile: (profile: Profile) => void;

  /* ヘルパー */
  isProfileEnabled: (profile: Profile) => boolean;
}

/**
 * プロファイル管理画面のビジネスロジックフック
 *
 * @returns 画面に必要な全ての状態とハンドラ
 */
export function useProfilesScreen(): UseProfilesScreenReturn {
  const { t } = useTranslation();
  const router = useRouter();

  const { refresh } = useProfiles();
  const { canAddProfile } = useSubscription();

  /* ======================================== */
  /* 状態管理 */
  /* ======================================== */
  const [refreshing, setRefreshing] = useState(false);
  const [allProfiles, setAllProfiles] = useState<Profile[]>([]);

  /**
   * 全プロファイルを読み込む（無効なものも含む）
   * Service層を直接呼び出すことでContext依存による無限ループを回避
   */
  const loadAllProfiles = useCallback(() => {
    try {
      setAllProfiles(ProfileService.getAllIncludingInvalid());
    } catch (error) {
      Logger.error('[ProfileManagement] Failed to load profiles:', error);
    }
  }, []);

  /* 画面フォーカス時にデータ更新 */
  useFocusEffect(
    useCallback(() => {
      loadAllProfiles();
    }, [loadAllProfiles])
  );

  /* ======================================== */
  /* ヘルパー関数 */
  /* ======================================== */

  /**
   * プロファイルが有効かどうかを判定
   */
  const isProfileEnabled = useCallback((profile: Profile): boolean => {
    return profile.valid;
  }, []);

  /* ======================================== */
  /* イベントハンドラ */
  /* ======================================== */

  /**
   * Pull-to-refresh時のデータ更新
   * ユーザーの明示的な操作なのでrefresh()を呼んでContextを更新する
   */
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setAllProfiles(ProfileService.getAllIncludingInvalid());
    setRefreshing(false);
  }, [refresh]);

  /**
   * 新規プロファイル作成
   * 無料プランの場合は有効なプロファイル数を制限（3つまで）
   */
  const handleCreateProfile = useCallback(() => {
    const validProfilesCount = allProfiles.filter((p) => p.valid).length;

    if (!canAddProfile(validProfilesCount)) {
      showConfirm(
        t('profile.limit_message', { limit: FREE_PROFILES_LIMIT }),
        () => router.push('/subscription/paywall'),
        undefined,
        'warning'
      );
      return;
    }

    router.push('/profile/edit');
  }, [allProfiles, canAddProfile, router, t]);

  /**
   * プロファイル編集画面への遷移
   * 無効な環境の場合はProプラン案内を表示
   */
  const handleEditProfile = useCallback(
    (profile: Profile, enabled: boolean) => {
      if (!enabled) {
        showConfirm(
          t('profile.disabled_message'),
          () => router.push('/subscription/paywall'),
          undefined,
          'warning'
        );
        return;
      }

      router.push({
        pathname: '/profile/edit',
        params: { id: profile.id },
      });
    },
    [router, t]
  );

  /**
   * プロファイル削除処理
   * アクティブなプロファイルを削除時は自動的にデフォルトプロファイルに切り替え
   */
  const handleDeleteProfile = useCallback(
    (profile: Profile) => {
      if (profile.isDefault) {
        showErrorAlert(t('profile.delete_default_error'));
        return;
      }

      showConfirm(
        t('profile.delete_confirm', { name: profile.name }),
        async () => {
          try {
            ProfileService.deleteWithAutoSwitch(profile.id);
            refresh();
            setAllProfiles(ProfileService.getAllIncludingInvalid());
          } catch (error) {
            Logger.error('[ProfileManagement] Failed to delete profile:', error);
          }
        },
        undefined,
        'danger'
      );
    },
    [refresh, t]
  );

  /* ======================================== */
  /* 戻り値 */
  /* ======================================== */
  return {
    /* 状態 */
    refreshing,
    allProfiles,

    /* ハンドラ */
    handleRefresh,
    handleCreateProfile,
    handleEditProfile,
    handleDeleteProfile,

    /* ヘルパー */
    isProfileEnabled,
  };
}
