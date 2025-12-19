/**
 * 利用規約・プライバシーポリシー同意セクション
 *
 * @description
 * 利用規約とプライバシーポリシーへの同意チェックボックス。
 * 各リンクをクリックすると該当ドキュメントが開く。
 */
import { useTranslation } from '@cliptap/shared';

interface AgreementSectionProps {
  hasAgreedTerms: boolean;
  hasAgreedPrivacy: boolean;
  onAgreeTerms: (agreed: boolean) => void;
  onAgreePrivacy: (agreed: boolean) => void;
  onOpenTerms: () => void;
  onOpenPrivacy: () => void;
}

export function AgreementSection({
  hasAgreedTerms,
  hasAgreedPrivacy,
  onAgreeTerms,
  onAgreePrivacy,
  onOpenTerms,
  onOpenPrivacy,
}: AgreementSectionProps) {
  const { t } = useTranslation();

  /* 利用規約・プライバシーポリシー同意セクション */
  return (
    <div className="mt-6 space-y-3">
      {/* 利用規約同意チェックボックス */}
      <label className="flex items-start gap-3 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
        <input
          type="checkbox"
          checked={hasAgreedTerms}
          onChange={(e) => onAgreeTerms(e.target.checked)}
          className="mt-1 w-4 h-4 border-gray-300 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
        />
        <span>
          {/* 利用規約リンク */}
          <button
            type="button"
            onClick={onOpenTerms}
            className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
          >
            {t('settings.terms')}
          </button>
          {t('settings.web_specific.terms_agree').replace('利用規約', '')}
        </span>
      </label>

      {/* プライバシーポリシー同意チェックボックス */}
      <label className="flex items-start gap-3 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
        <input
          type="checkbox"
          checked={hasAgreedPrivacy}
          onChange={(e) => onAgreePrivacy(e.target.checked)}
          className="mt-1 w-4 h-4 border-gray-300 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
        />
        <span>
          {/* プライバシーポリシーリンク */}
          <button
            type="button"
            onClick={onOpenPrivacy}
            className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
          >
            {t('settings.privacy')}
          </button>
          {t('settings.web_specific.privacy_agree').replace('プライバシーポリシー', '')}
        </span>
      </label>
    </div>
  );
}

