#!/usr/bin/env node
/**
 * 不具合管理台帳（Markdown）の操作
 *
 *   node bug.mjs list                        一覧
 *   node bug.mjs next-id                     次に採番するBUG-ID
 *   node bug.mjs search <キーワード...>       重複候補を探す（登録前に必ず実行する）
 *   node bug.mjs add <json>                  新規登録（JSONは下記の項目）
 *   node bug.mjs recur <BUG-ID> <json>       既存不具合へ再現情報を追記
 *   node bug.mjs stats                       重要度・状態の集計
 *   node bug.mjs check --run <runId>         APPLICATION_DEFECTの登録漏れを検出
 *
 * add / recur に渡すJSONの例
 *   {"title":"...","severity":"Major","priority":"P1","detectedAt":"2026-08-12T18:00:00+09:00",
 *    "testIds":["TC-0042"],"patternIds":["P-F02-007"],"featureId":"F-02","screenId":"SC-SNIPPET-EDIT",
 *    "route":"/snippet/edit","env":"iPhone 17 / iOS 26.5","precondition":"fixture=baseline; plan=free",
 *    "steps":["1. ...","2. ..."],"expected":"...","actual":"...","reproducibility":"Always",
 *    "cause":"APPLICATION_DEFECT","specRef":"機能仕様書 §8.2","evidence":["docs/test/results/.../x.png"],
 *    "note":"..."}
 *
 * 既存の台帳は上書きしない。常に追記する。
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync, appendFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { readCsvObjects } from './lib/csv.mjs';
import { loadConfig } from './lib/config.mjs';

const cfg = loadConfig();
const LEDGER = cfg.issuesFile;

const HEADER = `# 不具合管理台帳

テスト実行で検出した不具合を記録する。1件1セクション。既存の記述は書き換えず追記する。

- **原因分類**: TEST_SPEC_ERROR / PRECONDITION_ERROR / AUTOMATION_ERROR / APPLICATION_DEFECT / SPEC_IMPLEMENTATION_MISMATCH / ENVIRONMENT_ERROR
- **重要度**: Critical / Major / Minor / Trivial（判定基準は .claude/skills/full-test/reference/defects.md）
- **再現性**: Always / Intermittent / Once / Unknown
- **ステータス**: Open / Fixed / Closed / WontFix / Duplicate

`;

function ensureLedger() {
  if (!existsSync(LEDGER)) {
    mkdirSync(dirname(LEDGER), { recursive: true });
    writeFileSync(LEDGER, HEADER);
  }
}

/** 台帳をセクション単位で読む */
function parseLedger() {
  ensureLedger();
  const text = readFileSync(LEDGER, 'utf8');
  const bugs = [];
  const re = /^## (BUG-\d+)$/gm;
  const marks = [...text.matchAll(re)];
  for (let i = 0; i < marks.length; i++) {
    const start = marks[i].index;
    const end = i + 1 < marks.length ? marks[i + 1].index : text.length;
    const body = text.slice(start, end);
    const field = (name) => {
      const m = body.match(new RegExp(`^- \\*\\*${name}\\*\\*:\\s*(.*)$`, 'm'));
      return m ? m[1].trim() : '';
    };
    bugs.push({
      id: marks[i][1],
      body,
      title: field('タイトル'),
      status: field('ステータス'),
      severity: field('重要度'),
      cause: field('原因分類'),
      testIds: field('検出テスト'),
      patternIds: field('関連PatternID'),
      featureId: field('関連FeatureID'),
      screenId: field('関連ScreenID'),
      route: field('発生Route'),
      expected: field('期待結果'),
      actual: field('実際結果'),
    });
  }
  return { text, bugs };
}

function nextId(bugs) {
  const max = bugs.reduce((a, b) => Math.max(a, Number(b.id.slice(4))), 0);
  return `BUG-${String(max + 1).padStart(4, '0')}`;
}

function j(v) { return Array.isArray(v) ? v.join(', ') : (v ?? ''); }

function render(id, d) {
  const steps = (d.steps ?? []).map((s) => `  ${s}`).join('\n');
  const evidence = (d.evidence ?? []).map((e) => `  - ${e}`).join('\n');
  return `
## ${id}

- **タイトル**: ${d.title ?? ''}
- **ステータス**: ${d.status ?? 'Open'}
- **重要度**: ${d.severity ?? ''}
- **優先度**: ${d.priority ?? ''}
- **検出日時**: ${d.detectedAt ?? ''}
- **検出テスト**: ${j(d.testIds)}
- **関連PatternID**: ${j(d.patternIds)}
- **関連FeatureID**: ${d.featureId ?? ''}
- **関連ScreenID**: ${d.screenId ?? ''}
- **発生Route**: ${d.route ?? ''}
- **発生環境**: ${d.env ?? ''}
- **前提条件**: ${d.precondition ?? ''}
- **再現手順**:
${steps || '  （未記載）'}
- **期待結果**: ${d.expected ?? ''}
- **実際結果**: ${d.actual ?? ''}
- **再現性**: ${d.reproducibility ?? 'Unknown'}
- **原因分類**: ${d.cause ?? ''}
- **仕様根拠**: ${d.specRef ?? ''}
- **証跡**:
${evidence || '  - （なし）'}
- **備考**: ${d.note ?? ''}
`;
}

/* ======================================== */

const [cmd, ...rest] = process.argv.slice(2);

