import {
  DEFAULT_SYSTEM_VARIABLE_FORMATS,
  SystemVariableFormatService,
  UI_SYSTEM_VARIABLES,
  formatByPattern,
  getSystemVariableFormatPresets,
  normalizeLocale,
  type SystemVariableKey,
  useTranslation,
} from '@cliptap/shared';
import { useBodyScrollLock } from '@hooks/useBodyScrollLock';
import { useEscapeClose } from '@hooks/useEscapeClose';

interface SystemVariableFormatModalProps {
  variableKey: SystemVariableKey | null;
  onClose: () => void;
  onChanged: () => void;
}

export function SystemVariableFormatModal({
  variableKey,
  onClose,
  onChanged,
}: SystemVariableFormatModalProps) {
  const { t } = useTranslation();
  useBodyScrollLock(variableKey !== null);
  useEscapeClose(variableKey !== null, onClose);

  if (!variableKey) return null;

  const locale = normalizeLocale(navigator.language);
  const current = SystemVariableFormatService.getAll()[variableKey]
    ?? DEFAULT_SYSTEM_VARIABLE_FORMATS[variableKey];
  const definition = UI_SYSTEM_VARIABLES.find((item) => item.name === variableKey);
  const presets = getSystemVariableFormatPresets(variableKey, locale);

  const handleSelect = (pattern: string) => {
    if (pattern === DEFAULT_SYSTEM_VARIABLE_FORMATS[variableKey]) {
      SystemVariableFormatService.delete(variableKey);
    } else {
      SystemVariableFormatService.upsert(variableKey, pattern);
    }
    onChanged();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 dark:bg-black/80"
      onClick={onClose}
    >
      {/* 書式プリセットモーダル */}
      <div
        className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white dark:bg-[#1A1A1A]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-[#2A2A2A]">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {definition ? t(definition.labelKey) : variableKey}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="min-h-11 min-w-11 rounded-lg text-gray-500 hover:bg-gray-100 dark:text-[#A0A0A0] dark:hover:bg-[#2A2A2A]"
            aria-label={t('common.close')}
          >
            ×
          </button>
        </div>
        <div className="overflow-y-auto">
          {presets.map((pattern, index) => (
            <button
              type="button"
              key={pattern}
              onClick={() => handleSelect(pattern)}
              className="flex min-h-20 w-full items-center gap-4 border-b border-gray-200 px-6 py-3 text-left hover:bg-gray-50 dark:border-[#2A2A2A] dark:hover:bg-[#242424]"
            >
              <span className="flex-1">
                <span className="block text-lg font-semibold text-gray-900 dark:text-white">
                  {formatByPattern(new Date(), pattern, locale)}
                  {index === 0 && (
                    <span className="ml-2 text-xs font-medium text-blue-600 dark:text-blue-400">
                      {t('variables.format_default')}
                    </span>
                  )}
                </span>
                <span className="block font-mono text-xs text-gray-500 dark:text-[#707070]">
                  {pattern}
                </span>
              </span>
              <span className="text-xl text-blue-600 dark:text-blue-400">
                {pattern === current ? '●' : '○'}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
