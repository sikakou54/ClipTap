#!/bin/zsh
#
# アプリ状態（DB・永続設定）のフィクスチャ操作
#
# テストの前提条件を画面操作で作ると、前提を作る過程の不具合でテスト自体が倒れる。
# ここでは共有SQLiteとAsyncStorageを直接組み立てて、前提条件を決定的にする。
# アプリ本体のデータアクセスは常にMapper経由であり、この直接操作はテスト治具に限る。
#
#   state.sh paths                     解決したパスを一覧表示
#   state.sh schema                    スキーマ版と各テーブル件数
#   state.sh sql <query>               共有DBへ読み取りクエリ（タブ区切りで出力）
#   state.sh exec <sql>                共有DBへ書き込みクエリ
#   state.sh count <table>             件数だけ出力
#
#   state.sh wipe                      共有DB・SystemDB・設定を削除（新規インストール相当）
#   state.sh fixture <name>            fixtures/<name>.sql を適用（スキーマは維持）
#   state.sh list-fixtures
#
#   state.sh snapshot <name>           現在の状態を保存
#   state.sh restore <name>            保存した状態へ戻す
#   state.sh list-snapshots
#
#   state.sh pref <list|get|set|del|clear> [key] [value]
#   state.sh plan <free|pro|clear>     Developer MenuのSubscription Override相当
#   state.sh sort <created|updated|title|usage|clear>
#
# 前提: 書き換えの前にアプリを終了していること（本スクリプトは自動で終了させる）。

set -o pipefail

SKILL_DIR="${0:A:h:h}"
SCRIPTS="$SKILL_DIR/scripts"
REPO_ROOT="${0:A:h:h:h:h:h}"

for d in "$HOME/.nvm/versions/node"/*/bin /opt/homebrew/bin /usr/local/bin; do
  [[ -d "$d" ]] && PATH="$d:$PATH"
done
export PATH

[[ -f "$SKILL_DIR/config.env" ]] && source "$SKILL_DIR/config.env"
if [[ -z "$BUNDLE_ID" ]]; then
  BUNDLE_ID=$(grep -m1 '"bundleIdentifier"' "$REPO_ROOT/apps/mobile/app.json" | sed 's/.*: *"\(.*\)".*/\1/')
fi
: "${BUNDLE_ID:=com.sikakou.cliptap}"
: "${APP_GROUP:=group.com.sikakou.cliptap}"
: "${DB_FILE_NAME:=cliptap.db}"

SNAP_DIR="${FULLTEST_OUT:-$SKILL_DIR/.out}/snapshots"

die() { print -u2 "ERROR: $*"; exit 1; }

udid() {
  local u=$(xcrun simctl list devices booted -j 2>/dev/null \
    | grep -o '"udid" : "[^"]*"' | head -1 | sed 's/.*: "\(.*\)"/\1/')
  [[ -z "$u" ]] && die "起動中のシミュレータがありません（sim.sh boot を先に実行してください）"
  print "$u"
}

data_container() {
  xcrun simctl get_app_container "$(udid)" "$BUNDLE_ID" data 2>/dev/null \
    || die "アプリがインストールされていません（sim.sh install を先に実行してください）"
}

# App Groupのコンテナは毎回GUIDが変わるため、その都度実体を探す。
shared_db() {
  local base=~/Library/Developer/CoreSimulator/Devices/$(udid)/data/Containers/Shared/AppGroup
  local f=$(find "$base" -maxdepth 3 -name "$DB_FILE_NAME" -path "*databases*" 2>/dev/null | head -1)
  if [[ -z "$f" ]]; then
    # まだ作られていない場合は作成予定地を返す
    local dir=$(find "$base" -maxdepth 2 -type d -name databases 2>/dev/null | head -1)
    [[ -n "$dir" ]] && print "$dir/$DB_FILE_NAME" || print ""
  else
    print "$f"
  fi
}

system_db()  { print "$(data_container)/Documents/SQLite/$DB_FILE_NAME" }
prefs_dir()  { print "$(data_container)/Library/Application Support/$BUNDLE_ID/RCTAsyncLocalStorage_V1" }

stop_app() { xcrun simctl terminate "$(udid)" "$BUNDLE_ID" >/dev/null 2>&1; sleep 1 }

require_db() {
  local f=$(shared_db)
  [[ -z "$f" || ! -f "$f" ]] && die "共有DBがまだありません。アプリを1度起動してください"
  print "$f"
}

cmd=$1; shift 2>/dev/null

