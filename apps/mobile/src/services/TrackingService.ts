/**
 * App Tracking Transparency (ATT) 管理サービス
 *
 * iOS 14.5以降で必須となるApp Tracking Transparency (ATT) フレームワークの
 * 許可リクエストと状態管理を提供します。
 *
 * @class TrackingService
 *
 * @remarks
 * ### ATTとは
 * Appleのプライバシー保護機能で、アプリがユーザーのデータを追跡する前に
 * 明示的な許可を求めることを義務付けています。
 *
 * ### 対応プラットフォーム
 * - **iOS**: ATT許可ダイアログを表示（iOS 14.5以降で必須）
 * - **Android**: ATTは不要（常に許可として扱う）
 *
 * ### 許可ステータス
 * - `granted`: ユーザーが追跡を許可
 * - `denied`: ユーザーが追跡を拒否
 * - `undetermined`: まだユーザーに確認していない
 * - `restricted`: デバイス設定で追跡が制限されている
 * - `unavailable`: ATTが利用できない環境
 *
 * ### 広告表示との連携
 * - 許可されている場合: パーソナライズド広告を表示
 * - 拒否されている場合: 非パーソナライズド広告を表示
 *
 *
 * @module TrackingService
 */

import { Platform } from 'react-native';
import * as TrackingTransparency from 'expo-tracking-transparency';
import { Logger } from '@cliptap/shared';

export class TrackingService {
  /** キャッシュされたトラッキングステータス */
  private static trackingStatus: string | null = null;

  /**
   * ATT権限をリクエスト
   *
   * @returns 追跡が許可された場合はtrue
   */
  static async requestTrackingPermission(): Promise<boolean> {
    /* AndroidではATTは不要（常に許可として扱う） */
    if (Platform.OS !== 'ios') {
      Logger.info('TrackingService: Android detected, skipping ATT');
      this.trackingStatus = 'granted';
      return true;
    }

    try {
      /* キャッシュされたステータスがある場合はそれを使用（再リクエストを回避） */
      if (this.trackingStatus) {
        Logger.info(`TrackingService: Using cached status: ${this.trackingStatus}`);
        return this.trackingStatus === 'granted';
      }

      /* 現在のステータスを取得（既にユーザーが許可/拒否している場合） */
      const { status: currentStatus } = await TrackingTransparency.getTrackingPermissionsAsync();
      Logger.info(`TrackingService: Current status: ${currentStatus}`);

      /* 既に決定済みの場合はキャッシュして返す（ダイアログは表示しない） */
      if (currentStatus !== 'undetermined') {
        this.trackingStatus = currentStatus;
        return currentStatus === 'granted';
      }

      /* 未決定の場合は許可ダイアログを表示 */
      Logger.info('TrackingService: Requesting tracking permission...');
      const { status } = await TrackingTransparency.requestTrackingPermissionsAsync();

      /* 結果をキャッシュして返す */
      this.trackingStatus = status;
      Logger.success(`TrackingService: Permission result: ${status}`);

      return status === 'granted';
    } catch (error) {
      /* エラー時は拒否として扱う（安全側に倒す） */
      Logger.error('TrackingService: Error requesting permission:', error);
      this.trackingStatus = 'denied';
      return false;
    }
  }

  /**
   * 現在のトラッキングステータスを取得
   *
   * @returns {Promise<string>} 現在のステータス（granted, denied, undetermined, restricted, unavailable）
   * @throws {Error} ステータス取得に失敗した場合（catchされて'unavailable'を返す）
   *
   * @remarks
   * - **iOS**: 実際のATTステータスを返します
 * - **Android**: 常に'granted'を返します
 */
  static async getTrackingStatus(): Promise<string> {
    if (Platform.OS !== 'ios') {
      return 'granted';
    }

    try {
      const { status } = await TrackingTransparency.getTrackingPermissionsAsync();
      return status;
    } catch (error) {
      Logger.error('TrackingService: Error getting status:', error);
      return 'unavailable';
    }
  }

}
