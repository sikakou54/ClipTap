/**
 * Proプラン導線の確認ダイアログフック
 *
 * 「上限に達した」「無効化された項目をタップした」といったProプランへの案内を、
 * 確認ダイアログの表示とpaywall遷移という1つの流れに集約する。
 */

import { useCallback } from 'react';
import { useRouter } from 'expo-router';
import { showConfirm } from '@utils/alerts';

/**
 * Proプランへの案内ダイアログを表示する関数を返す
 *
 * @remarks
 * 渡した文言で warning スタイルの確認ダイアログを表示し、利用者が承諾した場合にのみ
 * /subscription/paywall へ遷移する。
 * 確認なしで paywall へ遷移する用途には使わない（useSettingsScreen と
 * useManageSubscriptionScreen の遷移は確認ダイアログを持たない別物なので、この関数へ寄せてはならない）。
 * 翻訳キーの組み立ては呼び出し側で行い、この関数は完成した文言だけを受け取る。
 *
 * @returns 案内文言を受け取ってダイアログを表示する関数
 */
export function useUpgradePrompt(): (message: string) => void {
  const router = useRouter();

  return useCallback((message: string) => {
    showConfirm(message, () => router.push('/subscription/paywall'), undefined, 'warning');
  }, [router]);
}
