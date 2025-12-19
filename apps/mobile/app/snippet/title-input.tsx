/**
 * @module TitleInputScreen
 * @description 定型文タイトル入力画面
 *
 * 定型文のタイトルを入力するための全画面モーダル。
 * 定型文作成・編集画面からタイトルフィールドをタップすると遷移する。
 *
 * @features
 * - 全画面でのテキスト入力
 * - キーボード表示時のレイアウト調整
 * - 単一行入力（改行不可）
 *
 * @navigation
 * - global.snippetTitleCallback: 入力完了時にタイトルを返す
 *
 * @see components/snippet/TextInputScreen.tsx - 共通入力コンポーネント
 * @see app/snippet/content-input.tsx - 本文入力画面
 */
import { useLocalSearchParams } from 'expo-router';
import { TextInputScreen } from '@components/snippet/TextInputScreen';

export default function TitleInputScreen() {
  const params = useLocalSearchParams();
  const initialValue = (params.title as string) || '';
  const hasOnSave = !!params.onSave;

  return <TextInputScreen type="title" initialValue={initialValue} hasOnSave={hasOnSave} />;
}
