# Consola Engremiat -- fuente versionada

`consola-engremiat.html` es el HTML real y completo de la Consola Engremiat
(el artefacto "Mesa de Revisión",
`https://claude.ai/code/artifact/7f075613-6072-4e42-b41a-66ca41d4f089`),
capturado tras la última publicación real conocida. Es el fragmento exacto
que se pasa al republicar (sin `<!doctype>`/`<html>`/`<head>`/`<body>`
propios -- esos los añade el runtime del artefacto).

## Por qué existe esto

Hasta 2026-08-22 esta consola se generaba y editaba con un script
(`generar_mesa_revision.mjs`) que **nunca estuvo versionado** -- vivía como
copia local privada en el scratchpad de cada sesión de Claude que lo
tocaba. Cada sesión mejoraba su propia copia sin que las demás se
enteraran, así que el HTML real en producción (con features acumuladas por
distintas sesiones a lo largo del tiempo) siempre iba por delante de
cualquier copia local de un script en particular -- una sesión que
generara desde su propio script viejo podía borrar sin darse cuenta
funcionalidad real ya en producción.

**Regla a partir de ahora**: cualquier cambio a la Consola se hace sobre
`consola-engremiat.html` en este directorio (commit primero), y se publica
DESDE ese fichero -- nunca al revés (nunca editar el artefacto en vivo sin
que el cambio quede reflejado aquí también, en el mismo commit). Después
de cada publicación real, actualizar este fichero con el HTML resultante
para que quede sincronizado.

## Estructura

Documento HTML autocontenido: `<title>` + `<link>` de fuentes + `<style
id="estilosPrincipales">` + `<div class="envoltorio">` (todo el markup real)
+ `<script id="scriptPrincipal">` (toda la lógica -- render de tarjetas,
filtros, guardado, solicitudes). El array `GRUPOS` (datos de las
incidencias mostradas) vive embebido dentro del propio `<script>`, no
separado -- es una foto manual, se actualiza a mano en cada republicación
real cuando cambian los datos de `13_INCIDENCIAS`.
