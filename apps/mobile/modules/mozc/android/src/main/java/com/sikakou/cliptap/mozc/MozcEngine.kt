package com.sikakou.cliptap.mozc

import android.content.Context
import org.mozc.android.inputmethod.japanese.protobuf.ProtoCommands.KeyEvent
import org.mozc.android.inputmethod.japanese.protobuf.ProtoCommands.Output

/**
 * Mozcによるかな漢字変換
 *
 * iOS側の `AzooKeyEngine` と同じ意味論を提供する。
 * 「読み全体に対するN-best候補」と「先頭一致の部分確定」で構成し、
 * 上位の入力状態機械を両OSで共通にできるようにする。
 *
 * 変換候補の並びはエンジン依存であり、iOSと一致しない。
 * 一致を保証するのは操作体系と確定規則であって、候補文字列ではない。
 *
 * スレッド安全ではない。呼び出し側で直列化すること。
 */
class MozcEngine(private val context: Context) : KanaKanjiEngine {

    /** Mozcのセッション。loadするまでnull */
    private var session: MozcSession? = null

    /** 直近の応答。候補の確定要求はここから引く */
    private var lastOutput: Output? = null

    /**
     * エンジンと辞書を初期化する
     *
     * 複数回呼んでも安全。辞書を用意できない場合はfalseを返し、
     * 呼び出し側は変換なしの直接入力へ縮退する。
     */
    override fun load(): Boolean {
        if (session != null) {
            return true
        }
        val created = MozcSession.create(context) ?: return false
        created.configureForMobile()
        session = created
        return true
    }

    /**
     * かなを未確定文字列の末尾へ追加する
     */
    override fun insertKana(kana: String): EngineOutput {
        val current = session ?: return EngineOutput.EMPTY
        if (kana.isEmpty()) {
            return output
        }
        /* Mozcは1打鍵ずつ受け取る前提のため、複数文字は分解して送る */
        var result: Output? = null
        for (character in kana) {
            result = current.sendKana(character.toString())
        }
        lastOutput = result
        return output
    }

    /**
     * 未確定文字列を1入力単位ぶん削除する
     *
     * 未確定文字列が空の場合は何もしない。入力欄そのものの削除は
     * 上位の入力状態機械が担当する。
     */
    override fun deleteBackward(): EngineOutput {
        val current = session ?: return EngineOutput.EMPTY
        if (!output.isComposing) {
            return EngineOutput.EMPTY
        }
        lastOutput = current.sendSpecialKey(KeyEvent.SpecialKey.BACKSPACE)
        return output
    }

    /**
     * 現在の未確定文字列と変換候補
     */
    override val output: EngineOutput
        get() {
            val snapshot = lastOutput ?: return EngineOutput.EMPTY
            val reading = snapshot.preedit.segmentList.joinToString("") { it.value }
            if (reading.isEmpty()) {
                return EngineOutput.EMPTY
            }
            val candidates = snapshot.candidateWindow.candidateList.map {
                /*
                 * 表示は value、確定要求は id を使う。indexではなくidなのは、
                 * 候補一覧が部分的にしか返らない場合があるため。
                 */
                EngineCandidate(id = it.id, text = it.value)
            }
            return EngineOutput(reading = reading, candidates = candidates)
        }

    /**
     * 候補を確定する
     *
     * 候補が読みの一部だけを消費する場合、残りは未確定のまま保持される。
     */
    override fun selectCandidate(id: Int): CommitResult {
        val current = session ?: return CommitResult.NONE
        val result = current.submitCandidate(id) ?: return CommitResult.NONE
        lastOutput = result
        return CommitResult(
            committedText = if (result.hasResult()) result.result.value else "",
            remaining = output
        )
    }

    /**
     * 未確定文字列を変換せずそのまま確定する
     */
    override fun commitAsIs(): CommitResult {
        val current = session ?: return CommitResult.NONE
        val reading = output.reading
        if (reading.isEmpty()) {
            return CommitResult.NONE
        }
        val result = current.submit()
        lastOutput = null
        /*
         * Mozcは確定した文字列をresultへ入れる。変換候補が選ばれていた場合は
         * その文字列になるため、読みのままにしたい場合は自前の読みを返す。
         */
        return CommitResult(
            committedText = if (result?.hasResult() == true) result.result.value else reading,
            remaining = EngineOutput.EMPTY
        )
    }

    /**
     * 未確定状態を破棄する
     */
    override fun reset() {
        session?.resetContext()
        lastOutput = null
    }

    /**
     * セッションを閉じる
     */
    override fun close() {
        session?.close()
        session = null
        lastOutput = null
    }
}

/**
 * 変換要求に対するエンジンの応答
 *
 * iOS側の `EngineOutput` と対応する。
 */
data class EngineOutput(
    val reading: String,
    val candidates: List<EngineCandidate>
) {
    /** 未確定文字列を保持しているか */
    val isComposing: Boolean
        get() = reading.isNotEmpty()

    companion object {
        val EMPTY = EngineOutput(reading = "", candidates = emptyList())
    }
}

/**
 * 変換候補
 *
 * @property id 確定要求に使うMozc側の識別子
 * @property text 画面に表示し、確定時に入力欄へ送る文字列
 */
data class EngineCandidate(
    val id: Int,
    val text: String
)

/**
 * 確定操作の結果
 */
data class CommitResult(
    val committedText: String,
    val remaining: EngineOutput
) {
    companion object {
        val NONE = CommitResult(committedText = "", remaining = EngineOutput.EMPTY)
    }
}
