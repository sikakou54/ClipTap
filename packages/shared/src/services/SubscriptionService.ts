/**
 * サブスクリプション管理サービス
 *
 * @module SubscriptionService
 * @remarks
 * プラットフォーム固有のSubscriptionAdapterを使用してサブスクリプション状態を管理。
 * Mobile/Webで共通のAPI経由で無料版とProプランの機能制限を一元管理する。
 *
 * 主な機能:
 * - サブスクリプション状態の管理・照会
 * - 機能制限チェック（変数数・プロファイル数）
 * - validフラグの更新（無料版での使用可能アイテム管理）
 * - 認証連携（Firebase UID ↔ RevenueCat）
 *
 * アーキテクチャ:
 * - Adapterパターンで依存を注入（Mobile: RevenueCat, Web: NoOp）
 * - ValidFlagsUpdaterでMapper操作を抽象化（shared→app依存を回避）
 */

import type { SubscriptionAdapter, SubscriptionListener } from '../adapters/SubscriptionAdapter';
import type { SubscriptionPlan, SubscriptionStatus, PurchaseResult } from '../types/Subscription';
import type { Profile } from '../schema';

/** 無料プランで使用可能なプロファイル数 */
export const FREE_PROFILES_LIMIT = 3;
/** 無料プランで使用可能な変数数 */
export const FREE_VARIABLES_LIMIT = 5;

/**
 * validフラグ更新用のコールバックインターフェース
 *
 * @interface ValidFlagsUpdater
 * @remarks
 * SubscriptionServiceからMapper操作を抽象化するためのコールバック。
 * shared→app間の依存を回避。
 */
export interface ValidFlagsUpdater {
  /** プロファイルのvalidフラグを更新 */
  updateProfileValidFlags: (limit: number) => void;
  /** 変数のvalidフラグを更新 */
  updateVariableValidFlags: (limit: number) => void;
  /** アクティブプロファイルを取得 */
  getActiveProfile: () => Profile | null;
  /** IDでプロファイルを取得 */
  getProfileById: (id: string) => Profile | null;
  /** デフォルトプロファイルを取得 */
  getDefaultProfile: () => Profile | null;
  /** アクティブプロファイルを設定 */
  setActiveProfile: (id: string) => void;
  /** DBアダプターが初期化済みか確認 */
  hasDbAdapter: () => boolean;
}

/**
 * サブスクリプション管理サービス
 *
 * @class SubscriptionService
 * @remarks
 * 静的メソッドのみで構成。シングルトンとして動作。
 * Adapterパターンでプラットフォーム固有の実装を注入。
 */
export class SubscriptionService {
  /** プラットフォーム固有のアダプター */
  private static adapter: SubscriptionAdapter | null = null;
  /** 無料プランのプロファイル上限 */
  private static freeProfilesLimit = FREE_PROFILES_LIMIT;
  /** 無料プランの変数上限 */
  private static freeVariablesLimit = FREE_VARIABLES_LIMIT;
  /** validフラグ更新用コールバック */
  private static validFlagsUpdater: ValidFlagsUpdater | null = null;

  /**
   * サブスクリプションアダプターを設定
   *
   * @param adapter - プラットフォーム固有のアダプター
   * @param options - オプション（制限値のオーバーライド）
   * @remarks
   * アプリ起動時に一度だけ呼び出す。
   * Mobile: MobileSubscriptionAdapter, Web: NoOp実装を注入。
   */
  static setAdapter(
    adapter: SubscriptionAdapter,
    options?: { freeProfilesLimit?: number; freeVariablesLimit?: number }
  ): void {
    this.adapter = adapter;
    if (options?.freeProfilesLimit !== undefined) {
      this.freeProfilesLimit = options.freeProfilesLimit;
    }
    if (options?.freeVariablesLimit !== undefined) {
      this.freeVariablesLimit = options.freeVariablesLimit;
    }
  }

