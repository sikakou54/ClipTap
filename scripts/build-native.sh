#!/usr/bin/env bash
#
# ネイティブビルド検証スクリプト（ビルド → 端末へインストール）
#
# 【目的】
# iOS拡張キーボード（Swift）とAndroid IME（Kotlin/リソース）は
# `npm run type-check` の対象外のため、変更しても静的チェックでは壊れが検出できない。
# 実際にコンパイルして、ビルドが通ることを確認する。
#
# ビルドしただけでは端末の中身は古いままで、拡張キーボードを実際に触ると
# 前回のビルドが動いてしまう。「直したはずなのに直っていない」を防ぐため、
# ビルドの成果物を端末へ入れるところまでをこのスクリプトの責務とする。
#
# 【使い方】
#   ./scripts/build-native.sh                   # iOS + Android の両方
#   ./scripts/build-native.sh ios               # iOSのみ（シミュレータ）
#   ./scripts/build-native.sh ios --device      # iOSのみ（接続中の実機）
#   ./scripts/build-native.sh ios --simulator   # 既定と同じ。npm run build:native:ios:device -- --simulator で --device を打ち消す
#   ./scripts/build-native.sh android           # Androidのみ
#   ./scripts/build-native.sh ios --no-install  # ビルドだけ（端末を触らない）
#   ./scripts/build-native.sh ios --skip-build  # インストールだけ（前回の成果物を使う）
#
# 【環境変数】
#   IOS_SIMULATOR     使用するiOSシミュレータ名（既定: 起動中のもの、なければ利用可能な最初のiPhone）
#   IOS_DEVICE        --device で使う実機の名前またはUDID（既定: 直近に接続した実機）
#   DEVELOPMENT_TEAM  --device の署名チームID（既定: 開発用証明書から自動解決）
#   ANDROID_AVD       使用するAVD名（既定: `emulator -list-avds` の先頭）
#   METRO_PORT        adb reverse で転送するMetroのポート（既定: 8081）
#   REQUIRED_FREE_GB  ビルド前に必要な空き容量GB（既定: 10。CIランナーなど狭い環境で下げる）
#
# 【iOSのシミュレータと実機の違い】
# シミュレータはアドホック署名で足りるが、実機は開発者証明書とプロビジョニング
# プロファイルによる署名が要る。チームIDは project.pbxproj に書かず、
# ビルド時にコマンドラインから渡す（個人のチームIDをリポジトリに残さないため）。
# Androidに --device は不要で、adb が見ている端末（実機・エミュレータ）へそのまま入る。
#
# 【ビルド範囲】
# どちらのプラットフォームもアプリ本体ごとビルドする。
# - iOS: ClipTapスキームでビルドする。ClipTapKeyboardはターゲット依存として
#        一緒にビルドされ、ClipTap.app の PlugIns に .appex として埋め込まれる。
#        （ClipTapKeyboardスキームはXcodeがローカル生成するユーザースキームで、
#          リポジトリには含まれないため指定できない）
# - Android: 拡張キーボード（IME）はアプリ本体と同じappモジュールに含まれるため、
#            :app:assembleDebug がアプリ本体とIMEの両方を含むAPKを生成する。
#
# 【注意】
# `expo prebuild --clean` は実行しない。ios/ が再生成されると
# ClipTapKeyboardターゲットの手動設定が失われるため（CLAUDE.md参照）。

set -euo pipefail

# リポジトリルート（このスクリプトの1つ上の階層）
readonly REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
readonly IOS_DIR="${REPO_ROOT}/apps/mobile/ios"
readonly ANDROID_DIR="${REPO_ROOT}/apps/mobile/android"
readonly ANDROID_APK="${ANDROID_DIR}/app/build/outputs/apk/debug/app-debug.apk"

# ログの出力先（失敗時に詳細を追える）
readonly LOG_DIR="${REPO_ROOT}/.build-logs"

# アプリ識別子（apps/mobile/app.json と一致させること）
readonly IOS_BUNDLE_ID="com.sikakou.cliptap"

# アプリと拡張キーボードが共有SQLiteを開くためのApp Group
# （ios/ClipTap/ClipTap.entitlements と一致させること）
readonly IOS_APP_GROUP="group.com.sikakou.cliptap"

