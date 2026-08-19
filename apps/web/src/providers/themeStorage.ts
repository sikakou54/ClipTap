/**
 * テーマ設定のlocalStorageキー
 *
 * @module themeStorage
 */

/**
 * テーマ設定を保存するlocalStorageのキー名
 *
 * @remarks
 * このキーには Zustand persist 形式（{ state: {...}, version: number }）のJSONが入り、
 * state の中に themeMode（themeStorageAdapter.ts）と gridColumns（WebThemeProvider.tsx）が
 * 相乗りしている。どちらの書き込みも既存の state を spread してから書き戻すため
 * 互いの値を壊さないが、保存形式を変えるときは両方を同時に直す必要がある。
 */
export const THEME_STORAGE_KEY = 'cliptap-theme';
