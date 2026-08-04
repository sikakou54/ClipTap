/**
 * ExportMapper
 *
 * @description
 * 部分エクスポート用の一時データベース操作を担当するMapper。
 * 選択されていないデータの削除処理を行う。
 *
 * @module ExportMapper
 */

import type { DbAdapter } from '../adapters/DbAdapter';

/**
 * 部分エクスポート用の選択ID
 */
export interface ExportSelection {
  snippetIds: string[];
  profileIds: string[];
  variableIds: string[];
  categoryIds: string[];
}

/**
 * SQLプレースホルダーを生成
 * @param count - プレースホルダーの数
 * @returns プレースホルダー文字列 (例: "?, ?, ?")
 */
const placeholders = (count: number): string =>
  Array.from({ length: count }, () => '?').join(',');

/**
 * ExportMapperクラス
 *
 * @description
 * 部分エクスポート用の一時DB操作を担当する。
 * DbAdapterを使用してプラットフォーム差異を吸収する。
 */
export class ExportMapper {
  private adapter: DbAdapter;

  constructor(adapter: DbAdapter) {
    this.adapter = adapter;
  }

  /**
   * 選択されていないスニペットを削除
   *
   * @param selectedIds - 残すスニペットのID
   * @remarks snippet_profilesも同時に削除（関連データの整合性維持）
   */
  deleteUnselectedSnippets(selectedIds: string[]): void {
    if (selectedIds.length > 0) {
      const ph = placeholders(selectedIds.length);
      this.adapter.run(
        `DELETE FROM snippets WHERE id NOT IN (${ph})`,
        selectedIds
      );
      this.adapter.run(
        `DELETE FROM snippet_profiles WHERE snippetId NOT IN (${ph})`,
        selectedIds
      );
    } else {
      this.adapter.run('DELETE FROM snippets');
      this.adapter.run('DELETE FROM snippet_profiles');
    }
  }

  /**
   * 選択されていないプロファイルを削除
   *
   * @param selectedIds - 残すプロファイルのID
   * @remarks profile_variables, snippet_profilesも同時に削除（関連データの整合性維持）
   */
  deleteUnselectedProfiles(selectedIds: string[]): void {
    if (selectedIds.length > 0) {
      const ph = placeholders(selectedIds.length);
      this.adapter.run(
        `DELETE FROM profiles WHERE id NOT IN (${ph})`,
        selectedIds
      );
      this.adapter.run(
        `DELETE FROM profile_variables WHERE profileId NOT IN (${ph})`,
        selectedIds
      );
      this.adapter.run(
        `DELETE FROM snippet_profiles WHERE profileId NOT IN (${ph})`,
        selectedIds
      );
    } else {
      this.adapter.run('DELETE FROM profiles');
      this.adapter.run('DELETE FROM profile_variables');
      this.adapter.run('DELETE FROM snippet_profiles');
    }
  }

  /**
   * 選択されていないカスタム変数を削除
   *
   * @param selectedIds - 残す変数のID
   * @remarks システム変数は削除対象外。profile_variablesも同時に削除
   */
  deleteUnselectedVariables(selectedIds: string[]): void {
    if (selectedIds.length > 0) {
      const ph = placeholders(selectedIds.length);
      this.adapter.run(
        `DELETE FROM variables WHERE type = 'custom' AND id NOT IN (${ph})`,
        selectedIds
      );
      this.adapter.run(
        `DELETE FROM profile_variables WHERE variableId NOT IN (${ph})`,
        selectedIds
      );
    } else {
      this.adapter.run("DELETE FROM variables WHERE type = 'custom'");
    }
  }

  /**
   * 選択されていないカテゴリを削除
   *
   * @param selectedIds - 残すカテゴリのID
   * @remarks カテゴリ削除時、紐づくスニペットのcategoryIdはnullに設定（未分類化）
   */
  deleteUnselectedCategories(selectedIds: string[]): void {
    if (selectedIds.length > 0) {
      const ph = placeholders(selectedIds.length);
      /* 削除されるカテゴリを参照しているスニペットを未分類化 */
      this.adapter.run(
        `UPDATE snippets SET categoryId = NULL WHERE categoryId IS NOT NULL AND categoryId NOT IN (${ph})`,
        selectedIds
      );
      this.adapter.run(
        `DELETE FROM categories WHERE id NOT IN (${ph})`,
        selectedIds
      );
    } else {
      this.adapter.run('UPDATE snippets SET categoryId = NULL');
      this.adapter.run('DELETE FROM categories');
    }
  }

  /**
   * 参照先が部分エクスポート対象外になった関連行を削除する。
   *
   * 個別削除メソッドの呼び出し順や空配列分岐に依存させず、最後に必ず
   * 関連テーブルの整合性を回復する。
   */
  pruneOrphans(): void {
    this.adapter.run(`
      DELETE FROM profile_variables
      WHERE profileId NOT IN (SELECT id FROM profiles)
         OR variableId NOT IN (SELECT id FROM variables)
    `);
    this.adapter.run(`
      DELETE FROM snippet_profiles
      WHERE snippetId NOT IN (SELECT id FROM snippets)
         OR profileId NOT IN (SELECT id FROM profiles)
    `);
  }

  /**
   * 選択されていないデータを一括削除
   *
   * @param selection - 残すデータのID
   */
  deleteUnselectedData(selection: ExportSelection): void {
    this.deleteUnselectedSnippets(selection.snippetIds);
    this.deleteUnselectedProfiles(selection.profileIds);
    this.deleteUnselectedVariables(selection.variableIds);
    this.deleteUnselectedCategories(selection.categoryIds);
    this.pruneOrphans();
  }
}
