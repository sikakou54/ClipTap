/**
 * Mobile用サブスクリプションアダプター
 *
 * @description
 * SubscriptionAdapterインターフェースを実装。
 * PurchaseServiceの操作はコールバック経由で注入し、
 * Adapter層からService層への直接依存を回避。
 *
 * @module MobileSubscriptionAdapter
 */

import {
  Logger,
  type SubscriptionAdapter,
  type SubscriptionListener
} from '@cliptap/shared';
import type {
  SubscriptionPlan,
  SubscriptionStatus,
  PurchaseResult
} from '@cliptap/shared/types';

/**
 * PurchaseService操作を抽象化したコールバック型
 *
 * @description
 * Adapter層がService層に直接依存しないように、必要な操作だけをコールバックとして注入。
 * 引数・戻り値はany/unknownで定義し、Adapter内でドメインモデルに変換することで、
 * sharedパッケージが具体的なSDK（RevenueCat）の型を知る必要をなくす。
 */
export interface PurchaseServiceCallbacks {
  isSubscribed: () => boolean;
  getCustomerInfo: () => Promise<unknown>;
  linkAccount: (userId: string) => Promise<void>;
  logout: () => Promise<void>;
  getOfferings: () => Promise<unknown>;
  purchasePackage: (pkg: unknown) => Promise<unknown>;
  restorePurchases: () => Promise<unknown>;
  getExpirationDate: () => Date | null;
  getCurrentPlanType: () => 'monthly' | 'annual' | null;
}

/**
 * getOfferingsが返すパッケージの最小構造
 *
 * @description
 * RevenueCatのSDK型をsharedパッケージへ持ち込まないため、
 * Adapter内で必要なフィールドだけを構造的に定義する。
 */
interface OfferingPackageLike {
  identifier: string;
  packageType: string;
  product: {
    identifier: string;
    priceString: string;
    currencyCode: string;
    price: number;
    description?: string;
  };
}

/**
 * getOfferingsが返すオファリングの最小構造
 */
interface OfferingLike {
  availablePackages?: OfferingPackageLike[];
}

/**
 * Mobile用サブスクリプションアダプター
 *
 * @remarks
 * DeviceEventEmitterのリスナー登録は行わない。
 * イベントリスナーはSubscriptionProviderで一元管理されるため、
 * ここで登録すると二重処理・無限ループの原因となる。
 */
class MobileSubscriptionAdapterImpl implements SubscriptionAdapter {
  private listeners: Set<SubscriptionListener> = new Set();
  private callbacks: PurchaseServiceCallbacks | null = null;

  /**
   * PurchaseServiceコールバックを設定
   * SubscriptionProviderから初期化時に呼び出される
   */
  setCallbacks(callbacks: PurchaseServiceCallbacks): void {
    this.callbacks = callbacks;
  }

  isSubscribed(): boolean {
    return this.callbacks?.isSubscribed() ?? false;
  }

  /**
   * ローディング中かどうか
   *
   * @returns 常にfalse（PurchaseServiceには明示的なisLoading状態がない）
   */
  isLoading(): boolean {
    return false;
  }

  /**
   * サブスクリプション状態を検証
   * RevenueCatサーバーから最新の顧客情報を取得して状態を更新
   */
  async checkSubscription(): Promise<boolean> {
    if (this.callbacks) {
      await this.callbacks.getCustomerInfo();
    }

    return this.isSubscribed();
  }

  subscribe(listener: SubscriptionListener): () => void {
    this.listeners.add(listener);

    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * リスナーに通知
   * SubscriptionProviderから呼び出される
   */
  notifyListeners(): void {
    const isSubscribed = this.isSubscribed();
    this.listeners.forEach((listener) => listener(isSubscribed));
  }


  /**
   * ユーザーアカウントと課金アカウントを紐付け
   * Firebase Authentication UID と RevenueCat アカウントを連携
   */
  async linkAccount(userId: string): Promise<void> {
    if (this.callbacks) {
      await this.callbacks.linkAccount(userId);
    }
  }

  /**
   * 課金アカウントからログアウト
   * RevenueCatのアカウント紐付けを解除
   */
  async logout(): Promise<void> {
    if (this.callbacks) {
      await this.callbacks.logout();
    }
  }

  async refreshCustomerInfo(): Promise<void> {
    if (this.callbacks) {
      await this.callbacks.getCustomerInfo();
    }
  }

  /* ======================================== */
  /* ドメインモデル変換メソッド */
  /* ======================================== */

  async getStatus(): Promise<SubscriptionStatus> {
    if (!this.callbacks) {
      throw new Error('Adapter not initialized');
    }

    const isSubscribed = this.callbacks.isSubscribed();
    const expirationDate = this.callbacks.getExpirationDate();
    const planType = this.callbacks.getCurrentPlanType();

    const managementURL = null;

    return {
      isSubscribed,
      expirationDate: expirationDate ? expirationDate.toISOString() : null,
      activePlanId: planType,
      willRenew: !!expirationDate,
      managementURL,
    };
  }

  async getPlans(): Promise<SubscriptionPlan[]> {
    if (!this.callbacks) {
      return [];
    }

    try {
      /* PurchaseService.getOfferings()は既にofferings.currentを返している */
      const offering = (await this.callbacks.getOfferings()) as OfferingLike | null;
      if (!offering || !offering.availablePackages) {
        return [];
      }

      /* RevenueCat Package型 → SubscriptionPlan型変換 */
      return offering.availablePackages.map((pkg): SubscriptionPlan => ({
        id: pkg.identifier,
        productId: pkg.product.identifier,
        priceString: pkg.product.priceString,
        currencyCode: pkg.product.currencyCode,
        price: pkg.product.price,
        interval: pkg.packageType === 'ANNUAL' ? 'year' : 'month',
        description: pkg.product.description,
        originalObject: pkg,
      }));
    } catch (error) {
      Logger.error('[MobileSubscriptionAdapter] Failed to get plans:', error);
      return [];
    }
  }

  async purchase(planId: string): Promise<PurchaseResult> {
    if (!this.callbacks) {
      return { success: false, isCancelled: false, error: 'Adapter not initialized' };
    }

    try {
      /* PurchaseService.getOfferings()は既にofferings.currentを返している */
      const offering = (await this.callbacks.getOfferings()) as OfferingLike | null;
      const pkg = offering?.availablePackages?.find((p) => p.identifier === planId);

      if (!pkg) {
        return { success: false, isCancelled: false, error: 'Plan not found' };
      }

      /* Mobile: ネイティブの課金フローを開始（iOS StoreKit / Android Google Play Billing） */
      await this.callbacks.purchasePackage(pkg);

      const status = await this.getStatus();
      return { success: true, isCancelled: false, status };

    } catch (error: any) {
      if (error?.userCancelled) {
        return { success: false, isCancelled: true };
      }
      return { success: false, isCancelled: false, error: String(error) };
    }
  }

  async restore(): Promise<SubscriptionStatus> {
    if (!this.callbacks) {
      throw new Error('Adapter not initialized');
    }

    await this.callbacks.restorePurchases();
    return this.getStatus();
  }
}

export { MobileSubscriptionAdapterImpl as MobileSubscriptionAdapter };
