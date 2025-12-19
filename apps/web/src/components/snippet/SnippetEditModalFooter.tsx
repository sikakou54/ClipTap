/**
 * スニペット編集モーダルフッターコンポーネント
 *
 * @description
 * スニペット編集モーダルのフッター部分（キャンセル・保存ボタン）
 */
import { useTranslation } from '@cliptap/shared';

interface SnippetEditModalFooterProps {
  onClose: () => void;
  onSave: () => void;
  canSave: boolean;
}

export function SnippetEditModalFooter({ onClose, onSave, canSave }: SnippetEditModalFooterProps) {
  const { t } = useTranslation();

  /* スニペット編集モーダルフッター（キャンセル・保存ボタン） */
  return (
    <div className="px-6 py-4 border-t border-gray-200 dark:border-[#2A2A2A] flex items-center justify-end gap-3">
      {/* キャンセルボタン */}
      <button
        onClick={onClose}
        className="px-4 py-2 border border-gray-300 dark:border-[#2A2A2A] text-gray-700 dark:text-[#A0A0A0] rounded-lg hover:bg-gray-50 dark:hover:bg-[#2A2A2A] transition-colors"
      >
        {t('common.cancel')}
      </button>
      {/* 保存ボタン（バリデーション通過時のみ有効） */}
      <button
        onClick={onSave}
        disabled={!canSave}
        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
          !canSave
            ? 'bg-gray-300 dark:bg-[#2A2A2A] text-gray-500 dark:text-[#707070] cursor-not-allowed'
            : 'bg-blue-600 dark:bg-blue-500 text-white hover:bg-blue-700 dark:hover:bg-blue-600'
        }`}
      >
        {t('common.save')}
      </button>
    </div>
  );
}

