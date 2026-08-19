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
 * @see packages/shared/src/providers/ProfileProvider.tsx - プロファイルCRUD操作（useProfiles）
 */

import { useState, useCallback } from 'react';
import { useRouter, useFocusEffect } from 'expo-router';
import {
  useTranslation,
  ProfileService,
  FREE_PROFILES_LIMIT,
  useProfiles,
  Logger,
  translateError,
  useSharedSubscription,
  type Profile,
} from '@cliptap/shared';
import { useUpgradePrompt } from '@hooks/useUpgradePrompt';
import { showConfirm, showErrorAlert } from '@utils/alerts';

/**
 * useProfilesScreenの戻り値の型
 */
export interface UseProfilesScreenReturn {
  /* 状態 */
  allProfiles: Profile[];

  /* ハンドラ */
  handleRefresh: () => void;
  handleCreateProfile: () => void;
  handleEditProfile: (profile: Profile, enabled: boolean) => void;
  handleDeleteProfile: (profile: Profile) => void;
  handleSetDefaultProfile: (profile: Profile) => void;

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

  const confirmUpgrade = useUpgradePrompt();

  const { refresh, setDefaultProfile, deleteProfile } = useProfiles();
  const { canAddProfile } = useSharedSubscription();

  /* ======================================== */
  /* 状態管理 */
  /* ======================================== */
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
  const handleRefresh = useCallback(() => {
    refresh();
    setAllProfiles(ProfileService.getAllIncludingInvalid());
  }, [refresh]);

  /**
   * 新規プロファイル作成
   *
   * @remarks
   * 判定は無効なものも含む保存済み総数で行う。有効数で判定すると、上限超過で無効になった
   * プロファイルを抱えたまま追加を許してしまい、編集画面の保存時に総数で拒否されて
   * 入力が無駄になる。Web・編集画面・変数管理と同じ基準に揃える。
   */
  const handleCreateProfile = useCallback(() => {
    if (!canAddProfile(allProfiles.length)) {
      confirmUpgrade(t('profile.limit_message', { limit: FREE_PROFILES_LIMIT }));
      return;
    }

    router.push('/profile/edit');
  }, [allProfiles, canAddProfile, confirmUpgrade, router, t]);

  /**
   * プロファイル編集画面への遷移
   * 無効な環境の場合はProプラン案内を表示
   */
  const handleEditProfile = useCallback(
    (profile: Profile, enabled: boolean) => {
      if (!enabled) {
        confirmUpgrade(t('profile.disabled_message'));
        return;
      }

      router.push({
        pathname: '/profile/edit',
        params: { id: profile.id },
      });
    },
    [confirmUpgrade, router, t]
  );

  /**
   * プロファイル削除処理
   *
   * @remarks
   * Provider側でアクティブの振替、削除、有効フラグ再計算をトランザクションにまとめている。
   * この画面はContext依存の無限ループを避けるためローカルstateを別に持つので、
   * Provider経由の更新に加えてローカルstateも読み直す。
   */
  const handleDeleteProfile = useCallback(
    (profile: Profile) => {
      if (profile.isDefault) {
        showErrorAlert(t('profile.delete_default_error'));
        return;
      }

      showConfirm(
        t('profile.delete_confirm', { name: profile.name }),
        () => {
          try {
            deleteProfile(profile.id);
            setAllProfiles(ProfileService.getAllIncludingInvalid());
          } catch (error) {
            Logger.error('[ProfileManagement] Failed to delete profile:', error);
            showErrorAlert(translateError(error));
          }
        },
        undefined,
        'danger'
      );
    },
    [deleteProfile, t]
  );

  /**
   * 標準プロファイル切替処理
   *
   * @remarks
   * 標準は変数の既定値の参照先であり、無効プロファイル指定時の振替先でもあるため確認を挟む。
   * Provider側で切替と有効フラグ再計算をトランザクションにまとめている。
   * この画面はContext依存の無限ループを避けるためローカルstateを別に持つので、
   * Provider経由のrefreshに加えてローカルstateも読み直す。
   */
  const handleSetDefaultProfile = useCallback(
    (profile: Profile) => {
      showConfirm(
        t('profile.set_default_confirm', { name: profile.name }),
        () => {
          try {
            setDefaultProfile(profile.id);
            setAllProfiles(ProfileService.getAllIncludingInvalid());
          } catch (error) {
            Logger.error('[ProfileManagement] Failed to set default profile:', error);
            showErrorAlert(translateError(error));
          }
        },
        undefined,
        'warning'
      );
    },
    [setDefaultProfile, t]
  );

  /* ======================================== */
  /* 戻り値 */
  /* ======================================== */
  return {
    /* 状態 */
    allProfiles,

    /* ハンドラ */
    handleRefresh,
    handleCreateProfile,
    handleEditProfile,
    handleDeleteProfile,
    handleSetDefaultProfile,

    /* ヘルパー */
    isProfileEnabled,
  };
}
