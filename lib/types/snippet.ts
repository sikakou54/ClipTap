// Snippet型定義
export interface Snippet {
  id: string;
  title: string | null;
  content: string;
  categoryId: string | null;
  profileIds: string[];  // 複数の環境を指定
  createdAt: string;
  updatedAt: string;
}

export interface CreateSnippetInput {
  title?: string;
  content: string;
  categoryId?: string | null;
  profileIds?: string[];  // 複数の環境を指定
}

export interface UpdateSnippetInput {
  id: string;
  title?: string;
  content?: string;
  categoryId?: string | null;
  profileIds?: string[];  // 複数の環境を指定
}

export interface SearchOptions {
  query: string;
  categoryId?: string;
  sortBy?: 'relevance' | 'recent' | 'usage' | 'title';
}

export type SnippetSortBy = 'recent' | 'title';
