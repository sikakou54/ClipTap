/**
 * プロファイル別変数値編集画面のビジネスロジックフック
 *
 * カスタム変数の値をプロファイル（環境）ごとに編集する画面の状態管理とロジックを提供。
 * UIコンポーネント（variable/profile-value-edit.tsx）から完全に分離されたビジネスロジック層。
 *
 * 主な責務:
 * - 変数値の状態管理
 * - 自動フォーカス処理
 * - 保存処理（既存変数の場合は直接保存、未作成の場合はコールバック）
 *
 * @see app/variable/profile-value-edit.tsx - UIコンポーネント
 * @see lib/hooks/useVariables.tsx - 変数CRUD操作
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from '@cliptap/shared';
import { useProfiles, useVariables } from '@cliptap/shared';
import { showErrorAlert } from '@utils/alerts';
import { Logger } from '@cliptap/shared';
import { translateError } from '@cliptap/shared';

/**
 * useProfileValueEditScreenの引数の型
 */
export interface UseProfileValueEditScreenParams {
  /** 対象のプロファイルID */
  profileId: string;
  /** 変数名（表示用） */
  variableName: string;
  /** プロファイル名（タイトル表示用） */
  profileName: string;
  /** 標準値かどうか */
  isStandard: boolean;
  /** 現在の値 */
  currentValue: string;
}

/**
 * useProfileValueEditScreenの戻り値の型
 */
export interface UseProfileValueEditScreenReturn {
  /* 状態 */
  value: string;
  setValue: (value: string) => void;
  textInputRef: React.RefObject<TextInput | null>;

  /* パラメータから取得した情報 */
  variableName: string;
  profileName: string;
  isStandard: boolean;

  /* ハンドラ */
  handleSave: () => Promise<void>;
}

/**
 * プロファイル別変数値編集画面のビジネスロジックフック
 *
 * @param params - 画面パラメータ
 * @returns 画面に必要な全ての状態とハンドラ
 */
export function useProfileValueEditScreen(params: UseProfileValueEditScreenParams): UseProfileValueEditScreenReturn {
  const { profileId, variableName, profileName, isStandard, currentValue } = params;

  const { t } = useTranslation();
  const router = useRouter();

  const { defaultProfile, refresh: refreshProfiles } = useProfiles();
  const { variables, setVariableValuesForVariable } = useVariables();

  /* ======================================== */
  /* 状態管理 */
  /* ======================================== */
  const [value, setValue] = useState('');
  const textInputRef = useRef<TextInput>(null);

  /* ======================================== */
  /* 初期値設定 */
  /* ======================================== */
  useEffect(() => {
    setValue(currentValue);
  }, [currentValue]);

  /* ======================================== */
  /* 自動フォーカス */
  /* ======================================== */
  useEffect(() => {
    setTimeout(() => {
      textInputRef.current?.focus();
    }, 100);
  }, []);

  /* ======================================== */
  /* イベントハンドラ */
  /* ======================================== */

  /**
   * 保存処理
   * 変数が未作成の場合はコールバックで値を返す
   * 既存変数の場合はDBに保存してコールバックで画面更新を通知
   */
  const handleSave = useCallback(async () => {
    try {
      const variable = variables.find(v => v.name === variableName && v.type === 'custom');

      if (!variable) {
        Logger.info(
          '[ProfileValueEdit] Variable not yet created, returning value to edit screen'
        );
        Logger.info('[ProfileValueEdit] Callback data:', {
          profileId,
          isStandard,
          value,
        });
        global.variableValueCallbackData = {
          profileId: profileId,
          isStandard: isStandard,
          newValue: value,
        };
        Logger.info(
          '[ProfileValueEdit] Set global.variableValueCallbackData:',
          global.variableValueCallbackData
        );
        router.back();
        return;
      }

      const targetProfileId = isStandard
        ? defaultProfile?.id || profileId
        : profileId;

      /* 変数値を設定 */
      setVariableValuesForVariable(variable.id, [{
        profileId: targetProfileId,
        variableId: variable.id,
        value: value,
      }]);
      /* ProfileProviderを更新（profileVariablesが変更されるため） */
      refreshProfiles();

      Logger.info('[ProfileValueEdit] Setting callback data for existing variable:', {
        profileId,
        isStandard,
        value,
      });
      global.variableValueCallbackData = {
        profileId: profileId,
        isStandard: isStandard,
        newValue: value,
      };

      router.back();
    } catch (error) {
      Logger.error('Failed to save variable value:', error);
      showErrorAlert(translateError(error));
    }
  }, [
    value,
    variableName,
    profileId,
    isStandard,
    defaultProfile,
    variables,
    setVariableValuesForVariable,
    refreshProfiles,
    router,
    t,
  ]);

  /* ======================================== */
  /* 戻り値 */
  /* ======================================== */
  return {
    /* 状態 */
    value,
    setValue,
    textInputRef,

    /* パラメータから取得した情報 */
    variableName,
    profileName,
    isStandard,

    /* ハンドラ */
    handleSave,
  };
}
