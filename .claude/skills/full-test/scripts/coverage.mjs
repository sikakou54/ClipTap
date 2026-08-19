#!/usr/bin/env node
/**
 * 網羅性の算出
 *
 *   node coverage.mjs                 テスト仕様書の設計網羅率
 *   node coverage.mjs --run <runId>   実行結果を加えた実測網羅率
 *
 * 「設計網羅」= テストケースが割り当たっているか。
 * 「実測網羅」= そのテストが実際に実行され、PASSしたか。
 * この2つを混同すると「仕様書は完璧だが1件も動かしていない」状態を
 * 網羅100%と誤って報告してしまう。
 */
import { readFileSync, existsSync } from 'node:fs';
import { join, isAbsolute } from 'node:path';
import { readCsvObjects } from './lib/csv.mjs';
import { loadConfig, REPO_ROOT } from './lib/config.mjs';

const cfg = loadConfig();

function loadCsv(dir, name) {
  const f = join(dir, name);
  return existsSync(f) ? readCsvObjects(readFileSync(f, 'utf8')).records : [];
}

const split = (v) => (v || '').split(/[;\s]+/).filter(Boolean);
/* 母数0を100%と扱うと「1件も台帳が無い」状態を網羅済みと誤報告する。null にして未計測と分ける */
const pct = (n, d) => (d === 0 ? null : Math.round((n / d) * 1000) / 10);
export const show = (r) => (r === null ? '―' : `${r}%`);

/**
 * 網羅率を計算する。
 * @param {string} dir テスト文書ディレクトリ
 * @param {string|null} runId 実行ID。指定すると実測網羅も計算する
 */
