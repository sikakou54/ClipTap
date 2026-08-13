#!/usr/bin/env node
/**
 * テスト仕様書CSVの自動実行
 *
 *   node run.mjs --spec docs/test/testspec.csv --run-id 20260812-1800
 *   node run.mjs --tests TC-0001,TC-0002        （TestIDを限定）
 *   node run.mjs --filter FeatureID=F-02        （列の値で絞り込み）
 *   node run.mjs --dry-run                      （前提と手順の解釈だけ検証し、操作はしない）
 *   node run.mjs --run-id <id> --resume         （同じrun-idの続きから。済みのTestIDを飛ばす）
 *
 * 出力
 *   <RESULTS_DIR>/<runId>/results.csv        ステップ単位
 *   <RESULTS_DIR>/<runId>/results-tests.csv  テスト単位
 *   <RESULTS_DIR>/<runId>/evidence/          スクリーンショット・AXダンプ
 *   <RESULTS_DIR>/<runId>/run.log            実行ログ
 *
 * 設計の要点
 * - PASS / FAIL を決めるのは ASSERT_* だけ。操作の失敗は AUTOMATION_ERROR として
 *   FAIL にするが、原因分類は人（またはClaude）が後段で確定する。
 * - 前提条件はDBと永続設定を直接組み立てる。画面操作で前提を作らないので、
 *   前提を作る過程の不具合でテストが倒れない。
 * - 失敗したステップでは必ずスクリーンショットとAXダンプを証跡として残す。
 */
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, existsSync, appendFileSync } from 'node:fs';
import { join, isAbsolute } from 'node:path';
import { readCsvObjects, writeCsvObjects } from './lib/csv.mjs';
import { ACTIONS, PRECONDITION_KEYS } from './lib/actions.mjs';
import { loadConfig, REPO_ROOT } from './lib/config.mjs';

const cfg = loadConfig();

/* ======================================== */
/* 引数 */
/* ======================================== */

function parseArgs() {
  const a = { spec: join(cfg.testDocDir, 'testspec.csv'), tests: null, filter: null, dryRun: false, runId: null };
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i];
    if (k === '--spec') a.spec = argv[++i];
    else if (k === '--tests') a.tests = argv[++i].split(',').map((s) => s.trim());
    else if (k === '--filter') a.filter = argv[++i];
    else if (k === '--run-id') a.runId = argv[++i];
    else if (k === '--doc-dir') a.docDir = argv[++i];
    else if (k === '--dry-run') a.dryRun = true;
    else if (k === '--resume') a.resume = true;
    else { console.error(`未知の引数: ${k}`); process.exit(2); }
  }
  if (!isAbsolute(a.spec)) a.spec = join(REPO_ROOT, a.spec);
  if (a.docDir) {
    if (!isAbsolute(a.docDir)) a.docDir = join(REPO_ROOT, a.docDir);
    cfg.testDocDir = a.docDir;
  }
  if (!a.runId) {
    /* 実行IDは呼び出し側から渡せるが、省略時はローカル時刻で作る */
    const d = new Date();
    const p = (n) => String(n).padStart(2, '0');
    a.runId = `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`;
  }
  return a;
}

const args = parseArgs();

/* ======================================== */
/* 実行ログ */
/* ======================================== */

const runDir = join(cfg.resultsDir, args.runId);
const evidenceDir = join(runDir, 'evidence');
mkdirSync(evidenceDir, { recursive: true });
const logFile = join(runDir, 'run.log');

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  appendFileSync(logFile, line + '\n');
}

/* ======================================== */
/* 外部コマンド */
/* ======================================== */

function sh(cmd, cmdArgs, opts = {}) {
  const r = spawnSync(cmd, cmdArgs, {
    encoding: 'utf8',
    timeout: opts.timeout ?? 180000,
    env: { ...process.env, FULLTEST_OUT: join(runDir, '.work') },
  });
  return {
    code: r.status ?? -1,
    out: (r.stdout ?? '').trim(),
    err: (r.stderr ?? '').trim(),
  };
}

const sim = (...a) => sh(cfg.simSh, a);
const state = (...a) => sh(cfg.stateSh, a);

/*
 * オフラインテストでホストのWi-Fiを切る。切ったまま終わると
 * 利用者のマシンがネットワーク無しで放置されるので、
 * 異常終了や中断を含めて必ず戻す。
 */
