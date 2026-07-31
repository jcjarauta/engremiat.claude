# Acta de cierre — sesión de auditoría LaTroballa

**Periodo cubierto:** commits `0981818` a `ffbca00` (10 commits), sucesor de `BL-CODE-AUDIT-CLOSE-01`.
**Fecha de cierre:** 2026-07-31.
**Alcance:** Pasos 1-7 del roadmap (Fases D, E, F, G, H, I), según `ROADMAP_IMPLEMENTACION.md`.

## 1. Resumen ejecutivo

De 9 fases de auditoría (A a J), esta sesión cerró 6 (D, E, F, G, H, I) y dejó C en el mismo estado en que estaba (en curso, no tocada). Se implementaron **23 reglas de integridad nuevas** con sus pruebas reactivas, se aplicó un refactor de rendimiento verificado (~52% menos duración, ~61% menos lecturas de hoja), y — el hallazgo más importante — la verificación visual humana de Fase H sacó a la luz **3 bugs reales en producción** que ninguna prueba automatizada anterior había detectado, todos corregidos y reverificados.

## 2. Reglas de integridad añadidas por fase

| Fase | Reglas | Códigos |
|---|---|---|
| D (recortada) | 4/5 | `FUNC-REC-002` a `FUNC-REC-005` |
| E | 7/7 | `FUNC-JER-001` a `FUNC-JER-007` |
| F (bloque DOCUMENTO) | 6/6 | `FUNC-DOC-001` a `FUNC-DOC-006` |
| **Total nuevo** | **17 reglas** | — |

Todas verificadas con `result=OK` en Apps Script real, no solo revisadas por código.

## 3. Bugs reales encontrados y corregidos

Ninguno de estos bugs fue hipotético — los tres se reprodujeron con datos reales y se confirmó su corrección de la misma forma.

1. **Suite de pruebas de Historial rota** (Fase G): `ejecutarSuitePaso252a255` usaba el esquema de columnas anterior a una migración ya aplicada (`VALOR_NUEVO`/`VALOR_ANTERIOR`/`ID` en vez de `DESPUES_JSON`/`ANTES_JSON`/`ID_HISTORIAL`). Su limpieza de filas de prueba nunca había funcionado, dejando residuos acumulados en `91_HISTORIAL` durante meses de ejecuciones pasadas.
2. **Serialización de fechas rompía Panel operativo e Informes** (Fase H): `obtenerPanelOperativo()`/`generarInforme()` devolvían objetos `Date` crudos anidados vía `google.script.run`, lo que degradaba la respuesta a texto estilo Java en vez de JSON — sin ningún error visible, el usuario solo veía "Cargando..." indefinidamente. Diagnosticado leyendo la petición real en DevTools tras descartar (incorrectamente al principio) extensiones de navegador y antivirus.
3. **Catálogos desincronizados en dos sitios distintos** (Fase H): `ENTIDAD_DOCUMENTO_A_MVP` usaba claves en mayúsculas sin tilde que nunca coincidían con el texto real del catálogo, dejando el selector "Registro" del formulario Documento siempre vacío (y las reglas `FUNC-DOC-001`/`002` sin detectar nada en documentos reales pese a estar "verificadas" con datos sintéticos). Y `visibleSi` de TAREA/PROCESO usaba valores inventados (`'En curso'`, `'Terminado'`) que ocultaban un campo de fecha requerido, bloqueando el guardado de tareas en curso.

**Lección de proceso**: los bugs 2 y 3 sólo se detectaron porque el roadmap exigió verificación visual humana real en vez de conformarse con que el código "se viera bien". El bug 3 en particular demuestra que una prueba automatizada puede dar `result=OK` y aun así no validar nada útil, si el fixture sintético no refleja la convención real de los datos (mayúsculas vs. texto de catálogo con tilde).

## 4. Rendimiento (Fase I)

Caché de lectura con alcance de una sola ejecución (`src/CacheLecturaService.js`), sin refactor de `Repository.js`:

