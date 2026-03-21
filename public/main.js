// main.js v9.5 (Cache Buster + Detección Agresiva)
// =========================================================

const countryClassMap = {
  "España": "badge-spain", "Francia": "badge-france", "Alemania": "badge-germany", "EE.UU": "badge-usa", 
  "Honduras": "badge-honduras", "Nicaragua": "badge-nicaragua", "Perú": "badge-peru", "Argentina": "badge-argentina", 
  "Chile": "badge-chile", "Colombia": "badge-colombia", "Bolivia": "badge-bolivia", "Venezuela": "badge-venezuela", 
  "Guatemala": "badge-guatemala", "Ecuador": "badge-ecuador", "El Salvador": "badge-elsalvador", 
  "Costa Rica": "badge-costarica", "Puerto Rico": "badge-puertorico", "México": "badge-mexico", "Custom": "badge-custom" 
};

let stations = [];
let favorites = new Set();
let currentStation = null;
let isPlaying = false;
let timerInterval = null;
let secondsElapsed = 0;
let isStationsLoading = true;

let els = {};

const escapeHtml = (value) => String(value ?? "")
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/\"/g, "&quot;")
  .replace(/'/g, "&#39;");

const hardenExternalLinks = () => {
  const links = document.querySelectorAll('a[target="_blank"]');
  links.forEach((link) => {
    const relValues = new Set((link.getAttribute("rel") || "").split(/\s+/).filter(Boolean));
    relValues.add("noopener");
    relValues.add("noreferrer");
    link.setAttribute("rel", [...relValues].join(" "));
  });
};

const nativePlayerBridge = {
  available() {
    return typeof window !== "undefined"
      && typeof window.AndroidNativePlayer !== "undefined"
      && typeof window.AndroidNativePlayer.play === "function";
  },
  play(station) {
    if (!this.available() || !station?.url) return false;
    try {
      const preview = getNativeQueuePreview(station);
      window.AndroidNativePlayer.play(
        station.url,
        station.name || "Radio Satelital",
        station.country || "En vivo",
        preview.prevTitle,
        preview.nextTitle
      );
      return true;
    } catch (_) {
      return false;
    }
  },
  pause() {
    if (!this.available() || typeof window.AndroidNativePlayer.pause !== "function") return false;
    try { window.AndroidNativePlayer.pause(); return true; } catch (_) { return false; }
  },
  resume() {
    if (!this.available() || typeof window.AndroidNativePlayer.resume !== "function") return false;
    try { window.AndroidNativePlayer.resume(); return true; } catch (_) { return false; }
  },
  stop() {
    if (!this.available() || typeof window.AndroidNativePlayer.stop !== "function") return false;
    try { window.AndroidNativePlayer.stop(); return true; } catch (_) { return false; }
  },
  setVolume(value) {
    if (!this.available() || typeof window.AndroidNativePlayer.setVolume !== "function") return false;
    const safeValue = Math.max(0, Math.min(1, Number(value)));
    try { window.AndroidNativePlayer.setVolume(safeValue); return true; } catch (_) { return false; }
  },
  setEqEnabled(enabled) {
    if (!this.available() || typeof window.AndroidNativePlayer.setEqEnabled !== "function") return false;
    try { window.AndroidNativePlayer.setEqEnabled(Boolean(enabled)); return true; } catch (_) { return false; }
  },
  setEqBandLevel(band, level) {
    if (!this.available() || typeof window.AndroidNativePlayer.setEqBandLevel !== "function") return false;
    const safeBand = Number.parseInt(String(band), 10);
    const safeLevel = Number.parseInt(String(level), 10);
    if (!Number.isFinite(safeBand) || !Number.isFinite(safeLevel)) return false;
    try { window.AndroidNativePlayer.setEqBandLevel(safeBand, safeLevel); return true; } catch (_) { return false; }
  },
  resetEq() {
    if (!this.available() || typeof window.AndroidNativePlayer.resetEq !== "function") return false;
    try { window.AndroidNativePlayer.resetEq(); return true; } catch (_) { return false; }
  }
};

const isAndroidRuntime = () => {
  try {
    return /android/i.test(navigator.userAgent || "");
  } catch (_) {
    return false;
  }
};

const applyNativeAndroidMode = () => {
  if (!isAndroidRuntime()) return;
  document.body.classList.add("native-android");
};

const getNativeQueuePreview = (station) => {
  const fallback = { prevTitle: "", nextTitle: "" };
  if (!station || !Array.isArray(stations) || stations.length < 2) return fallback;

  const index = stations.findIndex(s => s.name === station.name && s.url === station.url);
  if (index < 0) return fallback;

  const prevIndex = (index - 1 + stations.length) % stations.length;
  const nextIndex = (index + 1) % stations.length;

  return {
    prevTitle: stations[prevIndex]?.name || "",
    nextTitle: stations[nextIndex]?.name || ""
  };
};

const handleNativePlayerState = (detail) => {
  if (!detail || !nativePlayerBridge.available()) return;

  const state = String(detail.state || "").toLowerCase();
  const message = String(detail.message || "");

  if (state === "buffering") {
    if (els.status) {
      els.status.innerText = message || "CONECTANDO...";
      els.status.classList.remove("live");
    }
    if (els.badge) {
      els.badge.style.display = "inline-block";
      els.badge.innerText = "Conectando...";
    }
    return;
  }

  if (state === "playing") {
    recordStreamMetric(currentStation, true, "native_playing");
    setPlayingState(true);
    if (els.status) els.status.innerText = message || "EN VIVO";
    return;
  }

  if (state === "paused" || state === "stopped") {
    setPlayingState(false);
    if (els.status) {
      els.status.innerText = message || (state === "stopped" ? "DETENIDO" : "PAUSADO");
      els.status.classList.remove("live");
    }
    return;
  }

  if (state === "error") {
    recordStreamMetric(currentStation, false, message || "native_error");
    setPlayingState(false);
    if (els.status) {
      els.status.innerText = message || "SIN SEÑAL / CAMBIANDO...";
      els.status.style.color = "#ff5252";
      els.status.classList.remove("live");
    }
  }
};

const handleNativePlayerCommand = (detail) => {
  if (!detail || !nativePlayerBridge.available()) return;

  const command = String(detail.command || "").toLowerCase();
  if (command === "next") {
    skipStation(1);
  } else if (command === "previous") {
    skipStation(-1);
  }
};

const GLOBAL_SUBMIT_LOG_KEY = "ultra_global_submit_log";
const LAST_STATION_KEY = "ultra_last_station";
const UI_PREFS_KEY = "ultra_ui_prefs";
const RUNTIME_ERRORS_KEY = "ultra_runtime_errors";
const STREAM_METRICS_KEY = "ultra_stream_metrics";
const EQ_BAND_LIMIT = 1200;
const EQ_BANDS = 5;
const PLAYER_MOTION_MIN = 0;
const PLAYER_MOTION_MAX = 100;
const MAX_RUNTIME_ERRORS = 60;

let sleepTimerId = null;
let quickToastTimerId = null;
let autoRetryTimeoutId = null;

const AUDIO_PREF_DEFAULTS = {
  audioVolume: 1,
  autoRetry: true,
  retrySeconds: 2,
  menuFavOnly: false,
  playerMotion: 100,
  playerMotionEnabled: true,
  listMotionEnabled: true,
  eqEnabled: true,
  eqBands: [0, 0, 0, 0, 0]
};

let uiPrefs = {
  compactUi: false,
  decorativeMotion: true,
  ...AUDIO_PREF_DEFAULTS
};

const safeJsonParse = (raw, fallback) => {
  try {
    return JSON.parse(raw);
  } catch (_) {
    return fallback;
  }
};

const appendRuntimeError = (source, errLike) => {
  const now = new Date().toISOString();
  const message = String(errLike?.message || errLike || "Error desconocido").slice(0, 400);
  const stack = String(errLike?.stack || "").slice(0, 1200);
  const previous = safeJsonParse(localStorage.getItem(RUNTIME_ERRORS_KEY) || "[]", []);
  const next = Array.isArray(previous) ? previous : [];
  next.push({ ts: now, source, message, stack });
  while (next.length > MAX_RUNTIME_ERRORS) next.shift();
  localStorage.setItem(RUNTIME_ERRORS_KEY, JSON.stringify(next));
};

const registerRuntimeErrorHandlers = () => {
  window.addEventListener("error", (event) => {
    appendRuntimeError("window.error", event?.error || event?.message || "Error de ventana");
  });

  window.addEventListener("unhandledrejection", (event) => {
    appendRuntimeError("unhandledrejection", event?.reason || "Promesa rechazada sin manejo");
  });
};

const recordStreamMetric = (station, ok, reason = "") => {
  if (!station?.name || !station?.url) return;
  const key = stationKey(station);
  const metrics = safeJsonParse(localStorage.getItem(STREAM_METRICS_KEY) || "{}", {});
  const safeMetrics = metrics && typeof metrics === "object" ? metrics : {};
  const current = safeMetrics[key] || {
    name: station.name,
    url: station.url,
    ok: 0,
    fail: 0,
    lastReason: "",
    lastOkAt: "",
    lastFailAt: ""
  };

  if (ok) {
    current.ok += 1;
    current.lastOkAt = new Date().toISOString();
  } else {
    current.fail += 1;
    current.lastFailAt = new Date().toISOString();
    current.lastReason = String(reason || "sin_detalle").slice(0, 180);
  }

  safeMetrics[key] = current;
  localStorage.setItem(STREAM_METRICS_KEY, JSON.stringify(safeMetrics));
};

const loadUiPrefs = () => {
  try {
    const raw = JSON.parse(localStorage.getItem(UI_PREFS_KEY) || "{}");
    const rawEqBands = Array.isArray(raw.eqBands) ? raw.eqBands : AUDIO_PREF_DEFAULTS.eqBands;
    const eqBands = Array.from({ length: EQ_BANDS }, (_, i) => {
      const value = Number(rawEqBands[i]);
      if (!Number.isFinite(value)) return 0;
      return Math.min(EQ_BAND_LIMIT, Math.max(-EQ_BAND_LIMIT, Math.round(value / 100) * 100));
    });
    
    // Validar playerMotion - forzar a rango válido [0, 100]
    let playerMotionVal = AUDIO_PREF_DEFAULTS.playerMotion;
    if (Number.isFinite(raw.playerMotion)) {
      const rounded = Math.round(raw.playerMotion);
      playerMotionVal = Math.min(PLAYER_MOTION_MAX, Math.max(PLAYER_MOTION_MIN, rounded));
    }
    
    uiPrefs = {
      compactUi: raw.compactUi === true,
      decorativeMotion: raw.decorativeMotion !== false,
      audioVolume: Number.isFinite(raw.audioVolume) ? Math.min(1, Math.max(0, raw.audioVolume)) : AUDIO_PREF_DEFAULTS.audioVolume,
      autoRetry: raw.autoRetry !== false,
      retrySeconds: Number.isFinite(raw.retrySeconds) ? Math.min(8, Math.max(2, raw.retrySeconds)) : AUDIO_PREF_DEFAULTS.retrySeconds,
      menuFavOnly: raw.menuFavOnly === true,
      playerMotion: playerMotionVal,
      playerMotionEnabled: raw.playerMotionEnabled !== false,
      listMotionEnabled: raw.listMotionEnabled !== false,
      eqEnabled: raw.eqEnabled !== false,
      eqBands
    };
  } catch (_) {
    uiPrefs = { compactUi: false, decorativeMotion: true, ...AUDIO_PREF_DEFAULTS };
  }
};

const persistUiPrefs = () => {
  localStorage.setItem(UI_PREFS_KEY, JSON.stringify(uiPrefs));
};

const applyUiPrefs = () => {
  document.body.classList.toggle("compact-ui", uiPrefs.compactUi);
  document.body.classList.toggle("deco-off", !uiPrefs.decorativeMotion);
  const playerMotionDisabled = uiPrefs.playerMotionEnabled === false || Number(uiPrefs.playerMotion) <= 0;
  document.body.classList.toggle("motion-player-off", playerMotionDisabled);
  document.body.classList.toggle("motion-list-off", uiPrefs.listMotionEnabled === false);
  const safePlayerMotion = Number.isFinite(uiPrefs.playerMotion) ? uiPrefs.playerMotion : AUDIO_PREF_DEFAULTS.playerMotion;
  const motionMult = Math.min(1, Math.max(0, safePlayerMotion / 100));
  document.documentElement.style.setProperty("--player-motion-mult", String(motionMult));
  updateUiPrefButtons();
};

const updateUiPrefButtons = () => {
  if (els.btnToggleCompactUi) {
    els.btnToggleCompactUi.innerText = `Modo compacto: ${uiPrefs.compactUi ? "ON" : "OFF"}`;
  }
  if (els.btnToggleDecoMotion) {
    els.btnToggleDecoMotion.innerText = `Animaciones decorativas: ${uiPrefs.decorativeMotion ? "SI" : "NO"}`;
  }
  if (els.btnTogglePlayerMotion) {
    const playerMotionActive = uiPrefs.playerMotionEnabled && Number(uiPrefs.playerMotion) > 0;
    els.btnTogglePlayerMotion.innerText = `Animaciones reproductor: ${playerMotionActive ? "SI" : "NO"}`;
  }
  if (els.btnToggleListMotion) {
    els.btnToggleListMotion.innerText = `Animaciones lista: ${uiPrefs.listMotionEnabled ? "SI" : "NO"}`;
  }
  if (els.btnToggleAutoRetry) {
    els.btnToggleAutoRetry.innerText = `Auto-reintento: ${uiPrefs.autoRetry ? "ON" : "OFF"}`;
  }
  if (els.btnMenuFavOnly) {
    els.btnMenuFavOnly.innerText = `Solo favoritas (menú): ${uiPrefs.menuFavOnly ? "ON" : "OFF"}`;
  }
  if (els.retrySeconds) {
    els.retrySeconds.value = String(uiPrefs.retrySeconds);
  }
  if (els.audioVolume) {
    els.audioVolume.value = String(Math.round(uiPrefs.audioVolume * 100));
  }
  if (els.audioVolumeValue) {
    els.audioVolumeValue.innerText = `${Math.round(uiPrefs.audioVolume * 100)}%`;
  }
  if (els.playerMotion) {
    els.playerMotion.value = String(uiPrefs.playerMotion || AUDIO_PREF_DEFAULTS.playerMotion);
  }
  if (els.playerMotionValue) {
    els.playerMotionValue.innerText = `${uiPrefs.playerMotion || AUDIO_PREF_DEFAULTS.playerMotion}%`;
  }
  if (els.btnEqToggle) {
    els.btnEqToggle.innerText = `Ecualizador: ${uiPrefs.eqEnabled ? "ON" : "OFF"}`;
  }
  if (Array.isArray(els.eqBandInputs)) {
    els.eqBandInputs.forEach((input, idx) => {
      if (!input) return;
      const value = Number(uiPrefs.eqBands[idx] || 0);
      input.value = String(value);
      const valueLabel = els.eqBandValues?.[idx];
      if (valueLabel) valueLabel.innerText = String(value);
    });
  }
};

const applyNativeEqPrefs = () => {
  if (!nativePlayerBridge.available()) return;
  nativePlayerBridge.setEqEnabled(uiPrefs.eqEnabled);
  if (!uiPrefs.eqEnabled) return;
  uiPrefs.eqBands.forEach((level, idx) => {
    nativePlayerBridge.setEqBandLevel(idx, level);
  });
};

const applyAudioPrefs = () => {
  if (nativePlayerBridge.available()) {
    nativePlayerBridge.setVolume(uiPrefs.audioVolume);
    applyNativeEqPrefs();
  } else if (els.player) {
    els.player.volume = uiPrefs.audioVolume;
  }
};

const showQuickToast = (message, type = "info") => {
  if (!message) return;
  let toast = document.getElementById("quickToast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "quickToast";
    toast.className = "quick-toast";
    document.body.appendChild(toast);
  }
  toast.classList.remove("info", "success", "warn");
  toast.classList.add(type);
  toast.innerText = message;
  toast.classList.add("show");

  if (quickToastTimerId) clearTimeout(quickToastTimerId);
  quickToastTimerId = setTimeout(() => {
    toast.classList.remove("show");
    quickToastTimerId = null;
  }, 900);
};

const resetAudioPrefs = () => {
  uiPrefs.audioVolume = AUDIO_PREF_DEFAULTS.audioVolume;
  uiPrefs.autoRetry = AUDIO_PREF_DEFAULTS.autoRetry;
  uiPrefs.retrySeconds = AUDIO_PREF_DEFAULTS.retrySeconds;
  uiPrefs.menuFavOnly = AUDIO_PREF_DEFAULTS.menuFavOnly;
  uiPrefs.playerMotion = AUDIO_PREF_DEFAULTS.playerMotion;
  uiPrefs.playerMotionEnabled = AUDIO_PREF_DEFAULTS.playerMotionEnabled;
  uiPrefs.listMotionEnabled = AUDIO_PREF_DEFAULTS.listMotionEnabled;
  uiPrefs.eqEnabled = AUDIO_PREF_DEFAULTS.eqEnabled;
  uiPrefs.eqBands = [...AUDIO_PREF_DEFAULTS.eqBands];

  persistUiPrefs();
  applyAudioPrefs();
  if (nativePlayerBridge.available()) nativePlayerBridge.resetEq();
  applyUiPrefs();
  renderList();
  showQuickToast("Audio restaurado", "success");
};

const scheduleAutoRetry = () => {
  if (!uiPrefs.autoRetry) return;
  const waitMs = Math.max(1000, uiPrefs.retrySeconds * 1000);
  if(els.status) {
    els.status.innerText = `REINTENTANDO EN ${uiPrefs.retrySeconds}s...`;
    els.status.style.color = "#f59e0b";
  }
  if (autoRetryTimeoutId) clearTimeout(autoRetryTimeoutId);
  autoRetryTimeoutId = setTimeout(() => {
    autoRetryTimeoutId = null;
    skipStation(1);
  }, waitMs);
};

const stopPlaybackNow = () => {
  if (nativePlayerBridge.available()) {
    nativePlayerBridge.pause();
  } else if (els.player) {
    els.player.pause();
  }
  setPlayingState(false);
};

const startSleepTimer = (minutes) => {
  if (!Number.isFinite(minutes) || minutes <= 0) return;
  if (sleepTimerId) clearTimeout(sleepTimerId);

  sleepTimerId = setTimeout(() => {
    stopPlaybackNow();
    if (els.status) {
      els.status.innerText = "TEMPORIZADOR FINALIZADO";
      els.status.style.color = "#fbbf24";
    }
    sleepTimerId = null;
  }, minutes * 60 * 1000);

  if (els.status) {
    els.status.innerText = `Temporizador: ${minutes} min`;
    els.status.style.color = "";
  }
};

const cancelSleepTimer = () => {
  if (sleepTimerId) {
    clearTimeout(sleepTimerId);
    sleepTimerId = null;
    if (els.status) {
      els.status.innerText = isPlaying ? "EN VIVO" : "LISTO";
      els.status.style.color = "";
    }
  }
};

const shareCurrentStation = async () => {
  if (!currentStation) {
    alert("Selecciona una emisora primero.");
    return;
  }

  const payload = {
    title: `Radio Satelital · ${currentStation.name}`,
    text: `Escucha ${currentStation.name} (${currentStation.country}) en Radio Satelital`,
    url: currentStation.url
  };

  try {
    if (navigator.share) {
      await navigator.share(payload);
      return;
    }
  } catch (_) {}

  try {
    await navigator.clipboard.writeText(currentStation.url);
    alert("URL copiada para compartir.");
  } catch (_) {
    alert(currentStation.url);
  }
};

const copyCurrentStationUrl = async () => {
  if (!currentStation?.url) {
    alert("No hay emisora activa.");
    return;
  }
  try {
    await navigator.clipboard.writeText(currentStation.url);
    if (els.status) els.status.innerText = "URL COPIADA";
  } catch (_) {
    alert(currentStation.url);
  }
};

const exportFavorites = () => {
  const payload = {
    exportedAt: new Date().toISOString(),
    favorites: [...favorites]
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "radio-satelital-favoritos.json";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

const importFavoritesFromFile = async (file) => {
  if (!file) return;
  try {
    const text = await file.text();
    const parsed = JSON.parse(text);
    const imported = Array.isArray(parsed.favorites) ? parsed.favorites : [];
    const valid = imported.filter((v) => typeof v === "string" && v.trim()).map((v) => v.trim());
    favorites = new Set(valid);
    localStorage.setItem("ultra_favs", JSON.stringify([...favorites]));
    renderList();
    if (els.status) els.status.innerText = "FAVORITOS IMPORTADOS";
  } catch (_) {
    alert("El archivo no es válido.");
  }
};

const prefersReducedMotion = () => {
  try {
    return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch (_) {
    return false;
  }
};

const applyMotionProfile = () => {
  if (prefersReducedMotion()) return;

  const cores = Number(navigator.hardwareConcurrency || 8);
  const memory = Number(navigator.deviceMemory || 8);
  const isCompactProfile = cores <= 4 || memory <= 4;

  document.body.classList.remove("motion-compact", "motion-full");
  document.body.classList.add(isCompactProfile ? "motion-compact" : "motion-full");
};

const saveLastStation = (station) => {
  if (!station?.name || !station?.url) return;
  try {
    localStorage.setItem(LAST_STATION_KEY, stationKey(station));
  } catch (_) {}
};

const getSavedStation = () => {
  try {
    const key = localStorage.getItem(LAST_STATION_KEY);
    if (!key) return null;
    return stations.find((s) => stationKey(s) === key) || null;
  } catch (_) {
    return null;
  }
};

const focusStationCard = (station) => {
  if (!els.list || !station) return;
  const encoded = encodeURIComponent(stationKey(station));
  const card = els.list.querySelector(`[data-station-key="${encoded}"]`);
  if (!card) return;

  card.classList.remove("startup-focus");
  void card.offsetWidth;
  card.classList.add("startup-focus");
  card.scrollIntoView({ behavior: "smooth", block: "nearest" });

  setTimeout(() => card.classList.remove("startup-focus"), 1200);
};

const isPrivateHost = (host) => {
  const value = (host || "").trim().toLowerCase();
  if (!value) return true;
  if (value === "localhost" || value.endsWith(".local")) return true;
  if (value === "127.0.0.1" || value === "::1") return true;
  if (/^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[0-1])\.)/.test(value)) return true;
  return false;
};

const validateStationUrl = (urlValue) => {
  try {
    const parsed = new URL(urlValue);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      return { valid: false, reason: "La URL debe usar http o https." };
    }
    if (!parsed.hostname || isPrivateHost(parsed.hostname)) {
      return { valid: false, reason: "La URL debe ser pública (no localhost/red privada)." };
    }
    return { valid: true, url: parsed.toString() };
  } catch (_) {
    return { valid: false, reason: "La URL no es válida." };
  }
};

const checkStreamReachable = (url, timeoutMs = 12000) => new Promise((resolve) => {
  const audio = new Audio();
  let settled = false;

  const finish = (ok) => {
    if (settled) return;
    settled = true;
    audio.pause();
    audio.removeAttribute("src");
    audio.load();
    resolve(ok);
  };

  const timer = setTimeout(() => finish(false), timeoutMs);
  const success = () => {
    clearTimeout(timer);
    finish(true);
  };
  const fail = () => {
    clearTimeout(timer);
    finish(false);
  };

  audio.preload = "none";
  audio.crossOrigin = "anonymous";
  audio.addEventListener("canplay", success, { once: true });
  audio.addEventListener("loadedmetadata", success, { once: true });
  audio.addEventListener("playing", success, { once: true });
  audio.addEventListener("error", fail, { once: true });
  audio.src = url;
  audio.load();
});

const canSubmitGlobalNow = (limitPerMinute) => {
  const now = Date.now();
  const oneMinuteAgo = now - 60_000;
  const previous = JSON.parse(localStorage.getItem(GLOBAL_SUBMIT_LOG_KEY) || "[]");
  const recent = previous.filter((t) => Number.isFinite(t) && t > oneMinuteAgo);

  if (recent.length >= limitPerMinute) {
    const waitMs = Math.max(0, 60_000 - (now - recent[0]));
    return { allowed: false, waitSeconds: Math.ceil(waitMs / 1000) };
  }

  recent.push(now);
  localStorage.setItem(GLOBAL_SUBMIT_LOG_KEY, JSON.stringify(recent));
  return { allowed: true, waitSeconds: 0 };
};

const getSupabaseConfig = () => {
  const cfg = window.SUPABASE_CONFIG || {};
  if (!cfg.url || !cfg.anonKey) return null;
  return {
    url: String(cfg.url).replace(/\/$/, ""),
    anonKey: String(cfg.anonKey),
    table: cfg.table || "global_stations",
    restUrl: cfg.restUrl || null,
    limitPerMinute: Number.isFinite(cfg.limitPerMinute) ? Math.max(1, cfg.limitPerMinute) : 3,
    streamCheckTimeoutMs: Number.isFinite(cfg.streamCheckTimeoutMs) ? Math.max(3000, cfg.streamCheckTimeoutMs) : 12000,
    requireStreamValidation: cfg.requireStreamValidation !== false
  };
};

const stationKey = (station) => `${String(station.name || "").trim().toLowerCase()}|${String(station.url || "").trim().toLowerCase()}`;

const mergeStationSources = (localStations, globalStations) => {
  const byKey = new Map();
  [...defaultStations, ...(globalStations || []), ...(localStations || [])].forEach((station) => {
    byKey.set(stationKey(station), station);
  });
  return [...byKey.values()];
};

const loadGlobalStations = async () => {
  const cfg = getSupabaseConfig();
  if (!cfg) return [];

  const select = "name,url,country,region,district,caserio";
  const baseRest = cfg.restUrl ? String(cfg.restUrl).replace(/\/$/, "") : `${cfg.url}/rest/v1`;
  const endpoint = `${baseRest}/${cfg.table}?select=${encodeURIComponent(select)}&status=eq.approved&order=approved_at.desc.nullslast,created_at.desc`;

  try {
    const response = await fetch(endpoint, {
      method: "GET",
      headers: {
        "apikey": cfg.anonKey,
        "Authorization": `Bearer ${cfg.anonKey}`
      }
    });

    if (!response.ok) return [];
    const rows = await response.json();
    if (!Array.isArray(rows)) return [];

    return rows.map((row) => ({
      name: row.name,
      url: row.url,
      country: row.country,
      region: row.region,
      district: row.district || undefined,
      caserio: row.caserio || undefined,
      isCustom: true,
      isGlobal: true
    }));
  } catch (_) {
    return [];
  }
};

const persistGlobalStation = async (station) => {
  const cfg = getSupabaseConfig();
  if (!cfg) return false;

  const baseRest = cfg.restUrl ? String(cfg.restUrl).replace(/\/$/, "") : `${cfg.url}/rest/v1`;
  const endpoint = `${baseRest}/${cfg.table}`;
  const payload = {
    name: station.name,
    url: station.url,
    country: station.country,
    region: station.region,
    district: station.district || null,
    caserio: station.caserio || null,
    status: "pending"
  };

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": cfg.anonKey,
      "Authorization": `Bearer ${cfg.anonKey}`,
      "Prefer": "resolution=merge-duplicates,return=representation"
    },
    body: JSON.stringify(payload)
  });

  return response.ok;
};

