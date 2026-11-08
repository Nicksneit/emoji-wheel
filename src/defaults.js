// Лимиты: первые 25 эмодзи сектора идут в основную панель 5x5, остальные в окно «Ещё».
const EW_MAIN_MAX = 25;
const EW_MORE_MAX = 200;
const EW_RECENT_MAX = 25;
const EW_ARROWS = ["↑", "↗", "→", "↘", "↓", "↙", "←", "↖"];
const EW_SECTOR_KEYS = ["s0", "s1", "s2", "s3", "s4", "s5", "s6", "s7"];

// Сектора идут по часовой стрелке, начиная с верхнего. name: "" = название по умолчанию на выбранном языке.
const EW_DEFAULTS = {
  modifier: "alt", // alt | shift | ctrl
  trigger: "both", // key | chord | both
  lang: "en",
  sectors: [
    { name: "", icon: "⭐", emojis: "😂 👍 ❤️ 🔥 😊 🙏 🎉 😎" },
    {
      name: "", icon: "😀",
      emojis: "😀 😃 😄 😁 😆 😅 🤣 😂 🙂 😉 😊 😍 🥰 😘 😋 😎 🤩 🥳 😏 😒  " +
        "🙄 😬 😢 😭 😡 🙃 🫠 😇 😗 ☺️ 😚 😙 🥲 😛 😜 🤪 😝 🤑 🤗 🤭  " +
        "🫢 🫣 🤫 🤔 🫡 🤐 🤨 😐 😑 😶 🫥 😶‍🌫️ 😮‍💨 🤥 🫨 😌 😔 😪 🤤 😴  " +
        "🫩 😷 🤒 🤕 🤢 🤮 🤧 🥵 🥶 🥴 😵 😵‍💫 🤯 🤠 🥸 🤓 🧐 😕 🫤 😟  " +
        "🙁 ☹️ 😮 😯 😲 😳 🥺 🥹 😦 😧 😨 😰 😥 😱 😖 😣 😞 😓 😩 😫  " +
        "🥱 😤 😠 🤬 😈 👿 💀 ☠️ 💩 🤡 👹 👺 👻 👽 👾 🤖 😺 😸 😹 😻  " +
        "😼 😽 🙀 😿 😾 🙈 🙉 🙊 🫪"
    },
    {
      name: "", icon: "👋",
      emojis: "👍 👎 👌 ✌️ 🤞 🤟 🤘 🤙 👈 👉 👆 👇 ☝️ ✋ ✊ 👊 👋 🤝 🙏 👏  " +
        "🙌 💪 🤷 🤦 👀 🤚 🖐️ 🖖 🫱 🫲 🫳 🫴 🫷 🫸 🤌 🤏 🫰 🖕 🫵 🤛  " +
        "🤜 🫶 👐 🤲 ✍️ 💅 🤳 🦾 🦿 🦵 🦶 👂 🦻 👃 🧠 🫀 🫁 🦷 🦴 👁️  " +
        "👅 👄 🫦 👶 🧒 👦 👧 🧑 👱 👨 🧔 👩 🧓 👴 👵 🙍 🙎 🙅 🙆 💁  " +
        "🙋 🧏 🙇 👮 🕵️ 💂 🥷 👷 🫅 🤴 👸 👳 👲 🧕 🤵 👰 🤰 🫃 🫄 🤱  " +
        "👼 🎅 🤶 🦸 🦹 🧙 🧚 🧛 🧜 🧝 🧞 🧟 🧌 💆 💇 🚶 🧍 🧎 🏃 💃  " +
        "🕺 🕴️ 👯 🧖 🧗 🧘 🛀 🛌 👣 🫂 🗣️ 👤 👥 🧑‍🩰"
    },
    {
      name: "", icon: "❤️",
      emojis: "❤️ 🧡 💛 💚 💙 💜 🖤 🤍 💔 💕 💖 💯 ✨ ⭐ 🌟 🔥 💥 ✅ ❌ ❓  " +
        "❗ ⚠️ 💤 💢 💦 🩵 🤎 🩶 🩷 ❤️‍🔥 ❤️‍🩹 ❣️ 💞 💓 💗 💘 💝 💟 💋 💌  " +
        "💫 ⚡ 💨 🕳️ 💬 💭 ☑️ ✔️ ❎ ❔ ❕ ‼️ ⁉️ 🚫 ⛔ 📛 🔞 📵 ♻️ ➕  " +
        "➖ ➗ ✖️ 🟰 ♾️ 💲 ➡️ ⬅️ ⬆️ ⬇️ ↗️ ↘️ ↙️ ↖️ ↔️ ↕️ ↩️ ↪️ ⤴️ ⤵️  " +
        "🔄 🔃 🔁 🔂 🔀 🔙 🔚 🔛 🔜 🔝 ▶️ ⏸️ ⏹️ ⏺️ ⏭️ ⏮️ ⏩ ⏪ 🔼 🔽  " +
        "🆗 🆒 🆕 🆓 🆙 🆘 🆚 ℹ️ 🅿️ 🔴 🟠 🟡 🟢 🔵 🟣 🟤 ⚫ ⚪ 🟥 🟧  " +
        "🟨 🟩 🟦 🟪 🟫 ⬛ ⬜ 🔶 🔷 🔸 🔹 🔺 🔻 💠 🔘 🔳 🔲 ⭕ 〰️ ➰  " +
        "➿ ✳️ ✴️ ❇️ 🏁 🚩 🎌 🏴 🏳️ 🔔 🔕 🔈 🔉 🔊 🔇 📣 📢 ☮️ ☯️ ✝️  " +
        "☪️ ✡️ 🕉️ ☸️ 🔯 🕎 🛐 ⚜️ 🔱 🔰 ♀️ ♂️ ⚧️ ♈ ♉ ♊ ♋ ♌ ♍ ♎  " +
        "♏ ♐ ♑ ♒ ♓ ⛎ 🔟 🔠 🔡 🔢 🔣 🔤"
    },
    {
      name: "", icon: "🐱",
      emojis: "🐶 🐱 🐭 🐹 🐰 🦊 🐻 🐼 🐨 🐯 🦁 🐮 🐷 🐸 🐵 🐔 🐧 🐦 🦉 🦄  " +
        "🐝 🦋 🐢 🐙 🐬 🐒 🦍 🦧 🐕 🦮 🐕‍🦺 🐩 🐺 🦝 🐈 🐈‍⬛ 🐅 🐆 🐴 🫎  " +
        "🫏 🐎 🦓 🦌 🦬 🐂 🐃 🐄 🐖 🐗 🐏 🐑 🐐 🐪 🐫 🦙 🦒 🐘 🦣 🦏  " +
        "🦛 🐁 🐀 🐇 🐿️ 🦫 🦔 🦇 🐻‍❄️ 🦥 🦦 🦨 🦘 🦡 🐾 🦃 🐓 🐣 🐤 🐥  " +
        "🕊️ 🦅 🦆 🦢 🦤 🪶 🦩 🦚 🦜 🪽 🐦‍⬛ 🪿 🐊 🦎 🐍 🐲 🐉 🦕 🦖 🐳  " +
        "🐋 🦭 🐟 🐠 🐡 🦈 🐚 🪸 🪼 🫍 🐌 🐛 🐜 🪲 🐞 🦗 🪳 🕷️ 🕸️ 🦂  " +
        "🦟 🪰 🪱 🦠 🫈 💐 🌸 💮 🪷 🏵️ 🌹 🥀 🌺 🌻 🌼 🌷 🪻 🌱 🪴 🌲  " +
        "🌳 🌴 🌵 🌾 🌿 ☘️ 🍀 🍁 🍂 🍃 🍄 🪹 🪺 🪨 🪵 🪾 🌍 🌎 🌏 🌙  " +
        "🌚 🌝 🌞 ☀️ 🌈 ☁️ ⛅ 🌧️ ⛈️ 🌩️ 🌨️ ❄️ ☃️ ⛄ 🌪️ 🌫️ 🌊 💧 🌋 ☄️"
    },
    {
      name: "", icon: "🍕",
      emojis: "🍕 🍔 🍟 🌭 🌮 🌯 🍣 🍜 🍝 🍩 🍪 🍰 🎂 🍫 🍿 🍎 🍌 🍓 🍉 🍇  " +
        "☕ 🍺 🍷 🥂 🍾 🍏 🍐 🍊 🍋 🍍 🥭 🍑 🍒 🍈 🫐 🥝 🍅 🫒 🥥 🥑  " +
        "🍆 🥔 🥕 🌽 🌶️ 🫑 🥒 🥬 🥦 🧄 🧅 🥜 🫘 🌰 🫚 🫛 🍞 🥐 🥖 🫓  " +
        "🥨 🥯 🥞 🧇 🧀 🍖 🍗 🥩 🥓 🥪 🥙 🧆 🫔 🥚 🍳 🥘 🍲 🫕 🥣 🥗  " +
        "🧈 🧂 🥫 🍱 🍘 🍙 🍚 🍛 🍠 🍢 🍤 🍥 🥮 🍡 🥟 🥠 🥡 🦀 🦞 🦐  " +
        "🦑 🦪 🍦 🍧 🍨 🧁 🥧 🍬 🍭 🍮 🍯 🍼 🥛 🫖 🍵 🍶 🍸 🍹 🍻 🥃  " +
        "🫗 🥤 🧋 🧃 🧉 🧊 🥢 🍽️ 🍴 🥄 🔪 🫙 🏺 🍄"
    },
    {
      name: "", icon: "🎉",
      emojis: "🎉 🎊 🎁 🎈 🎵 🎶 🎮 🎯 🎬 📸 🎤 🎧 ⚽ 🏀 🏈 ⚾ 🎾 🏆 🥇 🚗  " +
        "✈️ 🚀 🏠 ⛺ 🏖️ 🎀 🎆 🎇 🧨 🎃 🎄 🎋 🎍 🎎 🎏 🎐 🎑 🧧 🎗️ 🎟️  " +
        "🎫 🎖️ 🏅 🥈 🥉 🥎 🏐 🏉 🥏 🎳 🏏 🏑 🏒 🥍 🏓 🏸 🥊 🥋 🥅 ⛳  " +
        "⛸️ 🎣 🤿 🎽 🎿 🛷 🥌 🪀 🪁 🎱 🔮 🪄 🕹️ 🎰 🎲 🧩 🧸 🪅 🪩 🪆  " +
        "♠️ ♥️ ♦️ ♣️ ♟️ 🃏 🀄 🎴 🎭 🖼️ 🎨 🧵 🪡 🧶 🪢 🎼 🎹 🥁 🪘 🎷  " +
        "🎺 🪗 🎸 🪕 🎻 🪈 🪇 🪉 🪊 🛘 🪎 🚕 🚙 🚌 🚎 🏎️ 🚓 🚑 🚒 🚐  " +
        "🛻 🚚 🚜 🏍️ 🛵 🚲 🛴 🛹 🛼 🚂 🚆 🚇 🛫 🛬 🛩️ 🚁 🛸 🛰️ ⛵ 🚤  " +
        "🛥️ 🚢 ⚓ 🛟 ⛽ 🚧 🚦 🗺️ 🗿 🗽 🗼 🏰 🏯 🏟️ 🎡 🎢 🎠 ⛲ ⛱️ 🏝️  " +
        "🏜️ ⛰️ 🏔️ 🗻 🏕️ 🛖 🏡 🏢 🏥 🏦 🏫 ⛪ 🕌 🛕 🕍 ⛩️ 🌃 🏙️ 🌄 🌅  " +
        "🌆 🌇 🌉 💺 🫯"
    },
    {
      name: "", icon: "💼",
      emojis: "💼 💻 🖥️ ⌨️ 🖱️ 📱 📞 📧 📅 📌 📎 📝 📁 📊 📈 💡 🔒 🔑 ⏰ ⌛  " +
        "🔍 🔧 ⚙️ 📦 💰 🛠️ 🔨 🪓 ⛏️ ⚒️ 🔩 🧰 🧲 🪛 🪚 🔗 ⛓️ 🪝 📐 📏  " +
        "✂️ 🖊️ 🖋️ ✒️ ✏️ 🖌️ 🖍️ 📒 📓 📔 📕 📖 📗 📘 📙 📚 📃 📜 📄 📰  " +
        "🗞️ 📑 🔖 🏷️ 🗂️ 📂 🗃️ 🗄️ 🗑️ 📋 📍 🖇️ 📆 🗒️ 🗓️ 📇 📉 📤 📥 📨  " +
        "📩 💌 ✉️ 📮 📪 📫 📬 📭 🗳️ 🔓 🗝️ 🔐 🔏 📺 📷 📹 🎥 📽️ 🎞️ 📼  " +
        "💽 💾 💿 📀 🖨️ 🖲️ 🔋 🪫 🔌 📲 ☎️ 📟 📠 📡 🧮 💳 💵 💴 💶 💷  " +
        "💸 🪙 🧾 💹 🔭 🔬 🧪 🧫 🧬 ⚗️ 💊 💉 🩸 🩹 🩼 🩺 🩻 🕯️ 🔦 🏮  " +
        "🪔 🛒 🛏️ 🛋️ 🪑 🚪 🛗 🪞 🪟 🚽 🪠 🚿 🛁 🪤 🪒 🧴 🧷 🧹 🧺 🧻  " +
        "🪣 🧼 🫧 🪥 🧽 🧯 🕰️ ⏳ ⌚ ⏱️ ⏲️ 🧿 🪬 🪪 🪧 🎓 👑 💍 💎 👓  " +
        "🕶️ 🥽 🥼 🦺 🧢 🎩 👒 🪖 ⛑️ 📿 💄 🎒 👜 👛 👝 🛍️ 👔 👕 👖 🧣  " +
        "🧤 🧥 🧦 👗 👘 🥻 🩱 🩲 🩳 👙 👚 👞 👟 🥾 🥿 👠 👡 🩰 👢 🪮  " +
        "🗡️ ⚔️ 💣 🛡️ 🏹"
    }
  ]
};

