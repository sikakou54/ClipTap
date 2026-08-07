import Testing
@testable import ClipTapKeyboardCore

/**
 * テスト用の決定的な変換エンジン
 *
 * 実エンジン（AzooKey）の候補は辞書と学習に依存して揺れるため、
 * 確定規則の検証には読みから候補が一意に決まる偽物を使う。
 * 実エンジンとの結合はClipTapKeyboardEngine側の契約テストで担保する。
 */
final class FakeKanaKanjiEngine: KanaKanjiEngine {

    /** load()の戻り値。辞書が読めない状況を再現する */
    var loadResult = true

    /** 読みに対する候補の定義。未定義の読みは候補なし */
    var candidateTable: [String: [String]] = [:]

    /** selectCandidateが消費する読みの文字数。nilは全部 */
    var consumeLength: Int?

    private(set) var loadCallCount = 0
    private(set) var reading = ""

    func load() -> Bool {
        loadCallCount += 1
        return loadResult
    }

    func insertKana(_ kana: String) -> EngineOutput {
        reading += kana
        return output
    }

    func deleteBackward() -> EngineOutput {
        if !reading.isEmpty {
            reading.removeLast()
        }
        return output
    }

    var output: EngineOutput {
        let candidates = (candidateTable[reading] ?? []).enumerated()
            .map { EngineCandidate(id: $0.offset, text: $0.element) }
        return EngineOutput(reading: reading, candidates: candidates)
    }

    func selectCandidate(id: Int) -> CommitResult {
        let candidates = candidateTable[reading] ?? []
        guard candidates.indices.contains(id) else {
            return .none
        }
        let text = candidates[id]
        let consumed = min(consumeLength ?? reading.count, reading.count)
        reading = String(reading.dropFirst(consumed))
        return CommitResult(committedText: text, remaining: output)
    }

    func commitAsIs() -> CommitResult {
        guard !reading.isEmpty else {
            return .none
        }
        let text = reading
        reading = ""
        return CommitResult(committedText: text, remaining: .empty)
    }

    func reset() {
        reading = ""
    }

    func resetLearning() {}

    private(set) var isLearningEnabled = true

    func setLearningEnabled(_ isEnabled: Bool) {
        isLearningEnabled = isEnabled
    }
}

/**
 * 日本語入力（かな漢字変換）の確定規則に対する検証
 *
 * ここで固定した規則は、Kotlin側（Mozc）の実装でも同じ結果になること。
 * 候補の並びはエンジン依存で揃わないが、操作体系と確定規則は完全に揃える。
 */
struct JapaneseInputSessionTests {

    private func key(_ id: String, in layout: KeyLayout) -> KeyDefinition {
        let found = layout.rows.flatMap(\.keys).first { $0.id == id }
        #expect(found != nil, "キーが見つからない: \(id)")
        return found!
    }

    private func makeSession(
        engine: FakeKanaKanjiEngine = FakeKanaKanjiEngine()
    ) -> (InputSession, RecordingTextBridge, FakeKanaKanjiEngine) {
        let host = RecordingTextBridge()
        let session = InputSession(host: host, layout: KeyLayouts.flick)
        session.engine = engine
        return (session, host, engine)
    }

    @Test("かなは入力欄ではなく未確定文字列へ積まれる")
    func kanaGoesToComposition() {
        let (session, host, _) = makeSession()

        session.handle(key("flick_a", in: session.layout))
        session.handle(key("flick_ka", in: session.layout), flickDirection: .left)

        #expect(session.composition.reading == "あき")
        #expect(host.text.isEmpty, "確定前は入力欄に何も送らない")
    }

    @Test("辞書が読めない場合は直接入力へ縮退する")
    func fallsBackToDirectInputWhenEngineFails() {
        let engine = FakeKanaKanjiEngine()
        engine.loadResult = false
        let (session, host, _) = makeSession(engine: engine)

        session.handle(key("flick_a", in: session.layout))

        #expect(host.text == "あ", "変換なしでもかなは入力できる")
        #expect(session.composition == .empty)
    }

    @Test("初期化の失敗は繰り返さない")
    func loadFailureIsNotRetried() {
        let engine = FakeKanaKanjiEngine()
        engine.loadResult = false
        let (session, _, _) = makeSession(engine: engine)

        session.handle(key("flick_a", in: session.layout))
        session.handle(key("flick_a", in: session.layout))

        #expect(engine.loadCallCount == 1, "打鍵のたびに失敗する初期化を繰り返さない")
    }

    @Test("未確定中の削除は未確定文字列を消す")
    func backspaceEditsComposition() {
        let (session, host, _) = makeSession()

        session.handle(key("flick_a", in: session.layout))
        session.handle(key("flick_ka", in: session.layout))
        session.handle(key("backspace", in: session.layout))

        #expect(session.composition.reading == "あ")
        #expect(host.operations.isEmpty, "入力欄には触れない")
    }

