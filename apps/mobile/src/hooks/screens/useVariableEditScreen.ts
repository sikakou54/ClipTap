/**
 * カスタム変数編集画面のビジネスロジックフック
 *
 * カスタム変数の新規作成・編集の全ての状態管理とロジックを提供。
 * UIコンポーネント（variable/edit.tsx）から完全に分離されたビジネスロジック層。
 *
 * 主な責務:
 * - 変数名、ラベル、アイコンの状態管理
 * - プロファイルごとの値管理
 * - バリデーション（変数名形式、予約語、重複チェック）
 * - 保存処理（新規作成/更新）
 * - アイコン選択モーダルの状態管理
 *
 * @see app/variable/edit.tsx - UIコンポーネント
 * @see lib/hooks/useVariables.tsx - 変数CRUD操作
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useFocusEffect } from 'expo-router';
import { useTranslation } from '@cliptap/shared';
import {
  RESERVED_VARIABLE_NAMES,
  useVariables,
  useProfiles,
  Profile,
  VariableNameRequiredError,
} from '@cliptap/shared';
import { UI_CONSTANTS, type VariableIconName } from '@constants/ui';
import { showConfirm, showErrorAlert } from '@utils/alerts';
import { translateError } from '@cliptap/shared';
import { Logger } from '@cliptap/shared';

/**
 * useVariableEditScreenの引数の型
 */
export interface UseVariableEditScreenParams {
  /** 編集対象の変数ID（新規作成時はundefined） */
  variableId?: string;
}

/**
 * useVariableEditScreenの戻り値の型
 */
export interface UseVariableEditScreenReturn {
  /* 状態 */
  name: string;
  setName: (name: string) => void;
  label: string;
  setLabel: (label: string) => void;
  value: string;
  selectedIcon: VariableIconName;
  setSelectedIcon: (icon: VariableIconName) => void;
  showIconModal: boolean;
  setShowIconModal: (show: boolean) => void;
  profileValues: Record<string, string>;

  /* 派生状態 */
  isEdit: boolean;
  canSave: boolean;
  isNameValid: boolean;
  nameErrorMessage: string;
  profiles: Profile[];

  /* ハンドラ */
  handleSave: () => Promise<void>;
  handleOpenValueEdit: (profile: Profile) => void;
  handleSelectIcon: (icon: VariableIconName) => void;
  getDisplayValue: (profile: Profile) => string;
}

/**
 * カスタム変数編集画面のビジネスロジックフック
 *
 * @param params - 画面パラメータ
 * @returns 画面に必要な全ての状態とハンドラ
 */
