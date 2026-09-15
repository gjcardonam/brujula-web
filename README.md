# Brújula · Web

Interfaz de Brújula, la plataforma de preparación para la prueba Saber 11 en matemáticas.
React 18 con Vite, TypeScript, Tailwind CSS 4 y shadcn/ui.

Proyecto Integrador I · Universidad de Antioquia · 2026-2.

La API, la base de datos y el despliegue completo están en
[brujula-api](https://github.com/gjcardonam/brujula-api).

## Arrancar

El sistema completo se levanta desde el otro repositorio con `docker compose up --build`.
Para trabajar solo en el front, con la API ya corriendo:

```bash
npm install
npm run dev
```

Vite queda en http://localhost:5173 y reenvía `/api` al backend. Si la API escucha en otro
lado, se le indica al arrancar: `API_TARGET=http://localhost:8081 npm run dev`.

```bash
npm run build
```

El build corre `tsc --noEmit` antes de empaquetar, así que un error de tipos rompe la
compilación.

## Las pantallas

`main` cubre el Sprint 1. Cada archivo de `src/pages` es una pantalla de los mockups
aprobados en el Sprint 0.

| Ruta | Pantalla | Mockup |
| :-- | :-- | :-- |
| `/login` | Inicio de sesión | M-01 |
| `/registro` | Registro tras continuar con Google | M-02 |
| `/recuperar` | Solicitar el enlace de recuperación | M-03 |
| `/restablecer` | Elegir la contraseña nueva | M-03 |
| `/perfil` | Datos personales y cambio de contraseña | M-04 |
| `/banco` | Banco del estudiante, con filtro y paginación | M-05 |
| `/ejercicios/:id` | Resolver, con nivel de confianza y retroalimentación | M-06 |
| `/admin/banco` | Banco del administrador, con el estado de cada ejercicio | M-12 |
| `/admin/ejercicios/nuevo` | Crear ejercicio | M-13 |

Las pantallas de simulacros, estadísticas, historial y edición del banco pertenecen a los
sprints siguientes y viven en la rama
[`sprint-2`](https://github.com/gjcardonam/brujula-web/tree/sprint-2).

## Cómo está organizado

```
src/
├── api/          cliente HTTP con la sesión, y los tipos que devuelve la API
├── auth/         contexto de sesión y su almacenamiento
├── components/   lo que se repite entre pantallas
│   └── ui/       los primitivos de shadcn/ui
├── pages/        una página por pantalla
├── utils/        fechas, foco e identificadores
├── App.tsx       rutas y control de acceso por rol
└── index.css     los tokens del sistema de diseño
```

El cliente de `src/api` pone el token en cada petición, renueva la sesión antes de que
expire y reacciona cuando el backend responde que ya no es válida.

## El sistema de diseño

La dirección se llama **Ruta** y está descrita en la skill `ui-brujula`, con dos artboards
aprobados como fuente de verdad del aspecto. La sensación es la de una app de estudio:
fondo hueso cálido, paneles muy redondeados, botones con borde inferior sólido que baja al
presionarse, un color por componente (violeta para álgebra y cálculo, teal para geometría,
ocre para estadística) y la corrección como el momento importante de la pantalla.

El banco del estudiante es una ruta: un panel marino con el ejercicio por el que empezar y
una fila por componente con sus nodos. Los nodos son el índice de ejercicios, no una barra
de progreso: mientras no exista el historial no se dibuja ningún avance.

Los colores, la tipografía y los radios se declaran una sola vez como tokens en
`index.css`; ningún componente escribe un color a mano. Outfit para titulares y números y
Nunito Sans para el texto, las dos autoalojadas con `@fontsource-variable`, sin pedirle
nada a un servidor externo.

Tres reglas que se respetan en toda pantalla:

- **Nada de texto de rúbrica.** La interfaz no explica sus propias reglas ni muestra
  códigos de historias de usuario. Si la cuenta se bloquea, se dice en ese momento y con el
  tiempo que falta, no como advertencia preventiva.
- **Cuatro estados en todo lo que carga datos**: esqueleto, vacío con una acción que lo
  resuelve, error con reintento, y contenido.
- **Accesible**: contraste AA, foco siempre visible, navegación por teclado con flechas en
  las opciones y en el nivel de confianza, etiquetas reales y errores anunciados.

Funciona desde 360 px de ancho.
