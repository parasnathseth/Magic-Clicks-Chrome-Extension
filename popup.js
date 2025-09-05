const DEFAULTS = {
  enabled: true,
  effect: "shuffle",
  intensity: 1,
  colors: [
    "#ff4757",
    "#3742fa",
    "#2ed573",
    "#ffa502",
    "#a55eea",
    "#1e90ff",
    "#ff6b81",
  ],
  reduceMotionRespect: true,
};

const $ = (sel) => document.querySelector(sel);
const colorsEl = $("#colors");

async function load() {
  const saved = await chrome.storage.local.get(DEFAULTS);
  const state = { ...DEFAULTS, ...saved };

  $("#enabled").checked = state.enabled;
  $("#effect").value = state.effect;
  $("#intensity").value = state.intensity;
  $("#reduced").checked = state.reduceMotionRespect;

  renderColors(state.colors);
}

function renderColors(colors) {
  colorsEl.innerHTML = "";
  colors.forEach((c, idx) => {
    const wrapper = document.createElement("div");
    wrapper.className = "color-row";

    const input = document.createElement("input");
    input.type = "color";
    input.value = toHex(c);
    input.addEventListener("input", () => saveColor(idx, input.value));

    const del = document.createElement("button");
    del.type = "button";
    del.textContent = "✕";
    del.title = "Remove";
    del.addEventListener("click", async () => {
      const { colors } = await chrome.storage.local.get({
        colors: DEFAULTS.colors,
      });
      colors.splice(idx, 1);
      await chrome.storage.local.set({
        colors: colors.length ? colors : DEFAULTS.colors,
      });
      load();
    });

    wrapper.appendChild(input);
    wrapper.appendChild(del);
    colorsEl.appendChild(wrapper);
  });
}

function toHex(c) {
  // normalize formats like rgb / named colors if ever present; minimal implementation
  if (c.startsWith("#")) return c;
  return "#000000";
}

async function save(key, value) {
  await chrome.storage.local.set({ [key]: value });
}

async function saveColor(index, value) {
  const { colors } = await chrome.storage.local.get({
    colors: DEFAULTS.colors,
  });
  colors[index] = value;
  await chrome.storage.local.set({ colors });
}

$("#enabled").addEventListener("change", (e) =>
  save("enabled", e.target.checked)
);
$("#effect").addEventListener("change", (e) => save("effect", e.target.value));
$("#intensity").addEventListener("input", (e) =>
  save("intensity", Number(e.target.value))
);
$("#reduced").addEventListener("change", (e) =>
  save("reduceMotionRespect", e.target.checked)
);

$("#addColor").addEventListener("click", async () => {
  const { colors } = await chrome.storage.local.get({
    colors: DEFAULTS.colors,
  });
  colors.push(
    "#" +
      Math.floor(Math.random() * 0xffffff)
        .toString(16)
        .padStart(6, "0")
  );
  await chrome.storage.local.set({ colors });
  load();
});

$("#reset").addEventListener("click", async () => {
  await chrome.storage.local.set({ ...DEFAULTS });
  load();
});

load();
