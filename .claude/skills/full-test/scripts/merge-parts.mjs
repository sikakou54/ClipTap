#!/usr/bin/env node
/**
 * 分担して作った部分ファイルを1つの台帳へ統合する
 *
 *   node merge-parts.mjs [--dir docs/test]
 *
 * 入力（`<dir>/parts/` 配下）
 *   pattern-matrix-<GROUP>.csv
 *   testspec-<GROUP>.csv
 *   route-claims-<GROUP>.csv   列: RouteID,PatternID,TestID
 *
 * 出力
 *   <dir>/pattern-matrix.csv
 *   <dir>/testspec.csv
 *   <dir>/routes.csv           の PatternID / TestID 列を申告内容で埋める
 *
 * 分担作業でいちばん壊れるのはIDの衝突と、どの担当も拾わなかった取りこぼし。
 * ここで機械的に検出して報告する。
 */
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { join, isAbsolute } from 'node:path';
import { readCsvObjects, writeCsvObjects } from './lib/csv.mjs';
import { loadConfig, REPO_ROOT } from './lib/config.mjs';

const cfg = loadConfig();
let dir = cfg.testDocDir;
const argv = process.argv.slice(2);
for (let i = 0; i < argv.length; i++) if (argv[i] === '--dir') dir = argv[++i];
if (!isAbsolute(dir)) dir = join(REPO_ROOT, dir);

const partsDir = join(dir, 'parts');
if (!existsSync(partsDir)) {
  console.error(`部分ファイルのディレクトリがありません: ${partsDir}`);
  process.exit(2);
}

const files = readdirSync(partsDir);
const problems = [];

/** 接頭辞の一致する部分ファイルをすべて読み、行を連結する */
function collect(prefix) {
  const rows = [];
  let header = null;
  const groups = [];
  for (const f of files.filter((x) => x.startsWith(prefix) && x.endsWith('.csv')).sort()) {
    const { header: h, records } = readCsvObjects(readFileSync(join(partsDir, f), 'utf8'));
    if (!header) header = h;
    else if (h.join(',') !== header.join(',')) {
      problems.push(`${f}: 列の並びが他の部分ファイルと違います`);
    }
    const group = f.replace(prefix, '').replace('.csv', '');
    groups.push({ group, count: records.length, file: f });
    for (const r of records) rows.push({ ...r, __group: group });
  }
  return { header, rows, groups };
}

/* ---- pattern-matrix ---- */
const pm = collect('pattern-matrix-');
if (!pm.header) { console.error('pattern-matrix-*.csv がありません'); process.exit(2); }

const seenPattern = new Map();
for (const r of pm.rows) {
  if (!r.PatternID) continue;
  if (seenPattern.has(r.PatternID)) {
    problems.push(`PatternIDが重複: ${r.PatternID}（${seenPattern.get(r.PatternID)} と ${r.__group}）`);
  }
  seenPattern.set(r.PatternID, r.__group);
}

/* ---- testspec ---- */
const ts = collect('testspec-');
if (!ts.header) { console.error('testspec-*.csv がありません'); process.exit(2); }

const testOwner = new Map();
for (const r of ts.rows) {
  if (!r.TestID) continue;
  const prev = testOwner.get(r.TestID);
  if (prev && prev !== r.__group) {
    problems.push(`TestIDが複数の担当で使われています: ${r.TestID}（${prev} と ${r.__group}）`);
  }
  testOwner.set(r.TestID, r.__group);
}

/* ---- route claims ---- */
const rc = collect('route-claims-');
const routesPath = join(dir, 'routes.csv');
const routes = readCsvObjects(readFileSync(routesPath, 'utf8'));
const routeById = new Map(routes.records.map((r) => [r.RouteID, r]));

const claimAdd = (row, col, value) => {
  const cur = (row[col] || '').split(/[;\s]+/).filter(Boolean);
  for (const v of value.split(/[;\s]+/).filter(Boolean)) if (!cur.includes(v)) cur.push(v);
  row[col] = cur.join(';');
};

/*
 * 申告は毎回作り直す。前回の統合で書いた値を残すと、
 * 部分ファイルから消えたPatternIDがrouts.csvに居残って整合が取れなくなる。
 */
for (const r of routes.records) { r.PatternID = ''; r.TestID = ''; }

for (const c of rc.rows) {
  const row = routeById.get(c.RouteID);
  if (!row) { problems.push(`route-claims(${c.__group}): routes.csv に無いRouteIDです: ${c.RouteID}`); continue; }
  if (c.PatternID) claimAdd(row, 'PatternID', c.PatternID);
  if (c.TestID) claimAdd(row, 'TestID', c.TestID);
}

const unclaimed = routes.records.filter((r) => !r.PatternID);

/* ---- 書き出し ---- */
const strip = (rows) => rows.map(({ __group, __line, ...rest }) => rest);

writeFileSync(join(dir, 'pattern-matrix.csv'), writeCsvObjects(pm.header, strip(pm.rows)));
writeFileSync(join(dir, 'testspec.csv'), writeCsvObjects(ts.header, strip(ts.rows)));
writeFileSync(routesPath, writeCsvObjects(routes.header, strip(routes.records)));

/* ---- 報告 ---- */
console.log('統合しました');
console.log('\npattern-matrix');
for (const g of pm.groups) console.log(`  ${g.group.padEnd(4)} ${String(g.count).padStart(5)} パターン  (${g.file})`);
console.log(`  合計 ${pm.rows.length}`);

console.log('\ntestspec');
for (const g of ts.groups) console.log(`  ${g.group.padEnd(4)} ${String(g.count).padStart(5)} ステップ  (${g.file})`);
console.log(`  合計 ${ts.rows.length} ステップ / ${testOwner.size} テスト`);

console.log('\nroutes');
console.log(`  申告あり ${routes.records.length - unclaimed.length} / ${routes.records.length}`);
if (unclaimed.length) {
  console.log(`  どの担当も申告しなかったRoute ${unclaimed.length} 件:`);
  for (const r of unclaimed) console.log(`    ${r.RouteID} ${r.Route}（${r.EntryPoint}）`);
}

if (problems.length) {
  console.log(`\n要修正 ${problems.length} 件`);
  for (const p of problems) console.log(`  ${p}`);
  process.exit(1);
}
console.log('\nID衝突なし');
