// admin.js - Panel de Administración de Radio Satelital
// ===============================================================

let adminState = {
  currentUser: null,
  userRole: null,
  stations: {
    pending: [],
    approved: [],
    rejected: []
  },
  invitations: [],
  admins: []
};

// ===============================================================
// CONFIGURACIÓN DE SUPABASE
// ===============================================================

const getSupabaseClient = () => {
  const cfg = window.SUPABASE_CONFIG;
  if (!cfg || !cfg.url || !cfg.anonKey) {
    console.error('Configuración de Supabase no disponible');
    return null;
  }
  return cfg;
};

// ===============================================================
// FUNCIONES DE API (Supabase REST)
// ===============================================================

const supabaseRest = async (table, options = {}) => {
  const cfg = getSupabaseClient();
  if (!cfg) throw new Error('Configuración no disponible');

  const baseRest = cfg.restUrl ? String(cfg.restUrl).replace(/\/$/, "") : `${cfg.url}/rest/v1`;
  const endpoint = `${baseRest}/${table}`;

  const headers = {
    'apikey': cfg.anonKey,
    'Authorization': `Bearer ${cfg.anonKey}`,
    'Content-Type': 'application/json'
  };

  if (options.select) {
    const url = `${endpoint}?${new URLSearchParams({
      select: options.select,
      ...(options.filter && { [Object.keys(options.filter)[0]]: `eq.${Object.values(options.filter)[0]}` })
    })}`;
    return fetch(url, { headers }).then(r => r.json());
  }

  if (options.method === 'POST') {
    return fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(options.data)
    }).then(r => r.json());
  }

  if (options.method === 'PATCH') {
    const filter = Object.entries(options.filter || {})
      .map(([k, v]) => `${k}=eq.${v}`)
      .join('&');
    const url = filter ? `${endpoint}?${filter}` : endpoint;
    return fetch(url, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(options.data)
    }).then(r => r.json());
  }

  if (options.method === 'GET') {
    const filter = options.filter 
      ? Object.entries(options.filter)
        .map(([k, v]) => `${k}=eq.${v}`)
        .join('&')
      : '';
    const url = filter ? `${endpoint}?${filter}` : endpoint;
    return fetch(url, { headers }).then(r => r.json());
  }

  return fetch(endpoint, { headers }).then(r => r.json());
};

// ===============================================================
// FUNCIONES RPC (Procedimientos almacenados)
// ===============================================================

const callRPC = async (functionName, params = {}) => {
  const cfg = getSupabaseClient();
  if (!cfg) throw new Error('Configuración no disponible');

  const baseRest = cfg.restUrl ? String(cfg.restUrl).replace(/\/$/, "") : `${cfg.url}/rest/v1`;
  const endpoint = `${baseRest}/rpc/${functionName}`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': cfg.anonKey,
      'Authorization': `Bearer ${cfg.anonKey}`
    },
    body: JSON.stringify(params)
  });

  return response.json();
};

// ===============================================================
// FUNCIONES DE AUTENTICACIÓN
// ===============================================================

const getCurrentUser = () => {
  // Buscar usuario autenticado aquí
  const email = localStorage.getItem('admin_email');
  const role = localStorage.getItem('admin_role');

  if (!email || !role) {
    window.location.href = '/admin-login.html';
    return null;
  }

  return { email, role };
};

const logout = () => {
  localStorage.removeItem('admin_email');
  localStorage.removeItem('admin_role');
  localStorage.removeItem('admin_token');
  window.location.href = '/admin-login.html';
};

// ===============================================================
// FUNCIONES DE CARGA DE DATOS
// ===============================================================

const loadPendingStations = async () => {
  try {
    const data = await supabaseRest('global_stations', {
      select: 'id,name,url,country,region,district,caserio,created_at',
      filter: { status: 'pending' }
    });
    adminState.stations.pending = Array.isArray(data) ? data : [];
    return adminState.stations.pending;
  } catch (error) {
    console.error('Error cargando estaciones pendientes:', error);
    showMessage('Error al cargar estaciones pendientes', 'error');
    return [];
  }
};

