// このファイルは自動生成されています。直接編集しないでください。
//
// 正本: packages/shared/src/keyboard/layout.ts
// 生成: node scripts/gen-keyboard-layouts.mjs
//
// キー配列をiOSとAndroidへ二重に手書きすると必ず片方だけがズレるため、
// TypeScriptの正本から生成しています。配列を変えるときは正本を編集し、
// このスクリプトを実行してください。

/**
 * 生成されたキー配列
 */
public enum KeyLayouts {

    /** qwerty 配列 */
    public static let qwerty = KeyLayout(
        id: .qwerty,
        rows: [
            KeyRow(keys: [
                    KeyDefinition(id: "key_q", label: "q", shiftLabel: "Q", action: .input("q"), shiftAction: .input("Q"), widthUnit: 1, isFunction: false, accessibilityLabelKey: nil, visibility: .always, rowSpan: 1, isSpacer: false, flick: [:]),
                    KeyDefinition(id: "key_w", label: "w", shiftLabel: "W", action: .input("w"), shiftAction: .input("W"), widthUnit: 1, isFunction: false, accessibilityLabelKey: nil, visibility: .always, rowSpan: 1, isSpacer: false, flick: [:]),
                    KeyDefinition(id: "key_e", label: "e", shiftLabel: "E", action: .input("e"), shiftAction: .input("E"), widthUnit: 1, isFunction: false, accessibilityLabelKey: nil, visibility: .always, rowSpan: 1, isSpacer: false, flick: [:]),
                    KeyDefinition(id: "key_r", label: "r", shiftLabel: "R", action: .input("r"), shiftAction: .input("R"), widthUnit: 1, isFunction: false, accessibilityLabelKey: nil, visibility: .always, rowSpan: 1, isSpacer: false, flick: [:]),
                    KeyDefinition(id: "key_t", label: "t", shiftLabel: "T", action: .input("t"), shiftAction: .input("T"), widthUnit: 1, isFunction: false, accessibilityLabelKey: nil, visibility: .always, rowSpan: 1, isSpacer: false, flick: [:]),
                    KeyDefinition(id: "key_y", label: "y", shiftLabel: "Y", action: .input("y"), shiftAction: .input("Y"), widthUnit: 1, isFunction: false, accessibilityLabelKey: nil, visibility: .always, rowSpan: 1, isSpacer: false, flick: [:]),
                    KeyDefinition(id: "key_u", label: "u", shiftLabel: "U", action: .input("u"), shiftAction: .input("U"), widthUnit: 1, isFunction: false, accessibilityLabelKey: nil, visibility: .always, rowSpan: 1, isSpacer: false, flick: [:]),
                    KeyDefinition(id: "key_i", label: "i", shiftLabel: "I", action: .input("i"), shiftAction: .input("I"), widthUnit: 1, isFunction: false, accessibilityLabelKey: nil, visibility: .always, rowSpan: 1, isSpacer: false, flick: [:]),
                    KeyDefinition(id: "key_o", label: "o", shiftLabel: "O", action: .input("o"), shiftAction: .input("O"), widthUnit: 1, isFunction: false, accessibilityLabelKey: nil, visibility: .always, rowSpan: 1, isSpacer: false, flick: [:]),
                    KeyDefinition(id: "key_p", label: "p", shiftLabel: "P", action: .input("p"), shiftAction: .input("P"), widthUnit: 1, isFunction: false, accessibilityLabelKey: nil, visibility: .always, rowSpan: 1, isSpacer: false, flick: [:])
            ]),
            KeyRow(keys: [
                    KeyDefinition(id: "key_a", label: "a", shiftLabel: "A", action: .input("a"), shiftAction: .input("A"), widthUnit: 1, isFunction: false, accessibilityLabelKey: nil, visibility: .always, rowSpan: 1, isSpacer: false, flick: [:]),
                    KeyDefinition(id: "key_s", label: "s", shiftLabel: "S", action: .input("s"), shiftAction: .input("S"), widthUnit: 1, isFunction: false, accessibilityLabelKey: nil, visibility: .always, rowSpan: 1, isSpacer: false, flick: [:]),
                    KeyDefinition(id: "key_d", label: "d", shiftLabel: "D", action: .input("d"), shiftAction: .input("D"), widthUnit: 1, isFunction: false, accessibilityLabelKey: nil, visibility: .always, rowSpan: 1, isSpacer: false, flick: [:]),
                    KeyDefinition(id: "key_f", label: "f", shiftLabel: "F", action: .input("f"), shiftAction: .input("F"), widthUnit: 1, isFunction: false, accessibilityLabelKey: nil, visibility: .always, rowSpan: 1, isSpacer: false, flick: [:]),
                    KeyDefinition(id: "key_g", label: "g", shiftLabel: "G", action: .input("g"), shiftAction: .input("G"), widthUnit: 1, isFunction: false, accessibilityLabelKey: nil, visibility: .always, rowSpan: 1, isSpacer: false, flick: [:]),
                    KeyDefinition(id: "key_h", label: "h", shiftLabel: "H", action: .input("h"), shiftAction: .input("H"), widthUnit: 1, isFunction: false, accessibilityLabelKey: nil, visibility: .always, rowSpan: 1, isSpacer: false, flick: [:]),
                    KeyDefinition(id: "key_j", label: "j", shiftLabel: "J", action: .input("j"), shiftAction: .input("J"), widthUnit: 1, isFunction: false, accessibilityLabelKey: nil, visibility: .always, rowSpan: 1, isSpacer: false, flick: [:]),
                    KeyDefinition(id: "key_k", label: "k", shiftLabel: "K", action: .input("k"), shiftAction: .input("K"), widthUnit: 1, isFunction: false, accessibilityLabelKey: nil, visibility: .always, rowSpan: 1, isSpacer: false, flick: [:]),
                    KeyDefinition(id: "key_l", label: "l", shiftLabel: "L", action: .input("l"), shiftAction: .input("L"), widthUnit: 1, isFunction: false, accessibilityLabelKey: nil, visibility: .always, rowSpan: 1, isSpacer: false, flick: [:])
            ]),
            KeyRow(keys: [
                    KeyDefinition(id: "shift", label: "⇧", shiftLabel: nil, action: .shift, shiftAction: nil, widthUnit: 1.5, isFunction: true, accessibilityLabelKey: "accessibility.key.shift", visibility: .always, rowSpan: 1, isSpacer: false, flick: [:]),
                    KeyDefinition(id: "key_z", label: "z", shiftLabel: "Z", action: .input("z"), shiftAction: .input("Z"), widthUnit: 1, isFunction: false, accessibilityLabelKey: nil, visibility: .always, rowSpan: 1, isSpacer: false, flick: [:]),
                    KeyDefinition(id: "key_x", label: "x", shiftLabel: "X", action: .input("x"), shiftAction: .input("X"), widthUnit: 1, isFunction: false, accessibilityLabelKey: nil, visibility: .always, rowSpan: 1, isSpacer: false, flick: [:]),
                    KeyDefinition(id: "key_c", label: "c", shiftLabel: "C", action: .input("c"), shiftAction: .input("C"), widthUnit: 1, isFunction: false, accessibilityLabelKey: nil, visibility: .always, rowSpan: 1, isSpacer: false, flick: [:]),
                    KeyDefinition(id: "key_v", label: "v", shiftLabel: "V", action: .input("v"), shiftAction: .input("V"), widthUnit: 1, isFunction: false, accessibilityLabelKey: nil, visibility: .always, rowSpan: 1, isSpacer: false, flick: [:]),
                    KeyDefinition(id: "key_b", label: "b", shiftLabel: "B", action: .input("b"), shiftAction: .input("B"), widthUnit: 1, isFunction: false, accessibilityLabelKey: nil, visibility: .always, rowSpan: 1, isSpacer: false, flick: [:]),
                    KeyDefinition(id: "key_n", label: "n", shiftLabel: "N", action: .input("n"), shiftAction: .input("N"), widthUnit: 1, isFunction: false, accessibilityLabelKey: nil, visibility: .always, rowSpan: 1, isSpacer: false, flick: [:]),
                    KeyDefinition(id: "key_m", label: "m", shiftLabel: "M", action: .input("m"), shiftAction: .input("M"), widthUnit: 1, isFunction: false, accessibilityLabelKey: nil, visibility: .always, rowSpan: 1, isSpacer: false, flick: [:]),
                    KeyDefinition(id: "backspace", label: "⌫", shiftLabel: nil, action: .backspace, shiftAction: nil, widthUnit: 1.5, isFunction: true, accessibilityLabelKey: "accessibility.key.backspace", visibility: .always, rowSpan: 1, isSpacer: false, flick: [:])
            ]),
            KeyRow(keys: [
                    KeyDefinition(id: "switch_numbers", label: "123", shiftLabel: nil, action: .switchLayout(.numbers), shiftAction: nil, widthUnit: 1.5, isFunction: true, accessibilityLabelKey: "accessibility.key.switch_numbers", visibility: .always, rowSpan: 1, isSpacer: false, flick: [:]),
                    KeyDefinition(id: "next_keyboard", label: "🌐", shiftLabel: nil, action: .nextKeyboard, shiftAction: nil, widthUnit: 1, isFunction: true, accessibilityLabelKey: "accessibility.key.next_keyboard", visibility: .needsInputModeSwitch, rowSpan: 1, isSpacer: false, flick: [:]),
                    KeyDefinition(id: "switch_flick", label: "あ", shiftLabel: nil, action: .switchLayout(.flick), shiftAction: nil, widthUnit: 1.5, isFunction: true, accessibilityLabelKey: "accessibility.key.switch_flick", visibility: .always, rowSpan: 1, isSpacer: false, flick: [:]),
                    KeyDefinition(id: "space", label: " ", shiftLabel: nil, action: .space, shiftAction: nil, widthUnit: 3.5, isFunction: true, accessibilityLabelKey: "accessibility.key.space", visibility: .always, rowSpan: 1, isSpacer: false, flick: [:]),
                    KeyDefinition(id: "enter", label: "⏎", shiftLabel: nil, action: .enter, shiftAction: nil, widthUnit: 1.5, isFunction: true, accessibilityLabelKey: "accessibility.key.enter", visibility: .always, rowSpan: 1, isSpacer: false, flick: [:])
            ])
        ]
    )

