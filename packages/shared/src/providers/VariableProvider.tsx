/**
 * 変数管理Provider
 *
 * @description
 * カスタム変数のグローバル状態を管理するProvider。
 * すべての画面で同じデータを参照でき、一箇所で更新すると全画面に即座に反映される。
 *
 * @module VariableProvider
 */

import { createContext, useContext, useState, useEffect, useCallback, useMemo, type ReactNode } from 'react';
import { VariableService } from '../services/VariableService';
import { ProfileService } from '../services/ProfileService';
import { SubscriptionService } from '../services/SubscriptionService';
import { Logger } from '../utils/logger';
import { useDatabase } from './DatabaseProvider';
import type { Variable, CreateVariableInput, UpdateVariableInput } from '../schema';

/* ======================================== */
/* 型定義 */
/* ======================================== */

/**
 * VariableContextの型定義
 */
export interface VariableContextValue {
  /** 変数一覧（無効なものも含む） */
  variables: Variable[];
  /** データ読み込み中フラグ */
  loading: boolean;
  /** エラー情報 */
  error: Error | null;
  /** データ再読み込み */
  refresh: () => void;
  /** 変数作成 */
  createVariable: (input: CreateVariableInput) => Variable;
  /** 変数更新 */
  updateVariable: (id: string, data: UpdateVariableInput) => Variable;
  /** 変数削除 */
  deleteVariable: (id: string) => void;
  /** 変数値設定（全プロファイル分） */
  setVariableValuesForVariable: (
    variableId: string,
    values: { profileId: string; variableId: string; value: string }[]
  ) => void;
}

/**
 * VariableProviderのProps
 */
interface VariableProviderProps {
  /** 子コンポーネント */
  children: ReactNode;
}

/* ======================================== */
/* Context */
/* ======================================== */

const VariableContext = createContext<VariableContextValue | null>(null);

/* ======================================== */
/* Provider */
/* ======================================== */

/**
 * 変数管理Provider
 *
 * @param props - VariableProviderProps
 */
export function VariableProvider({ children }: VariableProviderProps) {
  /* ======================================== */
  /* 状態管理 */
  /* ======================================== */
  const [variables, setVariables] = useState<Variable[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  /* データベース初期化状態（DatabaseProviderが必須） */
  const { isLoaded: isDatabaseLoaded } = useDatabase();

  /* ======================================== */
  /* データ読み込み */
  /* ======================================== */
  const loadVariables = useCallback(() => {
    try {
      setLoading(true);
      /* 無効化された変数も含めて取得（ユーザーが確認・整理できるようにするため） */
      const allVariables = VariableService.getAllIncludingInvalid();
      setVariables(allVariables);
      setError(null);
    } catch (err) {
      Logger.error('[VariableProvider] Failed to load variables:', err);
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, []);

  /* データベースが初期化された後にデータを読み込む */
  useEffect(() => {
    if (!isDatabaseLoaded) return;
    loadVariables();
  }, [loadVariables, isDatabaseLoaded]);

  /* ======================================== */
  /* CRUD操作 */
  /* ======================================== */

  /**
   * 変数作成
   *
   * 作成後に一覧を再読込し、Contextを参照する全画面へ即時反映する。
   */
  const createVariable = useCallback(
    (input: CreateVariableInput): Variable => {
      const variable = VariableService.create(input);
      loadVariables();
      return variable;
    },
    [loadVariables]
  );

  /**
   * 変数更新
   *
   * 更新後に一覧を再読込し、Contextを参照する全画面へ即時反映する。
   */
  const updateVariable = useCallback(
    (id: string, data: UpdateVariableInput): Variable => {
      const variable = VariableService.update(id, data);
      loadVariables();
      return variable;
    },
    [loadVariables]
  );

  /**
   * 変数削除
   *
   * 削除だけvalidフラグの更新を伴うのは、件数が減るとFreeの上限に空きが出て
   * 無効だった変数が有効へ昇格しうるため。再読込前に反映して一覧の表示を揃える。
   */
  const deleteVariable = useCallback(
    (id: string): void => {
      VariableService.delete(id);
      /* 削除後にvalidフラグを即時更新（無効→有効への昇格に対応） */
      SubscriptionService.updateValidFlags();
      loadVariables();
    },
    [loadVariables]
  );

  /**
   * 変数の値を設定（全プロファイル分）
   *
   * この操作は profile_variables を書き換えるため、こちらの再読込だけでは
   * ProfileProvider が持つ profileVariables が古いまま残る。値を編集した画面は
   * 続けて useProfiles().refresh() を呼び、両Providerのスナップショットを揃えること。
   * 同じ処理を ProfileProvider 側にも置くと入口が2つになり、どちらを呼ぶのが正しいか
   * 判断できなくなるため、変数値の一括設定はここを唯一の入口とする。
   */
  const setVariableValuesForVariable = useCallback(
    (variableId: string, values: { profileId: string; variableId: string; value: string }[]): void => {
      ProfileService.setVariableValuesForVariable(variableId, values);
      loadVariables();
    },
    [loadVariables]
  );

  /* ======================================== */
  /* Context Value */
  /* ======================================== */
  const value = useMemo<VariableContextValue>(
    () => ({
      variables,
      loading,
      error,
      refresh: loadVariables,
      createVariable,
      updateVariable,
      deleteVariable,
      setVariableValuesForVariable,
    }),
    [variables, loading, error, loadVariables, createVariable, updateVariable, deleteVariable, setVariableValuesForVariable]
  );

  return <VariableContext.Provider value={value}>{children}</VariableContext.Provider>;
}

/* ======================================== */
/* Hook */
/* ======================================== */

/**
 * 変数状態を取得するフック
 *
 * @returns 変数状態とアクション
 * @throws Provider外で使用された場合にエラー
 */
export function useVariables(): VariableContextValue {
  const context = useContext(VariableContext);
  if (!context) {
    throw new Error('useVariables must be used within VariableProvider');
  }
  return context;
}
