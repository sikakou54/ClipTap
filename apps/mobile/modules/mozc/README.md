# mozc モジュール

Android IME のかな漢字変換に使う [Mozc](https://github.com/google/mozc) を、Expoのローカルモジュールとして取り込む。

## なぜモジュールにしているか

`expo prebuild` は `android/` を作り直すため、そこへ直接置いたネイティブライブラリやGradleの設定は失われる。Expo公式は、ネイティブの追加は `android/` を直接編集するのではなくモジュールとして持つことを推奨しており、`modules/` 配下は `android/` の外にあるためprebuildの影響を受けない。GradleへはExpoのオートリンクが自動で取り込む。

この方式なら、config pluginでの依存注入も、AAR化も、`app/build.gradle` の編集も要らない。

## ビルド成果物の置き場所

**このディレクトリの成果物はリポジトリにコミットする。** ローカルではビルドしない（Bazel・Android NDK r29・Python 3.12 が必要で、ビルド領域も20GB以上使う）。

```
android/src/main/assets/mozc.data                 辞書データ（約50MB）
android/src/main/jniLibs/<abi>/libmozc.so         変換エンジン本体
android/src/main/java/org/mozc/.../*.java         protobufの生成コード
android/src/main/java/com/google/.../MozcJNI.java ネイティブへの入口（手書き）
```

`MozcJNI` の完全修飾名は変更できない。ネイティブ側の `mozcjni.cc` が `RegisterNatives` でこの名前のクラスへメソッドを登録しているため、変えると実行時に `UnsatisfiedLinkError` になる。

## 更新方法

Mozcを更新したいときだけ、GitHub Actions の **Build Mozc** ワークフローを手動実行する。

```
GitHub → Actions → Build Mozc → Run workflow
```

成果物をダウンロードし、上記の場所へ展開してコミットする。

## 辞書データの扱い

`DataManager::CreateFromFile()` はファイルパスを要求するが、assetsの中身は圧縮アーカイブ内にあり実パスを持たない。そのため初回起動時に `filesDir` へ複製し、そのパスを渡す。複製済みかどうかは `MozcJNI.getDataVersion()` の値を控えて判定する。

各ABIの `jniLibs` へ `libmozc_data.so` として入れれば複製は不要になるが、リポジトリとAABが辞書サイズ×ABI数に膨らむため採らない。

## ライセンス表記

Mozcのコードは BSD-3-Clause、OSS版辞書は IPAdic（NAIST）と沖縄辞書（Public Domain）に由来する。**IPAdicは著作権表示と無保証条項の同梱が必須**のため、ワークフローが出力する `NOTICE-mozc.txt` をアプリ内のライセンス表示に反映すること。
