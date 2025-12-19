/**
 * 開発者メニューフック
 *
 * DEVモードでのみ使用される開発者向け機能を提供。
 * データベース操作、サブスクリプション状態のテスト等。
 *
 * @remarks
 * このフックは__DEV__モードでのみ有効な機能を提供します。
 * 本番ビルドでは使用しないでください。
 *
 * @see useSettingsScreen - 設定画面から呼び出される
 */

import { useCallback } from 'react';
import { Alert } from 'react-native';
import { Logger } from '@cliptap/shared';
import { useSubscription } from '@providers/SubscriptionProvider';
import { database } from '@database/database';
import { SCHEMA_VERSION } from '@database/schema';
import { runSeed } from '@database/seed';
import { showConfirm, showAlert, showErrorAlert } from '@utils/alerts';
import * as Updates from 'expo-updates';

/** useDevMenu フックの返却値 */
export interface UseDevMenuReturn {
  /** サブスクリプション状態切り替え */
  handleDevSubscriptionToggle: () => Promise<void>;
  /** データベースリセット */
  handleResetDatabase: () => Promise<void>;
  /** データベースファイル削除 */
  handleDeleteDatabase: () => Promise<void>;
  /** スキーマバージョン変更 */
  handleChangeSchemaVersion: () => Promise<void>;
}

/**
 * 開発者メニュー用フック
 * DEVモードでのデバッグ・テスト機能を提供
 */
export function useDevMenu(): UseDevMenuReturn {
  const { setDevSubscriptionOverride } = useSubscription();

  /* ======================================== */
  /* イベントハンドラ */
  /* ======================================== */

  const handleDevSubscriptionToggle = useCallback(async () => {
    Alert.alert(
      'Subscription Override',
      'Choose subscription status for keyboard extension',
      [
        {
          text: 'Free',
          onPress: async () => {
            await setDevSubscriptionOverride(false);
            Alert.alert(
              'Dev Mode - Free',
              '🆓 無料版に設定しました\n\n画面が自動的に更新されます'
            );
          },
        },
        {
          text: 'Pro (期限内)',
          onPress: async () => {
            await setDevSubscriptionOverride(true);
            Alert.alert(
              'Dev Mode - Pro',
              '✅ Pro版（期限内）に設定しました\n\n画面が自動的に更新されます'
            );
          },
        },
        {
          text: 'Expired (期限切れ)',
          onPress: async () => {
            const { keyboardExtensionService } = await import('../../services/KeyboardExtensionService');
            keyboardExtensionService.setExpiredForTesting();
            Alert.alert(
              'Dev Mode - Expired',
              '⏰ 期限切れに設定しました\n\nキーボード拡張を開き直してください'
            );
          },
        },
        {
          text: 'No Data (データなし)',
          onPress: async () => {
            const { keyboardExtensionService } = await import('../../services/KeyboardExtensionService');
            keyboardExtensionService.clearDataForTesting();
            Alert.alert(
              'Dev Mode - No Data',
              '🗑️ データなしに設定しました\n\nキーボード拡張を開き直してください'
            );
          },
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  }, [setDevSubscriptionOverride]);

  const handleResetDatabase = useCallback(async () => {
    showConfirm(
      'This will delete ALL data and runSeed test data. App will reload. Continue?',
      async () => {
        try {
          Logger.debug('[Dev] Resetting database...');
          await database.reset();
          Logger.debug('[Dev] Seeding test data...');
          await runSeed();
          Logger.debug('[Dev] Database reset complete!');

          showAlert(
            'Success',
            'Database reset complete! App will reload now.',
            undefined,
            async () => {
              if (__DEV__) {
                await Updates.reloadAsync();
              }
            }
          );
        } catch (error) {
          Logger.error('[Dev] Failed to reset database:', error);
          showErrorAlert('Failed to reset database: ' + String(error));
        }
      },
      undefined,
      'danger'
    );
  }, []);

  const handleDeleteDatabase = useCallback(async () => {
    showConfirm(
      'This will COMPLETELY DELETE the database file and recreate it. All data will be lost. App will reload. Continue?',
      async () => {
        try {
          Logger.debug('[Dev] Deleting database file...');
          await database.deleteAndRecreate();
          Logger.debug('[Dev] Seeding test data...');
          await runSeed();
          Logger.debug('[Dev] Database recreated complete!');

          showAlert(
            'Success',
            'Database file deleted and recreated! App will reload now.',
            undefined,
            async () => {
              if (__DEV__) {
                await Updates.reloadAsync();
              }
            }
          );
        } catch (error) {
          Logger.error('[Dev] Failed to delete database:', error);
          showErrorAlert('Failed to delete database: ' + String(error));
        }
      },
      undefined,
      'danger'
    );
  }, []);

  const handleChangeSchemaVersion = useCallback(async () => {
    try {
      const currentVersion = await database.getSchemaVersion();

      Alert.alert(
        'Change Schema Version',
        `Current: ${currentVersion} / Target: ${SCHEMA_VERSION}\n\nChange database version to:`,
        [
          {
            text: 'Version 0 (New DB)',
            onPress: async () => {
              await database.setVersionManually(0);
              Alert.alert('Success', 'Version changed to 0. Reload app to trigger migration.');
            },
          },
          {
            text: 'Version 1 (Old Schema)',
            onPress: async () => {
              await database.setVersionManually(1);
              Alert.alert('Success', 'Version changed to 1. Reload app to trigger V1→V2 migration.');
            },
          },
          {
            text: `Version ${SCHEMA_VERSION} (Current)`,
            onPress: async () => {
              await database.setVersionManually(SCHEMA_VERSION);
              Alert.alert('Success', `Version changed to ${SCHEMA_VERSION}`);
            },
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ]
      );
    } catch (error) {
      Logger.error('[Dev] Failed to change schema version:', error);
      Alert.alert('Error', 'Failed to change version: ' + String(error));
    }
  }, []);

  return {
    handleDevSubscriptionToggle,
    handleResetDatabase,
    handleDeleteDatabase,
    handleChangeSchemaVersion,
  };
}
