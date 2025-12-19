/**
 * AccountLinkModal - アカウント連携モーダル
 *
 * @description
 * Firebase Authentication を使用したGoogle/Apple アカウント連携モーダル。
 * 既存ユーザーがソーシャルログイン機能を追加する際に使用。
 */
import { useTranslation } from '@cliptap/shared';
import { Modal } from '@components/common/Modal';
import { GoogleLoginButton } from './GoogleLoginButton';
import { AppleLoginButton } from './AppleLoginButton';
import { LoginErrorDisplay } from './LoginErrorDisplay';

interface AccountLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSignInWithGoogle: () => void;
  onSignInWithApple: () => void;
  isLoading: boolean;
  error: string | null;
}

export function AccountLinkModal({
  isOpen,
  onClose,
  onSignInWithGoogle,
  onSignInWithApple,
  isLoading,
  error,
}: AccountLinkModalProps) {
  const { t } = useTranslation();

  /* アカウント連携モーダル */
  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="sm">
      {/* ヘッダー（タイトルと閉じるボタン） */}
      <Modal.Header>
        <Modal.Title>{t('auth.account_link')}</Modal.Title>
        <Modal.CloseButton onClick={onClose} />
      </Modal.Header>
      {/* 本文 */}
      <Modal.Body>
        {/* 説明文 */}
        <p className="text-gray-600 dark:text-[#A0A0A0] mb-6">
          {t('auth.account_link_description')}
        </p>

        {/* エラー表示 */}
        <div className="mb-4">
          <LoginErrorDisplay error={error} />
        </div>

        {/* サインインボタン（Google/Apple） */}
        <div className="space-y-3">
          <GoogleLoginButton onClick={onSignInWithGoogle} disabled={isLoading} />
          <AppleLoginButton onClick={onSignInWithApple} disabled={isLoading} />
        </div>
      </Modal.Body>
    </Modal>
  );
}
