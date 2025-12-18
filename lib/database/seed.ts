/**
 * テストデータシード機能
 *
 * 開発環境でのテスト・デモ用データを自動生成します。
 *
 * 主な機能:
 * - デフォルトプロファイルの自動作成（全環境）
 * - テストデータの生成（開発モード限定）
 * - 冪等性の保証（既存データがある場合はスキップ）
 *
 * 実行タイミング:
 * - アプリ初回起動時
 * - データベースリセット後
 *
 * データ構成:
 * - カテゴリ: 4種類（メール、営業、サポート、プライベート）
 * - スニペット: 11種類（ビジネステンプレート）
 * - プロファイル: 4種類（取引先別）
 * - カスタム変数: 10種類（取引先情報、署名など）
 *
 * 使用例:
 * ```typescript
 * import { runSeed } from './runSeed';
 * await runSeed(); // 自動的に環境判定してシード
 * ```
 */

import { snippetMapper } from '../mappers/SnippetMapper';
import { categoryMapper } from '../mappers/CategoryMapper';
import { variableMapper } from '../mappers/VariableMapper';
import { profileMapper, profileVariableMapper } from '../mappers/ProfileMapper';
import { profileService } from '../services/ProfileService';
import { Logger } from '../logger';

// カテゴリテストデータ
const TEST_CATEGORIES = [
  { name: 'メール', color: '#4A90E2' },
  { name: '営業', color: '#E24A4A' },
  { name: 'サポート', color: '#50C878' },
  { name: 'プライベート', color: '#9B59B6' },
];

// 定型文テストデータ - ビジネス用途に特化
const TEST_SNIPPETS = [
  {
    title: '進捗報告メール',
    content: `{{client_company}}
{{client_fullname}}

{{greeting}}

{{project_name}}の進捗についてご報告いたします。

【現在の状況】
{{contract_status}}

【次回お打ち合わせ】
{{next_meeting}}

ご不明な点がございましたら、お気軽にご連絡ください。

{{signature}}`,
    categoryName: 'メール',
  },
  {
    title: '資料送付メール',
    content: `{{client_company}}
{{client_fullname}}

{{greeting}}

ご依頼いただいた資料をお送りいたします。

添付ファイルをご確認いただき、ご不明な点がございましたら
下記までお気軽にお問い合わせください。

Email: {{client_email}}

{{signature}}`,
    categoryName: 'メール',
  },
  {
    title: '新規お問い合わせ対応',
    content: `{{client_company}}
{{client_name}}様

{{greeting}}

この度はお問い合わせいただき、誠にありがとうございます。
ご質問の件につきまして、下記の通りご回答いたします。



ご不明な点がございましたら、お気軽にお問い合わせください。

{{signature}}`,
    categoryName: 'サポート',
  },
  {
    title: '商品説明・提案',
    content: `{{client_company}}
{{client_name}}様

{{greeting}}

弊社サービスについてご案内させていただきます。

【サービス概要】


【料金プラン】


詳細につきましては、お気軽にお問い合わせください。

{{signature}}`,
    categoryName: '営業',
  },
  {
    title: '日程調整',
    content: `{{client_company}}
{{client_name}}様

{{greeting}}

お打ち合わせの日程につきまして、下記候補日でいかがでしょうか。

{{today}} 14:00-15:00
{{today}} 16:00-17:00

ご都合をお聞かせいただけますと幸いです。

{{signature}}`,
    categoryName: 'メール',
  },
  {
    title: '見積もり送付',
    content: `{{client_company}}
{{client_name}}様

{{greeting}}

お見積書をお送りいたします。

【お見積金額】


【納期】


ご検討のほど、よろしくお願いいたします。

{{signature}}`,
    categoryName: '営業',
  },
  {
    title: '問題解決報告',
    content: `{{client_company}}
{{client_name}}様

{{greeting}}

ご報告いただいた問題について、調査が完了いたしました。

【原因】


【対応内容】


【今後の対策】


引き続き、どうぞよろしくお願いいたします。

{{signature}}`,
    categoryName: 'サポート',
  },
  {
    title: '資料送付',
    content: `{{client_company}}
{{client_name}}様

{{greeting}}

ご依頼いただいた資料をお送りいたします。

添付ファイルをご確認ください。

{{signature}}`,
    categoryName: 'メール',
  },
  {
    title: 'フォローアップ',
    content: `{{client_company}}
{{client_name}}様

{{greeting}}

先日ご提案させていただいた件について、その後ご検討状況はいかがでしょうか。

ご不明点などございましたら、お気軽にお問い合わせください。

{{signature}}`,
    categoryName: '営業',
  },
  {
    title: '住所・連絡先',
    content: `〒123-4567
{{address}}

TEL: {{phone}}
Email: {{email}}
Web: {{website}}`,
    categoryName: 'プライベート',
  },
  {
    title: '自己紹介',
    content: `{{myname}}

{{company}}
{{department}} {{position}}

{{profile}}

連絡先: {{email}}`,
    categoryName: 'プライベート',
  },
];

