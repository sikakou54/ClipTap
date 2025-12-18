import { Ionicons } from '@expo/vector-icons';

export type VariableType = 'system' | 'custom';

export interface Variable {
  id: string;
  name: string;
  type: VariableType;
  label?: string;
  icon?: string;
  valid: boolean;                // 有効データフラグ（プランに応じて設定）
  createdAt: string;
  updatedAt: string;
}

export interface SystemVariableDefinition {
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  labelKey: string;
  descriptionKey: string;
}

// システム変数の定義（i18nキーのみ保持）
export const SYSTEM_VARIABLES: SystemVariableDefinition[] = [
  { name: 'today', icon: 'calendar-outline', labelKey: 'variables.today', descriptionKey: 'variables.today_desc' },
  { name: 'now', icon: 'time-outline', labelKey: 'variables.now', descriptionKey: 'variables.now_desc' },
  { name: 'time', icon: 'alarm-outline', labelKey: 'variables.time', descriptionKey: 'variables.time_desc' },
  { name: 'year', icon: 'calendar-number-outline', labelKey: 'variables.year', descriptionKey: 'variables.year_desc' },
  { name: 'month', icon: 'calendar-number-outline', labelKey: 'variables.month', descriptionKey: 'variables.month_desc' },
  { name: 'day', icon: 'calendar-number-outline', labelKey: 'variables.day', descriptionKey: 'variables.day_desc' },
  { name: 'weekday', icon: 'calendar-outline', labelKey: 'variables.weekday', descriptionKey: 'variables.weekday_desc' },
];

// UI表示用の変数オプション型
export interface VariableOption {
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  description: string;
  isSystem: boolean;
}

export interface VariableReplacement {
  original: string;      // {{today}}
  variable: string;      // today
  value: string;         // 2025-11-02
}

export interface CreateVariableInput {
  name: string;
  type: VariableType;
  label?: string;
  icon?: string;
}

export interface UpdateVariableInput {
  name?: string;
  label?: string;
  icon?: string;
}
