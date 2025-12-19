/**
 * 選択UI状態管理Hook
 *
 * @description
 * インポート/エクスポート両方で使用可能な汎用的な選択状態管理Hook。
 * 重複チェックはオプションで、エクスポート時は無効化可能。
 *
 * @module useSelection
 *
 * @features
 * - 候補データの選択状態管理
 * - オプションの重複チェック（インポート時のみ使用）
 * - タブごとの全選択/全解除機能
 * - 選択数のカウント
 * - モーダル/画面開閉時の初期化
 * - アコーディオン展開状態の管理
 */

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';

export type SelectionTabType = 'snippets' | 'profiles' | 'variables' | 'categories';

/**
 * 選択アイテムの共通インターフェース
 * ImportCandidatesとSelectionCandidatesの両方で使用可能
 */
interface SelectableItem {
  id: string;
  name?: string;
}

/**
 * 選択候補の共通インターフェース
 * ImportCandidatesとSelectionCandidatesの両方に対応
 */
export interface SelectionCandidatesBase {
  snippets: SelectableItem[];
  profiles: SelectableItem[];
  variables: SelectableItem[];
  categories: SelectableItem[];
}

/**
 * useSelectionのProps型定義
 */
export interface UseSelectionProps {
  /** 選択候補データ（ImportCandidatesまたはSelectionCandidates） */
  candidates: SelectionCandidatesBase;
  /** 既存の環境名セット（重複チェック用、省略可） */
  existingProfileNames?: Set<string>;
  /** 既存の変数名セット（重複チェック用、省略可） */
  existingVariableNames?: Set<string>;
  /** 既存のカテゴリ名セット（重複チェック用、省略可） */
  existingCategoryNames?: Set<string>;
  /** モーダル/画面が開いているかどうか（初期化トリガー） */
  isOpen?: boolean;
  /** 重複チェックを有効にするか（デフォルト: true） */
  enableDuplicateCheck?: boolean;
}

/**
 * useSelectionの戻り値型定義
 */
export interface UseSelectionResult {
  /* 選択状態 */
  selectedSnippetIds: Set<string>;
  selectedProfileIds: Set<string>;
  selectedVariableIds: Set<string>;
  selectedCategoryIds: Set<string>;

  /* セッター（直接操作が必要な場合用） */
  setSelectedSnippetIds: React.Dispatch<React.SetStateAction<Set<string>>>;
  setSelectedProfileIds: React.Dispatch<React.SetStateAction<Set<string>>>;
  setSelectedVariableIds: React.Dispatch<React.SetStateAction<Set<string>>>;
  setSelectedCategoryIds: React.Dispatch<React.SetStateAction<Set<string>>>;

  /* UI状態 */
  activeTab: SelectionTabType;
  setActiveTab: React.Dispatch<React.SetStateAction<SelectionTabType>>;
  expandedSnippetIds: Set<string>;
  expandedVariableIds: Set<string>;

  /* 重複チェック関数 */
  isProfileDisabled: (name: string) => boolean;
  isVariableDuplicate: (name: string) => boolean;
  isCategoryDisabled: (name: string) => boolean;

  /* 操作関数 */
  toggleSelection: (id: string, type: SelectionTabType) => void;
  toggleSelectAll: (tab?: SelectionTabType) => void;
  isAllSelected: (tab?: SelectionTabType) => boolean;
  toggleExpandSnippet: (id: string) => void;
  toggleExpandVariable: (id: string) => void;

  /* 集計 */
  totalSelected: number;

  /* 初期化 */
  resetSelection: () => void;
}

/**
 * 文字列を正規化（トリム処理）
 * null、undefined、空文字を扱い、前後の空白を除去する
 */
const normalizeName = (value?: string | null): string => (value ?? '').trim();

/**
 * 初期選択状態を計算する
 * @internal
 */
interface InitialSelectionParams {
  candidates: SelectionCandidatesBase;
  existingProfileNames: Set<string>;
  existingCategoryNames: Set<string>;
  enableDuplicateCheck: boolean;
}

interface InitialSelectionState {
  snippets: Set<string>;
  profiles: Set<string>;
  variables: Set<string>;
  categories: Set<string>;
}

/**
 * 初期選択状態を計算する関数
 * 重複チェックが有効な場合は、既存データと重複しない項目のみを選択状態にする
 */
