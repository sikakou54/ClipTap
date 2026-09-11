/**
 * ショートカットサービス
 *
 * @description
 * ショートカットと、そのショートカットが持つ値のCRUD操作を提供する共通サービス。
 * Mapper層を経由してデータアクセスを行う。
 * Mobile/Webで共通のビジネスロジック（バリデーション含む）を提供。
 *
 * @module ShortcutService
 */

import { ShortcutMapper } from '../mappers/ShortcutMapper';
import type {
  CreateShortcutInput,
  Shortcut,
  ShortcutValueInput,
  UpdateShortcutInput,
} from '../schema';
import {
  DuplicateNameError,
  EmptyContentError,
  ShortcutValueNameRequiredError,
  ShortcutValueRequiredError,
} from '../errors';

/**
 * ショートカットサービス
 *
 * @description
 * 静的メソッドでショートカット操作を提供。
 * バリデーションを行い、Mapper層に処理を委譲。
 */
export class ShortcutService {
  /**
   * 指定プロファイルのショートカットを取得
   *
   * @param profileId - 所属プロファイルID
   * @returns ショートカットの配列（sortOrderの昇順でソート済み、値も並び順）
   */
  static getByProfileId(profileId: string): Shortcut[] {
    return ShortcutMapper.getByProfileId(profileId);
  }

  /**
   * IDでショートカットを取得
   *
   * @param id - ショートカットのID
   * @returns ショートカット（存在しない場合はnull）
   */
  static getById(id: string): Shortcut | null {
    return ShortcutMapper.getById(id);
  }

  /**
   * プロファイル内の名前でショートカットを取得
   *
   * @param profileId - 所属プロファイルID
   * @param name - ショートカット名
   * @returns ショートカット（存在しない場合はnull）
   */
  static getByName(profileId: string, name: string): Shortcut | null {
    return ShortcutMapper.getByName(profileId, name);
  }

  /**
   * ショートカットを作成
   *
   * @param input - 作成するショートカットの情報
   * @returns 作成されたショートカット
   * @throws {EmptyContentError} ショートカット名が空の場合
   * @throws {DuplicateNameError} 同じプロファイルに同名のショートカットが既に存在する場合
   * @throws {ShortcutValueRequiredError} 値が1件も無い場合
   * @throws {ShortcutValueNameRequiredError} 値名が空の値がある場合
   *
   * @remarks
   * 呼び出し側はアクティブなプロファイルのIDを渡す。
   */
  static create(input: CreateShortcutInput): Shortcut {
    /* ショートカット名の前後空白をトリム（ユーザー入力の正規化） */
    const trimmedName = input.name.trim();

    /* 空白のみの名前は一覧で識別できず重複判定もすり抜けるため、trim後の空文字を拒否する */
    if (!trimmedName) {
      throw new EmptyContentError();
    }

    /* 同じプロファイルに同名のショートカットが既に存在するかチェック（重複防止）。
       名前の一意性はプロファイル内に限るため、別プロファイルの同名は許す */
    const existing = ShortcutMapper.getByName(input.profileId, trimmedName);
    if (existing) {
      throw new DuplicateNameError('shortcut', trimmedName);
    }

    const values = this.normalizeValues(input.values);

    /* 検証はService、SQLはMapperに集約する規約のため、検証済みデータをそのままMapperへ渡す */
    return ShortcutMapper.create(input.profileId, trimmedName, values);
  }

