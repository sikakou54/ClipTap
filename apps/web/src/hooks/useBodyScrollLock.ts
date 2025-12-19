/**
 * モーダル表示時に背景スクロールを無効化するカスタムフック
 *
 * @description
 * モーダルやドロワーが開いている間、背景のスクロールを防ぐ。
 * コンポーネントがアンマウントされた場合も自動的にスクロールを復元する。
 */
import { useEffect } from 'react';

export function useBodyScrollLock(isLocked: boolean): void {
  useEffect(() => {
    /* ロック状態に応じてbodyのoverflowスタイルを切り替え */
    /* 'hidden'を設定するとスクロールバーが消え、スクロール不可になる */
    document.body.style.overflow = isLocked ? 'hidden' : '';

    /* クリーンアップ: コンポーネントアンマウント時にスクロールを復元 */
    /* これを忘れると、モーダルを閉じた後もスクロールできない状態が続いてしまう */
    return () => {
      document.body.style.overflow = '';
    };
  }, [isLocked]);
}
