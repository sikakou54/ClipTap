/**
 * スニペットサービス
 *
 * @description
 * スニペットのCRUD操作と変数展開を提供する共通サービス。
 * Mapper層を経由してデータアクセスを行う。
 *
 * @module SnippetService
 */

import { SnippetMapper } from '../mappers/SnippetMapper';
import type {
  Snippet,
  SnippetProfile,
  CreateSnippetInput,
  UpdateSnippetInput,
  SnippetSortBy,
} from '../schema';
import { NotFoundError, EmptyContentError } from '../errors';
import { hasVariables, replaceVariables, type VariableResolver } from '../variables/parser';
import { prepareSnippetForClipboard } from '../utils/snippetUtils';

/**
 * スニペットサービス
 */
export class SnippetService {
  /**
   * 全スニペットを取得
   *
   * @param filterByProfileId - プロファイルIDでフィルタリング（オプション）
   * @returns すべてのスニペットの配列（createdAtカラムの降順でソート済み）
   */
  static getAll(filterByProfileId?: string | null): Snippet[] {
    return SnippetMapper.getAll(filterByProfileId);
  }

  /**
   * IDでスニペットを取得
   *
   * @param id - スニペットのID
   * @returns スニペットオブジェクト（存在しない場合はnull）
   */
  static getById(id: string): Snippet | null {
    return SnippetMapper.getById(id);
  }

  /**
   * カテゴリIDでスニペットを取得
   *
   * @param categoryId - カテゴリのID（nullの場合は未分類スニペット）
   * @param filterByProfileId - プロファイルIDでフィルタリング（オプション）
   * @returns 指定カテゴリに属するスニペットの配列
   */
  static getByCategory(categoryId: string | null, filterByProfileId?: string | null): Snippet[] {
    return SnippetMapper.getByCategory(categoryId, filterByProfileId);
  }

  /**
   * スニペットを作成
   *
   * @param data - 作成するスニペットの情報
   * @returns 作成されたスニペット
   * @throws {EmptyContentError} コンテンツが空の場合
   */
  static create(data: CreateSnippetInput): Snippet {
    /* 本文が空の場合はエラー（スニペットは必ずコンテンツが必要） */
    if (!data.content || data.content.trim() === '') {
      throw new EmptyContentError();
    }
    /* バリデーション通過後、Mapper層に処理を委譲（データベース操作） */
    return SnippetMapper.create(data);
  }

  /**
   * スニペットを更新
   *
   * @param data - 更新するスニペットの情報
   * @returns 更新されたスニペット
   * @throws {NotFoundError} スニペットが存在しない場合
   */
  static update(data: UpdateSnippetInput): Snippet {
    /* 更新対象のスニペットが存在するか確認（存在しない場合はエラー） */
    const existing = SnippetMapper.getById(data.id);
    if (!existing) {
      throw new NotFoundError('snippet', data.id);
    }
    /* Mapper層に処理を委譲（データベース操作） */
    return SnippetMapper.update(data);
  }

  /**
   * スニペットを削除
   *
   * @param id - 削除するスニペットのID
   * @throws {NotFoundError} スニペットが存在しない場合
   */
  static delete(id: string): void {
    /* 削除対象のスニペットが存在するか確認（存在しない場合はエラー） */
    const existing = SnippetMapper.getById(id);
    if (!existing) {
      throw new NotFoundError('snippet', id);
    }
    /* Mapper層に処理を委譲（カスケード削除が実行される：snippet_profilesも削除） */
    SnippetMapper.delete(id);
  }

  /**
   * スニペットを検索
   *
   * @param query - 検索クエリ（タイトルまたはコンテンツに部分一致）
   * @param categoryId - カテゴリIDでフィルタリング（オプション）
   * @returns 検索にマッチしたスニペットの配列
   */
  static search(query: string, categoryId?: string): Snippet[] {
    return SnippetMapper.search(query, categoryId);
  }

  /**
   * ソート済みスニペットを取得
   *
   * @param sortBy - ソート基準（'created', 'updated', 'title', 'usage'）
   * @returns 指定された基準でソートされたスニペットの配列
   */
  static getSorted(sortBy: SnippetSortBy): Snippet[] {
    return SnippetMapper.getSorted(sortBy);
  }

  /**
   * スニペットのコピー回数をインクリメント
   *
   * @param id - スニペットのID
   * @description
   * コピー操作が成功した後に呼び出し、使用頻度を記録する
   */
  static incrementCopyCount(id: string): void {
    SnippetMapper.incrementCopyCount(id);
  }

  /**
   * スニペット数を取得
   *
   * @returns スニペットの総数
   */
  static count(): number {
    return SnippetMapper.count();
  }

