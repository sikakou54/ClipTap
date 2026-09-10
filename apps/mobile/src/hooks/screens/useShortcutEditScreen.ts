/**
 * ショートカット作成・編集画面のビジネスロジックフック
 *
 * ショートカットの新規作成・編集の状態管理とロジックを提供。
 * UIコンポーネント（shortcut/edit.tsx）から完全に分離されたビジネスロジック層。
 *
 * 主な責務:
 * - ショートカット名と値一覧の下書き状態の管理
 * - 値編集モーダルとの往復（追加・更新・削除）
 * - 保存可否の判定と保存処理（新規作成/更新）
 *
 * @see app/shortcut/edit.tsx - UIコンポーネント
 * @see app/shortcut/value-edit.tsx - 値編集モーダル
 * @see packages/shared/src/providers/ShortcutProvider.tsx - ショートカットCRUD操作（useShortcuts）
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useFocusEffect } from 'expo-router';
import {
  Logger,
  translateError,
  useShortcuts,
  type ShortcutValueInput,
} from '@cliptap/shared';
import { showConfirm, showErrorAlert } from '@utils/alerts';
import { useTranslation } from '@cliptap/shared';

/* ======================================== */
/* 型定義 */
/* ======================================== */

/**
 * 編集中の値1件
 *
 * @remarks
 * 新規追加した値はまだDBのIDを持たないため、画面内での識別子として`key`を別に持つ。
 * 保存済みの値は`key`と`id`が同じ値になり、保存時に`id`があるものだけが既存行の更新になる。
 */
export interface ShortcutValueDraft {
  /** 画面内で値を一意に識別するキー */
  key: string;
  /** 保存済みの値のID（新規追加した値はundefined） */
  id?: string;
  /** 値名 */
  name: string;
  /** 挿入する値 */
  value: string;
}

/**
 * useShortcutEditScreenの引数の型
 */
interface UseShortcutEditScreenParams {
  /** 編集対象のショートカットID（新規作成時はundefined） */
  shortcutId?: string;
}

/**
 * useShortcutEditScreenの戻り値の型
 */
export interface UseShortcutEditScreenReturn {
  /* 状態 */
  /** ショートカット名 */
  name: string;
  /** ショートカット名を更新する */
  setName: (name: string) => void;
  /** 編集中の値一覧（表示順） */
  values: ShortcutValueDraft[];
  /** 保存処理中フラグ */
  saving: boolean;

  /* 派生状態 */
  /** 編集モードかどうか */
  isEdit: boolean;
  /** 保存できるかどうか */
  canSave: boolean;

  /* ハンドラ */
  /** 値の追加画面を開く */
  handleAddValue: () => void;
  /** 値の編集画面を開く */
  handleEditValue: (draft: ShortcutValueDraft) => void;
  /** 確認のうえ値を一覧から取り除く */
  handleDeleteValue: (draft: ShortcutValueDraft) => void;
  /** ショートカットを保存する */
  handleSave: () => void;
}

/* ======================================== */
/* ヘルパー */
/* ======================================== */

/**
 * 新規追加した値の画面内キーを作る
 *
 * @param existing - 既に一覧にある値
 * @returns 既存のどのキーとも重ならないキー
 *
 * @remarks
 * 乱数や時刻を使わず、既存キーとの衝突だけを避ける連番にする。
 * 追加・削除を繰り返しても既存の行のキーは変わらないため、
 * 値編集モーダルから戻ったときに対象を取り違えない。
 */
function createDraftKey(existing: ShortcutValueDraft[]): string {
  const used = new Set(existing.map((draft) => draft.key));
  let index = existing.length;
  while (used.has(`draft-${index}`)) index += 1;
  return `draft-${index}`;
}

/* ======================================== */
/* フック実装 */
/* ======================================== */

/**
 * ショートカット作成・編集画面のビジネスロジックフック
 *
 * @param params - 画面パラメータ
 * @returns 画面に必要な全ての状態とハンドラ
 */
