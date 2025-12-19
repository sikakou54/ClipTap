/**
 * 変数挿入ツールバーのビジネスロジックフック
 *
 * 変数ツールバーに必要な状態管理とロジックを提供。
 * UIコンポーネント（VariableToolbar.tsx）から完全に分離されたビジネスロジック層。
 *
 * 主な責務:
 * - 変数リストの読み込みと定期更新
 * - レイアウト計算（中央寄せ判定）
 *
 * @see components/snippet/VariableToolbar.tsx - UIコンポーネント
 */

import { useState, useEffect, useCallback } from 'react';
import { useWindowDimensions, LayoutChangeEvent } from 'react-native';
import { useTranslation, useProfiles } from '@cliptap/shared';
import { useSubscription } from '@providers/SubscriptionProvider';
import { loadVariableOptions } from '@utils/variableLoader';
import { VariableOption } from '@mobile-types/variable';

/** 変数リストの自動リフレッシュ間隔（ミリ秒） */
const VARIABLE_REFRESH_INTERVAL_MS = 10000;

/**
 * useVariableToolbarの戻り値の型
 */
export interface UseVariableToolbarReturn {
  /* 状態 */
  allVariables: VariableOption[];
  shouldCenter: boolean;
  horizontalPadding: number;

  /* ハンドラ */
  handleContentLayout: (event: LayoutChangeEvent) => void;
}

/**
 * 変数挿入ツールバーのビジネスロジックフック
 *
 * @returns ツールバーに必要な全ての状態とハンドラ
 */
export function useVariableToolbar(): UseVariableToolbarReturn {
  const { t } = useTranslation();
  const { profileVariables, defaultProfile } = useProfiles();
  const { isSubscribed } = useSubscription();
  const { width: screenWidth } = useWindowDimensions();

  const [allVariables, setAllVariables] = useState<VariableOption[]>([]);
  const [contentWidth, setContentWidth] = useState(0);

  /**
   * カスタム変数を読み込み
   */
  const loadCustomVariables = useCallback(() => {
    try {
      const options = loadVariableOptions({
        t,
        isSubscribed,
        profileVariables,
        defaultProfile,
      });
      setAllVariables(options);
    } catch {
      /* エラー時は無視して動作継続 */
    }
  }, [t, isSubscribed, profileVariables, defaultProfile]);

  /**
   * 初回マウント時と10秒ごとに自動リフレッシュ
   */
  useEffect(() => {
    loadCustomVariables();

    const interval = setInterval(loadCustomVariables, VARIABLE_REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [loadCustomVariables]);

  /**
   * コンテンツ幅取得
   */
  const handleContentLayout = useCallback((event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout;
    setContentWidth(width);
  }, []);

  /**
   * 中央寄せが必要かどうか
   */
  const shouldCenter = contentWidth > 0 && contentWidth < screenWidth;

  /**
   * 中央寄せ用のパディング
   */
  const horizontalPadding = shouldCenter ? (screenWidth - contentWidth) / 2 : 0;

  return {
    allVariables,
    shouldCenter,
    horizontalPadding,
    handleContentLayout,
  };
}