let networkTurnedOff = false;
function restoreNetwork() {
  if (!networkTurnedOff) return;
  networkTurnedOff = false;
  sh('networksetup', ['-setairportpower', cfg.WIFI_DEVICE, 'on']);
  console.log('Wi-Fiを元に戻しました');
}
for (const ev of ['exit', 'SIGINT', 'SIGTERM', 'uncaughtException']) {
  process.on(ev, (e) => {
    restoreNetwork();
    if (ev === 'uncaughtException') { console.error(e); process.exit(1); }
    if (ev !== 'exit') process.exit(130);
  });
}

function sleep(ms) {
  /* 同期的に待つ。ステップ間隔は数百msなのでイベントループを止めても支障がない */
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

/* ======================================== */
/* プレースホルダ展開 */
/* ======================================== */

/** アプリのシステム変数と同じトークンで日時を整形する（§8.23の許可トークン） */
function formatDate(d, pattern, locale = 'ja-JP') {
  const p2 = (n) => String(n).padStart(2, '0');
  const wShort = new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(d);
  const wLong = new Intl.DateTimeFormat(locale, { weekday: 'long' }).format(d);
  return pattern
    .replace(/yyyy/g, String(d.getFullYear()))
    .replace(/yy/g, String(d.getFullYear()).slice(-2))
    .replace(/MM/g, p2(d.getMonth() + 1))
    .replace(/(?<![My])M(?!M)/g, String(d.getMonth() + 1))
    .replace(/dd/g, p2(d.getDate()))
    .replace(/(?<![d])d(?!d)/g, String(d.getDate()))
    .replace(/HH/g, p2(d.getHours()))
    .replace(/(?<![H])H(?!H)/g, String(d.getHours()))
    .replace(/mm/g, p2(d.getMinutes()))
    .replace(/ss/g, p2(d.getSeconds()))
    .replace(/EEEE/g, wLong)
    .replace(/EEE/g, wShort);
}

/**
 * 実行時に決まる値をCSVへ書けるようにする置換。
 *
 *   ${TODAY:yyyy/MM/dd}   日本語ロケールで整形した現在日時
 *   ${TODAY_EN:EEE}       英語ロケールで整形（曜日の表記が言語で変わるため）
 *   ${NOW:HH:mm}          ${TODAY} と同じ。意図を読みやすくするための別名
 *   ${NL} ${TAB}          改行・タブ
 *
 * 日付を含む期待値を、実行日に依存しない客観的な値として書くために必要。
 */
/**
 * `\uXXXX` を実際の文字へ戻す。
 * アイコンのグリフは端末で空白に見えるため、期待値はエスケープで書く。
 * ロケータには使わない（ロケータ側は ui.swift が同じ記法を解釈する）。
 */
function unesc(text) {
  if (!text || !text.includes('\\u')) return text;
  return text.replace(/\\u([0-9a-fA-F]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16)));
}

function expand(text) {
  if (!text) return text;
  const now = new Date();
  return text
    .replace(/\$\{(?:TODAY|NOW)_EN:([^}]*)\}/g, (_, pat) => formatDate(now, pat, 'en-US'))
    .replace(/\$\{(?:TODAY|NOW):([^}]*)\}/g, (_, pat) => formatDate(now, pat))
    .replace(/\$\{TODAY\}/g, formatDate(now, 'yyyy/MM/dd'))
    .replace(/\$\{NL\}/g, '\n')
    .replace(/\$\{TAB\}/g, '\t');
}

/* ======================================== */
/* 画面レジストリ（ASSERT_SCREEN用） */
/* ======================================== */

const screens = new Map();
{
  const f = join(cfg.testDocDir, 'screens.csv');
  if (existsSync(f)) {
    const { records } = readCsvObjects(readFileSync(f, 'utf8'));
    for (const r of records) {
      if (r.ScreenID) screens.set(r.ScreenID, r);
    }
  }
}

/* ======================================== */
/* 前提条件の適用 */
/* ======================================== */

class Blocked extends Error {}

function parseDirectives(text, where) {
  const out = {};
  if (!text || text.trim() === '' || text.trim() === 'none') return out;
  for (const part of text.split(';')) {
    const s = part.trim();
    if (!s) continue;
    const eq = s.indexOf('=');
    if (eq < 0) throw new Error(`${where}: 「key=value」の形式ではありません: ${s}`);
    const k = s.slice(0, eq).trim();
    const v = s.slice(eq + 1).trim();
    if (!PRECONDITION_KEYS.includes(k)) {
      throw new Error(`${where}: 未定義の前提条件キー: ${k}（使えるのは ${PRECONDITION_KEYS.join(', ')}）`);
    }
    out[k] = v;
  }
  return out;
}