case "$cmd" in
  paths)
    print "udid:        $(udid)"
    print "bundle:      $BUNDLE_ID"
    print "data:        $(data_container)"
    print "shared db:   $(shared_db)"
    print "system db:   $(system_db)"
    print "prefs:       $(prefs_dir)"
    print "snapshots:   $SNAP_DIR"
    ;;

  schema)
    db=$(require_db)
    print "system user_version: $(sqlite3 "$(system_db)" 'PRAGMA user_version;' 2>/dev/null)"
    sqlite3 "$db" "
      select 'snippets', count(*) from snippets
      union all select 'categories', count(*) from categories
      union all select 'profiles', count(*) from profiles
      union all select 'variables', count(*) from variables
      union all select 'profile_variables', count(*) from profile_variables
      union all select 'snippet_profiles', count(*) from snippet_profiles
      union all select 'system_variable_formats', count(*) from system_variable_formats;"
    ;;

  sql)
    [[ -z "$1" ]] && die "usage: state.sh sql <query>"
    sqlite3 -separator $'\t' "$(require_db)" "$1"
    ;;

  exec)
    [[ -z "$1" ]] && die "usage: state.sh exec <sql>"
    stop_app
    sqlite3 "$(require_db)" "$1" || die "SQLの実行に失敗しました"
    print "executed"
    ;;

  count)
    [[ -z "$1" ]] && die "usage: state.sh count <table>"
    sqlite3 "$(require_db)" "select count(*) from $1;"
    ;;

  wipe)
    stop_app
    db=$(shared_db)
    [[ -n "$db" ]] && rm -f "$db" "$db-wal" "$db-shm"
    sdb=$(system_db)
    rm -f "$sdb" "$sdb-wal" "$sdb-shm"
    node "$SCRIPTS/prefs.mjs" "$(prefs_dir)" clear
    print "wiped（次回起動で新規インストール扱いになる）"
    ;;

  fixture)
    [[ -z "$1" ]] && die "usage: state.sh fixture <name>"
    f="$SCRIPTS/fixtures/$1.sql"
    [[ -f "$f" ]] || die "フィクスチャがありません: $f"
    stop_app
    db=$(require_db)
    sqlite3 "$db" < "$f" || die "フィクスチャの適用に失敗しました: $1"
    print "fixture applied: $1"
    ;;

  list-fixtures)
    for f in "$SCRIPTS"/fixtures/*.sql; do
      print "${f:t:r}\t$(head -2 "$f" | tail -1 | sed 's/^-- *//')"
    done
    ;;

  snapshot)
    [[ -z "$1" ]] && die "usage: state.sh snapshot <name>"
    stop_app
    d="$SNAP_DIR/$1"; mkdir -p "$d"
    db=$(shared_db); [[ -f "$db" ]] && cp "$db" "$d/shared.db"
    sdb=$(system_db); [[ -f "$sdb" ]] && cp "$sdb" "$d/system.db"
    p=$(prefs_dir); [[ -d "$p" ]] && cp -R "$p" "$d/prefs"
    print "snapshot saved: $d"
    ;;

  restore)
    [[ -z "$1" ]] && die "usage: state.sh restore <name>"
    d="$SNAP_DIR/$1"
    [[ -d "$d" ]] || die "スナップショットがありません: $d"
    stop_app
    db=$(shared_db); [[ -f "$d/shared.db" && -n "$db" ]] && { rm -f "$db-wal" "$db-shm"; cp "$d/shared.db" "$db" }
    sdb=$(system_db); [[ -f "$d/system.db" ]] && { mkdir -p "${sdb:h}"; rm -f "$sdb-wal" "$sdb-shm"; cp "$d/system.db" "$sdb" }
    p=$(prefs_dir)
    if [[ -d "$d/prefs" ]]; then rm -rf "$p"; mkdir -p "${p:h}"; cp -R "$d/prefs" "$p"; fi
    print "restored: $1"
    ;;

  list-snapshots)
    [[ -d "$SNAP_DIR" ]] && ls -1 "$SNAP_DIR" || print "(なし)"
    ;;

  pref)
    # 読み取りではアプリを止めない。
    # ASSERT_PREF のたびにアプリが落ちると、以降のステップが全部倒れる。
    case "$1" in
      set|del|clear) stop_app ;;
    esac
    node "$SCRIPTS/prefs.mjs" "$(prefs_dir)" "$@"
    ;;

  plan)
    stop_app
    case "$1" in
      pro)   node "$SCRIPTS/prefs.mjs" "$(prefs_dir)" set '@dev_subscription_override' 'true' ;;
      free)  node "$SCRIPTS/prefs.mjs" "$(prefs_dir)" set '@dev_subscription_override' 'false' ;;
      clear) node "$SCRIPTS/prefs.mjs" "$(prefs_dir)" del '@dev_subscription_override' ;;
      *) die "usage: state.sh plan <free|pro|clear>" ;;
    esac
    print "plan: $1（反映にはアプリの再起動が必要）"
    ;;

  sort)
    stop_app
    case "$1" in
      created|updated|title|usage)
        node "$SCRIPTS/prefs.mjs" "$(prefs_dir)" set '@snippet_sort_preference' "$1" ;;
      clear)
        node "$SCRIPTS/prefs.mjs" "$(prefs_dir)" del '@snippet_sort_preference' ;;
      *) die "usage: state.sh sort <created|updated|title|usage|clear>" ;;
    esac
    print "sort: $1（反映にはアプリの再起動が必要）"
    ;;

  *)
    sed -n '2,40p' "$0"
    exit 1
    ;;
esac
