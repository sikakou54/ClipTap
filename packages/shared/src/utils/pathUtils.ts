/**
 * パスからファイル名を抽出（最後の'/'以降）
 *
 * @param path - ファイルパス
 * @returns ファイル名
 */
export const getFileName = (path: string): string => {
  /* パスを'/'で分割し、最後の要素（ファイル名）を取得 */
  return path.split('/').pop()!;
};

/**
 * パスからディレクトリパスを抽出
 *
 * @param path - ファイルパス
 * @returns ディレクトリパス
 */
export const getDirectoryPath = (path: string): string => {
  /* 最後の'/'より前の部分（ディレクトリパス）を取得 */
  return path.substring(0, path.lastIndexOf('/'));
};

/* ======================================== */
/* OPFSパス関連ヘルパー（Web用） */
/* ======================================== */

/** OPFSパスのプレフィックス */
export const OPFS_PREFIX = 'opfs://';

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
