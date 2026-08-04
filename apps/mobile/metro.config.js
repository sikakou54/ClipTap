/* expoパッケージ経由で読み込む（@expo/metro-configはhoist配置に依存するため直接requireしない） */
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

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

  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;

