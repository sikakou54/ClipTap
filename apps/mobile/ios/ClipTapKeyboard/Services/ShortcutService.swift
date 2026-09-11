//
//  ShortcutService.swift
//  ClipTapKeyboard
//
//  【目的】
//  ショートカット（定型文とは別の「値の使い分け」）に関するビジネスロジックを担当するサービスクラス
//  3層アーキテクチャの中間層（ビジネスロジック層）を担当します
//
//  【役割】
//  - データ取得: Mapperからショートカットと値を取得
//  - 候補推測: 入力中の内容からショートカット・値の表示順を決める
//  - テキスト挿入: 選ばれた値をカーソル位置へ挿入
//  - 振動フィードバック: 挿入時にHaptic Feedback（触覚フィードバック）
//  - 使用回数の記録: フルアクセスが許可されているときだけ記録
//
//  【定型文（SnippetService）との違い】
//  ショートカットの値は保存された文字列をそのまま挿入します。
//  変数（{{today}}など）の展開は行いません。値は「電話番号」「メールアドレス」のような
//  実データそのものであり、置換対象を持たないためです。
//
//  【候補推測の規則について】
//  規則の正本は packages/shared/src/shortcuts/candidates.ts と
//  packages/shared/tests/shortcuts/candidates.test.ts です。
//  ここはその規則をSwiftへ写したものなので、規則を変えるときは必ず正本と揃えること。
//

import Foundation
import UIKit

/// ショートカットのビジネスロジックを管理するサービスクラス
/// シングルトンパターンで実装されており、キーボード拡張全体で1つのインスタンスを共有します
class ShortcutService {

    // MARK: - Singleton（シングルトンパターン）

    /// 共有インスタンス（キーボード拡張全体でこのインスタンスを使用）
    static let shared = ShortcutService()

    // MARK: - Dependencies（依存オブジェクト）

    /// ショートカットのデータアクセス層（データベース操作を担当）
    private let shortcutMapper = ShortcutMapper.shared

    /// App Group識別子
    private let appGroupIdentifier = "group.com.sikakou.cliptap"

    /// フルアクセス状態を共有するUserDefaultsキー
    private let fullAccessStateKey = "keyboardHasFullAccess"

    // MARK: - Constants（候補推測の定数：正本 candidates.ts と同じ値）

    /// 入力中の内容として参照する文字数（SHORTCUT_CONTEXT_LENGTH）
    ///
    /// カーソル直前のすべてを見ると、離れた位置に出た語で候補が動き続けて落ち着かない。
    /// 「電話番号は」程度の直前の手掛かりだけを見る。
    private static let contextLength = 40

    /// ショートカット名が入力中の内容に現れたときの一致度
    private static let scoreNameMatch = 2

    /// 値名が入力中の内容に現れたときの一致度
    private static let scoreValueNameMatch = 1

    /// 手掛かりが無いときの一致度
    private static let scoreNone = 0

    // MARK: - Initialization（初期化）

    /// プライベートイニシャライザ（外部からのインスタンス生成を禁止）
    private init() {}

    // MARK: - Computed Properties（計算プロパティ）

    /// 使用回数の記録が有効かどうか
    ///
    /// iOSのサンドボックス制約により、フルアクセスが許可されていない拡張は
    /// 共有コンテナへ書き込めないため、記録可否はフルアクセスの許可状態と一致する。
    /// KeyboardViewControllerがviewDidLoadで保存した値を参照する
    /// （UIInputViewControllerを継承しないため hasFullAccess を直接読めない）。
    ///
    /// 【SnippetServiceと同じ実装を重ねて持つ理由】
    /// SnippetService側は同名のprivateプロパティであり、外から参照できない。
    /// 判定を共有するために片方をinternalへ広げると、本来内部事情である
    /// フルアクセス状態の読み方が他クラスからも触れるようになってしまう。
    /// 判定はUserDefaultsのキー1つを読むだけで、変わるときは両方を同じ変更で直す。
    private var isUsageTrackingEnabled: Bool {
        guard let userDefaults = UserDefaults(suiteName: appGroupIdentifier) else {
            return false
        }
        return userDefaults.bool(forKey: fullAccessStateKey)
    }

