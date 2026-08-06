import Testing
@testable import ClipTapKeyboardCore

/**
 * エンジン抽象の値型に関する検証
 *
 * 実エンジンを用いた検証はClipTapKeyboardEngine側の契約テストで行う。
 * ここでは上位層が依存する不変条件だけを固定する。
 */
struct EngineOutputTests {

    @Test("空の出力は未確定文字列を持たない")
    func emptyOutputIsNotComposing() {
        #expect(EngineOutput.empty.isComposing == false)
        #expect(EngineOutput.empty.candidates.isEmpty)
    }

    @Test("読みがあれば未確定状態とみなす")
    func nonEmptyReadingIsComposing() {
        let output = EngineOutput(reading: "あず", candidates: [])
        #expect(output.isComposing)
    }

    @Test("候補の添字は確定要求のキーとして保たれる")
    func candidateIndexIsPreserved() {
        let output = EngineOutput(
            reading: "へんかん",
            candidates: [
                EngineCandidate(id: 0, text: "変換"),
                EngineCandidate(id: 1, text: "返還")
            ]
        )
        #expect(output.candidates[1].id == 1)
        #expect(output.candidates[1].text == "返還")
    }

    @Test("確定するものがない場合は空文字を返す")
    func noneCommitResultIsEmpty() {
        #expect(CommitResult.none.committedText.isEmpty)
        #expect(CommitResult.none.remaining == .empty)
    }
}
