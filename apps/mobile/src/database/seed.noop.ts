/**
 * @module seed.noop
 * @description
 * 開発用シードの空実装（本番バンドル専用）
 *
 * src/database/seed.ts はサンプルデータ定義（dummy.json）を静的importしているため、
 * そのままでは本番バンドルにも開発用データが含まれてしまう。
 * これを避けるため、metro.config.js が本番バンドルのビルド時に
 * src/database/seed.ts の解決先をこのファイルへ差し替える。
 *
 * runSeed の呼び出し箇所（useAppInitialization / useDevMenu）はいずれも
 * __DEV__ の内側からしか到達しないため、本番でこの関数が実行されることはない。
 * それでも解決先としてモジュールが必要なため、同じシグネチャの何もしない実装を置く。
 *
 * @see src/database/seed.ts - 開発時に使われるシード本体
 * @see metro.config.js - 本番ビルド時の解決差し替え
 */

/**
 * シード処理の空実装
 *
 * 本番バンドルでは開発用データを投入しない。
 */
export function runSeed(): Promise<void> {
  return Promise.resolve();
}
