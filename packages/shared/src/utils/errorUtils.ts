/**
 * エラーメッセージ翻訳ユーティリティ
 *
 * @description
 * ClipTapErrorのcodeプロパティ（i18nキー）を使ってエラーメッセージを翻訳します。
 * それ以外のエラーは元のメッセージをそのまま返します。
 *
 * I18nAdapterを使用してプラットフォーム固有のi18n実装を抽象化。
 * Web/Mobile両方で共通利用可能。
 *
 * @module errorUtils
 */

import type { ClipTapError } from '../errors';
import { getI18nAdapter } from '../adapters/I18nAdapter';

/**
 * エラーメッセージを翻訳して返す
 *
 * @param error - エラーオブジェクト
 * @returns 翻訳されたエラーメッセージ
 */
export function translateError(error: unknown): string {
  if (error && typeof error === 'object' && 'code' in error) {
    const clipTapError = error as ClipTapError;
    if (clipTapError.code && typeof clipTapError.code === 'string') {
      try {
        const i18nAdapter = getI18nAdapter();
        const translated = i18nAdapter.translate(clipTapError.code, clipTapError.message);
        return translated;
      } catch {
        return clipTapError.message;
      }
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

