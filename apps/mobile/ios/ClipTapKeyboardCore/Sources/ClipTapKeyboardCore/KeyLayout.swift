import Foundation

/**
 * キー配列のモデル
 *
 * 実際の配列データは `packages/shared/src/keyboard/layout.ts` を正本として
 * `KeyLayouts.generated.swift` へ生成される。ここではその器だけを定義する。
 * Kotlin側にも同名・同意味の型を置く。
 */

/** キー配列の識別子 */
public enum LayoutId: String, Sendable, CaseIterable {
    case qwerty
    case numbers
    case symbols
}

/**
 * キーを押したときの動作
 *
 * iOSとAndroidで同じ語彙を使う。
 */
public enum KeyAction: Equatable, Sendable {
    /** 文字を入力する */
    case input(String)
    /** 直前の1文字（未確定があればその1単位）を削除する */
    case backspace
    /** 空白を入力する。日本語入力中は変換操作を兼ねる */
    case space
    /** 改行、または入力欄が要求する確定動作を行う */
    case enter
    /** シフト（大文字・小文字の切替） */
    case shift
    /** 別のキー配列へ切り替える */
    case switchLayout(LayoutId)
    /** 他のキーボードへ切り替える。Appleが全カスタムキーボードに必須としている */
    case nextKeyboard
    /** 定型文の一覧と入力キーボードを切り替える */
    case toggleSnippetList
    /** カーソルを移動する */
    case cursor(offset: Int)
}

/**
 * 1つのキー
 */
public struct KeyDefinition: Equatable, Sendable {

    /** レイアウト内で一意。テストとアクセシビリティ識別に使う */
    public let id: String

    /** キーに表示する文字 */
    public let label: String?

    /** シフト時に表示する文字 */
    public let shiftLabel: String?

    /** 押したときの動作 */
    public let action: KeyAction

    /** シフト時の動作 */
    public let shiftAction: KeyAction?

    /** 行内の他のキーに対する相対幅。1が標準の文字キー */
    public let widthUnit: Double

    /** 文字キーではないことを示す。配色を変えるために使う */
    public let isFunction: Bool

    /** 読み上げラベルのキー。省略時はlabelを読む */
    public let accessibilityLabelKey: String?

    public init(
        id: String,
        label: String?,
        shiftLabel: String?,
        action: KeyAction,
        shiftAction: KeyAction?,
        widthUnit: Double,
        isFunction: Bool,
        accessibilityLabelKey: String?
    ) {
        self.id = id
        self.label = label
        self.shiftLabel = shiftLabel
        self.action = action
        self.shiftAction = shiftAction
        self.widthUnit = widthUnit
        self.isFunction = isFunction
        self.accessibilityLabelKey = accessibilityLabelKey
    }

    /**
     * シフト状態に応じて表示すべき文字を返す
     */
    public func displayLabel(isShifted: Bool) -> String {
        if isShifted, let shiftLabel {
            return shiftLabel
        }
        return label ?? ""
    }

    /**
     * シフト状態に応じて実行すべき動作を返す
     */
    public func resolvedAction(isShifted: Bool) -> KeyAction {
        if isShifted, let shiftAction {
            return shiftAction
        }
        return action
    }
}

/** キーの行 */
public struct KeyRow: Equatable, Sendable {

    public let keys: [KeyDefinition]

    public init(keys: [KeyDefinition]) {
        self.keys = keys
    }

    /** 行内の相対幅の合計。キーの実寸を割り付けるのに使う */
    public var totalWidthUnit: Double {
        keys.reduce(0) { $0 + $1.widthUnit }
    }
}

/** キー配列 */
public struct KeyLayout: Equatable, Sendable {

    public let id: LayoutId
    public let rows: [KeyRow]

    public init(id: LayoutId, rows: [KeyRow]) {
        self.id = id
        self.rows = rows
    }
}