function computeInitialSelection(params: InitialSelectionParams): InitialSelectionState {
  const { candidates, existingProfileNames, existingCategoryNames, enableDuplicateCheck } = params;

  /* スニペット: 全て選択（重複チェックなし、同名でも追加可能） */
  const snippets = new Set(candidates.snippets.map((s) => s.id));
  /* 変数: 全て選択（重複チェックなし、重複時は上書き警告のみ） */
  const variables = new Set(candidates.variables.map((v) => v.id));

  /* プロファイル: 重複チェック有効時は既存と名前が重複しないもののみ選択 */
  /* 重複名のプロファイルは既存のものを使用する方針のため、重複チェック時は選択から除外 */
  const profiles = enableDuplicateCheck
    ? new Set(
        candidates.profiles
          .filter((p) => !existingProfileNames.has(normalizeName(p.name)))
          .map((p) => p.id)
      )
    : new Set(candidates.profiles.map((p) => p.id));

  /* カテゴリ: 重複チェック有効時は既存と名前が重複しないもののみ選択 */
  /* 重複名のカテゴリは既存のものを使用する方針のため、重複チェック時は選択から除外 */
  const categories = enableDuplicateCheck
    ? new Set(
        candidates.categories
          .filter((c) => !existingCategoryNames.has(normalizeName(c.name)))
          .map((c) => c.id)
      )
    : new Set(candidates.categories.map((c) => c.id));

  return { snippets, profiles, variables, categories };
}

/**
 * 選択UI状態管理Hook
 *
 * @param props - フックのプロパティ
 * @returns 選択状態と操作関数を含むオブジェクト
 */
