"use strict";

const STATUS_LABELS = {
  available: "販売中",
  order: "受注制作",
  soldout: "売り切れ",
};

const VIEW_LABELS = {
  home: "",
  works: "作品一覧",
  cart: "カート",
  company: "会社情報",
};

const PICKUP_COUNT = 4;
const CART_STORAGE_KEY = "handmade-catalog-cart";
const MAX_QUANTITY = 99;
const FILTER_ALL = "all";

const dialogEl = document.getElementById("work-dialog");
const dialogBodyEl = document.getElementById("dialog-body");

let shopName = "作品カタログ";
let cart = new Map(); // 作品 id → 数量
let dialogWork = null;
let workFilter = FILTER_ALL;

/* ---------- 共通 ---------- */

function formatYen(amount) {
  return `¥${new Intl.NumberFormat("ja-JP").format(amount)}(税込)`;
}

function hasPrice(work) {
  return typeof work.price === "number" && Number.isFinite(work.price);
}

function formatPrice(work) {
  return hasPrice(work) ? formatYen(work.price) : "";
}

function createFallback() {
  const fallback = document.createElement("div");
  fallback.className = "image-fallback";
  fallback.textContent = "画像なし";
  return fallback;
}

// 画像がない、または読み込めないときは「画像なし」に置き換える
function createImage(src, alt, lazy) {
  if (!src) return createFallback();
  const img = document.createElement("img");
  img.alt = alt;
  if (lazy) img.loading = "lazy";
  img.addEventListener("error", () => img.replaceWith(createFallback()));
  img.src = src;
  return img;
}

// 未知の status のときは null を返し、バッジを出さない
function createStatusBadge(status) {
  if (!Object.hasOwn(STATUS_LABELS, status)) return null;
  const badge = document.createElement("span");
  badge.className = `status-badge status-${status}`;
  badge.textContent = STATUS_LABELS[status];
  return badge;
}

function getImages(work) {
  return Array.isArray(work.images) ? work.images.filter(Boolean) : [];
}

/* ---------- カート ---------- */

function canAddToCart(work) {
  return Boolean(work.id) && hasPrice(work) && (work.status === "available" || work.status === "order");
}

function saveCart() {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(Object.fromEntries(cart)));
  } catch {
    // 保存できない環境でも、ページを開いている間はカートを使える
  }
}

// 保存された内容のうち、今も存在する作品と正しい数量だけを読み込む
function loadCart() {
  const loaded = new Map();
  try {
    const saved = JSON.parse(localStorage.getItem(CART_STORAGE_KEY));
    if (saved && typeof saved === "object") {
      Object.entries(saved).forEach(([id, quantity]) => {
        if (Number.isInteger(quantity) && quantity > 0 && WORKS.some((work) => work.id === id)) {
          loaded.set(id, Math.min(quantity, MAX_QUANTITY));
        }
      });
    }
  } catch {
    // 読めない内容は空のカートとして扱う
  }
  return loaded;
}

function getCartLines() {
  return [...cart].map(([id, quantity]) => {
    const work = WORKS.find((candidate) => candidate.id === id);
    return { work, quantity, purchasable: canAddToCart(work) };
  });
}

function updateCartCount() {
  const count = getCartLines()
    .filter((line) => line.purchasable)
    .reduce((sum, line) => sum + line.quantity, 0);
  const countEl = document.getElementById("cart-count");
  countEl.textContent = String(count);
  countEl.hidden = count === 0;
  document.getElementById("nav-cart").setAttribute("aria-label", count ? `カート(${count}点)` : "カート");
}

function setQuantity(id, quantity) {
  if (quantity <= 0) cart.delete(id);
  else cart.set(id, Math.min(quantity, MAX_QUANTITY));
  saveCart();
  updateCartCount();
  renderCart();
}