    // MARK: - Read Operations（読み取り操作）

    /// 指定プロファイルのショートカットを値付きで取得（登録順）
    ///
    /// - Parameter profileId: 表示中の環境（プロファイル）のID
    /// - Returns: ショートカットの配列（sortOrder順、値もsortOrder順）
    ///
    /// 【プロファイルで絞り込む理由】
    /// ショートカットは1件のプロファイルに属します（DBスキーマV8で shortcuts.profileId を追加）。
    /// 「会社用」で使う値と「個人用」で使う値が混ざると選び間違えるため、
    /// キーボードは選択中の環境のショートカットだけを扱います。
    func getAll(profileId: String) -> [Shortcut] {
        return shortcutMapper.getAll(profileId: profileId)
    }

    // MARK: - Candidate Ranking（候補推測）

    /// ショートカット一覧を表示順に並べ替えて取得
    ///
    /// - Parameters:
    ///   - profileId: 表示中の環境（プロファイル）のID
    ///   - context: カーソル直前の入力内容
    /// - Returns: 表示順に並べ替えたショートカットの配列
    ///
    /// 【並びの決め方】
    /// 一致度の降順 → sortOrderの昇順 → 元の位置。
    /// どれも一致しない場合は登録順（通常順）のままになります。
    ///
    /// 【使用回数を使わない理由】
    /// 利用者が決めた登録順が入力内容と無関係に入れ替わると、
    /// 目で追う位置が毎回変わってしまうためです（正本 candidates.ts と同じ）。
    func rankedShortcuts(profileId: String, context: String) -> [Shortcut] {
        let shortcuts = getAll(profileId: profileId)
        let normalizedContext = Self.normalizeContext(context)

        /* 添字を持ったまま並べ替える。
           Swiftのsortedは安定ソートを保証しないため、同点の並びは元の位置で自分で決める */
        let scored: [(index: Int, shortcut: Shortcut, score: Int)] = shortcuts.enumerated().map { entry in
            return (
                index: entry.offset,
                shortcut: entry.element,
                score: Self.score(for: entry.element, in: normalizedContext)
            )
        }

        let sorted = scored.sorted { left, right in
            if left.score != right.score { return left.score > right.score }
            if left.shortcut.sortOrder != right.shortcut.sortOrder {
                return left.shortcut.sortOrder < right.shortcut.sortOrder
            }
            return left.index < right.index
        }

        return sorted.map { $0.shortcut }
    }

    /// ショートカット値の一覧を表示順に並べ替える
    ///
    /// - Parameters:
    ///   - values: 保存順（sortOrder順）の値一覧
    ///   - context: カーソル直前の入力内容
    /// - Returns: 表示順に並べ替えた値の配列
    ///
    /// 【並びの決め方】
    /// 値名が入力中の内容に現れたものを先頭 → 使用回数の降順 → sortOrderの昇順 → 元の位置。
    /// 使用回数がすべて0で手掛かりも無い場合は登録順（通常順）のままになります。
    func rankedValues(_ values: [ShortcutValue], context: String) -> [ShortcutValue] {
        let normalizedContext = Self.normalizeContext(context)

        /* ショートカット一覧と同じ理由で、添字を持ったまま並べ替える */
        let scored: [(index: Int, value: ShortcutValue, score: Int)] = values.enumerated().map { entry in
            return (
                index: entry.offset,
                value: entry.element,
                score: Self.contains(normalizedContext, term: entry.element.name)
                    ? Self.scoreValueNameMatch
                    : Self.scoreNone
            )
        }

        let sorted = scored.sorted { left, right in
            if left.score != right.score { return left.score > right.score }
            if left.value.useCount != right.value.useCount {
                return left.value.useCount > right.value.useCount
            }
            if left.value.sortOrder != right.value.sortOrder {
                return left.value.sortOrder < right.value.sortOrder
            }
            return left.index < right.index
        }

        return sorted.map { $0.value }
    }

