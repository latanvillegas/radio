// =======================
// SYSTEM CONFIG v6.1 (STABLE CORE)
// =======================

const defaultStations = [
  // ====== PERÚ ======
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
  
  // ====== REGIONALES HTTPS ======
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

  // ====== INTERNACIONAL ======
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
  "Sudamérica": "badge-sudamerica", "Europa": "badge-europa",
  "Norteamérica": "badge-norteamerica", "Centroamérica": "badge-norteamerica",
  "Internacional": "badge-default", "Custom": "badge-custom"
};

let stations = [];
let favorites = new Set(JSON.parse(localStorage.getItem("ultra_favs") || "[]"));
let currentStation = null;
let isPlaying = false;
let timerInterval = null;
let secondsElapsed = 0;

const els = {
  player: document.getElementById("radioPlayer"),
  btnPlay: document.getElementById("btnPlay"),
  volSlider: document.getElementById("volSlider"),
  status: document.getElementById("statusIndicator"),
  title: document.getElementById("currentStation"),
  info: document.getElementById("streamInfo"),
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
// INIT & DATA MERGE
// =======================
const init = () => {
  if(!els.list) return;
  
  // 1. Cargar Custom Stations de LocalStorage y mezclar
  const customStations = JSON.parse(localStorage.getItem("ultra_custom") || "[]");
  stations = [...customStations, ...defaultStations]; // Custom primero

  // 2. Theme
  const savedTheme = localStorage.getItem("ultra_theme") || "default";
  setTheme(savedTheme);
  if(els.themeSelect) els.themeSelect.value = savedTheme;

  // 3. Setup
  loadFilters();
  els.search.value = ""; els.region.value = "Todas"; els.country.value = "Todos"; els.favToggle.checked = false;
  
  updateVolumeVisuals(els.volSlider.value);
  renderList();
  setupListeners();
};

const setTheme = (themeName) => {
  document.body.setAttribute("data-theme", themeName === "default" ? "" : themeName);
  const metaTheme = document.querySelector('meta[name="theme-color"]');
  if(metaTheme) metaTheme.setAttribute("content", themeName === "amoled" ? "#000000" : "#05070a");
  updateVolumeVisuals(els.volSlider.value);
};

// =======================
// PLAYER LOGIC & STATS
// =======================
const simulateStats = () => {
  // Genera números aleatorios creíbles
  const viewers = Math.floor(Math.random() * (5000 - 100) + 100);
  const likes = Math.floor(viewers * (Math.random() * 0.8));
  
  // Animar números
  animateValue(els.listenerCount, 0, viewers, 1000);
  animateValue(els.likeCount, 0, likes, 1000);
  
  els.statsRow.style.opacity = "1";
};

const animateValue = (obj, start, end, duration) => {
  let startTimestamp = null;
  const step = (timestamp) => {
    if (!startTimestamp) startTimestamp = timestamp;
    const progress = Math.min((timestamp - startTimestamp) / duration, 1);
    obj.innerHTML = new Intl.NumberFormat().format(Math.floor(progress * (end - start) + start));
    if (progress < 1) window.requestAnimationFrame(step);
  };
  window.requestAnimationFrame(step);
};

const playStation = (station) => {
  if (currentStation && currentStation.name === station.name) { togglePlay(); return; }
  currentStation = station;
  
  els.title.innerText = station.name;
  els.info.innerText = `${station.country} · ${station.region}`;
  els.status.innerText = "CONECTANDO...";
  els.status.style.color = "";
  els.badge.style.display = "none";
  els.statsRow.style.opacity = "0"; // Reset stats
  
  stopTimer();
  if(els.timer) els.timer.innerText = "00:00";

  els.player.src = station.url;
  els.player.volume = els.volSlider.value;
  
  const p = els.player.play();
  if (p !== undefined) {
    p.then(() => {
      setPlayingState(true);
      simulateStats(); // Trigger simulated stats
      if (navigator.vibrate) navigator.vibrate([10,30]);
    }).catch(e => {
      console.error(e);
      els.info.innerText = "Stream Offline";
      els.status.innerText = "ERROR";
      els.status.style.color = "#ff3d3d";
      setPlayingState(false);
    });
  }
};

const togglePlay = () => {
  if (!currentStation) return;
  if (els.player.paused) { els.player.play(); setPlayingState(true); } 
  else { els.player.pause(); setPlayingState(false); }
};

const setPlayingState = (playing) => {
  isPlaying = playing;
  if (playing) {
    els.btnPlay.classList.add("playing");
    els.status.innerText = "EN VIVO";
    els.status.classList.add("live");
    els.badge.style.display = "inline-block";
    startTimer();
  } else {
    els.btnPlay.classList.remove("playing");
    els.status.innerText = "PAUSADO";
    els.status.classList.remove("live");
    els.badge.style.display = "none";
    stopTimer();
  }
  renderList();
};

// =======================
// CUSTOM STATIONS LOGIC
// =======================
const addCustomStation = (e) => {
  e.preventDefault();
  const name = document.getElementById("newStationName").value;
  const country = document.getElementById("newStationCountry").value;
  const url = document.getElementById("newStationUrl").value;

  if(name && url) {
    const newStation = { name, country, region: "Custom", url, isCustom: true };
    const customStations = JSON.parse(localStorage.getItem("ultra_custom") || "[]");
    
    customStations.push(newStation);
    localStorage.setItem("ultra_custom", JSON.stringify(customStations));
    
    // Recargar todo
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

// =======================
// RENDER & FILTERS
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
    els.list.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:3rem; color:var(--text-muted);">Sin señal.</div>`;
    return;
  }

  filtered.forEach(st => {
    const isActive = currentStation && currentStation.name === st.name;
    const isFav = favorites.has(st.name);
    const badgeClass = regionClassMap[st.region] || "badge-default";
    const animatingClass = (isActive && isPlaying) ? 'animating' : '';

    const div = document.createElement("div");
    div.className = `station-card ${isActive ? 'active' : ''} ${animatingClass}`;
    
    // Delete btn for custom stations
    let deleteHtml = '';
    if(st.isCustom) {
      deleteHtml = `<button class="del-btn" aria-label="Eliminar">×</button>`;
    }

    div.innerHTML = `
      <div class="st-info">
        <div class="st-icon ${badgeClass}"></div>
        <div><span class="st-name">${st.name}</span><span class="st-meta">${st.country}</span></div>
      </div>
      <div style="display:flex; align-items:center; gap:10px;">
        ${deleteHtml}
        <button class="fav-btn ${isFav ? 'is-fav' : ''}">★</button>
      </div>
    `;
    
    div.onclick = (e) => { 
      if(!e.target.closest('button')) playStation(st); 
    };
    
    // Fav Handler
    div.querySelector('.fav-btn').onclick = (e) => {
      e.stopPropagation();
      if(favorites.has(st.name)) favorites.delete(st.name); else favorites.add(st.name);
      localStorage.setItem("ultra_favs", JSON.stringify([...favorites]));
      renderList();
    };

    // Delete Handler
    if(st.isCustom) {
      div.querySelector('.del-btn').onclick = (e) => deleteCustomStation(e, st.name);
    }

    els.list.appendChild(div);
  });
};

const updateVolumeVisuals = (val) => {
  const percentage = val * 100;
  const gradient = `linear-gradient(90deg, #ff00cc 0%, #3333ff ${percentage}%, rgba(255,255,255,0.1) ${percentage}%)`;
  els.volSlider.style.background = gradient;
};

const loadFilters = () => {
  const regions = ["Todas", ...new Set(stations.map(s => s.region))].sort();
  const countries = ["Todos", ...new Set(stations.map(s => s.country))].sort();
  const fill = (sel, arr) => {
    sel.innerHTML = "";
    arr.forEach(val => {
      const opt = document.createElement("option");
      opt.value = val; opt.innerText = val; sel.appendChild(opt);
    });
  };
  fill(els.region, regions); fill(els.country, countries);
};

// =======================
// SYSTEM EVENTS
// =======================
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
    els.search.value = ""; els.region.value = "Todas"; els.country.value = "Todos"; els.favToggle.checked = false;
    renderList();
  });
  // Add Station Form
  if(els.addForm) els.addForm.addEventListener("submit", addCustomStation);
};

document.addEventListener("DOMContentLoaded", init);
