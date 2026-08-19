import { beforeEach, describe, expect, it, vi } from 'vitest';
import { setAuthAdapter, type AuthAdapter } from '../../src/adapters/AuthAdapter';
import type { SubscriptionAdapter } from '../../src/adapters/SubscriptionAdapter';
import { AuthService } from '../../src/services/AuthService';
import { SubscriptionService } from '../../src/services/SubscriptionService';
import { Logger } from '../../src/utils/logger';

/**
 * サインアウトはFirebaseの解除だけでなく、RevenueCatの利用者識別も解除する。
 *
 * 解除を呼ばないと端末に前回のApp User IDが残り、サインアウト後もアプリ再起動後も
 * 他人のPro権利を復元し続ける。一方で解除は外部通信のため、失敗しても
 * サインアウト自体は成立させる（CLAUDE.mdの「外部通信の失敗でローカル業務機能を壊さない」）。
 */
describe('AuthService sign-out', () => {
  /** 呼び出し順を記録するための共通の記録先 */
  let calls: string[] = [];

  /** サインアウトだけを記録するダミーの認証アダプター */
  const authAdapterStub = (): AuthAdapter => ({
    signInWithGoogle: async () => { calls.push('signInWithGoogle'); },
    signInWithApple: async () => { calls.push('signInWithApple'); },
    signOut: async () => { calls.push('auth.signOut'); },
    getCurrentUser: () => null,
    onAuthStateChanged: () => () => {},
  });

  /** logout の挙動だけを差し替えられるダミーの課金アダプター */
  const subscriptionAdapterStub = (
    logout?: () => Promise<void>
  ): SubscriptionAdapter => ({
    isSubscribed: () => false,
    isLoading: () => false,
    checkSubscription: async () => false,
    subscribe: () => () => {},
    notifyListeners: () => {},
    ...(logout ? { logout } : {}),
  });

  beforeEach(() => {
    calls = [];
    setAuthAdapter(authAdapterStub());
    vi.restoreAllMocks();
  });

  it('unlinks RevenueCat after the auth adapter has signed out', async () => {
    SubscriptionService.setAdapter(subscriptionAdapterStub(async () => {
      calls.push('subscription.logout');
    }));

    await AuthService.signOut();

    expect(calls).toEqual(['auth.signOut', 'subscription.logout']);
  });

  it('still resolves the sign-out when the RevenueCat logout rejects', async () => {
    const warn = vi.spyOn(Logger, 'warn').mockImplementation(() => {});
    SubscriptionService.setAdapter(subscriptionAdapterStub(async () => {
      calls.push('subscription.logout');
      throw new Error('network unavailable');
    }));

    await expect(AuthService.signOut()).resolves.toBeUndefined();

    expect(calls).toEqual(['auth.signOut', 'subscription.logout']);
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it('is a no-op when the platform adapter has no logout (web)', async () => {
    SubscriptionService.setAdapter(subscriptionAdapterStub());

    await expect(AuthService.signOut()).resolves.toBeUndefined();

    expect(calls).toEqual(['auth.signOut']);
  });
});
