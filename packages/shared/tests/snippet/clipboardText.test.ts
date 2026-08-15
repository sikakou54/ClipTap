import { describe, expect, it } from 'vitest';
import type { Snippet } from '../../src/types/snippet';
import {
  joinSnippetTextForClipboard,
  prepareSnippetForClipboard,
  prepareSnippetTitleForClipboard,
} from '../../src/utils/snippetUtils';

/**
 * クリップボードへ渡すテキストの連結規則を固定する回帰テスト。
 *
 * 連結規則はモバイル・Webのプレビューコピーと一覧コピーの4経路が共有しており、
 * ここが変わると同じ定型文でも経路ごとに違う文字列がコピーされる。
 * 型チェックでは検出できないため、期待値を明示的に固定する。
 */

/** テスト用の定型文を組み立てる */
const snippetOf = (title: string | null, content: string, copyWithTitle: boolean): Snippet => ({
  id: 'snippet-1',
  title,
  content,
  categoryId: null,
  copyWithTitle,
  copyCount: 0,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
});

describe('joinSnippetTextForClipboard', () => {
  it('joins the title and the body with a newline when both are present', () => {
    expect(
      joinSnippetTextForClipboard({ title: 'タイトル', content: '本文', copyWithTitle: true })
    ).toBe('タイトル\n本文');
  });

  it('returns the title alone without a trailing newline when the body is empty', () => {
    expect(
      joinSnippetTextForClipboard({ title: 'タイトル', content: '', copyWithTitle: true })
    ).toBe('タイトル');
  });

  it('treats a whitespace-only body as empty', () => {
    expect(
      joinSnippetTextForClipboard({ title: 'タイトル', content: '   ', copyWithTitle: true })
    ).toBe('タイトル');
    expect(joinSnippetTextForClipboard({ content: '   ' })).toBe('');
  });

  it('treats a whitespace-only title as empty', () => {
    expect(
      joinSnippetTextForClipboard({ title: '   ', content: '本文', copyWithTitle: true })
    ).toBe('本文');
  });

  it('returns the body alone when the title is missing', () => {
    expect(joinSnippetTextForClipboard({ title: null, content: '本文', copyWithTitle: true })).toBe('本文');
    expect(joinSnippetTextForClipboard({ title: '', content: '本文', copyWithTitle: true })).toBe('本文');
  });

  it('ignores the title when copyWithTitle is off', () => {
    expect(joinSnippetTextForClipboard({ title: 'タイトル', content: '本文' })).toBe('本文');
    expect(
      joinSnippetTextForClipboard({ title: 'タイトル', content: '', copyWithTitle: false })
    ).toBe('');
  });

  it('returns an empty string when there is nothing to copy', () => {
    expect(joinSnippetTextForClipboard({ title: '', content: '', copyWithTitle: true })).toBe('');
    expect(joinSnippetTextForClipboard({})).toBe('');
  });

  it('keeps meaningful whitespace inside the joined values', () => {
    expect(
      joinSnippetTextForClipboard({ title: ' タイトル ', content: '  本文\n', copyWithTitle: true })
    ).toBe(' タイトル \n  本文\n');
  });
});

describe('prepareSnippetForClipboard', () => {
  it('uses the shared join rule for a title and a body', async () => {
    const text = await prepareSnippetForClipboard({
      snippet: snippetOf('タイトル', '本文', true),
      shouldReplaceVariables: false,
    });
    expect(text).toBe('タイトル\n本文');
  });

  it('does not append a newline when the body is empty', async () => {
    const text = await prepareSnippetForClipboard({
      snippet: snippetOf('タイトル', '', true),
      shouldReplaceVariables: false,
    });
    expect(text).toBe('タイトル');
  });

  it('returns the body alone when copyWithTitle is off', async () => {
    const text = await prepareSnippetForClipboard({
      snippet: snippetOf('タイトル', '本文', false),
      shouldReplaceVariables: false,
    });
    expect(text).toBe('本文');
  });

  it('returns the body alone when the snippet has no title', async () => {
    const text = await prepareSnippetForClipboard({
      snippet: snippetOf(null, '本文', true),
      shouldReplaceVariables: false,
    });
    expect(text).toBe('本文');
  });

  it('expands variables before joining', async () => {
    const text = await prepareSnippetForClipboard({
      snippet: snippetOf('{{env}}の手順', '接続先は{{env}}です', true),
      customResolver: (name: string) => (name === 'env' ? 'ステージング' : null),
    });
    expect(text).toBe('ステージングの手順\n接続先はステージングです');
  });

  it('returns an empty string when the expanded body becomes empty and the title is not copied', async () => {
    const text = await prepareSnippetForClipboard({
      snippet: snippetOf('タイトル', '{{env}}', false),
      customResolver: () => '',
    });
    expect(text).toBe('');
  });
});

describe('prepareSnippetTitleForClipboard', () => {
  it('returns the expanded title regardless of copyWithTitle', async () => {
    const text = await prepareSnippetTitleForClipboard({
      snippet: snippetOf('{{env}}の手順', '本文', false),
      customResolver: (name: string) => (name === 'env' ? 'ステージング' : null),
    });
    expect(text).toBe('ステージングの手順');
  });

  it('returns an empty string when the snippet has no title', async () => {
    const text = await prepareSnippetTitleForClipboard({
      snippet: snippetOf(null, '本文', true),
      shouldReplaceVariables: false,
    });
    expect(text).toBe('');
  });
});
