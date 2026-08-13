#!/bin/zsh
#
# iOSシミュレータ操作ドライバ（full-test スキル）
#
# 要素はラベルで指定する。座標を人が読み取る必要はない。
#
#   sim.sh boot                          起動中のシミュレータを確認（無ければ起動）
#   sim.sh install                       アプリをビルドしてインストール（npm run ios）
#   sim.sh launch                        アプリを起動（既に起動中なら何もしない）
#   sim.sh relaunch                      アプリを終了してから起動し直す
#   sim.sh terminate                     アプリを終了する
#   sim.sh activate                      Simulatorウィンドウを前面へ出す
#   sim.sh dismiss                       開発ビルドのdev-menu等の被せ表示を閉じる
#
#   sim.sh tap <locator>                 要素をタップ
#   sim.sh longpress <locator> [ms]      長押し（既定600ms）
#   sim.sh doubletap <locator>           ダブルタップ
#   sim.sh tapfast <locator> <n>         連続タップ（多重実行の検証用）
#   sim.sh tapnear <anchor> <target>     基準要素より下にある最初の対象をタップ
#   sim.sh tapin <locator> <fx> <fy>     要素の矩形内を相対位置(0〜1)でタップ
#   sim.sh tappt <x> <y> [holdMs]        デバイスのポイント座標でタップ（AXに出ない系UI用）
#   sim.sh tapxy <x> <y> [holdMs]        macOS画面座標で直接タップ（最後の手段）
#   sim.sh points                        デバイスの論理解像度と倍率
#   sim.sh drag <locator|x,y> <locator|x,y> [ms]
#   sim.sh scroll <up|down> [ratio]      画面中央を基点にスクロール（既定0.5）
#   sim.sh scrollto <locator> [maxTry]   要素が画面内に入るまでスクロール
#   sim.sh pullrefresh                   プルリフレッシュ
#   sim.sh swipe <left|right|up|down>
#
#   sim.sh type <text>                   フォーカス中の入力欄へ文字入力（クリップボード経由。正確）
#   sim.sh paste <text>                  同上（type の実体）
#   sim.sh keystroke <text>              キーイベントを送る（入力ソース依存。文字化けし得る）
#   sim.sh key <return|delete|escape|tab> キー送信
#   sim.sh cleartext <n>                 デリートをn回送る
#
#   sim.sh clipboard                     シミュレータのクリップボードを出力
#   sim.sh setclipboard <text>           シミュレータのクリップボードを設定
#
#   sim.sh find|exists|count|waitfor|waitgone|dump|texts|geometry ...   （ui へ委譲）
#   sim.sh shot <name>                   スクリーンショットを保存しパスを出力
#   sim.sh logs [minutes]                JSレベルのエラーを抽出
#   sim.sh appearance <light|dark>
#   sim.sh locale <ja|en>                言語を切り替える（アプリの再起動が必要）
#   sim.sh home                          ホームへ戻す
#   sim.sh device                        UDID・機種名・OSバージョンを出力
#
# 前提: システム設定 > プライバシーとセキュリティ > アクセシビリティ で
#       このセッションの親アプリ（Visual Studio Code / ターミナル）が許可されていること。

set -o pipefail

SKILL_DIR="${0:A:h:h}"
SCRIPTS="$SKILL_DIR/scripts"
BIN="$SCRIPTS/.bin"
REPO_ROOT="${0:A:h:h:h:h:h}"
OUT_DIR="${FULLTEST_OUT:-$SKILL_DIR/.out}"
mkdir -p "$OUT_DIR" "$BIN"

# nvm/homebrew配下のツールをPATHへ（Claude Codeの既定PATHには含まれない）
for d in "$HOME/.nvm/versions/node"/*/bin /opt/homebrew/bin /usr/local/bin; do
  [[ -d "$d" ]] && PATH="$d:$PATH"
done
export PATH
export LANG="${LANG:-en_US.UTF-8}"

[[ -f "$SKILL_DIR/config.env" ]] && source "$SKILL_DIR/config.env"
if [[ -z "$BUNDLE_ID" ]]; then
  BUNDLE_ID=$(grep -m1 '"bundleIdentifier"' "$REPO_ROOT/apps/mobile/app.json" | sed 's/.*: *"\(.*\)".*/\1/')