export function useSelection({
  candidates,
  existingProfileNames = new Set(),
  existingVariableNames = new Set(),
  existingCategoryNames = new Set(),
  isOpen,
  enableDuplicateCheck = true,
}: UseSelectionProps): UseSelectionResult {
  /* State: 選択状態 */
  const [selectedSnippetIds, setSelectedSnippetIds] = useState<Set<string>>(new Set());
  const [selectedProfileIds, setSelectedProfileIds] = useState<Set<string>>(new Set());
  const [selectedVariableIds, setSelectedVariableIds] = useState<Set<string>>(new Set());
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<Set<string>>(new Set());

  /* State: UI状態 */
  const [activeTab, setActiveTab] = useState<SelectionTabType>('snippets');
  const [expandedSnippetIds, setExpandedSnippetIds] = useState<Set<string>>(new Set());
  const [expandedVariableIds, setExpandedVariableIds] = useState<Set<string>>(new Set());

  /* 初期化済みフラグ（無限ループ防止用） */
  const isInitializedRef = useRef(false);

  /**
   * 選択状態を初期値に設定する共通処理
   * 候補データと既存データから初期選択を計算し、状態を更新
   */
  const applyInitialSelection = useCallback(() => {
    const initial = computeInitialSelection({
      candidates,
      existingProfileNames,
      existingCategoryNames,
      enableDuplicateCheck,
    });
    setSelectedSnippetIds(initial.snippets);
    setSelectedProfileIds(initial.profiles);
    setSelectedVariableIds(initial.variables);
    setSelectedCategoryIds(initial.categories);
    setActiveTab('snippets');
    setExpandedSnippetIds(new Set());
    setExpandedVariableIds(new Set());
  }, [candidates, existingProfileNames, existingCategoryNames, enableDuplicateCheck]);

  /**
   * 初期化処理（モーダル/画面が開いた時）
   * isOpenがtrueになった時、まだ初期化されていなければ初期選択を適用
   */
  useEffect(() => {
    if (isOpen && !isInitializedRef.current) {
      isInitializedRef.current = true;
      applyInitialSelection();
    }
    if (!isOpen) {
      isInitializedRef.current = false;
    }
  }, [isOpen, applyInitialSelection]);

  const resetSelection = applyInitialSelection;

  /**
   * プロファイル名が既存と重複しているか判定
   * 重複チェック無効時は常にfalse
   */
  const isProfileDisabled = useCallback(
    (name: string) => enableDuplicateCheck && existingProfileNames.has(normalizeName(name)),
    [existingProfileNames, enableDuplicateCheck]
  );

  /**
   * 変数名が既存と重複しているか判定
   * 重複チェック無効時は常にfalse
   */
  const isVariableDuplicate = useCallback(
    (name: string) => enableDuplicateCheck && existingVariableNames.has(normalizeName(name)),
    [existingVariableNames, enableDuplicateCheck]
  );

  /**
   * カテゴリ名が既存と重複しているか判定
   * 重複チェック無効時は常にfalse
   */
  const isCategoryDisabled = useCallback(
    (name: string) => enableDuplicateCheck && existingCategoryNames.has(normalizeName(name)),
    [existingCategoryNames, enableDuplicateCheck]
  );

  /**
   * 項目の選択状態をトグル
   */
  const toggleSelection = useCallback((id: string, type: SelectionTabType) => {
    const setterMap: Record<SelectionTabType, React.Dispatch<React.SetStateAction<Set<string>>>> = {
      snippets: setSelectedSnippetIds,
      profiles: setSelectedProfileIds,
      variables: setSelectedVariableIds,
      categories: setSelectedCategoryIds,
    };

    const setFunction = setterMap[type];
    setFunction((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  /**
   * 指定タブ（または現在のタブ）の全項目を選択/解除
   */
  const toggleSelectAll = useCallback(
    (tab?: SelectionTabType) => {
      const targetTab = tab ?? activeTab;

      /* 各タブごとの設定を定義 */
      /* filterDisabledが定義されているタブは、重複チェック時に無効な項目を除外する */
      const config: Record<
        SelectionTabType,
        {
          currentSet: Set<string>;
          items: { id: string; name?: string }[];
          setFunction: React.Dispatch<React.SetStateAction<Set<string>>>;
          filterDisabled?: (item: { id: string; name?: string }) => boolean;
        }
      > = {
        snippets: {
          currentSet: selectedSnippetIds,
          items: candidates.snippets,
          setFunction: setSelectedSnippetIds,
        },
        profiles: {
          currentSet: selectedProfileIds,
          items: candidates.profiles,
          setFunction: setSelectedProfileIds,
          filterDisabled: enableDuplicateCheck
            ? (item) => !isProfileDisabled(item.name ?? '')
            : undefined,
        },
        variables: {
          currentSet: selectedVariableIds,
          items: candidates.variables,
          setFunction: setSelectedVariableIds,
        },
        categories: {
          currentSet: selectedCategoryIds,
          items: candidates.categories,
          setFunction: setSelectedCategoryIds,
          filterDisabled: enableDuplicateCheck
            ? (item) => !isCategoryDisabled(item.name ?? '')
            : undefined,
        },
      };

      const { currentSet, items, setFunction, filterDisabled } = config[targetTab];

      /* 選択可能なアイテムを取得（重複チェック時は無効な項目を除外） */
      const selectableItems = filterDisabled ? items.filter(filterDisabled) : items;

      if (selectableItems.length === 0) {
        setFunction(new Set());
        return;
      }

      /* 全選択状態の判定と切り替え */
      /* 現在の選択数が選択可能アイテム数と同じなら全解除、それ以外は全選択 */
      if (currentSet.size === selectableItems.length) {
        setFunction(new Set());
      } else {
        setFunction(new Set(selectableItems.map((item) => item.id)));
      }
    },
    [
      activeTab,
      selectedSnippetIds,
      selectedProfileIds,
      selectedVariableIds,
      selectedCategoryIds,
      candidates,
      isProfileDisabled,
      isCategoryDisabled,
      enableDuplicateCheck,
    ]
  );

  /**
   * 指定タブ（または現在のタブ）が全選択されているか判定
   */
  const isAllSelected = useCallback(
    (tab?: SelectionTabType): boolean => {
      const targetTab = tab ?? activeTab;

      switch (targetTab) {
        case 'snippets':
          return (
            candidates.snippets.length > 0 &&
            selectedSnippetIds.size === candidates.snippets.length
          );
        case 'profiles': {
          if (enableDuplicateCheck) {
            const selectable = candidates.profiles.filter(
              (item) => !isProfileDisabled(item.name ?? '')
            );
            return selectable.length > 0 && selectedProfileIds.size === selectable.length;
          }
          return (
            candidates.profiles.length > 0 &&
            selectedProfileIds.size === candidates.profiles.length
          );
        }
        case 'variables':
          return (
            candidates.variables.length > 0 &&
            selectedVariableIds.size === candidates.variables.length
          );
        case 'categories': {
          if (enableDuplicateCheck) {
            const selectable = candidates.categories.filter(
              (item) => !isCategoryDisabled(item.name ?? '')
            );
            return selectable.length > 0 && selectedCategoryIds.size === selectable.length;
          }
          return (
            candidates.categories.length > 0 &&
            selectedCategoryIds.size === candidates.categories.length
          );
        }
      }
    },
    [
      activeTab,
      selectedSnippetIds,
      selectedProfileIds,
      selectedVariableIds,
      selectedCategoryIds,
      candidates,
      isProfileDisabled,
      isCategoryDisabled,
      enableDuplicateCheck,
    ]
  );

  /**
   * スニペットの展開状態をトグル
   */
  const toggleExpandSnippet = useCallback((id: string) => {
    setExpandedSnippetIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  /**
   * 変数の展開状態をトグル
   */
  const toggleExpandVariable = useCallback((id: string) => {
    setExpandedVariableIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const totalSelected = useMemo(() => {
    return (
      selectedSnippetIds.size +
      selectedProfileIds.size +
      selectedVariableIds.size +
      selectedCategoryIds.size
    );
  }, [selectedSnippetIds, selectedProfileIds, selectedVariableIds, selectedCategoryIds]);

  return {
    selectedSnippetIds,
    selectedProfileIds,
    selectedVariableIds,
    selectedCategoryIds,
    setSelectedSnippetIds,
    setSelectedProfileIds,
    setSelectedVariableIds,
    setSelectedCategoryIds,
    activeTab,
    setActiveTab,
    expandedSnippetIds,
    expandedVariableIds,
    isProfileDisabled,
    isVariableDuplicate,
    isCategoryDisabled,
    toggleSelection,
    toggleSelectAll,
    isAllSelected,
    toggleExpandSnippet,
    toggleExpandVariable,
    totalSelected,
    resetSelection,
  };
}
