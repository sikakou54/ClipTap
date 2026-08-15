/**
 * 変数管理画面のビジネスロジックフック
 *
 * システム変数の一覧表示と、カスタム変数のCRUD操作を提供。
 * UIコンポーネント（VariableManage.tsx）から完全に分離されたビジネスロジック層。
 *
 * 主な責務:
 * - 変数一覧の取得（システム変数・カスタム変数）
 * - カスタム変数の作成・編集・削除
 * - プロファイル選択と変数値の取得
 * - サブスクリプション制限チェック
 *
 * @see pages/VariableManage.tsx - UIコンポーネント
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useTranslation } from '@cliptap/shared';
import {
  Logger,
  useProfiles,
  useVariables,
  UI_SYSTEM_VARIABLES,
  FREE_VARIABLES_LIMIT,
  useSharedSubscription,
  type Variable,
  type Profile,
  type ProfileVariable,
} from '@cliptap/shared';
import { showConfirmMessage } from '@utils/alerts';

/** エラーメッセージを自動的に消すまでの待ち時間（ミリ秒） */
const ERROR_AUTO_DISMISS_MS = 5000;

/** システム変数の型 */
export type SystemVariable = typeof UI_SYSTEM_VARIABLES[number];

/**
 * useVariablesScreenの戻り値の型
 */
export interface UseVariablesScreenReturn {
  /* データ */
  profiles: Profile[];
  profileVariables: ProfileVariable[];
  customVariables: Variable[];
  systemVariables: readonly SystemVariable[];
  isSubscribed: boolean;
  canAddVariable: boolean;

  /* 状態 */
  error: string;
  selectedProfileId: string | null;
  isEditModalOpen: boolean;
  editingVariableId: string | null;

  /* セッター */
  setSelectedProfileId: (id: string | null) => void;

  /* ハンドラ */
  /** 変数の表示値。未設定の場合は null */
  getVariableValue: (variableId: string) => string | null;
  handleAdd: () => void;
  handleEdit: (variableId: string) => void;
  handleDelete: (id: string) => Promise<void>;
  handleCloseModal: () => void;
}

/**
 * 変数管理画面のビジネスロジックフック
 *
 * @returns 画面に必要な全ての状態とハンドラ
 */
