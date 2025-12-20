/**
 * データベース初期化状態管理プロバイダー（共通実装）
 *
 * @description
 * データベースのロード状態を管理するReact Contextプロバイダー。
 * Mobile/Webで共通のインターフェースを提供。
 *
 * 主な機能:
 * - データベースがロード済みかどうかの状態管理
 * - ロード状態の変更機能
 *
 * @module DatabaseProvider
 */

import { createContext, useContext, type ReactNode } from 'react';

/* ======================================== */
/* 型定義 */
/* ======================================== */

/**
 * データベース初期化状態を管理するContextの型定義
 */
export interface DatabaseContextValue {
  /** データベースがロード済みかどうか */
  isLoaded: boolean;
  /** データベースのロード状態を変更 */
  setLoaded: (loaded: boolean) => void;
}

/* ======================================== */
/* Context */
/* ======================================== */

/** データベース初期化状態を共有するContext */
const DatabaseContext = createContext<DatabaseContextValue | null>(null);

/* ======================================== */
/* Hook */
/* ======================================== */

/**
 * データベース初期化状態を取得するフック
 *
 * @returns isLoaded, setLoaded
 * @throws Provider外で使用された場合にエラー
 */
export function useDatabase(): DatabaseContextValue {
  const context = useContext(DatabaseContext);
  if (!context) {
    throw new Error('useDatabase must be used within DatabaseProvider');
  }
  return context;
}

/* ======================================== */
/* Provider */
/* ======================================== */

/**
 * DatabaseProviderのProps
 */
interface DatabaseProviderProps {
  /** 子コンポーネント */
  children: ReactNode;
  /** データベース状態の値 */
  value: DatabaseContextValue;
}

/**
 * データベース状態を提供するプロバイダーコンポーネント
 *
 * @param props - DatabaseProviderProps
 */
export function DatabaseProvider({ children, value }: DatabaseProviderProps) {
  return (
    <DatabaseContext.Provider value={value}>
      {children}
    </DatabaseContext.Provider>
  );
}

