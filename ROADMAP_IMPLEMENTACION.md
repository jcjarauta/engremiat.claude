# ROADMAP DE IMPLEMENTACIÓN — LaTroballa Audit

Basado en `BASELINE_DESARROLLO.md` (2026-07-30). Secuencia priorizada, no calendario fijo — cada paso termina con gate humano antes de avanzar al siguiente.

## Principio de secuenciación

No se construye automatización (menú, `AuditRunner`, gateway multi-IA) por delante del cierre de auditoría real. No se refactoriza `Repository.js`. No se introduce MCP hasta que el runner interno esté maduro. El orden abajo respeta eso.

## Paso 0 — Terminar lo que ya está en curso ✅ CERRADO
- Cerrado: `auditarFaseC06A_ProcesoCompletadoConTareaNoTerminada` commiteado (`0981818`), Fase C cerrada.

## Paso 1 — Fase D recortada ✅ CERRADO (4/5 reglas)
Implementadas y verificadas con `result=OK` en Apps Script real: `FUNC-REC-002` (solapamientos temporales), `FUNC-REC-003` (personas inactivas con asignación activa), `FUNC-REC-004` (capacidad semanal vs duración), `FUNC-REC-005` (carga por periodos). "Equipo/persona" diferida (no modelable sin entidad nueva de membresía). "Disponibilidad real por fecha" queda fuera (ver baseline).

## Paso 2 — Instrumentación barata de Fase I (adelantada) ✅ CERRADO
Instrumentación añadida (`src/InstrumentacionService.js`, sin refactor, solo contadores de lecturas de hoja/flush y medición de duración) enganchada en los dos caminos de lectura reales: `leerFilasEntidadComoObjetos_` (Repository.js) y `obtenerIdsDeEntidad_`/`detectarReferenciasHuerfanas` (IntegrityService.js, ruta separada que se leía directo de la hoja sin pasar por Repository).

**Datos medidos con `diagnosticarInstrumentacionReporteIntegridad()` en Apps Script real (una ejecución de `obtenerReporteIntegridad()`):**

| Bloque | Duración | Lecturas de hoja | Flushes |
|---|---|---|---|
| Estructural (duplicados/huérfanas) | 16.5s | 38 | 0 |
| Funcional (27 reglas) | 14.2s | 32 | 0 |
| **Total** | **30.7s** | **70** | **0** |

Confirma el riesgo de Fase I: 70 lecturas completas de hoja para una sola pasada, muchas redundantes (misma entidad releída sin caché entre llamadas a `obtenerIdsDeEntidad_`). Sin uso de `flush` (esperado, es solo lectura). Este dato alimenta directamente el Paso 6.

## Paso 3 — Fase E: Jerarquía principal ✅ CERRADO
7 reglas de coherencia cruzada campaña→proyecto→producto→proceso, implementadas en 4 funciones (`IntegrityService.js`) y verificadas con `result=OK` en Apps Script real. Catálogos de ESTADO confirmados contra la hoja `90_CONFIGURACION` (no asumidos):

| Código | Regla |
|---|---|
| `FUNC-JER-001` | Proyecto con `FECHA_INICIO_PLAN` anterior a la de su campaña |
| `FUNC-JER-002` | Proyecto con `FECHA_FIN_PLAN` posterior a la de su campaña |
| `FUNC-JER-003` | Campaña cerrada (Completada/Cancelada) con proyecto activo no cerrado |
| `FUNC-JER-004` | Proyecto cerrado con producto vinculado (vía PROYECTO_PRODUCTO) no cerrado |
| `FUNC-JER-005` | Producto cerrado con proceso activo no cerrado |
| `FUNC-JER-006` | Proceso con `FECHA_FIN_PLAN` posterior a la `FECHA_REQUERIDA` de su producto |
| `FUNC-JER-007` | Relación proyecto-producto con `FECHA_REQUERIDA` anterior al inicio planificado del proyecto |

## Paso 4 — Fase F: Documentos ✅ CERRADO
6 reglas sobre el bloque DOCUMENTO, implementadas en `IntegrityService.js` y verificadas con `result=OK` en Apps Script real (con filas temporales, ya que `14_DOCUMENTOS` no tenía registros en producción):

