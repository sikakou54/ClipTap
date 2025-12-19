import { getAuthAdapter, hasAuthAdapter } from '../adapters/AuthAdapter';
import { SubscriptionService } from './SubscriptionService';
import { Logger } from '../utils/logger';
import type { AuthStateListener } from '../adapters/AuthAdapter';

/**
 * 認証サービス
 *
 * AuthAdapterを使用して認証機能を提供するビジネスロジック層。
 * 認証成功時に自動的にサブスクリプション（RevenueCat）との連携を行う。
 */
export class AuthService {
  /**
   * Googleアカウントでサインイン
   *
   * @throws 失敗時にエラーをスロー
   */
  static async signInWithGoogle(): Promise<void> {
    const adapter = this.ensureAdapter();
    await adapter.signInWithGoogle();

    /* サインイン成功後、ユーザーIDをRevenueCatに紐付けて購入履歴を同期 */
    await this.linkToRevenueCat();
  }

  /**
   * Appleアカウントでサインイン
   *
   * @throws 失敗時にエラーをスロー
   */
  static async signInWithApple(): Promise<void> {
    const adapter = this.ensureAdapter();
    await adapter.signInWithApple();

    /* サインイン成功後、ユーザーIDをRevenueCatに紐付けて購入履歴を同期 */
    await this.linkToRevenueCat();
  }

  /**
   * サインアウト
   *
   * @throws 失敗時にエラーをスロー
   */
  static async signOut(): Promise<void> {
    const adapter = this.ensureAdapter();
    await adapter.signOut();
  }

  /**
   * 認証状態の変更を監視
   *
   * @param listener 状態変更時に呼び出されるコールバック
   * @returns 監視解除用の関数 (unsubscribe)
   */
  static onAuthStateChanged(listener: AuthStateListener): () => void {
    if (!hasAuthAdapter()) {
      Logger.warn('[AuthService] Adapter not registered yet, skipping onAuthStateChanged');
      return () => {};
    }
    return getAuthAdapter().onAuthStateChanged(listener);
  }

  /**
   * 現在のユーザーを取得
   */
  static getCurrentUser() {
    if (!hasAuthAdapter()) return null;
    return getAuthAdapter().getCurrentUser();
  }

  /**
   * RevenueCatとの連携を行う（内部用）
   */
  private static async linkToRevenueCat(): Promise<void> {
    const user = this.getCurrentUser();

    if (user) {
      try {
        Logger.info(`[AuthService] Linking user to RevenueCat: ${user.uid}`);
        /* デバイスが変わっても購入情報が引き継がれるようRevenueCatと紐付け */
        await SubscriptionService.linkAccount(user.uid);
      } catch (error) {
        /* 連携失敗してもログイン処理自体は成功として続行 */
        Logger.warn('[AuthService] Failed to link RevenueCat', error);
      }
    } else {
        Logger.warn('[AuthService] Cannot link to RevenueCat: No current user');
    }
  }

  /**
   * アダプターが登録されているか確認して取得
   */
  private static ensureAdapter() {
    return getAuthAdapter();
  }
}

