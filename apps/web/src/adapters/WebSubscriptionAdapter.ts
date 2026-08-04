/**
 * Web用サブスクリプションアダプター
 *
 * @description
 * ClipTap API（Cloudflare Worker）経由でサブスクリプション状態を取得する。
 * 課金プロバイダの認証情報はWorker側に隔離されており、ブラウザには一切保持しない。
 * App User ID は Worker が Firebase IDトークンから導出するため、クライアントからの詐称はできない。
 *
 * SubscriptionAdapterインターフェースを実装し、SubscriptionServiceに注入する。
 *
 * @module WebSubscriptionAdapter
 */

import type {
  SubscriptionAdapter,
  SubscriptionListener,
  SubscriptionPlan,
  SubscriptionStatus,
  PurchaseResult
} from '@cliptap/shared';

import { SUBSCRIPTION_API_BASE_URL } from '@constants/subscription';
import { auth } from '@services/FirebaseService';
import { Logger } from '@cliptap/shared';

/**
 * 無料プラン（未契約）を示す既定のサブスクリプション状態
 * 通信失敗時も安全側に倒してこの値を使用する
 */
const FREE_STATUS: SubscriptionStatus = {
  isSubscribed: false,
  expirationDate: null,
  activePlanId: null,
  willRenew: false,
  managementURL: null,
};

/**
 * Web用サブスクリプションアダプター実装クラス
 * ClipTap API経由でProプランの購読状態を管理する
 */
class WebSubscriptionAdapterImpl implements SubscriptionAdapter {
  /** 購読状態（Pro会員かどうか） */
  private _isSubscribed: boolean = false;
  /** ローディング中かどうか（サブスクリプション確認中） */
  private _isLoading: boolean = false;
  /** 現在のユーザーID（RevenueCatのApp User IDに相当） */
  private currentAppUserId: string | null = null;
  /** 購読状態の変更を監視するリスナーのセット */
  private listeners: Set<SubscriptionListener> = new Set();

  /** 最新のサブスクリプション状態（キャッシュ） */
  private _status: SubscriptionStatus = FREE_STATUS;

  /**
   * 購読状態を取得
   * @returns Pro会員の場合はtrue、無料会員の場合はfalse
   */
  isSubscribed(): boolean {
    /* 現在の購読状態を返す */
    return this._isSubscribed;
  }

  /**
   * ローディング中かどうか
   * @returns サブスクリプション確認中の場合はtrue、それ以外はfalse
   */
  isLoading(): boolean {
    /* 現在のローディング状態を返す */
    return this._isLoading;
  }

  /**
   * 現在のユーザーIDを取得（キャッシュキー用）
   * @returns ユーザーID、またはログアウト状態の場合はnull
   */
  getCustomerId(): string | null {
    /* 現在のユーザーIDを返す */
    return this.currentAppUserId;
  }