function createCartButton(id, action, text, label, onClick) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = action === "remove" ? "cart-remove" : "quantity-button";
  button.dataset.id = id;
  button.dataset.action = action;
  button.textContent = text;
  button.setAttribute("aria-label", label);
  button.addEventListener("click", onClick);
  return button;
}

function createCartRow({ work, quantity, purchasable }) {
  const name = work.name || "";
  const row = document.createElement("li");
  row.className = "cart-row";

  const image = document.createElement("div");
  image.className = "cart-row-image";
  image.append(createImage(getImages(work)[0], name, false));

  const info = document.createElement("div");
  info.className = "cart-row-info";
  const title = document.createElement("p");
  title.className = "cart-row-name";
  title.textContent = name;
  const price = document.createElement("p");
  price.className = "cart-row-price";
  price.textContent = formatPrice(work);
  info.append(title, price);

  const controls = document.createElement("div");
  controls.className = "cart-row-controls";
  if (purchasable) {
    const minus = createCartButton(work.id, "minus", "−", `${name}を1つ減らす`, () => setQuantity(work.id, quantity - 1));
    minus.disabled = quantity <= 1;
    const value = document.createElement("span");
    value.className = "quantity-value";
    value.textContent = String(quantity);
    const plus = createCartButton(work.id, "plus", "+", `${name}を1つ増やす`, () => setQuantity(work.id, quantity + 1));
    plus.disabled = quantity >= MAX_QUANTITY;
    controls.append(minus, value, plus);
  } else {
    // カートに入れたあとで売り切れになった作品は、合計に含めない
    const notice = document.createElement("span");
    notice.className = "cart-row-notice";
    notice.textContent = "現在ご購入いただけません";
    controls.append(notice);
  }
  controls.append(createCartButton(work.id, "remove", "削除", `${name}をカートから削除`, () => setQuantity(work.id, 0)));

  info.append(controls);
  row.append(image, info);
  return row;
}

// 描き直しでボタンが作り直されるので、操作していたボタンへフォーカスを戻す
function restoreCartFocus(id, action) {
  const findButton = (name) => document.querySelector(`#cart-list button[data-id="${CSS.escape(id)}"][data-action="${name}"]`);
  let target = findButton(action);
  if (target && target.disabled) target = findButton(action === "minus" ? "plus" : "minus");
  (target || document.getElementById("cart-title")).focus();
}

function renderCart() {
  const active = document.activeElement;
  const focusId = active && active.closest && active.closest("#cart-list") ? active.dataset.id : null;
  const focusAction = focusId ? active.dataset.action : null;

  const lines = getCartLines();
  document.getElementById("cart-list").replaceChildren(...lines.map(createCartRow));
  document.getElementById("cart-empty").hidden = lines.length > 0;

  const purchasable = lines.filter((line) => line.purchasable);
  document.getElementById("cart-summary").hidden = purchasable.length === 0;
  const total = purchasable.reduce((sum, line) => sum + line.work.price * line.quantity, 0);
  document.getElementById("cart-total").textContent = formatYen(total);

  if (focusId) restoreCartFocus(focusId, focusAction);
}

function addDialogWorkToCart() {
  const id = dialogWork.id;
  const current = cart.get(id) || 0;
  const noteEl = document.getElementById("dialog-cart-note");
  if (current >= MAX_QUANTITY) {
    noteEl.textContent = `1つの作品につき${MAX_QUANTITY}点までです。`;
  } else {
    setQuantity(id, current + 1);
    noteEl.textContent = `カートに入れました(この作品 ${current + 1}点)`;
  }
  document.getElementById("dialog-cart-link").hidden = false;
}

/* ---------- 作品カード ---------- */

