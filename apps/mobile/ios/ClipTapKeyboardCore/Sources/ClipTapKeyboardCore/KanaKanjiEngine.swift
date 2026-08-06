import Foundation

/**
 * かな漢字変換エンジンの抽象
 *
 * iOSはAzooKeyKanaKanjiConverter、AndroidはMozcと実装が分かれるため、
 * 上位の入力状態機械が両プラットフォームで同一になるようにここで境界を引く。
 * Kotlin側にも同名・同意味のインターフェースを置く。
 *
 * 「読み全体に対するN-best候補」と「先頭一致の部分確定」で構成する。
 * これはAzooKeyの`prefixComplete`とMozcの`SUBMIT_CANDIDATE`の双方が
 * 表現できる、両エンジンの最大公約数にあたる。
 */
public protocol KanaKanjiEngine: AnyObject {

    /**
     * エンジンと辞書を初期化する
     *
     * 複数回呼んでも安全であること。辞書が読めない場合はfalseを返し、
     * 呼び出し側は変換なしの直接入力へ縮退する。
     */
    func load() -> Bool

    /**
     * かな1文字ないし複数文字を未確定文字列の末尾へ追加する
     */
    @discardableResult
    func insertKana(_ kana: String) -> EngineOutput

    /**
     * 未確定文字列を1入力単位ぶん削除する
     *
     * ローマ字入力ではローマ字1文字、かな入力ではかな1文字を削除する。
     * 未確定文字列が空の場合は何もせず、空のEngineOutputを返す。
     */
    @discardableResult
    func deleteBackward() -> EngineOutput

    /**
     * 現在の未確定文字列と変換候補を返す
     */
    var output: EngineOutput { get }

    /**
     * 指定した候補を確定する
     *
     * 候補が未確定文字列の一部だけを消費する場合、残りは未確定のまま保持する。
     */
    func selectCandidate(index: Int) -> CommitResult

    /**
     * 未確定文字列を変換せずそのまま確定する
     *
     * 変換候補が出ている状態でも、読みのまま確定したい場合に使う。
     */
    func commitAsIs() -> CommitResult

    /**
     * 未確定状態を破棄する
     */
    func reset()

    /**
     * 学習データを消去する
     */
    func resetLearning()
}

/**
 * 変換要求に対するエンジンの応答
 */
public struct EngineOutput: Equatable, Sendable {

    /** 未確定文字列（ひらがな） */
    public let reading: String

    /** 変換候補。先頭ほど確からしい */
    public let candidates: [EngineCandidate]

    public init(reading: String, candidates: [EngineCandidate]) {
        self.reading = reading
        self.candidates = candidates
    }

    /** 未確定文字列も候補もない状態 */
    public static let empty = EngineOutput(reading: "", candidates: [])

    /** 未確定文字列を保持しているか */
    public var isComposing: Bool {
        !reading.isEmpty
    }
}

/**
 * 変換候補
 *
 * エンジン固有の情報は`index`越しにエンジン側が保持する。
 * 上位層がエンジンの型に依存しないようにするための間接参照。
 */
public struct EngineCandidate: Equatable, Sendable {

    /** エンジンが保持する候補列における位置。確定要求のキーになる */
    public let index: Int

    /** 画面に表示し、確定時に入力欄へ送る文字列 */
    public let text: String

    public init(index: Int, text: String) {
        self.index = index
        self.text = text
    }
}

/**
 * 確定操作の結果
 */
public struct CommitResult: Equatable, Sendable {

    /** 入力欄へ送るべき確定文字列 */
    public let committedText: String

    /** 確定後に未確定として残る内容 */
    public let remaining: EngineOutput

    public init(committedText: String, remaining: EngineOutput) {
        self.committedText = committedText
        self.remaining = remaining
    }

    /** 確定するものが何もなかった状態 */
    public static let none = CommitResult(committedText: "", remaining: .empty)
}
