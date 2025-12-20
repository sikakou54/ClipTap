/**
 * カテゴリ編集画面のビジネスロジックフック
 *
 * カテゴリの新規作成・編集に関する全ての状態管理とロジックを提供。
 * UIコンポーネント（category/edit.tsx）から完全に分離されたビジネスロジック層。
 *
 * 主な責務:
 * - カテゴリ名の状態管理
 * - プリセットカラー/カスタムRGBカラーの選択・変換
 * - バリデーション（空チェック、RGB範囲チェック）
 * - 保存処理（新規作成/更新）
 *
 * @see app/category/edit.tsx - UIコンポーネント
 * @see lib/hooks/useCategories.ts - カテゴリCRUD操作
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from '@cliptap/shared';
import { useCategories, EmptyContentError, InvalidRgbValueError, CATEGORY_COLORS } from '@cliptap/shared';
import { showErrorAlert } from '@utils/alerts';
import { translateError } from '@cliptap/shared';

/**
 * RGB値のバリデーション結果
 */
interface RGBValidation {
  isRValid: boolean;
  isGValid: boolean;
  isBValid: boolean;
}

/**
 * useCategoryEditScreenの引数の型
 */
export interface UseCategoryEditScreenParams {
  /** 編集対象のカテゴリID（新規作成時はundefined） */
  categoryId?: string;
}

/**
 * useCategoryEditScreenの戻り値の型
 */
export interface UseCategoryEditScreenReturn {
  /* 状態 */
  categoryName: string;
  setCategoryName: (name: string) => void;
  selectedColor: string;
  useCustomColor: boolean;
  customR: string;
  customG: string;
  customB: string;
  saving: boolean;

  /* 派生状態 */
  isEdit: boolean;
  canSave: boolean;
  currentColor: string;
  validation: RGBValidation;

  /* ハンドラ */
  handleSave: () => Promise<void>;
  handleColorSelect: (color: string) => void;
  handlePresetColorToggle: () => void;
  handleCustomColorToggle: () => void;
  handleRGBChange: (channel: 'R' | 'G' | 'B', value: string) => void;
}

/**
 * カテゴリ編集画面のビジネスロジックフック
 *
 * @param params - 画面パラメータ
 * @returns 画面に必要な全ての状態とハンドラ
 */
