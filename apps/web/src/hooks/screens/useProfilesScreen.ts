/**
 * 環境（プロファイル）管理画面のビジネスロジックフック
 *
 * 環境のCRUD操作と、モーダルの状態管理を提供。
 * UIコンポーネント（ProfileManage.tsx）から完全に分離されたビジネスロジック層。
 *
 * 主な責務:
 * - 環境一覧の取得
 * - 環境の作成・編集・削除
 * - モーダルの開閉・フォーム状態管理
 * - サブスクリプション制限チェック
 *
 * @see pages/ProfileManage.tsx - UIコンポーネント
 */

import { useState, useMemo, useCallback } from 'react';
import { useTranslation } from '@cliptap/shared';
import { useProfiles, FREE_PROFILES_LIMIT, type Profile } from '@cliptap/shared';
import { useSubscription } from '@services/SubscriptionService';
import { useUnsavedChangesWarning } from '@hooks/useUnsavedChangesWarning';
import { useBodyScrollLock } from '@hooks/useBodyScrollLock';

/**
 * useProfilesScreenの戻り値の型
 */
export interface UseProfilesScreenReturn {
  /* データ */
  profiles: Profile[];
  isSubscribed: boolean;
  canAddProfile: boolean;

  /* モーダル状態 */
  showModal: boolean;
  editingId: string | null;
  isSubmitting: boolean;
  error: string;

  /* フォーム状態 */
  name: string;

  /* 派生状態 */
  hasChanges: boolean;

  /* フォームセッター */
  setName: (name: string) => void;

  /* ハンドラ */
  openCreateModal: () => void;
  openEditModal: (profile: Profile) => void;
  handleCloseModal: () => void;
  handleSubmit: () => Promise<void>;
  handleDelete: (id: string) => Promise<void>;
}

/**
 * 環境管理画面のビジネスロジックフック
 *
 * @returns 画面に必要な全ての状態とハンドラ
 */
export function useProfilesScreen(): UseProfilesScreenReturn {
  const { t } = useTranslation();
  const { profiles, createProfile, updateProfile, deleteProfile } = useProfiles();
  const { isSubscribed } = useSubscription();

  /* ======================================== */
  /* モーダル状態 */
  /* ======================================== */
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  /* ======================================== */
  /* フォーム状態 */
  /* ======================================== */
  const [name, setName] = useState('');
  const [initialName, setInitialName] = useState('');

  /* ======================================== */
  /* 派生状態 */
  /* ======================================== */

  /* 環境追加可否を判定（Proプランまたは3環境未満） */
  const canAddProfile = isSubscribed || profiles.length < FREE_PROFILES_LIMIT;

  /* 変更があるかどうかを判定 */
  const hasChanges = useMemo(() => {
    if (!showModal) return false;
    return name !== initialName;
  }, [showModal, name, initialName]);

  /* 未保存警告フック */
  const { confirmClose } = useUnsavedChangesWarning({
    hasChanges,
    isActive: showModal,
  });

  /* モーダル表示時に背景スクロールを無効化 */
  useBodyScrollLock(showModal);

  /* ======================================== */
  /* ハンドラ */
  /* ======================================== */

  /** 閉じる処理（警告付き） */
  const handleCloseModal = useCallback(() => {
    confirmClose(() => {
      setShowModal(false);
      setEditingId(null);
      setName('');
      setError('');
    });
  }, [confirmClose]);

  /** 新規作成モーダルを開く */
  const openCreateModal = useCallback(() => {
    /* 制限チェック（Freeプランは3環境まで） */
    if (!canAddProfile) {
      setError(t('profile.limit_message', { limit: FREE_PROFILES_LIMIT }));
      return;
    }
    setEditingId(null);
    setName('');
    setInitialName('');
    setError('');
    setShowModal(true);
  }, [canAddProfile, t]);

  /** 編集モーダルを開く */
  const openEditModal = useCallback((profile: Profile) => {
    /* 無効な環境は編集不可 */
    if (!profile.valid) {
      setError(t('profile.disabled_message'));
      setTimeout(() => setError(''), 5000);
      return;
    }

    setEditingId(profile.id);
    setName(profile.name);
    setInitialName(profile.name);
    setError('');
    setShowModal(true);
  }, [t]);

  /** 保存処理（作成または更新） */
  const handleSubmit = useCallback(async () => {
    if (!name.trim()) {
      setError(t('profile.name'));
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      if (editingId) {
        await updateProfile(editingId, {
          name: name.trim(),
        });
      } else {
        await createProfile({
          name: name.trim(),
        });
      }

      setShowModal(false);
    } catch (err) {
      if (err instanceof Error && err.message.includes('already exists')) {
        setError(t('error.duplicate_profile_name'));
      } else {
        setError(t('error.generic'));
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [name, editingId, updateProfile, createProfile, t]);

  /** 環境を削除 */
  const handleDelete = useCallback(async (id: string) => {
    const profile = profiles.find(p => p.id === id);

    /* デフォルト環境は削除不可 */
    if (profile?.isDefault) {
      setError(t('profile.delete_default_error'));
      return;
    }

    const { showConfirmMessage } = await import('@utils/alerts');
    const message = t('profile.delete_confirm', { name: profile?.name || '' });
    showConfirmMessage(message, async () => {
      try {
        await deleteProfile(id);
      } catch (err) {
        console.error('Failed to delete profile:', err);
      }
    });
  }, [profiles, deleteProfile, t]);

  /* ======================================== */
  /* 戻り値 */
  /* ======================================== */
  return {
    /* データ */
    profiles,
    isSubscribed,
    canAddProfile,

    /* モーダル状態 */
    showModal,
    editingId,
    isSubmitting,
    error,

    /* フォーム状態 */
    name,

    /* 派生状態 */
    hasChanges,

    /* フォームセッター */
    setName,

    /* ハンドラ */
    openCreateModal,
    openEditModal,
    handleCloseModal,
    handleSubmit,
    handleDelete,
  };
}