function createCard(work) {
  const item = document.createElement("li");
  const card = document.createElement("button");
  card.type = "button";
  card.className = "work-card";
  if (work.status === "soldout") card.classList.add("is-soldout");

  const imageWrap = document.createElement("span");
  imageWrap.className = "work-card-image";
  imageWrap.append(createImage(getImages(work)[0], work.name || "", true));
  const badge = createStatusBadge(work.status);
  if (badge) imageWrap.append(badge);

  const name = document.createElement("span");
  name.className = "work-card-name";
  name.textContent = work.name || "";

  const price = document.createElement("span");
  price.className = "work-card-price";
  price.textContent = formatPrice(work);

  card.append(imageWrap, name, price);
  card.addEventListener("click", () => openDialog(work));
  item.append(card);
  return item;
}

/* ---------- 作品詳細 ---------- */

function showDialogImage(work, images, index) {
  const label = work.name || "";
  document.getElementById("dialog-image").replaceChildren(createImage(images[index], label, false));
  document.querySelectorAll(".dialog-thumb").forEach((thumb, i) => {
    if (i === index) thumb.setAttribute("aria-current", "true");
    else thumb.removeAttribute("aria-current");
  });
}

function renderThumbs(work, images) {
  const thumbsEl = document.getElementById("dialog-thumbs");
  thumbsEl.replaceChildren();
  if (images.length < 2) return;
  images.forEach((src, index) => {
    const thumb = document.createElement("button");
    thumb.type = "button";
    thumb.className = "dialog-thumb";
    thumb.setAttribute("aria-label", `画像 ${index + 1} / ${images.length} を表示`);
    thumb.append(createImage(src, "", true));
    thumb.addEventListener("click", () => showDialogImage(work, images, index));
    thumbsEl.append(thumb);
  });
}

function renderSpecs(work) {
  const specsEl = document.getElementById("dialog-specs");
  specsEl.replaceChildren();
  [["素材", work.material], ["サイズ", work.size]].forEach(([label, value]) => {
    if (!value) return;
    const term = document.createElement("dt");
    term.textContent = label;
    const detail = document.createElement("dd");
    detail.textContent = value;
    specsEl.append(term, detail);
  });
}

function renderDialogActions(work) {
  const addButton = document.getElementById("dialog-add");
  const addable = canAddToCart(work);
  addButton.disabled = !addable;
  addButton.textContent = addable ? "カートに入れる" : "現在ご購入いただけません";
  document.getElementById("dialog-cart-note").textContent = "";
  document.getElementById("dialog-cart-link").hidden = true;
}

function openDialog(work) {
  dialogWork = work;
  const images = getImages(work);
  renderThumbs(work, images);
  showDialogImage(work, images, 0);

  const statusEl = document.getElementById("dialog-status");
  const badge = createStatusBadge(work.status);
  statusEl.replaceChildren(...(badge ? [badge] : []));

  document.getElementById("dialog-title").textContent = work.name || "";
  document.getElementById("dialog-price").textContent = formatPrice(work);
  document.getElementById("dialog-description").textContent = work.description || "";
  renderSpecs(work);
  renderDialogActions(work);

  dialogEl.showModal();
  dialogBodyEl.scrollTop = 0;
}

/* ---------- 画面の切り替え ---------- */

function currentRoute() {
  const route = location.hash.slice(1);
  return Object.hasOwn(VIEW_LABELS, route) ? route : "home";
}

function showView(moveFocus) {
  const route = currentRoute();
  if (dialogEl.open) dialogEl.close();

  Object.keys(VIEW_LABELS).forEach((name) => {
    document.getElementById(`view-${name}`).hidden = name !== route;
  });
  document.querySelectorAll(".nav-button").forEach((button) => {
    if (button.dataset.route === route) button.setAttribute("aria-current", "page");
    else button.removeAttribute("aria-current");
  });
  document.title = VIEW_LABELS[route] ? `${VIEW_LABELS[route]} | ${shopName}` : shopName;

  if (route === "cart") renderCart();
  if (moveFocus) {
    window.scrollTo(0, 0);
    document.getElementById(`${route}-title`).focus({ preventScroll: true });
  }
}

/* ---------- 初期化 ---------- */

