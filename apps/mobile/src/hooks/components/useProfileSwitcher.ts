/**
 * プロファイルスイッチャーのビジネスロジックフック
 *
 * プロファイルスイッチャーに必要な状態管理とロジックを提供。
 * UIコンポーネント（ProfileSwitcher.tsx）から完全に分離されたビジネスロジック層。
 *
 * 主な責務:
 * - 次/前のプロファイルへの切り替え
 * - 画面フォーカス時のリフレッシュ
 *
 * @see components/profile/ProfileSwitcher.tsx - UIコンポーネント
 */

import { useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { useProfiles, Profile } from '@cliptap/shared';

/**
 * useProfileSwitcherのProps
 * @property onProfileChange - プロファイル変更時のコールバック
 */
export interface UseProfileSwitcherProps {
  onProfileChange?: () => void;
}

/**
 * useProfileSwitcherの戻り値の型
 */
export interface UseProfileSwitcherReturn {
  /* 状態 */
  profiles: Profile[];
  activeProfile: Profile | null;
  shouldShow: boolean;

  /* ハンドラ */
  handleNext: () => Promise<void>;
  handlePrevious: () => Promise<void>;
}

/**
 * プロファイルスイッチャーのビジネスロジックフック
 *
 * @param props - プロファイル変更時のコールバック
 * @returns コンポーネントに必要な全ての状態とハンドラ
 */
export function useProfileSwitcher({
  onProfileChange,
}: UseProfileSwitcherProps): UseProfileSwitcherReturn {
  const { profiles, activeProfile, setActiveProfile, refresh } = useProfiles();

  /**
   * 画面フォーカス時のデータ更新
   */
  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  /**
   * 表示すべきかどうか（プロファイルが2つ以上の場合のみ表示）
   */
  const shouldShow = profiles.length > 1;

  /**
   * 次のプロファイルに切り替え（循環）
   */
  const handleNext = useCallback(async () => {
    const currentIndex = profiles.findIndex(p => p.isActive);
    const nextIndex = (currentIndex + 1) % profiles.length;
    const nextProfile = profiles[nextIndex];

    try {
      await setActiveProfile(nextProfile.id);
      onProfileChange?.();
    } catch (error) {
      /* エラーは無視 */
    }
  }, [profiles, setActiveProfile, onProfileChange]);

  /**
   * 前のプロファイルに切り替え（循環）
   */
  const handlePrevious = useCallback(async () => {
    const currentIndex = profiles.findIndex(p => p.isActive);
    const previousIndex = currentIndex === 0 ? profiles.length - 1 : currentIndex - 1;
    const previousProfile = profiles[previousIndex];

    try {
      await setActiveProfile(previousProfile.id);
      onProfileChange?.();
    } catch (error) {
      /* エラーは無視 */
    }
  }, [profiles, setActiveProfile, onProfileChange]);

  return {
    profiles,
    activeProfile,
    shouldShow,
    handleNext,
    handlePrevious,
  };
}
