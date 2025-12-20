/**
 * @module seed
 * @description
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
 * @see dummy.json - テストデータの定義ファイル
 * @see DatabaseManager - データベース初期化
 */

import {
  SnippetMapper,            // スニペット（定型文）データ操作
  CategoryMapper,           // カテゴリデータ操作
  VariableMapper,           // カスタム変数データ操作
  ProfileMapper,            // プロファイル（環境）データ操作
  ProfileVariableMapper,    // プロファイル別変数値データ操作
} from '@cliptap/shared';
import { Logger } from '@cliptap/shared';

/* ======================================== */
/* テストデータ定義 */
/* ======================================== */

/**
 * JSONファイルからテストデータをインポート
 * dummy.jsonには開発用のサンプルデータが定義されている
 * 注意: tsconfig.jsonでresolveJsonModule: trueが必要
 */
import dummyTemplates from '@root/dummy.json';

/**
 * カテゴリテストデータ
 * dummy.jsonのcategoriesをそのまま使用
 */
const TEST_CATEGORIES = dummyTemplates.categories;

/**
 * 定型文テストデータ
 * JSONからスニペット形式に変換
 */
/* JSONデータを内部形式に変換してテストスニペットを生成 */
const TEST_SNIPPETS = dummyTemplates.snippets.map(item => ({
  /* スニペットのタイトル（表示名） */
  title: item.title,
  /* スニペットの本文内容（JSONの'body'を'content'にマッピング） */
  content: item.body,
  /* 所属するカテゴリ名（後でIDに変換される） */
  categoryName: item.category,
  /* タイトルも一緒にコピーするかどうか（未定義時はfalse） */
  copyWithTitle: item.copyWithTitle ?? false,
}));

/**
 * プロファイルテストデータ
 * 取引先別のプロファイル定義
 */
const TEST_PROFILES = dummyTemplates.profiles;

/**
 * カスタム変数テストデータ
 * 変数メタデータと標準値、プロファイル別の値を含む
 */
const TEST_VARIABLES = dummyTemplates.custom_variables;

/* ======================================== */
/* ヘルパー関数 */
/* ======================================== */

/**
 * テストデータが既に存在するかチェック
 *
 * スニペットまたはカスタム変数が1件でも存在すれば
 * シード済みと判断する（冪等性の保証）
 *
 * @returns true: データ存在（シード不要）、false: データなし（シード実行）
 */
async function hasTestData(): Promise<boolean> {
  try {
    /* SnippetMapperを使って全スニペットを取得 */
    const snippets = SnippetMapper.getAll();
    /* VariableMapperを使ってカスタム変数のみを取得（type='custom'） */
    const variables = VariableMapper.getByType('custom');

    /* スニペットまたはカスタム変数が1件でも存在すればtrueを返す（シード不要） */
    /* どちらも0件の場合はfalseを返す（シード実行が必要） */
    return snippets.length > 0 || variables.length > 0;
  } catch (error) {
    /* データベース操作でエラーが発生した場合はログに記録 */
    Logger.error('[Seed] Failed to check existing data:', error);
    /* エラー時は安全のためfalseを返す（シードを試みる方が安全） */
    return false;
  }
}

/* ======================================== */
/* 個別シード関数 */
/* ======================================== */

/**
 * カテゴリをシード
 *
 * TEST_CATEGORIESの各カテゴリを作成し、
 * カテゴリ名→IDのマッピングを返す。
 * スニペット作成時にカテゴリを紐付けるために使用。
 *
 * @returns カテゴリ名とIDのMap
 */
