import { readdirSync } from 'node:fs';
import { relative, resolve } from 'node:path';

/**
 * リポジトリルートの絶対パス
 *
 * @remarks
 * このファイルは packages/shared/tests/helpers 配下にあるため、3階層上がルートになる。
 */
export const REPOSITORY_ROOT = resolve(import.meta.dirname, '../../../..');

/**
 * 指定ディレクトリ配下のTypeScriptソースを再帰的に列挙する
 *
 * @param directory - リポジトリルートからの相対ディレクトリ
 * @param extensions - 収集する拡張子（既定は .ts と .tsx）
 * @returns リポジトリルートからの相対パス（POSIX区切り）の配列
 */
export function listSourceFiles(
  directory: string,
  extensions: readonly string[] = ['.ts', '.tsx'],
): string[] {
  return readdirSync(resolve(REPOSITORY_ROOT, directory), { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile() && extensions.some((extension) => entry.name.endsWith(extension)))
    .map((entry) => relative(REPOSITORY_ROOT, resolve(entry.parentPath, entry.name)))
    .sort();
}
