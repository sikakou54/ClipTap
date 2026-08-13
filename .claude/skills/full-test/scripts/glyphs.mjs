#!/usr/bin/env node
/**
 * 表示中の画面にあるアイコンを、ロケータへ書ける形で並べる
 *
 *   node glyphs.mjs
 *
 * ClipTapのアイコンボタンは `accessibilityLabel` を持たないが、ラベルが空でもない。
 * Ioniconsのグリフ文字がそのままAXラベルになる。端末では空に見えるため、
 * このツールでコードポイントとアイコン名へ逆引きする。
 *
 * 出力例
 *   [0] label=   settings-outline          @1498,187
 *   [1] label=   swap-horizontal-outline   @1539,187
 *
 * `[n]` は「アイコンだけの要素」を上から数えた順番。同じアイコンが複数あるときは
 * `label=&visible=true[0]` のように、そのアイコンの中での順番で指定する。
 */
import { execSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, '..', '..', '..', '..');

const glyphMap = JSON.parse(readFileSync(
  join(repoRoot, 'node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/glyphmaps/Ionicons.json'),
  'utf8',
));

/* コードポイント → アイコン名（同じ字を複数の名前が指すことがあるので連結する） */
const byCode = {};
for (const [name, code] of Object.entries(glyphMap)) {
  byCode[code] = byCode[code] ? `${byCode[code]}/${name}` : name;
}

const raw = execSync(join(here, 'sim.sh') + ' json', { encoding: 'utf8', maxBuffer: 1e8 });
const nodes = JSON.parse(raw.slice(raw.indexOf('[')));

let i = 0;
const perGlyph = {};
for (const n of nodes) {
  if (!n.visible || !n.label) continue;
  const chars = [...n.label];
  if (chars.length !== 1) continue;
  const code = chars[0].codePointAt(0);
  /* 私用領域の1文字だけをアイコンとみなす */
  if (code < 0xe000 || code > 0xf8ff) continue;
  const esc = `\\u${code.toString(16).toUpperCase().padStart(4, '0')}`;
  perGlyph[esc] = (perGlyph[esc] ?? 0);
  const nth = perGlyph[esc]++;
  const name = byCode[code] ?? '(不明)';
  console.log(
    `[${String(i++).padStart(2)}] label=${esc}`.padEnd(22)
    + `${name}`.padEnd(28)
    + `@${n.cx},${n.cy}`
    + (nth > 0 ? `   同じアイコンの${nth}番目 → label=${esc}&visible=true[${nth}]` : ''),
  );
}

if (i === 0) {
  console.log('アイコンが見つかりません。');
  console.log('開発ビルドのdev-menuが被さっていることがあります。sim.sh dismiss を試してください。');
}
