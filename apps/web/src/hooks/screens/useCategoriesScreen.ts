/**
 * カテゴリ管理画面のビジネスロジックフック
 *
 * カテゴリのCRUD操作と、モーダルの状態管理を提供。
 * UIコンポーネント（CategoryManage.tsx）から完全に分離されたビジネスロジック層。
 *
 * 主な責務:
 * - カテゴリ一覧の取得
 * - カテゴリの作成・編集・削除
 * - モーダルの開閉・フォーム状態管理
 * - RGB→Hex変換・バリデーション
 *
 * @see pages/CategoryManage.tsx - UIコンポーネント
 */

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useTranslation } from '@cliptap/shared';
import { useCategories, CATEGORY_COLORS, DEFAULT_CATEGORY_COLOR, type Category } from '@cliptap/shared';
import { useUnsavedChangesWarning } from '@hooks/useUnsavedChangesWarning';

/** デフォルトのフォーム値 */
const DEFAULT_FORM_VALUES = {
  name: '',
  color: DEFAULT_CATEGORY_COLOR,
  useCustomColor: false,
  customR: '59',
  customG: '130',
  customB: '246',
} as const;

/** 初期値の型 */
interface InitialValues {
  name: string;
  color: string;
  useCustomColor: boolean;
  customR: string;
  customG: string;
  customB: string;
}

/**
 * useCategoriesScreenの戻り値の型
 */
export interface UseCategoriesScreenReturn {
  /* データ */
  categories: Category[];
  presetColors: readonly string[];

  /* モーダル状態 */
  showModal: boolean;
  editingId: string | null;
  isSubmitting: boolean;
  error: string;

  /* フォーム状態 */
  name: string;
  color: string;
  useCustomColor: boolean;
  customR: string;
  customG: string;
  customB: string;

  /* 派生状態 */
  isRValid: boolean;
  isGValid: boolean;
  isBValid: boolean;
  isCustomColorValid: boolean;
  currentColor: string;
  hasChanges: boolean;

  /* フォームセッター */
  setName: (name: string) => void;
  setColor: (color: string) => void;
  setUseCustomColor: (use: boolean) => void;
  setCustomR: (r: string) => void;
  setCustomG: (g: string) => void;
  setCustomB: (b: string) => void;

  /* ハンドラ */
  openCreateModal: () => void;
  openEditModal: (category: Category) => void;
  handleCloseModal: () => void;
  handleSubmit: () => Promise<void>;
  handleDelete: (id: string) => void;
  handlePresetColorSelect: (c: string) => void;
  handleSwitchToPreset: () => void;
  handleSwitchToCustom: () => void;
}

/**
 * RGB値を16進数カラーコード(#RRGGBB)に変換
 */