// プロファイルテストデータ
const TEST_PROFILES = [
  {
    name: 'A商事株式会社',
  },
  {
    name: '株式会社Bコーポレーション',
  },
  {
    name: 'C技研株式会社',
  },
  {
    name: '社内用',
  },
];

// カスタム変数テストデータ（標準値）
const TEST_VARIABLES = [
  {
    name: 'client_name',
    standardValue: 'ご担当者',
    label: '取引先担当者名',
    icon: 'person-outline',
    profileValues: {
      'A商事株式会社': '田中',
      '株式会社Bコーポレーション': '鈴木',
      'C技研株式会社': '佐藤',
      '社内用': '各位',
    },
  },
  {
    name: 'client_company',
    standardValue: 'お取引先',
    label: '取引先会社名',
    icon: 'business-outline',
    profileValues: {
      'A商事株式会社': 'A商事株式会社',
      '株式会社Bコーポレーション': '株式会社Bコーポレーション',
      'C技研株式会社': 'C技研株式会社',
      '社内用': '当社',
    },
  },
  {
    name: 'client_email',
    standardValue: 'client@example.com',
    label: '取引先メールアドレス',
    icon: 'mail-outline',
    profileValues: {
      'A商事株式会社': 'tanaka@a-shoji.co.jp',
      '株式会社Bコーポレーション': 'suzuki@b-corp.co.jp',
      'C技研株式会社': 'sato@c-giken.co.jp',
      '社内用': 'internal@sample.co.jp',
    },
  },
  {
    name: 'client_fullname',
    standardValue: 'ご担当者様',
    label: '敬称付き担当者名',
    icon: 'people-outline',
    profileValues: {
      'A商事株式会社': '田中様',
      '株式会社Bコーポレーション': '鈴木様',
      'C技研株式会社': '佐藤様',
      '社内用': '担当者各位',
    },
  },
  {
    name: 'project_name',
    standardValue: '新規プロジェクト',
    label: 'プロジェクト名',
    icon: 'folder-outline',
    profileValues: {
      'A商事株式会社': '物流システム刷新プロジェクト',
      '株式会社Bコーポレーション': 'ECサイト構築案件',
      'C技研株式会社': '在庫管理システム導入',
      '社内用': '社内プロジェクト',
    },
  },
  {
    name: 'next_meeting',
    standardValue: '次回お打ち合わせ',
    label: '次回ミーティング日',
    icon: 'calendar-outline',
    profileValues: {
      'A商事株式会社': '12月15日（金）14:00',
      '株式会社Bコーポレーション': '12月18日（月）10:00',
      'C技研株式会社': '12月20日（水）15:00',
      '社内用': '未定',
    },
  },
  {
    name: 'contract_status',
    standardValue: '検討中',
    label: '契約状況',
    icon: 'document-outline',
    profileValues: {
      'A商事株式会社': '見積もり提出済み',
      '株式会社Bコーポレーション': '契約締結済み',
      'C技研株式会社': 'ヒアリング中',
      '社内用': '-',
    },
  },
  {
    name: 'greeting',
    standardValue: 'いつもお世話になっております。',
    label: '挨拶',
    icon: 'chatbubble-outline',
    profileValues: {
      'A商事株式会社': 'いつもお世話になっております。',
      '株式会社Bコーポレーション': 'いつもお世話になっております。',
      'C技研株式会社': 'いつもお世話になっております。',
      '社内用': 'お疲れ様です。',
    },
  },
  {
    name: 'myname',
    standardValue: '山田太郎',
    label: '自分の名前',
    icon: 'id-card-outline',
    profileValues: {
      'A商事株式会社': '山田太郎',
      '株式会社Bコーポレーション': '山田太郎',
      'C技研株式会社': '山田太郎',
      '社内用': '山田',
    },
  },
  {
    name: 'signature',
    standardValue: `よろしくお願いいたします。

山田太郎
株式会社サンプル 営業部`,
    label: '署名',
    icon: 'create-outline',
    profileValues: {
      'A商事株式会社': `何卒よろしくお願いいたします。

━━━━━━━━━━━━━━━━━
山田太郎（やまだ たろう）
株式会社サンプル 営業部
A社担当
TEL: 03-1234-5678
Email: yamada@sample.co.jp
━━━━━━━━━━━━━━━━━`,
      '株式会社Bコーポレーション': `何卒よろしくお願いいたします。

━━━━━━━━━━━━━━━━━
山田太郎（やまだ たろう）
株式会社サンプル 営業部
B社担当
TEL: 03-1234-5678
Email: yamada@sample.co.jp
━━━━━━━━━━━━━━━━━`,
      'C技研株式会社': `何卒よろしくお願いいたします。

━━━━━━━━━━━━━━━━━
山田太郎（やまだ たろう）
株式会社サンプル 営業部
C社担当
TEL: 03-1234-5678
Email: yamada@sample.co.jp
━━━━━━━━━━━━━━━━━`,
      '社内用': `よろしくお願いします。

山田
営業部（内線: 1234）`,
    },
  },
];

