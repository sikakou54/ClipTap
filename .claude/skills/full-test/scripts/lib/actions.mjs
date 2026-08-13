/**
 * テスト仕様書CSVで使えるActionの定義
 *
 * ここに無いActionは validate.mjs が弾く。語彙を閉じているので、
 * 実行時にClaudeが「この操作は何を意味するのか」を解釈する余地が無い。
 */

/**
 * kind
 *   setup     前提を組み立てる操作。アプリの再起動を伴うことがある
 *   action    利用者操作
 *   assert    期待値の検証。PASS/FAILを決めるのはこのActionだけ
 *   evidence  証跡の取得
 */
export const ACTIONS = {
  /* ---- 前提・ライフサイクル ---- */
  SET_STATE:      { kind: 'setup',  target: 'fixture名',        input: null,        desc: 'DBをフィクスチャの内容へ置き換える' },
  SET_PLAN:       { kind: 'setup',  target: null,               input: 'free|pro',  desc: 'プラン状態を上書きする' },
  SET_SORT:       { kind: 'setup',  target: null,               input: 'created|updated|title|usage', desc: '並べ替え設定を永続化する' },
  SET_LOCALE:     { kind: 'setup',  target: null,               input: 'ja|en',     desc: '端末の言語を切り替える' },
  SET_APPEARANCE: { kind: 'setup',  target: null,               input: 'light|dark', desc: '端末の外観を切り替える' },
  SET_NETWORK:    { kind: 'setup',  target: null,               input: 'on|off',    desc: 'ホストのWi-Fiを切り替える（config.envで許可が必要）' },
  SET_CLIPBOARD:  { kind: 'setup',  target: null,               input: 'text',      desc: 'クリップボードへ初期値を入れる' },
  LAUNCH:         { kind: 'setup',  target: null,               input: null,        desc: 'アプリを起動する' },
  RELAUNCH:       { kind: 'setup',  target: null,               input: null,        desc: 'アプリを終了してから起動し直す' },
  TERMINATE:      { kind: 'setup',  target: null,               input: null,        desc: 'アプリを終了する' },
  WIPE_INSTALL:   { kind: 'setup',  target: null,               input: null,        desc: 'DBと設定を消して新規インストール状態にする' },

  /* ---- 利用者操作 ---- */
  TAP:            { kind: 'action', target: 'locator',          input: null,        desc: 'タップする' },
  LONG_PRESS:     { kind: 'action', target: 'locator',          input: 'ms',        desc: '長押しする（既定600ms）' },
  DOUBLE_TAP:     { kind: 'action', target: 'locator',          input: null,        desc: 'ダブルタップする' },
  TAP_REPEAT:     { kind: 'action', target: 'locator',          input: 'count',     desc: '連続タップする（多重実行の検証）' },
  TAP_NEAR:       { kind: 'action', target: 'anchor locator',   input: 'target locator', desc: '基準要素より下にある最初の対象をタップする。一覧の行ごとのアイコンを順序指定に頼らず特定できる' },
  TAP_IN:         { kind: 'action', target: 'locator',          input: 'fx,fy',     desc: '要素の矩形内を相対位置(0〜1)でタップする。一覧行が子ボタンを含む1要素として現れる場合に使う' },
  DRAG:           { kind: 'action', target: 'locator|x,y',      input: 'locator|x,y', desc: 'ドラッグする' },
  SCROLL:         { kind: 'action', target: null,               input: 'up|down',   desc: 'スクロールする' },
  SCROLL_TO:      { kind: 'action', target: 'locator',          input: null,        desc: '要素が画面内に入るまでスクロールする' },
  PULL_REFRESH:   { kind: 'action', target: null,               input: null,        desc: 'プルリフレッシュする' },
  SWIPE:          { kind: 'action', target: null,               input: 'left|right|up|down', desc: 'スワイプする' },
  TYPE:           { kind: 'action', target: 'locator',          input: 'text',      desc: '要素をタップしてから文字を入力する' },
  TYPE_RAW:       { kind: 'action', target: null,               input: 'text',      desc: 'フォーカス中の入力欄へ文字を入力する' },
  TYPE_PASTE:     { kind: 'action', target: 'locator',          input: 'text',      desc: '要素をタップしてクリップボード経由で貼り付ける（絵文字など⌘Vでしか入らない文字用。クリップボードの中身が変わる）' },
  PASTE_RAW:      { kind: 'action', target: null,               input: 'text',      desc: 'フォーカス中の入力欄へクリップボード経由で貼り付ける' },
  CLEAR_TEXT:     { kind: 'action', target: 'locator',          input: 'count',     desc: '要素をタップしてデリートを送る' },
  PRESS_KEY:      { kind: 'action', target: null,               input: 'return|delete|escape|tab', desc: 'キーを送る' },
  HOME:           { kind: 'action', target: null,               input: null,        desc: 'ホーム画面へ戻す（バックグラウンド化）' },
  WAIT:           { kind: 'action', target: null,               input: 'ms',        desc: '待つ' },
  WAIT_FOR:       { kind: 'action', target: 'locator',          input: 'ms',        desc: '要素が現れるまで待つ' },
  WAIT_GONE:      { kind: 'action', target: 'locator',          input: 'ms',        desc: '要素が消えるまで待つ' },

  /* ---- 検証 ---- */
  ASSERT_VISIBLE:     { kind: 'assert', target: 'locator', input: null,     desc: '要素が画面内に見えている' },
  ASSERT_NOT_VISIBLE: { kind: 'assert', target: 'locator', input: null,     desc: '要素が画面内に見えていない' },
  ASSERT_TEXT:        { kind: 'assert', target: 'locator', input: 'text',   desc: '要素のラベルが指定文字列と完全一致する' },
  ASSERT_TEXT_CONTAINS: { kind: 'assert', target: 'locator', input: 'text', desc: '要素のラベルが指定文字列を含む' },
  ASSERT_SCREEN_HAS:  { kind: 'assert', target: null,     input: 'text',    desc: '画面内のどこかに指定文字列がある' },
  ASSERT_SCREEN_LACKS:{ kind: 'assert', target: null,     input: 'text',    desc: '画面内のどこにも指定文字列が無い' },
  ASSERT_COUNT:       { kind: 'assert', target: 'locator', input: 'number', desc: '一致する要素の件数が一致する' },
  ASSERT_ORDER:       { kind: 'assert', target: 'locator', input: 'a,b,c',  desc: '一致要素のラベルが上から指定順に並ぶ' },
  ASSERT_ENABLED:     { kind: 'assert', target: 'locator', input: null,     desc: '要素が操作可能である' },
  ASSERT_DISABLED:    { kind: 'assert', target: 'locator', input: null,     desc: '要素が操作不能である' },
  ASSERT_CLIPBOARD:   { kind: 'assert', target: null,     input: 'text',    desc: 'クリップボードが指定文字列と完全一致する' },
  ASSERT_CLIPBOARD_CONTAINS: { kind: 'assert', target: null, input: 'text', desc: 'クリップボードが指定文字列を含む' },
  ASSERT_DB:          { kind: 'assert', target: 'SQL',    input: 'expected', desc: 'SQLの結果が指定値と一致する' },
  ASSERT_PREF:        { kind: 'assert', target: 'key',    input: 'expected', desc: '永続設定の値が一致する' },
  ASSERT_SCREEN:      { kind: 'assert', target: 'ScreenID', input: null,    desc: '現在の画面が指定ScreenIDである（screens.csvの識別ロケータで判定）' },
  ASSERT_NO_JS_ERROR: { kind: 'assert', target: null,     input: 'minutes', desc: '直近のログにJSエラーが無い' },

  /* ---- 証跡 ---- */
  SHOT:               { kind: 'evidence', target: 'name', input: null,      desc: 'スクリーンショットを保存する' },
  DUMP_UI:            { kind: 'evidence', target: 'name', input: null,      desc: 'AXツリーをテキストで保存する' },
};

export const ACTION_NAMES = Object.keys(ACTIONS);

/** 前提条件（Precondition / Cleanup 列）で使えるキー */
export const PRECONDITION_KEYS = [
  'fixture',     // フィクスチャ名
  'plan',        // free | pro | clear
  'sort',        // created | updated | title | usage | clear
  'locale',      // ja | en
  'appearance',  // light | dark
  'network',     // on | off
  'clipboard',   // 初期クリップボード文字列
  'install',     // fresh（DB・設定を消して新規インストール状態から起動）
  'launch',      // yes | no（既定 yes。noなら起動しない）
  'none',        // 何もしない
];
