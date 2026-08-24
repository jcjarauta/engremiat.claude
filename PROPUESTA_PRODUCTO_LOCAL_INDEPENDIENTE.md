# Propuesta — Producto local independiente de Google/red

**Fecha de apertura:** 2026-08-23
**Estado:** A valorar -- sin urgencia, propuesta a futuro
**Incidencia Sheet:** INC-0058 (`13_INCIDENCIAS`, A valorar)
**Google Doc vinculado:** https://docs.google.com/document/d/1rND5JNzPU0CSW7p9LT_nwglK0wumO6w8DOtjHVEIZxM/edit
**Carpeta Drive:** https://drive.google.com/drive/folders/10W0Xb4yQsQdLbl_RbXNz8Aj0rvb3XZ_9

## Disparador

Corte de red real el 2026-08-23: el trabajo del cliente en el Sheet no se
pudo hacer mientras duró. El operador propuso valorar ofrecer el producto
como aplicación local, con la IA externa pausada en esos momentos y el
worker local como apoyo -- de cara a un cliente completamente independiente
de la red o de los servicios de Google, como valor añadido de producto.

## Distinción importante

No es "añadir IA local de apoyo" -- eso ya estaba diseñado en INC-0056. Es
sacar el producto **entero** de depender de Google Sheets/Apps Script e
internet. Son dos problemas de tamaño muy distinto aunque ambos empiecen
por "independencia de red".

## Qué haría falta de verdad

1. **Almacén de datos local** que sustituya o espeje al Sheet.
2. **Motor de sincronización bidireccional** con Google Sheets, con
   resolución de conflictos real (no solo lectura, como el caso ya resuelto
   de la Consola -- aquí hay ediciones reales en las dos direcciones).
3. **Interfaz propia** -- hoy la interfaz de Engremiat es en gran parte el
   propio Sheet + los menús de Apps Script.
4. **Lógica de negocio de Apps Script portada a local** -- lo más caro,
   equivale a mantener una segunda versión del producto en paralelo.

## Propuesta de fases (sin decidir)

- **Fase 1 (pequeña, resuelve el dolor real de hoy)**: cola local de
  cambios pendientes durante un corte, sincronizada sola al volver la
  conexión. No sustituye nada, solo evita perder el trabajo del rato sin
  conexión. Coste bajo -- reutiliza el worker local y el patrón de
  sincronización ya construido hoy (`tools/consola/SINCRONIZACION.md`).
- **Fase 2 (media)**: interfaz local propia para poder seguir trabajando
  durante el corte, no solo guardar cola.
- **Fase 3 (grande, la versión completa de la propuesta)**: el producto
  entero corriendo en local, con Google como opción, no como base.

## Recomendación inicial

No comprometerse con la Fase 3 sin demanda real de un cliente. La Fase 1
sí merece la pena trabajarla pronto -- coste bajo, piezas ya construidas.

## Pendiente de concretar

- Rellenar el Business Model Canvas completo (productizable, según el
  criterio fijado en INC-0057) -- no hecho todavía.
- Decidir si se empieza por la Fase 1 como mejora rápida o se deja
  aparcado hasta tener demanda real de un cliente.

## Bitácora

- **2026-08-23**: apertura del documento tras un corte de red real durante
  la sesión. Archivado como INC-0058.
