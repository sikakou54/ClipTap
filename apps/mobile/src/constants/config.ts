/**
 * アプリケーション設定定数
 *
 * @description
 * ハードコードされた設定値を一箇所に集約。
 * APIキー、App Group識別子、その他の設定値を管理。
 *
 * @module config
 */

import { PRO_ENTITLEMENT_ID } from '@cliptap/shared';

/**
 * RevenueCat API Keys
 * RevenueCat: サブスクリプション管理サービス（App Store/Google Playの課金を統合管理）
 * @see https://www.revenuecat.com/docs/getting-started
 */
/* RevenueCat設定オブジェクト（as constで読み取り専用） */
export const REVENUECAT_CONFIG = {
  /** iOS用APIキー - RevenueCatダッシュボードで発行されたiOSアプリ用の認証キー */
  API_KEY_IOS: 'appl_jNZlGsifNBVjDLXzoIYWFLfldpo',
  /** Android用APIキー - RevenueCatダッシュボードで発行されたAndroidアプリ用の認証キー */
  API_KEY_ANDROID: 'goog_bXNqPFdNrxqrvkWJnjxwavxmtgf',
  /** Entitlement識別子 - Proプラン（広告非表示・機能制限解除）の権限ID */
  ENTITLEMENT_ID: PRO_ENTITLEMENT_ID,
} as const;

/**
 * Firebase/Google認証設定
 * Googleアカウントでのサインイン機能に必要な認証情報
 */
/* Google認証設定オブジェクト（as constで読み取り専用） */
export const AUTH_CONFIG = {
  /** Google Sign-In iOS Client ID - iOS専用のGoogleサインイン用クライアントID */
  GOOGLE_IOS_CLIENT_ID: '570104360158-tp89lr2buks8va20lg2ml8g2ercpdmko.apps.googleusercontent.com',
  /** Google Sign-In Web Client ID - WebおよびサーバーサイドのGoogleサインイン用クライアントID */
  GOOGLE_WEB_CLIENT_ID: '570104360158-jj3g9mc15782i8ia6bh92qo5mtdhtuu5.apps.googleusercontent.com',
} as const; // as const: 定数として扱い、値の変更を防ぐ

/**
 * App Group設定（iOS/Android共通識別子）
 * App Group: アプリとウィジェット間でデータを共有するための仕組み
 * 将来的なウィジェット機能追加に備えた設定
 */
/* App Group設定オブジェクト（as constで読み取り専用） */
export const APP_GROUP_CONFIG = {
  /** App Group識別子 - アプリとウィジェットで共有するグループID（iOSはBundleID形式、Androidは任意） */
  IDENTIFIER: 'group.com.sikakou.cliptap',
  /** データベースディレクトリ名 - App Group内でデータベースファイルを格納するディレクトリ名 */
  DATABASES_DIR: 'databases',
  /** データベースファイル名 - SQLiteデータベースの実ファイル名 */
  DATABASE_FILE: 'cliptap.db',
} as const; // as const: 定数として扱い、値の変更を防ぐ

/**
 * サブスクリプション商品ID（iOS/Android別に管理）
 * App Store Connect/Google Play Consoleで登録した商品IDを定義
 * 型を明示することでタイポや不正な値を防ぐ
 */
/* サブスクリプション商品ID設定オブジェクト（型注釈付き） */
export const PRODUCT_IDS_CONFIG: {
  /* iOS用商品ID - App Store Connect で登録したサブスクリプションID */
  iOS: { monthly: string; annual: string };
  /* Android用商品ID - Google Play Console で登録したサブスクリプションID */
  android: { monthly: string; annual: string };
} = {
  /* iOS商品ID（App Store Connect準拠の形式） */
  iOS: {
    /** 月額プラン商品ID */
    monthly: 'product.cliptap.Monthly',
    /** 年間プラン商品ID */
    annual: 'product.cliptap.Annual',
  },
  /* Android商品ID（Google Play Console準拠の形式、コロン区切り） */
  android: {
    /** 月額プラン商品ID */
    monthly: 'product.cliptap.pro:monthly',
    /** 年間プラン商品ID */
    annual: 'product.cliptap.pro:annual',
  },
}; // 注: as const を付けていないのは、値が文字列リテラル型でなく汎用string型として扱いたいため