function applyDirectives(d, { allowLaunch = true } = {}) {
  if (d.network) {
    if (cfg.ALLOW_NETWORK_TOGGLE !== '1') {
      throw new Blocked('ネットワーク切替が config.env で許可されていません（ALLOW_NETWORK_TOGGLE=0）');
    }
    const r = sh('networksetup', ['-setairportpower', cfg.WIFI_DEVICE, d.network === 'off' ? 'off' : 'on']);
    if (r.code !== 0) throw new Blocked(`Wi-Fiの切替に失敗: ${r.err}`);
    networkTurnedOff = d.network === 'off';
  }
  if (d.install === 'fresh') {
    const r = state('wipe');
    if (r.code !== 0) throw new Blocked(`初期化に失敗: ${r.err}`);
    /* 新規インストール状態はアプリ起動時にスキーマが作られる */
    const l = sim('launch');
    if (l.code !== 0) throw new Blocked(`起動に失敗: ${l.err}`);
    sim('terminate');
  }
  if (d.fixture) {
    const r = state('fixture', d.fixture);
    if (r.code !== 0) throw new Blocked(`フィクスチャの適用に失敗（${d.fixture}）: ${r.err}`);
  }
  if (d.plan) {
    const r = state('plan', d.plan);
    if (r.code !== 0) throw new Blocked(`プラン設定に失敗: ${r.err}`);
  }
  if (d.sort) {
    const r = state('sort', d.sort);
    if (r.code !== 0) throw new Blocked(`並べ替え設定に失敗: ${r.err}`);
  }
  if (d.locale) {
    const r = sim('locale', d.locale);
    if (r.code !== 0) throw new Blocked(`言語設定に失敗: ${r.err}`);
    /* 言語切替でSpringBoardが再起動し、起動済みのアプリが落ちる */
    sim('terminate');
  }
  if (d.appearance) {
    const r = sim('appearance', d.appearance);
    if (r.code !== 0) throw new Blocked(`外観設定に失敗: ${r.err}`);
  }
  if (d.clipboard != null) {
    sim('setclipboard', expand(d.clipboard));
  }
  if (allowLaunch && d.launch !== 'no') {
    const r = sim('relaunch');
    if (r.code !== 0) throw new Blocked(`アプリの起動に失敗: ${r.err}`);
  }
}

/* ======================================== */
/* ステップ実行 */
/* ======================================== */

/** ロケータを解決するときは、原則として画面内の要素だけを対象にする */
function visibleLocator(loc) {
  if (!loc) return loc;
  if (loc.includes('visible=')) return loc;
  const m = loc.match(/^(.*?)(\[\d+\])?$/);
  return `${m[1]}&visible=true${m[2] ?? ''}`;
}

function uiTexts() {
  return sim('texts').out.split('\n').filter(Boolean);
}

function screenSignature(screenId) {
  const s = screens.get(screenId);
  if (!s) throw new Error(`screens.csv に ScreenID がありません: ${screenId}`);
  if (!s.Signature) throw new Error(`screens.csv の ${screenId} に Signature 列がありません`);
  return s.Signature;
}

/**
 * 1ステップを実行する。
 * @returns {{ok: boolean, actual: string}}
 */
