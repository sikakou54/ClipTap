/**
 * @module dataItemStyles
 * @description データ選択リストアイテムのスタイル
 *
 * インポート/エクスポートのデータ選択画面で使うリストアイテム専用のスタイル定義。
 * 同ディレクトリの SelectionSnippetItem / SelectionCategoryItem /
 * SelectionProfileItem / SelectionVariableItem の4コンポーネントからのみ使われ、
 * 4つの行の見た目を揃えるために1箇所へまとめている。
 *
 * 文字サイズはこのモジュールでは持たない。タブレットでの拡大に追従させるため、
 * 各コンポーネントが useTheme() の responsiveFontSizes を style配列で重ねる
 * （モバイル全体で採用している「静的StyleSheet + 使用箇所でテーマ値を重ねる」形に揃えている）。
 */
import { StyleSheet } from 'react-native';

/**
 * データ選択リストアイテムのスタイル
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

  /** @description アイテムタイトル（文字サイズは responsiveFontSizes.base を使用箇所で重ねる） */
  itemTitle: {
    fontWeight: '600',
  },

  /** @description 重複警告テキスト（文字サイズは responsiveFontSizes.xs を使用箇所で重ねる） */
  duplicateText: {
    marginTop: 4,
  },

  /** @description 変数名の右に並べるアイコン */
  variableIcon: {
    marginLeft: 8,
  },

  /** @description カテゴリ色のドット */
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
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

  /** @description バッジテキスト（文字サイズは responsiveFontSizes.xs を使用箇所で重ねる） */
  badgeText: {
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

  /** @description プロファイル名（文字サイズは responsiveFontSizes.xs を使用箇所で重ねる） */
  profileValueName: {
    fontWeight: '600',
  },

  /** @description プロファイル値（文字サイズは responsiveFontSizes.xs を使用箇所で重ねる） */
  profileValueText: {
    flex: 1,
    textAlign: 'right',
  },
});
