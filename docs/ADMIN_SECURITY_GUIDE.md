## Seguridad & Testing - Guía Completa v9.5+

Esta guía cubre las nuevas características de seguridad e implementación de testing para el panel de administración de Radio Satelital.

### Tabla de Contenidos
1. [Inactivity Guard](#inactivity-guard)
2. [Rate Limiting](#rate-limiting)
3. [RLS Policies](#rls-policies)
4. [Audit Logging](#audit-logging)
5. [Testing](#testing)
6. [Deployment Checklist](#deployment-checklist)

---

## Inactivity Guard

Sistema automático de logout por inactividad del usuario.

### Características
- **Timeout**: 15 minutos de inactividad
- **Advertencia**: Notificación 2 minutos antes del logout
- **Eventos monitoreados**: click, keydown, scroll, touchstart, mousedown
- **Modal interactivo**: Permite extender sesión o cerrar inmediatamente

### Configuración

El Inactivity Guard se inicia automáticamente en `/admin.html` después de la autenticación:

```javascript
// En admin.js - init()
window.AdminAuth.startInactivityGuard();
```

### Personalizar Tiempos

Editar en `admin-auth.js`:

```javascript
const INACTIVITY_TIMEOUT = 15 * 60 * 1000; // 15 minutos
const WARNING_BEFORE_LOGOUT = 2 * 60 * 1000; // 2 minutos
```

### Detener Inactivity Guard

```javascript
window.AdminAuth.stopInactivityGuard(); // Limpia timers
window.AdminAuth.resetInactivityTimer(); // Reset manual
```

---

## Rate Limiting

Control de tasa de solicitudes para prevenir ataques de fuerza bruta.

### Límites Implementados

| Endpoint | Límite | Ventana |
|----------|--------|---------|
| Login Global | 5 intentos | 1 minuto |
| Login por Email | 2 intentos | 5 minutos |
| Signup por Email | 3 intentos | 10 minutos |
| RPC Calls | 20 solicitudes | 1 minuto |
| API General | 30 solicitudes | 1 minuto |

### Uso

```javascript
// Verificar antes de operación
const result = window.RateLimiter.loginEmailLimiter.check(email);
if (!result.allowed) {
  console.log(`Espera ${result.resetTime}ms`);
  return;
}

// O usar helper
try {
  const response = await window.RateLimiter.checkLogin(async () => {
    return await authenticateUser();
  });
} catch (error) {
  if (error.code === 'RATE_LIMIT_EXCEEDED') {
    console.log(`Intenta en ${error.retryAfter}s`);
  }
}
```

### Estadísticas

```javascript
// Ver estadísticas de rate limiting
const stats = window.RateLimiter.getStats.login();
console.log(stats); // { requests: 3, limit: 5, window: 60000, keys: 1 }

// Reset manual
window.RateLimiter.resetAll();
```

---

## RLS Policies

Row Level Security en Supabase protege acceso a tablas administrativas.

### Tablas Protegidas

1. **admin_users**
   - Usuarios solo ven su propio perfil
   - Solo admin ve/edita todos
   - Imposible deletear directamente (solo RPC)

2. **admin_invitations**
   - Usuarios ven invitaciones designadas
   - Admin ve/crea/edita todas
   - Imposible deletear directamente

3. **admin_audit_logs**
   - Solo admin/reviewer leen
   - Append-only (sin update/delete)
   - Inmutabilidad garantizada

4. **stations**
   - Público ve solo aprobadas
   - Reviewer ve todas
   - Admin puede actualizar
   - Sin delete directo

### Aplicar RLS Policies

1. **Opción 1**: Ejecutar SQL en Supabase Editor
   ```sql
   -- Copiar y pegar contenido de: docs/supabase_rls_admin_policies.sql
   -- En Supabase → SQL Editor → New Query → Paste → Run
   ```

2. **Opción 2**: Usar Supabase CLI
   ```bash
   supabase db push --db-url postgresql://user:pass@host/db
   ```

3. **Verificar Políticas**
   ```sql
   SELECT tablename, policyname FROM pg_policies 
   WHERE schemaname = 'public' AND tablename = 'admin_users';
   ```

### Testear RLS

```javascript
// En Google Chrome DevTools Console
const cfg = window.SUPABASE_CONFIG;

// Intentar leer tabla como anónimo
const result = await fetch(
  `${cfg.url}/rest/v1/admin_users`,
  { headers: { apikey: cfg.anonKey } }
);
// Debe retornar error 403 Forbidden
```

---

## Audit Logging

Sistema de auditoría que registra todas las acciones administrativas.

### Acciones Registradas

```javascript
window.AdminAudit.AuditAction = {
  STATION_APPROVED: "station_approved",
  STATION_REJECTED: "station_rejected",
  ADMIN_CREATED: "admin_created",
  ADMIN_UPDATED: "admin_updated",
  ADMIN_DELETED: "admin_deleted",
  ADMIN_INVITED: "admin_invited",
  LOGIN_SUCCESS: "login_success",
  LOGIN_FAILED: "login_failed",
  LOGOUT: "logout",
  SESSION_EXPIRED: "session_expired",
  UNAUTHORIZED_ACCESS: "unauthorized_access",
  // ... más acciones
};
```

### Niveles de Severidad

```javascript
window.AdminAudit.SeverityLevel = {
  INFO: "info",
  WARNING: "warning",
  ERROR: "error",
  CRITICAL: "critical"
};
```

### Registrar Acciones

```javascript
// Métodos de conveniencia
window.AdminAudit.recordLoginSuccess("user@example.com");
window.AdminAudit.recordStationApproved(stationId, "FM 101.5");
window.AdminAudit.recordAdminDeleted("admin@example.com");

// O usar recordAction general
window.AdminAudit.recordAction('custom_action', {
  userId: 123,
  details: "Información personalizada"
});
```

### Logs en Base de Datos

Los logs se envían a `admin_audit_logs` en Supabase:

```sql
SELECT * FROM admin_audit_logs 
WHERE action = 'station_approved' 
ORDER BY timestamp DESC 
LIMIT 10;
```

### Configurar Batch de Envío

En `admin-audit.js`:

```javascript
const BATCH_SIZE = 10; // Enviar cada 10 logs
const BATCH_INTERVAL = 30 * 1000; // O cada 30 segundos
```

---

## Testing

Suite de tests unitarios y funcionales.

### Correr Tests Unitarios

1. Abrir Consola de Desarrollador (F12)
2. Ir a `/admin-login.html`
3. Ejecutar en consola:

```javascript
window.testAdminAuth.run().then(results => {
  console.table(results);
});
```

### Tests Disponibles

- ✓ ModuleLoad: Verificar módulos cargados
- ✓ Configuration: Supabase config válida
- ✓ RateLimiter: Funcionamiento de rate limiting
- ✓ Session: Storage y retrieval de sesión
- ✓ Audit: Módulo de auditoría
- ✓ InactivityGuard: Funciones de timeout
- ✓ SignupLimiter: Limitador por email

### Tests Funcionales

**Requiere credenciales de Supabase reales**

```javascript
const testEmail = "admin@example.com";
const testPassword = "SecurePassword123!";

window.testAdminAuth.runFunctionalTests(testEmail, testPassword).then(results => {
  console.table(results);
});
```

Realiza:
1. Login con credenciales reales
2. Verificación de autenticación
3. Obtención de sesión
4. Logout verificado

### Ver Estadísticas de Rate Limiting

```javascript
window.testAdminAuth.showRateLimitStats();
```

### Reset de Estado de Tests

```javascript
window.testAdminAuth.reset(); // Limpia todos los datos de testing
```

---

## Deployment Checklist

Antes de desplegar en producción:

### 1. Configuración de Supabase

- [ ] Aplicar RLS Policies desde `docs/supabase_rls_admin_policies.sql`
- [ ] Crear tabla `admin_audit_logs` (si no existe)
- [ ] Verificar `supabase.config.js` tiene URL y anonKey correctos
- [ ] Configurar SMTP para notificaciones de invitaciones (opcional)

### 2. Validación de Seguridad

```bash
# Verificar que los archivos están cargados
grep -l "admin-auth.js\|rate-limiter.js\|admin-audit.js" public/*.html

# Verificar headers de seguridad
curl -I https://tu-dominio.com/admin-login.html | grep -i "content-security\|x-frame\|x-content-type"
```

### 3. Testing en Producción

```javascript
// En consola de producción
window.testAdminAuth.run(); // Debe pasar todos los tests
```

### 4. Monitoreo

Configurar alertas en Supabase para:
- Múltiples login fallidos
- Rate limit exceeded
- Acciones CRITICAL en audit logs

### 5. Documentación

- [ ] Comunicar timeout de inactividad (15 min) a admins
- [ ] Documentar password requerimientos (10+ caracteres)
- [ ] Traducir mensajes de error a idiomas requeridos

---

## Tablas SQL Requeridas

### admin_audit_logs

```sql
CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id BIGSERIAL PRIMARY KEY,
  action TEXT NOT NULL,
  timestamp TIMESTAMP DEFAULT NOW(),
  user_email TEXT,
  user_role TEXT,
  details JSONB,
  severity TEXT DEFAULT 'info',
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_action ON admin_audit_logs(action);
CREATE INDEX idx_audit_logs_user_email ON admin_audit_logs(user_email);
CREATE INDEX idx_audit_logs_timestamp ON admin_audit_logs(timestamp DESC);
```

---

## Troubleshooting

### "Módulo de autenticación no disponible"
- ✓ Verificar `admin-auth.js` está cargado antes de `admin.js`
- ✓ Verificar navegador permite scripts

### "Rate limit exceeded"
- ✓ Esperar tiempo de reset mostrado en error
- ✓ En desarrollo: `window.RateLimiter.resetAll()`

### "Sesión expirada"
- ✓ Verificar JWT expiry en Supabase Auth settings
- ✓ Verificar reloj del servidor sincronizado

### "RLS Policy Error" en Supabase
- ✓ Ejecutar verificación: `SELECT * FROM pg_policies;`
- ✓ Verificar tabla tiene RLS enabled: `ALTER TABLE tablename ENABLE ROW LEVEL SECURITY;`
- ✓ Re-ejecutar SQL desde `supabase_rls_admin_policies.sql`

---

## Próximos Pasos Recomendados

1. **Two-Factor Authentication**: Agregar 2FA para admin
2. **Session Signing**: Firmar JWT con clave privada en backend
3. **Device Management**: Permitir admin ver/revocar sesiones activas
4. **Webhook Notifications**: Enviar notificaciones para acciones críticas
5. **Geographic Restrictions**: Limitar acceso por IP/país (opcional)

---

**Versión**: 9.5+  
**Última Actualización**: 2026-03-20  
**Contacto de Soporte**: security@example.com
