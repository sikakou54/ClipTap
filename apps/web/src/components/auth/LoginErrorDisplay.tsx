/**
 * LoginErrorDisplay - 認証エラー表示
 *
 * @description
 * Firebase Authentication のエラーメッセージを表示するコンポーネント。
 * エラーが null の場合は何も表示しない。
 */
interface LoginErrorDisplayProps {
  error: string | null;
}

export function LoginErrorDisplay({ error }: LoginErrorDisplayProps) {
  if (!error) return null;

  /* 認証エラーメッセージ（エラーがある場合のみ表示） */
  return (
    <div className="mb-6 p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-lg text-red-600 dark:text-red-400 text-sm">
      {error}
    </div>
  );
}
