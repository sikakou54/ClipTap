#!/usr/bin/env bash
#
# 検証スクリプト（静的チェック → ネイティブビルド → シミュレータへインストール）
#
# 【目的】
# コミット前の静的チェックから、シミュレータ/エミュレータにアプリを入れるまでを1コマンドで通す。
# 「型チェックは通ったが実機で壊れていた」を防ぐため、静的チェックと実際のビルドを地続きにする。
#
# 【expo start を含めない理由】
# Metro（expo start）は利用者が自分の端末で対話的に操作したいことが多いため、
# このスクリプトはアプリを入れるところまでで止める。起動手順は最後に案内する。
#
# 【iOSとAndroidを分ける理由】
# 片方の環境不備（エミュレータのディスク不足など）でもう片方の確認が止まらないようにするため、
# プラットフォームは必ず1つだけ指定する。同時実行はしない。
#
# 【実行する内容】
#   1. npm run type-check   型エラー0件を確認
#   2. npm test             回帰テスト
#   3. npm run lint         ESLint
#   4. npm run build:native 指定プラットフォームのネイティブビルド
#   5. シミュレータ/エミュレータを起動し、4で生成したアプリをインストール
#
# 【使い方】
#   ./scripts/verify.sh ios                    # iOS
#   ./scripts/verify.sh android                # Android
#   ./scripts/verify.sh ios --no-install       # 検証だけ（シミュレータを触らない）
#   ./scripts/verify.sh ios --skip-checks      # 1〜3を飛ばす
#   ./scripts/verify.sh android --skip-build   # 4を飛ばす（前回の生成物を使う）
#
# 【環境変数】
#   IOS_SIMULATOR   使用するiOSシミュレータ名（既定: 起動中のもの、なければ利用可能な最初のiPhone）
#   ANDROID_AVD     使用するAVD名（既定: `emulator -list-avds` の先頭）
#   METRO_PORT      案内に表示するMetroのポート（既定: 8081）
#
# 【注意】
# `expo prebuild --clean` は実行しない。ios/ が再生成されると
# ClipTapKeyboardターゲットの手動設定が失われるため（CLAUDE.md参照）。

set -euo pipefail

readonly REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
readonly LOG_DIR="${REPO_ROOT}/.build-logs"
readonly IOS_DIR="${REPO_ROOT}/apps/mobile/ios"
readonly ANDROID_APK="${REPO_ROOT}/apps/mobile/android/app/build/outputs/apk/debug/app-debug.apk"

# アプリ識別子（apps/mobile/app.json と一致させること）
readonly APP_SCHEME="cliptap"
readonly IOS_BUNDLE_ID="com.sikakou.cliptap"
readonly ANDROID_PACKAGE="com.sikakou.cliptap"

readonly ANDROID_SDK="${ANDROID_HOME:-${ANDROID_SDK_ROOT:-${HOME}/Library/Android/sdk}}"
readonly ADB="${ANDROID_SDK}/platform-tools/adb"
readonly EMULATOR="${ANDROID_SDK}/emulator/emulator"

readonly METRO_PORT="${METRO_PORT:-8081}"

# 対象プラットフォーム（ios / android）。引数で必ず指定する
PLATFORM=""
DO_CHECKS=1
DO_BUILD=1
DO_INSTALL=1

mkdir -p "${LOG_DIR}"

# --- 表示ヘルパー ---------------------------------------------------------

# 見出しを表示する
# $1: 見出し文字列
print_step() {
  printf '\n\033[1;36m==> %s\033[0m\n' "$1"
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

# 使い方を表示する
print_usage() {
  printf '使い方: %s <ios|android> [--skip-checks] [--skip-build] [--no-install]\n' "$0" >&2
}

# --- 引数解析 -------------------------------------------------------------

while [ $# -gt 0 ]; do
  case "$1" in
    ios|android)
      if [ -n "${PLATFORM}" ]; then
        print_ng "プラットフォームは1つだけ指定してください（iOSとAndroidは分けて実行します）"
        exit 2
      fi
      PLATFORM="$1"
      ;;
    --skip-checks)  DO_CHECKS=0 ;;
    --skip-build)   DO_BUILD=0 ;;
    --no-install)   DO_INSTALL=0 ;;
    -h|--help)
      sed -n '2,39p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'
      exit 0
      ;;
    *)
      print_ng "不明なオプション: $1"
      print_usage
      exit 2
      ;;
  esac
  shift
