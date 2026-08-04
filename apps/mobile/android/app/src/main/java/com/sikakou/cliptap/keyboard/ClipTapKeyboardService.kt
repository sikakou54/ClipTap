package com.sikakou.cliptap.keyboard

import android.graphics.drawable.ColorDrawable
import android.inputmethodservice.InputMethodService
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.google.android.material.chip.Chip
import com.google.android.material.chip.ChipGroup
import android.util.Log
import android.view.LayoutInflater
import android.view.ContextThemeWrapper
import androidx.core.content.ContextCompat
import com.sikakou.cliptap.R
import com.sikakou.cliptap.models.Profile
import com.sikakou.cliptap.models.Category
import com.sikakou.cliptap.models.Snippet
import com.sikakou.cliptap.services.ProfileService
import com.sikakou.cliptap.services.CategoryService
import com.sikakou.cliptap.services.SnippetService
import com.sikakou.cliptap.services.VariableService
import com.sikakou.cliptap.database.Database
import com.sikakou.cliptap.mappers.SystemVariableFormatMapper
import com.sikakou.cliptap.utils.LocalizationHelper

/**
 * ClipTap カスタムキーボードサービス
 *
 * 【目的】
 * AndroidのInputMethodServiceを継承したカスタムキーボード実装。
 * メインアプリと同じデータベースにアクセスし、スニペットをテキストフィールドに挿入します。
 *
 * 【役割】
 * - キーボードUIの作成と管理
 * - 環境（プロファイル）とカテゴリの選択
 * - スニペット一覧の表示とフィルタリング
 * - スニペット詳細表示
 * - スニペットのテキスト挿入（変数置換込み）
 *
 * 【重要な仕組み: データの流れ】
 * 1. メインアプリがSharedDBにスニペット・プロファイル・変数を保存
 * 2. キーボード起動時にSharedDBを読み取り専用で開く
 * 3. ユーザーが選択したスニペットをテキストフィールドに挿入
 * 4. 変数（{{name}}など）を実際の値に置換してから挿入
 *
 * 【なぜInputMethodService？】
 * AndroidのカスタムキーボードはInputMethodServiceを継承する必要があります。
 * このサービスがシステムのIME（Input Method Editor）として動作します。
 *
 * 【対応するiOSファイル】
 * ios/ClipTapKeyboard/KeyboardViewController.swift と同等
 */
class ClipTapKeyboardService : InputMethodService() {

    private lateinit var keyboardView: View
    private lateinit var mainView: View
    private lateinit var profileChipGroup: ChipGroup
    private lateinit var categoryChipGroup: ChipGroup
    private lateinit var snippetRecyclerView: RecyclerView
    private lateinit var emptyStateTextView: android.widget.TextView
    private lateinit var snippetAdapter: SnippetAdapter
    private lateinit var themedContext: ContextThemeWrapper

    // 詳細画面のビュー
    private lateinit var detailView: View
    private lateinit var detailTitleLabel: android.widget.TextView
    private lateinit var detailContentLabel: android.widget.TextView
    private lateinit var copyButton: View
    private lateinit var closeButton: View

    // 選択中のスニペット
    private var selectedSnippet: Snippet? = null

    // Services
    private lateinit var profileService: ProfileService
    private lateinit var categoryService: CategoryService
    private lateinit var snippetService: SnippetService
    private lateinit var variableService: VariableService
    private lateinit var database: Database

    // State
    private var currentProfile: Profile? = null
    private var currentCategory: Category? = null
    private var profiles: List<Profile> = emptyList()
    private var categories: List<Category> = emptyList()
    private var allSnippets: List<Snippet> = emptyList()
    private var variablesMap: Map<String, String> = emptyMap()

    // ソートボタンとソート状態
    private lateinit var sortButton: android.widget.ImageButton
    private lateinit var sortBadge: android.view.View
    private var currentSortBy: String = "created"

    companion object {
        private const val TAG = "ClipTapKeyboard"
        private const val SORT_PREFS_NAME = "ClipTapKeyboardPrefs"
        private const val SORT_PREFERENCE_KEY = "keyboard_snippet_sort_by"
    }

    /**
     * IMEウィンドウのテーマを差し替える
     * InputMethodService.setThemeはウィンドウ生成前にしか呼べないため、super.onCreate()より前に呼ぶ
     */
    override fun onCreate() {
        setTheme(R.style.ClipTapKeyboardWindowTheme)
        super.onCreate()
    }

