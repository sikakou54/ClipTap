/**
 * 認証アダプター
 *
 * @description
 * Firebase Authenticationを使用した認証処理を抽象化。
 * Mobile/Web各々でFirebase SDKの実装（expo-firebase-core / firebase/auth）が異なるため、
 * このインターフェースで差異を吸収する。
 *
 * @module AuthAdapter
 */

import type { SharedUser } from '../types/Auth';

/**
 * 認証状態変更リスナー
 */
export type AuthStateListener = (user: SharedUser | null) => void;

/**
 * 認証アダプターインターフェース
 *
 * @description
 * Firebase Authの各種サインイン・サインアウト・状態監視機能を提供。
 * AuthServiceがこのインターフェースを通じて認証処理を実行する。
 */
export interface AuthAdapter {
  /**
   * Googleアカウントでサインイン
   * @throws 失敗時にエラーをスロー
   */
  signInWithGoogle(): Promise<void>;

  /**
   * Appleアカウントでサインイン
   * @throws 失敗時にエラーをスロー
   */
  signInWithApple(): Promise<void>;

  /**
   * サインアウト
   * @throws 失敗時にエラーをスロー
   */
  signOut(): Promise<void>;

  /**
   * 現在のユーザーを取得
   * @returns ログイン中のユーザー、またはnull
   */
  getCurrentUser(): SharedUser | null;

  /**
   * 認証状態の変更を監視
   * @param listener 状態変更時に呼び出されるコールバック
   * @returns 監視解除用の関数 (unsubscribe)
   */
  onAuthStateChanged(listener: AuthStateListener): () => void;
}

/* ======================================== */
/* アダプターインスタンス管理 */
/* ======================================== */

let currentAuthAdapter: AuthAdapter | null = null;

/**
 * AuthAdapterを登録
 *
 * @param adapter - プラットフォーム固有のAuthAdapter実装
 */
export function setAuthAdapter(adapter: AuthAdapter): void {
  currentAuthAdapter = adapter;
}

/**
 * 登録済みのAuthAdapterを取得
 *
 * @returns 登録済みのAuthAdapter
 * @throws {Error} AuthAdapterが未登録の場合
 */
export function getAuthAdapter(): AuthAdapter {
  if (!currentAuthAdapter) {
    throw new Error('AuthAdapter has not been initialized. Call setAuthAdapter() first.');
  }
  return currentAuthAdapter;
}

/**
 * AuthAdapterが登録済みか確認
 *
 * @returns 登録済みの場合はtrue
 */
export function hasAuthAdapter(): boolean {
  return currentAuthAdapter !== null;
}
