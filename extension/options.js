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
  $("scale").value = settings.scale;
  $("scaleOut").textContent = settings.scale + "%";
  applyI18n();
  buildTriggerUI(settings);

  sectorsEl.textContent = "";
  settings.sectors.forEach((s, i) => {
    const card = document.createElement("section");
    card.className = "card sector";

    const h = document.createElement("h2");
    const arrow = document.createElement("span");
    arrow.className = "arrow";
    const glyph = document.createElement("span"); // стрелка вверх, повёрнутая на угол сектора
    glyph.textContent = "↑";
    glyph.style.display = "inline-block";
    glyph.style.transform = `rotate(${i * EW_STEP}deg)`;
    arrow.appendChild(glyph);
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
  return { ...collectTrigger(), scale: Number($("scale").value), lang: $("lang").value, sectors };
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

$("scale").addEventListener("input", () => { $("scaleOut").textContent = $("scale").value + "%"; });

// ---------- способ вызова ----------
const btnName = (b) => t("btn" + b[0].toUpperCase() + b.slice(1));
const buttonOptions = () => EW_BUTTONS.map((b) => [b, btnName(b)]);
const anyOptions = () => [["alt", "Alt"], ["shift", "Shift"], ["ctrl", "Ctrl"], ...buttonOptions()];
let prevPreset = "rl";

function fill(sel, options, value) {
  sel.textContent = "";
  for (const [v, label] of options) {
    const o = document.createElement("option");
    o.value = v;
    o.textContent = label;
    sel.appendChild(o);
  }
  sel.value = value;
}

function buildTriggerUI(s) {
  $("mode").value = s.mode;
  fill($("preset"), [
    ["rl", `${t("presetRL")} — ${t("noteWin")}`],
    ["sr", `${t("presetSR")} — ${t("noteLinux")}`],
    ["al", `${t("presetAL")} — ${t("noteLaptop")}`],
    ["custom", t("presetCustom")]
  ], s.preset);
  prevPreset = s.preset === "custom" ? "rl" : s.preset;
  fill($("first"), anyOptions(), s.first);
  fill($("second"), buttonOptions(), s.second);
  fill($("hold"), buttonOptions(), s.hold);
  fill($("activator"), anyOptions(), s.activator);
  fill($("moreOn"), [["hover", t("moreHover")], ["click", t("moreClick")]], s.moreOn);
  refreshTrigger();
}

function collectTrigger() {
  return {
    mode: $("mode").value, preset: $("preset").value, moreOn: $("moreOn").value,
    first: $("first").value, second: $("second").value, hold: $("hold").value, activator: $("activator").value
  };
}

function refreshTrigger() {
  const mode = $("mode").value, custom = $("preset").value === "custom";
  $("customClick").hidden = !(custom && mode === "click");
  $("customHold").hidden = !(custom && mode === "hold");
  $("moreRow").hidden = mode !== "click";
  $("clickHelp").hidden = mode !== "click";
  $("clickHelp").textContent = t("clickHelp");

  // одинаковые кнопки выбрать нельзя
  const first = $("first").value, second = $("second").value, hold = $("hold").value, act = $("activator").value;
  for (const o of $("second").options) o.disabled = EW_BUTTONS.includes(first) && o.value === first;
  for (const o of $("first").options) o.disabled = EW_BUTTONS.includes(o.value) && o.value === second;
  for (const o of $("activator").options) o.disabled = o.value === hold;
  for (const o of $("hold").options) o.disabled = o.value === act;

  // предупреждения о нежелательных сочетаниях
  const list = $("warnings");
  list.textContent = "";
  for (const key of ewWarnings(ewResolve(ewNormalize(collectTrigger())))) {
    const li = document.createElement("li");
    li.textContent = t(key);
    list.appendChild(li);
  }
}

$("mode").addEventListener("change", refreshTrigger);
$("preset").addEventListener("change", () => {
  if ($("preset").value === "custom") { // своя комбинация начинается с последнего готового варианта
    const base = EW_PRESETS[$("mode").value][prevPreset];
    if (base) {
      if (base.first) { $("first").value = base.first; $("second").value = base.second; }
      if (base.hold) { $("hold").value = base.hold; $("activator").value = base.activator; }
    }
  } else {
    prevPreset = $("preset").value;
  }
  refreshTrigger();
});
for (const id of ["first", "second", "hold", "activator", "moreOn"]) $(id).addEventListener("change", refreshTrigger);

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
    if (!raw || typeof raw !== "object" || (!Array.isArray(raw.sectors) && !raw.mode && !raw.preset && !raw.scale)) throw new Error("bad format");
    const settings = ewNormalize(raw);
    await ewSave(settings);
    render(settings);
    flash("imported");
  } catch (_) {
    flash("importFail");
  }
});

ewLoad().then(render);
