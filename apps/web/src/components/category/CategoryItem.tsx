/**
 * CategoryItem - カテゴリリストアイテム
 *
 * @description
 * カテゴリの表示・編集・削除操作を提供するリストアイテム。
 * カラーインジケーター、名前表示、編集/削除ボタンを含む。
 */
import type { Category } from '@cliptap/shared';

interface CategoryItemProps {
  category: Category;
  isLast: boolean;
  onEdit: (category: Category) => void;
  onDelete: (id: string) => void;
}

export function CategoryItem({ category, isLast, onEdit, onDelete }: CategoryItemProps) {
  /* カテゴリアイテム（カラーインジケーター、名前、編集・削除ボタン） */
  return (
    <div
      className={`flex items-center gap-4 p-4 ${
        !isLast ? 'border-b border-gray-200 dark:border-[#2A2A2A]' : ''
      }`}
    >
      {/* カラーインジケーター（カテゴリの色を表示） */}
      <div
        className="w-4 h-4 rounded-full"
        style={{ backgroundColor: category.color || '#6B7280' }}
      />
      {/* カテゴリ名 */}
      <span className="flex-1 font-medium text-gray-900 dark:text-white">{category.name}</span>
      {/* 編集ボタン */}
      <button
        onClick={() => onEdit(category)}
        className="p-2 text-gray-500 dark:text-[#A0A0A0] hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#2A2A2A] rounded-lg transition-colors"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      </button>
      {/* 削除ボタン */}
      <button
        onClick={() => onDelete(category.id)}
        className="p-2 text-gray-500 dark:text-[#A0A0A0] hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </div>
  );
}

