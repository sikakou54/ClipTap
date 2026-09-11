/**
 * ショートカットマッパー
 *
 * @description
 * ショートカットと、そのショートカットが持つ値のCRUD操作を提供。
 * getMainDbAdapter()経由でDB操作を行い、Mobile/Webで共通のロジックを使用。
 *
 * @module ShortcutMapper
 */

import { getMainDbAdapter } from '../adapters/DbAdapter';
import type {
  Shortcut,
  ShortcutRow,
  ShortcutValue,
  ShortcutValueInput,
} from '../schema';
import { generateUniqueId, getCurrentTimestamp } from '../utils/dateHelpers';

/* ======================================== */
/* SQLクエリ定義 */
/* ======================================== */

const ShortcutQueries = {
  /* 指定プロファイルのショートカットを取得（sortOrder順） */
  SELECT_BY_PROFILE:
    'SELECT * FROM shortcuts WHERE profileId = ? ORDER BY sortOrder ASC',
  /* IDでショートカットを取得 */
  SELECT_BY_ID: 'SELECT * FROM shortcuts WHERE id = ?',
  /* プロファイル内の名前でショートカットを取得（重複チェック用） */
  SELECT_BY_NAME: 'SELECT * FROM shortcuts WHERE profileId = ? AND name = ?',
  /* ショートカットを新規作成 */
  INSERT: `INSERT INTO shortcuts (id, profileId, name, sortOrder, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)`,
  /* ショートカットの所属プロファイル・名前・更新日時を更新 */
  UPDATE: `UPDATE shortcuts SET profileId = ?, name = ?, sortOrder = ?, updatedAt = ? WHERE id = ?`,
  /* 更新日時だけを更新（値の増減で親の更新日時を進めるため） */
  TOUCH: 'UPDATE shortcuts SET updatedAt = ? WHERE id = ?',
  /* ショートカットを削除 */
  DELETE: 'DELETE FROM shortcuts WHERE id = ?',
  /* ショートカットの並び順を更新 */
  UPDATE_SORT_ORDER: 'UPDATE shortcuts SET sortOrder = ? WHERE id = ?',
  /* 指定プロファイルのショートカット数を取得 */
  SELECT_COUNT_BY_PROFILE:
    'SELECT COUNT(*) as count FROM shortcuts WHERE profileId = ?',
  /* 指定プロファイル内の最大sortOrderを取得（新規作成時に使用） */
  SELECT_MAX_SORT_ORDER:
    'SELECT MAX(sortOrder) as maxOrder FROM shortcuts WHERE profileId = ?',
};