async function seedCategories(): Promise<Map<string, string>> {
  /* カテゴリ名をキー、カテゴリIDを値とするMapを初期化 */
  /* スニペット作成時にカテゴリ名からIDを検索するために使用 */
  const categoryMap = new Map<string, string>();

  /* TEST_CATEGORIESの各カテゴリを順番に処理 */
  for (const categoryData of TEST_CATEGORIES) {
    try {
      /* CategoryMapperを使ってカテゴリを作成 */
      /* 名前と色を設定（IDとタイムスタンプは自動生成される） */
      const category = CategoryMapper.create({
        name: categoryData.name,      // カテゴリ名（例: "メール"）
        color: categoryData.color,    // カテゴリの色（例: "#FF5733"）
      });
      /* 作成したカテゴリの名前とIDをMapに追加 */
      categoryMap.set(categoryData.name, category.id);
      /* 作成完了ログを出力 */
      Logger.info(`[Seed] Created category: ${categoryData.name}`);
    } catch (error) {
      /* カテゴリ作成に失敗した場合はエラーログを出力（処理は継続） */
      Logger.error(`[Seed] Failed to create category ${categoryData.name}:`, error);
    }
  }

  /* カテゴリ名とIDのマッピングを返す */
  return categoryMap;
}

/**
 * 定型文（スニペット）をシード
 *
 * TEST_SNIPPETSの各スニペットを作成。
 * カテゴリ名からIDを解決して紐付け。
 * profileIdsを空配列にすることで全プロファイルに表示。
 *
 * @param categoryMap - カテゴリ名とIDのマッピング
 */
async function seedSnippets(categoryMap: Map<string, string>): Promise<void> {
  /* TEST_SNIPPETSの各スニペットを順番に処理 */
  for (const snippetData of TEST_SNIPPETS) {
    try {
      /* categoryMapからカテゴリ名に対応するIDを検索 */
      /* カテゴリが存在しない場合はundefinedになる */
      const categoryId = categoryMap.get(snippetData.categoryName);

      /* SnippetMapperを使ってスニペットを作成 */
      SnippetMapper.create({
        title: snippetData.title,                     // スニペットのタイトル
        content: snippetData.content,                 // スニペットの本文内容
        categoryId: categoryId || undefined,          // カテゴリID（なくてもOK）
        copyWithTitle: snippetData.copyWithTitle,     // タイトルも一緒にコピーするか
        profileIds: [],                               // 空配列 = 全プロファイルで表示
      });

      /* 作成完了ログを出力 */
      Logger.info(`[Seed] Created snippet: ${snippetData.title}`);
    } catch (error) {
      /* スニペット作成に失敗した場合はエラーログを出力（処理は継続） */
      Logger.error(`[Seed] Failed to create snippet ${snippetData.title}:`, error);
    }
  }
}

/**
 * プロファイル（環境）をシード
 *
 * TEST_PROFILESの各プロファイルを作成し、
 * プロファイル名→IDのマッピングを返す。
 * カスタム変数の値設定時にプロファイルを紐付けるために使用。
 *
 * @returns プロファイル名とIDのMap
 */
