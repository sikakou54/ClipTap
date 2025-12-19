/**
 * @module ContentInputScreen
 * @description 定型文本文入力画面
 *
 * 定型文の本文を入力するための全画面モーダル。
 * 定型文作成・編集画面から本文フィールドをタップすると遷移する。
 *
 * @features
 * - 全画面での複数行テキスト入力
 * - 変数挿入ボタン（{{変数名}}形式）
 * - キーボード表示時のレイアウト調整
 *
 * @navigation
 * - global.snippetContentCallback: 入力完了時に本文を返す
 *
 * @see components/snippet/TextInputScreen.tsx - 共通入力コンポーネント
 * @see app/snippet/title-input.tsx - タイトル入力画面
 */
import { useLocalSearchParams } from 'expo-router';
import { TextInputScreen } from '@components/snippet/TextInputScreen';

export default function ContentInputScreen() {
  const params = useLocalSearchParams();
  const initialValue = (params.content as string) || '';
  const hasOnSave = !!params.onSave;

  return <TextInputScreen type="content" initialValue={initialValue} hasOnSave={hasOnSave} />;
}
