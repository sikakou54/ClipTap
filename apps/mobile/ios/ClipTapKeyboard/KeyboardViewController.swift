//
//  KeyboardViewController.swift
//  ClipTapKeyboard
//
//  【目的】
//  カスタムキーボード画面のメインコントローラー
//  ユーザーがスニペット（定型文）を選択して入力できるキーボードUIを提供します
//
//  【画面構成】
//  ┌─────────────────────┐
//  │ [環境1] [環境2] ... │ ← 環境フィルター（横スクロール）
//  ├─────────────────────┤
//  │ [全て] [仕事] [私用] │ ← カテゴリフィルター（横スクロール）
//  ├─────────────────────┤
//  │ スニペット1         │
//  │ スニペット2         │ ← スニペット一覧（タップで詳細表示）
//  │ スニペット3         │
//  └─────────────────────┘
//
//  【ユーザーの操作フロー】
//  1. 環境（プロファイル）を選択 → その環境のスニペットのみ表示
//  2. カテゴリを選択 → さらにカテゴリでフィルタリング
//  3. スニペットをタップ → 詳細画面（プレビュー）を表示
//  4. コピーボタンをタップ → テキスト入力欄に挿入
//
//  【技術的な特徴】
//  - 3層アーキテクチャ: ViewController（UI） → Service（ビジネスロジック） → Mapper（データアクセス）
//  - リアルタイムフィルタリング: 環境・カテゴリ変更時に即座にスニペットリストを更新
//  - 変数置換: {{today}}などのシステム変数や、ユーザー定義変数を実際の値に置換
//  - 振動フィードバック: スニペット挿入時にHaptic Feedback（触覚フィードバック）
//

import UIKit
import os.log
import ClipTapKeyboardCore
import ClipTapKeyboardEngine

// ログ出力用の設定（デバッグやエラー追跡に使用）
// 開発中の動作確認や、本番環境でのトラブルシューティングに役立ちます
let keyboardLog = OSLog.disabled

/// カスタムキーボードのメインビューコントローラー
/// UIInputViewControllerを継承することで、iOSのカスタムキーボード機能を実装できます
class KeyboardViewController: UIInputViewController {

    private enum ScreenState {
        case loading
        case list
        /** 文字入力。キー領域を表示する */
        case typing
        case detail
        case settings
    }

    // MARK: - Services（サービス層：ビジネスロジックを担当）
    // 3層アーキテクチャを採用: UI層（ViewController） → ビジネスロジック層（Service） → データアクセス層（Mapper）
    // これにより、コードの見通しが良くなり、テストもしやすくなります

    /// スニペット（定型文）の管理を行うサービス
    /// スニペットの取得、挿入、変数置換などの処理を担当
    private let snippetService = SnippetService.shared

    /// カテゴリ（「仕事」「私用」などの分類）の管理を行うサービス
    private let categoryService = CategoryService.shared

    /// プロファイル（環境）の管理を行うサービス
    /// プロファイルとは、例えば「会社用」「個人用」などの設定の塊です
    private let profileService = ProfileService.shared

    /// 変数（{{today}}などの動的な値）の管理を行うサービス
    private let variableService = VariableService.shared

    /// サブスクリプション（有料機能）の管理を行うマネージャー

    // MARK: - State（状態管理：画面の現在の状態を保持）

    /// 現在選択中のプロファイル（環境）
    /// 例: 「会社用」プロファイルが選択されている場合、会社用のスニペットのみ表示
    private var currentProfile: Profile?

    /// 現在選択中のカテゴリ
    /// 例: 「仕事」カテゴリが選択されている場合、仕事関連のスニペットのみ表示
    /// nilの場合は「すべて」を表示
    private var currentCategory: Category?

    /// データベースから取得した全スニペット（フィルタ前）
    /// プロファイルでフィルタ済みですが、カテゴリフィルタは未適用
    private var allSnippets: [Snippet] = []

    /// 画面に表示するスニペットのリスト（フィルタ後）
    /// プロファイル + カテゴリの両方でフィルタ済み
    private var filteredSnippets: [Snippet] = []

    /**
     * 一覧に描画済みの内容を表す署名
     *
     * 再取得した内容がこれと一致する場合は再描画しない。
     * nilは「表示が外部要因で変わり得るため毎回描画する」ことを示す。
     */
    private var snippetListSignature: String?

    /// 全カテゴリのリスト（「すべて」ボタン + 各カテゴリボタンを作成するために使用）
    private var categories: [Category] = []

    /// 全プロファイル（環境）のリスト（環境選択ボタンを作成するために使用）
    private var profiles: [Profile] = []

    /// 変数を置換するためのヘルパー（{{today}} → 2025/11/17などの変換を行う）
    private let variableReplacer = VariableReplacer()

    /// カスタム変数のマップ（変数名 → 値の辞書）
    /// 例: ["client_name": "田中", "company_name": "株式会社○○"]
    private var variablesMap: [String: String] = [:]
    private var systemVariableFormats: [String: String] = [:]

    /// 詳細画面で表示中のスニペット
    /// ユーザーがスニペットをタップすると、このプロパティに保存されます
    private var selectedSnippet: Snippet?

    /// 現在のソート順
    /// 値: "created" | "updated" | "title" | "usage"
    private var currentSortBy: String = "created"

    /// 現在表示している画面
    private var screenState: ScreenState = .list

    /// ソート設定を保存するUserDefaultsキー
    private let sortPreferenceKey = "keyboard_snippet_sort_by"

    /// 最後に使ったモード（定型文の一覧／文字入力）を保存するUserDefaultsキー
    private let keyboardModePreferenceKey = "keyboard_input_mode"

    /// フルアクセス状態を共有するApp GroupのUserDefaultsキー
    private let fullAccessStateKey = "keyboardHasFullAccess"

    /// App Group識別子
    private let appGroupIdentifier = "group.com.sikakou.cliptap"

    /**
     * キーボード全体の高さ（pt）
     *
     * OS標準キーボードに近い高さにして、スニペット一覧の表示領域を確保する。
     */
    private static let keyboardHeight: CGFloat = 280

    /**
     * キーボードの高さ制約
     *
     * 表示のたびに新しい制約を追加すると矛盾した制約が増殖し、
     * レイアウトが不定になって表示領域とタッチ領域がずれるため、1本だけ保持して使い回す。
     */
    private var keyboardHeightConstraint: NSLayoutConstraint?

    // MARK: - UI Components（画面を構成するUI部品）

    // === 統合フィルターエリア（環境 + カテゴリを1行に配置）===
    // 環境選択ドロップダウン（左端固定）+ カテゴリボタン（横スクロール）

    /// 統合フィルターエリア全体を包むコンテナビュー
    /// 環境ドロップダウンとカテゴリスクロールビューを横並びに配置
    private let filterContainerView: UIView = {
        let view = UIView()
        view.translatesAutoresizingMaskIntoConstraints = false
        view.backgroundColor = .clear  // 背景色を透明に
        return view
    }()

    /// 環境選択ドロップダウンボタン（左端固定、固定幅）
    /// タップすると環境一覧メニューが表示される
    private let profileDropdownButton: UIButton = {
        let button = UIButton(type: .system)
        button.titleLabel?.font = .systemFont(ofSize: 12, weight: .medium)
        button.contentHorizontalAlignment = .left
        button.contentEdgeInsets = UIEdgeInsets(top: 6, left: 12, bottom: 6, right: 28)  // 右側にシェブロン用のスペースを確保
        button.layer.cornerRadius = 16
        button.backgroundColor = .secondarySystemFill
        button.setTitleColor(.label, for: .normal)
        button.translatesAutoresizingMaskIntoConstraints = false

        return button
    }()

    /// シェブロンアイコン（ドロップダウンボタンの右端に固定配置）
    private let chevronImageView: UIImageView = {
        let config = UIImage.SymbolConfiguration(pointSize: 10, weight: .medium)
        let image = UIImage(systemName: "chevron.down", withConfiguration: config)
        let imageView = UIImageView(image: image)
        imageView.tintColor = .secondaryLabel
        imageView.contentMode = .center
        imageView.translatesAutoresizingMaskIntoConstraints = false
        return imageView
    }()

    /// カテゴリ選択ドロップダウンボタン（環境ドロップダウンの右隣、固定幅）
    /// タップするとカテゴリ一覧メニューが表示される
    private let categoryDropdownButton: UIButton = {
        let button = UIButton(type: .system)
        button.titleLabel?.font = .systemFont(ofSize: 12, weight: .medium)
        button.contentHorizontalAlignment = .left
        button.contentEdgeInsets = UIEdgeInsets(top: 6, left: 12, bottom: 6, right: 28)
        button.layer.cornerRadius = 16
        button.backgroundColor = .secondarySystemFill
        button.setTitleColor(.label, for: .normal)
        button.translatesAutoresizingMaskIntoConstraints = false
        return button
    }()

    /// カテゴリ用シェブロンアイコン（ドロップダウンボタンの右端に固定配置）
    private let categoryChevronImageView: UIImageView = {
        let config = UIImage.SymbolConfiguration(pointSize: 10, weight: .medium)
        let image = UIImage(systemName: "chevron.down", withConfiguration: config)
        let imageView = UIImageView(image: image)
        imageView.tintColor = .secondaryLabel
        imageView.contentMode = .center
        imageView.translatesAutoresizingMaskIntoConstraints = false
        return imageView
    }()

    /// ソートボタン（左端に固定配置）
    /// タップするとソートオプションメニューが表示される
    private let sortButton: UIButton = {
        let button = UIButton(type: .system)
        let config = UIImage.SymbolConfiguration(pointSize: 14, weight: .medium)
        let image = UIImage(systemName: "arrow.up.arrow.down", withConfiguration: config)
        button.setImage(image, for: .normal)
        button.tintColor = .label
        button.backgroundColor = .clear
        button.translatesAutoresizingMaskIntoConstraints = false
        button.showsMenuAsPrimaryAction = true
        button.accessibilityLabel = L10n.Accessibility.sortButton
        return button
    }()

    /// ソートボタンのバッジ（デフォルト以外の時に表示）
    /// プライマリカラーの小さな丸で、デフォルト以外のソートが選択されていることを示す
    private let sortBadgeView: UIView = {
        let view = UIView()
        view.backgroundColor = .systemBlue
        view.layer.cornerRadius = 4
        view.translatesAutoresizingMaskIntoConstraints = false
        view.isHidden = true
        return view
    }()

    /// 設定ボタン（ソートボタンの右隣に配置）
    /// タップすると設定画面が表示される
    private let settingsButton: UIButton = {
        let button = UIButton(type: .system)
        let config = UIImage.SymbolConfiguration(pointSize: 14, weight: .medium)
        let image = UIImage(systemName: "gearshape", withConfiguration: config)
        button.setImage(image, for: .normal)
        button.tintColor = .label
        button.backgroundColor = .clear
        button.translatesAutoresizingMaskIntoConstraints = false
        return button
    }()

    /// 定型文の一覧と文字入力を切り替えるボタン（左端固定）
    ///
    /// 両モードで同じ位置に置く。切り替えるたびに指の当てどころが動くと使いにくいため。
    private let keyboardModeButton: UIButton = {
        let button = UIButton(type: .system)
        let config = UIImage.SymbolConfiguration(pointSize: 14, weight: .medium)
        button.setImage(UIImage(systemName: "keyboard", withConfiguration: config), for: .normal)
        button.tintColor = .label
        button.backgroundColor = .clear
        button.translatesAutoresizingMaskIntoConstraints = false
        return button
    }()

    // === 文字入力エリア ===

    /// 入力欄への橋渡し
    ///
    /// `textDocumentProxy` は毎回取り直す必要があるため、保持せず閉包で渡す。
    private lazy var hostTextBridge = TextDocumentProxyBridge { [weak self] in
        self?.textDocumentProxy
    }

    /// 入力の状態機械
    private lazy var inputSession = InputSession(host: hostTextBridge)

    /// キー領域
    private lazy var keyboardAreaView = KeyboardAreaView(session: inputSession)

    /** 変換候補のバー */
    private lazy var candidateBarView = CandidateBarView(session: inputSession)

