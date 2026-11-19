# Closet Coordinator UI: 残タスク

Stitch「Closet Coordinator App」(project id 6831858495193214495) の5画面を Lism CSS で実装済み。`tsc -b` とビルドは通り、全ルートの SSR は 200 を返す。ブラウザでの目視確認は未実施。

## 実機での目視確認（390px・ライト/ダーク）

Stitch のスクリーンショットと比較して差分を直す。

- クローゼットの追加ボタン（fixed, bottom 96px）が下部ナビと重ならないか
- ビルダーのトースト（fixed, top 80px）が上部バーと重ならないか
- ルックブックのピル行の横スクロール端（`--lb-gutter` は近似値）
- カレンダーの低回転アイテムの横スクロール
- `MaterialIcon` の weight 固定(300)と Stitch の差
- ダークの HTML/スクリーンショットを参照できていない画面がある（`TOKENS.md` と他画面からの推定）
- カレンダーはダークのみの設計。ライトは変数マッピングからの推定

## 整形

`vp check` の整形エラーは着手前から36ファイルあり、現在は57ファイル。整形方針を決めて一括対応する。

## 範囲外

- 衣類データの API 接続（バックエンドは認証のみ。Loco の generator 経由で別途実装）
- アイテム詳細は `$itemId` を無視してモックを表示している
- アイテム追加フォーム（`/closet/new`）の保存は `mocks/closet.ts` の `addClosetItem` でメモリに積むだけ。リロードで消える。items API ができたらここを差し替える
- アカウント設定（`/account`）は `GET /api/auth/current` の表示とパスワード再設定メール送信のみ。名前・メールの変更とパスワード変更の API は未実装

## アクセシビリティ（Utakata-UI 化の後）

実装は `design/a11y-audit.md` の指摘を元に進めた。ブラウザ・スクリーンリーダーでの確認は未実施。

- キーボード操作の実機確認
  - ToggleGroup / Tabs の roving tabindex（SSR の HTML では全項目が `tabindex="-1"`。ハイドレーション後に1つが Tab で到達できるか）
  - カレンダーのグリッド（矢印キー、Home/End、PageUp/PageDown、月またぎのフォーカス）
  - ルート遷移後の `RouteAnnouncer` のフォーカス移動、スキップリンク
- スクリーンリーダーでライブリージョン（件数、選択、トースト、着用ログ）が二重に読まれないか
- コントラスト比は `theme.css` の値から計算した。実画面、とくにルックブックのヒーロー画像のスクリム上のテキストは未測定
- トーストが画面ごとに別実装（`Toast.Provider` は ItemDetail のみ）。共通化するなら `App.tsx` に Provider を置く
- 「tune」ボタンとアーカイブ・クリアの操作は未実装。実装時に AlertDialog 等で確認を付ける
- カレンダーの h1 は月表示のまま（「カレンダー」ではない）
- 認証画面の本文は英語のまま（`lang="en"`）。日本語化するか決める