function runStep(step, ctx) {
  const action = step.Action;
  const spec = ACTIONS[action];
  if (!spec) return { ok: false, actual: `未定義のAction: ${action}` };

  const target = expand(step.Target);
  /* テキスト比較に使う値は、アイコンのグリフをエスケープで書けるようにする */
  const TEXT_INPUT_ACTIONS = new Set(['ASSERT_TEXT', 'ASSERT_TEXT_CONTAINS', 'ASSERT_SCREEN_HAS',
    'ASSERT_SCREEN_LACKS', 'ASSERT_CLIPBOARD', 'ASSERT_CLIPBOARD_CONTAINS', 'ASSERT_ORDER',
    'ASSERT_DB', 'ASSERT_PREF']);
  const input = TEXT_INPUT_ACTIONS.has(action) ? unesc(expand(step.Input)) : expand(step.Input);
  const wait = Number(cfg.DEFAULT_WAIT_MS);

  switch (action) {
    /* ---- 前提・ライフサイクル ---- */
    case 'SET_STATE': {
      const r = state('fixture', target);
      return { ok: r.code === 0, actual: r.code === 0 ? `fixture=${target}` : r.err };
    }
    case 'SET_PLAN':      { const r = state('plan', input);   return { ok: r.code === 0, actual: r.out || r.err }; }
    case 'SET_SORT':      { const r = state('sort', input);   return { ok: r.code === 0, actual: r.out || r.err }; }
    case 'SET_LOCALE':    { const r = sim('locale', input);   return { ok: r.code === 0, actual: r.out || r.err }; }
    case 'SET_APPEARANCE':{ const r = sim('appearance', input); return { ok: r.code === 0, actual: r.out || r.err }; }
    case 'SET_CLIPBOARD': { const r = sim('setclipboard', input); return { ok: r.code === 0, actual: r.out || r.err }; }
    case 'SET_NETWORK': {
      if (cfg.ALLOW_NETWORK_TOGGLE !== '1') {
        throw new Blocked('ネットワーク切替が許可されていません（config.env の ALLOW_NETWORK_TOGGLE）');
      }
      const r = sh('networksetup', ['-setairportpower', cfg.WIFI_DEVICE, input === 'off' ? 'off' : 'on']);
      networkTurnedOff = input === 'off';
      return { ok: r.code === 0, actual: r.out || r.err };
    }
    case 'LAUNCH':      { const r = sim('launch');    return { ok: r.code === 0, actual: r.out || r.err }; }
    case 'RELAUNCH':    { const r = sim('relaunch');  return { ok: r.code === 0, actual: r.out || r.err }; }
    case 'TERMINATE':   { const r = sim('terminate'); return { ok: r.code === 0, actual: r.out || r.err }; }
    case 'WIPE_INSTALL':{ const r = state('wipe');    return { ok: r.code === 0, actual: r.out || r.err }; }

    /* ---- 操作 ---- */
    case 'TAP':        { const r = sim('tap', visibleLocator(target));       return { ok: r.code === 0, actual: r.out || r.err }; }
    case 'LONG_PRESS': { const r = sim('longpress', visibleLocator(target), input || '600'); return { ok: r.code === 0, actual: r.out || r.err }; }
    case 'DOUBLE_TAP': { const r = sim('doubletap', visibleLocator(target)); return { ok: r.code === 0, actual: r.out || r.err }; }
    case 'TAP_REPEAT': { const r = sim('tapfast', visibleLocator(target), input || '3'); return { ok: r.code === 0, actual: r.out || r.err }; }
    case 'TAP_NEAR': {
      const r = sim('tapnear', target, input);
      return { ok: r.code === 0, actual: r.out || r.err };
    }
    case 'TAP_IN': {
      const [fx, fy] = (input || '0.5,0.5').split(',').map((v) => v.trim());
      const r = sim('tapin', visibleLocator(target), fx, fy);
      return { ok: r.code === 0, actual: r.out || r.err };
    }
    case 'DRAG': {
      const from = target.includes(',') && /^\d/.test(target) ? target : visibleLocator(target);
      const to = input.includes(',') && /^\d/.test(input) ? input : visibleLocator(input);
      const r = sim('drag', from, to);
      return { ok: r.code === 0, actual: r.out || r.err };
    }
    case 'SCROLL':       { const r = sim('scroll', input || 'down'); return { ok: r.code === 0, actual: r.out || r.err }; }
    case 'SCROLL_TO':    { const r = sim('scrollto', target);        return { ok: r.code === 0, actual: r.out || r.err }; }
    case 'PULL_REFRESH': { const r = sim('pullrefresh');             return { ok: r.code === 0, actual: r.out || r.err }; }
    case 'SWIPE':        { const r = sim('swipe', input);            return { ok: r.code === 0, actual: r.out || r.err }; }
    case 'TYPE': {
      const t = sim('tap', visibleLocator(target));
      if (t.code !== 0) return { ok: false, actual: `入力欄をタップできません: ${t.err}` };
      sleep(400);
      const r = sim('type', input);
      return { ok: r.code === 0, actual: r.out || r.err };
    }
    case 'TYPE_RAW':  { const r = sim('type', input); return { ok: r.code === 0, actual: r.out || r.err }; }
    case 'TYPE_PASTE': {
      const t = sim('tap', visibleLocator(target));
      if (t.code !== 0) return { ok: false, actual: `入力欄をタップできません: ${t.err}` };
      sleep(400);
      const r = sim('paste', input);
      return { ok: r.code === 0, actual: r.out || r.err };
    }
    case 'PASTE_RAW': { const r = sim('paste', input); return { ok: r.code === 0, actual: r.out || r.err }; }
    case 'CLEAR_TEXT': {
      const t = sim('tap', visibleLocator(target));
      if (t.code !== 0) return { ok: false, actual: `入力欄をタップできません: ${t.err}` };
      sleep(400);
      const r = sim('cleartext', input || '60');
      return { ok: r.code === 0, actual: r.out || r.err };
    }
    case 'PRESS_KEY': { const r = sim('key', input); return { ok: r.code === 0, actual: r.out || r.err }; }
    case 'HOME':      { const r = sim('home');       return { ok: r.code === 0, actual: r.out || r.err }; }
    case 'WAIT':      { sleep(Number(input || 1000)); return { ok: true, actual: `waited ${input || 1000}ms` }; }
    case 'WAIT_FOR':  { const r = sim('waitfor', visibleLocator(target), input || String(wait)); return { ok: r.code === 0, actual: r.out || r.err }; }
    case 'WAIT_GONE': { const r = sim('waitgone', visibleLocator(target), input || String(wait)); return { ok: r.code === 0, actual: r.out || r.err }; }

    /* ---- 検証 ---- */
    case 'ASSERT_VISIBLE': {
      const r = sim('waitfor', visibleLocator(target), String(wait));
      return { ok: r.code === 0, actual: r.code === 0 ? `見えている（${r.out}）` : '見つからない' };
    }
    case 'ASSERT_NOT_VISIBLE': {
      const r = sim('waitgone', visibleLocator(target), String(wait));
      return { ok: r.code === 0, actual: r.code === 0 ? '見えていない' : 'まだ見えている' };
    }
    case 'ASSERT_TEXT':
    case 'ASSERT_TEXT_CONTAINS': {
      const r = sim('json');
      if (r.code !== 0) return { ok: false, actual: `AXツリーを取得できません: ${r.err}` };
      const nodes = JSON.parse(r.out);
      const found = nodes.filter((n) => matchLocator(n, visibleLocator(target)));
      if (found.length === 0) return { ok: false, actual: `要素が見つからない: ${target}` };
      const label = found[0].label || found[0].value;
      const ok = action === 'ASSERT_TEXT' ? label === input : label.includes(input);
      return { ok, actual: label };
    }
    case 'ASSERT_SCREEN_HAS': {
      const texts = uiTexts();
      const ok = texts.some((t) => t.includes(input));
      return { ok, actual: ok ? `含む` : `画面内に見つからない（表示中: ${texts.slice(0, 12).join(' / ')}）` };
    }
    case 'ASSERT_SCREEN_LACKS': {
      const texts = uiTexts();
      const hit = texts.find((t) => t.includes(input));
      return { ok: !hit, actual: hit ? `見つかってしまった: ${hit}` : '無い' };
    }
    case 'ASSERT_COUNT': {
      const r = sim('count', visibleLocator(target));
      const n = Number(r.out);
      return { ok: String(n) === String(Number(input)), actual: `${n}件` };
    }
    case 'ASSERT_ORDER': {
      const r = sim('json');
      if (r.code !== 0) return { ok: false, actual: `AXツリーを取得できません: ${r.err}` };
      const nodes = JSON.parse(r.out)
        .filter((n) => matchLocator(n, visibleLocator(target)))
        .sort((a, b) => a.cy - b.cy)
        .map((n) => n.label || n.value);
      /*
       * 期待値の区切りは既定でカンマだが、一覧行のラベルは
       * 「A社用, 標準にする, 削除」のようにカンマを含む。
       * `|` が含まれていればそちらを区切りに使う。
       */
      const sep = input.includes('|') ? '|' : ',';
      /*
       * `|` 区切りのときは前後の空白も期待値の一部として扱う。
       * 一覧行のラベルは「仕事, 」のように末尾へ空白が付くため、
       * ここでtrimすると一致しなくなる。
       */
      const expected = sep === '|' ? input.split(sep) : input.split(sep).map((x) => x.trim());
      const bad = expected.findIndex((e, i) => nodes[i] !== e);
      return {
        ok: bad === -1,
        actual: bad === -1
          ? nodes.slice(0, expected.length).join(' / ')
          : `${bad}番目が不一致: 期待 ${JSON.stringify(expected[bad])} / 実際 ${JSON.stringify(nodes[bad])}`
            + `（一致件数 ${nodes.length}）`,
      };
    }
    case 'ASSERT_ENABLED':
    case 'ASSERT_DISABLED': {
      const want = action === 'ASSERT_ENABLED';
      const r = sim('count', `${visibleLocator(target)}&enabled=${want}`);
      const n = Number(r.out);
      return { ok: n > 0, actual: n > 0 ? (want ? '操作可能' : '操作不能') : (want ? '操作不能または不在' : '操作可能または不在') };
    }
    case 'ASSERT_CLIPBOARD':
    case 'ASSERT_CLIPBOARD_CONTAINS': {
      const r = sim('clipboard');
      const v = r.out;
      const ok = action === 'ASSERT_CLIPBOARD' ? v === input : v.includes(input);
      return { ok, actual: JSON.stringify(v) };
    }
    case 'ASSERT_DB': {
      const r = state('sql', target);
      if (r.code !== 0) return { ok: false, actual: `SQL失敗: ${r.err}` };
      const v = r.out;
      return { ok: v === input, actual: JSON.stringify(v) };
    }
    case 'ASSERT_PREF': {
      /*
       * AsyncStorageはメモリに溜めてから書き出すため、アプリが直前に書いた値は
       * すぐにはファイルへ現れない。以前はアプリを終了させて書き出しを促していたが、
       * それだと以降のステップが全部倒れる。数回読み直して待つ。
       */
      let v = '';
      for (let i = 0; i < 6; i++) {
        const r = state('pref', 'get', target);
        v = r.code === 0 ? r.out : '';
        if (v === input) break;
        sleep(600);
      }
      return { ok: v === input, actual: JSON.stringify(v) };
    }
    case 'ASSERT_SCREEN': {
      /*
       * Signature は `+` で「これも在ること」、`-` で「これは無いこと」を並べられる。
       * ヘッダの見出しだけでは、その画面から開いた子画面と区別できないことがある。
       * 例: カテゴリ管理の見出し「カテゴリ」は、カテゴリ作成画面の項目ラベルにも現れる。
       */
      const sig = screenSignature(target);
      const parts = sig.split('+').map((x) => x.trim()).filter(Boolean);
      const missing = [];
      for (const part of parts) {
        if (part.startsWith('-')) {
          const loc = part.slice(1).trim();
          const r = sim('waitgone', visibleLocator(loc), '1500');
          if (r.code !== 0) missing.push(`${loc} が残っている`);
        } else {
          const r = sim('waitfor', visibleLocator(part), String(wait));
          if (r.code !== 0) missing.push(`${part} が無い`);
        }
      }
      return {
        ok: missing.length === 0,
        actual: missing.length === 0 ? `${target} を確認` : `${target} と判定できない: ${missing.join(' / ')}`,
      };
    }
    case 'ASSERT_NO_JS_ERROR': {
      const r = sim('logs', input || '3');
      const clean = r.out.includes('検出されませんでした');
      return { ok: clean, actual: clean ? 'エラーなし' : r.out.slice(0, 500) };
    }

    /* ---- 証跡 ---- */
    case 'SHOT': {
      const r = sim('shot', `${ctx.testId}-${step.StepNo}-${target || 'shot'}`, evidenceDir);
      return { ok: r.code === 0, actual: r.out, evidence: r.out };
    }
    case 'DUMP_UI': {
      const r = sim('dump');
      const p = join(evidenceDir, `${ctx.testId}-${step.StepNo}-${target || 'ui'}.txt`);
      writeFileSync(p, r.out);
      return { ok: true, actual: p, evidence: p };
    }

    default:
      return { ok: false, actual: `実装されていないAction: ${action}` };
  }
}

