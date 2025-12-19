//
//  VariableReplacer.swift
//  ClipTapKeyboard
//
//  【目的】
//  定型文の中にある変数（{{variable_name}}の形式）を実際の値に置き換える
//
//  【具体例】
//  "こんにちは、{{client_name}}様" → "こんにちは、田中様"
//  "本日は{{today}}です" → "本日は2025/11/17です"
//
//  【処理の流れ】
//  1. テキスト内の{{変数名}}を探す（正規表現で検索）
//  2. 見つかった変数名がシステム変数（today, nowなど）かチェック
//  3. システム変数でなければ、カスタム変数（ユーザーが登録した変数）かチェック
//  4. どちらかに該当すれば値に置き換え、該当しなければそのまま残す
//

import Foundation
import os.log

// ログ出力用の設定（デバッグやエラー追跡に使用）
let variableReplacerLog = OSLog(subsystem: "com.sikakou.cliptap.keyboard", category: "VariableReplacer")

// MARK: - System Variable（システム変数の定義）

/// システム変数の種類
/// これらは自動的に現在の日時情報に置き換わります
/// 例: {{today}} → 2025/11/17
enum SystemVariable: String, CaseIterable {
    case today = "today"      // 今日の日付（YYYY/MM/DD形式）
    case now = "now"          // 現在の日時（YYYY/MM/DD HH:mm:ss形式）
    case time = "time"        // 現在の時刻（HH:mm形式）
    case year = "year"        // 現在の年（YYYY形式）
    case month = "month"      // 現在の月（MM形式、01〜12）
    case day = "day"          // 現在の日（DD形式、01〜31）
    case weekday = "weekday"  // 現在の曜日（月、火、水...）

    /// システム変数を実際の値に変換する
    /// - Returns: 変換後の文字列（例: "2025/11/17"）
    func resolve() -> String {
        let now = Date()  // 現在日時を取得
        let calendar = Calendar.current  // カレンダー情報を取得
        let dateFormatter = DateFormatter()  // 日付フォーマット用

        // 【多言語対応】
        // デバイスの言語設定に応じて、日付フォーマットを自動調整
        // - 日本語: "月"、"火"、"水"...
        // - 英語: "Mon"、"Tue"、"Wed"...
        // Locale.currentを使用すると、iOSの設定に従って自動的に言語が切り替わります
        dateFormatter.locale = Locale.current

        // 変数の種類に応じて、適切な形式で日時を返す
        switch self {
        case .today:
            // 今日の日付を YYYY/MM/DD 形式で返す
            // 例: 2025/11/17
            dateFormatter.dateFormat = "yyyy/MM/dd"
            return dateFormatter.string(from: now)

        case .now:
            // 現在の日時を YYYY/MM/DD HH:mm:ss 形式で返す
            // 例: 2025/11/17 14:30:45
            dateFormatter.dateFormat = "yyyy/MM/dd HH:mm:ss"
            return dateFormatter.string(from: now)

        case .time:
            // 現在の時刻を HH:mm 形式で返す
            // 例: 14:30
            dateFormatter.dateFormat = "HH:mm"
            return dateFormatter.string(from: now)

        case .year:
            // 現在の年を返す
            // 例: 2025
            return String(calendar.component(.year, from: now))

        case .month:
            // 現在の月を2桁で返す（01〜12）
            // 例: 11
            return String(format: "%02d", calendar.component(.month, from: now))

        case .day:
            // 現在の日を2桁で返す（01〜31）
            // 例: 17
            return String(format: "%02d", calendar.component(.day, from: now))

        case .weekday:
            // 現在の曜日を言語に応じた短縮形で返す
            // 【多言語対応】
            // - 日本語: 月曜日 → "月"
            // - 英語: Monday → "Mon"
            dateFormatter.dateFormat = "E"
            let weekdayStr = dateFormatter.string(from: now)

            // 言語に応じて適切な長さを取得
            // 日本語の場合は1文字（「月」）、英語の場合は3文字（"Mon"）
            if dateFormatter.locale?.languageCode == "ja" {
                // 日本語: 最初の1文字だけ取得（「月曜日」→「月」）
                return String(weekdayStr.prefix(1))
            } else {
                // 英語など: そのまま返す（"Mon", "Tue", etc.）
                return weekdayStr
            }
        }
    }
}

// MARK: - Variable Replacer（変数置換処理のメインクラス）

/// 変数置換を実行するクラス
/// テキスト内の{{変数名}}を実際の値に置き換えます
class VariableReplacer {

