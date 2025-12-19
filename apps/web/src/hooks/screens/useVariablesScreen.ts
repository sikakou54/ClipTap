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

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from '@cliptap/shared';
import {
  useProfiles,
  useVariables,
  UI_SYSTEM_VARIABLES,
  FREE_VARIABLES_LIMIT,
  type Variable,
  type Profile,
  type ProfileVariable,
} from '@cliptap/shared';
import { useSubscription } from '@services/SubscriptionService';

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
  getVariableValue: (variableId: string) => string;
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
  const { isSubscribed } = useSubscription();

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

  /* 変数追加可否を判定 */
  const canAddVariable = isSubscribed || customVariables.length < FREE_VARIABLES_LIMIT;

  /* システム変数 */
  const systemVariables = UI_SYSTEM_VARIABLES;

  /* ======================================== */
  /* 副作用 */
  /* ======================================== */

  /* profilesが読み込まれたらデフォルトプロファイルを選択 */
  useEffect(() => {
    if (profiles.length > 0 && selectedProfileId === null) {
      const defaultProfile = profiles.find(p => p.isDefault);
      setSelectedProfileId(defaultProfile?.id ?? profiles[0].id);
    }
  }, [profiles, selectedProfileId]);

  /* ======================================== */
  /* ハンドラ */
  /* ======================================== */

  /** 変数の値を取得（選択された環境に応じて） */
  const getVariableValue = useCallback((variableId: string): string => {
    if (!selectedProfileId) return t('common.not_set');

    const pv = profileVariables.find(
      pv => pv.profileId === selectedProfileId && pv.variableId === variableId
    );

    if (pv?.value) {
      return pv.value;
    }

    /* デフォルト環境の値をフォールバック */
    const defaultProfile = profiles.find(p => p.isDefault);
    if (defaultProfile && defaultProfile.id !== selectedProfileId) {
      const defaultPv = profileVariables.find(
        pv => pv.profileId === defaultProfile.id && pv.variableId === variableId
      );
      if (defaultPv?.value) {
        return defaultPv.value;
      }
    }

    return t('common.not_set');
  }, [selectedProfileId, profileVariables, profiles, t]);

  /** 変数追加モーダルを開く */
  const handleAdd = useCallback(() => {
    if (!canAddVariable) {
      setError(t('settings.variable_limit_message', { limit: FREE_VARIABLES_LIMIT }));
      return;
    }
    setEditingVariableId(null);
    setIsEditModalOpen(true);
  }, [canAddVariable, t]);

  /** 変数編集モーダルを開く */
  const handleEdit = useCallback((variableId: string) => {
    const variable = customVariables.find(v => v.id === variableId);
    if (!variable) return;

    /* 無効な変数をクリックした場合はエラーメッセージを表示 */
    if (!variable.valid) {
      setError(t('settings.variable_disabled_message'));
      setTimeout(() => setError(''), 5000);
      return;
    }

    setEditingVariableId(variableId);
    setIsEditModalOpen(true);
  }, [customVariables, t]);

  /** 変数を削除 */
  const handleDelete = useCallback(async (id: string) => {
    const variable = customVariables.find(v => v.id === id);
    const { showConfirmMessage } = await import('@utils/alerts');
    const message = t('settings.delete_variable_confirm', { name: variable?.name || '' });
    showConfirmMessage(message, async () => {
      try {
        await deleteVariable(id);
      } catch (err) {
        console.error('Failed to delete variable:', err);
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