/** ui.swift と同じロケータ評価をJS側でも行う（AXツリーをJSONで受けたとき用） */
function matchLocator(node, locator) {
  let s = locator;
  let index = null;
  const m = s.match(/^(.*)\[(\d+)\]$/);
  if (m) { s = m[1]; index = Number(m[2]); }
  void index;
  for (const part of s.split('&')) {
    if (!part) continue;
    const isContains = part.includes('~=');
    const [k, ...rest] = part.split(isContains ? '~=' : '=');
    const arg = rest.join(isContains ? '~=' : '=');
    const hay = { label: node.label, title: node.label, value: node.value, role: node.role, subrole: node.subrole };
    let ok;
    switch (k) {
      case 'label': case 'title': case 'value':
        ok = isContains ? (hay[k] ?? '').includes(arg) : hay[k] === arg; break;
      case 'text':
        ok = isContains
          ? [node.label, node.value].some((t) => (t ?? '').includes(arg))
          : [node.label, node.value].includes(arg); break;
      case 'role': ok = node.role === arg; break;
      case 'subrole': ok = node.subrole === arg; break;
      case 'has': ok = arg === 'label' ? !!node.label : !!node.value; break;
      case 'enabled': ok = node.enabled === (arg === 'true'); break;
      case 'visible': ok = node.visible === (arg === 'true'); break;
      default: ok = true;
    }
    if (!ok) return false;
  }
  return true;
}

