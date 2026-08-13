# fixture追加要求（グループD1: F-13 / F-14 / F-18）

## 状態: 2件とも対応済み

統括により `default-lower` / `active-lower` が追加され、D1のテストで使用中。
新たな要求はない。以下は経緯と、どのテストが何を根拠にしているかの記録。

---

## 1. `default-lower`（追加済み・使用中）

標準プロファイルが `sortOrder=4`、5件すべて `valid=1`。

### 要求した理由

§13.2 の判定順「プロファイルは標準優先の後に表示順」を、**順序の差が結果に出る形**で
検証できなかった。`baseline` / `free-limit` / `over-limit` はいずれも標準が `sortOrder=0` のため、
「標準優先」を外して単純な表示順にしても有効な3件が変わらず、判定順の検証にならない。

### 使っているテスト

- **TC-3364**（`P-F18-066`）… `plan=free` で起動し、起動時再計算だけで判定順を検証する。

```
ASSERT_DB  select group_concat(name) from (select name from profiles where valid=1 order by isDefault desc, sortOrder asc)  → 標準P,P1,P2
ASSERT_DB  select group_concat(name) from (select name from profiles where valid=0 order by sortOrder asc)                  → P3,P4
```

標準優先が効いていなければ有効は `P1,P2,P3` になるため、両者を区別できる。

---

## 2. `active-lower`（追加済み・使用中）

アクティブプロファイルが `sortOrder=4`、5件すべて `valid=1`。

### 要求した理由

「無効になったプロファイルがアクティブだった場合は標準プロファイルへ切り替わる」（§8.18 事後条件）を
1回の起動で検証するため。当初の `TC-3350` は
`over-limit` + `plan=pro` で起動 → ホームのプロファイル切替で `D社用` をアクティブにする →
開発者メニューで Free へ切り替える、という16ステップのUI経路だった。

### 使っているテスト

- **TC-3350**（`P-F18-050`）… `fixture=active-lower; plan=free` の起動1回、6ステップへ簡略化済み。

```
ASSERT_DB  select valid from profiles where name='アクティブP'  → 0
ASSERT_DB  select name  from profiles where isActive=1          → 標準P
ASSERT_DB  select count(*) from profiles where isActive=1       → 1
```

---

## 3. 行内ボタンの到達性（`TAP_IN` で解決済み）

当初は「一覧行が複合ラベル1要素になるため行内の削除・標準にするボタンを押せない」として
8パターンを `UNREACHABLE` にしていたが、統括が `TAP_IN`（要素の矩形内を相対位置で押す）を
追加したため全件 `REACHABLE` へ戻した。使用している相対位置は次のとおり。

| 対象 | ロケータ | 相対位置 | 出る確認ダイアログ |
|---|---|---|---|
| プロファイル削除 | `label~=<プロファイル名>` | `0.93,0.5` | `プロファイル「<名前>」を削除しますか？` |
| 標準にする | `label~=<プロファイル名>` | `0.78,0.5` | `プロファイル「<名前>」を標準にしますか？` |
| カスタム変数削除 | `label~=<変数名>` | `0.93,0.5` | `変数 <変数名> を削除しますか?` |

プロファイル管理の2つは統括の実測値。**変数管理の `0.93,0.5` は未実測**で、
プロファイル管理と同じレイアウト（行の右端に削除ボタン）である前提を置いている。
外れた場合は行の `onPress`（＝変数編集画面への遷移）が走るため、
直後の `ASSERT_SCREEN_HAS`（削除確認メッセージ）で落ちて検知できる。

---

## 4. fixtureでも `TAP_IN` でも解決しないもの

`P-F18-065`（無効なプロファイルを標準にしようとしたときの
`error.cannot_set_invalid_profile_as_default`）だけは残る。
無効な行には「標準にする」バッジ自体が描画されない（`profiles.tsx:105` の `!item.isDefault && enabled`）ため、
相対位置で押しても行の `onPress` が走り Pro案内ダイアログが出るだけで、
Service層のガード（`ProfileService.setDefault`）へ到達できない。
