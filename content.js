(() => {
  const DEFAULTS = {
    enabled: true,
    effect: "confetti",
    intensity: 1,
    colors: ["#ff4757", "#3742fa", "#2ed573", "#ffa502", "#a55eea", "#1e90ff", "#ff6b81"],
    reduceMotionRespect: true
  };

  let state = { ...DEFAULTS };
  let overlay = null;
  let ready = false;

  const waitForOverlayClass = () =>
    new Promise(resolve => {
        if (window.ParticleOverlay) 
            return resolve();
        
        const iv = setInterval(() => {
            if (window.ParticleOverlay) { 
                clearInterval(iv); 
                resolve(); 
            }
        }, 0);
    });

  const init = async () => {
    try {
      const saved = await chrome.storage.local.get(DEFAULTS);
      state = { ...DEFAULTS, ...saved };

      if (!overlay) {
        overlay = window.__confettiOverlay || createOverlay();
        window.__confettiOverlay = overlay;
      }

      bind();
      ready = true;
    } catch (e) {
      console.warn("[ConfettiClicker] init error:", e);
    }

    await waitForOverlayClass();
  };

  // Create a fixed, full-viewport container with a Shadow DOM to avoid CSS conflicts
  const createOverlay = () => {
    const host = document.createElement("div");
    host.setAttribute("data-confetti-overlay", "");
    Object.assign(host.style, {
      position: "fixed",
      top: "0",
      left: "0",
      width: "100vw",
      height: "100vh",
      pointerEvents: "none",
      zIndex: "2147483647",
      transform: "none !important"
    });

    const shadow = host.attachShadow({ mode: "open" });

    // Canvas injected by overlay.js via global class
    const canvas = document.createElement("canvas");
    canvas.setAttribute("part", "canvas");
    Object.assign(canvas.style, {
      width: "100vw",
      height: "100vh",
      display: "block",
      pointerEvents: "none"
    });
    shadow.appendChild(canvas);

    document.documentElement.appendChild(host);

    // Use the overlay particle engine from overlay.js
    const engine = new window.ParticleOverlay(canvas);

    return { host, shadow, canvas, engine };
  };

  const bind = () => {
    // Pointer click handler
    document.addEventListener("pointerup", onClick, { passive: true });
    // Window resize to keep canvas crisp
    window.addEventListener("resize", resizeCanvas, { passive: true });
    resizeCanvas();

    // Storage changes (sync settings live if popup changes)
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== "local") return;
      for (const [k, { newValue }] of Object.entries(changes)) {
        state[k] = newValue;
      }
    });

  };

  const onClick = (e) => {
    if (!ready || !state.enabled || !overlay) return;

    // Respect prefers-reduced-motion if enabled
    if (state.reduceMotionRespect && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // Ignore clicks on the browser chrome or outside doc
    if (!(e.target instanceof Element)) return;

    const rect = document.documentElement.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    runEffect(x, y);
  };

  const runEffect = (x, y) => {
    const intensity = Math.max(0.25, Math.min(3, Number(state.intensity) || 1));
    const options = {
      x,
      y,
      colors: state.colors,
      count: Math.round(60 * intensity),
      power: 1 * intensity
    };

    switch (state.effect) {
      case "fireworks":
        overlay.engine.fireworks(options);
        break;
      case "balloons":
        overlay.engine.balloons(options);
        break;
      case "confetti":
      default:
        overlay.engine.confetti(options);
        break;
    }
  };

  const resizeCanvas = () => {
    if (!overlay) return;
    const dpr = Math.max(1, Math.min(3, window.devicePixelRatio || 1));
    const canvas = overlay.canvas;
    const w = window.innerWidth;
    const h = window.innerHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.getContext("2d").setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  init();
})();
