# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 概要

NEKOMO（猫デザインのスマホグッズ専門店）の1ページ構成のショップサイト。`index.html` / `style.css` / `script.js` の静的ファイルと、Vercel のサーバー関数 `api/products.js`（Notion から商品を読む）でできている。ビルド・パッケージマネージャー・テスト・Lint はない。外部依存は Google Fonts（Zen Maru Gothic）と Notion API のみ。

公開先は Vercel プロジェクト `nekomo-shop`（https://nekomo-shop.vercel.app）。GitHub の `main` に push すると自動で本番に反映される。

ユーザーはプログラム未経験者。説明や報告は日本語で、専門用語をかみ砕いて行う。

## 動かし方

`index.html` をブラウザで直接開けば動く（このときは Notion を読まず、`script.js` の予備データを表示する）。動作確認はブラウザで開いて画面を確認する。Notion 連携まで手元で試すなら `vercel dev`（`.env.local` に `NOTION_TOKEN` が必要）。

## アーキテクチャ

- **画像ファイルはない。** ロゴ・ヒーロー・商品イラストはすべて `script.js` が SVG 文字列を組み立てて `innerHTML` に入れている。
  - `cat()` / `paw()` は猫の顔・肉球を描く部品関数。`svgWrap()` で 200×200 の viewBox に包む。
  - `shapes` は商品ごとの描画関数（キー名 = 商品の `shape`）。色を引数に取るので、カラー選択でイラストの色が変わる。
- **商品の正本は Notion の「NEKOMO 商品」データベース**（ユーザーのプライベート、ID `7c9593abec9341c785c29bc5a5f42473`）。「公開」にチェックがある行を「並び順」の順に `api/products.js` が読み、`{id, name, cat, price, shape, desc, colors, bg, badge}` の形に変換して返す。Notion の列名（商品名・商品ID・カテゴリ・価格・説明・イラスト・カラー・背景色・バッジ・並び順・公開）を変えると読めなくなる。
  - 環境変数は Vercel 側の `NOTION_TOKEN`（必須、秘密）と `NOTION_DATABASE_ID`（省略可）。トークンは `script.js` など公開ファイルに絶対に書かない。
  - `script.js` の `loadProducts()` が `/api/products` を読み、`isValidProduct()` で検証してから `products` を差し替えて再描画する。読めないとき・0件のときは予備データのまま。Notion の文字列は `esc()` でエスケープして表示する。
- **`script.js` 内の `products` 配列は予備データ**（Notion が読めないときに表示）。各商品は `id`・`cat`（`case`/`charge`/`accessory`。表示名は `CATEGORY_LABEL`）・`price`・`shape`・`colors`・`bg`・任意の `badge` を持つ。商品を追加するときは、対応する `shapes` のエントリと、必要なら `CATEGORY_LABEL` と `index.html` の絞り込みボタン（`#filters` 内の `.filter[data-cat]`）も揃える。
- **HTML と JS は id で結合している。** `script.js` は `$('#...')` で `#productGrid`・`#filters`・`#cartItems`・`#cartCount`・`#drawer`・`#overlay`・`#subtotal`・`#shipping`・`#total`・`#shippingNote`・`#checkoutBtn`・`#toast`・`#nav`・`#menuBtn`・`#newsletterForm`・`#logoIcon`・`#heroVisual` などを直接参照する。HTML 側の id を変えると JS が壊れる。
- **描画は「状態を変えて丸ごと再描画」方式。** 商品一覧は `renderProducts()`（`currentFilter` と `selectedColor` を参照）、カートは `renderCart()` が全体を書き直す。クリックは親要素へのイベント委譲で `data-*` 属性（`data-add`・`data-id`/`data-ci`・`data-inc`/`data-dec`/`data-rm`）を見て処理する。
- **カートは localStorage（キー `nekomo-cart`）に `{id, ci, qty}` で保存。** `ci` は `colors` 配列の添字。`renderCart()` は今の商品一覧にない商品・色を表示から除き、`loadProducts()` 成功時にカートから取り除く。商品IDや色の順番を変えると、お客さんのカートからその商品が消えたり色がずれたりする。
- 送料ルールは定数 `FREE_SHIPPING`（5000円以上で無料）と `SHIPPING_FEE`（600円）。
- **未実装部分:** 決済（`#checkoutBtn` は「準備中」の alert のみ。Stripe / Shopify 連携予定の TODO あり）、メルマガ登録（送信せずトースト表示のみ）。注文データをサーバーへ送る仕組みはない。

## スタイル

- 色・角丸・影は `style.css` 冒頭の `:root` の CSS 変数（`--bg`・`--accent` など）で一元管理している。色を変えるときはまずここを変える。
- クラス名は BEM 風（`card__body`、`btn--primary`）、状態は `is-active` / `is-open` / `is-show`。
- JS 内の SVG 色は CSS 変数ではなく、`INK`・`PINK` 定数と商品データの色コードを直接使っている。

## その他

- `.playwright-mcp/` は過去の動作確認時に自動生成されたスクリーンショットとログ（削除済みの旧「作品カタログ」のもの）。サイトとは無関係で、`.gitignore` で除外している。`.env*.local` と `.vercel` も除外。
