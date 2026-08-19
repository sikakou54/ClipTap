/**
 * CategoryList - カテゴリ一覧表示
 *
 * @description
 * カテゴリの一覧を表示するコンテナコンポーネント。
 * カテゴリが0件の場合は EmptyCategoryList（空状態UI）を表示。
 */
import type { Category } from '@cliptap/shared';
import { CategoryItem } from './CategoryItem';
import { EmptyCategoryList } from './EmptyCategoryList';

interface CategoryListProps {
  categories: Category[];
  onEdit: (category: Category) => void;
  onDelete: (id: string) => void;
  onCreate: () => void;
}

export function CategoryList({ categories, onEdit, onDelete, onCreate }: CategoryListProps) {
  /* カテゴリが0件の場合は空状態を表示 */
  if (categories.length === 0) {
    return <EmptyCategoryList onCreate={onCreate} />;
  }

  /* カテゴリ一覧コンテナ（各カテゴリアイテムを表示） */
  return (
    <div className="bg-white dark:bg-[#1A1A1A] rounded-xl shadow-sm border border-gray-200 dark:border-[#2A2A2A] overflow-hidden">
      {categories.map((category, index) => (
        <CategoryItem
          key={category.id}
          category={category}
          isLast={index === categories.length - 1}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}

