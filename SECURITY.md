# Política de Seguridad

## Versiones Soportadas

Actualmente mantenemos soporte de seguridad activo para las siguientes versiones de Radio Satelital:

| Versión | Estado             | Notas |
| ------- | ------------------ | ----- |
| 9.5.x   | :white_check_mark: | Versión Actual (PWA + TWA) |
| 8.5.x   | :white_check_mark: | Versión Estable Anterior |
| < 8.0   | :x:                | Obsoleta (Sin soporte) |

## Reportar una Vulnerabilidad

Si descubre una vulnerabilidad de seguridad en este proyecto (ej. problemas en la transmisión de datos o inyección de scripts), le pedimos que **NO abra un Issue público**.

### Proceso de Reporte
Por favor, reporte el problema directamente al desarrollador principal (**Latán Villegas**) a través de:
1.  Mensaje privado en las redes sociales integradas en la aplicación (Menú Lateral).
2.  O mediante un mensaje privado en GitHub si tiene permisos.

Nos comprometemos a revisar los reportes legítimos en menos de 48 horas y lanzar un parche de seguridad si es necesario.

## Baseline de Seguridad (v9.5+)

- CSP activa en WebView Android nativo y páginas públicas/admin.
- Referrer-Policy y Permissions-Policy aplicadas en HTML críticos.
- Mitigación XSS en renderizado dinámico de emisoras (escape HTML).
- Endurecimiento de enlaces externos con `noopener noreferrer`.
- Validación de URL en backend de aplicación (solo `http/https` y host público).
- Login admin con sesión real de Supabase Auth (sin credenciales demo por defecto).

## Requisitos Operativos

- No usar claves por defecto en admin.
- Activar políticas RLS estrictas en tablas de administración (`admin_users`, `admin_invitations`, `approval_history`, `global_stations`).
- Rotar `anonKey` si hubo exposición accidental y revisar auditoría de accesos.
