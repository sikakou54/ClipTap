import dayjs from 'dayjs';
import 'dayjs/locale/ja';
import 'dayjs/locale/en';
import i18next from '../i18n/config';
import { RESERVED_VARIABLE_NAMES } from '../constants/variables';

// カスタム変数リゾルバの型定義
export type CustomVariableResolver = (name: string) => Promise<string | null>;

export class VariableParser {
  /**
   * テキスト内の変数を検出（内部使用のみ）
   */
  private static detectVariables(text: string): string[] {
    const pattern = /\{\{([a-zA-Z_]+)\}\}/g;
    const matches = text.matchAll(pattern);
    const variables: string[] = [];

    for (const match of matches) {
      const [, name] = match;
      if (!variables.includes(name)) {
        variables.push(name);
      }
    }

    return variables;
  }

  /**
   * 変数が含まれているかチェック
   */
  static hasVariables(text: string): boolean {
    const pattern = /\{\{([a-zA-Z_]+)\}\}/;
    return pattern.test(text);
  }

  /**
   * 変数を実際の値に置換
   * @param text 置換対象のテキスト
   * @param customResolver カスタム変数を解決する関数（オプション）
   */
  static async replaceVariables(
    text: string,
    customResolver?: CustomVariableResolver
  ): Promise<string> {
    let result = text;
    const variables = this.detectVariables(text);

    for (const variableName of variables) {
      const value = await this.resolveVariable(variableName, customResolver);
      const pattern = new RegExp(`\\{\\{${variableName}\\}\\}`, 'g');
      result = result.replace(pattern, value);
    }

    return result;
  }

  /**
   * 変数を解決して値を取得（システム変数 + カスタム変数）
   * @param name 変数名
   * @param customResolver カスタム変数を解決する関数（オプション）
   */
  private static async resolveVariable(
    name: string,
    customResolver?: CustomVariableResolver
  ): Promise<string> {
    // 現在の言語設定を取得
    const currentLanguage = i18next.language || 'en';
    const dayjsInstance = dayjs().locale(currentLanguage);

    // システム変数（日付・時刻系）
    switch (name) {
      case 'today':
        return dayjsInstance.format('YYYY/MM/DD');
      case 'now':
        return dayjsInstance.format('YYYY/MM/DD HH:mm:ss');
      case 'time':
        return dayjsInstance.format('HH:mm');
      case 'year':
        return dayjsInstance.format('YYYY');
      case 'month':
        return dayjsInstance.format('MM');
      case 'day':
        return dayjsInstance.format('DD');
      case 'weekday':
        // 日本語: 最初の1文字（月、火、水...）、英語: 短縮形（Mon, Tue...）
        const weekdayStr = dayjsInstance.format('ddd');
        return currentLanguage === 'ja' ? weekdayStr.charAt(0) : weekdayStr;
    }

    // カスタム変数を解決
    if (customResolver) {
      try {
        const customValue = await customResolver(name);
        if (customValue !== null) {
          return customValue;
        }
      } catch (error) {
        // カスタム変数の解決に失敗した場合は続行
      }
    }

    // 解決できない場合は元の変数をそのまま返す
    return `{{${name}}}`;
  }
}