const tauriInvoke = () => {
  try {
    return window.__TAURI__?.core?.invoke || null;
  } catch (_) {
    return null;
  }
};

const loadCustomStations = async () => {
  const invoke = tauriInvoke();
  if (invoke) {
    try {
      const items = await invoke("list_custom_stations");
      return Array.isArray(items) ? items : [];
    } catch (e) {
      console.warn("No se pudo leer SQLite, usando almacenamiento local.", e);
    }
  }

  return JSON.parse(localStorage.getItem("ultra_custom") || "[]");
};

const persistCustomStation = async (station) => {
  const invoke = tauriInvoke();
  if (invoke) {
    await invoke("add_custom_station", {
      station: {
        name: station.name,
        url: station.url,
        country: station.country,
        region: station.region,
        district: station.district || null,
        caserio: station.caserio || null
      }
    });
    return;
  }

  const customStations = JSON.parse(localStorage.getItem("ultra_custom") || "[]");
  customStations.push(station);
  localStorage.setItem("ultra_custom", JSON.stringify(customStations));
};

const removeCustomStation = async (station) => {
  const invoke = tauriInvoke();
  if (invoke) {
    await invoke("delete_custom_station", { name: station.name, url: station.url });
    return;
  }

  let customStations = JSON.parse(localStorage.getItem("ultra_custom") || "[]");
  customStations = customStations.filter(s => !(s.name === station.name && s.url === station.url));
  localStorage.setItem("ultra_custom", JSON.stringify(customStations));
};

