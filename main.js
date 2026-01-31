// main.js v9.4 (Mensajes Claros + Salto Automático Manual)
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

let els = {};

const init = () => {
  console.log("Iniciando Sistema v9.4...");
  
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
    menuOverlay: document.getElementById("menuOverlay")
  };

  if (typeof defaultStations === 'undefined') { console.error("Falta defaultStations."); return; }
  
  try {
    const savedFavs = JSON.parse(localStorage.getItem("ultra_favs") || "[]");
    favorites = new Set(savedFavs);
    const customStations = JSON.parse(localStorage.getItem("ultra_custom") || "[]");
    stations = [...customStations, ...defaultStations];
  } catch (e) {
    localStorage.clear();
    stations = [...defaultStations];
    favorites = new Set();
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
  
  // Detección automática al inicio
  sintonizarRadioPorIP();

  if (els.player) els.player.crossOrigin = "anonymous";
};

// === LÓGICA DE UBICACIÓN ===
const sintonizarRadioPorIP = async () => {
  try {
    const response = await fetch('https://ipapi.co/json/');
    const data = await response.json();
    
    let paisDetectado = data.country_name; 
    let regionDetectada = data.region; 

    // Normalizar
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

    // Nivel 3: Fallback Global (La primera de la lista)
    if (!radioSugerida && stations.length > 0) {
        radioSugerida = stations[0]; 
    }

    if (radioSugerida) {
      playStation(radioSugerida);
      // Mensaje de inicio (antes de dar click)
      if(els.status) els.status.innerText = "LISTO (CLICK PLAY)";
    }

  } catch (error) {
    if (stations.length > 0) playStation(stations[0]);
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

const playStation = (station) => {
  if (currentStation && currentStation.name === station.name) { togglePlay(); return; }
  currentStation = station;
  
  if(els.title) els.title.innerText = station.name;
  if(els.meta) els.meta.innerText = `${station.country} · ${station.region}`;
  if(els.status) { els.status.innerText = "CONECTANDO..."; els.status.style.color = ""; }
  if(els.badge) els.badge.style.display = "none";
  if(els.timer) els.timer.innerText = "00:00";
  stopTimer(); 

  updateMediaSessionMetadata();

  try {
      els.player.src = station.url; 
      els.player.volume = 1; 
      const p = els.player.play();
      if (p !== undefined) {
        p.then(() => { 
          setPlayingState(true); 
        }).catch(e => {
          // Bloqueo de autoplay detectado
          setPlayingState(false);
          if(els.status) els.status.innerText = "LISTO (CLICK PLAY)";
        });
      }
  } catch (err) { console.error("Error Audio Critico", err); }
};

const togglePlay = () => {
  if (!currentStation) { if(stations.length > 0) playStation(stations[0]); return; }
  
  if (els.player.paused) { 
    const p = els.player.play(); 
    if (p !== undefined) {
        p.then(() => setPlayingState(true))
         .catch(e => {
             console.log("Error al intentar reproducir manual:", e);
         });
    }
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
        // No sobrescribir mensajes de error o listo
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

// --- GESTIÓN DE NOTIFICACIONES ---

const setupMediaSessionHandlers = () => {
  if ('mediaSession' in navigator) {
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
  els.list.innerHTML = "";
  
  const term = els.search ? els.search.value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") : "";
  const region = els.region ? els.region.value : "Todas";
  const country = els.country ? els.country.value : "Todos";
  const showFavs = els.favToggle ? els.favToggle.checked : false;

  const filtered = stations.filter(st => {
    const normName = st.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const matchSearch = !term || normName.includes(term);
    const matchRegion = region === "Todas" || st.region === region;
    const matchCountry = country === "Todos" || st.country === country;
    const matchFav = !showFavs || favorites.has(st.name);
    return matchSearch && matchRegion && matchCountry && matchFav;
  });

  if (filtered.length === 0) { els.list.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:3rem; color:rgba(255,255,255,0.5);">No se encontraron emisoras.</div>`; return; }

  const fragment = document.createDocumentFragment();
  filtered.forEach(st => {
    const isActive = currentStation && currentStation.name === st.name;
    const isFav = favorites.has(st.name);
    const badgeClass = countryClassMap[st.country] || "badge-default"; 
    const animatingClass = (isActive && isPlaying) ? 'animating' : '';
    const div = document.createElement("div");
    div.className = `station-card ${isActive ? 'active' : ''} ${animatingClass}`;
    const deleteBtn = st.isCustom ? `<button class="del-btn" title="Eliminar" aria-label="Eliminar emisora ${st.name}">×</button>` : '';

    div.innerHTML = `
      <div class="st-info">
        <div class="st-icon ${badgeClass}"></div>
        <div><span class="st-name">${st.name}</span><span class="st-meta">${st.country}</span></div>
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
    if(st.isCustom) { div.querySelector('.del-btn').onclick = (e) => deleteCustomStation(e, st.name); }
    fragment.appendChild(div);
  });
  els.list.appendChild(fragment);
};

const addCustomStation = (e) => {
  e.preventDefault();
  const name = document.getElementById("newStationName").value.trim();
  const country = document.getElementById("newStationCountry").value.trim();
  const url = document.getElementById("newStationUrl").value.trim();
  if(name && url) {
    const newStation = { name, country, region: "Custom", url, isCustom: true };
    const customStations = JSON.parse(localStorage.getItem("ultra_custom") || "[]");
    customStations.push(newStation);
    localStorage.setItem("ultra_custom", JSON.stringify(customStations));
    location.reload(); 
  }
};
const deleteCustomStation = (e, stationName) => {
  e.stopPropagation();
  if(confirm(`¿Eliminar ${stationName}?`)) {
    let customStations = JSON.parse(localStorage.getItem("ultra_custom") || "[]");
    customStations = customStations.filter(s => s.name !== stationName);
    localStorage.setItem("ultra_custom", JSON.stringify(customStations));
    location.reload();
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
};

const stopTimer = () => { if (timerInterval) clearInterval(timerInterval); };

const setupListeners = () => {
  if(els.btnPlay) els.btnPlay.addEventListener("click", togglePlay);
  if(els.btnPrev) els.btnPrev.addEventListener("click", () => skipStation(-1));
  if(els.btnNext) els.btnNext.addEventListener("click", () => skipStation(1));
  
  if(els.player) {
    els.player.addEventListener('error', (e) => {
      console.warn("Emisora caída. Saltando...");
      
      // 1. Detener animación visual para que no parezca que suena
      setPlayingState(false);

      // 2. Mensaje CLARO para el usuario
      if(els.status) {
        els.status.innerText = "SIN SEÑAL / CAMBIANDO...";
        els.status.style.color = "#ff5252";
      }

      // 3. Salto automático (Aunque sea selección manual)
      setTimeout(() => {
        skipStation(1); 
      }, 2000);
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
      if(els.player) els.player.play(); 
    }
  });
};

let deferredPrompt;
const installBtn = document.getElementById('btnInstall');
window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferredPrompt = e; if(installBtn) installBtn.style.display = 'block'; });
if(installBtn) { installBtn.addEventListener('click', async () => { if (deferredPrompt) { deferredPrompt.prompt(); const { outcome } = await deferredPrompt.userChoice; deferredPrompt = null; installBtn.style.display = 'none'; } }); }
window.addEventListener('appinstalled', () => { if(installBtn) installBtn.style.display = 'none'; console.log('PWA Installed'); });

document.addEventListener("DOMContentLoaded", init);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const reg = await navigator.serviceWorker.register('./sw.js');
      console.log('PWA Service Worker v9.4 Registrado');
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
