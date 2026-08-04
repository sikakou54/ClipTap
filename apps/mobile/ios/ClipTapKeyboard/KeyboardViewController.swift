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

// ログ出力用の設定（デバッグやエラー追跡に使用）
// 開発中の動作確認や、本番環境でのトラブルシューティングに役立ちます
let keyboardLog = OSLog(subsystem: "com.sikakou.cliptap.keyboard", category: "KeyboardViewController")

/// カスタムキーボードのメインビューコントローラー
/// UIInputViewControllerを継承することで、iOSのカスタムキーボード機能を実装できます
class KeyboardViewController: UIInputViewController {

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
    private let subscriptionManager = SubscriptionManager.shared

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

    /// ソート設定を保存するUserDefaultsキー
    private let sortPreferenceKey = "keyboard_snippet_sort_by"

    /// フルアクセス状態を共有するApp GroupのUserDefaultsキー
    private let fullAccessStateKey = "keyboardHasFullAccess"

    /// App Group識別子
    private let appGroupIdentifier = "group.com.sikakou.cliptap"

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
        button.layer.borderWidth = 1
        button.layer.borderColor = UIColor.systemGray.cgColor
        button.backgroundColor = .systemGray6
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
        button.layer.borderWidth = 1
        button.layer.borderColor = UIColor.systemGray.cgColor
        button.backgroundColor = .systemGray6
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
        button.tintColor = .secondaryLabel
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
        button.tintColor = .secondaryLabel
        button.backgroundColor = .clear
        button.translatesAutoresizingMaskIntoConstraints = false
        return button
    }()

    /// 使用頻度追跡を有効にするかどうかのUserDefaultsキー
    private let usageTrackingKey = "usageTrackingEnabled"

    /// 使用頻度追跡が有効かどうかを設定したことがあるかのUserDefaultsキー
    private let usageTrackingEnabledSetKey = "usageTrackingEnabledSet"

    // === スニペット一覧エリア ===

    /// スニペット一覧を表示するテーブルビュー（リスト形式）
    /// 各行をタップすると、詳細画面（プレビュー）が表示されます
    private let tableView: UITableView = {
        let tv = UITableView()
        tv.backgroundColor = .systemGroupedBackground  // iOS標準のグループ化された背景色
        tv.translatesAutoresizingMaskIntoConstraints = false
        return tv
    }()

    // === 詳細表示エリア（プレビュー画面）===
    // スニペットをタップすると全画面表示される

    /// 詳細表示画面の全体を包むビュー
    /// 初期状態では非表示（isHidden = true）
    private let detailView: UIView = {
        let view = UIView()
        view.backgroundColor = .systemBackground  // システム標準の背景色（ライト/ダークモード対応）
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
        label.font = .boldSystemFont(ofSize: 14)  // 太字、14ポイント
        label.numberOfLines = 0  // 複数行表示可能（改行を許可）
        label.translatesAutoresizingMaskIntoConstraints = false
        return label
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

    // === ボタンエリア（詳細画面下部）===

    /// コピーボタンと閉じるボタンを配置するコンテナビュー
    /// 画面下部に固定表示されます
    private let buttonContainerView: UIView = {
        let view = UIView()
        view.backgroundColor = .clear  // 透明（背景を透過）
        view.translatesAutoresizingMaskIntoConstraints = false
        return view
    }()

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
        button.backgroundColor = .systemGray5  // 薄いグレーの背景
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
        view.backgroundColor = .systemBackground
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
        view.backgroundColor = .systemBackground
        view.translatesAutoresizingMaskIntoConstraints = false
        view.isHidden = true
        return view
    }()

    /// 設定画面のヘッダービュー
    private let settingsHeaderView: UIView = {
        let view = UIView()
        view.backgroundColor = .systemBackground
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
        button.backgroundColor = .systemGray5
        button.tintColor = .label
        button.layer.cornerRadius = 15
        button.translatesAutoresizingMaskIntoConstraints = false
        return button
    }()

    /// 使用頻度スイッチの行コンテナ
    private let usageTrackingRowView: UIView = {
        let view = UIView()
        view.backgroundColor = .secondarySystemBackground
        view.layer.cornerRadius = 10
        view.translatesAutoresizingMaskIntoConstraints = false
        return view
    }()

    /// 使用頻度ラベル
    private let usageTrackingLabel: UILabel = {
        let label = UILabel()
        label.font = .systemFont(ofSize: 15)
        label.translatesAutoresizingMaskIntoConstraints = false
        return label
    }()

    /// 使用頻度スイッチ
    private let usageTrackingSwitch: UISwitch = {
        let switchControl = UISwitch()
        switchControl.translatesAutoresizingMaskIntoConstraints = false
        return switchControl
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
        label.textColor = .tertiaryLabel
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
        NSLog("============================================================")
        NSLog("🎯🎯🎯 [KeyboardViewController] viewDidLoad CALLED 🎯🎯🎯")
        NSLog("============================================================")

        view.backgroundColor = .systemBackground  // 背景色を設定

        /* フルアクセス状態をApp Group UserDefaultsに保存（メインアプリと共有） */
        saveFullAccessState()

        /* ソート設定を初期読み込み（setupUIより前に実行する必要あり） */
        currentSortBy = loadSortPreference()

        /* フルアクセスOFFで使用頻度ソートが選択されている場合はデフォルトにリセット */
        if !self.hasFullAccess && currentSortBy == "usage" {
            currentSortBy = "created"
            saveSortPreference(currentSortBy)
            NSLog("🔄 [Sort] Reset sort preference to 'created' because full access is OFF")
        }

        NSLog("🔄 [Sort] Initial sort preference loaded: %@", currentSortBy)

        setupUI()  // UI部品を画面に配置（即座に表示）

        // キャッシュをクリアして最新状態を取得
        subscriptionManager.invalidateCache()

        // App Groupからサブスクリプション状態を取得
        let status = subscriptionManager.getSubscriptionStatus()
        NSLog("🔐 [KeyboardViewController] Subscription status from App Group: \(status)")

        // データなし、期限切れの場合はメッセージを表示
        // FREE版でも拡張キーボードを使えるように変更
        if status == .noData || status == .expired {
            showSubscriptionMessage(status: status)
            return
        }

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

        NSLog("============================================================")
        NSLog("👁️👁️👁️ [KeyboardViewController] viewWillAppear CALLED 👁️👁️👁️")
        NSLog("============================================================")

        // キャッシュをクリアして最新状態を取得
        subscriptionManager.invalidateCache()

        // サブスクリプション状態をチェック
        let status = subscriptionManager.getSubscriptionStatus()

        if status == .noData || status == .expired {
            // データなし or 期限切れの場合は何もしない（viewDidLoadで既にメッセージ表示済み）
            NSLog("🔒 [KeyboardViewController] viewWillAppear - Status: \(status), skipping refresh")
            return
        }

        // キーボードの高さを設定（コンパクトに）
        let heightConstraint = NSLayoutConstraint(
            item: view!,
            attribute: .height,
            relatedBy: .equal,
            toItem: nil,
            attribute: .notAnAttribute,
            multiplier: 0,
            constant: 260  // 260ptに制限
        )
        heightConstraint.priority = .required
        view.addConstraint(heightConstraint)

        // キーボードが表示される度に全データをリフレッシュ
        // これにより、メインアプリでの変更がキーボードにも即座に反映されます
        NSLog("🔄 [KeyboardViewController] viewWillAppear - Refreshing all data...")
        refreshAllData()
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
        NSLog("🔄🔄🔄 [refreshAllData] STARTED 🔄🔄🔄")
        do {
            // データベースが初期化されているか確認
            try Database.shared.initialize()

            // 変数値と書式設定は表示のたびに再読込する
            systemVariableFormats = SystemVariableFormatMapper.shared.getAll()
            if let profileId = currentProfile?.id {
                variablesMap = variableService.getVariablesMap(for: profileId)
            }

            // プロファイルを再読み込み
            NSLog("🔄 [Refresh] Loading profiles...")
            let newProfiles = profileService.getAllProfiles()

            // プロファイルが変更されたかチェック
            let profilesChanged = profiles.count != newProfiles.count ||
                                  profiles.map({ $0.id }) != newProfiles.map({ $0.id })

            if profilesChanged {
                NSLog("📝 [Refresh] Profiles changed: %d → %d", profiles.count, newProfiles.count)
                profiles = newProfiles
                setupProfileDropdown()

                // アクティブなプロファイルを設定
                if let activeProfile = profiles.first(where: { $0.isActive }) {
                    currentProfile = activeProfile
                } else if let firstProfile = profiles.first {
                    currentProfile = firstProfile
                }
            } else {
                NSLog("✓ [Refresh] Profiles unchanged: %d profiles", profiles.count)
            }

            if let profileId = currentProfile?.id {
                variablesMap = variableService.getVariablesMap(for: profileId)
            }

            // カテゴリを再読み込み
            NSLog("🔄 [Refresh] Loading categories...")
            let newCategories = categoryService.getAll()

            let categoriesChanged = categories.count != newCategories.count ||
                                   categories.map({ $0.id }) != newCategories.map({ $0.id })

            if categoriesChanged {
                NSLog("📝 [Refresh] Categories changed: %d → %d", categories.count, newCategories.count)
                categories = newCategories
                setupCategoryDropdown()
            } else {
                NSLog("✓ [Refresh] Categories unchanged: %d categories", categories.count)
            }

            // スニペットを再読み込み
            NSLog("🔄 [Refresh] Loading snippets...")
            let previousCount = allSnippets.count
            reloadSnippets()
            let newCount = allSnippets.count

            if previousCount != newCount {
                NSLog("📝 [Refresh] Snippets changed: %d → %d", previousCount, newCount)
            } else {
                NSLog("✓ [Refresh] Snippets unchanged: %d snippets", newCount)
            }

            NSLog("✅ [Refresh] All data refreshed successfully")

        } catch {
            NSLog("❌ [Refresh] Failed to refresh data: %@", error.localizedDescription)
        }
    }

    private func setupUI() {
        // 統合フィルターコンテナ（環境ドロップダウン + カテゴリドロップダウン + ソートボタン + 設定ボタン）
        view.addSubview(filterContainerView)
        filterContainerView.addSubview(profileDropdownButton)
        filterContainerView.addSubview(categoryDropdownButton)
        filterContainerView.addSubview(sortButton)
        filterContainerView.addSubview(settingsButton)

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
            /* フィルターコンテナ: 画面上部に配置 */
            filterContainerView.topAnchor.constraint(equalTo: view.topAnchor, constant: 8),
            filterContainerView.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 8),
            filterContainerView.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -8),
            filterContainerView.heightAnchor.constraint(equalToConstant: 36),

            /* 環境ドロップダウンボタン: 左端に固定、固定幅100pt */
            profileDropdownButton.leadingAnchor.constraint(equalTo: filterContainerView.leadingAnchor),
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
        tableView.register(UITableViewCell.self, forCellReuseIdentifier: "Cell")
        view.addSubview(tableView)
        NSLayoutConstraint.activate([
            tableView.topAnchor.constraint(equalTo: filterContainerView.bottomAnchor, constant: 8),
            tableView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            tableView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            tableView.bottomAnchor.constraint(equalTo: view.bottomAnchor)
        ])

        // Detail View (全画面表示)
        view.addSubview(detailView)
        detailView.addSubview(detailScrollView)
        detailScrollView.addSubview(detailContentView)
        detailContentView.addSubview(detailTitleLabel)
        detailContentView.addSubview(detailContentLabel)
        detailView.addSubview(buttonContainerView)
        buttonContainerView.addSubview(copyButton)
        buttonContainerView.addSubview(closeButton)

        NSLayoutConstraint.activate([
            // DetailView: 全画面表示
            detailView.topAnchor.constraint(equalTo: view.topAnchor),
            detailView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            detailView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            detailView.bottomAnchor.constraint(equalTo: view.bottomAnchor),

            // ScrollView: 全画面（ボタンコンテナの下にパディングを追加）
            detailScrollView.topAnchor.constraint(equalTo: detailView.topAnchor, constant: 8),
            detailScrollView.leadingAnchor.constraint(equalTo: detailView.leadingAnchor),
            detailScrollView.trailingAnchor.constraint(equalTo: detailView.trailingAnchor),
            detailScrollView.bottomAnchor.constraint(equalTo: detailView.bottomAnchor),

            // ContentView: ScrollViewのコンテンツ（ボタン分の下パディング追加）
            detailContentView.topAnchor.constraint(equalTo: detailScrollView.topAnchor),
            detailContentView.leadingAnchor.constraint(equalTo: detailScrollView.leadingAnchor),
            detailContentView.trailingAnchor.constraint(equalTo: detailScrollView.trailingAnchor),
            detailContentView.bottomAnchor.constraint(equalTo: detailScrollView.bottomAnchor),
            detailContentView.widthAnchor.constraint(equalTo: detailScrollView.widthAnchor),

            // Title Label
            detailTitleLabel.topAnchor.constraint(equalTo: detailContentView.topAnchor, constant: 12),
            detailTitleLabel.leadingAnchor.constraint(equalTo: detailContentView.leadingAnchor, constant: 12),
            detailTitleLabel.trailingAnchor.constraint(equalTo: detailContentView.trailingAnchor, constant: -12),

            // Content Label（ボタンエリア分の下マージン追加：60pt）
            detailContentLabel.topAnchor.constraint(equalTo: detailTitleLabel.bottomAnchor, constant: 8),
            detailContentLabel.leadingAnchor.constraint(equalTo: detailContentView.leadingAnchor, constant: 12),
            detailContentLabel.trailingAnchor.constraint(equalTo: detailContentView.trailingAnchor, constant: -12),
            detailContentLabel.bottomAnchor.constraint(equalTo: detailContentView.bottomAnchor, constant: -72),

            // Button Container: 画面下部に固定（半透明背景）
            buttonContainerView.leadingAnchor.constraint(equalTo: detailView.leadingAnchor),
            buttonContainerView.trailingAnchor.constraint(equalTo: detailView.trailingAnchor),
            buttonContainerView.bottomAnchor.constraint(equalTo: detailView.bottomAnchor),
            buttonContainerView.heightAnchor.constraint(equalToConstant: 64),

            // Buttons: buttonContainerView内に配置（丸ボタン）
            copyButton.bottomAnchor.constraint(equalTo: buttonContainerView.bottomAnchor, constant: -12),
            copyButton.trailingAnchor.constraint(equalTo: buttonContainerView.trailingAnchor, constant: -12),
            copyButton.widthAnchor.constraint(equalToConstant: 40),
            copyButton.heightAnchor.constraint(equalToConstant: 40),

            closeButton.bottomAnchor.constraint(equalTo: buttonContainerView.bottomAnchor, constant: -12),
            closeButton.trailingAnchor.constraint(equalTo: copyButton.leadingAnchor, constant: -12),
            closeButton.widthAnchor.constraint(equalToConstant: 40),
            closeButton.heightAnchor.constraint(equalToConstant: 40)
        ])

        copyButton.addTarget(self, action: #selector(copyButtonTapped), for: .touchUpInside)
        closeButton.addTarget(self, action: #selector(closeDetailView), for: .touchUpInside)

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

        // Keyboard height
        NSLayoutConstraint.activate([
            view.heightAnchor.constraint(equalToConstant: 280)
        ])

        // Settings View (設定画面 - 全画面表示)
        view.addSubview(settingsView)
        settingsView.addSubview(settingsHeaderView)
        settingsHeaderView.addSubview(settingsTitleLabel)
        settingsHeaderView.addSubview(settingsCloseButton)
        settingsView.addSubview(usageTrackingRowView)
        usageTrackingRowView.addSubview(usageTrackingLabel)
        usageTrackingRowView.addSubview(usageTrackingSwitch)
        settingsView.addSubview(fullAccessHintLabel)
        settingsView.addSubview(fullAccessInstructionsLabel)

        // 設定画面のアクションを設定
        settingsCloseButton.addTarget(self, action: #selector(closeSettingsView), for: .touchUpInside)
        usageTrackingSwitch.addTarget(self, action: #selector(usageTrackingSwitchChanged(_:)), for: .valueChanged)

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

            // Usage Tracking Switch: 行の右側
            usageTrackingSwitch.trailingAnchor.constraint(equalTo: usageTrackingRowView.trailingAnchor, constant: -16),
            usageTrackingSwitch.centerYAnchor.constraint(equalTo: usageTrackingRowView.centerYAnchor),

            // Full Access Hint: 行の下
            fullAccessHintLabel.topAnchor.constraint(equalTo: usageTrackingRowView.bottomAnchor, constant: 8),
            fullAccessHintLabel.leadingAnchor.constraint(equalTo: settingsView.leadingAnchor, constant: 16),
            fullAccessHintLabel.trailingAnchor.constraint(equalTo: settingsView.trailingAnchor, constant: -16),

            // Full Access Instructions: ヒントの下
            fullAccessInstructionsLabel.topAnchor.constraint(equalTo: fullAccessHintLabel.bottomAnchor, constant: 12),
            fullAccessInstructionsLabel.leadingAnchor.constraint(equalTo: settingsView.leadingAnchor, constant: 16),
            fullAccessInstructionsLabel.trailingAnchor.constraint(equalTo: settingsView.trailingAnchor, constant: -16)
        ])
    }

    private func loadInitialData() {
        os_log("🚀 loadInitialData started", log: keyboardLog, type: .info)
        NSLog("🚀 [KeyboardViewController] loadInitialData started")

        do {
            // データベースを初期化
            os_log("📦 Initializing database...", log: keyboardLog, type: .info)
            NSLog("📦 [KeyboardViewController] Initializing database...")
            try Database.shared.initialize()
            self.systemVariableFormats = SystemVariableFormatMapper.shared.getAll()
            os_log("✅ Database initialized successfully", log: keyboardLog, type: .info)
            NSLog("✅ [KeyboardViewController] Database initialized successfully")

            // プロファイルを読み込み（Serviceを使用）
            os_log("📦 Loading profiles...", log: keyboardLog, type: .info)
            NSLog("📦 [KeyboardViewController] Loading profiles...")
            let loadedProfiles = profileService.getAllProfiles()
            os_log("✅ Loaded %d profiles", log: keyboardLog, type: .info, loadedProfiles.count)
            NSLog("✅ [KeyboardViewController] Loaded %d profiles", loadedProfiles.count)

            // カテゴリを読み込み（Serviceを使用）
            os_log("📦 Loading categories...", log: keyboardLog, type: .info)
            NSLog("📦 [KeyboardViewController] Loading categories...")
            let loadedCategories = categoryService.getAll()
            os_log("✅ Loaded %d categories", log: keyboardLog, type: .info, loadedCategories.count)
            NSLog("✅ [KeyboardViewController] Loaded %d categories", loadedCategories.count)

            // 変数とスニペットを読み込み
            if let firstProfile = loadedProfiles.first {
                os_log("✅ Setting current profile: %@", log: keyboardLog, type: .info, firstProfile.name)
                NSLog("✅ [KeyboardViewController] Setting current profile: %@", firstProfile.name)
                self.currentProfile = firstProfile

                // 現在のプロファイルの変数を読み込み
                os_log("📦 Loading variables for profile...", log: keyboardLog, type: .info)
                NSLog("📦 [KeyboardViewController] Loading variables for profile...")
                self.variablesMap = variableService.getVariablesMap(for: firstProfile.id)
                self.systemVariableFormats = SystemVariableFormatMapper.shared.getAll()
                os_log("✅ Loaded %d variables", log: keyboardLog, type: .info, self.variablesMap.count)
                NSLog("✅ [KeyboardViewController] Loaded %d variables", self.variablesMap.count)
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
                NSLog("⚠️ [KeyboardViewController] No profiles found")
                self.updateEmptyState()
            }

            // ローディング画面を非表示
            self.hideLoading()

            os_log("🏁 loadInitialData completed", log: keyboardLog, type: .info)
            NSLog("🏁 [KeyboardViewController] loadInitialData completed")
            NSLog("📊 Final state: profiles=%d, categories=%d, snippets=%d",
                  self.profiles.count, self.categories.count, self.allSnippets.count)

        } catch {
            os_log("❌ Failed to load data: %@", log: keyboardLog, type: .error, error.localizedDescription)
            NSLog("❌ [KeyboardViewController] Failed to load data: %@", error.localizedDescription)

            // ローディング画面を非表示
            self.hideLoading()

            // 多言語対応: "エラー: データの読み込みに失敗しました" / "Failed to load data"
            self.emptyLabel.text = L10n.Error.loadFailed
            self.emptyLabel.isHidden = false
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
        NSLog("✅ [KeyboardViewController] Reloaded %d variables for profile: %@", variablesMap.count, profile.name)

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
        NSLog("🔄 [reloadSnippets] Started")
        NSLog("  Current profile: %@ (id: %@)", currentProfile?.name ?? "nil", currentProfile?.id ?? "nil")
        NSLog("  Current category: %@ (id: %@)", currentCategory?.name ?? "all", currentCategory?.id ?? "nil")

        // プロファイルが選択されていない場合は、何も表示しない
        guard let profileId = currentProfile?.id else {
            os_log("⚠️ No profile selected, clearing snippets", log: keyboardLog, type: .error)
            NSLog("⚠️ [reloadSnippets] No profile selected, clearing snippets")
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
            NSLog("🔍 [reloadSnippets] Loading snippets for category: %@ with profile: %@ sortBy: %@", categoryId, profileId, currentSortBy)
            allSnippets = SnippetMapper.shared.getByCategoryId(categoryId, filterByProfileId: profileId, sortBy: currentSortBy)
        } else {
            // 「すべて」が選択されている場合（カテゴリフィルタなし）
            os_log("🔍 Loading all snippets with profile: %@ sortBy: %@", log: keyboardLog, type: .info, profileId, currentSortBy)
            NSLog("🔍 [reloadSnippets] Loading all snippets with profile: %@ sortBy: %@", profileId, currentSortBy)
            allSnippets = SnippetMapper.shared.getAll(filterByProfileId: profileId, sortBy: currentSortBy)
        }

        // デバッグ用：取得したスニペットの情報を出力
        os_log("✅ Loaded %d snippets", log: keyboardLog, type: .info, allSnippets.count)
        NSLog("✅ [reloadSnippets] Loaded %d snippets", allSnippets.count)
        for (index, snippet) in allSnippets.prefix(5).enumerated() {
            let preview = String(snippet.content.prefix(30))
            NSLog("  [%d] Snippet: id=%@, title=%@, content=%@...",
                  index, snippet.id, snippet.title ?? "no title", preview)
        }
        if allSnippets.count > 5 {
            NSLog("  ... and %d more snippets", allSnippets.count - 5)
        }

        // MapperでORDER BYを使ってソート済みなので、そのまま表示用にコピー
        filteredSnippets = allSnippets
        os_log("✅ Loaded and sorted snippets: %d (sortBy: %@)", log: keyboardLog, type: .info, filteredSnippets.count, currentSortBy)
        NSLog("✅ [reloadSnippets] Loaded and sorted snippets: %d (sortBy: %@)", filteredSnippets.count, currentSortBy)

        // テーブルビューを更新（同期的に実行）
        // 注意: UIMenuのアクションは既にメインスレッドで実行されるため、非同期にする必要はない
        tableView.reloadData()
        NSLog("✅ [reloadSnippets] tableView.reloadData() called")

        // 空状態の表示/非表示を更新
        updateEmptyState()
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
        let isEmpty = filteredSnippets.isEmpty
        emptyLabel.isHidden = !isEmpty
        tableView.isHidden = isEmpty
        /* 注意: tableView.reloadData() は reloadSnippets() でメインスレッドで直接呼び出すため、ここでは呼ばない */
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
            // タイトルを変数置換して表示
            let rawTitle = snippet.title ?? "（タイトルなし）"
            let replacedTitle = variableReplacer.replace(
                in: rawTitle,
                variablesMap: variablesMap,
                formats: systemVariableFormats
            )
            detailTitleLabel.text = replacedTitle
            detailTitleLabel.isHidden = false
        } else {
            // タイトルを非表示（コピーしない設定の場合）
            detailTitleLabel.isHidden = true
        }

        // 内容を変数置換（{{today}} → 2025/11/17など）
        let preview = variableReplacer.replace(
            in: snippet.content,
            variablesMap: variablesMap,
            formats: systemVariableFormats
        )
        detailContentLabel.text = preview

        // アニメーションで詳細画面を表示
        detailView.isHidden = false  // 詳細画面を表示
        tableView.isHidden = true     // スニペット一覧を非表示
        emptyLabel.isHidden = true    // 空状態メッセージを非表示

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
            self.detailView.isHidden = true  // 詳細画面を非表示
            self.tableView.isHidden = self.filteredSnippets.isEmpty  // スニペット一覧を表示（空なら非表示）
            self.emptyLabel.isHidden = !self.filteredSnippets.isEmpty  // 空状態メッセージの表示/非表示
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
            NSLog("⚠️ [KeyboardViewController] Copy button tapped but no snippet selected")
            return
        }

        os_log("🔥 Copy button tapped! Snippet: %@", log: keyboardLog, type: .info, snippet.title ?? "no title")
        NSLog("🔥 [KeyboardViewController] Copy button tapped! Snippet: %@", snippet.title ?? "no title")
        NSLog("🔥 [KeyboardViewController] Content: %@", snippet.content)

        insertSnippet(snippet)  // スニペットを挿入
        closeDetailView()  // 詳細画面を閉じる
    }

    /// スニペットをテキスト入力欄に挿入（キーボードのメイン処理）
    ///
    /// - Parameter snippet: 挿入するスニペット
    ///
    /// 【処理の流れ】
    /// 1. SnippetServiceに処理を委譲
    /// 2. Service内で以下の処理が実行されます：
    ///    - copyWithTitleフラグに応じてタイトルも含めるか判定
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
        NSLog("📝 [KeyboardViewController] insertSnippet called for snippet: %@", snippet.id)
        NSLog("📝 [KeyboardViewController] Current profile: %@", currentProfile?.name ?? "nil")

        // Serviceを使用してスニペットを挿入（変数置換＋振動フィードバック）
        // ビジネスロジックはServiceに集約することで、コードの見通しが良くなります
        snippetService.insertSnippet(
            snippet,
            into: textDocumentProxy,  // iOSのテキスト入力API
            profileId: currentProfile?.id  // 環境IDを渡して、環境専用の変数を使用
        )

        os_log("✅ insertSnippet completed", log: keyboardLog, type: .info)
        NSLog("✅ [KeyboardViewController] insertSnippet completed")
    }

    // MARK: - Sort Methods（ソート関連メソッド）

    /// ソートボタンのメニューを設定
    /// iOS 14以降のUIMenuを使用して、タップ時にメニューを表示
    /// フルアクセス許可かつ使用頻度追跡が有効な場合のみ「使用頻度」オプションを表示
    private func setupSortButtonMenu() {
        /* 注意: currentSortByは呼び出し元で設定済みのため、ここでは再読み込みしない
           viewDidLoad時にloadSortPreference()で初期化される */
        NSLog("🔄 [Sort] Building menu with sort preference: %@, hasFullAccess: %@, isUsageTrackingEnabled: %@",
              currentSortBy, self.hasFullAccess ? "true" : "false", isUsageTrackingEnabled ? "true" : "false")

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

        /* メニュー項目の配列を構築（フルアクセス許可かつ使用頻度追跡有効時のみ使用頻度を追加） */
        var menuChildren: [UIAction] = [createdAction, updatedAction, titleAction]

        if isUsageTrackingEnabled {
            let usageAction = UIAction(
                title: L10n.Sort.usage,
                image: currentSortBy == "usage" ? UIImage(systemName: "checkmark") : nil
            ) { [weak self] _ in
                self?.updateSortPreference("usage")
            }
            menuChildren.append(usageAction)
        }

        // メニューを作成してボタンに設定
        let menu = UIMenu(title: L10n.Sort.label, children: menuChildren)
        sortButton.menu = menu

        // バッジ表示を更新
        updateSortBadgeVisibility()
    }

    /// ソート設定を更新
    private func updateSortPreference(_ sortBy: String) {
        NSLog("🔄 [Sort] Updating sort preference: %@ → %@", currentSortBy, sortBy)
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
        NSLog("💾 [Sort] Saved sort preference: %@", sortBy)
    }

    /// ソート設定を読み込み（UserDefaults）
    private func loadSortPreference() -> String {
        let sortBy = UserDefaults.standard.string(forKey: sortPreferenceKey) ?? "created"
        return sortBy
    }

    /// フルアクセス状態をApp Group UserDefaultsに保存
    /// メインアプリからフルアクセス状態を参照できるようにする
    private func saveFullAccessState() {
        guard let userDefaults = UserDefaults(suiteName: appGroupIdentifier) else {
            NSLog("⚠️ [FullAccess] Failed to get App Group UserDefaults")
            return
        }
        userDefaults.set(self.hasFullAccess, forKey: fullAccessStateKey)
        NSLog("💾 [FullAccess] Saved full access state: %@", self.hasFullAccess ? "true" : "false")
    }

    /// バッジの表示/非表示を更新
    /// デフォルト（created）以外の時にバッジを表示
    private func updateSortBadgeVisibility() {
        let isDefaultSort = currentSortBy == "created"
        sortBadgeView.isHidden = isDefaultSort
    }

    // MARK: - Settings（設定関連）

    /// 使用頻度追跡が有効かどうか
    /// フルアクセスが許可されていて、かつ使用頻度追跡がONの場合にtrue
    private var isUsageTrackingEnabled: Bool {
        get {
            guard let userDefaults = UserDefaults(suiteName: appGroupIdentifier) else {
                return false
            }
            /* フルアクセスがない場合はfalse */
            if !self.hasFullAccess {
                return false
            }
            /* 設定されていない場合はデフォルトtrue */
            let usageEnabledSet = userDefaults.bool(forKey: usageTrackingEnabledSetKey)
            if !usageEnabledSet {
                return true
            }
            return userDefaults.bool(forKey: usageTrackingKey)
        }
        set {
            guard let userDefaults = UserDefaults(suiteName: appGroupIdentifier) else {
                return
            }
            userDefaults.set(newValue, forKey: usageTrackingKey)
            userDefaults.set(true, forKey: usageTrackingEnabledSetKey)
            NSLog("💾 [Settings] Saved usage tracking enabled: %@", newValue ? "true" : "false")
        }
    }

    /// 設定ボタンがタップされた時のアクション
    @objc private func settingsButtonTapped() {
        NSLog("⚙️ [Settings] Settings button tapped")
        showSettingsView()
    }

    /// 設定画面を表示
    private func showSettingsView() {
        // タイトルを設定
        settingsTitleLabel.text = L10n.Settings.title

        // ラベルを設定
        usageTrackingLabel.text = L10n.Settings.usageTrackingEnabled

        // スイッチの状態を更新
        // フルアクセスがない場合はfalseを表示するが、
        // フルアクセスがある場合は設定値を表示
        if self.hasFullAccess {
            usageTrackingSwitch.isOn = isUsageTrackingEnabled
        } else {
            usageTrackingSwitch.isOn = false
        }
        usageTrackingSwitch.isEnabled = self.hasFullAccess

        // フルアクセスヒントの表示/非表示
        fullAccessHintLabel.text = L10n.Settings.usageTrackingRequiresFullAccess
        fullAccessHintLabel.isHidden = self.hasFullAccess

        // フルアクセス許可手順の表示/非表示
        fullAccessInstructionsLabel.text = L10n.Settings.fullAccessInstructions
        fullAccessInstructionsLabel.isHidden = self.hasFullAccess

        // ラベルとスイッチの色を更新
        usageTrackingLabel.textColor = self.hasFullAccess ? .label : .secondaryLabel

        // 設定画面を表示
        settingsView.isHidden = false
    }

    /// 設定画面を閉じる
    @objc private func closeSettingsView() {
        NSLog("⚙️ [Settings] Closing settings view")
        settingsView.isHidden = true
    }

    /// 使用頻度スイッチが変更された時のアクション
    @objc private func usageTrackingSwitchChanged(_ sender: UISwitch) {
        NSLog("⚙️ [Settings] Usage tracking switch changed: %@", sender.isOn ? "ON" : "OFF")

        // 設定を保存
        isUsageTrackingEnabled = sender.isOn

        // 使用頻度がOFFになった場合、ソートをリセット
        if !sender.isOn && currentSortBy == "usage" {
            updateSortPreference("created")
        }

        // ソートメニューを再構築
        setupSortButtonMenu()
    }
}