const init = async () => {
  console.log("Iniciando Sistema v9.5...");
  applyMotionProfile();
  hardenExternalLinks();
  registerRuntimeErrorHandlers();
  
  els = {
    player: document.getElementById("radioPlayer"),
    btnPlay: document.getElementById("btnPlay"),
    btnPrev: document.getElementById("btnPrev"),
    btnNext: document.getElementById("btnNext"),
    status: document.getElementById("statusIndicator"),
    title: document.getElementById("currentStation"),
    meta: document.getElementById("stationMeta"),
    badge: document.getElementById("metaBadge"),
    timer: document.getElementById("timerDisplay"),
    list: document.getElementById("stationList"),
    search: document.getElementById("stationSearch"),
    region: document.getElementById("regionSelect"),
    country: document.getElementById("countrySelect"),
    favToggle: document.getElementById("favoritesToggle"),
    clearFilters: document.getElementById("clearFilters"),
    addForm: document.getElementById("addStationForm"),
    btnOptions: document.getElementById("btnOptions"),
    btnCloseMenu: document.getElementById("btnCloseMenu"),
    sideMenu: document.getElementById("sideMenu"),
    menuOverlay: document.getElementById("menuOverlay"),
    btnShareStation: document.getElementById("btnShareStation"),
    btnCopyStation: document.getElementById("btnCopyStation"),
    btnExportFavs: document.getElementById("btnExportFavs"),
    btnImportFavs: document.getElementById("btnImportFavs"),
    inputImportFavs: document.getElementById("inputImportFavs"),
    sleepMinutes: document.getElementById("sleepMinutes"),
    btnSleepStart: document.getElementById("btnSleepStart"),
    btnSleepCancel: document.getElementById("btnSleepCancel"),
    btnToggleCompactUi: document.getElementById("btnToggleCompactUi"),
    btnToggleDecoMotion: document.getElementById("btnToggleDecoMotion"),
    btnTogglePlayerMotion: document.getElementById("btnTogglePlayerMotion"),
    btnToggleListMotion: document.getElementById("btnToggleListMotion"),
    playerMotion: document.getElementById("playerMotion"),
    playerMotionValue: document.getElementById("playerMotionValue"),
    audioVolume: document.getElementById("audioVolume"),
    audioVolumeValue: document.getElementById("audioVolumeValue"),
    btnEqToggle: document.getElementById("btnEqToggle"),
    btnEqReset: document.getElementById("btnEqReset"),
    eqBandInputs: Array.from(document.querySelectorAll('[id^="eqBand"]')).filter((el) => el.tagName === "INPUT"),
    eqBandValues: Array.from(document.querySelectorAll('[id^="eqBandVal"]')),
    btnToggleAutoRetry: document.getElementById("btnToggleAutoRetry"),
    retrySeconds: document.getElementById("retrySeconds"),
    btnMenuFavOnly: document.getElementById("btnMenuFavOnly"),
    btnResetAudioPrefs: document.getElementById("btnResetAudioPrefs")
  };

  if (typeof defaultStations === 'undefined') { console.error("Falta defaultStations."); return; }
  applyNativeAndroidMode();
  loadUiPrefs();
  
  // Validación de emergencia: si las prefs están muy corruptas, resetear todo
  if (!Number.isFinite(uiPrefs.playerMotion) || uiPrefs.playerMotion < PLAYER_MOTION_MIN || uiPrefs.playerMotion > PLAYER_MOTION_MAX) {
    uiPrefs.playerMotion = AUDIO_PREF_DEFAULTS.playerMotion;
    persistUiPrefs();
  }
  
  applyUiPrefs();
  applyAudioPrefs();
  renderStationSkeletons();
  
  try {
    const savedFavs = JSON.parse(localStorage.getItem("ultra_favs") || "[]");
    favorites = new Set(savedFavs);
    const [customStations, globalStations] = await Promise.all([
      loadCustomStations(),
      loadGlobalStations()
    ]);
    stations = mergeStationSources(customStations, globalStations);
    isStationsLoading = false;
  } catch (e) {
    appendRuntimeError("init.loadStations", e);
    localStorage.removeItem("ultra_custom");
    localStorage.removeItem("ultra_favs");
    localStorage.removeItem(LAST_STATION_KEY);
    stations = [...defaultStations];
    favorites = new Set();
    isStationsLoading = false;
  }

  if (els.status) {
    els.status.setAttribute("role", "status");
    els.status.setAttribute("aria-live", "polite");
  }
  if (els.timer) {
    els.timer.setAttribute("aria-live", "off");
  }

  const savedTheme = localStorage.getItem("ultra_theme") || "default";
  setTheme(savedTheme);
  setTimeout(() => {
      const activeBtn = document.querySelector(`.theme-btn[data-theme="${savedTheme}"]`);
      if(activeBtn) activeBtn.classList.add('active');
  }, 100);

  setupMediaSessionHandlers();
  loadFilters();
  resetControls();
  renderList();
  setupListeners();

  const savedStation = getSavedStation();
  if (savedStation) {
    playStation(savedStation, false);
    if(els.status) els.status.innerText = "LISTO (CLICK PLAY)";
  } else {
    sintonizarRadioPorIP();
  }

  requestAnimationFrame(() => {
    document.body.classList.add("page-ready");
  });

  if (els.player && !nativePlayerBridge.available()) els.player.crossOrigin = "anonymous";
};

