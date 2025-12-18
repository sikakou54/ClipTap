import { useState, useEffect, useCallback } from 'react';
import { snippetService } from '../services/SnippetService';
import { Snippet, CreateSnippetInput, UpdateSnippetInput, SnippetSortBy } from '../types/snippet';
import { Logger } from '../logger';
import { useProfiles } from './useProfiles';

export function useSnippets(categoryId?: string | null) {
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { activeProfile } = useProfiles();

  const loadSnippets = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      let data: Snippet[];

      if (categoryId !== undefined) {
        data = await snippetService.getByCategoryId(categoryId);
      } else {
        data = await snippetService.getAll();
      }

      Logger.debug(`Loaded ${data.length} snippets`);
      setSnippets(data);
    } catch (err) {
      setError(err as Error);
      Logger.error('Failed to load snippets:', err);
    } finally {
      setLoading(false);
    }
  }, [categoryId, activeProfile?.id]);

  useEffect(() => {
    loadSnippets();
  }, [loadSnippets, activeProfile?.id]);

  const createSnippet = useCallback(async (input: CreateSnippetInput) => {
    try {
      const newSnippet = await snippetService.create(input);
      await loadSnippets();
      return newSnippet;
    } catch (err) {
      Logger.error('Failed to create snippet:', err);
      throw err;
    }
  }, [loadSnippets]);

  const updateSnippet = useCallback(async (input: UpdateSnippetInput) => {
    try {
      const updated = await snippetService.update(input);
      await loadSnippets();
      return updated;
    } catch (err) {
      Logger.error('Failed to update snippet:', err);
      throw err;
    }
  }, [loadSnippets]);

  const deleteSnippet = useCallback(async (id: string) => {
    try {
      await snippetService.delete(id);
      await loadSnippets();
    } catch (err) {
      Logger.error('Failed to delete snippet:', err);
      throw err;
    }
  }, [loadSnippets]);

  const copySnippet = useCallback(async (id: string) => {
    try {
      await snippetService.copyToClipboard(id);
    } catch (err) {
      Logger.error('Failed to copy snippet:', err);
      throw err;
    }
  }, []);

  const sortSnippets = useCallback(async (sortBy: SnippetSortBy) => {
    try {
      setLoading(true);
      const sorted = await snippetService.getSorted(sortBy);
      setSnippets(sorted);
    } catch (err) {
      Logger.error('Failed to sort snippets:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getTextPreview = useCallback(async (content: string): Promise<string> => {
    try {
      return await snippetService.getTextPreview(content);
    } catch (err) {
      Logger.error('Failed to get text preview:', err);
      throw err;
    }
  }, []);

  const getById = useCallback(async (id: string): Promise<Snippet | null> => {
    try {
      return await snippetService.getById(id);
    } catch (err) {
      Logger.error('Failed to get snippet by id:', err);
      throw err;
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
    copySnippet,
    sortSnippets,
    getTextPreview,
    getById,
  };
}
