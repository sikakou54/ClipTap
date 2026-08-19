/**
 * ベース`.cliptap`ファイル関連の定数
 *
 * @description
 * モバイルアプリを持たない利用者がWebだけで利用を開始できるように、
 * `public/`へ同梱しているベースファイル（サンプルデータ入り）の
 * ファイル名・パスワードを定義する。
 *
 * このモジュールはWebアプリ本体と`scripts/generateStarterFile.mjs`の
 * 双方から読み込まれるため、外部モジュールへ依存しないこと。
 *
 * @module constants/starterFile
 */

/**
 * ベースファイルの読み込みパスワード
 *
 * @remarks
 * サンプルデータのみを含む公開ファイルのため、パスワードは固定値とし画面上にも表示する。
 * `.cliptap`は暗号化形式ではなく、パスワードは同一ファイルであることの確認に用いる。
 */
export const STARTER_FILE_PASSWORD = 'cliptap';

/**
 * ベースファイルが対応する言語
 */
export const STARTER_FILE_LANGUAGES = ['ja', 'en'] as const;

/**
 * ベースファイルの言語型
 */
export type StarterFileLanguage = (typeof STARTER_FILE_LANGUAGES)[number];

/**
 * ベースファイルの既定言語（対応外の言語を検出した場合のフォールバック）
 */
export const STARTER_FILE_FALLBACK_LANGUAGE: StarterFileLanguage = 'en';

/**
 * ダウンロード時に利用者へ提示するファイル名
 */
export const STARTER_FILE_DOWNLOAD_NAME = 'ClipTap_starter.cliptap';

/**
 * ベースファイルの公開ファイル名を組み立てる
 *
 * @param schemaVersion - ファイルが対応するデータベーススキーマバージョン
 * @param language - ファイルの言語
 * @returns `public/`配下のファイル名
 *
 * @remarks
 * ファイル名にスキーマバージョンを含めることで、スキーマ更新後に
 * ベースファイルを再生成し忘れた場合でも古いファイルが配信されない。
 */
export function getStarterFileName(schemaVersion: number, language: StarterFileLanguage): string {
  return `starter_v${schemaVersion}_${language}.cliptap`;
}

/**
 * i18nextの言語コードをベースファイルの言語へ変換する
 *
 * @param language - i18nextが検出した言語コード（例: `ja`, `en-US`）
 * @returns 対応するベースファイルの言語
 */
export function resolveStarterFileLanguage(language: string | undefined): StarterFileLanguage {
  const normalized = (language ?? '').toLowerCase().split('-')[0];
  const matched = STARTER_FILE_LANGUAGES.find((candidate) => candidate === normalized);
  return matched ?? STARTER_FILE_FALLBACK_LANGUAGE;
}
