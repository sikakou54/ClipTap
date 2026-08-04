import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
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

function sourceFiles(directory: string): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(target);
    return /\.(?:ts|tsx)$/.test(entry.name) ? [target] : [];
  });
}

describe('i18n usage', () => {
  it('uses existing literal keys and does not hide hardcoded strings in default values', () => {
    const repositoryRoot = path.resolve(process.cwd(), '../..');
    const roots = [
      'packages/shared/src',
      'apps/mobile/src',
      'apps/mobile/app',
      'apps/web/src',
    ].map((root) => path.join(repositoryRoot, root));
    const keys = flatten(en);
    const jaKeys = flatten(ja);
    const missing: string[] = [];
    const hardcodedDefaults: string[] = [];

    for (const filename of roots.flatMap(sourceFiles)) {
      const text = fs.readFileSync(filename, 'utf8');
      const source = ts.createSourceFile(
        filename,
        text,
        ts.ScriptTarget.Latest,
        true,
        filename.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
      );

      const visit = (node: ts.Node): void => {
        if (ts.isCallExpression(node)
          && ts.isIdentifier(node.expression)
          && node.expression.text === 't') {
          const first = node.arguments[0];
          const second = node.arguments[1];
          if (first && ts.isStringLiteralLike(first)) {
            if (!keys.has(first.text) || !jaKeys.has(first.text)) {
              missing.push(`${path.relative(repositoryRoot, filename)}:${first.getStart(source)} ${first.text}`);
            }
          }
          if (second && ts.isStringLiteralLike(second)) {
            hardcodedDefaults.push(`${path.relative(repositoryRoot, filename)}:${second.getStart(source)}`);
          }
        }
        ts.forEachChild(node, visit);
      };
      visit(source);
    }

    expect(missing).toEqual([]);
    expect(hardcodedDefaults).toEqual([]);
  });
});