/* ======================================== */
/* メイン */
/* ======================================== */

if (!existsSync(args.spec)) {
  console.error(`テスト仕様書がありません: ${args.spec}`);
  process.exit(2);
}

const { records } = readCsvObjects(readFileSync(args.spec, 'utf8'));

/* TestIDごとにステップをまとめる。CSVの並び順は保持し、StepNoで昇順に整える */
const tests = new Map();
for (const r of records) {
  if (!r.TestID) continue;
  if (args.tests && !args.tests.includes(r.TestID)) continue;
  if (args.filter) {
    const [k, v] = args.filter.split('=');
    if ((r[k] ?? '') !== v) continue;
  }
  if (!tests.has(r.TestID)) tests.set(r.TestID, []);
  tests.get(r.TestID).push(r);
}
for (const steps of tests.values()) {
  steps.sort((a, b) => Number(a.StepNo) - Number(b.StepNo));
}

log(`実行対象: ${tests.size} テスト / ${records.length} ステップ行`);
log(`テスト仕様書: ${args.spec}`);
log(`出力先: ${runDir}`);

const device = sim('device').out.split('\t');
const deviceName = device[1] ?? 'unknown';
const osVersion = device[2] ?? 'unknown';
log(`実行環境: ${deviceName} / ${osVersion}`);

