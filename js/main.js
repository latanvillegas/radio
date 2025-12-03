// =======================
// SYSTEM CONFIG v3.3 (FINAL STABLE)
// =======================

const stations = [
  // ====== PERÚ – LIMA / NACIONAL ======
  { name: "Radio Moda", country: "Perú", region: "Sudamérica", url: "https://25023.live.streamtheworld.com/CRP_MOD_SC" },
  { name: "Ritmo Romántica", country: "Perú", region: "Sudamérica", url: "https://25103.live.streamtheworld.com/CRP_RIT_SC" },
  { name: "Onda Cero", country: "Perú", region: "Sudamérica", url: "https://mdstrm.com/audio/6598b65ab398c90871aff8cc/icecast.audio" },
  { name: "La Zona", country: "Perú", region: "Sudamérica", url: "https://mdstrm.com/audio/5fada54116646e098d97e6a5/icecast.audio" },
  { name: "Radio Corazón", country: "Perú", region: "Sudamérica", url: "https://mdstrm.com/audio/5fada514fc16c006bd63370f/icecast.audio" },
  { name: "La Inolvidable", country: "Perú", region: "Sudamérica", url: "https://playerservices.streamtheworld.com/api/livestream-redirect/CRP_LI_SC" },
  { name: "Radio Mágica", country: "Perú", region: "Sudamérica", url: "https://26513.live.streamtheworld.com/MAG_AAC_SC" },
  { name: "Radiomar", country: "Perú", region: "Sudamérica", url: "https://24873.live.streamtheworld.com/CRP_MARAAC_SC" },
  { name: "RPP Noticias", country: "Perú", region: "Sudamérica", url: "https://mdstrm.com/audio/5fab3416b5f9ef165cfab6e9/icecast.audio" },
  { name: "Exitosa Noticias", country: "Perú", region: "Sudamérica", url: "https://neptuno-2-audio.mediaserver.digital/79525baf-b0f5-4013-a8bd-3c5c293c6561" },
  { name: "Radio PBO", country: "Perú", region: "Sudamérica", url: "https://stream.radiojar.com/2fse67zuv8hvv" },
  { name: "Radio Inca", country: "Perú", region: "Sudamérica", url: "https://stream.zeno.fm/b9x47pyk21zuv" },

  // ====== PERÚ – REGIONAL ======
  { name: "Radio Santa Lucía", country: "Perú", region: "Sudamérica", url: "https://sp.dattavolt.com/8014/stream" },
  { name: "Radio Pampa Yurac", country: "Perú", region: "Sudamérica", url: "https://rr5200.globalhost1.com/8242/stream" },
  { name: "Radio Turbo Mix", country: "Perú", region: "Sudamérica", url: "https://serverssl.innovatestream.pe:8080/167.114.118.120:7624/stream" },
  { name: "Radio Fuego", country: "Perú", region: "Sudamérica", url: "https://serverssl.innovatestream.pe:8080/sp.onliveperu.com:8128/" },
  { name: "Radio Stereo TV", country: "Perú", region: "Sudamérica", url: "https://sp.onliveperu.com:7048/stream" },
  { name: "Radio La Kuadra", country: "Perú", region: "Sudamérica", url: "https://dattavolt.com/8046/stream" },
  { name: "Radio Frecuencia", country: "Perú", region: "Sudamérica", url: "https://conectperu.com/8384/stream" },
  { name: "Onda Popular (Lima)", country: "Perú", region: "Sudamérica", url: "https://envivo.top:8443/am" },
  { name: "Onda Popular (Juliaca)", country: "Perú", region: "Sudamérica", url: "https://dattavolt.com/8278/stream" },
  { name: "Radio Nor Andina", country: "Perú", region: "Sudamérica", url: "https://mediastreamm.com/8012/stream/1/" },
  { name: "Radio Andina", country: "Perú", region: "Sudamérica", url: "https://serverssl.innovatestream.pe:8080/http://167.114.118.120:7058/;stream" },
  { name: "Radio Ilucán", country: "Perú", region: "Sudamérica", url: "https://serverssl.innovatestream.pe:8080/167.114.118.120:7820/;stream" },
  { name: "Radio Bambamarca", country: "Perú", region: "Sudamérica", url: "https://envivo.top:8443/lider" },
  { name: "Radio Continente", country: "Perú", region: "Sudamérica", url: "https://sonic6.my-servers.org/10170/" },
  { name: "La Cheverísima", country: "Perú", region: "Sudamérica", url: "https://sp.onliveperu.com:8114/stream" },
  { name: "Radio TV El Shaddai", country: "Perú", region: "Sudamérica", url: "https://stream.zeno.fm/ppr5q4q3x1zuv" },
  { name: "Radio Inica Digital", country: "Perú", region: "Sudamérica", url: "https://stream.zeno.fm/487vgx80yuhvv" },
  { name: "Radio La Falsa", country: "Perú", region: "Sudamérica", url: "https://stream.zeno.fm/b9x47pyk21zuv" },
  { name: "Radio Activa", country: "Perú", region: "Sudamérica", url: "https://sp.onliveperu.com:8108/stream" },
  { name: "Radio Mía", country: "Perú", region: "Sudamérica", url: "https://streaming.zonalatinaeirl.com:8020/radio" },
  { name: "Radio Patrón", country: "Perú", region: "Sudamérica", url: "https://streaming.zonalatinaeirl.com:8010/radio" },
  { name: "Radio El Patrón (Señal 2)", country: "Perú", region: "Sudamérica", url: "https://serverssl.innovatestream.pe:8080/http://sp.onliveperu.com:8046/;stream" },
  { name: "Radio Televisión Sureña", country: "Perú", region: "Sudamérica", url: "https://stream.zeno.fm/p7d5fpx4xnhvv" },
  { name: "Radio Enamorados", country: "Perú", region: "Sudamérica", url: "https://stream.zeno.fm/gnybbqc1fnruv" },

  // ====== EUROPA / INTERNACIONAL ======
  { name: "RFI Internacional", country: "Francia", region: "Europa", url: "https://rfienespagnol64k.ice.infomaniak.ch/rfienespagnol-64.mp3" },
  { name: "RFI Español (96k)", country: "Francia", region: "Europa", url: "https://rfiespagnol96k.ice.infomaniak.ch/rfiespagnol-96k.mp3" },
  { name: "DW Español", country: "Alemania", region: "Europa", url: "https://dwstream6-lh.akamaihd.net/i/dwstream6_live@123544/master.m3u8" },
  { name: "RNE 5 (España)", country: "España", region: "Europa", url: "https://dispatcher.rndfnk.com/crtve/rne5/main/mp3/high?aggregator=tunein" },
  { name: "Radio Tele Taxi", country: "España", region: "Europa", url: "https://radiott-web.streaming-pro.com:6103/radiott.mp3" },
  { name: "Radio ES", country: "España", region: "Europa", url: "https://libertaddigital-radio-live1.flumotion.com/libertaddigital/ld-live1-low.mp3" },
  { name: "Cadena COPE", country: "España", region: "Europa", url: "https://net1-cope-rrcast.flumotion.com/cope/net1-low.mp3" },
  { name: "Radio La Hondureña", country: "Honduras", region: "Centroamérica", url: "https://s2.mkservers.space/rih" }
];

