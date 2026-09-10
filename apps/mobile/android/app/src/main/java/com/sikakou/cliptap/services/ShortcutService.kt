package com.sikakou.cliptap.services

import android.content.Context
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator
import android.util.Log
import android.view.inputmethod.InputConnection
import com.sikakou.cliptap.mappers.ShortcutMapper
import com.sikakou.cliptap.models.Shortcut
import com.sikakou.cliptap.models.ShortcutValue

/**
 * ショートカット管理サービス
 *
 * 【目的】
 * ショートカット（値の候補をまとめたグループ）の取得、候補推測、挿入を管理するビジネスロジック層。
 *
 * 【役割】
 * - ショートカットの取得
 * - 入力中の内容からの候補推測（ショートカット・値の並べ替え）
 * - テキストフィールドへの値の挿入
 * - 振動フィードバックと使用回数の記録
 *
 * 【候補推測の正本】
 * packages/shared/src/shortcuts/candidates.ts と
 * packages/shared/tests/shortcuts/candidates.test.ts が規則の正本。
 * このクラスはその規則を写したものなので、正本を変更するときは必ずここも同じ変更を行うこと。
 *
 * 【定型文との違い】
 * ショートカットの値には変数トークン（{{name}}など）の展開を行わない。
 * 保存された文字列をそのまま挿入する。
 *
 * 【対応するiOSファイル】
 * ios/ClipTapKeyboard/Services/ShortcutService.swift と同等
 */
class ShortcutService private constructor(private val context: Context) {

    private val shortcutMapper = ShortcutMapper.getInstance(context)

    companion object {
        private const val TAG = "ShortcutService"

        /** 挿入時の振動の長さ（ミリ秒）。定型文とショートカットで手応えを揃える */
        private const val VIBRATION_DURATION_MS = 50L

        /**
         * 入力中の内容として参照する文字数
         *
         * 【この長さにする理由】
         * カーソル直前のすべてを見ると、離れた位置に出た語で候補が動き続けて落ち着かない。
         * 「電話番号は」程度の直前の手掛かりだけを見る。
         * 正本 packages/shared/src/shortcuts/candidates.ts の SHORTCUT_CONTEXT_LENGTH と同じ値。
         */
        const val SHORTCUT_CONTEXT_LENGTH = 40

        /** ショートカット名が入力中の内容に現れたときの一致度 */
        private const val SCORE_NAME_MATCH = 2

        /** 値名が入力中の内容に現れたときの一致度 */
        private const val SCORE_VALUE_NAME_MATCH = 1

        /** 手掛かりが無いときの一致度 */
        private const val SCORE_NONE = 0

        @Volatile
        private var INSTANCE: ShortcutService? = null

        fun getInstance(context: Context): ShortcutService {
            return INSTANCE ?: synchronized(this) {
                INSTANCE ?: ShortcutService(context.applicationContext).also {
                    INSTANCE = it
                }
            }
        }
    }

    /**
     * 並べ替えの途中経過（ショートカット）
     *
     * 【元の位置を持つ理由】
     * 一致度もsortOrderも同じときに並びが揺れないよう、最後は元の位置で決める。
     */
    private data class ScoredShortcut(
        val shortcut: Shortcut,
        val index: Int,
        val score: Int
    )

    /**
     * 並べ替えの途中経過（ショートカット値）
     */
    private data class ScoredValue(
        val value: ShortcutValue,
        val index: Int,
        val score: Int
    )

    /**
     * 全ショートカットを値付きで取得
     *
     * @return ショートカット一覧（sortOrder順、値もsortOrder順）
     */
    fun getAll(): List<Shortcut> {
        return shortcutMapper.getAll()
    }

