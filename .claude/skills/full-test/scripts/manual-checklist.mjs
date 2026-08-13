#!/usr/bin/env node
/**
 * 到達不能パターンから手動チェックリストを作る
 *
 *   node manual-checklist.mjs [--dir docs/test]
 *
 * 自動実行できないものを `UNREACHABLE` として記録するだけでは、
 * 「自動テストが全部PASS ＝ リリース可」と誤読される。
 * 到達不能の理由を読んで「実機なら可能」「手動なら可能」「原理的に不能」へ分け、
 * 前者を人が確認する手順書へ落とす。
 *
 * 出力: <dir>/manual-checklist.md
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, isAbsolute } from 'node:path';
import { readCsvObjects } from './lib/csv.mjs';
import { loadConfig, REPO_ROOT } from './lib/config.mjs';

const cfg = loadConfig();
let dir = cfg.testDocDir;
const argv = process.argv.slice(2);
for (let i = 0; i < argv.length; i++) if (argv[i] === '--dir') dir = argv[++i];
if (!isAbsolute(dir)) dir = join(REPO_ROOT, dir);

const load = (n) => (existsSync(join(dir, n)) ? readCsvObjects(readFileSync(join(dir, n), 'utf8')).records : []);
const matrix = load('pattern-matrix.csv');
const features = load('features.csv');
const featureName = new Map(features.map((f) => [f.FeatureID, f.Name]));

/**
 * 到達不能の理由から、人が確認できる手段を推定する。
 * 判定に使う語は `UnreachableReason` に実際に現れるものだけにしてある。
 */
const BUCKETS = [
  {
    key: 'device',
    title: '実機で確認する',
    note: 'シミュレータに機能自体が無いもの。iPhone実機に開発ビルドを入れて確認する。',
    match: (r) => /実機|拡張キーボード|\.appex|フルアクセス|触覚|振動|Haptics|AXツリー/.test(r),
  },
  {
    key: 'sandbox',
    title: 'Sandbox環境で確認する',
    note: 'App Store Sandboxアカウントでサインインし、実際の購入・復元フローを通す。',
    match: (r) => /StoreKit|Sandbox|購入|復元|entitlement|RevenueCat/.test(r),
  },
  {
    key: 'auth',
    title: '外部認証を伴う操作を手で確認する',
    note: 'Apple / Google のサインインUIは別プロセスで、自動操作できない。',
    match: (r) => /認証|サインイン|Firebase|Apple ID|Google/.test(r),
  },
  {
    key: 'file',
    title: 'ファイル選択・共有シートを手で確認する',
    note: 'DocumentPickerと共有シートはAXツリーに現れない。`.cliptap` を用意して人が操作する。',
    match: (r) => /DocumentPicker|共有シート|最近使った項目|UIFileSharingEnabled/.test(r),
  },
  {
    key: 'android',
    title: 'Androidで確認する',
    note: '実行基盤が別。`RefreshControl` などiOSと実装が違う箇所を実機/エミュレータで確認する。',
    match: (r) => /Android|IME/.test(r),
  },
  {
    key: 'web',
    title: 'Web版で確認する',
    note: '実行基盤が別（Vite + sql.js）。ブラウザで確認する。',
    match: (r) => /Web版|Web専用|sql\.js|ブラウザ/.test(r),
  },
  {
    key: 'release',
    title: 'Releaseビルドで確認する',
    note: 'Debugビルドのテストデータ投入や開発者メニューが邪魔をするもの。',
    match: (r) => /__DEV__|Releaseビルド|開発者メニュー/.test(r),
  },
  {
    key: 'unreachable',
    title: '原理的に確認できない（コード変更が必要）',
    note: 'UIから到達する経路が存在しない防御的コードなど。人が操作しても再現できない。',
    match: () => true,
  },
];

const rows = matrix.filter((r) => r.Reachability === 'UNREACHABLE');
const grouped = new Map(BUCKETS.map((b) => [b.key, []]));
for (const r of rows) {
  const b = BUCKETS.find((x) => x.match(r.UnreachableReason || ''));
  grouped.get(b.key).push(r);
}

const lines = [];
lines.push('# 手動チェックリスト');
lines.push('');
lines.push('自動実行できないパターンを、人が確認する手段ごとにまとめたもの。');
lines.push('`pattern-matrix.csv` の `Reachability=UNREACHABLE` から機械的に生成している。');
lines.push('');
lines.push('**自動テストが全部PASSしても、この一覧が未確認ならリリース判定はできない。**');
lines.push('');
lines.push(`対象: ${rows.length} パターン`);
lines.push('');
lines.push('| 確認手段 | 件数 |');
lines.push('|---|---:|');
for (const b of BUCKETS) {
  const n = grouped.get(b.key).length;
  if (n) lines.push(`| ${b.title} | ${n} |`);
}
lines.push('');
lines.push('---');

for (const b of BUCKETS) {
  const items = grouped.get(b.key);
  if (!items.length) continue;
  lines.push('');
  lines.push(`## ${b.title}（${items.length}件）`);
  lines.push('');
  lines.push(b.note);
  lines.push('');
  /* 機能ごとにまとめると、確認する人が画面単位で辿れる */
  const byFeature = new Map();
  for (const r of items) {
    const k = r.FeatureID || '(不明)';
    if (!byFeature.has(k)) byFeature.set(k, []);
    byFeature.get(k).push(r);
  }
  for (const [fid, list] of [...byFeature].sort()) {
    lines.push(`### ${fid} ${featureName.get(fid) ?? ''}`);
    lines.push('');
    lines.push('| PatternID | 確認すること | 根拠 |');
    lines.push('|---|---|---|');
    for (const r of list) {
      const behav = (r.ExpectedBehavior || '').replace(/\|/g, '\\|');
      const spec = (r.SpecRef || '').replace(/\|/g, '\\|');
      lines.push(`| ${r.PatternID} | ${behav} | ${spec} |`);
    }
    lines.push('');
  }
}

const out = join(dir, 'manual-checklist.md');
writeFileSync(out, lines.join('\n') + '\n');
console.log(`${out} を生成しました（${rows.length}パターン）`);
for (const b of BUCKETS) {
  const n = grouped.get(b.key).length;
  if (n) console.log(`  ${b.title}: ${n}`);
}