const ShortcutValueQueries = {
  /* 指定プロファイルのショートカット値を取得（ショートカット順・並び順） */
  SELECT_BY_PROFILE: `SELECT v.* FROM shortcut_values v
           INNER JOIN shortcuts s ON s.id = v.shortcutId
           WHERE s.profileId = ?
           ORDER BY v.shortcutId ASC, v.sortOrder ASC`,
  /* 指定ショートカットの値を取得（並び順） */
  SELECT_BY_SHORTCUT: 'SELECT * FROM shortcut_values WHERE shortcutId = ? ORDER BY sortOrder ASC',
  /* ショートカット値を新規作成 */
  INSERT: `INSERT INTO shortcut_values (id, shortcutId, name, value, useCount, sortOrder, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  /* ショートカット値を更新（useCountは挿入時にだけ動かすため触れない） */
  UPDATE: `UPDATE shortcut_values SET name = ?, value = ?, sortOrder = ?, updatedAt = ? WHERE id = ?`,
  /* ショートカット値を削除 */
  DELETE: 'DELETE FROM shortcut_values WHERE id = ?',
  /* 指定ショートカットの値をすべて削除 */
  DELETE_BY_SHORTCUT: 'DELETE FROM shortcut_values WHERE shortcutId = ?',
  /* 使用回数を1加算 */
  INCREMENT_USE_COUNT:
    'UPDATE shortcut_values SET useCount = useCount + 1 WHERE id = ?',
};

/* ======================================== */
/* 行変換関数 */
/* ======================================== */

/**
 * DB行データをShortcutRowエンティティに変換
 * @param row - データベースから取得した行データ
 * @returns ShortcutRow型のオブジェクト
 */
const toShortcutRow = (row: any): ShortcutRow => ({
  id: row.id, /* ショートカットID */
  profileId: row.profileId, /* 所属プロファイルID */
  name: row.name, /* ショートカット名 */
  sortOrder: row.sortOrder ?? 0, /* 並び順（列がNULLの場合は0） */
  createdAt: row.createdAt, /* 作成日時 */
  updatedAt: row.updatedAt, /* 更新日時 */
});

/**
 * DB行データをShortcutValueエンティティに変換
 * @param row - データベースから取得した行データ
 * @returns ShortcutValue型のオブジェクト
 */
const toValue = (row: any): ShortcutValue => ({
  id: row.id, /* ショートカット値ID */
  shortcutId: row.shortcutId, /* 所属するショートカットのID */
  name: row.name, /* 値名 */
  value: row.value, /* 挿入する値 */
  useCount: row.useCount ?? 0, /* 使用回数（列がNULLの場合は0） */
  sortOrder: row.sortOrder ?? 0, /* 並び順（列がNULLの場合は0） */
  createdAt: row.createdAt, /* 作成日時 */
  updatedAt: row.updatedAt, /* 更新日時 */
});

/* ======================================== */
/* Mapper */
/* ======================================== */

/**
 * ショートカットマッパー
 *
 * @description
 * 静的メソッドでショートカットのCRUD操作を提供。
 * すべてのメソッドはgetMainDbAdapter()経由でDBアクセスを行う。
 */
export class ShortcutMapper {
  /** バックアップ行をID・日時・並び順ごと逐語復元する。 */
  static restore(shortcut: ShortcutRow): void {
    getMainDbAdapter().run(ShortcutQueries.INSERT, [
      shortcut.id,
      shortcut.profileId,
      shortcut.name,
      shortcut.sortOrder,
      shortcut.createdAt,
      shortcut.updatedAt,
    ]);
  }

  /** バックアップの値行をID・日時・使用回数ごと逐語復元する。 */
  static restoreValue(value: ShortcutValue): void {
    getMainDbAdapter().run(ShortcutValueQueries.INSERT, [
      value.id,
      value.shortcutId,
      value.name,
      value.value,
      value.useCount,
      value.sortOrder,
      value.createdAt,
      value.updatedAt,
    ]);
  }

  /**
   * 指定プロファイルのショートカットを値付きで取得
   * @param profileId - 所属プロファイルID
   * @returns ショートカット一覧（sortOrder順、値もsortOrder順）
   * @description
   * 値はショートカットの件数によらず1回のクエリでまとめて取得する。
   * 全プロファイル横断で取得する用途は無いため、プロファイル指定を必須にしている。
   */
  static getByProfileId(profileId: string): Shortcut[] {
    const db = getMainDbAdapter();
    const rows = db
      .all<any>(ShortcutQueries.SELECT_BY_PROFILE, [profileId])
      .map(toShortcutRow);
    const valueRows = db
      .all<any>(ShortcutValueQueries.SELECT_BY_PROFILE, [profileId])
      .map(toValue);

    /* ショートカットIDごとに値をまとめる（1回の走査で振り分ける） */
    const valuesByShortcut = new Map<string, ShortcutValue[]>();
    for (const value of valueRows) {
      const entries = valuesByShortcut.get(value.shortcutId) ?? [];
      entries.push(value);
      valuesByShortcut.set(value.shortcutId, entries);
    }

    return rows.map((row) => ({ ...row, values: valuesByShortcut.get(row.id) ?? [] }));
  }

  /**
   * IDでショートカットを値付きで取得
   * @param id - ショートカットID
   * @returns ショートカット（存在しない場合はnull）
   */
  static getById(id: string): Shortcut | null {
    const db = getMainDbAdapter();
    const row = db.get<any>(ShortcutQueries.SELECT_BY_ID, [id]);
    if (!row) return null;

    return { ...toShortcutRow(row), values: this.getValues(id) };
  }

  /**
   * プロファイル内の名前でショートカットを取得
   * @param profileId - 所属プロファイルID
   * @param name - ショートカット名
   * @returns ショートカット（存在しない場合はnull）
   * @description
   * ショートカット名の重複チェックで使用される。
   * 名前の一意性はプロファイル内に限るため、プロファイルも条件に含める。
   */
  static getByName(profileId: string, name: string): Shortcut | null {
    const db = getMainDbAdapter();
    const row = db.get<any>(ShortcutQueries.SELECT_BY_NAME, [profileId, name]);
    if (!row) return null;

    return { ...toShortcutRow(row), values: this.getValues(row.id) };
  }

  /**
   * 指定ショートカットの値を取得
   * @param shortcutId - ショートカットID
   * @returns ショートカット値の一覧（sortOrder順）
   */
  static getValues(shortcutId: string): ShortcutValue[] {
    const db = getMainDbAdapter();
    return db
      .all<any>(ShortcutValueQueries.SELECT_BY_SHORTCUT, [shortcutId])
      .map(toValue);
  }

  /**
   * ショートカットを値ごと作成
   * @param profileId - 所属させるプロファイルID（検証済み）
   * @param name - ショートカット名（検証済み）
   * @param values - 登録する値（検証済み、1件以上）
   * @returns 作成されたショートカット
   * @description
   * ショートカット本体と値の挿入を1トランザクションで行い、
   * 値だけが残る中途半端な状態を作らない。
   */
  static create(
    profileId: string,
    name: string,
    values: ShortcutValueInput[]
  ): Shortcut {
    const db = getMainDbAdapter();
    /* 一意性を保証するIDとタイムスタンプを生成 */
    const id = generateUniqueId();
    const now = getCurrentTimestamp();
    /* 同一プロファイル内の最大sortOrder+1を次の並び順として設定（末尾に追加） */
    const sortOrder = this.getNextSortOrder(profileId);

    db.transaction(() => {
      db.run(ShortcutQueries.INSERT, [id, profileId, name, sortOrder, now, now]);
      values.forEach((value, index) => {
        db.run(ShortcutValueQueries.INSERT, [
          generateUniqueId(),
          id,
          value.name,
          value.value,
          0,
          index,
          now,
          now,
        ]);
      });
    });

    /* 挿入したデータを再取得して返却（DBから取得することで整合性を確保） */
    const created = this.getById(id);
    if (!created) {
      throw new Error('Failed to create shortcut');
    }
    return created;
  }

  /**
   * ショートカットを更新
   * @param id - ショートカットID
   * @param name - 新しいショートカット名（未指定なら既存値を保持）
   * @param values - 新しい値一覧（未指定なら既存値を保持）
   * @param profileId - 新しい所属プロファイルID（未指定なら既存値を保持）
   * @returns 更新されたショートカット
   * @description
   * valuesを指定した場合は差し替え方式で反映する。
   * 入力にidを持つ値は既存行を更新し、持たない値は追加し、
   * 入力に現れなかった既存行は削除する。使用回数は既存行を更新するかぎり保持される。
   * プロファイルを移す場合は、移動先の末尾へ並ぶよう並び順を採り直す。
   * 値と使用回数は値行に持つため、移動しても失われない。
   */
  static update(
    id: string,
    name?: string,
    values?: ShortcutValueInput[],
    profileId?: string
  ): Shortcut {
    const db = getMainDbAdapter();
    /* 更新対象のショートカットが存在するか確認（存在しない場合はエラー） */
    const existing = this.getById(id);
    if (!existing) {
      throw new Error(`Shortcut not found: ${id}`);
    }

    const now = getCurrentTimestamp();
    const nextProfileId = profileId !== undefined ? profileId : existing.profileId;
    const isMovingProfile = nextProfileId !== existing.profileId;
    /* 移動先では既存の並び順が別の行と衝突しうるため、末尾へ採り直す */
    const nextSortOrder = isMovingProfile
      ? this.getNextSortOrder(nextProfileId)
      : existing.sortOrder;

    db.transaction(() => {
      db.run(ShortcutQueries.UPDATE, [
        nextProfileId,
        name !== undefined ? name : existing.name,
        nextSortOrder,
        now,
        id,
      ]);

      if (values !== undefined) {
        this.replaceValues(id, existing.values, values, now);
      }
    });

    /* 更新後のデータを再取得して返却（DBから取得することで整合性を確保） */
    const updated = this.getById(id);
    if (!updated) {
      throw new Error('Failed to update shortcut');
    }
    return updated;
  }

  /**
   * ショートカットを削除
   * @param id - ショートカットID
   * @description
   * 実行時の外部キー強制は行わない方針のため、値も明示的に削除する
   */
  static delete(id: string): void {
    const db = getMainDbAdapter();
    db.transaction(() => {
      db.run(ShortcutValueQueries.DELETE_BY_SHORTCUT, [id]);
      db.run(ShortcutQueries.DELETE, [id]);
    });
  }

  /**
   * ショートカットの並び順を更新
   * @param orderedIds - 新しい順序のショートカットID配列
   */
  static updateOrder(orderedIds: string[]): void {
    const db = getMainDbAdapter();
    /* 配列のインデックスをそのままsortOrderとして設定 */
    orderedIds.forEach((id, index) => {
      db.run(ShortcutQueries.UPDATE_SORT_ORDER, [index, id]);
    });
  }

  /**
   * ショートカット値の使用回数を1加算し、親の更新日時を進める
   * @param valueId - ショートカット値ID
   * @param shortcutId - 所属するショートカットのID
   * @description
   * 候補推測（値単位）の並べ替えに使う。加算するのは拡張キーボードから値を挿入したときだけで、
   * アプリ内にショートカットを挿入する画面は無いため、実行時の呼び出し元はネイティブ側にしかない。
   * ここに置いているのは、iOS版・Android版のMapperが写す正本を1か所に保つためで、
   * TypeScript側からはテストがこの実装を呼んで振る舞いを固定している。
   *
   * 対応するネイティブ実装:
   * - apps/mobile/ios/ClipTapKeyboard/Mappers/ShortcutMapper.swift
   * - apps/mobile/android/app/src/main/java/com/sikakou/cliptap/mappers/ShortcutMapper.kt
   */
  static incrementUseCount(valueId: string, shortcutId: string): void {
    const db = getMainDbAdapter();
    db.run(ShortcutValueQueries.INCREMENT_USE_COUNT, [valueId]);
    db.run(ShortcutQueries.TOUCH, [getCurrentTimestamp(), shortcutId]);
  }

  /**
   * 指定プロファイルのショートカット数を取得
   * @param profileId - 所属プロファイルID
   * @returns ショートカット数
   */
  static count(profileId: string): number {
    const db = getMainDbAdapter();
    const result = db.get<{ count: number }>(
      ShortcutQueries.SELECT_COUNT_BY_PROFILE,
      [profileId]
    );
    return result?.count || 0;
  }

  /**
   * 次のsortOrder値を取得（新規ショートカット作成時に使用）
   * @param profileId - 所属プロファイルID
   * @returns 同一プロファイル内の最大sortOrder+1（データが存在しない場合は0）
   */
  static getNextSortOrder(profileId: string): number {
    const db = getMainDbAdapter();
    /* 現在の最大sortOrderを取得（新規ショートカットを末尾に追加するため） */
    const result = db.get<{ maxOrder: number | null }>(
      ShortcutQueries.SELECT_MAX_SORT_ORDER,
      [profileId]
    );
    /* 最大値+1を返す（データがない場合は-1+1=0が返る） */
    return (result?.maxOrder ?? -1) + 1;
  }

  /**
   * 値一覧を入力どおりの内容・並びへ差し替える
   *
   * @param shortcutId - 対象のショートカットID
   * @param existingValues - 現在保存されている値一覧
   * @param inputs - 反映したい値一覧（表示順）
   * @param now - 更新日時
   *
   * @remarks
   * 呼び出し元のトランザクション内で実行することを前提とする。
   * 全削除・全挿入にすると使用回数が失われ、値単位の候補推測が毎回リセットされるため、
   * idが一致する行は更新して残す。
   */
  private static replaceValues(
    shortcutId: string,
    existingValues: ShortcutValue[],
    inputs: ShortcutValueInput[],
    now: string
  ): void {
    const db = getMainDbAdapter();
    const keptIds = new Set(
      inputs.map((input) => input.id).filter((id): id is string => Boolean(id))
    );

    /* 入力に現れなかった既存値を削除 */
    for (const existing of existingValues) {
      if (!keptIds.has(existing.id)) {
        db.run(ShortcutValueQueries.DELETE, [existing.id]);
      }
    }

    /* 入力の並び順をそのままsortOrderへ反映する */
    const existingIds = new Set(existingValues.map((value) => value.id));
    inputs.forEach((input, index) => {
      if (input.id && existingIds.has(input.id)) {
        db.run(ShortcutValueQueries.UPDATE, [
          input.name,
          input.value,
          index,
          now,
          input.id,
        ]);
        return;
      }

      /* 既存に無いidは、他端末由来などで整合しないため新規採番して追加する */
      db.run(ShortcutValueQueries.INSERT, [
        generateUniqueId(),
        shortcutId,
        input.name,
        input.value,
        0,
        index,
        now,
        now,
      ]);
    });
  }
}