const stepResults = [];
const testResults = [];

const STEP_HDR = ['TestID', 'PatternID', 'StepNo', 'Action', 'Result', 'Expected', 'Actual', 'Evidence', 'ExecutedAt'];
const TEST_HDR = ['TestID', 'PatternID', 'Result', 'FailedStepNo', 'FailureClass', 'BugID', 'StartedAt', 'EndedAt', 'Device', 'OSVersion', 'Notes'];

/*
 * 1テスト終わるごとに書き出す。
 * 数百件の実行は数時間かかるので、途中で落ちたときに全部失うのは許容できない。
 */
function flush() {
  writeFileSync(join(runDir, 'results.csv'), writeCsvObjects(STEP_HDR, stepResults));
  writeFileSync(join(runDir, 'results-tests.csv'), writeCsvObjects(TEST_HDR, testResults));
}

/* --resume 用に、既に結果のあるTestIDを読み込む */
const alreadyDone = new Set();
if (args.resume && existsSync(join(runDir, 'results-tests.csv'))) {
  for (const r of readCsvObjects(readFileSync(join(runDir, 'results-tests.csv'), 'utf8')).records) {
    if (r.TestID) alreadyDone.add(r.TestID);
  }
  if (alreadyDone.size) log(`--resume: 済み ${alreadyDone.size} 件を飛ばします`);
}

