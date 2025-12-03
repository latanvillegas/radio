// =======================
// SYSTEM CONFIG v4.0 (OPTIMIZED)
// =======================

const stations = [
  // ... (TUS DATOS DE EMISORAS SE MANTIENEN IGUAL, CÓPIALOS AQUÍ) ...
  { name: "Radio Moda", country: "Perú", region: "Sudamérica", url: "https://25023.live.streamtheworld.com/CRP_MOD_SC" },
  { name: "Ritmo Romántica", country: "Perú", region: "Sudamérica", url: "https://25103.live.streamtheworld.com/CRP_RIT_SC" },
  // ... (Resto de la lista)
];

// Mapa de regiones mantenido solo por compatibilidad lógica, visualmente anulado en CSS
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
  iconPlay: document.querySelector(".icon-play"),
  iconPause: document.querySelector(".icon-pause"),
  volSlider: document.getElementById("volSlider"),
  status: document.getElementById("statusIndicator"),
  title: document.getElementById("currentStation"),
  artist: document.getElementById("playerHint"),
  list: document.getElementById("stationList"),
  search: document.getElementById("stationSearch"),
  // Eliminados selectores de filtros redundantes para la vista simplificada
  favToggle: document.getElementById("favoritesToggle")
};

const normalize = (str) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

// =======================
// INIT
// =======================
const init = () => {
  if(!els.list) return;
  updateVolumeVisuals(els.volSlider.value);
  renderList();
  setupListeners();
};

// =======================
// RENDER & LOGIC
// =======================
const renderList = () => {
  els.list.innerHTML = "";
  
  const term = els.search ? normalize(els.search.value) : "";
  const showFavs = els.favToggle ? els.favToggle.checked : false;

  const filtered = stations.filter(st => {
    const matchSearch = !term || normalize(st.name).includes(term);
    const matchFav = !showFavs || favorites.has(st.name);
    return matchSearch && matchFav;
  });

  if (filtered.length === 0) {
    els.list.innerHTML = `<p style="color:var(--text-muted); text-align:left; grid-column: 1/-1; padding: 1rem;">No signal found.</p>`;
    return;
  }

  filtered.forEach(st => {
    const isActive = currentStation && currentStation.name === st.name;
    const isFav = favorites.has(st.name);
    
    const div = document.createElement("div");
    div.className = `station-card ${isActive ? 'active' : ''}`;
    
    // NOTA: Se eliminó el evento onmousemove para reducir carga cognitiva y de CPU

    div.onclick = (e) => {
      if(!e.target.closest('.fav-btn')) playStation(st);
    };

    // Usamos una clase genérica para el icono, controlada por CSS
    div.innerHTML = `
      <div class="st-info">
        <div class="st-icon"></div>
        <div>
          <span class="st-name">${st.name}</span>
          <span class="st-meta">${st.country}</span>
        </div>
      </div>
      <div style="display:flex; align-items:center;">
        <div class="visualizer">
          <div class="bar"></div><div class="bar"></div><div class="bar"></div>
        </div>
        <button class="fav-btn ${isFav ? 'is-fav' : ''}" aria-label="Favorito">
          ${isFav ? '★' : '☆'}
        </button>
      </div>
    `;

    const btnFav = div.querySelector('.fav-btn');
    btnFav.onclick = (e) => {
      e.stopPropagation();
      if(favorites.has(st.name)) favorites.delete(st.name);
      else favorites.add(st.name);
      localStorage.setItem("ultra_favs", JSON.stringify([...favorites]));
      renderList();
    };

    els.list.appendChild(div);
  });
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
  els.artist.innerText = "Conectando..."; // Mensaje más técnico y sobrio
  els.status.innerText = "BUFFERING";
  els.status.classList.remove("live");

  els.player.src = station.url;
  els.player.volume = els.volSlider.value;
  
  const playPromise = els.player.play();

  if (playPromise !== undefined) {
    playPromise.then(() => {
      setPlayingState(true);
      renderList(); 
    }).catch(error => {
      console.error("Stream Error:", error);
      els.artist.innerText = "Error: Offline.";
      els.status.innerText = "ERROR";
      els.status.style.color = "#ef4444";
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
};

const setPlayingState = (playing) => {
  isPlaying = playing;
  if (playing) {
    if(els.iconPlay) els.iconPlay.style.display = "none";
    if(els.iconPause) els.iconPause.style.display = "block";
    els.status.innerText = "SIGNAL ACTIVE";
    els.status.classList.add("live");
    els.status.style.color = ""; // Dejar que CSS controle el color
    if(currentStation) els.artist.innerText = `${currentStation.country} — ${currentStation.region}`;
    document.title = `▶ ${currentStation.name}`;
  } else {
    if(els.iconPlay) els.iconPlay.style.display = "block";
    if(els.iconPause) els.iconPause.style.display = "none";
    els.status.innerText = "STANDBY";
    els.status.classList.remove("live");
    document.title = "Radio | Standby";
  }
};

const updateVolumeVisuals = (val) => {
  // Simplificado: solo actualiza
  // La visualización compleja del slider se eliminó en CSS
};

// =======================
// LISTENERS
// =======================
const setupListeners = () => {
  if(els.btnPlay) els.btnPlay.addEventListener("click", togglePlay);
  
  if(els.volSlider) {
    els.volSlider.addEventListener("input", (e) => {
      const val = e.target.value;
      els.player.volume = val;
    });
  }

  if(els.search) els.search.addEventListener("input", renderList);
  if(els.favToggle) els.favToggle.addEventListener("change", renderList);
};

document.addEventListener("DOMContentLoaded", init);