const loadApprovedStations = async () => {
  try {
    const data = await supabaseRest('global_stations', {
      select: 'id,name,url,country,region,district,caserio,reviewed_by,approved_at',
      filter: { status: 'approved' }
    });
    adminState.stations.approved = Array.isArray(data) ? data : [];
    return adminState.stations.approved;
  } catch (error) {
    console.error('Error cargando estaciones aprobadas:', error);
    return [];
  }
};

const loadRejectedStations = async () => {
  try {
    const data = await supabaseRest('global_stations', {
      select: 'id,name,url,country,region,district,caserio,reviewed_by',
      filter: { status: 'rejected' }
    });
    adminState.stations.rejected = Array.isArray(data) ? data : [];
    return adminState.stations.rejected;
  } catch (error) {
    console.error('Error cargando estaciones rechazadas:', error);
    return [];
  }
};

const loadAdmins = async () => {
  if (adminState.userRole !== 'admin') return [];
  
  try {
    const data = await supabaseRest('admin_users', {
      select: 'id,email,full_name,role,status,created_at'
    });
    adminState.admins = Array.isArray(data) ? data : [];
    return adminState.admins;
  } catch (error) {
    console.error('Error cargando administradores:', error);
    return [];
  }
};

const loadInvitations = async () => {
  if (adminState.userRole !== 'admin') return [];
  
  try {
    const data = await supabaseRest('admin_invitations', {
      select: 'id,email,role,status,created_at,expires_at'
    });
    adminState.invitations = Array.isArray(data) ? data : [];
    return adminState.invitations;
  } catch (error) {
    console.error('Error cargando invitaciones:', error);
    return [];
  }
};

const loadApprovalHistory = async () => {
  if (adminState.userRole !== 'admin') return [];
  
  try {
    const data = await supabaseRest('approval_history', {
      select: 'id,station_id,admin_id,action,comments,created_at'
    });
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Error cargando historial:', error);
    return [];
  }
};

// ===============================================================
// FUNCIONES DE ACCIÓN
// ===============================================================

const approveStation = async (stationId) => {
  try {
    const result = await callRPC('approve_station', {
      p_station_id: stationId,
      p_admin_email: adminState.currentUser.email
    });

    if (result.error) {
      showMessage('Error al aprobar: ' + result.error.message, 'error');
      return false;
    }

    showMessage('Radio aprobada correctamente ✓', 'success');
    await loadPendingStations();
    await loadApprovedStations();
    renderStations();
    return true;
  } catch (error) {
    console.error('Error:', error);
    showMessage('Error al aprobar la radio', 'error');
    return false;
  }
};

const rejectStation = async (stationId, comments = '') => {
  try {
    const result = await callRPC('reject_station', {
      p_station_id: stationId,
      p_admin_email: adminState.currentUser.email,
      p_comments: comments || null
    });

    if (result.error) {
      showMessage('Error al rechazar: ' + result.error.message, 'error');
      return false;
    }

    showMessage('Radio rechazada', 'success');
    await loadPendingStations();
    await loadRejectedStations();
    renderStations();
    return true;
  } catch (error) {
    console.error('Error:', error);
    showMessage('Error al rechazar la radio', 'error');
    return false;
  }
};

const sendAdminInvitation = async (email, role) => {
  try {
    const result = await callRPC('create_admin_invitation', {
      p_email: email,
      p_role: role,
      p_invited_by_email: adminState.currentUser.email
    });

    if (result.error) {
      showMessage('Error: ' + result.error.message, 'error');
      return false;
    }

    if (result.id) {
      // En producción, aquí enviarías un email con el link de invitación
      const invitationLink = `${window.location.origin}/admin-accept-invitation.html?token=${result.token}`;
      
      showMessage(`✓ Invitación creada. Link: ${invitationLink}`, 'success');
      console.log('Link de invitación (copiar y enviar):', invitationLink);
      
      await loadInvitations();
      renderInvitationsList();
      return true;
    }
  } catch (error) {
    console.error('Error:', error);
    showMessage('Error al enviar invitación', 'error');
    return false;
  }
};

