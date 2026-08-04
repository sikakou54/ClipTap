import { describe, expect, it, vi } from 'vitest';
import { closeWorkspace } from '../../../../apps/web/src/services/WorkspaceService';
import { shouldShowSubscriptionVerificationWarning } from '../../../../apps/web/src/services/SubscriptionVerificationService';

describe('web service logic', () => {
  it('closes the working database before clearing its persistent cache', async () => {
    const calls: string[] = [];

    await closeWorkspace({
      resetDatabase: vi.fn(async () => { calls.push('database'); }),
      clearCache: vi.fn(async () => { calls.push('cache'); }),
    });

    expect(calls).toEqual(['database', 'cache']);
  });

  it('does not clear the cache when closing the database fails', async () => {
    const clearCache = vi.fn(async () => undefined);

    await expect(closeWorkspace({
      resetDatabase: vi.fn(async () => { throw new Error('reset failed'); }),
      clearCache,
    })).rejects.toThrow('reset failed');
    expect(clearCache).not.toHaveBeenCalled();
  });

  it.each([
    [true, true, true],
    [true, false, false],
    [false, true, false],
    [false, false, false],
  ])('shows the verification warning only for a signed-in failed check', (signedIn, failed, expected) => {
    expect(shouldShowSubscriptionVerificationWarning(signedIn, failed)).toBe(expected);
  });
});