  /**
   * validフラグ更新用のコールバックを設定
   *
   * @param updater - Mapper操作を行うコールバック
   */
  static setValidFlagsUpdater(updater: ValidFlagsUpdater): void {
    this.validFlagsUpdater = updater;
  }

  /**
   * validFlagsUpdater が設定済みか確認
   *
   * @returns 設定済みの場合true
   */
  static hasValidFlagsUpdater(): boolean {
    return this.validFlagsUpdater !== null;
  }

  /**
   * アダプターが設定済みか確認
   *
   * @returns SubscriptionAdapter
   * @throws {Error} アダプター未設定の場合
   */
  private static ensureAdapter(): SubscriptionAdapter {
    if (!this.adapter) {
      throw new Error('SubscriptionAdapter not set. Call setAdapter() first.');
    }
    return this.adapter;
  }

  /**
   * 登録済みのアダプターを取得
   *
   * @returns 登録済みのSubscriptionAdapter、または未設定の場合はnull
   * @remarks
   * Mobile: プラットフォーム固有のコールバック設定などに使用
   */
  static getAdapter(): SubscriptionAdapter | null {
    return this.adapter;
  }

  /**
   * Pro版加入状態を取得
   *
   * @returns Pro版に加入している場合true
   */
  static isSubscribed(): boolean {
    return this.adapter?.isSubscribed() ?? false;
  }

  /**
   * 読み込み中状態を取得
   *
   * @returns 初期化中の場合true
   */
  static isLoading(): boolean {
    return this.adapter?.isLoading() ?? false;
  }

  /**
   * サブスクリプション状態を確認
   *
   * @param userId - ユーザーID（オプション）
   * @returns Pro版に加入している場合true
   */
  static async checkSubscription(userId?: string | null): Promise<boolean> {
    return this.ensureAdapter().checkSubscription(userId);
  }

  /**
   * サブスクリプション状態変更を購読
   *
   * @param listener - 状態変更時に呼び出されるコールバック
   * @returns 購読解除関数
   */
  static subscribe(listener: SubscriptionListener): () => void {
    return this.ensureAdapter().subscribe(listener);
  }

  /**
   * 変数を追加可能か判定
   *
   * @param currentCount - 現在の変数数
   * @returns 追加可能な場合true
   * @remarks Pro版は無制限、無料版は上限まで。
   */
  static canAddVariable(currentCount: number): boolean {
    return this.isSubscribed() || currentCount < this.freeVariablesLimit;
  }

  /**
   * プロファイルを追加可能か判定
   *
   * @param currentCount - 現在のプロファイル数
   * @returns 追加可能な場合true
   * @remarks Pro版は無制限、無料版は上限まで。
   */
  static canAddProfile(currentCount: number): boolean {
    return this.isSubscribed() || currentCount < this.freeProfilesLimit;
  }

  /**
   * 無効（使用不可）なアイテム数を計算
   *
   * @param totalCount - 総アイテム数
   * @param limit - 上限数
   * @returns 上限を超えたアイテム数
   */
  private static getInvalidCount(totalCount: number, limit: number): number {
    return this.isSubscribed() ? 0 : Math.max(0, totalCount - limit);
  }

  /**
   * 無効な変数数を取得
   *
   * @param totalCount - 総変数数
   * @returns 無効な変数数（無料版で上限超過分）
   */
  static getInvalidVariablesCount(totalCount: number): number {
    return this.getInvalidCount(totalCount, this.freeVariablesLimit);
  }

  /**
   * 無効なプロファイル数を取得
   *
   * @param totalCount - 総プロファイル数
   * @returns 無効なプロファイル数（無料版で上限超過分）
   */
  static getInvalidProfilesCount(totalCount: number): number {
    return this.getInvalidCount(totalCount, this.freeProfilesLimit);
  }

  /**
   * 無料プランのプロファイル上限を取得
   *
   * @returns プロファイル上限数
   */
  static getFreeProfilesLimit(): number {
    return this.freeProfilesLimit;
  }

