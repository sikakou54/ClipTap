import { beforeEach, describe, expect, it, vi } from 'vitest';

const testContext = vi.hoisted(() => {
  const state = {
    files: new Map<string, Uint8Array>(),
    calls: [] as string[],
    mainOpen: false,
    systemOpen: false,
    mainMemory: undefined as Uint8Array | undefined,
    systemMemory: undefined as Uint8Array | undefined,
    systemVersionAtOpen: 0,
    systemBytesAtOpen: undefined as Uint8Array | undefined,
  };

  const fileIO = {
    writeBytes: vi.fn(async (path: string, data: Uint8Array) => {
      state.calls.push(`write:${path}`);
      state.files.set(path, new Uint8Array(data));
      return path;
    }),
    exists: vi.fn(async (path: string) => state.files.has(path)),
    readBytes: vi.fn(async (path: string) => {
      const data = state.files.get(path);
      if (!data) throw new Error(`Missing file: ${path}`);
      return new Uint8Array(data);
    }),
    deleteFile: vi.fn(async (path: string) => {
      state.calls.push(`delete:${path}`);
      state.files.delete(path);
    }),
  };

  const mainDbAdapter = {
    open: vi.fn(async (path: string) => {
      state.calls.push(`open-main:${path}`);
      state.mainOpen = true;
      const bytes = state.files.get(path);
      state.mainMemory = bytes ? new Uint8Array(bytes) : new Uint8Array();
    }),
    close: vi.fn(() => {
      state.mainOpen = false;
      state.mainMemory = undefined;
    }),
    isOpen: vi.fn(() => state.mainOpen),
    exportDatabase: vi.fn(() => {
      if (!state.mainMemory) throw new Error('Main database is not open');
      return new Uint8Array(state.mainMemory);
    }),
  };

  const systemDbAdapter = {
    open: vi.fn(async (path: string) => {
      state.calls.push(`open-system:${path}`);
      state.systemOpen = true;
      const bytes = state.files.get(path);
      state.systemMemory = bytes ? new Uint8Array(bytes) : new Uint8Array();
      state.systemBytesAtOpen = bytes ? new Uint8Array(bytes) : undefined;
      state.systemVersionAtOpen = bytes?.[0] ?? 0;
    }),
    close: vi.fn(() => {
      state.systemOpen = false;
      state.systemMemory = undefined;
    }),
    isOpen: vi.fn(() => state.systemOpen),
    exportDatabase: vi.fn(() => {
      if (!state.systemMemory) throw new Error('System database is not open');
      return new Uint8Array(state.systemMemory);
    }),
  };

  return {
    state,
    fileIO,
    mainDbAdapter,
    systemDbAdapter,
    cacheLoad: vi.fn(),
    cacheFlush: vi.fn(async () => undefined),
    suspendAutoSave: vi.fn(async () => vi.fn()),
    sqliteInit: vi.fn(async () => undefined),
    runMigrations: vi.fn(async () => undefined),
    loadRegistry: vi.fn(),
  };
});

vi.mock('@cliptap/shared', () => ({
  Logger: {
    info: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
  },
  ProfileService: {
    ensureDefaultAndActive: vi.fn(),
  },
  SCHEMA_VERSION: 7,
  SystemVariableFormatMapper: {
    loadRegistry: testContext.loadRegistry,
  },
  getFileIOAdapter: () => testContext.fileIO,
  getMainDbAdapter: () => testContext.mainDbAdapter,
  getSchemaVersionFromDb: () => testContext.state.systemVersionAtOpen,
  getSystemDbAdapter: () => testContext.systemDbAdapter,
  runMigrations: testContext.runMigrations,
  setSchemaVersionToDb: vi.fn(async () => undefined),
  toOpfsPath: (fileName: string) => `opfs://${fileName}`,
}));

vi.mock('@src/mappers/sqliteWasm', () => ({
  SQLiteWasm: {
    init: testContext.sqliteInit,
  },
}));

vi.mock('@services/CacheService', () => ({
  CacheService: {
    load: testContext.cacheLoad,
  },
}));

vi.mock('@adapters/WebDbCacheManager', () => ({
  webDbCacheManager: {
    flush: testContext.cacheFlush,
    suspendAutoSave: testContext.suspendAutoSave,
  },
}));

