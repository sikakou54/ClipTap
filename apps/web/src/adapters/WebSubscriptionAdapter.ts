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
import { Logger, SubscriptionStatusSchema } from '@cliptap/shared';

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
export class WebSubscriptionAdapter implements SubscriptionAdapter {
  /** 購読状態（Pro会員かどうか） */
  private _isSubscribed: boolean = false;
  /** ローディング中かどうか（サブスクリプション確認中） */
  private _isLoading: boolean = false;
  /** checkSubscription() に渡された Firebase UID。getCustomerId() 経由でIndexedDBキャッシュのcustomerIdにも使う */
  private currentAppUserId: string | null = null;
  /** 購読状態の変更を監視するリスナーのセット */
  private listeners: Set<SubscriptionListener> = new Set();

  /** 最新のサブスクリプション状態（キャッシュ） */
  private _status: SubscriptionStatus = FREE_STATUS;
  private verificationFailed = false;

  hasVerificationFailed(): boolean {
    return this.verificationFailed;
  }

  /**
   * 購読状態を取得
   * @returns Pro会員の場合はtrue、無料会員の場合はfalse
   */
  isSubscribed(): boolean {
    return this._isSubscribed;
  }

  /**
   * ローディング中かどうか
   * @returns サブスクリプション確認中の場合はtrue、それ以外はfalse
   */
  isLoading(): boolean {
    return this._isLoading;
  }

  /**
   * 現在のユーザーIDを取得（キャッシュキー用）
   * @returns ユーザーID、またはログアウト状態の場合はnull
   */
  getCustomerId(): string | null {
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
      this.verificationFailed = false;
      this.reset();
      return false;
    }

    /* 2. APIベースURLが設定されていない場合 */
    if (!SUBSCRIPTION_API_BASE_URL) {
      Logger.warn('[WebSubscriptionAdapter] API base URL is not configured, treating as free user');
      this.verificationFailed = true;
      this.reset(false);
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
        this.verificationFailed = true;
        this.reset(false);
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
        this.verificationFailed = true;
        this.reset(false);
        return false;
      }

      /* 6. サブスクリプション状態を取得（Proプランの判定はWorker側で完了している）。
            HTTP 200でも所定の形状を満たさない応答は、他の異常経路と同じく権利検証失敗として扱う */
      const parsed = SubscriptionStatusSchema.safeParse(await response.json());
      if (!parsed.success) {
        Logger.warn('[WebSubscriptionAdapter] API returned an unexpected payload shape');
        this.verificationFailed = true;
        this.reset(false);
        return false;
      }
      const status = parsed.data;

      Logger.debug('[WebSubscriptionAdapter] Subscription check result:', {
        userId,
        isSubscribed: status.isSubscribed,
        activePlanId: status.activePlanId,
      });

      /* 7. 状態を更新 */
      this._status = status;
      this.verificationFailed = false;
      this._isSubscribed = status.isSubscribed;
      this._isLoading = false;

      /* 8. 変更をリスナーに通知 */
      this.notifyListeners();

      return status.isSubscribed;
    } catch (error) {
      Logger.error('[WebSubscriptionAdapter] Failed to verify subscription:', error);
      this.verificationFailed = true;
      /* 安全のため、エラー時は無料ユーザーとして扱う */
      this.reset(false);
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
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * リスナーに通知
   * 登録されているすべてのリスナーに現在の購読状態を通知する
   */
  notifyListeners(): void {
    this.listeners.forEach((listener) => listener(this._isSubscribed));
  }

  /**
   * 状態をリセット
   * ログアウト時などに呼び出され、購読状態を初期化する
   *
   * @param notify - リスナーへ通知するかどうか
   *
   * @remarks
   * notify=false で呼ぶのは検証失敗の経路（APIベースURL未設定・IDトークン取得不可・
   * APIエラー応答・通信例外）だけで、失敗は hasVerificationFailed() 経由で
   * SubscriptionProvider が扱う。正常なログアウト（userIdなしでのcheckSubscription）は
   * notify=true で通知する。
   */
  reset(notify = true): void {
    this._isSubscribed = false;
    this._status = FREE_STATUS;
    this._isLoading = false;
    if (notify) this.notifyListeners();
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
