import { describe, expect, it, vi } from 'vitest';
import {
  loadInitialImportDatabase,
  type InitialImportDependencies,
} from '../../../../apps/web/src/services/InitialImportService';

interface TestDependencies {
  calls: string[];
  dependencies: InitialImportDependencies;
  resumeAutoSave: ReturnType<typeof vi.fn>;
}

/** 初回読込の順序・失敗時の巻き戻しを検証する依存モックを作成する */
function createDependencies(): TestDependencies {
  const calls: string[] = [];
  const resumeAutoSave = vi.fn(() => {
    calls.push('resume');
  });

  return {
    calls,
    resumeAutoSave,
    dependencies: {
      prepareDatabase: vi.fn(async () => {
        calls.push('prepare');
        return 'opfs://migrated.db';
      }),
      readPreparedDatabase: vi.fn(async () => {
        calls.push('read');
        return new Uint8Array([7]);
      }),
      suspendAutoSave: vi.fn(async () => {
        calls.push('suspend-cache');
        return resumeAutoSave;
      }),
      openDatabase: vi.fn(async () => {
        calls.push('open');
      }),
      finalizeDatabase: vi.fn(async () => {
        calls.push('finalize');
      }),
      persistDatabase: vi.fn(async () => {
        calls.push('persist');
      }),
      resetDatabase: vi.fn(async () => {
        calls.push('reset');
      }),
      cleanupDatabase: vi.fn(async () => {
        calls.push('cleanup');
      }),
    },
  };
}

describe('Web initial database import', () => {
  it('promotes and persists only after the temporary database is prepared', async () => {
    const { calls, dependencies, resumeAutoSave } = createDependencies();
    const migratedBytes = new Uint8Array([7]);
    dependencies.readPreparedDatabase = vi.fn(async () => {
      calls.push('read');
      return migratedBytes;
    });
    dependencies.openDatabase = vi.fn(async (bytes) => {
      calls.push('open');
      expect(bytes).toBe(migratedBytes);
    });

    await loadInitialImportDatabase('password', 'opfs://source.json', dependencies);

    expect(calls).toEqual([
      'prepare',
      'read',
      'suspend-cache',
      'open',
      'finalize',
      'persist',
      'resume',
      'cleanup',
    ]);
    expect(resumeAutoSave).toHaveBeenCalledTimes(1);
    expect(dependencies.resetDatabase).not.toHaveBeenCalled();
  });

  /**
   * 検証・移行に失敗したDBでメインDBを開かないことが本機能の要。
   * 準備段階の失敗では、キャッシュ停止もDB差し替えも起こしてはならない。
   */
  it('does not open the main database when preparation fails', async () => {
    const { calls, dependencies } = createDependencies();
    dependencies.prepareDatabase = vi.fn(async () => {
      calls.push('prepare');
      throw new Error('migration failed');
    });

    await expect(
      loadInitialImportDatabase('password', 'opfs://source.json', dependencies)
    ).rejects.toThrow('migration failed');

    expect(calls).toEqual(['prepare']);
    expect(dependencies.openDatabase).not.toHaveBeenCalled();
    expect(dependencies.suspendAutoSave).not.toHaveBeenCalled();
    expect(dependencies.resetDatabase).not.toHaveBeenCalled();
    expect(dependencies.cleanupDatabase).not.toHaveBeenCalled();
  });

  it('does not promote when the prepared database cannot be read', async () => {
    const { calls, dependencies } = createDependencies();
    dependencies.readPreparedDatabase = vi.fn(async () => {
      calls.push('read');
      throw new Error('read failed');
    });

    await expect(
      loadInitialImportDatabase('password', 'opfs://source.json', dependencies)
    ).rejects.toThrow('read failed');

    expect(calls).toEqual(['prepare', 'read', 'cleanup']);
    expect(dependencies.openDatabase).not.toHaveBeenCalled();
    expect(dependencies.resetDatabase).not.toHaveBeenCalled();
  });

  it.each([
    ['openDatabase', 'open'],
    ['finalizeDatabase', 'finalize'],
    ['persistDatabase', 'persist'],
  ] as const)(
    'resets the database and resumes auto save when %s fails',
    async (dependencyName, callName) => {
      const { calls, dependencies, resumeAutoSave } = createDependencies();
      dependencies[dependencyName] = vi.fn(async () => {
        calls.push(callName);
        throw new Error(`${callName} failed`);
      });

      await expect(
        loadInitialImportDatabase('password', 'opfs://source.json', dependencies)
      ).rejects.toThrow(`${callName} failed`);

      expect(calls).toEqual([
        'prepare',
        'read',
        'suspend-cache',
        ...(callName === 'open' ? [] : ['open']),
        ...(callName === 'persist' ? ['finalize'] : []),
        callName,
        'reset',
        'resume',
        'cleanup',
      ]);
      expect(resumeAutoSave).toHaveBeenCalledTimes(1);
    }
  );

  /** 巻き戻し自体が失敗しても、原因となった読込エラーを握り潰さない */
  it('reports the original failure when resetting also fails', async () => {
    const { dependencies, resumeAutoSave } = createDependencies();
    dependencies.finalizeDatabase = vi.fn(async () => {
      throw new Error('finalize failed');
    });
    dependencies.resetDatabase = vi.fn(async () => {
      throw new Error('reset failed');
    });

    await expect(
      loadInitialImportDatabase('password', 'opfs://source.json', dependencies)
    ).rejects.toThrow('finalize failed');

    expect(dependencies.resetDatabase).toHaveBeenCalledTimes(1);
    expect(resumeAutoSave).toHaveBeenCalledTimes(1);
    expect(dependencies.cleanupDatabase).toHaveBeenCalledTimes(1);
  });

  it('cleans up the prepared database without hiding an import failure', async () => {
    const { dependencies } = createDependencies();
    dependencies.openDatabase = vi.fn(async () => {
      throw new Error('open failed');
    });
    dependencies.cleanupDatabase = vi.fn(async () => {
      throw new Error('cleanup failed');
    });

    await expect(
      loadInitialImportDatabase('password', 'opfs://source.json', dependencies)
    ).rejects.toThrow('open failed');

    expect(dependencies.cleanupDatabase).toHaveBeenCalledWith('opfs://migrated.db');
  });

  it('keeps a successful load when cleaning up the prepared database fails', async () => {
    const { dependencies } = createDependencies();
    dependencies.cleanupDatabase = vi.fn(async () => {
      throw new Error('cleanup failed');
    });

    await expect(
      loadInitialImportDatabase('password', 'opfs://source.json', dependencies)
    ).resolves.toBeUndefined();
  });
});