    /** numbers 配列 */
    public static let numbers = KeyLayout(
        id: .numbers,
        rows: [
            KeyRow(keys: [
                    KeyDefinition(id: "key_1", label: "1", shiftLabel: "1", action: .input("1"), shiftAction: .input("1"), widthUnit: 1, isFunction: false, accessibilityLabelKey: nil, visibility: .always, rowSpan: 1, isSpacer: false, flick: [:]),
                    KeyDefinition(id: "key_2", label: "2", shiftLabel: "2", action: .input("2"), shiftAction: .input("2"), widthUnit: 1, isFunction: false, accessibilityLabelKey: nil, visibility: .always, rowSpan: 1, isSpacer: false, flick: [:]),
                    KeyDefinition(id: "key_3", label: "3", shiftLabel: "3", action: .input("3"), shiftAction: .input("3"), widthUnit: 1, isFunction: false, accessibilityLabelKey: nil, visibility: .always, rowSpan: 1, isSpacer: false, flick: [:]),
                    KeyDefinition(id: "key_4", label: "4", shiftLabel: "4", action: .input("4"), shiftAction: .input("4"), widthUnit: 1, isFunction: false, accessibilityLabelKey: nil, visibility: .always, rowSpan: 1, isSpacer: false, flick: [:]),
                    KeyDefinition(id: "key_5", label: "5", shiftLabel: "5", action: .input("5"), shiftAction: .input("5"), widthUnit: 1, isFunction: false, accessibilityLabelKey: nil, visibility: .always, rowSpan: 1, isSpacer: false, flick: [:]),
                    KeyDefinition(id: "key_6", label: "6", shiftLabel: "6", action: .input("6"), shiftAction: .input("6"), widthUnit: 1, isFunction: false, accessibilityLabelKey: nil, visibility: .always, rowSpan: 1, isSpacer: false, flick: [:]),
                    KeyDefinition(id: "key_7", label: "7", shiftLabel: "7", action: .input("7"), shiftAction: .input("7"), widthUnit: 1, isFunction: false, accessibilityLabelKey: nil, visibility: .always, rowSpan: 1, isSpacer: false, flick: [:]),
                    KeyDefinition(id: "key_8", label: "8", shiftLabel: "8", action: .input("8"), shiftAction: .input("8"), widthUnit: 1, isFunction: false, accessibilityLabelKey: nil, visibility: .always, rowSpan: 1, isSpacer: false, flick: [:]),
                    KeyDefinition(id: "key_9", label: "9", shiftLabel: "9", action: .input("9"), shiftAction: .input("9"), widthUnit: 1, isFunction: false, accessibilityLabelKey: nil, visibility: .always, rowSpan: 1, isSpacer: false, flick: [:]),
                    KeyDefinition(id: "key_0", label: "0", shiftLabel: "0", action: .input("0"), shiftAction: .input("0"), widthUnit: 1, isFunction: false, accessibilityLabelKey: nil, visibility: .always, rowSpan: 1, isSpacer: false, flick: [:])
            ]),
            KeyRow(keys: [
                    KeyDefinition(id: "key_-", label: "-", shiftLabel: "-", action: .input("-"), shiftAction: .input("-"), widthUnit: 1, isFunction: false, accessibilityLabelKey: nil, visibility: .always, rowSpan: 1, isSpacer: false, flick: [:]),
                    KeyDefinition(id: "key_/", label: "/", shiftLabel: "/", action: .input("/"), shiftAction: .input("/"), widthUnit: 1, isFunction: false, accessibilityLabelKey: nil, visibility: .always, rowSpan: 1, isSpacer: false, flick: [:]),
                    KeyDefinition(id: "key_:", label: ":", shiftLabel: ":", action: .input(":"), shiftAction: .input(":"), widthUnit: 1, isFunction: false, accessibilityLabelKey: nil, visibility: .always, rowSpan: 1, isSpacer: false, flick: [:]),
                    KeyDefinition(id: "key_;", label: ";", shiftLabel: ";", action: .input(";"), shiftAction: .input(";"), widthUnit: 1, isFunction: false, accessibilityLabelKey: nil, visibility: .always, rowSpan: 1, isSpacer: false, flick: [:]),
                    KeyDefinition(id: "key_(", label: "(", shiftLabel: "(", action: .input("("), shiftAction: .input("("), widthUnit: 1, isFunction: false, accessibilityLabelKey: nil, visibility: .always, rowSpan: 1, isSpacer: false, flick: [:]),
                    KeyDefinition(id: "key_)", label: ")", shiftLabel: ")", action: .input(")"), shiftAction: .input(")"), widthUnit: 1, isFunction: false, accessibilityLabelKey: nil, visibility: .always, rowSpan: 1, isSpacer: false, flick: [:]),
                    KeyDefinition(id: "key_¥", label: "¥", shiftLabel: "¥", action: .input("¥"), shiftAction: .input("¥"), widthUnit: 1, isFunction: false, accessibilityLabelKey: nil, visibility: .always, rowSpan: 1, isSpacer: false, flick: [:]),
                    KeyDefinition(id: "key_&", label: "&", shiftLabel: "&", action: .input("&"), shiftAction: .input("&"), widthUnit: 1, isFunction: false, accessibilityLabelKey: nil, visibility: .always, rowSpan: 1, isSpacer: false, flick: [:]),
                    KeyDefinition(id: "key_@", label: "@", shiftLabel: "@", action: .input("@"), shiftAction: .input("@"), widthUnit: 1, isFunction: false, accessibilityLabelKey: nil, visibility: .always, rowSpan: 1, isSpacer: false, flick: [:]),
                    KeyDefinition(id: "key_\"", label: "\"", shiftLabel: "\"", action: .input("\""), shiftAction: .input("\""), widthUnit: 1, isFunction: false, accessibilityLabelKey: nil, visibility: .always, rowSpan: 1, isSpacer: false, flick: [:])
            ]),
            KeyRow(keys: [
                    KeyDefinition(id: "switch_symbols", label: "#+=", shiftLabel: nil, action: .switchLayout(.symbols), shiftAction: nil, widthUnit: 1.5, isFunction: true, accessibilityLabelKey: "accessibility.key.switch_symbols", visibility: .always, rowSpan: 1, isSpacer: false, flick: [:]),
                    KeyDefinition(id: "key_.", label: ".", shiftLabel: ".", action: .input("."), shiftAction: .input("."), widthUnit: 1, isFunction: false, accessibilityLabelKey: nil, visibility: .always, rowSpan: 1, isSpacer: false, flick: [:]),
                    KeyDefinition(id: "key_,", label: ",", shiftLabel: ",", action: .input(","), shiftAction: .input(","), widthUnit: 1, isFunction: false, accessibilityLabelKey: nil, visibility: .always, rowSpan: 1, isSpacer: false, flick: [:]),
                    KeyDefinition(id: "key_?", label: "?", shiftLabel: "?", action: .input("?"), shiftAction: .input("?"), widthUnit: 1, isFunction: false, accessibilityLabelKey: nil, visibility: .always, rowSpan: 1, isSpacer: false, flick: [:]),
                    KeyDefinition(id: "key_!", label: "!", shiftLabel: "!", action: .input("!"), shiftAction: .input("!"), widthUnit: 1, isFunction: false, accessibilityLabelKey: nil, visibility: .always, rowSpan: 1, isSpacer: false, flick: [:]),
                    KeyDefinition(id: "key_'", label: "'", shiftLabel: "'", action: .input("'"), shiftAction: .input("'"), widthUnit: 1, isFunction: false, accessibilityLabelKey: nil, visibility: .always, rowSpan: 1, isSpacer: false, flick: [:]),
                    KeyDefinition(id: "backspace", label: "⌫", shiftLabel: nil, action: .backspace, shiftAction: nil, widthUnit: 1.5, isFunction: true, accessibilityLabelKey: "accessibility.key.backspace", visibility: .always, rowSpan: 1, isSpacer: false, flick: [:])
            ]),
            KeyRow(keys: [
                    KeyDefinition(id: "switch_qwerty", label: "ABC", shiftLabel: nil, action: .switchLayout(.qwerty), shiftAction: nil, widthUnit: 1.5, isFunction: true, accessibilityLabelKey: "accessibility.key.switch_qwerty", visibility: .always, rowSpan: 1, isSpacer: false, flick: [:]),
                    KeyDefinition(id: "next_keyboard", label: "🌐", shiftLabel: nil, action: .nextKeyboard, shiftAction: nil, widthUnit: 1, isFunction: true, accessibilityLabelKey: "accessibility.key.next_keyboard", visibility: .needsInputModeSwitch, rowSpan: 1, isSpacer: false, flick: [:]),
                    KeyDefinition(id: "space", label: " ", shiftLabel: nil, action: .space, shiftAction: nil, widthUnit: 5, isFunction: true, accessibilityLabelKey: "accessibility.key.space", visibility: .always, rowSpan: 1, isSpacer: false, flick: [:]),
                    KeyDefinition(id: "enter", label: "⏎", shiftLabel: nil, action: .enter, shiftAction: nil, widthUnit: 1.5, isFunction: true, accessibilityLabelKey: "accessibility.key.enter", visibility: .always, rowSpan: 1, isSpacer: false, flick: [:])
            ])
        ]
    )

