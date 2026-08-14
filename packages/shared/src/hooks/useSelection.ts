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
}

/**
 * 文字列を正規化（トリム処理）
 * null、undefined、空文字を扱い、前後の空白を除去する
 */
const normalizeName = (value?: string | null): string => (value ?? '').trim();

/**
 * Setの要素をトグルする
 *
 * 選択のトグルと展開のトグルは「あれば削除、なければ追加」という同じ手順なので
 * 1箇所にまとめる。Reactに変更を検知させるため、必ず新しいSetを返して参照を変える。
 */
function toggleInSet(prev: Set<string>, id: string): Set<string> {
  const next = new Set(prev);
  if (next.has(id)) {
    next.delete(id);
  } else {
    next.add(id);
  }
  return next;
}

/**
 * 指定タブで選択可能なアイテムを返す
 *
 * 全選択の切り替え（toggleSelectAll）と全選択判定（isAllSelected）は同じ集合を
 * 対象にしないと、チェックボックスの表示と実際の選択結果が食い違う。
 * 片方だけ修正される事故を防ぐため、集合の定義はここだけに置く。
 * プロファイルとカテゴリだけ既存重複を除外するのは、同名なら既存を再利用する方針で
 * 取り込み対象から外すため。スニペットと変数は同名でも取り込むので全件が対象。
 *
 * enableDuplicateCheck の判定は isProfileDisabled / isCategoryDisabled の中にも入っており
 * （false なら述語は常に false を返す）、ここの三項演算子と二重になっている。
 * どちらを通しても結果は同じ。
 */
function getSelectableItems(
  tab: SelectionTabType,
  candidates: SelectionCandidatesBase,
  enableDuplicateCheck: boolean,
  isProfileDisabled: (name: string) => boolean,
  isCategoryDisabled: (name: string) => boolean
): SelectableItem[] {
  switch (tab) {
    case 'snippets':
      return candidates.snippets;
    case 'variables':
      return candidates.variables;
    case 'profiles':
      return enableDuplicateCheck
        ? candidates.profiles.filter((item) => !isProfileDisabled(item.name ?? ''))
        : candidates.profiles;
    case 'categories':
      return enableDuplicateCheck
        ? candidates.categories.filter((item) => !isCategoryDisabled(item.name ?? ''))
        : candidates.categories;
  }
}

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

  /* スニペット: 同名でも取り込むため全件を選択する */
  const snippets = new Set(candidates.snippets.map((s) => s.id));
  /* 変数: 重複していても取り込む（既存の値を上書きする）ため全件を選択し、重複はUIの警告表示だけに使う */
  const variables = new Set(candidates.variables.map((v) => v.id));

  /* プロファイル: 重複したものは既存を再利用する方針のため、重複チェック有効時は取り込み対象から除外する */
  const profiles = enableDuplicateCheck
    ? new Set(
        candidates.profiles
          .filter((p) => !existingProfileNames.has(normalizeName(p.name)))
          .map((p) => p.id)
      )
    : new Set(candidates.profiles.map((p) => p.id));

  /* カテゴリ: 重複したものは既存を再利用する方針のため、重複チェック有効時は取り込み対象から除外する */
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

  /**
   * プロファイル名が既存と重複しているか判定
   * 重複チェック無効時は常にfalse
   *
   * 重複したものは既存のプロファイルを再利用する方針のため、
   * 取り込み対象（選択集合）から除外する。
   */
  const isProfileDisabled = useCallback(
    (name: string) => enableDuplicateCheck && existingProfileNames.has(normalizeName(name)),
    [existingProfileNames, enableDuplicateCheck]
  );

  /**
   * 変数名が既存と重複しているか判定
   * 重複チェック無効時は常にfalse
   *
   * 重複していても選択は可能で、取り込むと既存の値を上書きする。
   * この判定はUIで上書き警告を出すためだけに使い、
   * 選択集合の計算（toggleSelectAll / isAllSelected）には使わない。
   */
  const isVariableDuplicate = useCallback(
    (name: string) => enableDuplicateCheck && existingVariableNames.has(normalizeName(name)),
    [existingVariableNames, enableDuplicateCheck]
  );

  /**
   * カテゴリ名が既存と重複しているか判定
   * 重複チェック無効時は常にfalse
   *
   * 重複したものは既存のカテゴリを再利用する方針のため、
   * 取り込み対象（選択集合）から除外する。
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
    setFunction((prev) => toggleInSet(prev, id));
  }, []);

  /**
   * 指定タブ（または現在のタブ）の全項目を選択/解除
   */
  const toggleSelectAll = useCallback(
    (tab?: SelectionTabType) => {
      const targetTab = tab ?? activeTab;

      /* タブごとの現在の選択集合と更新関数。選択可能アイテムの定義は getSelectableItems に集約している */
      const config: Record<
        SelectionTabType,
        {
          currentSet: Set<string>;
          setFunction: React.Dispatch<React.SetStateAction<Set<string>>>;
        }
      > = {
        snippets: {
          currentSet: selectedSnippetIds,
          setFunction: setSelectedSnippetIds,
        },
        profiles: {
          currentSet: selectedProfileIds,
          setFunction: setSelectedProfileIds,
        },
        variables: {
          currentSet: selectedVariableIds,
          setFunction: setSelectedVariableIds,
        },
        categories: {
          currentSet: selectedCategoryIds,
          setFunction: setSelectedCategoryIds,
        },
      };

      const { currentSet, setFunction } = config[targetTab];
      const selectableItems = getSelectableItems(
        targetTab,
        candidates,
        enableDuplicateCheck,
        isProfileDisabled,
        isCategoryDisabled
      );

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
      /* タブごとの現在の選択集合。選択可能アイテムの定義は getSelectableItems に集約している */
      const currentSets: Record<SelectionTabType, Set<string>> = {
        snippets: selectedSnippetIds,
        profiles: selectedProfileIds,
        variables: selectedVariableIds,
        categories: selectedCategoryIds,
      };
      const selectableItems = getSelectableItems(
        targetTab,
        candidates,
        enableDuplicateCheck,
        isProfileDisabled,
        isCategoryDisabled
      );

      /* 候補0件を「全選択済み」と誤判定しないよう、length > 0 のガードは外さない */
      return selectableItems.length > 0 && currentSets[targetTab].size === selectableItems.length;
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
    setExpandedSnippetIds((prev) => toggleInSet(prev, id));
  }, []);

  /**
   * 変数の展開状態をトグル
   */
  const toggleExpandVariable = useCallback((id: string) => {
    setExpandedVariableIds((prev) => toggleInSet(prev, id));
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
  };
}