// === LÓGICA DE UBICACIÓN ===
const sintonizarRadioPorIP = async () => {
  try {
    const response = await fetch('https://ipapi.co/json/');
    const data = await response.json();
    
    let paisDetectado = data.country_name; 
    let regionDetectada = data.region; 

    if (paisDetectado.includes("Peru")) paisDetectado = "Perú";
    if (paisDetectado.includes("United States")) paisDetectado = "EE.UU";
    if (paisDetectado.includes("Mexico")) paisDetectado = "México";
    if (paisDetectado.includes("Spain")) paisDetectado = "España";

    console.log(`Visitante desde: ${regionDetectada}, ${paisDetectado}`);

    // Nivel 1: Región
    let radioSugerida = stations.find(s => {
      const paisMatch = s.country.toLowerCase() === paisDetectado.toLowerCase();
      const regionMatch = s.region.toLowerCase().includes(regionDetectada.toLowerCase()) || 
                          regionDetectada.toLowerCase().includes(s.region.toLowerCase());
      return paisMatch && regionMatch;
    });

    // Nivel 2: Nacional
    if (!radioSugerida) {
      radioSugerida = stations.find(s => 
        s.country.toLowerCase() === paisDetectado.toLowerCase() && 
        s.region.toLowerCase().includes("nacional")
      );
      if (!radioSugerida) {
         radioSugerida = stations.find(s => s.country.toLowerCase() === paisDetectado.toLowerCase());
      }
    }

    // Nivel 3: Fallback Global
    if (!radioSugerida && stations.length > 0) {
        radioSugerida = stations[0]; 
    }

    if (radioSugerida) {
      playStation(radioSugerida, false);
      // Mensaje INICIAL (Solo al abrir la web)
      if(els.status) els.status.innerText = "LISTO (CLICK PLAY)";
    }

  } catch (error) {
    if (stations.length > 0) playStation(stations[0], false);
  }
};

