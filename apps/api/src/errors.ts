/**
 * エラーレスポンス生成ユーティリティ
 *
 * @description
 * Worker API のエラーレスポンス形式を標準化する。
 * 返却するのはエラーコードのみで、ユーザー向け文言はクライアント側で i18next により解決する。
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
 * @param code - エラーコード文字列（クライアントが分岐に使用する）
 * @returns JSON形式のエラーレスポンス
 */
export function errorResponse(c: Context, status: ContentfulStatusCode, code: string) {
  return c.json({ error: code }, status);
}
