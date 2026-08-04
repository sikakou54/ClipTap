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
    'yyyy/M/d',
    'yy/MM/dd',
    'yy/M/d',
    'yyyy-MM-dd',
    'yyyy-M-d',
    'yy-MM-dd',
    'yy-M-d',
    'yyyy.MM.dd',
    'yyyy.M.d',
    'yy.MM.dd',
    'yy.M.d',
    'yyyy年MM月dd日',
    'yyyy年M月d日',
    'yy年MM月dd日',
    'yy年M月d日',
    'MM/dd',
    'M/d',
    'MM-dd',
    'M-d',
    'MM.dd',
    'M.d',
    'MM月dd日',
    'M月d日',
    'MM/dd/yyyy',
    'M/d/yyyy',
    'MM/dd/yy',
    'M/d/yy',
    'dd/MM/yyyy',
    'd/M/yyyy',
    'dd/MM/yy',
    'd/M/yy',
    'yyyyMMdd',
    'yyMMdd',
  ],
  now: [
    'yyyy/MM/dd HH:mm:ss',
    'yyyy/MM/dd HH:mm',
    'yyyy/M/d H:mm:ss',
    'yyyy/M/d H:mm',
    'yy/MM/dd HH:mm:ss',
    'yy/MM/dd HH:mm',
    'yyyy-MM-dd HH:mm:ss',
    'yyyy-MM-dd HH:mm',
    'yyyy-M-d H:mm:ss',
    'yyyy-M-d H:mm',
    'yy-MM-dd HH:mm:ss',
    'yy-MM-dd HH:mm',
    'yyyy.MM.dd HH:mm:ss',
    'yyyy.MM.dd HH:mm',
    'yyyy.M.d H:mm:ss',
    'yyyy.M.d H:mm',
    'yyyy年MM月dd日 HH時mm分ss秒',
    'yyyy年MM月dd日 HH時mm分',
    'yyyy年M月d日 H時mm分ss秒',
    'yyyy年M月d日 H時mm分',
    'yy年MM月dd日 HH時mm分ss秒',
    'yy年MM月dd日 HH時mm分',
    'MM/dd/yyyy HH:mm:ss',
    'MM/dd/yyyy HH:mm',
    'M/d/yyyy HH:mm:ss',
    'M/d/yyyy HH:mm',
    'd/M/yyyy HH:mm:ss',
    'd/M/yyyy HH:mm',
    'MM/dd HH:mm:ss',
    'MM/dd HH:mm',
    'M/d HH:mm:ss',
    'M/d HH:mm',
    'yyyyMMdd HHmmss',
    'yyyyMMdd HHmm',
  ],
  time: [
    'HH:mm',
    'HH:mm:ss',
    'H:mm',
    'H:mm:ss',
    'HH時mm分',
    'HH時mm分ss秒',
    'H時mm分',
    'H時mm分ss秒',
    'HHmm',
    'HHmmss',
  ],
  year: ['yyyy', 'yyyy年', 'yy', 'yy年'],
  month: ['MM', 'MM月', 'M', 'M月'],
  day: ['dd', 'dd日', 'd', 'd日'],
  weekday: ['EEE', '(EEE)', 'EEEE', '(EEEE)'],
};

/**
 * 類似する表記が隣接する共通順序でプリセットを返します。
 */
export const getSystemVariableFormatPresets = (
  key: SystemVariableKey,
  _locale: 'ja' | 'en'
): readonly string[] => SYSTEM_VARIABLE_FORMAT_PRESETS[key];

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