// ===============================================================
// FUNCIONES DE RENDERIZADO
// ===============================================================

const renderStations = () => {
  const pendingList = document.getElementById('pendingList');
  const approvedList = document.getElementById('approvedList');
  const rejectedList = document.getElementById('rejectedList');

  // Renderizar pendientes
  if (adminState.stations.pending.length === 0) {
    pendingList.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">✨</div>
        <p>No hay radios pendientes de aprobación.</p>
      </div>
    `;
  } else {
    pendingList.innerHTML = adminState.stations.pending.map(station => `
      <div class="station-card">
        <div class="station-header">
          <h3 class="station-title">${escapeHtml(station.name)}</h3>
          <span class="station-badge">PENDIENTE</span>
        </div>
        <div class="station-info">
          <div class="station-info-row">
            <span class="station-info-label">País</span>
            <span class="station-info-value">${escapeHtml(station.country)}</span>
          </div>
          <div class="station-info-row">
            <span class="station-info-label">Región</span>
            <span class="station-info-value">${escapeHtml(station.region)}</span>
          </div>
          ${station.district ? `
          <div class="station-info-row">
            <span class="station-info-label">Distrito</span>
            <span class="station-info-value">${escapeHtml(station.district)}</span>
          </div>
          ` : ''}
          <div class="station-info-row">
            <span class="station-info-label">URL</span>
            <span class="station-info-value station-url">${escapeHtml(station.url)}</span>
          </div>
          <div class="station-info-row">
            <span class="station-info-label">Enviada</span>
            <span class="station-info-value">${formatDate(station.created_at)}</span>
          </div>
        </div>
        <div class="station-actions">
          <button class="action-btn approve-btn" onclick="approveStation(${station.id})">
            ✓ Aprobar
          </button>
          <button class="action-btn reject-btn" onclick="promptRejectStation(${station.id})">
            ✕ Rechazar
          </button>
        </div>
      </div>
    `).join('');
  }

  // Renderizar aprobadas
  if (adminState.stations.approved.length === 0) {
    approvedList.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">✓</div>
        <p>No hay radios aprobadas aún.</p>
      </div>
    `;
  } else {
    approvedList.innerHTML = adminState.stations.approved.map(station => `
      <div class="station-card">
        <div class="station-header">
          <h3 class="station-title">${escapeHtml(station.name)}</h3>
          <span style="padding: 6px 12px; border-radius: 20px; background: rgba(76,175,80,0.2); color: #4caf50; font-size: 0.8rem; font-weight: 600; text-transform: uppercase;">APROBADA</span>
        </div>
        <div class="station-info">
          <div class="station-info-row">
            <span class="station-info-label">País</span>
            <span class="station-info-value">${escapeHtml(station.country)}</span>
          </div>
          <div class="station-info-row">
            <span class="station-info-label">Región</span>
            <span class="station-info-value">${escapeHtml(station.region)}</span>
          </div>
          <div class="station-info-row">
            <span class="station-info-label">Aprobada por</span>
            <span class="station-info-value">${escapeHtml(station.reviewed_by)}</span>
          </div>
          <div class="station-info-row">
            <span class="station-info-label">Fecha</span>
            <span class="station-info-value">${formatDate(station.approved_at)}</span>
          </div>
        </div>
      </div>
    `).join('');
  }

  // Renderizar rechazadas
  if (adminState.stations.rejected.length === 0) {
    rejectedList.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">✕</div>
        <p>No hay radios rechazadas aún.</p>
      </div>
    `;
  } else {
    rejectedList.innerHTML = adminState.stations.rejected.map(station => `
      <div class="station-card" style="opacity: 0.7;">
        <div class="station-header">
          <h3 class="station-title">${escapeHtml(station.name)}</h3>
          <span style="padding: 6px 12px; border-radius: 20px; background: rgba(244,67,54,0.2); color: #f44336; font-size: 0.8rem; font-weight: 600; text-transform: uppercase;">RECHAZADA</span>
        </div>
        <div class="station-info">
          <div class="station-info-row">
            <span class="station-info-label">País</span>
            <span class="station-info-value">${escapeHtml(station.country)}</span>
          </div>
          <div class="station-info-row">
            <span class="station-info-label">Rechazada por</span>
            <span class="station-info-value">${escapeHtml(station.reviewed_by)}</span>
          </div>
        </div>
      </div>
    `).join('');
  }

  updateCounters();
};

const renderInvitationsList = () => {
  const pendingInvitations = document.getElementById('pendingInvitations');
  
  const pending = adminState.invitations.filter(i => i.status === 'pending');
  
  if (pending.length === 0) {
    pendingInvitations.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📧</div>
        <p>No hay invitaciones pendientes.</p>
      </div>
    `;
  } else {
    pendingInvitations.innerHTML = pending.map(inv => `
      <div class="station-card">
        <div class="station-header">
          <h3 class="station-title">${escapeHtml(inv.email)}</h3>
          <span style="padding: 6px 12px; border-radius: 20px; background: rgba(255,193,7,0.2); color: #ffc107; font-size: 0.8rem; font-weight: 600; text-transform: uppercase;">
            ${escapeHtml(inv.role)}
          </span>
        </div>
        <div class="station-info">
          <div class="station-info-row">
            <span class="station-info-label">Creada</span>
            <span class="station-info-value">${formatDate(inv.created_at)}</span>
          </div>
          <div class="station-info-row">
            <span class="station-info-label">Expira</span>
            <span class="station-info-value">${formatDate(inv.expires_at)}</span>
          </div>
        </div>
      </div>
    `).join('');
  }
};

