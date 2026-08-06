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
  | { readonly type: 'cursor'; readonly offset: number }
  /** 直前のかなを濁点・半濁点・小文字へ巡回させる。規則はkanaVariants.tsが正本 */
  | { readonly type: 'kanaVariant' };

/** キー配列の識別子 */
export type LayoutId = 'qwerty' | 'symbols' | 'numbers' | 'flick';

/** フリックの方向 */
export type FlickDirection = 'up' | 'down' | 'left' | 'right';

/**
 * フリック入力の割り当て
 *
 * 中央（タップ）は`action`が担う。ここには上下左右だけを持たせる。
 */
export type FlickMap = Partial<Record<FlickDirection, KeyAction>>;

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
  /** フリック入力の割り当て。12キー配列でのみ使う */
  readonly flick?: FlickMap;
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
        fn('switch_flick', 'あ', { type: 'switchLayout', layoutId: 'flick' }, 1.5),
        fn('space', ' ', { type: 'space' }, 3.5),
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

/**
 * 12キーフリック（日本語）の1キーを作る
 *
 * 中央がタップ、上下左右がフリックに対応する。「あ」なら
 * 中央=あ、左=い、上=う、右=え、下=お。この割り当てはOS標準と同じで、
 * 利用者が既に指の動きを覚えているため独自の配置にする利点がない。
 *
 * @param row 「あいうえお」のように、中央・左・上・右・下の順に並べたかな
 */
const flickKey = (id: string, row: string): Key => {
  const [center, left, up, right, down] = row.split('');
  /* 過不足は正本の書き誤り。実行時ではなく生成・テストの段階で落とす */
  if (!center || !left || !up || !right || !down) {
    throw new Error(`フリックキー ${id} は中央・左・上・右・下の5文字で指定すること: "${row}"`);
  }
  return {
    id: `flick_${id}`,
    label: center,
    action: { type: 'input', text: center },
    flick: {
      left: { type: 'input', text: left },
      up: { type: 'input', text: up },
      right: { type: 'input', text: right },
      down: { type: 'input', text: down },
    },
  };
};

/**
 * 12キーフリック（日本語）
 *
 * かな入力の結果は変換エンジンへ渡され、候補バーに変換候補が並ぶ。
 */
export const FLICK_LAYOUT: KeyLayout = {
  id: 'flick',
  rows: [
    {
      keys: [
        flickKey('a', 'あいうえお'),
        flickKey('ka', 'かきくけこ'),
        flickKey('sa', 'さしすせそ'),
        fn('backspace', '⌫', { type: 'backspace' }, 1),
      ],
    },
    {
      keys: [
        flickKey('ta', 'たちつてと'),
        flickKey('na', 'なにぬねの'),
        flickKey('ha', 'はひふへほ'),
        fn('space', '␣', { type: 'space' }, 1),
      ],
    },
    {
      keys: [
        flickKey('ma', 'まみむめも'),
        /* OS標準と同じく、や行はかぎ括弧を左右に持つ */
        flickKey('ya', 'や「ゆ」よ'),
        flickKey('ra', 'らりるれろ'),
        fn('enter', '⏎', { type: 'enter' }, 1),
      ],
    },
    {
      keys: [
        fn('switch_qwerty', 'ABC', { type: 'switchLayout', layoutId: 'qwerty' }, 1),
        flickKey('wa', 'わをんー〜'),
        {
          /* 直前のかなを 小文字 → 濁点 → 半濁点 の順で巡回させる */
          id: 'flick_dakuten',
          label: '゛゜小',
          action: { type: 'kanaVariant' },
          accessibilityLabelKey: 'accessibility.key.flick_dakuten',
        },
        fn('next_keyboard', '🌐', { type: 'nextKeyboard' }, 1),
      ],
    },
  ],
};

/** 生成対象のすべての配列 */
export const ALL_LAYOUTS: readonly KeyLayout[] = [
  QWERTY_LAYOUT,
  NUMBERS_LAYOUT,
  SYMBOLS_LAYOUT,
  FLICK_LAYOUT,
];