function renderShop(shop) {
  shopName = shop.name || shopName;
  document.getElementById("brand").textContent = shopName;
  document.getElementById("home-title").textContent = shopName;
  document.getElementById("shop-description").textContent = shop.description || "";
  document.getElementById("footer-text").textContent = `© ${shopName}`;
  renderContact(shop);
}

function renderContact(shop) {
  const contactEl = document.getElementById("shop-contact");
  const addRow = (label, content) => {
    const term = document.createElement("dt");
    term.textContent = label;
    const detail = document.createElement("dd");
    detail.append(content);
    contactEl.append(term, detail);
  };

  if (shop.owner) addRow("責任者", shop.owner);
  if (shop.address) addRow("住所", shop.address);
  if (shop.phone) {
    const link = document.createElement("a");
    link.href = `tel:${shop.phone.replace(/[^\d+]/g, "")}`;
    link.textContent = shop.phone;
    addRow("電話番号", link);
  }
  const isEmpty = contactEl.childElementCount === 0;
  contactEl.hidden = isEmpty;
  document.getElementById("company-empty").hidden = !isEmpty;
}

function renderWorkList() {
  const works = workFilter === FILTER_ALL ? WORKS : WORKS.filter((work) => work.status === workFilter);
  document.getElementById("work-list").replaceChildren(...works.map(createCard));

  const emptyEl = document.getElementById("works-empty");
  emptyEl.textContent = WORKS.length === 0 ? "作品を準備中です。" : "該当する作品はありません。";
  emptyEl.hidden = works.length > 0;
}

function setWorkFilter(filter) {
  workFilter = filter;
  document.querySelectorAll(".filter-button").forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.filter === filter));
  });
  renderWorkList();
  const label = filter === FILTER_ALL ? "すべて" : STATUS_LABELS[filter];
  const count = document.getElementById("work-list").childElementCount;
  document.getElementById("works-result").textContent = `${label}の作品を${count}点表示しています`;
}

function renderWorkFilter() {
  const filterEl = document.getElementById("work-filter");
  const options = [[FILTER_ALL, "すべて"], ...Object.entries(STATUS_LABELS)];
  filterEl.replaceChildren(...options.map(([filter, label]) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "filter-button";
    button.dataset.filter = filter;
    button.textContent = label;
    button.setAttribute("aria-pressed", String(filter === workFilter));
    button.addEventListener("click", () => setWorkFilter(filter));
    return button;
  }));
  filterEl.hidden = WORKS.length === 0;
}

function renderWorks() {
  renderWorkFilter();
  renderWorkList();
  document.getElementById("pickup-list").append(...WORKS.slice(0, PICKUP_COUNT).map(createCard));
  document.getElementById("pickup").hidden = WORKS.length === 0;
}

function init() {
  document.getElementById("dialog-close").addEventListener("click", () => dialogEl.close());
  document.getElementById("dialog-add").addEventListener("click", addDialogWorkToCart);
  // ダイアログの中身は全面を覆っているので、target が dialog 自身なら背景のクリック
  dialogEl.addEventListener("click", (event) => {
    if (event.target === dialogEl) dialogEl.close();
  });

  // works.js の書き間違いがあると SHOP / WORKS が定義されない
  if (typeof SHOP === "undefined" || typeof WORKS === "undefined" || !Array.isArray(WORKS)) {
    const messageEl = document.getElementById("message");
    messageEl.textContent = "作品データを読み込めませんでした。works.js の書き方を確認してください。";
    messageEl.hidden = false;
    return;
  }

  renderShop(SHOP);
  renderWorks();
  cart = loadCart();
  updateCartCount();

  window.addEventListener("hashchange", () => showView(true));
  // 別のタブでカートを変更したときに反映する
  window.addEventListener("storage", (event) => {
    if (event.key !== CART_STORAGE_KEY) return;
    cart = loadCart();
    updateCartCount();
    renderCart();
  });
  showView(false);
}

init();
