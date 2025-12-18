/**
 * useTracking - トラッキング管理カスタムフック
 * TrackingServiceのUI層抽象化
 */

import { TrackingService } from '../services/TrackingService';

export function useTracking() {
  const requestTrackingPermission = async (): Promise<boolean> => {
    return TrackingService.requestTrackingPermission();
  };

  const getTrackingStatus = async (): Promise<string> => {
    return TrackingService.getTrackingStatus();
  };

  return {
    requestTrackingPermission,
    getTrackingStatus,
  };
}
