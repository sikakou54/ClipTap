/**
 * アダプター一括登録
 *
 * @description
 * Adapterパターンを採用し、プラットフォーム固有の実装（Mobile/Web）をshared層から分離。
 * アプリ起動時にsetAllAdapters()を1回呼び出すことで、
 * shared層のService/Mapperがプラットフォーム固有機能（DB、暗号化、ファイルI/O等）を利用可能にする。
 *
 * @module AdapterRegistry
 */

import type { SubscriptionAdapter } from './SubscriptionAdapter';
import type { CryptoAdapter } from './CryptoAdapter';
import type { DbAdapter } from './DbAdapter';
import type { ClipboardAdapter } from './ClipboardAdapter';
import type { FileIOAdapter } from './FileIOAdapter';
import type { FileShareAdapter } from './FileShareAdapter';
import type { FilePickerAdapter } from './FilePickerAdapter';
import type { LocaleAdapter } from './LocaleAdapter';
import type { I18nAdapter } from './I18nAdapter';
import type { AuthAdapter } from './AuthAdapter';
import type { ExportAdapter } from './ExportAdapter';
import type { ImportAdapter } from './ImportAdapter';
import type { SortPreferenceAdapter } from './SortPreferenceAdapter';
import type { UsageTrackingAdapter } from './UsageTrackingAdapter';

import { setCryptoAdapter } from './CryptoAdapter';
import {
  setMainDbAdapter,
  setSystemDbAdapter,
  setTempDbAdapter,
} from './DbAdapter';
import { setClipboardAdapter } from './ClipboardAdapter';
import { setFileIOAdapter } from './FileIOAdapter';
import { setFileShareAdapter } from './FileShareAdapter';
import { setFilePickerAdapter } from './FilePickerAdapter';
import { setLocaleAdapter } from './LocaleAdapter';
import { setI18nAdapter } from './I18nAdapter';
import { setAuthAdapter } from './AuthAdapter';
import { setExportAdapter } from './ExportAdapter';
import { setImportAdapter } from './ImportAdapter';
import { setSortPreferenceAdapter } from './SortPreferenceAdapter';
import { setUsageTrackingAdapter } from './UsageTrackingAdapter';
import { SubscriptionService } from '../services/SubscriptionService';

/**
 * サブスクリプション設定オプション
 *
 * @description
 * サブスクリプションアダプター登録時に指定する追加設定。
 * 無料プランとProプランの機能制限を定義する。
 */
export interface SubscriptionAdapterOptions {
  /**
   * 無料プランでの環境（プロファイル）上限数
   *
   * @description
   * 無料プランで作成できる環境の最大数。
   * この上限を超える環境を作成する場合はProプラン契約が必要。
   * デフォルト: 1（無料プランは1環境のみ）
   */
  freeProfilesLimit?: number;

  /**
   * 無料プランでのカスタム変数上限数
   *
   * @description
   * 無料プランで作成できるカスタム変数の最大数。
   * この上限を超える変数を作成する場合はProプラン契約が必要。
   * デフォルト: 3（無料プランは3変数まで）
   */
  freeVariablesLimit?: number;
}

/**
 * SubscriptionAdapterを設定
 *
 * @description
 * サブスクリプションアダプターをSubscriptionServiceに登録。
 * 他のアダプターと異なり、SubscriptionServiceが内部でアダプターを管理する。
 *
 * @param adapter - プラットフォーム固有のSubscriptionAdapter実装
 * @param options - オプション設定（無料プランの上限数等）
 */
export function setSubscriptionAdapter(
  adapter: SubscriptionAdapter,
  options?: SubscriptionAdapterOptions
): void {
  /* SubscriptionServiceにアダプターとオプションを登録 */
  SubscriptionService.setAdapter(adapter, options);
}

/**
 * 一括登録用のアダプター設定
 *
 * @description
 * setAllAdapters()で一括登録する際に渡すアダプター群。
 * すべてオプショナルだが、通常はすべてのアダプターを登録する。
 */