const renderAdminsList = async () => {
  const adminsList = document.getElementById('adminsList');
  
  if (adminState.admins.length === 0) {
    adminsList.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">👤</div>
        <p>No hay administradores.</p>
      </div>
    `;
  } else {
    adminsList.innerHTML = adminState.admins.map(admin => `
      <div class="stat-card">
        <div style="text-align: left; padding: 15px 0;">
          <div style="font-weight: 700; color: var(--brand); margin-bottom: 8px;">
            ${escapeHtml(admin.email)}
          </div>
          <div style="color: rgba(255,255,255,0.7); font-size: 0.85rem; margin-bottom: 12px;">
            <strong>Rol:</strong> ${escapeHtml(admin.role)}
          </div>
          <div style="color: rgba(255,255,255,0.7); font-size: 0.85rem; margin-bottom: 12px;">
            <strong>Estado:</strong> ${escapeHtml(admin.status)}
          </div>
          <div style="color: rgba(255,255,255,0.5); font-size: 0.8rem;">
            Creado: ${formatDate(admin.created_at)}
          </div>
        </div>
      </div>
    `).join('');
  }
};

const renderApprovalHistory = async () => {
  const historyList = document.getElementById('historyList');
  const history = await loadApprovalHistory();
  
  if (history.length === 0) {
    historyList.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📜</div>
        <p>No hay historial de aprobaciones.</p>
      </div>
    `;
  } else {
    historyList.innerHTML = history.map(record => `
      <div class="station-card">
        <div class="station-header">
          <span style="color: ${record.action === 'approved' ? '#4caf50' : '#f44336'};">
            ${record.action === 'approved' ? '✓ APROBADA' : '✕ RECHAZADA'}
          </span>
        </div>
        <div class="station-info">
          <div class="station-info-row">
            <span class="station-info-label">Estación ID</span>
            <span class="station-info-value">#${record.station_id}</span>
          </div>
          <div class="station-info-row">
            <span class="station-info-label">Fecha</span>
            <span class="station-info-value">${formatDate(record.created_at)}</span>
          </div>
          ${record.comments ? `
          <div class="station-info-row">
            <span class="station-info-label">Comentarios</span>
            <span class="station-info-value">${escapeHtml(record.comments)}</span>
          </div>
          ` : ''}
        </div>
      </div>
    `).join('');
  }
};

