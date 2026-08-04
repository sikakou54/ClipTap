/**
 * ベースファイル案内セクション
 *
 * @description
 * モバイルアプリを持たない利用者向けに、サンプルデータ入りのベースファイル
 * （`public/`へ同梱）のダウンロードリンクと読み込みパスワードを提示する。
 *
 * ファイルは表示言語に合わせて日本語版・英語版を切り替える。
 */
import { SCHEMA_VERSION, useTranslation } from '@cliptap/shared';
import {
  STARTER_FILE_DOWNLOAD_NAME,
  STARTER_FILE_PASSWORD,
  getStarterFileName,
  resolveStarterFileLanguage,
} from '@constants/starterFile';

interface StarterFileSectionProps {
  /** ダウンロードリンク押下時のコールバック */
  onDownload: () => void;
}

export function StarterFileSection({ onDownload }: StarterFileSectionProps) {
  const { t, language } = useTranslation();

  /* 表示言語に対応するベースファイル名（public/配下の相対パス） */
  const fileName = getStarterFileName(SCHEMA_VERSION, resolveStarterFileLanguage(language));

  /* ベースファイル案内セクション（説明・ダウンロードリンク・パスワード） */
  return (
    <div className="mt-6 rounded-xl border border-gray-200 dark:border-[#2A2A2A] bg-gray-50 dark:bg-[#2A2A2A]/40 p-4">
      {/* 見出し */}
      <p className="text-sm font-medium text-gray-900 dark:text-white">
        {t('settings.web_specific.starter_title')}
      </p>

      {/* 説明文 */}
      <p className="mt-1 text-xs leading-relaxed text-gray-600 dark:text-[#A0A0A0]">
        {t('settings.web_specific.starter_desc')}
      </p>

      {/* ダウンロードリンク（押下時にパスワードを自動入力） */}
      <a
        href={fileName}
        download={STARTER_FILE_DOWNLOAD_NAME}
        onClick={onDownload}
        className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
      >
        {/* ダウンロードアイコン */}
        <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4"
          />
        </svg>
        {t('settings.web_specific.starter_download')}
      </a>

      {/* 読み込みパスワード（ファイルは公開サンプルのため固定値） */}
      <p className="mt-2 text-xs text-gray-500 dark:text-[#707070]">
        {t('settings.web_specific.starter_password', { password: STARTER_FILE_PASSWORD })}
      </p>
    </div>
  );
}
