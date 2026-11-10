/* =========================================================
   NEKOMO - 猫デザインのスマホグッズ販売サイト
   ========================================================= */

const INK = '#3a2e2a';
const PINK = '#f29c9c';

/* ---------- イラスト（SVG）パーツ ---------- */
function cat(cx, cy, r, fill, opt = {}) {
  const sw = Math.max(2, r * 0.07);
  const k = r;
  const sleepy = opt.sleepy;
  const eyes = sleepy
    ? `<path d="M${cx - k * .5} ${cy - k * .08} q${k * .12} ${k * .12} ${k * .24} 0 M${cx + k * .26} ${cy - k * .08} q${k * .12} ${k * .12} ${k * .24} 0" fill="none" stroke="${INK}" stroke-width="${sw}" stroke-linecap="round"/>`
    : `<ellipse cx="${cx - k * .38}" cy="${cy - k * .08}" rx="${k * .1}" ry="${k * .15}" fill="${INK}"/>
       <ellipse cx="${cx + k * .38}" cy="${cy - k * .08}" rx="${k * .1}" ry="${k * .15}" fill="${INK}"/>
       <circle cx="${cx - k * .35}" cy="${cy - k * .14}" r="${k * .035}" fill="#fff"/>
       <circle cx="${cx + k * .41}" cy="${cy - k * .14}" r="${k * .035}" fill="#fff"/>`;
  return `<g stroke-linejoin="round">
    <path d="M${cx - k * .92} ${cy - k * .25} L${cx - k * .78} ${cy - k * 1.12} L${cx - k * .22} ${cy - k * .78} Z" fill="${fill}" stroke="${INK}" stroke-width="${sw}"/>
    <path d="M${cx + k * .92} ${cy - k * .25} L${cx + k * .78} ${cy - k * 1.12} L${cx + k * .22} ${cy - k * .78} Z" fill="${fill}" stroke="${INK}" stroke-width="${sw}"/>
    <path d="M${cx - k * .72} ${cy - k * .5} L${cx - k * .68} ${cy - k * .88} L${cx - k * .42} ${cy - k * .72} Z" fill="${PINK}"/>
    <path d="M${cx + k * .72} ${cy - k * .5} L${cx + k * .68} ${cy - k * .88} L${cx + k * .42} ${cy - k * .72} Z" fill="${PINK}"/>
    <ellipse cx="${cx}" cy="${cy}" rx="${k}" ry="${k * .86}" fill="${fill}" stroke="${INK}" stroke-width="${sw}"/>
    ${eyes}
    <circle cx="${cx - k * .62}" cy="${cy + k * .2}" r="${k * .13}" fill="${PINK}" opacity=".55"/>
    <circle cx="${cx + k * .62}" cy="${cy + k * .2}" r="${k * .13}" fill="${PINK}" opacity=".55"/>
    <path d="M${cx - k * .09} ${cy + k * .1} L${cx + k * .09} ${cy + k * .1} L${cx} ${cy + k * .2} Z" fill="${PINK}" stroke="${INK}" stroke-width="${sw * .5}"/>
    <path d="M${cx - k * .2} ${cy + k * .3} Q${cx - k * .1} ${cy + k * .42} ${cx} ${cy + k * .22} Q${cx + k * .1} ${cy + k * .42} ${cx + k * .2} ${cy + k * .3}" fill="none" stroke="${INK}" stroke-width="${sw * .8}" stroke-linecap="round"/>
    <g stroke="${INK}" stroke-width="${sw * .6}" stroke-linecap="round">
      <line x1="${cx - k * .5}" y1="${cy + k * .14}" x2="${cx - k * 1.15}" y2="${cy + k * .04}"/>
      <line x1="${cx - k * .5}" y1="${cy + k * .26}" x2="${cx - k * 1.12}" y2="${cy + k * .32}"/>
      <line x1="${cx + k * .5}" y1="${cy + k * .14}" x2="${cx + k * 1.15}" y2="${cy + k * .04}"/>
      <line x1="${cx + k * .5}" y1="${cy + k * .26}" x2="${cx + k * 1.12}" y2="${cy + k * .32}"/>
    </g>
  </g>`;
}

function paw(cx, cy, s, fill) {
  return `<g fill="${fill}">
    <ellipse cx="${cx}" cy="${cy + s * .25}" rx="${s * .55}" ry="${s * .45}"/>
    <ellipse cx="${cx - s * .62}" cy="${cy - s * .3}" rx="${s * .2}" ry="${s * .26}"/>
    <ellipse cx="${cx - s * .22}" cy="${cy - s * .6}" rx="${s * .2}" ry="${s * .26}"/>
    <ellipse cx="${cx + s * .22}" cy="${cy - s * .6}" rx="${s * .2}" ry="${s * .26}"/>
    <ellipse cx="${cx + s * .62}" cy="${cy - s * .3}" rx="${s * .2}" ry="${s * .26}"/>
  </g>`;
}