    @Test("未確定が空になったら削除は入力欄へ向かう")
    func backspaceReturnsToHostAfterCompositionEmpties() {
        let (session, host, _) = makeSession()
        host.insert("x")

        session.handle(key("flick_a", in: session.layout))
        session.handle(key("backspace", in: session.layout))
        #expect(session.composition == .empty)

        session.handle(key("backspace", in: session.layout))
        #expect(host.text.isEmpty, "未確定が無いときは入力欄の1文字を消す")
    }

    @Test("改行キーは未確定文字列を読みのまま確定する")
    func enterCommitsReadingAsIs() {
        let (session, host, _) = makeSession()

        session.handle(key("flick_a", in: session.layout))
        session.handle(key("flick_ka", in: session.layout), flickDirection: .left)
        session.handle(key("enter", in: session.layout))

        #expect(host.text == "あき")
        #expect(session.composition == .empty)

        /* 確定直後の改行キーは通常の改行として働く */
        session.handle(key("enter", in: session.layout))
        #expect(host.text == "あき\n")
    }

    @Test("空白キーで候補が順に選ばれ、末尾から先頭へ戻る")
    func spaceCyclesCandidates() {
        let engine = FakeKanaKanjiEngine()
        engine.candidateTable = ["あ": ["亜", "阿"]]
        let (session, host, _) = makeSession(engine: engine)

        session.handle(key("flick_a", in: session.layout))
        #expect(session.selectedCandidateIndex == nil)

        session.handle(key("space", in: session.layout))
        #expect(session.selectedCandidateIndex == 0)

        session.handle(key("space", in: session.layout))
        #expect(session.selectedCandidateIndex == 1)

        session.handle(key("space", in: session.layout))
        #expect(session.selectedCandidateIndex == 0, "末尾まで来たら先頭へ戻る")

        #expect(host.text.isEmpty, "選んでいる間は確定しない")
    }

    @Test("候補を選んで改行するとその候補が確定される")
    func enterCommitsSelectedCandidate() {
        let engine = FakeKanaKanjiEngine()
        engine.candidateTable = ["あ": ["亜", "阿"]]
        let (session, host, _) = makeSession(engine: engine)

        session.handle(key("flick_a", in: session.layout))
        session.handle(key("space", in: session.layout))
        session.handle(key("space", in: session.layout))
        session.handle(key("enter", in: session.layout))

        #expect(host.text == "阿")
        #expect(session.composition == .empty)
        #expect(session.selectedCandidateIndex == nil)
    }

    @Test("候補のタップで確定される")
    func tappingCandidateCommits() {
        let engine = FakeKanaKanjiEngine()
        engine.candidateTable = ["あ": ["亜", "阿"]]
        let (session, host, _) = makeSession(engine: engine)

        session.handle(key("flick_a", in: session.layout))
        session.commitCandidate(at: 1)

        #expect(host.text == "阿")
        #expect(session.composition == .empty)
    }

    @Test("候補が読みの一部だけを消費したら残りの変換が続く")
    func partialCommitKeepsRemainderComposing() {
        let engine = FakeKanaKanjiEngine()
        engine.candidateTable = [
            "あき": ["秋"],
            "き": ["木"]
        ]
        engine.consumeLength = 1
        let (session, host, _) = makeSession(engine: engine)

        session.handle(key("flick_a", in: session.layout))
        session.handle(key("flick_ka", in: session.layout), flickDirection: .left)
        session.commitCandidate(at: 0)

        #expect(host.text == "秋")
        #expect(session.composition.reading == "き", "残りは未確定のまま変換が続く")
        #expect(session.composition.candidates.map(\.text) == ["木"])
    }

    @Test("候補を選んでいる最中の入力は、選択中の候補を確定してから続く")
    func typingWhileSelectingCommitsFirst() {
        let engine = FakeKanaKanjiEngine()
        engine.candidateTable = ["あ": ["亜", "阿"]]
        let (session, host, _) = makeSession(engine: engine)

        session.handle(key("flick_a", in: session.layout))
        session.handle(key("space", in: session.layout))
        session.handle(key("flick_ka", in: session.layout))

        #expect(host.text == "亜", "選択中だった候補が確定される")
        #expect(session.composition.reading == "か", "新しい入力は次の未確定になる")
    }

    @Test("配列を切り替えると読みのまま確定してから移る")
    func switchingLayoutCommitsComposition() {
        let (session, host, _) = makeSession()

        session.handle(key("flick_a", in: session.layout))
        session.handle(key("switch_qwerty", in: session.layout))

        #expect(host.text == "あ", "打ちかけの文字を捨てない")
        #expect(session.layout.id == .qwerty)
        #expect(session.composition == .empty)
    }

