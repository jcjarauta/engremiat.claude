# Sincronización Consola ↔ Sheet

**Por qué existe esto:** la Consola (`consola-engremiat.html`, publicada como
Artifact en claude.ai) no puede hablar en vivo con `13_INCIDENCIAS` -- el
Artifact corre en un sandbox sin acceso a red arbitraria, y el único
conector de Sheets con lectura/escritura por celda (`gsheets`, usado en
las sesiones de Claude Code) es un servidor **local** de esta máquina,
sin URL pública -- no es alcanzable desde el navegador. Verificado en vivo
el 2026-08-23: al declarar `gsheets` como conector del Artifact, claude.ai
respondió "No matching connector found". Los únicos conectores reales de
la cuenta son Gmail, Google Drive y GitHub, y Drive no tiene API de
celdas (solo archivo completo).

Consecuencia: la sincronización real es **semi-automática, en dos
direcciones, ejecutada por Claude en cada sesión de trabajo con la
Consola** -- no en vivo, pero sí sistemática (nunca "cuando alguien se
dé cuenta", como pasó con INC-0052 a INC-0055).

## Ritual completo (ejecutar en este orden)

### 1. Al ABRIR una sesión de trabajo con la Consola

1. `WebFetch` sobre la URL del Artifact publicado -> guardar el HTML
   completo en un fichero temporal.
2. `node extraer_decisiones.mjs <html-temporal>` -- lista las tarjetas
   con una decisión real (aprobada/editada) o adjuntos desde la última
   sincronización. Si hay alguna, trasladarla a mano a `OBSERVACIONES`
   de la fila correspondiente en `13_INCIDENCIAS` (y a `ESTADO` si la
   decisión lo deja inequívoco -- nunca automático, requiere criterio).
3. Sustituir el bloque `<div id="grupos">...</div>` de
   `consola-engremiat.html` (el fichero del repo) por el del HTML
   descargado en el paso 1 -- así el estado previo que usará
   `regenerar_estatico.mjs` en el paso 6 es el real, no una foto vieja
   del repo.
4. Volcar `13_INCIDENCIAS!A2:Z<última fila>` fresco con
   `mcp__gsheets__sheets_get_values` -> guardar como JSON crudo.
5. `node chequear_consistencia.mjs <volcado.json>` -- si devuelve
   desajuste, editar `var GRUPOS` a mano: quitar los IDs cerrados,
   añadir los que faltan (decidir grupo/prioridad/sugerencia con
   criterio, como se hizo con INC-0052 a INC-0055).
6. `node regenerar_estatico.mjs` -- reconstruye el HTML estático
   conservando las decisiones ya tomadas (paso 3) y añadiendo las
   tarjetas nuevas en su estado por defecto.
7. `git add` + commit + push.
8. Publicar con la herramienta `Artifact` sobre la MISMA url del
   Artifact existente (nunca crear uno nuevo).

### 2. Al CERRAR la sesión (si se volvió a interactuar con la Consola
   durante la sesión, más allá del paso 1)

Repetir los pasos 1-2 del ritual de apertura (fetch + extraer
decisiones) antes de dar la sesión por cerrada, para no dejar
decisiones nuevas sin trasladar al Sheet hasta la próxima vez que
alguien abra la Consola.

## Herramientas de este directorio

- `chequear_consistencia.mjs` -- compara `GRUPOS` del repo contra un
  volcado fresco del Sheet, en las dos direcciones (sobrantes y
  faltantes). Sustituye a `chequear_consistencia_consola.mjs`, que vivía
  sin versionar en scratchpad y apuntaba a un generador que ya no existe.
- `regenerar_estatico.mjs` -- reconstruye `<div id="grupos">` usando las
  funciones de render reales del propio fichero, preservando el estado
  (revisado/notas/adjuntos) ya publicado.
- `extraer_decisiones.mjs` -- solo lectura, lista qué tarjetas tienen
  una decisión real lista para trasladar al Sheet.

## Lo que NO hacen estas herramientas (a propósito)

Ninguna escribe en el Sheet automáticamente. Traducir una nota libre de
una tarjeta a un cambio de `ESTADO` requiere criterio -- automatizarlo
sin supervisión es el tipo de atajo que ya causó un bug de datos real
(ver `reference_columnas_13_incidencias_indices` en memoria). El
supervisor de este paso es quien ejecuta el ritual (hoy, Claude en cada
sesión; ver conversación 2026-08-23 sobre programar esto como tarea
recurrente).