    /**
     * かな漢字変換エンジン
     *
     * 学習データはApp Groupコンテナ内のkeyboard/learning/へ置く。
     * 共有SQLite（業務データ）とは分離し、エクスポート・インポートの対象にしない。
     * 辞書の初期化は最初のかな入力時にInputSession側で行われるため、
     * ここでの生成は軽い。
     */
    private lazy var kanaKanjiEngine: KanaKanjiEngine? = {
        guard let containerURL = FileManager.default.containerURL(
            forSecurityApplicationGroupIdentifier: appGroupIdentifier
        ) else {
            KeyboardLog.debug("❌ [Engine] App Group container not available")
            return nil
        }
        let learningURL = containerURL.appendingPathComponent("keyboard/learning", isDirectory: true)
        try? FileManager.default.createDirectory(at: learningURL, withIntermediateDirectories: true)
        return AzooKeyEngine(memoryDirectoryURL: learningURL, sharedContainerURL: containerURL)
    }()

    // === スニペット一覧エリア ===

    /// スニペット一覧を表示するテーブルビュー（リスト形式）
    /// 各行をタップすると、詳細画面（プレビュー）が表示されます
    private let tableView: UITableView = {
        let tv = UITableView()
        tv.backgroundColor = .clear
        tv.translatesAutoresizingMaskIntoConstraints = false
        return tv
    }()

    // === 詳細表示エリア（プレビュー画面）===
    // スニペットをタップすると全画面表示される

    /// 詳細表示画面の全体を包むビュー
    /// 初期状態では非表示（isHidden = true）
    private let detailView: UIView = {
        let view = UIView()
        view.backgroundColor = .clear
        view.translatesAutoresizingMaskIntoConstraints = false
        view.isHidden = true  // 最初は非表示
        return view
    }()

    /// 詳細内容をスクロールできるようにするためのスクロールビュー
    /// スニペットの内容が長い場合でも、スクロールして全文を読めます
    private let detailScrollView: UIScrollView = {
        let sv = UIScrollView()
        sv.translatesAutoresizingMaskIntoConstraints = false
        return sv
    }()

    /// スクロールビューの中身を配置するためのコンテナビュー
    /// Auto Layoutの制約を設定するために必要です
    private let detailContentView: UIView = {
        let view = UIView()
        view.translatesAutoresizingMaskIntoConstraints = false
        return view
    }()

    /// スニペットのタイトルを表示するラベル
    /// copyWithTitleフラグがfalseの場合は非表示になります
    private let detailTitleLabel: UILabel = {
        let label = UILabel()
        label.font = .systemFont(ofSize: 16)  // 本文（detailContentLabel）と同じフォント
        label.numberOfLines = 0  // 複数行表示可能（改行を許可）
        label.translatesAutoresizingMaskIntoConstraints = false
        return label
    }()

    /// タイトルだけを入力欄へ挿入するボタン（タイトル行の右端）
    /// メールの件名と本文のように、タイトルと本文を別々の欄へ入れるために使用します
    /// copyWithTitleがOFFのスニペット、またはタイトルが空のスニペットでは非表示になります
    private let titleInsertButton: ExpandedHitAreaButton = {
        let button = ExpandedHitAreaButton()
        // アイコン設定（紙飛行機マーク。下部の挿入ボタンより一回り小さい）
        let config = UIImage.SymbolConfiguration(pointSize: 13, weight: .medium)
        let image = UIImage(systemName: "paperplane.fill", withConfiguration: config)
        button.setImage(image, for: .normal)
        button.backgroundColor = .systemBlue  // 青い背景
        button.tintColor = .white  // 白いアイコン
        button.layer.cornerRadius = 16  // 丸ボタン（半径16で32x32の円形になる）
        button.translatesAutoresizingMaskIntoConstraints = false
        button.isHidden = true  // 初期状態は非表示（copyWithTitleがONのときだけ表示）
        return button
    }()

    /// タイトルと本文の区切り線
    /// タイトルと本文が別々に挿入できることを視覚的に伝えます
    private let titleSeparatorView: UIView = {
        let view = UIView()
        view.backgroundColor = .separator  // ライト/ダークに自動追従するシステム色
        view.translatesAutoresizingMaskIntoConstraints = false
        view.isHidden = true  // 初期状態は非表示（copyWithTitleがONのときだけ表示）
        return view
    }()

    /// スニペットの内容（本文）を表示するラベル
    /// 変数（{{today}}など）は実際の値に置き換えられた状態で表示されます
    private let detailContentLabel: UILabel = {
        let label = UILabel()
        label.font = .systemFont(ofSize: 16)  // 通常フォント、16ポイント
        label.numberOfLines = 0  // 複数行表示可能
        label.textColor = .label  // システム標準のテキスト色
        label.translatesAutoresizingMaskIntoConstraints = false
        return label
    }()

    // === 詳細画面の切り替え用制約 ===

    /// copyWithTitleがOFFのときに使う本文の上端制約（本文の上はタイトルラベル）
    /// タイトルラベルは非表示かつ高さ0になるため、従来と同じ表示位置になります
    private var contentTopToTitleConstraint: NSLayoutConstraint?

    /// copyWithTitleがONのときに使う本文の上端制約（本文の上は区切り線）
    private var contentTopToSeparatorConstraint: NSLayoutConstraint?

    /// タイトル挿入ボタンを表示するときだけ有効にする区切り線の下限制約
    /// 非表示のボタンもAuto Layout上は32ptを占めるため、常時有効にすると
    /// タイトルラベルが引き伸ばされてOFF時の本文位置が下がってしまう
    private var separatorTopToButtonConstraint: NSLayoutConstraint?

    // === ボタンエリア（詳細画面下部）===

    /// コピーボタン（テキスト入力欄に挿入）
    /// 紙飛行機アイコンの青い丸ボタン
    private let copyButton: UIButton = {
        let button = UIButton(type: .system)
        // アイコン設定（紙飛行機マーク）
        let config = UIImage.SymbolConfiguration(pointSize: 16, weight: .medium)
        let image = UIImage(systemName: "paperplane.fill", withConfiguration: config)
        button.setImage(image, for: .normal)
        button.backgroundColor = .systemBlue  // 青い背景
        button.tintColor = .white  // 白いアイコン
        button.layer.cornerRadius = 20  // 丸ボタン（半径20で40x40の円形になる）
        button.translatesAutoresizingMaskIntoConstraints = false
        return button
    }()

    /// 閉じるボタン（詳細画面を閉じてリストに戻る）
    /// ×マークのグレーの丸ボタン
    private let closeButton: UIButton = {
        let button = UIButton(type: .system)
        // アイコン設定（×マーク）
        let config = UIImage.SymbolConfiguration(pointSize: 14, weight: .medium)
        let image = UIImage(systemName: "xmark", withConfiguration: config)
        button.setImage(image, for: .normal)
        button.backgroundColor = .secondarySystemFill
        button.tintColor = .label  // システム標準のテキスト色
        button.layer.cornerRadius = 20  // 丸ボタン
        button.translatesAutoresizingMaskIntoConstraints = false
        return button
    }()

    /// 改行挿入ボタン（閉じるボタンと挿入ボタンの間）
    /// 改行マークのグレーの丸ボタン
    ///
    /// 【なぜ必要か】
    /// タイトル挿入・本文挿入のどちらも改行を付けないため、同じ入力欄へ
    /// 「タイトル → 改行 → 本文」と入れるには標準キーボードへの切り替えが必要でした。
    /// このボタンにより、切り替えずに改行を入力できます。
    ///
    /// 【グレーにする理由】
    /// 主要な操作は青い挿入ボタンであることを保つため、閉じるボタンと同じ副次配色にします。
    ///
    /// 【ExpandedHitAreaButtonを使う理由】
    /// 隣接する2つのボタンと揃えた40x40の見た目のまま、
    /// タップ領域だけを44x44へ広げてタップしやすさを確保します。
    private let newlineButton: ExpandedHitAreaButton = {
        let button = ExpandedHitAreaButton()
        // アイコン設定（改行マーク）
        let config = UIImage.SymbolConfiguration(pointSize: 14, weight: .medium)
        let image = UIImage(systemName: "return", withConfiguration: config)
        button.setImage(image, for: .normal)
        button.backgroundColor = .secondarySystemFill
        button.tintColor = .label  // システム標準のテキスト色
        button.layer.cornerRadius = 20  // 丸ボタン
        button.translatesAutoresizingMaskIntoConstraints = false
        return button
    }()

    // === 空状態表示 ===

    /// スニペットが1件もない場合に表示されるメッセージラベル
    /// 「スニペットがありません」などのガイドメッセージを表示
    private let emptyLabel: UILabel = {
        let label = UILabel()
        label.numberOfLines = 0  // 複数行表示可能
        label.font = .systemFont(ofSize: 12)
        label.textColor = .secondaryLabel  // 薄めのグレー（目立たない色）
        label.textAlignment = .center  // 中央揃え
        // 多言語対応: "スニペットがありません\nメインアプリでスニペットを作成してください" / "No snippets available\nCreate snippets in the main app"
        label.text = "\(L10n.Snippet.empty)\n\(L10n.Message.emptyState)"
        label.translatesAutoresizingMaskIntoConstraints = false
        label.isHidden = true  // 初期状態では非表示（スニペットがある場合は表示しない）
        return label
    }()

    // === ローディング画面 ===

    /// ローディング画面全体を包むビュー
    private let loadingView: UIView = {
        let view = UIView()
        view.backgroundColor = .clear
        view.translatesAutoresizingMaskIntoConstraints = false
        return view
    }()

    /// ローディングインジケーター（くるくる回るやつ）
    private let activityIndicator: UIActivityIndicatorView = {
        let indicator = UIActivityIndicatorView(style: .medium)
        indicator.translatesAutoresizingMaskIntoConstraints = false
        indicator.hidesWhenStopped = true
        return indicator
    }()

    /// ローディングメッセージ
    private let loadingLabel: UILabel = {
        let label = UILabel()
        label.text = L10n.Message.loading  // "読み込み中..." / "Loading..."
        label.font = .systemFont(ofSize: 14)
        label.textColor = .secondaryLabel
        label.textAlignment = .center
        label.translatesAutoresizingMaskIntoConstraints = false
        return label
    }()

    // === 設定画面エリア ===

    /// 設定画面全体を包むビュー（全画面表示）
    private let settingsView: UIView = {
        let view = UIView()
        view.backgroundColor = .clear
        view.translatesAutoresizingMaskIntoConstraints = false
        view.isHidden = true
        return view
    }()

    /// 設定画面のヘッダービュー
    private let settingsHeaderView: UIView = {
        let view = UIView()
        view.backgroundColor = .clear
        view.translatesAutoresizingMaskIntoConstraints = false
        return view
    }()

    /// 設定画面のタイトルラベル
    private let settingsTitleLabel: UILabel = {
        let label = UILabel()
        label.font = .boldSystemFont(ofSize: 16)
        label.textAlignment = .center
        label.translatesAutoresizingMaskIntoConstraints = false
        return label
    }()

    /// 設定画面の閉じるボタン
    private let settingsCloseButton: UIButton = {
        let button = UIButton(type: .system)
        let config = UIImage.SymbolConfiguration(pointSize: 14, weight: .medium)
        let image = UIImage(systemName: "xmark", withConfiguration: config)
        button.setImage(image, for: .normal)
        button.backgroundColor = .secondarySystemFill
        button.tintColor = .label
        button.layer.cornerRadius = 15
        button.translatesAutoresizingMaskIntoConstraints = false
        return button
    }()

    /// 使用頻度スイッチの行コンテナ
    private let usageTrackingRowView: UIView = {
        let view = UIView()
        view.backgroundColor = .tertiarySystemFill
        view.layer.cornerRadius = 10
        view.translatesAutoresizingMaskIntoConstraints = false
        return view
    }()

    /// 使用頻度の記録状態の見出しラベル
    private let usageTrackingLabel: UILabel = {
        let label = UILabel()
        label.font = .systemFont(ofSize: 15)
        label.translatesAutoresizingMaskIntoConstraints = false
        return label
    }()

    /// 使用頻度の記録が有効かどうかを示すラベル
    /// フルアクセスの許可状態に応じて「有効」「フルアクセスが必要」を出し分ける
    private let usageTrackingStatusLabel: UILabel = {
        let label = UILabel()
        label.font = .systemFont(ofSize: 15, weight: .medium)
        label.translatesAutoresizingMaskIntoConstraints = false
        return label
    }()

