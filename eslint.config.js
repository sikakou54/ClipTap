import js from '@eslint/js';
import globals from 'globals';

/*
 * リポジトリルートのESLint設定。
 *
 * apps/ と packages/ は各ワークスペースの eslint.config.js が受け持つため、必ず除外する。
 * 除外しないと、ルートで `npx eslint` したときにワークスペース側のファイルまで
 * この設定で解決され、本来のルール（型情報付き）が適用されないまま緑になる。
 *
 * ここが受け持つのは store/ だけ。store/ は npm workspaces の定義（package.json の
 * apps/* と packages/*）に含まれないため、どのワークスペースの `eslint .` からも到達しない。
 */
export default [
  {
    ignores: [
      'apps/**',
      'packages/**',
      'node_modules/**',
      '**/dist/**',
      '.claude/**',
      'store/out/**',
    ],
  },
  {
    files: ['store/**/*.mjs'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.node,
      },
    },
    rules: {
      ...js.configs.recommended.rules,
    },
  },
];
