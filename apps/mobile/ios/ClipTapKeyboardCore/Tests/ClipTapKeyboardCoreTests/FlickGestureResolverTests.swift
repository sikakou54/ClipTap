import Foundation
import Testing
@testable import ClipTapKeyboardCore

/**
 * フリック判定の規則に対する検証
 *
 * ここで固定した規則は、Kotlin側の実装でも同じ結果になること。
 */
struct FlickGestureResolverTests {

    private let origin = CGPoint(x: 100, y: 100)

    /** 原点からの変位で判定する */
    private func resolve(dx: CGFloat, dy: CGFloat) -> FlickDirection? {
        FlickGestureResolver.resolve(
            from: origin,
            to: CGPoint(x: origin.x + dx, y: origin.y + dy)
        )
    }

    @Test("動かさなければタップ扱い")
    func noMovementIsTap() {
        #expect(resolve(dx: 0, dy: 0) == nil)
    }

    @Test("しきい値未満の揺れはタップ扱い")
    func smallMovementIsTap() {
        /* 指を置くときの微細な動きでフリックになってしまうと誤入力が増える */
        let justUnder = FlickGestureResolver.threshold - 1
        #expect(resolve(dx: justUnder, dy: 0) == nil)
        #expect(resolve(dx: 0, dy: -justUnder) == nil)
        #expect(resolve(dx: justUnder, dy: justUnder) == nil)
    }

    @Test("しきい値を超えると4方向に判定される")
    func resolvesFourDirections() {
        let over = FlickGestureResolver.threshold + 1
        #expect(resolve(dx: over, dy: 0) == .right)
        #expect(resolve(dx: -over, dy: 0) == .left)
        /* 画面座標は下方向が正 */
        #expect(resolve(dx: 0, dy: -over) == .up)
        #expect(resolve(dx: 0, dy: over) == .down)
    }

    @Test("斜めの動きは移動量の大きい軸を採る")
    func diagonalPrefersDominantAxis() {
        let large = FlickGestureResolver.threshold + 20
        let small = FlickGestureResolver.threshold + 1

        #expect(resolve(dx: large, dy: -small) == .right)
        #expect(resolve(dx: small, dy: -large) == .up)
        #expect(resolve(dx: -large, dy: small) == .left)
        #expect(resolve(dx: -small, dy: large) == .down)
    }

    @Test("縦横が同じ量なら横を優先する")
    func equalMovementPrefersHorizontal() {
        /*
         * どちらかに決めないと判定が揺れる。日本語のフリックは左右の使用頻度が
         * 高いため横を優先する。
         */
        let over = FlickGestureResolver.threshold + 5
        #expect(resolve(dx: over, dy: over) == .right)
        #expect(resolve(dx: -over, dy: -over) == .left)
    }

    @Test("片方の軸だけがしきい値を超えていれば判定される")
    func singleAxisOverThreshold() {
        let over = FlickGestureResolver.threshold + 1
        let under = FlickGestureResolver.threshold - 5

        /* 横は小さいが縦が十分に動いている */
        #expect(resolve(dx: under, dy: -over) == .up)
    }
}