    /** symbols 配列 */
    public static let symbols = KeyLayout(
        id: .symbols,
        rows: [
            KeyRow(keys: [
                    KeyDefinition(id: "key_[", label: "[", shiftLabel: "[", action: .input("["), shiftAction: .input("["), widthUnit: 1, isFunction: false, accessibilityLabelKey: nil, visibility: .always, rowSpan: 1, isSpacer: false, flick: [:]),
                    KeyDefinition(id: "key_]", label: "]", shiftLabel: "]", action: .input("]"), shiftAction: .input("]"), widthUnit: 1, isFunction: false, accessibilityLabelKey: nil, visibility: .always, rowSpan: 1, isSpacer: false, flick: [:]),
                    KeyDefinition(id: "key_{", label: "{", shiftLabel: "{", action: .input("{"), shiftAction: .input("{"), widthUnit: 1, isFunction: false, accessibilityLabelKey: nil, visibility: .always, rowSpan: 1, isSpacer: false, flick: [:]),
                    KeyDefinition(id: "key_}", label: "}", shiftLabel: "}", action: .input("}"), shiftAction: .input("}"), widthUnit: 1, isFunction: false, accessibilityLabelKey: nil, visibility: .always, rowSpan: 1, isSpacer: false, flick: [:]),
                    KeyDefinition(id: "key_#", label: "#", shiftLabel: "#", action: .input("#"), shiftAction: .input("#"), widthUnit: 1, isFunction: false, accessibilityLabelKey: nil, visibility: .always, rowSpan: 1, isSpacer: false, flick: [:]),
                    KeyDefinition(id: "key_%", label: "%", shiftLabel: "%", action: .input("%"), shiftAction: .input("%"), widthUnit: 1, isFunction: false, accessibilityLabelKey: nil, visibility: .always, rowSpan: 1, isSpacer: false, flick: [:]),
                    KeyDefinition(id: "key_^", label: "^", shiftLabel: "^", action: .input("^"), shiftAction: .input("^"), widthUnit: 1, isFunction: false, accessibilityLabelKey: nil, visibility: .always, rowSpan: 1, isSpacer: false, flick: [:]),
                    KeyDefinition(id: "key_*", label: "*", shiftLabel: "*", action: .input("*"), shiftAction: .input("*"), widthUnit: 1, isFunction: false, accessibilityLabelKey: nil, visibility: .always, rowSpan: 1, isSpacer: false, flick: [:]),
                    KeyDefinition(id: "key_+", label: "+", shiftLabel: "+", action: .input("+"), shiftAction: .input("+"), widthUnit: 1, isFunction: false, accessibilityLabelKey: nil, visibility: .always, rowSpan: 1, isSpacer: false, flick: [:]),
                    KeyDefinition(id: "key_=", label: "=", shiftLabel: "=", action: .input("="), shiftAction: .input("="), widthUnit: 1, isFunction: false, accessibilityLabelKey: nil, visibility: .always, rowSpan: 1, isSpacer: false, flick: [:])
            ]),
            KeyRow(keys: [
                    KeyDefinition(id: "key__", label: "_", shiftLabel: "_", action: .input("_"), shiftAction: .input("_"), widthUnit: 1, isFunction: false, accessibilityLabelKey: nil, visibility: .always, rowSpan: 1, isSpacer: false, flick: [:]),
                    KeyDefinition(id: "key_\\", label: "\\", shiftLabel: "\\", action: .input("\\"), shiftAction: .input("\\"), widthUnit: 1, isFunction: false, accessibilityLabelKey: nil, visibility: .always, rowSpan: 1, isSpacer: false, flick: [:]),
                    KeyDefinition(id: "key_|", label: "|", shiftLabel: "|", action: .input("|"), shiftAction: .input("|"), widthUnit: 1, isFunction: false, accessibilityLabelKey: nil, visibility: .always, rowSpan: 1, isSpacer: false, flick: [:]),
                    KeyDefinition(id: "key_~", label: "~", shiftLabel: "~", action: .input("~"), shiftAction: .input("~"), widthUnit: 1, isFunction: false, accessibilityLabelKey: nil, visibility: .always, rowSpan: 1, isSpacer: false, flick: [:]),
                    KeyDefinition(id: "key_<", label: "<", shiftLabel: "<", action: .input("<"), shiftAction: .input("<"), widthUnit: 1, isFunction: false, accessibilityLabelKey: nil, visibility: .always, rowSpan: 1, isSpacer: false, flick: [:]),
                    KeyDefinition(id: "key_>", label: ">", shiftLabel: ">", action: .input(">"), shiftAction: .input(">"), widthUnit: 1, isFunction: false, accessibilityLabelKey: nil, visibility: .always, rowSpan: 1, isSpacer: false, flick: [:]),
                    KeyDefinition(id: "key_$", label: "$", shiftLabel: "$", action: .input("$"), shiftAction: .input("$"), widthUnit: 1, isFunction: false, accessibilityLabelKey: nil, visibility: .always, rowSpan: 1, isSpacer: false, flick: [:]),
                    KeyDefinition(id: "key_£", label: "£", shiftLabel: "£", action: .input("£"), shiftAction: .input("£"), widthUnit: 1, isFunction: false, accessibilityLabelKey: nil, visibility: .always, rowSpan: 1, isSpacer: false, flick: [:]),
                    KeyDefinition(id: "key_€", label: "€", shiftLabel: "€", action: .input("€"), shiftAction: .input("€"), widthUnit: 1, isFunction: false, accessibilityLabelKey: nil, visibility: .always, rowSpan: 1, isSpacer: false, flick: [:]),
                    KeyDefinition(id: "key_•", label: "•", shiftLabel: "•", action: .input("•"), shiftAction: .input("•"), widthUnit: 1, isFunction: false, accessibilityLabelKey: nil, visibility: .always, rowSpan: 1, isSpacer: false, flick: [:])
            ]),
            KeyRow(keys: [
                    KeyDefinition(id: "switch_numbers", label: "123", shiftLabel: nil, action: .switchLayout(.numbers), shiftAction: nil, widthUnit: 1.5, isFunction: true, accessibilityLabelKey: "accessibility.key.switch_numbers", visibility: .always, rowSpan: 1, isSpacer: false, flick: [:]),
                    KeyDefinition(id: "key_.", label: ".", shiftLabel: ".", action: .input("."), shiftAction: .input("."), widthUnit: 1, isFunction: false, accessibilityLabelKey: nil, visibility: .always, rowSpan: 1, isSpacer: false, flick: [:]),
                    KeyDefinition(id: "key_,", label: ",", shiftLabel: ",", action: .input(","), shiftAction: .input(","), widthUnit: 1, isFunction: false, accessibilityLabelKey: nil, visibility: .always, rowSpan: 1, isSpacer: false, flick: [:]),
                    KeyDefinition(id: "key_?", label: "?", shiftLabel: "?", action: .input("?"), shiftAction: .input("?"), widthUnit: 1, isFunction: false, accessibilityLabelKey: nil, visibility: .always, rowSpan: 1, isSpacer: false, flick: [:]),
                    KeyDefinition(id: "key_!", label: "!", shiftLabel: "!", action: .input("!"), shiftAction: .input("!"), widthUnit: 1, isFunction: false, accessibilityLabelKey: nil, visibility: .always, rowSpan: 1, isSpacer: false, flick: [:]),
                    KeyDefinition(id: "key_'", label: "'", shiftLabel: "'", action: .input("'"), shiftAction: .input("'"), widthUnit: 1, isFunction: false, accessibilityLabelKey: nil, visibility: .always, rowSpan: 1, isSpacer: false, flick: [:]),
                    KeyDefinition(id: "backspace", label: "⌫", shiftLabel: nil, action: .backspace, shiftAction: nil, widthUnit: 1.5, isFunction: true, accessibilityLabelKey: "accessibility.key.backspace", visibility: .always, rowSpan: 1, isSpacer: false, flick: [:])
            ]),
            KeyRow(keys: [
                    KeyDefinition(id: "switch_qwerty", label: "ABC", shiftLabel: nil, action: .switchLayout(.qwerty), shiftAction: nil, widthUnit: 1.5, isFunction: true, accessibilityLabelKey: "accessibility.key.switch_qwerty", visibility: .always, rowSpan: 1, isSpacer: false, flick: [:]),
                    KeyDefinition(id: "next_keyboard", label: "🌐", shiftLabel: nil, action: .nextKeyboard, shiftAction: nil, widthUnit: 1, isFunction: true, accessibilityLabelKey: "accessibility.key.next_keyboard", visibility: .needsInputModeSwitch, rowSpan: 1, isSpacer: false, flick: [:]),
                    KeyDefinition(id: "space", label: " ", shiftLabel: nil, action: .space, shiftAction: nil, widthUnit: 5, isFunction: true, accessibilityLabelKey: "accessibility.key.space", visibility: .always, rowSpan: 1, isSpacer: false, flick: [:]),
                    KeyDefinition(id: "enter", label: "⏎", shiftLabel: nil, action: .enter, shiftAction: nil, widthUnit: 1.5, isFunction: true, accessibilityLabelKey: "accessibility.key.enter", visibility: .always, rowSpan: 1, isSpacer: false, flick: [:])
            ])
        ]
    )

