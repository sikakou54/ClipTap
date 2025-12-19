/**
 * スニペット関連ユーティリティ
 *
 * @description
 * スニペット関連のユーティリティ関数を提供。
 *
 * @module snippetFilterUtils
 */

import type { Snippet, SnippetProfile } from '../schema';

/**
 * 各プロファイルのスニペット数を計算
 *
 * @param snippets - スニペット一覧
 * @param snippetProfiles - スニペット-プロファイル関連一覧
 * @param profileId - プロファイルID
 * @returns 該当プロファイルのスニペット数
 */
export function getSnippetCountByProfile(
  snippets: Snippet[],
  snippetProfiles: SnippetProfile[],
  profileId: string
): number {
  /* snippet_profilesマップを作成 */
  const snippetProfileMap = new Map<string, string[]>();
  for (const sp of snippetProfiles) {
    const existing = snippetProfileMap.get(sp.snippetId) || [];
    existing.push(sp.profileId);
    snippetProfileMap.set(sp.snippetId, existing);
  }

  /* 指定プロファイルに関連するスニペット数をカウント */
  return snippets.filter((snippet) => {
    const profileIds = snippetProfileMap.get(snippet.id);
    /* snippet_profilesに登録されていない（全環境対応）か、指定プロファイルに紐づくスニペット */
    return !profileIds || profileIds.length === 0 || profileIds.includes(profileId);
  }).length;
}