// Дефолтные списки записаны одной строкой: первые 25 уходят в основную панель, остальные в «Ещё».
EW_DEFAULTS.sectors = EW_DEFAULTS.sectors.map((s) => ({ name: s.name, icon: s.icon, ...ewSplitLegacy(s.emojis) }));

function ewSplitLegacy(combined) {
  const all = [...new Set(ewSplitEmojis(combined))];
  return { emojis: all.slice(0, EW_MAIN_MAX).join(" "), more: all.slice(EW_MAIN_MAX).join(" ") };
}

function ewNormalize(saved) {
  const out = {
    modifier: EW_DEFAULTS.modifier,
    trigger: EW_DEFAULTS.trigger,
    lang: typeof ewDetectLang === "function" ? ewDetectLang() : "en",
    sectors: EW_DEFAULTS.sectors.map((s) => ({ ...s }))
  };
  if (!saved || typeof saved !== "object") return out;
  if (["alt", "shift", "ctrl"].includes(saved.modifier)) out.modifier = saved.modifier;
  if (["key", "chord", "both"].includes(saved.trigger)) out.trigger = saved.trigger;
  if (typeof EW_I18N !== "undefined" && EW_I18N[saved.lang]) out.lang = saved.lang;
  if (Array.isArray(saved.sectors)) {
    for (let i = 0; i < 8; i++) {
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
  return ewNormalize({
    modifier: d.cfg?.modifier ?? legacy.modifier,
    trigger: d.cfg?.trigger ?? legacy.trigger,
    lang: d.cfg?.lang ?? legacy.lang,
    sectors: EW_SECTOR_KEYS.map((k, i) => d[k] ?? legacy.sectors?.[i])
  });
}

async function ewSave(s) {
  const items = { cfg: { modifier: s.modifier, trigger: s.trigger, lang: s.lang } };
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
