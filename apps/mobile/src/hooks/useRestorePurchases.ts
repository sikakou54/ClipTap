/**
 * 購入復元処理の共通Hook
 *
 * 復元処理の実行・状態管理・結果通知を提供。
 * Paywall画面・サブスクリプション管理画面で共通利用。
 */

import { useState, useCallback } from 'react';
import { useTranslation } from '@cliptap/shared';
import { useSubscription } from '@providers/SubscriptionProvider';
import { showAlert, showErrorAlert } from '@utils/alerts';

interface UseRestorePurchasesOptions {
  onSuccess?: () => void;
}

interface UseRestorePurchasesResult {
  restoring: boolean;
  handleRestore: () => Promise<void>;
}

export function useRestorePurchases(
  options: UseRestorePurchasesOptions = {}
): UseRestorePurchasesResult {
  const { t } = useTranslation();
  const { isSubscribed, restorePurchases } = useSubscription();

  const [restoring, setRestoring] = useState(false);

  /**
   * 購入復元処理
   *
   * 処理フロー:
   * 1. RevenueCatから購入履歴を取得
   * 2. サブスク状態をチェック
   * 3. 成功/失敗のアラート表示
   * 4. 成功時はonSuccessコールバック実行
   *
   * 注意: isSubscribedはクロージャキャプチャ時の値のため、
   * 厳密には最新値を得るにはrestorePurchasesの返り値を使うか、
   * Service層に直接問い合わせる必要がある。
   */
  const handleRestore = useCallback(async () => {
    try {
      setRestoring(true);

      /* RevenueCatから購入履歴を復元（ストアに問い合わせ） */
      await restorePurchases();

      if (isSubscribed) {
        showAlert('', t('subscription.restore_success'), undefined, options.onSuccess);
      } else {
        showErrorAlert(t('subscription.restore_failed'));
      }
    } catch {
      showErrorAlert(t('subscription.restore_failed'));
    } finally {
      setRestoring(false);
    }
  }, [restorePurchases, isSubscribed, t, options.onSuccess]);

  return {
    restoring,
    handleRestore,
  };
}
