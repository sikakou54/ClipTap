/**
 * カード内丸ボタンの基底コンポーネント
 *
 * @description
 * 定型文カードの下部に並ぶ操作ボタン（展開・削除・編集・コピー）の共通の器。
 * モバイル版SnippetCardの`roundButton`（40x40・枠線1px・完全な円）と寸法を揃えている。
 *
 * 枠線色とアイコン色はボタンごとに異なるため、呼び出し側からクラスで指定する。
 */
import type { ReactNode } from 'react';

interface CardRoundButtonProps {
  /** クリック時のコールバック */
  onClick: () => void;
  /** ツールチップおよび読み上げラベル */
  label: string;
  /** 枠線色とアイコン色を指定するTailwindクラス */
  colorClassName: string;
  /** 内側に描画するアイコン */
  children: ReactNode;
}

export function CardRoundButton({ onClick, label, colorClassName, children }: CardRoundButtonProps) {
  /* 丸ボタン（40x40、枠線あり、カード背景と同色） */
  return (
    <button
      onClick={onClick}
      className={`w-10 h-10 rounded-full border flex items-center justify-center flex-shrink-0 transition-colors hover:bg-gray-50 dark:hover:bg-[#2A2A2A] ${colorClassName}`}
      title={label}
      aria-label={label}
    >
      {children}
    </button>
  );
}
