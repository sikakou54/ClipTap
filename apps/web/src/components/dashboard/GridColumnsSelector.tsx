/**
 * グリッド列数選択
 *
 * @description
 * スニペットグリッドの表示列数（1〜3列）を切り替えるボタン群。
 * デスクトップのみ表示される。
 */
import { useTranslation } from '@cliptap/shared';

interface GridColumnsSelectorProps {
  gridColumns: 1 | 2 | 3;
  setGridColumns: (cols: 1 | 2 | 3) => void;
}

export function GridColumnsSelector({ gridColumns, setGridColumns }: GridColumnsSelectorProps) {
  const { t } = useTranslation();

  /* グリッド列数選択（1〜3列、デスクトップのみ表示） */
  return (
    <div className="hidden md:flex items-center gap-0.5 mr-2">
      {([1, 2, 3] as const).map((cols) => (
        <button
          key={cols}
          onClick={() => setGridColumns(cols)}
          className={`p-1.5 rounded transition-colors ${
            gridColumns === cols
              ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400'
              : 'text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-[#2A2A2A] hover:text-gray-600 dark:hover:text-gray-300'
          }`}
          title={`${cols}${t('common.column', { count: cols })}`}
        >
          {/* 列数アイコン（1列/2列/3列のグリッドアイコン） */}
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {cols === 1 && (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
            {cols === 2 && (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h6M14 6h6M4 12h6M14 12h6M4 18h6M14 18h6" />
            )}
            {cols === 3 && (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h4M10 6h4M16 6h4M4 12h4M10 12h4M16 12h4M4 18h4M10 18h4M16 18h4" />
            )}
          </svg>
        </button>
      ))}
    </div>
  );
}

