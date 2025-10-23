import { useState, useEffect, useCallback } from 'react';
import { snippetService } from '../services/SnippetService';
import { Snippet, CreateSnippetInput, UpdateSnippetInput, SnippetSortBy } from '../types/snippet';

export function useSnippets(categoryId?: string | null) {
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadSnippets = useCallback(async () => {
    try {
      console.log('[loadSnippets] Starting...');
      setLoading(true);
      setError(null);
      let data: Snippet[];

      if (categoryId !== undefined) {
        data = await snippetService.getByCategoryId(categoryId);
      } else {
        data = await snippetService.getAll();
      }

      console.log('[loadSnippets] Loaded:', data.length, 'snippets');
      setSnippets(data);
    } catch (err) {
      setError(err as Error);
      console.error('Failed to load snippets:', err);
    } finally {
      console.log('[loadSnippets] Setting loading to false');
      setLoading(false);
    }
  }, [categoryId]);

  useEffect(() => {
    loadSnippets();
  }, [loadSnippets]);

  const createSnippet = useCallback(async (input: CreateSnippetInput) => {
    try {
      const newSnippet = await snippetService.create(input);
      await loadSnippets();
      return newSnippet;
    } catch (err) {
      console.error('Failed to create snippet:', err);
      throw err;
    }
  }, [loadSnippets]);

  const updateSnippet = useCallback(async (input: UpdateSnippetInput) => {
    try {
      const updated = await snippetService.update(input);
      await loadSnippets();
      return updated;
    } catch (err) {
      console.error('Failed to update snippet:', err);
      throw err;
    }
  }, [loadSnippets]);

  const deleteSnippet = useCallback(async (id: string) => {
    try {
      await snippetService.delete(id);
      await loadSnippets();
    } catch (err) {
      console.error('Failed to delete snippet:', err);
      throw err;
    }
  }, [loadSnippets]);

  const togglePin = useCallback(async (id: string) => {
    try {
      await snippetService.togglePin(id);
      await loadSnippets();
    } catch (err) {
      console.error('Failed to toggle pin:', err);
      throw err;
    }
  }, [loadSnippets]);

  const copySnippet = useCallback(async (id: string) => {
    try {
      await snippetService.copyToClipboard(id);
      // 使用回数は更新されるが、リストは再読み込みしない（エフェクト防止）
    } catch (err) {
      console.error('Failed to copy snippet:', err);
      throw err;
    }
  }, []);

  const sortSnippets = useCallback(async (sortBy: SnippetSortBy) => {
    try {
      setLoading(true);
      const sorted = await snippetService.getSorted(sortBy);
      setSnippets(sorted);
    } catch (err) {
      console.error('Failed to sort snippets:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    snippets,
    loading,
    error,
    refresh: loadSnippets,
    createSnippet,
    updateSnippet,
    deleteSnippet,
    togglePin,
    copySnippet,
    sortSnippets,
  };
}