# 解決した実機のUDIDの受け渡し先
# verify.sh がインストール後の起動コマンドを案内するために読む。
# 端末の解決はこのスクリプトの責務なので、あちらでは解決し直さない。
# パスは verify.sh の同名定数と一致させること。片方だけ変えてもエラーにならず、
# あちらの起動案内が <端末のUDID> のままになるだけで静かに壊れる。
readonly IOS_DEVICE_UDID_FILE="${LOG_DIR}/ios-device-udid.txt"

# devicectl の端末一覧の出力先（JSON出力はファイル経由しか用意されていない）
readonly DEVICECTL_DEVICES_JSON="${LOG_DIR}/devicectl-devices.json"

readonly ANDROID_SDK="${ANDROID_HOME:-${ANDROID_SDK_ROOT:-${HOME}/Library/Android/sdk}}"
readonly ADB="${ANDROID_SDK}/platform-tools/adb"
readonly EMULATOR="${ANDROID_SDK}/emulator/emulator"

readonly METRO_PORT="${METRO_PORT:-8081}"

# 対象（省略時は全部）
TARGET="all"
DO_BUILD=1
DO_INSTALL=1

# iOSの導入先（simulator / device）
IOS_TARGET="simulator"

# 起動したiOSシミュレータのUDID
IOS_SIM_UDID=""

# --device で解決する実機の情報と署名チーム
IOS_DEVICE_UDID=""
IOS_DEVICE_NAME=""
IOS_TEAM_ID=""

# xcodebuild に渡す -destination（実機のときだけ使う）
IOS_DESTINATION=""

while [ $# -gt 0 ]; do
  case "$1" in
    ios|android|all) TARGET="$1" ;;
    --skip-build)    DO_BUILD=0 ;;
    --no-install)    DO_INSTALL=0 ;;
    --device)        IOS_TARGET="device" ;;
    # 既定値と同じだが削除しないこと
    # package.json の build:native:ios:device は --device を焼き込んでいる。
    # npm は -- 以降を末尾に足すだけなので、`-- --simulator` で後勝ちに打ち消すのが唯一の手段になる。
    --simulator)     IOS_TARGET="simulator" ;;
    -h|--help)
      # 先頭のコメントブロックをそのまま使い方として出す
      # （行番号で切り出すとヘッダーを直したときに黙ってずれるため）
      awk 'NR == 1 { next } /^#/ { sub(/^# ?/, ""); print; next } { exit }' "${BASH_SOURCE[0]}"
      exit 0
      ;;
    *)
      printf '不明な引数: %s\n' "$1" >&2
      printf '使い方: %s [all|ios|android] [--device] [--simulator] [--skip-build] [--no-install]\n' "$0" >&2
      exit 2
      ;;
  esac
  shift
done

# ここは print_ng ではなく生の printf を使う
# 表示ヘルパーの定義はこの下にあり、この判定はそれより前に走る。
# print_ng に置き換えると command not found となり、set -e で終了コードが 2 ではなく 127 になる。
# （verify.sh は逆にヘルパーを引数解析より前で定義しているため print_ng を使える）
if [ "${IOS_TARGET}" = "device" ] && [ "${TARGET}" = "android" ]; then
  printf '\033[31m--device はiOS向けの指定です。Androidは adb が見ている端末へそのまま入ります\033[0m\n' >&2
  exit 2
fi

mkdir -p "${LOG_DIR}"

# 見出しを表示する
# $1: 見出し文字列
print_header() {
  printf '\n\033[1m==> %s\033[0m\n' "$1"
}

# 成功を表示する
# $1: 内容
print_ok() {
  printf '\033[32m✅ %s\033[0m\n' "$1"
}

# 警告を表示する（処理は続行する）
# $1: 内容
print_warn() {
  printf '\033[33m⚠️  %s\033[0m\n' "$1" >&2
}

# 失敗を表示する
# $1: 内容
print_ng() {
  printf '\033[31m❌ %s\033[0m\n' "$1" >&2
}

