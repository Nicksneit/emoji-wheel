(() => {
  if (window.__emojiWheelLoaded) return;
  window.__emojiWheelLoaded = true;

  const N = EW_SECTORS; // 16 секторов: избранное сверху и 15 тематических
  const STEP = EW_STEP; // 22.5°
  const HALF = STEP / 2;

  // Базовые размеры (в пикселях) при масштабе 100 %. Реальные значения считает applyScale()
  // из настройки «Размер колеса», поэтому все зоны наведения и позиции окон меняются вместе.
  const BASE = { DEADZONE: 30, MID: 62, INNER: 106, BAND_GAP: 1, BAND: 20, ICON_R: 84, ICON_FONT: 20 };
  const GAP_PX = 0.5; // зазор между секторами; разделитель на деле рисует обводка 2px
  let DEADZONE, MID, INNER, BAND_GAP, OUTER, R, ICON_R, ICON_FONT, CORNER;
  function applyScale(percent) {
    const k = Math.min(120, Math.max(70, Number(percent) || 100)) / 100;
    DEADZONE = BASE.DEADZONE * k; // центр: щелчок или отпускание здесь = закрыть
    MID = BASE.MID * k; // граница между внутренней половиной сектора («назад») и внешней (со значком категории)
    INNER = BASE.INNER * k; // внешний радиус кольца категорий
    BAND_GAP = BASE.BAND_GAP * k; // радиальный зазор между кольцами
    OUTER = INNER + BASE.BAND * k; // внешний радиус тонкого кольца «Ещё»
    R = OUTER + 4;
    ICON_R = BASE.ICON_R * k; // радиус, на котором стоят значки категорий
    ICON_FONT = Math.round(BASE.ICON_FONT * k);
    CORNER = 3 * k; // скругление углов секторов
  }
  applyScale(100);

  const MAIN_COLS = 5;
  const MAIN_CELL = 40;
  const MORE_COLS = 10;
  const DWELL = 220; // мс задержки на тонком кольце до открытия окна «Ещё» (если включено по наведению)
  const KEY_PROP = { alt: "altKey", shift: "shiftKey", ctrl: "ctrlKey" };
  const BTN = { left: 0, middle: 1, right: 2 };
  const BTN_MASK = [1, 4, 2]; // биты MouseEvent.buttons для кнопок 0 (левая), 1 (средняя), 2 (правая)
  const SVG_NS = "http://www.w3.org/2000/svg";
  const TEXT_INPUT_TYPES = new Set(["", "text", "search", "url", "tel", "email", "password"]);

  let settings = ewNormalize(null);
  let trig = ewResolve(settings); // действующая комбинация вызова
  let recent = [];
  let data = [];
  let isOpen = false;
  let cx = 0, cy = 0, lastX = 0, lastY = 0;
  let locked = -1, backHover = -1, cellIdx = -1; // locked: выбранная категория, держится, пока курсор не вернётся во внутреннюю половину
  let zone = ""; // где курсор: hub, back, cat, band, out, panel
  let moreOpen = false;
  let bandTimer = 0;
  let panelKey = "";
  let panelRect = null;
  let curList = [];
  let cellRects = [];
  let target = null;
  let suppressUntil = 0;
  let host = null, shadow = null, menu = null, panel = null;
  let wedges = [], backs = [], bands = [];

  // состояние мыши и жеста
  const pressed = new Set(); // кнопки мыши, нажатые прямо сейчас (0, 1, 2)
  const armed = new Set(); // режим «клик»: кнопки, нажатые уже при открытом меню
  let downTarget = null; // поле ввода, которое было активно при первом нажатии жеста
  let holdBtn = -1; // режим «отпускание»: кнопка, отпускание которой выбирает эмодзи

  const t = (key) => ewT(settings.lang, key);
  const sectorName = (i) => settings.sectors[i].name || t("cat" + i);

  // ---------- настройки ----------
  function reload() {
    ewLoad().then((s) => { settings = s; trig = ewResolve(s); }).catch(() => {});
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
    .back { fill: #221e3b; stroke: #15122b; stroke-width: 2; stroke-linejoin: round; transition: fill .12s; }
    .back.on { fill: #39335e; }
    .chev { fill: none; stroke: #f5f1e8; stroke-linecap: round; stroke-linejoin: round; opacity: .42; transition: opacity .12s; }
    .back.on + .chev { opacity: .75; }
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
    @media (prefers-reduced-motion: reduce) { svg, .panel { animation: none; } .band, .grip, .back, .chev { transition: none; } }
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

  // Кольцевой сегмент сектора i между радиусами r0 и r1 со слегка скруглёнными углами.
  function arcPath(r0, r1, i) {
    const gap = ((GAP_PX / r1) * 180) / Math.PI; // угловой зазор, дающий GAP_PX на внешней кромке
    const a0 = i * STEP - HALF + gap, a1 = i * STEP + HALF - gap;
    // радиус скругления: не больше четверти самой короткой кромки, чтобы узкие сегменты не стали «каплями»
    const inner = ((a1 - a0) * Math.PI / 180) * r0;
    const rc = Math.max(0, Math.min(CORNER, (r1 - r0) / 4, inner / 4));
    const d = (r) => ((rc / r) * 180) / Math.PI;
    const f = (q) => `${q[0].toFixed(2)} ${q[1].toFixed(2)}`;
    return [
      "M", f(pt(r1, a0 + d(r1))),
      "A", r1, r1, 0, 0, 1, f(pt(r1, a1 - d(r1))),
      "Q", f(pt(r1, a1)), f(pt(r1 - rc, a1)),
      "L", f(pt(r0 + rc, a1)),
      "Q", f(pt(r0, a1)), f(pt(r0, a1 - d(r0))),
      "A", r0, r0, 0, 0, 0, f(pt(r0, a0 + d(r0))),
      "Q", f(pt(r0, a0)), f(pt(r0 + rc, a0)),
      "L", f(pt(r1 - rc, a0)),
      "Q", f(pt(r1, a0)), f(pt(r1, a0 + d(r1))),
      "Z"
    ].join(" ");
  }


  // Мягкая «капля-дуга» по центру сегмента внешнего кольца: толще посередине, плавно сходит на нет к концам.
  function gripPath(i) {
    const rm = (INNER + BAND_GAP + OUTER) / 2;
    const span = 13, steps = 20, half = 1.9;
    const outer = [], inner = [];
    for (let k = 0; k <= steps; k++) {
      const u = k / steps;
      const a = i * STEP + (u - 0.5) * span;
      const w = half * Math.pow(Math.sin(Math.PI * u), 0.85);
      outer.push(pt(rm + w, a));
      inner.push(pt(rm - w, a));
    }
    const f = (p) => `${p[0].toFixed(2)} ${p[1].toFixed(2)}`;
    return "M" + outer.map(f).join("L") + "L" + inner.reverse().map(f).join("L") + "Z";
  }

  // Стрелка «назад» во внутренней половине сектора: один цельный уголок остриём к центру,
  // со скруглёнными концами и вершиной.
  function chevPath(i) {
    const k = INNER / BASE.INNER;
    const rm = (DEADZONE + 2 + MID) / 2;
    const arm = 4.4 * k, depth = 3.8 * k;
    const tip = pt(rm - depth / 2, i * STEP);
    const ends = [-1, 1].map((sg) => pt(rm + depth / 2, i * STEP + sg * ((arm / rm) * 180) / Math.PI));
    const f = (q) => `${q[0].toFixed(2)} ${q[1].toFixed(2)}`;
    return `M${f(ends[0])}L${f(tip)}L${f(ends[1])}`;
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
    svg.appendChild(svgEl("circle", { class: "hub", r: OUTER + 1 })); // тёмная подложка: в зазорах и скруглениях не видно страницу
    wedges = [];
    backs = [];
    bands = [];
    for (let i = 0; i < N; i++) {
      const s = settings.sectors[i];
      const bk = svgEl("path", { class: "back", d: arcPath(DEADZONE + 2, MID, i) });
      svg.appendChild(bk);
      backs.push(bk);
      svg.appendChild(svgEl("path", { class: "chev", d: chevPath(i), "stroke-width": (2.3 * INNER / BASE.INNER).toFixed(2) }));
      const w = svgEl("path", { class: "wedge", d: arcPath(MID + BAND_GAP, INNER, i) });
      svg.appendChild(w);
      wedges.push(w);
      const [tx, ty] = pt(ICON_R, i * STEP);
      const icon = svgEl("text", { class: "icon", x: tx, y: ty });
      icon.style.fontSize = ICON_FONT + "px";
      icon.textContent = s.icon || data[i].main[0] || "•";
      svg.appendChild(icon);

      const has = data[i].extra.length > 0;
      const b = svgEl("path", { class: "band" + (has ? "" : " off"), d: arcPath(INNER + BAND_GAP, OUTER, i) });
      svg.appendChild(b);
      bands.push(b);
      if (has) svg.appendChild(svgEl("path", { class: "grip", d: gripPath(i) }));
    }
    svg.appendChild(svgEl("circle", { class: "hub", r: DEADZONE + 2 }));
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

  // ---------- размещение окна ----------
  // Окно всегда ставится вплотную к значку своей категории. Нельзя закрывать свой сектор целиком
  // (путь назад — внутреннюю половину, значок и путь к полному списку — кнопку «Ещё») и центр.
  // Чужие секторы закрывать можно: пока категория выбрана, наведение на них её не переключает.
  const PANEL_GAP = 6; // отступ окна от защищённых частей колеса
  const BACK_PENALTY = 8; // при равной близости лучше не закрывать внутренние половины соседей

  function rectDist(r, x, y) {
    return Math.hypot(Math.max(r.left - x, 0, x - r.right), Math.max(r.top - y, 0, y - r.bottom));
  }
  const nearDisk = (r, rad) => rectDist(r, cx, cy) < rad;

  // точки на границе кольцевого сегмента сектора i между радиусами r0 и r1
  function zoneEdge(i, r0, r1) {
    const out = [];
    for (let a = -HALF; a <= HALF + 1e-6; a += 2) {
      out.push(pt(r0, i * STEP + a), pt(r1, i * STEP + a));
    }
    for (let r = r0; r <= r1 + 1e-6; r += 3) {
      out.push(pt(r, i * STEP - HALF), pt(r, i * STEP + HALF));
    }
    return out.map(([x, y]) => [cx + x, cy + y]);
  }

  // точки, заполняющие свой сектор с запасом PANEL_GAP: окно не должно содержать ни одной
  function ownSectorPoints(i) {
    const out = [];
    for (let r = DEADZONE; r <= OUTER + PANEL_GAP + 1e-6; r += 3) {
      const spread = HALF + ((PANEL_GAP / r) * 180) / Math.PI;
      for (let a = -spread; a <= spread + 1e-6; a += spread / 6) {
        const [x, y] = pt(r, i * STEP + a);
        out.push([cx + x, cy + y]);
      }
    }
    return out;
  }

  function placePanel(p, i, more) {
    const w = p.offsetWidth, h = p.offsetHeight;
    const vw = window.innerWidth, vh = window.innerHeight, M = 8;
    const rect = (l, t) => ({ left: l, top: t, right: l + w, bottom: t + h });
    const clampL = (l) => Math.max(M, Math.min(l, vw - w - M));
    const clampT = (t) => Math.max(M, Math.min(t, vh - h - M));

    // окно «к чему» тянется: к значку категории или, для «Ещё», к своему сегменту тонкого кольца
    const near = more ? zoneEdge(i, INNER + BAND_GAP, OUTER) : zoneEdge(i, MID + BAND_GAP, INNER);
    const own = ownSectorPoints(i);
    let ob = { left: Infinity, top: Infinity, right: -Infinity, bottom: -Infinity };
    for (const [x, y] of own) {
      ob = { left: Math.min(ob.left, x), top: Math.min(ob.top, y), right: Math.max(ob.right, x), bottom: Math.max(ob.bottom, y) };
    }
    const hitsOwn = (r) => {
      if (r.right < ob.left || r.left > ob.right || r.bottom < ob.top || r.top > ob.bottom) return false;
      return own.some(([x, y]) => inRect(r, x, y));
    };
    const dirDeg = (r) => {
      let a = (Math.atan2((r.left + r.right) / 2 - cx, cy - (r.top + r.bottom) / 2) * 180) / Math.PI - i * STEP;
      a = ((a % 360) + 540) % 360 - 180;
      return Math.abs(a);
    };
    const score = (r) => {
      let d = Infinity;
      for (const [x, y] of near) d = Math.min(d, rectDist(r, x, y));
      return d + (nearDisk(r, MID + PANEL_GAP) ? BACK_PENALTY : 0) + dirDeg(r) * 0.02;
    };

    // кандидаты: прежнее место «наружу по направлению сектора» и сетка позиций вокруг колеса
    const ux = Math.sin((i * STEP * Math.PI) / 180), uy = -Math.cos((i * STEP * Math.PI) / 180);
    const dist = OUTER + 10 + Math.abs(ux) * (w / 2) + Math.abs(uy) * (h / 2);
    const cands = [rect(clampL(cx + ux * dist - w / 2), clampT(cy + uy * dist - h / 2))];
    const step = w * h > 90000 ? 6 : 4;
    const reach = OUTER + 30;
    for (let l = clampL(cx - reach - w); l <= clampL(cx + reach); l += step) {
      for (let t = clampT(cy - reach - h); t <= clampT(cy + reach); t += step) cands.push(rect(l, t));
    }

    for (const keep of [DEADZONE + PANEL_GAP]) {
      let best = null, bestScore = Infinity;
      for (const r of cands) {
        if (nearDisk(r, keep) || hitsOwn(r)) continue;
        const sc = score(r);
        if (sc < bestScore) { bestScore = sc; best = r; }
      }
      if (best) return apply(best);
    }
    return apply(cands[0]);

    function apply(r) {
      p.style.left = r.left + "px";
      p.style.top = r.top + "px";
      return r;
    }
  }

  function renderPanel() {
    const key = locked < 0 ? "" : (moreOpen ? "m" : "p") + locked;
    if (key === panelKey) return;
    panelKey = key;
    if (panel) { panel.remove(); panel = null; }
    cellRects = [];
    curList = [];
    cellIdx = -1;
    panelRect = null;
    if (!key) return;

    const i = locked;
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
    panelRect = placePanel(p, i, moreOpen);
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
    return Math.floor(((ang + HALF) % 360) / STEP);
  }

  const inRect = (r, x, y) => !!r && x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
  // «Ещё» открывается по наведению (с задержкой) в режиме удержания и если так выбрано в настройках
  const dwellOpensMore = () => trig.mode === "hold" || trig.moreOn === "hover";

  // Зоны колеса от центра: центр, внутренняя половина сектора («назад»), внешняя половина
  // со значком категории, тонкое кольцо «Ещё» и всё, что дальше.
  function zoneAt(r) {
    return r < DEADZONE ? "hub" : r <= MID ? "back" : r <= INNER ? "cat" : r <= OUTER ? "band" : "out";
  }

  function update(x, y) {
    lastX = x;
    lastY = y;
    const dx = x - cx, dy = y - cy;
    const r = Math.hypot(dx, dy);
    const s = sectorAt(dx, dy);

    // Курсор над открытым окном имеет приоритет над кольцами под ним.
    zone = locked >= 0 && inRect(panelRect, x, y) ? "panel" : zoneAt(r);
    backHover = -1;
    if (zone === "hub" || zone === "back") {
      // возврат во внутреннюю половину (или в центр) снимает выбор категории и прячет окно
      locked = -1;
      moreOpen = false;
      if (zone === "back") backHover = s;
    } else if (zone !== "panel") {
      if (locked < 0) locked = s; // первая категория, до которой дошёл курсор
      else if (zone === "cat" && s === locked) moreOpen = false; // вернулись на свой значок: снова основное окно
      // чужие значки и кольца, пока категория выбрана, ничего не переключают
    }

    // Тонкое кольцо своей категории: окно «Ещё» открывается, если курсор задержался на нём.
    const onOwnBand = (xx, yy) => {
      const r2 = Math.hypot(xx - cx, yy - cy);
      return locked >= 0 && r2 > INNER && r2 <= OUTER && sectorAt(xx - cx, yy - cy) === locked;
    };
    const inBand = zone === "band" && onOwnBand(x, y) && !moreOpen && data[locked].extra.length > 0;
    if (inBand && dwellOpensMore() && !bandTimer) {
      bandTimer = setTimeout(() => {
        bandTimer = 0;
        if (isOpen && !moreOpen && onOwnBand(lastX, lastY) && !inRect(panelRect, lastX, lastY)) {
          moreOpen = true;
          update(lastX, lastY);
        }
      }, DWELL);
    }
    if ((!inBand || !dwellOpensMore()) && bandTimer) {
      clearTimeout(bandTimer);
      bandTimer = 0;
    }

    wedges.forEach((w, i) => w.classList.toggle("on", i === locked));
    backs.forEach((w, i) => w.classList.toggle("on", i === backHover));
    bands.forEach((b, i) => b.classList.toggle("on", i === locked && (inBand || moreOpen)));
    renderPanel();

    const idx = panel ? cellRects.findIndex((c) => inRect(c, x, y)) : -1;
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
      if (target && target.isConnected) target.focus(); // выделение временного поля забрало фокус
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
  function openMenu(e, preferred) {
    ensureUI();
    applyScale(settings.scale);
    cx = lastX = e.clientX;
    cy = lastY = e.clientY;
    locked = -1; backHover = -1; cellIdx = -1; zone = "hub";
    moreOpen = false;
    curList = []; cellRects = [];
    data = settings.sectors.map((s) => ewLists(s));
    // Внешний сегмент над избранным: последние использованные эмодзи.
    data[0].extra = recent.slice(0, EW_RECENT_MAX);
    target = preferred && preferred.isConnected ? preferred : findTarget(e);
    if (target && target !== deepActive()) target.focus();
    buildMenu();
    menu.classList.add("open");
    // пока меню открыто, слой поверх страницы забирает курсор: везде обычная стрелка,
    // а не текстовый курсор или «рука» элемента под мышью (сами события по-прежнему ловятся на window)
    host.style.pointerEvents = "auto";
    host.style.cursor = "default";
    isOpen = true;
  }

  function closeMenu() {
    isOpen = false;
    moreOpen = false;
    holdBtn = -1;
    armed.clear();
    if (bandTimer) { clearTimeout(bandTimer); bandTimer = 0; }
    menu?.classList.remove("open");
    if (host) { host.style.pointerEvents = "none"; host.style.cursor = ""; }
    suppressUntil = Date.now() + 200; // гасим click / contextmenu, которые браузер шлёт сразу после отпускания
  }

  // Режим «отпускание»: выбор по отпусканию удерживаемой кнопки.
  function commit() {
    let emoji = null;
    if (cellIdx >= 0) emoji = curList[cellIdx];
    else if (zone === "cat" && locked >= 0 && sectorAt(lastX - cx, lastY - cy) === locked) emoji = data[locked].main[0] || null;
    closeMenu();
    if (emoji) {
      insert(emoji);
      remember(emoji);
    }
  }

  // Режим «клик»: вставить (левая), скопировать (правая); Shift или средняя кнопка оставляют меню открытым.
  function pick(emoji, copyIt, keepOpen) {
    if (copyIt) copy(emoji); else insert(emoji);
    remember(emoji);
    if (!keepOpen) closeMenu();
  }

  function clickAction(e) {
    const x = e.clientX, y = e.clientY;
    const dx = x - cx, dy = y - cy, r = Math.hypot(dx, dy);
    const copyIt = e.button === 2;
    // Shift служит активатором в комбинации «Shift + правая»: тогда он зажат всё время и «оставить открытым» не означает
    const shiftKeeps = e.shiftKey && !(trig.mode === "click" && trig.first === "shift");
    const keepOpen = shiftKeeps || e.button === 1;

    if (cellIdx >= 0) return pick(curList[cellIdx], copyIt, keepOpen); // эмодзи в открытом окне
    if (zone === "panel") return; // пустое место внутри окна
    if (r < DEADZONE) return closeMenu(); // центр
    if (r <= MID) return; // внутренняя половина сектора: просто «назад»
    const s = sectorAt(dx, dy);
    if (r <= INNER) {
      if (locked >= 0 && s !== locked) { // щелчок по чужому значку: сначала переключиться на эту категорию
        locked = s; moreOpen = false; update(x, y);
        return;
      }
      const em = data[s].main[0]; // щелчок по своему значку: первое эмодзи категории
      if (em) pick(em, copyIt, keepOpen);
      return;
    }
    if (r <= OUTER) { // тонкое кольцо: открыть «Ещё» этой категории
      if (s !== locked) { locked = s; moreOpen = false; }
      if (data[s].extra.length) moreOpen = true;
      update(x, y);
      return;
    }
    closeMenu(); // мимо меню: закрыть, щелчок до страницы не доходит
  }

  // ---------- события мыши ----------
  function syncPressed(e) {
    if (typeof e.buttons !== "number") return;
    pressed.clear();
    if (e.buttons & 1) pressed.add(0);
    if (e.buttons & 4) pressed.add(1);
    if (e.buttons & 2) pressed.add(2);
  }

  // Нажатие e открывает меню в текущей комбинации?
  function opensOn(e) {
    if (isOpen) return false;
    if (trig.mode === "click") {
      if (e.button !== BTN[trig.second]) return false;
      return KEY_PROP[trig.first] ? !!e[KEY_PROP[trig.first]] : pressed.has(BTN[trig.first]);
    }
    if (KEY_PROP[trig.activator]) return e.button === BTN[trig.hold] && !!e[KEY_PROP[trig.activator]];
    return e.button === BTN[trig.activator] && pressed.has(BTN[trig.hold]);
  }

  window.addEventListener("mousedown", (e) => {
    syncPressed(e);
    if (isOpen) { // пока меню открыто, страница нажатий не получает
      e.preventDefault();
      e.stopImmediatePropagation();
      if (trig.mode === "click") armed.add(e.button);
      return;
    }
    if (opensOn(e)) {
      e.preventDefault();
      e.stopImmediatePropagation();
      const preferred = pressed.size > 1 ? downTarget : null;
      openMenu(e, preferred);
      holdBtn = trig.mode === "hold" ? BTN[trig.hold] : -1;
      armed.clear();
      return;
    }
    // первое нажатие жеста: запоминаем поле до того, как нажатие уберёт из него фокус
    if (pressed.size <= 1) downTarget = findTarget(e);
  }, true);

  // Современные сайты слушают pointer-события: гасим и их, но не отменяем (иначе пропадёт mousedown).
  window.addEventListener("pointerdown", (e) => {
    if (e.pointerType && e.pointerType !== "mouse") return;
    syncPressed(e);
    if (isOpen || opensOn(e)) e.stopImmediatePropagation();
  }, true);
  window.addEventListener("pointerup", (e) => {
    if (e.pointerType && e.pointerType !== "mouse") return;
    if (isOpen) e.stopImmediatePropagation();
  }, true);

  window.addEventListener("mousemove", (e) => {
    syncPressed(e);
    if (!isOpen) return;
    e.stopImmediatePropagation(); // движение во время выбора страница (и жестовые расширения) не видит
    if (trig.mode === "hold" && !(e.buttons & BTN_MASK[holdBtn])) { closeMenu(); return; } // кнопку отпустили вне окна страницы
    update(e.clientX, e.clientY);
  }, true);

  window.addEventListener("mouseup", (e) => {
    syncPressed(e);
    if (pressed.size === 0 && !isOpen) downTarget = null;
    if (!isOpen) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    if (trig.mode === "hold") {
      if (e.button === holdBtn) { update(e.clientX, e.clientY); commit(); }
      return;
    }
    // режим «клик»: действует только кнопка, нажатая уже при открытом меню (отпускание кнопок открывающего жеста игнорируем)
    if (!armed.has(e.button)) return;
    armed.delete(e.button);
    update(e.clientX, e.clientY);
    clickAction(e);
  }, true);

  // click, contextmenu и подобные события во время выбора и сразу после него страница не получает
  for (const type of ["click", "auxclick", "dblclick", "contextmenu"]) {
    window.addEventListener(type, (e) => {
      if (isOpen || Date.now() < suppressUntil) {
        e.preventDefault();
        e.stopImmediatePropagation();
      }
    }, true);
  }
  for (const type of ["selectstart", "dragstart"]) {
    window.addEventListener(type, (e) => { if (isOpen) e.preventDefault(); }, true);
  }

  window.addEventListener("keydown", (e) => {
    if (isOpen && e.key === "Escape") {
      e.preventDefault();
      closeMenu();
    }
  }, true);

  window.addEventListener("blur", () => { pressed.clear(); downTarget = null; if (isOpen) closeMenu(); });
})();
