/**
 * サブスクリプション状態を購読するReactフック（Web版）
 *
 * @module useWebSubscription
 */
import { useState, useEffect } from 'react';
import { SubscriptionService as SharedSubscriptionService } from '@cliptap/shared';

/**
 * React Hook用のサブスクリプション状態取得
 *
 * @remarks
 * 追加可否の判定は共通のSubscriptionServiceへ委譲する。上限値の比較をここで書き直すと、
 * モバイルの共通SubscriptionProviderと判定が二重定義になり食い違うため。
 * 判定関数は呼び出し時に最新の権利状態を読む。状態が変わるとisSubscribedの更新で
 * 再描画が起きるため、描画中に呼べば常に最新の判定になる。
 *
 * @returns isSubscribed: サブスクリプション状態、isLoading: ローディング状態、canAddProfile / canAddCustomVariable: 追加可否判定、checkSubscription: 検証関数
 */
export function useSubscription() {
  /* サブスクリプション状態を管理（初期値は共通サービスから取得） */
  const [isSubscribed, setIsSubscribed] = useState(SharedSubscriptionService.isSubscribed());
  /* ローディング状態を管理（初期値は共通サービスから取得） */
  const [isLoading, setIsLoading] = useState(SharedSubscriptionService.isLoading());

  /* コンポーネントのマウント時に共通サービスの状態変更を購読 */
  useEffect(() => {
    /* 共通サービスの状態変更を購読（サブスクリプション状態が変わったら通知される） */
    const unsubscribe = SharedSubscriptionService.subscribe((subscribed) => {
      /* サブスクリプション状態を更新 */
      setIsSubscribed(subscribed);
      /* ローディング状態を更新 */
      setIsLoading(SharedSubscriptionService.isLoading());
    });
    /* コンポーネントのアンマウント時に購読を解除（メモリリーク防止） */
    return unsubscribe;
  }, []); /* 依存配列が空なのでマウント時のみ実行 */

  /* サブスクリプション状態とチェック関数を返す */
  return {
    isSubscribed, /* サブスクリプション状態（true: Pro会員、false: 無料会員） */
    isLoading, /* ローディング状態（true: 検証中、false: 検証完了） */
    canAddProfile: SharedSubscriptionService.canAddProfile.bind(SharedSubscriptionService), /* プロファイル追加可否（保存済み総数を渡す） */
    canAddCustomVariable: SharedSubscriptionService.canAddVariable.bind(SharedSubscriptionService), /* カスタム変数追加可否（保存済み総数を渡す） */
    checkSubscription: SharedSubscriptionService.checkSubscription.bind(SharedSubscriptionService), /* サブスクリプション検証関数 */
  };
}
