import Testing
@testable import ClipTapKeyboardCore

/**
 * 入力の規則に対する検証
 *
 * 入力欄へ何を送ったかで判定するため、実際のテキスト欄を用意せずに検証できる。
 * ここで固定した規則は、Kotlin側の実装でも同じ結果になること。
 */
struct InputSessionTests {

    /** レイアウトからキーを引く */
    private func key(_ id: String, in layout: KeyLayout) -> KeyDefinition {
        let found = layout.rows.flatMap(\.keys).first { $0.id == id }
        #expect(found != nil, "キーが見つからない: \(id)")
        return found!
    }

    private func makeSession() -> (InputSession, RecordingTextBridge) {
        let host = RecordingTextBridge()
        return (InputSession(host: host), host)
    }

    @Test("文字キーで入力欄へ文字が送られる")
    func insertsCharacters() {
        let (session, host) = makeSession()
        for id in ["key_h", "key_i"] {
            session.handle(key(id, in: session.layout))
        }
        #expect(host.text == "hi")
    }

    @Test("シフトは1文字だけ大文字にして解除される")
    func shiftAppliesToSingleCharacter() {
        let (session, host) = makeSession()

        session.handle(key("shift", in: session.layout))
        #expect(session.shiftState == .on)

        session.handle(key("key_a", in: session.layout))
        #expect(host.text == "A")
        #expect(session.shiftState == .off, "1文字入力したらシフトは解除される")

        session.handle(key("key_b", in: session.layout))
        #expect(host.text == "Ab")
    }

    @Test("シフトを2回押すと固定され、大文字が続く")
    func shiftLocks() {
        let (session, host) = makeSession()

        session.handle(key("shift", in: session.layout))
        session.handle(key("shift", in: session.layout))
        #expect(session.shiftState == .locked)

        for id in ["key_a", "key_b", "key_c"] {
            session.handle(key(id, in: session.layout))
        }
        #expect(host.text == "ABC")
        #expect(session.shiftState == .locked, "固定は入力しても解除されない")

        session.handle(key("shift", in: session.layout))
        #expect(session.shiftState == .off, "3回目で解除される")
    }

    @Test("削除キーで直前の1文字が消える")
    func deletesBackward() {
        let (session, host) = makeSession()
        session.handle(key("key_a", in: session.layout))
        session.handle(key("key_b", in: session.layout))
        session.handle(key("backspace", in: session.layout))
        #expect(host.text == "a")
    }

    @Test("空文字の状態で削除しても壊れない")
    func deleteOnEmptyIsSafe() {
        let (session, host) = makeSession()
        session.handle(key("backspace", in: session.layout))
        #expect(host.text.isEmpty)
    }

    @Test("空白キーで空白が入る")
    func insertsSpace() {
        let (session, host) = makeSession()
        session.handle(key("key_a", in: session.layout))
        session.handle(key("space", in: session.layout))
        session.handle(key("key_b", in: session.layout))
        #expect(host.text == "a b")
    }

    @Test("改行の扱いを外へ委ねられる")
    func enterCanBeDelegated() {
        let (session, host) = makeSession()

        /* 既定では改行を入力する */
        session.handle(key("enter", in: session.layout))
        #expect(host.text == "\n")

        /* 入力欄が確定動作を求める場合に備え、差し替えられること */
        var delegated = false
        session.onEnter = { delegated = true }
        session.handle(key("enter", in: session.layout))
        #expect(delegated)
        #expect(host.text == "\n", "委譲時は改行を入れない")
    }

    @Test("配列を切り替えるとシフトは持ち越さない")
    func switchingLayoutClearsShift() {
        let (session, _) = makeSession()

        session.handle(key("shift", in: session.layout))
        #expect(session.shiftState == .on)

        session.handle(key("switch_numbers", in: session.layout))
        #expect(session.layout.id == .numbers)
        #expect(session.shiftState == .off)
    }

    @Test("数字面と記号面を行き来できる")
    func switchesBetweenNumbersAndSymbols() {
        let (session, host) = makeSession()

        session.handle(key("switch_numbers", in: session.layout))
        session.handle(key("key_1", in: session.layout))
        #expect(host.text == "1")

        session.handle(key("switch_symbols", in: session.layout))
        #expect(session.layout.id == .symbols)

        session.handle(key("switch_qwerty", in: session.layout))
        #expect(session.layout.id == .qwerty)
    }

    @Test("他のキーボードへの切り替えは外へ通知される")
    func nextKeyboardIsDelegated() {
        let (session, host) = makeSession()

        var requested = false
        session.onNextKeyboard = { requested = true }
        session.handle(key("next_keyboard", in: session.layout))

        #expect(requested)
        #expect(host.operations.isEmpty, "入力欄は変更しない")
    }
}