| Código | Regla | Gravedad |
|---|---|---|
| `FUNC-DOC-001` | `ENTIDAD_ID` huérfano (referencia polimórfica sin registro destino) | ERROR |
| `FUNC-DOC-002` | `ENTIDAD_ID` referencia un registro padre inactivo | ADVERTENCIA |
| `FUNC-DOC-003` | Más de un documento `Vigente` simultáneo para la misma combinación | ERROR |
| `FUNC-DOC-004` | Duplicado exacto (mismo tipo+entidad+versión) | ERROR |
| `FUNC-DOC-005` | `VERSION` con formato inválido | ADVERTENCIA |
| `FUNC-DOC-006` | `URL` sin `http://`/`https://` | ADVERTENCIA |

**Hallazgo colateral**: el mapa `ENTIDAD_DOCUMENTO_A_MVP` (`Formularios.js`) está desincronizado del catálogo real `ENTIDAD_DOCUMENTO` de la hoja — le faltan `DECISION`/`INCIDENCIA` y le sobran `MATERIAL`/`PERSONA_EQUIPO`/`PROVEEDOR`. Es un bug de la UI (selector de registro dependiente), no de datos, así que no se implementó como regla de auditoría — se dejó como tarea aparte para corregir el código del formulario.

## Paso 5 — Fase G: Revisión consolidada de Historial/Reversión ✅ CERRADO
La revisión encontró que la verificación previa se apoyaba en una prueba rota: `ejecutarSuitePaso252a255` (`Tests_Repository.js`) usaba nombres de columna del esquema viejo de historial (`VALOR_NUEVO`/`VALOR_ANTERIOR`/`ID`) en vez del esquema vigente de 15 columnas (`DESPUES_JSON`/`ANTES_JSON`/`ID_HISTORIAL`). Además, su limpieza de filas de historial de prueba nunca funcionó (`eliminarRegistroPruebaPorId_` busca una columna `ID` que `91_HISTORIAL` no tiene), dejando residuos acumulados de ejecuciones anteriores.

**Corregido y verificado, no solo documentado:**
- Nombres de columna actualizados en las 4 pruebas.
- Nueva función `eliminarFilaHistorialPorId_` (busca por `ID_HISTORIAL`) para limpiar de verdad las filas de prueba en `91_HISTORIAL`.
- Aserciones de conteo exacto (`historial.length !== 1`) sustituidas por búsqueda del hallazgo esperado, robustas a que el ID de CAMPANA se reutilice tras borrar filas de prueba anteriores (causa real del primer fallo: 7 filas de historial heredadas de un ID reutilizado).
- `ejecutarSuitePaso252a255` (HistorialService: crear/actualizar/desactivar-reactivar/filtrado) y `pruebaPaso308`/`pruebaPaso309` (Reversion: revierte actualización, rechaza doble reversión, rechaza revertir una creación, rechaza entidad inválida) — todas `result=OK` en Apps Script real.

**Riesgos residuales documentados (no bloqueantes, por diseño):**
- `91_HISTORIAL` no tiene purga ni archivado (1247 filas actuales) — lecturas `getDataRange()` completas en cada consulta, sin la caché aplicada en Paso 6. Aceptable mientras el volumen no lo haga inviable; revisar si Fase H expone lentitud.
- `revertirUltimoCambioControlado` solo revierte el último `ACTUALIZAR`, nunca `CREAR`/`DESACTIVAR`/`REACTIVAR` ni cadenas de reversión — decisión de diseño explícita en el propio código, no un defecto.
**Estimación: 1 sesión corta.**

## Paso 6 — Fase I completa: Rendimiento ✅ CERRADO (adelantado antes del Paso 3)
Alcance decidido y aplicado: **caché de lectura con alcance de una sola ejecución** (`src/CacheLecturaService.js`), sin tocar `Repository.js` en su arquitectura ni ninguna lógica de negocio. Engancha `leerFilasEntidadComoObjetos_` y `obtenerIdsDeEntidad_`/`detectarReferenciasHuerfanas`; el contexto se abre y cierra dentro de `obtenerReporteIntegridad()` (try/finally), así que no afecta el patrón mutar→flush→comprobar→restaurar de las pruebas reactivas (cada llamada arranca con caché limpio).

**Resultado verificado en Apps Script real:**

| Métrica | Antes | Después | Mejora |
|---|---|---|---|
| Duración total | 30.7s | 14.7s | ~52% |
| Lecturas de hoja | 70 | 27 | ~61% |
| Flushes | 0 | 0 | — |

