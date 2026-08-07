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

    @Test("地球儀キーが不要な機種では配列から消える")
    func nextKeyboardKeyHiddenWhenNotNeeded() {
        let (session, _) = makeSession()
        let hasGlobe = { (session: InputSession) in
            session.layout.rows.flatMap(\.keys).contains { $0.id == "next_keyboard" }
        }
        #expect(hasGlobe(session), "既定では表示する（ホームボタン機種で必須のため）")

        session.needsInputModeSwitch = false
        #expect(!hasGlobe(session))

        /* 配列を切り替えても条件は引き継がれる */
        session.handle(key("switch_numbers", in: session.layout))
        #expect(!hasGlobe(session))
    }
}

/**
 * 12キーフリックの入力規則に対する検証
 */
struct FlickInputSessionTests {

    private func key(_ id: String, in layout: KeyLayout) -> KeyDefinition {
        let found = layout.rows.flatMap(\.keys).first { $0.id == id }
        #expect(found != nil, "キーが見つからない: \(id)")
        return found!
    }

    private func makeSession() -> (InputSession, RecordingTextBridge) {
        let host = RecordingTextBridge()
        let session = InputSession(host: host, layout: KeyLayouts.flick)
        return (session, host)
    }

    @Test("タップすると中央のかなが入る")
    func tapInsertsCenterKana() {
        let (session, host) = makeSession()
        session.handle(key("flick_a", in: session.layout))
        #expect(host.text == "あ")
    }

    @Test("四方向のフリックで対応するかなが入る")
    func flickInsertsDirectionalKana() {
        let (session, host) = makeSession()
        let a = key("flick_a", in: session.layout)

        session.handle(a, flickDirection: .left)
        session.handle(a, flickDirection: .up)
        session.handle(a, flickDirection: .right)
        session.handle(a, flickDirection: .down)

        /* OS標準と同じ 中央=あ 左=い 上=う 右=え 下=お の割り当て */
        #expect(host.text == "いうえお")
    }

    @Test("フリックを持たないキーは方向を無視する")
    func functionKeysIgnoreFlick() {
        let (session, host) = makeSession()
        session.handle(key("flick_a", in: session.layout))
        session.handle(key("backspace", in: session.layout), flickDirection: .up)
        #expect(host.text.isEmpty, "削除キーはフリック方向に関係なく削除する")
    }

    @Test("英字配列へ戻れる")
    func switchesBackToQwerty() {
        let (session, _) = makeSession()
        session.handle(key("switch_qwerty", in: session.layout))
        #expect(session.layout.id == .qwerty)
    }

    @Test("「゛゜小」キーで直前のかなが巡回する")
    func kanaVariantCycles() {
        let (session, host) = makeSession()
        let ta = key("flick_ta", in: session.layout)
        let variant = key("flick_dakuten", in: session.layout)

        /* た行の上フリックで「つ」。つ → っ → づ → つ と巡回する */
        session.handle(ta, flickDirection: .up)
        #expect(host.text == "つ")

        session.handle(variant)
        #expect(host.text == "っ")
        session.handle(variant)
        #expect(host.text == "づ")
        session.handle(variant)
        #expect(host.text == "つ")
    }

    @Test("は行は濁点と半濁点を巡回する")
    func handakutenCycles() {
        let (session, host) = makeSession()
        let variant = key("flick_dakuten", in: session.layout)

        session.handle(key("flick_ha", in: session.layout))
        session.handle(variant)
        #expect(host.text == "ば")
        session.handle(variant)
        #expect(host.text == "ぱ")
        session.handle(variant)
        #expect(host.text == "は")
    }

    @Test("変形を持たない文字の上では何も起きない")
    func kanaVariantIgnoresUnrelatedCharacters() {
        let (session, host) = makeSession()
        let variant = key("flick_dakuten", in: session.layout)

        /* な行の「ん」（下フリック）は変形を持たない */
        session.handle(key("flick_wa", in: session.layout), flickDirection: .up)
        #expect(host.text == "ん")

        session.handle(variant)
        #expect(host.text == "ん", "変形を持たない文字は変えない")
    }

    @Test("空の状態で「゛゜小」を押しても壊れない")
    func kanaVariantOnEmptyIsSafe() {
        let (session, host) = makeSession()
        session.handle(key("flick_dakuten", in: session.layout))
        #expect(host.text.isEmpty)
        #expect(host.operations.isEmpty, "入力欄には触れない")
    }

    @Test("地球儀キーが不要な機種では顔文字キーに置き換わる")
    func kaomojiReplacesGlobeWhenNotNeeded() {
        let (session, host) = makeSession()
        session.needsInputModeSwitch = false

        #expect(
            !session.layout.rows.flatMap(\.keys).contains { $0.id == "next_keyboard" },
            "地球儀キーは消える"
        )

        session.handle(key("flick_kaomoji", in: session.layout))
        #expect(host.text == "^_^")
    }

    @Test("句読点キーでOS標準と同じ記号が入る")
    func punctuationKeyInsertsSymbols() {
        let (session, host) = makeSession()

        let punct = key("flick_punct", in: session.layout)
        session.handle(punct)
        session.handle(punct, flickDirection: .left)
        session.handle(punct, flickDirection: .up)
        session.handle(punct, flickDirection: .right)
        session.handle(punct, flickDirection: .down)
        #expect(host.text == "、。？！…")
    }

    @Test("カーソルキーで入力欄のカーソルが動く")
    func cursorKeyMovesCursor() {
        let (session, host) = makeSession()

        let cursor = key("flick_cursor", in: session.layout)
        session.handle(cursor)
        #expect(host.operations == [.moveCursor(1)])

        session.handle(cursor, flickDirection: .left)
        #expect(host.operations == [.moveCursor(1), .moveCursor(-1)], "左フリックで戻れる")
    }

    @Test("かなの各行が正しく割り当てられている")
    func allRowsAreAssigned() {
        let (session, host) = makeSession()
        let expectations: [(String, String)] = [
            ("flick_ka", "かきくけこ"),
            ("flick_sa", "さしすせそ"),
            ("flick_ta", "たちつてと"),
            ("flick_na", "なにぬねの"),
            ("flick_ha", "はひふへほ"),
            ("flick_ma", "まみむめも"),
            ("flick_ra", "らりるれろ")
        ]

        for (id, row) in expectations {
            host.reset()
            let target = key(id, in: session.layout)
            session.handle(target)
            session.handle(target, flickDirection: .left)
            session.handle(target, flickDirection: .up)
            session.handle(target, flickDirection: .right)
            session.handle(target, flickDirection: .down)
            #expect(host.text == row, "\(id) の割り当てが期待と異なる")
        }
    }
}
