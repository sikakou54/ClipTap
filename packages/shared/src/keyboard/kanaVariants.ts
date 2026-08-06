/**
 * 「゛゜小」キーによるかなの変形規則の正本
 *
 * 12キーフリックの「゛゜小」キーは、直前のかなを濁点・半濁点・小文字へ
 * 巡回させる。割り当てはOS標準のかなキーボードと同じにする。
 * 利用者が既に指の動きを覚えているため、独自の巡回にする利点がない。
 *
 * キー配列と同様にここを唯一の正本とし、SwiftとKotlinのソースを生成する。
 */

/**
 * 変形の巡回
 *
 * 各文字列が1つの巡回を表す。文字は同じ並びの次の文字へ置き換わり、
 * 末尾は先頭へ戻る。並びは 素のかな → 小文字 → 濁点 → 半濁点 の順で、
 * 存在しない形は飛ばす（OS標準と同じ）。
 */
export const KANA_VARIANT_CYCLES: readonly string[] = [
  /* あ行。「う」だけ濁点（ゔ）を持つ */
  'あぁ',
  'いぃ',
  'うぅゔ',
  'えぇ',
  'おぉ',
  /* か行 */
  'かが',
  'きぎ',
  'くぐ',
  'けげ',
  'こご',
  /* さ行 */
  'さざ',
  'しじ',
  'すず',
  'せぜ',
  'そぞ',
  /* た行。「つ」だけ小文字（っ）を持つ */
  'ただ',
  'ちぢ',
  'つっづ',
  'てで',
  'とど',
  /* は行。半濁点を持つ唯一の行 */
  'はばぱ',
  'ひびぴ',
  'ふぶぷ',
  'へべぺ',
  'ほぼぽ',
  /* や行・わ行の小文字 */
  'やゃ',
  'ゆゅ',
  'よょ',
  'わゎ',
];

/**
 * 「゛゜小」キーで置き換わる次の文字を引く
 *
 * @param char 変形の対象になる1文字
 * @returns 次の形。変形を持たない文字はundefined
 */
export const nextKanaVariant = (char: string): string | undefined => {
  for (const cycle of KANA_VARIANT_CYCLES) {
    const chars = cycle.split('');
    const index = chars.indexOf(char);
    if (index >= 0) {
      return chars[(index + 1) % chars.length];
    }
  }
  return undefined;
};
