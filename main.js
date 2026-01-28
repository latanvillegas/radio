// main.js v8.1 (SCROLL FIX & PERFORMANCE)
// =======================================

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
  console.log("Satelital Wave Player v8.1 - Cargando...");
  
  els = {
    player: document.getElementById("radioPlayer"),
    btnPlay: document.getElementById("btnPlay"),
    btnPrev: document.getElementById("btnPrev"),
    btnNext: document.getElementById("btnNext"),
    status: document.getElementById("statusIndicator"),
    title: document.getElementById("currentStation"),
    meta: document.getElementById("stationMeta"),
    timer: document.getElementById("timerDisplay"),
    list: document.getElementById("stationList"),
    search: document.getElementById("stationSearch"),
    region: document.getElementById("regionSelect"),
    country: document.getElementById("countrySelect"),
    clearFilters: document.getElementById("clearFilters"),
    badge: document.getElementById("metaBadge"),
    favToggle: document.getElementById("favoritesToggle"),
    sideMenu: document.getElementById("sideMenu"),
    menuOverlay: document.getElementById("menuOverlay"),
    btnOptions: document.getElementById("btnOptions"),
    btnCloseMenu: document.getElementById("btnCloseMenu"),
    addForm: document.getElementById("addStationForm"),
    stationsPanel: document.querySelector(".stations-panel") // Referencia al panel con scroll
  };

  loadFavorites();
  loadStations();
  setupEventListeners();
  applySavedTheme();
};

const loadStations = async () => {
  try {
    // Usamos los datos de stations.js
    stations = typeof rawStations !== 'undefined' ? rawStations : [];
    renderFilters();
    renderList();
  } catch (err) {
    console.error("Error cargando estaciones:", err);
  }
};

const renderList = () => {
  if(!els.list) return;

  // RESET DE SCROLL: Al filtrar o buscar, el panel vuelve arriba
  if(els.stationsPanel) els.stationsPanel.scrollTop = 0;

  const searchTerm = els.search.value.toLowerCase();
  const regionTerm = els.region.value;
  const countryTerm = els.country.value;
  const showFavsOnly = els.favToggle.checked;

  let filtered = stations.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm);
    const matchesRegion = !regionTerm || s.region === regionTerm;
    const matchesCountry = !countryTerm || s.country === countryTerm;
    const matchesFav = !showFavsOnly || favorites.has(s.id);
    return matchesSearch && matchesRegion && matchesCountry && matchesFav;
  });

  els.list.innerHTML = "";
  
  filtered.forEach(s => {
    const card = document.createElement("div");
    card.className = `station-card ${currentStation?.id === s.id ? 'active' : ''}`;
    card.innerHTML = `
      <div class="station-info">
        <div class="station-name">${s.name}</div>
        <div class="station-tags">
          <span class="badge ${countryClassMap[s.country] || 'badge-default'}">${s.country}</span>
        </div>
      </div>
      <button class="fav-btn ${favorites.has(s.id) ? 'active' : ''}" data-id="${s.id}">
        ${favorites.has(s.id) ? '★' : '☆'}
      </button>
    `;
    card.onclick = (e) => {
      if(e.target.classList.contains('fav-btn')) {
        toggleFavorite(s.id);
        e.stopPropagation();
      } else {
        selectStation(s);
      }
    };
    els.list.appendChild(card);
  });
};

const selectStation = (station) => {
  currentStation = station;
  els.title.innerText = station.name;
  els.meta.innerText = `${station.country} · ${station.region}`;
  els.player.src = station.url;
  
  document.querySelectorAll('.station-card').forEach(c => c.classList.remove('active'));
  renderList();
  playRadio();
  
  if ('mediaSession' in navigator) {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: station.name,
      artist: "Radio Satelital",
      album: station.country,
      artwork: [{ src: 'icon-512.png', sizes: '512x512', type: 'image/png' }]
    });
  }
};

const playRadio = () => {
  els.player.play()
    .then(() => {
      isPlaying = true;
      els.btnPlay.classList.add("playing");
      els.status.innerText = "En Vivo";
      els.status.classList.add("live");
      if(els.badge) els.badge.style.display = "block";
      startTimer();
    })
    .catch(err => {
      console.error("Error de reproducción:", err);
      els.status.innerText = "Error de conexión";
    });
};

const startTimer = (reset = true) => {
  if(timerInterval) clearInterval(timerInterval);
  if(reset) secondsElapsed = 0;
  
  timerInterval = setInterval(() => {
    secondsElapsed++;
    const mins = Math.floor(secondsElapsed / 60).toString().padStart(2, '0');
    const secs = (secondsElapsed % 60).toString().padStart(2, '0');
    els.timer.innerText = `${mins}:${secs}`;
  }, 1000);
};

// --- Gestión de Favoritos y Temas ---
const toggleFavorite = (id) => {
  if(favorites.has(id)) favorites.delete(id);
  else favorites.add(id);
  localStorage.setItem("satelital_favs", JSON.stringify([...favorites]));
  renderList();
};

const loadFavorites = () => {
  const saved = localStorage.getItem("satelital_favs");
  if(saved) favorites = new Set(JSON.parse(saved));
};

const setupEventListeners = () => {
  els.btnPlay.onclick = () => {
    if(!currentStation) return;
    if(isPlaying) {
      els.player.pause();
      isPlaying = false;
      els.btnPlay.classList.remove("playing");
      els.status.innerText = "Pausado";
      clearInterval(timerInterval);
    } else {
      playRadio();
    }
  };

  els.search.oninput = renderList;
  els.region.onchange = renderList;
  els.country.onchange = renderList;
  els.favToggle.onchange = renderList;
  
  els.btnOptions.onclick = () => {
    els.sideMenu.classList.add("active");
    els.menuOverlay.classList.add("active");
  };

  const closeMenu = () => {
    els.sideMenu.classList.remove("active");
    els.menuOverlay.classList.remove("active");
  };

  els.btnCloseMenu.onclick = closeMenu;
  els.menuOverlay.onclick = closeMenu;

  // Cambio de Temas
  document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.onclick = () => {
      const theme = btn.dataset.theme;
      document.body.setAttribute('data-theme', theme);
      localStorage.setItem('satelital_theme', theme);
      document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    };
  });
};

const applySavedTheme = () => {
  const saved = localStorage.getItem('satelital_theme') || 'default';
  document.body.setAttribute('data-theme', saved);
  const activeBtn = document.querySelector(`.theme-btn[data-theme="${saved}"]`);
  if(activeBtn) activeBtn.classList.add('active');
};

const renderFilters = () => {
  const regions = [...new Set(stations.map(s => s.region))].sort();
  const countries = [...new Set(stations.map(s => s.country))].sort();
  
  els.region.innerHTML = `<option value="">Todas las Regiones</option>` + 
    regions.map(r => `<option value="${r}">${r}</option>`).join('');
    
  els.country.innerHTML = `<option value="">Todos los Países</option>` + 
    countries.map(c => `<option value="${c}">${c}</option>`).join('');
};

document.addEventListener("DOMContentLoaded", init);
