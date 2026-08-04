//
//  SnippetService.swift
//  ClipTapKeyboard
//
//  【目的】
//  スニペット（定型文）に関するビジネスロジックを管理するサービスクラス
//  3層アーキテクチャの中間層（ビジネスロジック層）を担当します
//
//  【役割】
//  - データ取得: Mapperからスニペットデータを取得
//  - 変数置換: {{today}}などの変数を実際の値に置き換え
//  - テキスト挿入: キーボードからテキスト入力欄に挿入
//  - 振動フィードバック: 挿入時にHaptic Feedback（触覚フィードバック）
//
//  【3層アーキテクチャ】
//  UI層（ViewController） → ビジネスロジック層（Service：このファイル） → データアクセス層（Mapper）
//
//  【対応するTypeScriptファイル】
//  lib/services/SnippetService.ts と機能的に同等
//  ただし、キーボード拡張は読み取り専用のため、作成・編集・削除機能は未実装
//

import Foundation
import UIKit
import os.log

// ログ出力用の設定（デバッグやエラー追跡に使用）
let snippetServiceLog = OSLog.disabled

/// スニペットのビジネスロジックを管理するサービスクラス
/// シングルトンパターンで実装されており、アプリ全体で1つのインスタンスを共有します
class SnippetService {

    // MARK: - Singleton（シングルトンパターン）

    /// 共有インスタンス（アプリ全体でこのインスタンスを使用）
    /// 使用例: SnippetService.shared.getAll()
    static let shared = SnippetService()

    // MARK: - Dependencies（依存オブジェクト）

    /// スニペットのデータアクセス層（データベース操作を担当）
    private let snippetMapper = SnippetMapper.shared

    /// プロファイル（環境）の管理サービス
    /// アクティブなプロファイルを取得するために使用
    private let profileService = ProfileService.shared

    /// 変数の管理サービス
    /// プロファイルに紐づく変数マップを取得するために使用
    private let variableService = VariableService.shared

    /// 変数置換を実行するクラス
    /// {{today}} → 2025/11/17 などの変換を担当
    private let variableReplacer = VariableReplacer()

    /// App Group識別子
    private let appGroupIdentifier = "group.com.sikakou.cliptap"

    /// フルアクセス状態を共有するUserDefaultsキー
    private let fullAccessStateKey = "keyboardHasFullAccess"

    /// 使用頻度追跡設定のUserDefaultsキー
    private let usageTrackingKey = "usageTrackingEnabled"

    /// 使用頻度追跡設定が設定されたかどうかのUserDefaultsキー
    private let usageTrackingEnabledSetKey = "usageTrackingEnabledSet"

    // MARK: - Initialization（初期化）

    /// プライベートイニシャライザ（外部からのインスタンス生成を禁止）
    /// シングルトンパターンのため、SnippetService.sharedのみ使用可能
    private init() {}

    // MARK: - Computed Properties（計算プロパティ）

    /// 使用頻度追跡が有効かどうか
    /// フルアクセス許可かつ使用頻度追跡設定がONの場合にtrue
    private var isUsageTrackingEnabled: Bool {
        guard let userDefaults = UserDefaults(suiteName: appGroupIdentifier) else {
            return false
        }
        /* フルアクセスがない場合はfalse */
        let hasFullAccess = userDefaults.bool(forKey: fullAccessStateKey)
        if !hasFullAccess {
            return false
        }
        /* 設定されていない場合はデフォルトtrue */
        let usageEnabledSet = userDefaults.bool(forKey: usageTrackingEnabledSetKey)
        if !usageEnabledSet {
            return true
        }
        return userDefaults.bool(forKey: usageTrackingKey)
    }

    // MARK: - Read Operations（読み取り操作）

    /// 全スニペットを取得（アクティブプロファイルでフィルタ）
    ///
    /// - Returns: スニペットの配列（アクティブなプロファイル専用のスニペットのみ）
    ///
    /// 【動作】
    /// 1. アクティブなプロファイル（環境）を取得
    /// 2. そのプロファイルに紐づくスニペットのみをデータベースから取得
    /// 3. アクティブなプロファイルがない場合は、全スニペットを返す
    ///
    /// 【プロファイルフィルタとは】
    /// 例えば「会社用」プロファイルがアクティブな場合、
    /// 会社用のスニペットのみが返されます
    func getAll() -> [Snippet] {
        guard let activeProfile = profileService.getActiveProfile() else {
            // アクティブなプロファイルがない場合は全スニペットを返す
            return snippetMapper.getAll(filterByProfileId: nil)
        }
        // アクティブなプロファイルのスニペットのみを返す
        return snippetMapper.getAll(filterByProfileId: activeProfile.id)
    }

