/**
 * @module pathUtils
 * @description
 * Node の `path` モジュールは React Native・ブラウザランタイムでは利用できないため、
 * '/' 区切りを前提とした最小実装だけを置く。
 * リポジトリ内で `path` を import しているのはビルド設定（apps/web/vite.config.ts /
 * apps/mobile/metro.config.js）・生成スクリプト・Nodeで動くテストだけで、
 * アプリ実行コードでは一切使っていない。
 */

/**
 * パスからファイル名を抽出（最後の'/'以降）
 *
 * @param path - ファイルパス
 * @returns ファイル名
 *
 * @remarks
 * String.split('/') は必ず1要素以上を返すため、pop() の non-null 断定が成立する。
 */
export const getFileName = (path: string): string => {
  return path.split('/').pop()!;
};

/**
 * パスからディレクトリパスを抽出
 *
 * @param path - ファイルパス
 * @returns ディレクトリパス
 */
export const getDirectoryPath = (path: string): string => {
  return path.substring(0, path.lastIndexOf('/'));
};

/* ======================================== */
/* OPFSパス関連ヘルパー（Web用）
 *
 * OPFS は Web 版（apps/web/src/adapters/WebDatabaseAdapter.ts ほか）専用だが、
 * パス文字列の判定・組み立てという同種の責務のためこのモジュールに置く。
 * Mobile 側（apps/mobile/src/adapters/MobileDatabaseAdapter.ts）は
 * getFileName / getDirectoryPath のみ使う。
 */
/* ======================================== */

/** OPFSパスのプレフィックス。判定・付与・除去は同ファイル内の関数が担うため外部へは公開しない */
const OPFS_PREFIX = 'opfs://';

/**
 * パスがOPFSパスかどうかを判定
 *
 * @param path - 判定するパス
 * @returns OPFSパスの場合true
 */
export const isOpfsPath = (path: string): boolean => {
  return path.startsWith(OPFS_PREFIX);
};

/**
 * OPFSパスからファイル名を抽出
 *
 * @param opfsPath - OPFSパス（opfs://で始まる）
 * @returns ファイル名
 */
export const getOpfsFileName = (opfsPath: string): string => {
  return opfsPath.slice(OPFS_PREFIX.length);
};

/**
 * ファイル名からOPFSパスを生成
 *
 * @param filename - ファイル名
 * @returns OPFSパス（opfs://で始まる）
 */
export const toOpfsPath = (filename: string): string => {
  return `${OPFS_PREFIX}${filename}`;
};
