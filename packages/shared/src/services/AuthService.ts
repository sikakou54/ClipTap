import { getAuthAdapter, hasAuthAdapter } from '../adapters/AuthAdapter';
import { SubscriptionService } from './SubscriptionService';
import { Logger } from '../utils/logger';
import type { AuthStateListener } from '../adapters/AuthAdapter';

/**
 * 認証サービス
 *
 * AuthAdapterを使用して認証機能を提供するビジネスロジック層。
 * 認証成功時に自動的にサブスクリプション（RevenueCat）との連携を行い、
 * サインアウト時にはその連携を解除して利用者識別を匿名へ戻す。
 * 連携・解除はいずれも外部通信を伴うため、失敗しても認証処理自体は成功として扱う。
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

    /* サインアウト後、RevenueCatの利用者識別も解除して匿名へ戻す。
       解除しないと端末に前回のApp User IDが残り、次回起動時に他人のPro権利を復元してしまう */
    await this.unlinkFromRevenueCat();
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
   * RevenueCatとの連携を解除する（内部用）
   *
   * @remarks
   * 解除は外部通信を伴うため、失敗しても警告を残すだけでサインアウト自体は成功として扱う。
   * Webのアダプターはlogoutを実装していないため、SubscriptionService.logoutは何もしない。
   */
  private static async unlinkFromRevenueCat(): Promise<void> {
    try {
      Logger.info('[AuthService] Logging out from RevenueCat');
      await SubscriptionService.logout();
    } catch (error) {
      /* 解除失敗してもサインアウト処理自体は成功として続行 */
      Logger.warn('[AuthService] Failed to log out from RevenueCat', error);
    }
  }

  /**
   * アダプターが登録されているか確認して取得
   */
  private static ensureAdapter() {
    return getAuthAdapter();
  }
}

