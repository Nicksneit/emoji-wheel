(() => {
  if (window.__emojiWheelLoaded) return;
  window.__emojiWheelLoaded = true;

  const DEADZONE = 24; // центр: отпустить здесь = отмена
  const INNER = 78; // внешний радиус кольца категорий
  const BAND_GAP = 3; // радиальный зазор между кольцами
  const OUTER = INNER + 24; // внешний радиус тонкого кольца «Ещё»
  const R = OUTER + 4;
  const GAP_INNER = 1.2; // угловой зазор между секторами внутреннего кольца (°)
  const GAP_OUTER = 0.9; // то же для внешнего: меньше угол, чтобы линейный зазор был такой же
  const MAIN_COLS = 5;
  const MAIN_CELL = 40;
  const MORE_COLS = 10;
  const DWELL = 220; // мс задержки на тонком кольце до открытия окна «Ещё»
  const MOD_KEY = { alt: "altKey", shift: "shiftKey", ctrl: "ctrlKey" };
  const SVG_NS = "http://www.w3.org/2000/svg";
  const TEXT_INPUT_TYPES = new Set(["", "text", "search", "url", "tel", "email", "password"]);

  let settings = ewNormalize(null);
  let recent = [];
  let data = [];
  let isOpen = false;
  let cx = 0, cy = 0, lastX = 0, lastY = 0;
  let hover = -1, locked = -1, cellIdx = -1;
  let moreOpen = false;
  let bandTimer = 0;
  let panelKey = "";
  let panelRect = null;
  let curList = [];
  let cellRects = [];
  let target = null;
  let suppressUntil = 0;
  let host = null, shadow = null, menu = null, panel = null;
  let wedges = [], bands = [];

  const t = (key) => ewT(settings.lang, key);
  const sectorName = (i) => settings.sectors[i].name || t("cat" + i);

  // ---------- настройки ----------
  function reload() {
    ewLoad().then((s) => { settings = s; }).catch(() => {});
  }
  try {
    reload();
    ewLoadRecent().then((r) => { recent = r; }).catch(() => {});
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === "sync") reload();
      if (area === "local" && changes.recent) {
        recent = Array.isArray(changes.recent.newValue) ? changes.recent.newValue : [];
      }
    });
  } catch (_) { /* расширение перезагружено: остаются настройки по умолчанию */ }

  // ---------- интерфейс ----------
  const CSS = `
    :host { all: initial; }
    .layer { position: fixed; inset: 0; pointer-events: none;
      font-family: "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", system-ui, sans-serif; }
    .menu { position: fixed; inset: 0; display: none; }
    .menu.open { display: block; }
    svg { position: absolute; overflow: visible; filter: drop-shadow(0 6px 16px rgba(10,8,30,.35));
      animation: pop .09s ease-out; }
    .wedge { fill: #2a2646; stroke: #15122b; stroke-width: 2; stroke-linejoin: round; }
    .wedge.on { fill: #f2b84b; }
    .band { fill: #38335c; stroke: #15122b; stroke-width: 2; stroke-linejoin: round; transition: fill .12s; }
    .band.off { fill: #231f3d; }
    .band.on { fill: #f2b84b; }
    .grip { fill: #f5f1e8; stroke: #f5f1e8; stroke-width: .8; stroke-linejoin: round; opacity: .8; transition: fill .12s, stroke .12s; }
    .band.on + .grip { fill: #15122b; stroke: #15122b; opacity: .85; }
    .hub { fill: #15122b; }
    .icon { font-size: 22px; text-anchor: middle; dominant-baseline: central; }
    .panel { position: absolute; box-sizing: border-box; padding: 8px; border-radius: 14px;
      background: #2a2646; color: #f5f1e8; box-shadow: 0 8px 28px rgba(10,8,30,.45);
      animation: pop .09s ease-out; }
    .title { font: 600 12px/16px system-ui, sans-serif; padding: 0 4px 6px; opacity: .85; white-space: nowrap; }
    .grid { display: grid; gap: 2px; }
    .cell { display: flex; align-items: center; justify-content: center; border-radius: 10px; }
    .cell.on { background: #f2b84b; }
    .empty { font: 13px/18px system-ui, sans-serif; opacity: .8; max-width: 150px; padding: 2px 4px; }
    .toast { position: fixed; padding: 6px 12px; border-radius: 999px; background: #2a2646; color: #f5f1e8;
      font: 13px/18px system-ui, sans-serif; box-shadow: 0 6px 18px rgba(10,8,30,.4); transform: translate(-50%, -100%); }
    @keyframes pop { from { opacity: 0; transform: scale(.96); } to { opacity: 1; transform: none; } }
    @media (prefers-reduced-motion: reduce) { svg, .panel { animation: none; } .band, .grip { transition: none; } }
  `;

  function ensureUI() {
    if (host && host.isConnected) return;
    host = document.createElement("div");
    shadow = host.attachShadow({ mode: "open" });
    const style = document.createElement("style");
    style.textContent = CSS;
    const layer = document.createElement("div");
    layer.className = "layer";
    menu = document.createElement("div");
    menu.className = "menu";
    layer.appendChild(menu);
    shadow.append(style, layer);
    host.style.cssText = "all: initial; position: fixed; inset: 0; z-index: 2147483647; pointer-events: none;";
    (document.documentElement || document).appendChild(host);
  }

  function pt(r, deg) {
    const a = (deg * Math.PI) / 180;
    return [r * Math.sin(a), -r * Math.cos(a)];
  }

  function arcPath(r0, r1, i, gap) {
    const a0 = i * 45 - 22.5 + gap, a1 = i * 45 + 22.5 - gap;
    const [x1, y1] = pt(r1, a0), [x2, y2] = pt(r1, a1);
    const [x3, y3] = pt(r0, a1), [x4, y4] = pt(r0, a0);
    return `M${x1} ${y1}A${r1} ${r1} 0 0 1 ${x2} ${y2}L${x3} ${y3}A${r0} ${r0} 0 0 0 ${x4} ${y4}Z`;
  }

  // Мягкая «капля-дуга» по центру сегмента внешнего кольца: толще посередине, плавно сходит на нет к концам.
  function gripPath(i) {
    const rm = (INNER + BAND_GAP + OUTER) / 2;
    const span = 30, steps = 24, half = 1.9;
    const outer = [], inner = [];
    for (let k = 0; k <= steps; k++) {
      const u = k / steps;
      const a = i * 45 + (u - 0.5) * span;
      const w = half * Math.pow(Math.sin(Math.PI * u), 0.85);
      outer.push(pt(rm + w, a));
      inner.push(pt(rm - w, a));
    }
    const f = (p) => `${p[0].toFixed(2)} ${p[1].toFixed(2)}`;
    return "M" + outer.map(f).join("L") + "L" + inner.reverse().map(f).join("L") + "Z";
  }

  function svgEl(name, attrs) {
    const el = document.createElementNS(SVG_NS, name);
    for (const k in attrs) el.setAttribute(k, attrs[k]);
    return el;
  }

  function buildMenu() {
    menu.textContent = "";
    const svg = svgEl("svg", { width: 2 * R, height: 2 * R, viewBox: `${-R} ${-R} ${2 * R} ${2 * R}` });
    svg.style.left = cx - R + "px";
    svg.style.top = cy - R + "px";
    wedges = [];
    bands = [];
    for (let i = 0; i < 8; i++) {
      const s = settings.sectors[i];
      const w = svgEl("path", { class: "wedge", d: arcPath(DEADZONE + 2, INNER, i, GAP_INNER) });
      svg.appendChild(w);
      wedges.push(w);
      const [tx, ty] = pt((DEADZONE + INNER) / 2 + 2, i * 45);
      const icon = svgEl("text", { class: "icon", x: tx, y: ty });
      icon.textContent = s.icon || data[i].main[0] || "•";
      svg.appendChild(icon);

      const has = data[i].extra.length > 0;
      const b = svgEl("path", { class: "band" + (has ? "" : " off"), d: arcPath(INNER + BAND_GAP, OUTER, i, GAP_OUTER) });
      svg.appendChild(b);
      bands.push(b);
      if (has) svg.appendChild(svgEl("path", { class: "grip", d: gripPath(i) }));
    }
    svg.appendChild(svgEl("circle", { class: "hub", r: DEADZONE - 2 }));
    menu.appendChild(svg);
    panel = null;
    panelKey = "";
    panelRect = null;
  }

  function makePanel(title, list, cols, cell) {
    const p = document.createElement("div");
    p.className = "panel";
    const ti = document.createElement("div");
    ti.className = "title";
    ti.dir = "auto";
    ti.textContent = title;
    p.appendChild(ti);
    if (list.length) {
      const grid = document.createElement("div");
      grid.className = "grid";
      grid.style.gridTemplateColumns = `repeat(${cols}, ${cell}px)`;
      list.forEach((e) => {
        const c = document.createElement("div");
        c.className = "cell";
        c.style.width = c.style.height = cell + "px";
        c.style.fontSize = Math.round(cell * 0.6) + "px";
        c.textContent = e;
        grid.appendChild(c);
      });
      p.appendChild(grid);
    } else {
      const em = document.createElement("div");
      em.className = "empty";
      em.dir = "auto";
      em.textContent = t("empty");
      p.appendChild(em);
    }
    return p;
  }

  // Окно не должно лежать на кольцах: ни на основном, ни на кнопке «Ещё» своей категории.
  function overlapsRing(rect) {
    const dx = Math.max(rect.left - cx, 0, cx - rect.right);
    const dy = Math.max(rect.top - cy, 0, cy - rect.bottom);
    return Math.hypot(dx, dy) < OUTER + 6;
  }

  function placePanel(p, i) {
    const w = p.offsetWidth, h = p.offsetHeight;
    const vw = window.innerWidth, vh = window.innerHeight;
    const rectAt = (deg) => {
      const a = (deg * Math.PI) / 180;
      const ux = Math.sin(a), uy = -Math.cos(a);
      const half = Math.abs(ux) * (w / 2) + Math.abs(uy) * (h / 2);
      const dist = OUTER + 10 + half;
      const px = Math.max(8, Math.min(cx + ux * dist - w / 2, vw - w - 8));
      const py = Math.max(8, Math.min(cy + uy * dist - h / 2, vh - h - 8));
      return { left: px, top: py, right: px + w, bottom: py + h };
    };
    let best = rectAt(i * 45);
    if (overlapsRing(best)) {
      // Места по ходу сектора мало: ищем ближайший по углу вариант, где окно не задевает кольца.
      const cands = [];
      for (let d = 3; d <= 180; d += 3) {
        for (const sgn of [1, -1]) {
          const r = rectAt(i * 45 + sgn * d);
          if (!overlapsRing(r)) {
            const off = Math.hypot((r.left + r.right) / 2 - vw / 2, (r.top + r.bottom) / 2 - vh / 2);
            cands.push({ r, d, off });
          }
        }
      }
      if (cands.length) {
        cands.sort((x, y) => x.d - y.d || x.off - y.off);
        best = cands[0].r;
      }
    }
    p.style.left = best.left + "px";
    p.style.top = best.top + "px";
    return best;
  }

  function renderPanel() {
    const key = moreOpen ? "m" + locked : hover >= 0 ? "p" + hover : "";
    if (key === panelKey) return;
    panelKey = key;
    if (panel) { panel.remove(); panel = null; }
    cellRects = [];
    curList = [];
    cellIdx = -1;
    panelRect = null;
    if (!key) return;

    const i = moreOpen ? locked : hover;
    let p;
    if (moreOpen) {
      curList = data[i].extra;
      const n = curList.length;
      const cols = n <= 120 ? MORE_COLS : Math.min(16, Math.ceil(n / 12));
      const rows = Math.max(1, Math.ceil(n / cols));
      const availH = window.innerHeight - 80, availW = window.innerWidth - 56;
      const cell = Math.max(20, Math.min(34,
        Math.floor((availH - (rows - 1) * 2) / rows),
        Math.floor((availW - (cols - 1) * 2) / cols)));
      const title = i === 0 ? t("recent") : `${sectorName(i)}: ${t("more")}`;
      p = makePanel(title, curList, cols, cell);
    } else {
      curList = data[i].main;
      p = makePanel(sectorName(i), curList, MAIN_COLS, MAIN_CELL);
    }
    p.style.visibility = "hidden";
    menu.appendChild(p);
    panelRect = placePanel(p, i);
    p.style.visibility = "visible";
    panel = p;

    // Прямоугольники ячеек считаем по раскладке, а не по getBoundingClientRect:
    // во время анимации появления у панели есть transform, и рамки получались бы смещёнными.
    cellRects = [...p.querySelectorAll(".cell")].map((c) => ({
      left: panelRect.left + c.offsetLeft,
      top: panelRect.top + c.offsetTop,
      right: panelRect.left + c.offsetLeft + c.offsetWidth,
      bottom: panelRect.top + c.offsetTop + c.offsetHeight
    }));
  }

  function toast(text) {
    ensureUI();
    const el = document.createElement("div");
    el.className = "toast";
    el.dir = "auto";
    el.textContent = text;
    el.style.left = Math.min(Math.max(cx, 80), window.innerWidth - 80) + "px";
    el.style.top = Math.max(cy - 12, 40) + "px";
    shadow.querySelector(".layer").appendChild(el);
    setTimeout(() => el.remove(), 1400);
  }

  // ---------- логика выбора ----------
  function sectorAt(dx, dy) {
    let ang = (Math.atan2(dx, -dy) * 180) / Math.PI;
    if (ang < 0) ang += 360;
    return Math.floor(((ang + 22.5) % 360) / 45);
  }

  function update(x, y) {
    lastX = x;
    lastY = y;
    const dx = x - cx, dy = y - cy;
    const r = Math.hypot(dx, dy);

    // Курсор над открытой панелью имеет приоритет над кольцами под ней.
    // Иначе, когда окно прижато к краю экрана и налезает на кольцо, оно закрывалось бы.
    const inPanel = !!panelRect && (moreOpen || locked >= 0) &&
      x >= panelRect.left && x <= panelRect.right && y >= panelRect.top && y <= panelRect.bottom;

    if (!inPanel) {
      if (r < DEADZONE) {
        locked = -1; hover = -1; moreOpen = false;
      } else if (r <= INNER) {
        locked = -1; moreOpen = false; hover = sectorAt(dx, dy);
      } else {
        if (locked < 0) locked = sectorAt(dx, dy);
        hover = locked;
      }
    }

    // Тонкое кольцо: окно «Ещё» открывается, если курсор задержался на нём.
    const inBand = !inPanel && locked >= 0 && !moreOpen && r <= OUTER && data[locked].extra.length > 0;
    if (inBand && !bandTimer) {
      bandTimer = setTimeout(() => {
        bandTimer = 0;
        const r2 = Math.hypot(lastX - cx, lastY - cy);
        if (isOpen && locked >= 0 && r2 > INNER && r2 <= OUTER) {
          moreOpen = true;
          update(lastX, lastY);
        }
      }, DWELL);
    }
    if (!inBand && bandTimer) {
      clearTimeout(bandTimer);
      bandTimer = 0;
    }

    wedges.forEach((w, i) => w.classList.toggle("on", i === hover));
    bands.forEach((b, i) => b.classList.toggle("on", i === locked && (inBand || moreOpen)));
    renderPanel();

    let idx = -1;
    if (moreOpen || inPanel || (locked >= 0 && r > INNER)) {
      idx = cellRects.findIndex((c) => x >= c.left && x <= c.right && y >= c.top && y <= c.bottom);
    }
    if (idx !== cellIdx) {
      cellIdx = idx;
      panel?.querySelectorAll(".cell").forEach((c, i) => c.classList.toggle("on", i === cellIdx));
    }
  }

  // ---------- вставка ----------
  function deepActive() {
    let a = document.activeElement;
    while (a && a.shadowRoot && a.shadowRoot.activeElement) a = a.shadowRoot.activeElement;
    return a;
  }

  function isEditable(el) {
    if (!el || el.nodeType !== 1) return false;
    if (el.isContentEditable) return true;
    if (el.tagName === "TEXTAREA") return !el.readOnly && !el.disabled;
    if (el.tagName === "INPUT") {
      const type = (el.getAttribute("type") || "text").toLowerCase();
      return TEXT_INPUT_TYPES.has(type) && !el.readOnly && !el.disabled;
    }
    return false;
  }

  function findTarget(e) {
    const a = deepActive();
    if (isEditable(a)) return a;
    const p = e.target && e.target.closest ? e.target.closest("input, textarea, [contenteditable]") : null;
    return isEditable(p) ? p : null;
  }

  async function copy(emoji) {
    try {
      await navigator.clipboard.writeText(emoji);
    } catch (_) {
      const ta = document.createElement("textarea");
      ta.value = emoji;
      ta.style.cssText = "position:fixed;opacity:0;";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    toast(`${t("copied")} ${emoji}`);
  }

  function insert(emoji) {
    if (target && target.isConnected) {
      target.focus();
      let ok = false;
      try { ok = document.execCommand("insertText", false, emoji); } catch (_) {}
      if (!ok && "setRangeText" in target) {
        try {
          const s = target.selectionStart ?? target.value.length;
          const e = target.selectionEnd ?? s;
          target.setRangeText(emoji, s, e, "end");
          target.dispatchEvent(new InputEvent("input", { bubbles: true, data: emoji, inputType: "insertText" }));
          ok = true;
        } catch (_) {}
      }
      if (ok) return;
    }
    copy(emoji);
  }

  function remember(emoji) {
    recent = [emoji, ...recent.filter((x) => x !== emoji)].slice(0, EW_RECENT_MAX);
    try { ewPushRecent(emoji).catch(() => {}); } catch (_) {}
  }

  // ---------- открытие и закрытие ----------
  function openMenu(e) {
    ensureUI();
    cx = lastX = e.clientX;
    cy = lastY = e.clientY;
    hover = -1; locked = -1; cellIdx = -1;
    moreOpen = false;
    curList = []; cellRects = [];
    data = settings.sectors.map((s) => ewLists(s));
    // Внешний сегмент над избранным: последние использованные эмодзи.
    data[0].extra = recent.slice(0, EW_RECENT_MAX);
    target = findTarget(e);
    if (target && target !== deepActive()) target.focus();
    buildMenu();
    menu.classList.add("open");
    isOpen = true;
  }

  function closeMenu() {
    isOpen = false;
    moreOpen = false;
    if (bandTimer) { clearTimeout(bandTimer); bandTimer = 0; }
    menu?.classList.remove("open");
    suppressUntil = Date.now() + 350;
  }

  function commit() {
    let emoji = null;
    if (cellIdx >= 0) emoji = curList[cellIdx];
    else if (hover >= 0 && locked < 0) emoji = data[hover].main[0] || null;
    closeMenu();
    if (emoji) {
      insert(emoji);
      remember(emoji);
    }
  }

  // ---------- события ----------
  let rightHeld = false, swallowLeft = false, swallowClick = false, swallowTimer = 0;
  const useKey = () => settings.trigger !== "chord";
  const useChord = () => settings.trigger !== "key";

  window.addEventListener("mousedown", (e) => {
    if (e.button === 2) {
      rightHeld = true;
      if (!isOpen && useKey() && e[MOD_KEY[settings.modifier]]) {
        e.preventDefault();
        e.stopImmediatePropagation();
        openMenu(e);
      }
      return;
    }
    if (e.button === 0 && isOpen) { // пока меню открыто, левая кнопка странице не нужна
      e.preventDefault();
      e.stopImmediatePropagation();
      return;
    }
    if (e.button === 0 && rightHeld && useChord()) { // правая зажата + щелчок левой
      e.preventDefault();
      e.stopImmediatePropagation();
      swallowLeft = true;
      openMenu(e);
    }
  }, true);

  // Современные сайты слушают pointer-события: гасим и их, но не отменяем (иначе пропадёт mousedown).
  window.addEventListener("pointerdown", (e) => {
    if (e.button === 0 && (isOpen || (rightHeld && useChord()))) e.stopImmediatePropagation();
  }, true);
  window.addEventListener("pointerup", (e) => {
    if (e.button === 0 && (swallowLeft || isOpen)) e.stopImmediatePropagation();
  }, true);

  window.addEventListener("mousemove", (e) => {
    if (!(e.buttons & 2)) rightHeld = false;
    if (!isOpen) return;
    if (!(e.buttons & 2)) { closeMenu(); return; } // правую отпустили вне окна страницы
    update(e.clientX, e.clientY);
  }, true);

  window.addEventListener("mouseup", (e) => {
    if (e.button === 2) {
      rightHeld = false;
      if (!isOpen) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      update(e.clientX, e.clientY);
      commit();
      return;
    }
    if (e.button === 0 && swallowLeft) {
      swallowLeft = false;
      swallowClick = true;
      clearTimeout(swallowTimer);
      swallowTimer = setTimeout(() => { swallowClick = false; }, 400);
      e.preventDefault();
      e.stopImmediatePropagation();
    }
  }, true);

  window.addEventListener("click", (e) => {
    if (swallowClick) {
      swallowClick = false;
      e.preventDefault();
      e.stopImmediatePropagation();
    }
  }, true);

  window.addEventListener("contextmenu", (e) => {
    if (isOpen || Date.now() < suppressUntil) {
      e.preventDefault();
      e.stopImmediatePropagation();
    }
  }, true);

  window.addEventListener("keydown", (e) => {
    if (isOpen && e.key === "Escape") {
      e.preventDefault();
      closeMenu();
    }
  }, true);

  window.addEventListener("blur", () => { rightHeld = false; if (isOpen) closeMenu(); });
})();
