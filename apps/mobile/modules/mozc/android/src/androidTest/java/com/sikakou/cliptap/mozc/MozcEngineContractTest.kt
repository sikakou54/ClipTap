package com.sikakou.cliptap.mozc

import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith

/**
 * 実エンジンに対する契約テスト
 *
 * ネイティブライブラリの読み込み、辞書の展開、JNI越しの変換は、
 * コンパイルが通っても実行するまで確かめられない。端末上で動かして検証する。
 *
 * 変換結果の文字列そのものはエンジンの辞書と学習に左右されるため固定しない。
 * 上位の入力状態機械が前提にしてよい不変条件だけを検証する。
 * iOS側の `AzooKeyEngineContractTests` と対になる。
 */
@RunWith(AndroidJUnit4::class)
class MozcEngineContractTest {

    private lateinit var engine: MozcEngine

    @Before
    fun setUp() {
        engine = MozcEngine(InstrumentationRegistry.getInstrumentation().targetContext)
    }

    @After
    fun tearDown() {
        engine.close()
    }

    @Test
    fun 辞書を読み込める() {
        assertTrue("辞書の読み込みに失敗した", engine.load())
        /* 複数回呼んでも安全であること */
        assertTrue(engine.load())
    }

    @Test
    fun かなを入力すると未確定文字列と候補が得られる() {
        assertTrue(engine.load())

        val output = engine.insertKana("へんかん")

        assertEquals("へんかん", output.reading)
        assertTrue(output.isComposing)
        assertFalse("変換候補が1件も返らない", output.candidates.isEmpty())

        for (candidate in output.candidates) {
            assertFalse("候補の文字列が空", candidate.text.isEmpty())
        }

        /* 「変換」が候補に含まれることを、順位を問わずに確認する */
        assertTrue(
            "期待した変換候補が含まれない: ${output.candidates.map { it.text }}",
            output.candidates.any { it.text == "変換" }
        )
    }

    @Test
    fun 複数文節の変換ができる() {
        assertTrue(engine.load())

        val output = engine.insertKana("きょうはいいてんきですね")

        assertTrue(output.isComposing)
        assertFalse(output.candidates.isEmpty())
        /*
         * 変換の質はエンジンに委ねるが、候補が読みのままだけということは無いはず。
         * かな以外の文字を含む候補が1つでもあれば、かな漢字変換が働いている。
         */
        assertTrue(
            "漢字を含む候補が無い: ${output.candidates.take(5).map { it.text }}",
            output.candidates.any { candidate -> candidate.text.any { it.code in 0x4E00..0x9FFF } }
        )
    }

    @Test
    fun 一文字ずつ削除できる() {
        assertTrue(engine.load())

        engine.insertKana("あいう")
        assertEquals("あい", engine.deleteBackward().reading)
        assertEquals("あ", engine.deleteBackward().reading)
        assertEquals(EngineOutput.EMPTY, engine.deleteBackward())
        /* 空の状態でさらに削除しても壊れないこと */
        assertEquals(EngineOutput.EMPTY, engine.deleteBackward())
    }

    @Test
    fun 無変換確定は読みをそのまま返す() {
        assertTrue(engine.load())

        engine.insertKana("あいうえお")
        val result = engine.commitAsIs()

        assertEquals("あいうえお", result.committedText)
        assertEquals(EngineOutput.EMPTY, result.remaining)
        assertEquals(EngineOutput.EMPTY, engine.output)
    }

    @Test
    fun 候補を確定すると確定文字列が返る() {
        assertTrue(engine.load())

        val output = engine.insertKana("へんかん")
        assertFalse(output.candidates.isEmpty())

        val result = engine.selectCandidate(output.candidates.first().id)

        assertFalse("確定文字列が空", result.committedText.isEmpty())
    }

    @Test
    fun 存在しない候補を指定しても壊れない() {
        assertTrue(engine.load())

        engine.insertKana("あ")
        /* 例外を投げずに何らかの結果を返すこと */
        engine.selectCandidate(99999)
    }

    @Test
    fun 打鍵ごとの変換が応答目標に収まる() {
        assertTrue(engine.load())

        /* 初回は辞書を開くため遅い。定常状態を測るので計測前に一度流す */
        engine.insertKana("あ")
        engine.reset()

        val phrase = "きょうはいいてんきですね"
        val elapsed = mutableListOf<Long>()

        for (character in phrase) {
            val started = System.nanoTime()
            engine.insertKana(character.toString())
            elapsed.add((System.nanoTime() - started) / 1_000_000)
        }

        val median = elapsed.sorted()[elapsed.size / 2]
        println("📏 [応答] ${phrase.length}打鍵 中央値 ${median}ms / 各打鍵 $elapsed")

        /* 打鍵から候補表示までの目標は50ms。これを超えると入力が引っかかる */
        assertTrue("打鍵ごとの変換の中央値が${median}msで目標50msを超えた", median < 50)
    }
}