const regionClassMap = {
  "Sudamérica": "badge-sudamerica",
  "Europa": "badge-europa",
  "Norteamérica": "badge-norteamerica",
  "Centroamérica": "badge-norteamerica",
  "Internacional": "badge-default"
};

// --- FIX: Carga segura de favoritos ---
let favorites;
try {
  favorites = new Set(JSON.parse(localStorage.getItem("ultra_favs") || "[]"));
} catch (e) {
  favorites = new Set();
  console.error("Favoritos corruptos, reseteando...", e);
}

let currentStation = null;
let isPlaying = false;
let els = {}; 

// =======================
// UTILS
// =======================
const normalize = (str) => {
    if(!str) return ""; 
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
};

const hapticFeedback = (intensity = 'light') => {
  if (!navigator.vibrate) return;
  try {
      if (intensity === 'light') navigator.vibrate(10);
      if (intensity === 'medium') navigator.vibrate(20);
      if (intensity === 'success') navigator.vibrate([10, 30, 10]);
  } catch(e) {} 
};

// =======================
// INIT & THEME
// =======================
const init = () => {
  // Inicialización de selectores
  els = {
    player: document.getElementById("radioPlayer"),
    btnPlay: document.getElementById("btnPlay"),
    iconPlay: document.querySelector(".icon-play"),
    iconPause: document.querySelector(".icon-pause"),
    volSlider: document.getElementById("volSlider"),
    status: document.getElementById("statusIndicator"),
    title: document.getElementById("currentStation"),
    artist: document.getElementById("playerHint"),
    list: document.getElementById("stationList"),
    search: document.getElementById("stationSearch"),
    region: document.getElementById("regionSelect"),
    country: document.getElementById("countrySelect"),
    favToggle: document.getElementById("favoritesToggle"),
    clearFilters: document.getElementById("clearFilters"),
    themeSelect: document.getElementById("themeSelect")
  };

  if(!els.list) {
      console.error("FATAL: No se encontró el elemento #stationList.");
      return;
  }
  
  const savedTheme = localStorage.getItem("ultra_theme") || "default";
  setTheme(savedTheme);
  if(els.themeSelect) els.themeSelect.value = savedTheme;

  loadFilters(); // Carga de filtros corregida
  if(els.volSlider) updateVolumeVisuals(els.volSlider.value);
  renderList();
  setupListeners();
};