    /// ID指定でスニペットを取得
    ///
    /// - Parameter id: スニペットのID
    /// - Returns: 指定されたIDのスニペット（存在しない場合はnil）
    ///
    /// 【用途】
    /// 特定のスニペットの詳細を表示したいときなどに使用
    func getById(_ id: String) -> Snippet? {
        return snippetMapper.getById(id)
    }

    /// カテゴリ別にスニペットを取得（アクティブプロファイルでフィルタ）
    ///
    /// - Parameter categoryId: カテゴリのID
    /// - Returns: 指定されたカテゴリのスニペット配列
    ///
    /// 【フィルタリングの仕組み】
    /// 1. アクティブなプロファイルを取得
    /// 2. プロファイル + カテゴリの両方でフィルタリング
    ///
    /// 【例】
    /// - アクティブプロファイル: 会社用
    /// - 指定カテゴリ: 仕事
    /// → 「会社用」かつ「仕事」カテゴリのスニペットのみ取得
    func getByCategoryId(_ categoryId: String) -> [Snippet] {
        guard let activeProfile = profileService.getActiveProfile() else {
            // アクティブなプロファイルがない場合
            return snippetMapper.getByCategoryId(categoryId, filterByProfileId: nil)
        }
        // プロファイル + カテゴリでフィルタ
        return snippetMapper.getByCategoryId(categoryId, filterByProfileId: activeProfile.id)
    }

    // MARK: - Insert Operations（挿入操作）

    /// スニペットをキーボードに挿入（変数置換＋振動フィードバック）
    ///
    /// - Parameters:
    ///   - snippet: 挿入するスニペット
    ///   - textDocumentProxy: iOSのテキスト入力API（カスタムキーボードが提供）
    ///   - profileId: プロファイルID（省略時はアクティブなプロファイルを使用）
    ///
    /// 【処理の流れ】
    /// 1. プロファイルIDを決定（引数で指定 > アクティブプロファイル）
    /// 2. プロファイルに紐づく変数マップを取得（例: client_name → 田中）
    /// 3. copyWithTitleフラグをチェック → タイトルも含めるか判定
    /// 4. 変数を実際の値に置換（{{today}} → 2025/11/17 など）
    /// 5. textDocumentProxyでテキストを挿入（LINEやメモアプリなどの入力欄に入力）
    /// 6. 振動フィードバック（Haptic Feedback）を実行
    ///
    /// 【textDocumentProxyとは】
    /// iOSが提供するAPI。カスタムキーボードから、現在フォーカスされている
    /// テキストフィールドにテキストを挿入できます。
    /// 例: LINEのメッセージ入力欄、メモアプリなど、どのアプリでも動作します
    ///
    /// 【振動フィードバックの役割】
    /// テキストが挿入されたことをユーザーに触覚でフィードバック
    /// 「ブッ」という軽い振動で、操作が成功したことを伝えます
    func insertSnippet(
        _ snippet: Snippet,
        into textDocumentProxy: UITextDocumentProxy,
        profileId: String? = nil
    ) {
        // プロファイルIDを決定（引数で指定されていれば優先、なければアクティブプロファイル）
        let resolvedProfileId: String?
        if let profileId = profileId {
            resolvedProfileId = profileId
        } else {
            resolvedProfileId = profileService.getActiveProfile()?.id
        }

        os_log("📝 Profile ID: %@", log: snippetServiceLog, type: .info, resolvedProfileId ?? "nil")
        KeyboardLog.debug("📝 [SnippetService] Profile ID: %@", resolvedProfileId ?? "nil")

        // 変数マップを取得（プロファイルに紐づくカスタム変数）
        var variablesMap: [String: String] = [:]
        if let profileId = resolvedProfileId {
            variablesMap = variableService.getVariablesMap(for: profileId)
            os_log("📝 Variables map count: %d", log: snippetServiceLog, type: .info, variablesMap.count)
        }

        // テキストを準備
        // copyWithTitleフラグがtrueなら、タイトル + 改行 + 内容
        var text = snippet.content
        if snippet.copyWithTitle, let title = snippet.title, !title.isEmpty {
            text = "\(title)\n\(text)"
        }


        // 変数を置換
        // 例: "こんにちは{{client_name}}様" → "こんにちは田中様"
        let resolvedText = variableReplacer.replace(
            in: text,
            variablesMap: variablesMap,
            formats: SystemVariableFormatMapper.shared.getAll()
        )


        /* キーボードからテキストを挿入
           この処理により、LINEやメモアプリなど、どのアプリの入力欄にもテキストが入力されます */
        textDocumentProxy.insertText(resolvedText)

        /* 振動フィードバック（軽い「ブッ」という振動）
           ユーザーに「テキストが挿入されました」と触覚でフィードバック */
        let generator = UIImpactFeedbackGenerator(style: .light)
        generator.impactOccurred()

        /* 使用頻度追跡が有効な場合のみ、copyCountをインクリメント */
        if isUsageTrackingEnabled {
            snippetMapper.incrementCopyCount(for: snippet.id)
            KeyboardLog.debug("📊 [SnippetService] Incremented copy count for snippet: %@", snippet.id)
        } else {
            KeyboardLog.debug("📊 [SnippetService] Skipped copy count increment (usage tracking disabled)")
        }
    }

