/**
 * TrackingService - App Tracking Transparency (ATT) 管理
 */

import { Platform } from 'react-native';
import * as TrackingTransparency from 'expo-tracking-transparency';
import { Logger } from '../logger';

export class TrackingService {
  private static trackingStatus: string | null = null;

  /**
   * ATT権限をリクエスト (iOS専用)
   * Androidでは自動的に許可される
   */
  static async requestTrackingPermission(): Promise<boolean> {
    // Androidは常にtrueを返す
    if (Platform.OS !== 'ios') {
      Logger.info('TrackingService: Android detected, skipping ATT');
      this.trackingStatus = 'granted';
      return true;
    }

    try {
      // 既にステータスが取得済みの場合
      if (this.trackingStatus) {
        Logger.info(`TrackingService: Using cached status: ${this.trackingStatus}`);
        return this.trackingStatus === 'granted';
      }

      // 現在のトラッキングステータスを確認
      const { status: currentStatus } = await TrackingTransparency.getTrackingPermissionsAsync();
      Logger.info(`TrackingService: Current status: ${currentStatus}`);

      // 既に決定済みの場合はリクエストしない
      if (currentStatus !== 'undetermined') {
        this.trackingStatus = currentStatus;
        return currentStatus === 'granted';
      }

      // ATT許可ダイアログを表示
      Logger.info('TrackingService: Requesting tracking permission...');
      const { status } = await TrackingTransparency.requestTrackingPermissionsAsync();

      this.trackingStatus = status;
      Logger.success(`TrackingService: Permission result: ${status}`);

      return status === 'granted';
    } catch (error) {
      Logger.error('TrackingService: Error requesting permission:', error);
      // エラー時は拒否として扱う
      this.trackingStatus = 'denied';
      return false;
    }
  }

  /**
   * 現在のトラッキングステータスを取得
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

  /**
   * トラッキング許可されているか確認
   */
  static async isTrackingEnabled(): Promise<boolean> {
    const status = await this.getTrackingStatus();
    return status === 'granted';
  }

  /**
   * キャッシュをクリア (テスト用)
   */
  static clearCache(): void {
    this.trackingStatus = null;
  }
}
