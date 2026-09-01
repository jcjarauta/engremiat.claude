# Workflows n8n versionados (instancia "generador", puerto 5680)

Export de los 2 workflows reales del laboratorio Engremiat/Vigilia, para tener el
comportamiento real bajo control de versiones -- hasta ahora solo vivían dentro de n8n,
sin historial ni diff.

- `cronista-segmentar-generador.json` -- el workflow real de Vigilia (Cronista, Concilio,
  verificadores, lock de concurrencia).
- `telar-interactivo.json` -- workflow del Telar.

## `__BASEROW_TOKEN__`

Varios nodos Code de estos workflows hacen llamadas a Baserow con el token escrito
directamente en el código, en vez de usar la credencial nativa de n8n. Esto **no es el
patrón deseado** -- se intentó corregir con `this.getCredentials()` y con
`this.helpers.httpRequestWithAuthentication()`, pero esta versión del Code node de n8n
(sandbox de task-runner) no soporta ninguna de las dos formas de acceso a credenciales.
La única vía que funciona hoy es el token en claro dentro del código.

Por eso, en el archivo exportado (este repo, versionado, público) todo valor de token
real aparece sustituido por el marcador `__BASEROW_TOKEN__`. El valor real solo vive
dentro de la instancia n8n en ejecución -- nunca en git.

**Al restaurar este export en una instancia n8n nueva**: sustituir `__BASEROW_TOKEN__`
por `Token <valor real>` en los nodos afectados antes de activar el workflow.

**Pendiente real**: resolver el acceso a credenciales desde Code node como es debido
(convertir estas llamadas a nodos HTTP Request con la credencial `httpHeaderAuth` ya
existente, en vez de Code node con fetch manual) para eliminar el hardcode por completo,
no solo redactarlo al exportar.

## Cómo re-exportar tras un cambio

`tools/n8n-workflows/exportar.mjs` (adaptar rutas locales si hace falta) lee el
workflow vía la API de n8n, redacta cualquier valor de token real conocido, y sobreescribe
el JSON de este directorio. Ejecutar y volver a verificar con un `grep` del token real
antes de comitear -- nunca asumir que la redacción fue completa sin comprobarlo.