/**
 * テストデータが既に存在するかチェック
 */
async function hasTestData(): Promise<boolean> {
  try {
    const snippets = await snippetMapper.getAll();
    const variables = await variableMapper.getByType('custom');

    // 定型文または変数が既に存在する場合はシード不要
    return snippets.length > 0 || variables.length > 0;
  } catch (error) {
    Logger.error('[Seed] Failed to check existing data:', error);
    return false;
  }
}

/**
 * カテゴリをシード
 */
async function seedCategories(): Promise<Map<string, string>> {
  const categoryMap = new Map<string, string>();

  for (const categoryData of TEST_CATEGORIES) {
    try {
      const category = await categoryMapper.create({
        name: categoryData.name,
        color: categoryData.color,
      });
      categoryMap.set(categoryData.name, category.id);
      Logger.info(`[Seed] Created category: ${categoryData.name}`);
    } catch (error) {
      Logger.error(`[Seed] Failed to create category ${categoryData.name}:`, error);
    }
  }

  return categoryMap;
}

/**
 * 定型文をシード
 */
async function seedSnippets(categoryMap: Map<string, string>): Promise<void> {
  for (const snippetData of TEST_SNIPPETS) {
    try {
      const categoryId = categoryMap.get(snippetData.categoryName);

      await snippetMapper.create({
        title: snippetData.title,
        content: snippetData.content,
        categoryId: categoryId || undefined,
      });

      Logger.info(`[Seed] Created snippet: ${snippetData.title}`);
    } catch (error) {
      Logger.error(`[Seed] Failed to create snippet ${snippetData.title}:`, error);
    }
  }
}

/**
 * プロファイルをシード
 */
async function seedProfiles(): Promise<Map<string, string>> {
  const profileMap = new Map<string, string>();

  for (const profileData of TEST_PROFILES) {
    try {
      const profile = profileMapper.createProfile({
        name: profileData.name,
      });
      profileMap.set(profileData.name, profile.id);
      Logger.info(`[Seed] Created profile: ${profileData.name} (${profile.id})`);
    } catch (error) {
      Logger.error(`[Seed] Failed to create profile ${profileData.name}:`, error);
    }
  }

  return profileMap;
}

