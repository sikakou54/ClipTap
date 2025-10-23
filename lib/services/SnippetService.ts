import { snippetMapper } from '../mappers/NewSnippetMapper';
import { clipboardService } from './ClipboardService';
import { Snippet, CreateSnippetInput, UpdateSnippetInput, SnippetSortBy } from '../types/snippet';

export class SnippetService {
  async getAll(): Promise<Snippet[]> {
    return await snippetMapper.getAll();
  }

  async getById(id: string): Promise<Snippet | null> {
    return await snippetMapper.getById(id);
  }

  async getByCategoryId(categoryId: string | null): Promise<Snippet[]> {
    return await snippetMapper.getByCategoryId(categoryId);
  }

  async create(input: CreateSnippetInput): Promise<Snippet> {
    // タイトルが空の場合は本文から生成
    if (!input.title && input.content) {
      input.title = this.generateTitleFromContent(input.content);
    }

    return await snippetMapper.create(input);
  }

  async update(input: UpdateSnippetInput): Promise<Snippet> {
    return await snippetMapper.update(input);
  }

  async delete(id: string): Promise<void> {
    await snippetMapper.delete(id);
  }

  async togglePin(id: string): Promise<Snippet> {
    const snippet = await snippetMapper.getById(id);
    if (!snippet) throw new Error('Snippet not found');

    return await snippetMapper.update({
      id,
      isPinned: !snippet.isPinned,
    });
  }

  async copyToClipboard(id: string): Promise<void> {
    const snippet = await snippetMapper.getById(id);
    if (!snippet) throw new Error('Snippet not found');

    // タイトルと内容を結合してコピー
    const textToCopy = snippet.title
      ? `${snippet.title}\n${snippet.content}`
      : snippet.content;

    // クリップボードにコピー（振動フィードバック含む）
    await clipboardService.copyToClipboard(textToCopy);

    // 使用回数をインクリメント
    await snippetMapper.incrementUsageCount(id);
  }

  async search(query: string, categoryId?: string): Promise<Snippet[]> {
    if (!query.trim()) return [];
    return await snippetMapper.search(query, categoryId);
  }

  async getSorted(sortBy: SnippetSortBy): Promise<Snippet[]> {
    return await snippetMapper.getSorted(sortBy);
  }

  private generateTitleFromContent(content: string): string {
    // 最初の30文字をタイトルとして使用
    const maxLength = 30;
    const trimmed = content.trim();

    if (trimmed.length <= maxLength) {
      return trimmed;
    }

    // 改行がある場合は最初の行を使用
    const firstLine = trimmed.split('\n')[0];
    if (firstLine.length <= maxLength) {
      return firstLine;
    }

    return firstLine.substring(0, maxLength) + '...';
  }
}

export const snippetService = new SnippetService();