extension KeyboardViewController: UITableViewDataSource {
    func tableView(_ tableView: UITableView, numberOfRowsInSection section: Int) -> Int {
        return filteredSnippets.count
    }

    func tableView(_ tableView: UITableView, cellForRowAt indexPath: IndexPath) -> UITableViewCell {
        let cell = tableView.dequeueReusableCell(withIdentifier: "Cell", for: indexPath)
        let snippet = filteredSnippets[indexPath.row]

        var config = cell.defaultContentConfiguration()

        // タイトルを変数置換する
        let rawTitle = snippet.title ?? "（タイトルなし）"
        let replacedTitle = variableReplacer.replace(
            in: rawTitle,
            variablesMap: variablesMap,
            formats: systemVariableFormats
        )

        config.text = replacedTitle
        config.textProperties.font = .systemFont(ofSize: 15)
        cell.contentConfiguration = config
        cell.accessoryType = .disclosureIndicator

        return cell
    }
}

extension KeyboardViewController: UITableViewDelegate {
    func tableView(_ tableView: UITableView, didSelectRowAt indexPath: IndexPath) {
        os_log("👆 Snippet tapped at index: %d", log: keyboardLog, type: .info, indexPath.row)
        NSLog("👆 [KeyboardViewController] Snippet tapped at index: %d", indexPath.row)

        tableView.deselectRow(at: indexPath, animated: true)
        let snippet = filteredSnippets[indexPath.row]

        os_log("👆 Showing detail for snippet: %@", log: keyboardLog, type: .info, snippet.title ?? "no title")
        NSLog("👆 [KeyboardViewController] Showing detail for snippet: %@", snippet.title ?? "no title")

        showSnippetDetail(snippet)
    }

