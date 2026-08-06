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

    /** 現在指が乗っているキー */
    private var pressedKey: KeyCapView?

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
            for key in row.keys {
                let keyView = KeyCapView(key: key)
                addSubview(keyView)
                keyViews[key.id] = keyView
            }
        }
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
                keyViews[key.id]?.frame = CGRect(x: x, y: y, width: width, height: rowHeight)
                x += width + keySpacing
            }
        }
    }

    /**
     * 状態を見た目へ反映する
     */
    private func applyState() {
        if keyViews.count != session.layout.rows.reduce(0, { $0 + $1.keys.count }) {
            /* 配列が変わっている。作り直す */
            rebuild()
            return
        }
        for keyView in keyViews.values {
            keyView.apply(isShifted: session.isShifted, shiftState: session.shiftState)
        }
    }

    // MARK: - タッチ

    public override func touchesBegan(_ touches: Set<UITouch>, with event: UIEvent?) {
        guard let point = touches.first?.location(in: self) else {
            return
        }
        updatePressedKey(at: point)
    }

    public override func touchesMoved(_ touches: Set<UITouch>, with event: UIEvent?) {
        guard let point = touches.first?.location(in: self) else {
            return
        }
        /* 押し始めたキーから指が外れたら、そのキーの押下表示を解く */
        updatePressedKey(at: point)
    }

    public override func touchesEnded(_ touches: Set<UITouch>, with event: UIEvent?) {
        defer { clearPressedKey() }

        guard
            let point = touches.first?.location(in: self),
            let keyView = hitKeyView(at: point)
        else {
            return
        }
        session.handle(keyView.key)
    }

    public override func touchesCancelled(_ touches: Set<UITouch>, with event: UIEvent?) {
        clearPressedKey()
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
    }

    private func clearPressedKey() {
        pressedKey?.setPressed(false)
        pressedKey = nil
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
     * シフト状態に応じて表示を更新する
     */
    func apply(isShifted: Bool, shiftState: InputSession.ShiftState) {
        label.text = key.displayLabel(isShifted: isShifted)
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
