/**
 * 共有型定義
 *
 * @remarks
 * - Mobile/Webで共有する型定義の中央エクスポート
 * - 型はカテゴリ別のファイルに分離
 *
 * @module types
 */

/* ==================== Snippet ==================== */
export {
  SnippetSortBySchema,
  SnippetSchema,
  CreateSnippetInputSchema,
  UpdateSnippetInputSchema,
  SnippetProfileSchema,
  type SnippetSortBy,
  type Snippet,
  type CreateSnippetInput,
  type UpdateSnippetInput,
  type SnippetProfile,
} from './snippet';

/* ==================== Category ==================== */
export {
  CategorySchema,
  CreateCategoryInputSchema,
  UpdateCategoryInputSchema,
  type Category,
  type CreateCategoryInput,
  type UpdateCategoryInput,
} from './category';

/* ==================== Profile ==================== */
export {
  ProfileSchema,
  CreateProfileInputSchema,
  UpdateProfileInputSchema,
  ProfileVariableSchema,
  CreateProfileVariableInputSchema,
  UpdateProfileVariableInputSchema,
  type Profile,
  type CreateProfileInput,
  type UpdateProfileInput,
  type ProfileVariable,
  type CreateProfileVariableInput,
  type UpdateProfileVariableInput,
} from './profile';

/* ==================== Variable ==================== */
export {
  VariableTypeSchema,
  VariableSchema,
  CreateVariableInputSchema,
  UpdateVariableInputSchema,
  type Variable,
  type CreateVariableInput,
  type UpdateVariableInput,
} from './variableSchema';

export {
  type UISystemVariableDefinition,
  type VariableOption,
  type VariableReplacement,
  UI_SYSTEM_VARIABLES,
} from './variable';

/* ==================== Export/Import ==================== */
export {
  ImportCandidateSnippetProfileSchema,
  ImportCandidateSnippetSchema,
  ImportCandidateProfileSchema,
  ImportCandidateVariableProfileValueSchema,
  ImportCandidateVariableSchema,
  ImportCandidateCategorySchema,
  ImportCandidatesSchema,
  ClipTapExportDataSchema,
  SelectionSnippetProfileSchema,
  SelectionSnippetDataSchema,
  SelectionProfileDataSchema,
  SelectionVariableProfileValueSchema,
  SelectionVariableDataSchema,
  SelectionCategoryDataSchema,
  SelectionCandidatesSchema,
  type ImportCandidateSnippetProfile,
  type ImportCandidateSnippet,
  type ImportCandidateProfile,
  type ImportCandidateVariableProfileValue,
  type ImportCandidateVariable,
  type ImportCandidateCategory,
  type ImportCandidates,
  type ClipTapExportData,
  type SelectionSnippetData,
  type SelectionProfileData,
  type SelectionVariableProfileValue,
  type SelectionVariableData,
  type SelectionCategoryData,
  type SelectionCandidates,
} from './export';

/* ==================== Subscription ==================== */
export type {
  SubscriptionInterval,
  SubscriptionPlan,
  SubscriptionStatus,
  PurchaseResult,
} from './Subscription';

/* ==================== Auth ==================== */
export type {
  SharedUser,
} from './Auth';

/* ==================== Alert ==================== */
export type {
  AlertType,
  BaseAlertOptions,
  ConfirmOptions,
} from './alert';