const svgWrap = (inner) => `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`;

/* 商品ごとの形 */
const shapes = {
  earCase: (c) => svgWrap(`
    <path d="M62 34 L66 8 L88 22 Z M138 34 L134 8 L112 22 Z" fill="${c}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
    <rect x="56" y="18" width="88" height="168" rx="22" fill="${c}" stroke="${INK}" stroke-width="4"/>
    <rect x="68" y="32" width="30" height="30" rx="9" fill="${INK}" opacity=".85"/>
    <circle cx="76" cy="40" r="5" fill="#666"/><circle cx="90" cy="54" r="5" fill="#666"/>
    ${cat(100, 120, 30, '#fff')}
    ${paw(80, 168, 7, '#fff')}${paw(120, 168, 7, '#fff')}`),

  clearCase: (c) => svgWrap(`
    <rect x="56" y="16" width="88" height="170" rx="22" fill="#fff" fill-opacity=".7" stroke="${INK}" stroke-width="4"/>
    <rect x="68" y="30" width="30" height="30" rx="9" fill="${INK}" opacity=".85"/>
    ${paw(112, 80, 8, c)}${paw(84, 105, 8, c)}${paw(116, 132, 8, c)}${paw(88, 160, 8, c)}
    <g transform="translate(0 0)">${cat(122, 168, 16, c, { sleepy: true })}</g>`),

  notebook: (c) => svgWrap(`
    <rect x="40" y="20" width="120" height="166" rx="14" fill="${c}" stroke="${INK}" stroke-width="4"/>
    <line x1="58" y1="20" x2="58" y2="186" stroke="${INK}" stroke-width="3" opacity=".35"/>
    <rect x="148" y="92" width="22" height="26" rx="6" fill="#fff" stroke="${INK}" stroke-width="3"/>
    ${cat(106, 100, 32, '#fff')}
    <path d="M86 150 q20 14 40 0" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round"/>`),

  charger: (c) => svgWrap(`
    <ellipse cx="100" cy="150" rx="70" ry="14" fill="${INK}" opacity=".1"/>
    ${cat(100, 108, 62, c)}
    <path d="M100 70 l-10 22 h12 l-6 18" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" opacity=".9"/>
    <path d="M162 120 q30 10 22 50" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>`),

  battery: (c) => svgWrap(`
    <rect x="30" y="58" width="140" height="96" rx="20" fill="${c}" stroke="${INK}" stroke-width="4"/>
    <path d="M44 62 L52 36 L72 58 Z M156 62 L148 36 L128 58 Z" fill="${c}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
    ${cat(80, 104, 26, '#fff')}
    <g fill="#fff">${[0, 1, 2, 3].map(i => `<circle cx="${128 + (i % 2) * 18}" cy="${92 + Math.floor(i / 2) * 22}" r="6" opacity="${i < 3 ? 1 : .35}"/>`).join('')}</g>
    <path d="M168 104 q14 0 16 14" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>`),

  stand: (c) => svgWrap(`
    <rect x="74" y="18" width="66" height="120" rx="14" fill="#fff" stroke="${INK}" stroke-width="4" transform="rotate(12 107 78)"/>
    <ellipse cx="100" cy="176" rx="68" ry="12" fill="${INK}" opacity=".12"/>
    <path d="M40 176 Q40 120 100 120 Q160 120 160 176 Z" fill="${c}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
    ${cat(100, 118, 34, c)}
    ${paw(70, 168, 6, '#fff')}${paw(130, 168, 6, '#fff')}
    <path d="M158 168 q28 -4 22 -40" fill="none" stroke="${INK}" stroke-width="8" stroke-linecap="round"/>
    <path d="M158 168 q28 -4 22 -40" fill="none" stroke="${c}" stroke-width="4" stroke-linecap="round"/>`),

  grip: (c) => svgWrap(`
    <ellipse cx="100" cy="160" rx="44" ry="10" fill="${INK}" opacity=".1"/>
    <rect x="88" y="110" width="24" height="44" rx="6" fill="#ddd" stroke="${INK}" stroke-width="4"/>
    <circle cx="100" cy="92" r="64" fill="${c}" stroke="${INK}" stroke-width="4"/>
    ${paw(100, 92, 30, '#fff')}`),

  strap: (c) => svgWrap(`
    <path d="M100 14 C40 14 40 100 100 104 C160 100 160 14 100 14 Z" fill="none" stroke="${c}" stroke-width="9"/>
    <path d="M100 14 C40 14 40 100 100 104 C160 100 160 14 100 14 Z" fill="none" stroke="${INK}" stroke-width="2" stroke-dasharray="4 8"/>
    <rect x="92" y="100" width="16" height="16" rx="4" fill="#c9b59a" stroke="${INK}" stroke-width="3"/>
    <line x1="100" y1="116" x2="100" y2="128" stroke="${INK}" stroke-width="3"/>
    ${cat(100, 158, 30, c)}
    <circle cx="100" cy="194" r="0"/>`),

  earbuds: (c) => svgWrap(`
    <ellipse cx="100" cy="176" rx="60" ry="10" fill="${INK}" opacity=".1"/>
    ${cat(100, 112, 60, c)}
    <path d="M44 112 Q100 128 156 112" fill="none" stroke="${INK}" stroke-width="3" opacity=".35"/>
    <circle cx="160" cy="70" r="5" fill="#ffd25e" stroke="${INK}" stroke-width="2"/>`),

  cable: (c) => svgWrap(`
    <path d="M10 150 C60 120 140 120 190 150" fill="none" stroke="${INK}" stroke-width="6" stroke-linecap="round" opacity=".35"/>
    <rect x="24" y="128" width="152" height="36" rx="18" fill="${c}" stroke="${INK}" stroke-width="4"/>
    ${cat(56, 108, 20, '#fff')}${cat(100, 104, 20, c === '#4a4a4a' ? '#f5c27a' : '#4a4a4a')}${cat(144, 108, 20, '#f5c27a')}`),
};