describe('Web database initialization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    testContext.state.files.clear();
    testContext.state.calls.length = 0;
    testContext.state.mainOpen = false;
    testContext.state.systemOpen = false;
    testContext.state.mainMemory = undefined;
    testContext.state.systemMemory = undefined;
    testContext.state.systemVersionAtOpen = 0;
    testContext.state.systemBytesAtOpen = undefined;
  });

  it('deletes a stale OPFS system database before opening a legacy cache without systemDbData', async () => {
    const staleSystemBytes = new Uint8Array([7, 70]);
    testContext.state.files.set('opfs://system.db', staleSystemBytes);
    testContext.cacheLoad.mockResolvedValue({
      data: new Uint8Array([4, 40]),
      customerId: null,
      schemaVersion: 4,
    });

    const { database } = await import('../../../../apps/web/src/database/database');
    await database.init();

    expect(testContext.fileIO.deleteFile).toHaveBeenCalledWith('opfs://system.db');
    expect(testContext.state.systemBytesAtOpen).toBeUndefined();
    expect(testContext.runMigrations).toHaveBeenCalledWith(
      testContext.mainDbAdapter,
      testContext.systemDbAdapter,
      4
    );

    const deleteIndex = testContext.state.calls.indexOf('delete:opfs://system.db');
    const openIndex = testContext.state.calls.indexOf('open-system:opfs://system.db');
    expect(deleteIndex).toBeGreaterThanOrEqual(0);
    expect(openIndex).toBeGreaterThan(deleteIndex);
    expect(database.hasCache()).toBe(true);
    expect(database.isReady()).toBe(true);
  });

  it('writes cached systemDbData before opening it instead of deleting it', async () => {
    const cachedSystemBytes = new Uint8Array([6, 60]);
    testContext.state.files.set('opfs://system.db', new Uint8Array([7, 70]));
    testContext.cacheLoad.mockResolvedValue({
      data: new Uint8Array([6, 61]),
      systemDbData: cachedSystemBytes,
      customerId: null,
      schemaVersion: 4,
    });

    const { database } = await import('../../../../apps/web/src/database/database');
    await database.init();

    expect(testContext.fileIO.deleteFile).not.toHaveBeenCalledWith('opfs://system.db');
    expect(testContext.state.systemBytesAtOpen).toEqual(cachedSystemBytes);
    expect(testContext.runMigrations).toHaveBeenCalledWith(
      testContext.mainDbAdapter,
      testContext.systemDbAdapter,
      6
    );

    const writeIndex = testContext.state.calls.indexOf('write:opfs://system.db');
    const openIndex = testContext.state.calls.indexOf('open-system:opfs://system.db');
    expect(writeIndex).toBeGreaterThanOrEqual(0);
    expect(openIndex).toBeGreaterThan(writeIndex);
  });

  it('stops initialization when stale system database deletion reports success but leaves the file', async () => {
    testContext.state.files.set('opfs://system.db', new Uint8Array([7, 70]));
    testContext.cacheLoad.mockResolvedValue({
      data: new Uint8Array([4, 40]),
      customerId: null,
      schemaVersion: 4,
    });
    testContext.fileIO.deleteFile.mockImplementationOnce(async (path: string) => {
      testContext.state.calls.push(`delete:${path}`);
    });

    const { database } = await import('../../../../apps/web/src/database/database');

    await expect(database.init()).rejects.toThrow();
    expect(testContext.state.files.has('opfs://system.db')).toBe(true);
    expect(testContext.systemDbAdapter.open).not.toHaveBeenCalled();
    expect(testContext.runMigrations).not.toHaveBeenCalled();
    expect(database.isReady()).toBe(false);
  });

  it('opens a fresh system database when promoting an initial import', async () => {
    testContext.state.files.set('opfs://system.db', new Uint8Array([8, 80]));
    testContext.state.systemOpen = true;
    const importedMain = new Uint8Array([7, 71]);

    const { database } = await import('../../../../apps/web/src/database/database');
    await database.openImportedDatabase(importedMain);

    expect(testContext.state.files.get('opfs://main.db')).toEqual(importedMain);
    expect(testContext.fileIO.deleteFile).toHaveBeenCalledWith('opfs://system.db');
    expect(testContext.state.systemBytesAtOpen).toBeUndefined();
    expect(testContext.state.systemVersionAtOpen).toBe(0);

    const deleteIndex = testContext.state.calls.indexOf('delete:opfs://system.db');
    const openIndex = testContext.state.calls.indexOf('open-system:opfs://system.db');
    expect(openIndex).toBeGreaterThan(deleteIndex);
  });

  /**
   * 初回読込の失敗時は、昇格しかけたDBを破棄して未読込状態へ戻す。
   * 到達時点のワークスペースは空なので、退避した内容の復元は不要。
   */
  it('discards a half-promoted database and returns to the unloaded state', async () => {
    testContext.state.files.set('opfs://main.db', new Uint8Array([7, 99]));
    testContext.state.files.set('opfs://system.db', new Uint8Array([8, 80]));
    testContext.state.mainOpen = true;
    testContext.state.systemOpen = true;

    const { database } = await import('../../../../apps/web/src/database/database');
    await database.openImportedDatabase(new Uint8Array([7, 99]));
    expect(database.isReady()).toBe(true);

    await database.reset();

    expect(testContext.mainDbAdapter.close).toHaveBeenCalled();
    expect(testContext.systemDbAdapter.close).toHaveBeenCalled();
    expect(testContext.state.files.has('opfs://main.db')).toBe(false);
    expect(testContext.state.files.has('opfs://system.db')).toBe(false);
    expect(database.isReady()).toBe(false);
    expect(database.hasCache()).toBe(false);
  });
});
