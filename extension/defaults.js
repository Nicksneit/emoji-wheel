// Лимиты: первые 25 эмодзи сектора идут в основную панель 5x5, остальные в окно «Ещё».
const EW_MAIN_MAX = 25;
const EW_MORE_MAX = 200;
const EW_RECENT_MAX = 25;
const EW_SECTORS = 16;
const EW_STEP = 360 / EW_SECTORS; // угол сектора, градусы
const EW_SECTOR_KEYS = Array.from({ length: EW_SECTORS }, (_, i) => "s" + i);

// 16 секторов по часовой стрелке, начиная с верхнего (избранное). name: "" = название по умолчанию на выбранном языке.
const EW_DEFAULTS = {
  mode: "click", // click: клик выбирает, меню остаётся открытым; hold: удерживаемая кнопка выбирает при отпускании
  preset: "rl", // rl | sr | al | custom (по умолчанию подбирается по платформе)
  first: "right", second: "left", // режим click (своя комбинация)
  hold: "right", activator: "left", // режим hold (своя комбинация)
  moreOn: "hover", // как открывать «Ещё» в режиме click: hover | click
  scale: 100, // размер колеса, % (70–120)
  lang: "en",
  sectors: [
    { name: "", icon: "⭐", emojis: "😂 👍 ❤️ 🔥 😊 🙏 🎉 😎" },
    {
      name: "", icon: "😀",
      emojis: "😀 😃 😄 😁 😆 😅 🤣 😂 🙂 🙃 🫠 😉 😊 😇 🥰 😍 🤩 😘 😗 ☺️  " +
        "😚 😙 🥲 😋 😛 😜 🤪 😝 🤑 🤗 🤭 🫢 🫣 🤫 🤔 🫡 🥳 😎 🤓 🧐  " +
        "😏 😌 🥹 🤠 🥸 😺 😸 😹 😻"
    },
    {
      name: "", icon: "😢",
      emojis: "😢 😭 😡 😠 🤬 😱 😨 😰 😥 😓 😞 😔 😟 😕 🙁 ☹️ 😩 😫 🥺 😳  " +
        "😬 🙄 😒 😐 😑 😶 🫥 😮 😯 😲 😦 😧 😖 😣 🥱 😪 😴 😤 😮‍💨 😵  " +
        "😵‍💫 🤯 🥵 🥶 🥴 🤢 🤮 🤧 😷 🤒 🤕 🤥 🤐 🤨 🫤 🫨 🫩 🤤 😶‍🌫️ 🫪"
    },
    {
      name: "", icon: "👻",
      emojis: "👻 💀 ☠️ 👽 👾 🤖 💩 🤡 👹 👺 😈 👿 🎃 🙈 🙉 🙊 😺 😸 😹 😻  " +
        "😼 😽 🙀 😿 😾 🧙 🧚 🧛 🧜 🧝 🧞 🧟 🧌 🎅 🤶 🦸 🦹 🥷 👼 🐉  " +
        "🐲 🦄 🦖 🦕 🧸 🪆 🎭"
    },
    {
      name: "", icon: "👋",
      emojis: "👍 👎 👌 ✌️ 🤞 🤟 🤘 🤙 👈 👉 👆 👇 ☝️ ✋ ✊ 👊 👋 🤝 🙏 👏  " +
        "🙌 💪 🤷 🤦 👀 🤚 🖐️ 🖖 🫱 🫲 🫳 🫴 🫷 🫸 🤌 🤏 🫰 🖕 🫵 🤛  " +
        "🤜 🫶 👐 🤲 ✍️ 💅 🤳 🦾 🦿 🦵 🦶 👂 🦻 👃 🧠 🫀 🫁 🦷 🦴 👁️  " +
        "👅 👄 🫦 👣 🗣️ 👤 👥 🫂"
    },
    {
      name: "", icon: "🧑",
      emojis: "👶 🧒 👦 👧 🧑 👱 👨 🧔 👩 🧓 👴 👵 🙍 🙎 🙅 🙆 💁 🙋 🧏 🙇  " +
        "🤦 🤷 👮 🕵️ 💂 🥷 👷 🫅 🤴 👸 👳 👲 🧕 🤵 👰 🤰 🫃 🫄 🤱 🧑‍🩰  " +
        "💆 💇 🚶 🧍 🧎 🏃 💃 🕺 🕴️ 👯 🧖 🧗 🧘 🛀 🛌 👓 🕶️ 🥽 🥼 🦺  " +
        "👔 👕 👖 🧣 🧤 🧥 🧦 👗 👘 🥻 🩱 🩲 🩳 👙 👚 👛 👜 👝 🛍️ 🎒  " +
        "🩴 👞 👟 🥾 🥿 👠 👡 🩰 👢 👑 👒 🎩 🎓 🧢 🪖 ⛑️ 📿 💄 💍 💎  " +
        "🪮"
    },
    {
      name: "", icon: "❤️",
      emojis: "❤️ 🧡 💛 💚 💙 💜 🖤 🤍 🤎 🩷 🩵 🩶 💔 ❤️‍🔥 ❤️‍🩹 ❣️ 💕 💞 💓 💗  " +
        "💖 💘 💝 💟 💋 💌 💍 💎 🌹 💐 🥀 🌷 🌸 😍 🥰 😘 😻 💑 💏 🫶  " +
        "🤗 💯 ✨ 💫 🌟"
    },
    {
      name: "", icon: "✅",
      emojis: "✅ ❌ ❓ ❗ ⚠️ 🚫 ⛔ ➕ ➖ ➗ ✖️ ✔️ ☑️ ❎ ❔ ❕ ‼️ ⁉️ 💯 🔞  " +
        "📵 ♻️ ⭕ 🆗 🆒 🆕 🆓 🆙 🆘 🆚 ℹ️ 🅿️ 📛 🟰 ♾️ 💲 ➡️ ⬅️ ⬆️ ⬇️  " +
        "↗️ ↘️ ↙️ ↖️ ↔️ ↕️ ↩️ ↪️ ⤴️ ⤵️ 🔄 🔃 🔁 🔂 🔀 🔙 🔚 🔛 🔜 🔝  " +
        "▶️ ⏸️ ⏹️ ⏺️ ⏭️ ⏮️ ⏩ ⏪ 🔼 🔽 🔴 🟠 🟡 🟢 🔵 🟣 🟤 ⚫ ⚪ 🟥  " +
        "🟧 🟨 🟩 🟦 🟪 🟫 ⬛ ⬜ 🔶 🔷 🔸 🔹 🔺 🔻 💠 🔘 🔳 🔲 〰️ ➰  " +
        "➿ ✳️ ✴️ ❇️ 🏁 🚩 🎌 🏴 🏳️ 🔔 🔕 🔈 🔉 🔊 🔇 📣 📢 ☮️ ☯️ ✝️  " +
        "☪️ ✡️ 🕉️ ☸️ 🔯 🕎 🛐 ⚜️ 🔱 🔰 ♀️ ♂️ ⚧️ ♈ ♉ ♊ ♋ ♌ ♍ ♎  " +
        "♏ ♐ ♑ ♒ ♓ ⛎ 🔟 🔠 🔡 🔢 🔣 🔤"
    },
    {
      name: "", icon: "🐶",
      emojis: "🐶 🐱 🐭 🐹 🐰 🦊 🐻 🐼 🐨 🐯 🦁 🐮 🐷 🐸 🐵 🐔 🐧 🐦 🦉 🦄  " +
        "🐝 🦋 🐢 🐙 🐬 🐒 🦍 🦧 🐕 🦮 🐕‍🦺 🐩 🐺 🦝 🐈 🐈‍⬛ 🐅 🐆 🐴 🫎  " +
        "🫏 🐎 🦓 🦌 🦬 🐂 🐃 🐄 🐖 🐗 🐏 🐑 🐐 🐪 🐫 🦙 🦒 🐘 🦣 🦏  " +
        "🦛 🐁 🐀 🐇 🐿️ 🦫 🦔 🦇 🐻‍❄️ 🦥 🦦 🦨 🦘 🦡 🐾 🦃 🐓 🐣 🐤 🐥  " +
        "🕊️ 🦅 🦆 🦢 🦤 🪶 🦩 🦚 🦜 🪽 🐦‍⬛ 🪿 🐊 🦎 🐍 🐲 🐉 🦕 🦖 🐳  " +
        "🐋 🦭 🐟 🐠 🐡 🦈 🐚 🪸 🪼 🫍 🐌 🐛 🐜 🪲 🐞 🦗 🪳 🕷️ 🕸️ 🦂  " +
        "🦟 🪰 🪱 🦠 🫈"
    },
    {
      name: "", icon: "🌳",
      emojis: "🌳 🌲 🌴 🌵 🌱 🌿 ☘️ 🍀 🍁 🍂 🍃 🍄 🌸 🌹 🌺 🌻 🌼 🌷 ☀️ 🌙  " +
        "⭐ 🌈 ☁️ ⛅ ❄️ 💐 🥀 💮 🪷 🏵️ 🪻 🪴 🌾 🪹 🪺 🪨 🪵 🪾 🌍 🌎  " +
        "🌏 🌑 🌒 🌓 🌔 🌕 🌖 🌗 🌘 🌚 🌛 🌜 🌝 🌞 🌟 🌠 🌤️ 🌥️ 🌦️ 🌧️  " +
        "⛈️ 🌩️ 🌨️ ☃️ ⛄ 🌪️ 🌫️ 🌬️ ☂️ ☔ ⚡ 🔥 💧 💦 🌊 🌋 ☄️ 🫧"
    },
    {
      name: "", icon: "🍕",
      emojis: "🍕 🍔 🍟 🌭 🌮 🌯 🍣 🍜 🍝 🍩 🍪 🍰 🎂 🍫 🍿 🍎 🍌 🍓 🍉 🍇  " +
        "🥑 🥐 🍞 🧀 🍳 🍏 🍐 🍊 🍋 🍍 🥭 🍑 🍒 🍈 🫐 🥝 🍅 🫒 🥥 🍆  " +
        "🥔 🥕 🌽 🌶️ 🫑 🥒 🥬 🥦 🧄 🧅 🥜 🫘 🌰 🫚 🫛 🥖 🫓 🥨 🥯 🥞  " +
        "🧇 🍖 🍗 🥩 🥓 🥪 🥙 🧆 🫔 🥚 🥘 🍲 🫕 🥣 🥗 🧈 🧂 🥫 🍱 🍘  " +
        "🍙 🍚 🍛 🍠 🍢 🍤 🍥 🥮 🍡 🥟 🥠 🥡 🦀 🦞 🦐 🦑 🦪 🍦 🍧 🍨  " +
        "🧁 🥧 🍬 🍭 🍮 🍯"
    },
    {
      name: "", icon: "☕",
      emojis: "☕ 🍺 🍷 🥂 🍾 🍻 🍸 🍹 🥃 🥤 🧋 🍵 🫖 🍶 🥛 🍼 🧃 🧉 🧊 🫗  " +
        "🍽️ 🍴 🥄 🥢 🔪 🫙 🏺 🧂 🥫 🍯 🥣"
    },
    {
      name: "", icon: "⚽",
      emojis: "⚽ 🏀 🏈 ⚾ 🎾 🏐 🏉 🥎 🏓 🏸 🏒 🥊 🥋 ⛳ 🏆 🥇 🥈 🥉 🏅 🎖️  " +
        "🎯 🎳 ⛸️ 🎿 🏂 🥏 🏏 🏑 🥍 🥅 🎣 🤿 🎽 🛷 🥌 🪁 🏋️ 🤸 🤼 🤺  " +
        "🤾 🏌️ 🏇 🧘 🏄 🏊 🤽 🚣 🧗 🚴 🚵 🤹 🪀 ⛷️ 🏹 🛼 🛹 🎱 🪂 🏟️"
    },
    {
      name: "", icon: "🎉",
      emojis: "🎉 🎊 🎁 🎈 🥳 🎂 🍾 🥂 🎵 🎶 🎤 🎧 🎸 🎹 🥁 🎷 🎺 🎻 🎮 🕹️  " +
        "🎲 🧩 🎯 🎬 📸 🎀 🎆 🎇 🧨 🎃 🎄 🎋 🎍 🎎 🎏 🎐 🎑 🧧 🎗️ 🎟️  " +
        "🎫 🪅 🪩 🪆 🧸 🎰 ♟️ 🃏 🀄 🎴 🎭 🖼️ 🎨 🧵 🪡 🧶 🪢 🎼 🪘 🪗  " +
        "🪕 🪈 🪇 🪉 🪊 🎠 🎡 🎢 ♠️ ♥️ ♦️ ♣️ 🎳 🪄 🔮 🎪 🎞️ 🎥 📽️ 📺  " +
        "📻"
    },
    {
      name: "", icon: "🚗",
      emojis: "🚗 🚕 🚙 🚌 🚎 🏎️ 🚓 🚑 🚒 🚲 🛵 🏍️ 🚂 🚆 🚇 ✈️ 🛫 🚁 🚀 🛸  " +
        "⛵ 🚢 🏠 🏢 🗺️ 🚐 🛻 🚚 🚛 🚜 🛴 🛹 🛼 🚊 🚉 🛬 🛩️ 💺 🛰️ 🚤  " +
        "🛥️ 🛳️ ⛴️ ⚓ 🛟 ⛽ 🚧 🚦 🚥 🗿 🗽 🗼 🏰 🏯 🏟️ ⛲ ⛱️ 🏖️ 🏝️ 🏜️  " +
        "⛰️ 🏔️ 🗻 🏕️ ⛺ 🛖 🏡 🏘️ 🏬 🏥 🏦 🏨 🏫 ⛪ 🕌 🛕 🕍 ⛩️ 🌃 🏙️  " +
        "🌄 🌅 🌆 🌇 🌉 🛞 🛝 🛣️ 🏭 🏪 🏩 🗾 🧳 🛂 🛃 🛄 🛅"
    },
    {
      name: "", icon: "💼",
      emojis: "💼 💻 🖥️ ⌨️ 🖱️ 📱 📞 📧 📅 📌 📎 📝 📁 📊 📈 💡 🔒 🔑 ⏰ ⌛  " +
        "🔍 🔧 ⚙️ 📦 💰 🛠️ 🔨 🪓 ⛏️ ⚒️ 🔩 🧰 🧲 🪛 🪚 🔗 ⛓️ 🪝 📐 📏  " +
        "✂️ 🖊️ 🖋️ ✒️ ✏️ 🖌️ 🖍️ 📒 📓 📔 📕 📖 📗 📘 📙 📚 📃 📜 📄 📰  " +
        "🗞️ 📑 🔖 🏷️ 🗂️ 📂 🗃️ 🗄️ 🗑️ 📋 📍 🖇️ 📆 🗒️ 🗓️ 📇 📉 📤 📥 📨  " +
        "📩 💌 ✉️ 📮 📪 📫 📬 📭 🗳️ 🔓 🗝️ 🔐 🔏 📷 📹 🎥 📽️ 🎞️ 📼 💽  " +
        "💾 💿 📀 🖨️ 🖲️ 🔋 🪫 🔌 📲 ☎️ 📟 📠 📡 🧮 💳 💵 💴 💶 💷 💸  " +
        "🪙 🧾 💹 🔭 🔬 🧪 🧫 🧬 ⚗️ 💊 💉 🩸 🩹 🩼 🩺 🩻 🕯️ 🔦 🏮 🪔  " +
        "🛒 🛏️ 🛋️ 🪑 🚪 🛗 🪞 🪟 🚽 🪠 🚿 🛁 🪤 🪒 🧴 🧷 🧹 🧺 🧻 🪣  " +
        "🧼 🫧 🪥 🧽 🧯 🕰️ ⏳ ⌚ ⏱️ ⏲️ 🧿 🪬 🪪 🪧 🗡️ ⚔️ 💣 🛡️ ⚖️ 🦯  " +
        "🗜️ 🪃 🪜 ⚰️ 🪦 ⚱️ 🚬 🛢️ 🪏"
    }
  ]
};