fi
: "${BUNDLE_ID:=com.sikakou.cliptap}"
: "${LAUNCH_WAIT_MS:=9000}"
: "${DEFAULT_WAIT_MS:=6000}"

# 画面下端は広告バナー、上端はステータスバーに覆われる。
# AXの座標は覆われていることを示さないため、比率で安全域を決めて ui へ渡す。
export UI_SAFE_TOP="${SAFE_TOP_RATIO:-0.07}"
export UI_SAFE_BOTTOM="${SAFE_BOTTOM_RATIO:-0.14}"

# AXツリーは画面遷移の最中だけ一時的に空になる。数回だけ取り直す。
# ここを大きくすると「要素が無いこと」を確かめるだけの呼び出しが極端に遅くなる。
export UI_RETRY="${UI_RETRY_COUNT:-3}"

die() { print -u2 "ERROR: $*"; exit 1; }

booted_udid() {
  xcrun simctl list devices booted -j 2>/dev/null \
    | grep -o '"udid" : "[^"]*"' | head -1 | sed 's/.*: "\(.*\)"/\1/'
}

ensure_booted() {
  local u=$(booted_udid)
  if [[ -z "$u" ]]; then
    u=$(xcrun simctl list devices available -j 2>/dev/null \
        | grep -o '"udid" : "[^"]*"' | head -1 | sed 's/.*: "\(.*\)"/\1/')
    [[ -z "$u" ]] && die "利用可能なシミュレータが見つかりません"
    xcrun simctl boot "$u" 2>/dev/null
    open -a Simulator
    sleep 8
    u=$(booted_udid)
  fi
  [[ -z "$u" ]] && die "シミュレータを起動できませんでした"
  print "$u"
}

# Swiftヘルパーは初回だけビルドする。ソースが新しければ作り直す。
ensure_bin() {
  local name=$1 src="$SCRIPTS/$1.swift" out="$BIN/$1"
  if [[ ! -x "$out" || "$src" -nt "$out" ]]; then
    swiftc -O -o "$out" "$src" >/dev/null 2>&1 \
      || die "$name.swift のビルドに失敗しました（Xcodeコマンドラインツールが必要）"
  fi
  print "$out"
}

# AX APIはSimulatorが前面にないと安定しないため、操作の前に必ず前面へ出す。
activate() {
  osascript -e 'tell application "Simulator" to activate' >/dev/null 2>&1
  sleep 0.4
}

UI=""; GESTURE=""
need_ui()      { [[ -z "$UI" ]] && UI=$(ensure_bin ui); print "$UI" }
need_gesture() { [[ -z "$GESTURE" ]] && GESTURE=$(ensure_bin gesture); print "$GESTURE" }

# 開発ビルドではExpoのdev-menuが画面を覆うことがある。
# 覆われたまま操作を続けると全ステップが誤判定になるため、起動直後に必ず閉じる。
# AXツリーの読み取りは最小回数にする。無い要素を何度も探すと遅くなるだけ。
dismiss_overlays() {
  local u=$(need_ui) g=$(need_gesture) i loc pos
  for i in 1 2 3; do
    # 開発メニューは日本語表示にも英語表示にもなる。特定の文言に頼らず、
    # このオーバーレイにしか出ない要素で検出する。
    "$u" exists 'label~=Runtime version' 2>/dev/null \
      || "$u" exists 'label~=pop-up window' 2>/dev/null \
      || "$u" exists 'label~=dev-tools' 2>/dev/null \
      || return 0

    # zshの read は空文字でも成功するため、終了コードではなく中身で判定する。
    pos=""
    for loc in 'label=閉じる&visible=true' 'label=Close&visible=true' 'label~=pop-up window'; do
      pos=$("$u" find "$loc" 2>/dev/null)
      [[ -n "$pos" ]] && break
      pos=""
    done
    [[ -z "$pos" ]] && return 0
    "$g" tap ${=pos} 60 >/dev/null
    sleep 1.2
  done
}