const resetControls = () => {
  if(els.search) els.search.value = "";
  if(els.region) els.region.value = "Todas";
  if(els.country) els.country.value = "Todos";
  if(els.favToggle) els.favToggle.checked = false;
};

const setTheme = (themeName) => {
  document.body.setAttribute("data-theme", themeName === "default" ? "" : themeName);
  const metaTheme = document.querySelector('meta[name="theme-color"]');
  if(metaTheme) {
      switch(themeName) {
          case 'amoled': metaTheme.setAttribute("content", "#000000"); break;
          case 'white': metaTheme.setAttribute("content", "#f8fafc"); break; 
          case 'gold': metaTheme.setAttribute("content", "#12100b"); break;
          case 'purple': metaTheme.setAttribute("content", "#0a0011"); break;
          case 'wear-ocean': metaTheme.setAttribute("content", "#0d1b2a"); break;
          case 'wear-sunset': metaTheme.setAttribute("content", "#2d1b0e"); break;
          case 'wear-galaxy': metaTheme.setAttribute("content", "#1a0b2e"); break;
          case 'wear-mint': metaTheme.setAttribute("content", "#00241b"); break;
          case 'wear-cherry': metaTheme.setAttribute("content", "#2b0505"); break;
          default: metaTheme.setAttribute("content", "#05070a");
      }
  }
};

const toggleMenu = (show) => {
  if(!els.sideMenu || !els.menuOverlay) return;
  if(show) {
    els.sideMenu.classList.add("open");
    els.menuOverlay.classList.add("open");
  } else {
    els.sideMenu.classList.remove("open");
    els.menuOverlay.classList.remove("open");
  }
};

const animateNowPlayingSwap = () => {
  [els.title, els.meta].forEach((node) => {
    if (!node) return;
    node.classList.remove("track-change");
    void node.offsetWidth;
    node.classList.add("track-change");
  });
};

const renderStationSkeletons = (count = 8) => {
  if (!els.list) return;
  els.list.classList.add("is-loading");
  els.list.innerHTML = "";

  const fragment = document.createDocumentFragment();
  for (let i = 0; i < count; i++) {
    const div = document.createElement("div");
    div.className = "station-card skeleton-card";
    div.innerHTML = `
      <div class="st-info">
        <div class="st-icon skeleton-dot"></div>
        <div style="width:100%;">
          <div class="skeleton-line skeleton-line-main"></div>
          <div class="skeleton-line skeleton-line-sub"></div>
        </div>
      </div>
    `;
    fragment.appendChild(div);
  }
  els.list.appendChild(fragment);
};

const triggerSharedStationTransition = (station) => {
  document.body.classList.remove("station-switching");
  void document.body.offsetWidth;
  document.body.classList.add("station-switching");

  if (els.list && station) {
    const key = encodeURIComponent(stationKey(station));
    const card = els.list.querySelector(`[data-station-key="${key}"]`);
    if (card) {
      card.classList.remove("just-activated");
      void card.offsetWidth;
      card.classList.add("just-activated");
      setTimeout(() => card.classList.remove("just-activated"), 760);
    }
  }

  setTimeout(() => document.body.classList.remove("station-switching"), 760);
};

const playStation = (station, autoplay = true) => {
  if (currentStation && currentStation.name === station.name && currentStation.url === station.url) {
    if (autoplay) {
      if (isPlaying) togglePlay();
      else startPlaybackForCurrentStation();
    }
    return;
  }
  
  // IMPORTANTE: Parar reproducción anterior antes de cambiar
  if (nativePlayerBridge.available()) {
    nativePlayerBridge.pause();
  } else if (els.player) {
    els.player.pause();
    els.player.src = ""; // Limpiar src anterior
  }
  stopTimer();
  
  triggerSharedStationTransition(station);
  currentStation = station;
  saveLastStation(station);
  
  if(els.title) els.title.innerText = station.name;
  const districtMeta = [station.district, station.caserio].filter(Boolean).join(" · ");
  if(els.meta) els.meta.innerText = `${station.country} · ${station.region}${districtMeta ? ` · ${districtMeta}` : ""}`;
  animateNowPlayingSwap();
  renderList();
  requestAnimationFrame(() => focusStationCard(station));
  if(els.status) { els.status.innerText = "CONECTANDO..."; els.status.style.color = ""; }
  if(els.badge) els.badge.style.display = "none";
  if(els.timer) els.timer.innerText = "00:00";

  updateMediaSessionMetadata();

  if (!autoplay) {
    setPlayingState(false);
    if(els.status) {
      els.status.innerText = "LISTO (CLICK PLAY)";
      els.status.style.color = "";
    }
    return;
  }

  startPlaybackForCurrentStation();
};