// Дефолтные списки записаны одной строкой: первые 25 уходят в основную панель, остальные в «Ещё».
EW_DEFAULTS.sectors = EW_DEFAULTS.sectors.map((s) => ({ name: s.name, icon: s.icon, ...ewSplitLegacy(s.emojis) }));

function ewSplitLegacy(combined) {
  const all = [...new Set(ewSplitEmojis(combined))];
  return { emojis: all.slice(0, EW_MAIN_MAX).join(" "), more: all.slice(EW_MAIN_MAX).join(" ") };
}

const EW_KEYS = ["alt", "shift", "ctrl"];
const EW_BUTTONS = ["left", "middle", "right"];
// Готовые комбинации: rl: правая + левая (Windows с мышью), sr: Shift + правая (Linux, macOS), al: Alt + левая (ноутбуки).
const EW_PRESETS = {
  click: { rl: { first: "right", second: "left" }, sr: { first: "shift", second: "right" }, al: { first: "alt", second: "left" } },
  hold: { rl: { hold: "right", activator: "left" }, sr: { hold: "right", activator: "shift" }, al: { hold: "left", activator: "alt" } }
};

function ewPlatform() {
  return String((typeof navigator !== "undefined" && (navigator.userAgentData?.platform || navigator.platform)) || "").toLowerCase();
}
function ewIsWindows() { return ewPlatform().includes("win"); }
function ewIsLinux() { return ewPlatform().includes("linux"); }

