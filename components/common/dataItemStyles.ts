/**
 * @module dataItemStyles
 * @description データアイテム共通スタイル
 *
 * インポート/エクスポート・選択画面で使用される各種アイテムコンポーネントの
 * 共通スタイルを定義。一貫したUIを提供。
 */
import { StyleSheet } from 'react-native';

/**
 * データアイテムの共通スタイル
 *
 * 統一レイアウト: チェックボックス | コンテンツ（タイトル、サブタイトル、メタ情報）
 */
export const dataItemStyles = StyleSheet.create({
  /** @description アイテム全体のコンテナ */
  item: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    alignItems: 'flex-start',
  },

  /** @description アイテムコンテナ（中央揃え版） */
  itemCentered: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
  },

  /** @description 選択不可アイテムのスタイル（半透明） */
  disabledItem: {
    opacity: 0.5,
  },

  /** @description 警告表示アイテム（左側に警告ボーダー） */
  warningItem: {
    borderLeftWidth: 4,
    paddingLeft: 12,
  },

  /** @description チェックボックスのコンテナ */
  checkContainer: {
    marginRight: 16,
  },

  /** @description メインコンテンツのコンテナ */
  itemContent: {
    flex: 1,
    gap: 4,
  },

  /** @description 横並びレイアウト */
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  /** @description ヘッダー行（タイトルとアクション） */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },

  /** @description アイテムタイトル */
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
  },

  /** @description アイテムサブタイトル */
  itemSubtitle: {
    fontSize: 14,
  },

  /** @description 重複警告テキスト */
  duplicateText: {
    fontSize: 12,
    marginTop: 4,
  },

  /** @description カテゴリ色のドット */
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },

  /** @description メタ情報行（作成日時など） */
  itemMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },

  /** @description バッジ（Pro, 新規など） */
  itemBadge: {
    fontSize: 12,
    fontWeight: '500',
  },

  /** @description プロファイル紐付きバッジ */
  profileBadge: {
    fontSize: 11,
    marginLeft: 8,
  },

  /** @description バッジコンテナ（横並び） */
  badgeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },

  /** @description 共通バッジスタイル */
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },

  /** @description バッジテキスト */
  badgeText: {
    fontSize: 11,
    fontWeight: '500',
  },

  /** @description プロファイル別値のリストコンテナ */
  profileValueList: {
    marginTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 8,
    gap: 8,
  },

  /** @description プロファイル値の行 */
  profileValueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },

  /** @description プロファイル名 */
  profileValueName: {
    fontSize: 12,
    fontWeight: '600',
  },

  /** @description プロファイル値 */
  profileValueText: {
    fontSize: 12,
    flex: 1,
    textAlign: 'right',
  },
});
