import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import type { SubscriptionAdapter } from '../../src/adapters/SubscriptionAdapter';
import {
  FREE_PROFILES_LIMIT,
  FREE_VARIABLES_LIMIT,
  SubscriptionService,
} from '../../src/services/SubscriptionService';

/**
 * 追加可否の判定は「無効なものも含む保存済み総数」で行う。
 *
 * 有効数で判定すると、上限超過で無効になった項目を抱えたまま追加を許してしまい、
 * 保存時に総数で拒否されて入力が無駄になる。判定基準は共通のSubscriptionServiceに
 * 一本化し、各画面が上限値の比較を書き直さないようにする。
 */
describe('add limit judgement', () => {
  /** 指定した権利状態のサブスクリプションアダプターを作る */
  const adapterFor = (subscribed: boolean): SubscriptionAdapter => ({
    isSubscribed: () => subscribed,
    isLoading: () => false,
    checkSubscription: async () => subscribed,
    subscribe: () => () => {},
    notifyListeners: () => {},
    refreshCustomerInfo: async () => {},
  });

  describe('SubscriptionService', () => {
    it('blocks a free user at the limit and allows a subscriber past it', () => {
      SubscriptionService.setAdapter(adapterFor(false));
      expect(SubscriptionService.canAddProfile(FREE_PROFILES_LIMIT - 1)).toBe(true);
      expect(SubscriptionService.canAddProfile(FREE_PROFILES_LIMIT)).toBe(false);
      expect(SubscriptionService.canAddVariable(FREE_VARIABLES_LIMIT - 1)).toBe(true);
      expect(SubscriptionService.canAddVariable(FREE_VARIABLES_LIMIT)).toBe(false);

      SubscriptionService.setAdapter(adapterFor(true));
      expect(SubscriptionService.canAddProfile(FREE_PROFILES_LIMIT)).toBe(true);
      expect(SubscriptionService.canAddVariable(FREE_VARIABLES_LIMIT)).toBe(true);
    });
  });

  /**
   * 判定基準は画面ごとに書けてしまうため、実装のソースで固定する。
   * フックのため実DBテストから直接呼べず、食い違いは実機でしか現れないためである。
   */
  describe('screen implementations', () => {
    const root = resolve(import.meta.dirname, '../../../..');
    const read = (path: string): string => readFileSync(resolve(root, path), 'utf8');

    let mobileProfiles = '';
    let mobileProfileEdit = '';
    let mobileVariables = '';
    let webProfiles = '';
    let webVariables = '';

    beforeEach(() => {
      mobileProfiles = read('apps/mobile/src/hooks/screens/useProfilesScreen.ts');
      mobileProfileEdit = read('apps/mobile/src/hooks/screens/useProfileEditScreen.ts');
      mobileVariables = read('apps/mobile/src/hooks/screens/useVariablesScreen.ts');
      webProfiles = read('apps/web/src/hooks/screens/useProfilesScreen.ts');
      webVariables = read('apps/web/src/hooks/screens/useVariablesScreen.ts');
    });

    it('counts every saved profile, including disabled ones', () => {
      /* 一覧の追加ボタンと編集画面の保存で同じ総数を使う */
      expect(mobileProfiles).toContain('canAddProfile(allProfiles.length)');
      expect(mobileProfileEdit).toContain('canAddProfile(profiles.length)');
      expect(webProfiles).toContain('canAddProfileForCount(profiles.length)');

      /* 有効数だけで判定する形に戻していないこと */
      expect(mobileProfiles).not.toContain('validProfilesCount');
    });

    it('counts every saved custom variable, including disabled ones', () => {
      expect(mobileVariables).toContain('canAddCustomVariable(variables.length)');
      expect(webVariables).toContain('canAddCustomVariable(customVariables.length)');
    });

    it('delegates the limit comparison instead of restating it per screen', () => {
      for (const source of [webProfiles, mobileProfiles, mobileProfileEdit]) {
        expect(source).not.toContain('< FREE_PROFILES_LIMIT');
      }
      for (const source of [webVariables, mobileVariables]) {
        expect(source).not.toContain('< FREE_VARIABLES_LIMIT');
      }
    });
  });
});
