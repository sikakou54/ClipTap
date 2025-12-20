/**
 * 読み込みボタン
 *
 * @description
 * ファイル読み込みを実行するボタン。
 * ローディング中はスピナーを表示し、無効化される。
 */
import { useTranslation } from '@cliptap/shared';
import { LoadingSpinner } from '@components/common/LoadingSpinner';

interface LoadButtonProps {
  onClick: () => void;
  disabled: boolean;
  isLoading: boolean;
}

export function LoadButton({ onClick, disabled, isLoading }: LoadButtonProps) {
  const { t } = useTranslation();

  /* ファイル読み込みボタン（ローディング状態に応じて表示を切り替え） */
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`mt-6 w-full py-3 px-4 rounded-xl font-medium transition-all ${
        disabled
          ? 'bg-gray-300 dark:bg-[#2A2A2A] text-gray-500 dark:text-[#707070] cursor-not-allowed'
          : 'bg-blue-600 dark:bg-blue-500 text-white hover:bg-blue-700 dark:hover:bg-blue-600 active:scale-[0.98]'
      }`}
    >
      {/* ローディング中の場合はスピナーとテキスト、それ以外は通常テキスト */}
      {isLoading ? (
        <span className="flex items-center justify-center gap-2">
          <LoadingSpinner size="small" />
          {t('settings.web_specific.loading')}
        </span>
      ) : (
        t('settings.web_specific.load_button')
      )}
    </button>
  );
}

