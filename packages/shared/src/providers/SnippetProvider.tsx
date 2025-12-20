/**
 * スニペット管理Provider
 *
 * @description
 * スニペット（定型文）のグローバル状態を管理するProvider。
 * すべての画面で同じデータを参照でき、一箇所で更新すると全画面に即座に反映される。
 *
 * @module SnippetProvider
 */

import { createContext, useContext, useState, useEffect, useCallback, useMemo, type ReactNode } from 'react';
import { SnippetService } from '../services/SnippetService';
import { ProfileService } from '../services/ProfileService';
import { VariableService, type VariableResolverContext } from '../services/VariableService';
import { SubscriptionService } from '../services/SubscriptionService';
import { Logger } from '../utils/logger';
import { FEATURE_LIMITS } from '../constants/inputLimits';
import { getClipboardAdapter, hasClipboardAdapter } from '../adapters/ClipboardAdapter';
import { getLocaleAdapter, hasLocaleAdapter } from '../adapters/LocaleAdapter';
import { useDatabase } from './DatabaseProvider';
import type { VariableResolver } from '../variables/parser';
import type { Snippet, SnippetProfile, CreateSnippetInput, UpdateSnippetInput } from '../schema';

/* ======================================== */
/* 型定義 */
/* ======================================== */

/**
 * SnippetContextの型定義
 */
export interface SnippetContextValue {
  /** 全スニペット一覧（フィルタリングなし） */
  allSnippets: Snippet[];
  /** スニペット-プロファイル関連 */
  snippetProfiles: SnippetProfile[];
  /** データ読み込み中フラグ */
  loading: boolean;
  /** エラー情報 */
  error: Error | null;
  /** データ再読み込み関数 */
  refresh: () => void;
  /** スニペット作成 */
  createSnippet: (input: CreateSnippetInput) => Snippet;
  /** スニペット更新 */
  updateSnippet: (input: UpdateSnippetInput) => Snippet;
  /** スニペット削除 */
  deleteSnippet: (id: string) => void;
  /** クリップボードにコピー */
  copySnippet: (id: string, profileId?: string) => Promise<void>;
  /** テキストプレビュー生成 */
  getTextPreview: (content: string) => Promise<string>;
  /** ID指定で取得 */
  getById: (id: string) => Snippet | null;
  /** プロファイルID一覧を取得 */
  getProfileIds: (snippetId: string) => string[];
  /** プレビュー生成 */
  getPreview: (id: string, profileId?: string) => Promise<string>;
  /** クリップボード用テキスト準備 */
  prepareForClipboard: (id: string, profileId?: string) => Promise<string>;
}

/**
 * SnippetProviderのProps
 */
interface SnippetProviderProps {
  /** 子コンポーネント */
  children: ReactNode;
}

/* ======================================== */
/* Context */
/* ======================================== */

const SnippetContext = createContext<SnippetContextValue | null>(null);

/* ======================================== */
/* ユーティリティ関数 */
/* ======================================== */

/**
 * カスタム変数リゾルバーを作成
 */
function createCustomResolver(profileId?: string): VariableResolver {
  const isSubscribed = SubscriptionService.isSubscribed();
  const profileVariablesMap = profileId
    ? ProfileService.getProfileVariablesMap(profileId)
    : ProfileService.getActiveProfileVariablesMap();
  const defaultProfileVariablesMap = ProfileService.getDefaultProfileVariablesMap();

  const context: VariableResolverContext = {
    isSubscribed,
    profileVariablesMap,
    defaultProfileVariablesMap,
  };

  return VariableService.createCustomVariableResolver(context, {
    freeTierLimit: FEATURE_LIMITS.FREE_TIER_VARIABLES,
  });
}

/**
 * 現在のロケールを取得
 */
function getCurrentLocale(): string {
  if (hasLocaleAdapter()) {
    return getLocaleAdapter().getLanguage();
  }
  return 'en';
}

/* ======================================== */
/* Provider */
/* ======================================== */

/**
 * スニペット管理Provider
 *
 * @param props - SnippetProviderProps
 */
