/**
 * プロファイル編集画面のビジネスロジックフック
 *
 * プロファイル（環境）の新規作成・編集の全ての状態管理とロジックを提供。
 * UIコンポーネント（profile/edit.tsx）から完全に分離されたビジネスロジック層。
 *
 * 主な責務:
 * - プロファイル名の状態管理
 * - 無料プラン制限チェック
 * - バリデーション（空チェック、重複チェック）
 * - 保存処理（新規作成/更新）
 *
 * @see app/profile/edit.tsx - UIコンポーネント
 * @see lib/hooks/useProfiles.tsx - プロファイルCRUD操作
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'expo-router';
import {
  useTranslation,
  FREE_PROFILES_LIMIT,
  useProfiles,
  EmptyContentError,
  translateError,
} from '@cliptap/shared';
import { useSubscription } from '@providers/SubscriptionProvider';
import { showConfirm, showErrorAlert } from '@utils/alerts';

/**
 * useProfileEditScreenの引数の型
 */
export interface UseProfileEditScreenParams {
  /** 編集対象のプロファイルID（新規作成時はundefined） */
  profileId?: string;
}

/**
 * useProfileEditScreenの戻り値の型
 */
export interface UseProfileEditScreenReturn {
  /* 状態 */
  profileName: string;
  setProfileName: (name: string) => void;
  saving: boolean;

  /* 派生状態 */
  isEdit: boolean;
  canSave: boolean;

  /* ハンドラ */
  handleSave: () => Promise<void>;
}

/**
 * プロファイル編集画面のビジネスロジックフック
 *
 * @param params - 画面パラメータ
 * @returns 画面に必要な全ての状態とハンドラ
 */
export function useProfileEditScreen(params: UseProfileEditScreenParams): UseProfileEditScreenReturn {
  const { profileId } = params;

  const { t } = useTranslation();
  const router = useRouter();

  const { profiles, createProfile, updateProfile } = useProfiles();
  const { canAddProfile } = useSubscription();

  /* ======================================== */
  /* 状態管理 */
  /* ======================================== */
  const [profileName, setProfileName] = useState('');
  const [saving, setSaving] = useState(false);

  /* ======================================== */
  /* 派生状態 */
  /* ======================================== */
  const isEdit = !!profileId;
  const profile = useMemo(
    () => profiles.find((p) => p.id === profileId),
    [profiles, profileId]
  );

  /**
   * 保存可能かどうか
   */
  const canSave = useMemo(() => profileName.trim() !== '', [profileName]);

  /* ======================================== */
  /* 初期化（編集モード時） */
  /* ======================================== */
  useEffect(() => {
    if (profile && profileId) {
      setProfileName(profile.name);
    } else {
      setProfileName('');
    }
  }, [profile, profileId]);

  /* ======================================== */
  /* イベントハンドラ */
  /* ======================================== */

  /**
   * 保存処理
   * 新規作成時は無料プラン制限チェックを実施
   */
  const handleSave = useCallback(async () => {
    if (!isEdit && !canAddProfile(profiles.length)) {
      showConfirm(
        t('profile.limit_message', { limit: FREE_PROFILES_LIMIT }),
        () => router.push('/subscription/paywall'),
        undefined,
        'warning'
      );
      return;
    }

    setSaving(true);
    try {
      if (!profileName.trim()) {
        throw new EmptyContentError();
      }

      if (isEdit && profileId) {
        updateProfile(profileId, {
          name: profileName.trim(),
        });
      } else {
        createProfile({
          name: profileName.trim(),
        });
      }
      router.back();
    } catch (error) {
      showErrorAlert(translateError(error));
    } finally {
      setSaving(false);
    }
  }, [
    profileName,
    isEdit,
    profileId,
    profiles.length,
    canAddProfile,
    updateProfile,
    createProfile,
    router,
    t,
  ]);

  /* ======================================== */
  /* 戻り値 */
  /* ======================================== */
  return {
    /* 状態 */
    profileName,
    setProfileName,
    saving,

    /* 派生状態 */
    isEdit,
    canSave,

    /* ハンドラ */
    handleSave,
  };
}