export interface AllAdapters {
  /** メインDB用アダプター（共有コンテナDB - アプリ・キーボード拡張で共有） */
  mainDB?: DbAdapter;
  /** システムDB用アダプター（user_version管理・マイグレーション用） */
  systemDB?: DbAdapter;
  /** 一時DB用アダプター（エクスポート・インポート処理用） */
  tempDb?: DbAdapter;
  /** 暗号化アダプター（SHA-256ハッシュ計算を抽象化） */
  crypto?: CryptoAdapter;
  /** サブスクリプションアダプター（RevenueCat操作を抽象化） */
  subscription?: SubscriptionAdapter;
  /** クリップボードアダプター（クリップボード操作を抽象化） */
  clipboard?: ClipboardAdapter;
  /** ファイルI/Oアダプター（ファイル読み書きを抽象化） */
  fileIO?: FileIOAdapter;
  /** ファイル共有アダプター（ファイル共有/ダウンロードを抽象化） */
  fileShare?: FileShareAdapter;
  /** ファイル選択アダプター（ファイル選択ダイアログを抽象化） */
  filePicker?: FilePickerAdapter;
  /** ロケールアダプター（言語設定を抽象化） */
  locale?: LocaleAdapter;
  /** i18nアダプター（翻訳機能を抽象化） */
  i18n?: I18nAdapter;
  /** 認証アダプター（Firebase Auth操作を抽象化） */
  auth?: AuthAdapter;
  /** エクスポートアダプター（エクスポート処理を抽象化） */
  export?: ExportAdapter;
  /** インポートアダプター（インポート処理を抽象化） */
  import?: ImportAdapter;
  /** ソート設定アダプター（ソート設定の保存・取得を抽象化） */
  sortPreference?: SortPreferenceAdapter;
  /** 使用頻度追跡アダプター（使用頻度追跡設定を抽象化） */
  usageTracking?: UsageTrackingAdapter;
}

/**
 * 一括登録用のオプション
 *
 * @description
 * setAllAdapters()で一括登録する際に渡す追加設定。
 * 現在はサブスクリプション関連の設定のみ。
 */
export interface SetAllAdaptersOptions {
  /** サブスクリプション設定（無料プランの上限数等） */
  subscription?: SubscriptionAdapterOptions;
}

/**
 * 全てのアダプターを一括で設定
 *
 * @description
 * プラットフォーム固有のアダプター実装をまとめて登録。
 * アプリ起動時（Mobile/Web各々の_layout.tsx等）で1回だけ呼び出される。
 * これにより、sharedパッケージ内のビジネスロジックがプラットフォーム固有の機能（DB、暗号化等）を利用可能になる。
 *
 * @param adapters - 登録するアダプター群（すべてオプショナル）
 * @param options - オプション設定（サブスクリプション上限数等）
 */
export function setAllAdapters(
  adapters: AllAdapters,
  options?: SetAllAdaptersOptions
): void {
  if (adapters.mainDB) {
    setMainDbAdapter(adapters.mainDB);
  }
  if (adapters.systemDB) {
    setSystemDbAdapter(adapters.systemDB);
  }
  if (adapters.tempDb) {
    setTempDbAdapter(adapters.tempDb);
  }
  if (adapters.crypto) {
    setCryptoAdapter(adapters.crypto);
  }
  if (adapters.subscription) {
    setSubscriptionAdapter(adapters.subscription, options?.subscription);
  }
  if (adapters.clipboard) {
    setClipboardAdapter(adapters.clipboard);
  }
  if (adapters.fileIO) {
    setFileIOAdapter(adapters.fileIO);
  }
  if (adapters.fileShare) {
    setFileShareAdapter(adapters.fileShare);
  }
  if (adapters.filePicker) {
    setFilePickerAdapter(adapters.filePicker);
  }
  if (adapters.locale) {
    setLocaleAdapter(adapters.locale);
  }
  if (adapters.i18n) {
    setI18nAdapter(adapters.i18n);
  }
  if (adapters.auth) {
    setAuthAdapter(adapters.auth);
  }
  if (adapters.export) {
    setExportAdapter(adapters.export);
  }
  if (adapters.import) {
    setImportAdapter(adapters.import);
  }
  if (adapters.sortPreference) {
    setSortPreferenceAdapter(adapters.sortPreference);
  }
  if (adapters.usageTracking) {
    setUsageTrackingAdapter(adapters.usageTracking);
  }
}