export function computeCoverage(dir, runId = null) {
  const allFeatures = loadCsv(dir, 'features.csv');
  /* 自動実行の対象は in-scope だけ。手動限定・対象外を母数に入れると
     「自動テストで到達できないもの」を未テストとして数えてしまう */
  const features = allFeatures.filter((f) => f.Scope === 'in-scope');
  const manualFeatures = allFeatures.filter((f) => f.Scope !== 'in-scope');
  const screens = loadCsv(dir, 'screens.csv');
  const routes = loadCsv(dir, 'routes.csv');
  const matrix = loadCsv(dir, 'pattern-matrix.csv');
  const spec = loadCsv(dir, 'testspec.csv');

  /* テスト仕様書に登場したID */
  const testHeads = new Map();
  for (const r of spec) if (r.TestID && !testHeads.has(r.TestID)) testHeads.set(r.TestID, r);

  const designedFeatures = new Set([...testHeads.values()].map((r) => r.FeatureID).filter(Boolean));
  const designedScreens = new Set([...testHeads.values()].map((r) => r.ScreenID).filter(Boolean));
  const designedPatterns = new Set([...testHeads.values()].flatMap((r) => split(r.PatternID)));

  const reachable = matrix.filter((r) => r.Reachability === 'REACHABLE');
  const unreachable = matrix.filter((r) => r.Reachability === 'UNREACHABLE');

  /*
   * 到達不能なパターンしか持たない画面・ルート・条件は、母数から外して別に数える。
   * 母数へ入れたままだと「根拠付きで到達不能と記録したもの」が
   * 「洗い出していないもの」と同じ扱いになり、網羅率が実態を表さなくなる。
   * 除外したものは必ず一覧で出す（黙って落とさない）。
   */
  const byPattern = new Map(matrix.map((m) => [m.PatternID, m]));
  const allUnreachable = (ids) => {
    const pats = split(ids).map((p) => byPattern.get(p)).filter(Boolean);
    return pats.length > 0 && pats.every((p) => p.Reachability === 'UNREACHABLE');
  };

  const reachableScreenIds = new Set(reachable.map((r) => r.ScreenID).filter(Boolean));
  const excludedScreens = screens.filter((s) => !reachableScreenIds.has(s.ScreenID));
  const targetScreens = screens.filter((s) => reachableScreenIds.has(s.ScreenID));

  const excludedRoutes = routes.filter((r) => allUnreachable(r.PatternID));
  const targetRoutes = routes.filter((r) => !allUnreachable(r.PatternID));

  const reachableConditions = new Set(reachable.map((r) => r.ConditionID).filter(Boolean));
  const allConditions = new Set(matrix.map((r) => r.ConditionID).filter(Boolean));
  const excludedConditions = [...allConditions].filter((c) => !reachableConditions.has(c));
  const conditions = reachableConditions;

  const coveredConditions = new Set(
    matrix.filter((r) => r.Reachability === 'REACHABLE' && designedPatterns.has(r.PatternID))
      .map((r) => r.ConditionID).filter(Boolean),
  );
  const routesWithTest = targetRoutes.filter((r) => split(r.TestID).some((t) => testHeads.has(t)));

  /* 実測 */
  let executed = null;
  if (runId) {
    const rd = join(cfg.resultsDir, runId);
    const rows = loadCsv(rd, 'results-tests.csv');
    const byId = new Map(rows.map((r) => [r.TestID, r]));
    const passed = new Set(rows.filter((r) => r.Result === 'PASS').map((r) => r.TestID));
    const attempted = new Set(rows.filter((r) => r.Result !== 'BLOCKED').map((r) => r.TestID));

    const passPatterns = new Set(
      [...passed].flatMap((t) => split(testHeads.get(t)?.PatternID)),
    );
    executed = {
      rows,
      byId,
      total: rows.length,
      pass: rows.filter((r) => r.Result === 'PASS').length,
      fail: rows.filter((r) => r.Result === 'FAIL').length,
      blocked: rows.filter((r) => r.Result === 'BLOCKED').length,
      executionRate: pct(attempted.size, testHeads.size),
      successRate: pct(rows.filter((r) => r.Result === 'PASS').length, rows.length),
      testedScreens: new Set([...passed].map((t) => testHeads.get(t)?.ScreenID).filter(Boolean)),
      testedFeatures: new Set([...passed].map((t) => testHeads.get(t)?.FeatureID).filter(Boolean)),
      testedPatterns: passPatterns,
      testedRoutes: routes.filter((r) => split(r.TestID).some((t) => passed.has(t))),
    };
  }

  /*
   * 機能ごとの到達可能率。
   * 全体の網羅率だけを見ると「到達可能なものは全部テストした」しか分からず、
   * ある機能の大半が到達不能でも100%と出る。機能単位で穴の大きさを見せる。
   */
  const perFeature = allFeatures.map((f) => {
    const pats = matrix.filter((r) => r.FeatureID === f.FeatureID);
    const re = pats.filter((r) => r.Reachability === 'REACHABLE').length;
    const tests = new Set([...testHeads.values()].filter((r) => r.FeatureID === f.FeatureID).map((r) => r.TestID));
    return {
      FeatureID: f.FeatureID, Name: f.Name, Scope: f.Scope,
      total: pats.length, reachable: re, unreachable: pats.length - re,
      tests: tests.size, rate: pct(re, pats.length),
    };
  });

  return {
    features, allFeatures, manualFeatures, screens, routes, matrix, spec, perFeature,
    excludedScreens, excludedRoutes, excludedConditions,
    testCount: testHeads.size,
    design: {
      screen: { covered: [...designedScreens].filter((x) => reachableScreenIds.has(x)).length, total: targetScreens.length, rate: pct([...designedScreens].filter((x) => reachableScreenIds.has(x)).length, targetScreens.length) },
      feature: { covered: designedFeatures.size, total: features.length, rate: pct(designedFeatures.size, features.length) },
      pattern: { covered: [...designedPatterns].filter((p) => reachable.some((r) => r.PatternID === p)).length, total: reachable.length, rate: pct([...designedPatterns].filter((p) => reachable.some((r) => r.PatternID === p)).length, reachable.length) },
      route: { covered: routesWithTest.length, total: targetRoutes.length, rate: pct(routesWithTest.length, targetRoutes.length) },
      condition: { covered: coveredConditions.size, total: conditions.size, rate: pct(coveredConditions.size, conditions.size) },
    },
    unreachable,
    missing: {
      screens: targetScreens.filter((s) => !designedScreens.has(s.ScreenID)).map((s) => s.ScreenID),
      features: features.filter((f) => !designedFeatures.has(f.FeatureID)).map((f) => f.FeatureID),
      patterns: reachable.filter((r) => !designedPatterns.has(r.PatternID)).map((r) => r.PatternID),
      routes: targetRoutes.filter((r) => !split(r.TestID).some((t) => testHeads.get(t))).map((r) => `${r.Route}（${r.EntryPoint}）`),
    },
    executed,
  };
}

