declare global {
  var snippetContentCallback: ((content: string) => void) | undefined;
  var snippetTitleCallback: ((title: string) => void) | undefined;
  var categorySelectCallback: ((categoryId: string | null) => void) | undefined;
  var profileSelectCallback: ((selectedIds: string[]) => void) | undefined;
  var variableValueCallbackData: {
    profileId: string;
    isStandard: boolean | string;
    newValue: string;
  } | undefined;
}

export {};