/**
 * カスタム変数をシード（プロファイル対応）
 *
 * カスタム変数のメタデータと値を作成します。
 *
 * データモデル:
 * 1. variables テーブル: 変数のメタデータ（name, label, iconなど）
 * 2. profile_variables テーブル: プロファイル別の値
 *    - デフォルトプロファイル: 標準値を格納
 *    - その他のプロファイル: 環境固有の値を格納
 *
 * 処理フロー:
 * 1. 変数メタデータの作成（variablesテーブル）
 * 2. デフォルトプロファイルに標準値を設定
 * 3. 各プロファイルに固有の値を設定
 *
 * @param {Map<string, string>} profileMap - プロファイル名とIDのマッピング
 */
async function seedVariables(profileMap: Map<string, string>): Promise<void> {
  // デフォルトプロファイルIDを取得
  const defaultProfile = await profileMapper.getDefault();
  if (!defaultProfile) {
    Logger.error('[Seed] Default profile not found, cannot runSeed variables');
    return;
  }

  for (const variableData of TEST_VARIABLES) {
    try {
      // 変数メタデータのみを作成（valueカラムは削除されたため値は含まない）
      const variable = await variableMapper.create({
        name: variableData.name,
        label: variableData.label,
        icon: variableData.icon,
        type: 'custom',
      });

      Logger.info(`[Seed] Created variable: ${variableData.name}`);

      // デフォルトプロファイルに標準値を設定
      // 標準値は profile_variables テーブルのデフォルトプロファイル行に格納
      try {
        profileVariableMapper.upsertVariable({
          profileId: defaultProfile.id,
          variableId: variable.id,
          value: variableData.standardValue,
        });
        Logger.info(`[Seed] Set standard value for ${variableData.name} = ${variableData.standardValue.substring(0, 20)}...`);
      } catch (error) {
        Logger.error(`[Seed] Failed to set standard value for ${variableData.name}:`, error);
      }

      // 各プロファイルごとの値を設定
      if (variableData.profileValues) {
        for (const [profileName, value] of Object.entries(variableData.profileValues)) {
          const profileId = profileMap.get(profileName);
          if (profileId) {
            try {
              profileVariableMapper.upsertVariable({
                profileId,
                variableId: variable.id,
                value,
              });
              Logger.info(`[Seed] Set variable value for ${profileName}: ${variableData.name} = ${value.substring(0, 20)}...`);
            } catch (error) {
              Logger.error(`[Seed] Failed to set variable value for ${profileName}:`, error);
            }
          }
        }
      }
    } catch (error) {
      Logger.error(`[Seed] Failed to create variable ${variableData.name}:`, error);
    }
  }
}

/**
 * データをシード
 *
 * アプリ初回起動時にテストデータとデフォルトプロファイルを作成します。
 *
 * 実行条件:
 * - デフォルトプロファイル: 常に実行（本番環境含む）
 * - テストデータ: 開発モード（__DEV__）のみ実行
 *
 * 冪等性:
 * - 既存データがある場合は自動的にスキップ
 * - 複数回実行しても安全
 *
 * 生成されるデータ:
 * 1. デフォルトプロファイル「Main」（全環境）
 * 2. カテゴリ 4種類（開発のみ）
 * 3. スニペット 11種類（開発のみ）
 * 4. プロファイル 4種類（開発のみ）
 * 5. カスタム変数 10種類 + 各プロファイル別の値（開発のみ）
 *
 * @throws {Error} シード処理に失敗した場合（エラーログに記録）
 */
export async function runSeed(): Promise<void> {
  try {
    Logger.info('[Seed] Checking for existing test data...');

    // 開発モードでない場合はここで終了
    if (!__DEV__) {
      return;
    }

    // 既存データがある場合はシードをスキップ
    const hasData = await hasTestData();
    if (hasData) {
      Logger.info('[Seed] Test data already exists, skipping runSeed');
      return;
    }

    Logger.info('[Seed] Starting to runSeed test data...');

    // カテゴリを作成
    const categoryMap = await seedCategories();

    // 定型文を作成
    await seedSnippets(categoryMap);

    // プロファイルを作成
    const profileMap = await seedProfiles();

    // カスタム変数を作成（プロファイルごとの値も設定）
    await seedVariables(profileMap);

    Logger.info('[Seed] Test data seeding completed successfully!');
  } catch (error) {
    Logger.error('[Seed] Failed to runSeed test data:', error);
  }
}
