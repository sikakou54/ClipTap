/**
 * Web用サブスクリプションアダプター
 *
 * @description
 * RevenueCat Web SDKを使用してサブスクリプション状態を管理。
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

import { Purchases } from '@revenuecat/purchases-js';
import { REVENUECAT_API_KEY, ENTITLEMENT_ID } from '@constants/subscription';
import { Logger } from '@cliptap/shared';

/**
 * Web用サブスクリプションアダプター実装クラス
 * RevenueCat Web SDKを使用してProプランの購読状態を管理する
 */
class WebSubscriptionAdapterImpl implements SubscriptionAdapter {
  /** 購読状態（Pro会員かどうか） */
  private _isSubscribed: boolean = false;
  /** ローディング中かどうか（サブスクリプション確認中） */
  private _isLoading: boolean = false;
  /** RevenueCat SDKが初期化済みかどうか */
  private isInitialized: boolean = false;
  /** 現在のユーザーID（RevenueCatのApp User ID） */
  private currentAppUserId: string | null = null;
  /** 購読状態の変更を監視するリスナーのセット */
  private listeners: Set<SubscriptionListener> = new Set();

  /** 最新のCustomerInfo（キャッシュ） */
  private _customerInfo: any = null;

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
   * RevenueCat SDKを初期化
   * 同じユーザーIDで既に初期化されている場合はスキップ
   * @param appUserId - RevenueCatのApp User ID（FirebaseのUID）
   * @returns 初期化が成功した場合はtrue、失敗した場合はfalse
   */
  private initializeSDK(appUserId: string): boolean {
    /* 既に同じユーザーで初期化されている場合はスキップ */
    if (this.isInitialized && this.currentAppUserId === appUserId) {
      return true;
    }

    /* API Keyが設定されていない場合は失敗 */
    if (!REVENUECAT_API_KEY) {
      Logger.warn('[WebSubscriptionAdapter] API Key is not configured');
      return false;
    }

    try {
      /* RevenueCat SDKを設定（API KeyとユーザーIDを渡す） */
      Purchases.configure(REVENUECAT_API_KEY, appUserId);
      this.isInitialized = true;
      this.currentAppUserId = appUserId;
      Logger.info('[WebSubscriptionAdapter] SDK initialized for user:', appUserId);
      return true;
    } catch (error) {
      Logger.error('[WebSubscriptionAdapter] Failed to initialize SDK:', error);
      this.isInitialized = false;
      this.currentAppUserId = null;
      return false;
    }
  }

  /**
   * サブスクリプション状態を検証
   * RevenueCatから最新のサブスクリプション情報を取得し、Proプランの有効性を確認
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

    /* 2. API Keyが設定されていない場合 */
    if (!REVENUECAT_API_KEY) {
      Logger.warn('[WebSubscriptionAdapter] API Key not configured, treating as free user');
      this.reset();
      return false;
    }

    /* 3. ローディング状態を開始 */
    this._isLoading = true;

    try {
      /* 4. RevenueCat SDKを初期化 */
      const initialized = this.initializeSDK(userId);

      /* 初期化に失敗した場合 */
      if (!initialized) {
        Logger.warn('[WebSubscriptionAdapter] SDK initialization failed, treating as free user');
        this.reset();
        return false;
      }

      /* 5. RevenueCatから顧客情報を取得（ネットワーク通信発生） */
      const customerInfo = await Purchases.getSharedInstance().getCustomerInfo();
      this._customerInfo = customerInfo;

      /* 6. 特定のEntitlement ID（Proプラン）が有効かどうかを判定 */
      /* activeオブジェクト内にIDが存在すれば有効とみなす */
      const isSubscribed = ENTITLEMENT_ID in customerInfo.entitlements.active;

      Logger.debug('[WebSubscriptionAdapter] Subscription check result:', {
        userId,
        isSubscribed,
        activeEntitlements: Object.keys(customerInfo.entitlements.active),
      });

      /* 7. 状態を更新 */
      this._isSubscribed = isSubscribed;
      this._isLoading = false;

      /* 8. 変更をリスナーに通知 */
      this.notifyListeners();

      return isSubscribed;
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
    /* 購読状態をfalseに設定 */
    this._isSubscribed = false;
    this._customerInfo = null;
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
   */
  async getStatus(): Promise<SubscriptionStatus> {
    const entitlement = this._customerInfo?.entitlements?.active?.[ENTITLEMENT_ID];

    /* 有効期限の取得（Web SDKの型定義に依存するためanyキャスト等が必要な場合あり） */
    const expirationDate = entitlement?.expirationDate || null;
    const activePlanId = entitlement?.productIdentifier || null;

    return {
      isSubscribed: this._isSubscribed,
      expirationDate,
      activePlanId,
      willRenew: !!expirationDate, /* Web版は簡易判定 */
      managementURL: null, /* Web版の管理URL（Stripe等）があればここで返す */
    };
  }

  /**
   * 利用可能なプラン一覧を取得
   * Web版は現在の実装ではプラン一覧を持たないため空配列を返す
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
