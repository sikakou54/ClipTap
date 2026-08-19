#!/bin/zsh
#
# iOSシミュレータ操作ドライバ
#
#   sim.sh boot                        起動中のシミュレータを確認（無ければ最新のiPhoneを起動）
#   sim.sh install                     アプリをビルドしてインストール（npm run ios）
#   sim.sh launch                      アプリを起動し直す（クリーンな状態から開始）
#   sim.sh shot <name>                 スクリーンショットを保存し、パスを出力
#   sim.sh tap <x> <y> [holdMs]        デバイス座標(ポイント)をタップ
#   sim.sh drag <x1> <y1> <x2> <y2> [ms]  ドラッグ（スクロール・プルリフレッシュ用）
#   sim.sh type <text>                 フォーカス中の入力欄へ文字入力
#   sim.sh clipboard                   クリップボードの内容を出力
#   sim.sh logs [minutes]              アプリのエラーログを出力
#   sim.sh geometry                    デバイス画面の位置・サイズ（デバッグ用）
#
# 座標はスクリーンショットのピクセル値ではなく「デバイスのポイント座標」で指定する。
# 変換: point = screenshot_pixel / scale（iPhoneは通常3、`sim.sh geometry`が実測値を表示）
#
# 前提: システム設定 > プライバシーとセキュリティ > アクセシビリティ で
#       このセッションの親アプリ（VS Code / ターミナル）が許可されていること。

set -o pipefail

SKILL_DIR="${0:A:h:h}"
SCRIPTS="$SKILL_DIR/scripts"
OUT_DIR="${RELEASE_CHECK_OUT:-$SKILL_DIR/.out}"
mkdir -p "$OUT_DIR"

# nvm/homebrew配下のツールをPATHへ（Claude Codeの既定PATHには含まれない）
for d in "$HOME/.nvm/versions/node"/*/bin /opt/homebrew/bin /usr/local/bin; do
  [[ -d "$d" ]] && PATH="$d:$PATH"
done
export PATH
export LANG="${LANG:-en_US.UTF-8}"

REPO_ROOT="${0:A:h:h:h:h:h}"
BUNDLE_ID=$(grep -m1 '"bundleIdentifier"' "$REPO_ROOT/apps/mobile/app.json" | sed 's/.*: *"\(.*\)".*/\1/')
: "${BUNDLE_ID:=com.sikakou.cliptap}"

die() { print -u2 "ERROR: $*"; exit 1; }

booted_udid() {
  xcrun simctl list devices booted -j 2>/dev/null \
    | grep -o '"udid" : "[^"]*"' | head -1 | sed 's/.*: "\(.*\)"/\1/'
}

ensure_booted() {
  local u=$(booted_udid)
  if [[ -z "$u" ]]; then
    u=$(xcrun simctl list devices available -j 2>/dev/null \
        | grep -B2 -o '"udid" : "[^"]*"' | head -1 | sed 's/.*: "\(.*\)"/\1/')
    [[ -z "$u" ]] && die "利用可能なシミュレータが見つかりません"
    xcrun simctl boot "$u" 2>/dev/null
    open -a Simulator
    sleep 8
    u=$(booted_udid)
  fi
  [[ -z "$u" ]] && die "シミュレータを起動できませんでした"
  print "$u"
}

ensure_gesture_bin() {
  local bin="$SCRIPTS/.gesture"
  if [[ ! -x "$bin" || "$SCRIPTS/gesture.swift" -nt "$bin" ]]; then
    swiftc -O -o "$bin" "$SCRIPTS/gesture.swift" >/dev/null 2>&1 \
      || die "gesture.swift のビルドに失敗しました（Xcodeのコマンドラインツールが必要）"
  fi
  print "$bin"
}

# デバイス画面の矩形をアクセシビリティAPIから取得する。
# Simulatorウィンドウは可変倍率・可変位置のため、毎回実測する必要がある。
device_rect() {
  local geo
  geo=$(osascript <<'EOF' 2>&1
tell application "Simulator" to activate
delay 0.3
tell application "System Events" to tell process "Simulator" to tell window 1
  repeat with e in UI elements
    try
      if (subrole of e as text) is "iOSContentGroup" then
        set p to position of e
        set s to size of e
        return ((item 1 of p) as integer as text) & " " & ((item 2 of p) as integer as text) & " " & ((item 1 of s) as integer as text) & " " & ((item 2 of s) as integer as text)
      end if
    end try
  end repeat
end tell
return "NOTFOUND"
EOF
)
  if [[ "$geo" == *"1719"* || "$geo" == *"補助アクセス"* || "$geo" == *"assistive"* ]]; then
    die "アクセシビリティ権限がありません。システム設定 > プライバシーとセキュリティ > アクセシビリティ で、このセッションの親アプリ（Visual Studio Code など）を許可してください。"
  fi
  [[ "$geo" == "NOTFOUND" || -z "$geo" ]] && die "シミュレータのデバイス画面を特定できません（Simulatorが起動しているか確認してください）"
  print "$geo"
}

