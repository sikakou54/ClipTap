/**
 * 使い方セクション
 *
 * @description
 * ファイルの読み込み手順を説明するテキストを表示。
 */
import { useTranslation } from '@cliptap/shared';

export function HowToUseSection() {
  const { t } = useTranslation();

  /* 使い方セクション（ファイル読み込み手順の説明） */
  return (
    <div className="mt-8 pt-6 border-t border-gray-200 dark:border-[#2A2A2A]">
      <p className="text-xs text-gray-500 dark:text-[#707070] text-center whitespace-pre-line">
        {t('settings.web_specific.how_to_use')}
      </p>
    </div>
  );
}

