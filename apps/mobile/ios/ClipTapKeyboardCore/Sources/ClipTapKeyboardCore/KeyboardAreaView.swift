/*
 * ビューはiOSでのみ構築する。
 *
 * このパッケージはmacOSもビルド対象にしている。入力の規則や変換エンジンを
 * シミュレータを起動せずに `swift test` で検証できるようにするためで、
 * その利点を保つためにUIKitに依存する部分だけを切り分ける。
 */
#if canImport(UIKit)

import UIKit

/**
 * キー領域の描画とタッチ処理
 *
 * キーは行ごとに相対幅で割り付ける。行内のキー数が配列によって違うため、
 * 固定幅ではなく比率で配置する。
 *
 * タッチはこのコンテナで受ける。キーごとにジェスチャを持たせると、
 * 指を滑らせたときの取り回しや同時押しの制御が難しくなるため。
 * 子ビューは見た目と読み上げのためだけに置く。
 */
public final class KeyboardAreaView: UIView {

    /** 入力の状態機械。キー押下はここへ渡す */
    private let session: InputSession

    /** キーの見た目。識別子から引く */
    private var keyViews: [String: KeyCapView] = [:]

    /**
     * 表示中の配列
     *
     * 配列の変更は内容全体の比較で検出する。識別子の比較では、
     * 同じ配列のまま表示条件（地球儀キーの有無）だけが変わる場合を見逃す。
     */
    private var renderedLayout: KeyLayout?

    /** 現在指が乗っているキー */
    private var pressedKey: KeyCapView?

    /** 指を置いた位置。フリックの判定に使う */
    private var touchStartPoint: CGPoint?

    /** 現在判定されているフリック方向 */
    private var currentFlickDirection: FlickDirection?

    /** フリックの候補を表示する吹き出し */
    private lazy var flickGuideView: FlickGuideView = {
        let view = FlickGuideView()
        view.isHidden = true
        addSubview(view)
        return view
    }()

    /** キーの間隔 */
    private let keySpacing: CGFloat = 6

    /** 行の間隔 */
    private let rowSpacing: CGFloat = 10

    public init(session: InputSession) {
        self.session = session
        super.init(frame: .zero)

        isMultipleTouchEnabled = false
        rebuild()

        session.onStateChanged = { [weak self] in
            self?.applyState()
        }
    }

    @available(*, unavailable)
    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    // MARK: - レイアウト

    public override func layoutSubviews() {
        super.layoutSubviews()
        layoutKeys()
    }

    /**
     * 現在の配列でキーの見た目を作り直す
     *
     * 配列を切り替えたときに呼ぶ。
     */
    private func rebuild() {
        keyViews.values.forEach { $0.removeFromSuperview() }
        keyViews = [:]

        for row in session.layout.rows {
            /* 場所取りキーは描画しない。幅の計算にだけ使う */
            for key in row.keys where !key.isSpacer {
                let keyView = KeyCapView(key: key)
                addSubview(keyView)
                keyViews[key.id] = keyView
            }
        }
        renderedLayout = session.layout
        applyState()
        setNeedsLayout()
    }

    /**
     * キーを実寸へ割り付ける
     *
     * 行の高さは均等。横は相対幅の比率で分ける。
     */
    private func layoutKeys() {
        let rows = session.layout.rows
        guard !rows.isEmpty, bounds.width > 0 else {
            return
        }

        let totalRowSpacing = rowSpacing * CGFloat(rows.count - 1)
        let rowHeight = (bounds.height - totalRowSpacing) / CGFloat(rows.count)

        for (rowIndex, row) in rows.enumerated() {
            let spacingCount = CGFloat(max(row.keys.count - 1, 0))
            let availableWidth = bounds.width - keySpacing * spacingCount
            let unitWidth = availableWidth / CGFloat(row.totalWidthUnit)

            var x: CGFloat = 0
            let y = (rowHeight + rowSpacing) * CGFloat(rowIndex)

            for key in row.keys {
                let width = unitWidth * CGFloat(key.widthUnit)
                if let keyView = keyViews[key.id] {
                    /* 縦長キーは下の行まで伸ばす。行間も高さに含める */
                    let span = CGFloat(max(key.rowSpan, 1))
                    let height = rowHeight * span + rowSpacing * (span - 1)
                    keyView.frame = CGRect(x: x, y: y, width: width, height: height)
                }
                x += width + keySpacing
            }
        }
    }

