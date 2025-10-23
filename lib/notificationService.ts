/**
 * 通知サービス
 */

import * as Notifications from 'expo-notifications';
import { Logger } from './logger';

// 通知の動作設定
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface NotificationContent {
  title: string;
  body: string;
  data?: Record<string, any>;
}

export interface ScheduleNotificationOptions {
  content: NotificationContent;
  trigger: Notifications.NotificationTriggerInput;
}

class NotificationService {
  /**
   * 通知権限をリクエスト
   */
  async requestPermissions(): Promise<boolean> {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        Logger.warn('通知権限が拒否されました');
        return false;
      }

      Logger.success('通知権限が許可されました');
      return true;
    } catch (error) {
      Logger.error('通知権限リクエストエラー:', error);
      return false;
    }
  }

  /**
   * 即座に通知を表示
   */
  async showNotification(content: NotificationContent): Promise<string | null> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) return null;

      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: content.title,
          body: content.body,
          data: content.data,
        },
        trigger: null, // 即座に表示
      });

      Logger.debug('通知を表示:', id);
      return id;
    } catch (error) {
      Logger.error('通知表示エラー:', error);
      return null;
    }
  }

  /**
   * スケジュール通知を設定
   */
  async scheduleNotification(options: ScheduleNotificationOptions): Promise<string | null> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) return null;

      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: options.content.title,
          body: options.content.body,
          data: options.content.data,
        },
        trigger: options.trigger,
      });

      Logger.debug('スケジュール通知を設定:', id);
      return id;
    } catch (error) {
      Logger.error('スケジュール通知設定エラー:', error);
      return null;
    }
  }

  /**
   * 通知をキャンセル
   */
  async cancelNotification(notificationId: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      Logger.debug('通知をキャンセル:', notificationId);
    } catch (error) {
      Logger.error('通知キャンセルエラー:', error);
    }
  }

  /**
   * 全ての通知をキャンセル
   */
  async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      Logger.debug('全ての通知をキャンセル');
    } catch (error) {
      Logger.error('全通知キャンセルエラー:', error);
    }
  }

  /**
   * スケジュール済み通知を取得
   */
  async getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      Logger.error('スケジュール通知取得エラー:', error);
      return [];
    }
  }
}

export const notificationService = new NotificationService();
