/**
 * Firebase初期化設定
 *
 * @description
 * Firebase Authenticationの初期化と認証インスタンスのエクスポート。
 * 環境変数からFirebase設定を読み込む。
 *
 * 必要な環境変数:
 * - VITE_FIREBASE_API_KEY
 * - VITE_FIREBASE_AUTH_DOMAIN
 * - VITE_FIREBASE_PROJECT_ID
 * - VITE_FIREBASE_STORAGE_BUCKET
 * - VITE_FIREBASE_MESSAGING_SENDER_ID
 * - VITE_FIREBASE_APP_ID
 *
 * @module firebase
 */
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

/* Firebase設定オブジェクト（環境変数から取得） */
const firebaseConfig = {
  /* API キー（Firebase プロジェクトを識別するための公開キー） */
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  /* 認証ドメイン（Firebase Authentication の OAuth リダイレクト先） */
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  /* プロジェクト ID（Firebase プロジェクトの一意識別子） */
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  /* ストレージバケット（Firebase Storage のデータ保存先） */
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  /* メッセージング送信者 ID（Firebase Cloud Messaging 用） */
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  /* アプリ ID（Firebase アプリケーションの識別子） */
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

/* Firebase設定を使ってアプリケーションを初期化 */
const app = initializeApp(firebaseConfig);
/* 初期化されたアプリから認証インスタンスを取得してエクスポート */
export const auth = getAuth(app);

