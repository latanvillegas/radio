// admin-audit.js - Sistema de Auditoría para Acciones Administrativas
// ====================================================================

(function () {
  const STORAGE_KEY = "audit_buffer";
  const BATCH_SIZE = 10;
  const BATCH_INTERVAL = 30 * 1000; // 30 segundos
  
  let auditBuffer = [];
  let batchTimer = null;

  /**
   * Tipos de acciones auditables
   */
  const AuditAction = {
    STATION_APPROVED: "station_approved",
    STATION_REJECTED: "station_rejected",
    STATION_PENDING: "station_pending",
    ADMIN_CREATED: "admin_created",
    ADMIN_UPDATED: "admin_updated",
    ADMIN_DELETED: "admin_deleted",
    ADMIN_INVITED: "admin_invited",
    INVITATION_ACCEPTED: "invitation_accepted",
    INVITATION_EXPIRED: "invitation_expired",
    PASSWORD_CHANGED: "password_changed",
    ROLE_CHANGED: "role_changed",
    STATUS_CHANGED: "status_changed",
    LOGIN_SUCCESS: "login_success",
    LOGIN_FAILED: "login_failed",
    LOGOUT: "logout",
    SESSION_EXPIRED: "session_expired",
    UNAUTHORIZED_ACCESS: "unauthorized_access"
  };

  /**
   * Niveles de severidad
   */
  const SeverityLevel = {
    INFO: "info",
    WARNING: "warning",
    ERROR: "error",
    CRITICAL: "critical"
  };

  /**
   * Registra una acción en el buffer de auditoría
   */
  const recordAction = (action, details = {}) => {
    const entry = {
      action,
      timestamp: new Date().toISOString(),
      userEmail: localStorage.getItem("admin_email") || "unknown",
      userRole: localStorage.getItem("admin_role") || "unknown",
      details: JSON.stringify(details),
      severity: determineSeverity(action),
      ipAddress: "client-side", // El backend reemplazará esto
      userAgent: navigator.userAgent.substring(0, 500)
    };

    auditBuffer.push(entry);

    // Enviar si alcanzamos el tamaño de batch
    if (auditBuffer.length >= BATCH_SIZE) {
      flushAuditBuffer();
    } else {
      // O programar envío en intervalo
      scheduleBatchSend();
    }
  };

  /**
   * Determina el nivel de severidad según la acción
   */
  const determineSeverity = (action) => {
    const criticalActions = [
      AuditAction.ADMIN_DELETED,
      AuditAction.UNAUTHORIZED_ACCESS,
      AuditAction.ROLE_CHANGED
    ];

    const warningActions = [
      AuditAction.ADMIN_CREATED,
      AuditAction.ADMIN_UPDATED,
      AuditAction.ADMIN_INVITED
    ];

    if (criticalActions.includes(action)) return SeverityLevel.CRITICAL;
    if (warningActions.includes(action)) return SeverityLevel.WARNING;
    return SeverityLevel.INFO;
  };

  /**
   * Programa el envío en lote
   */
  const scheduleBatchSend = () => {
    if (batchTimer) return;
    
    batchTimer = setTimeout(() => {
      if (auditBuffer.length > 0) {
        flushAuditBuffer();
      }
      batchTimer = null;
    }, BATCH_INTERVAL);
  };

  /**
   * Envía logs de auditoría a Supabase
   */
  const flushAuditBuffer = async () => {
    if (auditBuffer.length === 0) return;

    const logs = [...auditBuffer];
    auditBuffer = [];

    if (batchTimer) {
      clearTimeout(batchTimer);
      batchTimer = null;
    }

    try {
      const cfg = window.SUPABASE_CONFIG;
      if (!cfg || !cfg.url || !cfg.anonKey) {
        console.warn("Configuración de Supabase no disponible para auditoría");
        return;
      }

      const baseRest = cfg.restUrl 
        ? String(cfg.restUrl).replace(/\/$/, "") 
        : `${cfg.url}/rest/v1`;
      
      const endpoint = `${baseRest}/admin_audit_logs`;
      const session = await window.AdminAuth?.getValidSession?.();
      
      const headers = {
        'apikey': cfg.anonKey,
        'Content-Type': 'application/json',
        ...(session?.access_token && { 'Authorization': `Bearer ${session.access_token}` })
      };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(logs)
      });

      if (!response.ok) {
        console.warn('Error enviando logs de auditoría:', response.status);
        // Reintentar en próximo intervalo
        auditBuffer.unshift(...logs);
      }
    } catch (error) {
      console.warn('Error registrando auditoría:', error);
      // Reintentar en próximo intervalo
      auditBuffer.unshift(...logs);
    }
  };

  /**
   * Envía logs pendientes antes de logout/navegar
   */
  const ensureFlush = async () => {
    if (auditBuffer.length > 0) {
      await flushAuditBuffer();
      // Esperar un poco para asegurar envío
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  };

  // Escuchador para limpiar auditoría antes de navegar
  window.addEventListener('beforeunload', () => {
    if (auditBuffer.length > 0) {
      const logs = JSON.stringify(auditBuffer);
      navigator.sendBeacon && navigator.sendBeacon(
        `${window.SUPABASE_CONFIG?.url}/rest/v1/admin_audit_logs`,
        logs
      );
    }
  });

  // Exponer API pública
  window.AdminAudit = {
    recordAction,
    flushAuditBuffer,
    ensureFlush,
    AuditAction,
    SeverityLevel,
    
    // Métodos de conveniencia
    recordStationApproved: (stationId, stationName) =>
      recordAction(AuditAction.STATION_APPROVED, { stationId, stationName }),
    
    recordStationRejected: (stationId, stationName, reason) =>
      recordAction(AuditAction.STATION_REJECTED, { stationId, stationName, reason }),
    
    recordAdminCreated: (email, role) =>
      recordAction(AuditAction.ADMIN_CREATED, { email, role }),
    
    recordAdminUpdated: (email, changes) =>
      recordAction(AuditAction.ADMIN_UPDATED, { email, changes }),
    
    recordAdminDeleted: (email) =>
      recordAction(AuditAction.ADMIN_DELETED, { email }),
    
    recordAdminInvited: (email, role) =>
      recordAction(AuditAction.ADMIN_INVITED, { email, role }),
    
    recordInvitationAccepted: (email) =>
      recordAction(AuditAction.INVITATION_ACCEPTED, { email }),
    
    recordLoginSuccess: (email) =>
      recordAction(AuditAction.LOGIN_SUCCESS, { email }),
    
    recordLoginFailed: (email, reason) =>
      recordAction(AuditAction.LOGIN_FAILED, { email, reason }),
    
    recordLogout: (email) =>
      recordAction(AuditAction.LOGOUT, { email }),
    
    recordSessionExpired: (email) =>
      recordAction(AuditAction.SESSION_EXPIRED, { email }),
    
    recordUnauthorizedAccess: (email, endpoint) =>
      recordAction(AuditAction.UNAUTHORIZED_ACCESS, { email, endpoint }, SeverityLevel.CRITICAL),
    
    recordPasswordChanged: (email) =>
      recordAction(AuditAction.PASSWORD_CHANGED, { email }),
    
    recordRoleChanged: (email, oldRole, newRole) =>
      recordAction(AuditAction.ROLE_CHANGED, { email, oldRole, newRole }),
    
    recordStatusChanged: (email, oldStatus, newStatus) =>
      recordAction(AuditAction.STATUS_CHANGED, { email, oldStatus, newStatus })
  };
})();
