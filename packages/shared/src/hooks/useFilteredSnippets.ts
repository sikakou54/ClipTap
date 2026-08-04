/**
 * フィルタリング済みスニペットフック
 *
 * @description
 * スニペットのフィルタリング（検索、カテゴリ、プロファイル）と
 * 変数展開を統合したカスタムフック。
 * Mobile/Web両方で使用可能。
 */

import { useMemo } from 'react';
import type { Snippet, SnippetProfile, Variable, ProfileVariable } from '../types';
import { useVariableExpansion } from './useVariableExpansion';

export interface SnippetWithDisplay extends Snippet {
  displayTitle: string | null;
  displayContent: string;
}

export interface UseFilteredSnippetsParams {
  /** スニペット一覧 */
  snippets: Snippet[];
  /** スニペットとプロファイルの紐付け */
  snippetProfiles: SnippetProfile[];
  /** 検索クエリ */
  searchQuery?: string;
  /** 選択中のカテゴリID（null: すべて, 'uncategorized': 未分類） */
  selectedCategory?: string | null;
  /** アクティブなプロファイルID */
  activeProfileId?: string | null;
  /** デフォルトプロファイルID */
  defaultProfileId?: string | null;
  /** 変数展開を行うかどうか（デフォルト: true） */
  enableVariableExpansion?: boolean;
  /** 変数一覧（変数展開用） */
  variables?: Variable[];
  /** プロファイル変数一覧（変数展開用） */
  profileVariables?: ProfileVariable[];
  /** ロケール（変数展開用） */
  locale?: string;
}

export interface UseFilteredSnippetsReturn {
  /** フィルタリング・変数展開済みのスニペット一覧 */
  filteredSnippets: SnippetWithDisplay[];
  /** スニペットIDをキーとしたプロファイルIDの紐付けマップ */
  snippetProfileMap: Map<string, string[]>;
}

/**
 * フィルタリング済みスニペットフック
 */
export function useFilteredSnippets({
  snippets,
  snippetProfiles,
  searchQuery = '',
  selectedCategory = null,
  activeProfileId = null,
  defaultProfileId = null,
  enableVariableExpansion = true,
  variables = [],
  profileVariables = [],
  locale = 'en',
}: UseFilteredSnippetsParams): UseFilteredSnippetsReturn {
  const { expandVariables } = useVariableExpansion({
    variables,
    profileVariables,
    locale,
  });

  const snippetProfileMap = useMemo(() => {
    const map = new Map<string, string[]>();
    snippetProfiles.forEach(({ snippetId, profileId }) => {
      if (!map.has(snippetId)) {
        map.set(snippetId, []);
      }
      map.get(snippetId)!.push(profileId);
    });
    return map;
  }, [snippetProfiles]);

  const filteredSnippets = useMemo((): SnippetWithDisplay[] => {
    /* 1. フィルタリング */
    const filtered = snippets.filter((snippet) => {
      /* 1-1. 検索フィルター */
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = snippet.title?.toLowerCase().includes(query);
        const matchesContent = snippet.content.toLowerCase().includes(query);
        if (!matchesTitle && !matchesContent) return false;
      }

      /* 1-2. カテゴリフィルター */
      if (selectedCategory !== null) {
        if (selectedCategory === 'uncategorized') {
          if (snippet.categoryId !== null) return false;
        } else {
          if (snippet.categoryId !== selectedCategory) return false;
        }
      }

      /* 1-3. 環境（プロファイル）フィルター */
      const restrictedProfiles = snippetProfileMap.get(snippet.id);
      if (restrictedProfiles && restrictedProfiles.length > 0) {
        if (!activeProfileId) {
          return false;
        }
        if (!restrictedProfiles.includes(activeProfileId)) {
          return false;
        }
      }

      return true;
    });

    /* 2. 変数展開（ソートはDB側で実行済み） */
    return filtered.map((snippet) => {
      if (enableVariableExpansion) {
        const expandedTitle = snippet.title
          ? expandVariables(snippet.title, activeProfileId, defaultProfileId)
          : null;
        const expandedContent = expandVariables(snippet.content, activeProfileId, defaultProfileId);

        return {
          ...snippet,
          displayTitle: expandedTitle,
          displayContent: expandedContent,
        };
      }

      return {
        ...snippet,
        displayTitle: snippet.title,
        displayContent: snippet.content,
      };
    });
  }, [
    snippets,
    searchQuery,
    selectedCategory,
    snippetProfileMap,
    expandVariables,
    activeProfileId,
    defaultProfileId,
    enableVariableExpansion,
  ]);

  return {
    filteredSnippets,
    snippetProfileMap,
  };
}
