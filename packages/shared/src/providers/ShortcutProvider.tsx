/**
 * ショートカット管理Provider
 *
 * @description
 * ショートカットのグローバル状態を管理するProvider。
 * すべての画面で同じデータを参照でき、一箇所で更新すると全画面に即座に反映される。
 *
 * @module ShortcutProvider
 */

import { createContext, useContext, useState, useEffect, useCallback, useMemo, type ReactNode } from 'react';
import { ShortcutService } from '../services/ShortcutService';
import { Logger } from '../utils/logger';
import { useDatabase } from './DatabaseProvider';
import type { CreateShortcutInput, Shortcut, UpdateShortcutInput } from '../schema';

/* ======================================== */
/* 型定義 */
/* ======================================== */

/**
 * ShortcutContextの型定義
 */
export interface ShortcutContextValue {
  /** ショートカット一覧（sortOrder順） */
  shortcuts: Shortcut[];
  /** データ読み込み中フラグ */
  loading: boolean;
  /** エラー情報（エラーなしの場合null） */
  error: Error | null;
  /** データ再読み込み関数 */
  refresh: () => void;
  /** ショートカット作成 */
  createShortcut: (input: CreateShortcutInput) => Shortcut;
  /** ショートカット更新 */
  updateShortcut: (input: UpdateShortcutInput) => Shortcut;
  /** ショートカット削除 */
  deleteShortcut: (id: string) => void;
  /** IDで取得 */
  getById: (id: string) => Shortcut | null;
}

/**
 * ShortcutProviderのProps
 */
interface ShortcutProviderProps {
  /** 子コンポーネント */
  children: ReactNode;
}

/* ======================================== */
/* Context */
/* ======================================== */

const ShortcutContext = createContext<ShortcutContextValue | null>(null);

/* ======================================== */
/* Provider */
/* ======================================== */

/**
 * ショートカット管理Provider
 *
 * @param props - ShortcutProviderProps
 */
export function ShortcutProvider({ children }: ShortcutProviderProps) {
  /* ======================================== */
  /* 状態管理 */
  /* ======================================== */
  const [shortcuts, setShortcuts] = useState<Shortcut[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  /* データベース初期化状態（DatabaseProviderが必須） */
  const { isLoaded: isDatabaseLoaded } = useDatabase();

  /* ======================================== */
  /* データ読み込み */
  /* ======================================== */
  const loadShortcuts = useCallback(() => {
    try {
      setLoading(true);
      const allShortcuts = ShortcutService.getAll();
      setShortcuts(allShortcuts);
      setError(null);
    } catch (err) {
      Logger.error('[ShortcutProvider] Failed to load shortcuts:', err);
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, []);

  /* データベースが初期化された後にデータを読み込む */
  useEffect(() => {
    if (!isDatabaseLoaded) return;
    loadShortcuts();
  }, [loadShortcuts, isDatabaseLoaded]);

  /* ======================================== */
  /* CRUD操作 */
  /* ======================================== */

  /**
   * ショートカット作成
   * @throws {EmptyContentError} ショートカット名が空の場合
   * @throws {DuplicateNameError} 同名のショートカットが既に存在する場合
   * @throws {ShortcutValueRequiredError} 値が1件も無い場合
   */
  const createShortcut = useCallback(
    (input: CreateShortcutInput): Shortcut => {
      const shortcut = ShortcutService.create(input);
      loadShortcuts();
      return shortcut;
    },
    [loadShortcuts]
  );

  /**
   * ショートカット更新
   * @throws {EmptyContentError} ショートカット名が空の場合
   * @throws {DuplicateNameError} 同名のショートカットが既に存在する場合（自分以外）
   * @throws {ShortcutValueRequiredError} 値をすべて削除しようとした場合
   */
  const updateShortcut = useCallback(
    (input: UpdateShortcutInput): Shortcut => {
      const shortcut = ShortcutService.update(input);
      loadShortcuts();
      return shortcut;
    },
    [loadShortcuts]
  );

  /**
   * ショートカット削除
   * @remarks ショートカットが持つ値もすべて削除される
   */
  const deleteShortcut = useCallback(
    (id: string): void => {
      ShortcutService.delete(id);
      loadShortcuts();
    },
    [loadShortcuts]
  );

  /* ======================================== */
  /* ユーティリティ */
  /* ======================================== */

  const getById = useCallback((id: string): Shortcut | null => ShortcutService.getById(id), []);

  /* ======================================== */
  /* Context Value */
  /* ======================================== */
  const value = useMemo<ShortcutContextValue>(
    () => ({
      shortcuts,
      loading,
      error,
      refresh: loadShortcuts,
      createShortcut,
      updateShortcut,
      deleteShortcut,
      getById,
    }),
    [shortcuts, loading, error, loadShortcuts, createShortcut, updateShortcut, deleteShortcut, getById]
  );

  return <ShortcutContext.Provider value={value}>{children}</ShortcutContext.Provider>;
}

/* ======================================== */
/* Hook */
/* ======================================== */

/**
 * ショートカット状態を取得するフック
 *
 * @returns ショートカット状態とアクション
 * @throws Provider外で使用された場合にエラー
 */
export function useShortcuts(): ShortcutContextValue {
  const context = useContext(ShortcutContext);
  if (!context) {
    throw new Error('useShortcuts must be used within ShortcutProvider');
  }
  return context;
}
