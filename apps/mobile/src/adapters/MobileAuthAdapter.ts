import { Platform } from 'react-native';
import { getApp } from '@react-native-firebase/app';
import {
  getAuth,
  signInWithCredential,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  AppleAuthProvider,
  onAuthStateChanged,
} from '@react-native-firebase/auth';
import type { User as FirebaseUser } from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';

import type { AuthAdapter, SharedUser, AuthStateListener } from '@cliptap/shared';
import { Logger, AUTH_ERROR_CODES } from '@cliptap/shared';
import { AUTH_CONFIG } from '@constants/config';

/* ======================================== */
/* ヘルパー関数 */
/* ======================================== */

let isGoogleConfigured = false;

function ensureGoogleConfigured(): void {
  if (isGoogleConfigured) return;
  GoogleSignin.configure({
    iosClientId: AUTH_CONFIG.GOOGLE_IOS_CLIENT_ID,
    webClientId: AUTH_CONFIG.GOOGLE_WEB_CLIENT_ID,
    offlineAccess: false,
    forceCodeForRefreshToken: false,
  });
  isGoogleConfigured = true;
}

/**
 * Appleサインイン用の暗号学的に安全なNonceを生成
 * リプレイ攻撃防止のため、ランダムバイト列から文字列を生成
 */
function generateSecureNonce(length = 32): string {
  const randomBytes = Crypto.getRandomBytes(length);
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(randomBytes[i] % chars.length);
  }
  return result;
}

function mapUser(user: FirebaseUser | null): SharedUser | null {
  if (!user) return null;
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
    isAnonymous: user.isAnonymous,
    emailVerified: user.emailVerified,
    getIdToken: (forceRefresh) => user.getIdToken(forceRefresh),
  };
}

/* ======================================== */
/* Adapter Implementation */
/* ======================================== */

export class MobileAuthAdapter implements AuthAdapter {
  async signInWithGoogle(): Promise<void> {
    ensureGoogleConfigured();

    try {
      /* Android: Play開発者サービスの可用性チェック（必須要件） */
      if (Platform.OS === 'android') {
        await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      }

      /* 既存セッションをクリア（多重ログイン防止） */
      try {
        await GoogleSignin.signOut();
      } catch {
        /* 未サインイン時はエラーになるが、クリアが目的なので無視してよい */
      }

      const response = await GoogleSignin.signIn();
      if (response.type !== 'success') {
        throw new Error(AUTH_ERROR_CODES.GOOGLE_CANCELLED);
      }

      /* IDトークン取得（レスポンスに含まれない場合は別途API呼び出し） */
      let idToken = response.data.idToken;
      if (!idToken) {
        const tokens = await GoogleSignin.getTokens();
        idToken = tokens.idToken;
      }
      if (!idToken) {
        throw new Error(AUTH_ERROR_CODES.GOOGLE_FAILED);
      }

      const firebaseAuth = getAuth(getApp());
      const credential = GoogleAuthProvider.credential(idToken);

      /* Firebaseサインイン完了後、onAuthStateChangedが自動発火 */
      await signInWithCredential(firebaseAuth, credential);
    } catch (error) {
      Logger.error('[MobileAuthAdapter] Google sign-in failed:', error);
      throw error;
    }
  }

  async signInWithApple(): Promise<void> {
    try {
      /* Android非対応（Sign in with Appleの実装は可能だが現状未サポート） */
      if (Platform.OS === 'android') {
        throw new Error(AUTH_ERROR_CODES.APPLE_NOT_SUPPORTED);
      }

      /* Nonce生成とSHA-256ハッシュ化（リプレイ攻撃・MITM攻撃の防止） */
      const rawNonce = generateSecureNonce();
      const hashedNonce = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        rawNonce
      );

      const appleResponse = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        ],
        nonce: hashedNonce,
        state: generateSecureNonce(),
      });

      if (!appleResponse.identityToken) {
        throw new Error(AUTH_ERROR_CODES.APPLE_FAILED);
      }

      /* Firebase認証時は生のNonce（ハッシュ化前）を使用 */
      const firebaseAuth = getAuth(getApp());
      const credential = AppleAuthProvider.credential(appleResponse.identityToken, rawNonce);

      await signInWithCredential(firebaseAuth, credential);
    } catch (error) {
      Logger.error('[MobileAuthAdapter] Apple sign-in failed:', error);
      throw error;
    }
  }

  async signOut(): Promise<void> {
    try {
      const firebaseAuth = getAuth(getApp());
      await firebaseSignOut(firebaseAuth);

      try {
        ensureGoogleConfigured();
        await GoogleSignin.signOut();
      } catch {
        /* Firebaseのサインアウトは完了済み。Google側の失敗で全体を失敗にしない */
      }
    } catch (error) {
      Logger.error('[MobileAuthAdapter] Sign-out failed:', error);
      throw error;
    }
  }

  getCurrentUser(): SharedUser | null {
    const firebaseAuth = getAuth(getApp());
    return mapUser(firebaseAuth.currentUser);
  }

  onAuthStateChanged(listener: AuthStateListener): () => void {
    const firebaseAuth = getAuth(getApp());
    const unsubscribe = onAuthStateChanged(firebaseAuth, (user) => {
      listener(mapUser(user));
    });
    return unsubscribe;
  }
}