/* ---------- 商品データ ---------- */
const CATEGORY_LABEL = { case: 'ケース', charge: '充電グッズ', accessory: 'アクセサリー' };

const products = [
  { id: 'p01', name: 'ねこ耳スマホケース', cat: 'case', price: 3280, shape: 'earCase', badge: 'NEW',
    desc: 'ぴょこんと飛び出た猫耳がポイント。耐衝撃TPU素材で落下にも強い。',
    colors: ['#f4a261', '#9fc5e8', '#b8a9d9', '#4a4a4a'], bg: '#fff1e4' },
  { id: 'p02', name: '肉球クリアケース', cat: 'case', price: 2480, shape: 'clearCase', badge: '人気',
    desc: 'スマホの色を活かすクリア素材に、てくてく歩く肉球をプリント。',
    colors: ['#ef7d57', '#e98fb0', '#6fa8a0'], bg: '#fdeef0' },
  { id: 'p03', name: 'ねこ手帳型ケース', cat: 'case', price: 3980, shape: 'notebook',
    desc: 'カード2枚収納。フタを開けるとにっこり猫がお出迎え。',
    colors: ['#c98f6a', '#7c9cbf', '#a3b18a'], bg: '#f6efe6' },
  { id: 'p04', name: 'ねこ型ワイヤレス充電器', cat: 'charge', price: 4580, shape: 'charger', badge: '人気',
    desc: '置くだけで充電できるQi対応15W。デスクに猫がいる幸せ。',
    colors: ['#f7f1e8', '#f4a261', '#4a4a4a'], bg: '#eef4f8' },
  { id: 'p05', name: 'にゃんこモバイルバッテリー', cat: 'charge', price: 3980,
    shape: 'battery', desc: '10000mAh・PSE適合。猫耳つきのコンパクトボディ。',
    colors: ['#9fc5e8', '#f6c1c1', '#f5d77a'], bg: '#f0f6fb' },
  { id: 'p06', name: 'ねこのスマホスタンド', cat: 'accessory', price: 2280, shape: 'stand',
    desc: '猫の背中にスマホを立てかけて。動画視聴やビデオ通話に。',
    colors: ['#c98f6a', '#f7f1e8', '#7a7a7a'], bg: '#f7f0e8' },
  { id: 'p07', name: '肉球スマホグリップ', cat: 'accessory', price: 1480, shape: 'grip', badge: 'NEW',
    desc: '指にフィットするぷにぷに肉球グリップ。スタンドにもなります。',
    colors: ['#e98fb0', '#ef7d57', '#6fa8a0', '#4a4a4a'], bg: '#fdf0f4' },
  { id: 'p08', name: 'ねこチャームストラップ', cat: 'accessory', price: 1980, shape: 'strap',
    desc: '肩掛け・手首どちらもOKの2WAY。揺れる猫チャームつき。',
    colors: ['#ef7d57', '#7c9cbf', '#a3b18a'], bg: '#fff4ec' },
  { id: 'p09', name: 'ねこ顔イヤホンケース', cat: 'accessory', price: 1880, shape: 'earbuds',
    desc: 'ワイヤレスイヤホンをすっぽり収納。シリコン製でやわらか。',
    colors: ['#f7f1e8', '#f5d77a', '#b8a9d9'], bg: '#f6f2fb' },
  { id: 'p10', name: '3匹ねこケーブルホルダー', cat: 'charge', price: 1280, shape: 'cable',
    desc: 'デスクの充電ケーブルを3匹の猫がしっかりキャッチ。',
    colors: ['#f4a261', '#9fc5e8', '#4a4a4a'], bg: '#f3f7f1' },
];

