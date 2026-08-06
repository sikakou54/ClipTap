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

case "${TARGET}" in
  ios)
    build_ios ClipTapKeyboard
    ;;
  android)
    build_android
    ;;
  all)
    # 片方が落ちても両方の結果を出したいので、失敗を記録して最後に判定する
    failed=0
    build_ios ClipTapKeyboard || failed=1
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
