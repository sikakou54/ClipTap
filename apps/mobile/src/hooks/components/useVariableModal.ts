/**
 * 変数作成・編集モーダルのビジネスロジックフック
 *
 * 変数モーダルに必要な状態管理とロジックを提供。
 * UIコンポーネント（VariableModal.tsx）から完全に分離されたビジネスロジック層。
 *
 * 主な責務:
 * - フォーム状態管理（名前、ラベル、値、アイコン）
 * - バリデーション（予約語、重複、形式）
 * - 保存処理
 *
 * @see components/variable/VariableModal.tsx - UIコンポーネント
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from '@cliptap/shared';
import { Variable, RESERVED_VARIABLE_NAMES, useVariables, useProfiles } from '@cliptap/shared';
import { UI_CONSTANTS, type VariableIconName } from '@constants/ui';

/**
 * useVariableModalのProps
 * @property visible - モーダル表示状態
 * @property editingVariable - 編集対象の変数（nullなら新規作成）
 * @property onSave - 保存時のコールバック
 * @property onClose - 閉じる時のコールバック
 */
export interface UseVariableModalProps {
  visible: boolean;
  editingVariable: Variable | null;
  onSave: (name: string, value: string, label: string, icon: string) => void;
  onClose: () => void;
}

/**
 * useVariableModalの戻り値の型
 */
export interface UseVariableModalReturn {
  /* 状態 */
  name: string;
  label: string;
  value: string;
  selectedIcon: VariableIconName;

  /* バリデーション */
  isNameValid: boolean;
  nameErrorMessage: string;
  canSave: boolean;

  /* ハンドラ */
  setName: (name: string) => void;
  setLabel: (label: string) => void;
  setValue: (value: string) => void;
  setSelectedIcon: (icon: VariableIconName) => void;
  handleSave: () => void;
}

/**
 * 変数作成・編集モーダルのビジネスロジックフック
 *
 * @param props - モーダルの表示状態と各種コールバック
 * @returns モーダルに必要な全ての状態とハンドラ
 */
export function useVariableModal({
  visible,
  editingVariable,
  onSave,
  onClose,
}: UseVariableModalProps): UseVariableModalReturn {
  const { t } = useTranslation();
  const { variables } = useVariables();
  const { profileVariables, defaultProfile } = useProfiles();

  /* 状態管理 */
  const [name, setName] = useState('');
  const [originalName, setOriginalName] = useState('');
  const [label, setLabel] = useState('');
  const [value, setValue] = useState('');
  const [selectedIcon, setSelectedIcon] = useState<VariableIconName>('code-outline');

  /**
   * モーダル表示時のフォーム初期化
   */
  useEffect(() => {
    if (editingVariable) {
      setName(editingVariable.name);
      setOriginalName(editingVariable.name);
      setLabel(editingVariable.label || '');
      const pv = defaultProfile
        ? profileVariables.find(pv => pv.profileId === defaultProfile.id && pv.variableId === editingVariable.id)
        : undefined;
      setValue(pv?.value || '');
      setSelectedIcon((editingVariable.icon as VariableIconName) || 'code-outline');
    } else {
      setName('');
      setOriginalName('');
      setLabel('');
      setValue('');
      setSelectedIcon('code-outline');
    }
  }, [editingVariable, visible, profileVariables, defaultProfile]);

  /**
   * 予約語チェック
   */
  const isReservedName = useMemo(() => {
    return RESERVED_VARIABLE_NAMES.includes(name.trim());
  }, [name]);

  /**
   * 重複チェック
   */
  const isDuplicateName = useMemo(() => {
    if (!name.trim()) return false;
    if (editingVariable && name.trim() === originalName) return false;
    const existingVariable = variables.find(v =>
      v.name === name.trim() && v.type === 'custom' && v.id !== editingVariable?.id
    );
    return !!existingVariable;
  }, [name, editingVariable, originalName, variables]);

  /**
   * 変数名のバリデーション
   */
  const isNameValid = useMemo(() => {
    if (!name.trim()) return true;
    if (name.length > UI_CONSTANTS.INPUT_LIMITS.VARIABLE_NAME_MAX) return false;
    if (isReservedName) return false;
    if (isDuplicateName) return false;
    return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name);
  }, [name, isReservedName, isDuplicateName]);

  /**
   * エラーメッセージを取得
   */
  const nameErrorMessage = useMemo(() => {
    if (!name.trim()) return '';
    if (name.length > UI_CONSTANTS.INPUT_LIMITS.VARIABLE_NAME_MAX) {
      return t('error.variable_name_too_long', { max: UI_CONSTANTS.INPUT_LIMITS.VARIABLE_NAME_MAX });
    }
    if (isReservedName) {
      return t('error.variable_name_reserved', { name });
    }
    if (isDuplicateName) {
      return t('error.variable_name_exists', { name });
    }
    if (!isNameValid) {
      return t('error.variable_name_invalid');
    }
    return '';
  }, [name, isReservedName, isDuplicateName, isNameValid, t]);

  /**
   * 保存ボタンの有効/無効を判定
   */
  const canSave = useMemo(() => {
    if (!name.trim() || !value.trim()) return false;
    if (!isNameValid) return false;
    if (isReservedName) return false;
    return true;
  }, [name, value, isNameValid, isReservedName]);

  /**
   * 保存処理
   */
  const handleSave = useCallback(() => {
    if (!canSave) return;

    onSave(name.trim(), value.trim(), label.trim(), selectedIcon);
    onClose();
  }, [canSave, name, value, label, selectedIcon, onSave, onClose]);

  return {
    name,
    label,
    value,
    selectedIcon,
    isNameValid,
    nameErrorMessage,
    canSave,
    setName,
    setLabel,
    setValue,
    setSelectedIcon,
    handleSave,
  };
}
