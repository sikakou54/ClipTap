import type { SupportedLocale } from '../variables/systemVariables';

/**
 * 曜日のロケール別表示名。
 * 配列の添字は Date.getDay() の戻り値（0=日曜 〜 6=土曜）に対応する。
 */
const WEEKDAYS_SHORT: Record<SupportedLocale, readonly string[]> = {
  ja: ['日', '月', '火', '水', '木', '金', '土'],
  en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
};

const WEEKDAYS_LONG: Record<SupportedLocale, readonly string[]> = {
  ja: ['日曜日', '月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日'],
  en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
};

const TOKEN_PATTERN = /yyyy|yy|MM|M|dd|d|HH|H|mm|ss|EEEE|EEE/g;

const pad2 = (value: number): string => String(value).padStart(2, '0');

/**
 * 共通プリセットで使用するトークンをローカル時刻で描画します。
 */
export const formatByPattern = (
  date: Date,
  pattern: string,
  locale: SupportedLocale
): string => {
  const values: Record<string, string> = {
    yyyy: String(date.getFullYear()).padStart(4, '0'),
    yy: pad2(date.getFullYear() % 100),
    MM: pad2(date.getMonth() + 1),
    M: String(date.getMonth() + 1),
    dd: pad2(date.getDate()),
    d: String(date.getDate()),
    HH: pad2(date.getHours()),
    H: String(date.getHours()),
    mm: pad2(date.getMinutes()),
    ss: pad2(date.getSeconds()),
    EEE: WEEKDAYS_SHORT[locale][date.getDay()] ?? '',
    EEEE: WEEKDAYS_LONG[locale][date.getDay()] ?? '',
  };

  return pattern.replace(TOKEN_PATTERN, (token) => values[token] ?? token);
};
