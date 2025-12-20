/**
 * AppleLoginButton - Apple サインインボタン
 *
 * @description
 * Firebase Authentication の Apple プロバイダーを使用したサインインボタン。
 * OAuthProvider('apple.com') 経由で認証を行う。
 */
import { useTranslation } from '@cliptap/shared';

interface AppleLoginButtonProps {
  onClick: () => void;
  disabled: boolean;
}

export function AppleLoginButton({ onClick, disabled }: AppleLoginButtonProps) {
  const { t } = useTranslation();

  /* Appleサインインボタン（Firebase Authentication経由） */
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-black text-white border border-black rounded-lg hover:bg-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
    >
      {/* Appleロゴアイコン */}
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.74 1.18 0 2.21-.93 3.23-.93.69 0 1.84.32 2.67 1.23-3.02 1.56-2.38 6.05.56 7.25-.64 1.79-1.44 3.2-1.54 4.68zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
      </svg>
      {/* ボタンテキスト */}
      <span>{t('auth.sign_in_apple')}</span>
    </button>
  );
}

