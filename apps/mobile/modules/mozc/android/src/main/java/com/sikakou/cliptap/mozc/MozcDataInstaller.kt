package com.sikakou.cliptap.mozc

import android.content.Context
import android.util.Log
import java.io.File

/**
 * 辞書データを端末内へ展開する
 *
 * Mozcの `DataManager::CreateFromFile()` はファイルパスを要求するが、
 * assetsの中身は圧縮アーカイブ内にあり実パスを持たない。
 * そのため初回だけ `filesDir` へ複製し、そのパスを渡す。
 *
 * 各ABIのjniLibsへ `libmozc_data.so` として入れれば複製は不要になるが、
 * リポジトリとAABが辞書サイズ×ABI数に膨らむため採らない。
 */
object MozcDataInstaller {

    private const val TAG = "MozcDataInstaller"

    /** assets内の辞書データ */
    private const val ASSET_NAME = "mozc.data"

    /** 展開先のディレクトリ名 */
    private const val DIRECTORY_NAME = "mozc"

    /**
     * 展開済みの辞書データを返す。無ければ展開する。
     *
     * @return 辞書データのファイル。展開に失敗した場合はnull
     */
    fun ensureInstalled(context: Context): File? {
        val directory = File(context.filesDir, DIRECTORY_NAME)
        val target = File(directory, ASSET_NAME)

        /*
         * 展開済みかどうかはファイルサイズで判定する。
         * 展開中に強制終了した場合、中途半端なファイルが残るため、
         * assets側と大きさが一致することまで確かめる。
         */
        val expectedSize = assetSize(context)
        if (target.exists() && expectedSize > 0 && target.length() == expectedSize) {
            return target
        }

        if (!directory.exists() && !directory.mkdirs()) {
            Log.e(TAG, "辞書の展開先を作成できません: $directory")
            return null
        }

        return runCatching {
            /* 途中で失敗したファイルを次回に使わないよう、一時ファイル経由で置き換える */
            val temporary = File(directory, "$ASSET_NAME.tmp")
            context.assets.open(ASSET_NAME).use { input ->
                temporary.outputStream().use { output ->
                    input.copyTo(output)
                }
            }
            if (!temporary.renameTo(target)) {
                temporary.delete()
                error("辞書データを配置できません: $target")
            }
            target
        }.onFailure {
            Log.e(TAG, "辞書データの展開に失敗しました", it)
        }.getOrNull()
    }

    /**
     * assets内の辞書データの大きさ
     *
     * 展開済みかどうかの判定に使う。取得できない場合は0を返す。
     */
    private fun assetSize(context: Context): Long =
        runCatching {
            context.assets.openFd(ASSET_NAME).use { it.length }
        }.getOrElse {
            /* 圧縮されているとopenFdが使えない。その場合は判定に使わない */
            0L
        }
}