    /** flick 配列 */
    public static let flick = KeyLayout(
        id: .flick,
        rows: [
            KeyRow(keys: [
                    KeyDefinition(id: "spacer_cursor", label: nil, shiftLabel: nil, action: .noop, shiftAction: nil, widthUnit: 1, isFunction: false, accessibilityLabelKey: nil, visibility: .always, rowSpan: 1, isSpacer: true, flick: [:]),
                    KeyDefinition(id: "flick_a", label: "あ", shiftLabel: nil, action: .input("あ"), shiftAction: nil, widthUnit: 1, isFunction: false, accessibilityLabelKey: nil, visibility: .always, rowSpan: 1, isSpacer: false, flick: [.left: .input("い"), .up: .input("う"), .right: .input("え"), .down: .input("お")]),
                    KeyDefinition(id: "flick_ka", label: "か", shiftLabel: nil, action: .input("か"), shiftAction: nil, widthUnit: 1, isFunction: false, accessibilityLabelKey: nil, visibility: .always, rowSpan: 1, isSpacer: false, flick: [.left: .input("き"), .up: .input("く"), .right: .input("け"), .down: .input("こ")]),
                    KeyDefinition(id: "flick_sa", label: "さ", shiftLabel: nil, action: .input("さ"), shiftAction: nil, widthUnit: 1, isFunction: false, accessibilityLabelKey: nil, visibility: .always, rowSpan: 1, isSpacer: false, flick: [.left: .input("し"), .up: .input("す"), .right: .input("せ"), .down: .input("そ")]),
                    KeyDefinition(id: "backspace", label: "⌫", shiftLabel: nil, action: .backspace, shiftAction: nil, widthUnit: 1, isFunction: true, accessibilityLabelKey: "accessibility.key.backspace", visibility: .always, rowSpan: 1, isSpacer: false, flick: [:])
            ]),
            KeyRow(keys: [
                    KeyDefinition(id: "switch_numbers", label: "☆123", shiftLabel: nil, action: .switchLayout(.numbers), shiftAction: nil, widthUnit: 1, isFunction: true, accessibilityLabelKey: "accessibility.key.switch_numbers", visibility: .always, rowSpan: 1, isSpacer: false, flick: [:]),
                    KeyDefinition(id: "flick_ta", label: "た", shiftLabel: nil, action: .input("た"), shiftAction: nil, widthUnit: 1, isFunction: false, accessibilityLabelKey: nil, visibility: .always, rowSpan: 1, isSpacer: false, flick: [.left: .input("ち"), .up: .input("つ"), .right: .input("て"), .down: .input("と")]),
                    KeyDefinition(id: "flick_na", label: "な", shiftLabel: nil, action: .input("な"), shiftAction: nil, widthUnit: 1, isFunction: false, accessibilityLabelKey: nil, visibility: .always, rowSpan: 1, isSpacer: false, flick: [.left: .input("に"), .up: .input("ぬ"), .right: .input("ね"), .down: .input("の")]),
                    KeyDefinition(id: "flick_ha", label: "は", shiftLabel: nil, action: .input("は"), shiftAction: nil, widthUnit: 1, isFunction: false, accessibilityLabelKey: nil, visibility: .always, rowSpan: 1, isSpacer: false, flick: [.left: .input("ひ"), .up: .input("ふ"), .right: .input("へ"), .down: .input("ほ")]),
                    KeyDefinition(id: "space", label: "空白", shiftLabel: nil, action: .space, shiftAction: nil, widthUnit: 1, isFunction: true, accessibilityLabelKey: "accessibility.key.space", visibility: .always, rowSpan: 1, isSpacer: false, flick: [:])
            ]),
            KeyRow(keys: [
                    KeyDefinition(id: "switch_qwerty", label: "ABC", shiftLabel: nil, action: .switchLayout(.qwerty), shiftAction: nil, widthUnit: 1, isFunction: true, accessibilityLabelKey: "accessibility.key.switch_qwerty", visibility: .always, rowSpan: 1, isSpacer: false, flick: [:]),
                    KeyDefinition(id: "flick_ma", label: "ま", shiftLabel: nil, action: .input("ま"), shiftAction: nil, widthUnit: 1, isFunction: false, accessibilityLabelKey: nil, visibility: .always, rowSpan: 1, isSpacer: false, flick: [.left: .input("み"), .up: .input("む"), .right: .input("め"), .down: .input("も")]),
                    KeyDefinition(id: "flick_ya", label: "や", shiftLabel: nil, action: .input("や"), shiftAction: nil, widthUnit: 1, isFunction: false, accessibilityLabelKey: nil, visibility: .always, rowSpan: 1, isSpacer: false, flick: [.left: .input("「"), .up: .input("ゆ"), .right: .input("」"), .down: .input("よ")]),
                    KeyDefinition(id: "flick_ra", label: "ら", shiftLabel: nil, action: .input("ら"), shiftAction: nil, widthUnit: 1, isFunction: false, accessibilityLabelKey: nil, visibility: .always, rowSpan: 1, isSpacer: false, flick: [.left: .input("り"), .up: .input("る"), .right: .input("れ"), .down: .input("ろ")]),
                    KeyDefinition(id: "enter", label: "⏎", shiftLabel: nil, action: .enter, shiftAction: nil, widthUnit: 1, isFunction: true, accessibilityLabelKey: "accessibility.key.enter", visibility: .always, rowSpan: 2, isSpacer: false, flick: [:])
            ]),
            KeyRow(keys: [
                    KeyDefinition(id: "flick_dakuten", label: "゛゜小", shiftLabel: nil, action: .kanaVariant, shiftAction: nil, widthUnit: 1, isFunction: true, accessibilityLabelKey: "accessibility.key.flick_dakuten", visibility: .always, rowSpan: 1, isSpacer: false, flick: [:]),
                    KeyDefinition(id: "next_keyboard", label: "🌐", shiftLabel: nil, action: .nextKeyboard, shiftAction: nil, widthUnit: 1, isFunction: true, accessibilityLabelKey: "accessibility.key.next_keyboard", visibility: .needsInputModeSwitch, rowSpan: 1, isSpacer: false, flick: [:]),
                    KeyDefinition(id: "flick_kaomoji", label: "^_^", shiftLabel: nil, action: .input("^_^"), shiftAction: nil, widthUnit: 1, isFunction: false, accessibilityLabelKey: nil, visibility: .noInputModeSwitch, rowSpan: 1, isSpacer: false, flick: [:]),
                    KeyDefinition(id: "flick_wa", label: "わ", shiftLabel: nil, action: .input("わ"), shiftAction: nil, widthUnit: 1, isFunction: false, accessibilityLabelKey: nil, visibility: .always, rowSpan: 1, isSpacer: false, flick: [.left: .input("を"), .up: .input("ん"), .right: .input("ー"), .down: .input("〜")]),
                    KeyDefinition(id: "flick_punct", label: "、。?!", shiftLabel: nil, action: .input("、"), shiftAction: nil, widthUnit: 1, isFunction: false, accessibilityLabelKey: nil, visibility: .always, rowSpan: 1, isSpacer: false, flick: [.left: .input("。"), .up: .input("？"), .right: .input("！"), .down: .input("…")]),
                    KeyDefinition(id: "spacer_enter", label: nil, shiftLabel: nil, action: .noop, shiftAction: nil, widthUnit: 1, isFunction: false, accessibilityLabelKey: nil, visibility: .always, rowSpan: 1, isSpacer: true, flick: [:])
            ])
        ]
    )

    /** すべての配列 */
    public static let all: [KeyLayout] = [KeyLayouts.qwerty, KeyLayouts.numbers, KeyLayouts.symbols, KeyLayouts.flick]

    /**
     * 識別子から配列を引く
     */
    public static func layout(for id: LayoutId) -> KeyLayout {
        switch id {
        case .qwerty: return qwerty
        case .numbers: return numbers
        case .symbols: return symbols
        case .flick: return flick
        }
    }
}