# 空き容量を確かめる
#
# ネイティブビルドは iOS の DerivedData だけで10GB近くまで育ち、
# Androidのビルド生成物も加わる。
# 途中で空き容量が尽きるとビルドの失敗としてではなく、
# ログの書き込み失敗など分かりにくい形で現れるため、始める前に見る。
#
# CIランナーのように空き容量がローカルより小さい環境では、この閾値だけが理由で
# ビルドに入れなくなるため、環境変数で下げられるようにしてある。
readonly REQUIRED_FREE_GB="${REQUIRED_FREE_GB:-10}"

check_free_space() {
  local free_gb
  free_gb="$(df -g "${REPO_ROOT}" | awk 'NR==2 {print $4}')"

  if [ "${free_gb}" -ge "${REQUIRED_FREE_GB}" ]; then
    return 0
  fi

  # print_ng を使わないのは、絵文字を付けず復旧手順を続けて出す書式のため
  printf '\033[31m空き容量が %sGB しかありません（%sGB以上を推奨）\033[0m\n' \
    "${free_gb}" "${REQUIRED_FREE_GB}" >&2
  printf '次はいずれも再生成できます:\n' >&2
  printf '  rm -rf ~/Library/Developer/Xcode/DerivedData\n' >&2
  printf '  rm -rf %s/apps/mobile/android/app/build\n' "${REPO_ROOT}" >&2
  printf '  rm -rf ~/.gradle/caches\n' >&2
  return 1
}

# 導入先に対応するSDK名を返す
ios_sdk() {
  if [ "${IOS_TARGET}" = "device" ]; then
    printf 'iphoneos'
  else
    printf 'iphonesimulator'
  fi
}

# ビルド成果物の出力先（BUILT_PRODUCTS_DIR）を返す
#
# 実機とシミュレータで出力先が分かれる（Debug-iphoneos / Debug-iphonesimulator）ため、
# パスを組み立てず必ずxcodebuildに聞く。
#
# $1: xcodebuildのscheme名
ios_built_products_dir() {
  xcodebuild \
    -workspace "${IOS_DIR}/ClipTap.xcworkspace" \
    -scheme "$1" \
    -sdk "$(ios_sdk)" \
    -configuration Debug \
    -showBuildSettings 2>/dev/null \
    | grep -m1 -E '^[[:space:]]+BUILT_PRODUCTS_DIR = ' | sed 's/.*= //'
}

# 拡張キーボードがアプリへ埋め込まれたかを確かめる
#
# ClipTapKeyboardターゲットがプロジェクトから失われても、ClipTap.appのビルド自体は
# 成功してしまう。過去に `expo prebuild --clean` でターゲットが消えたとき、
# ビルドが緑のまま実行時にだけキーボードが選べなくなり、発見が遅れた。
# 成果物を直接見て、静かに壊れる経路を塞ぐ。
#
# $1: xcodebuildのscheme名（ログ出力用）
verify_appex_embedded() {
  local scheme="$1"
  local products_dir appex_path

  products_dir="$(ios_built_products_dir "${scheme}")"
  appex_path="${products_dir}/ClipTap.app/PlugIns/ClipTapKeyboard.appex"

  if [ -d "${appex_path}" ]; then
    return 0
  fi

  print_ng "拡張キーボードが埋め込まれていません: ${appex_path}"
  printf 'ClipTapKeyboardターゲットがproject.pbxprojから失われていないか確認してください。\n' >&2
  return 1
}

