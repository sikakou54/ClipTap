/**
 * サイドメニュー（ドロワー）のビジネスロジックフック
 *
 * ドロワーに必要な状態管理とロジックを提供。
 * UIコンポーネント（Drawer.tsx）から完全に分離されたビジネスロジック層。
 *
 * 主な責務:
 * - プロファイル選択処理
 * - 設定画面への遷移
 *
 * @see components/common/Drawer.tsx - UIコンポーネント
 */

import { useCallback } from 'react';
import { useRouter } from 'expo-router';
import { useProfiles, Profile } from '@cliptap/shared';

/**
 * useDrawerのProps
 * @property onClose - 閉じる時のコールバック
 */
export interface UseDrawerProps {
  onClose: () => void;
}

/**
 * useDrawerの戻り値の型
 */
export interface UseDrawerReturn {
  /* 状態 */
  profiles: Profile[];

  /* ハンドラ */
  handleSelectProfile: (profile: Profile) => Promise<void>;
  handleSettings: () => void;
}

/**
 * サイドメニュー（ドロワー）のビジネスロジックフック
 *
 * @param props - 閉じる時のコールバック
 * @returns ドロワーに必要な全ての状態とハンドラ
 */
export function useDrawer({
  onClose,
}: UseDrawerProps): UseDrawerReturn {
  const { profiles, setActiveProfile } = useProfiles();
  const router = useRouter();

  /**
   * 環境（プロファイル）選択時の処理
   */
  const handleSelectProfile = useCallback(async (profile: Profile) => {
    if (profile.isActive) return;

    try {
      await setActiveProfile(profile.id);
    } catch (error) {
      /* エラーは無視 */
    }
  }, [setActiveProfile]);

  /**
   * 設定画面へ遷移
   */
  const handleSettings = useCallback(() => {
    onClose();
    router.push('/settings');
  }, [onClose, router]);

  return {
    profiles,
    handleSelectProfile,
    handleSettings,
  };
}
