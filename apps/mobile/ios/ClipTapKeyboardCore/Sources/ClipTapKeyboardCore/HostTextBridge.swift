import Foundation

/**
 * 入力先のテキスト欄への操作
 *
 * 拡張キーボードは `UITextDocumentProxy` を通じて入力欄を操作するが、
 * それに直接依存すると入力の規則をテストできなくなる。
 * 操作を最小限の語彙へ切り出し、実装を差し替えられるようにする。
 *
 * Kotlin側では `InputConnection` に対する同名のインターフェースを置く。
 */
public protocol HostTextBridge: AnyObject {

    /**
     * 文字を入力欄へ送る
     */
    func insert(_ text: String)

    /**
     * カーソル直前の1文字を削除する
     */
    func deleteBackward()

    /**
     * カーソルを移動する
     *
     * - Parameter offset: 正で後方、負で前方へ移動する文字数
     */
    func moveCursor(by offset: Int)

    /**
     * カーソル直前のテキスト
     *
     * シフトの自動制御など、文脈に応じた判断に使う。
     * 取得できない入力欄もあるため、nilを返し得る。
     */
    var textBeforeCursor: String? { get }
}

#if canImport(UIKit)

import UIKit

/**
 * 拡張キーボードの入力欄への橋渡し
 *
 * `UITextDocumentProxy` は毎回 `textDocumentProxy` から取り直す必要がある。
 * 保持すると入力欄が切り替わったときに古い参照へ書き込んでしまうため、
 * 取得のしかたを閉包で受け取る。
 */
public final class TextDocumentProxyBridge: HostTextBridge {

    private let proxyProvider: () -> UITextDocumentProxy?

    /** 最後に入力欄を操作した時刻。自分の操作起因のtextDidChangeを見分けるために使う */
    private var lastEditAt: Date?

    public init(proxyProvider: @escaping () -> UITextDocumentProxy?) {
        self.proxyProvider = proxyProvider
    }

    public func insert(_ text: String) {
        lastEditAt = Date()
        proxyProvider()?.insertText(text)
    }

    public func deleteBackward() {
        lastEditAt = Date()
        proxyProvider()?.deleteBackward()
    }

    public func moveCursor(by offset: Int) {
        lastEditAt = Date()
        proxyProvider()?.adjustTextPosition(byCharacterOffset: offset)
    }

    public var textBeforeCursor: String? {
        proxyProvider()?.documentContextBeforeInput
    }

    /**
     * 直近に自分が入力欄を操作したか
     *
     * `textDidChange`は自分の挿入・削除でも呼ばれるため、外部要因の
     * 文脈変化（別の入力欄への移動など）と区別するのに使う。
     * OSの通知は非同期に届くことがあるため、時刻で近さを判定する。
     */
    public func wasEditedRecently(within interval: TimeInterval = 1.0) -> Bool {
        guard let lastEditAt else {
            return false
        }
        return Date().timeIntervalSince(lastEditAt) < interval
    }
}

#endif

/**
 * テスト用に操作を記録するだけの実装
 *
 * 入力の規則が正しいかは「入力欄へ何を送ったか」で判定できるため、
 * 実際のテキスト欄を用意せずに検証できる。
 */
public final class RecordingTextBridge: HostTextBridge {

    /**
     * 入力欄へ送られた操作
     */
    public enum Operation: Equatable, Sendable {
        case insert(String)
        case deleteBackward
        case moveCursor(Int)
    }

    /** 送られた操作の履歴 */
    public private(set) var operations: [Operation] = []

    /** 操作を反映した結果のテキスト */
    public private(set) var text: String = ""

    public init(initialText: String = "") {
        text = initialText
    }

    public func insert(_ text: String) {
        operations.append(.insert(text))
        self.text += text
    }

    public func deleteBackward() {
        operations.append(.deleteBackward)
        if !text.isEmpty {
            text.removeLast()
        }
    }

    public func moveCursor(by offset: Int) {
        operations.append(.moveCursor(offset))
    }

    public var textBeforeCursor: String? {
        text
    }

    /** 履歴と内容を消す */
    public func reset() {
        operations = []
        text = ""
    }
}
