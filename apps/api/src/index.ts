/**
 * ClipTap API サーバー
 *
 * @description
 * Cloudflare Workers + Hono で構築した ClipTap のバックエンドAPI。
 * Web版のプラン判定を担い、RevenueCat Secret API Key をサーバー側に隔離することで
 * ブラウザから RevenueCat Web Billing（Stripe連携）へ依存しない構成を実現する。
 *
 * 定型文・カテゴリ・プロファイル・変数といった業務データは一切扱わない。
 * 本APIが停止してもローカル業務機能は影響を受けず、無料プランとして動作を継続する。
 *
 * @section エンドポイント
 * - GET /health               — ヘルスチェック
 * - GET /subscription/status  — サブスクリプション状態の取得（要 Firebase IDトークン）
 *
 * @module ClipTapAPI
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { AppEnv } from './types';
import { subscriptionRoutes } from './routes/subscription';

/** Hono アプリケーションインスタンス */
const app = new Hono<AppEnv>();

/**
 * CORS ミドルウェア
 * 許可オリジン: cliptap.net（本番）、localhost:5173（Vite開発サーバー、非本番のみ）
 */
app.use('*', async (c, next) => {
  /* 許可オリジンリスト（production 環境では localhost を除外） */
  const allowedOrigins = [
    'https://cliptap.net',
    'https://www.cliptap.net',
  ];
  if (c.env.ENVIRONMENT !== 'production') {
    allowedOrigins.push('http://localhost:5173', 'http://127.0.0.1:5173');
  }

  /* Hono の CORS ミドルウェアを許可オリジンリストで初期化 */
  const corsMiddleware = cors({
    origin: allowedOrigins,
    allowMethods: ['GET', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
  });
  return corsMiddleware(c, next);
});

/**
 * セキュリティヘッダーミドルウェア
 * 全レスポンスに MIME スニッフィング防止・HTTPS強制・iframe埋め込み拒否を付与する
 */
app.use('*', async (c, next) => {
  await next();
  c.header('X-Content-Type-Options', 'nosniff');
  c.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  c.header('X-Frame-Options', 'DENY');
  /* プラン情報はキャッシュさせない */
  c.header('Cache-Control', 'no-store');
});

/**
 * ヘルスチェックエンドポイント
 *
 * @route GET /health
 * @returns {{ status: 'ok', environment: string }} 稼働状態
 */
app.get('/health', (c) => {
  return c.json({ status: 'ok', environment: c.env.ENVIRONMENT });
});

/* サブスクリプション関連ルートをマウント */
app.route('/', subscriptionRoutes);

export default app;