// Своя комбинация: значения допустимые и без одинаковых кнопок.
function ewFixCustom(o) {
  const any = [...EW_KEYS, ...EW_BUTTONS];
  if (!any.includes(o.first)) o.first = "right";
  if (!EW_BUTTONS.includes(o.second)) o.second = "left";
  if (o.first === o.second) o.second = EW_BUTTONS.find((b) => b !== o.first);
  if (!EW_BUTTONS.includes(o.hold)) o.hold = "right";
  if (!any.includes(o.activator)) o.activator = "left";
  if (o.activator === o.hold) o.activator = "alt";
  return o;
}

// Итоговая комбинация с учётом готового варианта.
function ewResolve(s) {
  const c = ewFixCustom({ first: s.first, second: s.second, hold: s.hold, activator: s.activator });
  const p = EW_PRESETS[s.mode]?.[s.preset];
  const base = p || (s.mode === "click" ? { first: c.first, second: c.second } : { hold: c.hold, activator: c.activator });
  return { mode: s.mode, moreOn: s.moreOn, ...base };
}

// Предупреждения о нежелательных сочетаниях: ключи переводов.
function ewWarnings(r) {
  const out = new Set();
  const isKey = (v) => EW_KEYS.includes(v);
  // кнопка мыши, которая нажимается первой (страница успевает её увидеть)
  const firstBtn = r.mode === "click" ? (isKey(r.first) ? null : r.first) : (isKey(r.activator) ? null : r.hold);
  if (firstBtn === "left") out.add("warnLeftFirst");
  if (firstBtn === "middle") out.add("warnMiddleFirst");
  if (firstBtn === "right" && !ewIsWindows()) out.add("warnRightFirst");
  const key = r.mode === "click" ? (isKey(r.first) ? r.first : null) : (isKey(r.activator) ? r.activator : null);
  const mouseBtn = r.mode === "click" ? r.second : r.hold;
  if (key && (key === "ctrl" || key === "shift") && mouseBtn === "left") out.add("warnCtrlShiftLeft");
  if (key === "alt" && ewIsLinux()) out.add("warnAltLinux");
  if (r.mode === "hold" && r.hold === "left" && key) out.add("warnLeftHold");
  return [...out];
}