const selectedColor = {};
products.forEach(p => (selectedColor[p.id] = 0));

/* ---------- ユーティリティ ---------- */
const $ = (s) => document.querySelector(s);
const yen = (n) => '¥' + n.toLocaleString('ja-JP');
const FREE_SHIPPING = 5000;
const SHIPPING_FEE = 600;

function store(key, val) {
  try {
    if (val === undefined) return JSON.parse(localStorage.getItem(key));
    localStorage.setItem(key, JSON.stringify(val));
  } catch (e) { return null; }
}

/* ---------- 商品一覧の描画 ---------- */
let currentFilter = 'all';

function renderProducts() {
  const grid = $('#productGrid');
  const list = products.filter(p => currentFilter === 'all' || p.cat === currentFilter);
  grid.innerHTML = list.map((p, i) => {
    const color = p.colors[selectedColor[p.id]];
    const badge = p.badge ? `<span class="card__badge ${p.badge === 'NEW' ? 'card__badge--new' : ''}">${p.badge}</span>` : '';
    return `
      <article class="card" style="animation-delay:${i * 40}ms">
        <div class="card__img" style="background:${p.bg}" id="img-${p.id}">${badge}${shapes[p.shape](color)}</div>
        <div class="card__body">
          <span class="card__cat">${CATEGORY_LABEL[p.cat]}</span>
          <h3 class="card__name">${p.name}</h3>
          <p class="card__desc">${p.desc}</p>
          <div class="card__colors" aria-label="カラー選択">
            ${p.colors.map((c, ci) => `<button class="swatch ${ci === selectedColor[p.id] ? 'is-active' : ''}" style="background:${c}" data-id="${p.id}" data-ci="${ci}" aria-label="カラー${ci + 1}"></button>`).join('')}
          </div>
          <div class="card__foot">
            <span class="card__price">${yen(p.price)}<small>税込</small></span>
            <button class="add-btn" data-add="${p.id}">カートに入れる</button>
          </div>
        </div>
      </article>`;
  }).join('');
}

$('#filters').addEventListener('click', (e) => {
  const btn = e.target.closest('.filter');
  if (!btn) return;
  document.querySelectorAll('.filter').forEach(b => b.classList.toggle('is-active', b === btn));
  currentFilter = btn.dataset.cat;
  renderProducts();
});

$('#productGrid').addEventListener('click', (e) => {
  const sw = e.target.closest('.swatch');
  if (sw) {
    const p = products.find(x => x.id === sw.dataset.id);
    selectedColor[p.id] = +sw.dataset.ci;
    const img = $('#img-' + p.id);
    const badge = img.querySelector('.card__badge');
    img.innerHTML = (badge ? badge.outerHTML : '') + shapes[p.shape](p.colors[selectedColor[p.id]]);
    sw.parentElement.querySelectorAll('.swatch').forEach(s => s.classList.toggle('is-active', s === sw));
    return;
  }
  const add = e.target.closest('[data-add]');
  if (add) addToCart(add.dataset.add, selectedColor[add.dataset.add]);
});

/* ---------- カート ---------- */
let cart = store('nekomo-cart') || []; // [{id, ci, qty}]

function addToCart(id, ci) {
  const item = cart.find(x => x.id === id && x.ci === ci);
  if (item) item.qty++;
  else cart.push({ id, ci, qty: 1 });
  saveCart();
  const p = products.find(x => x.id === id);
  showToast(`🐾 「${p.name}」をカートに追加しました`);
  const count = $('#cartCount');
  count.classList.remove('bump'); void count.offsetWidth; count.classList.add('bump');
}

function saveCart() {
  cart = cart.filter(x => x.qty > 0);
  store('nekomo-cart', cart);
  renderCart();
}

