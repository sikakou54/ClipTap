/**
 * プロファイル選択のビジネスロジックフック
 *
 * プロファイル選択モーダルに必要な状態管理とロジックを提供。
 * UIコンポーネント（ProfileSelector.tsx）から完全に分離されたビジネスロジック層。
 *
 * 主な責務:
 * - モーダル表示状態管理
 * - プロファイル選択処理
 * - 画面フォーカス時のリフレッシュ
 *
 * @see components/profile/ProfileSelector.tsx - UIコンポーネント
 */

import { useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { useProfiles, Profile } from '@cliptap/shared';

/**
 * useProfileSelectorのProps
 * @property onProfileChange - プロファイル変更時のコールバック
 */
export interface UseProfileSelectorProps {
  onProfileChange?: () => void;
}

/**
 * useProfileSelectorの戻り値の型
 */
export interface UseProfileSelectorReturn {
  /* 状態 */
  profiles: Profile[];
  activeProfile: Profile | null;
  loading: boolean;
  showModal: boolean;

  /* ハンドラ */
  handleSelectProfile: (profile: Profile) => void;
  openModal: () => void;
  closeModal: () => void;
  keyExtractor: (item: Profile) => string;
}

/**
 * プロファイル選択のビジネスロジックフック
 *
 * @param props - プロファイル変更時のコールバック
 * @returns コンポーネントに必要な全ての状態とハンドラ
 */
export function useProfileSelector({
  onProfileChange,
}: UseProfileSelectorProps): UseProfileSelectorReturn {
  /* 切替候補は有効なプロファイルだけとする（無効なものはプロファイル管理画面で扱う） */
  const { validProfiles: profiles, activeProfile, setActiveProfile, loading, refresh } = useProfiles();

  const [showModal, setShowModal] = useState(false);

  /**
   * 画面フォーカス時のデータ更新
   */
  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  /**
   * プロファイル選択時の処理
   */
  const handleSelectProfile = useCallback((profile: Profile) => {
    if (activeProfile?.id === profile.id) {
      setShowModal(false);
      return;
    }

    try {
      setActiveProfile(profile.id);
      setShowModal(false);
      onProfileChange?.();
    } catch {
      /* エラーは無視 */
    }
  }, [activeProfile?.id, setActiveProfile, onProfileChange]);

  /**
   * モーダルを開く
   */
  const openModal = useCallback(() => {
    setShowModal(true);
  }, []);

  /**
   * モーダルを閉じる
   */
  const closeModal = useCallback(() => {
    setShowModal(false);
  }, []);

  /**
   * FlashListのkeyExtractor
   */
  const keyExtractor = useCallback((item: Profile) => item.id, []);

  return {
    profiles,
    activeProfile,
    loading,
    showModal,
    handleSelectProfile,
    openModal,
    closeModal,
    keyExtractor,
  };
}
