/**
 * @module variableIcons
 * @description
 * カスタム変数用アイコン定数の定義
 *
 * カスタム変数作成時にユーザーが選択できるアイコンのリスト。
 * モバイル（Ionicons）とWeb（react-icons/io5）で共通の名前を使用。
 */

/**
 * 利用可能なアイコン一覧（カテゴリ別に整理）
 * 変数を視覚的に識別しやすくするため
 *
 * @remarks Ionicons の outline スタイルを使用（統一感のあるデザイン）
 */
export const VARIABLE_ICONS = [
  /* 人物・連絡先カテゴリ */
  'person-outline',
  'people-outline',
  'person-circle-outline',
  'mail-outline',
  'call-outline',
  'chatbubble-outline',
  'at-outline',

  /* 場所・施設カテゴリ */
  'home-outline',
  'business-outline',
  'location-outline',
  'map-outline',
  'navigate-outline',
  'globe-outline',

  /* ドキュメント・テキストカテゴリ */
  'document-outline',
  'document-text-outline',
  'documents-outline',
  'newspaper-outline',
  'reader-outline',
  'text-outline',
  'create-outline',
  'pencil-outline',

  /* ビジネス・金融カテゴリ */
  'card-outline',
  'wallet-outline',
  'cash-outline',
  'calculator-outline',
  'briefcase-outline',
  'receipt-outline',

  /* 技術・開発カテゴリ */
  'code-outline',
  'code-slash-outline',
  'terminal-outline',
  'bug-outline',
  'construct-outline',
  'hammer-outline',

  /* メディア・エンターテインメントカテゴリ */
  'musical-notes-outline',
  'headset-outline',
  'image-outline',
  'camera-outline',
  'film-outline',
  'videocam-outline',

  /* 時間・スケジュールカテゴリ */
  'time-outline',
  'calendar-outline',
  'alarm-outline',
  'stopwatch-outline',
  'hourglass-outline',

  /* アクション・状態カテゴリ */
  'heart-outline',
  'heart-circle-outline',
  'star-outline',
  'bookmark-outline',
  'flag-outline',
  'trophy-outline',
  'ribbon-outline',

  /* オブジェクトカテゴリ */
  'gift-outline',
  'basket-outline',
  'cart-outline',
  'bag-outline',
  'pizza-outline',
  'cafe-outline',
  'restaurant-outline',

  /* 移動・交通カテゴリ */
  'car-outline',
  'bicycle-outline',
  'airplane-outline',
  'train-outline',
  'boat-outline',

  /* ツール・設定カテゴリ */
  'settings-outline',
  'cog-outline',
  'options-outline',
  'build-outline',
  'flash-outline',
  'key-outline',
  'lock-closed-outline',

  /* 天気・自然カテゴリ */
  'sunny-outline',
  'moon-outline',
  'cloud-outline',
  'rainy-outline',
  'leaf-outline',
  'flower-outline',

  /* その他カテゴリ */
  'link-outline',
  'infinite-outline',
  'funnel-outline',
  'analytics-outline',
  'stats-chart-outline',
  'pie-chart-outline',
  'barcode-outline',
  'qr-code-outline',
] as const;

/** アイコン名の型（VARIABLE_ICONSの要素のユニオン型） */
export type VariableIconName = (typeof VARIABLE_ICONS)[number];

/** デフォルトのアイコン名 */
export const DEFAULT_VARIABLE_ICON: VariableIconName = 'code-outline';