function ewNormalize(saved) {
  const out = {
    mode: EW_DEFAULTS.mode,
    preset: ewIsWindows() ? "rl" : "sr", // на macOS и Linux правая кнопка первой неудобна
    first: EW_DEFAULTS.first, second: EW_DEFAULTS.second,
    hold: EW_DEFAULTS.hold, activator: EW_DEFAULTS.activator,
    moreOn: EW_DEFAULTS.moreOn,
    scale: EW_DEFAULTS.scale,
    lang: typeof ewDetectLang === "function" ? ewDetectLang() : "en",
    sectors: EW_DEFAULTS.sectors.map((s) => ({ ...s }))
  };
  if (!saved || typeof saved !== "object") return out;
  if (["click", "hold"].includes(saved.mode)) out.mode = saved.mode;
  if (["rl", "sr", "al", "custom"].includes(saved.preset)) out.preset = saved.preset;
  if (["hover", "click"].includes(saved.moreOn)) out.moreOn = saved.moreOn;
  for (const k of ["first", "second", "hold", "activator"]) if (typeof saved[k] === "string") out[k] = saved[k];
  ewFixCustom(out);
  if (Number.isFinite(Number(saved.scale)) && saved.scale !== null && saved.scale !== "") {
    out.scale = Math.min(120, Math.max(70, Math.round(Number(saved.scale))));
  }
  if (typeof EW_I18N !== "undefined" && EW_I18N[saved.lang]) out.lang = saved.lang;
  if (Array.isArray(saved.sectors)) {
    // Настройки старой раскладки из 8 секторов не подходят к новым категориям: переносим только избранное.
    const limit = saved.sectors.length === EW_SECTORS ? EW_SECTORS : 1;
    for (let i = 0; i < limit; i++) {
      const s = saved.sectors[i];
      if (s && typeof s === "object") {
        const lists = typeof s.more === "string"
          ? { emojis: String(s.emojis ?? out.sectors[i].emojis), more: s.more }
          : s.emojis != null ? ewSplitLegacy(String(s.emojis)) : { emojis: out.sectors[i].emojis, more: out.sectors[i].more };
        out.sectors[i] = {
          name: String(s.name ?? ""),
          icon: String(s.icon ?? out.sectors[i].icon),
          ...lists
        };
      }
    }
  }
  return out;
}