# iOSをビルドする（ClipTap.app ＋ 埋め込みのClipTapKeyboard.appex）
# $1: xcodebuildのscheme名
build_ios() {
  local scheme="$1"
  local log_file="${LOG_DIR}/ios-${scheme}.log"

  if ! command -v xcodebuild >/dev/null 2>&1; then
    printf '\033[31mxcodebuild が見つかりません。iOSビルドはmacOS + Xcodeが必要です。\033[0m\n' >&2
    return 1
  fi

  # 署名は無効化しない。CODE_SIGNING_ALLOWED=NO にするとエンタイトルメントが
  # 埋め込まれず、App Group（group.com.sikakou.cliptap）が使えなくなる。
  # アプリと拡張キーボードは共有SQLiteをApp Group経由で読むため、
  # 署名を切るとDB初期化に失敗し、動作確認に使えないビルドになる。
  # シミュレータ向けはアドホック署名で足りるため、開発者アカウントは不要。
  local -a build_args=(
    -workspace "${IOS_DIR}/ClipTap.xcworkspace"
    -scheme "${scheme}"
    -configuration Debug
  )

  if [ "${IOS_TARGET}" = "device" ]; then
    # 実機は開発者証明書での署名が要る。プロファイルが未取得・端末未登録でも
    # -allowProvisioningUpdates があればXcodeが取得と登録まで行う。
    build_args+=(
      -destination "${IOS_DESTINATION}"
      -allowProvisioningUpdates
      "DEVELOPMENT_TEAM=${IOS_TEAM_ID}"
    )
    print_header "iOS: ${scheme} を実機向けにビルド中（ログ: ${log_file}）"
  else
    build_args+=(-sdk iphonesimulator)
    print_header "iOS: ${scheme} をビルド中（ログ: ${log_file}）"
  fi

  if xcodebuild "${build_args[@]}" build >"${log_file}" 2>&1; then
    verify_appex_embedded "${scheme}" || return 1
    print_ok "iOS (${scheme}) ビルド成功"
    return 0
  fi

  print_ng "iOS (${scheme}) ビルド失敗"
  # 自前コードのエラーを拾いやすいよう、error: 行だけ抜き出す
  grep -E 'error:|BUILD FAILED' "${log_file}" | head -40 >&2 || true
  printf '詳細: %s\n' "${log_file}" >&2
  return 1
}

# Androidをビルドする
build_android() {
  local log_file="${LOG_DIR}/android-assembleDebug.log"

  print_header "Android: assembleDebug をビルド中（ログ: ${log_file}）"

  if (cd "${ANDROID_DIR}" && ./gradlew :app:assembleDebug --console=plain) >"${log_file}" 2>&1; then
    print_ok "Android ビルド成功"
    return 0
  fi

  print_ng "Android ビルド失敗"
  # Kotlinのエラーは "e: "、リソースのエラーは "error:" で出る
  grep -E '^e: |error:|FAILURE:' "${log_file}" | head -40 >&2 || true
  printf '詳細: %s\n' "${log_file}" >&2
  return 1
}

# --- iOSシミュレータへのインストール ---------------------------------------