    /// テキスト内の変数を値に置き換える
    ///
    /// - Parameters:
    ///   - text: 置換対象のテキスト（例: "こんにちは{{name}}様"）
    ///   - variablesMap: カスタム変数の辞書（例: ["name": "田中"]）
    /// - Returns: 変数が置換されたテキスト（例: "こんにちは田中様"）
    ///
    /// 【処理の流れ】
    /// 1. 正規表現で{{変数名}}のパターンを探す
    /// 2. 見つかった変数を後ろから順に処理（文字位置のズレを防ぐため）
    /// 3. 各変数について、システム変数→カスタム変数の順にチェック
    /// 4. 見つかれば値に置き換え、見つからなければそのまま残す
    func replace(in text: String, variablesMap: [String: String]) -> String {
        var result = text  // 結果用の文字列（これを書き換えていく）

        // {{変数名}}のパターンを探す正規表現
        // \{\{ → {{（波括弧2つ）
        // ([a-zA-Z_][a-zA-Z0-9_]*) → 変数名（英字またはアンダースコアで始まり、英数字とアンダースコアが続く）
        // \}\} → }}（波括弧2つ）
        let pattern = "\\{\\{([a-zA-Z_][a-zA-Z0-9_]*)\\}\\}"

        // 正規表現オブジェクトを作成
        guard let regex = try? NSRegularExpression(pattern: pattern, options: []) else {
            // 正規表現の作成に失敗した場合はエラーログを出力して元のテキストを返す
            os_log("⚠️ Failed to create regex", log: variableReplacerLog, type: .error)
            NSLog("⚠️ [VariableReplacer] Failed to create regex")
            return text
        }

        // テキスト内で{{変数名}}のパターンを全て見つける
        let matches = regex.matches(in: text, options: [], range: NSRange(text.startIndex..., in: text))
        os_log("📝 Found %d variable(s) in text", log: variableReplacerLog, type: .info, matches.count)
        NSLog("📝 [VariableReplacer] Found %d variable(s) in text", matches.count)

        // 見つかった変数を後ろから順に処理
        // 理由: 前から処理すると、置換後に文字位置がズレて後続の変数位置が狂うため
        for match in matches.reversed() {
            // 変数名の部分だけを取り出す（{{と}}を除いた中身）
            guard let range = Range(match.range(at: 1), in: text) else { continue }
            let variableName = String(text[range])
            os_log("📝 Processing variable: {{%@}}", log: variableReplacerLog, type: .info, variableName)
            NSLog("📝 [VariableReplacer] Processing variable: {{%@}}", variableName)

            // ステップ1: システム変数かどうかをチェック
            // システム変数の方が優先度が高い（今日の日付などは上書きできないようにするため）
            if let systemVar = SystemVariable(rawValue: variableName) {
                // システム変数として解決（today → 2025/11/17 など）
                let value = systemVar.resolve()
                os_log("  ✅ Resolved as system variable: %@", log: variableReplacerLog, type: .info, value)
                NSLog("  ✅ Resolved as system variable: %@", value)

                // {{変数名}}全体を値に置き換える
                if let fullRange = Range(match.range, in: result) {
                    result.replaceSubrange(fullRange, with: value)
                }
                continue  // 次の変数へ
            }

            // ステップ2: カスタム変数かどうかをチェック
            // ユーザーが登録した変数（例: {{client_name}} → "田中"）
            if let value = variablesMap[variableName] {
                os_log("  ✅ Resolved as custom variable: %@", log: variableReplacerLog, type: .info, value)
                NSLog("  ✅ Resolved as custom variable: %@", value)

                // {{変数名}}全体を値に置き換える
                if let fullRange = Range(match.range, in: result) {
                    result.replaceSubrange(fullRange, with: value)
                }
                continue  // 次の変数へ
            }

            // ステップ3: どちらの変数でもない場合
            // 変数が見つからないので、{{変数名}}のまま残す
            // （エラーにはせず、そのまま表示することで、ユーザーが気づけるようにする）
            os_log("  ⚠️ Variable not found, keeping as-is", log: variableReplacerLog, type: .default)
            NSLog("  ⚠️ Variable not found, keeping as-is")
        }

        return result  // 置換後のテキストを返す
    }

    /// テキストに変数が含まれているかどうかをチェック
    ///
    /// - Parameter text: チェック対象のテキスト
    /// - Returns: 変数が1つでも含まれていればtrue、なければfalse
    ///
    /// 【用途】
    /// 変数がない場合は置換処理をスキップするなど、パフォーマンス最適化に使用
    func hasVariables(in text: String) -> Bool {
        // 上記と同じパターンで変数を探す
        let pattern = "\\{\\{([a-zA-Z_][a-zA-Z0-9_]*)\\}\\}"
        guard let regex = try? NSRegularExpression(pattern: pattern, options: []) else {
            return false  // 正規表現が作れなければfalse
        }

        let range = NSRange(text.startIndex..., in: text)
        // 最初の1つでも見つかればtrueを返す（全部探す必要はない）
        return regex.firstMatch(in: text, options: [], range: range) != nil
    }
}
