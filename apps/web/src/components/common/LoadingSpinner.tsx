/**
 * ローディングスピナーコンポーネント
 *
 * 処理中の状態を示すインジケーター。
 * インライン表示とフルスクリーン表示の両方に対応。
 *
 * 主な機能:
 * - 3サイズ対応（small, medium, large）
 * - オプションのメッセージ表示
 * - フルスクリーンオーバーレイモード
 * - ダークモード対応
 *
 * 使用場面:
 * - データ読み込み中
 * - 保存処理中
 * - 画面遷移中
 */

/* ========================================
   型定義
   ======================================== */

export type LoadingSize = 'small' | 'medium' | 'large';

export interface LoadingSpinnerProps {
  /** スピナー下部に表示するメッセージ */
  message?: string;
  /** スピナーのサイズ（デフォルト: medium） */
  size?: LoadingSize;
  /** フルスクリーンオーバーレイ表示（デフォルト: false） */
  fullScreen?: boolean;
}

/* ========================================
   サイズ定義
   ======================================== */

const SIZE_CLASSES: Record<LoadingSize, string> = {
  small: 'h-4 w-4',
  medium: 'h-8 w-8',
  large: 'h-12 w-12',
};

/* ========================================
   コンポーネント
   ======================================== */

export function LoadingSpinner({
  message,
  size = 'medium',
  fullScreen = false,
}: LoadingSpinnerProps) {
  const sizeClass = SIZE_CLASSES[size];

  {/* スピナーSVG（アニメーション付き） */}
  const spinner = (
    <svg
      className={`animate-spin ${sizeClass} text-blue-600 dark:text-blue-400`}
      fill="none"
      viewBox="0 0 24 24"
    >
      {/* 外側の円（半透明） */}
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      {/* 内側のパス（アニメーション） */}
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );

  {/* スピナーとメッセージのコンテナ */}
  const content = (
    <div className="flex flex-col items-center justify-center gap-2">
      {spinner}
      {/* メッセージ（オプション） */}
      {message && (
        <p className="text-sm text-gray-600 dark:text-[#A0A0A0]">{message}</p>
      )}
    </div>
  );

  {/* フルスクリーンモード（オーバーレイ表示） */}
  if (fullScreen) {
    /* フルスクリーンオーバーレイコンテナ */
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-50 dark:bg-black">
        {content}
      </div>
    );
  }

  {/* インラインモード（通常表示） */}
  return <div className="flex items-center justify-center p-5">{content}</div>;
}

