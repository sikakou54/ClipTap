/**
 * トラッキング管理カスタムフック
 *
 * アプリの使用統計トラッキングとユーザープライバシー設定を管理します。
 * iOSのApp Tracking Transparency（ATT）フレームワークに準拠した
 * トラッキング許可管理を提供します。
 *
 * 主な機能:
 * - トラッキング許可のリクエスト（iOS 14.5以上）
 * - トラッキング許可状態の取得
 *
 * トラッキング対象データ（プライバシー重視）:
 * - スニペット使用回数（個人を特定しない統計情報のみ）
 * - カテゴリ別使用統計
 * - 変数使用頻度
 *
 * トラッキングされないデータ:
 * - スニペットの内容
 * - カスタム変数の値
 * - 個人を特定できる情報
 *
 * 注意:
 * - iOS 14.5未満ではATTフレームワークは使用されない
 * - トラッキング拒否時もアプリの全機能は利用可能
 */

import { useCallback } from 'react';
import { TrackingService } from '@services/TrackingService';

/**
 * トラッキング管理フック
 *
 * iOS App Tracking Transparencyについて:
 * - iOS 14.5以降で必須のプライバシー機能
 * - ユーザーの明示的な許可が必要
 * - システムダイアログでの許可/拒否選択
 *
 * トラッキングステータスの種類:
 * - authorized: トラッキング許可済み
 * - denied: トラッキング拒否済み
 * - notDetermined: 未決定（初回起動時など）
 * - restricted: デバイス設定で制限されている
 */
export function useTracking() {
  /**
   * トラッキング許可をリクエスト
   *
   * iOSのApp Tracking Transparencyダイアログを表示。
   * ダイアログの内容はInfo.plistのNSUserTrackingUsageDescriptionで設定。
   */
  const requestTrackingPermission = useCallback(async (): Promise<boolean> => {
    return TrackingService.requestTrackingPermission();
  }, []);

  /**
   * 現在のトラッキング許可状態を取得
   */
  const getTrackingStatus = useCallback(async (): Promise<string> => {
    return TrackingService.getTrackingStatus();
  }, []);

  return {
    requestTrackingPermission,
    getTrackingStatus,
  };
}