switch (cmd) {
  case 'list': {
    const { bugs } = parseLedger();
    if (!bugs.length) { console.log('（登録なし）'); break; }
    for (const b of bugs) {
      console.log(`${b.id}\t${b.status}\t${b.severity}\t${b.cause}\t${b.title}`);
    }
    break;
  }

  case 'next-id': {
    const { bugs } = parseLedger();
    console.log(nextId(bugs));
    break;
  }

  case 'search': {
    const { bugs } = parseLedger();
    const words = rest.filter(Boolean);
    if (!words.length) { console.error('キーワードを指定してください'); process.exit(2); }
    const scored = bugs.map((b) => {
      const hay = b.body;
      const hits = words.filter((w) => hay.includes(w));
      return { b, score: hits.length, hits };
    }).filter((x) => x.score > 0).sort((a, b) => b.score - a.score);
    if (!scored.length) { console.log('重複候補なし（新規採番してよい）'); break; }
    console.log('重複候補（一致キーワード数の多い順）');
    for (const s of scored) {
      console.log(`  ${s.b.id} [${s.score}/${words.length}] ${s.b.title}`);
      console.log(`    一致: ${s.hits.join(', ')}`);
    }
    console.log('\n同一原因・同一現象なら新規採番せず `bug.mjs recur <BUG-ID> <json>` で追記すること。');
    break;
  }

  case 'add': {
    const { bugs } = parseLedger();
    const d = JSON.parse(rest.join(' '));
    if (!d.title) { console.error('title は必須です'); process.exit(2); }
    if (!d.cause) { console.error('cause（原因分類）は必須です'); process.exit(2); }
    if (!d.specRef) { console.error('specRef（仕様根拠）は必須です。主観だけで不具合登録はできません'); process.exit(2); }
    if (!d.testIds || !j(d.testIds)) { console.error('testIds は必須です'); process.exit(2); }
    const id = nextId(bugs);
    appendFileSync(LEDGER, render(id, d));
    console.log(id);
    break;
  }

  case 'recur': {
    const id = rest[0];
    const d = JSON.parse(rest.slice(1).join(' '));
    const { text, bugs } = parseLedger();
    const target = bugs.find((b) => b.id === id);
    if (!target) { console.error(`${id} が台帳にありません`); process.exit(2); }
    const block = `
### ${id} 再現記録

- **再現日時**: ${d.detectedAt ?? ''}
- **再現テスト**: ${j(d.testIds)}
- **再現環境**: ${d.env ?? ''}
- **実際結果**: ${d.actual ?? ''}
- **証跡**:
${(d.evidence ?? []).map((e) => `  - ${e}`).join('\n') || '  - （なし）'}
`;
    /* 既存セクションの末尾へ差し込む。既存の記述は消さない */
    const idx = text.indexOf(target.body) + target.body.length;
    writeFileSync(LEDGER, text.slice(0, idx) + block + text.slice(idx));
    console.log(`${id} へ再現情報を追記しました`);
    break;
  }

  case 'stats': {
    const { bugs } = parseLedger();
    const count = (key) => bugs.reduce((a, b) => ({ ...a, [b[key] || '(未設定)']: (a[b[key] || '(未設定)'] ?? 0) + 1 }), {});
    console.log(`総件数: ${bugs.length}`);
    console.log('重要度:', JSON.stringify(count('severity')));
    console.log('ステータス:', JSON.stringify(count('status')));
    console.log('原因分類:', JSON.stringify(count('cause')));
    break;
  }

  case 'check': {
    /* 実行結果と台帳を突き合わせ、登録漏れ・分類漏れを洗い出す */
    let runId = null;
    for (let i = 0; i < rest.length; i++) if (rest[i] === '--run') runId = rest[++i];
    if (!runId) { console.error('usage: bug.mjs check --run <runId>'); process.exit(2); }
    const f = join(cfg.resultsDir, runId, 'results-tests.csv');
    if (!existsSync(f)) { console.error(`実行結果がありません: ${f}`); process.exit(2); }
    const rows = readCsvObjects(readFileSync(f, 'utf8')).records;
    const { bugs } = parseLedger();
    const linked = new Set(bugs.flatMap((b) => b.testIds.split(/[,\s]+/).filter(Boolean)));

    const problems = [];
    for (const r of rows) {
      if (r.Result !== 'FAIL') continue;
      if (!r.FailureClass || r.FailureClass === 'REQUIRES_TRIAGE') {
        problems.push(`${r.TestID}: FAILだが原因未分類（FailureClass=${r.FailureClass || '空'}）`);
        continue;
      }
      if (['APPLICATION_DEFECT', 'SPEC_IMPLEMENTATION_MISMATCH'].includes(r.FailureClass)) {
        if (!r.BugID) problems.push(`${r.TestID}: ${r.FailureClass} だが results-tests.csv にBugIDが無い`);
        else if (!bugs.some((b) => b.id === r.BugID)) problems.push(`${r.TestID}: BugID ${r.BugID} が台帳にない`);
        else if (!linked.has(r.TestID)) problems.push(`${r.TestID}: ${r.BugID} 側に検出テストとして記載が無い（相互追跡が切れている）`);
      }
    }
    if (!problems.length) {
      console.log('登録漏れ・分類漏れはありません。');
    } else {
      for (const p of problems) console.log(`NG ${p}`);
      process.exit(1);
    }
    break;
  }

  default:
    console.error(readFileSync(new URL(import.meta.url)).toString().split('\n').slice(1, 26).join('\n'));
    process.exit(2);
}
