import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      'node_modules',
      '.expo',
      'ios',
      'android',
      'dist',
      'babel.config.js',
      'metro.config.js',
      /* eslint.config.js 自身は下の JavaScript 用ブロックの対象に入るため除外する */
      'eslint.config.js',
    ],
  },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommendedTypeChecked,
    ],
    plugins: {
      'react-hooks': reactHooks,
    },
    languageOptions: {
      ecmaVersion: 2020,
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: import.meta.dirname,
      },
    },
    /*
     * ここのルールは packages/shared/eslint.config.js と同一内容を意図的に重複させている。
     * 共通ベースへ切り出すと1ファイルで読み切れなくなり、
     * apps/web は別系統（typeCheckedではない）のため3ファイル中2ファイルしかまとまらない。
     * 片方を変えたらもう片方も同じ変更を入れること。
     */
    rules: {
      /* React Hooks */
      ...reactHooks.configs.recommended.rules,

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

      /* any型に関するルールは一旦オフ（将来的に有効化を検討） */
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-enum-comparison': 'off',

      /* awaitがないasync関数は許可（意図的な場合がある） */
      '@typescript-eslint/require-await': 'off',
    },
  },
  {
    /*
     * plugins/ のExpo Config Plugin（Node上で動くCommonJS）。
     * TypeScript用のブロックは files が .ts/.tsx のみのため、
     * このブロックが無いと .js はルールが1つも適用されないまま素通りする。
     */
    files: ['**/*.js'],
    extends: [js.configs.recommended],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: globals.node,
    },
  }
);