done

if [ -z "${PLATFORM}" ]; then
  print_ng "プラットフォームを指定してください（ios または android）"
  print_usage
  exit 2
fi

# --- 1〜3: 静的チェック ---------------------------------------------------

# type-check / test / lint を順に実行する
run_checks() {
  print_step "型チェック（npm run type-check）"
  npm run --silent type-check >"${LOG_DIR}/type-check.log" 2>&1 \
    || { print_ng "型チェック失敗"; tail -30 "${LOG_DIR}/type-check.log" >&2; return 1; }
  print_ok "型エラー0件"

  print_step "テスト（npm test）"
  npm test --silent >"${LOG_DIR}/test.log" 2>&1 \
    || { print_ng "テスト失敗"; tail -40 "${LOG_DIR}/test.log" >&2; return 1; }
  # vitestの出力には色コードが混ざるため、除去してから件数を拾う
  local test_summary
  test_summary="$(LC_ALL=C sed $'s/\033\\[[0-9;]*m//g' "${LOG_DIR}/test.log" \
    | grep -oE 'Tests +[0-9]+ passed' | tail -1 || true)"
  print_ok "${test_summary:-テスト成功}"

  print_step "Lint（npm run lint）"
  npm run --silent lint >"${LOG_DIR}/lint.log" 2>&1 \
    || { print_ng "Lint失敗"; tail -40 "${LOG_DIR}/lint.log" >&2; return 1; }
  print_ok "Lintエラー0件"
}

# --- 4: ネイティブビルド --------------------------------------------------

# 指定プラットフォームのネイティブをビルドする（実体は build-native.sh）
run_native_build() {
  print_step "ネイティブビルド（${PLATFORM}）"
  "${REPO_ROOT}/scripts/build-native.sh" "${PLATFORM}"
}

# --- 5: iOSシミュレータ ---------------------------------------------------

IOS_UDID=""

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
    | grep -E '^\s+iPhone' | grep -oE '[0-9A-Fa-f-]{36}' | head -1 || true)"
  if [ -z "${udid}" ]; then
    print_ng "利用可能なiPhoneシミュレータがありません"
    return 1
  fi
  printf '%s' "${udid}"
}

# ビルド済みのClipTap.appのパスを解決する
resolve_ios_app_path() {
  local products_dir
  products_dir="$(cd "${IOS_DIR}" && xcodebuild \
    -workspace ClipTap.xcworkspace \
    -scheme ClipTap \
    -sdk iphonesimulator \
    -configuration Debug \
    -showBuildSettings 2>/dev/null \
    | grep -m1 -E '^\s+BUILT_PRODUCTS_DIR = ' | sed 's/.*= //')"

  if [ -z "${products_dir}" ] || [ ! -d "${products_dir}/ClipTap.app" ]; then
    print_ng "ClipTap.app が見つかりません（先に npm run build:native:ios を実行してください）"
    return 1
  fi
  printf '%s' "${products_dir}/ClipTap.app"
}

# iOSシミュレータを起動し、アプリをインストールする
setup_ios() {
  print_step "iOSシミュレータを起動中"

  IOS_UDID="$(resolve_ios_udid)" || return 1

  # 起動済みなら boot は失敗するため、失敗を許容して bootstatus で待つ
  xcrun simctl boot "${IOS_UDID}" 2>/dev/null || true
  open -a Simulator 2>/dev/null || true
  xcrun simctl bootstatus "${IOS_UDID}" -b >/dev/null 2>&1 || true
  print_ok "シミュレータ起動: ${IOS_UDID}"

  local app_path
  app_path="$(resolve_ios_app_path)" || return 1

  print_step "iOSアプリをインストール中"
  xcrun simctl install "${IOS_UDID}" "${app_path}"
  print_ok "インストール完了: $(basename "${app_path}")"

  # App Groupが効いていないと共有SQLiteを開けず、拡張キーボードも動かない。
  # 署名を無効化したビルドを掴んでいないか、ここで気付けるようにする
  if xcrun simctl get_app_container "${IOS_UDID}" "${IOS_BUNDLE_ID}" groups >/dev/null 2>&1; then
    print_ok "App Group 有効（共有DBを利用できます）"
  else
    print_warn "App Group が無効です。共有DBを開けないため拡張キーボードが動きません"
  fi
}