  /**
   * ショートカットを更新
   *
   * @param input - 更新するショートカットの情報
   * @returns 更新されたショートカット
   * @throws {EmptyContentError} ショートカット名が空の場合
   * @throws {DuplicateNameError} 移動先のプロファイルに同名のショートカットが既に存在する場合（自分以外）
   * @throws {ShortcutValueRequiredError} 値をすべて削除しようとした場合
   * @throws {ShortcutValueNameRequiredError} 値名が空の値がある場合
   *
   * @remarks
   * profileIdを指定すると所属プロファイルを移す。値と使用回数はそのまま持ち越す。
   */
  static update(input: UpdateShortcutInput): Shortcut {
    /* 更新対象の現在の所属を知らないと、名前の重複をどのプロファイル内で見るかが決まらない */
    const current = ShortcutMapper.getById(input.id);
    if (!current) {
      throw new Error(`Shortcut not found: ${input.id}`);
    }

    const targetProfileId = input.profileId ?? current.profileId;
    let trimmedName: string | undefined;

    /* ショートカット名が指定されている場合はバリデーションと重複チェック */
    if (input.name !== undefined) {
      trimmedName = input.name.trim();

      /* 空白のみの名前は一覧で識別できず重複判定もすり抜けるため、trim後の空文字を拒否する */
      if (!trimmedName) {
        throw new EmptyContentError();
      }
    }

    /* 重複は移動先のプロファイルで見る。名前を変えなくてもプロファイルを移せば
       移動先に同名がある可能性があるため、名前変更の有無にかかわらず確認する */
    const nameToCheck = trimmedName ?? current.name;
    const existing = ShortcutMapper.getByName(targetProfileId, nameToCheck);
    if (existing && existing.id !== input.id) {
      throw new DuplicateNameError('shortcut', nameToCheck);
    }

    const values =
      input.values !== undefined ? this.normalizeValues(input.values) : undefined;

    /* 検証はService、SQLはMapperに集約する規約のため、検証済みデータをそのままMapperへ渡す */
    return ShortcutMapper.update(input.id, trimmedName, values, input.profileId);
  }

  /**
   * ショートカットを削除
   *
   * @param id - 削除するショートカットのID
   *
   * @remarks
   * ショートカットが持つ値もすべて削除される。
   */
  static delete(id: string): void {
    ShortcutMapper.delete(id);
  }

  /**
   * ショートカットの並び順を更新
   *
   * @param orderedIds - 新しい順序でのショートカットID配列
   */
  static reorder(orderedIds: string[]): void {
    ShortcutMapper.updateOrder(orderedIds);
  }

  /**
   * ショートカット値の使用回数を1加算する
   *
   * @param valueId - ショートカット値のID
   * @param shortcutId - 所属するショートカットのID
   *
   * @remarks
   * 値単位の候補推測の並べ替え根拠になる。加算するのは拡張キーボードから値を挿入したときだけで、
   * アプリ内にショートカットを挿入する画面は無いため、実行時の呼び出し元はネイティブ側にしかない。
   * 振る舞いの正本としてここに置き、TypeScript側からはテストが呼んで固定している。
   */
  static recordUse(valueId: string, shortcutId: string): void {
    ShortcutMapper.incrementUseCount(valueId, shortcutId);
  }

  /**
   * 指定プロファイルのショートカット数を取得
   *
   * @param profileId - 所属プロファイルID
   * @returns ショートカット数
   */
  static count(profileId: string): number {
    return ShortcutMapper.count(profileId);
  }

  /**
   * 値一覧を保存できる形へ正規化する
   *
   * @param inputs - 画面から渡された値一覧
   * @returns 前後空白を除去した値一覧
   * @throws {ShortcutValueRequiredError} 値が1件も無い場合
   * @throws {ShortcutValueNameRequiredError} 値名が空の値がある場合
   *
   * @remarks
   * 値名は一覧での識別に使うため必須とする。
   * 挿入する値そのものは空文字を許容する（空文字の挿入を選ぶ利用者の意図を壊さない）。
   */
  private static normalizeValues(inputs: ShortcutValueInput[]): ShortcutValueInput[] {
    const normalized = inputs.map((input) => ({
      id: input.id,
      name: input.name.trim(),
      value: input.value.trim(),
    }));

    /* 値が1件も無いショートカットは拡張キーボードから何も挿入できないため拒否する */
    if (normalized.length === 0) {
      throw new ShortcutValueRequiredError();
    }

    if (normalized.some((value) => !value.name)) {
      throw new ShortcutValueNameRequiredError();
    }

    return normalized;
  }
}
