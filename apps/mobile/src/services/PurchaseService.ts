/**
 * サブスクリプション管理サービス
 *
 * @module PurchaseService
 * @remarks
 * ### RevenueCatとは
 * アプリ内課金を簡単に実装できるSaaS。
 * iOS/Androidの異なる決済APIを統一的に扱い、サーバーレスで購入状態を管理。
 *
 * ### RevenueCatの主要概念
 * - **CustomerInfo**: ユーザーの購入履歴・サブスク状態を含む顧客情報
 * - **Entitlement**: 購入で解放される権限（例: "Pro"プランの権限）
 * - **Offering**: 購入可能なプラン一覧（月額・年間など）
 * - **Package**: 個別の課金商品（月額¥250、年間¥3,000など）
 *
 * ### 使用方法
 * 1. アプリ起動時にinitialize()を呼び出し
 * 2. Firebaseログイン後にlinkAccount(userId)でRevenueCatと紐付け
 * 3. isSubscribed()でPro版かどうか判定
 * 4. purchasePackage()で購入、restorePurchases()で復元
 *
 * ### 重要な注意点
 * - RevenueCatはサーバー側で購入状態を管理（改竄防止）
 * - CustomerInfoは自動更新され、リスナー経由で通知される
 * - DEVモードではdevSubscriptionOverrideで状態をシミュレート可能
 *
 * @see https://www.revenuecat.com/docs
 */

import Purchases, {
  CustomerInfo,
  PurchasesOffering,
  PurchasesPackage,
  LOG_LEVEL,
} from 'react-native-purchases';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Logger } from '@cliptap/shared';
import { REVENUECAT_CONFIG, PRODUCT_IDS_CONFIG } from '@constants/config';

export const ENTITLEMENT_ID = REVENUECAT_CONFIG.ENTITLEMENT_ID;

export const PRODUCT_IDS = Platform.select({
  ios: PRODUCT_IDS_CONFIG.iOS,
  android: PRODUCT_IDS_CONFIG.android,
  default: PRODUCT_IDS_CONFIG.iOS,
});

/**
 * サブスクリプションで解放される機能
 */
export enum SubscriptionFeature {
  NO_ADS = 'no_ads',
  CUSTOM_VARIABLES = 'custom_variables',
}

const DEV_SUBSCRIPTION_OVERRIDE_KEY = '@dev_subscription_override';

/**
 * Billing unavailableエラーかどうかを判定
 *
 * @remarks
 * エミュレータやPlay Services未対応デバイスで発生。
 * 非致命的なエラーなので、警告扱いでnullを返す。
 */
function isBillingUnavailableError(error: unknown): boolean {
  const errorObj = error as { code?: string; message?: string } | null;
  return (
    errorObj?.code === 'PurchaseNotAllowedError' ||
    errorObj?.message?.includes('BILLING_UNAVAILABLE') === true
  );
}

export type SubscriptionChangeCallback = (isSubscribed: boolean) => void;

/**
 * サブスクリプション管理クラス
 *
 * @remarks
 * RevenueCat SDKをラップし、アプリ内課金の全機能を提供。
 * シングルトンパターンで実装（purchaseServiceとしてエクスポート）。
 */
class PurchaseService {
  private isInitialized = false;
  private customerInfo: CustomerInfo | null = null;
  private devSubscriptionOverride: boolean | null = null;
  private onSubscriptionChange: SubscriptionChangeCallback | null = null;
  private lastNotifiedState: boolean | null = null;

  /**
   * サブスクリプション状態変更コールバックを登録
   *
   * @param callback - 状態変更時に呼び出されるコールバック
   * @remarks
   * SubscriptionProviderが初期化時に一度だけ登録する。
   * 同じ状態の重複通知は内部で防止される。
   */
  setOnSubscriptionChange(callback: SubscriptionChangeCallback | null): void {
    this.onSubscriptionChange = callback;
  }

