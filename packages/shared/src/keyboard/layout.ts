/**
 * 拡張キーボードのキー配列と入力規則の正本
 *
 * iOSとAndroidの両方でキー配列を手書きすると、必ず片方だけがズレる。
 * ここを唯一の正本とし、SwiftとKotlinのソースを生成する。
 *
 * このファイルはTypeScriptの型検査とvitestの対象になるため、
 * 不正な配列はネイティブをビルドする前に検出できる。
 */

/**
 * キーを押したときの動作
 *
 * iOSとAndroidで同じ語彙を使う。生成されるSwift/Kotlinの列挙もこれに対応する。
 */
export type KeyAction =
  /** 文字を入力する */
  | { readonly type: 'input'; readonly text: string }
  /** 直前の1文字（未確定があればその1単位）を削除する */
  | { readonly type: 'backspace' }
  /** 空白を入力する。日本語入力中は変換操作を兼ねる */
  | { readonly type: 'space' }
  /** 改行、または入力欄が要求する確定動作を行う */
  | { readonly type: 'enter' }
  /** シフト（大文字・小文字の切替） */
  | { readonly type: 'shift' }
  /** 別のキー配列へ切り替える */
  | { readonly type: 'switchLayout'; readonly layoutId: LayoutId }
  /** 他のキーボードへ切り替える。Appleが全カスタムキーボードに必須としている */
  | { readonly type: 'nextKeyboard' }
  /** 定型文の一覧と入力キーボードを切り替える */
  | { readonly type: 'toggleSnippetList' }
  /** カーソルを移動する */
  | { readonly type: 'cursor'; readonly offset: number };

/** キー配列の識別子 */
export type LayoutId = 'qwerty' | 'symbols' | 'numbers';

/**
 * キーの見た目上の幅
 *
 * `unit` は行内の他のキーに対する相対値。1が標準の文字キー。
 * 数値で持たせるのは、行ごとにキー数が違っても比率で配置できるようにするため。
 */
export interface KeyWidth {
  readonly unit: number;
}

/**
 * 1つのキー
 */
export interface Key {
  /** レイアウト内で一意。テストとアクセシビリティ識別に使う */
  readonly id: string;
  /** キーに表示する文字。省略時はactionのtextを表示する */
  readonly label?: string;
  /** シフト時に表示する文字。シフトを持つ配列でのみ使う */
  readonly shiftLabel?: string;
  /** 押したときの動作 */
  readonly action: KeyAction;
  /** シフト時の動作。省略時はactionのtextを大文字にする */
  readonly shiftAction?: KeyAction;
  /** 相対幅。省略時は1 */
  readonly width?: KeyWidth;
  /** 文字キーではないことを示す。配色を変えるために使う */
  readonly isFunction?: boolean;
  /** 読み上げラベル。省略時はlabelを読む */
  readonly accessibilityLabelKey?: string;
}

/** キーの行 */
export interface KeyRow {
  readonly keys: readonly Key[];
}

/** キー配列 */
export interface KeyLayout {
  readonly id: LayoutId;
  readonly rows: readonly KeyRow[];
}

/** 文字キーを作る短縮記法 */
const char = (text: string, shiftText?: string): Key => ({
  id: `key_${text}`,
  label: text,
  shiftLabel: shiftText ?? text.toUpperCase(),
  action: { type: 'input', text },
  shiftAction: { type: 'input', text: shiftText ?? text.toUpperCase() },
});

/** 機能キーを作る短縮記法 */
const fn = (id: string, label: string, action: KeyAction, unit: number): Key => ({
  id,
  label,
  action,
  width: { unit },
  isFunction: true,
  accessibilityLabelKey: `accessibility.key.${id}`,
});

/**
 * 英字QWERTY配列
 *
 * OS標準に近い4行構成にする。利用者が既に指の位置を覚えているため、
 * 独自の配置にする利点がない。
 */
export const QWERTY_LAYOUT: KeyLayout = {
  id: 'qwerty',
  rows: [
    { keys: 'qwertyuiop'.split('').map((c) => char(c)) },
    {
      keys: [
        /* 中段は9キーなので、両端に半キー分の余白を持たせて中央に寄せる */
        ...'asdfghjkl'.split('').map((c) => char(c)),
      ],
    },
    {
      keys: [
        fn('shift', '⇧', { type: 'shift' }, 1.5),
        ...'zxcvbnm'.split('').map((c) => char(c)),
        fn('backspace', '⌫', { type: 'backspace' }, 1.5),
      ],
    },
    {
      keys: [
        fn('switch_numbers', '123', { type: 'switchLayout', layoutId: 'numbers' }, 1.5),
        fn('next_keyboard', '🌐', { type: 'nextKeyboard' }, 1),
        fn('space', ' ', { type: 'space' }, 5),
        fn('enter', '⏎', { type: 'enter' }, 1.5),
      ],
    },
  ],
};

/**
 * 数字と基本記号
 */
export const NUMBERS_LAYOUT: KeyLayout = {
  id: 'numbers',
  rows: [
    { keys: '1234567890'.split('').map((c) => char(c, c)) },
    { keys: ['-', '/', ':', ';', '(', ')', '¥', '&', '@', '"'].map((c) => char(c, c)) },
    {
      keys: [
        fn('switch_symbols', '#+=', { type: 'switchLayout', layoutId: 'symbols' }, 1.5),
        ...['.', ',', '?', '!', "'"].map((c) => char(c, c)),
        fn('backspace', '⌫', { type: 'backspace' }, 1.5),
      ],
    },
    {
      keys: [
        fn('switch_qwerty', 'ABC', { type: 'switchLayout', layoutId: 'qwerty' }, 1.5),
        fn('next_keyboard', '🌐', { type: 'nextKeyboard' }, 1),
        fn('space', ' ', { type: 'space' }, 5),
        fn('enter', '⏎', { type: 'enter' }, 1.5),
      ],
    },
  ],
};

/**
 * 記号
 */
export const SYMBOLS_LAYOUT: KeyLayout = {
  id: 'symbols',
  rows: [
    { keys: ['[', ']', '{', '}', '#', '%', '^', '*', '+', '='].map((c) => char(c, c)) },
    { keys: ['_', '\\', '|', '~', '<', '>', '$', '£', '€', '•'].map((c) => char(c, c)) },
    {
      keys: [
        fn('switch_numbers', '123', { type: 'switchLayout', layoutId: 'numbers' }, 1.5),
        ...['.', ',', '?', '!', "'"].map((c) => char(c, c)),
        fn('backspace', '⌫', { type: 'backspace' }, 1.5),
      ],
    },
    {
      keys: [
        fn('switch_qwerty', 'ABC', { type: 'switchLayout', layoutId: 'qwerty' }, 1.5),
        fn('next_keyboard', '🌐', { type: 'nextKeyboard' }, 1),
        fn('space', ' ', { type: 'space' }, 5),
        fn('enter', '⏎', { type: 'enter' }, 1.5),
      ],
    },
  ],
};

/** 生成対象のすべての配列 */
export const ALL_LAYOUTS: readonly KeyLayout[] = [QWERTY_LAYOUT, NUMBERS_LAYOUT, SYMBOLS_LAYOUT];