# 使用するシミュレータのUDIDを解決する
# 優先順: 起動中 > IOS_SIMULATOR で指定した名前 > 利用可能な最初のiPhone
resolve_ios_udid() {
  local udid

  # 既に起動中ならそれを使う（利用者が開いている環境を尊重する）
  udid="$(xcrun simctl list devices booted 2>/dev/null \
    | grep -oE '[0-9A-Fa-f-]{36}' | head -1 || true)"
  if [ -n "${udid}" ]; then
    printf '%s' "${udid}"
    return 0
  fi

  if [ -n "${IOS_SIMULATOR:-}" ]; then
    udid="$(xcrun simctl list devices available 2>/dev/null \
      | grep -F "${IOS_SIMULATOR} (" | grep -oE '[0-9A-Fa-f-]{36}' | head -1 || true)"
    if [ -z "${udid}" ]; then
      print_ng "指定のシミュレータが見つかりません: ${IOS_SIMULATOR}"
      return 1
    fi
    printf '%s' "${udid}"
    return 0
  fi

  udid="$(xcrun simctl list devices available 2>/dev/null \
    | grep -E '^[[:space:]]+iPhone' | grep -oE '[0-9A-Fa-f-]{36}' | head -1 || true)"
  if [ -z "${udid}" ]; then
    print_ng "利用可能なiPhoneシミュレータがありません"
    return 1
  fi
  printf '%s' "${udid}"
}

# ビルド済みのClipTap.appのパスを解決する
resolve_ios_app_path() {
  local products_dir
  products_dir="$(ios_built_products_dir ClipTap)"

  if [ -z "${products_dir}" ] || [ ! -d "${products_dir}/ClipTap.app" ]; then
    print_ng "ClipTap.app が見つかりません（--no-install を外してビルドから実行してください）: ${products_dir}"
    return 1
  fi
  printf '%s' "${products_dir}/ClipTap.app"
}

# iOSシミュレータを起動し、アプリをインストールする
install_ios_simulator() {
  print_header "iOSシミュレータを起動中"

  IOS_SIM_UDID="$(resolve_ios_udid)" || return 1

  # 起動済みなら boot は失敗するため、失敗を許容して bootstatus で待つ
  xcrun simctl boot "${IOS_SIM_UDID}" 2>/dev/null || true
  open -a Simulator 2>/dev/null || true
  xcrun simctl bootstatus "${IOS_SIM_UDID}" -b >/dev/null 2>&1 || true
  print_ok "シミュレータ起動: ${IOS_SIM_UDID}"

  local app_path
  app_path="$(resolve_ios_app_path)" || return 1

  print_header "iOSアプリをインストール中"

  # 拡張キーボードはアプリ本体と別バンドルのため、上書きインストールだけでは
  # 古い .appex が残ることがある。一度消してから入れて、確実に入れ替える。
  xcrun simctl uninstall "${IOS_SIM_UDID}" "${IOS_BUNDLE_ID}" >/dev/null 2>&1 || true
  xcrun simctl install "${IOS_SIM_UDID}" "${app_path}"
  print_ok "インストール完了: $(basename "${app_path}")"

  # 入れ替わったのが本当に今回のビルドかを、端末側の成果物で確かめる
  local installed
  installed="$(xcrun simctl get_app_container "${IOS_SIM_UDID}" "${IOS_BUNDLE_ID}" 2>/dev/null || true)"
  if [ -n "${installed}" ] && [ -d "${installed}/PlugIns/ClipTapKeyboard.appex" ]; then
    print_ok "拡張キーボードを確認: $(stat -f '%Sm' "${installed}/PlugIns/ClipTapKeyboard.appex" 2>/dev/null)"
  else
    print_ng "端末に拡張キーボードが入っていません"
    return 1
  fi

  # App Groupが効いていないと共有SQLiteを開けず、拡張キーボードも動かない。
  # 署名を無効化したビルドを掴んでいないか、ここで気付けるようにする
  if xcrun simctl get_app_container "${IOS_SIM_UDID}" "${IOS_BUNDLE_ID}" groups >/dev/null 2>&1; then
    print_ok "App Group 有効（共有DBを利用できます）"
  else
    print_warn "App Group が無効です。共有DBを開けないため拡張キーボードが動きません"
  fi
}

# --- iOS実機へのインストール ------------------------------------------------

# 署名に使うDevelopment Team IDを解決する
#
# 実機ビルドはチームIDが決まらないと「requires a development team」で止まる。
# project.pbxproj には書かず、開発用証明書のOU（＝チームID）から求める。
# 複数チームに所属している場合は判断できないため、DEVELOPMENT_TEAM で指定してもらう。
resolve_team_id() {
  if [ -n "${DEVELOPMENT_TEAM:-}" ]; then
    printf '%s' "${DEVELOPMENT_TEAM}"
    return 0
  fi

  # 証明書のOU（Organizational Unit）がチームID。
  # find-identity が括弧内に出すのは証明書のIDでチームIDではないため、証明書本体から取る。
  local teams team_count
  teams="$(security find-identity -v -p codesigning 2>/dev/null \
    | sed -n 's/.*"\(Apple Development: .*\)".*/\1/p' \
    | while IFS= read -r common_name; do
        security find-certificate -c "${common_name}" -p 2>/dev/null \
          | openssl x509 -noout -subject 2>/dev/null \
          | sed -n 's/.*OU *= *\([A-Za-z0-9]*\).*/\1/p'
      done | sort -u)"
  team_count="$(printf '%s' "${teams}" | grep -c . || true)"

  case "${team_count}" in
    1)
      printf '%s' "${teams}"
      ;;
    0)
      print_ng "開発用証明書（Apple Development）が見つかりません"
      printf 'Xcode > Settings > Accounts でApple IDを追加してください。\n' >&2
      printf 'すでに追加済みなら DEVELOPMENT_TEAM=<チームID> を指定してください。\n' >&2
      return 1
      ;;
    *)
      print_ng "所属チームが複数あるため決められません"
      printf '%s\n' "${teams}" >&2
      printf 'DEVELOPMENT_TEAM=<チームID> を指定してください。\n' >&2
      return 1
      ;;
  esac
}

# devicectl のJSONから端末1台分の項目を取り出す
# $1: 端末の添字 / $2: キーのパス（例: hardwareProperties.udid）
device_field() {
  plutil -extract "result.devices.$1.$2" raw -o - "${DEVICECTL_DEVICES_JSON}" 2>/dev/null || true
}

