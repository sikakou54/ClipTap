/**
 * モバイルアプリ向けレスポンシブデザインユーティリティ
 *
 * デバイスサイズに応じた柔軟なレイアウトを実現するためのヘルパー関数を提供します。
 * iPad、Androidタブレット、スマートフォンなど異なる画面サイズに対応します。
 *
 * 主な機能:
 * - デバイスタイプの判定（phone/tablet/desktop）
 * - レスポンシブな値の計算（幅、フォントサイズ、スペーシング）
 * - グリッドレイアウトの計算
 */

import { Dimensions } from 'react-native';

let cachedDimensions: { width: number; height: number } | null = null;
let cachedDeviceType: 'phone' | 'tablet' | 'desktop' | null = null;

Dimensions.addEventListener('change', () => {
  cachedDimensions = null;
  cachedDeviceType = null;
});

const getDimensions = () => {
  if (!cachedDimensions) {
    cachedDimensions = Dimensions.get('window');
  }
  return cachedDimensions;
};

/**
 * ブレークポイント定義
 * @internal themeSystemで使用
 */
const BREAKPOINTS = {
  phone: 0,
  tablet: 768,
  desktop: 1024,
} as const;

/**
 * 現在のウィンドウ幅に基づいてデバイスタイプを判定
 * @internal isTabletで使用
 */
const getDeviceType = () => {
  if (cachedDeviceType) {
    return cachedDeviceType;
  }

  const { width } = getDimensions();

  if (width >= BREAKPOINTS.desktop) {
    cachedDeviceType = 'desktop';
  } else if (width >= BREAKPOINTS.tablet) {
    cachedDeviceType = 'tablet';
  } else {
    cachedDeviceType = 'phone';
  }
  return cachedDeviceType;
};

/**
 * タブレット端末かどうかを判定（iOS/Android汎用）
 */
export const isTablet = () => {
  const deviceType = getDeviceType();
  return deviceType === 'tablet' || deviceType === 'desktop';
};

/**
 * レスポンシブ値の計算ユーティリティ
 *
 * デバイスタイプに応じて異なる値を返す関数を提供します。
 */
export const responsive = {
  /**
   * 画面幅に応じた値を返す
   */
  width: (phone: number, tablet: number, desktop?: number) => {
    const deviceType = getDeviceType();
    if (deviceType === 'desktop' && desktop !== undefined) {
      return desktop;
    } else if (deviceType === 'tablet') {
      return tablet;
    }
    return phone;
  },

  /**
   * レスポンシブなスペーシング（余白）を取得
   */
  spacing: (phone: number, tablet?: number, desktop?: number) => {
    const deviceType = getDeviceType();
    if (deviceType === 'desktop' && desktop !== undefined) {
      return desktop;
    } else if (deviceType === 'tablet' && tablet !== undefined) {
      return tablet;
    }
    return phone;
  },
};

/**
 * コンテンツの最大幅を取得
 *
 * 大画面での可読性向上のため、コンテンツ幅に上限を設定します。
 */
export const getMaxContentWidth = () => {
  const deviceType = getDeviceType();
  if (deviceType === 'desktop') {
    return 1200;
  } else if (deviceType === 'tablet') {
    return 900;
  }
  return undefined;
};

