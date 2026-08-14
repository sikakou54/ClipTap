/**
 * Web認証アダプター
 *
 * @description
 * Firebase Auth Web SDKを使用した認証機能の実装。
 * Google/Appleのポップアップ認証、サインアウト、状態監視を提供する。
 * 共通のAuthAdapterインターフェースに準拠し、プラットフォーム固有の実装を隠蔽する。
 *
 * @module WebAuthAdapter
 */

import {
  signInWithPopup,
  GoogleAuthProvider,
  OAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User
} from 'firebase/auth';
import type { AuthAdapter, SharedUser, AuthStateListener } from '@cliptap/shared';
import { auth } from '@services/FirebaseService';

/**
 * Firebaseユーザーオブジェクトを共有ユーザー型に変換
 *
 * @param user - Firebase Authのユーザーオブジェクト
 * @returns アプリケーション共通のユーザー型、またはnull
 */
function mapUser(user: User | null): SharedUser | null {
  /* ユーザーが存在しない場合はnullを返す */
  if (!user) return null;

  /* FirebaseのUser型から必要なプロパティのみを抽出し、 */
  /* SharedUser型にマッピングして返す */
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
    isAnonymous: user.isAnonymous,
    emailVerified: user.emailVerified,
    /* IDトークン取得メソッドのラッパー */
    getIdToken: (forceRefresh) => user.getIdToken(forceRefresh),
  };
}

/**
 * Web用認証アダプタークラス
 *
 * @implements {AuthAdapter}
 */
export class WebAuthAdapter implements AuthAdapter {
  /**
   * Googleアカウントでサインイン
   * ポップアップウィンドウを使用して認証を行う
   */
  async signInWithGoogle(): Promise<void> {
    /* 1. Google認証プロバイダのインスタンスを作成 */
    const provider = new GoogleAuthProvider();
    
    /* 2. ポップアップでサインインフローを開始 */
    /* ユーザーがGoogleアカウントを選択し、承認するのを待つ */
    await signInWithPopup(auth, provider);
  }

  /**
   * Apple IDでサインイン
   * ポップアップウィンドウを使用して認証を行う
   */
  async signInWithApple(): Promise<void> {
    /* 1. Apple認証プロバイダのインスタンスを作成 */
    /* スコープやロケールなどのオプションは必要に応じて設定可能 */
    const provider = new OAuthProvider('apple.com');
    
    /* 2. ポップアップでサインインフローを開始 */
    await signInWithPopup(auth, provider);
  }

  /**
   * サインアウト
   * 現在のセッションを終了する
   */
  async signOut(): Promise<void> {
    /* Firebase Authからサインアウト */
    await firebaseSignOut(auth);
  }

  /**
   * 現在のログインユーザーを取得
   *
   * @returns 現在のユーザー情報（同期的に取得可能な場合）、またはnull
   */
  getCurrentUser(): SharedUser | null {
    /* Firebase Authインスタンスから現在のユーザーを取得し、 */
    /* 共有型に変換して返す */
    return mapUser(auth.currentUser);
  }

  /**
   * 認証状態の変更を監視
   *
   * @param listener - 状態変更時に呼び出されるコールバック関数
   * @returns リスナー解除用の関数
   */
  onAuthStateChanged(listener: AuthStateListener): () => void {
    /* FirebaseのonAuthStateChangedリスナーを登録 */
    return onAuthStateChanged(auth, (user) => {
      /* Firebase UserオブジェクトをSharedUser型に変換して */
      /* アプリケーション側のリスナーに渡す */
      listener(mapUser(user));
    });
  }
}