# 起動完了を固定時間で待つと、速いときは無駄に待ち、遅いときは足りない。
# 画面遷移の最中はAXツリーが一時的に空になるため、0を挟んでも進捗を捨てず、
# 「ラベル付きの要素が3件以上」を2回観測できた時点で準備完了とみなす。
wait_ready() {
  local u=$(need_ui) n=0 hits=0 i
  sleep 0.6
  for i in {1..40}; do
    # ポーリング中は取り直さない。空なら次の周回で見ればよい
    n=$(UI_RETRY=0 "$u" count 'has=label&visible=true' 2>/dev/null) || n=0
    if (( n >= 3 )); then
      (( hits++ ))
      if (( hits >= 2 )); then
        print "ready (${n} elements)"
        return 0
      fi
    fi
    sleep 0.2
    (( i * 200 + 600 > LAUNCH_WAIT_MS )) && break
  done
  print "ready timeout (${n} elements)"
}

# デバイスの論理解像度（ポイント）をスクリーンショットの実ピクセルから求める。
# Simulatorウィンドウの表示倍率が変わっても、この値は変わらない。
device_points() {
  local u=$(ensure_booted) tmp="$OUT_DIR/.probe.png"
  xcrun simctl io "$u" screenshot --type=png "$tmp" >/dev/null 2>&1 || die "スクリーンショットを取得できません"
  local px=$(sips -g pixelWidth "$tmp" 2>/dev/null | tail -1 | awk '{print $2}')
  local py=$(sips -g pixelHeight "$tmp" 2>/dev/null | tail -1 | awk '{print $2}')
  local scale=3
  (( px <= 828 )) && scale=2
  print "$((px / scale)) $((py / scale)) $scale"
}

# デバイスのポイント座標 → macOSの画面座標。
# DocumentPickerなどAXツリーに現れないシステムUIを操作する唯一の手段。
# 機種が変わるとレイアウトが変わるため、これを使うテストは機種を固定する。
pt_to_screen() {
  local u=$(need_ui)
  read gx gy gw gh <<< "$("$u" geometry)"
  read dw dh sc <<< "$(device_points)"
  print "$gx $gy $gw $gh $dw $dh $1 $2" | awk '{printf "%d %d", $1+($7*$3/$5), $2+($8*$4/$6)}'
}

# 「x,y」形式ならそのまま座標として、それ以外はロケータとして解決する。
resolve_point() {
  local spec=$1
  if [[ "$spec" == <->,<-> ]]; then
    print "${spec%,*} ${spec#*,}"
    return 0
  fi
  local u=$(need_ui)
  "$u" find "$spec" || return 1
}

cmd=$1; shift 2>/dev/null