export function useVariableEditScreen(params: UseVariableEditScreenParams): UseVariableEditScreenReturn {
  const { variableId } = params;

  const { t } = useTranslation();
  const router = useRouter();

  const { variables, createVariable, updateVariable, setVariableValuesForVariable } = useVariables();
  const { profiles, profileVariables, defaultProfile, refresh: refreshProfiles } = useProfiles();

  /* ======================================== */
  /* 状態管理 */
  /* ======================================== */
  const [name, setName] = useState('');
  const [label, setLabel] = useState('');
  const [value, setValue] = useState('');
  const [selectedIcon, setSelectedIcon] = useState<VariableIconName>('code-outline');
  const [showIconModal, setShowIconModal] = useState(false);
  const [profileValues, setProfileValues] = useState<Record<string, string>>({});

  /* ======================================== */
  /* 派生状態 */
  /* ======================================== */
  const isEdit = !!variableId;
  /* カスタム変数のみ取得 */
  const customVariables = useMemo(
    () => variables.filter(v => v.type === 'custom'),
    [variables]
  );
  /* 編集対象の変数を検索 */
  const editingVariable = useMemo(
    () => customVariables.find(v => v.id === variableId),
    [customVariables, variableId]
  );

  /* ======================================== */
  /* バリデーション */
  /* ======================================== */

  /**
   * 変数名バリデーション
   * 長さ・予約語・重複・形式をチェック
   */
  const nameValidation = useMemo(() => {
    const trimmedName = name.trim();
    const maxLength = UI_CONSTANTS.INPUT_LIMITS.VARIABLE_NAME_MAX;

    if (!trimmedName) {
      return { isValid: true, errorMessage: '' };
    }

    if (trimmedName.length > maxLength) {
      return { isValid: false, errorMessage: t('error.variable_name_too_long', { max: maxLength }) };
    }

    if (RESERVED_VARIABLE_NAMES.includes(trimmedName)) {
      return { isValid: false, errorMessage: t('error.variable_name_reserved', { name: trimmedName }) };
    }

    const isDuplicate = variables.some(
      v => v.name === trimmedName && v.type === 'custom' && v.id !== editingVariable?.id
    );
    if (isDuplicate) {
      return { isValid: false, errorMessage: t('error.variable_name_exists', { name: trimmedName }) };
    }

    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(trimmedName)) {
      return { isValid: false, errorMessage: t('error.variable_name_invalid') };
    }

    return { isValid: true, errorMessage: '' };
  }, [name, variables, editingVariable, t]);

  const isNameValid = nameValidation.isValid;
  const nameErrorMessage = nameValidation.errorMessage;

  /**
   * 保存可能かどうか
   */
  const canSave = useMemo(() => {
    if (!name.trim()) return false;
    if (!label.trim()) return false;
    if (!isNameValid) return false;
    const hasStandardValue = value.trim() !== '';
    const hasProfileValue = Object.values(profileValues).some((val) => val.trim() !== '');
    return hasStandardValue || hasProfileValue;
  }, [name, label, isNameValid, value, profileValues]);

  /* ======================================== */
  /* 初期化 */
  /* ======================================== */
  useEffect(() => {
    /* プロファイル値の初期化ヘルパー */
    const initProfileValues = (getValueFor: (profileId: string) => string) => {
      const values: Record<string, string> = {};
      profiles.forEach((profile: Profile) => {
        values[profile.id] = getValueFor(profile.id);
      });
      return values;
    };

    if (editingVariable) {
      /* 編集モード: 既存変数のデータをフォームに反映 */
      setName(editingVariable.name);
      setLabel(editingVariable.label || '');
      setSelectedIcon((editingVariable.icon || 'code-outline') as VariableIconName);

      /* 標準値を取得 */
      const defaultPv = defaultProfile
        ? profileVariables.find(pv => pv.profileId === defaultProfile.id && pv.variableId === editingVariable.id)
        : undefined;
      setValue(defaultPv?.value || '');

      /* 各プロファイルから変数値を取得 */
      setProfileValues(initProfileValues((profileId) => {
        const pv = profileVariables.find(
          pv => pv.profileId === profileId && pv.variableId === editingVariable.id
        );
        return pv?.value || '';
      }));
    } else {
      /* 新規作成モード: フォームを空にリセット */
      setName('');
      setLabel('');
      setValue('');
      setSelectedIcon('code-outline');
      setProfileValues(initProfileValues(() => ''));
    }
  }, [variableId, profiles, profileVariables, defaultProfile, editingVariable]);

  /* ======================================== */
  /* 画面フォーカス時の処理（コールバックデータ処理） */
  /* ======================================== */
  useFocusEffect(
    useCallback(() => {
      if (global.variableValueCallbackData) {
        const { profileId, isStandard, newValue } = global.variableValueCallbackData;

        Logger.info('[VariableEdit] Received callback data:', { profileId, isStandard, newValue });

        if (isStandard === 'true' || isStandard === true) {
          Logger.info('[VariableEdit] Setting standard value:', newValue);
          setValue(newValue);
        } else {
          Logger.info('[VariableEdit] Setting profile value:', { profileId, newValue });
          setProfileValues((prev) => ({
            ...prev,
            [profileId]: newValue,
          }));
        }

        global.variableValueCallbackData = undefined;
      }
    }, [])
  );

  /* ======================================== */
  /* イベントハンドラ */
  /* ======================================== */

  /**
   * 値編集モーダルを開く
   */
  const handleOpenValueEdit = useCallback(
    (profile: Profile) => {
      try {
        /* 変数名が空の場合 */
        if (!name.trim()) {
          throw new VariableNameRequiredError();
        }

        router.push({
          pathname: '/variable/profile-value-edit',
          params: {
            profileId: profile.id,
            variableName: name.trim(),
            profileName: profile.name,
            isStandard: profile.isDefault ? 'true' : 'false',
            currentValue: profile.isDefault ? value : profileValues[profile.id] || '',
          },
        });
      } catch (error) {
        showErrorAlert(translateError(error));
      }
    },
    [name, value, profileValues, router, t]
  );

  /**
   * アイコン選択
   */
  const handleSelectIcon = useCallback((icon: VariableIconName) => {
    setSelectedIcon(icon);
    setShowIconModal(false);
  }, []);

  /**
   * プロファイルの表示値を取得
   */
  const getDisplayValue = useCallback(
    (profile: Profile): string => {
      return profile.isDefault ? value : profileValues[profile.id] || '';
    },
    [value, profileValues]
  );

  /**
   * 実際の保存処理
   */
  const performSave = useCallback(async () => {
    try {
      /* デフォルトプロファイルが見つからない場合 */
      if (!defaultProfile) {
        throw new Error('Default profile not found');
      }

      let savedVariable;
      if (isEdit && editingVariable) {
        /* 更新 */
        savedVariable = updateVariable(editingVariable.id, {
          name: name.trim(),
          label: label.trim() || null,
          icon: selectedIcon,
        });
      } else {
        /* 作成 */
        savedVariable = createVariable({
          name: name.trim(),
          label: label.trim() || undefined,
          icon: selectedIcon,
        });
      }

      /* 全プロファイルの変数値を保存 */
      const valuesToSave = profiles.map(profile => ({
        profileId: profile.id,
        variableId: savedVariable.id,
        value: profile.isDefault ? value.trim() : (profileValues[profile.id] || ''),
      }));

      /* 変数値を設定 */
      setVariableValuesForVariable(savedVariable.id, valuesToSave);
      /* ProfileProviderを更新（profileVariablesが変更されるため） */
      refreshProfiles();

      router.back();
      } catch (error) {
        showErrorAlert(translateError(error));
      }
  }, [
    defaultProfile,
    isEdit,
    editingVariable,
    name,
    label,
    selectedIcon,
    profiles,
    profileValues,
    value,
    createVariable,
    updateVariable,
    setVariableValuesForVariable,
    refreshProfiles,
    router,
    t,
  ]);

  /**
   * 保存ボタン押下時の処理
   */
  const handleSave = useCallback(async () => {
    /* 保存不可の場合 */
    if (!canSave) return;

    const standardValue = value.trim();
    /* 標準値が空の場合 */
    if (!standardValue) {
      /* 「標準値が空ですが保存しますか？」警告 */
      showConfirm(t('variables.standard_value_empty_warning'), () => performSave(), undefined, 'warning');
      return;
    }

    await performSave();
  }, [canSave, value, performSave, t]);

  /* ======================================== */
  /* 戻り値 */
  /* ======================================== */
  return {
    /* 状態 */
    name,
    setName,
    label,
    setLabel,
    value,
    selectedIcon,
    setSelectedIcon,
    showIconModal,
    setShowIconModal,
    profileValues,

    /* 派生状態 */
    isEdit,
    canSave,
    isNameValid,
    nameErrorMessage,
    profiles,

    /* ハンドラ */
    handleSave,
    handleOpenValueEdit,
    handleSelectIcon,
    getDisplayValue,
  };
}
