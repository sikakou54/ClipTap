import { describe, expect, it } from 'vitest';
import goldenCases from './fixtures/patternGolden.json';
import {
  DEFAULT_SYSTEM_VARIABLE_FORMATS,
  SYSTEM_VARIABLE_FORMAT_PRESETS,
  type SystemVariableKey,
} from '../src/constants/systemVariableFormats';
import { formatByPattern } from '../src/utils/dateFormatter';
import { formatDate } from '../src/utils/dateHelpers';
import { resolveSystemVariableValue } from '../src/variables/systemVariables';

interface GoldenCase {
  key: SystemVariableKey;
  pattern: string;
  ja: string;
  en: string;
}

const FIXED_DATE = new Date(2026, 7, 4, 9, 5, 7);

describe('formatByPattern', () => {
  it('renders every preset identically to the golden fixture', () => {
    for (const testCase of goldenCases as GoldenCase[]) {
      expect(formatByPattern(FIXED_DATE, testCase.pattern, 'ja')).toBe(testCase.ja);
      expect(formatByPattern(FIXED_DATE, testCase.pattern, 'en')).toBe(testCase.en);
    }
  });

  it('keeps the fixture synchronized with every allowed preset', () => {
    for (const [key, presets] of Object.entries(SYSTEM_VARIABLE_FORMAT_PRESETS)) {
      expect(
        (goldenCases as GoldenCase[])
          .filter((testCase) => testCase.key === key)
          .map((testCase) => testCase.pattern)
      ).toEqual(presets);
    }
  });

  it('replaces repeated tokens globally', () => {
    expect(formatDate(FIXED_DATE, 'yyyy/yyyy MM/MM dd/dd')).toBe(
      '2026/2026 08/08 04/04'
    );
  });
});

describe('resolveSystemVariableValue', () => {
  it('preserves all default outputs when no formats are supplied', () => {
    for (const testCase of goldenCases as GoldenCase[]) {
      if (testCase.pattern !== DEFAULT_SYSTEM_VARIABLE_FORMATS[testCase.key]) continue;
      expect(resolveSystemVariableValue(testCase.key, 'ja', FIXED_DATE)).toBe(testCase.ja);
    }
  });

  it('falls back to the default when a stored pattern is invalid', () => {
    expect(
      resolveSystemVariableValue('today', 'ja', FIXED_DATE, { today: 'yyyy-mm-dd' })
    ).toBe('2026/08/04');
  });
});
