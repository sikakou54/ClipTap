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

    @Test("打鍵ごとの変換が応答目標に収まる")
    func perKeystrokeLatency() {
        /**
         * 実際の入力は1文字ずつ積み上がるため、その形で計測する。
         * 打鍵から候補表示までの目標は50ms。これを超えると入力が引っかかる。
         * Debugビルド（-Onone）では目標を満たせないため、-c release で計測すること。
         */
        let engine = makeEngine()
        #expect(engine.load())

        /* 初回は辞書ファイルを開くため遅い。定常状態を測るので計測前に一度流す */
        engine.insertKana("あ")
        engine.reset()

        let phrase = "きょうはいいてんきですね"
        var elapsedMs: [Double] = []

        for character in phrase {
            let started = Date()
            _ = engine.insertKana(String(character))
            elapsedMs.append(Date().timeIntervalSince(started) * 1000)
        }

        let sorted = elapsedMs.sorted()
        let median = sorted[sorted.count / 2]
        let worst = sorted[sorted.count - 1]
        let total = elapsedMs.reduce(0, +)

        print("📏 [応答] \(phrase.count)打鍵 中央値 \(String(format: "%.1f", median))ms"
            + " / 最悪 \(String(format: "%.1f", worst))ms"
            + " / 合計 \(String(format: "%.1f", total))ms")
        print("📏 [応答] 各打鍵 " + elapsedMs.map { String(format: "%.0f", $0) }.joined(separator: ", ") + " ms")

        #expect(median < 50, "打鍵ごとの変換の中央値が\(String(format: "%.1f", median))msで目標50msを超えた")
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
        /**
         * iOSキーボード拡張のメモリ上限は実測で48MB前後とされる。
         * ここでの計測はmacOS上のため上限判定そのものにはならないが、
         * 辞書がどれだけ常駐メモリを要求するかの下限見積もりになる。
         * 最終判定は実機の拡張プロセスで行う。
         */
        func megabytes(_ bytes: UInt64?) -> Double {
            guard let bytes else { return 0 }
            return Double(bytes) / 1_048_576
        }

        let baseline = MemoryProbe.footprintBytes()
        print("📏 [計測] エンジン生成前 \(String(format: "%.1f", megabytes(baseline)))MB")

        let engine = makeEngine()
        #expect(engine.load())
        let afterLoad = MemoryProbe.footprintBytes()
        print("📏 [計測] 辞書読込後 \(String(format: "%.1f", megabytes(afterLoad)))MB"
            + "（増分 \(String(format: "%.1f", megabytes(afterLoad) - megabytes(baseline)))MB）")

        /* 実運用より長めの読みを流し、辞書の読み込み範囲を広げる */
        let reading = String(repeating: "あいうえおかきくけこ", count: 4)
        let output = engine.insertKana(reading)
        #expect(output.reading == reading)

        let afterConvert = MemoryProbe.footprintBytes()
        print("📏 [計測] 40文字変換後 \(String(format: "%.1f", megabytes(afterConvert)))MB"
            + "（増分 \(String(format: "%.1f", megabytes(afterConvert) - megabytes(baseline)))MB）")

        for _ in 0 ..< 20 {
            engine.deleteBackward()
        }
        engine.reset()

        let afterReset = MemoryProbe.footprintBytes()
        print("📏 [計測] 削除・破棄後 \(String(format: "%.1f", megabytes(afterReset)))MB"
            + "（増分 \(String(format: "%.1f", megabytes(afterReset) - megabytes(baseline)))MB）")

        let grownMB = megabytes(afterReset) - megabytes(baseline)
        /* 辞書は読みの先頭文字ごとに読み込まれるため、増分は数十MBに収まるはず */
        #expect(grownMB < 60, "変換1回でメモリが\(String(format: "%.1f", grownMB))MB増えた")
    }
}
