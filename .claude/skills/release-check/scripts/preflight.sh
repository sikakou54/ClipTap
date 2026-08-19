#!/bin/zsh
#
# リリース前の静的チェックを一括実行する。
# 実機・シミュレータ操作の前に、まずここが全て通ることを確認する。
#
#   preflight.sh          全項目を実行
#   preflight.sh quick    Androidビルドを省略（型チェック・テスト・lintのみ）

set -o pipefail

for d in "$HOME/.nvm/versions/node"/*/bin /opt/homebrew/bin /usr/local/bin; do
  [[ -d "$d" ]] && PATH="$d:$PATH"
done
export PATH
export LANG="${LANG:-en_US.UTF-8}"

REPO_ROOT="${0:A:h:h:h:h:h}"
cd "$REPO_ROOT" || exit 1

FAILED=()
run() {
  local label=$1; shift
  print "\n=== $label ==="
  if "$@"; then
    print "OK: $label"
  else
    print "FAIL: $label"
    FAILED+=("$label")
  fi
}

run "型チェック（全ワークスペース）" npm run type-check
run "ユニットテスト（packages/shared）" npm test
run "ESLint（apps/mobile / 0件必須）" npm run lint --workspace=@cliptap/mobile

run "ESLint（apps/web / 0件必須）" npm run lint --workspace=@cliptap/web

if [[ "$1" != "quick" ]]; then
  run "Androidデバッグビルド" zsh -c "cd '$REPO_ROOT/apps/mobile/android' && ./gradlew assembleDebug"
fi

# SCHEMA_VERSION を更新した場合、Web版の配布ファイル再生成が必要
print "\n=== Web版スターターファイルの整合 ==="
SCHEMA=$(grep -m1 "SCHEMA_VERSION" packages/shared/src/database/schema.ts | grep -o '[0-9]\+' | head -1)
if [[ -n "$SCHEMA" ]]; then
  missing=0
  for lang in ja en; do
    f="apps/web/public/starter_v${SCHEMA}_${lang}.cliptap"
    if [[ -f "$f" ]]; then
      print "OK: $f"
    else
      print "MISSING: $f"
      missing=1
    fi
  done
  if (( missing )); then
    print "→ npm run generate:starter --workspace=@cliptap/web を実行してコミットしてください"
    FAILED+=("Web版スターターファイル")
  fi
else
  print "SKIP: SCHEMA_VERSION を特定できませんでした"
fi

print "\n========================================"
if (( ${#FAILED} == 0 )); then
  print "静的チェック: すべて成功"
  exit 0
else
  print "静的チェック: 失敗 ${#FAILED} 件"
  for f in "${FAILED[@]}"; do print "  - $f"; done
  exit 1
fi
