# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 概要

NEKOMO（猫デザインのスマホグッズ専門店）の1ページ構成のショップサイト。`index.html` / `style.css` / `script.js` の3ファイルだけで完結する静的サイトで、ビルド・パッケージマネージャー・テスト・Lint はない。外部依存は Google Fonts（Zen Maru Gothic）のみ。

ユーザーはプログラム未経験者。説明や報告は日本語で、専門用語をかみ砕いて行う。

## 動かし方

`index.html` をブラウザで直接開けば動く（サーバー不要）。動作確認はブラウザで開いて画面を確認する。

## アーキテクチャ

- **画像ファイルはない。** ロゴ・ヒーロー・商品イラストはすべて `script.js` が SVG 文字列を組み立てて `innerHTML` に入れている。
  - `cat()` / `paw()` は猫の顔・肉球を描く部品関数。`svgWrap()` で 200×200 の viewBox に包む。
  - `shapes` は商品ごとの描画関数（キー名 = 商品の `shape`）。色を引数に取るので、カラー選択でイラストの色が変わる。
- **商品データは `script.js` 内の `products` 配列にハードコード。** 各商品は `id`・`cat`（`case`/`charge`/`accessory`。表示名は `CATEGORY_LABEL`）・`price`・`shape`・`colors`・`bg`・任意の `badge` を持つ。商品を追加するときは、対応する `shapes` のエントリと、必要なら `CATEGORY_LABEL` と `index.html` の絞り込みボタン（`#filters` 内の `.filter[data-cat]`）も揃える。
- **HTML と JS は id で結合している。** `script.js` は `$('#...')` で `#productGrid`・`#filters`・`#cartItems`・`#cartCount`・`#drawer`・`#overlay`・`#subtotal`・`#shipping`・`#total`・`#shippingNote`・`#checkoutBtn`・`#toast`・`#nav`・`#menuBtn`・`#newsletterForm`・`#logoIcon`・`#heroVisual` などを直接参照する。HTML 側の id を変えると JS が壊れる。
- **描画は「状態を変えて丸ごと再描画」方式。** 商品一覧は `renderProducts()`（`currentFilter` と `selectedColor` を参照）、カートは `renderCart()` が全体を書き直す。クリックは親要素へのイベント委譲で `data-*` 属性（`data-add`・`data-id`/`data-ci`・`data-inc`/`data-dec`/`data-rm`）を見て処理する。
- **カートは localStorage（キー `nekomo-cart`）に `{id, ci, qty}` で保存。** `ci` は `colors` 配列の添字。商品の `id` を消したり `colors` の順番を変えたりすると、保存済みカートと食い違って表示が壊れる（`products.find` が undefined になる）ので注意。
- 送料ルールは定数 `FREE_SHIPPING`（5000円以上で無料）と `SHIPPING_FEE`（600円）。
- **未実装部分:** 決済（`#checkoutBtn` は「準備中」の alert のみ。Stripe / Shopify 連携予定の TODO あり）、メルマガ登録（送信せずトースト表示のみ）。注文データをサーバーへ送る仕組みはない。

## スタイル

- 色・角丸・影は `style.css` 冒頭の `:root` の CSS 変数（`--bg`・`--accent` など）で一元管理している。色を変えるときはまずここを変える。
- クラス名は BEM 風（`card__body`、`btn--primary`）、状態は `is-active` / `is-open` / `is-show`。
- JS 内の SVG 色は CSS 変数ではなく、`INK`・`PINK` 定数と商品データの色コードを直接使っている。

## その他

- `.playwright-mcp/` は過去の動作確認時に自動生成されたスクリーンショットとログ（削除済みの旧「作品カタログ」のもの）。サイトとは無関係で、git 管理外。