function renderCart() {
  const totalQty = cart.reduce((s, x) => s + x.qty, 0);
  $('#cartCount').textContent = totalQty;

  const body = $('#cartItems');
  if (!cart.length) {
    body.innerHTML = `<div class="drawer__empty">${svgWrap(cat(100, 110, 60, '#f7f1e8', { sleepy: true }))}<p>カートは空っぽです…</p></div>`;
  } else {
    body.innerHTML = cart.map((x, idx) => {
      const p = products.find(pp => pp.id === x.id);
      return `
        <div class="cart-item">
          <div class="cart-item__img" style="background:${p.bg}">${shapes[p.shape](p.colors[x.ci])}</div>
          <div>
            <div class="cart-item__name">${p.name}</div>
            <div class="cart-item__price">${yen(p.price)} / カラー${x.ci + 1}</div>
            <div class="qty">
              <button data-dec="${idx}" aria-label="減らす">−</button>
              <span>${x.qty}</span>
              <button data-inc="${idx}" aria-label="増やす">＋</button>
            </div>
          </div>
          <button class="cart-item__remove" data-rm="${idx}">削除</button>
        </div>`;
    }).join('');
  }

  const subtotal = cart.reduce((s, x) => s + products.find(p => p.id === x.id).price * x.qty, 0);
  const shipping = subtotal === 0 || subtotal >= FREE_SHIPPING ? 0 : SHIPPING_FEE;
  $('#subtotal').textContent = yen(subtotal);
  $('#shipping').textContent = subtotal >= FREE_SHIPPING ? '無料' : yen(shipping);
  $('#total').textContent = yen(subtotal + shipping);
  $('#shippingNote').textContent = subtotal > 0 && subtotal < FREE_SHIPPING
    ? `あと ${yen(FREE_SHIPPING - subtotal)} で送料無料！` : '';
  $('#checkoutBtn').disabled = !cart.length;
  $('#checkoutBtn').style.opacity = cart.length ? 1 : .5;
}

$('#cartItems').addEventListener('click', (e) => {
  const t = e.target;
  if (t.dataset.inc) cart[t.dataset.inc].qty++;
  else if (t.dataset.dec) cart[t.dataset.dec].qty--;
  else if (t.dataset.rm) cart[t.dataset.rm].qty = 0;
  else return;
  saveCart();
});

function openCart(open) {
  $('#drawer').classList.toggle('is-open', open);
  $('#overlay').classList.toggle('is-open', open);
}
$('#cartOpen').addEventListener('click', () => openCart(true));
$('#cartClose').addEventListener('click', () => openCart(false));
$('#overlay').addEventListener('click', () => openCart(false));
document.addEventListener('keydown', (e) => e.key === 'Escape' && openCart(false));

$('#checkoutBtn').addEventListener('click', () => {
  // TODO: 決済サービス（Stripe / Shopify など）と連携する
  alert('決済機能は現在準備中です。\n（Stripe や Shopify などの決済サービスと連携して実装します）');
});

/* ---------- その他 ---------- */
let toastTimer;
function showToast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('is-show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('is-show'), 2200);
}

$('#menuBtn').addEventListener('click', () => $('#nav').classList.toggle('is-open'));
$('#nav').addEventListener('click', (e) => e.target.tagName === 'A' && $('#nav').classList.remove('is-open'));

$('#newsletterForm').addEventListener('submit', (e) => {
  e.preventDefault();
  e.target.reset();
  showToast('📮 ご登録ありがとうございます！');
});

/* ロゴ・ヒーロー画像 */
$('#logoIcon').innerHTML = svgWrap(cat(100, 115, 72, '#ef7d57'));
$('#heroVisual').innerHTML = `<svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
  <g transform="rotate(-8 200 200)">
    <path d="M128 70 L134 30 L168 52 Z M272 70 L266 30 L232 52 Z" fill="#f4a261" stroke="${INK}" stroke-width="6" stroke-linejoin="round"/>
    <rect x="118" y="50" width="164" height="310" rx="38" fill="#f4a261" stroke="${INK}" stroke-width="6"/>
    <rect x="140" y="76" width="54" height="54" rx="16" fill="${INK}" opacity=".85"/>
    <circle cx="155" cy="91" r="9" fill="#666"/><circle cx="179" cy="115" r="9" fill="#666"/>
    ${cat(200, 225, 58, '#fff')}
    ${paw(165, 318, 12, '#fff')}${paw(235, 318, 12, '#fff')}
  </g>
  ${paw(58, 120, 18, '#ef7d57')}${paw(345, 300, 16, '#f4a261')}${paw(330, 80, 11, '#e98fb0')}
  ${cat(70, 320, 38, '#4a4a4a', { sleepy: true })}
</svg>`;

renderProducts();
renderCart();
