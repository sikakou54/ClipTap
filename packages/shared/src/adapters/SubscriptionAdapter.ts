/**
 * サブスクリプションアダプター
 *
 * @description
 * プラットフォーム固有の課金状態取得手段を抽象化するAdapterパターン実装。
 *
 * 必要な理由:
 * - Mobile: RevenueCat SDK (react-native-purchases) を直接呼ぶ
 * - Web: ClipTap API（Cloudflare Worker）へ問い合わせる。ブラウザに課金SDKは載せない
 * - プラットフォームごとに異なるAPI体系を統一的に扱う
 *
 * 使用方法:
 * 1. アプリ起動時に init() へプラットフォーム固有の実装を渡す
 *    （init() → setAllAdapters() → setSubscriptionAdapter() の順で登録される）
 * 2. 取得は SubscriptionService.getAdapter()。他のアダプターと違い
 *    getSubscriptionAdapter() / hasSubscriptionAdapter() は存在しない
 *
 * @remarks
 * 課金抽象の責務境界:
 * - 本インターフェースと SubscriptionService が課金抽象の正である。React非依存の権利判定と
 *   validフラグ更新を担い、SnippetProvider・AuthService・ImportService などReact外からも呼ばれる。
 *   購入・復元・プラン取得は getPlans / purchase / restore にのみ置く。
 * - SubscriptionPlatformAdapter / SubscriptionProvider（providers/SubscriptionProvider.tsx）は
 *   Reactの描画状態と権利確認失敗の制御だけを担う層で、購入系を持たない。
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
