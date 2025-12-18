/**
 * 共通バリデーションユーティリティ
 * 重複したバリデーションロジックを統合
 */

/**
 * 汎用的な名前重複チェックヘルパー
 */
export function checkNameDuplicate<T extends { id: string; name: string }>(
  name: string,
  getByName: (name: string) => T | null,
  excludeId?: string
): boolean {
  const existing = getByName(name);
  if (!existing) return false;
  if (excludeId && existing.id === excludeId) return false;
  return true;
}

/**
 * 名前の重複をチェックしてエラーをスロー
 */
export function validateNameUniqueness<T extends { id: string; name: string }>(
  name: string,
  getByName: (name: string) => T | null,
  excludeId?: string,
  entityType: string = 'item'
): void {
  if (checkNameDuplicate(name, getByName, excludeId)) {
    throw new Error(`${entityType} with name "${name}" already exists`);
  }
}
