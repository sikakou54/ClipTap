/**
 * エラー表示
 *
 * @description
 * エラーメッセージを赤背景のボックスで表示。
 * エラーがない場合は何も表示しない。
 */
interface ErrorDisplayProps {
  error: string;
}

export function ErrorDisplay({ error }: ErrorDisplayProps) {
  if (!error) return null;

  /* エラーメッセージ（エラーがある場合のみ表示） */
  return (
    <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl">
      <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
    </div>
  );
}