export function useCategoryEditScreen(params: UseCategoryEditScreenParams): UseCategoryEditScreenReturn {
  const { categoryId } = params;

  const { t } = useTranslation();
  const router = useRouter();
  const { categories, createCategory, updateCategory } = useCategories();

  /* ======================================== */
  /* 状態管理 */
  /* ======================================== */
  const [categoryName, setCategoryName] = useState('');
  const [selectedColor, setSelectedColor] = useState<string>(CATEGORY_COLORS[0]);
  const [saving, setSaving] = useState(false);
  const [customR, setCustomR] = useState('0');
  const [customG, setCustomG] = useState('0');
  const [customB, setCustomB] = useState('0');
  const [useCustomColor, setUseCustomColor] = useState(false);

  const isEdit = !!categoryId;
  const category = useMemo(
    () => categories.find(c => c.id === categoryId),
    [categories, categoryId]
  );

  /* ======================================== */
  /* ヘルパー関数 */
  /* ======================================== */

  /** RGB値を16進数カラーコード(#RRGGBB)に変換 */
  const rgbToHex = useCallback((r: number, g: number, b: number): string => {
    const toHex = (n: number) =>
      Math.max(0, Math.min(255, n)).toString(16).padStart(2, '0').toUpperCase();
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }, []);

  /** RGB値のバリデーション（0-255の範囲チェック） */
  const isValidRGB = useCallback((value: string): boolean => {
    if (value === '') return false;
    const num = parseInt(value);
    return !isNaN(num) && num >= 0 && num <= 255;
  }, []);

  /* ======================================== */
  /* 派生状態（メモ化） */
  /* ======================================== */

  const validation = useMemo<RGBValidation>(
    () => ({
      isRValid: isValidRGB(customR),
      isGValid: isValidRGB(customG),
      isBValid: isValidRGB(customB),
    }),
    [customR, customG, customB, isValidRGB]
  );

  const isCustomColorValid = useMemo(
    () => (useCustomColor ? validation.isRValid && validation.isGValid && validation.isBValid : true),
    [useCustomColor, validation]
  );

  /** 現在選択されている色（カスタムRGBまたはプリセット） */
  const currentColor = useMemo(() => {
    if (!useCustomColor) return selectedColor;

    const r = parseInt(customR);
    const g = parseInt(customG);
    const b = parseInt(customB);

    if (isNaN(r) || isNaN(g) || isNaN(b)) return selectedColor;
    if (r < 0 || r > 255 || g < 0 || g > 255 || b < 0 || b > 255) return selectedColor;

    return rgbToHex(r, g, b);
  }, [useCustomColor, customR, customG, customB, selectedColor, rgbToHex]);

  const canSave = useMemo(
    () => categoryName.trim() !== '' && isCustomColorValid,
    [categoryName, isCustomColorValid]
  );

  /* ======================================== */
  /* 初期化（編集モード時） */
  /* ======================================== */
  useEffect(() => {
    if (category) {
      setCategoryName(category.name);
      const categoryColor = category.color || CATEGORY_COLORS[0];
      setSelectedColor(categoryColor);

      /* カテゴリの色がプリセットにない場合はカスタムカラーとして扱う */
      if (!(CATEGORY_COLORS as readonly string[]).includes(categoryColor)) {
        setUseCustomColor(true);
        const r = parseInt(categoryColor.slice(1, 3), 16);
        const g = parseInt(categoryColor.slice(3, 5), 16);
        const b = parseInt(categoryColor.slice(5, 7), 16);
        setCustomR(r.toString());
        setCustomG(g.toString());
        setCustomB(b.toString());
      } else {
        setUseCustomColor(false);
        setCustomR('0');
        setCustomG('0');
        setCustomB('0');
      }
    } else {
      setCategoryName('');
      setSelectedColor(CATEGORY_COLORS[0]);
      setUseCustomColor(false);
      setCustomR('0');
      setCustomG('0');
      setCustomB('0');
    }
  }, [category]);

  /* ======================================== */
  /* イベントハンドラ */
  /* ======================================== */

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      if (!categoryName.trim()) {
        throw new EmptyContentError();
      }

      if (useCustomColor && !isCustomColorValid) {
        throw new InvalidRgbValueError();
      }

      const colorToSave = useCustomColor ? currentColor : selectedColor;

      if (isEdit && categoryId) {
        updateCategory({
          id: categoryId,
          name: categoryName.trim(),
          color: colorToSave,
        });
      } else {
        await createCategory({
          name: categoryName.trim(),
          color: colorToSave,
        });
      }
      router.back();
    } catch (error) {
      showErrorAlert(translateError(error));
    } finally {
      setSaving(false);
    }
  }, [
    categoryName,
    useCustomColor,
    isCustomColorValid,
    currentColor,
    selectedColor,
    isEdit,
    categoryId,
    updateCategory,
    createCategory,
    router,
    t,
  ]);

  const handleColorSelect = useCallback((color: string) => {
    setSelectedColor(color);
    setUseCustomColor(false);
  }, []);

  const handlePresetColorToggle = useCallback(() => {
    setUseCustomColor(false);
  }, []);

  /** カスタムカラーモードに切り替え（現在のプリセットカラーのRGB値を初期値として設定） */
  const handleCustomColorToggle = useCallback(() => {
    const r = parseInt(selectedColor.slice(1, 3), 16);
    const g = parseInt(selectedColor.slice(3, 5), 16);
    const b = parseInt(selectedColor.slice(5, 7), 16);
    setCustomR(r.toString());
    setCustomG(g.toString());
    setCustomB(b.toString());
    setUseCustomColor(true);
  }, [selectedColor]);

  const handleRGBChange = useCallback((channel: 'R' | 'G' | 'B', value: string) => {
    const filtered = value.replace(/[^0-9]/g, '');
    switch (channel) {
      case 'R':
        setCustomR(filtered);
        break;
      case 'G':
        setCustomG(filtered);
        break;
      case 'B':
        setCustomB(filtered);
        break;
    }
  }, []);

  return {
    categoryName,
    setCategoryName,
    selectedColor,
    useCustomColor,
    customR,
    customG,
    customB,
    saving,
    isEdit,
    canSave,
    currentColor,
    validation,
    handleSave,
    handleColorSelect,
    handlePresetColorToggle,
    handleCustomColorToggle,
    handleRGBChange,
  };
}
