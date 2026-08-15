/* expoパッケージ経由で読み込む（@expo/metro-configはhoist配置に依存するため直接requireしない） */
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

/**
 * 開発用シードデータのモジュールパス
 *
 * src/database/seed.ts は dummy.json（開発用サンプルデータ）を静的importしている。
 * Metroはimport()を別チャンクへ分割せず非同期requireへ変換するだけなので、
 * 呼び出し側を動的importにしてもシード本体は本番バンドルへ含まれたままになる。
 * そのため本番ビルドでは解決先を空実装へ差し替えて、実体をバンドルから外す。
 */
const SEED_MODULE_PATH = path.resolve(projectRoot, 'src/database/seed.ts');
const SEED_NOOP_MODULE_PATH = path.resolve(projectRoot, 'src/database/seed.noop.ts');

/**
 * 本番バンドルのビルドかどうかを判定する
 *
 * Metroの解決コンテキストが持つdevフラグを優先し、
 * 与えられない場合のみNODE_ENVで判定する。
 *
 * @param context - Metroの解決コンテキスト
 * @returns 本番バンドルのビルドならtrue
 */
const isProductionBundle = (context) => {
  if (typeof context.dev === 'boolean') {
    return !context.dev;
  }
  return process.env.NODE_ENV === 'production';
};

// Watch the monorepo root to enable watching packages
config.watchFolders = [monorepoRoot];

// Support resolving modules from monorepo root node_modules
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

// Enable symlink resolution for npm workspaces
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName.startsWith('@cliptap/shared/')) {
    // Extract the path after @cliptap/shared/ (e.g., 'i18n/en.json')
    const subPath = moduleName.replace('@cliptap/shared/', '');

    // Resolve to packages/shared/src/[subPath]
    const resolvedPath = path.resolve(monorepoRoot, 'packages/shared/src', subPath);

    // Return resolved file path
    return {
      type: 'sourceFile',
      filePath: resolvedPath,
    };
  }

  // Handle @cliptap/shared (without trailing path)
  if (moduleName === '@cliptap/shared') {
    return {
      type: 'sourceFile',
      filePath: path.resolve(monorepoRoot, 'packages/shared/src/index.ts'),
    };
  }

  const resolution = context.resolveRequest(context, moduleName, platform);

  /*
   * 本番バンドルでは開発用シードを空実装へ差し替える。
   * babel-plugin-module-resolverが'@database/seed'を相対パスへ書き換えた後に
   * ここへ来るため、モジュール名ではなく解決後のファイルパスで判定する。
   */
  if (
    isProductionBundle(context) &&
    resolution.type === 'sourceFile' &&
    resolution.filePath === SEED_MODULE_PATH
  ) {
    return {
      type: 'sourceFile',
      filePath: SEED_NOOP_MODULE_PATH,
    };
  }

  return resolution;
};

module.exports = config;