    // MARK: - Loading State（ローディング状態管理）

    /// ローディング画面を表示
    /// データ読み込み開始時に呼び出されます
    private func showLoading() {
        loadingView.isHidden = false
        activityIndicator.startAnimating()
    }

    /// ローディング画面を非表示
    /// データ読み込み完了時に呼び出されます
    private func hideLoading() {
        loadingView.isHidden = true
        activityIndicator.stopAnimating()
    }

    // MARK: - Premium Required Message

    /// Pro版未加入の場合に表示する制限メッセージ
    ///
    /// 拡張キーボード機能はPro版限定のため、
    /// 無料版ユーザーには「Pro版へアップグレード」を促すメッセージを表示します。
    ///
    /// 【表示内容】
    /// - バッジ: 🔒 Pro版限定
    private func showPremiumRequiredMessage() {
        let status = subscriptionManager.getSubscriptionStatus()
        showSubscriptionMessage(status: status)
    }

    private func showSubscriptionMessage(status: SubscriptionStatus) {
        // すべてのコンテンツを非表示
        filterContainerView.isHidden = true
        tableView.isHidden = true
        loadingView.isHidden = true
        detailView.isHidden = true
        emptyLabel.isHidden = true

        // ビューの背景を完全に隠すために、alphaも0に設定
        filterContainerView.alpha = 0
        tableView.alpha = 0
        loadingView.alpha = 0
        detailView.alpha = 0
        emptyLabel.alpha = 0

        NSLog("✅ [KeyboardViewController] All views hidden")

        // 背景色を白に設定
        view.backgroundColor = .systemBackground
        NSLog("✅ [KeyboardViewController] Background set to systemBackground")

        // コンテナビューを作成（中央配置用）
        let containerView = UIView()
        containerView.translatesAutoresizingMaskIntoConstraints = false
        containerView.backgroundColor = .clear

        // ステータスに応じてメッセージを変更
        let (iconName, title, message, backgroundColor) = getMessageContent(for: status)

        // バッジ背景を作成
        let badgeBackgroundView = UIView()
        badgeBackgroundView.backgroundColor = backgroundColor
        badgeBackgroundView.layer.cornerRadius = 14
        badgeBackgroundView.clipsToBounds = true
        badgeBackgroundView.translatesAutoresizingMaskIntoConstraints = false

        // アイコン（SF Symbols）
        let iconImageView = UIImageView()
        let config = UIImage.SymbolConfiguration(pointSize: 24, weight: .medium)
        iconImageView.image = UIImage(systemName: iconName, withConfiguration: config)
        iconImageView.tintColor = .white
        iconImageView.contentMode = .scaleAspectFit
        iconImageView.translatesAutoresizingMaskIntoConstraints = false

        // タイトルラベル
        let titleLabel = UILabel()
        titleLabel.text = title
        titleLabel.font = .systemFont(ofSize: 18, weight: .bold)
        titleLabel.textColor = .white
        titleLabel.textAlignment = .center
        titleLabel.translatesAutoresizingMaskIntoConstraints = false

        // メッセージラベル
        let messageLabel = UILabel()
        messageLabel.text = message
        messageLabel.font = .systemFont(ofSize: 14, weight: .regular)
        messageLabel.textColor = .white
        messageLabel.textAlignment = .center
        messageLabel.numberOfLines = 0
        messageLabel.translatesAutoresizingMaskIntoConstraints = false

        // スタックビューでラベルを縦に配置
        let stackView = UIStackView(arrangedSubviews: [iconImageView, titleLabel, messageLabel])
        stackView.axis = .vertical
        stackView.spacing = 8
        stackView.alignment = .center
        stackView.translatesAutoresizingMaskIntoConstraints = false

        // アイコンのサイズを固定
        NSLayoutConstraint.activate([
            iconImageView.widthAnchor.constraint(equalToConstant: 32),
            iconImageView.heightAnchor.constraint(equalToConstant: 32)
        ])

        // 背景ビューにスタックビューを追加
        badgeBackgroundView.addSubview(stackView)

        // コンテナに追加
        containerView.addSubview(badgeBackgroundView)

        // ビューに追加（最前面に）
        view.addSubview(containerView)
        view.bringSubviewToFront(containerView)
        NSLog("✅ [KeyboardViewController] Container brought to front")

        // レイアウト制約を設定
        NSLayoutConstraint.activate([
            // コンテナを画面の中央に配置（幅を320ptに固定）
            containerView.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            containerView.centerYAnchor.constraint(equalTo: view.centerYAnchor),
            containerView.widthAnchor.constraint(equalToConstant: 320),

            // バッジ背景
            badgeBackgroundView.topAnchor.constraint(equalTo: containerView.topAnchor),
            badgeBackgroundView.leadingAnchor.constraint(equalTo: containerView.leadingAnchor),
            badgeBackgroundView.trailingAnchor.constraint(equalTo: containerView.trailingAnchor),
            badgeBackgroundView.bottomAnchor.constraint(equalTo: containerView.bottomAnchor),

            // スタックビュー（内側にパディング）
            stackView.topAnchor.constraint(equalTo: badgeBackgroundView.topAnchor, constant: 16),
            stackView.leadingAnchor.constraint(equalTo: badgeBackgroundView.leadingAnchor, constant: 24),
            stackView.trailingAnchor.constraint(equalTo: badgeBackgroundView.trailingAnchor, constant: -24),
            stackView.bottomAnchor.constraint(equalTo: badgeBackgroundView.bottomAnchor, constant: -16)
        ])

        NSLog("🔒 [KeyboardViewController] Showing subscription message: \(title)")
    }

