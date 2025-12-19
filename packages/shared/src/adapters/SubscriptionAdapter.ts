/**
 * サブスクリプションアダプター
 *
 * @description
 * プラットフォーム固有の課金SDK（RevenueCat）を抽象化するAdapterパターン実装。
 *
 * 必要な理由:
 * - Mobile: RevenueCat SDK (react-native-purchases)
 * - Web: RevenueCat Purchases.js
 * - プラットフォームごとに異なるAPI体系を統一的に扱う
 *
 * 使用方法:
 * 1. アプリ起動時にプラットフォーム固有の実装を登録: setSubscriptionAdapter()
 * 2. SubscriptionServiceから getSubscriptionAdapter() で取得して課金処理実行
 *
 * @module SubscriptionAdapter
 */

import type { SubscriptionPlan, SubscriptionStatus, PurchaseResult } from '../types/Subscription';

export type SubscriptionListener = (isSubscribed: boolean) => void;

/**
 * サブスクリプションアダプターインターフェース
 */
export interface SubscriptionAdapter {
  /**
   * 購読状態を同期的に取得（キャッシュ値）
   *
   * @returns Proプラン契約中かどうか
   */
  isSubscribed(): boolean;

  /**
   * ローディング中かどうか
   */
  isLoading(): boolean;

  /**
   * サブスクリプション状態をサーバーから検証・更新
   *
   * @param userId - ユーザーID（RevenueCat App User IDとして紐付け）
   * @returns Proプラン契約中かどうか
   */
  checkSubscription(userId?: string | null): Promise<boolean>;

  /**
   * 状態変更リスナーを登録
   *
   * @param listener - 状態変更時に呼び出されるコールバック
   * @returns 登録解除用の関数
   */
  subscribe(listener: SubscriptionListener): () => void;

  /**
   * 登録済みリスナーに現在の状態を通知
   */
  notifyListeners(): void;

  /**
   * ユーザーアカウントと課金アカウントを紐付け
   */
  linkAccount?(userId: string): Promise<void>;

  /**
   * 課金アカウントからログアウト
   */
  logout?(): Promise<void>;

  /**
   * 最新の顧客情報を取得・更新
   */
  refreshCustomerInfo?(): Promise<void>;

  /**
   * 状態をリセット
   */
  reset?(): void;

  /* ======================================== */
  /* ドメインモデルベースのメソッド */
  /* ======================================== */

  /**
   * 詳細なサブスクリプションステータスを取得
   */
  getStatus?(): Promise<SubscriptionStatus>;

  /**
   * 利用可能なプラン一覧を取得
   */
  getPlans?(): Promise<SubscriptionPlan[]>;

  /**
   * プランを購入
   */
  purchase?(planId: string): Promise<PurchaseResult>;

  /**
   * 購入を復元
   */
  restore?(): Promise<SubscriptionStatus>;
}