    /// フルアクセス必要ヒントラベル
    private let fullAccessHintLabel: UILabel = {
        let label = UILabel()
        label.font = .systemFont(ofSize: 12)
        label.textColor = .secondaryLabel
        label.numberOfLines = 0
        label.translatesAutoresizingMaskIntoConstraints = false
        label.isHidden = true
        return label
    }()

    /// フルアクセス許可手順ラベル
    private let fullAccessInstructionsLabel: UILabel = {
        let label = UILabel()
        label.font = .systemFont(ofSize: 12)
        label.textColor = .secondaryLabel
        label.numberOfLines = 0
        label.translatesAutoresizingMaskIntoConstraints = false
        label.isHidden = true
        return label
    }()

    // MARK: - Lifecycle Methods（ライフサイクルメソッド：画面の表示・非表示時に呼ばれる）

    /// 画面が最初に読み込まれたときに1回だけ呼ばれるメソッド
    /// アプリ起動後、初めてこのキーボードが表示されるタイミングで実行されます
    ///
    /// 【処理内容】
    /// 1. 画面のUI部品を配置（setupUI）
    /// 2. サブスクリプション状態をチェック
    /// 3. データベースからデータを読み込み（loadInitialData）
    override func viewDidLoad() {
        super.viewDidLoad()

        // デバッグ用のログ出力（開発中の動作確認用）
        KeyboardLog.debug("============================================================")
        KeyboardLog.debug("🎯🎯🎯 [KeyboardViewController] viewDidLoad CALLED 🎯🎯🎯")
        KeyboardLog.debug("============================================================")

        applySystemKeyboardBackground()

        /* フルアクセス状態をApp Group UserDefaultsに保存（SnippetServiceと共有） */
        saveFullAccessState()

        /* ソート設定を初期読み込み（setupUIより前に実行する必要あり） */
        /* 使用頻度順は読み取りだけで成立するため、フルアクセスの有無で制限しない */
        currentSortBy = loadSortPreference()

        KeyboardLog.debug("🔄 [Sort] Initial sort preference loaded: %@", currentSortBy)

        setupUI()  // UI部品を画面に配置（即座に表示）

        // ローディング画面を表示
        showLoading()

        // データ読み込みをメインスレッドで実行
        // データベースアクセスはDatabase.swiftのdbQueueでスレッドセーフに管理されます
        loadInitialData()
    }

    /// 画面が表示される直前に呼ばれるメソッド
    /// キーボードが表示される度に毎回実行されます（viewDidLoadは1回だけ、こちらは毎回）
    ///
    /// 【なぜ毎回リフレッシュするのか】
    /// ユーザーがメインアプリでスニペットを編集した後、キーボードを開くと
    /// 最新のデータが表示されるようにするためです
    override func viewWillAppear(_ animated: Bool) {
        super.viewWillAppear(animated)

        KeyboardLog.debug("============================================================")
        KeyboardLog.debug("👁️👁️👁️ [KeyboardViewController] viewWillAppear CALLED 👁️👁️👁️")
        KeyboardLog.debug("============================================================")

        /* キーボードの高さを再適用する（制約は1本だけ保持するので増殖しない） */
        applyKeyboardHeightConstraint()

        applyHostKeyboardAppearance()

        // キーボードが表示される度に全データをリフレッシュ
        // これにより、メインアプリでの変更がキーボードにも即座に反映されます
        KeyboardLog.debug("🔄 [KeyboardViewController] viewWillAppear - Refreshing all data...")
        refreshAllData()
    }

    /**
     * 画面が閉じる直前に呼ばれるメソッド
     *
     * 打ちかけの未確定文字列を取り残さないよう、確定して入力欄へ送る。
     */
    override func viewWillDisappear(_ animated: Bool) {
        super.viewWillDisappear(animated)
        inputSession.flushComposition()
    }

    override func textDidChange(_ textInput: UITextInput?) {
        super.textDidChange(textInput)
        applyHostKeyboardAppearance()

        /*
         * 外部要因で入力文脈が変わったら（別の入力欄への移動、カーソル移動など）、
         * 打ちかけの未確定文字列を破棄する。未確定文字列は入力欄に書き込まれて
         * いないため、確定を待つと切替後の欄の無関係な位置へ文字が入ってしまう。
         * この通知は自分の挿入・削除でも呼ばれるため、直近に自分が操作した
         * 場合は外部要因とみなさない。
         */
        if !hostTextBridge.wasEditedRecently() {
            inputSession.discardComposition()
        }
    }

    /**
     * OS標準キーボードの背景を適用する
     *
     * 独自の背景色を持たず、OSがキーボードに使う背景素材をそのまま使う。
     * ルートビューがkeyboardスタイルのUIInputViewでない場合だけ、背面に
     * UIInputViewを追加してキーボード素材を確実に描画する。
     */
    private func applySystemKeyboardBackground() {
        view.backgroundColor = nil

        if let inputView = view as? UIInputView, inputView.inputViewStyle == .keyboard {
            KeyboardLog.debug("🎨 [Background] Root is UIInputView(.keyboard) - use system material as-is")
            return
        }

        KeyboardLog.debug("🎨 [Background] Root is %@ - insert UIInputView backdrop",
                          String(describing: type(of: view!)))
        let backdrop = UIInputView(frame: .zero, inputViewStyle: .keyboard)
        backdrop.translatesAutoresizingMaskIntoConstraints = false
        view.insertSubview(backdrop, at: 0)
        NSLayoutConstraint.activate([
            backdrop.topAnchor.constraint(equalTo: view.topAnchor),
            backdrop.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            backdrop.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            backdrop.bottomAnchor.constraint(equalTo: view.bottomAnchor)
        ])
    }

    /** 入力先アプリが要求するキーボード外観をビューとメニューへ反映する */
    private func applyHostKeyboardAppearance() {
        let style: UIUserInterfaceStyle
        switch textDocumentProxy.keyboardAppearance {
        case .dark:
            style = .dark
        case .light:
            style = .light
        default:
            style = .unspecified
        }

        if view.overrideUserInterfaceStyle != style {
            view.overrideUserInterfaceStyle = style
        }
        if let window = view.window, window.overrideUserInterfaceStyle != style {
            window.overrideUserInterfaceStyle = style
        }
    }

    /**
     * キーボードの高さ制約を適用する
     *
     * 制約は1本だけ生成して保持し、2回目以降は定数の更新だけを行う。
     * 表示のたびに制約を追加すると矛盾した必須制約が積み上がり、
     * UIKitがレイアウトのたびに制約を破棄して復旧するため、
     * ビューの実フレームが不定になって「見えているのに触れない領域」が生まれる。
     *
     * 優先度をrequiredより1段下げているのは、システム側が入力ビューへ付ける制約と
     * 衝突したときにこちらを譲り、制約破棄によるレイアウト崩れを避けるため。
     */
    private func applyKeyboardHeightConstraint() {
        if let constraint = keyboardHeightConstraint {
            constraint.constant = Self.keyboardHeight
            return
        }

        let constraint = view.heightAnchor.constraint(equalToConstant: Self.keyboardHeight)
        constraint.priority = UILayoutPriority(999)
        constraint.isActive = true
        keyboardHeightConstraint = constraint
    }

    // MARK: - Data Loading（データ読み込み処理）

    /// 全データをリフレッシュ（プロファイル、カテゴリ、スニペット）
    ///
    /// 【処理の流れ】
    /// 1. データベースを初期化
    /// 2. プロファイル（環境）を再読み込み → 変更があればボタンを再作成
    /// 3. カテゴリを再読み込み → 変更があればボタンを再作成
    /// 4. スニペットを再読み込み → 一覧を更新
    ///
    /// 【差分検出の仕組み】
    /// データ件数やIDが変わっていなければ、ボタンの再作成をスキップします
    /// これにより、無駄な処理を減らしてパフォーマンスを向上させています
    private func refreshAllData() {
        KeyboardLog.debug("🔄🔄🔄 [refreshAllData] STARTED 🔄🔄🔄")
        do {
            // データベースが初期化されているか確認
            try Database.shared.initialize()

            /* 書式設定は表示のたびに再読込する。
               変数値はプロファイル再読み込み後にまとめて取得するため、ここでは読まない */
            systemVariableFormats = SystemVariableFormatMapper.shared.getAll()

            // プロファイルを再読み込み
            KeyboardLog.debug("🔄 [Refresh] Loading profiles...")
            let newProfiles = profileService.getAllProfiles()

            // プロファイルが変更されたかチェック
            let profilesChanged = profiles.count != newProfiles.count ||
                                  profiles.map({ $0.id }) != newProfiles.map({ $0.id })

            if profilesChanged {
                KeyboardLog.debug("📝 [Refresh] Profiles changed: %d → %d", profiles.count, newProfiles.count)
                profiles = newProfiles
                setupProfileDropdown()

                // アクティブなプロファイルを設定
                if let activeProfile = profiles.first(where: { $0.isActive }) {
                    currentProfile = activeProfile
                } else if let firstProfile = profiles.first {
                    currentProfile = firstProfile
                }
            } else {
                KeyboardLog.debug("✓ [Refresh] Profiles unchanged: %d profiles", profiles.count)
            }

            if let profileId = currentProfile?.id {
                variablesMap = variableService.getVariablesMap(for: profileId)
            }

            // カテゴリを再読み込み
            KeyboardLog.debug("🔄 [Refresh] Loading categories...")
            let newCategories = categoryService.getAll()

            let categoriesChanged = categories.count != newCategories.count ||
                                   categories.map({ $0.id }) != newCategories.map({ $0.id })

            if categoriesChanged {
                KeyboardLog.debug("📝 [Refresh] Categories changed: %d → %d", categories.count, newCategories.count)
                categories = newCategories
                setupCategoryDropdown()
            } else {
                KeyboardLog.debug("✓ [Refresh] Categories unchanged: %d categories", categories.count)
            }

            // スニペットを再読み込み
            KeyboardLog.debug("🔄 [Refresh] Loading snippets...")
            let previousCount = allSnippets.count
            reloadSnippets()
            let newCount = allSnippets.count

            if previousCount != newCount {
                KeyboardLog.debug("📝 [Refresh] Snippets changed: %d → %d", previousCount, newCount)
            } else {
                KeyboardLog.debug("✓ [Refresh] Snippets unchanged: %d snippets", newCount)
            }

            KeyboardLog.debug("✅ [Refresh] All data refreshed successfully")

        } catch {
            KeyboardLog.debug("❌ [Refresh] Failed to refresh data: %@", error.localizedDescription)
        }
    }

