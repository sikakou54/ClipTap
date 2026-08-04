/**
 * システム変数の識別子です。
 */
export const SYSTEM_VARIABLE_KEYS = [
  'today',
  'now',
  'time',
  'year',
  'month',
  'day',
  'weekday',
] as const;

export type SystemVariableKey = (typeof SYSTEM_VARIABLE_KEYS)[number];

export const isSystemVariableKey = (value: string): value is SystemVariableKey => (
  SYSTEM_VARIABLE_KEYS.some((key) => key === value)
);

export type SystemVariableFormats = Partial<Record<SystemVariableKey, string>>;

/**
 * 行が保存されていない場合に使う既定書式です。
 */
export const DEFAULT_SYSTEM_VARIABLE_FORMATS: Record<SystemVariableKey, string> = {
  today: 'yyyy/MM/dd',
  now: 'yyyy/MM/dd HH:mm:ss',
  time: 'HH:mm',
  year: 'yyyy',
  month: 'MM',
  day: 'dd',
  weekday: 'EEE',
};

/**
 * 保存を許可するプリセットです。各配列の先頭は既定書式です。
 */
export const SYSTEM_VARIABLE_FORMAT_PRESETS: Record<SystemVariableKey, readonly string[]> = {
  today: [
    'yyyy/MM/dd',
    'yyyy-MM-dd',
    'yyyy年M月d日',
    'yyyy年MM月dd日',
    'M/d',
    'MM/dd',
    'M/d/yyyy',
    'yyyy/MM/dd(EEE)',
    'M月d日(EEE)',
  ],
  now: [
    'yyyy/MM/dd HH:mm:ss',
    'yyyy/MM/dd HH:mm',
    'yyyy-MM-dd HH:mm:ss',
    'yyyy-MM-dd HH:mm',
    'yyyy年M月d日 HH時mm分',
    'M/d HH:mm',
  ],
  time: ['HH:mm', 'HH:mm:ss', 'H:mm', 'HH時mm分'],
  year: ['yyyy', 'yy', 'yyyy年'],
  month: ['MM', 'M', 'M月', 'MM月'],
  day: ['dd', 'd', 'd日', 'dd日'],
  weekday: ['EEE', 'EEEE', '(EEE)'],
};

const JA_PRIORITY: Partial<Record<SystemVariableKey, readonly string[]>> = {
  today: ['yyyy/MM/dd', 'yyyy年M月d日', 'yyyy年MM月dd日', 'yyyy-MM-dd'],
  now: ['yyyy/MM/dd HH:mm:ss', 'yyyy年M月d日 HH時mm分', 'yyyy/MM/dd HH:mm'],
};

const EN_PRIORITY: Partial<Record<SystemVariableKey, readonly string[]>> = {
  today: ['yyyy/MM/dd', 'M/d/yyyy', 'yyyy-MM-dd'],
  now: ['yyyy/MM/dd HH:mm:ss', 'M/d HH:mm', 'yyyy-MM-dd HH:mm:ss'],
};

/**
 * 表示言語に適した順序でプリセットを返します。
 */
export const getSystemVariableFormatPresets = (
  key: SystemVariableKey,
  locale: 'ja' | 'en'
): readonly string[] => {
  const presets = SYSTEM_VARIABLE_FORMAT_PRESETS[key];
  const priority = locale === 'ja' ? JA_PRIORITY[key] : EN_PRIORITY[key];

  if (!priority) return presets;

  return [
    ...priority,
    ...presets.filter((pattern) => !priority.includes(pattern)),
  ];
};

/**
 * 対象変数で保存可能なプリセットか判定します。
 */
export const isValidSystemVariableFormat = (
  key: string,
  pattern: string
): key is SystemVariableKey => (
  isSystemVariableKey(key) && SYSTEM_VARIABLE_FORMAT_PRESETS[key].includes(pattern)
);

/**
 * 不正な値を既定書式へ戻します。
 */
export const sanitizeSystemVariableFormat = (
  key: SystemVariableKey,
  pattern?: string
): string => {
  if (pattern && isValidSystemVariableFormat(key, pattern)) return pattern;
  return DEFAULT_SYSTEM_VARIABLE_FORMATS[key];
};