  /**
   * サブスクリプション状態変更を通知（内部用）
   *
   * @remarks
   * 前回通知した状態と異なる場合のみコールバックを呼び出す。
   * 重複通知を防止し、不要な再レンダリングを防ぐ。
   */
  private notifyIfChanged(): void {
    const currentState = this.isSubscribed();

    if (this.lastNotifiedState === currentState) {
      return;
    }

    this.lastNotifiedState = currentState;
    Logger.info(`[PurchaseService] Subscription state changed: ${currentState}`);
    this.onSubscriptionChange?.(currentState);
  }

  /**
   * RevenueCat SDKを初期化
   *
   * @throws {Error} API設定エラー、ネットワークエラー（Billing unavailable以外）
   *
   * @remarks
   * ### 初期化の流れ
   * 1. DEV環境のオーバーライド設定を読み込み
   * 2. RevenueCat SDKを設定（プラットフォーム別APIキー使用）
   * 3. CustomerInfo更新リスナーを登録（自動更新を受信）
   * 4. 現在のCustomerInfoを取得
   *
   * ### CustomerInfo更新リスナーについて
   * RevenueCatは購入・復元・有効期限切れなどのイベントで
   * CustomerInfoを自動更新し、リスナー経由で通知する。
   * これにより常に最新のサブスク状態を保持できる。
   */
  async initialize(): Promise<void> {
    /* 既に初期化済みの場合はスキップ（二重初期化防止） */
    if (this.isInitialized) return;

    try {
      /* DEV環境のオーバーライド設定を読み込み（テスト用） */
      await this.loadDevOverride();

      /* プラットフォーム別のAPIキーを取得（iOS/Androidで異なる） */
      const apiKey = Platform.select({
        ios: REVENUECAT_CONFIG.API_KEY_IOS,
        android: REVENUECAT_CONFIG.API_KEY_ANDROID,
      });

      if (!apiKey) {
        Logger.warn('[PurchaseService] Subscriptions only available on iOS/Android');
        return;
      }

      /* DEV環境ではログレベルをERRORに設定（本番ではデフォルトのINFO） */
      if (__DEV__) {
        await Purchases.setLogLevel(LOG_LEVEL.ERROR);
      }

      /* RevenueCat SDKを初期化（APIキーを設定） */
      Purchases.configure({ apiKey });

      /* CustomerInfo更新リスナーを登録（購入・復元・有効期限切れ等で自動更新を受信） */
      Purchases.addCustomerInfoUpdateListener((info) => {
        this.customerInfo = info;
        this.notifyIfChanged();
      });

      /* 現在のCustomerInfoを取得（初期状態の確認） */
      try {
        this.customerInfo = await Purchases.getCustomerInfo();
      } catch (error) {
        /* Billing unavailableエラーは非致命的（エミュレータ等で発生） */
        if (isBillingUnavailableError(error)) {
          Logger.warn('[PurchaseService] Billing not available');
          this.customerInfo = null;
        } else {
          throw error;
        }
      }

      /* 初期状態を通知（コールバックが登録されている場合） */
      this.notifyIfChanged();
      this.isInitialized = true;
      Logger.info('[PurchaseService] Initialized');
    } catch (error) {
      Logger.error('[PurchaseService] Init failed:', error);
      throw error;
    }
  }

  /**
   * 開発者オーバーライド設定を読み込み
   */
  private async loadDevOverride(): Promise<void> {
    if (!__DEV__) return;
    try {
      const value = await AsyncStorage.getItem(DEV_SUBSCRIPTION_OVERRIDE_KEY);
      if (value !== null) {
        this.devSubscriptionOverride = value === 'true';
      }
    } catch (error) {
      Logger.error('[PurchaseService] Failed to load dev override:', error);
    }
  }

  /**
   * 開発者向けサブスクリプション状態のオーバーライドを設定
   *
   * @param isSubscribed - trueでPro、falseで無料、nullでオーバーライド解除
   * @throws {Error} AsyncStorage保存エラー
   *
   * @remarks
   * DEVモードでのみ動作。実際の購入なしでサブスク状態をシミュレート可能。
   */
  async setDevSubscriptionOverride(isSubscribed: boolean | null): Promise<void> {
    if (!__DEV__) return;
    try {
      if (isSubscribed === null) {
        await AsyncStorage.removeItem(DEV_SUBSCRIPTION_OVERRIDE_KEY);
        this.devSubscriptionOverride = null;
      } else {
        await AsyncStorage.setItem(DEV_SUBSCRIPTION_OVERRIDE_KEY, String(isSubscribed));
        this.devSubscriptionOverride = isSubscribed;
      }
      this.notifyIfChanged();
    } catch (error) {
      Logger.error('[PurchaseService] Failed to set dev override:', error);
      throw error;
    }
  }

