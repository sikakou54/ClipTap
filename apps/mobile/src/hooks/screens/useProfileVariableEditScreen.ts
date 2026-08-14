/**
 * プロファイル変数編集画面のビジネスロジックフック
 *
 * 特定のプロファイル（環境）に対する変数値を編集する画面の状態管理とロジックを提供。
 * UIコンポーネント（profile/variable-edit.tsx）から完全に分離されたビジネスロジック層。
 *
 * 主な責務:
 * - 変数名・変数値の状態管理
 * - 既存変数の読み込み
 * - バリデーション（変数名形式、空チェック）
 * - 保存処理（新規作成/更新）
 *
 * @see app/profile/variable-edit.tsx - UIコンポーネント
 * @see lib/hooks/useVariables.tsx - 変数CRUD操作
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'expo-router';
import {
  useProfiles,
  useVariables,
  VariableNameRequiredError,
  VariableValueRequiredError,
  VariableNameInvalidError,
} from '@cliptap/shared';
import { showErrorAlert } from '@utils/alerts';
import { translateError } from '@cliptap/shared';

/**
 * useProfileVariableEditScreenの引数の型
 */
interface UseProfileVariableEditScreenParams {
  /** 対象のプロファイルID */
  profileId: string;
  /** 編集対象の変数ID（新規作成時はundefined） */
  variableId?: string;
}

/**
 * useProfileVariableEditScreenの戻り値の型
 */
export interface UseProfileVariableEditScreenReturn {
  /* 状態 */
  variableName: string;
  setVariableName: (name: string) => void;
  variableValue: string;
  setVariableValue: (value: string) => void;
  saving: boolean;

  /* 派生状態 */
  isEdit: boolean;
  canSave: boolean;

  /* ハンドラ */
  handleSave: () => Promise<void>;
}

/**
 * プロファイル変数編集画面のビジネスロジックフック
 *
 * @param params - 画面パラメータ
 * @returns 画面に必要な全ての状態とハンドラ
 */
export function useProfileVariableEditScreen(params: UseProfileVariableEditScreenParams): UseProfileVariableEditScreenReturn {
  const { profileId, variableId: profileVariableId } = params;

  const router = useRouter();

  const { profileVariables, refresh: refreshProfiles } = useProfiles();
  const { variables, createVariable, setVariableValuesForVariable } = useVariables();

  /* ======================================== */
  /* 状態管理 */
  /* ======================================== */
  const [variableName, setVariableName] = useState('');
  const [variableValue, setVariableValue] = useState('');
  const [variableId, setVariableId] = useState<string | undefined>(undefined);
  const [saving, setSaving] = useState(false);

  /* ======================================== */
  /* 派生状態 */
  /* ======================================== */
  const isEdit = !!profileVariableId;

  /* ======================================== */
  /* 派生状態 */
  /* ======================================== */
  const canSave = useMemo(
    () => variableName.trim() !== '' && variableValue.trim() !== '',
    [variableName, variableValue]
  );

  /* ======================================== */
  /* 初期化（編集モード時） */
  /* ======================================== */
  useEffect(() => {
    if (profileVariableId && profileId) {
      /* プロファイル変数一覧から編集対象を検索 */
      const profileVariable = profileVariables.find(
        pv => pv.id === profileVariableId
      );

      if (profileVariable) {
        /* カスタム変数一覧から対応する変数メタデータを検索 */
        const variable = variables.find(
          v => v.id === profileVariable.variableId && v.type === 'custom'
        );
        if (variable) {
          setVariableName(variable.name);
          setVariableId(variable.id);
        }
        setVariableValue(profileVariable.value);
      }
    }
  }, [profileVariableId, profileId, profileVariables, variables]);

  /* ======================================== */
  /* イベントハンドラ */
  /* ======================================== */

  /**
   * 保存処理
   * バリデーション後、新規作成または既存変数の更新を実行
   */
  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      if (!variableName.trim()) {
        throw new VariableNameRequiredError();
      }

      if (!variableValue.trim()) {
        throw new VariableValueRequiredError();
      }

      const namePattern = /^[a-zA-Z0-9_]+$/;
      if (!namePattern.test(variableName)) {
        throw new VariableNameInvalidError(variableName);
      }

      let savedVariable;
      if (variableId) {
        savedVariable = variables.find(v => v.id === variableId && v.type === 'custom');
        if (!savedVariable) {
          throw new Error('Variable not found');
        }
      } else {
        savedVariable = createVariable({ name: variableName.trim() });
      }

      /* 変数値を設定 */
      setVariableValuesForVariable(savedVariable.id, [{
        profileId: profileId,
        variableId: savedVariable.id,
        value: variableValue.trim(),
      }]);
      /* ProfileProviderを更新（profileVariablesが変更されるため） */
      refreshProfiles();

      router.back();
    } catch (error) {
      showErrorAlert(translateError(error));
    } finally {
      setSaving(false);
    }
  }, [
    variableName,
    variableValue,
    variableId,
    profileId,
    variables,
    createVariable,
    setVariableValuesForVariable,
    refreshProfiles,
    router,
  ]);

  /* ======================================== */
  /* 戻り値 */
  /* ======================================== */
  return {
    /* 状態 */
    variableName,
    setVariableName,
    variableValue,
    setVariableValue,
    saving,

    /* 派生状態 */
    isEdit,
    canSave,

    /* ハンドラ */
    handleSave,
  };
}
