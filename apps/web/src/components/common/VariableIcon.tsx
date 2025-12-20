/**
 * 変数アイコンコンポーネント
 *
 * @description
 * カスタム変数用のアイコンを表示するコンポーネント。
 * react-icons/io5（Ionicons 5）を使用してモバイル版と同じアイコンを表示。
 */
import type { IconType } from 'react-icons';
import {
  IoPersonOutline,
  IoPeopleOutline,
  IoPersonCircleOutline,
  IoMailOutline,
  IoCallOutline,
  IoChatbubbleOutline,
  IoAtOutline,
  IoHomeOutline,
  IoBusinessOutline,
  IoLocationOutline,
  IoMapOutline,
  IoNavigateOutline,
  IoGlobeOutline,
  IoDocumentOutline,
  IoDocumentTextOutline,
  IoDocumentsOutline,
  IoNewspaperOutline,
  IoReaderOutline,
  IoTextOutline,
  IoCreateOutline,
  IoPencilOutline,
  IoCardOutline,
  IoWalletOutline,
  IoCashOutline,
  IoCalculatorOutline,
  IoBriefcaseOutline,
  IoReceiptOutline,
  IoCodeOutline,
  IoCodeSlashOutline,
  IoTerminalOutline,
  IoBugOutline,
  IoConstructOutline,
  IoHammerOutline,
  IoMusicalNotesOutline,
  IoHeadsetOutline,
  IoImageOutline,
  IoCameraOutline,
  IoFilmOutline,
  IoVideocamOutline,
  IoTimeOutline,
  IoCalendarOutline,
  IoAlarmOutline,
  IoStopwatchOutline,
  IoHourglassOutline,
  IoHeartOutline,
  IoHeartCircleOutline,
  IoStarOutline,
  IoBookmarkOutline,
  IoFlagOutline,
  IoTrophyOutline,
  IoRibbonOutline,
  IoGiftOutline,
  IoBasketOutline,
  IoCartOutline,
  IoBagOutline,
  IoPizzaOutline,
  IoCafeOutline,
  IoRestaurantOutline,
  IoCarOutline,
  IoBicycleOutline,
  IoAirplaneOutline,
  IoTrainOutline,
  IoBoatOutline,
  IoSettingsOutline,
  IoCogOutline,
  IoOptionsOutline,
  IoBuildOutline,
  IoFlashOutline,
  IoKeyOutline,
  IoLockClosedOutline,
  IoSunnyOutline,
  IoMoonOutline,
  IoCloudOutline,
  IoRainyOutline,
  IoLeafOutline,
  IoFlowerOutline,
  IoLinkOutline,
  IoInfiniteOutline,
  IoFunnelOutline,
  IoAnalyticsOutline,
  IoStatsChartOutline,
  IoPieChartOutline,
  IoBarcodeOutline,
  IoQrCodeOutline,
} from 'react-icons/io5';
import type { VariableIconName } from '@cliptap/shared';

/**
 * アイコン名からReactコンポーネントへのマッピング
 */
