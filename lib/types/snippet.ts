// Snippet型定義
export interface Snippet {
  id: string;
  title: string | null;
  content: string;
  categoryId: string | null;
  isPinned: boolean;
  usageCount: number;
  lastUsedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSnippetInput {
  title?: string;
  content: string;
  categoryId?: string;
  tags?: string[];
}

export interface UpdateSnippetInput {
  id: string;
  title?: string;
  content?: string;
  categoryId?: string;
  isPinned?: boolean;
}

export interface SearchOptions {
  query: string;
  categoryId?: string;
  sortBy?: 'relevance' | 'recent' | 'usage' | 'title';
}

export type SnippetSortBy = 'recent' | 'usage' | 'title' | 'pinned';
