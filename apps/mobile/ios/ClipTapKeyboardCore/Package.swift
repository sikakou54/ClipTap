// swift-tools-version: 6.1
import PackageDescription

/**
 * ClipTapKeyboardCore
 *
 * 拡張キーボードの入力機能（キーレイアウト、入力状態機械、かな漢字変換）をまとめたローカルパッケージ。
 *
 * ClipTapKeyboardターゲットへSwiftファイルを直接追加するとファイルごとに
 * project.pbxprojの4セクションを手で編集する必要があり、登録漏れが実行時の
 * 静かな故障になる。パッケージとして参照すればpbxprojの編集は1回で済み、
 * あわせて `swift test` による単体テストも可能になる。
 *
 * - ClipTapKeyboardCore: 変換エンジンに依存しない純粋なロジックとUIKitビュー
 * - ClipTapKeyboardEngine: AzooKeyKanaKanjiConverterを用いた変換エンジン実装
 *
 * 2つに分ける理由は、変換エンジンを差し替え可能に保ち、エンジンを含まない
 * ロジックだけをmacOS上で高速にテストできるようにするため。
 */
let package = Package(
    name: "ClipTapKeyboardCore",
    platforms: [
        .iOS(.v17),
        .macOS(.v14)
    ],
    products: [
        .library(
            name: "ClipTapKeyboardCore",
            targets: ["ClipTapKeyboardCore"]
        ),
        .library(
            name: "ClipTapKeyboardEngine",
            targets: ["ClipTapKeyboardEngine"]
        )
    ],
    dependencies: [
        /* README推奨に従いマイナーバージョンを固定する（1.0未満はマイナー更新で破壊的変更が入るため） */
        .package(
            url: "https://github.com/azooKey/AzooKeyKanaKanjiConverter",
            .upToNextMinor(from: "0.11.2")
        )
    ],
    targets: [
        .target(
            name: "ClipTapKeyboardCore"
        ),
        .target(
            name: "ClipTapKeyboardEngine",
            dependencies: [
                "ClipTapKeyboardCore",
                .product(
                    name: "KanaKanjiConverterModuleWithDefaultDictionary",
                    package: "AzooKeyKanaKanjiConverter"
                )
            ]
        ),
        .testTarget(
            name: "ClipTapKeyboardCoreTests",
            dependencies: ["ClipTapKeyboardCore"]
        ),
        .testTarget(
            name: "ClipTapKeyboardEngineTests",
            dependencies: ["ClipTapKeyboardEngine"]
        )
    ]
)