const ICON_MAP: Record<VariableIconName, IconType> = {
  /* 人物・連絡先カテゴリ */
  'person-outline': IoPersonOutline,
  'people-outline': IoPeopleOutline,
  'person-circle-outline': IoPersonCircleOutline,
  'mail-outline': IoMailOutline,
  'call-outline': IoCallOutline,
  'chatbubble-outline': IoChatbubbleOutline,
  'at-outline': IoAtOutline,

  /* 場所・施設カテゴリ */
  'home-outline': IoHomeOutline,
  'business-outline': IoBusinessOutline,
  'location-outline': IoLocationOutline,
  'map-outline': IoMapOutline,
  'navigate-outline': IoNavigateOutline,
  'globe-outline': IoGlobeOutline,

  /* ドキュメント・テキストカテゴリ */
  'document-outline': IoDocumentOutline,
  'document-text-outline': IoDocumentTextOutline,
  'documents-outline': IoDocumentsOutline,
  'newspaper-outline': IoNewspaperOutline,
  'reader-outline': IoReaderOutline,
  'text-outline': IoTextOutline,
  'create-outline': IoCreateOutline,
  'pencil-outline': IoPencilOutline,

  /* ビジネス・金融カテゴリ */
  'card-outline': IoCardOutline,
  'wallet-outline': IoWalletOutline,
  'cash-outline': IoCashOutline,
  'calculator-outline': IoCalculatorOutline,
  'briefcase-outline': IoBriefcaseOutline,
  'receipt-outline': IoReceiptOutline,

  /* 技術・開発カテゴリ */
  'code-outline': IoCodeOutline,
  'code-slash-outline': IoCodeSlashOutline,
  'terminal-outline': IoTerminalOutline,
  'bug-outline': IoBugOutline,
  'construct-outline': IoConstructOutline,
  'hammer-outline': IoHammerOutline,

  /* メディア・エンターテインメントカテゴリ */
  'musical-notes-outline': IoMusicalNotesOutline,
  'headset-outline': IoHeadsetOutline,
  'image-outline': IoImageOutline,
  'camera-outline': IoCameraOutline,
  'film-outline': IoFilmOutline,
  'videocam-outline': IoVideocamOutline,

  /* 時間・スケジュールカテゴリ */
  'time-outline': IoTimeOutline,
  'calendar-outline': IoCalendarOutline,
  'alarm-outline': IoAlarmOutline,
  'stopwatch-outline': IoStopwatchOutline,
  'hourglass-outline': IoHourglassOutline,

  /* アクション・状態カテゴリ */
  'heart-outline': IoHeartOutline,
  'heart-circle-outline': IoHeartCircleOutline,
  'star-outline': IoStarOutline,
  'bookmark-outline': IoBookmarkOutline,
  'flag-outline': IoFlagOutline,
  'trophy-outline': IoTrophyOutline,
  'ribbon-outline': IoRibbonOutline,

  /* オブジェクトカテゴリ */
  'gift-outline': IoGiftOutline,
  'basket-outline': IoBasketOutline,
  'cart-outline': IoCartOutline,
  'bag-outline': IoBagOutline,
  'pizza-outline': IoPizzaOutline,
  'cafe-outline': IoCafeOutline,
  'restaurant-outline': IoRestaurantOutline,

  /* 移動・交通カテゴリ */
  'car-outline': IoCarOutline,
  'bicycle-outline': IoBicycleOutline,
  'airplane-outline': IoAirplaneOutline,
  'train-outline': IoTrainOutline,
  'boat-outline': IoBoatOutline,

  /* ツール・設定カテゴリ */
  'settings-outline': IoSettingsOutline,
  'cog-outline': IoCogOutline,
  'options-outline': IoOptionsOutline,
  'build-outline': IoBuildOutline,
  'flash-outline': IoFlashOutline,
  'key-outline': IoKeyOutline,
  'lock-closed-outline': IoLockClosedOutline,

  /* 天気・自然カテゴリ */
  'sunny-outline': IoSunnyOutline,
  'moon-outline': IoMoonOutline,
  'cloud-outline': IoCloudOutline,
  'rainy-outline': IoRainyOutline,
  'leaf-outline': IoLeafOutline,
  'flower-outline': IoFlowerOutline,

  /* その他カテゴリ */
  'link-outline': IoLinkOutline,
  'infinite-outline': IoInfiniteOutline,
  'funnel-outline': IoFunnelOutline,
  'analytics-outline': IoAnalyticsOutline,
  'stats-chart-outline': IoStatsChartOutline,
  'pie-chart-outline': IoPieChartOutline,
  'barcode-outline': IoBarcodeOutline,
  'qr-code-outline': IoQrCodeOutline,
};

interface VariableIconProps {
  /** アイコン名 */
  name: VariableIconName | string | null | undefined;
  /** アイコンサイズ（ピクセル） */
  size?: number;
  /** CSSクラス名 */
  className?: string;
}

/**
 * 変数アイコンを表示するコンポーネント
 */
export function VariableIcon({ name, size = 20, className = '' }: VariableIconProps) {
  /* アイコン名が未指定またはマッピングにない場合はデフォルトアイコン */
  const iconName = (name && name in ICON_MAP ? name : 'code-outline') as VariableIconName;
  const IconComponent = ICON_MAP[iconName];

  return <IconComponent size={size} className={className} />;
}
