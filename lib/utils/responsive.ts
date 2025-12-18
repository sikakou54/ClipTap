/**
 * レスポンシブデザインユーティリティ
 * iPad、タブレット、異なる画面サイズに対応
 */

import { Dimensions, Platform } from 'react-native';

// ブレークポイント定義
export const BREAKPOINTS = {
  phone: 0,
  tablet: 768,
  desktop: 1024,
} as const;

// デバイスタイプ判定
export const getDeviceType = () => {
  const { width } = Dimensions.get('window');

  if (width >= BREAKPOINTS.desktop) {
    return 'desktop';
  } else if (width >= BREAKPOINTS.tablet) {
    return 'tablet';
  }
  return 'phone';
};

// iPad判定（iOS限定）
export const isIPad = () => {
  return Platform.OS === 'ios' && Platform.isPad;
};

// タブレット判定（汎用）
export const isTablet = () => {
  const deviceType = getDeviceType();
  return deviceType === 'tablet' || deviceType === 'desktop';
};

// レスポンシブ値の計算
export const responsive = {
  // 画面幅に応じた値を返す
  width: (phone: number, tablet: number, desktop?: number) => {
    const deviceType = getDeviceType();

    if (deviceType === 'desktop' && desktop !== undefined) {
      return desktop;
    } else if (deviceType === 'tablet') {
      return tablet;
    }
    return phone;
  },

  // 倍率ベースのレスポンシブ値
  scale: (baseValue: number, tabletScale = 1.5, desktopScale = 2) => {
    const deviceType = getDeviceType();

    if (deviceType === 'desktop') {
      return baseValue * desktopScale;
    } else if (deviceType === 'tablet') {
      return baseValue * tabletScale;
    }
    return baseValue;
  },

  // フォントサイズ
  fontSize: (phone: number, tablet?: number, desktop?: number) => {
    const deviceType = getDeviceType();

    if (deviceType === 'desktop' && desktop !== undefined) {
      return desktop;
    } else if (deviceType === 'tablet' && tablet !== undefined) {
      return tablet;
    }
    return phone;
  },

  // スペーシング
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

// カラムレイアウト計算
export const getColumns = (minWidth: number, maxColumns = 4, gap = 16) => {
  const { width } = Dimensions.get('window');
  const availableWidth = width - (gap * 2); // 左右のマージン
  const columns = Math.min(
    Math.floor(availableWidth / (minWidth + gap)),
    maxColumns
  );
  return Math.max(columns, 1);
};

// グリッドレイアウトのアイテム幅計算
export const getItemWidth = (columns: number, gap = 16, containerPadding = 16) => {
  const { width } = Dimensions.get('window');
  const totalGap = gap * (columns - 1);
  const totalPadding = containerPadding * 2;
  return (width - totalGap - totalPadding) / columns;
};

// レスポンシブパディング
export const getResponsivePadding = () => {
  return responsive.spacing(16, 32, 48);
};

// コンテンツの最大幅（大画面での可読性向上）
export const getMaxContentWidth = () => {
  const deviceType = getDeviceType();

  if (deviceType === 'desktop') {
    return 1200;
  } else if (deviceType === 'tablet') {
    return 900;
  }
  return undefined; // phoneの場合は制限なし
};

// Safe Areaを考慮したレスポンシブ値
export const getResponsiveInsets = () => {
  const deviceType = getDeviceType();

  return {
    horizontal: deviceType === 'tablet' ? 32 : 16,
    vertical: deviceType === 'tablet' ? 24 : 16,
  };
};

// スニペットカードのレイアウト設定
export const getSnippetLayoutConfig = () => {
  const deviceType = getDeviceType();

  if (deviceType === 'desktop') {
    return {
      columns: 3,
      cardMinWidth: 300,
      gap: 20,
      padding: 48,
    };
  } else if (deviceType === 'tablet') {
    return {
      columns: 2,
      cardMinWidth: 250,
      gap: 16,
      padding: 32,
    };
  }

  return {
    columns: 1,
    cardMinWidth: 0,
    gap: 12,
    padding: 16,
  };
};

// モーダルサイズ計算
export const getModalSize = () => {
  const { width, height } = Dimensions.get('window');
  const deviceType = getDeviceType();

  if (deviceType === 'tablet' || deviceType === 'desktop') {
    return {
      width: Math.min(width * 0.7, 600),
      height: Math.min(height * 0.8, 800),
      maxWidth: 600,
      maxHeight: 800,
    };
  }

  return {
    width: width,
    height: height,
    maxWidth: undefined,
    maxHeight: undefined,
  };
};

// FAB（Floating Action Button）の位置計算
export const getFABPosition = (hasAds = false) => {
  const deviceType = getDeviceType();
  const isTabletDevice = deviceType === 'tablet' || deviceType === 'desktop';

  return {
    right: isTabletDevice ? 48 : 24,
    bottom: hasAds
      ? (isTabletDevice ? 140 : 90)
      : (isTabletDevice ? 48 : 24),
  };
};

// リストアイテムの高さ
export const getListItemHeight = () => {
  return responsive.width(80, 100, 120);
};

// ヘッダーの高さ
export const getHeaderHeight = () => {
  const deviceType = getDeviceType();

  if (isIPad()) {
    return 90; // iPadは特別に高く
  } else if (deviceType === 'tablet') {
    return 80;
  } else if (deviceType === 'desktop') {
    return 90;
  }
  return 60;
};
