/**
 * 変数選択モーダルのビジネスロジックフック
 *
 * 変数選択モーダルに必要な状態管理とロジックを提供。
 * UIコンポーネント（VariablePickerModal.tsx）から完全に分離されたビジネスロジック層。
 *
 * 主な責務:
 * - 変数リストの生成
 * - 変数選択処理
 *
 * @see components/snippet/VariablePickerModal.tsx - UIコンポーネント
 */

import { useMemo, useCallback } from 'react';
import { useTranslation, useProfiles } from '@cliptap/shared';
import { useSubscription } from '@providers/SubscriptionProvider';
import { loadVariableOptions } from '@utils/variableLoader';
import { VariableOption } from '@mobile-types/variable';

/**
 * useVariablePickerModalのProps
 * @property onClose - 閉じるボタン押下時のコールバック
 * @property onSelect - 変数選択時のコールバック
 */
export interface UseVariablePickerModalProps {
  onClose: () => void;
  onSelect: (variableName: string) => void;
}

/**
 * useVariablePickerModalの戻り値の型
 */
export interface UseVariablePickerModalReturn {
  /* 状態 */
  variables: VariableOption[];

  /* ハンドラ */
  handleSelect: (variableName: string) => void;
}

/**
 * 変数選択モーダルのビジネスロジックフック
 *
 * @param props - モーダルの各種コールバック
 * @returns モーダルに必要な全ての状態とハンドラ
 */
export function useVariablePickerModal({
  onClose,
  onSelect,
}: UseVariablePickerModalProps): UseVariablePickerModalReturn {
  const { t } = useTranslation();
  const { profileVariables, defaultProfile } = useProfiles();
  const { isSubscribed } = useSubscription();

  /**
   * 変数リストを生成
   * システム変数とカスタム変数を結合（無料版は上位5個のみ）
   */
  const variables = useMemo(() => {
    return loadVariableOptions({
      t,
      isSubscribed,
      profileVariables,
      defaultProfile,
    });
  }, [t, profileVariables, defaultProfile, isSubscribed]);

  /**
   * 変数選択時の処理
   */
  const handleSelect = useCallback((variableName: string) => {
    onSelect(variableName);
    onClose();
  }, [onSelect, onClose]);

  return {
    variables,
    handleSelect,
  };
}
