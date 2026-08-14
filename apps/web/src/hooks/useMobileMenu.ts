/**
 * モバイルメニュー（ハンバーガーメニュー）の開閉を管理するカスタムフック
 *
 * @description
 * サイドメニューのモバイル表示時の開閉状態を管理する。
 * toggle/closeをuseCallbackでメモ化し、不要な再レンダリングを防ぐ。
 *
 * @returns {object} メニュー状態と操作関数
 * - isOpen: メニューが開いているかどうか
 * - toggle: 開閉をトグル
 * - close: メニューを閉じる
 */
import { useState, useCallback } from 'react';

interface UseMobileMenuReturn {
  isOpen: boolean;
  toggle: () => void;
  close: () => void;
}

export function useMobileMenu(): UseMobileMenuReturn {
  const [isOpen, setIsOpen] = useState(false);

  const toggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const close = useCallback(() => {
    /* 強制的に閉じる（リンククリック後などに使用） */
    setIsOpen(false);
  }, []);

  return { isOpen, toggle, close };
}