**Regresión verificada sin fallos**: `ejecutarSuiteIntegridadCoberturaDirectaPendiente` (10 reglas), las 4 pruebas nuevas de Fase D (`FUNC-REC-002` a `FUNC-REC-005`) y `probarIntegridadProveedorCodigoDuplicado` (ruta de duplicados) — todas `result=OK` tras el cambio.

## Paso 7 — Fase H: UI, panel e informes ✅ CERRADO (3 bugs críticos encontrados y corregidos)
Revisión de código previa a la verificación visual detectó y corrigió, con verificación humana real en Apps Script:

- **`IntegridadReporte.html` sin `withFailureHandler`** — corregido, ahora muestra error en vez de colgarse.
- **Bug crítico**: `obtenerPanelOperativo()` y `generarInforme()` devolvían objetos `Date` crudos anidados dentro de estructuras complejas vía `google.script.run`. Esto rompía la serialización de Apps Script silenciosamente (sin lanzar error visible), degradando la respuesta a texto tipo Java (`Wed Dec 31 15:00:00 PST 2025`, `[Ljava.lang.Object;@...]`) en vez de JSON — el cliente recibía una respuesta inutilizable y se quedaba colgado en "Cargando...". Diagnosticado leyendo directamente la pestaña Network → Response de la petición real (los mensajes de consola de una extensión de terceros fueron una pista falsa que llevó a descartar antivirus/extensiones antes de encontrar la causa real). Corregido con `src/SerializacionService.js` (serialización recursiva de fechas a ISO), aplicado en ambos puntos de entrada.
- **`aplanarInformeParaExportar_`** (exportar CSV/PDF) solo aplanaba un nivel de anidación, dejando `[object Object]` y JSON crudo en las exportaciones. Reescrita para aplanar recursivamente cualquier profundidad.
- `obtenerPanelOperativo()` y `generarInforme()` también conectados a la caché de lectura de Paso 6 (no la tenían).

- **Bug crítico #2**: el formulario "Nuevo documento" tenía el desplegable dependiente "Registro" siempre vacío al elegir cualquier tipo de entidad. Causa: `ENTIDAD_DOCUMENTO_A_MVP` (Formularios.js) usaba claves internas en mayúsculas sin tilde (`TAREA`, `DECISION`) mientras que `DOCUMENTO.ENTIDAD_TIPO` guarda el texto real del catálogo (`"Tarea"`, `"Decisión"`, con tilde) — nunca coincidían. Además, aunque hubiera coincidido, el código pasaba el valor sin traducir a `listarRegistros(...)`, que exige el nombre interno de entidad exacto. Corregido el mapa (claves = texto real del catálogo, valores = nombre interno de entidad) y el resolver. Las reglas `FUNC-DOC-001`/`FUNC-DOC-002` (Fase F) tenían el mismo problema de mayúsculas — nunca habían detectado nada en documentos reales creados vía formulario — corregidas para reutilizar el mismo mapa como única fuente de verdad, junto con las pruebas reactivas correspondientes.