# --- 5: Androidエミュレータ -----------------------------------------------

# Androidエミュレータを起動し、APKをインストールする
setup_android() {
  print_step "Androidエミュレータを起動中"

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
    print_ng "APKが見つかりません（先に npm run build:native:android を実行してください）: ${ANDROID_APK}"
    return 1
  fi

  print_step "Androidアプリをインストール中（APKが大きいため時間がかかります）"
  "${ADB}" install -r "${ANDROID_APK}" >"${LOG_DIR}/adb-install.log" 2>&1 \
    || { print_ng "APKのインストールに失敗しました"; tail -20 "${LOG_DIR}/adb-install.log" >&2; return 1; }
  print_ok "インストール完了: $(basename "${ANDROID_APK}")"

  # エミュレータ内のlocalhostをホストへ転送しておく（Metro接続用）
  "${ADB}" reverse "tcp:${METRO_PORT}" "tcp:${METRO_PORT}" >/dev/null 2>&1 \
    && print_ok "adb reverse 設定済み（localhost:${METRO_PORT}）" \
    || print_warn "adb reverse に失敗しました。Metro接続時は 10.0.2.2:${METRO_PORT} を指定してください"
}

# --- 起動手順の案内 -------------------------------------------------------

# Metroの起動とアプリの起動方法を表示する
print_next_steps() {
  printf '\n\033[1m次の手順\033[0m\n\n'
  printf '  1. Metroを起動する\n'
  printf '     \033[36mnpm run dev:mobile\033[0m\n\n'
  printf '  2. アプリを起動する（Metro起動後）\n'

  if [ "${PLATFORM}" = "ios" ]; then
    printf '     \033[36mxcrun simctl launch %s %s --initialUrl http://localhost:%s\033[0m\n\n' \
      "${IOS_UDID}" "${IOS_BUNDLE_ID}" "${METRO_PORT}"
    printf '  \033[2m※ --initialUrl を付けるとMetroへ自動接続します。\n'
    printf '     付けない場合はDev Launcher画面が開くので、一覧のURLをタップしてください。\n'
    printf '     simctl openurl のディープリンクは確認ダイアログが出るため使いません。\033[0m\n'
  else
    printf '     \033[36m%s shell am start -a android.intent.action.VIEW \\\n' "${ADB}"
    printf '       -d "%s://expo-development-client/?url=http%%3A%%2F%%2Flocalhost%%3A%s"\033[0m\n\n' \
      "${APP_SCHEME}" "${METRO_PORT}"
    printf '  \033[2m※ 通常起動する場合は %s shell monkey -p %s -c android.intent.category.LAUNCHER 1\033[0m\n' \
      "${ADB}" "${ANDROID_PACKAGE}"
  fi
}

# --- 実行 -----------------------------------------------------------------

printf '\033[1mClipTap 検証（%s）\033[0m\n' "${PLATFORM}"

if [ "${DO_CHECKS}" -eq 1 ]; then
  run_checks
else
  print_warn "静的チェックをスキップしました"
fi

if [ "${DO_BUILD}" -eq 1 ]; then
  run_native_build
else
  print_warn "ネイティブビルドをスキップしました"
fi

if [ "${DO_INSTALL}" -eq 0 ]; then
  printf '\n'
  print_ok "検証がすべて完了しました（--no-install のためインストールはしません）"
  exit 0
fi

if [ "${PLATFORM}" = "ios" ]; then
  setup_ios
else
  setup_android
fi

printf '\n'
print_ok "検証とインストールが完了しました"
print_next_steps