const setTheme = (themeName) => {
  if(themeName === "default") document.body.removeAttribute("data-theme");
  else document.body.setAttribute("data-theme", themeName);
  
  const metaTheme = document.querySelector('meta[name="theme-color"]');
  if(metaTheme) {
    if(themeName === "amoled") metaTheme.setAttribute("content", "#000000");
    else metaTheme.setAttribute("content", "#05070a");
  }
};

// =======================
// RENDER LOGIC
// =======================
const renderList = () => {
  if (!document.startViewTransition) {
    updateDOM();
  } else {
    document.startViewTransition(() => updateDOM());
  }
};

const updateDOM = () => {
  els.list.innerHTML = "";
  
  // Obtener valores con fallback
  const term = normalize(els.search ? els.search.value : "");
  const region = els.region ? els.region.value : "Todas";
  const country = els.country ? els.country.value : "Todos";
  const showFavs = els.favToggle ? els.favToggle.checked : false;

  const filtered = stations.filter(st => {
    const matchSearch = !term || normalize(st.name).includes(term);
    const matchRegion = region === "Todas" || st.region === region;
    const matchCountry = country === "Todos" || st.country === country;
    const matchFav = !showFavs || favorites.has(st.name);
    return matchSearch && matchRegion && matchCountry && matchFav;
  });

  if (filtered.length === 0) {
    els.list.innerHTML = `<p style="color:var(--text-muted); text-align:center; grid-column: 1/-1; padding: 2rem;">Sin señal en esta frecuencia.</p>`;
    return;
  }

  const fragment = document.createDocumentFragment();

  filtered.forEach(st => {
    const isActive = currentStation && currentStation.name === st.name;
    const isFav = favorites.has(st.name);
    
    const div = document.createElement("div");
    div.className = `station-card ${isActive ? 'active' : ''}`;
    
    div.onmousemove = (e) => {
      const rect = div.getBoundingClientRect();
      div.style.setProperty("--x", `${e.clientX - rect.left}px`);
      div.style.setProperty("--y", `${e.clientY - rect.top}px`);
    };

    div.onclick = (e) => {
      if(!e.target.closest('.fav-btn')) playStation(st);
    };

    const badgeClass = regionClassMap[st.region] || "badge-default";

    div.innerHTML = `
      <div class="st-info">
        <div class="st-icon ${badgeClass}"></div>
        <div>
          <span class="st-name">${st.name}</span>
          <span class="st-meta">${st.country}</span>
        </div>
      </div>
      <div style="display:flex; align-items:center; gap:10px;">
        <div class="visualizer">
          <div class="bar"></div><div class="bar"></div><div class="bar"></div>
          <div class="bar"></div><div class="bar"></div>
        </div>
        <button class="fav-btn ${isFav ? 'is-fav' : ''}" type="button" aria-label="Favorito">
          ${isFav ? '★' : '☆'}
        </button>
      </div>
    `;

    const btnFav = div.querySelector('.fav-btn');
    btnFav.onclick = (e) => {
      e.stopPropagation();
      hapticFeedback('light');
      if(favorites.has(st.name)) favorites.delete(st.name);
      else favorites.add(st.name);
      localStorage.setItem("ultra_favs", JSON.stringify([...favorites]));
      renderList();
    };

    fragment.appendChild(div);
  });

  els.list.appendChild(fragment);
};