    private func setupUI() {
        // 統合フィルターコンテナ（環境ドロップダウン + カテゴリドロップダウン + ソートボタン + 設定ボタン）
        view.addSubview(filterContainerView)
        filterContainerView.addSubview(keyboardModeButton)
        filterContainerView.addSubview(profileDropdownButton)
        filterContainerView.addSubview(categoryDropdownButton)
        filterContainerView.addSubview(sortButton)
        filterContainerView.addSubview(settingsButton)

        keyboardModeButton.addTarget(self, action: #selector(keyboardModeButtonTapped), for: .touchUpInside)
        setupInputSession()

        // シェブロンアイコンをボタンの上に配置
        profileDropdownButton.addSubview(chevronImageView)
        categoryDropdownButton.addSubview(categoryChevronImageView)

        // ソートバッジをボタンに追加
        sortButton.addSubview(sortBadgeView)

        // ソートボタンのメニューを設定
        setupSortButtonMenu()

        // 設定ボタンのアクションを設定
        settingsButton.addTarget(self, action: #selector(settingsButtonTapped), for: .touchUpInside)

        NSLayoutConstraint.activate([
            /* フィルターコンテナ: 画面上部に配置（横向き時のノッチ側を避けるためセーフエリア基準） */
            filterContainerView.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor, constant: 8),
            filterContainerView.leadingAnchor.constraint(equalTo: view.safeAreaLayoutGuide.leadingAnchor, constant: 8),
            filterContainerView.trailingAnchor.constraint(equalTo: view.safeAreaLayoutGuide.trailingAnchor, constant: -8),
            filterContainerView.heightAnchor.constraint(equalToConstant: 36),

            /* モード切替ボタン: 左端に固定。両モードで同じ位置を保つ */
            keyboardModeButton.leadingAnchor.constraint(equalTo: filterContainerView.leadingAnchor),
            keyboardModeButton.topAnchor.constraint(equalTo: filterContainerView.topAnchor),
            keyboardModeButton.bottomAnchor.constraint(equalTo: filterContainerView.bottomAnchor),
            keyboardModeButton.widthAnchor.constraint(equalToConstant: 36),

            /* 環境ドロップダウンボタン: モード切替ボタンの右隣、固定幅100pt */
            profileDropdownButton.leadingAnchor.constraint(equalTo: keyboardModeButton.trailingAnchor, constant: 4),
            profileDropdownButton.topAnchor.constraint(equalTo: filterContainerView.topAnchor),
            profileDropdownButton.bottomAnchor.constraint(equalTo: filterContainerView.bottomAnchor),
            profileDropdownButton.widthAnchor.constraint(equalToConstant: 100),

            /* シェブロンアイコン: ボタンの右端に固定配置 */
            chevronImageView.trailingAnchor.constraint(equalTo: profileDropdownButton.trailingAnchor, constant: -10),
            chevronImageView.centerYAnchor.constraint(equalTo: profileDropdownButton.centerYAnchor),
            chevronImageView.widthAnchor.constraint(equalToConstant: 12),
            chevronImageView.heightAnchor.constraint(equalToConstant: 12),

            /* カテゴリドロップダウンボタン: 環境ドロップダウンの右隣、固定幅100pt */
            categoryDropdownButton.leadingAnchor.constraint(equalTo: profileDropdownButton.trailingAnchor, constant: 8),
            categoryDropdownButton.topAnchor.constraint(equalTo: filterContainerView.topAnchor),
            categoryDropdownButton.bottomAnchor.constraint(equalTo: filterContainerView.bottomAnchor),
            categoryDropdownButton.widthAnchor.constraint(equalToConstant: 100),

            /* カテゴリ用シェブロンアイコン: ボタンの右端に固定配置 */
            categoryChevronImageView.trailingAnchor.constraint(equalTo: categoryDropdownButton.trailingAnchor, constant: -10),
            categoryChevronImageView.centerYAnchor.constraint(equalTo: categoryDropdownButton.centerYAnchor),
            categoryChevronImageView.widthAnchor.constraint(equalToConstant: 12),
            categoryChevronImageView.heightAnchor.constraint(equalToConstant: 12),

            /* 設定ボタン: 右端に固定、固定幅36pt */
            settingsButton.trailingAnchor.constraint(equalTo: filterContainerView.trailingAnchor),
            settingsButton.topAnchor.constraint(equalTo: filterContainerView.topAnchor),
            settingsButton.bottomAnchor.constraint(equalTo: filterContainerView.bottomAnchor),
            settingsButton.widthAnchor.constraint(equalToConstant: 36),

            /* ソートボタン: 設定ボタンの左隣、固定幅36pt */
            sortButton.trailingAnchor.constraint(equalTo: settingsButton.leadingAnchor, constant: -4),
            sortButton.topAnchor.constraint(equalTo: filterContainerView.topAnchor),
            sortButton.bottomAnchor.constraint(equalTo: filterContainerView.bottomAnchor),
            sortButton.widthAnchor.constraint(equalToConstant: 36),

            /* ソートバッジ: ボタン右上に配置、8x8ptの円 */
            sortBadgeView.widthAnchor.constraint(equalToConstant: 8),
            sortBadgeView.heightAnchor.constraint(equalToConstant: 8),
            sortBadgeView.topAnchor.constraint(equalTo: sortButton.topAnchor, constant: 2),
            sortBadgeView.trailingAnchor.constraint(equalTo: sortButton.trailingAnchor, constant: -2)
        ])

        // TableView: フィルターコンテナの下に配置（+36ptの表示エリア拡大）
        tableView.delegate = self
        tableView.dataSource = self
        tableView.register(SnippetCell.self, forCellReuseIdentifier: SnippetCell.reuseIdentifier)

        /* 行の高さを固定し、自動高さ計算（セルフサイジング）を無効化する。
           推定高さのままだと行の実フレームが見た目とずれ、余白部分でタッチが拾えないことがある */
        tableView.rowHeight = SnippetCell.rowHeight
        tableView.estimatedRowHeight = 0

        /* 内容が画面に収まっていてもドラッグに反応させる（無反応に見える状態をなくす） */
        tableView.alwaysBounceVertical = true

        /* セルの余白を読みやすさ優先の幅に合わせず、行を画面幅いっぱいに使う */
        tableView.cellLayoutMarginsFollowReadableWidth = false

        view.addSubview(tableView)
        /* 下端をセーフエリアに合わせる: ホームインジケータ帯に入るとOSのジェスチャがスワイプを奪い、
           その領域から始めたドラッグがスクロールにならないため */
        NSLayoutConstraint.activate([
            tableView.topAnchor.constraint(equalTo: filterContainerView.bottomAnchor, constant: 8),
            tableView.leadingAnchor.constraint(equalTo: view.safeAreaLayoutGuide.leadingAnchor),
            tableView.trailingAnchor.constraint(equalTo: view.safeAreaLayoutGuide.trailingAnchor),
            tableView.bottomAnchor.constraint(equalTo: view.safeAreaLayoutGuide.bottomAnchor)
        ])

        /* 候補バーとキー領域: 一覧と同じ場所を使う。キーボード全体の高さは変えない */
        candidateBarView.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(candidateBarView)
        keyboardAreaView.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(keyboardAreaView)
        NSLayoutConstraint.activate([
            candidateBarView.topAnchor.constraint(equalTo: filterContainerView.bottomAnchor, constant: 2),
            candidateBarView.leadingAnchor.constraint(equalTo: view.safeAreaLayoutGuide.leadingAnchor, constant: 3),
            candidateBarView.trailingAnchor.constraint(equalTo: view.safeAreaLayoutGuide.trailingAnchor, constant: -3),
            candidateBarView.heightAnchor.constraint(equalToConstant: 44),

            keyboardAreaView.topAnchor.constraint(equalTo: candidateBarView.bottomAnchor, constant: 2),
            keyboardAreaView.leadingAnchor.constraint(equalTo: view.safeAreaLayoutGuide.leadingAnchor, constant: 3),
            keyboardAreaView.trailingAnchor.constraint(equalTo: view.safeAreaLayoutGuide.trailingAnchor, constant: -3),
            keyboardAreaView.bottomAnchor.constraint(equalTo: view.safeAreaLayoutGuide.bottomAnchor, constant: -4)
        ])

        // Detail View (全画面表示)
        view.addSubview(detailView)
        detailView.addSubview(detailScrollView)
        detailScrollView.addSubview(detailContentView)
        detailContentView.addSubview(detailTitleLabel)
        /* タイトル挿入ボタンと区切り線はスクロールされる中身なのでcontentViewへ追加する。
           下部の挿入・閉じるボタンと違いdetailViewへ重ねないため、スクロール操作は奪わない */
        detailContentView.addSubview(titleInsertButton)
        detailContentView.addSubview(titleSeparatorView)
        detailContentView.addSubview(detailContentLabel)
        /* ボタンは透明なコンテナに包まずdetailViewへ直接追加する。
           全幅・透明のコンテナを重ねると、その範囲のスクロール操作をコンテナが奪ってしまう */
        detailView.addSubview(copyButton)
        detailView.addSubview(newlineButton)
        detailView.addSubview(closeButton)

        NSLayoutConstraint.activate([
            // DetailView: 全画面表示
            detailView.topAnchor.constraint(equalTo: view.topAnchor),
            detailView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            detailView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            detailView.bottomAnchor.constraint(equalTo: view.bottomAnchor),

            // ScrollView: 全画面（下端はセーフエリアに合わせ、ホームインジケータ帯を避ける）
            detailScrollView.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor, constant: 8),
            detailScrollView.leadingAnchor.constraint(equalTo: view.safeAreaLayoutGuide.leadingAnchor),
            detailScrollView.trailingAnchor.constraint(equalTo: view.safeAreaLayoutGuide.trailingAnchor),
            detailScrollView.bottomAnchor.constraint(equalTo: view.safeAreaLayoutGuide.bottomAnchor),

            // ContentView: ScrollViewのコンテンツ（ボタン分の下パディング追加）
            detailContentView.topAnchor.constraint(equalTo: detailScrollView.topAnchor),
            detailContentView.leadingAnchor.constraint(equalTo: detailScrollView.leadingAnchor),
            detailContentView.trailingAnchor.constraint(equalTo: detailScrollView.trailingAnchor),
            detailContentView.bottomAnchor.constraint(equalTo: detailScrollView.bottomAnchor),
            detailContentView.widthAnchor.constraint(equalTo: detailScrollView.widthAnchor),

            // Title Label
            detailTitleLabel.topAnchor.constraint(equalTo: detailContentView.topAnchor, constant: 12),
            detailTitleLabel.leadingAnchor.constraint(equalTo: detailContentView.leadingAnchor, constant: 12),
            detailTitleLabel.trailingAnchor.constraint(equalTo: titleInsertButton.leadingAnchor, constant: -8),

            // Title Insert Button（タイトル行の右端に置く32x32の丸ボタン）
            titleInsertButton.topAnchor.constraint(equalTo: detailContentView.topAnchor, constant: 8),
            titleInsertButton.trailingAnchor.constraint(equalTo: detailContentView.trailingAnchor, constant: -12),
            titleInsertButton.widthAnchor.constraint(equalToConstant: 32),
            titleInsertButton.heightAnchor.constraint(equalToConstant: 32),

            // Title Separator（タイトル行と本文の区切り線）
            titleSeparatorView.leadingAnchor.constraint(equalTo: detailContentView.leadingAnchor, constant: 12),
            titleSeparatorView.trailingAnchor.constraint(equalTo: detailContentView.trailingAnchor, constant: -12),
            titleSeparatorView.heightAnchor.constraint(equalToConstant: 0.5),

            // Content Label（ボタンエリア分の下マージン追加：60pt）
            detailContentLabel.leadingAnchor.constraint(equalTo: detailContentView.leadingAnchor, constant: 12),
            detailContentLabel.trailingAnchor.constraint(equalTo: detailContentView.trailingAnchor, constant: -12),
            detailContentLabel.bottomAnchor.constraint(equalTo: detailContentView.bottomAnchor, constant: -72),

            // Buttons: 画面右下に固定（丸ボタン、セーフエリア内に収める）
            copyButton.bottomAnchor.constraint(equalTo: view.safeAreaLayoutGuide.bottomAnchor, constant: -12),
            copyButton.trailingAnchor.constraint(equalTo: view.safeAreaLayoutGuide.trailingAnchor, constant: -12),
            copyButton.widthAnchor.constraint(equalToConstant: 40),
            copyButton.heightAnchor.constraint(equalToConstant: 40),

            // 改行ボタン（挿入ボタンと閉じるボタンの間）
            newlineButton.bottomAnchor.constraint(equalTo: copyButton.bottomAnchor),
            newlineButton.trailingAnchor.constraint(equalTo: copyButton.leadingAnchor, constant: -12),
            newlineButton.widthAnchor.constraint(equalToConstant: 40),
            newlineButton.heightAnchor.constraint(equalToConstant: 40),

            closeButton.bottomAnchor.constraint(equalTo: copyButton.bottomAnchor),
            closeButton.trailingAnchor.constraint(equalTo: newlineButton.leadingAnchor, constant: -12),
            closeButton.widthAnchor.constraint(equalToConstant: 40),
            closeButton.heightAnchor.constraint(equalToConstant: 40)
        ])

        /* 区切り線はタイトルの直下に置きたいが、1行タイトルではタイトルより背の高い挿入ボタンがはみ出す。
           優先度を下げた等式にすることで、複数行タイトルではタイトル基準、
           1行タイトルでは下のseparatorTopToButtonConstraint（ボタン基準）が採用される */
        let separatorTopToTitleConstraint = titleSeparatorView.topAnchor.constraint(
            equalTo: detailTitleLabel.bottomAnchor,
            constant: 8
        )
        separatorTopToTitleConstraint.priority = .defaultHigh
        separatorTopToTitleConstraint.isActive = true

        /* ボタンを表示するときだけ、その高さ分を区切り線の下限として効かせる。
           常時有効にすると、非表示のボタン（Auto Layout上は32ptを占める）を避けるために
           ソルバが優先度750の上記等式を満たそうとタイトルラベルを28ptへ引き伸ばし、
           タイトル非表示時でも本文が押し下がってしまう */
        let separatorTopToButton = titleSeparatorView.topAnchor.constraint(
            greaterThanOrEqualTo: titleInsertButton.bottomAnchor,
            constant: 8
        )
        separatorTopToButtonConstraint = separatorTopToButton  // 初期状態はボタン非表示のためactivateしない

        /* 本文の上端はcopyWithTitleの状態で付け替える。
           どちらも同じアンカーへの等式なので、必ず片方だけをactiveにする */
        let contentTopToTitle = detailContentLabel.topAnchor.constraint(
            equalTo: detailTitleLabel.bottomAnchor,
            constant: 8
        )
        let contentTopToSeparator = detailContentLabel.topAnchor.constraint(
            equalTo: titleSeparatorView.bottomAnchor,
            constant: 12
        )
        contentTopToTitleConstraint = contentTopToTitle
        contentTopToSeparatorConstraint = contentTopToSeparator
        contentTopToTitle.isActive = true  // 初期状態はタイトル非表示（従来の表示位置）

        copyButton.addTarget(self, action: #selector(copyButtonTapped), for: .touchUpInside)
        closeButton.addTarget(self, action: #selector(closeDetailView), for: .touchUpInside)
        titleInsertButton.addTarget(self, action: #selector(titleInsertButtonTapped), for: .touchUpInside)
        titleInsertButton.accessibilityLabel = L10n.Accessibility.insertTitleButton
        newlineButton.addTarget(self, action: #selector(newlineButtonTapped), for: .touchUpInside)
        newlineButton.accessibilityLabel = L10n.Accessibility.insertNewlineButton

        // Empty Label
        view.addSubview(emptyLabel)
        NSLayoutConstraint.activate([
            emptyLabel.centerXAnchor.constraint(equalTo: tableView.centerXAnchor),
            emptyLabel.centerYAnchor.constraint(equalTo: tableView.centerYAnchor),
            emptyLabel.leadingAnchor.constraint(equalTo: tableView.leadingAnchor, constant: 20),
            emptyLabel.trailingAnchor.constraint(equalTo: tableView.trailingAnchor, constant: -20)
        ])

        // Loading View (全画面ローディング)
        view.addSubview(loadingView)
        loadingView.addSubview(activityIndicator)
        loadingView.addSubview(loadingLabel)

        NSLayoutConstraint.activate([
            // Loading View: 全画面表示
            loadingView.topAnchor.constraint(equalTo: view.topAnchor),
            loadingView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            loadingView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            loadingView.bottomAnchor.constraint(equalTo: view.bottomAnchor),

            // Activity Indicator: 中央
            activityIndicator.centerXAnchor.constraint(equalTo: loadingView.centerXAnchor),
            activityIndicator.centerYAnchor.constraint(equalTo: loadingView.centerYAnchor, constant: -20),

            // Loading Label: インジケーターの下
            loadingLabel.topAnchor.constraint(equalTo: activityIndicator.bottomAnchor, constant: 12),
            loadingLabel.centerXAnchor.constraint(equalTo: loadingView.centerXAnchor)
        ])

        /* キーボードの高さ（制約はapplyKeyboardHeightConstraintで一元管理する） */
        applyKeyboardHeightConstraint()

        // Settings View (設定画面 - 全画面表示)
        view.addSubview(settingsView)
        settingsView.addSubview(settingsHeaderView)
        settingsHeaderView.addSubview(settingsTitleLabel)
        settingsHeaderView.addSubview(settingsCloseButton)
        settingsView.addSubview(usageTrackingRowView)
        usageTrackingRowView.addSubview(usageTrackingLabel)
        usageTrackingRowView.addSubview(usageTrackingStatusLabel)
        settingsView.addSubview(fullAccessHintLabel)
        settingsView.addSubview(fullAccessInstructionsLabel)

        // 設定画面のアクションを設定
        settingsCloseButton.addTarget(self, action: #selector(closeSettingsView), for: .touchUpInside)

        NSLayoutConstraint.activate([
            // Settings View: 全画面表示
            settingsView.topAnchor.constraint(equalTo: view.topAnchor),
            settingsView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            settingsView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            settingsView.bottomAnchor.constraint(equalTo: view.bottomAnchor),

            // Settings Header: 上部に固定
            settingsHeaderView.topAnchor.constraint(equalTo: settingsView.topAnchor),
            settingsHeaderView.leadingAnchor.constraint(equalTo: settingsView.leadingAnchor),
            settingsHeaderView.trailingAnchor.constraint(equalTo: settingsView.trailingAnchor),
            settingsHeaderView.heightAnchor.constraint(equalToConstant: 44),

            // Settings Title: ヘッダー中央
            settingsTitleLabel.centerXAnchor.constraint(equalTo: settingsHeaderView.centerXAnchor),
            settingsTitleLabel.centerYAnchor.constraint(equalTo: settingsHeaderView.centerYAnchor),

            // Settings Close Button: ヘッダー右端
            settingsCloseButton.trailingAnchor.constraint(equalTo: settingsHeaderView.trailingAnchor, constant: -12),
            settingsCloseButton.centerYAnchor.constraint(equalTo: settingsHeaderView.centerYAnchor),
            settingsCloseButton.widthAnchor.constraint(equalToConstant: 30),
            settingsCloseButton.heightAnchor.constraint(equalToConstant: 30),

            // Usage Tracking Row: ヘッダーの下
            usageTrackingRowView.topAnchor.constraint(equalTo: settingsHeaderView.bottomAnchor, constant: 16),
            usageTrackingRowView.leadingAnchor.constraint(equalTo: settingsView.leadingAnchor, constant: 12),
            usageTrackingRowView.trailingAnchor.constraint(equalTo: settingsView.trailingAnchor, constant: -12),
            usageTrackingRowView.heightAnchor.constraint(equalToConstant: 52),

            // Usage Tracking Label: 行の左側
            usageTrackingLabel.leadingAnchor.constraint(equalTo: usageTrackingRowView.leadingAnchor, constant: 16),
            usageTrackingLabel.centerYAnchor.constraint(equalTo: usageTrackingRowView.centerYAnchor),

            // Usage Tracking Status: 行の右側
            usageTrackingStatusLabel.trailingAnchor.constraint(equalTo: usageTrackingRowView.trailingAnchor, constant: -16),
            usageTrackingStatusLabel.centerYAnchor.constraint(equalTo: usageTrackingRowView.centerYAnchor),

            // Full Access Hint: 行の下
            fullAccessHintLabel.topAnchor.constraint(equalTo: usageTrackingRowView.bottomAnchor, constant: 8),
            fullAccessHintLabel.leadingAnchor.constraint(equalTo: settingsView.leadingAnchor, constant: 16),
            fullAccessHintLabel.trailingAnchor.constraint(equalTo: settingsView.trailingAnchor, constant: -16),

            // Full Access Instructions: ヒントの下
            fullAccessInstructionsLabel.topAnchor.constraint(equalTo: fullAccessHintLabel.bottomAnchor, constant: 12),
            fullAccessInstructionsLabel.leadingAnchor.constraint(equalTo: settingsView.leadingAnchor, constant: 16),
            fullAccessInstructionsLabel.trailingAnchor.constraint(equalTo: settingsView.trailingAnchor, constant: -16)
        ])

        applyScreenState()
    }

    private func loadInitialData() {
        os_log("🚀 loadInitialData started", log: keyboardLog, type: .info)
        KeyboardLog.debug("🚀 [KeyboardViewController] loadInitialData started")

        do {
            // データベースを初期化
            os_log("📦 Initializing database...", log: keyboardLog, type: .info)
            KeyboardLog.debug("📦 [KeyboardViewController] Initializing database...")
            try Database.shared.initialize()
            self.systemVariableFormats = SystemVariableFormatMapper.shared.getAll()
            os_log("✅ Database initialized successfully", log: keyboardLog, type: .info)
            KeyboardLog.debug("✅ [KeyboardViewController] Database initialized successfully")

            // プロファイルを読み込み（Serviceを使用）
            os_log("📦 Loading profiles...", log: keyboardLog, type: .info)
            KeyboardLog.debug("📦 [KeyboardViewController] Loading profiles...")
            let loadedProfiles = profileService.getAllProfiles()
            os_log("✅ Loaded %d profiles", log: keyboardLog, type: .info, loadedProfiles.count)
            KeyboardLog.debug("✅ [KeyboardViewController] Loaded %d profiles", loadedProfiles.count)

            // カテゴリを読み込み（Serviceを使用）
            os_log("📦 Loading categories...", log: keyboardLog, type: .info)
            KeyboardLog.debug("📦 [KeyboardViewController] Loading categories...")
            let loadedCategories = categoryService.getAll()
            os_log("✅ Loaded %d categories", log: keyboardLog, type: .info, loadedCategories.count)
            KeyboardLog.debug("✅ [KeyboardViewController] Loaded %d categories", loadedCategories.count)

            // 変数とスニペットを読み込み
            if let firstProfile = loadedProfiles.first {
                os_log("✅ Setting current profile: %@", log: keyboardLog, type: .info, firstProfile.name)
                KeyboardLog.debug("✅ [KeyboardViewController] Setting current profile: %@", firstProfile.name)
                self.currentProfile = firstProfile

                // 現在のプロファイルの変数を読み込み
                os_log("📦 Loading variables for profile...", log: keyboardLog, type: .info)
                KeyboardLog.debug("📦 [KeyboardViewController] Loading variables for profile...")
                self.variablesMap = variableService.getVariablesMap(for: firstProfile.id)
                self.systemVariableFormats = SystemVariableFormatMapper.shared.getAll()
                os_log("✅ Loaded %d variables", log: keyboardLog, type: .info, self.variablesMap.count)
                KeyboardLog.debug("✅ [KeyboardViewController] Loaded %d variables", self.variablesMap.count)
            }

            // データを設定
            self.profiles = loadedProfiles
            self.categories = loadedCategories

            // UI更新（既にメインスレッドで実行されているため、asyncは不要）
            self.setupProfileDropdown()
            self.setupCategoryDropdown()

            if self.currentProfile != nil {
                self.reloadSnippets()
            } else {
                os_log("⚠️ No profiles found", log: keyboardLog, type: .error)
                KeyboardLog.debug("⚠️ [KeyboardViewController] No profiles found")
                self.updateEmptyState()
            }

            // ローディング画面を非表示
            self.hideLoading()

            os_log("🏁 loadInitialData completed", log: keyboardLog, type: .info)
            KeyboardLog.debug("🏁 [KeyboardViewController] loadInitialData completed")
            KeyboardLog.debug("📊 Final state: profiles=%d, categories=%d, snippets=%d",
                  self.profiles.count, self.categories.count, self.allSnippets.count)

        } catch {
            os_log("❌ Failed to load data: %@", log: keyboardLog, type: .error, error.localizedDescription)
            KeyboardLog.debug("❌ [KeyboardViewController] Failed to load data: %@", error.localizedDescription)

            // ローディング画面を非表示
            self.hideLoading()

            // 多言語対応: "エラー: データの読み込みに失敗しました" / "Failed to load data"
            self.emptyLabel.text = L10n.Error.loadFailed
        }
    }

    /// 環境ドロップダウンボタンの初期設定
    /// プロファイルが読み込まれた後に呼ばれる
    private func setupProfileDropdown() {
        if profiles.isEmpty {
            profileDropdownButton.isHidden = true
            return
        }

        // 最初のプロファイル（通常はアクティブなプロファイル）を選択状態にする
        currentProfile = profiles.first
        updateProfileDropdownTitle()

        // UIMenuを設定（iOS 14+）
        updateProfileDropdownMenu()

        profileDropdownButton.isHidden = false
    }

    /// 環境ドロップダウンのタイトルを更新
    /// 現在選択中のプロファイル名を表示
    private func updateProfileDropdownTitle() {
        let title = currentProfile?.name ?? "Profile"
        profileDropdownButton.setTitle(title, for: .normal)
    }

    /// カテゴリドロップダウンボタンの初期設定
    /// カテゴリが読み込まれた後に呼ばれる
    private func setupCategoryDropdown() {
        // 初期タイトルを設定
        updateCategoryDropdownTitle()
        // メニューを設定
        updateCategoryDropdownMenu()
    }

    /// カテゴリドロップダウンのタイトルを更新
    /// 現在選択中のカテゴリ名を表示（未選択時は「すべて」）
    private func updateCategoryDropdownTitle() {
        let title = currentCategory?.name ?? L10n.Category.all
        categoryDropdownButton.setTitle(title, for: .normal)
    }

    /// カテゴリドロップダウンメニューを更新
    /// カテゴリ一覧のメニューを生成してボタンに設定
    private func updateCategoryDropdownMenu() {
        var menuActions: [UIAction] = []

        // 「すべて」オプション
        let allAction = UIAction(
            title: L10n.Category.all,
            state: currentCategory == nil ? .on : .off
        ) { [weak self] _ in
            self?.selectCategory(nil)
        }
        menuActions.append(allAction)

        // カテゴリオプション
        for category in categories {
            let action = UIAction(
                title: category.name,
                state: category.id == currentCategory?.id ? .on : .off
            ) { [weak self] _ in
                self?.selectCategory(category)
            }
            menuActions.append(action)
        }

        let menu = UIMenu(title: "", children: menuActions)

        // iOS 14+: UIButtonのmenuプロパティを使用
        if #available(iOS 14.0, *) {
            categoryDropdownButton.menu = menu
            categoryDropdownButton.showsMenuAsPrimaryAction = true
        }
    }

    /// カテゴリを選択する
    private func selectCategory(_ category: Category?) {
        currentCategory = category
        updateCategoryDropdownTitle()
        updateCategoryDropdownMenu()  // メニューの選択状態を更新
        reloadSnippets()
    }

    /// 環境ドロップダウンメニューを更新
    /// プロファイル一覧のメニューを生成してボタンに設定
    private func updateProfileDropdownMenu() {
        // プロファイル選択メニューを作成
        var menuActions: [UIAction] = []

        for profile in profiles {
            let action = UIAction(
                title: profile.name,
                state: profile.id == currentProfile?.id ? .on : .off
            ) { [weak self] _ in
                self?.selectProfile(profile)
            }
            menuActions.append(action)
        }

        let menu = UIMenu(title: "", children: menuActions)

        // iOS 14+: UIButtonのmenuプロパティを使用
        if #available(iOS 14.0, *) {
            profileDropdownButton.menu = menu
            profileDropdownButton.showsMenuAsPrimaryAction = true
        }
    }

    /// プロファイルを選択する
    private func selectProfile(_ profile: Profile) {
        currentProfile = profile
        updateProfileDropdownTitle()
        updateProfileDropdownMenu()  // メニューの選択状態を更新

        // プロファイル切り替え時に変数を再読み込み
        variablesMap = variableService.getVariablesMap(for: profile.id)
        systemVariableFormats = SystemVariableFormatMapper.shared.getAll()
        KeyboardLog.debug("✅ [KeyboardViewController] Reloaded %d variables for profile: %@", variablesMap.count, profile.name)

        reloadSnippets()
    }

    /// スニペット一覧を再読み込み
    ///
    /// 【呼ばれるタイミング】
    /// - 画面の初期表示時
    /// - 環境（プロファイル）を切り替えたとき
    /// - カテゴリを切り替えたとき
    /// - 画面が再表示されたとき（viewWillAppear）
    ///
    /// 【フィルタリングの仕組み】
    /// 1. 現在選択中の環境（プロファイル）でフィルタ → 環境専用のスニペットのみ取得
    /// 2. さらに、カテゴリが選択されている場合はカテゴリでもフィルタ
    ///
    /// 【データの流れ】
    /// データベース → allSnippets（プロファイル+カテゴリでフィルタ済み）
    ///              → filteredSnippets（表示用、現在は同じ内容）
    ///              → 画面に表示
    private func reloadSnippets() {
        os_log("🔄 reloadSnippets started", log: keyboardLog, type: .info)
        KeyboardLog.debug("🔄 [reloadSnippets] Started")
        KeyboardLog.debug("  Current profile: %@ (id: %@)", currentProfile?.name ?? "nil", currentProfile?.id ?? "nil")
        KeyboardLog.debug("  Current category: %@ (id: %@)", currentCategory?.name ?? "all", currentCategory?.id ?? "nil")

        // プロファイルが選択されていない場合は、何も表示しない
        guard let profileId = currentProfile?.id else {
            os_log("⚠️ No profile selected, clearing snippets", log: keyboardLog, type: .error)
            KeyboardLog.debug("⚠️ [reloadSnippets] No profile selected, clearing snippets")
            allSnippets = []
            filteredSnippets = []
            updateEmptyState()  // 空状態メッセージを表示
            return
        }

        // SnippetMapperを使ってデータベースから取得
        // プロファイルとカテゴリの両方でフィルタリングされ、SQLのORDER BYでソート済み
        if let categoryId = currentCategory?.id {
            // カテゴリが選択されている場合
            os_log("🔍 Loading snippets for category: %@ with profile: %@ sortBy: %@", log: keyboardLog, type: .info, categoryId, profileId, currentSortBy)
            KeyboardLog.debug("🔍 [reloadSnippets] Loading snippets for category: %@ with profile: %@ sortBy: %@", categoryId, profileId, currentSortBy)
            allSnippets = SnippetMapper.shared.getByCategoryId(categoryId, filterByProfileId: profileId, sortBy: currentSortBy)
        } else {
            // 「すべて」が選択されている場合（カテゴリフィルタなし）
            os_log("🔍 Loading all snippets with profile: %@ sortBy: %@", log: keyboardLog, type: .info, profileId, currentSortBy)
            KeyboardLog.debug("🔍 [reloadSnippets] Loading all snippets with profile: %@ sortBy: %@", profileId, currentSortBy)
            allSnippets = SnippetMapper.shared.getAll(filterByProfileId: profileId, sortBy: currentSortBy)
        }

        os_log("✅ Loaded %d snippets", log: keyboardLog, type: .info, allSnippets.count)
        KeyboardLog.debug("✅ [reloadSnippets] Loaded %d snippets", allSnippets.count)

        // MapperでORDER BYを使ってソート済みなので、そのまま表示用にコピー
        filteredSnippets = allSnippets
        os_log("✅ Loaded and sorted snippets: %d (sortBy: %@)", log: keyboardLog, type: .info, filteredSnippets.count, currentSortBy)
        KeyboardLog.debug("✅ [reloadSnippets] Loaded and sorted snippets: %d (sortBy: %@)", filteredSnippets.count, currentSortBy)

        /* 表示内容が前回と同じなら再描画しない。
           キーボードは表示のたびに全件再取得するため、無条件にreloadDataすると
           スクロール中の再描画コストとスクロール位置の巻き戻りを招く */
        let newSignature = makeSnippetListSignature(filteredSnippets)
        if let newSignature, newSignature == snippetListSignature {
            KeyboardLog.debug("✓ [reloadSnippets] List unchanged - skip reloadData()")
            updateEmptyState()
            return
        }
        snippetListSignature = newSignature

        // テーブルビューを更新（同期的に実行）
        // 注意: UIMenuのアクションは既にメインスレッドで実行されるため、非同期にする必要はない
        tableView.reloadData()
        KeyboardLog.debug("✅ [reloadSnippets] tableView.reloadData() called")

        // 空状態の表示/非表示を更新
        updateEmptyState()
    }

    /**
     * 一覧の表示内容を表す署名を作る
     *
     * - Parameter snippets: 表示対象のスニペット
     * - Returns: 署名。表示が外部要因で変わり得る場合はnil（＝必ず再描画する）
     *
     * セルはタイトルしか表示しないため、ID・タイトル・並び順が同じなら描画結果も同じになる。
     * ただしタイトルに変数を含む場合は、データが同じでも時刻などで表示が変わるためnilを返す。
     */
    private func makeSnippetListSignature(_ snippets: [Snippet]) -> String? {
        if snippets.contains(where: { variableReplacer.hasVariables(in: $0.title ?? "") }) {
            return nil
        }

        return snippets
            .map { "\($0.id)\u{1F}\($0.title ?? "")" }
            .joined(separator: "\u{1E}")
    }

    private func filterSnippets() {
        // カテゴリフィルタはreloadSnippetsで直接適用されるため、このメソッドは不要
        // ただし、既存の呼び出し元があるので維持
        if let categoryId = currentCategory?.id {
            filteredSnippets = allSnippets.filter { $0.categoryId == categoryId }
        } else {
            filteredSnippets = allSnippets
        }

        updateEmptyState()
    }

    private func updateEmptyState() {
        applyScreenState()
        /* 注意: tableView.reloadData() は reloadSnippets() でメインスレッドで直接呼び出すため、ここでは呼ばない */
    }

    /** 現在の画面状態に応じて、一覧と全画面ビューを排他的に表示する */
    private func applyScreenState() {
        let isList = screenState == .list
        let isTyping = screenState == .typing
        let isEmpty = filteredSnippets.isEmpty

        /* ツールバーはモード切替ボタンを載せているため、入力中も出しておく */
        filterContainerView.isHidden = !isList && !isTyping

        /* 入力中は定型文の絞り込みが意味を持たないため隠す */
        profileDropdownButton.isHidden = isTyping
        categoryDropdownButton.isHidden = isTyping
        sortButton.isHidden = isTyping
        settingsButton.isHidden = isTyping

        tableView.isHidden = !isList || isEmpty
        emptyLabel.isHidden = !isList || !isEmpty
        keyboardAreaView.isHidden = !isTyping
        candidateBarView.isHidden = !isTyping

        detailView.isHidden = screenState != .detail
        loadingView.isHidden = screenState != .loading
        settingsView.isHidden = screenState != .settings

        updateKeyboardModeButton()
    }

    // MARK: - 文字入力

    /**
     * 入力の状態機械と拡張キーボードのAPIを結ぶ
     */
    private func setupInputSession() {
        /*
         * 他のキーボードへの切り替えはAppleが全カスタムキーボードに求めている。
         * 実装していないと審査で落ちる。
         */
        inputSession.onNextKeyboard = { [weak self] in
            self?.advanceToNextInputMode()
        }

        inputSession.onToggleSnippetList = { [weak self] in
            self?.switchScreenState(to: .list)
        }

        /* エンジンが無い・辞書が読めない場合、セッションは直接入力へ縮退する */
        inputSession.engine = kanaKanjiEngine
    }

    /**
     * モード切替ボタンのアイコンを現在のモードに合わせる
     */
    private func updateKeyboardModeButton() {
        let config = UIImage.SymbolConfiguration(pointSize: 14, weight: .medium)
        let name = screenState == .typing ? "list.bullet" : "keyboard"
        keyboardModeButton.setImage(UIImage(systemName: name, withConfiguration: config), for: .normal)
        keyboardModeButton.accessibilityLabel = screenState == .typing
            ? L10n.Accessibility.snippetListButton
            : L10n.Accessibility.keyboardModeButton
    }

    /**
     * 定型文の一覧と文字入力を切り替える
     */
    @objc private func keyboardModeButtonTapped() {
        switchScreenState(to: screenState == .typing ? .list : .typing)
    }

    /**
     * 画面を切り替え、次回の起動でも同じモードで開けるよう覚えておく
     */
    private func switchScreenState(to state: ScreenState) {
        /* 入力モードを離れるときは、打ちかけの未確定文字列を捨てずに確定してから移る */
        if screenState == .typing && state != .typing {
            inputSession.flushComposition()
        }
        screenState = state
        applyScreenState()
        saveKeyboardMode()
    }

    /** 最後に使ったモードを保存する */
    private func saveKeyboardMode() {
        UserDefaults.standard.set(screenState == .typing, forKey: keyboardModePreferenceKey)
    }

    /** 最後に使ったモードを読み出す */
    private func loadKeyboardMode() -> ScreenState {
        UserDefaults.standard.bool(forKey: keyboardModePreferenceKey) ? .typing : .list
    }

    /// スニペットの詳細画面（プレビュー）を表示
    ///
    /// - Parameter snippet: 表示するスニペット
    ///
    /// 【処理の流れ】
    /// 1. スニペットを選択状態として保存
    /// 2. copyWithTitleフラグに応じてタイトルの表示/非表示を切り替え
    /// 3. 変数（{{today}}など）を実際の値に置き換えてプレビュー表示
    /// 4. アニメーションで詳細画面をフェードイン表示
    ///
    /// 【変数置換の仕組み】
    /// - 現在選択中の環境（プロファイル）の変数マップを取得
    /// - VariableReplacerを使って{{変数名}}を実際の値に置き換え
    /// - 例: "こんにちは{{client_name}}様" → "こんにちは田中様"
    private func showSnippetDetail(_ snippet: Snippet) {
        selectedSnippet = snippet  // 後でコピーボタンを押したときのために保存

        // 変数マップを取得（プロファイルに紐づく変数の一覧）
        var variablesMap: [String: String] = [:]
        if let profileId = currentProfile?.id {
            variablesMap = VariableService.shared.getVariablesMap(for: profileId)
        }

        let variableReplacer = VariableReplacer()

        // copyWithTitleフラグに応じてタイトル表示を制御
        // タイトルもコピーする設定の場合のみ、プレビューでもタイトルを表示
        if snippet.copyWithTitle {
            /* タイトルがNULLでも空文字でもプレースホルダーを表示する */
            let title = snippet.title ?? ""
            let rawTitle = title.isEmpty ? L10n.Snippet.noTitle : title
            let replacedTitle = variableReplacer.replace(
                in: rawTitle,
                variablesMap: variablesMap,
                formats: systemVariableFormats
            )
            detailTitleLabel.text = replacedTitle
            detailTitleLabel.isHidden = false
            /* タイトルが未設定のスニペットはプレースホルダー表示のみで、挿入するものがないためボタンは隠す */
            titleInsertButton.isHidden = title.isEmpty
            titleSeparatorView.isHidden = false
            /* 同一アンカーへの等式のため、必ずdeactivateしてからactivateする */
            if let contentTopToTitle = contentTopToTitleConstraint {
                NSLayoutConstraint.deactivate([contentTopToTitle])
            }
            if let contentTopToSeparator = contentTopToSeparatorConstraint {
                NSLayoutConstraint.activate([contentTopToSeparator])
            }
            /* ボタンを表示するときだけ、区切り線をボタンの下へ押し下げる制約を有効にする */
            separatorTopToButtonConstraint?.isActive = !titleInsertButton.isHidden
        } else {
            // タイトル行と区切り線を非表示（コピーしない設定の場合）
            /* 非表示のラベルもテキストが残っていると高さを持つため、本文の位置がずれないようクリアする */
            detailTitleLabel.text = nil
            detailTitleLabel.isHidden = true
            titleInsertButton.isHidden = true
            titleSeparatorView.isHidden = true
            /* 非表示ボタン基準の制約が残るとタイトルラベルが引き伸ばされ本文が押し下がるため必ず外す */
            separatorTopToButtonConstraint?.isActive = false
            /* 同一アンカーへの等式のため、必ずdeactivateしてからactivateする */
            if let contentTopToSeparator = contentTopToSeparatorConstraint {
                NSLayoutConstraint.deactivate([contentTopToSeparator])
            }
            if let contentTopToTitle = contentTopToTitleConstraint {
                NSLayoutConstraint.activate([contentTopToTitle])
            }
        }

        // 内容を変数置換（{{today}} → 2025/11/17など）
        let preview = variableReplacer.replace(
            in: snippet.content,
            variablesMap: variablesMap,
            formats: systemVariableFormats
        )
        detailContentLabel.text = preview

        /* 前に開いたスニペットのスクロール位置が残ると、最上部のタイトル行と
           タイトル挿入ボタンが画面外になって見えないため先頭へ戻す */
        detailScrollView.setContentOffset(.zero, animated: false)

        // アニメーションで詳細画面を表示
        screenState = .detail
        applyScreenState()

        // フェードインアニメーション（0.2秒かけて透明→不透明）
        detailView.alpha = 0
        UIView.animate(withDuration: 0.2) {
            self.detailView.alpha = 1
        }
    }

    /// 詳細画面を閉じてスニペット一覧に戻る
    ///
    /// 【処理の流れ】
    /// 1. フェードアウトアニメーションで詳細画面を非表示
    /// 2. スニペット一覧を再表示（空の場合は空状態メッセージを表示）
    /// 3. 選択中のスニペットをクリア
    @objc private func closeDetailView() {
        // フェードアウトアニメーション（0.2秒かけて不透明→透明）
        UIView.animate(withDuration: 0.2, animations: {
            self.detailView.alpha = 0
        }) { _ in
            // アニメーション完了後の処理
            if self.screenState == .detail {
                self.screenState = .list
                self.applyScreenState()
            }
            self.selectedSnippet = nil  // 選択解除
        }
    }

    /// コピーボタンがタップされたときの処理
    ///
    /// 【処理の流れ】
    /// 1. 選択中のスニペットを確認
    /// 2. スニペットをテキスト入力欄に挿入
    /// 3. 詳細画面を閉じる
    @objc private func copyButtonTapped() {
        guard let snippet = selectedSnippet else {
            // 選択中のスニペットがない場合（通常は発生しない）
            os_log("⚠️ Copy button tapped but no snippet selected", log: keyboardLog, type: .error)
            KeyboardLog.debug("⚠️ [KeyboardViewController] Copy button tapped but no snippet selected")
            return
        }

        KeyboardLog.debug("[KeyboardViewController] Copy button tapped")

        insertSnippet(snippet)  // スニペットの本文を挿入
        closeDetailView()  // 詳細画面を閉じる
    }

    /// タイトル挿入ボタンがタップされたときの処理
    ///
    /// 【処理の流れ】
    /// 1. 選択中のスニペットを確認
    /// 2. タイトルだけをテキスト入力欄に挿入
    ///
    /// 【詳細画面を閉じない理由】
    /// メールの件名を入れたあと、続けて本文を別の欄へ入れられるようにするため、
    /// タイトル挿入後も詳細画面は開いたままにします。
    @objc private func titleInsertButtonTapped() {
        guard let snippet = selectedSnippet else {
            // 選択中のスニペットがない場合（通常は発生しない）
            os_log("⚠️ Title insert button tapped but no snippet selected", log: keyboardLog, type: .error)
            KeyboardLog.debug("⚠️ [KeyboardViewController] Title insert button tapped but no snippet selected")
            return
        }

        KeyboardLog.debug("[KeyboardViewController] Title insert button tapped")

        // タイトルのみを挿入（変数置換＋振動フィードバックはService側で実行）
        snippetService.insertTitle(
            snippet,
            into: textDocumentProxy,  // iOSのテキスト入力API
            profileId: currentProfile?.id  // 環境IDを渡して、環境専用の変数を使用
        )
    }

    /// 改行ボタンがタップされたときの処理
    ///
    /// 【処理の流れ】
    /// 1. 改行だけをテキスト入力欄に挿入
    ///
    /// 【スニペットを参照しない理由】
    /// 挿入するのは改行のみで、変数置換もプロファイルも関与しないため、
    /// 選択中のスニペットの有無に関わらず動作します。
    ///
    /// 【詳細画面を閉じない理由】
    /// 「タイトル挿入 → 改行 → 本文挿入」と続けて操作できるようにするため、
    /// 改行挿入後も詳細画面は開いたままにします。
    @objc private func newlineButtonTapped() {
        KeyboardLog.debug("[KeyboardViewController] Newline button tapped")

        // 改行を挿入（振動フィードバックはService側で実行）
        snippetService.insertNewline(into: textDocumentProxy)  // iOSのテキスト入力API
    }

    /// スニペットをテキスト入力欄に挿入（キーボードのメイン処理）
    ///
    /// - Parameter snippet: 挿入するスニペット
    ///
    /// 【処理の流れ】
    /// 1. SnippetServiceに処理を委譲
    /// 2. Service内で以下の処理が実行されます：
    ///    - 本文のみを挿入対象にする（タイトルはタイトル挿入ボタンから個別に挿入）
    ///    - 変数（{{today}}など）を実際の値に置き換え
    ///    - textDocumentProxy（iOSのテキスト入力API）を使ってテキストを挿入
    ///    - 振動フィードバック（Haptic Feedback）を実行
    ///
    /// 【textDocumentProxyとは】
    /// iOSが提供するAPI。カスタムキーボードから、現在フォーカスされている
    /// テキストフィールドにテキストを挿入できます。
    /// 例: LINEのメッセージ入力欄、メモアプリなど、どのアプリでも動作します
    private func insertSnippet(_ snippet: Snippet) {
        os_log("📝 insertSnippet called for snippet: %@", log: keyboardLog, type: .info, snippet.id)
        KeyboardLog.debug("📝 [KeyboardViewController] insertSnippet called for snippet: %@", snippet.id)
        KeyboardLog.debug("📝 [KeyboardViewController] Current profile: %@", currentProfile?.name ?? "nil")

        // Serviceを使用してスニペットを挿入（変数置換＋振動フィードバック）
        // ビジネスロジックはServiceに集約することで、コードの見通しが良くなります
        snippetService.insertSnippet(
            snippet,
            into: textDocumentProxy,  // iOSのテキスト入力API
            profileId: currentProfile?.id  // 環境IDを渡して、環境専用の変数を使用
        )

        os_log("✅ insertSnippet completed", log: keyboardLog, type: .info)
        KeyboardLog.debug("✅ [KeyboardViewController] insertSnippet completed")
    }

    // MARK: - Sort Methods（ソート関連メソッド）

    /// ソートボタンのメニューを設定
    /// iOS 14以降のUIMenuを使用して、タップ時にメニューを表示
    /// 4種類の並び順はいずれもDBの読み取りだけで成立するため、常に全項目を表示する
    private func setupSortButtonMenu() {
        /* 注意: currentSortByは呼び出し元で設定済みのため、ここでは再読み込みしない
           viewDidLoad時にloadSortPreference()で初期化される */
        KeyboardLog.debug("🔄 [Sort] Building menu with sort preference: %@", currentSortBy)

        // メニュー項目を作成
        let createdAction = UIAction(
            title: L10n.Sort.created,
            image: currentSortBy == "created" ? UIImage(systemName: "checkmark") : nil
        ) { [weak self] _ in
            self?.updateSortPreference("created")
        }

        let updatedAction = UIAction(
            title: L10n.Sort.updated,
            image: currentSortBy == "updated" ? UIImage(systemName: "checkmark") : nil
        ) { [weak self] _ in
            self?.updateSortPreference("updated")
        }

        let titleAction = UIAction(
            title: L10n.Sort.title,
            image: currentSortBy == "title" ? UIImage(systemName: "checkmark") : nil
        ) { [weak self] _ in
            self?.updateSortPreference("title")
        }

        /* 使用頻度順はDBの読み取りだけで成立するため、フルアクセスの有無に関わらず提供する
           （フルアクセスなしでもアプリ本体が記録した使用回数で並べ替えできる） */
        let usageAction = UIAction(
            title: L10n.Sort.usage,
            image: currentSortBy == "usage" ? UIImage(systemName: "checkmark") : nil
        ) { [weak self] _ in
            self?.updateSortPreference("usage")
        }

        let menuChildren: [UIAction] = [createdAction, updatedAction, titleAction, usageAction]

        // メニューを作成してボタンに設定
        let menu = UIMenu(title: L10n.Sort.label, children: menuChildren)
        sortButton.menu = menu

        // バッジ表示を更新
        updateSortBadgeVisibility()
    }

    /// ソート設定を更新
    private func updateSortPreference(_ sortBy: String) {
        KeyboardLog.debug("🔄 [Sort] Updating sort preference: %@ → %@", currentSortBy, sortBy)
        currentSortBy = sortBy
        saveSortPreference(sortBy)

        // メニューを更新（チェックマークを更新）
        setupSortButtonMenu()

        // スニペット一覧を再読み込み
        reloadSnippets()

        // リストのトップにスクロール
        if !filteredSnippets.isEmpty {
            tableView.scrollToRow(at: IndexPath(row: 0, section: 0), at: .top, animated: true)
        }
    }

    /// ソート設定を保存（UserDefaults）
    private func saveSortPreference(_ sortBy: String) {
        UserDefaults.standard.set(sortBy, forKey: sortPreferenceKey)
        KeyboardLog.debug("💾 [Sort] Saved sort preference: %@", sortBy)
    }

    /// ソート設定を読み込み（UserDefaults）
    private func loadSortPreference() -> String {
        let sortBy = UserDefaults.standard.string(forKey: sortPreferenceKey) ?? "created"
        return sortBy
    }

    /// フルアクセス状態をApp Group UserDefaultsに保存
    /// UIInputViewControllerを継承しないSnippetServiceから参照できるようにする
    private func saveFullAccessState() {
        guard let userDefaults = UserDefaults(suiteName: appGroupIdentifier) else {
            KeyboardLog.debug("⚠️ [FullAccess] Failed to get App Group UserDefaults")
            return
        }
        userDefaults.set(self.hasFullAccess, forKey: fullAccessStateKey)
        KeyboardLog.debug("💾 [FullAccess] Saved full access state: %@", self.hasFullAccess ? "true" : "false")
    }

    /// バッジの表示/非表示を更新
    /// デフォルト（created）以外の時にバッジを表示
    private func updateSortBadgeVisibility() {
        let isDefaultSort = currentSortBy == "created"
        sortBadgeView.isHidden = isDefaultSort
    }

    // MARK: - Settings（設定関連）

    /// 設定ボタンがタップされた時のアクション
    @objc private func settingsButtonTapped() {
        KeyboardLog.debug("⚙️ [Settings] Settings button tapped")
        showSettingsView()
    }

    /// 設定画面を表示
    private func showSettingsView() {
        // タイトルを設定
        settingsTitleLabel.text = L10n.Settings.title

        // 見出しラベルを設定
        usageTrackingLabel.text = L10n.Settings.usageTracking

        /* 記録状態を表示（フルアクセスなしでは共有DBへ書き込めないため記録できない） */
        usageTrackingStatusLabel.text = self.hasFullAccess
            ? L10n.Settings.usageTrackingActive
            : L10n.Settings.usageTrackingInactive
        usageTrackingStatusLabel.textColor = self.hasFullAccess ? .systemGreen : .secondaryLabel

        // フルアクセスヒントの表示/非表示
        fullAccessHintLabel.text = L10n.Settings.usageTrackingRequiresFullAccess
        fullAccessHintLabel.isHidden = self.hasFullAccess

        // フルアクセス許可手順の表示/非表示
        fullAccessInstructionsLabel.text = L10n.Settings.fullAccessInstructions
        fullAccessInstructionsLabel.isHidden = self.hasFullAccess

        // 見出しの色を更新
        usageTrackingLabel.textColor = self.hasFullAccess ? .label : .secondaryLabel

        // 設定画面を表示
        screenState = .settings
        applyScreenState()
    }

    /// 設定画面を閉じる
    @objc private func closeSettingsView() {
        KeyboardLog.debug("⚙️ [Settings] Closing settings view")
        screenState = .list
        applyScreenState()
    }

}

extension KeyboardViewController: UITableViewDataSource {
    func tableView(_ tableView: UITableView, numberOfRowsInSection section: Int) -> Int {
        return filteredSnippets.count
    }

    func tableView(_ tableView: UITableView, cellForRowAt indexPath: IndexPath) -> UITableViewCell {
        guard let cell = tableView.dequeueReusableCell(
            withIdentifier: SnippetCell.reuseIdentifier,
            for: indexPath
        ) as? SnippetCell else {
            return UITableViewCell()
        }

        let snippet = filteredSnippets[indexPath.row]

        // タイトルを変数置換する
        let rawTitle = snippet.title ?? L10n.Snippet.noTitle
        let replacedTitle = variableReplacer.replace(
            in: rawTitle,
            variablesMap: variablesMap,
            formats: systemVariableFormats
        )

        cell.configure(title: replacedTitle)

        return cell
    }
}

extension KeyboardViewController: UITableViewDelegate {
    func tableView(_ tableView: UITableView, didSelectRowAt indexPath: IndexPath) {
        os_log("👆 Snippet tapped at index: %d", log: keyboardLog, type: .info, indexPath.row)
        KeyboardLog.debug("👆 [KeyboardViewController] Snippet tapped at index: %d", indexPath.row)

        tableView.deselectRow(at: indexPath, animated: true)
        let snippet = filteredSnippets[indexPath.row]

        KeyboardLog.debug("[KeyboardViewController] Showing snippet detail")

        showSnippetDetail(snippet)
    }

    // MARK: - Loading State（ローディング状態管理）

    /// ローディング画面を表示
    /// データ読み込み開始時に呼び出されます
    private func showLoading() {
        screenState = .loading
        applyScreenState()
        activityIndicator.startAnimating()
    }

    /// ローディング画面を非表示
    /// データ読み込み完了時に呼び出されます
    private func hideLoading() {
        if screenState == .loading {
            /* 前回使っていたモードで開く。毎回切り替え直す手間をなくすため */
            screenState = loadKeyboardMode()
            applyScreenState()
        }
        activityIndicator.stopAnimating()
    }

}

// MARK: - ExpandedHitAreaButton

/**
 * 見た目より広い当たり判定を持つ丸ボタン
 *
 * 【なぜ必要か】
 * タイトル行に置く挿入ボタンは、タイトル文字と釣り合う32ptの見た目にしたい。
 * 一方でタップ領域は最低44x44ptを確保する必要があるため、
 * 描画サイズはそのままに、当たり判定だけを44x44ptへ広げる。
 *
 * 【ファイル配置について】
 * 新しいSwiftファイルを追加するとproject.pbxprojの更新が必要になるため、
 * KeyboardViewControllerと同じファイルに定義している。
 */
final class ExpandedHitAreaButton: UIButton {

    /// 確保する最小タップ領域（pt）
    private static let minimumHitSize: CGFloat = 44

    /// タップ判定の範囲を最小タップ領域まで広げる
    /// - Parameters:
    ///   - point: 自身の座標系でのタッチ位置
    ///   - event: 対象のイベント
    /// - Returns: タップ領域に含まれる場合はtrue
    override func point(inside point: CGPoint, with event: UIEvent?) -> Bool {
        /* 32ptなら上下左右に6ptずつ広げて44ptにする。既に44pt以上なら広げない */
        let horizontalInset = min(0, (bounds.width - Self.minimumHitSize) / 2)
        let verticalInset = min(0, (bounds.height - Self.minimumHitSize) / 2)
        return bounds.insetBy(dx: horizontalInset, dy: verticalInset).contains(point)
    }
}

// MARK: - SnippetCell

/**
 * スニペット一覧の行セル
 *
 * 【なぜ専用セルにするか】
 * defaultContentConfigurationは内部ビューの大きさを文字量に合わせて決めるため、
 * 行のどこを触ってもタッチが拾える保証がない。
 * ラベルをcontentViewいっぱいに広げ、行全体を確実にタップ・ドラッグ対象にする。
 *
 * 【ファイル配置について】
 * 新しいSwiftファイルを追加するとproject.pbxprojの更新が必要になるため、
 * KeyboardViewControllerと同じファイルに定義している。
 */
final class SnippetCell: UITableViewCell {

    /// 再利用識別子
    static let reuseIdentifier = "SnippetCell"

    /// 行の高さ（pt）。自動高さ計算を使わず固定値で確定させる
    static let rowHeight: CGFloat = 44

    /// スニペットのタイトルを表示するラベル
    private let titleLabel: UILabel = {
        let label = UILabel()
        label.font = .systemFont(ofSize: 15)
        label.textColor = .label
        label.lineBreakMode = .byTruncatingTail
        label.translatesAutoresizingMaskIntoConstraints = false
        return label
    }()

    override init(style: UITableViewCell.CellStyle, reuseIdentifier: String?) {
        super.init(style: style, reuseIdentifier: reuseIdentifier)
        setupCell()
    }

    required init?(coder: NSCoder) {
        super.init(coder: coder)
        setupCell()
    }

    /**
     * セルの見た目とレイアウトを設定する
     *
     * ラベルはcontentViewの上下左右いっぱいに広げる。
     * contentViewのタッチを無効にしているのは、行内のビューがタッチを横取りしないようにするため。
     * 選択とスクロールはテーブルビュー側が処理するので、無効にしても行のタップは動作する。
     */
    private func setupCell() {
        backgroundColor = .clear
        accessoryType = .disclosureIndicator
        contentView.isUserInteractionEnabled = false

        contentView.addSubview(titleLabel)
        NSLayoutConstraint.activate([
            titleLabel.leadingAnchor.constraint(equalTo: contentView.leadingAnchor, constant: 16),
            titleLabel.trailingAnchor.constraint(equalTo: contentView.trailingAnchor, constant: -8),
            titleLabel.topAnchor.constraint(equalTo: contentView.topAnchor),
            titleLabel.bottomAnchor.constraint(equalTo: contentView.bottomAnchor)
        ])

        let selectedBackground = UIView()
        selectedBackground.backgroundColor = .secondarySystemFill
        selectedBackgroundView = selectedBackground
    }

    /**
     * 表示するタイトルを設定する
     *
     * - Parameter title: 変数置換済みのタイトル
     */
    func configure(title: String) {
        titleLabel.text = title
    }
}

// MARK: - UIColor Extension

/// UIColorの拡張：16進数カラーコード（Hex）からUIColorを生成
///
/// 【用途】
/// カテゴリの色をデータベースに"#FF5733"のような文字列で保存しており、
/// それをUIColorに変換してボタンの色として表示するために使います
///
/// 【使用例】
/// let color = UIColor(hex: "#FF5733")  // オレンジ色
/// let color = UIColor(hex: "007AFF")   // 青色（#なしでもOK）
extension UIColor {
    /// 16進数カラーコードからUIColorを生成する便利イニシャライザ
    ///
    /// - Parameter hex: 16進数カラーコード（例: "#FF5733" または "FF5733"）
    ///
    /// 【対応フォーマット】
    /// - 6桁: "#RRGGBB" → RGB（例: "#FF5733"）
    /// - 8桁: "#RRGGBBAA" → RGBA（例: "#FF573380"、最後の2桁は透明度）
    ///
    /// 【処理の流れ】
    /// 1. 前後の空白を削除し、"#"を除去
    /// 2. 16進数文字列を数値に変換
    /// 3. ビット演算で各色成分（R, G, B, A）を抽出
    /// 4. 0〜255の範囲を0.0〜1.0に正規化してUIColorを生成
    convenience init?(hex: String) {
        // 前後の空白を削除し、#を除去
        var hexSanitized = hex.trimmingCharacters(in: .whitespacesAndNewlines)
        hexSanitized = hexSanitized.replacingOccurrences(of: "#", with: "")

        // 16進数文字列を数値（UInt64）に変換
        var rgb: UInt64 = 0
        guard Scanner(string: hexSanitized).scanHexInt64(&rgb) else { return nil }

        let length = hexSanitized.count
        let r, g, b, a: CGFloat

        if length == 6 {
            // 6桁の場合: RRGGBB
            // ビット演算で各色成分を抽出
            // 例: 0xFF5733 → R=0xFF, G=0x57, B=0x33
            r = CGFloat((rgb & 0xFF0000) >> 16) / 255.0  // 赤: 上位8ビット
            g = CGFloat((rgb & 0x00FF00) >> 8) / 255.0   // 緑: 中位8ビット
            b = CGFloat(rgb & 0x0000FF) / 255.0          // 青: 下位8ビット
            a = 1.0  // 不透明
        } else if length == 8 {
            // 8桁の場合: RRGGBBAA（透明度付き）
            r = CGFloat((rgb & 0xFF000000) >> 24) / 255.0  // 赤
            g = CGFloat((rgb & 0x00FF0000) >> 16) / 255.0  // 緑
            b = CGFloat((rgb & 0x0000FF00) >> 8) / 255.0   // 青
            a = CGFloat(rgb & 0x000000FF) / 255.0          // 透明度（Alpha）
        } else {
            // 6桁または8桁以外は対応していない
            return nil
        }

        // RGBAの各成分からUIColorを生成
        self.init(red: r, green: g, blue: b, alpha: a)
    }
}