const togglePlay = () => {
  if (!currentStation) { if(stations.length > 0) playStation(stations[0]); return; }

  if (nativePlayerBridge.available()) {
    if (isPlaying) {
      nativePlayerBridge.pause();
      setPlayingState(false);
    } else {
      startPlaybackForCurrentStation();
    }
    return;
  }

  // Fallback a HTML5 player si no hay bridge nativo
  if (!els.player) return;

  if (els.player.paused) {
    startPlaybackForCurrentStation();
  } else {
    els.player.pause();
    setPlayingState(false);
  }
};

const setPlayingState = (playing) => {
  isPlaying = playing;
  if(els.btnPlay) els.btnPlay.classList.toggle("playing", playing);
  
  if (playing) {
    if(els.status) { els.status.innerText = "EN VIVO"; els.status.classList.add("live"); }
    if(els.badge) {
        els.badge.style.display = "inline-block";
        els.badge.innerText = navigator.onLine ? "LIVE" : "Conectando...";
    }
    startTimer(true);
    if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'playing';

  } else {
    if(els.status) { 
        // Solo ponemos "PAUSADO" si no estamos reportando un error ni estamos en estado Listo
        if(!els.status.innerText.includes("SEÑAL") && !els.status.innerText.includes("LISTO")) {
            els.status.innerText = "PAUSADO"; 
        }
        els.status.classList.remove("live"); 
    }
    if(els.badge) els.badge.style.display = "none";
    stopTimer();
    if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'paused';
  }
  renderList(); 
};

const skipStation = (direction) => {
  if (stations.length === 0) return;
  let newIndex = 0;
  if (!currentStation) { newIndex = direction > 0 ? 0 : stations.length - 1; } 
  else {
    const currentIndex = stations.findIndex(s => s.name === currentStation.name);
    newIndex = currentIndex + direction;
    if (newIndex >= stations.length) newIndex = 0;
    if (newIndex < 0) newIndex = stations.length - 1;
  }
  playStation(stations[newIndex]);
};

const startPlaybackForCurrentStation = () => {
  if (!currentStation) return;

  // Intenta con reproductor nativo primero
  if (nativePlayerBridge.available() && nativePlayerBridge.play(currentStation)) {
    if(els.status) {
      els.status.innerText = "CONECTANDO...";
      els.status.style.color = "";
    }
    return;
  }

  // Fallback a reproductor HTML5
  if (!els.player) return;

  try {
    els.player.src = currentStation.url;
    els.player.volume = uiPrefs.audioVolume;
    if(els.status) {
      els.status.innerText = "CONECTANDO...";
      els.status.style.color = "";
    }
    
    const p = els.player.play();
    
    // Si play() devuelve Promise (navegadores modernos)
    if (p !== undefined && typeof p.then === 'function') {
      p.then(() => {
        recordStreamMetric(currentStation, true, "html5_play");
        // Solo actualizar si no se dispara el listener 'play'
        if (!isPlaying) setPlayingState(true);
      }).catch(() => {
        recordStreamMetric(currentStation, false, "html5_play_rejected");
        setPlayingState(false);
        if(els.status) {
          els.status.innerText = "LISTO (CLICK PLAY)";
        }
      });
    } else {
      // Navigator antiguos: confiar en listener 'play'
      // pero asegurarse con un timeout de fallback
      const checkTimer = setTimeout(() => {
        if (els.player && !els.player.paused && !isPlaying) {
          setPlayingState(true);
        }
      }, 500);
      
      // Cancelar el check si play se dispara
      const originalOnPlay = els.player.onplay;
      els.player.onplay = () => {
        if (originalOnPlay) originalOnPlay();
        clearTimeout(checkTimer);
      };
    }
  } catch (err) {
    recordStreamMetric(currentStation, false, "html5_exception");
    appendRuntimeError("startPlaybackForCurrentStation", err);
    console.error("Error Audio Critico", err);
    if(els.status) {
      els.status.innerText = "ERROR";
    }
  }
};

// --- GESTIÓN DE NOTIFICACIONES ---

const setupMediaSessionHandlers = () => {
  if (nativePlayerBridge.available()) return;
  if ('mediaSession' in navigator && els.player) {
    navigator.mediaSession.setActionHandler('play', () => { els.player.play(); setPlayingState(true); });
    navigator.mediaSession.setActionHandler('pause', () => { els.player.pause(); setPlayingState(false); });
    navigator.mediaSession.setActionHandler('previoustrack', () => skipStation(-1));
    navigator.mediaSession.setActionHandler('nexttrack', () => skipStation(1));
    navigator.mediaSession.setActionHandler('stop', () => { els.player.pause(); setPlayingState(false); });
  }
};

const updateMediaSessionMetadata = () => {
  if ('mediaSession' in navigator && currentStation) {
    const artworkImage = [
      { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: 'icon-512.png', sizes: '512x512', type: 'image/png' }
    ];
    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentStation.name,
      artist: currentStation.country,
      album: 'Satelital Live',
      artwork: artworkImage
    });
  }
};

