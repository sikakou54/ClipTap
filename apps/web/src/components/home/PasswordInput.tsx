/**
 * パスワード入力
 *
 * @description
 * .cliptapファイル読み込み用のパスワード入力フィールド。
 * Enterキー押下でファイル読み込みを実行可能。
 */
import { useTranslation } from '@cliptap/shared';

interface PasswordInputProps {
  password: string;
  onChange: (password: string) => void;
  onEnter: () => void;
  selectedFile: File | null;
  disabled?: boolean;
}

export function PasswordInput({ password, onChange, onEnter, selectedFile, disabled = false }: PasswordInputProps) {
  const { t } = useTranslation();

  /* パスワード入力フィールド（Enterキーでファイル読み込み実行） */
  return (
    <div className="mt-6">
      <input
        type="password"
        disabled={disabled}
        value={password}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && selectedFile && password && !disabled) {
            onEnter();
          }
        }}
        className="w-full px-4 py-3 border border-gray-300 dark:border-[#2A2A2A] rounded-xl focus:outline-none transition-all bg-white dark:bg-[#1A1A1A] text-gray-900 dark:text-white placeholder-gray-400 dark:text-[#707070]"
        placeholder={t('settings.web_specific.password_placeholder')}
      />
    </div>
  );
}