    /**
     * ショートカット一覧を表示順に並べ替えて取得
     *
     * 【何をするか】
     * 1. 保存順（sortOrder順）のショートカットを取得
     * 2. 一致度の降順 → sortOrderの昇順 → 元の位置 で並べ替える
     *
     * 【使用回数を使わない理由】
     * 利用者が決めた登録順が入力内容と無関係に入れ替わると、目で追う位置が毎回変わってしまう。
     * 使用回数は値の並べ替え（rankedValues）でのみ使う。
     *
     * 【引数名をinputContextにした理由】
     * このクラスはAndroidのContextをcontextという名前で保持しているため、
     * 同名の引数を置くと関数内で意味が入れ替わり、取り違えの原因になる。
     *
     * @param inputContext カーソル直前の入力内容
     * @return 表示順に並べ替えたショートカット一覧
     */
    fun rankedShortcuts(inputContext: String): List<Shortcut> {
        return rankShortcuts(getAll(), inputContext)
    }

    /**
     * ショートカット値の一覧を表示順に並べ替える
     *
     * 【何をするか】
     * 値名が入力中の内容に現れたものを先頭に、次に使用回数の多い順、
     * 最後にsortOrderの昇順 → 元の位置 で並べ替える。
     *
     * 【並びの意味】
     * 使用回数がすべて0で手掛かりも無い場合は登録順のまま（通常順）になる。
     *
     * @param values 保存順（sortOrder順）の値一覧
     * @param inputContext カーソル直前の入力内容
     * @return 表示順に並べ替えた値一覧
     */
    fun rankedValues(values: List<ShortcutValue>, inputContext: String): List<ShortcutValue> {
        val normalizedContext = normalizeContext(inputContext)

        val scored = values.mapIndexed { index, value ->
            ScoredValue(
                value = value,
                index = index,
                score = if (contains(normalizedContext, value.name)) {
                    SCORE_VALUE_NAME_MATCH
                } else {
                    SCORE_NONE
                }
            )
        }

        return scored
            .sortedWith(
                compareByDescending<ScoredValue> { it.score }
                    .thenByDescending { it.value.useCount }
                    .thenBy { it.value.sortOrder }
                    /* sortOrderが同値でも並びが揺れないよう、元の位置で決める */
                    .thenBy { it.index }
            )
            .map { it.value }
    }

    /**
     * ショートカット値をテキスト入力欄に挿入
     *
     * 【何をするか】
     * 1. 値（valueのみ）を挿入する。値名は挿入しない
     * 2. 振動フィードバックを実行
     * 3. 使用回数を加算し、親ショートカットの更新日時を進める
     *
     * 【変数置換を行わない理由】
     * ショートカットの値は定型文とは別物で、保存された文字列をそのまま挿入する仕様のため。
     *
     * 【iOS版との違い: フルアクセス判定が不要な理由】
     * iOSの拡張キーボードは「フルアクセスを許可」されていないと共有コンテナへ書き込めないため、
     * 使用回数の加算前に許可の有無を確かめる必要がある。
     * Androidの拡張キーボード（IME）はメインアプリと同一パッケージで動作し、
     * SharedDBもDatabase.initialize()で読み書き可能に開かれているため、この判定は存在しない。
     *
     * @param value 挿入するショートカット値
     * @param inputConnection テキストフィールドへの接続
     */
    fun insertValue(value: ShortcutValue, inputConnection: InputConnection) {
        /* 値だけを挿入（値名は挿入しない） */
        inputConnection.commitText(value.value, 1)

        if (com.sikakou.cliptap.BuildConfig.DEBUG) Log.d(TAG, "✅ Shortcut value inserted: ${value.id}")

        /* 振動フィードバック */
        performHapticFeedback()

        /* 使用回数を加算（値単位の候補推測に反映するため） */
        shortcutMapper.incrementUseCount(value.id, value.shortcutId)
    }

