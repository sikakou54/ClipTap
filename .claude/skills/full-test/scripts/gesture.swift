import Foundation
import CoreGraphics

/**
 * シミュレータへマウスイベントを送るヘルパー
 *
 * AppleScriptの `click at` はmacOSで動作しない（-25204）ため、
 * CGEventで直接ポストする。座標はmacOSの画面座標（ポイント）で、
 * `ui find` が返す値をそのまま渡せる。
 *
 * gesture tap    <x> <y> [holdMs]
 * gesture drag   <x1> <y1> <x2> <y2> [durMs]
 * gesture double <x> <y>
 */

let args = CommandLine.arguments
let src = CGEventSource(stateID: .hidSystemState)

func post(_ type: CGEventType, _ p: CGPoint, clickCount: Int64 = 1) {
    let e = CGEvent(mouseEventSource: src, mouseType: type, mouseCursorPosition: p, mouseButton: .left)
    if clickCount > 1 { e?.setIntegerValueField(.mouseEventClickState, value: clickCount) }
    e?.post(tap: .cghidEventTap)
}

func fail(_ msg: String) -> Never {
    FileHandle.standardError.write((msg + "\n").data(using: .utf8)!)
    exit(1)
}

guard args.count >= 2 else {
    fail("usage: gesture tap <x> <y> [holdMs] | gesture drag <x1> <y1> <x2> <y2> [durMs] | gesture double <x> <y>")
}

switch args[1] {
case "tap":
    guard args.count >= 4, let x = Double(args[2]), let y = Double(args[3]) else {
        fail("usage: gesture tap <x> <y> [holdMs]")
    }
    let hold = args.count >= 5 ? (Double(args[4]) ?? 60) : 60
    let p = CGPoint(x: x, y: y)
    post(.mouseMoved, p)
    usleep(80_000)
    post(.leftMouseDown, p)
    usleep(UInt32(hold * 1000))
    post(.leftMouseUp, p)
    print("tap \(Int(x)),\(Int(y)) hold=\(Int(hold))ms")

case "double":
    guard args.count >= 4, let x = Double(args[2]), let y = Double(args[3]) else {
        fail("usage: gesture double <x> <y>")
    }
    let p = CGPoint(x: x, y: y)
    post(.mouseMoved, p)
    usleep(80_000)
    for i in 1...2 {
        post(.leftMouseDown, p, clickCount: Int64(i))
        usleep(40_000)
        post(.leftMouseUp, p, clickCount: Int64(i))
        usleep(60_000)
    }
    print("double \(Int(x)),\(Int(y))")

case "drag":
    guard args.count >= 6,
          let x1 = Double(args[2]), let y1 = Double(args[3]),
          let x2 = Double(args[4]), let y2 = Double(args[5]) else {
        fail("usage: gesture drag <x1> <y1> <x2> <y2> [durMs]")
    }
    let dur = args.count >= 7 ? (Double(args[6]) ?? 400) : 400
    let steps = 30
    post(.mouseMoved, CGPoint(x: x1, y: y1))
    usleep(80_000)
    post(.leftMouseDown, CGPoint(x: x1, y: y1))
    usleep(60_000)
    for i in 1...steps {
        let t = Double(i) / Double(steps)
        post(.leftMouseDragged, CGPoint(x: x1 + (x2 - x1) * t, y: y1 + (y2 - y1) * t))
        usleep(UInt32(dur * 1000 / Double(steps)))
    }
    usleep(120_000)
    post(.leftMouseUp, CGPoint(x: x2, y: y2))
    print("drag \(Int(x1)),\(Int(y1)) -> \(Int(x2)),\(Int(y2)) \(Int(dur))ms")

default:
    fail("unknown command: \(args[1])")
}