  /**
   * 開発者オーバーライドの現在状態を取得
   */
  getDevSubscriptionOverride(): boolean | null {
    return __DEV__ ? this.devSubscriptionOverride : null;
  }

  /**
   * 利用可能なサブスクリプションプランを取得
   *
   * @returns 現在のOffering（月額・年間プラン情報）、取得失敗時はnull
   */
  async getOfferings(): Promise<PurchasesOffering | null> {
    try {
      const offerings = await Purchases.getOfferings();
      return offerings.current;
    } catch (error) {
      if (isBillingUnavailableError(error)) {
        Logger.warn('[PurchaseService] Cannot get offerings (billing unavailable)');
      } else {
        Logger.error('[PurchaseService] Failed to get offerings:', error);
      }
      return null;
    }
  }

  /**
   * サブスクリプションを購入
   *
   * @param pkg - 購入するパッケージ（月額または年間）
   * @returns 購入後のCustomerInfo
   * @throws {Error} userCancelled: ユーザーキャンセル、その他: 購入エラー
   */
  async purchasePackage(pkg: PurchasesPackage): Promise<CustomerInfo> {
    try {
      /* RevenueCat SDK経由で購入処理を実行（App Store/Google Play決済が実行される） */
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      /* 購入成功後、CustomerInfoを更新（エンタイトルメント状態が反映される） */
      this.customerInfo = customerInfo;
      Logger.info('[PurchaseService] Purchase successful');
      return customerInfo;
    } catch (error) {
      const err = error as { userCancelled?: boolean } | null;
      /* ユーザーが購入をキャンセルした場合は警告のみ（エラーとして扱わない） */
      if (err?.userCancelled) {
        Logger.info('[PurchaseService] User cancelled purchase');
      } else {
        Logger.error('[PurchaseService] Purchase failed:', error);
      }
      throw error;
    }
  }

  /**
   * サブスクリプションを復元
   *
   * @returns 復元後のCustomerInfo、Billing unavailable時はnull
   * @throws {Error} 復元エラー（Billing unavailable以外）
   */
  async restorePurchases(): Promise<CustomerInfo | null> {
    try {
      const customerInfo = await Purchases.restorePurchases();
      this.customerInfo = customerInfo;
      Logger.info('[PurchaseService] Purchases restored');
      return customerInfo;
    } catch (error) {
      if (isBillingUnavailableError(error)) {
        Logger.warn('[PurchaseService] Cannot restore (billing unavailable)');
        return null;
      }
      Logger.error('[PurchaseService] Restore failed:', error);
      throw error;
    }
  }