    /**
     * キーボードビューを作成
     *
     * 【目的】
     * Androidシステムがキーボードを表示する時に呼ばれるメソッド。
     * キーボードのレイアウトと初期データを設定します。
     *
     * 【何をするか】
     * 1. サービス層を初期化（ProfileService, CategoryService等）
     * 2. サブスクリプション状態を更新（Free/Pro制限を適用）
     * 3. XMLレイアウトをインフレート（keyboard_view.xml）
     * 4. キーボードの高さを360dpに固定
     * 5. ビューの初期化（ChipGroup, RecyclerView等）
     * 6. SharedDBを開く
     * 7. 初期データを読み込み（プロファイル、カテゴリ、スニペット）
     *
     * 【理由】
     * このメソッドはAndroidのライフサイクルで必須です。
     * ここでUIを構築しないとキーボードが表示されません。
     *
     * 【呼び出しタイミング】
     * - ユーザーがテキストフィールドをタップした時
     * - 他のキーボードからClipTapキーボードに切り替えた時
     */
    override fun onCreateInputView(): View {
        if (com.sikakou.cliptap.BuildConfig.DEBUG) Log.d(TAG, "============================================================")
        if (com.sikakou.cliptap.BuildConfig.DEBUG) Log.d(TAG, "🎯🎯🎯 onCreateInputView CALLED 🎯🎯🎯")
        if (com.sikakou.cliptap.BuildConfig.DEBUG) Log.d(TAG, "============================================================")

        // Servicesの初期化
        profileService = ProfileService.getInstance(applicationContext)
        categoryService = CategoryService.getInstance(applicationContext)
        snippetService = SnippetService.getInstance(applicationContext)
        variableService = VariableService.getInstance(applicationContext)
        database = Database.getInstance(applicationContext)

        // キャッシュをクリアして最新状態を取得

        // MaterialComponentsテーマでContextThemeWrapperを作成（Chip用）
        themedContext = ContextThemeWrapper(this, R.style.KeyboardTheme)

        // レイアウトをインフレート（テーマ適用済みのコンテキストを使用）
        keyboardView = LayoutInflater.from(themedContext).inflate(
            R.layout.keyboard_view,
            null
        )

        // LayoutParamsを明示的に設定（高さを360dpに固定）
        val density = resources.displayMetrics.density
        val heightInPx = (360 * density).toInt()
        keyboardView.layoutParams = ViewGroup.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            heightInPx
        )

        if (com.sikakou.cliptap.BuildConfig.DEBUG) Log.d(TAG, "✅ Keyboard view inflated: ${keyboardView.javaClass.simpleName}")
        if (com.sikakou.cliptap.BuildConfig.DEBUG) Log.d(TAG, "✅ Layout params: ${keyboardView.layoutParams}")

        // ビューの初期化
        initializeViews()

        // データベースを開く
        openDatabase()

        // データを読み込み
        loadInitialData()

