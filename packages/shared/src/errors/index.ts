/**
 * @module errors
 * @description ClipTapアプリ共通のカスタム例外クラス
 *
 * 例外階層:
 * ```
 * Error
 * └── ClipTapError (基底クラス)
 *     ├── DatabaseError (データベース関連)
 *     ├── ValidationError (バリデーション関連)
 *     │   ├── EmptyContentError
 *     │   ├── DuplicateNameError
 *     │   └── Variable*Error
 *     ├── NotFoundError (リソース未検出)
 *     ├── AuthenticationError (認証関連)
 *     ├── PurchaseError (課金関連)
 *     ├── ImportExportError (インポート/エクスポート関連)
 *     │   ├── IncorrectPasswordError
 *     │   ├── ChecksumMismatchError
 *     │   ├── VersionMismatchError
 *     │   └── NewerVersionError
 *     └── EnvironmentError (実行環境関連)
 * ```
 */

/* ======================================== */
/* 基底クラス */
/* ======================================== */
export { ClipTapError, type ErrorSeverity } from './base';

/* ======================================== */
/* データベース関連 */
/* ======================================== */
export { DatabaseError } from './database';

/* ======================================== */
/* バリデーション関連 */
/* ======================================== */
export {
  ValidationError,
  EmptyContentError,
  DuplicateNameError,
  NotFoundError,
  SystemVariableDeleteError,
  DefaultProfileDeleteError,
  VariableNameRequiredError,
  VariableNameTooLongError,
  VariableNameInvalidError,
  VariableNameReservedError,
  VariableValueRequiredError,
  InvalidRgbValueError,
} from './validation';

/* ======================================== */
/* インポート/エクスポート関連 */
/* ======================================== */
export {
  ImportExportError,
  IncorrectPasswordError,
  ChecksumMismatchError,
  VersionMismatchError,
  NewerVersionError,
  FileReadError,
  InvalidFileTypeError,
  InvalidFileFormatError,
  PasswordRequiredError,
  ExportFailedError,
  FileWriteError,
  TempDbPathRequiredError,
  NoSelectionError,
  PartialImportError,
  DatabasePathNotFoundError,
} from './importExport';

/* ======================================== */
/* 認証・課金関連 */
/* ======================================== */
export { AuthenticationError, PurchaseError } from './auth';

/* ======================================== */
/* その他 */
/* ======================================== */
export {
  EnvironmentError,
} from './misc';
