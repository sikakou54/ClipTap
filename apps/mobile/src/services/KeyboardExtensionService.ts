/**
 * キーボード拡張連携サービス
 *
 * @description
 * キーボード拡張（iOS: App Extension, Android: IME）との連携を管理。
 * サブスクリプション状態をApp Group/SharedPreferences経由で共有する。
 *
 * ### キーボード拡張機能とは
 * - iOS: システムキーボード上でスニペットを直接挿入できる機能（App Extension）
 * - Android: カスタムIME（Input Method Editor）としてスニペットを提供
 *
 * ### サブスク状態の共有方法
 * - iOS: App Group UserDefaults経由でメインアプリと拡張機能がデータを共有
 * - Android: SharedPreferences経由で同一アプリ内でデータを共有
 *
 * ### 注意点
 * キーボード拡張はネットワークアクセスが制限されるため、
 * メインアプリでサブスク状態を保存し、拡張機能が読み取る設計。
 *
 * @module KeyboardExtensionService
 */

import { NativeModules } from 'react-native';
import { Logger } from '@cliptap/shared';

/* ======================================== */
/* ネイティブモジュールの取得 */
/* ======================================== */

/**
 * SubscriptionBridgeネイティブモジュール
 *
 * iOS: AppDelegateにイベントを送信し、App Group UserDefaultsにサブスク状態を保存
 * Android: SharedPreferencesに直接サブスク状態を保存
 */
const SubscriptionBridge = NativeModules.SubscriptionBridge || null;

/* ======================================== */
/* デバッグログ: モジュール可用性チェック */
/* ======================================== */

if (SubscriptionBridge) {
  Logger.debug('[KeyboardExtensionService] SubscriptionBridge module is available');
  Logger.debug('[KeyboardExtensionService] SubscriptionBridge methods:', Object.keys(SubscriptionBridge));
} else {
  Logger.warn('[KeyboardExtensionService] SubscriptionBridge module NOT found');
}

/**
 * キーボード拡張連携サービス
 */
class KeyboardExtensionService {
  /**
   * SubscriptionBridgeが利用可能かどうか
   */
  isAvailable(): boolean {
    return SubscriptionBridge !== null;
  }

  /**
   * サブスクリプション状態を保存
   *
   * @param isPremium - Pro版かどうか
   * @param expirationDate - 有効期限（null = 無期限または未加入）
   *
   * @remarks
   * キーボード拡張はネットワークアクセスが制限されるため、
   * メインアプリでサブスク状態を保存し、拡張機能側で読み取る設計。
   *
   * - iOS: App Group UserDefaultsに保存（Extensionプロセスから読取可能）
   * - Android: SharedPreferencesに保存
   */
  saveSubscriptionStatus(isPremium: boolean, expirationDate: Date | null): void {
    if (!SubscriptionBridge) {
      return;
    }

    try {
      const expiryDateString = expirationDate ? expirationDate.toISOString() : null;
      Logger.info(`[KeyboardExtensionService] Saving subscription status: isPremium=${isPremium}, expiryDate=${expiryDateString}`);

      if (typeof SubscriptionBridge.saveSubscriptionStatus !== 'function') {
        Logger.error('[KeyboardExtensionService] ❌ saveSubscriptionStatus is not a function!', typeof SubscriptionBridge.saveSubscriptionStatus);
        return;
      }

      SubscriptionBridge.saveSubscriptionStatus(isPremium, expiryDateString);
      Logger.info(`[KeyboardExtensionService] ✅ Subscription status saved successfully`);
    } catch (error) {
      Logger.error('[KeyboardExtensionService] Failed to save subscription status:', error);
    }
  }

  /* ======================================== */
  /* 開発者メニュー用テスト機能 */
  /* ======================================== */

  /**
   * テスト用：無料版状態を書き込む
   */
  setFreeForTesting(): void {
    if (!__DEV__) return;
    if (!SubscriptionBridge) {
      Logger.warn('[KeyboardExtensionService] SubscriptionBridge not available');
      return;
    }

    try {
      SubscriptionBridge.saveSubscriptionStatus(false, null);
      Logger.info('[KeyboardExtensionService] ✅ Test free subscription written');
    } catch (error) {
      Logger.error('[KeyboardExtensionService] Failed to write free subscription:', error);
      throw error;
    }
  }

  /**
   * テスト用：期限切れサブスクリプションを書き込む
   */
  setExpiredForTesting(): void {
    if (!__DEV__) return;
    if (!SubscriptionBridge) {
      Logger.warn('[KeyboardExtensionService] SubscriptionBridge not available');
      return;
    }

    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const expiryDateString = yesterday.toISOString();

      SubscriptionBridge.saveSubscriptionStatus(true, expiryDateString);
      Logger.info(`[KeyboardExtensionService] ✅ Test expired subscription written: expiryDate=${expiryDateString}`);
    } catch (error) {
      Logger.error('[KeyboardExtensionService] Failed to write expired subscription:', error);
      throw error;
    }
  }

  /**
   * テスト用：有効なサブスクリプションを書き込む
   */
  setActiveForTesting(): void {
    if (!__DEV__) return;
    if (!SubscriptionBridge) {
      Logger.warn('[KeyboardExtensionService] SubscriptionBridge not available');
      return;
    }

    try {
      const nextYear = new Date();
      nextYear.setFullYear(nextYear.getFullYear() + 1);
      const expiryDateString = nextYear.toISOString();

      SubscriptionBridge.saveSubscriptionStatus(true, expiryDateString);
      Logger.info(`[KeyboardExtensionService] ✅ Test active subscription written: expiryDate=${expiryDateString}`);
    } catch (error) {
      Logger.error('[KeyboardExtensionService] Failed to write active subscription:', error);
      throw error;
    }
  }

  /**
   * テスト用：サブスクリプションデータをクリア（NO_DATA状態を再現）
   */
  clearDataForTesting(): void {
    if (!__DEV__) return;
    if (!SubscriptionBridge) {
      Logger.warn('[KeyboardExtensionService] SubscriptionBridge not available');
      return;
    }

    try {
      SubscriptionBridge.clearSubscriptionData();
      Logger.info('[KeyboardExtensionService] ✅ Test subscription data cleared (NO_DATA state)');
    } catch (error) {
      Logger.error('[KeyboardExtensionService] Failed to clear subscription data:', error);
      throw error;
    }
  }
}

/**
 * KeyboardExtensionServiceのシングルトンインスタンス
 */
export const keyboardExtensionService = new KeyboardExtensionService();
