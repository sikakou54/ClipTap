/**
 * FullAccessAdapter
 *
 * @description
 * キーボード拡張のフルアクセス状態を取得するアダプター。
 * ネイティブモジュール（FullAccessBridge）を呼び出して、
 * キーボード拡張がApp Group UserDefaultsに保存したフルアクセス状態を取得する。
 *
 * @module FullAccessAdapter
 */

import { NativeModules, Platform } from 'react-native';

/* ======================================== */
/* 型定義 */
/* ======================================== */

/**
 * ネイティブブリッジのインターフェース
 */
interface FullAccessBridgeInterface {
  getKeyboardFullAccessStatus(): Promise<boolean>;
  isUsageTrackingEnabled(): Promise<boolean>;
}

/* ======================================== */
/* ネイティブモジュール */
/* ======================================== */

const FullAccessBridge = NativeModules.FullAccessBridge as
  | FullAccessBridgeInterface
  | undefined;

/* ======================================== */
/* アダプター */
/* ======================================== */

/**
 * FullAccessAdapter
 *
 * キーボード拡張のフルアクセス状態を取得するアダプター
 */
export const FullAccessAdapter = {
  /**
   * キーボード拡張のフルアクセス状態を取得
   * @returns フルアクセスが許可されている場合はtrue
   * @note Androidではフルアクセス制限がないため常にtrue
   */
  async hasFullAccess(): Promise<boolean> {
    /* Androidはフルアクセス制限なし */
    if (Platform.OS === 'android') {
      return true;
    }
    /* iOSのみネイティブブリッジで確認 */
    if (Platform.OS !== 'ios' || !FullAccessBridge) {
      return false;
    }
    try {
      return await FullAccessBridge.getKeyboardFullAccessStatus();
    } catch (error) {
      console.error(
        '[FullAccessAdapter] Failed to get full access status:',
        error,
      );
      return false;
    }
  },

  /**
   * 使用頻度追跡が有効かどうかを取得
   * フルアクセス許可かつキーボード設定で使用頻度追跡がONの場合にtrue
   * @returns 使用頻度追跡が有効な場合はtrue
   * @note Androidではフルアクセス制限がないため常にtrue
   */
  async isUsageTrackingEnabled(): Promise<boolean> {
    /* Androidはフルアクセス制限なし */
    if (Platform.OS === 'android') {
      return true;
    }
    /* iOSのみネイティブブリッジで確認 */
    if (Platform.OS !== 'ios' || !FullAccessBridge) {
      return false;
    }
    try {
      return await FullAccessBridge.isUsageTrackingEnabled();
    } catch (error) {
      console.error(
        '[FullAccessAdapter] Failed to get usage tracking status:',
        error,
      );
      return false;
    }
  },
};