# 接続中の実機を解決して IOS_DEVICE_UDID / IOS_DEVICE_NAME に入れる
#
# devicectl はペアリング済みの端末をすべて挙げるため、iOSの実機だけに絞る。
# 複数ある場合は直近に接続したものを選ぶ（IOS_DEVICE で明示指定できる）。
resolve_ios_device() {
  if ! xcrun devicectl list devices --quiet \
    --json-output "${DEVICECTL_DEVICES_JSON}" >/dev/null 2>&1; then
    print_ng "devicectl で端末一覧を取得できません（Xcodeのインストールを確認してください）"
    return 1
  fi

  local index=0
  local udid name connected_at
  local best_udid="" best_name="" best_at=""
  local listing=""

  while udid="$(device_field "${index}" hardwareProperties.udid)" && [ -n "${udid}" ]; do
    # ペアリング済みのMacやApple Watch、シミュレータを除く
    if [ "$(device_field "${index}" hardwareProperties.platform)" = "iOS" ] \
      && [ "$(device_field "${index}" hardwareProperties.reality)" = "physical" ]; then
      name="$(device_field "${index}" deviceProperties.name)"
      connected_at="$(device_field "${index}" connectionProperties.lastConnectionDate)"
      listing="${listing}  ${name} (${udid})"$'\n'

      # 名前でもUDIDでも指定できるようにする
      if [ -z "${IOS_DEVICE:-}" ] || [ "${IOS_DEVICE}" = "${name}" ] || [ "${IOS_DEVICE}" = "${udid}" ]; then
        # ISO8601は文字列のまま比べても新しい方が大きい
        if [ -z "${best_at}" ] || [[ "${connected_at}" > "${best_at}" ]]; then
          best_udid="${udid}"
          best_name="${name}"
          best_at="${connected_at}"
        fi
      fi
    fi

    index=$((index + 1))
  done

  if [ -z "${best_udid}" ]; then
    if [ -n "${IOS_DEVICE:-}" ]; then
      print_ng "指定の実機が見つかりません: ${IOS_DEVICE}"
    else
      print_ng "iOSの実機が見つかりません"
    fi
    if [ -n "${listing}" ]; then
      printf 'ペアリング済みの実機:\n%s' "${listing}" >&2
    else
      printf 'Macに接続し、端末側で「このコンピュータを信頼」を選んでください。\n' >&2
    fi
    return 1
  fi

  # 一覧に出ていても電源断・未接続なら通信できない。長いビルドの前に確かめる
  if ! xcrun devicectl device info details --device "${best_udid}" --quiet >/dev/null 2>&1; then
    print_ng "実機と通信できません: ${best_name} (${best_udid})"
    printf 'ケーブル接続・画面ロック解除・デベロッパモード有効を確認してください。\n' >&2
    return 1
  fi

  IOS_DEVICE_UDID="${best_udid}"
  IOS_DEVICE_NAME="${best_name}"
  return 0
}

# 実機ビルドに必要な署名情報と端末を先に揃える
#
# xcodebuild の -destination で端末を指すため、ビルド前に解決しておく。
# 10分近いビルドが終わってから端末がないと分かる、を避ける狙いもある。
prepare_ios_device() {
  print_header "実機の準備"

  IOS_TEAM_ID="$(resolve_team_id)" || return 1
  print_ok "署名チーム: ${IOS_TEAM_ID}"

  if resolve_ios_device; then
    IOS_DESTINATION="id=${IOS_DEVICE_UDID}"
    printf '%s' "${IOS_DEVICE_UDID}" >"${IOS_DEVICE_UDID_FILE}"
    print_ok "実機: ${IOS_DEVICE_NAME} (${IOS_DEVICE_UDID})"
    return 0
  fi

  # インストールしないなら端末は無くてよい。署名まで通ることだけ確かめる
  if [ "${DO_INSTALL}" -eq 0 ]; then
    print_warn "端末なしで実機向けビルドだけ行います"
    IOS_DESTINATION="generic/platform=iOS"
    rm -f "${IOS_DEVICE_UDID_FILE}"
    return 0
  fi

  return 1
}

