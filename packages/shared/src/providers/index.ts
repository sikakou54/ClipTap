/**
 * Providersモジュール エクスポート
 *
 * @description
 * React Contextプロバイダーと共通型定義をエクスポート。
 * Mobile/Webで共通のインターフェースを提供し、
 * プラットフォーム固有の実装はアダプターパターンで抽象化。
 *
 * @module providers
 */

export * from './AuthProvider';
export * from './DatabaseProvider';

export { ProfileProvider, useProfiles } from './ProfileProvider';
export type { ProfileContextValue } from './ProfileProvider';

export { VariableProvider, useVariables } from './VariableProvider';
export type { VariableContextValue } from './VariableProvider';

export { CategoryProvider, useCategories } from './CategoryProvider';
export type { CategoryContextValue } from './CategoryProvider';

export { SnippetProvider, useSnippets } from './SnippetProvider';
export type { SnippetContextValue } from './SnippetProvider';

export {
  type ThemeMode,
  type BaseThemeContextType,
  type SemanticColors,
  LIGHT_THEME_COLORS,
  DARK_THEME_COLORS,
  getThemeColors,
} from './ThemeTypes';

export {
  ThemeProvider,
  useTheme,
  type ThemeProviderProps,
  type ThemeContextValue,
  type ThemeStorageAdapter,
  type ThemePlatformAdapter,
} from './ThemeProvider';

export {
  SubscriptionProvider,
  useSubscription,
  type SubscriptionContextValue,
  type SubscriptionPlatformAdapter,
  type SubscriptionProviderProps,
} from './SubscriptionProvider';

export {
  AlertProvider,
  useAlert,
  type AlertContextType,
  type AlertOptions,
  type AlertType,
  type AlertPlatformAdapter,
  type AlertProviderProps,
} from './AlertProvider';
