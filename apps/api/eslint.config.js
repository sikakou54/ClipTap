import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      'node_modules',
      /* wrangler が dev/deploy 時に生成する中間バンドル（コミット対象外） */
      '.wrangler',
      'eslint.config.js',
    ],
  },
  {
    files: ['**/*.ts'],
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommendedTypeChecked,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: {
        /*
         * Cloudflare Workers のランタイムはNodeではなくService Worker互換のため、
         * fetch / Response / crypto などはこちらのグローバル定義を使う。
         */
        ...globals.serviceworker,
      },
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: import.meta.dirname,
      },
    },
    /*
     * ここのルールは apps/mobile/eslint.config.js および
     * packages/shared/eslint.config.js と同一内容を意図的に重複させている。
     * 共通ベースへ切り出すと1ファイルで読み切れなくなるため。
     * 片方を変えたらもう片方も同じ変更を入れること。
     */
    rules: {
      /* TypeScript */
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],

      /* Promise handling - 未処理のPromiseをエラーに */
      '@typescript-eslint/no-floating-promises': 'error',

      /*
       * Promiseを返す関数がvoidコンテキストで使用される場合のチェック
       * Reactイベントハンドラでasync関数を使う場合は許可
       */
      '@typescript-eslint/no-misused-promises': [
        'error',
        {
          checksVoidReturn: {
            /* JSX属性（onClick等）は許可 */
            attributes: false,
            /* オブジェクトプロパティ（onPress等）は許可 */
            properties: false,
            /* 関数引数（showConfirmのコールバック等）は許可 */
            arguments: false,
          },
        },
      ],

      /* any型に関するルールは一旦オフ（apps/mobile と同じ方針） */
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-enum-comparison': 'off',

      /* awaitがないasync関数は許可（意図的な場合がある） */
      '@typescript-eslint/require-await': 'off',
    },
  }
);
