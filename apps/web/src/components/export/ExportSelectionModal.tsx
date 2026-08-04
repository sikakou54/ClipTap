/**
 * エクスポートデータ選択モーダル
 *
 * @description
 * エクスポートするデータを選択するためのモーダル。
 * タブ形式でデータ種別（定型文/プロファイル/変数/カテゴリ）を切り替え、
 * 個別選択・全選択が可能。
 * パスワード入力モーダルも含む。
 *
 * @see components/import/ImportSelectionModal.tsx - インポート版の参考実装
 */

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useTranslation } from '@cliptap/shared';
import { Dialog } from '@headlessui/react';
import {
  useProfiles,        /* プロファイル一覧取得フック */
  useVariables,       /* 変数一覧取得フック */
  useCategories,      /* カテゴリ一覧取得フック */
  useSnippets,        /* 定型文一覧取得フック */
  type ImportTabType, /* タブの種類（snippets/profiles/variables/categories） */
} from '@cliptap/shared';

/** タブオプションの定義（固定値） */
const TAB_OPTIONS: ImportTabType[] = ['snippets', 'profiles', 'variables', 'categories'];

/**
 * エクスポート選択モーダルのProps型定義
 */
interface ExportSelectionModalProps {
  /** モーダルの表示/非表示状態 */
  isOpen: boolean;
  /** モーダルを閉じる時のコールバック */
  onClose: () => void;
  /** エクスポート実行時のコールバック（パスワードと選択されたアイテムのID配列を渡す） */
  onExport: (
    password: string,
    selectedSnippetIds: string[],
    selectedProfileIds: string[],
    selectedVariableIds: string[],
    selectedCategoryIds: string[]
  ) => Promise<void>;
  /** 処理中フラグ（親コンポーネントで管理） */
  isProcessing: boolean;
}

/**
 * エクスポート選択モーダルコンポーネント
 *
 * 既存データから選択してエクスポートファイルを生成する
 */
