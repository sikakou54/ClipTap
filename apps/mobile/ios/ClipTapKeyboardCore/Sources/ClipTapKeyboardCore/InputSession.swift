import Foundation

/**
 * 入力の状態機械
 *
 * キー押下を入力欄への操作へ変換する。英数字は直接入力し、
 * 日本語配列（12キーフリック）ではかなを変換エンジンへ積み、
 * 候補の選択・確定を経て入力欄へ送る。
 *
 * Kotlin側にも同名・同意味の実装を置き、両OSで挙動を一致させる。
 * 変換候補の並びはエンジン依存だが、操作体系と確定規則はここで揃える。
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

    /** エンジンの初期化状態 */
    private enum EngineAvailability {
        /** まだ試していない */
        case untried
        /** 初期化済みで使える */
        case ready
        /** 辞書が読めない等で使えない。直接入力へ縮退する */
        case unavailable
    }

    /** 入力先 */
    private let host: HostTextBridge

    /** 現在のキー配列 */
    public private(set) var layout: KeyLayout

    /** 現在のシフト状態 */
    public private(set) var shiftState: ShiftState = .off

    /**
     * かな漢字変換エンジン
     *
     * 未設定、または辞書が読めない場合は変換なしの直接入力へ縮退する。
     */
    public var engine: KanaKanjiEngine?

    /** エンジンの初期化状態。失敗を繰り返さないために覚えておく */
    private var engineAvailability: EngineAvailability = .untried

    /** 現在の未確定文字列と変換候補 */
    public private(set) var composition: EngineOutput = .empty

    /**
     * 空白キーで順に選ばれている候補の添字
     *
     * nilは未選択。選択中に改行キーを押すとその候補が確定される。
     */
    public private(set) var selectedCandidateIndex: Int?

    /** 状態が変わったときに呼ばれる。キー領域の再描画に使う */
    public var onStateChanged: (() -> Void)?

    /** 未確定文字列・候補・候補の選択が変わったときに呼ばれる。候補バーの再描画に使う */
    public var onCompositionChanged: (() -> Void)?

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

    /** 未確定文字列を保持しているか */
    public var isComposing: Bool {
        composition.isComposing
    }

    /** かな漢字変換の対象になる配列か */
    private var isJapaneseLayout: Bool {
        layout.id == .flick
    }

    /**
     * キーが押されたときの処理
     *
     * - Parameters:
     *   - key: 押されたキー
     *   - flickDirection: フリックの方向。タップならnil
     */
    public func handle(_ key: KeyDefinition, flickDirection: FlickDirection? = nil) {
        /*
         * フリックを持つキーは方向で動作が決まる。シフトは英字配列の概念であり、
         * かなの12キー配列とは併用しない。
         */
        let action = key.hasFlick
            ? key.resolvedAction(flickDirection: flickDirection)
            : key.resolvedAction(isShifted: isShifted)

        switch action {
        case .input(let text):
            insertText(text)
            consumeShift()
            notifyStateChanged()

        case .backspace:
            deleteBackward()
            notifyStateChanged()

        case .space:
            handleSpace()
            consumeShift()
            notifyStateChanged()

        case .enter:
            handleEnter()
            consumeShift()
            notifyStateChanged()

        case .shift:
            shiftState = nextShiftState()
            notifyStateChanged()

        case .switchLayout(let layoutId):
            /* 未確定文字列は配列をまたいで持ち越せない。捨てずに確定してから移る */
            commitCompositionAsIs()
            layout = KeyLayouts.layout(for: layoutId)
            /* 配列を変えたらシフトは持ち越さない。記号面での大文字指定は意味を持たない */
            shiftState = .off
            notifyStateChanged()

        case .nextKeyboard:
            commitCompositionAsIs()
            onNextKeyboard?()

        case .toggleSnippetList:
            commitCompositionAsIs()
            onToggleSnippetList?()

        case .cursor(let offset):
            commitCompositionAsIs()
            host.moveCursor(by: offset)
            notifyStateChanged()

        case .kanaVariant:
            applyKanaVariant()
            notifyStateChanged()
        }
    }

    /**
     * 候補バーで選ばれた候補を確定する
     *
     * 候補が読みの一部だけを消費した場合、残りは未確定のまま変換が続く。
     *
     * - Parameter index: 表示中の候補の添字
     */
    public func commitCandidate(at index: Int) {
        guard let engine = readyEngine(), composition.candidates.indices.contains(index) else {
            return
        }
        let result = engine.selectCandidate(id: composition.candidates[index].id)
        if !result.committedText.isEmpty {
            host.insert(result.committedText)
        }
        updateComposition(result.remaining)
    }

    /**
     * 未確定文字列を読みのまま確定する
     *
     * キーボードが閉じるときやモードを離れるときに、打ちかけの文字を
     * 取り残さないために拡張側からも呼ぶ。
     */
    public func commitCompositionAsIs() {
        guard isComposing, let engine = readyEngine() else {
            return
        }
        let result = engine.commitAsIs()
        if !result.committedText.isEmpty {
            host.insert(result.committedText)
        }
        updateComposition(result.remaining)
    }

    // MARK: - キーごとの規則

    /**
     * 文字の入力
     *
     * 日本語配列でエンジンが使えるときは、入力欄ではなく未確定文字列へ積む。
     * それ以外は直接入力する。
     */
    private func insertText(_ text: String) {
        guard isJapaneseLayout, let engine = readyEngine() else {
            host.insert(text)
            return
        }
        /* 候補を選んでいる最中の入力は、選択中の候補を確定してから続ける */
        if let index = selectedCandidateIndex {
            commitCandidate(at: index)
        }
        updateComposition(engine.insertKana(text))
    }

    /**
     * 削除
     *
     * 未確定文字列があればそちらを1文字消し、候補の選択は解いて読みへ戻す。
     * なければ入力欄の直前1文字を消す。
     */
    private func deleteBackward() {
        if isComposing, let engine = readyEngine() {
            updateComposition(engine.deleteBackward())
            return
        }
        host.deleteBackward()
    }

    /**
     * 空白キー
     *
     * 変換中は次の候補を順に選ぶ。末尾まで来たら先頭へ戻る。
     * 変換中でなければ空白を入力する。日本語配列ではOS標準に合わせて全角にする。
     */
    private func handleSpace() {
        if isComposing {
            guard !composition.candidates.isEmpty else {
                return
            }
            let next = ((selectedCandidateIndex ?? -1) + 1) % composition.candidates.count
            selectedCandidateIndex = next
            onCompositionChanged?()
            return
        }
        host.insert(isJapaneseLayout ? "\u{3000}" : " ")
    }

    /**
     * 改行キー
     *
     * 変換中は確定として振る舞う。候補を選んでいればその候補を、
     * 選んでいなければ読みのまま確定する。変換中でなければ改行する。
     */
    private func handleEnter() {
        if isComposing {
            if let index = selectedCandidateIndex {
                commitCandidate(at: index)
            } else {
                commitCompositionAsIs()
            }
            return
        }
        if let onEnter {
            onEnter()
        } else {
            host.insert("\n")
        }
    }

    /**
     * 直前のかなを濁点・半濁点・小文字へ巡回させる
     *
     * 未確定文字列があればその末尾を、なければ入力欄の直前の文字を変形する。
     * 変形を持たない文字の上では何もしない。誤って押しても
     * 入力内容が壊れないようにするため。
     */
    private func applyKanaVariant() {
        if isComposing, let engine = readyEngine() {
            guard
                let last = composition.reading.last,
                let variant = KanaVariants.next(after: last)
            else {
                return
            }
            engine.deleteBackward()
            updateComposition(engine.insertKana(String(variant)))
            return
        }

        guard
            let last = host.textBeforeCursor?.last,
            let variant = KanaVariants.next(after: last)
        else {
            return
        }
        host.deleteBackward()
        host.insert(String(variant))
    }

    // MARK: - 内部状態

    /**
     * 使える状態のエンジンを返す
     *
     * 初回は初期化を試み、失敗したら以後は試さない。打鍵のたびに
     * 失敗する初期化を繰り返さないため。
     */
    private func readyEngine() -> KanaKanjiEngine? {
        guard let engine else {
            return nil
        }
        switch engineAvailability {
        case .ready:
            return engine
        case .unavailable:
            return nil
        case .untried:
            if engine.load() {
                engineAvailability = .ready
                return engine
            }
            engineAvailability = .unavailable
            return nil
        }
    }

    /** 未確定文字列を差し替え、候補の選択を解いて通知する */
    private func updateComposition(_ output: EngineOutput) {
        composition = output
        selectedCandidateIndex = nil
        onCompositionChanged?()
    }

    /** 1文字だけの大文字指定は入力後に解除する。固定時は維持する */
    private func consumeShift() {
        if shiftState == .on {
            shiftState = .off
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
