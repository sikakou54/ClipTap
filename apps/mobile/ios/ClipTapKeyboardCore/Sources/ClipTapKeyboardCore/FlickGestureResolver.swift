import Foundation

/**
 * フリックの方向を判定する
 *
 * 指を置いた位置からの変位で、中央（タップ）か上下左右かを決める。
 * 判定を状態から切り離しているのは、しきい値や優先順位の規則を
 * 画面なしでテストできるようにするため。
 *
 * Kotlin側にも同名・同意味の実装を置き、両OSで判定を一致させる。
 */
public enum FlickGestureResolver {

    /**
     * フリックとみなす最小の移動量（pt）
     *
     * 小さすぎるとタップのつもりが誤ってフリックになり、
     * 大きすぎるとフリックしたつもりが入らない。
     * OS標準のキーボードに合わせた値。
     */
    public static let threshold: CGFloat = 12

    /**
     * 指を置いた位置と現在位置から方向を判定する
     *
     * - Returns: 判定された方向。しきい値未満ならnil（タップ扱い）
     */
    public static func resolve(from start: CGPoint, to current: CGPoint) -> FlickDirection? {
        let dx = current.x - start.x
        let dy = current.y - start.y

        /*
         * 斜めに滑らせたときは、移動量の大きい軸を採る。
         * どちらの軸もしきい値に満たなければタップとみなす。
         */
        if abs(dx) < threshold && abs(dy) < threshold {
            return nil
        }

        if abs(dx) >= abs(dy) {
            return dx > 0 ? .right : .left
        }
        /* 画面座標は下方向が正 */
        return dy > 0 ? .down : .up
    }
}
