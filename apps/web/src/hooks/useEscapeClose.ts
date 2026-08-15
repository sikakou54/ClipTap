/**
 * ESCキーでモーダルを閉じるカスタムフック
 *
 * @description
 * Web版のモーダルは、Headless UI の Dialog を使うもの（Export/Import系）と、
 * オーバーレイDOMを自前で組んでいるものが混在している。前者はライブラリがESCを処理するが、
 * 後者は各自で実装する必要があるため、その処理をここへ一本化している。
 *
 * 多重に開いたときは最後に開いたモーダルだけが閉じるよう、開いているモーダルをモジュール内の
 * スタックで管理する。onClose は ref 経由で読むため、ハンドラの参照が毎レンダー変わっても
 * リスナーの再登録（＝スタック順の入れ替わり）は起きない。
 *
 * @module useEscapeClose
 */
import { useEffect, useRef } from 'react';

/** 現在開いているモーダルの識別子。末尾が最前面 */
const openModalTokens: symbol[] = [];

/**
 * ESCキーで閉じる操作を登録する
 *
 * @param isOpen - モーダルが開いているかどうか
 * @param onClose - 閉じる処理。未保存確認がある場合は確認付きのハンドラを渡すこと
 */
export function useEscapeClose(isOpen: boolean, onClose: () => void): void {
  const onCloseRef = useRef(onClose);

  /* 最新のハンドラを保持する（リスナー自体は再登録しない） */
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return undefined;

    /* このモーダルを最前面として登録する */
    const token = Symbol('escape-close');
    openModalTokens.push(token);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      /* 最前面のモーダルだけが閉じる（背後のモーダルは開いたまま残す） */
      if (openModalTokens[openModalTokens.length - 1] !== token) return;
      onCloseRef.current();
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      const index = openModalTokens.indexOf(token);
      if (index !== -1) {
        openModalTokens.splice(index, 1);
      }
    };
  }, [isOpen]);
}