**Verificado visualmente por el usuario en Apps Script real**: Panel operativo, Informes (campaña, proyecto y memoria de producción), exportación CSV y PDF, creación de Tarea con campos condicionales (Fase H bug #3, ver más abajo), creación de Documento con FK dependiente — todos funcionan correctamente tras los arreglos. Las 6 reglas de Fase F re-verificadas `result=OK` tras el cambio.

- **Bug crítico #3** (mismo patrón que el #2, encontrado durante la prueba de formularios): en `ESQUEMAS_FORMULARIO_MVP`, los campos condicionales (`visibleSi`) de TAREA y PROCESO usaban valores de catálogo inventados/desactualizados (`'En curso'` en vez de `'En proceso'`; `'Terminado'` en vez de `'Completado'` para PROCESO) — el campo "Fecha inicio real" nunca aparecía en el formulario al poner una tarea/proceso "En proceso", bloqueando el guardado (el motor de inserción exige esa fecha en ese estado). Confirmado contra el catálogo real de `90_CONFIGURACION` y corregidas las 4 ocurrencias. Verificado end-to-end: tarea creada con éxito con el campo visible y guardado correcto.

**Checklist completa, verificada por el usuario en Apps Script real**: Panel operativo, los 3 tipos de Informe (campaña/proyecto/memoria) con exportación CSV y PDF, y los 5 formularios principales — Tarea (campos condicionales), Documento (FK dependiente), Decisión, Incidencia y Material (estos tres últimos sin bugs adicionales encontrados).

**Riesgo residual documentado (no bloqueante)**: solo se verificaron manualmente 5 de los ~15 formularios existentes (Campaña, Proyecto, Producto, Proceso, Proveedor, Persona/Equipo y las relaciones N:M no se probaron). Dado el patrón de bugs encontrado (valores de catálogo hardcodeados desincronizados de `90_CONFIGURACION`), no es descartable que aparezcan casos similares ahí — queda para una revisión puntual futura si se detectan síntomas parecidos (campos condicionales que no aparecen, desplegables dependientes vacíos).
**Estimación: 2-4 sesiones.**

## Paso 8 — Fase J: Cierre de seguridad y baseline final ✅ CERRADO
- ✅ **Revisión de scopes OAuth**: 5/6 justificados sin cambios; `drive` (acceso total) reducido a `drive.file` (el único uso real es crear carpetas/archivos nuevos en `ExportarCodigoProduccion.js`, nunca lee/modifica contenido preexistente). Desplegado.
- ✅ **Hashes**: `HASHES_CIERRE.md`, SHA-256 de los 31 archivos fuente.
- ✅ **Acta de cierre**: `ACTA_CIERRE_SESION.md`, resumen completo de la sesión (Pasos 1-7), bugs encontrados, riesgos residuales, trazabilidad de commits.
- ✅ **Matriz de cobertura**: snapshot generado (62 reglas totales, 17 nuevas con 100% cobertura verificada). Metodología por grep literal, no fiable para las 45 preexistentes — reconciliación manual real queda pendiente para antes del Paso 9.
- ✅ **Archivos temporales**: revisados, nada temporal identificado — los 3 servicios nuevos son código de producción permanente, los `.md` de gobierno quedan como registro de auditoría.
- ✅ **Backup formal del Sheet**: hecho por el usuario (copia manual en Drive). Spreadsheet `1IfjoIJPBQvnPoFDwmdHPsYbhQkuyZ15HO8ra62UGRwg`, verificado con las 19 hojas completas. Script ID de la copia (`1Si1EHFak...`) documentado como distinto del de producción — no usar para `clasp push`.
**Estimación: 1 sesión.**

## Paso 9 — Cierre de auditoría global
Informe final + nueva baseline (sucesora de `BL-CODE-AUDIT-CLOSE-01`).

---

## En paralelo, cuando convenga: automatización (Opción A)
No bloquea nada de lo anterior ni depende de terminarlo todo. Puede insertarse en cuanto haya 2-3 gates estables que valga la pena repetir sin trabajo manual — candidato natural: después del Paso 1 o Paso 3.

- Menú `Auditoría` con 3 opciones: ejecutar gate actual, ejecutar `IntegrityService`, ver último resultado.
- Reutiliza `IntegridadReporte.html` para mostrar resultados (no `Ui.alert()`).
- `LockService` + `try/finally` + registro en hoja `99_AUDITORIA`.
- **Sin** "regresión completa" todavía (depende del Paso 6).
- **Estimación: 8-15 horas.**

## Explícitamente diferido (no iniciar sin revisar esta decisión)
- `AuditRegistry.gs` / `AuditRunner.gs` completo (registro declarativo + reanudación entre ejecuciones) — solo si el menú mínimo demuestra que hace falta más.
- `ToolRegistry.gs`, `ToolDispatcher.gs`, roles de IA, `AI_EXECUTION`, MCP como capa de orquestación — fase posterior a un runner interno maduro.
- Refactor de `Repository.js` en módulos — al final, nunca como preparación previa.
- Funcionalidades nuevas con feature flag: `TIPO_MATERIAL`, `PERSONA_EQUIPO_AUSENCIA` (disponibilidad por fecha), `PLANIFICACION_DIARIA`, `ASISTENCIA_DIARIA`.

## Riesgos abiertos a vigilar en todo el roadmap
- Recurrencia de la divergencia clasp↔git (ya ocurrió una vez, se resolvió) — verificar `git status`/`clasp pull` antes de cada sesión de cierre de fase.
- 9 de 27 reglas inventariadas sin prueba reactiva localizada — cerrar en paralelo, no esperar a que bloquee una fase.
- Apps Script sin pruebas locales completas — todo cierre de gate requiere ejecución real y, en Fase H, verificación visual humana.
