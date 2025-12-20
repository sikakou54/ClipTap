/**
 * @module iconMapping
 * @description
 * Mobile（Ionicons）とWeb（Heroicons）のアイコンマッピング定義
 *
 * セマンティックなアイコン名から各プラットフォーム固有のアイコン名を取得。
 * 新規アイコン追加時は両プラットフォーム分を同時に定義する。
 *
 * 使用箇所:
 * - 変数アイコン選択UI
 * - カテゴリアイコン
 * - 設定画面のアイコン
 */

export interface IconMappingEntry {
  ionicon: string;
  heroicon: string;
  category: IconCategory;
}

export type IconCategory =
  | 'person'
  | 'place'
  | 'document'
  | 'business'
  | 'tech'
  | 'media'
  | 'time'
  | 'action'
  | 'object'
  | 'transport'
  | 'tool'
  | 'nature'
  | 'other';

export type SemanticIconName = keyof typeof ICON_MAPPING;

/**
 * アイコンマッピング定義
 * キー: セマンティックアイコン名
 * 値: プラットフォーム別アイコン名とカテゴリ
 */
export const ICON_MAPPING = {
  /* 人物・連絡先 */
  person: {
    ionicon: 'person-outline',
    heroicon: 'user',
    category: 'person',
  },
  people: {
    ionicon: 'people-outline',
    heroicon: 'users',
    category: 'person',
  },
  'person-circle': {
    ionicon: 'person-circle-outline',
    heroicon: 'user-circle',
    category: 'person',
  },
  mail: {
    ionicon: 'mail-outline',
    heroicon: 'mail',
    category: 'person',
  },
  phone: {
    ionicon: 'call-outline',
    heroicon: 'phone',
    category: 'person',
  },
  chat: {
    ionicon: 'chatbubble-outline',
    heroicon: 'chat-bubble',
    category: 'person',
  },
  at: {
    ionicon: 'at-outline',
    heroicon: 'at-symbol',
    category: 'person',
  },

  /* 場所・施設 */
  home: {
    ionicon: 'home-outline',
    heroicon: 'home',
    category: 'place',
  },
  office: {
    ionicon: 'business-outline',
    heroicon: 'building-office',
    category: 'place',
  },
  location: {
    ionicon: 'location-outline',
    heroicon: 'map-pin',
    category: 'place',
  },
  map: {
    ionicon: 'map-outline',
    heroicon: 'map',
    category: 'place',
  },
  globe: {
    ionicon: 'globe-outline',
    heroicon: 'globe-alt',
    category: 'place',
  },

  /* ドキュメント・テキスト */
  document: {
    ionicon: 'document-outline',
    heroicon: 'document',
    category: 'document',
  },
  'document-text': {
    ionicon: 'document-text-outline',
    heroicon: 'document-text',
    category: 'document',
  },
  documents: {
    ionicon: 'documents-outline',
    heroicon: 'clipboard-document',
    category: 'document',
  },
  newspaper: {
    ionicon: 'newspaper-outline',
    heroicon: 'newspaper',
    category: 'document',
  },
  pencil: {
    ionicon: 'pencil-outline',
    heroicon: 'pencil',
    category: 'document',
  },
  create: {
    ionicon: 'create-outline',
    heroicon: 'pencil-square',
    category: 'document',
  },

  /* ビジネス・金融 */
  card: {
    ionicon: 'card-outline',
    heroicon: 'credit-card',
    category: 'business',
  },
  wallet: {
    ionicon: 'wallet-outline',
    heroicon: 'wallet',
    category: 'business',
  },
  cash: {
    ionicon: 'cash-outline',
    heroicon: 'banknotes',
    category: 'business',
  },
  calculator: {
    ionicon: 'calculator-outline',
    heroicon: 'calculator',
    category: 'business',
  },
  briefcase: {
    ionicon: 'briefcase-outline',
    heroicon: 'briefcase',
    category: 'business',
  },
  receipt: {
    ionicon: 'receipt-outline',
    heroicon: 'receipt-percent',
    category: 'business',
  },

  /* 技術・開発 */
  code: {
    ionicon: 'code-outline',
    heroicon: 'code-bracket',
    category: 'tech',
  },
  terminal: {
    ionicon: 'terminal-outline',
    heroicon: 'command-line',
    category: 'tech',
  },
  bug: {
    ionicon: 'bug-outline',
    heroicon: 'bug-ant',
    category: 'tech',
  },
  construct: {
    ionicon: 'construct-outline',
    heroicon: 'wrench-screwdriver',
    category: 'tech',
  },
  cog: {
    ionicon: 'cog-outline',
    heroicon: 'cog',
    category: 'tech',
  },

  /* メディア・エンターテインメント */
  music: {
    ionicon: 'musical-notes-outline',
    heroicon: 'musical-note',
    category: 'media',
  },
  image: {
    ionicon: 'image-outline',
    heroicon: 'photo',
    category: 'media',
  },
  camera: {
    ionicon: 'camera-outline',
    heroicon: 'camera',
    category: 'media',
  },
  film: {
    ionicon: 'film-outline',
    heroicon: 'film',
    category: 'media',
  },
  video: {
    ionicon: 'videocam-outline',
    heroicon: 'video-camera',
    category: 'media',
  },

  /* 時間・スケジュール */
  time: {
    ionicon: 'time-outline',
    heroicon: 'clock',
    category: 'time',
  },
  calendar: {
    ionicon: 'calendar-outline',
    heroicon: 'calendar',
    category: 'time',
  },
  'calendar-days': {
    ionicon: 'calendar-outline',
    heroicon: 'calendar-days',
    category: 'time',
  },

  /* アクション・状態 */
  heart: {
    ionicon: 'heart-outline',
    heroicon: 'heart',
    category: 'action',
  },
  star: {
    ionicon: 'star-outline',
    heroicon: 'star',
    category: 'action',
  },
  bookmark: {
    ionicon: 'bookmark-outline',
    heroicon: 'bookmark',
    category: 'action',
  },
  flag: {
    ionicon: 'flag-outline',
    heroicon: 'flag',
    category: 'action',
  },
  trophy: {
    ionicon: 'trophy-outline',
    heroicon: 'trophy',
    category: 'action',
  },

  /* オブジェクト */
  gift: {
    ionicon: 'gift-outline',
    heroicon: 'gift',
    category: 'object',
  },
  bag: {
    ionicon: 'bag-outline',
    heroicon: 'shopping-bag',
    category: 'object',
  },
  cart: {
    ionicon: 'cart-outline',
    heroicon: 'shopping-cart',
    category: 'object',
  },

  /* ツール・設定 */
  settings: {
    ionicon: 'settings-outline',
    heroicon: 'cog-6-tooth',
    category: 'tool',
  },
  options: {
    ionicon: 'options-outline',
    heroicon: 'adjustments-horizontal',
    category: 'tool',
  },
  key: {
    ionicon: 'key-outline',
    heroicon: 'key',
    category: 'tool',
  },
  lock: {
    ionicon: 'lock-closed-outline',
    heroicon: 'lock-closed',
    category: 'tool',
  },

  /* その他 */
  link: {
    ionicon: 'link-outline',
    heroicon: 'link',
    category: 'other',
  },
  funnel: {
    ionicon: 'funnel-outline',
    heroicon: 'funnel',
    category: 'other',
  },
  'chart-bar': {
    ionicon: 'stats-chart-outline',
    heroicon: 'chart-bar',
    category: 'other',
  },
  'chart-pie': {
    ionicon: 'pie-chart-outline',
    heroicon: 'chart-pie',
    category: 'other',
  },
  qrcode: {
    ionicon: 'qr-code-outline',
    heroicon: 'qr-code',
    category: 'other',
  },
} as const satisfies Record<string, IconMappingEntry>;

/**
 * セマンティックアイコン名からIonicons名を取得
 *
 * @param name セマンティックアイコン名
 * @returns Ionicons名
 */
export function getIoniconName(name: SemanticIconName): string {
  return ICON_MAPPING[name].ionicon;
}

/**
 * セマンティックアイコン名からHeroicons名を取得
 *
 * @param name セマンティックアイコン名
 * @returns Heroicons名
 */
export function getHeroiconName(name: SemanticIconName): string {
  return ICON_MAPPING[name].heroicon;
}

