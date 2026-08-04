import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import en from '../src/i18n/en.json';
import ja from '../src/i18n/ja.json';

function flatten(value: unknown, prefix = '', keys = new Set<string>()): Set<string> {
  if (!value || typeof value !== 'object') return keys;
  for (const [name, child] of Object.entries(value)) {
    const key = prefix ? `${prefix}.${name}` : name;
    if (child && typeof child === 'object') flatten(child, key, keys);
    else keys.add(key);
  }
  return keys;
}

describe('ClipTapError translation codes', () => {
  it('defines every error code in Japanese and English', () => {
    const errorDirectory = path.resolve(process.cwd(), 'src/errors');
    const codes = new Set<string>([
      'error.duplicate_category_name',
      'error.duplicate_profile_name',
      'error.duplicate_variable_name',
    ]);

    for (const filename of fs.readdirSync(errorDirectory)) {
      if (!filename.endsWith('.ts')) continue;
      const source = fs.readFileSync(path.join(errorDirectory, filename), 'utf8');
      for (const match of source.matchAll(/['"]((?:error|backup|export_import)\.[a-z0-9_.]+)['"]/g)) {
        if (match[1]) codes.add(match[1]);
      }
    }

    const enKeys = flatten(en);
    const jaKeys = flatten(ja);
    expect([...codes].filter((code) => !enKeys.has(code))).toEqual([]);
    expect([...codes].filter((code) => !jaKeys.has(code))).toEqual([]);
  });
});
