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

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useTranslation } from '@cliptap/shared';
import { Logger, useProfiles, FREE_PROFILES_LIMIT, translateError, useSharedSubscription, type Profile } from '@cliptap/shared';
import { useUnsavedChangesWarning } from '@hooks/useUnsavedChangesWarning';
import { useBodyScrollLock } from '@hooks/useBodyScrollLock';
import { showConfirmMessage } from '@utils/alerts';

/** エラーメッセージを自動的に消すまでの待ち時間（ミリ秒） */
const ERROR_AUTO_DISMISS_MS = 5000;

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
  handleSetDefault: (id: string) => Promise<void>;
}

/**
 * 環境管理画面のビジネスロジックフック
 *
 * @returns 画面に必要な全ての状態とハンドラ
 */
export function useProfilesScreen(): UseProfilesScreenReturn {
  const { t } = useTranslation();
  const { profiles, createProfile, updateProfile, deleteProfile, setDefaultProfile } = useProfiles();
  const { isSubscribed, canAddProfile: canAddProfileForCount } = useSharedSubscription();

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

  /* 環境追加可否を判定（無効なものも含む保存済み総数で判定する） */
  const canAddProfile = canAddProfileForCount(profiles.length);

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

  /** 自動消去タイマー。新しいメッセージや画面離脱で前のタイマーを止める */
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /** エラー表示を更新する。autoDismiss=true のときだけ ERROR_AUTO_DISMISS_MS 後に自動で消す */
  const updateError = useCallback((message: string, autoDismiss = false) => {
    if (dismissTimerRef.current) {
      clearTimeout(dismissTimerRef.current);
    }
    dismissTimerRef.current = null;
    setError(message);
    if (autoDismiss && message) {
      dismissTimerRef.current = setTimeout(() => setError(''), ERROR_AUTO_DISMISS_MS);
    }
  }, []);

  /* アンマウント時に自動消去タイマーを止める */
  useEffect(() => () => {
    if (dismissTimerRef.current) {
      clearTimeout(dismissTimerRef.current);
    }
  }, []);

  /** 閉じる処理（警告付き） */
  const handleCloseModal = useCallback(() => {
    confirmClose(() => {
      setShowModal(false);
      setEditingId(null);
      setName('');
      updateError('');
    });
  }, [confirmClose, updateError]);

  /** 新規作成モーダルを開く */
  const openCreateModal = useCallback(() => {
    /* 制限チェック（Freeプランは3環境まで） */
    if (!canAddProfile) {
      updateError(t('profile.limit_message', { limit: FREE_PROFILES_LIMIT }));
      return;
    }
    setEditingId(null);
    setName('');
    setInitialName('');
    updateError('');
    setShowModal(true);
  }, [canAddProfile, t, updateError]);

  /** 編集モーダルを開く */
  const openEditModal = useCallback((profile: Profile) => {
    /* 無効な環境は編集不可 */
    if (!profile.valid) {
      updateError(t('profile.disabled_message'), true);
      return;
    }

    setEditingId(profile.id);
    setName(profile.name);
    setInitialName(profile.name);
    updateError('');
    setShowModal(true);
  }, [t, updateError]);

  /** 保存処理（作成または更新） */
  const handleSubmit = useCallback(async () => {
    if (!name.trim()) {
      updateError(t('profile.name'));
      return;
    }

    setIsSubmitting(true);
    updateError('');

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
      /* ClipTapError は自身が持つ翻訳キーで表示される（重複名も同経路で解決される） */
      updateError(translateError(err));
    } finally {
      setIsSubmitting(false);
    }
  }, [name, editingId, updateProfile, createProfile, t, updateError]);

  /** 環境を削除 */
  const handleDelete = useCallback(async (id: string) => {
    const profile = profiles.find(p => p.id === id);

    /* デフォルト環境は削除不可 */
    if (profile?.isDefault) {
      updateError(t('profile.delete_default_error'));
      return;
    }

    const message = t('profile.delete_confirm', { name: profile?.name || '' });
    showConfirmMessage(message, () => {
      try {
        deleteProfile(id);
        updateError('');
      } catch (err) {
        Logger.error('Failed to delete profile:', err);
        updateError(translateError(err));
      }
    });
  }, [profiles, deleteProfile, t, updateError]);

  /**
   * 標準環境を切り替え
   *
   * 標準は変数の既定値の参照先であり、無効環境を指定したときの振替先でもあるため確認を挟む。
   * Provider側で切替と有効フラグ再計算をトランザクションにまとめている。
   */
  const handleSetDefault = useCallback(async (id: string) => {
    const profile = profiles.find(p => p.id === id);
    if (!profile || profile.isDefault) return;

    /* 無効な環境は標準にできない（一覧に操作を出さないため通常は到達しない） */
    if (!profile.valid) {
      updateError(t('profile.disabled_message'), true);
      return;
    }

    const message = t('profile.set_default_confirm', { name: profile.name });
    showConfirmMessage(message, () => {
      try {
        setDefaultProfile(id);
        updateError('');
      } catch (err) {
        Logger.error('Failed to set default profile:', err);
        updateError(translateError(err));
      }
    });
  }, [profiles, setDefaultProfile, t, updateError]);

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
    handleSetDefault,
  };
}