for (const [testId, steps] of tests) {
  const head = steps[0];
  const startedAt = new Date().toISOString();
  log(`--- ${testId} (${head.FeatureID ?? ''}/${head.ScreenID ?? ''}) ${head.TestPurpose ?? ''}`);

  let verdict = 'PASS';
  let failedStep = '';
  let failureClass = '';
  let note = '';

  if (args.dryRun) {
    try {
      parseDirectives(head.Precondition, `${testId} Precondition`);
      parseDirectives(head.Cleanup || steps[steps.length - 1].Cleanup, `${testId} Cleanup`);
      for (const s of steps) {
        if (!ACTIONS[s.Action]) throw new Error(`未定義のAction: ${s.Action}（Step ${s.StepNo}）`);
      }
      /* 操作していないので PASS ではない。実行済みと取り違えないよう別の値にする */
      verdict = 'DRYRUN';
      note = '解釈のみ検証（アプリは操作していない）';
    } catch (e) {
      verdict = 'BLOCKED';
      failureClass = 'TEST_SPEC_ERROR';
      note = e.message;
    }
    testResults.push({ TestID: testId, PatternID: head.PatternID, Result: verdict, FailedStepNo: failedStep, FailureClass: failureClass, BugID: '', StartedAt: startedAt, EndedAt: new Date().toISOString(), Device: deviceName, OSVersion: osVersion, Notes: note });
    continue;
  }

  if (alreadyDone.has(testId)) continue;

  /* --- 前提条件 --- */
  try {
    const pre = parseDirectives(head.Precondition, `${testId} Precondition`);
    applyDirectives(pre);
  } catch (e) {
    verdict = 'BLOCKED';
    failureClass = e instanceof Blocked ? 'PRECONDITION_ERROR' : 'TEST_SPEC_ERROR';
    note = e.message;
    log(`  BLOCKED: ${note}`);
    for (const s of steps) {
      stepResults.push({ TestID: testId, PatternID: head.PatternID, StepNo: s.StepNo, Action: s.Action, Result: 'BLOCKED', Expected: s.ExpectedResult, Actual: note, Evidence: '', ExecutedAt: new Date().toISOString() });
    }
    testResults.push({ TestID: testId, PatternID: head.PatternID, Result: verdict, FailedStepNo: '', FailureClass: failureClass, BugID: '', StartedAt: startedAt, EndedAt: new Date().toISOString(), Device: deviceName, OSVersion: osVersion, Notes: note });
    flush();
    continue;
  }

  /* --- ステップ --- */
  let aborted = false;
  for (const s of steps) {
    if (aborted) {
      stepResults.push({ TestID: testId, PatternID: head.PatternID, StepNo: s.StepNo, Action: s.Action, Result: 'SKIPPED', Expected: s.ExpectedResult, Actual: '前のステップが失敗したため未実行', Evidence: '', ExecutedAt: new Date().toISOString() });
      continue;
    }

    let res;
    try {
      res = runStep(s, { testId });
    } catch (e) {
      res = { ok: false, actual: e.message };
      if (e instanceof Blocked) {
        verdict = 'BLOCKED';
        failureClass = 'ENVIRONMENT_ERROR';
      }
    }

    let evidence = res.evidence ?? '';

    /* 期待どおりでなければ、必ず証跡を残す */
    if (!res.ok) {
      const shot = sim('shot', `${testId}-${s.StepNo}-FAIL`, evidenceDir);
      const dump = sim('dump');
      const dumpPath = join(evidenceDir, `${testId}-${s.StepNo}-FAIL.txt`);
      writeFileSync(dumpPath, `Expected: ${s.ExpectedResult}\nActual: ${res.actual}\n\n${dump.out}`);
      evidence = [shot.out, dumpPath].filter(Boolean).join(' | ');
    } else if (s.Evidence && s.Evidence !== 'none' && ACTIONS[s.Action].kind !== 'evidence') {
      const shot = sim('shot', `${testId}-${s.StepNo}-${s.Evidence}`, evidenceDir);
      evidence = shot.out;
    }

    stepResults.push({
      TestID: testId,
      PatternID: head.PatternID,
      StepNo: s.StepNo,
      Action: s.Action,
      Result: res.ok ? 'PASS' : (verdict === 'BLOCKED' ? 'BLOCKED' : 'FAIL'),
      Expected: s.ExpectedResult,
      Actual: res.actual,
      Evidence: evidence,
      ExecutedAt: new Date().toISOString(),
    });

    if (!res.ok) {
      aborted = true;
      failedStep = s.StepNo;
      if (verdict !== 'BLOCKED') {
        verdict = 'FAIL';
        /* 操作系の失敗は自動化側の問題である可能性が高い。検証系の失敗は要調査。 */
        failureClass = ACTIONS[s.Action].kind === 'assert' ? 'REQUIRES_TRIAGE' : 'AUTOMATION_ERROR';
      }
      note = `Step ${s.StepNo} ${s.Action}: 期待「${s.ExpectedResult}」／実際「${res.actual}」`;
      log(`  ${verdict} at step ${s.StepNo}: ${res.actual}`);
    }

    sleep(Number(cfg.STEP_INTERVAL_MS));
  }

  /* --- 後始末 --- */
  const cleanupText = steps.map((s) => s.Cleanup).filter((c) => c && c !== 'none').pop();
  if (cleanupText) {
    try {
      applyDirectives(parseDirectives(cleanupText, `${testId} Cleanup`), { allowLaunch: false });
    } catch (e) {
      log(`  Cleanup失敗: ${e.message}`);
    }
  }

  if (verdict === 'PASS') log(`  PASS`);
  testResults.push({
    TestID: testId, PatternID: head.PatternID, Result: verdict, FailedStepNo: failedStep,
    FailureClass: failureClass, BugID: '', StartedAt: startedAt, EndedAt: new Date().toISOString(),
    Device: deviceName, OSVersion: osVersion, Notes: note,
  });
  flush();
}

/* ======================================== */
/* 出力 */
/* ======================================== */

flush();

const counts = testResults.reduce((a, t) => ({ ...a, [t.Result]: (a[t.Result] ?? 0) + 1 }), {});
if (args.dryRun) {
  log(`完了(dry-run): 解釈OK=${counts.DRYRUN ?? 0} 解釈NG=${counts.BLOCKED ?? 0}（アプリは操作していない）`);
} else {
  log(`完了: PASS=${counts.PASS ?? 0} FAIL=${counts.FAIL ?? 0} BLOCKED=${counts.BLOCKED ?? 0}`);
}
log(`結果: ${join(runDir, 'results-tests.csv')}`);

/* FAILがあっても異常終了はしない。判定と不具合登録は後段の工程で行う。 */
