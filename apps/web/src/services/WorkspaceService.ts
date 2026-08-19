/** ブラウザワークスペースを閉じる処理の依存関係 */
export interface WorkspaceCloseDependencies {
  resetDatabase: () => Promise<void>;
  clearCache: () => Promise<void>;
}

/** OPFS作業DBを閉じた後、永続キャッシュを削除する */
export async function closeWorkspace(dependencies: WorkspaceCloseDependencies): Promise<void> {
  await dependencies.resetDatabase();
  await dependencies.clearCache();
}
