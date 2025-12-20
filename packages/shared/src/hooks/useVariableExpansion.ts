/**
 * 変数展開フック
 *
 * @description
 * テキスト内の変数を展開するためのカスタムフック。
 * VariableService.expandTextSyncを使用して同期的に変数を展開する。
 * Mobile/Web両方で使用可能。
 */

import { useCallback, useMemo } from 'react';
import { VariableService } from '../services';
import type { Variable, ProfileVariable } from '../types';

export interface UseVariableExpansionParams {
  /** 全変数の配列 */
  variables: Variable[];
  /** プロファイル変数の配列 */
  profileVariables: ProfileVariable[];
  /** 現在のロケール（例: 'ja', 'en'） */
  locale?: string;
}

export interface UseVariableExpansionReturn {
  /** テキスト内の変数を展開する関数 */
  expandVariables: (text: string, profileId: string | null, defaultProfileId: string | null) => string;
  /** 有効な変数のみ */
  validVariables: Variable[];
}

/**
 * 変数展開フック
 */
export function useVariableExpansion({
  variables,
  profileVariables,
  locale = 'ja',
}: UseVariableExpansionParams): UseVariableExpansionReturn {
  /* validフラグがtrueの変数のみを変数展開の対象とする */
  const validVariables = useMemo(
    () => variables.filter((v) => v.valid),
    [variables]
  );

  /* 指定されたプロファイルIDに基づいて、テキスト内の変数を値に置換する */
  const expandVariables = useCallback(
    (text: string, profileId: string | null, defaultProfileId: string | null): string => {
      /* 選択されたプロファイルの変数マップを構築 */
      const profileVariablesMap = VariableService.buildProfileVariablesMapFromArrays(
        profileId,
        variables,
        profileVariables
      );

      /* デフォルトプロファイルの変数マップを構築（フォールバック用） */
      const defaultProfileVariablesMap = VariableService.buildProfileVariablesMapFromArrays(
        defaultProfileId,
        variables,
        profileVariables
      );

      /* {{変数名}} を実際の値に置換 */
      return VariableService.expandTextSync(text, {
        locale,
        profileVariablesMap,
        defaultProfileVariablesMap,
        variables: validVariables,
      });
    },
    [variables, profileVariables, validVariables, locale]
  );

  return {
    expandVariables,
    validVariables,
  };
}