# App Groupのエンタイトルメントが署名に含まれているかを確かめる
#
# 実機ではプロファイルにApp Groupが無いとエンタイトルメントが落ちる。
# アプリは起動できてしまい、共有SQLiteを開くところで初めて壊れるため、
# 端末へ入れる前に成果物の署名を直接見る。
#
# $1: ClipTap.app のパス
verify_ios_entitlements() {
  local app_path="$1"
  local target

  for target in "${app_path}" "${app_path}/PlugIns/ClipTapKeyboard.appex"; do
    if ! codesign -d --entitlements - "${target}" 2>&1 | grep -q "${IOS_APP_GROUP}"; then
      print_ng "App Group（${IOS_APP_GROUP}）が署名に含まれていません: $(basename "${target}")"
      printf 'プロビジョニングプロファイルにApp Groupが含まれているか確認してください。\n' >&2
      return 1
    fi
  done

  print_ok "App Group 有効（共有DBを利用できます）"
}

# 実機へアプリをインストールする
install_ios_device() {
  local app_path
  app_path="$(resolve_ios_app_path)" || return 1

  print_header "署名を確認中"
  verify_ios_entitlements "${app_path}" || return 1

  print_header "実機へインストール中（${IOS_DEVICE_NAME}）"

  # 実機ではアンインストールしない。アプリを消すと「設定 > 一般 > キーボード」の
  # 登録も外れ、毎回キーボードを追加し直すことになるため。
  # 実機のインストールはバンドルごと置き換わるので、古い .appex は残らない。
  if ! xcrun devicectl device install app --device "${IOS_DEVICE_UDID}" "${app_path}" \
    >"${LOG_DIR}/devicectl-install.log" 2>&1; then
    print_ng "実機へのインストールに失敗しました"
    tail -20 "${LOG_DIR}/devicectl-install.log" >&2
    return 1
  fi
  print_ok "インストール完了: $(basename "${app_path}")"

  # 端末側から見えているかを確かめる。署名は通ってもインストールが
  # 途中で失われることがあるため、入った事実を端末に聞いて確定させる
  if xcrun devicectl device info apps --device "${IOS_DEVICE_UDID}" --quiet \
    --json-output "${LOG_DIR}/devicectl-apps.json" >/dev/null 2>&1 \
    && grep -q "\"${IOS_BUNDLE_ID}\"" "${LOG_DIR}/devicectl-apps.json"; then
    print_ok "端末上のアプリを確認: ${IOS_BUNDLE_ID}"
  else
    print_warn "端末上のアプリ一覧を確認できませんでした"
  fi
}

# iOSの導入先に応じてインストールする
install_ios() {
  if [ "${IOS_TARGET}" = "device" ]; then
    install_ios_device
  else
    install_ios_simulator
  fi
}

# --- Androidエミュレータへのインストール ------------------------------------

