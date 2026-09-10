/**
 * ショートカット管理画面のビジネスロジックフック
 *
 * ショートカット一覧の表示・管理に必要な状態管理とロジックを提供。
 * UIコンポーネント（settings/shortcuts.tsx）から完全に分離されたビジネスロジック層。
 *
 * 主な責務:
 * - ショートカット一覧の取得・更新
 * - Pull-to-refresh処理
 * - 新規作成・編集・削除処理
 *
 * @see app/settings/shortcuts.tsx - UIコンポーネント
 * @see packages/shared/src/providers/ShortcutProvider.tsx - ショートカットCRUD操作（useShortcuts）
 */

import { useCallback } from 'react';
import { useRouter, useFocusEffect } from 'expo-router';
import { useShortcuts, useTranslation, type Shortcut } from '@cliptap/shared';
import { showConfirm } from '@utils/alerts';
import { Logger } from '@cliptap/shared';

/**
 * useShortcutsScreenの戻り値の型
 */
export interface UseShortcutsScreenReturn {
  /* 状態 */
  /** ショートカット一覧（sortOrder順） */
  shortcuts: Shortcut[];
  /** データ読み込み中フラグ */
  loading: boolean;

  /* ハンドラ */
  /** 一覧を再読み込みする */
  handleRefresh: () => void;
  /** 新規作成画面を開く */
  handleCreateShortcut: () => void;
  /** 編集画面を開く */
  handleEditShortcut: (shortcut: Shortcut) => void;
  /** 確認のうえ削除する */
  handleDeleteShortcut: (shortcut: Shortcut) => void;
}

/**
 * ショートカット管理画面のビジネスロジックフック
 *
 * @returns 画面に必要な全ての状態とハンドラ
 */
export function useShortcutsScreen(): UseShortcutsScreenReturn {
  const { t } = useTranslation();
  const router = useRouter();
  const { shortcuts, loading, refresh, deleteShortcut } = useShortcuts();

  /* ======================================== */
  /* 画面フォーカス時のデータ更新 */
  /* ======================================== */
  /* 作成・編集画面から戻ったときに一覧へ即座に反映するため、フォーカスのたびに読み直す */
  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  /* ======================================== */
  /* イベントハンドラ */
  /* ======================================== */

  const handleCreateShortcut = useCallback(() => {
    router.push('/shortcut/edit');
  }, [router]);

  const handleEditShortcut = useCallback(
    (shortcut: Shortcut) => {
      router.push({
        pathname: '/shortcut/edit',
        params: { id: shortcut.id },
      });
    },
    [router]
  );

  const handleDeleteShortcut = useCallback(
    (shortcut: Shortcut) => {
      /* 「ショートカット○○を削除しますか？」確認（値もまとめて削除される） */
      showConfirm(
        t('shortcut.delete_confirm', { name: shortcut.name }),
        () => {
          try {
            deleteShortcut(shortcut.id);
          } catch (error) {
            Logger.error('[ShortcutsScreen] Failed to delete shortcut:', error);
          }
        },
        undefined,
        'danger'
      );
    },
    [deleteShortcut, t]
  );

  return {
    shortcuts,
    loading,
    handleRefresh: refresh,
    handleCreateShortcut,
    handleEditShortcut,
    handleDeleteShortcut,
  };
}
