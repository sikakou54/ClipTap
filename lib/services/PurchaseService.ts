/**
 * サブスクリプション管理サービス
 * RevenueCat SDK を使用してアプリ内課金を管理
 */

import Purchases, {
  CustomerInfo,
  PurchasesOffering,
  PurchasesPackage,
  LOG_LEVEL,
} from 'react-native-purchases';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { profileMapper } from '../mappers/ProfileMapper';
import { variableMapper } from '../mappers/VariableMapper';
import { Logger } from '../logger';

// RevenueCat API Keys
const REVENUECAT_API_KEY_IOS = 'appl_jNZlGsifNBVjDLXzoIYWFLfldpo';
const REVENUECAT_API_KEY_ANDROID = 'goog_vadMOosrTWSQPgECDMwBdljckyw';

// Entitlement識別子（RevenueCatダッシュボードで設定）
export const ENTITLEMENT_ID = 'Pro';

// 商品ID（プラットフォーム別）
//
// 【重要】Google Play Billingのテスト購入について
// テスト環境では、サブスクリプション期間が短縮されます：
// - 1週間プラン → 5分
// - 1ヶ月プラン → 5分
// - 3ヶ月プラン → 10分
// - 6ヶ月プラン → 15分
// - 1年プラン → 30分
//
// これはテストを迅速に行うためのGoogle Play Billingの仕様です。
// 本番環境（Production）では、正常な期間（1ヶ月、1年）で動作します。
//
// 参考: https://developer.android.com/google/play/billing/test
export const PRODUCT_IDS = Platform.select({
  ios: {
    monthly: 'product.cliptap.Monthly',
    annual: 'product.cliptap.Annual',
  },
  android: {
    monthly: 'product.cliptap.pro:monthly',
    annual: 'product.cliptap.pro:annual',
  },
  default: {
    monthly: 'product.cliptap.Monthly',
    annual: 'product.cliptap.Annual',
  },
})!;

// サブスクリプションの機能
export enum SubscriptionFeature {
  NO_ADS = 'no_ads',
  CUSTOM_VARIABLES = 'custom_variables',
}

// 無料版のカスタム変数制限数
export const FREE_CUSTOM_VARIABLES_LIMIT = 5;

// 無料版の環境（プロファイル）制限数
export const FREE_PROFILES_LIMIT = 3;

// 開発者メニュー用のストレージキー
const DEV_SUBSCRIPTION_OVERRIDE_KEY = '@dev_subscription_override';

class PurchaseService {
  private isInitialized = false;
  private customerInfo: CustomerInfo | null = null;
  private devSubscriptionOverride: boolean | null = null;

  /**
   * RevenueCat SDKを初期化
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // 開発者メニューのオーバーライド設定を読み込み
      await this.loadDevOverride();

      // プラットフォーム別のAPI Key取得
      let apiKey: string;
      if (Platform.OS === 'ios') {
        apiKey = REVENUECAT_API_KEY_IOS;
      } else if (Platform.OS === 'android') {
        apiKey = REVENUECAT_API_KEY_ANDROID;
      } else {
        Logger.warn('[PurchaseService] Subscriptions are only available on iOS and Android');
        return;
      }

      // デバッグモードを有効化（開発時のみ）
      if (__DEV__) {
        Purchases.setLogLevel(LOG_LEVEL.DEBUG);
      }

      // RevenueCat初期化
      Purchases.configure({ apiKey });

      // 初回のCustomerInfo取得
      this.customerInfo = await Purchases.getCustomerInfo();

      this.isInitialized = true;
      Logger.info('[PurchaseService] Initialized successfully');
    } catch (error) {
      Logger.error('[PurchaseService] Failed to initialize:', error);
      throw error;
    }
  }

  /**
   * 開発者メニュー用：オーバーライド設定を読み込み
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
   * 開発者メニュー用：サブスクリプション状態を手動で設定
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

      // validフラグを更新
      this.updateValidFlags();
      Logger.info('[PurchaseService] Dev override set and valid flags updated');
    } catch (error) {
      Logger.error('[PurchaseService] Failed to set dev override:', error);
      throw error;
    }
  }

  /**
   * 開発者メニュー用：現在のオーバーライド状態を取得
   */
  getDevSubscriptionOverride(): boolean | null {
    if (!__DEV__) return null;
    return this.devSubscriptionOverride;
  }

