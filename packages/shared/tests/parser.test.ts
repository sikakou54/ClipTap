import { describe, it, expect } from 'vitest';
import { hasVariables, extractVariables, replaceVariables } from '../src/variables/parser';

describe('VariableParser', () => {
  it('should detect variables', () => {
    expect(hasVariables('Hello {{name}}')).toBe(true);
    expect(hasVariables('Hello world')).toBe(false);
  });

  it('should extract variables', () => {
    const text = '{{name}} and {{age}}';
    expect(extractVariables(text)).toEqual(['name', 'age']);
  });

  it('should replace variables multiple times correctly (Regex state check)', async () => {
    /* This test ensures the "lastIndex" bug is fixed */
    const text = '{{a}} {{b}}';
    const resolver = (name: string) => name.toUpperCase();
    
    const result1 = await replaceVariables(text, { customResolver: resolver });
    expect(result1).toBe('A B');

    const result2 = await replaceVariables(text, { customResolver: resolver });
    expect(result2).toBe('A B');
  });

  it('should replace variables in long string', async () => {
    const text = 'Start {{var1}} middle {{var2}} end';
    const resolver = (name: string) => `[${name}]`;
    const result = await replaceVariables(text, { customResolver: resolver });
    expect(result).toBe('Start [var1] middle [var2] end');
  });
});

