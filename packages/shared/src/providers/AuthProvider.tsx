/**
 * 認証プロバイダー（共通実装）
 *
 * @description
 * Firebase Authenticationの状態を管理し、アプリ全体に提供する。
 * アプリのルートでラップして使用する。
 *
 * 主な機能:
 * - 認証状態の監視とリアルタイム更新
 * - Google/Apple Sign-In統合
 * - エラーハンドリング
 *
 * @module AuthProvider
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { AuthService } from '../services/AuthService';
import type { SharedUser } from '../types/Auth';
import { Logger } from '../utils/logger';

/* ======================================== */
/* 型定義 */
/* ======================================== */

export interface AuthContextType {
  user: SharedUser | null;
  loading: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signOut: () => Promise<void>;
}

export interface AuthProviderProps {
  children: React.ReactNode;
}

/* ======================================== */
/* Context */
/* ======================================== */

const AuthContext = createContext<AuthContextType | null>(null);

/* ======================================== */
/* Provider */
/* ======================================== */

/**
 * 認証状態を管理するProvider
 *
 * @param props - AuthProviderProps
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<SharedUser | null>(AuthService.getCurrentUser());
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = AuthService.onAuthStateChanged((newUser) => {
      setUser(newUser);
      setLoading(false);
      Logger.debug(`[AuthProvider] User state changed: ${newUser ? newUser.uid : 'null'}`);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const signInWithGoogle = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await AuthService.signInWithGoogle();
    } catch (e: any) {
      Logger.error('[AuthProvider] Google sign-in failed', e);
      setError(e.message || 'Google sign-in failed');
      setLoading(false);
    }
  }, []);

  const signInWithApple = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await AuthService.signInWithApple();
    } catch (e: any) {
      Logger.error('[AuthProvider] Apple sign-in failed', e);
      setError(e.message || 'Apple sign-in failed');
      setLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await AuthService.signOut();
    } catch (e: any) {
      Logger.error('[AuthProvider] Sign-out failed', e);
      setError(e.message || 'Sign-out failed');
      setLoading(false);
    }
  }, []);

  const value = useMemo(() => ({
    user,
    loading,
    error,
    signInWithGoogle,
    signInWithApple,
    signOut,
  }), [user, loading, error, signInWithGoogle, signInWithApple, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/* ======================================== */
/* Hook */
/* ======================================== */

/**
 * 認証状態を取得するフック
 *
 * @returns 認証状態とアクション
 * @throws Provider外で使用された場合にエラー
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