export function ExportSelectionModal({
  isOpen,
  onClose,
  onExport,
  isProcessing,
}: ExportSelectionModalProps) {
  /* 翻訳関数を取得 */
  const { t } = useTranslation();

  /**
   * データ取得
   * 既存のすべてのデータを取得してエクスポート候補として使用
   * disableProfileFilter: true で全定型文を取得（プロファイルフィルタなし）
   */
  const { allSnippets, snippetProfiles } = useSnippets();
  /* エクスポート用：全スニペット（プロファイルフィルタなし） */
  const snippets = allSnippets;
  const { profiles, profileVariables } = useProfiles();  /* プロファイルとプロファイル変数値 */
  const { variables } = useVariables();                  /* 変数一覧 */
  const { categories } = useCategories();                /* カテゴリ一覧 */

  /**
   * UI状態の管理
   */
  const [activeTab, setActiveTab] = useState<ImportTabType>('snippets'); /* 現在のアクティブタブ */
  const [expandedSnippetIds, setExpandedSnippetIds] = useState<Set<string>>(new Set()); /* 展開されている定型文のIDセット */
  const [expandedVariableIds, setExpandedVariableIds] = useState<Set<string>>(new Set()); /* 展開されている変数のIDセット */

  /**
   * 選択状態の管理
   * 各データ種別ごとに選択されているアイテムのIDをSetで管理
   */
  const [selectedSnippetIds, setSelectedSnippetIds] = useState<Set<string>>(new Set());
  const [selectedProfileIds, setSelectedProfileIds] = useState<Set<string>>(new Set());
  const [selectedVariableIds, setSelectedVariableIds] = useState<Set<string>>(new Set());
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<Set<string>>(new Set());

  /**
   * パスワード入力モーダルの状態管理
   */
  const [showPasswordModal, setShowPasswordModal] = useState(false); /* パスワードモーダルの表示/非表示 */
  const [password, setPassword] = useState('');                      /* 入力されたパスワード */

  /**
   * カテゴリIDからカテゴリ情報を取得するヘルパー関数
   * メモ化してレンダリング毎の再生成を防ぐ
   */
  const getCategory = useCallback(
    (categoryId: string | null): { name: string | null; color: string | null } => {
      if (!categoryId) return { name: null, color: null };
      const category = categories.find((c) => c.id === categoryId);
      return { name: category?.name ?? null, color: category?.color ?? null };
    },
    [categories]
  );

  /**
   * プロファイルIDからプロファイル名を取得するヘルパー関数
   * メモ化してレンダリング毎の再生成を防ぐ
   */
  const getProfileName = useCallback(
    (profileId: string): string | null => {
      const profile = profiles.find((p) => p.id === profileId);
      return profile?.name ?? null;
    },
    [profiles]
  );

  /**
   * エクスポート候補データの生成
   * 既存データを表示用の形式に変換してメモ化
   */
  const candidates = useMemo(() => {
    /* 定型文候補データの生成 */
    const snippetCandidates = snippets.map((s) => {
      /* この定型文に紐付いているプロファイルIDを取得 */
      const snippetProfileIds = snippetProfiles
        .filter((sp) => sp.snippetId === s.id)
        .map((sp) => sp.profileId);
      /* プロファイルIDからプロファイル名を取得 */
      const snippetProfilesData = snippetProfileIds.map((profileId) => ({
        profileId,
        profileName: getProfileName(profileId),
      }));

      /* カテゴリ情報を取得 */
      const category = getCategory(s.categoryId);

      return {
        id: s.id,
        title: s.title,
        content: s.content,
        categoryId: s.categoryId,
        categoryName: category.name,
        categoryColor: category.color,
        profiles: snippetProfilesData,
      };
    });

    /* プロファイル候補データの生成 */
    const profileCandidates = profiles.map((p) => ({
      id: p.id,
      name: p.name,
    }));

    /* 変数候補データの生成（カスタム変数のみ、システム変数は除外） */
    const customVariables = variables.filter((v) => v.type === 'custom');
    const variableCandidates = customVariables.map((v) => {
      /* この変数のプロファイル別の値を取得 */
      const variableProfileValues = profileVariables
        .filter((pv) => pv.variableId === v.id)
        .map((pv) => ({
          profileId: pv.profileId,
          profileName: getProfileName(pv.profileId),
          value: pv.value,
        }));

      return {
        id: v.id,
        name: v.name,
        label: v.label,
        icon: v.icon,
        profileValues: variableProfileValues,
      };
    });

    /* カテゴリ候補データの生成 */
    const categoryCandidates = categories.map((c) => ({
      id: c.id,
      name: c.name,
      color: c.color,
    }));

    /* すべての候補データをまとめて返す */
    return {
      snippets: snippetCandidates,
      profiles: profileCandidates,
      variables: variableCandidates,
      categories: categoryCandidates,
    };
  }, [snippets, snippetProfiles, profiles, variables, categories, profileVariables, getCategory, getProfileName]);

  /**
   * 初期選択状態の設定
   * モーダルが開かれた時に全てのアイテムを選択状態にする
   */
  useEffect(() => {
    if (isOpen) {
      /* 全ての定型文を選択 */
      setSelectedSnippetIds(new Set(candidates.snippets.map((s) => s.id)));
      /* 全てのプロファイルを選択 */
      setSelectedProfileIds(new Set(candidates.profiles.map((p) => p.id)));
      /* 全ての変数を選択 */
      setSelectedVariableIds(new Set(candidates.variables.map((v) => v.id)));
      /* 全てのカテゴリを選択 */
      setSelectedCategoryIds(new Set(candidates.categories.map((c) => c.id)));
      /* タブを定型文に設定 */
      setActiveTab('snippets');
      /* 展開状態をリセット */
      setExpandedSnippetIds(new Set());
      setExpandedVariableIds(new Set());
      /* パスワードモーダルを非表示 */
      setShowPasswordModal(false);
      /* パスワードをクリア */
      setPassword('');
    }
  }, [isOpen, candidates.snippets, candidates.profiles, candidates.variables, candidates.categories]);

  /**
   * 選択されているアイテムの総数（全タブ合計）
   */
  const totalSelected =
    selectedSnippetIds.size +
    selectedProfileIds.size +
    selectedVariableIds.size +
    selectedCategoryIds.size;

  /**
   * 個別アイテムの選択/非選択を切り替える
   */
  const toggleSelection = useCallback((id: string, type: ImportTabType) => {
    /* データタイプごとのstate更新関数のマップ */
    const setterMap: Record<ImportTabType, React.Dispatch<React.SetStateAction<Set<string>>>> = {
      snippets: setSelectedSnippetIds,
      profiles: setSelectedProfileIds,
      variables: setSelectedVariableIds,
      categories: setSelectedCategoryIds,
    };

    const setFunction = setterMap[type];
    setFunction((prev) => {
      const next = new Set(prev);
      /* 既に選択されている場合は削除、そうでない場合は追加 */
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  /**
   * 現在のタブ（または指定されたタブ）の全アイテムが選択されているか判定
   */
  const isAllSelected = useCallback(
    (tab?: ImportTabType): boolean => {
      const targetTab = tab ?? activeTab;
      switch (targetTab) {
        case 'snippets':
          return candidates.snippets.length > 0 && selectedSnippetIds.size === candidates.snippets.length;
        case 'profiles':
          return candidates.profiles.length > 0 && selectedProfileIds.size === candidates.profiles.length;
        case 'variables':
          return candidates.variables.length > 0 && selectedVariableIds.size === candidates.variables.length;
        case 'categories':
          return candidates.categories.length > 0 && selectedCategoryIds.size === candidates.categories.length;
      }
    },
    [activeTab, selectedSnippetIds, selectedProfileIds, selectedVariableIds, selectedCategoryIds, candidates]
  );

  /**
   * 現在のタブ（または指定されたタブ）の全選択/全解除を切り替える
   */
  const toggleSelectAll = useCallback(
    (tab?: ImportTabType) => {
      const targetTab = tab ?? activeTab;
      /* タブごとの設定マップ */
      const config: Record<
        ImportTabType,
        {
          currentSet: Set<string>;          /* 現在の選択状態 */
          items: { id: string }[];          /* 候補アイテム */
          setFunction: React.Dispatch<React.SetStateAction<Set<string>>>; /* state更新関数 */
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
        },
      };

      const { currentSet, items, setFunction } = config[targetTab];
      /* 全選択されている場合は全解除、そうでない場合は全選択 */
      if (currentSet.size === items.length) {
        setFunction(new Set());
      } else {
        setFunction(new Set(items.map((item) => item.id)));
      }
    },
    [activeTab, selectedSnippetIds, selectedProfileIds, selectedVariableIds, selectedCategoryIds, candidates]
  );

  /**
   * 定型文の展開/折りたたみを切り替える
   */
  const toggleSnippetExpand = useCallback((id: string) => {
    setExpandedSnippetIds((prev) => {
      const next = new Set(prev);
      /* 既に展開されている場合は折りたたみ、そうでない場合は展開 */
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  /**
   * 変数の展開/折りたたみを切り替える
   */
  const toggleVariableExpand = useCallback((id: string) => {
    setExpandedVariableIds((prev) => {
      const next = new Set(prev);
      /* 既に展開されている場合は折りたたみ、そうでない場合は展開 */
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  /**
   * エクスポートボタン押下時の処理
   * パスワード入力モーダルを表示
   */
  const handleExportPress = useCallback(async () => {
    /* 何も選択されていない場合はエラー */
    if (totalSelected === 0) {
      const { showAlert } = await import('@utils/alerts');
      showAlert('', t('backup.no_selection'));
      return;
    }
    /* パスワードをクリアしてモーダルを表示 */
    setPassword('');
    setShowPasswordModal(true);
  }, [totalSelected, t]);

  /**
   * パスワード入力後のエクスポート実行処理
   */
  const handlePasswordSubmit = useCallback(async () => {
    /* パスワードが未入力の場合はエラー */
    if (!password.trim()) {
      const { showAlert } = await import('@utils/alerts');
      showAlert('', t('error.password_required'));
      return;
    }

    /* パスワードモーダルを閉じる */
    setShowPasswordModal(false);
    /* 親コンポーネントにエクスポート処理を委譲（SetをArrayに変換） */
    await onExport(
      password,
      Array.from(selectedSnippetIds),
      Array.from(selectedProfileIds),
      Array.from(selectedVariableIds),
      Array.from(selectedCategoryIds)
    );
    /* パスワードをクリア */
    setPassword('');
    /* モーダルを閉じる */
    onClose();
  }, [password, selectedSnippetIds, selectedProfileIds, selectedVariableIds, selectedCategoryIds, onExport, onClose, t]);

  /**
   * モーダルを閉じる処理
   * パスワードモーダルも含めて全て閉じる
   */
  const handleClose = useCallback(() => {
    setShowPasswordModal(false);
    setPassword('');
    onClose();
  }, [onClose]);

  /* メイン選択モーダル（z-50） */
  return (
    <>
      <Dialog open={isOpen} onClose={handleClose} className="relative z-50">
        {/* 背景オーバーレイ */}
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

        {/* モーダルコンテナ（中央配置） */}
        <div className="fixed inset-0 flex items-center justify-center p-4">
          {/* モーダルパネル（高さ80vh、flex列レイアウト） */}
          <Dialog.Panel className="w-full max-w-3xl h-[80vh] bg-white dark:bg-[#1A1A1A] rounded-2xl shadow-xl flex flex-col">
            {/* ヘッダー（タイトル、閉じるボタン、全選択ボタン） */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-[#2A2A2A]">
              <button
                onClick={handleClose}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <Dialog.Title className="text-xl font-bold text-gray-900 dark:text-white">
                {t('export_import.select_export_data')}
              </Dialog.Title>
              <button
                onClick={() => toggleSelectAll()}
                className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded transition-colors"
                title={isAllSelected() ? t('common.deselect_all') : t('common.select_all')}
              >
                {isAllSelected() ? (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth={2} />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth={2} />
                  </svg>
                )}
              </button>
            </div>

            {/* タブナビゲーション（定型文/プロファイル/変数/カテゴリ、選択数表示付き） */}
            <div className="flex border-b border-gray-200 dark:border-[#2A2A2A]">
              {TAB_OPTIONS.map((tab) => (
                /* タブボタン（選択数表示付き） */
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors flex flex-col items-center ${
                    activeTab === tab
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  <span>{t(`backup.tab_${tab}`)}</span>
                  <span className="text-xs mt-0.5">
                    ({tab === 'snippets'
                      ? selectedSnippetIds.size
                      : tab === 'profiles'
                      ? selectedProfileIds.size
                      : tab === 'variables'
                      ? selectedVariableIds.size
                      : selectedCategoryIds.size})
                  </span>
                </button>
              ))}
            </div>

            {/* コンテンツエリア（スクロール可能、タブに応じて表示内容を切り替え） */}
            <div className="flex-1 overflow-y-auto p-0">
              {activeTab === 'snippets' && (
                <div className="divide-y divide-gray-100 dark:divide-[#2A2A2A]">
                  {candidates.snippets.map((item) => {
                    /* 選択されているプロファイルのみフィルタリング */
                    const selectedProfiles = item.profiles.filter((p) => selectedProfileIds.has(p.profileId));
                    /* プロファイル名の配列（空の場合は「全てのプロファイル」） */
                    const filteredProfileNames = selectedProfiles.map((p) => p.profileName).filter(Boolean) as string[];
                    const profileNames = item.profiles.length === 0 || filteredProfileNames.length === 0
                      ? [t('snippet.all_profiles')]
                      : filteredProfileNames;

                    /* カテゴリが選択されているかチェック（選択されていない場合は未分類として表示） */
                    const isCategorySelected = item.categoryId ? selectedCategoryIds.has(item.categoryId) : false;
                    const displayCategoryName = isCategorySelected ? (item.categoryName || t('common.uncategorized')) : t('common.uncategorized');
                    const displayCategoryColor = isCategorySelected ? (item.categoryColor || '#3B82F6') : '#3B82F6';

                    /* 定型文アイテム（チェックボックス、タイトル、本文、カテゴリ・プロファイルバッジ、展開/折りたたみ） */
                    return (
                      <div key={item.id} className="p-4 flex items-start hover:bg-gray-50 dark:hover:bg-[#222] transition-colors">
                        {/* チェックボックス */}
                        <div className="flex items-center h-6 mr-4">
                          <input
                            type="checkbox"
                            checked={selectedSnippetIds.has(item.id)}
                            onChange={() => toggleSelection(item.id, 'snippets')}
                            className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300 dark:border-gray-600 dark:bg-[#333]"
                          />
                        </div>
                        {/* 定型文コンテンツ（クリックで展開/折りたたみ） */}
                        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => toggleSnippetExpand(item.id)}>
                          {/* タイトル行 */}
                          <div className="flex justify-between items-center mb-1">
                            {/* 定型文タイトル */}
                            <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {item.title || t('common.no_title')}
                            </h3>
                            {/* 展開/折りたたみアイコン */}
                            <svg
                              className={`w-4 h-4 text-gray-400 transition-transform duration-200 flex-shrink-0 ml-2 ${
                                expandedSnippetIds.has(item.id) ? 'rotate-180' : ''
                              }`}
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                          {/* 定型文本文（折りたたみ時は2行まで表示） */}
                          <p className={`text-sm text-gray-500 dark:text-gray-400 whitespace-pre-wrap ${expandedSnippetIds.has(item.id) ? '' : 'line-clamp-2'}`}>
                            {item.content}
                          </p>
                          {/* バッジ行（カテゴリ + プロファイル） */}
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {/* カテゴリバッジ */}
                            <span
                              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                              style={{
                                backgroundColor: `${displayCategoryColor}20`,
                                color: displayCategoryColor,
                              }}
                            >
                              {displayCategoryName}
                            </span>
                            {/* プロファイルバッジ */}
                            {profileNames.map((name, index) => (
                              <span
                                key={`profile-${index}`}
                                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-500 dark:bg-[#333] dark:text-gray-400"
                              >
                                {name}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* プロファイルタブ */}
              {activeTab === 'profiles' && (
                <div className="divide-y divide-gray-100 dark:divide-[#2A2A2A]">
                  {candidates.profiles.map((item) => (
                    /* プロファイルアイテム（チェックボックス、名前） */
                    <div key={item.id} className="p-4 flex items-center hover:bg-gray-50 dark:hover:bg-[#222] transition-colors">
                      {/* チェックボックス */}
                      <div className="flex items-center h-6 mr-4">
                        <input
                          type="checkbox"
                          checked={selectedProfileIds.has(item.id)}
                          onChange={() => toggleSelection(item.id, 'profiles')}
                          className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300 dark:border-gray-600 dark:bg-[#333]"
                        />
                      </div>
                      <div className="flex-1">
                        {/* プロファイル名 */}
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white">{item.name}</h3>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* 変数タブ */}
              {activeTab === 'variables' && (
                <div className="divide-y divide-gray-100 dark:divide-[#2A2A2A]">
                  {candidates.variables.map((item) => {
                    /* 選択されたプロファイルのみのprofileValuesをフィルタリング */
                    const filteredProfileValues = item.profileValues.filter((pv) =>
                      selectedProfileIds.has(pv.profileId)
                    );
                    /* 変数アイテム（チェックボックス、名前、ラベル、プロファイル値一覧、展開/折りたたみ） */
                    return (
                      <div key={item.id} className="p-4 flex items-start hover:bg-gray-50 dark:hover:bg-[#222] transition-colors">
                        {/* チェックボックス */}
                        <div className="flex items-center h-6 mr-4">
                          <input
                            type="checkbox"
                            checked={selectedVariableIds.has(item.id)}
                            onChange={() => toggleSelection(item.id, 'variables')}
                            className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300 dark:border-gray-600 dark:bg-[#333]"
                          />
                        </div>
                        {/* 変数コンテンツ（クリックで展開/折りたたみ） */}
                        <div className="flex-1 cursor-pointer" onClick={() => toggleVariableExpand(item.id)}>
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              {/* 展開/折りたたみアイコン */}
                              <svg
                                className={`w-4 h-4 text-gray-400 transition-transform duration-200 flex-shrink-0 ${
                                  expandedVariableIds.has(item.id) ? 'rotate-180' : ''
                                }`}
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                              {/* 変数名 */}
                              <h3 className="text-sm font-medium text-gray-900 dark:text-white">{item.name}</h3>
                            </div>
                          </div>
                          <div className="ml-6">
                            {/* 変数ラベル（オプション） */}
                            {item.label && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{item.label}</p>}

                            {/* プロファイル値一覧（展開時のみ表示） */}
                            {expandedVariableIds.has(item.id) && filteredProfileValues.length > 0 && (
                              <div className="mt-3 pl-4 border-l-2 border-gray-200 dark:border-[#333]">
                                {filteredProfileValues.map((pv, idx) => (
                                  /* プロファイル値行 */
                                  <div key={`${pv.profileId}-${idx}`} className="flex justify-between text-xs py-1">
                                    {/* プロファイル名 */}
                                    <span className="text-gray-500 dark:text-gray-400">{pv.profileName || t('profile.default_badge')}</span>
                                    {/* プロファイル値 */}
                                    <span className="text-gray-900 dark:text-gray-300 font-mono">{pv.value}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* カテゴリタブ */}
              {activeTab === 'categories' && (
                <div className="divide-y divide-gray-100 dark:divide-[#2A2A2A]">
                  {candidates.categories.map((item) => (
                    /* カテゴリアイテム（チェックボックス、カラーインジケーター、名前） */
                    <div key={item.id} className="p-4 flex items-center hover:bg-gray-50 dark:hover:bg-[#222] transition-colors">
                      {/* チェックボックス */}
                      <div className="flex items-center h-6 mr-4">
                        <input
                          type="checkbox"
                          checked={selectedCategoryIds.has(item.id)}
                          onChange={() => toggleSelection(item.id, 'categories')}
                          className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300 dark:border-gray-600 dark:bg-[#333]"
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center">
                          {/* カテゴリカラーインジケーター */}
                          <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: item.color || '#ccc' }}></span>
                          {/* カテゴリ名 */}
                          <h3 className="text-sm font-medium text-gray-900 dark:text-white">{item.name}</h3>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* フッター（キャンセル・エクスポートボタン） */}
            <div className="p-6 border-t border-gray-200 dark:border-[#2A2A2A] bg-gray-50 dark:bg-[#222] flex justify-end items-center">
              <div className="flex gap-3">
                {/* キャンセルボタン */}
                <button
                  onClick={handleClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-[#333] border border-gray-300 dark:border-[#444] rounded-lg hover:bg-gray-50 dark:hover:bg-[#444]"
                >
                  {t('common.cancel')}
                </button>
                {/* エクスポートボタン（選択数が0または処理中の場合のみ無効化、押下でパスワードモーダル表示） */}
                <button
                  onClick={handleExportPress}
                  disabled={totalSelected === 0 || isProcessing}
                  className={`px-6 py-2 text-sm font-medium text-white rounded-lg transition-colors ${
                    totalSelected === 0 || isProcessing
                      ? 'bg-blue-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 shadow-sm'
                  }`}
                >
                  {/* 処理中はスピナーとテキスト、それ以外は通常テキスト */}
                  {isProcessing ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Processing...
                    </span>
                  ) : (
                    t('export_import.export')
                  )}
                </button>
              </div>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* パスワード入力モーダル（z-60で選択モーダルより前面に表示） */}
      <Dialog open={showPasswordModal} onClose={() => setShowPasswordModal(false)} className="relative z-[60]">
        {/* 背景オーバーレイ */}
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        {/* モーダルコンテナ（中央配置） */}
        <div className="fixed inset-0 flex items-center justify-center p-4">
          {/* モーダルパネル */}
          <Dialog.Panel className="w-full max-w-md bg-white dark:bg-[#1A1A1A] rounded-2xl shadow-xl p-6">
            {/* タイトル */}
            <Dialog.Title className="text-lg font-bold text-gray-900 dark:text-white mb-2 text-center">
              {t('export_import.password_title')}
            </Dialog.Title>
            {/* 説明文 */}
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 text-center">
              {t('export_import.password_description')}
            </p>
            {/* パスワード入力欄（Enterキーでも送信可能） */}
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('export_import.password_placeholder')}
              autoFocus
              className="w-full px-4 py-3 border border-gray-300 dark:border-[#2A2A2A] rounded-xl focus:outline-none mb-4 bg-white dark:bg-[#1A1A1A] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-[#707070]"
              onKeyDown={(e) => {
                /* Enterキーが押されたら送信 */
                if (e.key === 'Enter' && password.trim()) {
                  handlePasswordSubmit();
                }
              }}
            />
            {/* ボタン群（キャンセル・OK） */}
            <div className="flex gap-3">
              {/* キャンセルボタン */}
              <button
                onClick={() => setShowPasswordModal(false)}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-[#333] border border-gray-300 dark:border-[#444] rounded-lg hover:bg-gray-50 dark:hover:bg-[#444]"
              >
                {t('common.cancel')}
              </button>
              {/* OKボタン（パスワード未入力または処理中は無効化） */}
              <button
                onClick={handlePasswordSubmit}
                disabled={!password.trim() || isProcessing}
                className={`flex-1 px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${
                  !password.trim() || isProcessing
                    ? 'bg-blue-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {/* 処理中は「処理中」、それ以外は「OK」 */}
                {isProcessing ? t('common.processing') : t('common.ok')}
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </>
  );
}
