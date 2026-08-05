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
import type { Snippet, SnippetProfile, CreateSnippetInput, UpdateSnippetInput, SnippetSortBy } from '../schema';
import { hasSortPreferenceAdapter, getSortPreferenceAdapter } from '../adapters/SortPreferenceAdapter';

/* ======================================== */
/* 型定義 */
/* ======================================== */

/**
 * SnippetContextの型定義
 */
export interface SnippetContextValue {
  /** 全スニペット一覧（ソート済み、フィルタリングなし） */
  allSnippets: Snippet[];
  /** スニペット-プロファイル関連 */
  snippetProfiles: SnippetProfile[];
  /** データ読み込み中フラグ */
  loading: boolean;
  /** エラー情報 */
  error: Error | null;
  /** 現在のソート順 */
  sortBy: SnippetSortBy;
  /** ソート順を変更 */
  setSortBy: (sortBy: SnippetSortBy) => void;
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
  /** タイトルだけをクリップボードにコピー */
  copySnippetTitle: (id: string, profileId?: string) => Promise<void>;
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
  const [sortBy, setSortByState] = useState<SnippetSortBy>('created');
  const [isSortPreferenceLoaded, setIsSortPreferenceLoaded] = useState(false);

  /* データベース初期化状態（DatabaseProviderが必須） */
  const { isLoaded: isDatabaseLoaded } = useDatabase();

  /* 初回マウント時に保存されたソート設定を読み込み */
  useEffect(() => {
    async function loadSortPreference() {
      if (!hasSortPreferenceAdapter()) {
        setIsSortPreferenceLoaded(true);
        return;
      }

      try {
        const adapter = getSortPreferenceAdapter();
        const saved = await adapter.getSortPreference();
        if (saved) {
          setSortByState(saved);
        }
      } catch (err) {
        Logger.error('[SnippetProvider] Failed to load sort preference:', err);
      } finally {
        setIsSortPreferenceLoaded(true);
      }
    }

    void loadSortPreference();
  }, []);

  /* ======================================== */
  /* データ読み込み */
  /* ======================================== */
  const loadSnippets = useCallback((currentSortBy: SnippetSortBy) => {
    try {
      setLoading(true);

      /* 全スニペットを取得（SQLでソート済み） */
      const data = SnippetService.getSorted(currentSortBy);
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

  /* データベースが初期化され、ソート設定が読み込まれた後にデータを読み込む */
  useEffect(() => {
    if (!isDatabaseLoaded || !isSortPreferenceLoaded) return;
    loadSnippets(sortBy);
  }, [loadSnippets, isDatabaseLoaded, isSortPreferenceLoaded, sortBy]);

  /* ======================================== */
  /* CRUD操作 */
  /* ======================================== */

  /**
   * ソート順を変更し、永続化する
   */
  const setSortBy = useCallback((newSortBy: SnippetSortBy) => {
    setSortByState(newSortBy);

    /* 非同期で永続化（UIをブロックしない） */
    if (hasSortPreferenceAdapter()) {
      const adapter = getSortPreferenceAdapter();
      void adapter.setSortPreference(newSortBy).catch((err) => {
        Logger.error('[SnippetProvider] Failed to save sort preference:', err);
      });
    }
  }, []);

  /**
   * 現在のソート順でデータを再読み込み
   */
  const refresh = useCallback(() => {
    loadSnippets(sortBy);
  }, [loadSnippets, sortBy]);

  /**
   * スニペット作成
   * @throws {EmptyContentError} スニペットの本文が空の場合
   */
  const createSnippet = useCallback(
    (input: CreateSnippetInput): Snippet => {
      const snippet = SnippetService.create(input);
      loadSnippets(sortBy);
      return snippet;
    },
    [loadSnippets, sortBy]
  );

  /**
   * スニペット更新
   */
  const updateSnippet = useCallback(
    (input: UpdateSnippetInput): Snippet => {
      const snippet = SnippetService.update(input);
      loadSnippets(sortBy);
      return snippet;
    },
    [loadSnippets, sortBy]
  );

  /**
   * スニペット削除
   */
  const deleteSnippet = useCallback(
    (id: string): void => {
      SnippetService.delete(id);
      loadSnippets(sortBy);
    },
    [loadSnippets, sortBy]
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

      /* アプリ本体とWebではコピーの入口にかかわらず使用回数を加算 */
      SnippetService.incrementCopyCount(id);
      setAllSnippets(prev => prev.map(s =>
        s.id === id ? { ...s, copyCount: (s.copyCount ?? 0) + 1 } : s
      ));
    }
  }, []);

  /**
   * タイトルだけをクリップボードにコピー（変数展開込み）
   *
   * 【使用回数を加算しない理由】
   * タイトルをコピーしたあと本文もコピーすると、1回の利用が2回分として数えられてしまいます。
   * 使用回数は本文を含むコピー（copySnippet）でのみ加算します。
   */
  const copySnippetTitle = useCallback(async (id: string, profileId?: string): Promise<void> => {
    let titleToCopy: string;

    try {
      const customResolver = createCustomResolver(profileId);
      titleToCopy = await SnippetService.prepareTitleForClipboard(id, {
        locale: getCurrentLocale(),
        customResolver,
        shouldReplaceVariables: true,
      });
    } catch (err) {
      /* 変数展開に失敗した場合は元のタイトルをフォールバック */
      Logger.warn('[SnippetProvider] Variable replacement failed, copying original title:', err);
      titleToCopy = await SnippetService.prepareTitleForClipboard(id, {
        shouldReplaceVariables: false,
      });
    }

    /* タイトルがない場合はクリップボードを書き換えない */
    if (!titleToCopy) {
      return;
    }

    if (hasClipboardAdapter()) {
      await getClipboardAdapter().copy(titleToCopy);
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
      sortBy,
      setSortBy,
      refresh,
      createSnippet,
      updateSnippet,
      deleteSnippet,
      copySnippet,
      copySnippetTitle,
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
      sortBy,
      setSortBy,
      refresh,
      createSnippet,
      updateSnippet,
      deleteSnippet,
      copySnippet,
      copySnippetTitle,
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