    /**
     * 状態を見た目へ反映する
     */
    private func applyState() {
        if renderedLayout != session.layout {
            /* 配列が変わっている。作り直す */
            rebuild()
            return
        }
        for keyView in keyViews.values {
            keyView.apply(
                isShifted: session.isShifted,
                shiftState: session.shiftState,
                isComposing: session.isComposing
            )
        }
    }

    // MARK: - タッチ

    public override func touchesBegan(_ touches: Set<UITouch>, with event: UIEvent?) {
        guard let point = touches.first?.location(in: self) else {
            return
        }
        touchStartPoint = point
        currentFlickDirection = nil
        updatePressedKey(at: point)
    }

    public override func touchesMoved(_ touches: Set<UITouch>, with event: UIEvent?) {
        guard let point = touches.first?.location(in: self) else {
            return
        }

        /*
         * フリックを持つキーでは、指が外れても対象を変えない。
         * 上下左右へ払う動作でキーの外へ出るのが普通の使い方であるため。
         */
        if pressedKey?.key.hasFlick == true, let start = touchStartPoint {
            let direction = FlickGestureResolver.resolve(from: start, to: point)
            if direction != currentFlickDirection {
                currentFlickDirection = direction
                flickGuideView.highlight(direction)
            }
            return
        }

        /* 押し始めたキーから指が外れたら、そのキーの押下表示を解く */
        updatePressedKey(at: point)
    }

    public override func touchesEnded(_ touches: Set<UITouch>, with event: UIEvent?) {
        defer { clearPressedKey() }

        guard let keyView = pressedKey else {
            return
        }

        if keyView.key.hasFlick {
            session.handle(keyView.key, flickDirection: currentFlickDirection)
            return
        }

        /* フリックを持たないキーは、指が離れた位置がキー上にある場合だけ入力する */
        guard
            let point = touches.first?.location(in: self),
            hitKeyView(at: point) === keyView
        else {
            return
        }
        session.handle(keyView.key)
    }

    public override func touchesCancelled(_ touches: Set<UITouch>, with event: UIEvent?) {
        clearPressedKey()
    }

    /** フリックを持つキーなら、押下中に候補を表示する */
    private func showFlickGuideIfNeeded() {
        guard let keyView = pressedKey, keyView.key.hasFlick else {
            flickGuideView.isHidden = true
            return
        }
        flickGuideView.present(for: keyView.key, around: keyView.frame, in: self)
    }

    /** 指の位置にあるキーを探す */
    private func hitKeyView(at point: CGPoint) -> KeyCapView? {
        keyViews.values.first { $0.frame.contains(point) }
    }

    private func updatePressedKey(at point: CGPoint) {
        let target = hitKeyView(at: point)
        guard target !== pressedKey else {
            return
        }
        pressedKey?.setPressed(false)
        target?.setPressed(true)
        pressedKey = target

        /*
         * ジェスチャの途中で別のキーへ乗り移ったら、いまの指の位置を
         * 新たな起点にする。元の押下点から測ると、乗り移るまでの移動だけで
         * しきい値を超えてしまい、タップのつもりがフリック入力になる。
         */
        touchStartPoint = point
        currentFlickDirection = nil
        showFlickGuideIfNeeded()
    }

    private func clearPressedKey() {
        pressedKey?.setPressed(false)
        pressedKey = nil
        touchStartPoint = nil
        currentFlickDirection = nil
        flickGuideView.isHidden = true
    }
}

/**
 * フリックの候補を押下中に見せる吹き出し
 *
 * 指を置いた時点で上下左右に何が入るかを示す。覚えていない利用者が
 * 一度離して確かめる、という往復を避けるために出す。
 */
final class FlickGuideView: UIView {

    /** 方向ごとの表示。中央は元のキーが見えているため持たない */
    private var labels: [FlickDirection: UILabel] = [:]

    /** 吹き出し1つ分の大きさ */
    private let cellSize: CGFloat = 44

    init() {
        super.init(frame: .zero)
        isUserInteractionEnabled = false

        for direction in FlickDirection.allCases {
            let label = UILabel()
            label.textAlignment = .center
            label.font = .systemFont(ofSize: 20, weight: .regular)
            label.textColor = .label
            label.backgroundColor = .secondarySystemBackground
            label.layer.cornerRadius = 5
            label.layer.cornerCurve = .continuous
            label.layer.masksToBounds = true
            addSubview(label)
            labels[direction] = label
        }
    }

