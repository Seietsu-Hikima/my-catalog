"use strict";

// 管理画面: Notion の作品データベースを admin.ps1 経由で読み書きします。
// トークンはサーバー側(admin.ps1)だけが持ち、このファイルには出てきません。

const ERROR_MESSAGES = {
  config_missing_token: "NOTION_TOKEN が設定されていません。ADMIN.md の手順で設定してください。",
  config_missing_database: "NOTION_DATABASE_ID が設定されていません。ADMIN.md の手順で設定してください。",
  config_bad_database: "NOTION_DATABASE_ID の形が正しくありません。データベースのURLか32桁のIDを設定してください。",
  notion_unauthorized: "Notion のトークンが正しくありません。NOTION_TOKEN を確認してください。",
  notion_forbidden: "Notion のデータベースにアクセスできません。データベースの「接続」にインテグレーションを追加してください。",
  notion_not_found: "Notion のデータベースが見つかりません。NOTION_DATABASE_ID と「接続」を確認してください。",
  notion_bad_request: "Notion が内容を受け付けませんでした。入力内容とデータベースの列名を確認してください。",
  notion_rate_limited: "Notion が混み合っています。少し待ってからもう一度お試しください。",
  notion_conflict: "Notion で同時に更新されました。もう一度お試しください。",
  notion_error: "Notion でエラーが起きました。少し待ってからもう一度お試しください。",
  network: "Notion につながりません。インターネット接続を確認してください。",
  not_found: "その作品は見つかりませんでした（すでに削除されたかもしれません）。一覧を再読み込みします。",
  bad_id: "対象の作品を1件に特定できませんでした。",
  bad_price: "価格は数字で入力してください。",
  bad_category: "カテゴリが長すぎます（100文字まで）。",
  bad_photo: "写真URLが長すぎます。",
  bad_json: "送信内容を読み取れませんでした。",
  too_large: "入力内容が長すぎます。",
  forbidden: "この操作は管理画面からだけ行えます。",
};
const NOT_ADMIN_SERVER = "管理用サーバーにつながりません。start-admin.cmd を起動して http://localhost:3001/admin/ を開いてください。";
const DEFAULT_CATEGORIES = ["アクセサリー", "布小物", "雑貨"];

const $ = (id) => document.getElementById(id);
const els = {
  add: $("add"), reload: $("reload"),
  notice: $("notice"), error: $("error"), loading: $("loading"), empty: $("empty"),
  tableWrap: $("table-wrap"), rows: $("rows"),
  formDialog: $("form-dialog"), form: $("work-form"), formTitle: $("form-title"),
  name: $("f-name"), category: $("f-category"), price: $("f-price"), photo: $("f-photo"),
  description: $("f-description"), categoryOptions: $("category-options"),
  priceError: $("price-error"), photoPreview: $("photo-preview"),
  formError: $("form-error"), formSave: $("form-save"), formCancel: $("form-cancel"),
  deleteDialog: $("delete-dialog"), deleteName: $("delete-name"), deleteError: $("delete-error"),
  deleteConfirm: $("delete-confirm"), deleteCancel: $("delete-cancel"),
};

let works = [];
let editingId = null;   // 編集中の作品(1件)の id。null なら新規追加
let deletingId = null;  // 削除確認中の作品(1件)の id
let noticeTimer = null;

class ApiError extends Error {}

async function api(method, path, body) {
  const options = { method, headers: { "X-Requested-With": "admin" } };
  if (body !== undefined) {
    options.headers["Content-Type"] = "application/json";
    options.body = JSON.stringify(body);
  }
  let res;
  try {
    res = await fetch(path, options);
  } catch {
    throw new ApiError(NOT_ADMIN_SERVER);
  }
  let data = null;
  try { data = await res.json(); } catch { data = null; }
  if (!res.ok || data === null) {
    const code = data && data.error;
    if (!code) throw new ApiError(NOT_ADMIN_SERVER);
    const err = new ApiError(ERROR_MESSAGES[code] || "うまくいきませんでした。もう一度お試しください。");
    err.code = code;
    throw err;
  }
  return data;
}

function show(el, visible) { el.hidden = !visible; }

function showNotice(text) {
  els.notice.textContent = text;
  show(els.notice, true);
  clearTimeout(noticeTimer);
  noticeTimer = setTimeout(() => show(els.notice, false), 4000);
}

function showError(text) {
  els.error.textContent = text;
  show(els.error, Boolean(text));
}

function formatPrice(price) {
  if (price === null || price === undefined || price === "") return "—";
  return Number(price).toLocaleString("ja-JP") + "円";
}

function statusClass(status) {
  if (status === "公開中") return "badge badge-public";
  if (status === "受注制作") return "badge badge-order";
  if (status === "売り切れ") return "badge badge-soldout";
  return "badge";
}

function render() {
  els.rows.replaceChildren();
  show(els.loading, false);
  show(els.empty, works.length === 0);
  show(els.tableWrap, works.length > 0);

  for (const work of works) {
    const tr = document.createElement("tr");
    tr.dataset.id = work.id;

    const name = document.createElement("td");
    name.className = "cell-name";
    name.textContent = work.name || "（名前なし）";
    if (!work.name) name.classList.add("muted");

    const category = document.createElement("td");
    category.textContent = work.category || "—";

    const price = document.createElement("td");
    price.className = "num";
    price.textContent = formatPrice(work.price);

    const status = document.createElement("td");
    const badge = document.createElement("span");
    badge.className = statusClass(work.status);
    badge.textContent = work.status || "—";
    status.append(badge);

    const actions = document.createElement("td");
    actions.className = "cell-actions";
    const edit = document.createElement("button");
    edit.type = "button";
    edit.className = "secondary-button small";
    edit.textContent = "編集";
    edit.setAttribute("aria-label", `${work.name || "名前なし"} を編集`);
    edit.addEventListener("click", () => openForm(work.id));
    const del = document.createElement("button");
    del.type = "button";
    del.className = "danger-outline-button small";
    del.textContent = "削除";
    del.setAttribute("aria-label", `${work.name || "名前なし"} を削除`);
    del.addEventListener("click", () => openDelete(work.id));
    actions.append(edit, del);

    tr.append(name, category, price, status, actions);
    els.rows.append(tr);
  }

  const categories = new Set(DEFAULT_CATEGORIES);
  for (const w of works) if (w.category) categories.add(w.category);
  els.categoryOptions.replaceChildren(...[...categories].map((c) => {
    const o = document.createElement("option");
    o.value = c;
    return o;
  }));
}

