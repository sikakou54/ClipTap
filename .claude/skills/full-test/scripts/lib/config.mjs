/**
 * config.env の読み込みとパス解決
 */
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
export const SCRIPTS_DIR = resolve(here, '..');
export const SKILL_DIR = resolve(SCRIPTS_DIR, '..');
export const REPO_ROOT = resolve(SKILL_DIR, '..', '..', '..');

const DEFAULTS = {
  TEST_DOC_DIR: 'docs/test',
  ISSUES_FILE: 'docs/test/issues.md',
  RESULTS_DIR: 'docs/test/results',
  TARGET_PLATFORM: 'ios',
  BUNDLE_ID: '',
  APP_GROUP: 'group.com.sikakou.cliptap',
  DB_FILE_NAME: 'cliptap.db',
  STEP_INTERVAL_MS: '600',
  DEFAULT_WAIT_MS: '6000',
  LAUNCH_WAIT_MS: '9000',
  ALLOW_NETWORK_TOGGLE: '0',
  WIFI_DEVICE: 'en0',
};

/** config.env を読む。`KEY="value"` 形式だけを扱う */
export function loadConfig() {
  const cfg = { ...DEFAULTS };
  const f = join(SKILL_DIR, 'config.env');
  if (existsSync(f)) {
    for (const line of readFileSync(f, 'utf8').split('\n')) {
      const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);
      if (!m) continue;
      let v = m[2].replace(/\s*#.*$/, '').trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1);
      }
      cfg[m[1]] = v;
    }
  }
  cfg.testDocDir = join(REPO_ROOT, cfg.TEST_DOC_DIR);
  cfg.issuesFile = join(REPO_ROOT, cfg.ISSUES_FILE);
  cfg.resultsDir = join(REPO_ROOT, cfg.RESULTS_DIR);
  cfg.simSh = join(SCRIPTS_DIR, 'sim.sh');
  cfg.stateSh = join(SCRIPTS_DIR, 'state.sh');
  return cfg;
}