function ewSplitEmojis(str) {
  const seg = new Intl.Segmenter(undefined, { granularity: "grapheme" });
  return [...seg.segment(str || "")].map((s) => s.segment).filter((s) => s.trim());
}

// Основная панель (до 25) и окно «Ещё» (до 120). Лишнее из основного поля перетекает в «Ещё».
function ewLists(sector) {
  const all = [...new Set([...ewSplitEmojis(sector.emojis), ...ewSplitEmojis(sector.more)])];
  return {
    main: all.slice(0, EW_MAIN_MAX),
    extra: all.slice(EW_MAIN_MAX, EW_MAIN_MAX + EW_MORE_MAX),
    total: all.length
  };
}

// Хранилище: отдельный ключ на каждый сектор, чтобы не упираться в лимит 8 КБ на один ключ sync.
async function ewLoad() {
  const d = await chrome.storage.sync.get(["settings", "cfg", ...EW_SECTOR_KEYS]);
  const legacy = d.settings || {};
  const current = d.cfg?.layout === EW_SECTORS;
  return ewNormalize({
    mode: d.cfg?.mode, preset: d.cfg?.preset, moreOn: d.cfg?.moreOn,
    first: d.cfg?.first, second: d.cfg?.second, hold: d.cfg?.hold, activator: d.cfg?.activator,
    scale: d.cfg?.scale ?? legacy.scale,
    lang: d.cfg?.lang ?? legacy.lang,
    // старая раскладка (8 секторов): отдаём только избранное, остальное берётся из новых значений по умолчанию
    sectors: current ? EW_SECTOR_KEYS.map((k) => d[k]) : [d.s0 ?? legacy.sectors?.[0]]
  });
}

async function ewSave(s) {
  const items = { cfg: { mode: s.mode, preset: s.preset, first: s.first, second: s.second, hold: s.hold, activator: s.activator, moreOn: s.moreOn, scale: s.scale, lang: s.lang, layout: EW_SECTORS } };
  s.sectors.forEach((x, i) => { items[EW_SECTOR_KEYS[i]] = x; });
  await chrome.storage.sync.set(items);
  await chrome.storage.sync.remove("settings");
}

async function ewReset() {
  await chrome.storage.sync.remove(["settings", "cfg", ...EW_SECTOR_KEYS]);
}

// Недавние эмодзи хранятся локально (chrome.storage.local), не синхронизируются.
async function ewLoadRecent() {
  const d = await chrome.storage.local.get("recent");
  return Array.isArray(d.recent) ? d.recent.filter((x) => typeof x === "string").slice(0, EW_RECENT_MAX) : [];
}

async function ewPushRecent(emoji) {
  const cur = await ewLoadRecent();
  const next = [emoji, ...cur.filter((x) => x !== emoji)].slice(0, EW_RECENT_MAX);
  await chrome.storage.local.set({ recent: next });
  return next;
}

async function ewClearRecent() {
  await chrome.storage.local.remove("recent");
}
