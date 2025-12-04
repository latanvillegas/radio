// js/main.js
// =======================
// SYSTEM CONFIG v6.6 (REFACTORED)
// =======================

// MAPA DE REGIONES PARA ICONOS
const regionClassMap = {
  "Sudamérica": "badge-sudamerica", 
  "Europa": "badge-europa",
  "Norteamérica": "badge-norteamerica", 
  "Centroamérica": "badge-norteamerica",
  "Internacional": "badge-default", 
  "Custom": "badge-custom"
};

// ESTADO GLOBAL
let stations = [];
let favorites = new Set();
let currentStation = null;
let isPlaying = false;
let timerInterval = null;
let secondsElapsed = 0;
let metadataInterval = null; // Loop para buscar datos de canción

// ELEMENTOS DOM
const els = {
  player: document.getElementById("radioPlayer"),
  btnPlay: document.getElementById("btnPlay"),
  btnPrev: document.getElementById("btnPrev"),
  btnNext: document.getElementById("btnNext"),
  // volSlider ELIMINADO
  status: document.getElementById("statusIndicator"),
  
  // NUEVA ASIGNACIÓN DE JERARQUÍA
  title: document.getElementById("streamTrack"),       // H2: Ahora es para Artista/Canción (Dinámico)
  stationName: document.getElementById("currentStation"), // P: Ahora es para Nombre de Estación (Estático)
  meta: document.getElementById("stationMeta"),        // P: País / Región
  
  badge: document.getElementById("metaBadge"),
  timer: document.getElementById("timerDisplay"),
  list: document.getElementById("stationList"),
  search: document.getElementById("stationSearch"),
  region: document.getElementById("regionSelect"),
  country: document.getElementById("countrySelect"),
  favToggle: document.getElementById("favoritesToggle"),
  clearFilters: document.getElementById("clearFilters"),
  themeSelect: document.getElementById("themeSelect"),
  statsRow: document.getElementById("statsRow"),
  listenerCount: document.getElementById("listenerCount"),
  likeCount: document.getElementById("likeCount"),
  addForm: document.getElementById("addStationForm")
};

// =======================
// INICIALIZACIÓN
// =======================
const init = () => {
  if (typeof defaultStations === 'undefined') {
    console.error("CRITICAL: defaultStations not found.");
    return;
  }

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
  if(els.themeSelect) els.themeSelect.value = savedTheme;

  loadFilters();
  resetControls();
  // updateVolumeVisuals ELIMINADO
  renderList();
  setupListeners();
  
  // Limpieza inicial de estadísticas
  if(els.listenerCount) els.listenerCount.innerText = "-";
  if(els.likeCount) els.likeCount.innerText = "-";
  
  console.log(`System Ready: ${stations.length} stations loaded.`);
};

const resetControls = () => {
  if(els.search) els.search.value = "";
  if(els.region) els.region.value = "Todas";
  if(els.country) els.country.value = "Todos";
  if(els.favToggle) els.favToggle.checked = false;
};

// =======================
// LÓGICA DE REPRODUCCIÓN
// =======================
const playStation = (station) => {
  if (currentStation && currentStation.name === station.name) { 
    togglePlay(); 
    return; 
  }
  
  currentStation = station;
  
  // UI Updates - NUEVA JERARQUÍA
  els.stationName.innerText = station.name; // Estático
  els.title.innerText = "Cargando...";      // Dinámico (esperando metadatos)
  els.meta.innerText = `${station.country} · ${station.region}`;
  
  els.status.innerText = "CONECTANDO...";
  els.status.style.color = ""; 
  els.badge.style.display = "none";
  
  stopTimer();
  if(els.timer) els.timer.innerText = "00:00";

  els.player.src = station.url;
  els.player.volume = 1; // Volumen al máximo por defecto, ya que no hay slider
  
  const p = els.player.play();
  if (p !== undefined) {
    p.then(() => {
      setPlayingState(true);
      // simulateStats ELIMINADO - Ya no mentimos con estadísticas
      updateMediaSession();
    }).catch(e => {
      console.error("Stream Error:", e);
      els.title.innerText = "Offline";
      els.status.innerText = "ERROR";
      els.status.style.color = "#ff3d3d";
      setPlayingState(false);
    });
  }
};

const togglePlay = () => {
  if (!currentStation) {
    if(stations.length > 0) playStation(stations[0]);
    return;
  }
  if (els.player.paused) { 
    els.player.play(); 
    setPlayingState(true); 
  } else { 
    els.player.pause(); 
    setPlayingState(false); 
  }
};

const setPlayingState = (playing) => {
  isPlaying = playing;
  if (playing) {
    els.btnPlay.classList.add("playing");
    els.status.innerText = "EN VIVO";
    els.status.classList.add("live");
    els.badge.style.display = "inline-block";
    startTimer();
    
    // Iniciar búsqueda de metadatos (Aquí irá la lógica real en el futuro)
    obtenerMetadatos();
    if(metadataInterval) clearInterval(metadataInterval);
    metadataInterval = setInterval(obtenerMetadatos, 15000); // Cada 15s

    if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'playing';
  } else {
    els.btnPlay.classList.remove("playing");
    els.status.innerText = "PAUSADO";
    els.status.classList.remove("live");
    els.badge.style.display = "none";
    stopTimer();
    
    if(metadataInterval) clearInterval(metadataInterval);
    
    if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'paused';
  }
  renderList(); 
};

