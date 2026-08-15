import { readFileSync, readdirSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/** リポジトリルート */
const root = resolve(import.meta.dirname, '../../../..');

/** リポジトリルートからの相対パスでソースを読む */
const read = (path: string): string => readFileSync(resolve(root, path), 'utf8');

/** 指定ディレクトリ配下の .ts / .tsx を再帰的に集める */
function collectSources(dir: string): string[] {
  const entries = readdirSync(resolve(root, dir));
  return entries.flatMap((entry) => {
    const relative = `${dir}/${entry}`;
    if (statSync(resolve(root, relative)).isDirectory()) return collectSources(relative);
    return /\.tsx?$/.test(entry) ? [relative] : [];
  });
}

/**
 * サブスク状態の参照経路と画面の複製は、実DBテストから呼べないためソースで固定する。
 *
 * 分裂しても型チェックは通ってしまい、食い違いは実機・実ブラウザでしか現れないためである。
 */
describe('subscription source hygiene', () => {
  it('reads the subscription state through the shared context only', () => {
    /* web独自フックは権利検証失敗時に古いPro表示を残すため廃止した。復活させないこと */
    const offenders = collectSources('apps/web/src').filter((path) => read(path).includes('useWebSubscription'));
    expect(offenders).toEqual([]);
  });

  it('reuses the keyboard guide modal instead of duplicating it inline', () => {
    /* 複製するとiOSのフルアクセス注記が抜け落ちる（docs/機能仕様書.md §8.22） */
    const manage = read('apps/mobile/app/subscription/manage.tsx');
    expect(manage).toContain('KeyboardGuideModal');
    expect(manage).not.toContain('subscription.keyboard_guide_step');
  });

  it('keeps purchase operations out of the React provider layer', () => {
    /* 購入・復元・プラン取得の正は SubscriptionAdapter 側。Provider側へ再追加しない */
    const provider = read('packages/shared/src/providers/SubscriptionProvider.tsx');
    for (const member of ['restorePurchases', 'purchasePackage', 'getOfferings', 'getExpirationDate', 'getCurrentPlanType']) {
      expect(provider).not.toContain(member);
    }
  });
});