# デバイスの論理解像度（ポイント）をスクリーンショットの実ピクセルとスケールから求める
device_points() {
  local udid=$1 tmp="$OUT_DIR/.probe.png"
  xcrun simctl io "$udid" screenshot --type=png "$tmp" >/dev/null 2>&1 || die "スクリーンショットを取得できません"
  local px=$(sips -g pixelWidth "$tmp" 2>/dev/null | tail -1 | awk '{print $2}')
  local py=$(sips -g pixelHeight "$tmp" 2>/dev/null | tail -1 | awk '{print $2}')
  # スケールはデバイス画面の表示幅と実ピクセルから推定せず、一般的な3倍/2倍を判定する
  local scale=3
  (( px <= 828 )) && scale=2
  print "$((px / scale)) $((py / scale)) $scale"
}

to_screen() { # <ptX> <ptY> -> 画面座標
  local rect=$(device_rect) pts=$(device_points "$(booted_udid)")
  local ox oy ow oh dw dh sc
  read ox oy ow oh <<< "$rect"
  read dw dh sc <<< "$pts"
  print "$ox $oy $ow $oh $dw $dh $1 $2" | awk '{printf "%d %d", $1+($7*$3/$5), $2+($8*$4/$6)}'
}

cmd=$1; shift 2>/dev/null

case "$cmd" in
  boot)
    u=$(ensure_booted); print "booted: $u"
    ;;

  install)
    (cd "$REPO_ROOT" && npm run ios) || die "npm run ios に失敗しました"
    ;;

  launch)
    u=$(ensure_booted)
    xcrun simctl terminate "$u" "$BUNDLE_ID" >/dev/null 2>&1
    sleep 1
    xcrun simctl launch "$u" "$BUNDLE_ID" >/dev/null || die "アプリを起動できません（先に sim.sh install を実行してください）"
    sleep "${LAUNCH_WAIT:-12}"
    print "launched: $BUNDLE_ID"
    ;;

  shot)
    [[ -z "$1" ]] && die "usage: sim.sh shot <name>"
    u=$(ensure_booted)
    p="$OUT_DIR/$1.png"
    xcrun simctl io "$u" screenshot --type=png "$p" >/dev/null 2>&1 || die "スクリーンショット失敗"
    print "$p"
    ;;

  tap)
    [[ -z "$2" ]] && die "usage: sim.sh tap <x> <y> [holdMs]"
    bin=$(ensure_gesture_bin)
    read sx sy <<< "$(to_screen "$1" "$2")"
    "$bin" tap "$sx" "$sy" "${3:-60}"
    ;;

  drag)
    [[ -z "$4" ]] && die "usage: sim.sh drag <x1> <y1> <x2> <y2> [ms]"
    bin=$(ensure_gesture_bin)
    read sx sy <<< "$(to_screen "$1" "$2")"
    read ex ey <<< "$(to_screen "$3" "$4")"
    "$bin" drag "$sx" "$sy" "$ex" "$ey" "${5:-400}"
    ;;

  type)
    [[ -z "$1" ]] && die "usage: sim.sh type <text>"
    osascript -e "tell application \"Simulator\" to activate" \
              -e "delay 0.3" \
              -e "tell application \"System Events\" to keystroke \"$1\"" \
      || die "文字入力に失敗しました"
    print "typed: $1"
    ;;

  clipboard)
    u=$(ensure_booted)
    xcrun simctl pbpaste "$u" 2>/dev/null
    ;;

  logs)
    u=$(ensure_booted)
    xcrun simctl spawn "$u" log show \
      --predicate "processImagePath CONTAINS \"ClipTap\"" \
      --last "${1:-5}m" --style compact 2>/dev/null \
      | grep -iE "RedBox|Invariant Violation|Unhandled|JavaScript error|ReferenceError|TypeError|Cannot read" \
      || print "(JSレベルのエラーは検出されませんでした)"
    ;;

  geometry)
    rect=$(device_rect); pts=$(device_points "$(booted_udid)")
    read ox oy ow oh <<< "$rect"; read dw dh sc <<< "$pts"
    print "device screen on macOS: origin=($ox,$oy) size=${ow}x${oh}"
    print "device logical size: ${dw}x${dh} points (scale ${sc}x)"
    print "screenshot pixels: $((dw*sc))x$((dh*sc))"
    print "変換: point = screenshot_pixel / $sc"
    ;;

  *)
    sed -n '2,30p' "$0"
    exit 1
    ;;
esac
