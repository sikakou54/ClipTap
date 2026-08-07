#!/usr/bin/env bash
#
# 検証スクリプト（静的チェック → ネイティブビルドとインストール）
#
# 【目的】
# コミット前の静的チェックから、シミュレータ/エミュレータにアプリを入れるまでを1コマンドで通す。
# 「型チェックは通ったが実機で壊れていた」を防ぐため、静的チェックと実際のビルドを地続きにする。
#
# 【build-native.sh との分担】
# ネイティブのビルドと端末へのインストールは build-native.sh の責務で、ここでは呼ぶだけ。
# 同じ処理を二重に持つと、片方だけ直したときに挙動がずれるため一箇所に寄せている。
# このスクリプトが受け持つのは、その前段の静的チェックと、最後の起動案内。
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
#   4. build-native.sh      ネイティブビルド＋シミュレータ/エミュレータへのインストール
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

# アプリ識別子（apps/mobile/app.json と一致させること）
readonly APP_SCHEME="cliptap"
readonly IOS_BUNDLE_ID="com.sikakou.cliptap"
readonly ANDROID_PACKAGE="com.sikakou.cliptap"

readonly ANDROID_SDK="${ANDROID_HOME:-${ANDROID_SDK_ROOT:-${HOME}/Library/Android/sdk}}"
readonly ADB="${ANDROID_SDK}/platform-tools/adb"

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

# --- 4: ネイティブビルドとインストール ------------------------------------

# 指定プラットフォームのネイティブをビルドし、端末へ入れる（実体は build-native.sh）
#
# インストールまで build-native.sh に任せているのは、
# 「ビルドしたのに端末が古いまま」を防ぐ責務をあちらに一本化しているため。
run_native_build() {
  print_step "ネイティブビルドとインストール（${PLATFORM}）"

  local build_args=("${PLATFORM}")
  [ "${DO_BUILD}" -eq 1 ]   || build_args+=(--skip-build)
  [ "${DO_INSTALL}" -eq 1 ] || build_args+=(--no-install)

  "${REPO_ROOT}/scripts/build-native.sh" "${build_args[@]}"
}

# --- 起動手順の案内 -------------------------------------------------------

# Metroの起動とアプリの起動方法を表示する
print_next_steps() {
  printf '\n\033[1m次の手順\033[0m\n\n'
  printf '  1. Metroを起動する\n'
  printf '     \033[36mnpm run dev:mobile\033[0m\n\n'
  printf '  2. アプリを起動する（Metro起動後）\n'

  if [ "${PLATFORM}" = "ios" ]; then
    printf '     \033[36mxcrun simctl launch booted %s --initialUrl http://localhost:%s\033[0m\n\n' \
      "${IOS_BUNDLE_ID}" "${METRO_PORT}"
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

if [ "${DO_BUILD}" -eq 0 ]; then
  print_warn "ネイティブビルドをスキップします（前回の成果物をインストールします）"
fi

run_native_build

if [ "${DO_INSTALL}" -eq 0 ]; then
  printf '\n'
  print_ok "検証がすべて完了しました（--no-install のためインストールはしません）"
  exit 0
fi

printf '\n'
print_ok "検証とインストールが完了しました"
print_next_steps