  /**
   * カテゴリごとのスニペット数を取得
   *
   * @param categoryId - カテゴリのID（nullの場合は未分類スニペット）
   * @returns 指定カテゴリに属するスニペットの数
   */
  static countByCategory(categoryId: string | null): number {
    return SnippetMapper.countByCategory(categoryId);
  }

  /**
   * スニペットに紐づくプロファイルID一覧を取得
   *
   * @param snippetId - スニペットのID
   * @returns このスニペットに関連付けられているプロファイルIDの配列
   */
  static getProfileIds(snippetId: string): string[] {
    return SnippetMapper.getProfileIds(snippetId);
  }

  /**
   * スニペットに紐づくプロファイルIDを更新
   *
   * @param snippetId - スニペットのID
   * @param profileIds - 新しく関連付けるプロファイルIDの配列
   *
   * @remarks
   * - 既存の関連付けは全て削除され、新しい関連付けに置き換わる
   */
  static setProfileIds(snippetId: string, profileIds: string[]): void {
    SnippetMapper.setProfileIds(snippetId, profileIds);
  }

  /**
   * 全スニペット-プロファイル関連を取得
   *
   * @returns すべてのスニペットとプロファイルの関連データの配列
   */
  static getAllSnippetProfiles(): SnippetProfile[] {
    return SnippetMapper.getAllSnippetProfiles();
  }

  /**
   * テキストのプレビューを生成（変数展開後）
   *
   * @param text - プレビューを生成するテキスト
   * @param options - オプション
   * @param options.locale - ロケール（システム変数の日付フォーマット等に使用）
   * @param options.customResolver - カスタム変数リゾルバー
   * @returns 変数を展開した後のテキスト
   */
  static async getTextPreview(
    text: string,
    options?: {
      locale?: string;
      customResolver?: VariableResolver;
    }
  ): Promise<string> {
    /* 変数が含まれていない場合は早期リターン（パフォーマンス最適化、不要な処理を回避） */
    if (!hasVariables(text)) {
      return text;
    }

    /* 変数を実際の値に置換（システム変数とカスタム変数の両方を処理） */
    return replaceVariables(text, {
      locale: options?.locale,
      customResolver: options?.customResolver,
    });
  }

  /**
   * スニペットのプレビューを生成（変数展開後）
   *
   * @param id - スニペットのID
   * @param options - オプション
   * @param options.locale - ロケール（システム変数の日付フォーマット等に使用）
   * @param options.customResolver - カスタム変数リゾルバー
   * @returns 変数を展開した後のスニペットコンテンツ
   * @throws {NotFoundError} スニペットが見つからない場合
   */
  static async getPreview(
    id: string,
    options?: {
      locale?: string;
      customResolver?: VariableResolver;
    }
  ): Promise<string> {
    /* スニペットを取得（存在しない場合はエラー） */
    const snippet = SnippetMapper.getById(id);
    if (!snippet) {
      throw new NotFoundError('snippet', id);
    }

    /* 変数が含まれていない場合は早期リターン（パフォーマンス最適化、不要な処理を回避） */
    if (!hasVariables(snippet.content)) {
      return snippet.content;
    }

    /* 変数を実際の値に置換（システム変数とカスタム変数の両方を処理） */
    return replaceVariables(snippet.content, {
      locale: options?.locale,
      customResolver: options?.customResolver,
    });
  }

  /**
   * スニペットをクリップボードにコピーするためのテキストを準備
   *
   * @param id - スニペットのID
   * @param options - オプション
   * @param options.locale - ロケール（システム変数の日付フォーマット等に使用）
   * @param options.customResolver - カスタム変数リゾルバー
   * @param options.shouldReplaceVariables - 変数を置換するか（デフォルト: true）
   * @returns クリップボードにコピーするためのテキスト
   * @throws {NotFoundError} スニペットが見つからない場合
   *
   * @remarks
   * - copyWithTitleがtrueの場合、タイトルとコンテンツを結合する
   * - copyWithTitleがfalseの場合、コンテンツのみを返す
   * - shouldReplaceVariablesがtrueの場合、変数を実際の値に置換する
   */
  static async prepareForClipboard(
    id: string,
    options?: {
      locale?: string;
      customResolver?: VariableResolver;
      shouldReplaceVariables?: boolean;
    }
  ): Promise<string> {
    /* スニペットを取得（存在しない場合はエラー） */
    const snippet = SnippetMapper.getById(id);
    if (!snippet) {
      throw new NotFoundError('snippet', id);
    }

    /* クリップボード用テキストを準備（変数展開、タイトル結合等を処理） */
    return prepareSnippetForClipboard({
      snippet,
      customResolver: options?.customResolver,
      shouldReplaceVariables: options?.shouldReplaceVariables ?? true,
      locale: options?.locale,
    });
  }
}