// Lógica Placeholder para Metadatos
const obtenerMetadatos = () => {
    // Si tuvieras una API real, aquí harías el fetch.
    // Por ahora, mantenemos el texto limpio o mostramos "En vivo"
    if(isPlaying && currentStation) {
        // Como no tenemos endpoint real configurado, dejamos un mensaje genérico
        // o el nombre de la estación si no hay datos.
        // els.title.innerText = "Música Continua"; 
    }
};

const skipStation = (direction) => {
  if (stations.length === 0) return;
  
  let newIndex = 0;
  if (!currentStation) {
    newIndex = direction > 0 ? 0 : stations.length - 1;
  } else {
    const currentIndex = stations.findIndex(s => s.name === currentStation.name);
    newIndex = currentIndex + direction;
    if (newIndex >= stations.length) newIndex = 0;
    if (newIndex < 0) newIndex = stations.length - 1;
  }
  playStation(stations[newIndex]);
};

// =======================
// INTERFAZ Y RENDERIZADO
// =======================
const renderList = () => {
  if(!els.list) return;
  els.list.innerHTML = "";
  
  const term = els.search.value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const region = els.region.value;
  const country = els.country.value;
  const showFavs = els.favToggle.checked;

  const filtered = stations.filter(st => {
    const normName = st.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const matchSearch = !term || normName.includes(term);
    const matchRegion = region === "Todas" || st.region === region;
    const matchCountry = country === "Todos" || st.country === country;
    const matchFav = !showFavs || favorites.has(st.name);
    return matchSearch && matchRegion && matchCountry && matchFav;
  });

  if (filtered.length === 0) {
    els.list.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:3rem; color:rgba(255,255,255,0.5);">No se encontraron emisoras.</div>`;
    return;
  }

  const fragment = document.createDocumentFragment();

  filtered.forEach(st => {
    const isActive = currentStation && currentStation.name === st.name;
    const isFav = favorites.has(st.name);
    const badgeClass = regionClassMap[st.region] || "badge-default";
    const animatingClass = (isActive && isPlaying) ? 'animating' : '';

    const div = document.createElement("div");
    div.className = `station-card ${isActive ? 'active' : ''} ${animatingClass}`;
    
    const deleteBtn = st.isCustom 
      ? `<button class="del-btn" title="Eliminar">×</button>` 
      : '';

    div.innerHTML = `
      <div class="st-info">
        <div class="st-icon ${badgeClass}"></div>
        <div>
          <span class="st-name">${st.name}</span>
          <span class="st-meta">${st.country}</span>
        </div>
      </div>
      <div style="display:flex; align-items:center; gap:10px;">
        ${deleteBtn}
        <button class="fav-btn ${isFav ? 'is-fav' : ''}">★</button>
      </div>
    `;
    
    div.onclick = (e) => { 
      if(!e.target.closest('button')) playStation(st); 
    };
    
    div.querySelector('.fav-btn').onclick = (e) => {
      e.stopPropagation();
      if(favorites.has(st.name)) favorites.delete(st.name); else favorites.add(st.name);
      localStorage.setItem("ultra_favs", JSON.stringify([...favorites]));
      renderList();
    };

    if(st.isCustom) {
      div.querySelector('.del-btn').onclick = (e) => deleteCustomStation(e, st.name);
    }

    fragment.appendChild(div);
  });

  els.list.appendChild(fragment);
};

// =======================
// UTILIDADES Y EVENTOS
// =======================
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
  if(confirm(`¿Eliminar permanentemente ${stationName}?`)) {
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
  
  const fill = (sel, arr) => {
    sel.innerHTML = "";
    arr.forEach(val => {
      const opt = document.createElement("option");
      opt.value = val; opt.innerText = val; sel.appendChild(opt);
    });
  };
  fill(els.region, regions);
  fill(els.country, countries);
};

const setTheme = (themeName) => {
  document.body.setAttribute("data-theme", themeName === "default" ? "" : themeName);
  const metaTheme = document.querySelector('meta[name="theme-color"]');
  if(metaTheme) metaTheme.setAttribute("content", themeName === "amoled" ? "#000000" : "#05070a");
};

// Media Session API
const updateMediaSession = () => {
  if ('mediaSession' in navigator) {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentStation.name,
      artist: currentStation.country + ' · ' + currentStation.region,
      album: 'Satelital Wave Player v6.6',
    });
    navigator.mediaSession.setActionHandler('previoustrack', () => skipStation(-1));
    navigator.mediaSession.setActionHandler('nexttrack', () => skipStation(1));
    navigator.mediaSession.setActionHandler('play', () => { els.player.play(); setPlayingState(true); });
    navigator.mediaSession.setActionHandler('pause', () => { els.player.pause(); setPlayingState(false); });
  }
};

const startTimer = () => {
  stopTimer(); secondsElapsed = 0;
  if(els.timer) {
    els.timer.innerText = "00:00";
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
  els.btnPlay.addEventListener("click", togglePlay);
  els.btnPrev.addEventListener("click", () => skipStation(-1));
  els.btnNext.addEventListener("click", () => skipStation(1));
  
  // EVENTO DE VOLUMEN ELIMINADO
  
  els.themeSelect.addEventListener("change", (e) => {
    setTheme(e.target.value);
    localStorage.setItem("ultra_theme", e.target.value);
  });
  
  [els.search, els.region, els.country].forEach(el => el.addEventListener("input", renderList));
  els.favToggle.addEventListener("change", renderList);
  
  els.clearFilters.addEventListener("click", () => {
    resetControls();
    renderList();
  });
  
  if(els.addForm) els.addForm.addEventListener("submit", addCustomStation);
};

// ARRANQUE
document.addEventListener("DOMContentLoaded", init);
