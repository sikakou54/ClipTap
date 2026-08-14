/**
 * エラーレスポンス生成ユーティリティ
 *
 * @description
 * Worker API のエラーレスポンス形式を標準化する。
 * 本文は `{ error: code }` の形でエラーコードのみを返し、ユーザー向け文言は含まない。
 * 唯一のクライアントである apps/web/src/adapters/WebSubscriptionAdapter.ts は本文を読まない。
 *
 * @module errors
 */

import type { Context } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';

/**
 * 標準エラーレスポンスを返す
 *
 * @param c - Hono コンテキスト
 * @param status - HTTPステータスコード
 * @param code - エラーコード文字列。クライアントはHTTPステータスのみで分岐し本文を読まないため、
 *               実運用ではログ・障害切り分け用の識別子として機能する。文字列は docs/機能仕様書.md §10.1 で
 *               外部インターフェースとして規定されているため、変更する場合は仕様書も同じ変更で更新する
 * @returns JSON形式のエラーレスポンス
 */
export function errorResponse(c: Context, status: ContentfulStatusCode, code: string) {
  return c.json({ error: code }, status);
}