export function SnippetProvider({ children }: SnippetProviderProps) {
  /* ======================================== */
  /* 状態管理 */
  /* ======================================== */
  const [allSnippets, setAllSnippets] = useState<Snippet[]>([]);
  const [snippetProfiles, setSnippetProfiles] = useState<SnippetProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  /* データベース初期化状態（DatabaseProviderが必須） */
  const { isLoaded: isDatabaseLoaded } = useDatabase();

  /* ======================================== */
  /* データ読み込み */
  /* ======================================== */
  const loadSnippets = useCallback(() => {
    try {
      setLoading(true);

      /* 全スニペットを取得（プロファイルフィルタなし） */
      const data = SnippetService.getAll();
      setAllSnippets(data);

      /* 全スニペット-プロファイル関連を取得 */
      const allSnippetProfiles = SnippetService.getAllSnippetProfiles();
      setSnippetProfiles(allSnippetProfiles);

      setError(null);
    } catch (err) {
      Logger.error('[SnippetProvider] Failed to load snippets:', err);
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, []);

  /* データベースが初期化された後にデータを読み込む */
  useEffect(() => {
    if (!isDatabaseLoaded) return;
    loadSnippets();
  }, [loadSnippets, isDatabaseLoaded]);

  /* ======================================== */
  /* CRUD操作 */
  /* ======================================== */

  /**
   * スニペット作成
   * @throws {EmptyContentError} スニペットの本文が空の場合
   */
  const createSnippet = useCallback(
    (input: CreateSnippetInput): Snippet => {
      const snippet = SnippetService.create(input);
      loadSnippets();
      return snippet;
    },
    [loadSnippets]
  );

  /**
   * スニペット更新
   */
  const updateSnippet = useCallback(
    (input: UpdateSnippetInput): Snippet => {
      const snippet = SnippetService.update(input);
      loadSnippets();
      return snippet;
    },
    [loadSnippets]
  );

  /**
   * スニペット削除
   */
  const deleteSnippet = useCallback(
    (id: string): void => {
      SnippetService.delete(id);
      loadSnippets();
    },
    [loadSnippets]
  );

  /* ======================================== */
  /* ユーティリティ */
  /* ======================================== */

  /**
   * クリップボードにコピー（変数展開込み）
   */
  const copySnippet = useCallback(async (id: string, profileId?: string): Promise<void> => {
    let textToCopy: string;

    try {
      const customResolver = createCustomResolver(profileId);
      textToCopy = await SnippetService.prepareForClipboard(id, {
        locale: getCurrentLocale(),
        customResolver,
        shouldReplaceVariables: true,
      });
    } catch (err) {
      /* 変数展開に失敗した場合は元のテキストをフォールバック */
      Logger.warn('[SnippetProvider] Variable replacement failed, copying original content:', err);
      textToCopy = await SnippetService.prepareForClipboard(id, {
        shouldReplaceVariables: false,
      });
    }

    if (hasClipboardAdapter()) {
      await getClipboardAdapter().copy(textToCopy);
    }
  }, []);

  const getTextPreview = useCallback(async (content: string): Promise<string> => {
    const customResolver = createCustomResolver();
    return SnippetService.getTextPreview(content, {
      locale: getCurrentLocale(),
      customResolver,
    });
  }, []);

  const getById = useCallback((id: string): Snippet | null => SnippetService.getById(id), []);

  const getProfileIds = useCallback((snippetId: string): string[] => {
    return SnippetService.getProfileIds(snippetId);
  }, []);

  const getPreview = useCallback(async (id: string, profileId?: string): Promise<string> => {
    const customResolver = createCustomResolver(profileId);
    return SnippetService.getPreview(id, {
      locale: getCurrentLocale(),
      customResolver,
    });
  }, []);

  const prepareForClipboard = useCallback(async (id: string, profileId?: string): Promise<string> => {
    const customResolver = createCustomResolver(profileId);
    return SnippetService.prepareForClipboard(id, {
      locale: getCurrentLocale(),
      customResolver,
      shouldReplaceVariables: true,
    });
  }, []);

  /* ======================================== */
  /* Context Value */
  /* ======================================== */
  const value = useMemo<SnippetContextValue>(
    () => ({
      allSnippets,
      snippetProfiles,
      loading,
      error,
      refresh: loadSnippets,
      createSnippet,
      updateSnippet,
      deleteSnippet,
      copySnippet,
      getTextPreview,
      getById,
      getProfileIds,
      getPreview,
      prepareForClipboard,
    }),
    [
      allSnippets,
      snippetProfiles,
      loading,
      error,
      loadSnippets,
      createSnippet,
      updateSnippet,
      deleteSnippet,
      copySnippet,
      getTextPreview,
      getById,
      getProfileIds,
      getPreview,
      prepareForClipboard,
    ]
  );

  return <SnippetContext.Provider value={value}>{children}</SnippetContext.Provider>;
}

/* ======================================== */
/* Hook */
/* ======================================== */

/**
 * スニペット状態を取得するフック（全データを返す）
 *
 * @returns スニペット状態とアクション
 * @throws Provider外で使用された場合にエラー
 */
export function useSnippets(): SnippetContextValue {
  const context = useContext(SnippetContext);
  if (!context) {
    throw new Error('useSnippets must be used within SnippetProvider');
  }
  return context;
}


