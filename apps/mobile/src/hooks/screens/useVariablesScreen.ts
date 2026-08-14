/**
 * カスタム変数管理画面のビジネスロジックフック
 *
 * カスタム変数（{{変数名}}）の一覧表示・管理に必要な状態管理とロジックを提供。
 * UIコンポーネント（settings/variables.tsx）から完全に分離されたビジネスロジック層。
 *
 * 主な責務:
 * - カスタム変数一覧の取得・更新
 * - プロファイル選択と値表示
 * - 新規作成・編集・削除処理
 * - 無料プラン制限チェック
 *
 * @see app/settings/variables.tsx - UIコンポーネント
 * @see lib/hooks/useVariables.tsx - 変数CRUD操作
 */

import { useState, useCallback, useMemo } from 'react';
import { useRouter, useFocusEffect } from 'expo-router';
import {
  useTranslation,
  VariableService,
  useVariables,
  useProfiles,
  Logger,
  FREE_VARIABLES_LIMIT,
  type Variable,
  type Profile,
} from '@cliptap/shared';
import { useSubscription } from '@providers/SubscriptionProvider';
import { useUpgradePrompt } from '@hooks/useUpgradePrompt';
import { showConfirm } from '@utils/alerts';

/**
 * useVariablesScreenの戻り値の型
 */
export interface UseVariablesScreenReturn {
  /* 状態 */
  variables: Variable[];
  selectedProfileId: string | null;
  /** 環境を明示選択する（nullを渡すと先頭の環境に戻る） */
  setSelectedProfileId: (id: string | null) => void;
  profiles: Profile[];

  /* ハンドラ */
  handleAdd: () => void;
  handleEdit: (variable: Variable, enabled: boolean) => void;
  handleDelete: (variable: Variable) => void;

  /* ヘルパー */
  isVariableEnabled: (variable: Variable) => boolean;
  getVariableValue: (variable: Variable) => string;
}

/**
 * カスタム変数管理画面のビジネスロジックフック
 *
 * @returns 画面に必要な全ての状態とハンドラ
 */
export function useVariablesScreen(): UseVariablesScreenReturn {
  const { t } = useTranslation();
  const router = useRouter();

  const confirmUpgrade = useUpgradePrompt();

  const { canAddCustomVariable } = useSubscription();
  const { deleteVariable: deleteVar } = useVariables();
  const { profiles, profileVariables, defaultProfile } = useProfiles();

  /* ======================================== */
  /* 状態管理 */
  /* ======================================== */
  const [variables, setVariables] = useState<Variable[]>([]);
  /* ユーザーがチップで明示選択した環境ID（null = 先頭の環境） */
  const [profileOverride, setProfileOverride] = useState<string | null>(null);

  /**
   * カスタム変数一覧を読み込む（無効なものも含む）
   * Service層を直接呼び出すことでContext依存による無限ループを回避
   */
  const loadVariables = useCallback(() => {
    setVariables(VariableService.getAllCustomVariablesIncludingInvalidSorted());
  }, []);

  /* 画面フォーカス時にデータ更新 */
  useFocusEffect(
    useCallback(() => {
      loadVariables();
    }, [loadVariables])
  );

  /* ======================================== */
  /* 派生状態: プロファイル選択 */
  /* ======================================== */

  /**
   * 実際に選択されている環境ID
   *
   * 明示選択が現存する環境を指していればそれを、無ければ先頭の環境を使う。
   */
  const selectedProfileId = useMemo(() => {
    if (profiles.length === 0) {
      return null;
    }
    if (profileOverride && profiles.some((profile) => profile.id === profileOverride)) {
      return profileOverride;
    }
    return profiles[0].id;
  }, [profileOverride, profiles]);

  /* ======================================== */
  /* ヘルパー関数 */
  /* ======================================== */

  /**
   * 変数が有効かどうかを判定
   */
  const isVariableEnabled = useCallback((variable: Variable): boolean => {
    return variable.valid;
  }, []);

  /**
   * 変数の表示値を取得
   *
   * @remarks
   * 選択環境の非空値 → 標準環境の非空値 → t('common.not_set') の順に解決する。
   * 空文字は値なしとして扱い、次の候補へ進む。
   * 環境が1件も無い（selectedProfileId が null）ときは標準環境の値のみを見る。
   * 参照は変数IDで行う。変数名は一意制約に依存するため、キーには使わない。
   */
  const getVariableValue = useCallback(
    (variable: Variable): string => {
      /* 標準値を取得（デフォルトプロファイルから） */
      const getStandardValueInline = (varId: string): string => {
        if (!defaultProfile) return '';
        const pv = profileVariables.find(
          pv => pv.profileId === defaultProfile.id && pv.variableId === varId
        );
        return pv?.value || '';
      };

      if (!selectedProfileId) {
        return getStandardValueInline(variable.id) || t('common.not_set');
      }

      const profileValue = profileVariables.find(
        pv => pv.profileId === selectedProfileId && pv.variableId === variable.id
      )?.value || '';
      if (profileValue) {
        return profileValue;
      }

      const standardValue = getStandardValueInline(variable.id);
      if (standardValue) {
        return standardValue;
      }

      return t('common.not_set');
    },
    [selectedProfileId, defaultProfile, profileVariables, t]
  );

  /* ======================================== */
  /* イベントハンドラ */
  /* ======================================== */

  /**
   * 変数削除処理
   */
  const handleDelete = useCallback(
    (variable: Variable) => {
      /* 「この変数を削除しますか？」確認 */
      showConfirm(
        t('settings.delete_variable_confirm', { name: variable.name }),
        () => {
          try {
            deleteVar(variable.id);
            /* Service層から再取得して同期 */
            setVariables(VariableService.getAllCustomVariablesIncludingInvalidSorted());
          } catch (error) {
            Logger.error('[VariablesScreen] Failed to delete variable:', error);
          }
        },
        undefined,
        'danger'
      );
    },
    [deleteVar, t]
  );

  /**
   * 変数編集画面への遷移
   */
  const handleEdit = useCallback(
    (variable: Variable, enabled: boolean) => {
      /* 無効な変数をタップした場合 */
      if (!enabled) {
        /* 「この変数は無効です。Proプランにアップグレードしますか？」警告 */
        confirmUpgrade(t('settings.variable_disabled_message'));
        return;
      }

      router.push({
        pathname: '/variable/edit',
        params: { id: variable.id },
      });
    },
    [confirmUpgrade, router, t]
  );

  /**
   * 新規変数作成
   */
  const handleAdd = useCallback(() => {
    /* 5つ制限チェック（無料版） */
    if (!canAddCustomVariable(variables.length)) {
      /* 「変数数が上限に達しました。Proプランにアップグレードしますか？」警告 */
      confirmUpgrade(t('settings.variable_limit_message', { limit: FREE_VARIABLES_LIMIT }));
      return;
    }

    router.push('/variable/edit');
  }, [variables.length, canAddCustomVariable, confirmUpgrade, router, t]);

  /* ======================================== */
  /* 戻り値 */
  /* ======================================== */
  return {
    /* 状態 */
    variables,
    selectedProfileId,
    setSelectedProfileId: setProfileOverride,
    profiles,

    /* ハンドラ */
    handleAdd,
    handleEdit,
    handleDelete,

    /* ヘルパー */
    isVariableEnabled,
    getVariableValue,
  };
}