    private func getMessageContent(for status: SubscriptionStatus) -> (iconName: String, title: String, message: String, backgroundColor: UIColor) {
        // 表示言語を取得（判定ロジックはL10nに一本化されている）
        let isJapanese = L10n.isJapanese

        // デバッグ用：言語情報をログ出力
        print("[KeyboardViewController] Preferred languages: \(Locale.preferredLanguages), isJapanese: \(isJapanese)")

        switch status {
        case .free:
            let title = isJapanese ? "Pro版限定機能" : "Pro Feature Only"
            let message = isJapanese ? "拡張キーボードはPro版限定機能です" : "Keyboard extension is a Pro-only feature"
            return ("lock.fill", title, message, UIColor.systemOrange)

        case .expired:
            let title = isJapanese ? "アプリを起動してください" : "Please Open the App"
            let message = isJapanese
                ? "拡張キーボードの状態を更新するため\nClipTapアプリを起動してください"
                : "Please launch ClipTap app\nto update keyboard extension status"
            return ("info.circle.fill", title, message, UIColor.systemBlue)

        case .noData:
            let title = isJapanese ? "定型文がありません" : "No Templates"
            let message = isJapanese
                ? "アプリからデータを登録してください"
                : "Please add templates from the app"
            return ("info.circle.fill", title, message, UIColor.systemBlue)

        default:
            // .active は通常のキーボードが表示されるため、このメソッドは呼ばれない
            return ("", "", "", UIColor.clear)
        }
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