export function useVariablesScreen(): UseVariablesScreenReturn {
  const { t } = useTranslation();
  const { profiles, profileVariables } = useProfiles();
  const { variables, deleteVariable } = useVariables();
  const { isSubscribed, canAddCustomVariable } = useSharedSubscription();

  /* ======================================== */
  /* 状態 */
  /* ======================================== */
  const [error, setError] = useState('');
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingVariableId, setEditingVariableId] = useState<string | null>(null);

  /* ======================================== */
  /* 派生状態 */
  /* ======================================== */

  /* カスタム変数のみ抽出 */
  const customVariables = useMemo(
    () => variables.filter(v => v.type === 'custom'),
    [variables]
  );

  /* 変数追加可否を判定（保存済みのカスタム変数総数で判定する） */
  const canAddVariable = canAddCustomVariable(customVariables.length);

  /* システム変数 */
  const systemVariables = UI_SYSTEM_VARIABLES;

  /* 標準環境（変数値のフォールバック先） */
  const defaultProfile = useMemo(() => profiles.find(p => p.isDefault) ?? null, [profiles]);

  /* ======================================== */
  /* 副作用 */
  /* ======================================== */

  /* profilesが読み込まれたらデフォルトプロファイルを選択 */
  useEffect(() => {
    if (profiles.length > 0 && selectedProfileId === null) {
      setSelectedProfileId(defaultProfile?.id ?? profiles[0].id);
    }
  }, [profiles, selectedProfileId, defaultProfile]);

  /* ======================================== */
  /* ハンドラ */
  /* ======================================== */

  /** 自動消去タイマー。新しいメッセージや画面離脱で前のタイマーを止める */
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /** エラー表示を更新する。autoDismiss=true のときだけ ERROR_AUTO_DISMISS_MS 後に自動で消す */
  const updateError = useCallback((message: string, autoDismiss = false) => {
    if (dismissTimerRef.current) {
      clearTimeout(dismissTimerRef.current);
    }
    dismissTimerRef.current = null;
    setError(message);
    if (autoDismiss && message) {
      dismissTimerRef.current = setTimeout(() => setError(''), ERROR_AUTO_DISMISS_MS);
    }
  }, []);

  /* アンマウント時に自動消去タイマーを止める */
  useEffect(() => () => {
    if (dismissTimerRef.current) {
      clearTimeout(dismissTimerRef.current);
    }
  }, []);

  /**
   * 変数の値を取得（選択された環境に応じて）
   *
   * @remarks
   * 選択環境の非空値 → 標準環境の非空値 → null（未設定）の順に解決する。
   * この順序はモバイルの変数管理画面と同一で、§8.6 の解決順に合わせている。
   * 未設定を翻訳済みの表示文字列で表さないのは、値として「未設定」を登録した変数が
   * 未設定として描画されてしまうため。表示文言への変換は呼び出し側が行う。
   */
  const getVariableValue = useCallback((variableId: string): string | null => {
    /* 選択環境の値（環境が未選択のときは標準環境だけを見る） */
    const profileValue = selectedProfileId
      ? profileVariables.find(
          pv => pv.profileId === selectedProfileId && pv.variableId === variableId
        )?.value || ''
      : '';
    if (profileValue) {
      return profileValue;
    }

    /* 標準環境の値をフォールバック */
    const standardValue = defaultProfile
      ? profileVariables.find(
          pv => pv.profileId === defaultProfile.id && pv.variableId === variableId
        )?.value || ''
      : '';
    if (standardValue) {
      return standardValue;
    }

    return null;
  }, [selectedProfileId, profileVariables, defaultProfile]);

  /** 変数追加モーダルを開く */
  const handleAdd = useCallback(() => {
    if (!canAddVariable) {
      updateError(t('settings.variable_limit_message', { limit: FREE_VARIABLES_LIMIT }));
      return;
    }
    setEditingVariableId(null);
    setIsEditModalOpen(true);
  }, [canAddVariable, t, updateError]);

  /** 変数編集モーダルを開く */
  const handleEdit = useCallback((variableId: string) => {
    const variable = customVariables.find(v => v.id === variableId);
    if (!variable) return;

    /* 無効な変数をクリックした場合はエラーメッセージを表示 */
    if (!variable.valid) {
      updateError(t('settings.variable_disabled_message'), true);
      return;
    }

    setEditingVariableId(variableId);
    setIsEditModalOpen(true);
  }, [customVariables, t, updateError]);

  /** 変数を削除 */
  const handleDelete = useCallback(async (id: string) => {
    const variable = customVariables.find(v => v.id === id);
    const message = t('settings.delete_variable_confirm', { name: variable?.name || '' });
    showConfirmMessage(message, async () => {
      try {
        await deleteVariable(id);
      } catch (err) {
        Logger.error('Failed to delete variable:', err);
      }
    });
  }, [customVariables, deleteVariable, t]);

  /** モーダルを閉じる */
  const handleCloseModal = useCallback(() => {
    setIsEditModalOpen(false);
    setEditingVariableId(null);
  }, []);

  /* ======================================== */
  /* 戻り値 */
  /* ======================================== */
  return {
    /* データ */
    profiles,
    profileVariables,
    customVariables,
    systemVariables,
    isSubscribed,
    canAddVariable,

    /* 状態 */
    error,
    selectedProfileId,
    isEditModalOpen,
    editingVariableId,

    /* セッター */
    setSelectedProfileId,

    /* ハンドラ */
    getVariableValue,
    handleAdd,
    handleEdit,
    handleDelete,
    handleCloseModal,
  };
}