async function seedProfiles(): Promise<Map<string, string>> {
  /* プロファイル名をキー、プロファイルIDを値とするMapを初期化 */
  /* カスタム変数の値設定時にプロファイル名からIDを検索するために使用 */
  const profileMap = new Map<string, string>();

  /* TEST_PROFILESの各プロファイルを順番に処理 */
  for (const profileData of TEST_PROFILES) {
    try {
      /* ProfileMapperを使ってプロファイルを作成 */
      /* IDとタイムスタンプは自動生成される */
      const profile = ProfileMapper.create({
        name: profileData.name,    // プロファイル名（例: "取引先A"）
      });
      /* 作成したプロファイルの名前とIDをMapに追加 */
      profileMap.set(profileData.name, profile.id);
      /* 作成完了ログを出力（IDも表示） */
      Logger.info(`[Seed] Created profile: ${profileData.name} (${profile.id})`);
    } catch (error) {
      /* プロファイル作成に失敗した場合はエラーログを出力（処理は継続） */
      Logger.error(`[Seed] Failed to create profile ${profileData.name}:`, error);
    }
  }

  /* プロファイル名とIDのマッピングを返す */
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
  /* デフォルトプロファイル（Main）を取得 */
  /* 標準値はデフォルトプロファイルに格納される */
  const defaultProfile = ProfileMapper.getDefault();
  if (!defaultProfile) {
    /* デフォルトプロファイルが存在しない場合はエラーログを出力して終了 */
    Logger.error('[Seed] Default profile not found, cannot runSeed variables');
    return;
  }

  /* TEST_VARIABLESの各カスタム変数を順番に処理 */
  for (const variableData of TEST_VARIABLES) {
    try {
      /* VariableMapperを使って変数メタデータを作成 */
      /* 変数の値はprofile_variablesテーブルに別途格納される */
      const variable = VariableMapper.create({
        name: variableData.name,      // 変数名（例: "company_name"）
        label: variableData.label,    // 表示ラベル（例: "会社名"）
        icon: variableData.icon,      // アイコン名（例: "building"）
        type: 'custom',               // 変数タイプ（カスタム変数として作成）
      });

      /* 変数作成完了ログを出力 */
      Logger.info(`[Seed] Created variable: ${variableData.name}`);

      /* デフォルトプロファイルに標準値を設定 */
      /* profile_variablesテーブルに（デフォルトプロファイルID, 変数ID, 標準値）を挿入 */
      try {
        ProfileVariableMapper.upsert({
          profileId: defaultProfile.id,           // デフォルトプロファイルのID
          variableId: variable.id,                // 作成した変数のID
          value: variableData.standardValue,      // 標準値（全プロファイル共通のデフォルト値）
        });
        /* 標準値設定完了ログを出力（値は20文字まで表示） */
        Logger.info(`[Seed] Set standard value for ${variableData.name} = ${variableData.standardValue.substring(0, 20)}...`);
      } catch (error) {
        /* 標準値設定に失敗した場合はエラーログを出力（処理は継続） */
        Logger.error(`[Seed] Failed to set standard value for ${variableData.name}:`, error);
      }

      /* 各プロファイル固有の値を設定 */
      /* profileValuesが定義されている場合のみ処理 */
      if (variableData.profileValues) {
        /* Object.entries()でプロファイル名と値のペアを取得 */
        for (const [profileName, value] of Object.entries(variableData.profileValues)) {
          /* profileMapからプロファイル名に対応するIDを取得 */
          const profileId = profileMap.get(profileName);
          if (profileId) {
            try {
              /* profile_variablesテーブルに（プロファイルID, 変数ID, 値）を挿入/更新 */
              ProfileVariableMapper.upsert({
                profileId,              // プロファイルのID
                variableId: variable.id, // 変数のID
                value,                  // プロファイル固有の値
              });
              /* プロファイル別値設定完了ログを出力（値は20文字まで表示） */
              Logger.info(`[Seed] Set variable value for ${profileName}: ${variableData.name} = ${value.substring(0, 20)}...`);
            } catch (error) {
              /* プロファイル別値設定に失敗した場合はエラーログを出力（処理は継続） */
              Logger.error(`[Seed] Failed to set variable value for ${profileName}:`, error);
            }
          }
        }
      }
    } catch (error) {
      /* 変数作成に失敗した場合はエラーログを出力（処理は継続） */
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

    /* シード処理開始ログを出力 */
    Logger.info('[Seed] Checking for existing test data...');

    /* 開発モード（__DEV__）でない場合は本番環境なので何もせず終了 */
    /* テストデータは開発環境でのみ生成する */
    if (!__DEV__) {
      return;
    }

    /* 既存データの存在をチェック */
    const hasData = await hasTestData();
    if (hasData) {
      /* データが既に存在する場合はシードをスキップ（冪等性の保証） */
      Logger.info('[Seed] Test data already exists, skipping runSeed');
      return;
    }

    /* シード処理開始ログを出力 */
    Logger.info('[Seed] Starting to runSeed test data...');

    /* 1. カテゴリを作成し、カテゴリ名→IDのマッピングを取得 */
    const categoryMap = await seedCategories();

    /* 2. スニペットを作成（カテゴリマップを使ってカテゴリIDを解決） */
    await seedSnippets(categoryMap);

    /* 3. プロファイルを作成し、プロファイル名→IDのマッピングを取得 */
    const profileMap = await seedProfiles();

    /* 4. カスタム変数を作成し、各プロファイル別の値も設定 */
    await seedVariables(profileMap);

    /* シード処理完了ログを出力 */
    Logger.info('[Seed] Test data seeding completed successfully!');
  } catch (error) {
    /* シード処理でエラーが発生した場合はエラーログを出力 */
    Logger.error('[Seed] Failed to runSeed test data:', error);
  }
}
