const $ = (id) => document.getElementById(id);
const sectorsEl = $("sectors");
const statusEl = $("status");
const MAX_TOTAL = EW_MAIN_MAX + EW_MORE_MAX;

let lang = "en";
const t = (key) => ewT(lang, key);
let statusTimer = 0;

function flash(key) {
  statusEl.textContent = t(key);
  clearTimeout(statusTimer);
  statusTimer = setTimeout(() => { statusEl.textContent = ""; }, 2500);
}

function applyI18n() {
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  document.title = t("title");
  document.querySelectorAll("[data-i18n]").forEach((el) => { el.textContent = t(el.dataset.i18n); });
}

function subHeader(label) {
  const row = document.createElement("div");
  row.className = "sub";
  const name = document.createElement("span");
  name.textContent = label;
  const count = document.createElement("span");
  count.className = "count";
  row.append(name, count);
  return { row, count };
}

function render(settings) {
  lang = settings.lang;
  $("lang").value = lang;
  $("modifier").value = settings.modifier;
  $("trigger").value = settings.trigger;
  $("modifier").disabled = settings.trigger === "chord";
  applyI18n();

  sectorsEl.textContent = "";
  settings.sectors.forEach((s, i) => {
    const card = document.createElement("section");
    card.className = "card sector";

    const h = document.createElement("h2");
    const arrow = document.createElement("span");
    arrow.className = "arrow";
    arrow.textContent = EW_ARROWS[i];
    arrow.setAttribute("aria-hidden", "true");
    const title = document.createElement("span");
    title.textContent = s.name || t("cat" + i);
    h.append(arrow, title);
    card.appendChild(h);

    const fields = document.createElement("div");
    fields.className = "fields";

    const icon = document.createElement("input");
    icon.className = "icon";
    icon.value = s.icon;
    icon.setAttribute("aria-label", t("iconLabel"));
    icon.dataset.field = "icon";

    const name = document.createElement("input");
    name.className = "name";
    name.value = s.name;
    name.placeholder = t("cat" + i);
    name.setAttribute("aria-label", t("nameLabel"));
    name.dataset.field = "name";
    name.addEventListener("input", () => { title.textContent = name.value.trim() || t("cat" + i); });

    fields.append(icon, name);
    card.appendChild(fields);

    // основная панель (первые 25)
    const mainHead = subHeader(t("mainLabel"));
    const main = document.createElement("textarea");
    main.className = "main";
    main.value = s.emojis;
    main.setAttribute("aria-label", t("mainLabel"));
    main.dataset.field = "emojis";
    card.append(mainHead.row, main);

    // окно «Ещё»; у верхнего сектора вместо него автоматические «недавние»
    let more = null, moreHead = null;
    if (i === 0) {
      const head = subHeader(t("recent"));
      const box = document.createElement("div");
      box.className = "recent-box";
      const note = document.createElement("p");
      note.textContent = t("recentNote");
      const clear = document.createElement("button");
      clear.type = "button";
      clear.className = "ghost";
      clear.textContent = t("clearRecent");
      clear.addEventListener("click", async () => { await ewClearRecent(); flash("cleared"); });
      box.append(note, clear);
      card.append(head.row, box);
    } else {
      moreHead = subHeader(t("more"));
      more = document.createElement("textarea");
      more.className = "more";
      more.value = s.more;
      more.setAttribute("aria-label", t("more"));
      more.dataset.field = "more";
      card.append(moreHead.row, more);
    }

    const refresh = () => {
      const lists = ewLists({ emojis: main.value, more: more ? more.value : "" });
      const mainCount = ewLists({ emojis: main.value, more: "" }).total;
      mainHead.count.textContent = `${Math.min(mainCount, EW_MAIN_MAX)} / ${EW_MAIN_MAX}`;
      mainHead.count.classList.toggle("over", i === 0 && mainCount > EW_MAIN_MAX);
      if (moreHead) {
        moreHead.count.textContent = `${lists.extra.length} / ${EW_MORE_MAX}`;
        moreHead.count.classList.toggle("over", lists.total > MAX_TOTAL);
      }
    };
    main.addEventListener("input", refresh);
    more?.addEventListener("input", refresh);
    refresh();

    sectorsEl.appendChild(card);
  });
}

function collect() {
  const sectors = [...sectorsEl.querySelectorAll(".sector")].map((card) => {
    const get = (f) => card.querySelector(`[data-field="${f}"]`)?.value.trim() ?? "";
    return { icon: get("icon"), name: get("name"), emojis: get("emojis"), more: get("more") };
  });
  return { modifier: $("modifier").value, trigger: $("trigger").value, lang: $("lang").value, sectors };
}

// язык
EW_LANGS.forEach(([code, label]) => {
  const o = document.createElement("option");
  o.value = code;
  o.textContent = label;
  $("lang").appendChild(o);
});
$("lang").addEventListener("change", () => {
  render(ewNormalize(collect())); // несохранённые правки не теряем при смене языка
});

$("trigger").addEventListener("change", () => {
  $("modifier").disabled = $("trigger").value === "chord";
});

// сохранить / сбросить
$("save").addEventListener("click", async () => {
  await ewSave(ewNormalize(collect()));
  flash("saved");
});

$("reset").addEventListener("click", async () => {
  await ewReset();
  render(ewNormalize(null));
  flash("resetDone");
});

// экспорт
$("export").addEventListener("click", () => {
  const payload = { app: "emoji-wheel", version: 2, settings: ewNormalize(collect()) };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "emoji-wheel-settings.json";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  flash("exported");
});

// импорт (понимает и старые файлы версии 1, где был один общий список)
$("import").addEventListener("click", () => $("file").click());
$("file").addEventListener("change", async () => {
  const file = $("file").files[0];
  $("file").value = "";
  if (!file) return;
  try {
    const parsed = JSON.parse(await file.text());
    const raw = parsed && typeof parsed === "object" && parsed.settings ? parsed.settings : parsed;
    if (!raw || typeof raw !== "object" || (!Array.isArray(raw.sectors) && !raw.modifier)) throw new Error("bad format");
    const settings = ewNormalize(raw);
    await ewSave(settings);
    render(settings);
    flash("imported");
  } catch (_) {
    flash("importFail");
  }
});

ewLoad().then(render);
