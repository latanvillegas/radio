// =======================
// SYSTEM CONFIG v3.3 (HTTPS ONLY - SECURE LIST)
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

  // ====== PERÚ – REGIONAL (Solo Streams Seguros) ======
  { name: "Radio Santa Lucía", country: "Perú", region: "Sudamérica", url: "https://sp.dattavolt.com/8014/stream" },
  { name: "Radio Pampa Yurac", country: "Perú", region: "Sudamérica", url: "https://rr5200.globalhost1.com/8242/stream" },
  { name: "Radio Stereo TV", country: "Perú", region: "Sudamérica", url: "https://sp.onliveperu.com:7048/stream" },
  { name: "Radio La Kuadra", country: "Perú", region: "Sudamérica", url: "https://dattavolt.com/8046/stream" },
  { name: "Radio Frecuencia", country: "Perú", region: "Sudamérica", url: "https://conectperu.com/8384/stream" },
  { name: "Onda Popular (Lima)", country: "Perú", region: "Sudamérica", url: "https://envivo.top:8443/am" },
  { name: "Onda Popular (Juliaca)", country: "Perú", region: "Sudamérica", url: "https://dattavolt.com/8278/stream" },
  { name: "Radio Nor Andina", country: "Perú", region: "Sudamérica", url: "https://mediastreamm.com/8012/stream/1/" },
  { name: "Radio Bambamarca", country: "Perú", region: "Sudamérica", url: "https://envivo.top:8443/lider" },
  { name: "Radio Continente", country: "Perú", region: "Sudamérica", url: "https://sonic6.my-servers.org/10170/" },
  { name: "La Cheverísima", country: "Perú", region: "Sudamérica", url: "https://sp.onliveperu.com:8114/stream" },
  { name: "Radio TV El Shaddai", country: "Perú", region: "Sudamérica", url: "https://stream.zeno.fm/ppr5q4q3x1zuv" },
  { name: "Radio Inica Digital", country: "Perú", region: "Sudamérica", url: "https://stream.zeno.fm/487vgx80yuhvv" },
  { name: "Radio La Falsa", country: "Perú", region: "Sudamérica", url: "https://stream.zeno.fm/b9x47pyk21zuv" },
  { name: "Radio Activa", country: "Perú", region: "Sudamérica", url: "https://sp.onliveperu.com:8108/stream" },
  { name: "Radio Mía", country: "Perú", region: "Sudamérica", url: "https://streaming.zonalatinaeirl.com:8020/radio" },
  { name: "Radio Patrón", country: "Perú", region: "Sudamérica", url: "https://streaming.zonalatinaeirl.com:8010/radio" },
  { name: "Radio TV Sureña", country: "Perú", region: "Sudamérica", url: "https://stream.zeno.fm/p7d5fpx4xnhvv" },
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

let favorites = new Set(JSON.parse(localStorage.getItem("ultra_favs") || "[]"));
let currentStation = null;
let isPlaying = false;

