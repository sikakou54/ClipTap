package com.sikakou.cliptap.keyboard.engine

/**
 * かな漢字変換エンジンの抽象
 *
 * iOSはAzooKeyKanaKanjiConverter、AndroidはMozcと実装が分かれるため、
 * 上位の入力状態機械が両プラットフォームで同一になるようにここで境界を引く。
 * iOS側の `KanaKanjiEngine.swift` と同名・同意味を保つこと。
 *
 * 「読み全体に対するN-best候補」と「先頭一致の部分確定」で構成する。
 * これはAzooKeyの`prefixComplete`とMozcの`SUBMIT_CANDIDATE`の双方が
 * 表現できる、両エンジンの最大公約数にあたる。
 *
 * 変換候補の並びはエンジン依存であり、iOSとAndroidで一致しない。
 * 一致を保証するのは操作体系と確定規則であって、候補文字列ではない。
 */
interface KanaKanjiEngine {

    /**
     * エンジンと辞書を初期化する
     *
     * 複数回呼んでも安全であること。辞書が読めない場合はfalseを返し、
     * 呼び出し側は変換なしの直接入力へ縮退する。
     */
    fun load(): Boolean

    /**
     * かな1文字ないし複数文字を未確定文字列の末尾へ追加する
     */
    fun insertKana(kana: String): EngineOutput

    /**
     * 未確定文字列を1入力単位ぶん削除する
     *
     * ローマ字入力ではローマ字1文字、かな入力ではかな1文字を削除する。
     * 未確定文字列が空の場合は何もせず、空のEngineOutputを返す。
     */
    fun deleteBackward(): EngineOutput

    /**
     * 現在の未確定文字列と変換候補
     */
    val output: EngineOutput

    /**
     * 指定した候補を確定する
     *
     * 候補が未確定文字列の一部だけを消費する場合、残りは未確定のまま保持する。
     */
    fun selectCandidate(index: Int): CommitResult

    /**
     * 未確定文字列を変換せずそのまま確定する
     *
     * 変換候補が出ている状態でも、読みのまま確定したい場合に使う。
     */
    fun commitAsIs(): CommitResult

    /**
     * 未確定状態を破棄する
     */
    fun reset()

    /**
     * 学習データを消去する
     */
    fun resetLearning()
}

/**
 * 変換要求に対するエンジンの応答
 *
 * @property reading 未確定文字列（ひらがな）
 * @property candidates 変換候補。先頭ほど確からしい
 */
data class EngineOutput(
    val reading: String,
    val candidates: List<EngineCandidate>
) {
    /** 未確定文字列を保持しているか */
    val isComposing: Boolean
        get() = reading.isNotEmpty()

    companion object {
        /** 未確定文字列も候補もない状態 */
        val EMPTY = EngineOutput(reading = "", candidates = emptyList())
    }
}

/**
 * 変換候補
 *
 * エンジン固有の情報は`index`越しにエンジン側が保持する。
 * 上位層がエンジンの型に依存しないようにするための間接参照。
 *
 * @property index エンジンが保持する候補列における位置。確定要求のキーになる
 * @property text 画面に表示し、確定時に入力欄へ送る文字列
 */
data class EngineCandidate(
    val index: Int,
    val text: String
)

/**
 * 確定操作の結果
 *
 * @property committedText 入力欄へ送るべき確定文字列
 * @property remaining 確定後に未確定として残る内容
 */
data class CommitResult(
    val committedText: String,
    val remaining: EngineOutput
) {
    companion object {
        /** 確定するものが何もなかった状態 */
        val NONE = CommitResult(committedText = "", remaining = EngineOutput.EMPTY)
    }
}
