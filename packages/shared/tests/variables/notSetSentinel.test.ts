import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';

/**
 * 翻訳済みの表示文字列を値の比較に使わないことを固定する。
 *
 * 変数一覧は「未設定」の判定を t('common.not_set') との文字列一致で行っていたため、
 * 値として「未設定」を登録した変数が未設定として描画され、また文言を変えるだけで
 * 判定が静かに壊れていた。未設定はnullなど値そのもので表し、翻訳は表示だけに使う。
 */

/** 配下の .ts / .tsx を再帰的に集める */
function sourceFiles(directory: string): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(target);
    return /\.(?:ts|tsx)$/.test(entry.name) ? [target] : [];
  });
}

/** t(...) の呼び出しかどうか */
function isTranslationCall(node: ts.Node): boolean {
  return ts.isCallExpression(node)
    && ts.isIdentifier(node.expression)
    && node.expression.text === 't';
}

describe('translated text is never used as a value sentinel', () => {
  it('has no equality comparison against a t() call', () => {
    const repositoryRoot = path.resolve(process.cwd(), '../..');
    const roots = [
      'packages/shared/src',
      'apps/mobile/src',
      'apps/mobile/app',
      'apps/web/src',
    ].map((root) => path.join(repositoryRoot, root));
    const violations: string[] = [];

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
        if (ts.isBinaryExpression(node)) {
          const operator = node.operatorToken.kind;
          const isEquality = operator === ts.SyntaxKind.EqualsEqualsEqualsToken
            || operator === ts.SyntaxKind.ExclamationEqualsEqualsToken
            || operator === ts.SyntaxKind.EqualsEqualsToken
            || operator === ts.SyntaxKind.ExclamationEqualsToken;
          if (isEquality && (isTranslationCall(node.left) || isTranslationCall(node.right))) {
            const { line } = source.getLineAndCharacterOfPosition(node.getStart(source));
            violations.push(`${path.relative(repositoryRoot, filename)}:${line + 1}`);
          }
        }
        ts.forEachChild(node, visit);
      };
      visit(source);
    }

    expect(violations).toEqual([]);
  });
});
