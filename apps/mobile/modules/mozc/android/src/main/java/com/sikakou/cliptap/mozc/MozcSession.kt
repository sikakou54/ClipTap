package com.sikakou.cliptap.mozc

import android.content.Context
import android.util.Log
import com.google.android.apps.inputmethod.libs.mozc.session.MozcJNI
import org.mozc.android.inputmethod.japanese.protobuf.ProtoCommands.Command
import org.mozc.android.inputmethod.japanese.protobuf.ProtoCommands.CompositionMode
import org.mozc.android.inputmethod.japanese.protobuf.ProtoCommands.Input
import org.mozc.android.inputmethod.japanese.protobuf.ProtoCommands.KeyEvent
import org.mozc.android.inputmethod.japanese.protobuf.ProtoCommands.Output
import org.mozc.android.inputmethod.japanese.protobuf.ProtoCommands.Request
import org.mozc.android.inputmethod.japanese.protobuf.ProtoCommands.SessionCommand
import java.io.File

/**
 * Mozcのセッションを扱う薄い層
 *
 * Mozcはコマンドをprotobufでやり取りする設計で、JNIの入口は
 * 「シリアライズしたCommandを渡してシリアライズしたCommandを受け取る」1本しかない。
 * その手続きをここへ閉じ込め、上位が変換の意味だけを扱えるようにする。
 *
 * スレッド安全ではない。呼び出し側で直列化すること。
 */
class MozcSession private constructor(private val sessionId: Long) {

    companion object {

        private const val TAG = "MozcSession"

        /** ネイティブの初期化を一度だけ行うための印 */
        @Volatile
        private var isNativeLoaded = false

        /**
         * ネイティブを初期化してセッションを作る
         *
         * @return 生成したセッション。辞書を用意できない場合はnull
         */
        @Synchronized
        fun create(context: Context): MozcSession? {
            if (!loadNative(context)) {
                return null
            }

            val output = evaluate(
                Input.newBuilder()
                    .setType(Input.CommandType.CREATE_SESSION)
                    .build()
            ) ?: return null

            return MozcSession(output.id)
        }

        /**
         * ネイティブライブラリと辞書を読み込む
         */
        private fun loadNative(context: Context): Boolean {
            if (isNativeLoaded) {
                return true
            }

            val dataFile: File = MozcDataInstaller.ensureInstalled(context) ?: return false

            /* 学習データなどの書き出し先。共有DBとは分け、エクスポートの対象にもしない */
            val profileDirectory = File(context.filesDir, "mozc/profile").apply { mkdirs() }

            if (!MozcJNI.load(profileDirectory.absolutePath, dataFile.absolutePath)) {
                Log.e(TAG, "Mozcのネイティブ初期化に失敗しました")
                return false
            }
            isNativeLoaded = true
            return true
        }

        /**
         * コマンドを1回実行する
         */
        private fun evaluate(input: Input): Output? =
            runCatching {
                /*
                 * JNIがやり取りするのは Input ではなく、それを内包する Command。
                 * 応答も Command で返るため、そこから output を取り出す。
                 */
                val request = Command.newBuilder().setInput(input).build()
                val response = MozcJNI.evalCommand(request.toByteArray())
                Command.parseFrom(response).output
            }.onFailure {
                Log.e(TAG, "Mozcのコマンド実行に失敗しました", it)
            }.getOrNull()
    }

    /**
     * このセッションの設定を整える
     *
     * 携帯端末向けの挙動にする。入力するそばから候補を出し、
     * 読みの先頭一致による部分確定を許可する。これがiOS側のAzooKeyと
     * 同じ「読み全体のN-best候補＋先頭一致の部分確定」の意味論になる。
     */
    fun configureForMobile() {
        /* 設定の反映は専用のコマンドで行う。SEND_COMMAND へ添えても永続しない */
        send(
            Input.newBuilder()
                .setType(Input.CommandType.SET_REQUEST)
                .setId(sessionId)
                .setRequest(
                    Request.newBuilder()
                        .setMixedConversion(true)
                        .setZeroQuerySuggestion(true)
                        .setAutoPartialSuggestion(true)
                        .build()
                )
                .build()
        )

        /*
         * 新しいセッションは直接入力（DIRECT）で始まる。この状態ではキーが
         * そのまま素通りし、かなの合成も変換も行われない。ひらがな入力へ切り替える。
         */
        send(
            Input.newBuilder()
                .setType(Input.CommandType.SEND_COMMAND)
                .setId(sessionId)
                .setCommand(
                    SessionCommand.newBuilder()
                        .setType(SessionCommand.CommandType.SWITCH_COMPOSITION_MODE)
                        .setCompositionMode(CompositionMode.HIRAGANA)
                        .build()
                )
                .build()
        )
    }

    /**
     * かな1文字を送る
     */
    fun sendKana(kana: String): Output? =
        send(
            Input.newBuilder()
                .setType(Input.CommandType.SEND_KEY)
                .setId(sessionId)
                .setKey(KeyEvent.newBuilder().setKeyString(kana).build())
                .build()
        )

    /**
     * 特殊キーを送る
     *
     * @param specialKey 削除やカーソル移動などの特殊キー
     */
    fun sendSpecialKey(specialKey: KeyEvent.SpecialKey): Output? =
        send(
            Input.newBuilder()
                .setType(Input.CommandType.SEND_KEY)
                .setId(sessionId)
                .setKey(KeyEvent.newBuilder().setSpecialKey(specialKey).build())
                .build()
        )

    /**
     * 候補を確定する
     *
     * 候補が読みの一部だけを消費する場合、残りは未確定のまま保持される。
     */
    fun submitCandidate(candidateId: Int): Output? =
        sendCommand(SessionCommand.CommandType.SUBMIT_CANDIDATE) {
            it.setId(candidateId)
        }

    /**
     * 未確定文字列をそのまま確定する
     */
    fun submit(): Output? = sendCommand(SessionCommand.CommandType.SUBMIT)

    /**
     * 未確定状態を破棄する
     */
    fun resetContext(): Output? = sendCommand(SessionCommand.CommandType.RESET_CONTEXT)

    /**
     * セッションを閉じる
     */
    fun close() {
        send(
            Input.newBuilder()
                .setType(Input.CommandType.DELETE_SESSION)
                .setId(sessionId)
                .build()
        )
    }

    private fun sendCommand(
        type: SessionCommand.CommandType,
        configure: (SessionCommand.Builder) -> SessionCommand.Builder = { it }
    ): Output? {
        val command = configure(SessionCommand.newBuilder().setType(type)).build()
        return send(
            Input.newBuilder()
                .setType(Input.CommandType.SEND_COMMAND)
                .setId(sessionId)
                .setCommand(command)
                .build()
        )
    }

    private fun send(input: Input): Output? = evaluate(input)
}
