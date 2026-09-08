# Brújula · front

Interfaz web de Brújula, plataforma gratuita de preparación para Saber 11 en matemáticas (Proyecto Integrador I · UdeA · 2026-2).
React 18 + TypeScript + Vite. Implementa las 14 pantallas (M-01 a M-14) de los mockups del Sprint 0 y consume la API de
[`brujula-api`](https://github.com/gjcardonam/brujula-api), donde está la guía completa de arranque y el `docker-compose.yml`.

## Desarrollo

```bash
npm install
npm run dev                                  # http://localhost:5173, proxy /api → http://localhost:8080
API_TARGET=http://localhost:8081 npm run dev # si la API corre en otro puerto
npm run build                                # verifica tipos y genera dist/
```

Variables opcionales: `VITE_GOOGLE_CLIENT_ID` (botón real de Google; sin ella, y con la API en modo desarrollo, el botón es simulado)
y `VITE_API_URL` (por defecto `/api`).

## Estructura

| Carpeta | Contenido |
| :-- | :-- |
| `src/api/` | cliente HTTP (token, renovación de sesión, manejo de 401) y tipos de la API |
| `src/auth/` | sesión en `localStorage` y contexto de autenticación |
| `src/components/` | layout con navegación por rol, componentes de UI, bloque de resolver ejercicio, botón de Google |
| `src/pages/` | una página por pantalla: acceso (M-01 a M-03), perfil (M-04), banco (M-05/M-12), ejercicio (M-06), historial (M-07), simulacros (M-08 a M-10), estadísticas (M-11) y `admin/` (M-13, M-14) |
| `src/styles.css` | estilos tomados de `mockups.html` del Sprint 0 |

La imagen Docker (`Dockerfile` + `nginx.conf`) sirve `dist/` y reenvía `/api/` al contenedor `api`.