// =======================
// PLAYER ENGINE
// =======================
const playStation = (station) => {
  const allCards = document.querySelectorAll('.station-card');
  allCards.forEach(c => c.classList.remove('active'));
  
  if (currentStation && currentStation.name === station.name && isPlaying) {
    togglePlay();
    renderList();
    return;
  }

  currentStation = station;
  els.title.innerText = station.name;
  els.artist.innerText = "Conectando...";
  els.status.innerText = "BUFFERING";
  els.status.style.color = "#ffca28"; 
  els.status.classList.remove("live");

  els.player.src = station.url;
  if(els.volSlider) els.player.volume = els.volSlider.value;
  
  const playPromise = els.player.play();

  if (playPromise !== undefined) {
    playPromise.then(() => {
      setPlayingState(true);
      hapticFeedback('success');
      renderList(); 
    }).catch(error => {
      console.error("Stream Error:", error);
      els.artist.innerText = "Stream Offline";
      els.status.innerText = "ERROR";
      els.status.style.color = "#ff3d3d";
      setPlayingState(false);
      hapticFeedback('medium');
    });
  }
};

const togglePlay = () => {
  if (!currentStation) return;
  hapticFeedback('light');
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
    if(els.iconPlay) els.iconPlay.style.display = "none";
    if(els.iconPause) els.iconPause.style.display = "block";
    els.status.innerText = "EN VIVO";
    els.status.classList.add("live");
    els.status.style.color = "#00e676";
    if(currentStation) els.artist.innerText = `${currentStation.country}`;
    document.title = `▶ ${currentStation.name}`;
  } else {
    if(els.iconPlay) els.iconPlay.style.display = "block";
    if(els.iconPause) els.iconPause.style.display = "none";
    els.status.innerText = "PAUSADO";
    els.status.classList.remove("live");
    els.status.style.color = "var(--accent)";
    document.title = "Radio | Pausado";
  }
};

const updateVolumeVisuals = (val) => {
  const percentage = val * 100;
  if(els.volSlider) els.volSlider.style.background = `linear-gradient(to right, #fff ${percentage}%, rgba(255,255,255,0.1) ${percentage}%)`;
};

// =======================
// FILTERS
// =======================
const loadFilters = () => {
  // 1. Extraer únicos y ordenar ALFABÉTICAMENTE
  const uniqueRegions = [...new Set(stations.map(s => s.region))].sort();
  const uniqueCountries = [...new Set(stations.map(s => s.country))].sort();

  // 2. INYECTAR "Todas" al principio (SIN REORDENAR)
  const regions = ["Todas", ...uniqueRegions];
  const countries = ["Todos", ...uniqueCountries];

  // 3. Renderizar
  if(els.region) fillSelect(els.region, regions);
  if(els.country) fillSelect(els.country, countries);
};

const fillSelect = (sel, arr) => {
  sel.innerHTML = "";
  arr.forEach(val => {
    const opt = document.createElement("option");
    opt.value = val;
    opt.innerText = val;
    sel.appendChild(opt);
  });
};

const setupListeners = () => {
  if(els.btnPlay) els.btnPlay.addEventListener("click", togglePlay);
  
  if(els.volSlider) {
    els.volSlider.addEventListener("input", (e) => {
      const val = e.target.value;
      els.player.volume = val;
      updateVolumeVisuals(val);
    });
  }

  if(els.themeSelect) {
    els.themeSelect.addEventListener("change", (e) => {
      const theme = e.target.value;
      setTheme(theme);
      localStorage.setItem("ultra_theme", theme);
      hapticFeedback('medium');
    });
  }

  if(els.search) els.search.addEventListener("input", renderList);
  if(els.region) els.region.addEventListener("change", renderList);
  if(els.country) els.country.addEventListener("change", renderList);
  if(els.favToggle) els.favToggle.addEventListener("change", () => {
    hapticFeedback('light');
    renderList();
  });

  if(els.clearFilters) {
    els.clearFilters.addEventListener("click", () => {
      hapticFeedback('light');
      if(els.search) els.search.value = "";
      if(els.region) els.region.value = "Todas";
      if(els.country) els.country.value = "Todos";
      if(els.favToggle) els.favToggle.checked = false;
      renderList();
    });
  }
};

document.addEventListener("DOMContentLoaded", init);
