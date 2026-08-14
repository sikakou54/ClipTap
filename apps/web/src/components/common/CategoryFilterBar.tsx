/**
 * CategoryFilterBar - カテゴリフィルターバー
 *
 * @description
 * カテゴリフィルターボタンのリストを表示するコンポーネント。
 * 内部で選択状態を管理し、即座にUIを更新。
 * 親へのコールバックはrequestAnimationFrameで次フレームに実行し、UIの応答性を保つ。
 */
import React, { useState } from 'react';
import type { Category } from '@cliptap/shared';

interface CategoryFilterBarProps {
  categories: Category[];
  selectedCategory: string | null;
  allLabel: string;
  uncategorizedLabel: string;
  onSelectCategory: (categoryId: string | null) => void;
}

function CategoryFilterBarComponent({
  categories,
  selectedCategory,
  allLabel,
  uncategorizedLabel,
  onSelectCategory,
}: CategoryFilterBarProps) {
  const [localSelected, setLocalSelected] = useState(selectedCategory);

  const handleSelect = (categoryId: string | null) => {
    /* 見た目（localSelected）を即時更新してから親へ通知する。
       親コールバックは一覧の再計算を伴うため、次フレームへ逃がしている */
    setLocalSelected(categoryId);
    requestAnimationFrame(() => onSelectCategory(categoryId));
  };

  /* カテゴリフィルターバー（全カテゴリ・未分類・各カテゴリのボタン、横スクロール対応） */
  return (
    <div className="mt-3 flex gap-2 overflow-x-auto pb-2">
      {/* 全カテゴリボタン */}
      <button
        onClick={() => handleSelect(null)}
        className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap ${localSelected === null
          ? 'bg-blue-600 text-white'
          : 'bg-gray-100 dark:bg-[#2A2A2A] text-gray-700 dark:text-[#A0A0A0] hover:bg-gray-200 dark:hover:bg-[#333333]'
          }`}
      >
        {allLabel}
      </button>
      {/* 未分類ボタン */}
      <button
        onClick={() => handleSelect('uncategorized')}
        className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap ${localSelected === 'uncategorized'
          ? 'bg-blue-600 text-white'
          : 'bg-gray-100 dark:bg-[#2A2A2A] text-gray-700 dark:text-[#A0A0A0] hover:bg-gray-200 dark:hover:bg-[#333333]'
          }`}
      >
        {uncategorizedLabel}
      </button>
      {/* 各カテゴリボタン（選択時はカテゴリ色を背景に使用） */}
      {categories.map((category) => (
        /* カテゴリフィルターボタン */
        <button
          key={category.id}
          onClick={() => handleSelect(category.id)}
          className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap ${localSelected === category.id
            ? 'bg-blue-600 text-white'
            : 'bg-gray-100 dark:bg-[#2A2A2A] text-gray-700 dark:text-[#A0A0A0] hover:bg-gray-200 dark:hover:bg-[#333333]'
            }`}
          style={
            localSelected === category.id && category.color
              ? { backgroundColor: category.color }
              : undefined
          }
        >
          {category.name}
        </button>
      ))}
    </div>
  );
}

/**
 * 比較対象は categories / allLabel / uncategorizedLabel のみ。
 * selectedCategory は localSelected の useState 初期値としてしか読まれず、選択表示は内部state（localSelected）が
 * 決めるため比較していない。親から選択カテゴリを変える経路が増えた場合はここも見直しが必要。
 */
export const CategoryFilterBar = React.memo(CategoryFilterBarComponent, (prevProps, nextProps) => {
  return (
    prevProps.categories === nextProps.categories &&
    prevProps.allLabel === nextProps.allLabel &&
    prevProps.uncategorizedLabel === nextProps.uncategorizedLabel
  );
});
