package com.google.android.apps.inputmethod.libs.mozc.session;

/**
 * Mozcネイティブライブラリへの唯一の入口。
 *
 * <p>このクラスの完全修飾名は変更できない。ネイティブ側の {@code mozcjni.cc} が
 * {@code RegisterNatives} でこの名前のクラスへメソッドを登録しているため、
 * パッケージやクラス名を変えると実行時に {@code UnsatisfiedLinkError} になる。
 *
 * <p>スレッド安全ではない。呼び出し側で直列化すること。
 */
public final class MozcJNI {

    /** ネイティブライブラリを読み込み済みか */
    private static boolean isLoaded = false;

    private MozcJNI() {
    }

    /**
     * ネイティブライブラリを読み込み、変換エンジンを初期化する。
     *
     * <p>複数回呼んでも安全。2回目以降は何もせず true を返す。
     *
     * @param userProfileDirectory 学習データなどを書き出すディレクトリの絶対パス
     * @param dataFilePath         辞書データ（libmozc_data.so として同梱）の絶対パス
     * @return 初期化に成功したか
     */
    public static synchronized boolean load(String userProfileDirectory, String dataFilePath) {
        if (isLoaded) {
            return true;
        }
        try {
            System.loadLibrary("mozc");
        } catch (UnsatisfiedLinkError error) {
            return false;
        }
        if (!onPostLoad(userProfileDirectory, dataFilePath)) {
            return false;
        }
        isLoaded = true;
        return true;
    }

    /**
     * 変換コマンドを実行する。
     *
     * @param command シリアライズ済みの {@code mozc.commands.Command}
     * @return シリアライズ済みの {@code mozc.commands.Command}（出力が詰められたもの）
     */
    public static native byte[] evalCommand(byte[] command);

    /**
     * ネイティブ側の初期化。{@link #load} からのみ呼ぶ。
     */
    private static native boolean onPostLoad(String userProfileDirectory, String dataFilePath);

    /**
     * 同梱されている辞書データのバージョン。
     *
     * <p>辞書を差し替えたときに学習データを作り直す判断へ使う。
     */
    public static native String getDataVersion();
}