/* ======================================== */
/* CLI */
/* ======================================== */

if (import.meta.url === `file://${process.argv[1]}`) {
  let dir = cfg.testDocDir;
  let runId = null;
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--dir') dir = argv[++i];
    else if (argv[i] === '--run') runId = argv[++i];
  }
  if (!isAbsolute(dir)) dir = join(REPO_ROOT, dir);

  const c = computeCoverage(dir, runId);
  const line = (label, x) => console.log(`  ${label.padEnd(14)} ${show(x.rate).padStart(6)}  (${x.covered}/${x.total})`);

  console.log(`テスト仕様書: ${dir}`);
  console.log(`テストケース数: ${c.testCount}`);
  console.log('\n設計網羅率（テストケースが割り当たっているか）');
  line('画面網羅率', c.design.screen);
  line('機能網羅率', c.design.feature);
  line('パターン網羅率', c.design.pattern);
  line('Route網羅率', c.design.route);
  line('条件分岐網羅率', c.design.condition);

  console.log('\n機能ごとの到達可能率（自動テストでどこまで見えているか）');
  console.log('  ID     到達可能/総数   率     テスト  機能');
  for (const f of c.perFeature.sort((a, b) => (a.rate ?? 101) - (b.rate ?? 101))) {
    const mark = f.rate !== null && f.rate < 50 ? ' ←自動側の穴が大きい' : '';
    console.log(`  ${f.FeatureID}  ${String(f.reachable).padStart(4)}/${String(f.total).padEnd(4)}  `
      + `${show(f.rate).padStart(6)}  ${String(f.tests).padStart(5)}  ${f.Name}${mark}`);
  }

  if (c.manualFeatures.length) {
    console.log(`\n自動実行の対象外（母数から除外）${c.manualFeatures.length} 件`);
    for (const f of c.manualFeatures) console.log(`  ${f.FeatureID} ${f.Name}: ${f.Scope}`);
  }

  if (c.excludedScreens.length) {
    console.log(`\n到達可能なパターンを持たない画面（母数から除外）${c.excludedScreens.length} 件`);
    for (const s of c.excludedScreens) console.log(`  ${s.ScreenID} ${s.Name}`);
  }
  if (c.excludedRoutes.length) {
    console.log(`\n到達不能なパターンだけのルート（母数から除外）${c.excludedRoutes.length} 件`);
    for (const r of c.excludedRoutes) console.log(`  ${r.RouteID} ${r.Route}（${r.EntryPoint}）`);
  }
  console.log(`\nUNREACHABLE ${c.unreachable.length} 件（除外ではなく根拠付きで pattern-matrix.csv に記録）`);

  const showMissing = (label, arr) => {
    if (arr.length) {
      console.log(`\n未テスト${label}（${arr.length}件）`);
      for (const x of arr) console.log(`  ${x}`);
    }
  };
  showMissing('画面', c.missing.screens);
  showMissing('機能', c.missing.features);
  showMissing('Pattern', c.missing.patterns);
  showMissing('Route', c.missing.routes);

  if (c.executed) {
    console.log(`\n実行結果（run: ${runId}）`);
    console.log(`  総テスト数 ${c.executed.total} / PASS ${c.executed.pass} / FAIL ${c.executed.fail} / BLOCKED ${c.executed.blocked}`);
    console.log(`  実行率 ${c.executed.executionRate}% / 成功率 ${c.executed.successRate}%`);
    console.log(`  実測 画面 ${c.executed.testedScreens.size}/${c.screens.length}`
      + ` / 機能 ${c.executed.testedFeatures.size}/${c.features.length}`
      + ` / Pattern ${c.executed.testedPatterns.size}/${c.design.pattern.total}`
      + ` / Route ${c.executed.testedRoutes.length}/${c.routes.length}`);
  }

  const allGreen = ['screen', 'feature', 'pattern', 'route'].every((k) => c.design[k].rate === 100);
  if (['screen', 'feature', 'pattern', 'route'].some((k) => c.design[k].total === 0)) {
    console.log('\n台帳が空の項目があります。母数が0のものは「網羅済み」ではなく未作成です。');
  }
  console.log(`\n完了条件（画面・機能・パターン・Routeが100%）: ${allGreen ? '達成' : '未達'}`);
  process.exit(allGreen ? 0 : 1);
}
