import { useState, useCallback, useEffect } from 'react';
import { snippetService } from '../services/SnippetService';
import { Snippet } from '../types/snippet';

const DEBOUNCE_DELAY = 300;

export function useSearch(categoryId?: string) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Snippet[]>([]);
  const [searching, setSearching] = useState(false);

  // デバウンス処理
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    const timeoutId = setTimeout(async () => {
      try {
        const searchResults = await snippetService.search(query, categoryId);
        setResults(searchResults);
      } catch (error) {
        console.error('Search failed:', error);
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, DEBOUNCE_DELAY);

    return () => clearTimeout(timeoutId);
  }, [query, categoryId]);

  const clearSearch = useCallback(() => {
    setQuery('');
    setResults([]);
    setSearching(false);
  }, []);

  return {
    query,
    setQuery,
    results,
    searching,
    clearSearch,
    hasQuery: query.trim().length > 0,
  };
}
