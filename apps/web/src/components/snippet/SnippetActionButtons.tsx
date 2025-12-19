/**
 * スニペットアクションボタンコンポーネント
 *
 * @description
 * スニペットカードのコピー、編集、削除ボタン
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
  /* スニペットアクションボタン群（コピー・編集・削除） */
  return (
    <div className="flex items-center gap-1">
      <CopyButton isCopied={isCopied} onClick={onCopy} />
      <EditButton onClick={onEdit} />
      <DeleteButton onClick={onDelete} />
    </div>
  );
}

