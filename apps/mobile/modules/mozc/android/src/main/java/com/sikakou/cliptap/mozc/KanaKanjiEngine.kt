package com.sikakou.cliptap.mozc

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
 *
 * スレッド安全ではない。呼び出し側で直列化すること。
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
     *
     * @param id `EngineCandidate.id`。エンジンが候補を識別するための値
     */
    fun selectCandidate(id: Int): CommitResult

    /**
     * 未確定文字列を変換せずそのまま確定する
     */
    fun commitAsIs(): CommitResult

    /**
     * 未確定状態を破棄する
     */
    fun reset()

    /**
     * エンジンを解放する
     */
    fun close()
}