function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => {
    const hex = Math.max(0, Math.min(255, n)).toString(16).padStart(2, '0');
    return hex.toUpperCase();
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * RGB値が有効かどうかをチェック
 */
function isValidRGB(value: string): boolean {
  if (value === '') return false;
  const num = parseInt(value);
  return !isNaN(num) && num >= 0 && num <= 255;
}

/**
 * カテゴリ管理画面のビジネスロジックフック
 *
 * @returns 画面に必要な全ての状態とハンドラ
 */
export function useCategoriesScreen(): UseCategoriesScreenReturn {
  const { t } = useTranslation();
  const { categories, createCategory, updateCategory, deleteCategory } = useCategories();

  /* ======================================== */
  /* モーダル状態 */
  /* ======================================== */
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  /* ======================================== */
  /* フォーム状態 */
  /* ======================================== */
  const [name, setName] = useState('');
  const [color, setColor] = useState<string>(DEFAULT_CATEGORY_COLOR);
  const [useCustomColor, setUseCustomColor] = useState(false);
  const [customR, setCustomR] = useState('59');
  const [customG, setCustomG] = useState('130');
  const [customB, setCustomB] = useState('246');

  /* 初期値保存用 */
  const [initialValues, setInitialValues] = useState<InitialValues | null>(null);

  /* プリセットカラー */
  const presetColors = CATEGORY_COLORS;

  /* ======================================== */
  /* 派生状態 */
  /* ======================================== */

  /* 各RGB値の有効性 */
  const isRValid = isValidRGB(customR);
  const isGValid = isValidRGB(customG);
  const isBValid = isValidRGB(customB);

  /* カスタムRGB値から現在の色を計算 */
  const getCustomColor = useCallback((): string | null => {
    const r = parseInt(customR);
    const g = parseInt(customG);
    const b = parseInt(customB);

    if (isNaN(r) || isNaN(g) || isNaN(b)) {
      return null;
    }

    if (r < 0 || r > 255 || g < 0 || g > 255 || b < 0 || b > 255) {
      return null;
    }

    return rgbToHex(r, g, b);
  }, [customR, customG, customB]);

  /* カスタムカラーが有効かどうか */
  const isCustomColorValid = useCustomColor ? (isRValid && isGValid && isBValid) : true;

  /* 現在選択されている色（カスタムまたはプリセット） */
  const currentColor = useCustomColor ? (getCustomColor() || color) : color;

  /* 変更があるかどうかを判定 */
  const hasChanges = useMemo(() => {
    if (!showModal || !initialValues) return false;
    const nameChanged = name !== initialValues.name;
    const colorChanged = color !== initialValues.color;
    const useCustomColorChanged = useCustomColor !== initialValues.useCustomColor;
    const customRChanged = customR !== initialValues.customR;
    const customGChanged = customG !== initialValues.customG;
    const customBChanged = customB !== initialValues.customB;
    return nameChanged || colorChanged || useCustomColorChanged || customRChanged || customGChanged || customBChanged;
  }, [showModal, initialValues, name, color, useCustomColor, customR, customG, customB]);

  /* 未保存警告フック */
  const { confirmClose } = useUnsavedChangesWarning({
    hasChanges,
    isActive: showModal,
  });

  /* ======================================== */
  /* モーダル表示時に背景スクロールを無効化 */
  /* ======================================== */
  useEffect(() => {
    if (showModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showModal]);

  /* ======================================== */
  /* ハンドラ */
  /* ======================================== */

  /** フォームをリセット */
  const resetForm = useCallback(() => {
    setEditingId(null);
    setName(DEFAULT_FORM_VALUES.name);
    setColor(DEFAULT_FORM_VALUES.color);
    setUseCustomColor(DEFAULT_FORM_VALUES.useCustomColor);
    setCustomR(DEFAULT_FORM_VALUES.customR);
    setCustomG(DEFAULT_FORM_VALUES.customG);
    setCustomB(DEFAULT_FORM_VALUES.customB);
    setError('');
  }, []);

  /** 閉じる処理（警告付き） */
  const handleCloseModal = useCallback(() => {
    confirmClose(() => {
      setShowModal(false);
      resetForm();
    });
  }, [confirmClose, resetForm]);

  /** 新規作成モーダルを開く */
  const openCreateModal = useCallback(() => {
    resetForm();
    setInitialValues({ ...DEFAULT_FORM_VALUES });
    setShowModal(true);
  }, [resetForm]);

  /** 編集モーダルを開く */
  const openEditModal = useCallback((category: Category) => {
    setEditingId(category.id);
    setName(category.name);
    setError('');

    /* DBから取得したカラーコードをトリムして正規化 */
    const rawColor = category.color || DEFAULT_CATEGORY_COLOR;
    const categoryColor = rawColor.trim();

    /* 色を大文字に正規化して比較（#3b82f6 → #3B82F6） */
    const normalizedColor = categoryColor.toUpperCase();

    /* プリセットカラーかどうかを判定（大文字小文字を無視） */
    const isPresetColor = presetColors.some((c) => c.toUpperCase() === normalizedColor);

    let initColor: string;
    let initUseCustomColor: boolean;
    let initCustomR: string;
    let initCustomG: string;
    let initCustomB: string;

    if (isPresetColor) {
      /* プリセットカラーの場合 */
      const matchingPreset = presetColors.find((c) => c.toUpperCase() === normalizedColor);
      initColor = matchingPreset || DEFAULT_CATEGORY_COLOR;
      initCustomR = '59';
      initCustomG = '130';
      initCustomB = '246';
      initUseCustomColor = false;
    } else {
      /* カスタムカラーの場合（#RRGGBB 前提） */
      const hex = normalizedColor.startsWith('#') ? normalizedColor.slice(1) : normalizedColor;

      if (hex.length >= 6) {
        const r = parseInt(hex.slice(0, 2), 16);
        const g = parseInt(hex.slice(2, 4), 16);
        const b = parseInt(hex.slice(4, 6), 16);
        initCustomR = r.toString();
        initCustomG = g.toString();
        initCustomB = b.toString();
      } else {
        initCustomR = '59';
        initCustomG = '130';
        initCustomB = '246';
      }

      initUseCustomColor = true;
      initColor = categoryColor;
    }

    /* 状態を一括更新 */
    setUseCustomColor(initUseCustomColor);
    setColor(initColor);
    setCustomR(initCustomR);
    setCustomG(initCustomG);
    setCustomB(initCustomB);

    /* 初期値を保存 */
    setInitialValues({
      name: category.name,
      color: initColor,
      useCustomColor: initUseCustomColor,
      customR: initCustomR,
      customG: initCustomG,
      customB: initCustomB,
    });

    setShowModal(true);
  }, [presetColors]);

  /** 保存処理 */
  const handleSubmit = useCallback(async () => {
    if (!name.trim()) {
      setError(t('category.name_placeholder'));
      return;
    }

    if (useCustomColor && !isCustomColorValid) {
      setError(t('category.invalid_rgb_values'));
      return;
    }

    setIsSubmitting(true);
    setError('');

    const colorToSave = useCustomColor ? getCustomColor()! : color;

    try {
      if (editingId) {
        updateCategory({
          id: editingId,
          name: name.trim(),
          color: colorToSave,
        });
      } else {
        createCategory({
          name: name.trim(),
          color: colorToSave,
        });
      }

      setShowModal(false);
      resetForm();
    } catch (err) {
      if (err instanceof Error && err.message.includes('already exists')) {
        setError(t('error.duplicate_category_name'));
      } else {
        setError(t('error.generic'));
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [name, useCustomColor, isCustomColorValid, getCustomColor, color, editingId, updateCategory, createCategory, resetForm, t]);

  /** カテゴリ削除 */
  const handleDelete = useCallback(async (id: string) => {
    const { showConfirm } = await import('@utils/alerts');
    showConfirm('category.delete_confirm', () => {
      try {
        deleteCategory(id);
      } catch (err) {
        console.error('Failed to delete category:', err);
      }
    });
  }, [deleteCategory]);

  /** プリセットカラーを選択 */
  const handlePresetColorSelect = useCallback((c: string) => {
    setColor(c);
    setUseCustomColor(false);
    setCustomR('59');
    setCustomG('130');
    setCustomB('246');
  }, []);

  /** プリセットモードに切り替え */
  const handleSwitchToPreset = useCallback(() => {
    if (useCustomColor) {
      const currentCustomColor = getCustomColor();
      if (currentCustomColor) {
        const normalizedCustom = currentCustomColor.toUpperCase();
        const matchingPreset = presetColors.find(c => c.toUpperCase() === normalizedCustom);
        if (matchingPreset) {
          setColor(matchingPreset);
        } else {
          setColor(DEFAULT_CATEGORY_COLOR);
        }
      } else {
        setColor(DEFAULT_CATEGORY_COLOR);
      }
      setCustomR('59');
      setCustomG('130');
      setCustomB('246');
    }
    setUseCustomColor(false);
  }, [useCustomColor, getCustomColor, presetColors]);

  /** カスタムRGBモードに切り替え */
  const handleSwitchToCustom = useCallback(() => {
    if (!useCustomColor) {
      const r = parseInt(color.slice(1, 3), 16);
      const g = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);
      setCustomR(r.toString());
      setCustomG(g.toString());
      setCustomB(b.toString());
    }
    setUseCustomColor(true);
  }, [useCustomColor, color]);

  /* ======================================== */
  /* 戻り値 */
  /* ======================================== */
  return {
    /* データ */
    categories,
    presetColors,

    /* モーダル状態 */
    showModal,
    editingId,
    isSubmitting,
    error,

    /* フォーム状態 */
    name,
    color,
    useCustomColor,
    customR,
    customG,
    customB,

    /* 派生状態 */
    isRValid,
    isGValid,
    isBValid,
    isCustomColorValid,
    currentColor,
    hasChanges,

    /* フォームセッター */
    setName,
    setColor,
    setUseCustomColor,
    setCustomR,
    setCustomG,
    setCustomB,

    /* ハンドラ */
    openCreateModal,
    openEditModal,
    handleCloseModal,
    handleSubmit,
    handleDelete,
    handlePresetColorSelect,
    handleSwitchToPreset,
    handleSwitchToCustom,
  };
}
