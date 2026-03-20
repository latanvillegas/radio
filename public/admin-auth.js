// admin-auth.js - Autenticacion segura para panel admin
// ====================================================

(function () {
  const STORAGE_KEY = "admin_session";
  const SKEW_SECONDS = 60;
  const INACTIVITY_TIMEOUT = 15 * 60 * 1000; // 15 minutos
  const WARNING_BEFORE_LOGOUT = 2 * 60 * 1000; // Advertencia 2 minutos antes
  
  let inactivityTimeout = null;
  let warningTimeout = null;
  let warningElement = null;

  const getConfig = () => {
    const cfg = window.SUPABASE_CONFIG;
    if (!cfg || !cfg.url || !cfg.anonKey) {
      throw new Error("Configuracion de Supabase no disponible");
    }
    return cfg;
  };

  const authBaseUrl = () => {
    const cfg = getConfig();
    return `${String(cfg.url).replace(/\/$/, "")}/auth/v1`;
  };

  const restBaseUrl = () => {
    const cfg = getConfig();
    if (cfg.restUrl) return String(cfg.restUrl).replace(/\/$/, "");
    return `${String(cfg.url).replace(/\/$/, "")}/rest/v1`;
  };

  const nowEpoch = () => Math.floor(Date.now() / 1000);

  const loadSession = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") return null;
      return parsed;
    } catch (_) {
      return null;
    }
  };

  const saveSession = (session) => {
    if (!session || !session.access_token) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  };

  const clearSession = () => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem("admin_email");
    localStorage.removeItem("admin_role");
    localStorage.removeItem("admin_token");
  };

  const hasValidAccessToken = (session) => {
    if (!session?.access_token || !session?.expires_at) return false;
    return Number(session.expires_at) > nowEpoch() + SKEW_SECONDS;
  };

  const authHeaders = (accessToken) => {
    const cfg = getConfig();
    return {
      apikey: cfg.anonKey,
      Authorization: `Bearer ${accessToken || cfg.anonKey}`,
      "Content-Type": "application/json"
    };
  };

  const signInWithPassword = async (email, password) => {
    const response = await fetch(`${authBaseUrl()}/token?grant_type=password`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();
    if (!response.ok || data?.error) {
      throw new Error(data?.error_description || data?.msg || "No se pudo iniciar sesion");
    }

    if (!data?.access_token) {
      throw new Error("Respuesta de autenticacion incompleta");
    }

    saveSession(data);
    return data;
  };

  const signUpWithPassword = async (email, password, metadata) => {
    const response = await fetch(`${authBaseUrl()}/signup`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({
        email,
        password,
        data: metadata || {}
      })
    });

    const data = await response.json();
    if (!response.ok || data?.error) {
      throw new Error(data?.msg || data?.error_description || "No se pudo crear cuenta");
    }

    if (data?.access_token) {
      saveSession(data);
    }

    return data;
  };

  const refreshSession = async (refreshToken) => {
    if (!refreshToken) throw new Error("Sesion expirada. Inicia sesion nuevamente.");

    const response = await fetch(`${authBaseUrl()}/token?grant_type=refresh_token`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ refresh_token: refreshToken })
    });

    const data = await response.json();
    if (!response.ok || data?.error) {
      clearSession();
      throw new Error("Sesion expirada. Inicia sesion nuevamente.");
    }

    saveSession(data);
    return data;
  };

  const getValidSession = async () => {
    const session = loadSession();
    if (!session) return null;
    if (hasValidAccessToken(session)) return session;

    try {
      return await refreshSession(session.refresh_token);
    } catch (_) {
      clearSession();
      return null;
    }
  };

  const getUser = async (accessToken) => {
    const session = accessToken ? { access_token: accessToken } : await getValidSession();
    if (!session?.access_token) return null;

    const response = await fetch(`${authBaseUrl()}/user`, {
      method: "GET",
      headers: authHeaders(session.access_token)
    });

    if (!response.ok) return null;
    return response.json();
  };

  const fetchAdminProfile = async (email, accessToken) => {
    const endpoint = `${restBaseUrl()}/admin_users?select=email,role,status&email=eq.${encodeURIComponent(email)}&limit=1`;
    const response = await fetch(endpoint, {
      method: "GET",
      headers: authHeaders(accessToken)
    });

    const data = await response.json();
    if (!response.ok || !Array.isArray(data) || data.length === 0) {
      return null;
    }

    return data[0];
  };

  const getAuthenticatedAdmin = async () => {
    const session = await getValidSession();
    if (!session?.access_token) {
      return { ok: false, reason: "no-session" };
    }

    const user = await getUser(session.access_token);
    if (!user?.email) {
      clearSession();
      return { ok: false, reason: "invalid-user" };
    }

    const profile = await fetchAdminProfile(user.email, session.access_token);
    if (!profile || !["admin", "reviewer"].includes(String(profile.role || "").toLowerCase())) {
      clearSession();
      return { ok: false, reason: "no-admin-role" };
    }

    if (String(profile.status || "active").toLowerCase() !== "active") {
      clearSession();
      return { ok: false, reason: "inactive-admin" };
    }

    localStorage.setItem("admin_email", user.email);
    localStorage.setItem("admin_role", String(profile.role));

    return {
      ok: true,
      session,
      user: {
        email: user.email,
        role: String(profile.role),
        status: String(profile.status || "active")
      }
    };
  };

  const signOut = async () => {
    const session = loadSession();
    if (session?.access_token) {
      try {
        await fetch(`${authBaseUrl()}/logout`, {
          method: "POST",
          headers: authHeaders(session.access_token)
        });
      } catch (_) {
        // Limpieza local de sesion aun si falla red
      }
    }
    clearSession();
  };

  // ===== INACTIVITY GUARD =====
  const hideInactivityWarning = () => {
    if (warningElement && warningElement.parentNode) {
      warningElement.parentNode.removeChild(warningElement);
      warningElement = null;
    }
  };

  const showInactivityWarning = () => {
    hideInactivityWarning();
    
    warningElement = document.createElement("div");
    warningElement.id = "inactivity-warning";
    warningElement.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: #fff;
      border: 2px solid #f59e0b;
      border-radius: 8px;
      padding: 24px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.3);
      z-index: 10000;
      font-family: system-ui, -apple-system, sans-serif;
      width: 90%;
      max-width: 400px;
    `;
    
    const minutesLeft = Math.ceil(WARNING_BEFORE_LOGOUT / 60000);
    warningElement.innerHTML = `
      <h2 style="margin: 0 0 12px 0; font-size: 18px; color: #d97706;">
        ⚠️ Sesión expirando
      </h2>
      <p style="margin: 0 0 16px 0; color: #666; font-size: 14px;">
        Tu sesión se cerrará automáticamente por inactividad en ${minutesLeft} minuto(s).
      </p>
      <div style="display: flex; gap: 8px; justify-content: flex-end;">
        <button id="inactivity-logout-btn" style="
          flex: 1;
          padding: 8px 16px;
          background: #ef4444;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 500;
        ">Cerrar sesión</button>
        <button id="inactivity-extend-btn" style="
          flex: 1;
          padding: 8px 16px;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 500;
        ">Continuar</button>
      </div>
    `;
    
    document.body.appendChild(warningElement);
    
    const logoutBtn = document.getElementById("inactivity-logout-btn");
    const extendBtn = document.getElementById("inactivity-extend-btn");
    
    if (logoutBtn) {
      logoutBtn.addEventListener("click", async () => {
        hideInactivityWarning();
        await signOut();
        window.location.href = "/admin-login.html";
      });
    }
    
    if (extendBtn) {
      extendBtn.addEventListener("click", () => {
        hideInactivityWarning();
        resetInactivityTimer();
      });
    }
  };

  const resetInactivityTimer = () => {
    if (inactivityTimeout) clearTimeout(inactivityTimeout);
    if (warningTimeout) clearTimeout(warningTimeout);
    hideInactivityWarning();

    warningTimeout = setTimeout(() => {
      showInactivityWarning();
    }, INACTIVITY_TIMEOUT - WARNING_BEFORE_LOGOUT);

    inactivityTimeout = setTimeout(async () => {
      hideInactivityWarning();
      await signOut();
      window.location.href = "/admin-login.html";
    }, INACTIVITY_TIMEOUT);
  };

  const startInactivityGuard = () => {
    resetInactivityTimer();
    
    const events = ["mousedown", "keydown", "scroll", "touchstart", "click"];
    const listener = () => resetInactivityTimer();
    
    events.forEach(event => {
      document.addEventListener(event, listener, { passive: true });
    });
  };

  const stopInactivityGuard = () => {
    if (inactivityTimeout) clearTimeout(inactivityTimeout);
    if (warningTimeout) clearTimeout(warningTimeout);
    hideInactivityWarning();
  };

  window.AdminAuth = {
    signInWithPassword,
    signUpWithPassword,
    getUser,
    getValidSession,
    getAuthenticatedAdmin,
    signOut,
    clearSession,
    saveSession,
    authHeaders,
    startInactivityGuard,
    stopInactivityGuard,
    resetInactivityTimer
  };
})();