        return keyboardView
    }

    /**
     * ビューの初期化
     *
     * 【目的】
     * XMLレイアウトから各Viewを取得し、イベントリスナーを設定します。
     *
     * 【何をするか】
     * 1. findViewById()でビューを取得
     *    - profileChipGroup: 環境選択ドロップダウン
     *    - categoryChipGroup: カテゴリフィルター
     *    - snippetRecyclerView: スニペット一覧
     *    - detailView: 詳細画面（初期状態は非表示）
     * 2. RecyclerViewの設定
     *    - LinearLayoutManager: 縦スクロール
     *    - SnippetAdapter: スニペットカードを表示
     * 3. 詳細画面のボタンにリスナーを設定
     *    - copyButton: スニペットを挿入
     *    - closeButton: 詳細画面を閉じる
     *
     * 【理由】
     * Androidでは、XMLで定義したレイアウトをKotlinコードから操作するために
     * findViewById()でビューを取得する必要があります。
     */
    private fun initializeViews() {
        if (com.sikakou.cliptap.BuildConfig.DEBUG) Log.d(TAG, "🔧 initializeViews started")

        mainView = keyboardView.findViewById(R.id.mainView)
        profileChipGroup = keyboardView.findViewById(R.id.profileChipGroup)
        categoryChipGroup = keyboardView.findViewById(R.id.categoryChipGroup)
        snippetRecyclerView = keyboardView.findViewById(R.id.snippetRecyclerView)
        emptyStateTextView = keyboardView.findViewById(R.id.emptyStateTextView)
        sortButton = keyboardView.findViewById(R.id.sortButton)
        sortBadge = keyboardView.findViewById(R.id.sortBadge)

        // 詳細画面のビューを初期化
        detailView = keyboardView.findViewById(R.id.detailView)
        detailTitleLabel = keyboardView.findViewById(R.id.detailTitleLabel)
        detailContentLabel = keyboardView.findViewById(R.id.detailContentLabel)
        copyButton = keyboardView.findViewById(R.id.copyButton)
        closeButton = keyboardView.findViewById(R.id.closeButton)

        if (com.sikakou.cliptap.BuildConfig.DEBUG) Log.d(TAG, "✅ Views found - profileChipGroup: $profileChipGroup")
        if (com.sikakou.cliptap.BuildConfig.DEBUG) Log.d(TAG, "✅ Views found - categoryChipGroup: $categoryChipGroup")
        if (com.sikakou.cliptap.BuildConfig.DEBUG) Log.d(TAG, "✅ Views found - snippetRecyclerView: $snippetRecyclerView")
        if (com.sikakou.cliptap.BuildConfig.DEBUG) Log.d(TAG, "✅ Views found - detailView: $detailView")
        if (com.sikakou.cliptap.BuildConfig.DEBUG) Log.d(TAG, "✅ Views found - sortButton: $sortButton")

        // RecyclerViewの設定
        snippetRecyclerView.layoutManager = LinearLayoutManager(this)

        /* 一覧の表示枠は固定高さのため、行数が変わってもRecyclerView自体の大きさは変わらない。
           これを伝えることでスクロール中のレイアウト再計算を省ける */
        snippetRecyclerView.setHasFixedSize(true)

        snippetAdapter = SnippetAdapter { snippet ->
            onSnippetClicked(snippet)
        }
        snippetRecyclerView.adapter = snippetAdapter

        // 詳細画面のボタンにクリックリスナーを設定
        copyButton.setOnClickListener {
            onCopyButtonClicked()
        }
        closeButton.setOnClickListener {
            closeDetailView()
        }

        // ソートボタンの設定
        currentSortBy = loadSortPreference()
        sortButton.setOnClickListener {
            showSortMenu(it)
        }
        updateSortBadgeVisibility()
        if (com.sikakou.cliptap.BuildConfig.DEBUG) Log.d(TAG, "✅ Sort button configured (currentSortBy: $currentSortBy)")

        if (com.sikakou.cliptap.BuildConfig.DEBUG) Log.d(TAG, "✅ RecyclerView configured")
    }

    /**
     * データベースを開く
     *
     * 【目的】
     * メインアプリと共有するSharedDBを読み書き可能モードで開きます。
     *
     * 【何をするか】
     * 1. ManageDBとSharedDBのパスをログ出力（デバッグ用）
     * 2. SharedDBファイルの存在とサイズを確認
     * 3. database.initialize()でSharedDBを読み書き可能で開く
     * 4. テーブル一覧を取得して存在確認
     * 5. テーブルが空の場合は警告を表示
     *
     * 【理由】
     * キーボードはメインアプリと同じデータを読む必要があります。
     * Android版では読み書き可能モードで開きます（WALファイルを読むため）。
     *
     * 【注意】
     * メインアプリが一度も起動していない場合、SharedDBは空です。
     * この場合は「メインアプリを起動してください」という警告を表示します。
     */
    private fun openDatabase() {
        try {
            val sharedPath = Database.getSharedDatabasePath(applicationContext)

            if (com.sikakou.cliptap.BuildConfig.DEBUG) Log.d(TAG, "============================================================")
            // SharedDBファイルの存在とサイズを確認
            val sharedFile = java.io.File(sharedPath)
            if (com.sikakou.cliptap.BuildConfig.DEBUG) Log.d(TAG, "📁 SharedDB exists: ${sharedFile.exists()}")
            if (sharedFile.exists()) {
                if (com.sikakou.cliptap.BuildConfig.DEBUG) Log.d(TAG, "📏 SharedDB size: ${sharedFile.length()} bytes")
            }

            // SharedDBを読み書き可能モードで開く（WALファイルを読むため）
            database.initialize()
            if (com.sikakou.cliptap.BuildConfig.DEBUG) Log.d(TAG, "✅ SharedDB opened successfully")

            // テーブルの存在確認
            val tables = database.getTableNames()
            if (com.sikakou.cliptap.BuildConfig.DEBUG) Log.d(TAG, "📋 Available tables: $tables")
            if (com.sikakou.cliptap.BuildConfig.DEBUG) Log.d(TAG, "📊 Number of tables: ${tables.size}")

            if (tables.isEmpty() || !tables.contains("profiles")) {
                Log.w(TAG, "⚠️ SharedDB not initialized by main app yet.")
                Log.w(TAG, "   Please launch the main app first to initialize the database.")
            } else {
                if (com.sikakou.cliptap.BuildConfig.DEBUG) Log.d(TAG, "✅ SharedDB initialized and ready")
            }
        } catch (e: Exception) {
            Log.e(TAG, "❌ Failed to open SharedDB", e)
        }
    }

    /**
     * 初期データを読み込み
     *
     * 【目的】
     * キーボード表示に必要な初期データをデータベースから取得します。
     *
     * 【何をするか】
     * 1. サブスクリプション状態をチェック
     * 2. プロファイル一覧を取得（ProfileService経由）
     * 3. アクティブなプロファイルを選択
     * 4. カテゴリ一覧を取得（CategoryService経由）
     * 5. 変数マップを取得（VariableService経由）
     * 6. UIを初期化
     *    - setupProfileChips(): 環境選択ドロップダウン
     *    - setupCategoryChips(): カテゴリフィルター
     *    - reloadSnippets(): スニペット一覧
     *
     * 【理由】
     * データベースが空の場合でもクラッシュしないように、
     * エラーハンドリングを行い、空のUIを表示します。
     *
     * 【呼び出し元】
     * onCreateInputView()から呼ばれます。
     */
    private fun loadInitialData() {
        if (com.sikakou.cliptap.BuildConfig.DEBUG) Log.d(TAG, "🚀 loadInitialData started")

        try {
            // プロファイルを読み込み（Serviceを使用）
            profiles = profileService.getAllProfiles()
            if (com.sikakou.cliptap.BuildConfig.DEBUG) Log.d(TAG, "✅ Loaded ${profiles.size} profiles")

            if (profiles.isEmpty()) {
                Log.w(TAG, "⚠️ No profiles found. Database may not be initialized.")
                // 空のデータでUIを初期化（クラッシュを防ぐ）
                setupProfileChips()
                setupCategoryChips()
                snippetAdapter.submitList(emptyList())
                return
            }

            // アクティブなプロファイルを選択
            currentProfile = profileService.getActiveProfile() ?: profiles.firstOrNull()

            if (currentProfile != null) {
                // カテゴリを読み込み（Serviceを使用）
                categories = categoryService.getAll()
                if (com.sikakou.cliptap.BuildConfig.DEBUG) Log.d(TAG, "✅ Loaded ${categories.size} categories")

                // 変数を読み込み（Serviceを使用）
                variablesMap = variableService.getVariablesMap(currentProfile!!.id)
                if (com.sikakou.cliptap.BuildConfig.DEBUG) Log.d(TAG, "✅ Loaded ${variablesMap.size} variables")

                // UIを更新
                setupProfileChips()
                setupCategoryChips()
                reloadSnippets()
            } else {
                Log.w(TAG, "⚠️ No profiles found")
            }

            if (com.sikakou.cliptap.BuildConfig.DEBUG) Log.d(TAG, "🏁 loadInitialData completed")
        } catch (e: Exception) {
            Log.e(TAG, "❌ Failed to load data", e)
            // エラーが発生してもUIは空で表示する（クラッシュを防ぐ）
            setupProfileChips()
            setupCategoryChips()
            snippetAdapter.submitList(emptyList())
        }
    }

    /**
     * プロファイルチップを設定
     *
     * 【目的】
     * 環境選択ドロップダウンのUIを構築します。
     *
     * 【何をするか】
     * 1. 既存のチップを全て削除
     * 2. 現在選択中のプロファイル名を表示するチップを1つ作成
     * 3. クリック時にshowProfileSelectionMenu()を呼ぶリスナーを設定
     * 4. シャドー（elevation）を0にして平坦なデザインに
     *
     * 【理由】
     * iOS版と同じように、ドロップダウン風のUIを実現するため、
     * 常に1つのチップのみ表示し、クリック時にPopupMenuで選択肢を表示します。
     */
    private fun setupProfileChips() {
        profileChipGroup.removeAllViews()

        // 最初のプロファイルのみ表示（ドロップダウン的に）
        if (profiles.isNotEmpty()) {
            val profile = currentProfile ?: profiles.first()
            val chip = Chip(themedContext).apply {
                text = profile.name
                isCheckable = false
                isClickable = true

                // シャドー（elevation）を削除
                elevation = 0f

                // クリック時にプロファイル選択メニューを表示
                setOnClickListener {
                    showProfileSelectionMenu(it, profiles)
                }
            }
            profileChipGroup.addView(chip)
        }
    }

    /**
     * プロファイル選択メニューを表示
     *
     * 【目的】
     * クリックされたチップの下にポップアップメニューを表示します。
     *
     * 【何をするか】
     * 1. PopupMenuを作成（アンカービューの下に表示）
     * 2. プロファイル一覧をメニューアイテムとして追加
     * 3. 選択時にonProfileSelected()を呼ぶ
     *
     * 【理由】
     * Androidで標準的なドロップダウンUIを実現する方法です。
     * PopupMenuは自動的に位置調整とタップ外クローズを処理します。
     */
    private fun showProfileSelectionMenu(anchor: android.view.View, profiles: List<Profile>) {
        val popupMenu = android.widget.PopupMenu(this, anchor)

        profiles.forEachIndexed { index, profile ->
            popupMenu.menu.add(0, index, index, profile.name)
        }

        popupMenu.setOnMenuItemClickListener { item ->
            val selectedProfile = profiles[item.itemId]
            onProfileSelected(selectedProfile)
            true
        }

        popupMenu.show()
    }

    /**
     * カテゴリドロップダウンを設定
     *
     * 【目的】
     * カテゴリ選択ドロップダウンのUIを構築します。
     *
     * 【何をするか】
     * 1. 既存のチップを全て削除
     * 2. 現在選択中のカテゴリ名を表示するチップを1つ作成
     *    - 未選択時は「すべて」を表示
     * 3. クリック時にshowCategorySelectionMenu()を呼ぶリスナーを設定
     *
     * 【理由】
     * iOS版と同じように、ドロップダウン風のUIを実現するため、
     * 常に1つのチップのみ表示し、クリック時にPopupMenuで選択肢を表示します。
     */
    private fun setupCategoryChips() {
        categoryChipGroup.removeAllViews()

        // 現在選択中のカテゴリ名（未選択時は「すべて」）
        val categoryName = currentCategory?.name ?: getString(R.string.category_all)
        val chip = Chip(themedContext).apply {
            text = categoryName
            isCheckable = false
            isClickable = true

            // シャドー（elevation）を削除
            elevation = 0f

            // クリック時にカテゴリ選択メニューを表示
            setOnClickListener {
                showCategorySelectionMenu(it)
            }
        }
        categoryChipGroup.addView(chip)
    }

    /**
     * カテゴリ選択メニューを表示
     *
     * 【目的】
     * クリックされたチップの下にポップアップメニューを表示します。
     *
     * 【何をするか】
     * 1. PopupMenuを作成（アンカービューの下に表示）
     * 2. 「すべて」オプションを追加
     * 3. カテゴリ一覧をメニューアイテムとして追加
     * 4. 選択時にonCategorySelected()を呼ぶ
     *
     * 【理由】
     * プロファイル選択と同じUIパターンを使用し、一貫性を保ちます。
     */
    private fun showCategorySelectionMenu(anchor: android.view.View) {
        val popupMenu = android.widget.PopupMenu(this, anchor)

        // 「すべて」オプション
        popupMenu.menu.add(0, -1, 0, getString(R.string.category_all))

        // カテゴリオプション
        categories.forEachIndexed { index, category ->
            popupMenu.menu.add(0, index, index + 1, category.name)
        }

        popupMenu.setOnMenuItemClickListener { item ->
            val selectedCategory = if (item.itemId == -1) {
                null
            } else {
                categories.getOrNull(item.itemId)
            }
            onCategorySelected(selectedCategory)
            true
        }

        popupMenu.show()
    }

    /**
     * カラーコードをパース（#RRGGBB形式）
     *
     * 【目的】
     * カテゴリの色コード文字列をAndroidのColor整数値に変換します。
     *
     * 【何をするか】
     * 1. colorStringが#で始まるか確認
     * 2. Color.parseColor()で16進数カラーを変換
     * 3. 変換失敗時はデフォルト色（青）を返す
     *
     * 【理由】
     * データベースには"#FF5733"のような文字列で保存されていますが、
     * Androidでは整数値（ARGB）が必要なため変換が必要です。
     */
    private fun parseColor(colorString: String?): Int {
        return try {
            if (colorString != null && colorString.startsWith("#")) {
                android.graphics.Color.parseColor(colorString)
            } else {
                resources.getColor(android.R.color.holo_blue_light, null)
            }
        } catch (e: Exception) {
            Log.w(TAG, "Failed to parse color: $colorString", e)
            resources.getColor(android.R.color.holo_blue_light, null)
        }
    }

    /**
     * プロファイル選択時の処理
     *
     * 【目的】
     * ユーザーが環境を切り替えた時の処理を実行します。
     *
     * 【何をするか】
     * 1. 選択されたプロファイルをcurrentProfileに保存
     * 2. 新しいプロファイルの変数マップを取得
     * 3. プロファイルチップのテキストを更新
     * 4. reloadSnippets()でスニペット一覧を再読み込み
     *
     * 【理由】
     * プロファイルが変わると表示するスニペットと変数が変わるため、
     * UIを全て更新する必要があります。
     */
    private fun onProfileSelected(profile: Profile) {
        if (currentProfile?.id != profile.id) {
            currentProfile = profile
            variablesMap = variableService.getVariablesMap(profile.id)
            if (com.sikakou.cliptap.BuildConfig.DEBUG) Log.d(TAG, "✅ Profile selected: ${profile.name}")

            // プロファイルチップのテキストを更新
            if (profileChipGroup.childCount > 0) {
                val chip = profileChipGroup.getChildAt(0) as? Chip
                chip?.text = profile.name
            }

            reloadSnippets()
        }
    }

    /**
     * カテゴリ選択時の処理
     *
     * 【目的】
     * ユーザーがカテゴリを変更した時の処理を実行します。
     *
     * 【何をするか】
     * 1. 選択されたカテゴリをcurrentCategoryに保存（nullは"すべて"）
     * 2. チップのテキストを更新
     * 3. reloadSnippets()でスニペット一覧を再読み込み
     *
     * 【理由】
     * カテゴリが変わると表示するスニペットが変わるため、
     * フィルタリングして再表示する必要があります。
     */
    private fun onCategorySelected(category: Category?) {
        if (currentCategory?.id != category?.id) {
            currentCategory = category
            if (com.sikakou.cliptap.BuildConfig.DEBUG) Log.d(TAG, "✅ Category selected: ${category?.name ?: "all"}")

            // チップのテキストを更新
            if (categoryChipGroup.childCount > 0) {
                val chip = categoryChipGroup.getChildAt(0) as? Chip
                chip?.text = category?.name ?: getString(R.string.category_all)
            }

            reloadSnippets()
        }
    }

    /**
     * スニペットを再読み込み（Serviceを使用）
     *
     * 【目的】
     * 現在のプロファイルとカテゴリに基づいてスニペット一覧を取得します。
     *
     * 【何をするか】
     * 1. currentProfileとcurrentCategoryを確認
     * 2. SnippetServiceを使ってスニペットを取得
     *    - カテゴリ選択時: getSnippetsByCategory()
     *    - "すべて"選択時: getAllSnippets()
     * 3. 取得したスニペットをRecyclerViewのアダプターに渡す
     *
     * 【理由】
     * プロファイルやカテゴリが変わるたびに、
     * 表示するスニペットをフィルタリングして更新する必要があります。
     */
    private fun reloadSnippets() {
        if (com.sikakou.cliptap.BuildConfig.DEBUG) Log.d(TAG, "🔄 reloadSnippets started (sortBy: $currentSortBy)")

        val profileId = currentProfile?.id
        if (profileId == null) {
            Log.w(TAG, "⚠️ No profile selected")
            snippetAdapter.submitList(emptyList())
            return
        }

        val categoryId = currentCategory?.id

        // Serviceを使用してスニペットを取得（SQLのORDER BYでソート済み）
        allSnippets = if (categoryId != null) {
            snippetService.getSnippetsByCategory(categoryId, profileId, currentSortBy)
        } else {
            snippetService.getAllSnippets(profileId, currentSortBy)
        }

        if (com.sikakou.cliptap.BuildConfig.DEBUG) Log.d(TAG, "✅ Loaded ${allSnippets.size} snippets (sortBy: $currentSortBy)")

        // アダプターに変数マップと書式を設定（タイトルの変数置換に使用）
        // 行の描画ごとにDBを読まないよう、ここでまとめて渡す
        snippetAdapter.variablesMap = variablesMap
        snippetAdapter.systemVariableFormats = SystemVariableFormatMapper.getInstance(this).getAll()

        // アダプターに渡す
        snippetAdapter.submitList(allSnippets)

        // 空の状態表示を制御
        updateEmptyState(allSnippets.isEmpty())
    }

    /**
     * 空の状態表示を更新
     *
     * 【目的】
     * スニペットが空の時に「スニペットがありません」というメッセージを表示します。
     *
     * 【何をするか】
     * スニペットリストが空の場合、emptyStateTextViewを表示し、
     * RecyclerViewを非表示にします。
     *
     * @param isEmpty スニペットが空かどうか
     */
    private fun updateEmptyState(isEmpty: Boolean) {
        if (isEmpty) {
            emptyStateTextView.visibility = View.VISIBLE
            snippetRecyclerView.visibility = View.GONE
        } else {
            emptyStateTextView.visibility = View.GONE
            snippetRecyclerView.visibility = View.VISIBLE
        }
    }

    /**
     * スニペットクリック時の処理（詳細画面を表示）
     *
     * 【目的】
     * ユーザーがスニペットカードをタップした時に詳細画面を表示します。
     *
     * 【何をするか】
     * showSnippetDetail()に処理を委譲します。
     *
     * 【理由】
     * SnippetAdapterからのコールバックとして機能します。
     */
    private fun onSnippetClicked(snippet: Snippet) {
        if (com.sikakou.cliptap.BuildConfig.DEBUG) Log.d(TAG, "Snippet selected")
        showSnippetDetail(snippet)
    }

    /**
     * スニペット詳細画面を表示
     *
     * 【目的】
     * スニペットの内容を詳細画面に表示します。
     *
     * 【何をするか】
     * 1. 選択されたスニペットをselectedSnippetに保存
     * 2. copyWithTitleがtrueの場合、タイトルを変数置換して表示
     * 3. スニペット本文を変数置換して表示
     * 4. 詳細画面をフェードインアニメーションで表示
     *
     * 【理由】
     * 変数（{{name}}など）を実際の値に置換してから表示することで、
     * ユーザーは挿入される最終的なテキストを確認できます。
     */
    private fun showSnippetDetail(snippet: Snippet) {
        selectedSnippet = snippet

        // タイトルの表示/非表示を制御
        if (snippet.copyWithTitle) {
            // タイトルも変数置換する（iOSと同じ動作）
            val rawTitle = snippet.title ?: getString(R.string.snippet_no_title)
            val replacedTitle = snippetService.replaceVariables(rawTitle, variablesMap)
            detailTitleLabel.text = replacedTitle
            detailTitleLabel.visibility = View.VISIBLE
        } else {
            detailTitleLabel.visibility = View.GONE
        }

        // 内容を変数置換して表示
        val replacedContent = snippetService.replaceVariables(snippet.content, variablesMap)
        detailContentLabel.text = replacedContent

        // 詳細画面を表示（フェードインアニメーション）
        mainView.visibility = View.GONE
        detailView.visibility = View.VISIBLE
        detailView.alpha = 0f
        detailView.animate()
            .alpha(1f)
            .setDuration(200)
            .start()

        if (com.sikakou.cliptap.BuildConfig.DEBUG) Log.d(TAG, "✅ Detail view shown")
    }

    /**
     * 詳細画面を閉じる
     *
     * 【目的】
     * 詳細画面をフェードアウトして閉じます。
     *
     * 【何をするか】
     * 1. フェードアウトアニメーション（200ms）を実行
     * 2. アニメーション終了後に詳細画面を非表示にする
     * 3. selectedSnippetをnullにクリア
     *
     * 【理由】
     * アニメーションを使うことで、画面遷移が滑らかになり、
     * ユーザー体験が向上します。
     */
    private fun closeDetailView() {
        // フェードアウトアニメーション
        detailView.animate()
            .alpha(0f)
            .setDuration(200)
            .withEndAction {
                detailView.visibility = View.GONE
                mainView.visibility = View.VISIBLE
                selectedSnippet = null
            }
            .start()

        if (com.sikakou.cliptap.BuildConfig.DEBUG) Log.d(TAG, "✅ Detail view closed")
    }

    /**
     * コピーボタンクリック時の処理
     *
     * 【目的】
     * スニペットをテキストフィールドに挿入します。
     *
     * 【何をするか】
     * 1. selectedSnippetを取得
     * 2. currentInputConnectionを取得（テキストフィールドへの接続）
     * 3. SnippetService.insertSnippet()を呼んでテキスト挿入
     * 4. 挿入成功時は詳細画面を閉じる
     * 5. 挿入失敗時はトーストでエラーを表示
     *
     * 【理由】
     * InputConnectionはAndroidのIMEがテキストフィールドに
     * テキストを挿入するための標準的な方法です。
     * SnippetServiceに処理を委譲することで、変数置換ロジックを再利用できます。
     */
    private fun onCopyButtonClicked() {
        val snippet = selectedSnippet ?: return

        if (com.sikakou.cliptap.BuildConfig.DEBUG) Log.d(TAG, "Snippet insert requested")

        // テキストを挿入（Serviceに委譲）
        val ic = currentInputConnection
        if (ic != null) {
            snippetService.insertSnippet(snippet, ic, variablesMap)
            if (com.sikakou.cliptap.BuildConfig.DEBUG) Log.d(TAG, "✅ Text inserted successfully")
            closeDetailView()
        } else {
            Log.e(TAG, "❌ InputConnection is null")
            Toast.makeText(this, "テキストの挿入に失敗しました", Toast.LENGTH_SHORT).show()
        }
    }

    override fun onStartInputView(info: android.view.inputmethod.EditorInfo?, restarting: Boolean) {
        super.onStartInputView(info, restarting)
        applyWindowBackground()
        if (com.sikakou.cliptap.BuildConfig.DEBUG) Log.d(TAG, "============================================================")
        if (com.sikakou.cliptap.BuildConfig.DEBUG) Log.d(TAG, "👁️ onStartInputView CALLED")
        if (com.sikakou.cliptap.BuildConfig.DEBUG) Log.d(TAG, "   restarting: $restarting")
        if (com.sikakou.cliptap.BuildConfig.DEBUG) Log.d(TAG, "   inputType: ${info?.inputType}")
        if (com.sikakou.cliptap.BuildConfig.DEBUG) Log.d(TAG, "   keyboardView visibility: ${keyboardView.visibility}")
        if (com.sikakou.cliptap.BuildConfig.DEBUG) Log.d(TAG, "   keyboardView height: ${keyboardView.height}")
        if (com.sikakou.cliptap.BuildConfig.DEBUG) Log.d(TAG, "   keyboardView measuredHeight: ${keyboardView.measuredHeight}")
        if (com.sikakou.cliptap.BuildConfig.DEBUG) Log.d(TAG, "   keyboardView layoutParams: ${keyboardView.layoutParams}")
        if (com.sikakou.cliptap.BuildConfig.DEBUG) Log.d(TAG, "============================================================")

        // ビューが測定されるまで待つ
        keyboardView.post {
            if (com.sikakou.cliptap.BuildConfig.DEBUG) Log.d(TAG, "📐 After layout:")
            if (com.sikakou.cliptap.BuildConfig.DEBUG) Log.d(TAG, "   keyboardView height: ${keyboardView.height}")
            if (com.sikakou.cliptap.BuildConfig.DEBUG) Log.d(TAG, "   keyboardView measuredHeight: ${keyboardView.measuredHeight}")
            if (com.sikakou.cliptap.BuildConfig.DEBUG) Log.d(TAG, "   keyboardView width: ${keyboardView.width}")
        }
    }

    /**
     * IMEウィンドウの背景を現在の設定（ライト/ダーク）で再適用する
     * ウィンドウは1度しか生成されないため、表示のたびに適用して切替に追従させる
     */
    private fun applyWindowBackground() {
        val color = ContextCompat.getColor(this, R.color.keyboardWindowBackground)
        window?.window?.setBackgroundDrawable(ColorDrawable(color))
    }

    override fun onDestroy() {
        super.onDestroy()
        database.close()
        if (com.sikakou.cliptap.BuildConfig.DEBUG) Log.d(TAG, "Keyboard service destroyed")
    }

    // MARK: - Sort Methods（ソート関連メソッド）

    /**
     * ソートメニューを表示
     *
     * 【目的】
     * ソートボタンをタップした時にPopupMenuを表示し、
     * ユーザーがソート順を選択できるようにします。
     */
    private fun showSortMenu(anchor: View) {
        val popupMenu = android.widget.PopupMenu(this, anchor)
        popupMenu.menu.apply {
            add(0, 0, 0, getString(R.string.keyboard_sort_created))
            add(0, 1, 1, getString(R.string.keyboard_sort_updated))
            add(0, 2, 2, getString(R.string.keyboard_sort_title))
            add(0, 3, 3, getString(R.string.keyboard_sort_usage))
        }

        popupMenu.setOnMenuItemClickListener { item ->
            val newSortBy = when (item.itemId) {
                0 -> "created"
                1 -> "updated"
                2 -> "title"
                3 -> "usage"
                else -> "created"
            }
            updateSortPreference(newSortBy)
            true
        }

        popupMenu.show()
    }

    /**
     * ソート設定を更新
     */
    private fun updateSortPreference(sortBy: String) {
        if (com.sikakou.cliptap.BuildConfig.DEBUG) Log.d(TAG, "🔄 [Sort] Updating sort preference: $currentSortBy → $sortBy")
        currentSortBy = sortBy
        saveSortPreference(sortBy)

        // スニペット一覧を再読み込み
        reloadSnippets()

        // バッジ表示を更新
        updateSortBadgeVisibility()

        // リストのトップにスクロール
        snippetRecyclerView.scrollToPosition(0)
    }

    /**
     * ソート設定を保存（SharedPreferences）
     */
    private fun saveSortPreference(sortBy: String) {
        val prefs = getSharedPreferences(SORT_PREFS_NAME, MODE_PRIVATE)
        prefs.edit().putString(SORT_PREFERENCE_KEY, sortBy).apply()
        if (com.sikakou.cliptap.BuildConfig.DEBUG) Log.d(TAG, "💾 [Sort] Saved sort preference: $sortBy")
    }

    /**
     * ソート設定を読み込み（SharedPreferences）
     */
    private fun loadSortPreference(): String {
        val prefs = getSharedPreferences(SORT_PREFS_NAME, MODE_PRIVATE)
        val sortBy = prefs.getString(SORT_PREFERENCE_KEY, "created") ?: "created"
        if (com.sikakou.cliptap.BuildConfig.DEBUG) Log.d(TAG, "📂 [Sort] Loaded sort preference: $sortBy")
        return sortBy
    }

    /**
     * ソートバッジの表示/非表示を更新
     * デフォルト（created）以外の時にバッジを表示
     */
    private fun updateSortBadgeVisibility() {
        val isDefaultSort = currentSortBy == "created"
        sortBadge.visibility = if (isDefaultSort) android.view.View.GONE else android.view.View.VISIBLE
    }

}