  /**
   * 無料プランの変数上限を取得
   *
   * @returns 変数上限数
   */
  static getFreeVariablesLimit(): number {
    return this.freeVariablesLimit;
  }

  /**
   * validフラグを更新
   *
   * @remarks
   * サブスク状態に応じてProfile/Variableのvalidフラグを更新。
   * 無料版では上限を超えたアイテムをinvalidにする。
   * アクティブプロファイルが無効になった場合、デフォルトに自動切り替え。
   */
  static updateValidFlags(): void {
    if (!this.validFlagsUpdater?.hasDbAdapter()) {
      return;
    }

    try {
      const activeProfile = this.validFlagsUpdater.getActiveProfile();
      const subscribed = this.isSubscribed();

      /* Pro版は実質無制限（999999）、無料版は定数制限 */
      const limit = subscribed ? 999999 : this.freeProfilesLimit;
      const varLimit = subscribed ? 999999 : this.freeVariablesLimit;

      /* created_at順でソート後、limit番目以降のアイテムのvalidフラグをfalseに設定 */
      this.validFlagsUpdater.updateProfileValidFlags(limit);
      this.validFlagsUpdater.updateVariableValidFlags(varLimit);

      /* アクティブ環境が無効化された場合、強制的にデフォルトに切り替え */
      if (activeProfile) {
        const updated = this.validFlagsUpdater.getProfileById(activeProfile.id);
        if (updated && !updated.valid) {
          const defaultProfile = this.validFlagsUpdater.getDefaultProfile();
          if (defaultProfile) {
            this.validFlagsUpdater.setActiveProfile(defaultProfile.id);
          }
        }
      }

    } catch {
      /* 起動直後などDB未初期化時の正常エラーのため、ログ出力なし */
    }
  }

  /**
   * Firebase UIDとRevenueCatアカウントを紐付け
   *
   * @param userId - Firebase UID
   */
  static async linkAccount(userId: string): Promise<void> {
    await this.adapter?.linkAccount?.(userId);
  }

  /**
   * RevenueCatからログアウト
   */
  static async logout(): Promise<void> {
    await this.adapter?.logout?.();
  }

  /**
   * CustomerInfo（顧客情報）を最新化
   */
  static async refreshCustomerInfo(): Promise<void> {
    await this.adapter?.refreshCustomerInfo?.();
  }

  /**
   * サービスをリセット
   *
   * @remarks テスト用。状態を初期化する。
   */
  static reset(): void {
    this.adapter?.reset?.();
  }

  /* ======================================== */
  /* Adapter拡張メソッド */
  /* ======================================== */

  /**
   * 詳細なサブスクリプションステータスを取得
   *
   * @returns サブスクリプションステータス、未実装時はnull
   */
  static async getStatus(): Promise<SubscriptionStatus | null> {
    return this.adapter?.getStatus?.() ?? null;
  }

  /**
   * 利用可能なプラン一覧を取得
   *
   * @returns プラン一覧、未実装時は空配列
   */
  static async getPlans(): Promise<SubscriptionPlan[]> {
    return this.adapter?.getPlans?.() ?? [];
  }

  /**
   * プランを購入
   *
   * @param planId - 購入するプランID
   * @returns 購入結果
   * @throws {Error} アダプター未設定または機能未実装時
   */
  static async purchase(planId: string): Promise<PurchaseResult> {
    const adapter = this.ensureAdapter();
    if (!adapter.purchase) {
      throw new Error('Purchase not supported on this platform');
    }
    return adapter.purchase(planId);
  }

  /**
   * 購入を復元
   *
   * @returns 復元後のステータス
   * @throws {Error} アダプター未設定または機能未実装時
   */
  static async restore(): Promise<SubscriptionStatus> {
    const adapter = this.ensureAdapter();
    if (!adapter.restore) {
      throw new Error('Restore not supported on this platform');
    }
    return adapter.restore();
  }
}
