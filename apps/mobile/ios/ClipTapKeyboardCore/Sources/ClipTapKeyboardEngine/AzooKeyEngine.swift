import Foundation
import ClipTapKeyboardCore
import KanaKanjiConverterModuleWithDefaultDictionary

/**
 * AzooKeyKanaKanjiConverterによるかな漢字変換エンジン
 *
 * 辞書は読みの先頭文字ごとにファイル分割されており、必要な分だけを読み込む。
 * このため辞書全体は約25MBあるが、常駐メモリはそれより遥かに小さく収まる。
 * `preloadDictionary`を有効にすると全読み込みになりキーボード拡張の上限を
 * 超えるため、有効化しないこと。
 */
public final class AzooKeyEngine: KanaKanjiEngine {

    /** 変換器本体。辞書の実体を保持する */
    private var converter: KanaKanjiConverter?

    /** 未確定文字列の入力履歴。削除・カーソル移動のためにエンジン側が保持する */
    private var composingText = ComposingText()

    /** 直近の変換結果。確定要求はこの配列への添字で指定される */
    private var currentCandidates: [Candidate] = []

    /** 学習データの保存先 */
    private let memoryDirectoryURL: URL

    /** App Groupなど、アプリと共有する領域 */
    private let sharedContainerURL: URL

    /** 学習の有効・無効。利用者が設定で切り替える */
    private var learningType: LearningType

    /**
     * - Parameters:
     *   - memoryDirectoryURL: 学習データを書き出すディレクトリ
     *   - sharedContainerURL: 変換器が共有データを置くディレクトリ
     *   - isLearningEnabled: 学習を有効にするか
     */
    public init(
        memoryDirectoryURL: URL,
        sharedContainerURL: URL,
        isLearningEnabled: Bool = true
    ) {
        self.memoryDirectoryURL = memoryDirectoryURL
        self.sharedContainerURL = sharedContainerURL
        self.learningType = isLearningEnabled ? .inputAndOutput : .nothing
    }

    // MARK: - KanaKanjiEngine

    public func load() -> Bool {
        if converter != nil {
            return true
        }
        /* 辞書の遅延読み込みを維持するため、preloadDictionaryは指定しない */
        converter = KanaKanjiConverter.withDefaultDictionary()
        return converter != nil
    }

    @discardableResult
    public func insertKana(_ kana: String) -> EngineOutput {
        guard !kana.isEmpty else {
            return output
        }
        composingText.insertAtCursorPosition(kana, inputStyle: .direct)
        return convert()
    }

    @discardableResult
    public func deleteBackward() -> EngineOutput {
        guard !composingText.isEmpty else {
            return .empty
        }
        composingText.deleteBackwardFromCursorPosition(count: 1)
        if composingText.isEmpty {
            currentCandidates = []
            return .empty
        }
        return convert()
    }

    public var output: EngineOutput {
        EngineOutput(
            reading: composingText.convertTarget,
            candidates: currentCandidates.enumerated().map { EngineCandidate(index: $0.offset, text: $0.element.text) }
        )
    }

    public func selectCandidate(index: Int) -> CommitResult {
        guard currentCandidates.indices.contains(index) else {
            return .none
        }
        let candidate = currentCandidates[index]

        /* 学習は確定時にのみ更新する。無効化時はエンジン側で無視される */
        if learningType == .inputAndOutput {
            converter?.updateLearningData(candidate)
            converter?.commitUpdateLearningData()
        }
        converter?.setCompletedData(candidate)

        /* 候補が読みの一部だけを消費した場合、残りは未確定のまま保持する */
        composingText.prefixComplete(composingCount: candidate.composingCount)

        if composingText.isEmpty {
            currentCandidates = []
            return CommitResult(committedText: candidate.text, remaining: .empty)
        }
        return CommitResult(committedText: candidate.text, remaining: convert())
    }

    public func commitAsIs() -> CommitResult {
        let reading = composingText.convertTarget
        guard !reading.isEmpty else {
            return .none
        }
        reset()
        return CommitResult(committedText: reading, remaining: .empty)
    }

    public func reset() {
        composingText.stopComposition()
        composingText = ComposingText()
        currentCandidates = []
        converter?.stopComposition()
    }

    public func resetLearning() {
        converter?.resetMemory()
    }

    /**
     * 学習の有効・無効を切り替える
     */
    public func setLearningEnabled(_ isEnabled: Bool) {
        learningType = isEnabled ? .inputAndOutput : .nothing
    }

    // MARK: - Private

    /**
     * 現在の未確定文字列に対して変換を要求する
     */
    private func convert() -> EngineOutput {
        guard let converter else {
            return EngineOutput(reading: composingText.convertTarget, candidates: [])
        }
        let result = converter.requestCandidates(composingText, options: makeOptions())
        currentCandidates = result.mainResults
        return output
    }

    /**
     * 変換要求の設定を組み立てる
     *
     * Zenzai（ニューラル変換）はC++相互運用とllama.cppを必要とし、
     * キーボード拡張のメモリ上限に収まらないため既定の`.off`のままにする。
     */
    private func makeOptions() -> ConvertRequestOptions {
        ConvertRequestOptions(
            N_best: 9,
            requireJapanesePrediction: true,
            requireEnglishPrediction: false,
            keyboardLanguage: .ja_JP,
            learningType: learningType,
            memoryDirectoryURL: memoryDirectoryURL,
            sharedContainerURL: sharedContainerURL,
            /* 絵文字辞書はライセンス表記が確認できていないため同梱せず、空の置換器を使う */
            textReplacer: .empty,
            specialCandidateProviders: nil,
            metadata: .init(versionString: "ClipTap")
        )
    }
}
