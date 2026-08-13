import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const testContext = vi.hoisted(() => ({
  mainOpen: true,
  systemOpen: true,
  mainData: new Uint8Array([1]),
  systemData: new Uint8Array([7]),
  cacheSave: vi.fn(),
}));

vi.mock('@cliptap/shared', () => ({
  DatabaseError: class DatabaseError extends Error {},
  getMainDbAdapter: () => ({
    isOpen: () => testContext.mainOpen,
    exportDatabase: () => testContext.mainData,
  }),
  getSystemDbAdapter: () => ({
    isOpen: () => testContext.systemOpen,
    exportDatabase: () => testContext.systemData,
  }),
}));

vi.mock('@services/CacheService', () => ({
  CacheService: {
    save: testContext.cacheSave,
  },
}));

vi.mock('@services/SubscriptionService', () => ({
  subscriptionService: {
    getCustomerId: () => null,
  },
}));

import { WebDbCacheManager } from '../../../../apps/web/src/adapters/WebDbCacheManager';

/** fake timer下でマイクロタスクの解決だけを進める */
async function flushMicrotasks(): Promise<void> {
  for (let index = 0; index < 5; index += 1) await Promise.resolve();
}

describe('WebDbCacheManager', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    testContext.mainOpen = true;
    testContext.systemOpen = true;
    testContext.mainData = new Uint8Array([1]);
    testContext.systemData = new Uint8Array([7]);
    testContext.cacheSave.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('debounces automatic saves into a single cache write', async () => {
    const manager = new WebDbCacheManager();

    manager.scheduleSave();
    manager.scheduleSave();
    manager.scheduleSave();
    await vi.advanceTimersByTimeAsync(300);

    expect(testContext.cacheSave).toHaveBeenCalledTimes(1);
  });

  /**
   * 初回読込はmainDBとsystemDBを閉じて差し替えるため、その最中に自動保存が走ると
   * systemDBを欠いたキャッシュが残り、次回起動の版判定が壊れる。
   */
  it('does not save while auto save is suspended', async () => {
    const manager = new WebDbCacheManager();
    const resumeAutoSave = await manager.suspendAutoSave();

    manager.scheduleSave();
    await vi.advanceTimersByTimeAsync(300);
    expect(testContext.cacheSave).not.toHaveBeenCalled();

    resumeAutoSave();
    manager.scheduleSave();
    await vi.advanceTimersByTimeAsync(300);
    expect(testContext.cacheSave).toHaveBeenCalledTimes(1);
  });

  it('drops a save already scheduled when auto save is suspended', async () => {
    const manager = new WebDbCacheManager();

    manager.scheduleSave();
    const resumeAutoSave = await manager.suspendAutoSave();
    await vi.advanceTimersByTimeAsync(300);

    expect(testContext.cacheSave).not.toHaveBeenCalled();
    resumeAutoSave();
  });

  it('waits for an already-started cache save before suspending', async () => {
    let finishSave: (() => void) | undefined;
    testContext.cacheSave.mockImplementationOnce(
      () => new Promise<void>((resolve) => {
        finishSave = resolve;
      })
    );
    const manager = new WebDbCacheManager();
    manager.scheduleSave();
    await vi.advanceTimersByTimeAsync(300);

    let suspensionFinished = false;
    const suspension = manager.suspendAutoSave().then((resume) => {
      suspensionFinished = true;
      return resume;
    });
    await flushMicrotasks();

    expect(suspensionFinished).toBe(false);
    finishSave?.();
    const resumeAutoSave = await suspension;
    expect(suspensionFinished).toBe(true);
    resumeAutoSave();
  });

  it.each([
    ['main', 'Main database is not open during cache persistence'],
    ['system', 'System database is not open during cache persistence'],
  ] as const)(
    'requires the %s database when persisting an initial import',
    async (database, message) => {
      const manager = new WebDbCacheManager();
      if (database === 'main') testContext.mainOpen = false;
      if (database === 'system') testContext.systemOpen = false;

      await expect(manager.flushOrThrow()).rejects.toThrow(message);
      expect(testContext.cacheSave).not.toHaveBeenCalled();
    }
  );

  it('persists main and system databases in one cache save', async () => {
    const manager = new WebDbCacheManager();

    await manager.flushOrThrow();

    expect(testContext.cacheSave).toHaveBeenCalledWith(
      testContext.mainData,
      null,
      testContext.systemData
    );
  });

  it('reports an IndexedDB failure to the caller when persisting an initial import', async () => {
    testContext.cacheSave.mockRejectedValueOnce(new Error('cache save failed'));
    const manager = new WebDbCacheManager();

    await expect(manager.flushOrThrow()).rejects.toThrow('cache save failed');
  });

  /** 通常の自動保存は失敗しても操作を止めない（consoleにだけ記録する） */
  it('swallows an IndexedDB failure during automatic saves', async () => {
    testContext.cacheSave.mockRejectedValueOnce(new Error('cache save failed'));
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const manager = new WebDbCacheManager();

    manager.scheduleSave();
    await vi.advanceTimersByTimeAsync(300);
    await flushMicrotasks();

    expect(testContext.cacheSave).toHaveBeenCalledTimes(1);
    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it('skips an automatic save while the main database is closed', async () => {
    testContext.mainOpen = false;
    const manager = new WebDbCacheManager();

    manager.scheduleSave();
    await vi.advanceTimersByTimeAsync(300);

    expect(testContext.cacheSave).not.toHaveBeenCalled();
  });

  it('serializes automatic saves so an older payload cannot overwrite a newer one', async () => {
    let finishFirstSave: (() => void) | undefined;
    testContext.cacheSave
      .mockImplementationOnce(
        () => new Promise<void>((resolve) => {
          finishFirstSave = resolve;
        })
      )
      .mockResolvedValueOnce(undefined);
    const manager = new WebDbCacheManager();

    manager.scheduleSave();
    await vi.advanceTimersByTimeAsync(300);
    expect(testContext.cacheSave).toHaveBeenCalledTimes(1);

    testContext.mainData = new Uint8Array([2]);
    manager.scheduleSave();
    await vi.advanceTimersByTimeAsync(300);
    expect(testContext.cacheSave).toHaveBeenCalledTimes(1);

    finishFirstSave?.();
    await flushMicrotasks();

    expect(testContext.cacheSave).toHaveBeenCalledTimes(2);
    expect(testContext.cacheSave.mock.calls[0]?.[0]).toEqual(new Uint8Array([1]));
    expect(testContext.cacheSave.mock.calls[1]?.[0]).toEqual(new Uint8Array([2]));
  });

  it('runs a strict flush after an in-flight automatic save completes', async () => {
    let finishFirstSave: (() => void) | undefined;
    testContext.cacheSave
      .mockImplementationOnce(
        () => new Promise<void>((resolve) => {
          finishFirstSave = resolve;
        })
      )
      .mockResolvedValueOnce(undefined);
    const manager = new WebDbCacheManager();

    manager.scheduleSave();
    await vi.advanceTimersByTimeAsync(300);
    expect(testContext.cacheSave).toHaveBeenCalledTimes(1);

    testContext.mainData = new Uint8Array([2]);
    const flush = manager.flushOrThrow();
    await flushMicrotasks();
    expect(testContext.cacheSave).toHaveBeenCalledTimes(1);

    finishFirstSave?.();
    await flush;

    expect(testContext.cacheSave).toHaveBeenCalledTimes(2);
    expect(testContext.cacheSave.mock.calls[1]?.[0]).toEqual(new Uint8Array([2]));
    expect(testContext.cacheSave.mock.calls[1]?.[2]).toEqual(testContext.systemData);
  });
});
