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

import { useState, useEffect, useCallback, useMemo } from 'react';
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

  const [contentWidth, setContentWidth] = useState(0);

  /**
   * 再読み込みトリガー
   *
   * VariableServiceはReactの外にあるミュータブルストアで変更通知を持たないため、
   * 10秒ごとにカウンタを進めて変数リストを再計算する。
   */
  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(
      () => setRefreshTick((tick) => tick + 1),
      VARIABLE_REFRESH_INTERVAL_MS
    );
    return () => clearInterval(interval);
  }, []);

  /**
   * カスタム変数一覧
   *
   * 依存の変化（言語・課金状態・プロファイル）では即座に、
   * VariableServiceの変更はrefreshTickの進行に合わせて反映される。
   */
  const allVariables = useMemo<VariableOption[]>(() => {
    /*
     * refreshTickはVariableService（React外のミュータブルストア）を
     * 読み直すためだけのトリガーで、計算結果には使わない。
     */
    void refreshTick;

    try {
      return loadVariableOptions({
        t,
        isSubscribed,
        profileVariables,
        defaultProfile,
      });
    } catch {
      /* エラー時は空リストで動作継続（次回のリフレッシュで復帰する） */
      return [];
    }
  }, [t, isSubscribed, profileVariables, defaultProfile, refreshTick]);

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