  /**
   * 利用可能なサブスクリプションプランを取得
   */
  async getOfferings(): Promise<PurchasesOffering | null> {
    try {
      const offerings = await Purchases.getOfferings();
      return offerings.current;
    } catch (error) {
      Logger.error('[PurchaseService] Failed to get offerings:', error);
      return null;
    }
  }

  /**
   * サブスクリプションを購入
   */
  async purchasePackage(pkg: PurchasesPackage): Promise<CustomerInfo> {
    try {
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      this.customerInfo = customerInfo;
      Logger.info('[PurchaseService] Purchase successful');
      return customerInfo;
    } catch (error: any) {
      if (error.userCancelled) {
        Logger.info('[PurchaseService] User cancelled purchase');
      } else {
        Logger.error('[PurchaseService] Purchase failed:', error);
      }
      throw error;
    }
  }

  /**
   * サブスクリプションを復元
   */
  async restorePurchases(): Promise<CustomerInfo> {
    try {
      const customerInfo = await Purchases.restorePurchases();
      this.customerInfo = customerInfo;
      Logger.info('[PurchaseService] Purchases restored');
      return customerInfo;
    } catch (error) {
      Logger.error('[PurchaseService] Failed to restore purchases:', error);
      throw error;
    }
  }

  /**
   * 現在のCustomerInfoを取得
   */
  async getCustomerInfo(): Promise<CustomerInfo> {
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      this.customerInfo = customerInfo;
      return customerInfo;
    } catch (error) {
      Logger.error('[PurchaseService] Failed to get customer info:', error);
      throw error;
    }
  }

  /**
   * ユーザーがProプランに加入しているか確認
   */
  isSubscribed(): boolean {
    // 開発者メニューのオーバーライドがある場合はそれを優先
    if (__DEV__ && this.devSubscriptionOverride !== null) {
      return this.devSubscriptionOverride;
    }

    if (!this.customerInfo) return false;

    const entitlement = this.customerInfo.entitlements.active[ENTITLEMENT_ID];
    return entitlement !== undefined;
  }

  /**
   * 特定の機能が利用可能か確認
   */
  hasFeature(_feature: SubscriptionFeature): boolean {
    // Proプランに加入していれば全機能利用可能
    return this.isSubscribed();
  }

  /**
   * 広告を表示すべきか判定
   */
  shouldShowAds(): boolean {
    return !this.hasFeature(SubscriptionFeature.NO_ADS);
  }

  /**
   * カスタム変数の残り登録可能数を取得
   * @param currentCount 現在の登録数
   * @returns 残り登録可能数（Pro版の場合はnull = 無制限）
   */
  getRemainingCustomVariables(currentCount: number): number | null {
    // Pro版は無制限
    if (this.isSubscribed()) {
      return null;
    }
    // 無料版は5つまで
    return Math.max(0, FREE_CUSTOM_VARIABLES_LIMIT - currentCount);
  }

  /**
   * カスタム変数を追加可能か判定
   * @param currentCount 現在の登録数
   * @returns 追加可能ならtrue
   */
  canAddCustomVariable(currentCount: number): boolean {
    // Pro版は無制限
    if (this.isSubscribed()) {
      return true;
    }
    // 無料版は5つまで
    return currentCount < FREE_CUSTOM_VARIABLES_LIMIT;
  }

  /**
   * 環境（プロファイル）の残り登録可能数を取得
   * @param currentCount 現在の登録数
   * @returns 残り登録可能数（Pro版の場合はnull = 無制限）
   */
  getRemainingProfiles(currentCount: number): number | null {
    // Pro版は無制限
    if (this.isSubscribed()) {
      return null;
    }
    // 無料版は3つまで
    return Math.max(0, FREE_PROFILES_LIMIT - currentCount);
  }

  /**
   * 環境（プロファイル）を追加可能か判定
   * @param currentCount 現在の登録数
   * @returns 追加可能ならtrue
   */
  canAddProfile(currentCount: number): boolean {
    // Pro版は無制限
    if (this.isSubscribed()) {
      return true;
    }
    // 無料版は3つまで
    return currentCount < FREE_PROFILES_LIMIT;
  }

  /**
   * サブスクリプションの有効期限を取得
   */
  getExpirationDate(): Date | null {
    if (!this.customerInfo) return null;

    const entitlement = this.customerInfo.entitlements.active[ENTITLEMENT_ID];
    if (!entitlement) return null;

    return new Date(entitlement.expirationDate || '');
  }

  /**
   * 現在のサブスクリプションプラン種別を取得
   * @returns 'monthly' | 'annual' | null
   */
  getCurrentPlanType(): 'monthly' | 'annual' | null {
    if (!this.customerInfo) {
      return null;
    }

    const entitlement = this.customerInfo.entitlements.active[ENTITLEMENT_ID];
    if (!entitlement) {
      return null;
    }

    const productId = entitlement.productIdentifier;

    if (productId === PRODUCT_IDS.monthly) {
      return 'monthly';
    } else if (productId === PRODUCT_IDS.annual) {
      return 'annual';
    }

    return null;
  }

  /**
   * ユーザーIDを設定（ログイン時）
   */
  async identifyUser(userId: string): Promise<void> {
    try {
      await Purchases.logIn(userId);
      Logger.info(`[PurchaseService] User identified: ${userId}`);
    } catch (error) {
      Logger.error('[PurchaseService] Failed to identify user:', error);
      throw error;
    }
  }

  /**
   * ユーザーをログアウト
   */
  async logout(): Promise<void> {
    try {
      await Purchases.logOut();
      this.customerInfo = null;
      Logger.info('[PurchaseService] User logged out');
    } catch (error) {
      Logger.error('[PurchaseService] Failed to logout:', error);
      throw error;
    }
  }

  /**
   * プランに応じてvalidフラグを更新
   * アプリ起動時やサブスクリプション変化時に呼び出す
   */
  updateValidFlags(): void {
    try {
      const isSubscribed = this.isSubscribed();

      // 現在のアクティブ環境を取得
      const activeProfile = profileMapper.getActive();

      if (isSubscribed) {
        // Pro版：すべて有効
        profileMapper.updateValidFlags(999999); // 実質無制限
        variableMapper.updateValidFlags(999999); // 実質無制限
      } else {
        // Free版：制限あり
        profileMapper.updateValidFlags(FREE_PROFILES_LIMIT);
        variableMapper.updateValidFlags(FREE_CUSTOM_VARIABLES_LIMIT);
      }

      // validフラグ更新後、アクティブな環境が無効になっていないかチェック
      if (activeProfile) {
        const updatedProfile = profileMapper.getById(activeProfile.id);
        if (updatedProfile && !updatedProfile.valid) {
          // 無効になった場合、標準環境に切り替え
          const defaultProfile = profileMapper.getDefault();
          if (defaultProfile) {
            profileMapper.setActive(defaultProfile.id);
            Logger.info(`[PurchaseService] Active profile became invalid, switched to default profile: ${defaultProfile.name}`);
          }
        }
      }

      Logger.info(`[PurchaseService] Updated valid flags for ${isSubscribed ? 'Pro' : 'Free'} plan`);
    } catch (error) {
      Logger.error('[PurchaseService] Failed to update valid flags:', error);
      throw error;
    }
  }
}

export const purchaseService = new PurchaseService();