    // MARK: - Insert Operations（挿入操作）

    /// ショートカット値をキーボードから挿入（振動フィードバック＋使用回数の記録）
    ///
    /// - Parameters:
    ///   - value: 挿入するショートカット値
    ///   - textDocumentProxy: iOSのテキスト入力API（カスタムキーボードが提供）
    ///
    /// 【処理の流れ】
    /// 1. 値をそのままカーソル位置へ挿入（値名は挿入しない）
    /// 2. 振動フィードバック（定型文の挿入と同じ軽い振動）
    /// 3. 使用回数の記録が有効なときだけ、使用回数と親の更新日時を更新
    ///
    /// 【変数置換をしない理由】
    /// ショートカットの値は電話番号やメールアドレスなどの実データそのもので、
    /// 定型文のように{{変数}}を含む前提がありません。保存された文字列をそのまま挿入します。
    func insertValue(_ value: ShortcutValue, into textDocumentProxy: UITextDocumentProxy) {
        /* キーボードから値を挿入（LINEやメモアプリなど、どのアプリの入力欄にも入力されます） */
        textDocumentProxy.insertText(value.value)

        /* 振動フィードバック（軽い「ブッ」という振動）
           定型文の挿入（SnippetService.insertSnippet）と同じ体験に揃える */
        let generator = UIImpactFeedbackGenerator(style: .light)
        generator.impactOccurred()

        /* 使用頻度追跡が有効な場合のみ、useCountをインクリメント */
        if isUsageTrackingEnabled {
            shortcutMapper.incrementUseCount(valueId: value.id, shortcutId: value.shortcutId)
            KeyboardLog.debug("📊 [ShortcutService] Incremented use count for value: %@", value.id)
        } else {
            KeyboardLog.debug("📊 [ShortcutService] Skipped use count increment (usage tracking disabled)")
        }
    }

    // MARK: - Helper Methods（候補推測の内部処理）

    /// 入力中の内容を突き合わせ用に正規化する
    ///
    /// - Parameter context: カーソル直前の入力内容
    /// - Returns: 末尾を切り出して小文字化した文字列
    ///
    /// 【英字を小文字化する理由】
    /// 英字は大小を区別せずに突き合わせるため。日本語はこの正規化の影響を受けません。
    private static func normalizeContext(_ context: String) -> String {
        return String(context.suffix(contextLength)).lowercased()
    }

    /// 入力中の内容にその語が含まれるか判定する
    ///
    /// - Parameters:
    ///   - normalizedContext: normalizeContextで正規化済みの入力内容
    ///   - term: 突き合わせる語（ショートカット名または値名）
    /// - Returns: 含まれる場合はtrue
    ///
    /// 【空文字を除く理由】
    /// 空文字はどんな文字列にも含まれると判定されてしまい、すべてが一致扱いになるため。
    private static func contains(_ normalizedContext: String, term: String) -> Bool {
        let trimmed = term.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
        if trimmed.isEmpty { return false }
        return normalizedContext.contains(trimmed)
    }

    /// ショートカットの一致度を求める
    ///
    /// - Parameters:
    ///   - shortcut: 対象のショートカット
    ///   - normalizedContext: 正規化済みの入力内容
    /// - Returns: 一致度（大きいほど上位）
    ///
    /// 【ショートカット名を強く見る理由】
    /// 「電話番号は」と入力中なら「電話番号」が最上位に来てほしいため、
    /// ショートカット名の一致を値名の一致より強く見ます。
    private static func score(for shortcut: Shortcut, in normalizedContext: String) -> Int {
        if Self.contains(normalizedContext, term: shortcut.name) { return scoreNameMatch }
        /* 配列のcontains(where:)と見分けやすいよう、こちらの判定はSelf付きで書く */
        if shortcut.values.contains(where: { Self.contains(normalizedContext, term: $0.name) }) {
            return scoreValueNameMatch
        }
        return scoreNone
    }
}
