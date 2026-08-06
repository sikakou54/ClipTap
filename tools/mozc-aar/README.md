# mozc-aar

Android IME のかな漢字変換に使う [Mozc](https://github.com/google/mozc) を、Androidライブラリ（AAR）として固めるためのGradleプロジェクト。

## なぜAARにするのか

`.so` と辞書データを `apps/mobile/android/app/src/main/` へ直接置く方法は、このリポジトリでは成立しない。

- `expo prebuild` が `android/` を再生成するため、手で置いたファイルと `build.gradle` の編集は失われる
- EAS Build は作業ディレクトリを転送するため、50MB超のバイナリが毎回の転送に乗る

AARにして `apps/mobile/android/libs/` へ置き、Expoのconfig pluginが `flatDir` リポジトリと依存を注入する形にすれば、`expo prebuild` を何度実行しても壊れない。

## ビルド方法

ローカルではビルドしない。Bazel・Android NDK r29・Python 3.12 が必要で、ビルド領域も20GB以上使うため、
[.github/workflows/build-mozc-aar.yml](../../.github/workflows/build-mozc-aar.yml) から実行する。

```
GitHub → Actions → Build Mozc AAR → Run workflow
```

生成された `mozc-<mozcの短縮SHA>.aar` をワークフローの成果物からダウンロードし、
`apps/mobile/android/libs/` へコミットする。

## 中身

| 内容 | 由来 |
|---|---|
| `jni/<abi>/libmozc.so` | `bazelisk build package --config oss_android` の `native_libs.zip` |
| `jni/<abi>/libmozc_data.so` | `//data_manager/oss:mozc.data` を改名したもの |
| `MozcJNI` | 本プロジェクトの `src/main/java/` |
| `org.mozc.android.inputmethod.japanese.protobuf.*` | `src/protocol/*.proto` から protoc で生成 |

### 辞書データを `.so` として入れている理由

Mozcの `DataManager::CreateFromFile()` は**ファイルパス**を要求する。assetsに入れると圧縮されたアーカイブ内にあり実パスを持たないため、初回起動時に `filesDir` へ約50MBをコピーする必要が生じる（待ち時間と端末内の二重保持が発生する）。

`jniLibs` に `lib` 始まり `.so` 終わりの名前で入れると、Androidがインストール時に `nativeLibraryDir` へ実ファイルとして展開する。そのパスをそのまま渡せるため、コピー処理も待ち時間も不要になる。

### ライセンス表記の義務

Mozcのコードは BSD-3-Clause、OSS版辞書は IPAdic（NAIST）と沖縄辞書（Public Domain）に由来する。**IPAdicの著作権表示と無保証条項の同梱が必須**のため、アプリ内のライセンス画面へ掲載すること。ワークフローは `NOTICE` を成果物へ同梱する。