// ELEMENTOS DOM
const els = {
  player: document.getElementById("radioPlayer"),
  btnPlay: document.getElementById("btnPlay"),
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

// =======================
// CORE ENGINE
// =======================
const init = () => {
  if(!els.list) return;
  
  // Cargar Tema
  const savedTheme = localStorage.getItem("ultra_theme") || "default";
  setTheme(savedTheme);
  if(els.themeSelect) els.themeSelect.value = savedTheme;

  loadFilters();
  updateVolumeVisuals(els.volSlider.value);
  renderList();
  setupListeners();
};

const setTheme = (themeName) => {
  document.body.setAttribute("data-theme", themeName === "default" ? "" : themeName);
  const metaTheme = document.querySelector('meta[name="theme-color"]');
  if(metaTheme) {
    metaTheme.setAttribute("content", themeName === "amoled" ? "#000000" : "#05070a");
  }
};

const hapticFeedback = (type) => {
  if (navigator.vibrate) {
    if (type === 'success') navigator.vibrate([10, 30]);
    else navigator.vibrate(15);
  }
};

// =======================
// RENDER LOGIC
// =======================
const renderList = () => {
  els.list.innerHTML = "";
  
  const term = els.search.value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const region = els.region.value;
  const country = els.country.value;
  const showFavs = els.favToggle.checked;

  const filtered = stations.filter(st => {
    const matchSearch = !term || st.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(term);
    const matchRegion = region === "Todas" || st.region === region;
    const matchCountry = country === "Todos" || st.country === country;
    const matchFav = !showFavs || favorites.has(st.name);
    return matchSearch && matchRegion && matchCountry && matchFav;
  });

  if (filtered.length === 0) {
    els.list.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:2rem; color:var(--text-muted)">Sin señal detectada.</div>`;
    return;
  }

  filtered.forEach(st => {
    const isActive = currentStation && currentStation.name === st.name;
    const isFav = favorites.has(st.name);
    const badgeClass = regionClassMap[st.region] || "badge-default";
    
    // Animar solo si activo + reproduciendo
    const animatingClass = (isActive && isPlaying) ? 'animating' : '';

    const div = document.createElement("div");
    div.className = `station-card ${isActive ? 'active' : ''} ${animatingClass}`;
    
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
        <button class="fav-btn ${isFav ? 'is-fav' : ''}" aria-label="Favorito">
          ${isFav ? '★' : '☆'}
        </button>
      </div>
    `;

    div.onclick = (e) => {
      if(!e.target.closest('.fav-btn')) {
        playStation(st);
      }
    };

    const btnFav = div.querySelector('.fav-btn');
    btnFav.onclick = (e) => {
      e.stopPropagation();
      hapticFeedback('light');
      if(favorites.has(st.name)) favorites.delete(st.name);
      else favorites.add(st.name);
      localStorage.setItem("ultra_favs", JSON.stringify([...favorites]));
      renderList();
    };

    els.list.appendChild(div);
  });
};

// =======================
// PLAYER LOGIC
// =======================
const playStation = (station) => {
  if (currentStation && currentStation.name === station.name) {
    togglePlay();
    return;
  }

  currentStation = station;
  els.title.innerText = station.name;
  els.artist.innerText = "Conectando satélite...";
  els.status.innerText = "BUFFERING";
  els.status.className = "status-indicator";
  els.status.style.color = "";

  els.player.src = station.url;
  els.player.volume = els.volSlider.value;
  
  const p = els.player.play();
  if (p !== undefined) {
    p.then(() => {
      setPlayingState(true);
      hapticFeedback('success');
    }).catch(e => {
      console.error(e);
      els.artist.innerText = "Stream offline.";
      els.status.innerText = "ERROR DE SEÑAL";
      els.status.style.color = "#ff3d3d";
      setPlayingState(false);
    });
  }
};

const togglePlay = () => {
  if (!currentStation) return;
  if (els.player.paused) {
    els.player.play();
    setPlayingState(true);
  } else {
    els.player.pause();
    setPlayingState(false);
  }
  hapticFeedback('light');
};

const setPlayingState = (playing) => {
  isPlaying = playing;
  
  if (playing) {
    els.btnPlay.classList.add("playing");
    els.status.innerText = "EN VIVO";
    els.status.classList.add("live");
    if(currentStation) els.artist.innerText = `${currentStation.country} · ${currentStation.region}`;
  } else {
    els.btnPlay.classList.remove("playing");
    els.status.innerText = "PAUSADO";
    els.status.classList.remove("live");
  }
  
  renderList();
};

// =======================
// FILTERS & EVENTS
// =======================
const loadFilters = () => {
  const regions = ["Todas", ...new Set(stations.map(s => s.region))].sort();
  const countries = ["Todos", ...new Set(stations.map(s => s.country))].sort();
  
  const fill = (sel, arr) => {
    sel.innerHTML = "";
    arr.forEach(val => {
      const opt = document.createElement("option");
      opt.value = val;
      opt.innerText = val;
      sel.appendChild(opt);
    });
  };
  
  fill(els.region, regions);
  fill(els.country, countries);
};

const updateVolumeVisuals = (val) => {
  const percentage = val * 100;
  els.volSlider.style.background = `linear-gradient(to right, #fff ${percentage}%, rgba(255,255,255,0.1) ${percentage}%)`;
};

const setupListeners = () => {
  els.btnPlay.addEventListener("click", togglePlay);
  
  els.volSlider.addEventListener("input", (e) => {
    const val = e.target.value;
    els.player.volume = val;
    updateVolumeVisuals(val);
  });

  els.themeSelect.addEventListener("change", (e) => {
    setTheme(e.target.value);
    localStorage.setItem("ultra_theme", e.target.value);
  });

  [els.search, els.region, els.country].forEach(el => el.addEventListener("input", renderList));
  els.favToggle.addEventListener("change", renderList);

  els.clearFilters.addEventListener("click", () => {
    els.search.value = "";
    els.region.value = "Todas";
    els.country.value = "Todos";
    els.favToggle.checked = false;
    renderList();
  });
};

document.addEventListener("DOMContentLoaded", init);