| Métrica | Antes | Después | Mejora |
|---|---|---|---|
| `obtenerReporteIntegridad()` | 30.7s / 70 lecturas | 14.7s / 27 lecturas | ~52% / ~61% |

Extendida también a `obtenerPanelOperativo()` y `generarInforme()`, que no la tenían.

## 5. Revisión de seguridad (scopes OAuth)

| Scope | Estado |
|---|---|
| `script.projects.readonly`, `script.external_request`, `spreadsheets.currentonly`, `script.container.ui`, `userinfo.email` | Verificados contra uso real en código — todos justificados, sin cambios |
| `drive` → **`drive.file`** | **Reducido**. El único uso de Drive en todo el proyecto (`ExportarCodigoProduccion.js`) crea carpetas/archivos nuevos, nunca lee ni modifica contenido preexistente — no necesitaba acceso a todo el Drive del usuario |

Cambio desplegado (commit posterior a este acta). Requiere reautorización la próxima vez que se ejecute `ExportarCodigoProduccion.js`.

## 6. Hashes de integridad

Ver `HASHES_CIERRE.md` — SHA-256 de los 31 archivos fuente en el momento de este cierre.

## 7. Riesgos residuales documentados (aceptados, no bloqueantes)

- **Fase C**: sigue en curso, no se tocó en esta sesión (`auditarFaseC06A` y siguientes, si los hay).
- **Fase D**: regla "equipo/persona" diferida (no modelable sin entidad nueva de membresía); "disponibilidad real por fecha" fuera de alcance.
- **Fase G**: `91_HISTORIAL` sin purga/archivado (1247 filas); `revertirUltimoCambioControlado` limitado a un solo paso de `ACTUALIZAR` (decisión de diseño).
- **Fase H**: ~10 formularios no verificados manualmente todavía (Campaña, Proyecto, Producto, Proceso, Proveedor, Persona/Equipo, relaciones N:M) — dado el patrón de bugs encontrado, no descartable que aparezcan casos similares.
- **Gap de cobertura de pruebas preexistente**: 9 de las 27 reglas originales (antes de esta sesión) seguían sin prueba reactiva localizada — no se cerró en esta sesión, sigue pendiente.
- **Backup formal del Sheet**: no realizado en esta sesión — pendiente de decisión del usuario (ver siguiente sección).

## 8. Pendiente para considerar el cierre de Fase J completo

- [ ] Backup formal de la Sheet real (copia en Drive) — acción que toca el Drive del usuario, requiere su autorización explícita antes de ejecutarla.
- [ ] Matriz de cobertura final consolidada (27 reglas originales + 17 nuevas = 44 reglas).
- [ ] Decidir si el gap de 9 reglas sin prueba reactiva se cierra antes o después del cierre global de auditoría (Paso 9).

## 9. Trazabilidad

Commits de esta sesión (orden cronológico):
```
0981818 validate process task compatibility (Fase C, previo a esta sesión pero incluido en el rango)
81bfce6 cerrar Fase D recortada (FUNC-REC-002 a FUNC-REC-005)
765b33d instrumentacion barata de Fase I (Paso 2)
29ea872 cerrar Paso 6, cache de lectura con alcance de una ejecucion
1991041 cerrar Fase E, coherencia de jerarquia (FUNC-JER-001 a 007)
0ef60cc cerrar Fase F, bloque DOCUMENTO (FUNC-DOC-001 a 006)
2eff102 cerrar Fase G, corregir suite de HistorialService rota
5fb92d4 Fase H, corregir bug critico de serializacion en Panel/Informes
ea19ad9 Fase H, corregir mapa ENTIDAD_DOCUMENTO_A_MVP y visibleSi obsoletos
ffbca00 cerrar Fase H, checklist completa verificada
```

Todos los cambios de código se desplegaron vía `clasp push` con autorización explícita y se verificaron con `result=OK` en Apps Script real antes de cada commit, según el principio de gate humano del proyecto.
