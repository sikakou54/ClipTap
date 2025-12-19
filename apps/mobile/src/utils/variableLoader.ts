/**
 * 変数ロードユーティリティ
 *
 * VariablePickerModal と VariableToolbar で共通使用される
 * 変数オプションリストの生成ロジックを提供します。
 */

import type { Profile, ProfileVariable, TranslationFunction } from '@cliptap/shared';
import { VariableService, FEATURE_LIMITS } from '@cliptap/shared';
import { Ionicons } from '@expo/vector-icons';
import { UI_SYSTEM_VARIABLES, VariableOption } from '@mobile-types/variable';

export interface LoadVariableOptionsParams {
  t: TranslationFunction;
  isSubscribed: boolean;
  profileVariables: ProfileVariable[];
  defaultProfile?: Profile | null;
}

/**
 * 変数オプションリストを生成
 *
 * システム変数とカスタム変数を結合したリストを返します。
 * - システム変数: date, time, datetime等
 * - カスタム変数: ユーザー定義（無料版は上位5個のみ）
 *
 * @param params - 生成パラメータ
 * @returns 変数オプションリスト（システム変数が先、カスタム変数が後）
 */
export function loadVariableOptions(params: LoadVariableOptionsParams): VariableOption[] {
  const { t, isSubscribed, profileVariables, defaultProfile } = params;

  const systemVars: VariableOption[] = UI_SYSTEM_VARIABLES.map((v) => ({
    name: v.name,
    icon: v.icon,
    label: t(v.labelKey),
    description: t(v.descriptionKey),
    isSystem: true,
  }));

  const enabledCustomVars = VariableService.getEnabledCustomVariables(
    isSubscribed,
    FEATURE_LIMITS.FREE_TIER_VARIABLES
  );

  const getStandardValue = (varId: string): string => {
    if (!defaultProfile) return '';
    const pv = profileVariables.find(
      (pv) => pv.profileId === defaultProfile.id && pv.variableId === varId
    );
    return pv?.value || '';
  };

  const customVarOptions: VariableOption[] = enabledCustomVars.map((v) => ({
    name: v.name,
    icon: (v.icon as keyof typeof Ionicons.glyphMap) || 'code-outline',
    label: v.label || v.name,
    description: getStandardValue(v.id),
    isSystem: false,
  }));

  return [...systemVars, ...customVarOptions];
}