    @Test("配列を往復しても入力の続きが壊れない")
    func roundTripBetweenLayoutsKeepsText() {
        let (session, host, _) = makeSession()

        session.handle(key("flick_a", in: session.layout))
        session.handle(key("switch_qwerty", in: session.layout))
        session.handle(key("switch_flick", in: session.layout))
        session.handle(key("flick_ka", in: session.layout))
        session.flushComposition()

        #expect(host.text == "あか")
    }

    @Test("候補を選んだまま配列を切り替えると選択中の候補が確定される")
    func switchingLayoutCommitsSelectedCandidate() {
        let engine = FakeKanaKanjiEngine()
        engine.candidateTable = ["あ": ["亜", "阿"]]
        let (session, host, _) = makeSession(engine: engine)

        session.handle(key("flick_a", in: session.layout))
        session.handle(key("space", in: session.layout))
        session.handle(key("space", in: session.layout))
        session.handle(key("switch_qwerty", in: session.layout))

        #expect(host.text == "阿", "利用者に見えている選択を黙って捨てない")
        #expect(session.layout.id == .qwerty)
    }

    @Test("候補を選んだまま他のキーボードへ切り替えても選択中の候補が確定される")
    func nextKeyboardCommitsSelectedCandidate() {
        let engine = FakeKanaKanjiEngine()
        engine.candidateTable = ["あ": ["亜", "阿"]]
        let (session, host, _) = makeSession(engine: engine)
        var requested = false
        session.onNextKeyboard = { requested = true }

        session.handle(key("flick_a", in: session.layout))
        session.handle(key("space", in: session.layout))
        session.handle(key("next_keyboard", in: session.layout))

        #expect(host.text == "亜")
        #expect(requested)
    }

    @Test("外部からの配列切替でも読みのまま確定してから移る")
    func programmaticSwitchCommitsComposition() {
        let (session, host, _) = makeSession()

        session.handle(key("flick_a", in: session.layout))
        session.switchLayout(to: .qwerty)

        #expect(host.text == "あ", "打ちかけの文字を捨てない")
        #expect(session.layout.id == .qwerty)
    }

    @Test("配列の切替は外へ通知される")
    func layoutChangeIsNotified() {
        let (session, _, _) = makeSession()
        var notified = 0
        session.onLayoutChanged = { notified += 1 }

        session.switchLayout(to: .qwerty)
        #expect(notified == 1)

        /* キーからの切替でも同じ経路を通る */
        session.handle(key("switch_flick", in: session.layout))
        #expect(notified == 2)
        #expect(session.layout.id == .flick)
    }

    @Test("破棄要求は未確定文字列を入力欄へ送らず消す")
    func discardDropsCompositionWithoutInserting() {
        let (session, host, engine) = makeSession()

        session.handle(key("flick_a", in: session.layout))
        session.discardComposition()

        #expect(session.composition == .empty)
        #expect(host.text.isEmpty, "入力欄には何も送らない")
        #expect(engine.reading.isEmpty, "エンジン側の未確定状態も消える")
    }

    @Test("未確定中の「゛゜小」は未確定文字列の末尾を変形する")
    func kanaVariantEditsComposition() {
        let (session, host, _) = makeSession()

        session.handle(key("flick_ha", in: session.layout))
        session.handle(key("flick_dakuten", in: session.layout))

        #expect(session.composition.reading == "ば")
        #expect(host.operations.isEmpty, "入力欄には触れない")

        session.handle(key("flick_dakuten", in: session.layout))
        #expect(session.composition.reading == "ぱ")
    }

    @Test("未確定中の空白キーは入力欄に空白を入れない")
    func spaceWhileComposingDoesNotInsert() {
        let engine = FakeKanaKanjiEngine()
        engine.candidateTable = ["あ": ["亜"]]
        let (session, host, _) = makeSession(engine: engine)

        session.handle(key("flick_a", in: session.layout))
        session.handle(key("space", in: session.layout))

        #expect(host.text.isEmpty)
    }

    @Test("日本語配列の空白はOS標準に合わせて全角になる")
    func spaceIsFullWidthInJapaneseLayout() {
        let (session, host, _) = makeSession()

        session.handle(key("space", in: session.layout))
        #expect(host.text == "\u{3000}")

        /* 英字配列では半角のまま */
        session.handle(key("switch_qwerty", in: session.layout))
        session.handle(key("space", in: session.layout))
        #expect(host.text == "\u{3000} ")
    }

    @Test("キーボードが閉じるときの確定要求で読みが入力欄へ送られる")
    func flushSendsReadingToHost() {
        let (session, host, _) = makeSession()

        session.handle(key("flick_a", in: session.layout))
        session.flushComposition()

        #expect(host.text == "あ")
        #expect(session.composition == .empty)

        /* 未確定が無いときは何もしない */
        session.flushComposition()
        #expect(host.text == "あ")
    }
}