    /**
     * ショートカット一覧を表示順に並べ替える
     *
     * @param shortcuts 保存順（sortOrder順）のショートカット一覧
     * @param inputContext カーソル直前の入力内容
     * @return 表示順に並べ替えたショートカット一覧
     */
    private fun rankShortcuts(
        shortcuts: List<Shortcut>,
        inputContext: String
    ): List<Shortcut> {
        val normalizedContext = normalizeContext(inputContext)

        val scored = shortcuts.mapIndexed { index, shortcut ->
            ScoredShortcut(
                shortcut = shortcut,
                index = index,
                score = scoreShortcut(shortcut, normalizedContext)
            )
        }

        return scored
            .sortedWith(
                compareByDescending<ScoredShortcut> { it.score }
                    .thenBy { it.shortcut.sortOrder }
                    /* sortOrderが同値でも並びが揺れないよう、元の位置で決める */
                    .thenBy { it.index }
            )
            .map { it.shortcut }
    }

    /**
     * ショートカットの一致度を求める
     *
     * 【ショートカット名を強く見る理由】
     * 「電話番号は」と入力中なら、値名が一致しているだけの別のショートカットより
     * 「電話番号」そのものを上に出したいため。
     *
     * @param shortcut 対象のショートカット
     * @param normalizedContext 正規化済みの入力内容
     * @return 一致度（大きいほど上位）
     */
    private fun scoreShortcut(shortcut: Shortcut, normalizedContext: String): Int {
        if (contains(normalizedContext, shortcut.name)) return SCORE_NAME_MATCH
        if (shortcut.values.any { contains(normalizedContext, it.name) }) {
            return SCORE_VALUE_NAME_MATCH
        }
        return SCORE_NONE
    }

    /**
     * 入力中の内容を突き合わせ用に正規化する
     *
     * 【何をするか】
     * 末尾のSHORTCUT_CONTEXT_LENGTH文字だけを切り出し、小文字化する。
     *
     * 【小文字化する理由】
     * 英字は大小を区別せずに突き合わせるため。日本語はこの正規化の影響を受けない。
     * lowercase()は端末のロケールに依存しない（トルコ語のIなどで結果が変わらない）。
     *
     * @param inputContext カーソル直前の入力内容
     * @return 正規化した文字列
     */
    private fun normalizeContext(inputContext: String): String {
        return inputContext.takeLast(SHORTCUT_CONTEXT_LENGTH).lowercase()
    }

    /**
     * 入力中の内容にその語が含まれるか判定する
     *
     * 【空文字を対象外にする理由】
     * 空文字はどの文字列にも含まれると判定されてしまい、名前が未入力のデータが
     * 常に最上位に出てしまうため。
     *
     * @param normalizedContext 正規化済みの入力内容
     * @param term 突き合わせる語（ショートカット名または値名）
     * @return 含まれる場合はtrue
     */
    private fun contains(normalizedContext: String, term: String): Boolean {
        val trimmed = term.trim().lowercase()
        if (trimmed.isEmpty()) return false
        return normalizedContext.contains(trimmed)
    }

    /**
     * 振動フィードバック
     *
     * 【SnippetServiceと同じ実装を持つ理由】
     * 定型文の挿入とショートカットの挿入で手応えが変わると、利用者は別の操作だと感じてしまう。
     * 共通化のためにSnippetServiceへ手を入れると既存の定型文挿入の動作にも影響が出るため、
     * ここでは同じ内容（50ms・既定の強さ）を持たせて挙動を揃える。
     */
    private fun performHapticFeedback() {
        try {
            val vibrator = context.getSystemService(Context.VIBRATOR_SERVICE) as? Vibrator
            if (vibrator?.hasVibrator() == true) {
                /* VibrationEffectはAPI 26以降にしか存在しない。minSdkは24のため、
                   版を確かめずに触るとAPI 24/25でNoClassDefFoundErrorになる。
                   これはErrorであってExceptionではないので下のcatchでも拾えず、IMEごと落ちる */
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    vibrator.vibrate(
                        VibrationEffect.createOneShot(
                            VIBRATION_DURATION_MS,
                            VibrationEffect.DEFAULT_AMPLITUDE
                        )
                    )
                } else {
                    /* API 24/25向けの旧API。強さは指定できないが、長さは同じにする */
                    vibrator.vibrate(VIBRATION_DURATION_MS)
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to perform haptic feedback", e)
        }
    }
}