  /**
   * 現在のCustomerInfoを取得
   *
   * @returns 現在のCustomerInfo、Billing unavailable時はnull
   * @throws {Error} 取得エラー（Billing unavailable以外）
   */
  async getCustomerInfo(): Promise<CustomerInfo | null> {
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      this.customerInfo = customerInfo;
      return customerInfo;
    } catch (error) {
      if (isBillingUnavailableError(error)) {
        Logger.warn('[PurchaseService] Cannot get customer info');
        return null;
      }
      Logger.error('[PurchaseService] Failed to get customer info:', error);
      throw error;
    }
  }

  /**
   * Pro版加入状態を確認
   *
   * @remarks
   * DEVモードでオーバーライドが設定されている場合はその値を優先。
   * それ以外はRevenueCatのエンタイトルメント状態を確認。
   */
  isSubscribed(): boolean {
    /* DEV環境でオーバーライドが設定されている場合はその値を優先（テスト用） */
    if (__DEV__ && this.devSubscriptionOverride !== null) {
      return this.devSubscriptionOverride;
    }
    /* CustomerInfoが取得できていない場合は未加入として扱う */
    if (!this.customerInfo) return false;
    /* エンタイトルメントがアクティブかどうかで判定（有効期限切れは自動的に非アクティブになる） */
    return this.customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
  }

  /**
   * サブスクリプションの有効期限を取得
   */
  getExpirationDate(): Date | null {
    const entitlement = this.customerInfo?.entitlements.active[ENTITLEMENT_ID];
    if (!entitlement?.expirationDate) return null;
    return new Date(entitlement.expirationDate);
  }

  /**
   * 現在のプラン種別を取得
   */
  getCurrentPlanType(): 'monthly' | 'annual' | null {
    const entitlement = this.customerInfo?.entitlements.active[ENTITLEMENT_ID];
    if (!entitlement) return null;

    const productId = entitlement.productIdentifier;
    if (productId === PRODUCT_IDS.monthly) return 'monthly';
    if (productId === PRODUCT_IDS.annual) return 'annual';
    return null;
  }

  /**
   * ユーザーIDを設定（RevenueCatへログイン）
   *
   * @remarks
   * RevenueCatに対してユーザーを識別。
   * これにより複数デバイス間でサブスク状態を共有可能。
   */
  private async identifyUser(userId: string): Promise<void> {
    const { customerInfo } = await Purchases.logIn(userId);
    this.customerInfo = customerInfo;
    Logger.info(`[PurchaseService] User identified: ${userId}`);
  }

  /**
   * Firebase UIDとRevenueCatアカウントを紐付け
   *
   * @param userId - Firebase UID
   * @throws {Error} RevenueCatログインエラー
   *
   * @remarks
   * Firebaseログイン成功後に呼び出す。
   * 紐付け後、既存購入があれば自動復元を試行。
   */
  async linkAccount(userId: string): Promise<void> {
    try {
      Logger.info('[PurchaseService] Linking account:', userId);
      await this.identifyUser(userId);

      if (!this.isSubscribed()) {
        Logger.info('[PurchaseService] Trying auto-restore after login...');
        try {
          await this.restorePurchases();
        } catch {
          Logger.warn('[PurchaseService] Auto-restore failed (non-critical)');
        }
      }
      Logger.info('[PurchaseService] Account linked, subscribed:', this.isSubscribed());
    } catch (error) {
      Logger.error('[PurchaseService] Link account failed:', error);
      throw error;
    }
  }

  /**
   * RevenueCatからログアウト
   */
  async logout(): Promise<void> {
    try {
      const isAnonymous = await Purchases.isAnonymous();
      if (isAnonymous) {
        Logger.info('[PurchaseService] Already anonymous, skip logout');
        return;
      }

      await this.performLogout();
    } catch (error) {
      Logger.error('[PurchaseService] Logout failed:', error);
      await this.tryRefreshCustomerInfo();
    }
  }

  /**
   * 実際のログアウト処理を実行
   */
  private async performLogout(): Promise<void> {
    try {
      await Purchases.logOut();
      Logger.info('[PurchaseService] Logged out from RevenueCat');
      this.customerInfo = await Purchases.getCustomerInfo();

      if (!this.isSubscribed()) {
        await this.tryRestoreAnonymousPurchases();
      }
    } catch (error) {
      Logger.warn('[PurchaseService] Error during logout:', error);
      await this.tryRefreshCustomerInfo();
    }
  }

  /**
   * 匿名購入の復元を試行
   */
  private async tryRestoreAnonymousPurchases(): Promise<void> {
    Logger.info('[PurchaseService] Trying restore anonymous purchases...');
    try {
      this.customerInfo = await Purchases.restorePurchases();
      Logger.info('[PurchaseService] Anonymous restore completed');
    } catch {
      Logger.warn('[PurchaseService] Anonymous restore failed (non-critical)');
    }
  }

  /**
   * CustomerInfo更新を試行
   */
  private async tryRefreshCustomerInfo(): Promise<void> {
    try {
      this.customerInfo = await Purchases.getCustomerInfo();
    } catch {
      Logger.error('[PurchaseService] Failed to refresh customer info');
    }
  }

}

export const purchaseService = new PurchaseService();
