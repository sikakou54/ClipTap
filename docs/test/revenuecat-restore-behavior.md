# RevenueCat Restore Behavior 検証記録

このファイルをコピーし、本番Dashboard設定と購入サンドボックスの結果をリリースごとに記録する。

## 実施情報

- 実施日:
- 実施者:
- アプリ版 / ビルド番号:
- iOS / Android:
- RevenueCat Restore Behavior設定:
- 使用したApp User ID:

## 結果

| 復元前 | 復元対象 | 期待結果 | 実結果 | 採用された有効期限 | 証跡 | 判定 |
|---|---|---|---|---|---|---|
| Free | Free | Free |  |  |  |  |
| Free | Pro | Pro |  |  |  |  |
| Pro | Free | Proを維持 |  |  |  |  |
| Pro | Pro | 遅い有効期限のPro |  |  |  |  |

## 完了確認

- [ ] Dashboardの本番設定値を確認した
- [ ] 4組合せを購入サンドボックスで確認した
- [ ] 各ケースのApp User ID・有効期限・画面証跡を記録した
- [ ] 仕様書第6.4節の表と結果が一致した
- [ ] 不一致がある場合、リリースを止めて製品方針またはDashboard設定を修正した