export function useShortcutEditScreen(
  params: UseShortcutEditScreenParams
): UseShortcutEditScreenReturn {
  const { shortcutId } = params;

  const { t } = useTranslation();
  const router = useRouter();
  const { shortcuts, createShortcut, updateShortcut } = useShortcuts();

  /* ======================================== */
  /* 状態管理 */
  /* ======================================== */
  const [name, setName] = useState('');
  const [values, setValues] = useState<ShortcutValueDraft[]>([]);
  const [saving, setSaving] = useState(false);

  /* ======================================== */
  /* 派生状態 */
  /* ======================================== */
  const isEdit = !!shortcutId;

  const editingShortcut = useMemo(
    () => shortcuts.find((shortcut) => shortcut.id === shortcutId),
    [shortcuts, shortcutId]
  );

  /**
   * 保存可能かどうか
   *
   * @remarks
   * 値が1件も無いショートカットは拡張キーボードから何も挿入できないため保存させない
   * （docs/機能仕様書.md §8.24）。値名の必須判定は値編集モーダル側で行うため、ここでは件数だけを見る。
   */
  const canSave = useMemo(
    () => name.trim() !== '' && values.length > 0,
    [name, values]
  );

  /* ======================================== */
  /* 初期化 */
  /* ======================================== */
  useEffect(() => {
    if (editingShortcut) {
      /* 編集モード: 既存ショートカットのデータをフォームに反映 */
      setName(editingShortcut.name);
      setValues(
        editingShortcut.values.map((value) => ({
          key: value.id,
          id: value.id,
          name: value.name,
          value: value.value,
        }))
      );
      return;
    }

    /* 新規作成モード: フォームを空にリセット */
    setName('');
    setValues([]);
  }, [editingShortcut]);

  /* ======================================== */
  /* 画面フォーカス時の処理（コールバックデータ処理） */
  /* ======================================== */
  /* 値編集モーダル（shortcut/value-edit）からの戻り値をグローバル変数経由で受け取る。
     expo-router のモーダルは戻り値を返せないため、モーダル側が router.back() の直前に
     global.shortcutValueCallbackData へ書き込み、こちらはフォーカス復帰時に読み取って即座に破棄する。
     依存配列が空なのは setter のみを閉じ込めており再購読が不要なため。 */
  useFocusEffect(
    useCallback(() => {
      const callbackData = global.shortcutValueCallbackData;
      if (!callbackData) return;

      global.shortcutValueCallbackData = undefined;

      setValues((prev) => {
        const index = prev.findIndex((draft) => draft.key === callbackData.key);

        /* 既存の値の編集: 同じ位置で内容だけ差し替える（並び順を変えない） */
        if (index >= 0) {
          const next = [...prev];
          next[index] = {
            ...next[index],
            name: callbackData.name,
            value: callbackData.value,
          };
          return next;
        }

        /* 新規追加: 末尾へ足す */
        return [
          ...prev,
          {
            key: createDraftKey(prev),
            name: callbackData.name,
            value: callbackData.value,
          },
        ];
      });
    }, [])
  );

  /* ======================================== */
  /* イベントハンドラ */
  /* ======================================== */

  /**
   * 値の追加画面を開く
   *
   * @remarks
   * keyを空文字で渡すことで、モーダル側の戻り値を「新規追加」として扱わせる。
   */
  const handleAddValue = useCallback(() => {
    router.push({
      pathname: '/shortcut/value-edit',
      params: { valueKey: '', valueName: '', value: '' },
    });
  }, [router]);

  /**
   * 値の編集画面を開く
   */
  const handleEditValue = useCallback(
    (draft: ShortcutValueDraft) => {
      router.push({
        pathname: '/shortcut/value-edit',
        params: {
          valueKey: draft.key,
          valueName: draft.name,
          value: draft.value,
        },
      });
    },
    [router]
  );

  /**
   * 値を一覧から取り除く
   *
   * @remarks
   * 取り除くのは画面上の下書きだけで、DBへは保存時にまとめて反映する。
   * 最後の1件も取り除ける。その状態では canSave が false になり保存できない（§8.24）。
   */
  const handleDeleteValue = useCallback(
    (draft: ShortcutValueDraft) => {
      showConfirm(
        t('shortcut.delete_value_confirm', { name: draft.name }),
        () => {
          setValues((prev) => prev.filter((entry) => entry.key !== draft.key));
        },
        undefined,
        'danger'
      );
    },
    [t]
  );

  /**
   * ショートカットを保存する
   */
  const handleSave = useCallback(() => {
    if (!canSave || saving) return;

    setSaving(true);
    try {
      /* 新規追加の値はidを持たないため、そのままMapperの差し替え判定に渡せる */
      const inputs: ShortcutValueInput[] = values.map((draft) => ({
        id: draft.id,
        name: draft.name,
        value: draft.value,
      }));

      if (isEdit && editingShortcut) {
        updateShortcut({ id: editingShortcut.id, name, values: inputs });
      } else {
        createShortcut({ name, values: inputs });
      }

      router.back();
    } catch (error) {
      Logger.error('[ShortcutEditScreen] Failed to save shortcut:', error);
      showErrorAlert(translateError(error));
    } finally {
      setSaving(false);
    }
  }, [
    canSave,
    saving,
    values,
    isEdit,
    editingShortcut,
    updateShortcut,
    createShortcut,
    name,
    router,
  ]);

  /* ======================================== */
  /* 戻り値 */
  /* ======================================== */

  return {
    name,
    setName,
    values,
    saving,
    isEdit,
    canSave,
    handleAddValue,
    handleEditValue,
    handleDeleteValue,
    handleSave,
  };
}