# Androidエミュレータを起動し、APKをインストールする
install_android() {
  print_header "Androidエミュレータを起動中"

  if [ ! -x "${ADB}" ]; then
    print_ng "adb が見つかりません: ${ADB}"
    return 1
  fi

  # 既に接続済みの端末があればそれを使う
  local devices
  devices="$("${ADB}" devices | awk 'NR>1 && $2=="device" {print $1}' || true)"

  if [ -z "${devices}" ]; then
    if [ ! -x "${EMULATOR}" ]; then
      print_ng "emulator が見つかりません: ${EMULATOR}"
      return 1
    fi

    local avd="${ANDROID_AVD:-$("${EMULATOR}" -list-avds 2>/dev/null | head -1)}"
    if [ -z "${avd}" ]; then
      print_ng "AVDが1つもありません。Android Studioで作成してください"
      return 1
    fi

    printf 'AVD「%s」を起動します（初回は時間がかかります）\n' "${avd}"
    "${EMULATOR}" -avd "${avd}" >"${LOG_DIR}/emulator.log" 2>&1 &
    local emulator_pid=$!

    # エミュレータはディスク容量不足などで即死することがある。
    # adb wait-for-device は端末が現れるまで無限に待つため使わず、
    # プロセスの生死とタイムアウトを見ながら自前で待つ
    local waited=0
    until [ "$("${ADB}" shell getprop sys.boot_completed 2>/dev/null | tr -d '\r')" = "1" ]; do
      if ! kill -0 "${emulator_pid}" 2>/dev/null; then
        print_ng "エミュレータが起動できませんでした"
        grep -E 'FATAL|ERROR' "${LOG_DIR}/emulator.log" | tail -5 >&2 || true
        printf '詳細: %s\n' "${LOG_DIR}/emulator.log" >&2
        return 1
      fi
      if [ "${waited}" -ge 300 ]; then
        print_ng "エミュレータの起動待ちがタイムアウトしました（${waited}秒）"
        printf '詳細: %s\n' "${LOG_DIR}/emulator.log" >&2
        return 1
      fi
      sleep 3
      waited=$((waited + 3))
    done
  fi

  print_ok "エミュレータ準備完了"

  if [ ! -f "${ANDROID_APK}" ]; then
    print_ng "APKが見つかりません（--no-install を外してビルドから実行してください）: ${ANDROID_APK}"
    return 1
  fi

  print_header "Androidアプリをインストール中（APKが大きいため時間がかかります）"
  "${ADB}" install -r "${ANDROID_APK}" >"${LOG_DIR}/adb-install.log" 2>&1 \
    || { print_ng "APKのインストールに失敗しました"; tail -20 "${LOG_DIR}/adb-install.log" >&2; return 1; }
  print_ok "インストール完了: $(basename "${ANDROID_APK}")"

  # IMEが端末から見えているかを確かめる。AndroidManifestへの注入漏れや
  # リソース欠落があると、ビルドは通っても入力方式の一覧に出てこない
  if "${ADB}" shell ime list -a -s 2>/dev/null | grep -q "com.sikakou.cliptap/.keyboard.ClipTapKeyboardService"; then
    print_ok "拡張キーボードを確認（入力方式として認識されています）"
  else
    print_warn "拡張キーボードが入力方式の一覧に出ません。AndroidManifestとres/xml/method.xmlを確認してください"
  fi

  # エミュレータ内のlocalhostをホストへ転送しておく（Metro接続用）
  "${ADB}" reverse "tcp:${METRO_PORT}" "tcp:${METRO_PORT}" >/dev/null 2>&1 \
    && print_ok "adb reverse 設定済み（localhost:${METRO_PORT}）" \
    || print_warn "adb reverse に失敗しました。Metro接続時は 10.0.2.2:${METRO_PORT} を指定してください"
}

# --- 実行 -------------------------------------------------------------------

[ "${DO_BUILD}" -eq 0 ] || check_free_space || exit 1

# ビルドとインストールをまとめて行う
# $1: ios | android
run_platform() {
  case "$1" in
    ios)
      if [ "${IOS_TARGET}" = "device" ]; then
        prepare_ios_device || return 1
      fi
      [ "${DO_BUILD}" -eq 0 ] || build_ios ClipTap || return 1
      [ "${DO_INSTALL}" -eq 1 ] || return 0
      install_ios
      ;;
    android)
      [ "${DO_BUILD}" -eq 0 ] || build_android || return 1
      [ "${DO_INSTALL}" -eq 1 ] || return 0
      install_android
      ;;
  esac
}

case "${TARGET}" in
  ios|android)
    run_platform "${TARGET}"
    ;;
  all)
    # 片方が落ちても両方の結果を出したいので、失敗を記録して最後に判定する
    failed=0
    run_platform ios || failed=1
    run_platform android || failed=1

    # 以下2つの集約メッセージは ✅ / ❌ を付けず、直前の出力と間を空けるため先頭に改行を入れる
    # （この書式のため print_ok / print_ng は使わない）
    if [ "${failed}" -ne 0 ]; then
      printf '\n\033[31mネイティブビルドに失敗があります。\033[0m\n' >&2
      exit 1
    fi
    printf '\n\033[32mすべてのネイティブビルドが成功しました。\033[0m\n'
    ;;
esac

if [ "${DO_BUILD}" -eq 0 ] && [ "${DO_INSTALL}" -eq 0 ]; then
  print_warn "--skip-build と --no-install の両方が指定されたため、何もしていません"
elif [ "${DO_INSTALL}" -eq 0 ]; then
  printf '\n'
  print_ok "ビルドが完了しました（--no-install のためインストールはしません）"
fi