  /**
   * サブスクリプション状態を検証
   * ClipTap APIから最新のサブスクリプション情報を取得し、Proプランの有効性を確認する
   * @param userId - ユーザーID（FirebaseのUID）
   * @returns Pro会員の場合はtrue、無料会員の場合はfalse
   */
  async checkSubscription(userId?: string | null): Promise<boolean> {
    /* 1. ユーザーIDが存在しない（ログアウト状態）場合 */
    if (!userId) {
      /* 状態をリセットして通知 */
      this.reset();
      return false;
    }

    /* 2. APIベースURLが設定されていない場合 */
    if (!SUBSCRIPTION_API_BASE_URL) {
      Logger.warn('[WebSubscriptionAdapter] API base URL is not configured, treating as free user');
      this.reset();
      return false;
    }

    /* 3. ローディング状態を開始し、キャッシュキーとなるユーザーIDを保持 */
    this._isLoading = true;
    this.currentAppUserId = userId;

    try {
      /* 4. Firebase IDトークンを取得（Workerでの認証に使用） */
      const idToken = await auth.currentUser?.getIdToken();

      /* トークンが取得できない場合は無料ユーザーとして扱う */
      if (!idToken) {
        Logger.warn('[WebSubscriptionAdapter] ID token is unavailable, treating as free user');
        this.reset();
        return false;
      }

      /* 5. ClipTap APIへ問い合わせ（ネットワーク通信発生） */
      const response = await fetch(`${SUBSCRIPTION_API_BASE_URL}/subscription/status`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      /* レスポンスが正常でない場合は無料ユーザーとして扱う */
      if (!response.ok) {
        Logger.warn('[WebSubscriptionAdapter] API returned an error status:', response.status);
        this.reset();
        return false;
      }

      /* 6. サブスクリプション状態を取得（Proプランの判定はWorker側で完了している） */
      const status = await response.json() as SubscriptionStatus;

      Logger.debug('[WebSubscriptionAdapter] Subscription check result:', {
        userId,
        isSubscribed: status.isSubscribed,
        activePlanId: status.activePlanId,
      });

      /* 7. 状態を更新 */
      this._status = status;
      this._isSubscribed = status.isSubscribed;
      this._isLoading = false;

      /* 8. 変更をリスナーに通知 */
      this.notifyListeners();

      return status.isSubscribed;
    } catch (error) {
      Logger.error('[WebSubscriptionAdapter] Failed to verify subscription:', error);
      /* 安全のため、エラー時は無料ユーザーとして扱う */
      this.reset();
      return false;
    }
  }

  /**
   * 状態変更リスナーを登録
   * 購読状態が変更されたときに呼び出されるコールバック関数を登録する
   * @param listener - 購読状態が変更されたときに呼び出される関数
   * @returns リスナーを解除する関数
   */
  subscribe(listener: SubscriptionListener): () => void {
    /* リスナーをセットに追加 */
    this.listeners.add(listener);
    /* リスナーを解除する関数を返す */
    return () => {
      /* リスナーをセットから削除 */
      this.listeners.delete(listener);
    };
  }

  /**
   * リスナーに通知
   * 登録されているすべてのリスナーに現在の購読状態を通知する
   */
  notifyListeners(): void {
    /* すべてのリスナーに対して現在の購読状態を渡して呼び出す */
    this.listeners.forEach((listener) => listener(this._isSubscribed));
  }

  /**
   * 状態をリセット
   * ログアウト時などに呼び出され、購読状態を初期化する
   */
  reset(): void {
    /* 購読状態を無料プランに戻す */
    this._isSubscribed = false;
    this._status = FREE_STATUS;
    /* ローディング状態をfalseに設定 */
    this._isLoading = false;
    /* リスナーに通知 */
    this.notifyListeners();
  }

  /* ======================================== */
  /* ドメインモデル変換メソッド */
  /* ======================================== */

  /**
   * 現在のサブスクリプションステータスを取得
   * @returns 最後に取得したサブスクリプション状態
   */
  async getStatus(): Promise<SubscriptionStatus> {
    return this._status;
  }

  /**
   * 利用可能なプラン一覧を取得
   * Web版は購入機能を持たないため空配列を返す
   */
  async getPlans(): Promise<SubscriptionPlan[]> {
    return [];
  }

  /**
   * プランを購入
   * Web版はアプリ内課金をサポートしないためエラー
   */
  async purchase(_planId: string): Promise<PurchaseResult> {
    return {
      success: false,
      isCancelled: false,
      error: 'Web purchase not supported',
    };
  }

  /**
   * 購入を復元
   * Web版はcheckSubscriptionで自動同期されるため、単に再チェックを行う
   */
  async restore(): Promise<SubscriptionStatus> {
    await this.checkSubscription(this.currentAppUserId);
    return this.getStatus();
  }
}

/**
 * WebSubscriptionAdapterクラスを再エクスポート
 */
export { WebSubscriptionAdapterImpl as WebSubscriptionAdapter };
