import Foundation

/**
 * 入力の状態機械
 *
 * キー押下を入力欄への操作へ変換する。かな漢字変換を伴わない
 * 英数字入力の規則をここで完結させ、日本語変換はフェーズを分けて足す。
 *
 * Kotlin側にも同名・同意味の実装を置き、両OSで挙動を一致させる。
 * 表示の都合をここへ持ち込まないこと。ビューは状態を読むだけにする。
 */
public final class InputSession {

    /** シフトの状態 */
    public enum ShiftState: Equatable, Sendable {
        /** 通常。小文字を入力する */
        case off
        /** 1文字だけ大文字にする。入力後にoffへ戻る */
        case on
        /** 固定。明示的に解除するまで大文字を続ける */
        case locked
    }

    /** 入力先 */
    private let host: HostTextBridge

    /** 現在のキー配列 */
    public private(set) var layout: KeyLayout

    /** 現在のシフト状態 */
    public private(set) var shiftState: ShiftState = .off

    /** 状態が変わったときに呼ばれる。ビューの再描画に使う */
    public var onStateChanged: (() -> Void)?

    /** 他のキーボードへ切り替える要求。拡張側でOSのAPIを呼ぶ */
    public var onNextKeyboard: (() -> Void)?

    /** 定型文の一覧へ戻る要求 */
    public var onToggleSnippetList: (() -> Void)?

    /** 改行の要求。入力欄が確定動作を求める場合に拡張側で処理を分ける */
    public var onEnter: (() -> Void)?

    public init(host: HostTextBridge, layout: KeyLayout = KeyLayouts.qwerty) {
        self.host = host
        self.layout = layout
    }

    /** 大文字を入力する状態か */
    public var isShifted: Bool {
        shiftState != .off
    }

    /**
     * キーが押されたときの処理
     */
    public func handle(_ key: KeyDefinition) {
        switch key.resolvedAction(isShifted: isShifted) {
        case .input(let text):
            host.insert(text)
            /* 1文字だけの大文字指定は入力後に解除する。固定時は維持する */
            if shiftState == .on {
                shiftState = .off
            }
            notifyStateChanged()

        case .backspace:
            host.deleteBackward()
            notifyStateChanged()

        case .space:
            host.insert(" ")
            if shiftState == .on {
                shiftState = .off
            }
            notifyStateChanged()

        case .enter:
            if let onEnter {
                onEnter()
            } else {
                host.insert("\n")
            }
            if shiftState == .on {
                shiftState = .off
            }
            notifyStateChanged()

        case .shift:
            shiftState = nextShiftState()
            notifyStateChanged()

        case .switchLayout(let layoutId):
            layout = KeyLayouts.layout(for: layoutId)
            /* 配列を変えたらシフトは持ち越さない。記号面での大文字指定は意味を持たない */
            shiftState = .off
            notifyStateChanged()

        case .nextKeyboard:
            onNextKeyboard?()

        case .toggleSnippetList:
            onToggleSnippetList?()

        case .cursor(let offset):
            host.moveCursor(by: offset)
            notifyStateChanged()
        }
    }

    /**
     * シフトキーを押したときの遷移
     *
     * off → on → locked → off の順に巡回する。
     * 2回続けて押すと固定になるのはOS標準と同じ挙動。
     */
    private func nextShiftState() -> ShiftState {
        switch shiftState {
        case .off: return .on
        case .on: return .locked
        case .locked: return .off
        }
    }

    private func notifyStateChanged() {
        onStateChanged?()
    }
}