case "$cmd" in
  boot)
    u=$(ensure_booted); open -a Simulator; print "booted: $u"
    ;;

  device)
    u=$(ensure_booted)
    xcrun simctl list devices booted -j 2>/dev/null \
      | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const j=JSON.parse(s);for(const[rt,ds]of Object.entries(j.devices))for(const d of ds)if(d.state==="Booted")console.log(`${d.udid}\t${d.name}\t${rt.split(".").pop()}`)})'
    ;;

  install)
    (cd "$REPO_ROOT" && npm run ios) || die "npm run ios に失敗しました"
    ;;

  launch)
    u=$(ensure_booted)
    xcrun simctl launch "$u" "$BUNDLE_ID" >/dev/null \
      || die "アプリを起動できません（先に sim.sh install を実行してください）"
    activate
    wait_ready >/dev/null
    dismiss_overlays
    print "launched: $BUNDLE_ID"
    ;;

  relaunch)
    u=$(ensure_booted)
    xcrun simctl terminate "$u" "$BUNDLE_ID" >/dev/null 2>&1
    sleep 1
    xcrun simctl launch "$u" "$BUNDLE_ID" >/dev/null || die "アプリを起動できません"
    activate
    wait_ready >/dev/null
    dismiss_overlays
    print "relaunched: $BUNDLE_ID"
    ;;

  terminate)
    u=$(ensure_booted)
    xcrun simctl terminate "$u" "$BUNDLE_ID" >/dev/null 2>&1
    print "terminated: $BUNDLE_ID"
    ;;

  activate)
    activate; print "activated"
    ;;

  dismiss)
    activate; dismiss_overlays; print "dismissed"
    ;;

  tap|longpress|doubletap)
    [[ -z "$1" ]] && die "usage: sim.sh $cmd <locator> [ms]"
    activate
    g=$(need_gesture); u=$(need_ui)
    # 一覧の要素は広告バナーの下へ潜り込むことがある。安全域の外なら先へ送り出す。
    # 存在と位置は1回の読み取りで判定する。
    # 2回に分けると遷移中に片方だけ空振りし、存在しない要素のために
    # スクロールしてモーダルを閉じてしまう。
    if [[ "$1" != <->,<-> ]]; then
      "$u" safecheck "${1//&visible=true/}" >/dev/null 2>&1
      case $? in
        1) "$0" scrollto "$1" >/dev/null 2>&1
           # 慣性スクロールが止まる前に座標を取ると押した先が変わる。
           # iOSは減速中のタップをスクロール停止として吸収する。
           sleep 1.5 ;;
      esac
    fi
    pos=$(resolve_point "$1") || die "要素が見つかりません: $1"
    [[ -z "$pos" ]] && die "要素が見つかりません: $1"
    read x y <<< "$pos"
    case "$cmd" in
      tap)       "$g" tap "$x" "$y" 60 ;;
      longpress) "$g" tap "$x" "$y" "${2:-600}" ;;
      doubletap) "$g" double "$x" "$y" ;;
    esac
    ;;

  tapfast)
    [[ -z "$2" ]] && die "usage: sim.sh tapfast <locator> <count>"
    activate
    g=$(need_gesture)
    pos=$(resolve_point "$1") || die "要素が見つかりません: $1"
    [[ -z "$pos" ]] && die "要素が見つかりません: $1"
    read x y <<< "$pos"
    for i in {1..$2}; do "$g" tap "$x" "$y" 30 >/dev/null; done
    print "tapped $2 times at $x,$y"
    ;;

  tapxy)
    [[ -z "$2" ]] && die "usage: sim.sh tapxy <x> <y> [holdMs]"
    activate
    g=$(need_gesture)
    "$g" tap "$1" "$2" "${3:-60}"
    ;;

  tapnear)
    [[ -z "$2" ]] && die "usage: sim.sh tapnear <anchorLocator> <targetLocator>"
    # 「この行の下にある最初の◯◯」を押す。一覧のアイコンを順序指定に頼らず特定できる。
    activate
    g=$(need_gesture); u=$(need_ui)
    "$0" scrollto "$1" >/dev/null 2>&1
    sleep 1.5
    pos=$("$u" findbelow "$1" "$2") || die "対象が見つかりません: $1 の下の $2"
    [[ -z "$pos" ]] && die "対象が見つかりません: $1 の下の $2"
    read x y <<< "$pos"
    "$g" tap "$x" "$y" 60
    ;;

  tapin)
    [[ -z "$3" ]] && die "usage: sim.sh tapin <locator> <fx> <fy>"
    # 一覧の行は子ボタンを含む1要素として現れることがある（親がaccessibleなため）。
    # 行の矩形は取れるので、その中の相対位置を押して子ボタンへ届かせる。
    # 座標を直に書くのと違い、要素を見つけてからの相対位置なので画面サイズに依存しない。
    activate
    g=$(need_gesture); u=$(need_ui)
    rect=$("$u" rect "$1") || die "要素が見つかりません: $1"
    read rx ry rw rh <<< "$rect"
    [[ -z "$rw" || "$rw" == "0" ]] && die "要素の矩形を取得できません: $1"
    x=$(print "$rx $rw $2" | awk '{printf "%d", $1+$2*$3}')
    y=$(print "$ry $rh $3" | awk '{printf "%d", $1+$2*$3}')
    "$g" tap "$x" "$y" 60
    ;;

  tappt)
    [[ -z "$2" ]] && die "usage: sim.sh tappt <x> <y> [holdMs]"
    activate
    g=$(need_gesture)
    read sx sy <<< "$(pt_to_screen "$1" "$2")"
    "$g" tap "$sx" "$sy" "${3:-60}"
    ;;

  points)
    read dw dh sc <<< "$(device_points)"
    print "logical: ${dw}x${dh} points (scale ${sc}x)"
    print "screenshot: $((dw*sc))x$((dh*sc)) pixels"
    ;;

  drag)
    [[ -z "$2" ]] && die "usage: sim.sh drag <from> <to> [ms]"
    activate
    g=$(need_gesture)
    pos=$(resolve_point "$1"); [[ -z "$pos" ]] && die "始点が見つかりません: $1"
    read x1 y1 <<< "$pos"
    pos=$(resolve_point "$2"); [[ -z "$pos" ]] && die "終点が見つかりません: $2"
    read x2 y2 <<< "$pos"
    "$g" drag "$x1" "$y1" "$x2" "$y2" "${3:-400}"
    ;;

  scroll|pullrefresh|swipe)
    activate
    g=$(need_gesture); u=$(need_ui)
    read gx gy gw gh <<< "$("$u" geometry)"
    cx=$(( gx + gw / 2 )); cy=$(( gy + gh / 2 ))
    case "$cmd" in
      scroll)
        ratio="${2:-0.5}"
        d=$(print "$gh $ratio" | awk '{printf "%d", $1*$2/2}')
        if [[ "$1" == "down" ]]; then
          "$g" drag "$cx" "$(( cy + d ))" "$cx" "$(( cy - d ))" 500
        elif [[ "$1" == "up" ]]; then
          "$g" drag "$cx" "$(( cy - d ))" "$cx" "$(( cy + d ))" 500
        else
          die "usage: sim.sh scroll <up|down> [ratio]"
        fi
        ;;
      pullrefresh)
        top=$(( gy + gh / 4 ))
        "$g" drag "$cx" "$top" "$cx" "$(( top + gh / 2 ))" 700
        ;;
      swipe)
        case "$1" in
          left)  "$g" drag "$(( gx + gw * 3 / 4 ))" "$cy" "$(( gx + gw / 4 ))" "$cy" 300 ;;
          right) "$g" drag "$(( gx + gw / 4 ))" "$cy" "$(( gx + gw * 3 / 4 ))" "$cy" 300 ;;
          up)    "$g" drag "$cx" "$(( gy + gh * 3 / 4 ))" "$cx" "$(( gy + gh / 4 ))" 300 ;;
          down)  "$g" drag "$cx" "$(( gy + gh / 4 ))" "$cx" "$(( gy + gh * 3 / 4 ))" 300 ;;
          *) die "usage: sim.sh swipe <left|right|up|down>" ;;
        esac
        ;;
    esac
    ;;

  scrollto)
    [[ -z "$1" ]] && die "usage: sim.sh scrollto <locator> [maxTry]"
    activate
    u=$(need_ui)
    max=${2:-8}
    prev=""
    for i in {1..$max}; do
      # 「画面内」ではなく「安全域内」を条件にする。
      # 画面内でも下端は広告バナーに覆われており、そこをタップしても届かない。
      if "$u" exists "$1&safe=true" 2>/dev/null; then
        print "safe after $((i-1)) scroll(s)"
        exit 0
      fi
      read gx gy gw gh <<< "$("$u" geometry)"
      # 位置を探すときは可視条件を外す。画面外にある要素を画面内へ入れるのが目的なので、
      # 「見えていること」を条件にすると自分の目的を否定してしまう。
      probe=${1//&visible=true/}
      if ! read ex ey <<< "$("$u" find "$probe" 2>/dev/null)"; then
        die "要素そのものが存在しません: $probe"
      fi
      # 位置が動かなくなったら、それ以上スクロールしても近づけない
      if [[ "$ey" == "$prev" ]]; then
        print "これ以上スクロールできません（現在位置 y=$ey）"
        exit 0
      fi
      prev=$ey
      if (( ey > gy + gh / 2 )); then "$0" scroll down 0.4 >/dev/null
      else "$0" scroll up 0.4 >/dev/null
      fi
      sleep 0.5
    done
    die "${max}回スクロールしても安全域へ入りませんでした: $1"
    ;;

  type)
    [[ -z "$1" ]] && die "usage: sim.sh type <text>"
    # 文字入力はクリップボード経由で行う。
    # osascript の keystroke はホストの入力ソースを通るため、
    # かな入力状態だと 'abc' が 'あbc'、日本語は全滅する（実測）。
    # 貼り付けならどの文字でも正確に入る。副作用としてクリップボードが変わる。
    exec "$0" paste "$1"
    ;;

  keystroke)
    [[ -z "$1" ]] && die "usage: sim.sh keystroke <text>"
    # キーイベントそのものを送りたいとき用。
    # ホストの入力ソースに依存するので、文字を正確に入れたいなら type を使う。
    activate
    esc=${1//\\/\\\\}; esc=${esc//\"/\\\"}
    osascript -e "tell application \"System Events\" to keystroke \"$esc\"" \
      || die "文字入力に失敗しました"
    print "keystroke: $1"
    ;;

  paste)
    [[ -z "$1" ]] && die "usage: sim.sh paste <text>"
    # AppleScriptのkeystrokeはサロゲートペア（絵文字など）を送れない。
    # クリップボードへ入れて⌘Vで貼ると、どの文字でも入力できる。
    # 副作用としてクリップボードの中身が変わる点に注意。
    u=$(ensure_booted)
    print -rn -- "$1" | xcrun simctl pbcopy "$u"
    activate
    osascript -e 'tell application "System Events" to keystroke "v" using command down' \
      || die "貼り付けに失敗しました"
    print "pasted: $1"
    ;;

  key)
    activate
    case "$1" in
      return) osascript -e 'tell application "System Events" to key code 36' ;;
      delete) osascript -e 'tell application "System Events" to key code 51' ;;
      escape) osascript -e 'tell application "System Events" to key code 53' ;;
      tab)    osascript -e 'tell application "System Events" to key code 48' ;;
      *) die "usage: sim.sh key <return|delete|escape|tab>" ;;
    esac
    print "key: $1"
    ;;

  cleartext)
    activate
    n=${1:-60}
    for i in {1..$n}; do osascript -e 'tell application "System Events" to key code 51'; done
    print "deleted x$n"
    ;;

  clipboard)
    u=$(ensure_booted)
    xcrun simctl pbpaste "$u" 2>/dev/null
    ;;

  setclipboard)
    u=$(ensure_booted)
    print -rn -- "$1" | xcrun simctl pbcopy "$u"
    print "clipboard set"
    ;;

  shot)
    [[ -z "$1" ]] && die "usage: sim.sh shot <name>"
    u=$(ensure_booted)
    p="${2:-$OUT_DIR}/$1.png"
    mkdir -p "${p:h}"
    xcrun simctl io "$u" screenshot --type=png "$p" >/dev/null 2>&1 || die "スクリーンショット失敗"
    print "$p"
    ;;

  logs)
    u=$(ensure_booted)
    xcrun simctl spawn "$u" log show \
      --predicate "processImagePath CONTAINS \"ClipTap\"" \
      --last "${1:-5}m" --style compact 2>/dev/null \
      | grep -iE "RedBox|Invariant Violation|Unhandled|JavaScript error|ReferenceError|TypeError|Cannot read" \
      || print "(JSレベルのエラーは検出されませんでした)"
    ;;

  appearance)
    u=$(ensure_booted)
    [[ "$1" == "light" || "$1" == "dark" ]] || die "usage: sim.sh appearance <light|dark>"
    xcrun simctl ui "$u" appearance "$1" || die "外観の切替に失敗しました"
    print "appearance: $1"
    ;;

  locale)
    u=$(ensure_booted)
    case "$1" in
      ja) lang="ja"; loc="ja_JP" ;;
      en) lang="en"; loc="en_US" ;;
      *) die "usage: sim.sh locale <ja|en>" ;;
    esac
    xcrun simctl spawn "$u" defaults write -g AppleLanguages -array "$lang" || die "言語設定に失敗しました"
    xcrun simctl spawn "$u" defaults write -g AppleLocale -string "$loc"
    # 言語を切り替えるとSpringBoardが再起動し、起動済みのアプリが落ちる。
    # 落ちたまま次のテストへ進むと、無関係なテストがホーム画面で失敗する。
    sleep 3
    print "locale: $lang（SpringBoardが再起動するため、この後に必ず起動し直すこと）"
    ;;

  home)
    activate
    osascript -e 'tell application "System Events" to keystroke "h" using {command down, shift down}'
    print "home"
    ;;

  find|exists|count|waitfor|waitgone|dump|dumpall|texts|json|rect|geometry)
    activate
    u=$(need_ui)
    "$u" "$cmd" "$@"
    ;;

  *)
    sed -n '2,50p' "$0"
    exit 1
    ;;
esac
