#!/usr/bin/env bash
#
# ネイティブビルド検証スクリプト
#
# 【目的】
# iOS拡張キーボード（Swift）とAndroid IME（Kotlin/リソース）は
# `npm run type-check` の対象外のため、変更しても静的チェックでは壊れが検出できない。
# 実際にコンパイルして、ビルドが通ることを確認する。
#
# 【使い方】
#   ./scripts/build-native.sh            # iOS + Android の両方
#   ./scripts/build-native.sh ios        # iOSのみ
#   ./scripts/build-native.sh android    # Androidのみ
#
# 【ビルド範囲】
# どちらのプラットフォームもアプリ本体ごとビルドする。
# - iOS: ClipTapKeyboardスキームは拡張の実行にホストアプリを必要とするため、
#        ClipTap.app を構築し、その PlugIns に ClipTapKeyboard.appex を埋め込む。
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

# ログの出力先（失敗時に詳細を追える）
readonly LOG_DIR="${REPO_ROOT}/.build-logs"

# 対象（省略時は全部）
TARGET="${1:-all}"

mkdir -p "${LOG_DIR}"

# 見出しを表示する
# $1: 見出し文字列
print_header() {
  printf '\n\033[1m==> %s\033[0m\n' "$1"
}

# 空き容量を確かめる
#
# ネイティブビルドは iOS の DerivedData だけで10GB近くまで育ち、
# Androidのビルド生成物とMozcの辞書も加わる。
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
    printf '\033[32m✅ iOS (%s) ビルド成功\033[0m\n' "${scheme}"
    return 0
  fi

  printf '\033[31m❌ iOS (%s) ビルド失敗\033[0m\n' "${scheme}" >&2
  # 自前コードのエラーを拾いやすいよう、error: 行だけ抜き出す
  grep -E 'error:|BUILD FAILED' "${log_file}" | head -40 >&2 || true
  printf '詳細: %s\n' "${log_file}" >&2
  return 1
}

# 拡張キーボードのSwiftパッケージをテストする
#
# 入力機能のロジックとかな漢字変換は apps/mobile/ios/ClipTapKeyboardCore に
# あり、ここだけがネイティブ側で唯一自動テストできる層になる。
# xcodebuild は appex をビルドするだけでこのテストを実行しないため、別に回す。
#
# 最適化ビルドで実行する理由は、打鍵ごとの変換応答を検証しているため。
# Debugビルド（-Onone）では実装が正しくても目標値を満たせない。
test_keyboard_core() {
  local package_dir="${IOS_DIR}/ClipTapKeyboardCore"
  local log_file="${LOG_DIR}/ios-keyboard-core-test.log"

  if ! command -v swift >/dev/null 2>&1; then
    printf '\033[31mswift が見つかりません。パッケージのテストを飛ばします。\033[0m\n' >&2
    return 0
  fi

  print_header "iOS: ClipTapKeyboardCore をテスト中（ログ: ${log_file}）"

  if swift test -c release --package-path "${package_dir}" >"${log_file}" 2>&1; then
    local summary
    summary="$(grep -oE 'Test run with [0-9]+ tests? in [0-9]+ suites? passed' "${log_file}" | tail -1 || true)"
    printf '\033[32m✅ ClipTapKeyboardCore テスト成功 %s\033[0m\n' "${summary}"
    return 0
  fi

  printf '\033[31m❌ ClipTapKeyboardCore テスト失敗\033[0m\n' >&2
  grep -E '✘|error:|failed' "${log_file}" | head -40 >&2 || true
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

check_free_space || exit 1

case "${TARGET}" in
  ios)
    ios_failed=0
    build_ios ClipTapKeyboard || ios_failed=1
    test_keyboard_core || ios_failed=1
    [ "${ios_failed}" -eq 0 ] || exit 1
    ;;
  android)
    build_android
    ;;
  all)
    # 片方が落ちても両方の結果を出したいので、失敗を記録して最後に判定する
    failed=0
    build_ios ClipTapKeyboard || failed=1
    test_keyboard_core || failed=1
    build_android || failed=1

    if [ "${failed}" -ne 0 ]; then
      printf '\n\033[31mネイティブビルドに失敗があります。\033[0m\n' >&2
      exit 1
    fi
    printf '\n\033[32mすべてのネイティブビルドが成功しました。\033[0m\n'
    ;;
  *)
    printf '不明な対象: %s\n' "${TARGET}" >&2
    printf '使い方: %s [all|ios|android]\n' "$0" >&2
    exit 2
    ;;
esac
