/**
 * サブスクリプション状態取得ルート
 *
 * @description
 * Firebase IDトークンで認証し、RevenueCat REST API からサブスクリプション状態を返す。
 * App User ID は必ず検証済みトークンの UID から導出するため、
 * クライアントが他人のUIDを詐称してPro状態を取得することはできない。
 *
 * @section エンドポイント
 * - GET /subscription/status — サブスクリプション状態の取得（要 Firebase IDトークン）
 *
 * @module subscriptionRoutes
 */

import { Hono } from 'hono';
import type { AppEnv } from '../types';
import { errorResponse } from '../errors';
import { verifyFirebaseToken, fetchSubscriptionStatus } from '../helpers';

/** サブスクリプション関連のルートを定義する Hono アプリケーション */
const subscriptionRoutes = new Hono<AppEnv>();

/**
 * サブスクリプション状態取得エンドポイント
 *
 * @route GET /subscription/status
 * @returns {SubscriptionStatusPayload} サブスクリプション状態
 * @throws {401} TOKEN_MISSING - Authorization ヘッダーが未指定
 * @throws {401} TOKEN_INVALID - Firebase IDトークンの検証に失敗
 * @throws {500} SERVER_MISCONFIGURED - RevenueCat の Secret API Key が未設定
 */
subscriptionRoutes.get('/subscription/status', async (c) => {
  /* Authorization ヘッダーから Firebase IDトークンを取得 */
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return errorResponse(c, 401, 'TOKEN_MISSING');
  }
  const idToken = authHeader.slice(7);

  /* Firebase IDトークンを検証して UID を取得 */
  /* サーバー設定の状態を未認証の呼び出し元へ露出させないため、認証を先に行う */
  let uid: string;
  try {
    ({ uid } = await verifyFirebaseToken(idToken, c.env.FIREBASE_PROJECT_ID));
  } catch {
    /* 検証失敗の詳細はクライアントへ返さずログのみに記録する */
    console.error('Firebase token verification failed');
    return errorResponse(c, 401, 'TOKEN_INVALID');
  }

  /* Secret API Key が未設定の場合はサーバー設定不備として扱う */
  if (!c.env.REVENUECAT_API_KEY) {
    console.error('REVENUECAT_API_KEY is not configured');
    return errorResponse(c, 500, 'SERVER_MISCONFIGURED');
  }

  /* 検証済みUIDでRevenueCatへ問い合わせ、サブスクリプション状態を返却 */
  const status = await fetchSubscriptionStatus(
    uid,
    c.env.REVENUECAT_API_KEY,
    c.env.ENTITLEMENT_ID,
  );

  return c.json(status);
});

export { subscriptionRoutes };
