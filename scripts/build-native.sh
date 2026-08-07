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
#   ./scripts/build-native.sh                  # iOS + Android の両方
#   ./scripts/build-native.sh ios              # iOSのみ
#   ./scripts/build-native.sh android          # Androidのみ
#   ./scripts/build-native.sh ios --no-install # ビルドだけ（端末を触らない）
#   ./scripts/build-native.sh ios --skip-build  # インストールだけ（前回の成果物を使う）
#
# 【環境変数】
#   IOS_SIMULATOR   使用するiOSシミュレータ名（既定: 起動中のもの、なければ利用可能な最初のiPhone）
#   ANDROID_AVD     使用するAVD名（既定: `emulator -list-avds` の先頭）
#   METRO_PORT      adb reverse で転送するMetroのポート（既定: 8081）
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

readonly ANDROID_SDK="${ANDROID_HOME:-${ANDROID_SDK_ROOT:-${HOME}/Library/Android/sdk}}"
readonly ADB="${ANDROID_SDK}/platform-tools/adb"
readonly EMULATOR="${ANDROID_SDK}/emulator/emulator"

readonly METRO_PORT="${METRO_PORT:-8081}"

# 対象（省略時は全部）
TARGET="all"
DO_BUILD=1
DO_INSTALL=1

# 起動したiOSシミュレータのUDID（インストール後に案内で使う）
IOS_UDID=""

while [ $# -gt 0 ]; do
  case "$1" in
    ios|android|all) TARGET="$1" ;;
    --skip-build)    DO_BUILD=0 ;;
    --no-install)    DO_INSTALL=0 ;;
    -h|--help)
      sed -n '2,37p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'
      exit 0
      ;;
    *)
      printf '不明な引数: %s\n' "$1" >&2
      printf '使い方: %s [all|ios|android] [--skip-build] [--no-install]\n' "$0" >&2
      exit 2
      ;;
  esac
  shift
done

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
readonly REQUIRED_FREE_GB=10

check_free_space() {
  local free_gb
  free_gb="$(df -g "${REPO_ROOT}" | awk 'NR==2 {print $4}')"

  if [ "${free_gb}" -ge "${REQUIRED_FREE_GB}" ]; then
    return 0
  fi

  printf '\033[31m空き容量が %sGB しかありません（%sGB以上を推奨）\033[0m\n' \
    "${free_gb}" "${REQUIRED_FREE_GB}" >&2
  printf '次はいずれも再生成できます:\n' >&2
  printf '  rm -rf ~/Library/Developer/Xcode/DerivedData\n' >&2
  printf '  rm -rf %s/apps/mobile/android/app/build\n' "${REPO_ROOT}" >&2
  printf '  rm -rf ~/.gradle/caches\n' >&2
  return 1
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

  products_dir="$(xcodebuild \
    -workspace "${IOS_DIR}/ClipTap.xcworkspace" \
    -scheme "${scheme}" \
    -sdk iphonesimulator \
    -configuration Debug \
    -showBuildSettings 2>/dev/null \
    | grep -m1 -E '^[[:space:]]+BUILT_PRODUCTS_DIR = ' | sed 's/.*= //')"

  appex_path="${products_dir}/ClipTap.app/PlugIns/ClipTapKeyboard.appex"

  if [ -d "${appex_path}" ]; then
    return 0
  fi

  printf '\033[31m❌ 拡張キーボードが埋め込まれていません: %s\033[0m\n' "${appex_path}" >&2
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

  print_header "iOS: ${scheme} をビルド中（ログ: ${log_file}）"

  # 署名は無効化しない。CODE_SIGNING_ALLOWED=NO にするとエンタイトルメントが
  # 埋め込まれず、App Group（group.com.sikakou.cliptap）が使えなくなる。
  # アプリと拡張キーボードは共有SQLiteをApp Group経由で読むため、
  # 署名を切るとDB初期化に失敗し、動作確認に使えないビルドになる。
  # シミュレータ向けはアドホック署名で足りるため、開発者アカウントは不要。
  if xcodebuild \
    -workspace "${IOS_DIR}/ClipTap.xcworkspace" \
    -scheme "${scheme}" \
    -sdk iphonesimulator \
    -configuration Debug \
    build >"${log_file}" 2>&1; then
    verify_appex_embedded "${scheme}" || return 1
    printf '\033[32m✅ iOS (%s) ビルド成功\033[0m\n' "${scheme}"
    return 0
  fi

  printf '\033[31m❌ iOS (%s) ビルド失敗\033[0m\n' "${scheme}" >&2
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
    printf '\033[32m✅ Android ビルド成功\033[0m\n'
    return 0
  fi

  printf '\033[31m❌ Android ビルド失敗\033[0m\n' >&2
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
  products_dir="$(xcodebuild \
    -workspace "${IOS_DIR}/ClipTap.xcworkspace" \
    -scheme ClipTap \
    -sdk iphonesimulator \
    -configuration Debug \
    -showBuildSettings 2>/dev/null \
    | grep -m1 -E '^[[:space:]]+BUILT_PRODUCTS_DIR = ' | sed 's/.*= //')"

  if [ -z "${products_dir}" ] || [ ! -d "${products_dir}/ClipTap.app" ]; then
    print_ng "ClipTap.app が見つかりません（--no-install を外してビルドから実行してください）"
    return 1
  fi
  printf '%s' "${products_dir}/ClipTap.app"
}

# iOSシミュレータを起動し、アプリをインストールする
install_ios() {
  print_header "iOSシミュレータを起動中"

  IOS_UDID="$(resolve_ios_udid)" || return 1

  # 起動済みなら boot は失敗するため、失敗を許容して bootstatus で待つ
  xcrun simctl boot "${IOS_UDID}" 2>/dev/null || true
  open -a Simulator 2>/dev/null || true
  xcrun simctl bootstatus "${IOS_UDID}" -b >/dev/null 2>&1 || true
  print_ok "シミュレータ起動: ${IOS_UDID}"

  local app_path
  app_path="$(resolve_ios_app_path)" || return 1

  print_header "iOSアプリをインストール中"

  # 拡張キーボードはアプリ本体と別バンドルのため、上書きインストールだけでは
  # 古い .appex が残ることがある。一度消してから入れて、確実に入れ替える。
  xcrun simctl uninstall "${IOS_UDID}" "${IOS_BUNDLE_ID}" >/dev/null 2>&1 || true
  xcrun simctl install "${IOS_UDID}" "${app_path}"
  print_ok "インストール完了: $(basename "${app_path}")"

  # 入れ替わったのが本当に今回のビルドかを、端末側の成果物で確かめる
  local installed
  installed="$(xcrun simctl get_app_container "${IOS_UDID}" "${IOS_BUNDLE_ID}" 2>/dev/null || true)"
  if [ -n "${installed}" ] && [ -d "${installed}/PlugIns/ClipTapKeyboard.appex" ]; then
    print_ok "拡張キーボードを確認: $(stat -f '%Sm' "${installed}/PlugIns/ClipTapKeyboard.appex" 2>/dev/null)"
  else
    print_ng "端末に拡張キーボードが入っていません"
    return 1
  fi

  # App Groupが効いていないと共有SQLiteを開けず、拡張キーボードも動かない。
  # 署名を無効化したビルドを掴んでいないか、ここで気付けるようにする
  if xcrun simctl get_app_container "${IOS_UDID}" "${IOS_BUNDLE_ID}" groups >/dev/null 2>&1; then
    print_ok "App Group 有効（共有DBを利用できます）"
  else
    print_warn "App Group が無効です。共有DBを開けないため拡張キーボードが動きません"
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
