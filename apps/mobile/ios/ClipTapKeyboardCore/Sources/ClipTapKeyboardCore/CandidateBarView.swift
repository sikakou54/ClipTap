/*
 * ビューはiOSでのみ構築する。
 *
 * 入力の規則や変換エンジンを `swift test` で検証できるよう、
 * UIKitに依存する部分だけを切り分けている。
 */
#if canImport(UIKit)

import UIKit

/**
 * 変換候補のバー
 *
 * iOSのカスタムキーボードは入力欄のマークテキスト（下線付きの未確定表示）を
 * 使えないため、未確定文字列はこのバーの左端に表示する。
 * Androidも同じ見た目に合わせ、両OSの体験を揃える。
 *
 * 候補のタップで確定し、空白キーで順に選ばれた候補は強調して見せる。
 */
public final class CandidateBarView: UIView {

    /** 入力の状態機械。候補の確定はここへ渡す */
    private let session: InputSession

    /** 未確定文字列（読み）の表示 */
    private let readingLabel: UILabel = {
        let label = UILabel()
        label.font = .systemFont(ofSize: 15)
        label.textColor = .secondaryLabel
        /* 読みが長いときは先頭を省く。いま打っている末尾側が見えるほうが役に立つ */
        label.lineBreakMode = .byTruncatingHead
        return label
    }()

    /** 候補を横に並べてスクロールさせる */
    private let scrollView: UIScrollView = {
        let view = UIScrollView()
        view.showsHorizontalScrollIndicator = false
        view.showsVerticalScrollIndicator = false
        return view
    }()

    /** 候補の並び。候補は高々十数件のため、セルの再利用はしない */
    private let candidateStack: UIStackView = {
        let stack = UIStackView()
        stack.axis = .horizontal
        stack.spacing = 6
        stack.alignment = .fill
        return stack
    }()

    /** 描画済みの内容。候補が同じで選択だけ変わったときに作り直さないため */
    private var renderedOutput: EngineOutput = .empty

    public init(session: InputSession) {
        self.session = session
        super.init(frame: .zero)

        let rootStack = UIStackView(arrangedSubviews: [readingLabel, scrollView])
        rootStack.axis = .horizontal
        rootStack.spacing = 8
        rootStack.alignment = .fill
        rootStack.translatesAutoresizingMaskIntoConstraints = false
        addSubview(rootStack)

        scrollView.addSubview(candidateStack)
        candidateStack.translatesAutoresizingMaskIntoConstraints = false

        NSLayoutConstraint.activate([
            /* セルはバーの全高を使い、44ptの最小タップ領域を確保する */
            rootStack.topAnchor.constraint(equalTo: topAnchor),
            rootStack.bottomAnchor.constraint(equalTo: bottomAnchor),
            rootStack.leadingAnchor.constraint(equalTo: leadingAnchor, constant: 8),
            rootStack.trailingAnchor.constraint(equalTo: trailingAnchor, constant: -8),

            /* 読みは候補の場所を奪いすぎないよう、バーの4割までに抑える */
            readingLabel.widthAnchor.constraint(lessThanOrEqualTo: rootStack.widthAnchor, multiplier: 0.4),

            candidateStack.topAnchor.constraint(equalTo: scrollView.contentLayoutGuide.topAnchor),
            candidateStack.bottomAnchor.constraint(equalTo: scrollView.contentLayoutGuide.bottomAnchor),
            candidateStack.leadingAnchor.constraint(equalTo: scrollView.contentLayoutGuide.leadingAnchor),
            candidateStack.trailingAnchor.constraint(equalTo: scrollView.contentLayoutGuide.trailingAnchor),
            candidateStack.heightAnchor.constraint(equalTo: scrollView.frameLayoutGuide.heightAnchor)
        ])

        session.onCompositionChanged = { [weak self] in
            self?.update()
        }
        update()
    }

    @available(*, unavailable)
    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    /**
     * 現在の未確定文字列と候補を表示へ反映する
     */
    private func update() {
        let output = session.composition

        readingLabel.text = output.reading
        readingLabel.isHidden = output.reading.isEmpty

        /* 候補が同じで選択だけ変わったときは、並びを保ったまま強調だけ更新する */
        if output != renderedOutput {
            rebuildCandidates(output)
            renderedOutput = output
            scrollView.setContentOffset(.zero, animated: false)
        }
        applySelection()
    }

    /** 候補の並びを作り直す */
    private func rebuildCandidates(_ output: EngineOutput) {
        candidateStack.arrangedSubviews.forEach { $0.removeFromSuperview() }

        for (index, candidate) in output.candidates.enumerated() {
            let cell = CandidateCell(text: candidate.text)
            cell.onTap = { [weak self] in
                self?.session.commitCandidate(at: index)
            }
            candidateStack.addArrangedSubview(cell)
        }
    }

    /** 空白キーで選ばれている候補を強調し、見える位置までスクロールする */
    private func applySelection() {
        let selected = session.selectedCandidateIndex
        for (index, view) in candidateStack.arrangedSubviews.enumerated() {
            (view as? CandidateCell)?.setSelected(index == selected)
        }

        guard
            let selected,
            candidateStack.arrangedSubviews.indices.contains(selected)
        else {
            return
        }
        /* 選択が画面外へ進んだときに見失わないよう追従する */
        layoutIfNeeded()
        let frame = scrollView.convert(candidateStack.arrangedSubviews[selected].frame, from: candidateStack)
        scrollView.scrollRectToVisible(frame.insetBy(dx: -6, dy: 0), animated: false)
    }
}

/**
 * 候補1つ分の見た目
 *
 * タップの検出と選択中の強調だけを持つ。
 */
final class CandidateCell: UIControl {

    /** タップされたときに呼ばれる */
    var onTap: (() -> Void)?

    private let label: UILabel = {
        let label = UILabel()
        label.font = .systemFont(ofSize: 17)
        label.textAlignment = .center
        label.translatesAutoresizingMaskIntoConstraints = false
        return label
    }()

    init(text: String) {
        super.init(frame: .zero)

        layer.cornerRadius = 5
        layer.cornerCurve = .continuous

        label.text = text
        /* タッチはUIControl側で受ける。ラベルに奪わせない */
        label.isUserInteractionEnabled = false
        addSubview(label)
        NSLayoutConstraint.activate([
            label.topAnchor.constraint(equalTo: topAnchor),
            label.bottomAnchor.constraint(equalTo: bottomAnchor),
            label.leadingAnchor.constraint(equalTo: leadingAnchor, constant: 10),
            label.trailingAnchor.constraint(equalTo: trailingAnchor, constant: -10)
        ])

        isAccessibilityElement = true
        accessibilityTraits = .button
        accessibilityLabel = text

        addTarget(self, action: #selector(didTap), for: .touchUpInside)
        setSelected(false)
    }

    @available(*, unavailable)
    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    /** 押下中は薄く沈ませ、タップできることを示す */
    override var isHighlighted: Bool {
        didSet {
            alpha = isHighlighted ? 0.6 : 1
        }
    }

    /** 空白キーで選ばれている候補の強調を切り替える */
    func setSelected(_ isSelected: Bool) {
        backgroundColor = isSelected ? .systemBlue : .secondarySystemBackground
        label.textColor = isSelected ? .white : .label
        /* 色の変化はVoiceOverに伝わらないため、選択状態はトレイトでも公開する */
        accessibilityTraits = isSelected ? [.button, .selected] : .button
    }

    @objc private func didTap() {
        onTap?()
    }
}

#endif
