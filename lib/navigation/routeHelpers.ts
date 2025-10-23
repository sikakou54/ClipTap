/**
 * 統合ルートヘルパー
 * 重複するナビゲーション処理とルート構築を統一
 */

import { router } from 'expo-router';

// ルート定義

export const Routes = {
  // メイン画面
  HOME: '/',
  SETTINGS: '/settings',
  DEMO: '/demo',

  // 汎用画面
  TEXT_EDITOR: '/text-editor'
} as const;

// ナビゲーションヘルパー

export const NavigationHelpers = {
  // 戻る
  back: () => router.back(),

  // ホーム画面へ
  toHome: () => router.push(Routes.HOME),

  // 設定画面へ
  toSettings: () => router.push(Routes.SETTINGS),

  // デモ画面へ
  toDemo: () => router.push(Routes.DEMO),

  // テキストエディター
  toTextEditor: (initialText = '', title = 'Detail Input') =>
    router.push(`${Routes.TEXT_EDITOR}?initialText=${encodeURIComponent(initialText)}&title=${encodeURIComponent(title)}`),
};

// URLパラメータヘルパー

export const createQueryString = (params: Record<string, string | number | boolean | undefined | null>): string => {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value != null) {  // != は null と undefined の両方をチェック
      query.append(key, String(value));
    }
  });

  return query.toString();
};

export const buildRouteWithQuery = (route: string, params: Record<string, string | number | boolean | undefined | null>): string => {
  const queryString = createQueryString(params);
  return queryString ? `${route}?${queryString}` : route;
};

// 型安全なナビゲーション

export type RouteParams = {
  'text-editor': { initialText?: string; title?: string };
};

export const navigate = <T extends keyof RouteParams>(
  route: T,
  params: RouteParams[T]
) => {
  const routePath = `/${route}`;
  const fullRoute = buildRouteWithQuery(routePath, params);
  router.push(fullRoute);
};
