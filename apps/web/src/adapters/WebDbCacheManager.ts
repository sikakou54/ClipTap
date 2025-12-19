/**
 * WebDbキャッシュマネージャー
 *
 * @description
 * mainDbAdapterと連携してキャッシュ保存を管理。
 * 書き込み操作後にdebounce付きでIndexedDBに自動保存。
 *
 * @module WebDbCacheManager
 */

import { getMainDbAdapter, getSystemDbAdapter } from '@cliptap/shared';
import { CacheService } from '@services/CacheService';
import { subscriptionService } from '@services/SubscriptionService';
import type { WebDatabaseAdapter } from '@adapters/WebDatabaseAdapter';

/** キャッシュ保存のdebounce時間（ミリ秒） - 頻繁な保存を防ぐために300ms待つ */
const CACHE_SAVE_DEBOUNCE_MS = 300;

/**
 * WebDbキャッシュマネージャークラス
 *
 * @description
 * mainDbAdapterと連携してキャッシュ保存を管理。
 * 責務分離により、DbAdapterはDB操作のみに集中。
 */
export class WebDbCacheManager {
  /** debounce用タイマーID（保留中の保存タスクを追跡） */
  private saveTimer: ReturnType<typeof setTimeout> | null = null;
  /** キャッシュ保存が有効かどうか（バッチ処理時は無効化する） */
  private enabled = true;

  /**
   * キャッシュ保存をスケジュール（debounce処理）
   * 短時間に複数回呼ばれても、最後の呼び出しから300ms後に1回だけ保存される
   */
  scheduleSave(): void {
    /* 1. キャッシュが無効化されている場合は何もしない */
    /* （一括インポートなどのバッチ処理中） */
    if (!this.enabled) return;

    /* 2. 既存のタイマーがあればキャンセル（前回の保存予定をキャンセル） */
    /* これにより、連続した呼び出しでは最後の1回だけが実行される */
    if (this.saveTimer) {
      clearTimeout(this.saveTimer);
    }

    /* 3. 新しいタイマーを設定（300ms後に保存を実行） */
    this.saveTimer = setTimeout(() => {
      /* 保存を実行 */
      this.save();
      /* タイマーIDをクリア */
      this.saveTimer = null;
    }, CACHE_SAVE_DEBOUNCE_MS);
  }

  /**
   * IndexedDBキャッシュに保存
   * 現在のデータベースの状態をIndexedDBに保存する
   * ゲストモード（未ログイン）時もcustomerId: nullで保存する
   */
  private async save(): Promise<void> {
    try {
      /* 1. mainDbAdapterを取得し、オープン状態を確認 */
      const mainDbAdapter = getMainDbAdapter() as WebDatabaseAdapter;
      if (!mainDbAdapter.isOpen()) {
        return;
      }

      /* 2. 現在のユーザーIDを取得（未ログイン時はnull） */
      const customerId = subscriptionService.getCustomerId();

      /* 3. mainDBをエクスポート */
      const data = mainDbAdapter.exportDatabase();

      /* 4. systemDBをエクスポート（オープンしている場合のみ） */
      let systemDbData: Uint8Array | undefined;
      try {
        const systemDbAdapter = getSystemDbAdapter() as WebDatabaseAdapter;
        if (systemDbAdapter.isOpen()) {
          systemDbData = systemDbAdapter.exportDatabase();
        }
      } catch {
        /* systemDbAdapterが未登録の場合は無視 */
      }

      /* 5. CacheServiceを使用してIndexedDBに保存 */
      /* ゲストモード時はcustomerId: nullで保存 */
      await CacheService.save(data, customerId, systemDbData);
    } catch (err) {
      /* エラーが発生した場合はログを出力（アプリの動作は止めない） */
      console.error('[WebDbCacheManager] Failed to save cache:', err);
    }
  }

  /**
   * キャッシュ自動保存を有効化
   * バッチ処理後に再度有効化する際に使用
   */
  enable(): void {
    /* フラグをtrueに設定 */
    this.enabled = true;
  }

  /**
   * キャッシュ自動保存を無効化（バッチ処理用）
   * 大量のデータを一度に書き込む際に、毎回保存しないようにするために使用
   */
  disable(): void {
    /* フラグをfalseに設定 */
    this.enabled = false;
    /* 保留中の保存タスクがあればキャンセル */
    if (this.saveTimer) {
      clearTimeout(this.saveTimer);
      /* タイマーをクリア */
      this.saveTimer = null;
    }
  }

  /**
   * 即座にキャッシュを保存（pending分を含む）
   * バッチ処理の最後などで、確実に保存を完了させるために使用
   */
  async flush(): Promise<void> {
    /* 保留中の保存タスクがあればキャンセル */
    if (this.saveTimer) {
      clearTimeout(this.saveTimer);
      /* タイマーをクリア */
      this.saveTimer = null;
    }
    /* 即座に保存を実行 */
    await this.save();
  }

  /**
   * キャッシュが有効かどうか
   * @returns キャッシュが有効な場合はtrue、無効な場合はfalse
   */
  isEnabled(): boolean {
    /* 現在の有効状態を返す */
    return this.enabled;
  }
}

/**
 * WebDbCacheManagerのシングルトンインスタンス
 * アプリ全体で同じインスタンスを使い回す
 */
export const webDbCacheManager = new WebDbCacheManager();
