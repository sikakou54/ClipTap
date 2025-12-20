/**
 * テキスト入力画面のビジネスロジックフック
 *
 * タイトルまたはコンテンツを入力する専用画面の状態管理とロジックを提供。
 * UIコンポーネント（TextInputScreen.tsx）から完全に分離されたビジネスロジック層。
 *
 * 主な責務:
 * - テキスト入力の状態管理
 * - カーソル位置の管理（変数挿入用）
 * - キーボード高さの管理
 * - 変数挿入処理
 * - 保存処理（コールバック経由）
 *
 * @see components/snippet/TextInputScreen.tsx - UIコンポーネント
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { TextInput, Keyboard, Platform } from 'react-native';
import { useRouter } from 'expo-router';

/** フォーカス遅延時間（ミリ秒）- キーボード表示のタイミング調整用 */
const FOCUS_DELAY_MS = 100;

/**
 * useTextInputScreenの引数
 */
export interface UseTextInputScreenParams {
  /** 入力タイプ（'title' または 'content'） */
  type: 'title' | 'content';
  /** 初期テキスト値 */
  initialValue?: string;
  /** 保存コールバックが設定されているか */
  hasOnSave?: boolean;
}

/**
 * useTextInputScreenの戻り値の型
 */
export interface UseTextInputScreenReturn {
  /* 状態 */
  text: string;
  cursorPosition: number;
  keyboardHeight: number;
  textInputRef: React.RefObject<TextInput | null>;

  /* ハンドラ */
  handleTextChange: (newText: string) => void;
  handleSelectionChange: (start: number) => void;
  handleInsertVariable: (variableName: string) => void;
  handleSave: () => void;
}

/**
 * テキスト入力画面のビジネスロジックフック
 *
 * @param params - 画面パラメータ
 * @returns 画面に必要な全ての状態とハンドラ
 */
export function useTextInputScreen(params: UseTextInputScreenParams): UseTextInputScreenReturn {
  const { type, initialValue = '', hasOnSave } = params;

  const router = useRouter();

  /* ======================================== */
  /* パラメータ処理 */
  /* ======================================== */
  const callbackKey = type === 'title' ? 'snippetTitleCallback' : 'snippetContentCallback';
  const initialText = initialValue;

  /* ======================================== */
  /* 状態管理 */
  /* ======================================== */
  const [text, setText] = useState(initialText);
  const [cursorPosition, setCursorPosition] = useState(initialText.length);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const textInputRef = useRef<TextInput>(null);

  /* ======================================== */
  /* キーボードイベントリスナー */
  /* ======================================== */
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const keyboardShow = Keyboard.addListener(showEvent, (e) => {
      setKeyboardHeight(e.endCoordinates.height);
    });
    const keyboardHide = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      keyboardShow.remove();
      keyboardHide.remove();
    };
  }, []);

  /* ======================================== */
  /* 自動フォーカスとカーソル位置設定 */
  /* ======================================== */
  useEffect(() => {
    setTimeout(() => {
      textInputRef.current?.focus();
      if (initialText.length > 0) {
        textInputRef.current?.setNativeProps({
          selection: { start: initialText.length, end: initialText.length },
        });
      }
    }, FOCUS_DELAY_MS);
  }, [initialText.length]);

  /* ======================================== */
  /* イベントハンドラ */
  /* ======================================== */

  /**
   * テキスト変更
   */
  const handleTextChange = useCallback((newText: string) => {
    setText(newText);
  }, []);

  /**
   * カーソル位置変更
   */
  const handleSelectionChange = useCallback((start: number) => {
    setCursorPosition(start);
  }, []);

  /**
   * 変数をカーソル位置に挿入
   */
  const handleInsertVariable = useCallback(
    (variableName: string) => {
      const variable = `{{${variableName}}}`;
      const newText =
        text.slice(0, cursorPosition) + variable + text.slice(cursorPosition);

      setText(newText);
      setCursorPosition(cursorPosition + variable.length);

      setTimeout(() => {
        textInputRef.current?.focus();
      }, FOCUS_DELAY_MS);
    },
    [text, cursorPosition]
  );

  /**
   * 保存処理（コールバック経由で親コンポーネントに値を渡す）
   */
  const handleSave = useCallback(() => {
    if (hasOnSave) {
      (global as any)[callbackKey]?.(text);
    }
    router.back();
  }, [hasOnSave, callbackKey, text, router]);

  /* ======================================== */
  /* 戻り値 */
  /* ======================================== */
  return {
    /* 状態 */
    text,
    cursorPosition,
    keyboardHeight,
    textInputRef,

    /* ハンドラ */
    handleTextChange,
    handleSelectionChange,
    handleInsertVariable,
    handleSave,
  };
}
