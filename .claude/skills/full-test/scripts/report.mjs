#!/usr/bin/env node
/**
 * 実行結果レポートの生成
 *
 *   node report.mjs --run <runId>
 *
 * <RESULTS_DIR>/<runId>/report.md を書き出す。
 * 網羅率・実行結果・FAIL/BLOCKED一覧・不具合の相互追跡を1枚にまとめる。
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, isAbsolute } from 'node:path';
import { readCsvObjects } from './lib/csv.mjs';
import { computeCoverage, show } from './coverage.mjs';
import { loadConfig, REPO_ROOT } from './lib/config.mjs';

const cfg = loadConfig();

let runId = null;
let docDir = cfg.testDocDir;
const argv = process.argv.slice(2);
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === '--run') runId = argv[++i];
  else if (argv[i] === '--doc-dir') docDir = argv[++i];
}
if (!runId) { console.error('usage: report.mjs --run <runId> [--doc-dir <dir>]'); process.exit(2); }
if (!isAbsolute(docDir)) docDir = join(REPO_ROOT, docDir);

const runDir = join(cfg.resultsDir, runId);
const testsFile = join(runDir, 'results-tests.csv');
if (!existsSync(testsFile)) { console.error(`実行結果がありません: ${testsFile}`); process.exit(2); }

const tests = readCsvObjects(readFileSync(testsFile, 'utf8')).records;
const steps = existsSync(join(runDir, 'results.csv'))
  ? readCsvObjects(readFileSync(join(runDir, 'results.csv'), 'utf8')).records
  : [];
const c = computeCoverage(docDir, runId);

/* 不具合台帳 */
const bugs = [];
if (existsSync(cfg.issuesFile)) {
  const text = readFileSync(cfg.issuesFile, 'utf8');
  const marks = [...text.matchAll(/^## (BUG-\d+)$/gm)];
  for (let i = 0; i < marks.length; i++) {
    const body = text.slice(marks[i].index, i + 1 < marks.length ? marks[i + 1].index : text.length);
    const f = (n) => (body.match(new RegExp(`^- \\*\\*${n}\\*\\*:\\s*(.*)$`, 'm')) ?? ['', ''])[1].trim();
    bugs.push({ id: marks[i][1], title: f('タイトル'), severity: f('重要度'), status: f('ステータス'), cause: f('原因分類'), testIds: f('検出テスト') });
  }
}

const byResult = (r) => tests.filter((t) => t.Result === r);
const byClass = (k) => tests.filter((t) => t.FailureClass === k);
const sev = (s) => bugs.filter((b) => b.severity === s).length;

/* 今回の実行で参照されたBUG-IDと、台帳側で今回のTestIDを持つもの */
const runTestIds = new Set(tests.map((t) => t.TestID));
const newBugs = bugs.filter((b) => b.testIds.split(/[,\s]+/).some((t) => runTestIds.has(t)));

const t = (x) => (x == null || x === '' ? '―' : String(x));
const row = (cells) => `| ${cells.map(t).join(' | ')} |`;

const lines = [];
lines.push(`# テスト実行結果 ${runId}`);
lines.push('');
lines.push(`- 実行環境: ${t(tests[0]?.Device)} / ${t(tests[0]?.OSVersion)}`);
lines.push(`- テスト仕様書: \`${docDir}/testspec.csv\``);
lines.push(`- 証跡: \`${cfg.RESULTS_DIR}/${runId}/evidence/\``);
lines.push('');

lines.push('## 1. 実行サマリ');
lines.push('');
lines.push(row(['項目', '値']));
lines.push(row(['---', '---']));
lines.push(row(['総テスト数', tests.length]));
lines.push(row(['PASS数', byResult('PASS').length]));
lines.push(row(['FAIL数', byResult('FAIL').length]));
lines.push(row(['BLOCKED数', byResult('BLOCKED').length]));
lines.push(row(['実行率', `${c.executed?.executionRate ?? 0}%`]));
lines.push(row(['成功率', `${c.executed?.successRate ?? 0}%`]));
lines.push(row(['総ステップ数', steps.length]));
lines.push('');

lines.push('## 2. 網羅率');
lines.push('');
lines.push(row(['対象', '総数', '設計網羅', '実測（PASS到達）', '設計網羅率']));
lines.push(row(['---', '---', '---', '---', '---']));
lines.push(row(['画面', c.design.screen.total, c.design.screen.covered, c.executed?.testedScreens.size ?? 0, show(c.design.screen.rate)]));
lines.push(row(['機能', c.design.feature.total, c.design.feature.covered, c.executed?.testedFeatures.size ?? 0, show(c.design.feature.rate)]));
lines.push(row(['Pattern', c.design.pattern.total, c.design.pattern.covered, c.executed?.testedPatterns.size ?? 0, show(c.design.pattern.rate)]));
lines.push(row(['Route', c.design.route.total, c.design.route.covered, c.executed?.testedRoutes.length ?? 0, show(c.design.route.rate)]));
lines.push(row(['条件分岐', c.design.condition.total, c.design.condition.covered, '―', show(c.design.condition.rate)]));
lines.push('');

lines.push('### 機能ごとの到達可能率');
lines.push('');
lines.push('全体の網羅率は「到達可能と判断したものを全部テストしたか」しか表さない。');
lines.push('機能ごとに、そもそも自動テストでどこまで見えているかを示す。');
lines.push('');
lines.push(row(['機能', '到達可能', '到達不能', '率', 'テスト数']));
lines.push(row(['---', '---', '---', '---', '---']));
for (const f of c.perFeature.sort((a, b) => (a.rate ?? 101) - (b.rate ?? 101))) {
  lines.push(row([`${f.FeatureID} ${f.Name}`, f.reachable, f.unreachable, show(f.rate), f.tests]));
}
lines.push('');
lines.push('> 到達不能なパターンは `manual-checklist.md` に手動確認の手順としてまとめてある。');
lines.push('> **自動テストが全部PASSしても、そちらが未確認ならリリース判定はできない。**');
lines.push('');

const listSection = (title, arr) => {
  lines.push(`### ${title}（${arr.length}件）`);
  lines.push('');
  if (!arr.length) lines.push('なし');
  else for (const x of arr) lines.push(`- ${x}`);
  lines.push('');
};
listSection('未テスト画面', c.missing.screens);
listSection('未テスト機能', c.missing.features);
listSection('未テストPattern', c.missing.patterns);
listSection('未テストRoute', c.missing.routes);

lines.push(`### UNREACHABLE（${c.unreachable.length}件）`);
lines.push('');
if (!c.unreachable.length) lines.push('なし');
else {
  lines.push(row(['PatternID', '根拠']));
  lines.push(row(['---', '---']));
  for (const u of c.unreachable) lines.push(row([u.PatternID, u.UnreachableReason]));
}
lines.push('');

lines.push('## 3. FAIL一覧');
lines.push('');
if (!byResult('FAIL').length) lines.push('なし');
else {
  lines.push(row(['TestID', 'PatternID', 'Step', '原因分類', 'BUG-ID', '内容']));
  lines.push(row(['---', '---', '---', '---', '---', '---']));
  for (const f of byResult('FAIL')) {
    lines.push(row([f.TestID, f.PatternID, f.FailedStepNo, f.FailureClass, f.BugID, f.Notes?.replace(/\|/g, '\\|')]));
  }
}
lines.push('');

lines.push('## 4. BLOCKED一覧');
lines.push('');
if (!byResult('BLOCKED').length) lines.push('なし');
else {
  lines.push(row(['TestID', '原因分類', '理由']));
  lines.push(row(['---', '---', '---']));
  for (const b of byResult('BLOCKED')) lines.push(row([b.TestID, b.FailureClass, b.Notes?.replace(/\|/g, '\\|')]));
}
lines.push('');

lines.push('## 5. 原因分類の内訳');
lines.push('');
lines.push(row(['分類', '件数']));
lines.push(row(['---', '---']));
for (const k of ['TEST_SPEC_ERROR', 'PRECONDITION_ERROR', 'AUTOMATION_ERROR', 'APPLICATION_DEFECT', 'SPEC_IMPLEMENTATION_MISMATCH', 'ENVIRONMENT_ERROR', 'REQUIRES_TRIAGE']) {
  lines.push(row([k, byClass(k).length]));
}
if (byClass('REQUIRES_TRIAGE').length) {
  lines.push('');
  lines.push('> REQUIRES_TRIAGE が残っている間はレポートを確定できない。');
  lines.push('> 各FAILを6分類のいずれかへ確定し、results-tests.csv の FailureClass を更新すること。');
}
lines.push('');

lines.push('## 6. 不具合');
lines.push('');
lines.push(row(['項目', '件数']));
lines.push(row(['---', '---']));
lines.push(row(['台帳の総件数', bugs.length]));
lines.push(row(['今回の実行に紐づく不具合', newBugs.length]));
lines.push(row(['Critical', sev('Critical')]));
lines.push(row(['Major', sev('Major')]));
lines.push(row(['Minor', sev('Minor')]));
lines.push(row(['Trivial', sev('Trivial')]));
lines.push('');

lines.push('### BUG-ID別の関連TestID');
lines.push('');
if (!newBugs.length) lines.push('なし');
else {
  lines.push(row(['BUG-ID', '重要度', '状態', '原因分類', '関連TestID', 'タイトル']));
  lines.push(row(['---', '---', '---', '---', '---', '---']));
  for (const b of newBugs) lines.push(row([b.id, b.severity, b.status, b.cause, b.testIds, b.title?.replace(/\|/g, '\\|')]));
}
lines.push('');

lines.push('### APPLICATION_DEFECT 一覧');
lines.push('');
const appDefects = byClass('APPLICATION_DEFECT');
if (!appDefects.length) lines.push('なし');
else for (const d of appDefects) lines.push(`- ${d.TestID}（${d.BugID || '**未登録**'}）: ${d.Notes}`);
lines.push('');

lines.push('### SPEC_IMPLEMENTATION_MISMATCH 一覧');
lines.push('');
const mismatches = byClass('SPEC_IMPLEMENTATION_MISMATCH');
if (!mismatches.length) lines.push('なし');
else for (const d of mismatches) lines.push(`- ${d.TestID}（${d.BugID || '**未登録**'}）: ${d.Notes}`);
lines.push('');

const out = join(runDir, 'report.md');
writeFileSync(out, lines.join('\n') + '\n');
console.log(out);