async function loadWorks() {
  showError("");
  els.reload.disabled = true;
  if (works.length === 0) { show(els.loading, true); show(els.empty, false); }
  try {
    const data = await api("GET", "/api/works");
    works = Array.isArray(data.works) ? data.works : [];
    render();
  } catch (e) {
    show(els.loading, false);
    showError(e.message);
  } finally {
    els.reload.disabled = false;
  }
}

// 全角数字・カンマ・「円」「¥」を取り除いて数値にします。空欄なら null。
function parsePrice(text) {
  const t = text
    .replace(/[０-９．]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
    .replace(/[,，\s円¥￥]/g, "");
  if (t === "") return { ok: true, value: null };
  if (!/^\d+(\.\d+)?$/.test(t)) return { ok: false };
  return { ok: true, value: Number(t) };
}

function photoSrc(url) {
  const u = url.trim();
  if (!u) return "";
  if (/^https?:\/\//i.test(u)) return u;
  if (/^[a-z][a-z0-9+.-]*:/i.test(u)) return ""; // http(s) 以外の形式は表示しない
  return "/" + u.replace(/^(\.\/|\/)+/, "");
}

function updatePreview() {
  const src = photoSrc(els.photo.value);
  const img = els.photoPreview.querySelector("img");
  if (!src) { show(els.photoPreview, false); img.removeAttribute("src"); return; }
  img.onload = () => show(els.photoPreview, true);
  img.onerror = () => show(els.photoPreview, false);
  img.src = src;
}

function openForm(id) {
  const work = id ? works.find((w) => w.id === id) : null;
  if (id && !work) return;
  editingId = work ? work.id : null;
  els.formTitle.textContent = work ? "作品を編集" : "作品を追加";
  els.name.value = work ? work.name : "";
  els.category.value = work ? work.category : "";
  els.price.value = work && work.price !== null && work.price !== undefined ? String(work.price) : "";
  els.photo.value = work ? work.photo : "";
  els.description.value = work ? work.description : "";
  show(els.priceError, false);
  els.price.removeAttribute("aria-invalid");
  show(els.formError, false);
  els.formSave.disabled = false;
  els.formSave.textContent = "保存";
  updatePreview();
  els.formDialog.showModal();
  els.name.focus();
}

async function saveForm(event) {
  event.preventDefault();
  const price = parsePrice(els.price.value);
  if (!price.ok) {
    show(els.priceError, true);
    els.price.setAttribute("aria-invalid", "true");
    els.price.focus();
    return;
  }
  show(els.priceError, false);
  els.price.removeAttribute("aria-invalid");

  const body = {
    name: els.name.value.trim(),
    category: els.category.value.trim(),
    price: price.value,
    photo: els.photo.value.trim(),
    description: els.description.value,
  };
  const targetId = editingId;
  els.formSave.disabled = true;
  els.formSave.textContent = "保存中…";
  show(els.formError, false);
  try {
    if (targetId) {
      await api("PATCH", `/api/works/${encodeURIComponent(targetId)}`, body);
    } else {
      await api("POST", "/api/works", body);
    }
    els.formDialog.close();
    showNotice(targetId ? "保存しました" : "追加しました");
    await loadWorks();
  } catch (e) {
    els.formError.textContent = e.message;
    show(els.formError, true);
    if (e.code === "not_found") loadWorks();
  } finally {
    els.formSave.disabled = false;
    els.formSave.textContent = "保存";
  }
}

function openDelete(id) {
  const work = works.find((w) => w.id === id);
  if (!work) return;
  deletingId = work.id;
  els.deleteName.textContent = work.name || "名前なし";
  show(els.deleteError, false);
  els.deleteConfirm.disabled = false;
  els.deleteDialog.showModal();
  els.deleteCancel.focus();
}

async function confirmDelete() {
  const targetId = deletingId;
  if (!targetId) return;
  els.deleteConfirm.disabled = true;
  els.deleteConfirm.textContent = "削除中…";
  try {
    await api("DELETE", `/api/works/${encodeURIComponent(targetId)}`);
    els.deleteDialog.close();
    showNotice("削除しました");
    await loadWorks();
  } catch (e) {
    els.deleteError.textContent = e.message;
    show(els.deleteError, true);
    if (e.code === "not_found") loadWorks();
  } finally {
    els.deleteConfirm.disabled = false;
    els.deleteConfirm.textContent = "削除する";
  }
}

els.add.addEventListener("click", () => openForm(null));
els.reload.addEventListener("click", loadWorks);
els.form.addEventListener("submit", saveForm);
els.formCancel.addEventListener("click", () => els.formDialog.close());
els.photo.addEventListener("change", updatePreview);
els.deleteConfirm.addEventListener("click", confirmDelete);
els.deleteCancel.addEventListener("click", () => els.deleteDialog.close());
els.deleteDialog.addEventListener("close", () => { deletingId = null; });
els.formDialog.addEventListener("close", () => { editingId = null; });

loadWorks();
