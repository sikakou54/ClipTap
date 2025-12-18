/**
 * カスタム変数管理フック
 * UI層からservice層を隠蔽するための抽象化レイヤー
 */

import { useCallback } from 'react';
import { variableService } from '../services/VariableService';
import { Variable } from '../types/variable';
import { useSubscription } from './useSubscription';

export function useVariables() {
  const { isSubscribed } = useSubscription();

  const getAllCustomVariables = useCallback((): Variable[] => {
    return variableService.getAllCustomVariables();
  }, []);

  const getAllCustomVariablesIncludingInvalid = useCallback((): Variable[] => {
    return variableService.getAllCustomVariablesIncludingInvalid();
  }, []);

  const getEnabledCustomVariables = useCallback((): Variable[] => {
    return variableService.getEnabledCustomVariables(isSubscribed);
  }, [isSubscribed]);

  const upsertVariableMetadata = useCallback(async (
    variableId: string | undefined,
    name: string,
    label?: string,
    icon?: string
  ): Promise<Variable> => {
    return variableService.upsertVariableMetadata(variableId, name, label, icon);
  }, []);

  const upsertVariableValuesForProfiles = useCallback(async (
    variableId: string,
    profileValues: Record<string, string>
  ): Promise<void> => {
    return variableService.upsertVariableValuesForProfiles(variableId, profileValues);
  }, []);

  const deleteVariable = useCallback((id: string): boolean => {
    return variableService.deleteVariable(id);
  }, []);

  const isVariableNameDuplicate = useCallback((name: string, excludeId?: string): boolean => {
    return variableService.isVariableNameDuplicate(name, excludeId);
  }, []);

  const getStandardValue = useCallback((variableName: string): string => {
    return variableService.getStandardValue(variableName);
  }, []);

  const createCustomVariableResolver = useCallback((profileId?: string) => {
    return variableService.createCustomVariableResolver(profileId);
  }, []);

  return {
    getAllCustomVariables,
    getAllCustomVariablesIncludingInvalid,
    getEnabledCustomVariables,
    upsertVariableMetadata,
    upsertVariableValuesForProfiles,
    deleteVariable,
    isVariableNameDuplicate,
    getStandardValue,
    createCustomVariableResolver,
  };
}
