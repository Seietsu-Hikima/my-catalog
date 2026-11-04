// ★作品の追加・変更は、このファイルだけを編集します。書き方は README.md を見てください。
// いま入っている内容はすべて架空の仮データです。公開前に本物の情報へ差し替えてください。

const SHOP = {
  name: "手作り工房淀屋橋",
  description: "ひとつずつ手づくりしています",
  owner: "淀屋橋太郎",                                  // 責任者。空 "" なら表示されない
  address: "〒541-0041 大阪府大阪市中央区北浜3丁目1番25号", // 住所。空 "" なら表示されない
  phone: "0120-123-123",                               // 電話番号。空 "" なら表示されない
};

// status の値: available = 販売中 / order = 受注制作 / soldout = 売り切れ
const WORKS = [
  {
    id: "w001",
    name: "刺繍ブローチ 小花",
    price: 2800,
    status: "available",
    images: ["images/sample-brooch-1.svg", "images/sample-brooch-2.svg"],
    description: "やわらかな色合いの糸で、小さな花を刺しました。\nコートやバッグのワンポイントにどうぞ。",
    material: "コットン、刺繍糸",
    size: "約4cm × 4cm",
  },
  {
    id: "w002",
    name: "天然石のしずくピアス",
    price: 3200,
    status: "available",
    images: ["images/sample-earrings.svg"],
    description: "光を受けて静かに揺れる、しずく形のピアスです。",
    material: "天然石、真鍮",
    size: "全長 約3.5cm",
  },
  {
    id: "w003",
    name: "リネンのがま口ポーチ",
    price: 4500,
    status: "order",
    images: ["images/sample-pouch-1.svg", "images/sample-pouch-2.svg", "images/sample-pouch-3.svg"],
    description: "使うほどに風合いが増すリネンで仕立てました。\n生地の色はご相談ください。",
    material: "リネン、コットン、金属口金",
    size: "約12cm × 15cm",
  },
  {
    id: "w004",
    name: "レジンの押し花リング",
    price: 1800,
    status: "soldout",
    images: ["images/sample-ring.svg"],
    description: "本物の小さな押し花を、透明なレジンに閉じ込めました。",
    material: "レジン、押し花、真鍮",
    size: "フリーサイズ",
  },
  {
    id: "w005",
    name: "手編みのコースター 2枚組",
    price: 1500,
    status: "available",
    images: ["images/sample-coasters.svg"],
    description: "太めのコットン糸で編んだ、丸いコースターです。",
    material: "コットン糸",
    size: "直径 約10cm",
  },
  {
    id: "w006",
    name: "ビーズのブレスレット",
    price: 2400,
    status: "soldout",
    images: ["images/sample-bracelet.svg"],
    description: "小さなガラスビーズを一粒ずつ編み込みました。",
    material: "ガラスビーズ、ナイロン糸",
    size: "内周 約16cm",
  },
  {
    id: "w007",
    name: "帆布のミニトート",
    price: 5200,
    status: "order",
    images: ["images/sample-tote.svg"],
    description: "お弁当やちょっとしたお出かけにちょうどいい大きさです。",
    material: "帆布、綿テープ",
    size: "約25cm × 22cm × マチ8cm",
  },
  {
    id: "w008",
    name: "木のボタンヘアゴム",
    price: 900,
    status: "available",
    images: ["images/sample-hairtie.svg"],
    description: "木の温もりを感じる、丸いボタンのヘアゴムです。",
    material: "木、ゴム",
    size: "ボタン直径 約2.5cm",
  },
];
