import { snippetMapper } from '../mappers/SnippetMapper';
import { clipboardService } from './ClipboardService';
import { Snippet, CreateSnippetInput, UpdateSnippetInput, SnippetSortBy } from '../types/snippet';
import { VariableParser, CustomVariableResolver } from './VariableParser';
import { variableService } from './VariableService';
import { purchaseService } from './PurchaseService';
import { profileService } from './ProfileService';
import { UI_CONSTANTS } from '../constants/ui';
import { Logger } from '../logger';

export class SnippetService {
  async getAll(): Promise<Snippet[]> {
    const activeProfile = profileService.getActiveProfile();
    return await snippetMapper.getAll(activeProfile?.id);
  }

  // 環境フィルタなしで全ての定型文を取得（検索画面用）
  async getAllWithoutProfileFilter(): Promise<Snippet[]> {
    return await snippetMapper.getAll(undefined);
  }

  async getById(id: string): Promise<Snippet | null> {
    return await snippetMapper.getById(id);
  }

  async getByCategoryId(categoryId: string | null): Promise<Snippet[]> {
    const activeProfile = profileService.getActiveProfile();
    return await snippetMapper.getByCategoryId(categoryId, activeProfile?.id);
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

  async copyToClipboard(id: string, profileId?: string): Promise<void> {
    const snippet = await snippetMapper.getById(id);
    if (!snippet) throw new Error('Snippet not found');

    let content = snippet.content;
    let title = snippet.title;

    try {
      const customResolver = variableService.createCustomVariableResolver(profileId);

      // コンテンツに変数が含まれている場合は置換処理
      if (VariableParser.hasVariables(content)) {
        content = await VariableParser.replaceVariables(content, customResolver);
      }

      // タイトルにも変数が含まれている場合は置換処理
      if (title && VariableParser.hasVariables(title)) {
        title = await VariableParser.replaceVariables(title, customResolver);
      }
    } catch (error) {
      Logger.warn('Variable replacement failed, copying original content:', error);
      // 変数置換に失敗した場合は元のコンテンツを使用
      content = snippet.content;
      title = snippet.title;
    }

    // タイトルと内容を結合してコピー（改行2つで区切る）
    const textToCopy = title
      ? `${title}\n\n${content}`
      : content;

    // クリップボードにコピー（振動フィードバック含む）
    await clipboardService.copyToClipboard(textToCopy);
  }

  async search(query: string, categoryId?: string): Promise<Snippet[]> {
    if (!query.trim()) return [];
    return await snippetMapper.search(query, categoryId);
  }

  async getSorted(sortBy: SnippetSortBy): Promise<Snippet[]> {
    return await snippetMapper.getSorted(sortBy);
  }

  /**
   * プレビュー生成（変数置換後）
   */
  async getPreview(id: string): Promise<string> {
    const snippet = await snippetMapper.getById(id);
    if (!snippet) throw new Error('Snippet not found');

    if (VariableParser.hasVariables(snippet.content)) {
      const customResolver = variableService.createCustomVariableResolver();
      return await VariableParser.replaceVariables(snippet.content, customResolver);
    }

    return snippet.content;
  }

  /**
   * テキストのプレビュー生成（変数置換後）
   */
  async getTextPreview(text: string): Promise<string> {
    if (VariableParser.hasVariables(text)) {
      const customResolver = variableService.createCustomVariableResolver();
      return await VariableParser.replaceVariables(text, customResolver);
    }
    return text;
  }

  private generateTitleFromContent(content: string): string {
    // 最初の指定文字数をタイトルとして使用
    const maxLength = UI_CONSTANTS.INPUT_LIMITS.SNIPPET_TITLE_MAX;
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