const renderList = () => {
  if(!els.list) return;

  if (isStationsLoading) {
    renderStationSkeletons();
    return;
  }

  els.list.classList.remove("is-loading");
  els.list.innerHTML = "";
  
  const term = els.search ? els.search.value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") : "";
  const region = els.region ? els.region.value : "Todas";
  const country = els.country ? els.country.value : "Todos";
  const showFavs = els.favToggle ? els.favToggle.checked : false;
  const menuFavOnly = uiPrefs.menuFavOnly === true;

  const filtered = stations.filter(st => {
    const normName = st.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const matchSearch = !term || normName.includes(term);
    const matchRegion = region === "Todas" || st.region === region;
    const matchCountry = country === "Todos" || st.country === country;
    const matchFavMain = !showFavs || favorites.has(st.name);
    const matchFavMenu = !menuFavOnly || favorites.has(st.name);
    const matchFav = matchFavMain && matchFavMenu;
    return matchSearch && matchRegion && matchCountry && matchFav;
  });

  if (filtered.length === 0) { els.list.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:3rem; color:rgba(255,255,255,0.5);">No se encontraron emisoras.</div>`; return; }

  const fragment = document.createDocumentFragment();
  filtered.forEach(st => {
    const isActive = currentStation && currentStation.name === st.name;
    const isFav = favorites.has(st.name);
    const badgeClass = countryClassMap[st.country] || "badge-default"; 
    const animatingClass = (isActive && isPlaying) ? 'animating' : '';
    const safeName = escapeHtml(st.name);
    const safeCountry = escapeHtml(st.country);
    const div = document.createElement("div");
    const stationCardKey = encodeURIComponent(stationKey(st));
    div.className = `station-card ${isActive ? 'active' : ''} ${animatingClass}`;
    div.setAttribute("data-station-key", stationCardKey);
    const deleteBtn = (st.isCustom && !st.isGlobal) ? `<button class="del-btn" title="Eliminar" aria-label="Eliminar emisora ${safeName}">×</button>` : '';
    const subMeta = [st.region, st.district, st.caserio].filter(Boolean).join(" · ");
    const safeSubMeta = escapeHtml(subMeta);

    div.innerHTML = `
      <div class="st-info">
        <div class="st-icon ${badgeClass}"></div>
        <div><span class="st-name">${safeName}</span><span class="st-meta">${safeCountry}${subMeta ? ` · ${safeSubMeta}` : ''}</span></div>
      </div>
      <div style="display:flex; align-items:center; gap:10px;">
        ${deleteBtn}
        <button class="fav-btn ${isFav ? 'is-fav' : ''}" aria-label="${isFav ? 'Quitar de favoritos' : 'Agregar a favoritos'}">★</button>
      </div>
    `;
    div.onclick = (e) => { if(!e.target.closest('button')) playStation(st); };
    div.querySelector('.fav-btn').onclick = (e) => {
      e.stopPropagation();
      if(favorites.has(st.name)) favorites.delete(st.name); else favorites.add(st.name);
      localStorage.setItem("ultra_favs", JSON.stringify([...favorites]));
      renderList();
    };
    if(st.isCustom && !st.isGlobal) { div.querySelector('.del-btn').onclick = (e) => deleteCustomStation(e, st); }
    fragment.appendChild(div);
  });
  els.list.appendChild(fragment);
};

const addCustomStation = async (e) => {
  e.preventDefault();
  const name = document.getElementById("newStationName").value.trim();
  const country = document.getElementById("newStationCountry").value.trim();
  const region = document.getElementById("newStationRegion").value.trim();
  const district = document.getElementById("newStationDistrict").value.trim();
  const caserio = document.getElementById("newStationCaserio").value.trim();
  const rawUrl = document.getElementById("newStationUrl").value.trim();

  const validUrl = validateStationUrl(rawUrl);
  if (!validUrl.valid) {
    alert(validUrl.reason);
    return;
  }
  const url = validUrl.url;

  if(name && url && country && region) {
    const newStation = {
      name,
      country,
      region,
      district: district || undefined,
      caserio: caserio || undefined,
      url,
      isCustom: true
    };

    try {
      const cfg = getSupabaseConfig();
      let globalSent = false;
      if (cfg) {
        const rate = canSubmitGlobalNow(cfg.limitPerMinute);
        if (!rate.allowed) {
          alert(`Has alcanzado el límite temporal. Intenta en ${rate.waitSeconds}s.`);
          return;
        }

        if (cfg.requireStreamValidation) {
          if(els.status) els.status.innerText = "Verificando señal...";
          const reachable = await checkStreamReachable(url, cfg.streamCheckTimeoutMs);
          if (!reachable) {
            alert("La radio no responde o no parece un stream válido.");
            if(els.status) els.status.innerText = "LISTO (CLICK PLAY)";
            return;
          }
        }

        globalSent = await persistGlobalStation(newStation);
      }

      await persistCustomStation(newStation);
      const [customStations, globalStations] = await Promise.all([
        loadCustomStations(),
        loadGlobalStations()
      ]);
      stations = mergeStationSources(customStations, globalStations);
      loadFilters();
      renderList();
      if(els.addForm) els.addForm.reset();
      if(els.status) {
        els.status.innerText = cfg
          ? (globalSent ? "Enviada a revisión global" : "Guardada local (pendiente de envío)")
          : "Radio agregada correctamente";
      }
    } catch (error) {
      console.error(error);
      alert("No se pudo guardar la radio.");
    }
  }
};
const deleteCustomStation = async (e, station) => {
  e.stopPropagation();
  if(confirm(`¿Eliminar ${station.name}?`)) {
    try {
      await removeCustomStation(station);
      const [customStations, globalStations] = await Promise.all([
        loadCustomStations(),
        loadGlobalStations()
      ]);
      stations = mergeStationSources(customStations, globalStations);
      if (currentStation && currentStation.isCustom && currentStation.name === station.name && currentStation.url === station.url) {
        currentStation = null;
      }
      loadFilters();
      renderList();
    } catch (error) {
      console.error(error);
      alert("No se pudo eliminar la radio.");
    }
  }
};
const loadFilters = () => {
  if(!els.region || !els.country) return;
  const regions = ["Todas", ...new Set(stations.map(s => s.region))].sort();
  const countries = ["Todos", ...new Set(stations.map(s => s.country))].sort();
  const fill = (sel, arr) => { sel.innerHTML = ""; arr.forEach(val => { const opt = document.createElement("option"); opt.value = val; opt.innerText = val; sel.appendChild(opt); }); };
  fill(els.region, regions); fill(els.country, countries);
};

const startTimer = (reset = true) => {
  if(timerInterval) clearInterval(timerInterval);
  
  // Si es reproductor HTML5, dejar que timeupdate se encargue del timer
  // Solo usar timer manual para reproductor nativo o si no hay player HTML5
  if (nativePlayerBridge.available() || !els.player) {
    if(reset) {
      secondsElapsed = 0;
      if(els.timer) els.timer.innerText = "00:00";
    }
    if(els.timer) {
      timerInterval = setInterval(() => {
        secondsElapsed++;
        const m = Math.floor(secondsElapsed / 60).toString().padStart(2, '0');
        const s = (secondsElapsed % 60).toString().padStart(2, '0');
        els.timer.innerText = `${m}:${s}`;
      }, 1000);
    }
  } else {
    // Para HTML5 player, solo resetear si es necesario
    if(reset && els.timer) els.timer.innerText = "00:00";
  }
};

const stopTimer = () => { if (timerInterval) clearInterval(timerInterval); };

const setupListeners = () => {
  if(els.btnPlay) els.btnPlay.addEventListener("click", togglePlay);
  if(els.btnPrev) els.btnPrev.addEventListener("click", () => skipStation(-1));
  if(els.btnNext) els.btnNext.addEventListener("click", () => skipStation(1));
  
  // Listeners completos del reproductor HTML5
  if(els.player) {
    // PLAY - Comienza reproducción
    els.player.addEventListener('play', () => {
      if (nativePlayerBridge.available()) return;
      setPlayingState(true);
    });

    // PAUSE - Se pausa
    els.player.addEventListener('pause', () => {
      if (nativePlayerBridge.available()) return;
      setPlayingState(false);
    });

    // TIMEUPDATE - Actualiza timer cada segundo
    els.player.addEventListener('timeupdate', () => {
      if (!els.timer || isNaN(els.player.duration)) return;
      const mins = Math.floor(els.player.currentTime / 60);
      const secs = Math.floor(els.player.currentTime % 60);
      els.timer.innerText = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    });

    // CANPLAY - Señal de que puede reproducir
    els.player.addEventListener('canplay', () => {
      if (nativePlayerBridge.available()) return;
      if(els.status && els.status.innerText === "CONECTANDO...") {
        els.status.innerText = "EN VIVO";
        els.status.style.color = "";
      }
    });

    // ERROR - Falla la emisora
    els.player.addEventListener('error', (e) => {
      if (nativePlayerBridge.available()) return;
      recordStreamMetric(currentStation, false, "player_error_event");
      console.warn("Emisora caída", e);
      setPlayingState(false);
      
      if(els.status) {
        els.status.innerText = "SIN SEÑAL";
        els.status.style.color = "#ff5252";
      }
      scheduleAutoRetry();
    });

    // SUSPEND - Pausa la descarga sin terminar
    els.player.addEventListener('suspend', () => {
      if (nativePlayerBridge.available()) return;
      // Solo log, sin cambiar estado
    });

    // ABORT - Canceló descarga
    els.player.addEventListener('abort', () => {
      if (nativePlayerBridge.available()) return;
      recordStreamMetric(currentStation, false, "player_abort");
      console.warn("Descarga abortada");
      if(els.status) els.status.innerText = "DESCARGA CANCELADA";
    });

    // ENDED - Termina stream (en live radio normalmente no ocurre)
    els.player.addEventListener('ended', () => {
      if (nativePlayerBridge.available()) return;
      recordStreamMetric(currentStation, false, "player_ended");
      console.log("Stream finalizado");
      setPlayingState(false);
    });
  }

  const themeBtns = document.querySelectorAll('.theme-btn');
  themeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      themeBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const theme = btn.getAttribute('data-theme');
      setTheme(theme);
      localStorage.setItem("ultra_theme", theme);
    });
  });

  if(els.btnOptions) els.btnOptions.addEventListener("click", (e) => { e.preventDefault(); toggleMenu(true); });
  if(els.btnCloseMenu) els.btnCloseMenu.addEventListener("click", () => toggleMenu(false));
  if(els.menuOverlay) els.menuOverlay.addEventListener("click", () => toggleMenu(false));

  if(els.search) els.search.addEventListener("input", renderList);
  if(els.region) els.region.addEventListener("input", renderList);
  if(els.country) els.country.addEventListener("input", renderList);
  if(els.favToggle) els.favToggle.addEventListener("change", renderList);
  if(els.clearFilters) els.clearFilters.addEventListener("click", () => { resetControls(); renderList(); });
  if(els.addForm) els.addForm.addEventListener("submit", addCustomStation);
  if(els.btnShareStation) els.btnShareStation.addEventListener("click", shareCurrentStation);
  if(els.btnCopyStation) els.btnCopyStation.addEventListener("click", copyCurrentStationUrl);
  if(els.btnExportFavs) els.btnExportFavs.addEventListener("click", exportFavorites);
  if(els.btnImportFavs && els.inputImportFavs) {
    els.btnImportFavs.addEventListener("click", () => els.inputImportFavs.click());
    els.inputImportFavs.addEventListener("change", async (e) => {
      const file = e.target.files && e.target.files[0];
      await importFavoritesFromFile(file);
      e.target.value = "";
    });
  }
  if(els.btnSleepStart && els.sleepMinutes) {
    els.btnSleepStart.addEventListener("click", () => {
      const minutes = Number.parseInt(els.sleepMinutes.value || "0", 10);
      startSleepTimer(minutes);
    });
  }
  if(els.btnSleepCancel) els.btnSleepCancel.addEventListener("click", cancelSleepTimer);
  if(els.btnToggleCompactUi) {
    els.btnToggleCompactUi.addEventListener("click", () => {
      uiPrefs.compactUi = !uiPrefs.compactUi;
      persistUiPrefs();
      applyUiPrefs();
    });
  }
  if(els.btnToggleDecoMotion) {
    els.btnToggleDecoMotion.addEventListener("click", () => {
      uiPrefs.decorativeMotion = !uiPrefs.decorativeMotion;
      persistUiPrefs();
      applyUiPrefs();
    });
  }
  if(els.btnTogglePlayerMotion) {
    els.btnTogglePlayerMotion.addEventListener("click", () => {
      uiPrefs.playerMotionEnabled = !uiPrefs.playerMotionEnabled;
      persistUiPrefs();
      applyUiPrefs();
      const playerMotionActive = uiPrefs.playerMotionEnabled && Number(uiPrefs.playerMotion) > 0;
      showQuickToast(`Animaciones reproductor ${playerMotionActive ? "SI" : "NO"}`, playerMotionActive ? "success" : "warn");
    });
  }
  if(els.btnToggleListMotion) {
    els.btnToggleListMotion.addEventListener("click", () => {
      uiPrefs.listMotionEnabled = !uiPrefs.listMotionEnabled;
      persistUiPrefs();
      applyUiPrefs();
      renderList();
      showQuickToast(`Animaciones lista ${uiPrefs.listMotionEnabled ? "SI" : "NO"}`, uiPrefs.listMotionEnabled ? "success" : "warn");
    });
  }
  if(els.audioVolume) {
    els.audioVolume.addEventListener("input", () => {
      const percent = Number.parseInt(els.audioVolume.value || "100", 10);
      const normalized = Math.min(1, Math.max(0, percent / 100));
      uiPrefs.audioVolume = normalized;
      persistUiPrefs();
      applyAudioPrefs();
      updateUiPrefButtons();
      showQuickToast(`Volumen ${percent}%`, "info");
    });
  }
  if(els.playerMotion) {
    els.playerMotion.addEventListener("input", () => {
      const next = Number.parseInt(els.playerMotion.value || "100", 10);
      uiPrefs.playerMotion = Math.min(PLAYER_MOTION_MAX, Math.max(PLAYER_MOTION_MIN, Number.isFinite(next) ? next : AUDIO_PREF_DEFAULTS.playerMotion));
      persistUiPrefs();
      applyUiPrefs();
    });
    els.playerMotion.addEventListener("change", () => {
      if (uiPrefs.playerMotion <= 0) {
        showQuickToast("Animacion del reproductor desactivada", "warn");
      } else {
        showQuickToast(`Acelerador ${uiPrefs.playerMotion}%`, "info");
      }
    });
  }
  if (els.btnEqToggle) {
    els.btnEqToggle.addEventListener("click", () => {
      uiPrefs.eqEnabled = !uiPrefs.eqEnabled;
      persistUiPrefs();
      updateUiPrefButtons();
      if (nativePlayerBridge.available()) {
        nativePlayerBridge.setEqEnabled(uiPrefs.eqEnabled);
      }
      showQuickToast(`EQ ${uiPrefs.eqEnabled ? "ON" : "OFF"}`, uiPrefs.eqEnabled ? "success" : "warn");
    });
  }
  if (Array.isArray(els.eqBandInputs)) {
    els.eqBandInputs.forEach((input, idx) => {
      input.addEventListener("input", () => {
        const value = Number.parseInt(input.value || "0", 10);
        const clamped = Math.min(EQ_BAND_LIMIT, Math.max(-EQ_BAND_LIMIT, Number.isFinite(value) ? value : 0));
        uiPrefs.eqBands[idx] = clamped;
        persistUiPrefs();
        const label = els.eqBandValues?.[idx];
        if (label) label.innerText = String(clamped);
        if (nativePlayerBridge.available() && uiPrefs.eqEnabled) {
          nativePlayerBridge.setEqBandLevel(idx, clamped);
        }
      });
    });
  }
  if (els.btnEqReset) {
    els.btnEqReset.addEventListener("click", () => {
      uiPrefs.eqBands = [...AUDIO_PREF_DEFAULTS.eqBands];
      persistUiPrefs();
      updateUiPrefButtons();
      if (nativePlayerBridge.available()) {
        nativePlayerBridge.resetEq();
        if (uiPrefs.eqEnabled) applyNativeEqPrefs();
      }
      showQuickToast("EQ restaurado", "success");
    });
  }
  if(els.btnToggleAutoRetry) {
    els.btnToggleAutoRetry.addEventListener("click", () => {
      uiPrefs.autoRetry = !uiPrefs.autoRetry;
      persistUiPrefs();
      applyUiPrefs();
      showQuickToast(`Auto-reintento ${uiPrefs.autoRetry ? "ON" : "OFF"}`, uiPrefs.autoRetry ? "success" : "warn");
    });
  }
  if(els.retrySeconds) {
    els.retrySeconds.addEventListener("change", () => {
      const next = Number.parseInt(els.retrySeconds.value || "2", 10);
      uiPrefs.retrySeconds = Math.min(8, Math.max(2, next));
      persistUiPrefs();
      applyUiPrefs();
      showQuickToast(`Reintento en ${uiPrefs.retrySeconds}s`, "info");
    });
  }
  if(els.btnMenuFavOnly) {
    els.btnMenuFavOnly.addEventListener("click", () => {
      uiPrefs.menuFavOnly = !uiPrefs.menuFavOnly;
      persistUiPrefs();
      applyUiPrefs();
      renderList();
      showQuickToast(`Menu favoritas ${uiPrefs.menuFavOnly ? "ON" : "OFF"}`, uiPrefs.menuFavOnly ? "success" : "warn");
    });
  }
  if(els.btnResetAudioPrefs) {
    els.btnResetAudioPrefs.addEventListener("click", resetAudioPrefs);
  }

  window.addEventListener("native-player-state", (event) => {
    handleNativePlayerState(event.detail || null);
  });

  window.addEventListener("native-player-command", (event) => {
    handleNativePlayerCommand(event.detail || null);
  });

  window.addEventListener('offline', () => {
    if(isPlaying) {
      if(els.badge) els.badge.innerText = "Conectando...";
      if(timerInterval) clearInterval(timerInterval); 
    }
  });

  window.addEventListener('online', () => {
    if(isPlaying) {
      if(els.badge) els.badge.innerText = "LIVE";
      startTimer(false); 
      if(!nativePlayerBridge.available() && els.player) els.player.play(); 
    }
  });
};