    /// プレビュー生成（変数置換後のテキスト）
    ///
    /// - Parameters:
    ///   - snippet: プレビューを生成するスニペット
    ///   - profileId: プロファイルID（省略時はアクティブなプロファイルを使用）
    /// - Returns: 変数置換後のテキスト
    ///
    /// 【用途】
    /// スニペットの詳細画面で、実際に挿入される内容をプレビュー表示するために使用
    /// 変数が実際の値に置き換わった状態で表示されます
    ///
    /// 【insertSnippetとの違い】
    /// - insertSnippet: テキストを実際に挿入 + 振動フィードバック
    /// - getPreview: テキストを返すだけ（挿入も振動もしない）
    ///
    /// 【処理の流れ】
    /// 1. プロファイルIDを決定
    /// 2. 変数マップを取得
    /// 3. copyWithTitleフラグをチェック
    /// 4. 変数を置換
    /// 5. 置換後のテキストを返す
    func getPreview(for snippet: Snippet, profileId: String? = nil) -> String {
        // プロファイルIDを決定
        let resolvedProfileId: String?
        if let profileId = profileId {
            resolvedProfileId = profileId
        } else {
            resolvedProfileId = profileService.getActiveProfile()?.id
        }

        // 変数マップを取得
        var variablesMap: [String: String] = [:]
        if let profileId = resolvedProfileId {
            variablesMap = variableService.getVariablesMap(for: profileId)
        }

        // テキストを準備
        var text = snippet.content
        if snippet.copyWithTitle, let title = snippet.title, !title.isEmpty {
            text = "\(title)\n\(text)"
        }

        // 変数を置換して返す
        return variableReplacer.replace(
            in: text,
            variablesMap: variablesMap,
            formats: SystemVariableFormatMapper.shared.getAll()
        )
    }

    // MARK: - Helper Methods（ヘルパーメソッド）

    /// コンテンツからタイトルを生成（最初の行または最初の50文字）
    ///
    /// - Parameter content: スニペットの内容
    /// - Returns: 生成されたタイトル
    ///
    /// 【用途】
    /// ユーザーがタイトルを入力しなかった場合、自動的にタイトルを生成するために使用
    ///
    /// 【生成ルール】
    /// 1. 内容に改行がある場合 → 最初の行を使用（最大50文字）
    /// 2. 改行がない場合 → 内容の最初の50文字を使用
    ///
    /// 【例】
    /// 内容: "こんにちは\nお世話になっております" → タイトル: "こんにちは"
    /// 内容: "長いテキスト..." → タイトル: "長いテキスト...（最初の50文字）"
    private func generateTitleFromContent(_ content: String) -> String {
        let lines = content.components(separatedBy: .newlines)
        if let firstLine = lines.first, !firstLine.isEmpty {
            // 最初の行が空でなければ、それをタイトルにする（最大50文字）
            return String(firstLine.prefix(50))
        }
        // 改行がない、または最初の行が空の場合は、内容の最初の50文字を使用
        return String(content.prefix(50))
    }
}