const updateCounters = () => {
  document.getElementById('pendingCount').textContent = adminState.stations.pending.length;
  document.getElementById('approvedCount').textContent = adminState.stations.approved.length;
  document.getElementById('rejectedCount').textContent = adminState.stations.rejected.length;
};

// ===============================================================
// FUNCIONES DE UI
// ===============================================================

const showMessage = (text, type = 'info') => {
  const msgEl = document.getElementById('adminMessage');
  msgEl.textContent = text;
  msgEl.className = `message show ${type}`;
  
  setTimeout(() => {
    msgEl.classList.remove('show');
  }, 3000);
};

const escapeHtml = (text) => {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
};

const formatDate = (dateString) => {
  if (!dateString) return '--';
  return new Date(dateString).toLocaleString('es-ES');
};

const promptRejectStation = (stationId) => {
  const comments = prompt('¿Por qué rechazas esta radio? (opcional):', '');
  if (comments !== null) {
    rejectStation(stationId, comments);
  }
};

// ===============================================================
// EVENT LISTENERS
// ===============================================================

const setupEventListeners = () => {
  // Tabs
  document.querySelectorAll('.admin-tab').forEach(tab => {
    tab.addEventListener('click', (e) => {
      const tabName = e.target.dataset.tab;
      switchTab(tabName);
    });
  });

  // Logout
  document.getElementById('btnLogout').addEventListener('click', logout);

  // Form de invitación
  document.getElementById('inviteForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('inviteEmail').value.trim();
    const role = document.getElementById('inviteRole').value;

    if (!email || !role) {
      showMessage('Por favor completa todos los campos', 'error');
      return;
    }

    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Enviando...';

    const success = await sendAdminInvitation(email, role);
    
    btn.disabled = false;
    btn.textContent = 'Enviar Invitación';

    if (success) {
      document.getElementById('inviteForm').reset();
    }
  });
};

const switchTab = async (tabName) => {
  // Actualizar tabs
  document.querySelectorAll('.admin-tab').forEach(tab => {
    tab.classList.remove('active');
  });
  document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

  // Actualizar contenido
  document.querySelectorAll('.admin-tab-content').forEach(content => {
    content.classList.remove('active');
  });
  document.getElementById(tabName).classList.add('active');

  // Cargar datos específicos
  if (tabName === 'invite' && adminState.userRole === 'admin') {
    await loadInvitations();
    renderInvitationsList();
  } else if (tabName === 'admins' && adminState.userRole === 'admin') {
    await loadAdmins();
    await renderAdminsList();
  } else if (tabName === 'history' && adminState.userRole === 'admin') {
    await renderApprovalHistory();
  }
};

// ===============================================================
// INICIALIZACIÓN
// ===============================================================

const init = async () => {
  console.log('Inicializando Panel de Administración...');

  // Verificar autenticación
  const user = getCurrentUser();
  if (!user) return;

  adminState.currentUser = user;
  adminState.userRole = user.role;

  // Mostrar información del usuario
  document.getElementById('adminEmail').textContent = user.email;
  document.getElementById('adminRole').textContent = user.role.toUpperCase();

  // Mostrar tabs según rol
  if (user.role === 'admin') {
    document.getElementById('tabInvite').style.display = 'block';
    document.getElementById('tabAdmins').style.display = 'block';
    document.getElementById('tabHistory').style.display = 'block';
  }

  // Cargar datos
  try {
    await Promise.all([
      loadPendingStations(),
      loadApprovedStations(),
      loadRejectedStations()
    ]);

    renderStations();
    setupEventListeners();

    showMessage('✓ Panel de administración cargado', 'success');
  } catch (error) {
    console.error('Error al inicializar:', error);
    showMessage('Error al cargar los datos', 'error');
  }
};

// Iniciar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