let deferredPrompt;
const installBtn = document.getElementById('btnInstall');
if (!isAndroidRuntime()) {
  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferredPrompt = e; if(installBtn) installBtn.style.display = 'block'; });
  if(installBtn) { installBtn.addEventListener('click', async () => { if (deferredPrompt) { deferredPrompt.prompt(); const { outcome } = await deferredPrompt.userChoice; deferredPrompt = null; installBtn.style.display = 'none'; } }); }
  window.addEventListener('appinstalled', () => { if(installBtn) installBtn.style.display = 'none'; console.log('PWA Installed'); });
}

document.addEventListener("DOMContentLoaded", init);

if (!isAndroidRuntime() && 'serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const reg = await navigator.serviceWorker.register('./sw.js');
      console.log('PWA Service Worker v9.5 Registrado');
      if ('periodicSync' in reg) {
        try {
          const status = await navigator.permissions.query({ name: 'periodic-background-sync' });
          if (status.state === 'granted') { await reg.periodicSync.register('update-content', { minInterval: 24 * 60 * 60 * 1000 }); }
        } catch (e) {}
      }
      if ('sync' in reg) { try { await reg.sync.register('sync-stations'); } catch (e) {} }
    } catch (err) { console.error('Error PWA:', err); }
  });
}
