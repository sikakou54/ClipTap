/**
 * ホーム画面ヘッダー
 *
 * @description
 * ホーム画面のタイトルと説明を表示。
 */
import { useTranslation } from '@cliptap/shared';

export function HomeHeader() {
  const { t } = useTranslation();

  /* ホーム画面ヘッダー（タイトルと説明） */
  return (
    <div className="text-center mb-8">
      {/* ページタイトル */}
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('settings.web_specific.load_file_title')}</h1>
      {/* 説明文 */}
      <p className="mt-2 text-gray-600 dark:text-[#A0A0A0]">{t('settings.web_specific.load_file_desc')}</p>
    </div>
  );
}

