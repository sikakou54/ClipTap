/**
 * スニペットモーダルのビジネスロジックフック
 *
 * @description
 * スニペットの作成・編集モーダルの状態管理とロジックを提供。
 * Dashboard画面から分離された専用フック。
 *
 * @see pages/Dashboard.tsx - 使用元
 */

import { useState, useCallback, useMemo } from 'react';
import {
  useSnippets,
  type Snippet,
  type SnippetProfile,
} from '@cliptap/shared';

/** スニペットフォームの値 */
export interface SnippetFormValues {
  title: string;
  content: string;
  categoryId: string | null;
  copyWithTitle: boolean;
  profileIds: string[];
}

export interface UseSnippetModalParams {
  /** スニペットとプロファイルの紐付け（編集時のプロファイルID取得用） */
  snippetProfiles: SnippetProfile[];
  /** スニペット更新後の再読み込みコールバック（親のuseSnippetsを更新するため） */
  onSnippetsChange?: () => void;
}

export interface UseSnippetModalReturn {
  /* 状態 */
  /** 新規作成モーダル表示中か */
  isCreating: boolean;
  /** 編集中のスニペット（nullの場合は編集モーダル非表示） */
  editingSnippet: Snippet | null;
  /** 編集中スニペットに紐づくプロファイルID一覧 */
  editingSnippetProfileIds: string[];

  /* ハンドラ */
  /** 新規作成モーダルを開く */
  handleCreate: () => void;
  /** 新規作成モーダルを閉じる */
  closeCreateModal: () => void;
  /** 編集モーダルを開く */
  handleEdit: (snippet: Snippet) => void;
  /** 編集モーダルを閉じる */
  closeEditModal: () => void;
  /** 新規スニペットを保存 */
  handleSaveCreate: (values: SnippetFormValues) => Promise<void>;
  /** 編集内容を保存 */
  handleSaveEdit: (values: SnippetFormValues) => Promise<void>;
  /** スニペットを削除 */
  handleDelete: (id: string) => Promise<void>;
}

/**
 * スニペットモーダルのビジネスロジックフック
 */
export function useSnippetModal({
  snippetProfiles,
  onSnippetsChange,
}: UseSnippetModalParams): UseSnippetModalReturn {
  const { createSnippet, updateSnippet, deleteSnippet } = useSnippets();

  /* ======================================== */
  /* 状態管理 */
  /* ======================================== */
  const [editingSnippet, setEditingSnippet] = useState<Snippet | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  /* ======================================== */
  /* 派生状態 */
  /* ======================================== */

  /** 編集中スニペットに紐づくプロファイルID一覧 */
  const editingSnippetProfileIds = useMemo(() => {
    if (!editingSnippet) return [];
    return snippetProfiles
      .filter((sp) => sp.snippetId === editingSnippet.id)
      .map((sp) => sp.profileId);
  }, [editingSnippet, snippetProfiles]);

  /* ======================================== */
  /* ハンドラ */
  /* ======================================== */

  /** 新規作成モーダルを開く */
  const handleCreate = useCallback(() => {
    setIsCreating(true);
  }, []);

  /** 新規作成モーダルを閉じる */
  const closeCreateModal = useCallback(() => {
    setIsCreating(false);
  }, []);

  /** 新規スニペットを保存 */
  const handleSaveCreate = useCallback(async (values: SnippetFormValues) => {
    try {
      await createSnippet(values);
      setIsCreating(false);
      /* 親のuseSnippetsも更新するため、コールバックを呼び出す */
      onSnippetsChange?.();
    } catch (err) {
      console.error('Failed to create:', err);
    }
  }, [createSnippet, onSnippetsChange]);

  /** 編集モーダルを開く */
  const handleEdit = useCallback((snippet: Snippet) => {
    setEditingSnippet(snippet);
  }, []);

  /** 編集モーダルを閉じる */
  const closeEditModal = useCallback(() => {
    setEditingSnippet(null);
  }, []);

  /** 編集内容を保存 */
  const handleSaveEdit = useCallback(async (values: SnippetFormValues) => {
    if (!editingSnippet) return;

    try {
      await updateSnippet({
        id: editingSnippet.id,
        title: values.title,
        content: values.content,
        categoryId: values.categoryId,
        copyWithTitle: values.copyWithTitle,
        profileIds: values.profileIds,
      });
      setEditingSnippet(null);
      /* 親のuseSnippetsも更新するため、コールバックを呼び出す */
      onSnippetsChange?.();
    } catch (err) {
      console.error('Failed to update:', err);
    }
  }, [editingSnippet, updateSnippet, onSnippetsChange]);

  /** スニペットを削除（確認ダイアログ付き） */
  const handleDelete = useCallback(async (id: string) => {
    try {
      await deleteSnippet(id);
      /* 親のuseSnippetsも更新するため、コールバックを呼び出す */
      onSnippetsChange?.();
    } catch (err) {
      console.error('Failed to delete:', err);
    }
  }, [deleteSnippet, onSnippetsChange]);

  return {
    /* 状態 */
    isCreating,
    editingSnippet,
    editingSnippetProfileIds,

    /* ハンドラ */
    handleCreate,
    closeCreateModal,
    handleEdit,
    closeEditModal,
    handleSaveCreate,
    handleSaveEdit,
    handleDelete,
  };
}
