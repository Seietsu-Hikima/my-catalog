/* =========================================================
   Notion の「NEKOMO 商品」データベースから商品一覧を返す
   Vercel のサーバー側で動く（トークンはブラウザに渡さない）

   必要な環境変数（Vercel の Settings → Environment Variables）
     NOTION_TOKEN        … Notion インテグレーションのシークレット（必須）
     NOTION_DATABASE_ID  … 省略可。省略時は下の DEFAULT_DATABASE_ID
   ========================================================= */

const DEFAULT_DATABASE_ID = '7c9593abec9341c785c29bc5a5f42473'; // NEKOMO 商品
const NOTION_VERSION = '2025-09-03';

const CATEGORY = { 'ケース': 'case', '充電グッズ': 'charge', 'アクセサリー': 'accessory' };
const HEX = /^#[0-9a-fA-F]{3,8}$/;

async function notion(path, token, body) {
  const res = await fetch('https://api.notion.com/v1' + path, {
    method: body ? 'POST' : 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Notion-Version': NOTION_VERSION,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Notion ${res.status}: ${json.code || ''} ${json.message || ''}`);
  return json;
}

const text = (prop) => (prop?.rich_text || prop?.title || []).map(t => t.plain_text).join('').trim();
const select = (prop) => prop?.select?.name || '';

function toProduct(page) {
  const p = page.properties || {};
  const colors = text(p['カラー']).split(/[,、\s]+/).filter(c => HEX.test(c));
  const bg = text(p['背景色']);
  const item = {
    id: text(p['商品ID']),
    name: text(p['商品名']),
    cat: CATEGORY[select(p['カテゴリ'])],
    price: p['価格']?.number,
    shape: select(p['イラスト']),
    desc: text(p['説明']),
    colors,
    bg: HEX.test(bg) ? bg : '#fff4ec',
  };
  const badge = select(p['バッジ']);
  if (badge) item.badge = badge;
  // 必須項目が欠けている商品は表示しない
  const ok = item.id && item.name && item.cat && Number.isFinite(item.price) && item.shape && colors.length;
  return ok ? item : null;
}

module.exports = async (req, res) => {
  const token = process.env.NOTION_TOKEN;
  if (!token) {
    res.status(500).json({ error: 'NOTION_TOKEN が設定されていません' });
    return;
  }
  try {
    const dbId = process.env.NOTION_DATABASE_ID || DEFAULT_DATABASE_ID;
    const db = await notion(`/databases/${dbId}`, token);
    const dataSourceId = db.data_sources?.[0]?.id;
    if (!dataSourceId) throw new Error('データソースが見つかりません');

    const pages = [];
    let cursor;
    do {
      const r = await notion(`/data_sources/${dataSourceId}/query`, token, {
        filter: { property: '公開', checkbox: { equals: true } },
        sorts: [{ property: '並び順', direction: 'ascending' }],
        start_cursor: cursor,
        page_size: 100,
      });
      pages.push(...r.results);
      cursor = r.has_more ? r.next_cursor : undefined;
    } while (cursor);

    const seen = new Set();
    const products = pages.map(toProduct).filter(x => x && !seen.has(x.id) && seen.add(x.id));

    // 1分間はキャッシュを使い、Notion への問い合わせを減らす
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    res.status(200).json({ products });
  } catch (e) {
    console.error(e);
    res.status(502).json({ error: 'Notion から商品を読み込めませんでした' });
  }
};
