import { afterEach, describe, expect, it } from 'vitest';
import { setMainDbAdapter } from '../../src/adapters/DbAdapter';
import { CREATE_TABLES } from '../../src/database/schema';
import { VariableService } from '../../src/services/VariableService';
import { replaceVariables } from '../../src/variables/parser';
import {
  createMemoryDbAdapter,
  type MemoryDbAdapter,
} from '../helpers/memoryDbAdapter';

describe('custom variable resolution', () => {
  let db: MemoryDbAdapter | null = null;

  afterEach(() => {
    db?.dispose();
    db = null;
  });

  const setup = (): void => {
    db = createMemoryDbAdapter();
    setMainDbAdapter(db);
    for (const sql of Object.values(CREATE_TABLES)) void db.exec(sql);
    db.run(
      "INSERT INTO variables VALUES ('v1', 'token', 'custom', NULL, NULL, 1, 0, 'created', 'updated')"
    );
  };

  it.each([
    ['active non-empty value', 'active', 'default', 'active'],
    ['default non-empty fallback', '', 'default', 'default'],
    ['original token fallback', '', '', '{{token}}'],
  ])('%s', async (_name, active, standard, expected) => {
    setup();
    const resolver = VariableService.createCustomVariableResolver({
      isSubscribed: true,
      profileVariablesMap: { token: active },
      defaultProfileVariablesMap: { token: standard },
    });

    await expect(replaceVariables('{{token}}', { customResolver: resolver })).resolves.toBe(
      expected
    );
  });

  it('keeps unknown tokens and accepts long valid names in the service layer', async () => {
    setup();
    const longName = `variable_${'x'.repeat(60)}`;
    expect(() => VariableService.create({ name: longName, type: 'custom' })).not.toThrow();
    await expect(replaceVariables('{{unknown}}')).resolves.toBe('{{unknown}}');
  });
});