    @available(*, unavailable)
    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    /**
     * 対象のキーの周りに候補を配置して表示する
     */
    func present(for key: KeyDefinition, around keyFrame: CGRect, in container: UIView) {
        for direction in FlickDirection.allCases {
            guard let label = labels[direction] else {
                continue
            }
            if case .input(let text)? = key.flick[direction] {
                label.text = text
                label.isHidden = false
            } else {
                label.isHidden = true
            }
        }

        /* キーを中心に十字へ配置する。画面外へ出る分は内側へ寄せる */
        let center = CGPoint(x: keyFrame.midX, y: keyFrame.midY)
        frame = CGRect(
            x: center.x - cellSize * 1.5,
            y: center.y - cellSize * 1.5,
            width: cellSize * 3,
            height: cellSize * 3
        )
        frame.origin.x = min(max(0, frame.origin.x), container.bounds.width - frame.width)
        frame.origin.y = min(max(0, frame.origin.y), container.bounds.height - frame.height)

        let offsets: [FlickDirection: CGPoint] = [
            .left: CGPoint(x: 0, y: cellSize),
            .up: CGPoint(x: cellSize, y: 0),
            .right: CGPoint(x: cellSize * 2, y: cellSize),
            .down: CGPoint(x: cellSize, y: cellSize * 2)
        ]
        for (direction, origin) in offsets {
            labels[direction]?.frame = CGRect(origin: origin, size: CGSize(width: cellSize, height: cellSize))
        }

        highlight(nil)
        isHidden = false
        container.bringSubviewToFront(self)
    }

    /**
     * 選ばれている方向を強調する
     */
    func highlight(_ direction: FlickDirection?) {
        for (labelDirection, label) in labels {
            let isSelected = labelDirection == direction
            label.backgroundColor = isSelected ? .systemBlue : .secondarySystemBackground
            label.textColor = isSelected ? .white : .label
        }
    }
}

/**
 * 1つのキーの見た目
 *
 * タッチはコンテナ側で処理するため、このビューは操作を受け取らない。
 * 読み上げのためにアクセシビリティ要素としては振る舞う。
 */
final class KeyCapView: UIView {

    /** このキーの定義 */
    let key: KeyDefinition

    private let label = UILabel()

    init(key: KeyDefinition) {
        self.key = key
        super.init(frame: .zero)

        layer.cornerRadius = 5
        layer.cornerCurve = .continuous
        /* OS標準のキーに近い落ち影。押下時の視認性のために薄く付ける */
        layer.shadowColor = UIColor.black.cgColor
        layer.shadowOpacity = 0.25
        layer.shadowOffset = CGSize(width: 0, height: 1)
        layer.shadowRadius = 0

        label.textAlignment = .center
        label.adjustsFontSizeToFitWidth = true
        label.minimumScaleFactor = 0.6
        label.translatesAutoresizingMaskIntoConstraints = false
        addSubview(label)
        NSLayoutConstraint.activate([
            label.centerXAnchor.constraint(equalTo: centerXAnchor),
            label.centerYAnchor.constraint(equalTo: centerYAnchor),
            label.widthAnchor.constraint(lessThanOrEqualTo: widthAnchor, constant: -4)
        ])

        isAccessibilityElement = true
        accessibilityTraits = .keyboardKey

        applyColors(isPressed: false)
    }

    @available(*, unavailable)
    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    /**
     * シフト状態と未確定の有無に応じて表示を更新する
     */
    func apply(isShifted: Bool, shiftState: InputSession.ShiftState, isComposing: Bool) {
        /* 未確定文字列があるあいだだけ表示が変わるキー（顔文字⇄゛゜小） */
        if isComposing, let composingLabel = key.composingLabel {
            label.text = composingLabel
        } else {
            label.text = key.displayLabel(isShifted: isShifted)
        }
        label.font = .systemFont(ofSize: key.isFunction ? 16 : 22, weight: .regular)

        /* シフトキーは固定中であることが分かるように色を変える */
        if case .shift = key.action {
            label.textColor = shiftState == .locked ? .systemBlue : .label
        } else {
            label.textColor = .label
        }

        accessibilityLabel = label.text
    }

    /**
     * 押下中の表示を切り替える
     */
    func setPressed(_ isPressed: Bool) {
        applyColors(isPressed: isPressed)
    }

    private func applyColors(isPressed: Bool) {
        if isPressed {
            backgroundColor = key.isFunction ? .systemFill : .tertiarySystemFill
            return
        }
        /*
         * 文字キーは明るく、機能キーは暗くするのがOS標準の慣習。
         * 利用者が形を見ずに役割を判別できる。
         */
        backgroundColor = key.isFunction ? .tertiarySystemFill : .secondarySystemBackground
    }
}

#endif
