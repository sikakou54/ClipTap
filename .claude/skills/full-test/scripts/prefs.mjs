#!/usr/bin/env node
/**
 * AsyncStorage（RCTAsyncLocalStorage_V1）の読み書き
 *
 * プラン上書き（`@dev_subscription_override`）や並べ替え設定（`@snippet_sort_preference`）を、
 * 画面を操作せずに前提条件として組み立てるために使う。
 *
 *   prefs.mjs <manifestDir> list
 *   prefs.mjs <manifestDir> get <key>
 *   prefs.mjs <manifestDir> set <key> <value>
 *   prefs.mjs <manifestDir> del <key>
 *   prefs.mjs <manifestDir> clear
 *
 * 注意: アプリはAsyncStorageをメモリにも保持するため、
 * 書き換える前に必ずアプリを終了しておくこと。
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const [dir, cmd, key, value] = process.argv.slice(2);

if (!dir || !cmd) {
  console.error('usage: prefs.mjs <manifestDir> <list|get|set|del|clear> [key] [value]');
  process.exit(2);
}

const manifestPath = join(dir, 'manifest.json');

/** manifest.jsonを読む。存在しない・壊れている場合は空として扱う */
function load() {
  if (!existsSync(manifestPath)) return {};
  const raw = readFileSync(manifestPath, 'utf8').trim();
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function save(obj) {
  mkdirSync(dir, { recursive: true });
  writeFileSync(manifestPath, JSON.stringify(obj));
}

const data = load();

switch (cmd) {
  case 'list':
    for (const [k, v] of Object.entries(data)) console.log(`${k}\t${v}`);
    break;

  case 'get': {
    if (!key) { console.error('key is required'); process.exit(2); }
    if (!(key in data)) process.exit(3);
    /* 大きな値はmanifestではなく別ファイルに保存される */
    if (data[key] === null) {
      const f = join(dir, key);
      console.log(existsSync(f) ? readFileSync(f, 'utf8') : '');
    } else {
      console.log(data[key]);
    }
    break;
  }

  case 'set':
    if (!key) { console.error('key is required'); process.exit(2); }
    data[key] = value ?? '';
    save(data);
    break;

  case 'del': {
    if (!key) { console.error('key is required'); process.exit(2); }
    delete data[key];
    const f = join(dir, key);
    if (existsSync(f)) rmSync(f);
    save(data);
    break;
  }

  case 'clear':
    if (existsSync(dir)) rmSync(dir, { recursive: true, force: true });
    break;

  default:
    console.error(`unknown command: ${cmd}`);
    process.exit(2);
}
