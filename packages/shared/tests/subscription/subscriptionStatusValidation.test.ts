import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SubscriptionStatusSchema } from '../../src/types/Subscription';

vi.mock('@constants/subscription', () => ({
  SUBSCRIPTION_API_BASE_URL: 'https://api.example.test',
}));

vi.mock('@services/FirebaseService', () => ({
  auth: {
    currentUser: {
      getIdToken: async () => 'dummy-id-token',
    },
  },
}));

import { WebSubscriptionAdapter } from '../../../../apps/web/src/adapters/WebSubscriptionAdapter';

/** 所定の5項目を満たす正常な応答 */
const VALID_PAYLOAD = {
  isSubscribed: true,
  expirationDate: '2026-08-14T00:00:00.000Z',
  activePlanId: 'monthly',
  willRenew: true,
  managementURL: null,
};

/** fetch を HTTP 200 + 任意のJSONで固定する */
function stubFetchWith(payload: unknown): void {
  globalThis.fetch = vi.fn(async () => ({
    ok: true,
    status: 200,
    json: async () => payload,
  })) as unknown as typeof fetch;
}

/**
 * サブスク状態APIの応答は HTTP 200 でも形状が壊れうる。
 *
 * 無検証にキャストすると isSubscribed が undefined のまま権利判定へ流れ、
 * 警告も出ないまま不定値で描画される。他の異常経路（URL未設定・トークン取得不可・
 * 非2xx・通信例外）と同じく「権利検証失敗」として扱うことを固定する。
 */
describe('subscription status payload validation', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  describe('SubscriptionStatusSchema', () => {
    it('accepts the five expected fields', () => {
      expect(SubscriptionStatusSchema.safeParse(VALID_PAYLOAD).success).toBe(true);
    });

    it('rejects a payload missing isSubscribed', () => {
      const { isSubscribed: _omitted, ...withoutFlag } = VALID_PAYLOAD;
      expect(SubscriptionStatusSchema.safeParse(withoutFlag).success).toBe(false);
    });

    it('rejects a payload whose expirationDate is not a string', () => {
      expect(SubscriptionStatusSchema.safeParse({ ...VALID_PAYLOAD, expirationDate: 1755000000 }).success).toBe(false);
    });
  });

  describe('WebSubscriptionAdapter.checkSubscription', () => {
    it('treats a well-formed response as a successful verification', async () => {
      stubFetchWith(VALID_PAYLOAD);
      const adapter = new WebSubscriptionAdapter();

      await expect(adapter.checkSubscription('uid-1')).resolves.toBe(true);
      expect(adapter.hasVerificationFailed()).toBe(false);
      expect(adapter.isSubscribed()).toBe(true);
    });

    it('fails verification when isSubscribed is missing', async () => {
      const { isSubscribed: _omitted, ...withoutFlag } = VALID_PAYLOAD;
      stubFetchWith(withoutFlag);
      const adapter = new WebSubscriptionAdapter();

      await expect(adapter.checkSubscription('uid-1')).resolves.toBe(false);
      expect(adapter.hasVerificationFailed()).toBe(true);
      expect(adapter.isSubscribed()).toBe(false);
    });

    it('fails verification when expirationDate has the wrong type', async () => {
      stubFetchWith({ ...VALID_PAYLOAD, expirationDate: 1755000000 });
      const adapter = new WebSubscriptionAdapter();

      await expect(adapter.checkSubscription('uid-1')).resolves.toBe(false);
      expect(adapter.hasVerificationFailed()).toBe(true);
    });
  });
});
