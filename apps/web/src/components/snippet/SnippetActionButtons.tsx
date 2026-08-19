/**
 * スニペットアクションボタンコンポーネント
 *
 * @description
 * スニペットカードの削除、編集、コピーボタン。
 * 並び順はモバイル版のカード右下と揃えている（削除→編集→コピー）。
 */
import { CopyButton } from './CopyButton';
import { EditButton } from './EditButton';
import { DeleteButton } from './DeleteButton';

interface SnippetActionButtonsProps {
  isCopied: boolean;
  onCopy: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function SnippetActionButtons({ isCopied, onCopy, onEdit, onDelete }: SnippetActionButtonsProps) {
  /* スニペットアクションボタン群（削除・編集・コピー） */
  return (
    <div className="flex items-center gap-1.5">
      <DeleteButton onClick={onDelete} />
      <EditButton onClick={onEdit} />
      <CopyButton isCopied={isCopied} onClick={onCopy} />
    </div>
  );
}
