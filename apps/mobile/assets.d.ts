/**
 * @file assets.d.ts
 * @description
 * アセットモジュールの型定義
 *
 * MetroはPNG/HTMLをアセットとして扱い、モジュールIDのnumberを返す。
 * この値はReact Nativeの ImageRequireSource および Asset.fromModule() の
 * 引数と互換であり、実体の読み込みは downloadAsync() 側で行われる。
 *
 * import/exportを持たないアンビエント宣言ファイルとして扱う必要があるため、
 * global.d.ts（末尾にexport {}があるモジュール）へは記述しないこと。
 */

declare module '*.png' {
  const value: number;
  export default value;
}

declare module '*.html' {
  const value: number;
  export default value;
}
