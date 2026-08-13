/**
 * WebDbキャッシュマネージャー
 *
 * @description
 * mainDbAdapterと連携してキャッシュ保存を管理。
 * 書き込み操作後にdebounce付きでIndexedDBに自動保存。
 *
 * @module WebDbCacheManager
 */

import { DatabaseError, getMainDbAdapter, getSystemDbAdapter } from '@cliptap/shared';
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
  /** 自動保存が有効かどうか（初回読込の差し替え中は無効化する） */
  private enabled = true;
  /** IndexedDB書込みを直列化し、古いpayloadの後勝ちを防ぐキュー */
  private saveQueue: Promise<void> = Promise.resolve();

  /**
   * 自動保存を一時停止する
   *
   * @remarks
   * 初回読込ではmainDB・systemDBを閉じて差し替えるため、その最中にdebounce保存が発火すると
   * systemDBを欠いた中途半端なDBがキャッシュへ焼き付く。停止解除までの書込みは保存しない。
   *
   * @returns 停止前の状態へ戻す関数
   */
  async suspendAutoSave(): Promise<() => void> {
    const wasEnabled = this.enabled;

    this.cancelPendingSave();
    this.enabled = false;
    await this.saveQueue;

    let resumed = false;
    return () => {
      if (resumed) return;
      resumed = true;
      this.enabled = wasEnabled;
    };
  }

  /**
   * キャッシュ保存をスケジュール（debounce処理）
   * 短時間に複数回呼ばれても、最後の呼び出しから300ms後に1回だけ保存される
   */
  scheduleSave(): void {
    /* 1. 自動保存が停止されている場合は何もしない（初回読込の差し替え中） */
    if (!this.enabled) return;

    /* 2. 既存のタイマーがあればキャンセル（前回の保存予定をキャンセル） */
    /* これにより、連続した呼び出しでは最後の1回だけが実行される */
    this.cancelPendingSave();

    /* 3. 新しいタイマーを設定（300ms後に保存を実行） */
    this.saveTimer = setTimeout(() => {
      /* タイマーIDをクリア */
      this.saveTimer = null;
      /* 保存を直列キューへ追加し、初回読込などの排他処理から完了を待てるようにする */
      void this.enqueueSave(() => this.save());
    }, CACHE_SAVE_DEBOUNCE_MS);
  }

  /**
   * IndexedDBキャッシュに保存
   * 現在のデータベースの状態をIndexedDBに保存する
   * ゲストモード（未ログイン）時もcustomerId: nullで保存する
   */
  private async save(): Promise<void> {
    try {
      await this.saveOrThrow();
    } catch (err) {
      /* エラーが発生した場合はログを出力（アプリの動作は止めない） */
      console.error('[WebDbCacheManager] Failed to save cache:', err);
    }
  }

  /**
   * 現在のDBをキャッシュへ保存し、失敗を呼び出し元へ通知する
   *
   * @param requireSystemDatabase - systemDBの同時保存を必須とするか（初回読込の確定用）
   */
  private async saveOrThrow(requireSystemDatabase = false): Promise<void> {
    /* 1. mainDbAdapterを取得し、オープン状態を確認 */
    const mainDbAdapter = getMainDbAdapter() as WebDatabaseAdapter;
    if (!mainDbAdapter.isOpen()) {
      if (requireSystemDatabase) {
        throw new DatabaseError('Main database is not open during cache persistence');
      }
      return;
    }

    /* 2. 現在のユーザーIDを取得（未ログイン時はnull） */
    const customerId = subscriptionService.getCustomerId();

    /* 3. mainDBをエクスポート */
    const data = mainDbAdapter.exportDatabase();

    /* 4. systemDBをエクスポート */
    /* 初回読込の確定時は、版情報を失ったキャッシュを残さないため未オープンを失敗として扱う */
    let systemDbData: Uint8Array | undefined;
    if (requireSystemDatabase) {
      const systemDbAdapter = getSystemDbAdapter() as WebDatabaseAdapter;
      if (!systemDbAdapter.isOpen()) {
        throw new DatabaseError('System database is not open during cache persistence');
      }
      systemDbData = systemDbAdapter.exportDatabase();
    } else {
      try {
        const systemDbAdapter = getSystemDbAdapter() as WebDatabaseAdapter;
        if (systemDbAdapter.isOpen()) {
          systemDbData = systemDbAdapter.exportDatabase();
        }
      } catch {
        /* 通常の自動保存では、systemDbAdapterが未登録の場合はmainDBだけを保存する */
      }
    }

    /* 5. CacheServiceを使用してIndexedDBに保存 */
    await CacheService.save(data, customerId, systemDbData);
  }

  /**
   * 即座にキャッシュを保存（pending分を含む）
   * バッチ処理の最後などで、確実に保存を完了させるために使用
   */
  async flush(): Promise<void> {
    await this.flushWith(() => this.save());
  }

  /**
   * 初回読込の確定用に、保存失敗を握りつぶさず即座にキャッシュへ保存する
   *
   * @throws {DatabaseError} main/systemDBが未オープン、またはIndexedDB保存に失敗した場合
   */
  async flushOrThrow(): Promise<void> {
    await this.flushWith(() => this.saveOrThrow(true));
  }

  /** 保留中のdebounce保存を捨て、進行中の保存の後に指定の保存を直列実行する */
  private async flushWith(operation: () => Promise<void>): Promise<void> {
    /* 保留中の保存タスクがあればキャンセル */
    this.cancelPendingSave();
    /* タイマー発火済みの保存がすべて終わるまで待つ */
    await this.saveQueue;
    /* 即座に保存を実行 */
    await this.enqueueSave(operation);
  }

  /** 予約済みのdebounce保存を取り消す */
  private cancelPendingSave(): void {
    if (this.saveTimer) {
      clearTimeout(this.saveTimer);
      this.saveTimer = null;
    }
  }

  /** IndexedDB保存を必ず先行タスクの後へ直列化する */
  private enqueueSave(operation: () => Promise<void>): Promise<void> {
    const queued = this.saveQueue.then(operation, operation);
    this.saveQueue = queued.catch(() => undefined);
    return queued;
  }
}

/**
 * WebDbCacheManagerのシングルトンインスタンス
 * アプリ全体で同じインスタンスを使い回す
 */
export const webDbCacheManager = new WebDbCacheManager();
