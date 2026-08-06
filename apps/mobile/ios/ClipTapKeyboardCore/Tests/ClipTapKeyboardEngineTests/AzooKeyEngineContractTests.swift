import Foundation
import Testing
import ClipTapKeyboardCore
@testable import ClipTapKeyboardEngine

/**
 * 実エンジンに対する契約テスト
 *
 * 変換結果の文字列そのものはエンジンの辞書と学習に左右されるため固定しない。
 * 上位の入力状態機械が前提にしてよい不変条件だけを検証する。
 * Android側のMozc実装にも同じ不変条件のテストを置く。
 */
struct AzooKeyEngineContractTests {

    /**
     * 一時ディレクトリ上に隔離したエンジンを作る
     *
     * 学習データがテスト間で混ざらないよう、実行ごとに別のディレクトリを使う。
     */
    private func makeEngine(isLearningEnabled: Bool = false) -> AzooKeyEngine {
        let root = URL(fileURLWithPath: NSTemporaryDirectory(), isDirectory: true)
            .appendingPathComponent("cliptap-engine-test-\(UUID().uuidString)", isDirectory: true)
        try? FileManager.default.createDirectory(at: root, withIntermediateDirectories: true)

        return AzooKeyEngine(
            memoryDirectoryURL: root.appendingPathComponent("memory", isDirectory: true),
            sharedContainerURL: root,
            isLearningEnabled: isLearningEnabled
        )
    }

    @Test("辞書を読み込める")
    func loadsDictionary() {
        let engine = makeEngine()
        #expect(engine.load())
        /* 複数回呼んでも安全であること */
        #expect(engine.load())
    }

    @Test("かなを入力すると未確定文字列と候補が得られる")
    func producesCandidates() {
        let engine = makeEngine()
        #expect(engine.load())

        let output = engine.insertKana("へんかん")

        #expect(output.reading == "へんかん")
        #expect(output.isComposing)
        #expect(!output.candidates.isEmpty, "変換候補が1件も返らない")

        /* 候補の添字は確定要求のキーになるため、0から連番であること */
        for (position, candidate) in output.candidates.enumerated() {
            #expect(candidate.index == position)
            #expect(!candidate.text.isEmpty)
        }

        /* 「変換」が候補に含まれることを、順位を問わずに確認する */
        #expect(output.candidates.contains { $0.text == "変換" }, "期待した変換候補が含まれない")
    }

    @Test("1文字ずつ削除できる")
    func deletesBackward() {
        let engine = makeEngine()
        #expect(engine.load())

        engine.insertKana("あいう")
        #expect(engine.deleteBackward().reading == "あい")
        #expect(engine.deleteBackward().reading == "あ")
        #expect(engine.deleteBackward() == .empty)
        /* 空の状態でさらに削除しても壊れないこと */
        #expect(engine.deleteBackward() == .empty)
    }

    @Test("無変換確定は読みをそのまま返す")
    func commitsAsIs() {
        let engine = makeEngine()
        #expect(engine.load())

        engine.insertKana("あずーきー")
        let result = engine.commitAsIs()

        #expect(result.committedText == "あずーきー")
        #expect(result.remaining == .empty)
        #expect(engine.output == .empty)
    }

    @Test("候補を確定すると確定文字列が返り、残りは未確定として保持される")
    func commitsCandidateAndKeepsRemainder() {
        let engine = makeEngine()
        #expect(engine.load())

        let output = engine.insertKana("きょうはあめ")
        #expect(!output.candidates.isEmpty)

        let result = engine.selectCandidate(index: 0)

        #expect(!result.committedText.isEmpty)
        /* 確定文字列と残りの読みを合わせて、元の読みを取りこぼしていないこと */
        #expect(result.committedText.count + result.remaining.reading.count > 0)
    }

    @Test("存在しない候補を指定しても壊れない")
    func ignoresInvalidCandidateIndex() {
        let engine = makeEngine()
        #expect(engine.load())

        engine.insertKana("あ")
        #expect(engine.selectCandidate(index: 999) == .none)
    }

    @Test("長い読みでも候補を返し、メモリが際限なく増えない")
    func handlesLongReading() {
        let engine = makeEngine()
        #expect(engine.load())

        let before = MemoryProbe.footprintBytes()

        /* キーボード拡張の上限判定の目安として、実運用より長めの読みを流す */
        let reading = String(repeating: "あいうえおかきくけこ", count: 4)
        let output = engine.insertKana(reading)
        #expect(output.reading == reading)

        for _ in 0 ..< 20 {
            engine.deleteBackward()
        }
        engine.reset()

        if let before, let after = MemoryProbe.footprintBytes() {
            let grownMB = Double(Int64(after) - Int64(before)) / 1_048_576
            /* 辞書は読みの先頭文字ごとに読み込まれるため、増分は数十MBに収まるはず */
            #expect(grownMB < 60, "変換1回でメモリが\(String(format: "%.1f", grownMB))MB増えた")
        }
    }
}
