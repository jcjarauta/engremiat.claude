# Roadmap — Auditoría por bloques y UX/UI (Fase M)

Continúa la numeración de fases del roadmap general (después de Fase L y de la auditoría piloto end-to-end documentada en `PRUEBA_PILOTO_END_TO_END.md`). Se apoya en la matriz de trabajo definida en `AUDITORIA_POR_BLOQUES.md` — este documento la convierte en una secuencia concreta de sesiones, con foco explícito en **comportamiento del sistema y UX/UI**, no solo en corrección técnica.

## Por qué esta fase

La auditoría piloto y el trabajo de Gantt/Desviación se concentraron en **Producción** y en los **outputs**. Personas, Espacios/Recursos y Proveedores/Materiales solo han recibido atención indirecta, como datos de apoyo. Esta fase cierra ese hueco, bloque a bloque, y de paso revisa la usabilidad de todo lo ya construido con ojo crítico ahora que hay más recorrido de uso real acumulado.

## Principio de secuenciación

Mismo criterio que el resto del roadmap: **verificar contra datos/UI reales → construir lo que se decida → prueba reactiva → `clasp push` con autorización explícita → verificación humana en Apps Script real → commit → actualizar este documento y `ROADMAP_BACKLOG_MEJORAS.md`**. Ningún bloque se abre sin cerrar el anterior (orden bottom-up: un hueco en Personas contamina la auditoría de todo lo que depende de Personas).

Los hallazgos de construcción inmediata se implementan igual que en la auditoría piloto (fix en caliente si es un `ERROR`/`BLOQUEO` que bloquea seguir probando); el resto se registra y se decide alcance con el usuario antes de construir, igual que se ha hecho hasta ahora.

## Las 6 dimensiones (recordatorio de `AUDITORIA_POR_BLOQUES.md`)

Input · Modelo de datos · Relaciones · Output · Trazabilidad · Rendimiento/escala.

## Preguntas de UX/UI a aplicar en cada bloque

Esta fase añade una capa explícita de usabilidad sobre las 6 dimensiones, con estas preguntas guía en cada formulario/pantalla revisada:

- ¿Se encuentra la opción en el menú sin tener que buscarla (ubicación lógica, nombre claro)?
- ¿Los campos del formulario siguen un orden que corresponde a cómo se piensa la tarea, no al orden en que se añadieron históricamente?
- ¿Los mensajes de error/validación dicen qué está mal y cómo corregirlo, no solo que algo falló?
- ¿La terminología es consistente entre formulario, menú e informes (mismo nombre para lo mismo en todas partes)?
- ¿La densidad de información es adecuada — ni pantallas vacías que no orientan, ni tablas saturadas sin jerarquía visual?
- ¿Las acciones con efecto real (guardar, cerrar sin guardar, desactivar) tienen la confirmación/feedback adecuado a su reversibilidad?

## Fases

### M1 — Personas (`PERSONA_EQUIPO`, `EQUIPO_MIEMBRO`)
**Por qué primero**: es la dependencia más transversal (referenciada por prácticamente todas las demás entidades vía `RESPONSABLE_ID`/`VALIDADOR_ID`); un hueco aquí se propaga a todo lo demás.

**Alcance**: alta/edición de persona y equipo, asignación de coordinador, disponibilidad/capacidad, cómo se ve una persona reflejada en el resto del sistema (buscadores de responsable, panel, informes).

**Método**: recorrido real en la UI (alta, edición, baja lógica) + las 6 dimensiones + preguntas de UX/UI. Usar los datos de prueba ya sembrados (`PER-0004` a `PER-0008`) como base y ampliar si hace falta un caso no cubierto (p. ej. un Equipo con miembros).

**Entregable**: lista de hallazgos clasificados (plantilla de `AUDITORIA_POR_BLOQUES.md`), decisión de qué se construye ya y qué se difiere.

**Estimación**: 1 sesión.

### M2 — Espacios/Recursos (`RECURSO`, `TAREA_RECURSO`)
**Alcance**: alta/edición de espacio/herramienta/maquinaria/equipo auxiliar, jerarquía de ubicación (recurso dentro de espacio), uso de recursos en tareas, estados físicos (disponible/en uso/en mantenimiento/averiado).

**Método**: igual que M1. Contrastar con los recursos ya sembrados (`ESP-01/02/03`, `MAQ-01`).

**Entregable/Estimación**: igual que M1.

### M3 — Proveedores/Materiales (`PROVEEDOR`, `MATERIAL`, `PEDIDO_PROVEEDOR`, `RECEPCION`, `PRODUCTO_MATERIAL`, `TAREA_MATERIAL`)
**Por qué aquí**: es la conexión menos probada hasta ahora — el ciclo completo proveedor → pedido → recepción → consumo en producción no se ha recorrido de punta a punta con datos reales.

**Alcance**: alta de proveedor/material, ciclo de pedido-recepción, asociación de materiales a producto/tarea (previsto vs. consumido vs. desperdiciado), estados de stock.

**Método**: recorrido real incluyendo el ciclo completo pedido→recepción (no solo altas sueltas). Si faltan datos para probar el cruce con Producción, ampliar los datos de prueba ya sembrados.

**Entregable/Estimación**: igual que M1, previsiblemente algo más larga por el número de entidades relacionadas (proveedor, material, pedido, línea de pedido, recepción, línea de recepción).

### M4 — Producción (pasada final)
**Por qué al final y no antes**: ya es el bloque más maduro (auditoría piloto + esta sesión), pero conviene una pasada de cierre una vez saneados M1-M3, para verificar que las mejoras de esos bloques (p. ej. si se cambia algo en Personas) no dejan nada descolgado en Producción.

**Alcance**: no repetir el recorrido completo de `PRUEBA_PILOTO_END_TO_END.md` — revisar específicamente los puntos que quedaron explícitamente diferidos ahí (agrupación visual en secciones, adjuntar documentos, ficha de registro, búsqueda del lado del servidor, normalización de Versión, normalización de campos "Motivo"/Rol) y decidir cuáles entran en esta iteración.

**Entregable/Estimación**: 1 sesión, alcance a decidir según lo que quede pendiente de la lista anterior.

### M5 — Outputs (informes, Gantt, panel operativo, historial)
**Por qué al final**: los outputs se calculan siempre a partir de Producción y cruzando los demás bloques — solo tiene sentido auditarlos con garantía una vez que las fuentes (M1-M4) están saneadas.

**Alcance**: `ReportService.js` (informes de campaña/proyecto/memoria/excepciones/cambios), `DesviacionService.js` (Gantt + desviación, ya trabajado extensamente esta sesión — revisar si el feedback de UX aplicado al Gantt debe extenderse a los demás informes), `DashboardService.js` (panel operativo), `HistorialService.js`/reversión.

**Entregable/Estimación**: 1 sesión.

## Registro de hallazgos y construcción

Los hallazgos de cada fase se documentan con la plantilla de `AUDITORIA_POR_BLOQUES.md` (sección propia de ese documento, actualizando su tabla de estado) y las decisiones de construcción se reflejan en `ROADMAP_BACKLOG_MEJORAS.md`, igual que en fases anteriores — este documento es el plan de secuenciación, no el lugar donde vive el detalle de cada hallazgo.

## Estado

| Fase | Bloque | Estado |
|---|---|---|
| M1 | Personas | ⬜ Pendiente |
| M2 | Espacios/Recursos | ⬜ Pendiente |
| M3 | Proveedores/Materiales | ⬜ Pendiente |
| M4 | Producción (pasada final) | ⬜ Pendiente |
| M5 | Outputs | ⬜ Pendiente |

## Auditoría de optimización UX — ejecución actual

### Alcance y restricciones

Auditoría técnica local y estática del sistema Taller de Producción, contrastada con el marco de ocho preguntas —Qué, Quién, Dónde, Con qué, Cuándo, Cómo, Cuánto y Por qué— y los tres polos —Analizar, Navegar y editar, Crear y gestionar datos—. No se ejecuta Apps Script, no se contacta Google Drive ni otro servicio externo, no se instalan dependencias, no se usan operaciones `clasp`, no se hacen commits y no se modifica ningún archivo salvo este documento vivo con autorización expresa. El Google Sheet remoto permanece **NO VERIFICADO**.

### F00 — Preflight local

**Objetivo:** verificar ruta, estructura, Git, manifiestos, fuentes, manual y pruebas.

**Resultado: VERIFICADO con WARN.** El proyecto existe en `C:\Users\pc\Desktop\LaTroballa.audit`, corresponde a LaTroballa Audit, está en la rama `main` y commit `752e1c14ea3d9cadff102aa52780616d0e58336a`. No hay remotos Git configurados. Existen `.clasp.json`, `src/appsscript.json`, fuentes JS/HTML y el manual funcional. `Tests_Repository.js` y `Tests_Repository2.js` son archivos distintos dentro de `src`, no directorios. `MANUAL_MARCO_FUNDAMENTAL.md` era y continúa siendo un archivo nuevo no rastreado; no fue alterado.

### F01 — Inventario trazable de solo lectura

**Resultado: VERIFICADO con WARN e INFERENCIAS identificadas.** Se inventariaron 134 archivos, excluyendo solo el contenido interno de `.git`. Todos fueron leídos para calcular tamaño y SHA-256. No hay hashes duplicados.

Convenciones del inventario: `UI` = interfaz HTML o apertura mediante HtmlService; `DOM` = lógica de dominio; `DAT` = acceso a hojas/rangos; `INST` = instalación/migración; `TEST` = prueba/suite. Dependencias: `SS` = SpreadsheetApp; `HS` = HtmlService; `GS` = google.script.run; `LS` = LockService; `PS` = PropertiesService; `DA` = DriveApp; `UF` = UrlFetchApp; `R` = Repository. Estado `V` = inventariado y hash calculado. La función es aparente y no equivale a una evaluación de calidad.

| Ruta relativa | Tipo | Tamaño (bytes) | SHA-256 | Función aparente | Clasificación | Evidencia de clasificación | Dependencias observadas | Estado |
|---|---:|---:|---|---|---|---|---|---|
| `.clasp.json` | json | 279 | `74afd2762554f31b9c3d125c75d94bd7362120fc6bdfa25d9a7e8cdd7b13161d` | Sincronización Apps Script | Configuración | JSON de proyecto | — | V |
| `ACTA_CIERRE_SESION.md` | md | 9944 | `68e6d5310851f8bda26a99d84d365af45e6f0e5bd3e2955bf5ee41b0717e7436` | Acta técnica | Documentación | Markdown no ejecutable | R | V |
| `AUDITORIA_POR_BLOQUES.md` | md | 5372 | `380d6f34d8c4879633504ace754c3b1e1e1721dfb717c00d436e5e3c4037c959` | Auditoría previa | Documentación | Markdown no ejecutable | — | V |
| `BACKLOG_CONSOLIDADO.md` | md | 10551 | `c89b9fb466657daea8c5b50564b135bf23e3fc07adb4ab0f6ff21a948036e950` | Backlog | Documentación | Markdown no ejecutable | R | V |
| `BASELINE_DESARROLLO.md` | md | 10343 | `447e8bee12b758bf1db85f119cd78d84ca781ad8c958d6c118eb81fcb615af9a` | Línea base | Documentación | Markdown no ejecutable | R | V |
| `HASHES_CIERRE.md` | md | 3236 | `7cd2e2f34a17661c65eeb69aa3b439105d2b5f1236651117d0ad3d3f9de58348` | Registro previo de hashes | Documentación | Markdown no ejecutable | R | V |
| `INFORME_CIERRE_AUDITORIA_GLOBAL.md` | md | 5273 | `68b5e3518f56562a224a1f182c057ff9fed35b605273a1c68a7c495deeeb1704` | Informe previo | Documentación | Markdown no ejecutable | — | V |
| `MANUAL_MARCO_FUNDAMENTAL.md` | md | 11491 | `a18332565c408e9f283df26201c1a6745d1699ce9fd557d709d980225321c1fc` | Marco funcional | Documentación | Ocho preguntas y tres polos | — | V |
| `PROPUESTA_CAMPANA_ALTA_PLANIFICACION.md` | md | 9077 | `1d68b73f2eba7ac5fc42c66e888b9480c8a84b00bb65f18d27e30d06eb42b729` | Propuesta funcional | Documentación | Markdown no ejecutable | — | V |
| `PROPUESTA_DECISION_ALTA.md` | md | 4033 | `33b95abd2219a2d0557ea9d61b9d5938fd4d3c17af6fd1f7e58e655936b2d678` | Propuesta funcional | Documentación | Markdown no ejecutable | — | V |
| `PROPUESTA_DOCUMENTO_ALTA.md` | md | 5712 | `6826d6b383e18c24765e6cdd28c1ecc18e9779741e3b77a52ef80196995804c8` | Propuesta funcional | Documentación | Markdown no ejecutable | — | V |
| `PROPUESTA_INCIDENCIA_ALTA.md` | md | 5993 | `078f7d10221bd563b9056fac635858cf985bbe299ac4d19d3a70c00740a99917` | Propuesta funcional | Documentación | Markdown no ejecutable | — | V |
| `PROPUESTA_PROCESO_ALTA.md` | md | 7270 | `9ec74372e169eb21fc431c9e2140c4838a3b1d9b23ed8c17699e87fd2b246d22` | Propuesta funcional | Documentación | Markdown no ejecutable | R | V |
| `PROPUESTA_PRODUCTO_ALTA.md` | md | 5369 | `20b0f36f8db8bf88e470d750019d531d282f3360cc5d5043a7cb63852217a14a` | Propuesta funcional | Documentación | Markdown no ejecutable | — | V |
| `PROPUESTA_PROVEEDOR_ALTA.md` | md | 8345 | `dde5b3e88f1d38cea3a690496ae12a003d16e2224185d93939fc7ab23f470e3f` | Propuesta funcional | Documentación | Markdown no ejecutable | — | V |
| `PROPUESTA_PROYECTO_ALTA_PLANIFICACION.md` | md | 6177 | `d50ab6c9e1c032f31f1c17619e8493cd8597f4ad3888583ec9fc843c36e7d08a` | Propuesta funcional | Documentación | Markdown no ejecutable | R | V |
| `PROPUESTA_PROYECTO_PRODUCTO_RELACION.md` | md | 6015 | `f31e8f845f12572d837f4fdafd2f7583d119fbf737ef6eba8ae59a682415ec40` | Propuesta funcional | Documentación | Markdown no ejecutable | R | V |
| `PROPUESTA_RECURSO_MATERIAL.md` | md | 14609 | `5edd69f81a0cbf2cebcf1cc9be0d4d62bdf3335964ffd470f7f3b8e29207f96b` | Propuesta funcional | Documentación | Markdown no ejecutable | — | V |
| `PROPUESTA_TAREA_ALTA.md` | md | 5779 | `926d97ab1438b76d254de661f03ebd6e107c7deb827c70f59ee56880da872d44` | Propuesta funcional | Documentación | Markdown no ejecutable | — | V |
| `PRUEBA_PILOTO_END_TO_END.md` | md | 7819 | `fbcbf5818b447e57183efcba40ebfd222de34c89cf8f03ee0b71ca2053f7614a` | Evidencia de prueba | Documentación | Documento, no suite | — | V |
| `PRUEBA_REAL_CAMPANA.md` | md | 46070 | `ba956277fea231b9477d9c7f0c6dc101f991d663d4628f16a842aa018e5c3496` | Evidencia de prueba | Documentación | Documento, no suite | R | V |
| `ROADMAP_AUDITORIA_UX.md` | md | 7076 | `8fbec8465968af0b2b0e054d7125a2010b86a4bf77fbee0da4b7b71ff38e9719` | Roadmap UX previo | Documentación | Markdown no ejecutable | — | V |
| `ROADMAP_BACKLOG_MEJORAS.md` | md | 70240 | `f0c2c8f9c19280f9a1c68b80c7d2d470855226acf31e012502aa048eee989456` | Backlog ampliado | Documentación | Markdown no ejecutable | R | V |
| `ROADMAP_IMPLEMENTACION.md` | md | 17293 | `2d90f3f385d5977ddbc7fa724c2614be31a3ff2d4a426a01bc7f9a07b6ff1e6d` | Roadmap técnico | Documentación | Markdown no ejecutable | LS,R | V |
| `src\appsscript.json` | json | 676 | `8b154472f9fbeb54d6ac82f8c0622d16f4243a61932aa024825a0e0f7e080b4f` | Manifiesto | Configuración | JSON de runtime/permisos | — | V |
| `src\AvanceYSecuencia.js` | js | 6587 | `752fa1c0d59825e05c1e51333d7ae77a91d242123cd350c30eedac0bdc90b234` | Avance/secuencia | Repositorio | DAT | SS | V |
| `src\CacheLecturaService.js` | js | 1744 | `b2a3ceaaf206d71eae20ff7c0fc916fca97654ce9e7360f16e5b919215dd5401` | Caché de consultas | Servicio | DOM | — | V |
| `src\CampaniaService.js` | js | 1204 | `8fdeed02ef0d587fe4c889234570dd7c7dc900019655b80823c0117c15fbacd1` | Campañas | Servicio | DOM | — | V |
| `src\Código.js` | js | 389 | `c5bb093173f04ab7f7226f433cc3cbcd3a8157df68687d693175d3fd4690456a` | Entrada mínima | Repositorio | DAT | SS | V |
| `src\ConfigRepository.js` | js | 2898 | `647fd4202287c8ac9a9631a4a49b8fdaf18a3589ca793e36afc6f1575365e5b5` | Configuración en hojas | Repositorio | DAT | SS | V |
| `src\CorregirCatalogoTipoProyecto.js` | js | 5590 | `cb262bab21508885a90a47dffd0b03856097b64aaa5f1f6fbe70119a36c54c59` | Corrección catálogo | Instalación/migración | INST,DAT | SS,LS | V |
| `src\CosteService.js` | js | 16849 | `f788e998b19f48f8187e1b0ff0c0ffab25d777bcb2dad90a9e6bb9241e41f973` | Costes | Servicio | DOM | — | V |
| `src\DashboardService.js` | js | 10064 | `f452c90ae013f8a54db22133b200faed5f9fd39b102cb8b4ff8c08b927fd522e` | Panel operativo | Interfaz | UI,DAT | SS,HS | V |
| `src\DesviacionService.js` | js | 41537 | `e389211b9759a996d9cbe53e1ba054bdff20cd7bb114391693135f8531ceec61` | Gantt/desviación | Interfaz | UI,DOM,DAT | SS,HS | V |
| `src\DisponibilidadService.js` | js | 21483 | `4e6e286291b9ade40c7ce0515d940049bf2b8300e818992c669c38f2b2a4e439` | Disponibilidad | Repositorio | DAT | SS | V |
| `src\EdicionDirecta.js` | js | 1308 | `65ef422bf279a0506b890a2cad77a1f048b7590f30333f31bf01eb8e6232db64` | Trigger onEdit | Producción | Función operativa | SS | V |
| `src\Estilos.html` | html | 4127 | `2e3df759ede71610f7f4c1a91633bf6262c17d4969287f453f7ee0468cc1062e` | Estilos compartidos | Interfaz | HTML/CSS | — | V |
| `src\EvidenciaSocialService.js` | js | 4393 | `b347969c382b5999250ffb4c0090e5f6b235f02a436389674187c94185bf989d` | Impacto | Servicio | DOM | — | V |
| `src\ExportarCodigoProduccion.js` | js | 11145 | `41827821a90a53b97a11d52d85784baa45caa4ee706524ba82b0707d6f331185` | Exportación | Servicio | Orquestación | DA,UF | V |
| `src\FichaConvocatoria.html` | html | 8056 | `97c31ea1c13eca948d5255d550ea38b6693ad91b0806b40d751e5fff63c7fbeb` | Ficha convocatoria | Interfaz | UI | GS | V |
| `src\FichaConvocatoriaService.js` | js | 6016 | `c5dc19eddd924ed9272688774dd2181606aa03fe4e018a83cb9f507d53c219c2` | Backend ficha | Interfaz | UI,DAT | SS,HS | V |
| `src\FichaIncidencia.html` | html | 9589 | `8542701d57c43beeed7c4925fb65d6d08fb6910422cbaeb8d3d34c27be882c3d` | Ficha incidencia | Interfaz | UI | GS | V |
| `src\FichaIncidenciaService.js` | js | 5426 | `d87c21abe4ea4694a98e544a1ba30181f61bf4850e7422f45c35b4a6b18dcb47` | Backend ficha | Interfaz | UI,DAT | SS,HS | V |
| `src\FichaMaterial.html` | html | 10277 | `bbc543df1d6571608d41704c71ab3b91a95051a311612c2649f4fc225f0e1397` | Ficha material | Interfaz | UI | GS | V |
| `src\FichaMaterialService.js` | js | 6112 | `c4ca89c83aeba226fab66fb3f669e8a6c9433b3128ccc5f882888cab67f7c96d` | Backend ficha | Interfaz | UI,DAT | SS,HS | V |
| `src\FichaPersonaEquipo.html` | html | 12278 | `b0b8cf56eb0e1b4f89ccd98edf5dd6bbe656d14636ec9378f0fcf5cae496f550` | Ficha persona/equipo | Interfaz | UI | GS | V |
| `src\FichaPersonaEquipoService.js` | js | 10166 | `0ab389071c8ac207b4b7fd426946c0cb0f3044ab6e268c63fc5c55730ba8f4cb` | Backend ficha | Interfaz | UI,DAT | SS,HS | V |
| `src\FichaProducto.html` | html | 13437 | `14b9a8e0b56231c8e5b0269cabd6f0019a836b18b016d5208f005c6fdc4e0404` | Ficha producto | Interfaz | UI | GS | V |
| `src\FichaProductoService.js` | js | 11165 | `cfbc714223152591b3c22fcfff52d6d441b203afeaf508e73e515d0fd128817c` | Backend ficha | Interfaz | UI,DAT | SS,HS | V |
| `src\FichaProveedor.html` | html | 8948 | `a8917f0b821d6cd7da0f955cb31b4fc340a64f7ecfd0aa3984bab8c046e71fd5` | Ficha proveedor | Interfaz | UI | GS | V |
| `src\FichaProveedorService.js` | js | 5198 | `db067fc529eb4949a45ebd03e3184a04afa60fe2d55343fcb89b2879413a7fad` | Backend ficha | Interfaz | UI,DAT | SS,HS | V |
| `src\FichaRecurso.html` | html | 8881 | `6eb88fe2ab8db9b42b95e32fd3669baa41a8f360017bd991b04dde55cec86ec2` | Ficha recurso | Interfaz | UI | GS | V |
| `src\FichaRecursoService.js` | js | 5774 | `23997911c62386a274e37c8e7d7e625be31ddf484405a178dc9d03a0ab114bcb` | Backend ficha | Interfaz | UI,DAT | SS,HS | V |
| `src\FormularioGenerico.html` | html | 36066 | `a9e53541d3326dadd7b71e8e907d4104471a44b317bdc923bf4679428805a4f5` | Formulario común | Interfaz | UI dinámica | GS | V |
| `src\Formularios.js` | js | 121358 | `14e495f83f15708f86f5a05e57d46438fc81aca71f5d37331ac432dc843ea2de` | Backend formularios | Interfaz | UI,DAT | SS,HS | V |
| `src\GanttPlanReal.html` | html | 81881 | `0188bfb8e85883ad6a5071583912a08898ba1bd2ed370adf3e072afee7f1fbcf` | Gantt | Interfaz | UI | GS | V |
| `src\GeneracionCodigo.js` | js | 6618 | `aded9126acd0b8e9523f9a85f8a6cfb33dc214cf83ef41551e45bca4767cc319` | Códigos | Repositorio | DAT | SS | V |
| `src\GestionCatalogo.html` | html | 2843 | `31f31f4d8c360a944eb68de3656009ba5da223da2dae03fa9972ca13d00471c0` | Gestión catálogo | Interfaz | UI | GS | V |
| `src\GestionCatalogos.js` | js | 5083 | `63aaf48250cb783029836d8758e27607c46e097c02273f34fe5a16a5b468dd0a` | Backend catálogo | Interfaz | UI,DAT | SS,HS,LS | V |
| `src\HistorialService.js` | js | 7095 | `a66deababd7a1bd1b6522a0a9c76af7df397e655037446ecbfa0b577a63f2d71` | Historial/preparación | Instalación/migración | INST,DAT | SS | V |
| `src\Ids.js` | js | 11999 | `17f75da065a8e210382e15b7104ea1f9cbafad28b7767769970d5b7d96bcff8e` | IDs y pruebas | Mixto | Operación+TEST | SS | V |
| `src\ImportacionMasiva.js` | js | 23452 | `cba55c2a18d48bafcf5077a051b6acd5e16793e8e5b48b0295e5f4012eeefa36` | Importación masiva | Repositorio | DAT | SS | V |
| `src\Includes.js` | js | 358 | `bb3ba83d64e0b31954a0fa03a7ee28c27a065a716dd7b99c18976b42a03617e8` | Inclusión HTML | Interfaz | UI | HS | V |
| `src\InformeGenerico.html` | html | 26853 | `340dbdc5f5ffa7f0aa042a5355a82fea1c3a85f97b68b1bfd1c374c46c36315b` | Informe común | Interfaz | UI | GS | V |
| `src\InstaladorAsignacion.js` | js | 2257 | `51b33af8953423c16f62c29d3d6b76e5bb861535d4123c82952abeafee7447c1` | Instalar asignaciones | Instalación/migración | INST,DAT | SS,LS | V |
| `src\InstaladorCampanaEstiuYNavidadAmpliada.js` | js | 21748 | `47dfc5d483402cbcf30c5c27cc658c9ef064c438f6945e9cf954d0664474910c` | Carga campañas | Instalación/migración | INST | Internas | V |
| `src\InstaladorCampanaMercatsTardor.js` | js | 29393 | `9e36916e25674bcfba0143cf4a7f08b6bb8e13edf7913b4eabd05c9976f8eb03` | Carga campaña | Instalación/migración | INST | Internas | V |
| `src\InstaladorCatalogosL2.js` | js | 5457 | `92a8cd799352c2aa8f4641277116f6e6eff0b62904c0e7254fe698e91359c00a` | Instalar catálogos | Instalación/migración | INST,DAT | SS,LS | V |
| `src\InstaladorCompetencia.js` | js | 3738 | `1e60e04bcba81ae767fbd6331793b1e6c438c459f24a28b15ff3614e8abcb101` | Instalar competencias | Instalación/migración | INST,DAT | SS,LS | V |
| `src\InstaladorConvocatoria.js` | js | 4956 | `ceef7c39e4abee7aa1d8aeecf9980e1ad4131164307255081cc0ae9eadfabb1e` | Instalar convocatorias | Instalación/migración | INST,DAT | SS,LS | V |
| `src\InstaladorCoste.js` | js | 4755 | `207ccecf3060a40939762b652845174c2d66ce8f17d1b1d0945c57c6044925e2` | Instalar costes | Instalación/migración | INST,DAT | SS,LS | V |
| `src\InstaladorCriteriosAceptacion.js` | js | 2533 | `9012e1c99c97987d677c57f4b705e7ea7a0b2bb9e31b161ee4d827b683ab3c09` | Instalar criterios | Instalación/migración | INST,DAT | SS,LS | V |
| `src\InstaladorDatosPruebaPiloto.js` | js | 34787 | `63cc7b394d525a6552f52e6a0ad3327892cdaab8eec96dd89fa0bbe6c1b2e937` | Carga piloto | Instalación/migración | INST de datos | Internas | V |
| `src\InstaladorDatosPruebaPilotoAmpliado.js` | js | 14235 | `f1c858f50a88f5d33232d7cebbf712481d6f74a69d69854f82fd098c63455d58` | Carga piloto ampliada | Instalación/migración | INST de datos | Internas | V |
| `src\InstaladorEjecucionTarea.js` | js | 2617 | `d9c8ea861383ac52b15f7a7c1eb094c29c574cb845322a7b8f905e893ff53260` | Instalar ejecuciones | Instalación/migración | INST,DAT | SS,LS | V |
| `src\InstaladorEntidadPersonaDocumento.js` | js | 1287 | `f08cd6b1117d7b04830adc1433f2b291a00db61e2e5a130c32af56c7a7e7c4d9` | Instalar relación | Instalación/migración | INST,DAT | SS,LS | V |
| `src\InstaladorEquipoMiembro.js` | js | 4317 | `98c7c2d31d4a45d70eba6f3d71a9ae7f7b80d32af81c09a835b9eedd3638cdd9` | Instalar miembros | Instalación/migración | INST,DAT | SS,LS | V |
| `src\InstaladorHorario.js` | js | 6725 | `9c016a530911b0fe2799b28a95be33107bc215cd72ce419e890314a297b29527` | Instalar horarios | Instalación/migración | INST,DAT | SS,LS | V |
| `src\InstaladorHorarioEquipoProduccion.js` | js | 4264 | `1132faf06f5b6e4652ce679b577c53d175260928431e76f616fc9af7ff32d57d` | Carga horarios | Instalación/migración | INST | Internas | V |
| `src\InstaladorImpacto.js` | js | 2777 | `c140f912c6abb43a08033c6bb89b76dac8057a129971d2d43e569f99b908de85` | Instalar impacto | Instalación/migración | INST,DAT | SS,LS | V |
| `src\InstaladorImportacionMasiva.js` | js | 5231 | `03709f3c9d8b09aa2a5705079e8b00d2fe25da4369d96446905c70915e5cbaaa` | Instalar staging | Instalación/migración | INST,DAT | SS,LS,R | V |
| `src\InstaladorJerarquiaFisica.js` | js | 4539 | `1891da7b224c8065aeea9f8766ecaaad8324abf92eb1f9504f68e035f7ccf398` | Carga jerarquía | Instalación/migración | INST | Internas | V |
| `src\InstaladorMejorasAuditoriaPiloto.js` | js | 4056 | `2078bff0a57eca32220248bab6a211531f3b74d0afd052047c5fa7b1001f0ab7` | Migrar mejoras | Instalación/migración | INST,DAT | SS,LS | V |
| `src\InstaladorMetodoCalculoAvance.js` | js | 1435 | `087328f079d168756df40dcbb363365d7a950a6da15de1095f4d0a1730db34fe` | Instalar método | Instalación/migración | INST,DAT | SS,LS | V |
| `src\InstaladorModoUso.js` | js | 2851 | `a33b75369c8edd9c4c4d3515fc8ecb5a7754de2027657f5ac48d1ecbce44500d` | Instalar modo | Instalación/migración | INST,DAT | SS,LS | V |
| `src\InstaladorMovimientoMaterial.js` | js | 2928 | `66b7b698a24cf50e7d09c4679ed503eda3004cf3b08a7b2e4417fc8137c4b790` | Instalar movimientos | Instalación/migración | INST,DAT | SS,LS | V |
| `src\InstaladorNivelDato.js` | js | 3901 | `fb9b61a7b9e1ac4ec73abc5f0eeed6772f6f823953bde02d0bc95f43fc1ed4bf` | Instalar niveles | Instalación/migración | INST,DAT | SS,LS | V |
| `src\InstaladorPaqueteInformes.js` | js | 29425 | `28532180877aae7e312f8f56eb7b4347f5579b6ffa1d5be1eebcadd5f9b7f28c` | Instalar informes | Instalación/migración | INST | R | V |
| `src\InstaladorPedidoRecepcion.js` | js | 4537 | `1e425e84d907a2d407d07e62213c0504ca36a20190e9170b39ef126dfd37d30b` | Instalar compras | Instalación/migración | INST,DAT | SS,LS | V |
| `src\InstaladorPresupuesto.js` | js | 4363 | `948b547d27dbc5550656036b8e24a17b1dba720d2d073267aa5ce7433227818a` | Instalar presupuestos | Instalación/migración | INST,DAT | SS,LS | V |
| `src\InstaladorProveedorMaterial.js` | js | 2817 | `e1d762cd81b176fdc1e9284ba30ed24ea9600d48da9ce492814a81dea7999b3f` | Instalar relación | Instalación/migración | INST,DAT | SS,LS | V |
| `src\InstaladorRecurso.js` | js | 5810 | `a8201a9d95a5bed1e6e2fb20267ecbd2278faabf1df3bdcf3039b7b38436c8f6` | Instalar recursos | Instalación/migración | INST,DAT | SS,LS | V |
| `src\InstaladorRelacion.js` | js | 5718 | `73f95d454e70b1fabbed38530b3cb6169b4647a72ef2d9d822bd9a6269570414` | Instalar relaciones | Instalación/migración | INST,DAT | SS,LS | V |
| `src\InstaladorRolPersonaAtendida.js` | js | 2860 | `e755ca91a06d3b5682c4f14829022c876ca8330477895fccbdef079092ef9194` | Instalar roles | Instalación/migración | INST,DAT | SS,LS | V |
| `src\InstaladorTipoVinculoIncidencia.js` | js | 1669 | `349f79c5fc292c3d46aa86a8884445bd32d02d59041b44fb6de5e2704aae7394` | Instalar catálogo | Instalación/migración | INST,DAT | SS,LS | V |
| `src\InstaladorVinculo.js` | js | 6012 | `ef34cd381bc3bcc8d8675d3f741f445cc695c9b90310dd66021c2b43effd85a1` | Instalar vínculos | Instalación/migración | INST,DAT | SS,LS | V |
| `src\InstrumentacionService.js` | js | 2152 | `e16f6cd90c2a0ccc99a4203c765ee0db47509d44411ad2a03480915559f870b3` | Instrumentación | Repositorio | DAT | SS | V |
| `src\IntegridadReporte.html` | html | 4314 | `f38bbe152a5e257cf365259f43e56d1bbdba94f1dc76bb81bc984664052af971` | Informe integridad | Interfaz | UI | GS | V |
| `src\IntegrityService.js` | js | 95777 | `c8bf30e81ca85a0fa3f5824aabc4e99a4953296c6e2ba7b89aab8f9b36c29026` | Integridad+vista | Interfaz | UI,DOM,DAT | SS,HS,R | V |
| `src\KanbanOperativo.html` | html | 17743 | `219f45815c90aeba056f79c05b3b45ffcbb74d31586ad968f53272aab6a727a8` | Kanban | Interfaz | UI | GS | V |
| `src\KanbanService.js` | js | 10798 | `93d26cb68389cdb4985a02b8eadcd2d2c5989957b4bc99e9828aaf78e8be9755` | Backend Kanban | Interfaz | UI,DAT | SS,HS | V |
| `src\LecturaBatchService.js` | js | 5019 | `321d42f087f8dad6cf2db3b8cb4c11c26ba61a2a5d1de443cd070773fa64e857` | Lectura agrupada | Repositorio | DAT | SS,R | V |
| `src\ListadoFiltrable.html` | html | 7055 | `a63f41ec683c353ce7e1e4c8c9e8b219f4b2704b82d1d8504b72d1e8954fe8af` | Listado filtrable | Interfaz | UI | GS | V |
| `src\ListadoFiltrableService.js` | js | 5102 | `1587ca25a38b40f3f2fb3fda159b9a26c2eb3f71dc360b5890a10e7ff9144300` | Backend listado | Interfaz | UI,DAT | SS,HS | V |
| `src\ModalConfirmar.html` | html | 1613 | `dbc5c69c324007620c1e857ce28c8490ff6bbd05b41a3fc0cf1721ec88301afd` | Confirmación | Interfaz | UI | — | V |
| `src\NivelDatoService.js` | js | 1773 | `d451b59694a7c4086259a188c0d7f6184e7df91d454aed7e8e1ccc74d8b9cb94` | Niveles de datos | Producción | Código operativo | — | V |
| `src\PanelCampana.html` | html | 13521 | `2c16ab26c648d1bd52db18dd6a08cdfac7bf1e3f9f09826caaab06855ff443e7` | Panel campaña | Interfaz | UI | GS | V |
| `src\PanelCampanaService.js` | js | 9391 | `2d28226a336461b68210df3ee921165ea298a336804c6d7c68e02e1ac4d31067` | Backend panel | Interfaz | UI,DAT | SS,HS,PS | V |
| `src\PanelOperativo.html` | html | 10597 | `662e10bd24bac1f66c4e7f313ce9457953e3ab8418138d65f9e1964dd50d80da` | Panel operativo | Interfaz | UI | GS | V |
| `src\PanelPersonas.html` | html | 6066 | `57303b3934f2c17c5086019e6a5cd032b421b9f2969a56c1c9e9f0a501d6d41d` | Panel personas | Interfaz | UI | GS | V |
| `src\PanelPersonasService.js` | js | 1699 | `6cda80096224bc98d3274f67b3c9d70eee85e14a7692193f8e1b91bdab5346d4` | Backend panel | Interfaz | UI,DAT | SS,HS | V |
| `src\PanelRecursos.html` | html | 6744 | `62ed3751de9b5d8cc28bc2c8494eedf1a1709c9a161ad1b262e6a099d6fb647b` | Panel recursos | Interfaz | UI | GS | V |
| `src\PanelRecursosService.js` | js | 2668 | `2d221cb0491cde34c1d371736959a69f138eedfaec1ab5dba24b36dfd9119ac7` | Backend panel | Interfaz | UI,DAT | SS,HS | V |
| `src\PedidoRecepcion.js` | js | 7744 | `02b2e27989053f71e4971fcbc4c479c612a7d098ae05354998de00307072785a` | Pedido/recepción | Instalación/migración | INST,DAT | SS | V |
| `src\ProcesoService.js` | js | 1204 | `07edc944f54100b2cb34ded2379d11096a0d1470207985cdefec5471a4d18b78` | Procesos | Servicio | DOM | — | V |
| `src\ProductoService.js` | js | 1220 | `5ce352725445cf5580d782fe47cb84b98b3dd3f5c620896d45257e9fff62b547` | Productos | Servicio | DOM | — | V |
| `src\Proteccion.js` | js | 1635 | `4d94822d5d1f51678147614977cf9210c3333c7eaa105ef7e971de954654f241` | Protección hojas | Repositorio | DAT | SS | V |
| `src\ProyectoService.js` | js | 1220 | `373066e6d9d632747de61d1cb13586973b8e713f4b149619fb38bdec52f80a33` | Proyectos | Servicio | DOM | — | V |
| `src\ReportService.js` | js | 17770 | `923dbffd097163fc55e3b76210ed5f0652c7f47d654e9efac3252028deebca4f` | Informes | Interfaz | UI,DAT | SS,HS | V |
| `src\Repository.js` | js | 192295 | `bc8f19f506e870ddbcde507efa0b31d90c69ee445b0e93d722ee731006b5d0cb` | Repositorio+pruebas | Mixto | Operación+TEST | SS,LS,R | V |
| `src\Repository_InsertarRegistro.js` | js | 81486 | `c28502c4d93d245e66c6269f535dc59f7bb2ebb850e8a1372c57e44323d7ddd6` | Inserción transaccional | Repositorio | DAT | SS,LS,R | V |
| `src\Reversion.js` | js | 3884 | `d81b5f1232f5f2a9a8d82191f3ad508bfb150c0cbd2782304099daf9f94b0735` | Reversión | Repositorio | DAT | SS | V |
| `src\SelectorRegistro.html` | html | 4916 | `04e63894fdecf4ef870b4f3614e89c65f4977864beea02b70672b19484bf78a1` | Selector | Interfaz | UI | GS | V |
| `src\SerializacionService.js` | js | 843 | `35c31d085ec5144fe2ec699829ccabc0a65fc35d9f98ba8a1042fc5dd9a0a120` | Serialización | Producción | Transformación | Servidor | V |
| `src\StockMaterialService.js` | js | 2628 | `ec3230cf7f659e7fe07a67ffa9dad31e0062730b8f9cb79ee25b4a6cf9600eea` | Stock | Servicio | DOM | LS | V |
| `src\TareaService.js` | js | 1172 | `6bc902c0ecce4c563e3431147b93dbf9352009841f83a4c359bc5d3169f2e42f` | Tareas | Servicio | DOM | — | V |
| `src\Tests_AvanceYSecuencia.js` | js | 1765 | `d0a25ffad2b7717412a9f12918d70026432dd71b4a8f8710b6098b572ee22561` | Prueba secuencia | Prueba | TEST | AvanceYSecuencia | V |
| `src\Tests_CosteService.js` | js | 8446 | `1fa00cf5cf57a9807f9510ce86c8f0e9834d3774864c6a9b5c864ed844d71f90` | Prueba costes | Prueba | TEST | CosteService | V |
| `src\Tests_ImportacionRecursosPersonas.js` | js | 6763 | `43ced7eb6cebc0e5c518e81b320b94d988ed4cab2c229b3ec15c55691ffdb164` | Prueba importación | Prueba | TEST; DAT de fixture | SS,staging | V |
| `src\Tests_IntegridadGapReglasFuncional.js` | js | 30316 | `d3aae8e9b6c4d1f9a122b7828e502b64e919057c23dbb390af11b1a8a5032848` | Suite integridad | Prueba | TEST | SS,IntegrityService | V |
| `src\Tests_LecturaBatch.js` | js | 3022 | `9dea37c0c516e8c0c114c8c16e14a91b60f675875fc240559273ef9af85167b4` | Prueba lectura | Prueba | TEST | SS,R | V |
| `src\Tests_Repository.js` | js | 237884 | `d31821d51b7ee80616dd9372e3e64be89d141e45e51fa227b58704d8f3082eb6` | Suites repositorio | Prueba | TEST predominante | SS,R | V |
| `src\Tests_Repository2.js` | js | 577554 | `857d3e68f8911369cbdb6fc68f072f4aaddaf8108196d22aaeed9b4e5c7a912d` | Continuación suites | Prueba | TEST predominante | SS,LS,R | V |
| `src\Validation.js` | js | 70736 | `6f88b5c5d29db911b32f1e97443a5e63265c41b9fa2c05d9018f99700f3a1aae` | Validación con datos | Repositorio | DOM,DAT | SS,LS | V |

### Recuento por clasificación

| Clasificación | Cantidad |
|---|---:|
| Configuración | 2 |
| Documentación | 23 |
| Instalación/migración | 35 |
| Interfaz | 40 |
| Mixto | 2 |
| Producción | 3 |
| Prueba | 7 |
| Repositorio | 12 |
| Servicio | 10 |
| Desconocido | 0 |
| **Total** | **134** |

### Archivos de prueba y mixtos

Pruebas explícitas: `Tests_AvanceYSecuencia.js`, `Tests_CosteService.js`, `Tests_ImportacionRecursosPersonas.js`, `Tests_IntegridadGapReglasFuncional.js`, `Tests_LecturaBatch.js`, `Tests_Repository.js` y `Tests_Repository2.js`. Los dos repositorios de pruebas se trataron por separado y tienen tamaños y hashes distintos.

Archivos mixtos: `Ids.js` combina generación de identificadores con funciones `probar…`; `Repository.js` combina API operativa con numerosas funciones `pruebaPaso…` y suites históricas.

### Archivos relacionados con UX

- Paneles: `PanelOperativo.html`, pares `PanelCampana`, `PanelPersonas` y `PanelRecursos` HTML/Service, y `DashboardService.js`.
- Formularios/selectores: `FormularioGenerico.html`, `Formularios.js`, `SelectorRegistro.html`, `GestionCatalogo.html`, `GestionCatalogos.js` y `ModalConfirmar.html`.
- Fichas: pares HTML/Service de Convocatoria, Incidencia, Material, PersonaEquipo, Producto, Proveedor y Recurso.
- Análisis: `GanttPlanReal.html`, Kanban, listado filtrable, informes, integridad, `DesviacionService.js`, `IntegrityService.js` y `ReportService.js`.
- Menús: la existencia de llamadas de construcción/apertura está detectada, pero su función raíz y estructura completa permanecen **NO VERIFICADAS** hasta F02.

### Duplicidades o versiones paralelas

- `Tests_Repository.js` / `Tests_Repository2.js`: suites paralelas, no duplicados exactos.
- `Repository.js` / `Repository_InsertarRegistro.js`: responsabilidades nominalmente próximas.
- `InstaladorDatosPruebaPiloto.js` / `InstaladorDatosPruebaPilotoAmpliado.js`: base y ampliación.
- Instaladores de campañas Estiu/Navidad y Mercats Tardor: cargas paralelas.
- Servicios pequeños Campania/Proyecto/Producto/Proceso/Tarea: familia paralela.
- Pares `Ficha*.html` / `Ficha*Service.js`: arquitectura paralela intencionada.

### Hallazgos y riesgos

- **WARN:** las pruebas residen junto al código productivo en `src`.
- **WARN:** `Repository.js` e `Ids.js` contienen pruebas incrustadas junto a funciones operativas.
- **WARN:** varios backends de interfaz acceden directamente a SpreadsheetApp; puede dificultar separar UX, dominio y persistencia.
- **WARN:** los instaladores piloto son código ejecutable, aunque no formen parte del recorrido cotidiano.
- **INFERENCIA:** el tamaño de `Tests_Repository2.js`, `Tests_Repository.js`, `Repository.js`, `Formularios.js` e `IntegrityService.js` puede elevar el coste de mantenimiento. La calidad interna todavía no está verificada.
- **WARN:** `Código.js`, `AvanceYSecuencia.js`, `HistorialService.js`, `PedidoRecepcion.js`, `IntegrityService.js`, `Validation.js` y `Formularios.js` tienen responsabilidades fronterizas; su clasificación se revisará con trazado funcional posterior.

### Elementos NO VERIFICADOS

- Google Sheet remoto, sus pestañas, datos, formato y comportamiento real.
- Ejecución real de Apps Script, menús, triggers, formularios y permisos.
- Correspondencia completa entre ocho preguntas, tres polos y funciones concretas.
- Calidad interna, accesibilidad visual, navegación por teclado y comportamiento dinámico.
- Función exacta que construye el menú raíz y cualquier escritura en `00_INICIO`.

### Gate y siguiente prueba

**Gate F01-DOC pendiente de aprobación humana.** F00 y F01 no se consideran documentalmente cerradas hasta verificar esta escritura.

Siguiente prueba propuesta, todavía no iniciada: **F02 — Mapa de experiencia de usuario**, mediante análisis estático de menú, tres polos, pantallas iniciales, paneles, formularios, fichas, selectores, mensajes, escrituras en `00_INICIO` e interferencias potenciales de tests.

## F02 — Mapa de experiencia de usuario

### Alcance y método

Análisis exclusivamente estático del código local para reconstruir el menú implementado, entradas UX, correspondencia con los tres polos y ocho preguntas, patrones de mensajes/recuperación y referencias a `00_INICIO`. No se ejecutó Apps Script ni se verificó comportamiento remoto. Se buscaron `onOpen`, constructores de menú, funciones de apertura, plantillas HTML, llamadas cliente-servidor, mensajes, controles de cierre y referencias a hojas/rangos.

Estado inicial del documento vivo: 36.510 bytes; SHA-256 `49d5e8e52b13e3447480ca66f79d5c10e4e3748e2209907ae346ce18fcf9b1b9`. Estado Git inicial: `M ROADMAP_AUDITORIA_UX.md` y `?? MANUAL_MARCO_FUNDAMENTAL.md`. Hash inicial del manual: `a18332565c408e9f283df26201c1a6745d1699ce9fd557d709d980225321c1fc`.

### F02.1 — Árbol real del menú

Existe una única definición localizada de `onOpen()` en `src/Formularios.js:2506`. Crea `Taller de Producción` mediante `createMenu`, tres submenús principales mediante `addSubMenu`, opciones mediante `addItem` y finaliza con `addToUi` en la línea 2657. No se localizaron `addMenu`, `addSeparator` ni otra construcción histórica/duplicada de menú.

| Polo/submenú | Etiqueta visible | Función invocada | Archivo y línea | Pantalla o acción | Estado |
|---|---|---|---|---|---|
| Raíz | Taller de Producción | `onOpen` | Formularios.js:2506-2508 | Menú principal | VERIFICADO estático |
| Analizar | Panel operativo | `abrirPanelOperativo` | Formularios.js:2511; DashboardService.js:274 | Sidebar PanelOperativo | Localizada |
| Analizar | Informes | `abrirInformes` | 2512; ReportService.js:420 | Sidebar InformeGenerico | Localizada |
| Analizar | Gantt: plan vs. real | `abrirGanttPlanReal` | 2513; DesviacionService.js:881 | Modal GanttPlanReal | Localizada |
| Analizar | Kanban operativo (Tarea/Proceso/Incidencia) | `abrirKanban` | 2514; KanbanService.js:233 | Modal KanbanOperativo | Localizada |
| Analizar | Listado filtrable (Incidencias/Decisiones/Documentos) | `abrirListadoFiltrable` | 2515; ListadoFiltrableService.js:119 | Sidebar ListadoFiltrable | Localizada |
| Analizar | Verificar integridad | `abrirIntegridad` | 2516; IntegrityService.js:3501 | Sidebar IntegridadReporte | Localizada |
| Analizar | Historial | `abrirHistorialAdmin` | 2517; Formularios.js:2984 | Activa hoja 91_HISTORIAL | Localizada |
| Navegar/jerarquía producción | Gestión de campaña (vista global) | `abrirPanelCampana` | 2523; PanelCampanaService.js:215 | Sidebar PanelCampana | Localizada |
| Navegar/jerarquía producción | Ficha de producto (buscar) | `abrirFichaProductoBuscar` | 2524; FichaProductoService.js:176 | Selector→modal ficha | Localizada |
| Navegar/jerarquía producción | Editar campaña/proyecto/producto/Proyecto-Producto/proceso/tarea | `abrirEditar*` | 2525-2530; Formularios.js:2908-2912,2927 | Selector→FormularioGenerico | Localizada |
| Navegar/Personas y equipos | Ver personas y equipo (jerarquía) | `abrirPanelPersonas` | 2534; PanelPersonasService.js:47 | Sidebar PanelPersonas | Localizada |
| Navegar/Personas y equipos | Ficha de persona/equipo (buscar) | `abrirFichaPersonaEquipoBuscar` | 2535; FichaPersonaEquipoService.js:211 | Selector→modal ficha | Localizada |
| Navegar/Personas y equipos | Editar persona/equipo, Equipo-Miembro, Tarea-Responsable | `abrirEditar*` | 2536-2538; Formularios.js:2914,2938,2928 | Selector→formulario | Localizada |
| Navegar/Espacios y recursos | Ver espacios y recursos (jerarquía) | `abrirPanelRecursos` | 2542; PanelRecursosService.js:65 | Sidebar PanelRecursos | Localizada |
| Navegar/Espacios y recursos | Ficha de espacio/recurso (buscar) | `abrirFichaRecursoBuscar` | 2543; FichaRecursoService.js:116 | Selector→modal ficha | Localizada |
| Navegar/Espacios y recursos | Editar recurso, Tarea-Recurso, horario | `abrirEditar*` | 2544-2546; Formularios.js:2939,2940,2934 | Selector→formulario | Localizada |
| Navegar/Materiales y proveedores | Fichas de material/proveedor (buscar) | `abrirFicha*Buscar` | 2550,2554; FichaMaterialService.js:93; FichaProveedorService.js:80 | Selector→modal ficha | Localizada |
| Navegar/Materiales y proveedores | Editar material y relaciones de material | `abrirEditar*` | 2551-2553; Formularios.js:2913,2929-2930 | Selector→formulario | Localizada |
| Navegar/Materiales y proveedores | Editar proveedor, Proveedor-Material, pedido/línea, recepción/línea, movimiento | `abrirEditar*` | 2555-2561; Formularios.js:2915,2935,2937,2941-2944 | Selector→formulario | Localizada |
| Navegar/Seguimiento y decisiones | Ficha de incidencia (buscar) | `abrirFichaIncidenciaBuscar` | 2565; FichaIncidenciaService.js:78 | Selector→modal ficha | Localizada |
| Navegar/Seguimiento y decisiones | Editar incidencia, decisión, documento, relación, vínculo, ejecución, asignación | `abrirEditar*` | 2566-2572; Formularios.js:2916-2918,2931-2933,2936 | Selector→formulario | Localizada |
| Crear/Nuevo registro | Nueva campaña, proyecto, producto, proceso, tarea | `abrirFormularioCrear*` | 2579-2583; Formularios.js:2811-2815 | FormularioGenerico | Localizada |
| Crear/Nuevo registro | Nueva persona/equipo, recurso, horario, material, proveedor | `abrirFormularioCrear*` | 2584-2588; Formularios.js:2956,2961,2986-2987 y wrappers | FormularioGenerico | Localizada |
| Crear/Nuevo registro | Nuevo pedido, recepción, incidencia, decisión, documento | `abrirFormularioCrear*` | 2589-2593; Formularios.js:2817-2819,2963,2965 | FormularioGenerico | Localizada |
| Crear/Nueva relación/vínculo | Proyecto-Producto, Equipo-Miembro, Tarea-Responsable/Recurso | `abrirFormularioCrear*` | 2597-2600; Formularios.js:2949-2950,2960,2962 | FormularioGenerico | Localizada |
| Crear/Nueva relación/vínculo | Producto/Tarea/Proveedor-Material, Pedido/Recepción-Línea | `abrirFormularioCrear*` | 2601-2605; Formularios.js:2951-2952,2959,2964,2966 | FormularioGenerico | Localizada |
| Crear/Nueva relación/vínculo | Relación, vínculo, ejecución, asignación | `abrirFormularioCrear*` | 2606-2609; Formularios.js:2953-2955,2958 | FormularioGenerico | Localizada |
| Crear/Movimientos | Confirmar recepción | `abrirConfirmarRecepcion` | 2613; PedidoRecepcion.js:167 | Flujo de confirmación | Localizada |
| Crear/Movimientos | Movimiento material; recalcular avance | `abrirFormularioCrearMovimientoMaterial`; `abrirRecalcularAvanceProceso` | 2614-2615 | Formulario/acción | Funciones localizadas |
| Crear/Presupuesto y financiación | Crear/editar presupuesto, fuente y coste | `abrirFormularioCrear*`; `abrirEditar*` | 2619-2624; Formularios.js:2819-2822,2919-2921 | Selector/formulario | Localizada |
| Crear/Competencias | Crear/editar competencia y relaciones persona/recurso | `abrirFormularioCrear*`; `abrirEditar*` | 2628-2633; Formularios.js:2823-2825,2922-2924 | Selector/formulario | Localizada |
| Crear/Convocatorias | Ficha, nueva, editar | `abrirFichaConvocatoriaBuscar`; crear/editar | 2637-2639; FichaConvocatoriaService.js:100 | Selector/ficha/formulario | Localizada; extensión manual |
| Crear/Impacto | Nueva/editar etiqueta impacto | crear/editar etiqueta | 2643-2644; Formularios.js:2827,2926 | Formulario | Localizada |
| Crear/Catálogos y administración | Catálogos | `abrirCatalogosAdmin` | 2648; GestionCatalogos.js:151 | Selector de catálogo/modal | Localizada |
| Crear/Catálogos y administración | Personas/equipos y proveedores (hoja) | `abrirPersonasEquiposAdmin`; `abrirProveedoresAdmin` | 2649-2650 | Activa hoja | Localizada |
| Crear/Catálogos y administración | Protección de hojas | `abrirProteccionHojas` | 2651 | Acción administrativa | Localizada |
| Crear/Catálogos y administración | Importaciones campaña y Recursos/Personas | `abrirImportacionMasiva*` | 2652-2653; ImportacionMasiva.js | Activa staging/flujo | Localizada |
| Crear/Catálogos y administración | Mantenimiento (revertir cambio) | `abrirRevertirUltimoCambio` | 2654; Reversion.js:78 | Confirmación/reversión | Localizada |

Orden real: Analizar → Navegar y editar → Crear y gestionar datos. No hay separadores; la agrupación depende totalmente de submenús.

### F02.2 — Inventario de entradas UX

| Necesidad | Entrada UI | Archivo servidor | Función | HTML | Datos consultados | Escritura posible | Retorno/cierre | Estado |
|---|---|---|---|---|---|---|---|---|
| Entrada al sistema | Menú Taller de Producción | Formularios.js | `onOpen` | — | — | No aparente | Menú persistente | Estático localizado |
| Atención inmediata | Panel operativo | DashboardService.js | `abrirPanelOperativo` | PanelOperativo | tareas/alertas operativas | No localizada en apertura | Sidebar cerrable | Flujo remoto no verificado |
| Jerarquía de campaña | Gestión campaña | PanelCampanaService.js | `abrirPanelCampana` | PanelCampana | campaña→tareas | Sí, abre altas/ediciones | Navegación encadenada | Parcial estático |
| Personas/equipos | Panel personas | PanelPersonasService.js | `abrirPanelPersonas` | PanelPersonas | PERSONA_EQUIPO/relaciones | Abre edición/alta | Sidebar | Parcial estático |
| Espacios/recursos | Panel recursos | PanelRecursosService.js | `abrirPanelRecursos` | PanelRecursos | RECURSO/ubicación | Abre edición/alta | Sidebar | Parcial estático |
| Tiempo/ejecución | Gantt | DesviacionService.js | `abrirGanttPlanReal` | GanttPlanReal | campañas, productos, tareas, horario | Abre edición/fichas; exporta | Modal/cross-navegación | Parcial estático |
| Trabajo en curso | Kanban | KanbanService.js | `abrirKanban` | KanbanOperativo | Tarea/Proceso/Incidencia | Abre edición/ficha | Modal | Parcial estático |
| Búsqueda operativa | Listado filtrable | ListadoFiltrableService.js | `abrirListadoFiltrable` | ListadoFiltrable | incidencias/decisiones/documentos | Abre destino | Sidebar | Parcial estático |
| Informes | Informes | ReportService.js | `abrirInformes` | InformeGenerico | múltiples entidades | Exportación | Sidebar | Parcial estático |
| Calidad de datos | Verificar integridad | IntegrityService.js | `abrirIntegridad` | IntegridadReporte | todas las hojas configuradas | No en reporte; análisis | Sidebar | Parcial estático |
| Auditoría | Historial | Formularios.js | `abrirHistorialAdmin` | — | 91_HISTORIAL | Edición directa posible por hoja, no evaluada | Cambia hoja activa | Parcial estático |
| Consulta de entidad | Fichas | Ficha*Service.js | `abrirFicha*` | Ficha*.html | entidad y relaciones | Abre edición/altas/exporta | Modal y retornos a ficha | Parcial estático |
| Alta/edición | Formulario genérico | Formularios.js | `abrirFormularioCrear_`/edición | FormularioGenerico | configuración, catálogos, registro | Sí: guardar/desactivar | Cancelar/cerrar/volver | Parcial estático |
| Elegir registro | Selector | Formularios.js | `abrirSelectorConAccion_` | SelectorRegistro | lista de entidad | No; abre acción | Cancelar/cerrar | Parcial estático |
| Catálogos | Gestión catálogos | GestionCatalogos.js | `abrirCatalogosAdmin` | GestionCatalogo | 90_CONFIGURACION | Sí | Botón Cerrar | Parcial estático |
| Confirmación | Recepción/reversión/desactivación | PedidoRecepcion.js/Reversion.js/FormularioGenerico | varias | ModalConfirmar/controles propios | entidad afectada | Sí | aceptar/cancelar | Parcial estático |

### F02.3 — Trazado de los tres polos

| Polo | Evaluación | Evidencia | Diferencia frente al manual | Estado |
|---|---|---|---|---|
| 📊 Analizar | Alineado en sus siete entradas | Formularios.js:2510-2517 | Coincide con panel, informes, Gantt, Kanban, listado, integridad e historial | VERIFICADO estático |
| 🌳 Navegar y editar | Alineado, pero profundo | Formularios.js:2520-2573 | El código expone cinco submenús y 38 accesos; el manual los resume | VERIFICADO estático; fricción inferida |
| ➕ Crear y gestionar datos | Parcialmente alineado y muy amplio | Formularios.js:2576-2655 | Ocho submenús mezclan creación, edición, ficha de convocatoria, importación, protección y reversión | Situación discutible |
| Convocatorias | Situada en Crear aunque incluye ficha/búsqueda | Formularios.js:2635-2639 | El manual la presenta como extensión; su ficha sería conceptualmente Navegar | Polo discutible |
| Presupuesto/Competencias/Impacto | Crear y editar en el mismo submenú | 2617-2644 | Rompe parcialmente separación crear/editar establecida por los polos | Parcialmente alineada |
| Administración por hojas | Acceso directo a hojas | 2647-2654; Formularios.js:2968-2984 | No forma parte del recorrido funcional de ocho preguntas y expone términos `STG_*` | No descrita con este detalle |
| Menús descritos no localizados | Ninguno de los tres polos | onOpen completo 2506-2657 | Todos los polos del manual están implementados | VERIFICADO estático |

### F02.4 — Trazado de las ocho preguntas

| Pregunta | Necesidad | Entidades | Entrada real | Funciones | Cobertura estática | Fricción observada | Estado |
|---|---|---|---|---|---|---|---|
| Qué | Jerarquía productiva | CAMPANA, PROYECTO, PRODUCTO, PROCESO, TAREA, PROYECTO_PRODUCTO | Panel campaña, ficha producto, editar/crear | `abrirPanelCampana`, `abrirFichaProductoBuscar`, wrappers formularios | Función+menú+HTML localizados | Ocho opciones en submenú y nombres de relación técnicos | Flujo completo NO VERIFICADO |
| Quién | Responsabilidad/equipos | PERSONA_EQUIPO, EQUIPO_MIEMBRO, TAREA_RESPONSABLE, ASIGNACION, competencias | Panel personas, ficha, editar/crear relaciones | PanelPersonasService, FichaPersonaEquipoService, Formularios | Función+menú+HTML localizados | Competencias separadas en Crear; relaciones usan nombres de entidad | Flujo completo NO VERIFICADO |
| Dónde | Espacios/recursos | RECURSO, TAREA_RECURSO, HORARIO | Panel recursos, ficha, edición | PanelRecursosService/FichaRecursoService | Función+menú+HTML localizados | Recurso agrupa espacio/herramienta; horario aparece en varios contextos | Flujo completo NO VERIFICADO |
| Con qué | Materiales, herramientas, proveedores | MATERIAL, PROVEEDOR y relaciones/compra | Submenú Materiales y proveedores; movimientos | fichas, formularios, PedidoRecepcion | Menú+interfaces localizados | Doce entradas de edición; elevada carga nominal | Flujo completo NO VERIFICADO |
| Cuándo | Plan, real y capacidad | fechas, HORARIO, EJECUCION_TAREA | Gantt; edición de horario/ejecución | DesviacionService, Formularios | Menú+HTML+funciones localizados | Entrada principal clara; edición temporal distribuida | Comportamiento remoto NO VERIFICADO |
| Cómo | Fases, capacidad, cuellos | tareas/procesos/horarios | Gantt e informes | DesviacionService, ReportService | Entradas accesibles | Comparte entrada con Cuándo; alcance interno amplio | Resultado analítico NO VERIFICADO |
| Cuánto | Costes/presupuesto/financiación | PRESUPUESTO, FUENTE_FINANCIACION, COSTE | Crear/editar presupuesto; Informes | CosteService, ReportService, Formularios | Funciones+menú+HTML localizados | Crear y editar están en polo Crear; informe específico se selecciona después | Cálculos NO VERIFICADOS |
| Por qué | Impacto/evidencia | ETIQUETA_IMPACTO y datos relacionados | Impacto; Informes | EvidenciaSocialService, ReportService, Formularios | Entrada de mantenimiento+informe localizados | No hay ficha de impacto; acceso analítico indirecto por Informes | Evidencia calculada NO VERIFICADA |

Ninguna pregunta se declara “resuelta” por mera existencia de código. Todas conservan `flujo completo`, datos reales y comportamiento remoto como **NO VERIFICADOS**.

### F02.5 — Mensajes y recuperación

| Mensaje o patrón | Archivo y línea | Contexto | Comprensible | Accionable | Riesgo UX | Estado |
|---|---|---|---|---|---|---|
| `Cargando...` / estados equivalentes | Fichas: p.ej. FichaMaterial.html:34; Gantt:157; Integridad:14 | Espera asíncrona | Sí | No requiere acción | Bajo; algunos sin timeout | Localizado |
| `Error: ` + mensaje servidor | fichas p.ej. FichaProducto.html:90-91; Gantt:415-416; Kanban:85-86 | failureHandler | Parcial | Depende del error | Puede exponer mensaje técnico/ID | WARN |
| “Faltan campos obligatorios: …” | FormularioGenerico.html:757-759 | Validación cliente | Sí | Sí | Bajo | Localizado |
| “No se puede desactivar: tiene dependientes activos” | FormularioGenerico.html:113 y detalle posterior | Prevención de pérdida | Sí | Parcial; muestra dependientes | Bajo/medio | Localizado |
| Cancelar y volver / Cerrar sin guardar | FormularioGenerico.html:75,665-684 | Salida reversible | Sí | Sí | Bajo | Localizado |
| Errores `ERROR_HORARIO_*` | Formularios.js:1429-1442 | Validación servidor enviada al cliente | Mensaje posterior comprensible; prefijo técnico | Sí | Medio por código técnico visible | WARN |
| “No existe ningún registro con el ID …” | servicios de fichas y Formularios.js:2755/2900 | Registro ausente | Sí, pero técnico | Parcial | Expone ID en vez de nombre | WARN |
| “No hay formulario disponible para la entidad …” | Formularios.js:2687 | Configuración faltante | Técnica | No para usuario final | Alto si llega a UI | WARN |
| Informe vacío: “Prueba de nuevo…” | InformeGenerico.html:359 | Respuesta vacía | Sí | Sí; ofrece reintento manual | Medio | Localizado |
| Integridad puede tardar 15–30 segundos | IntegridadReporte.html:14 | Estado de carga | Sí | Sí, ajusta expectativa | Bajo | Localizado |
| Confirmaciones de importación YES/NO | ImportacionMasiva.js:524,589 | Escritura masiva | Sí | Sí | Bajo; no ejecutado | Localizado |
| `console.log` / `Logger.log` | Ids.js, instaladores, tests, HistorialService.js:190 | Diagnóstico/desarrollo | No visible normalmente | No | Riesgo si se reutiliza como feedback | WARN |
| Modal propio sustituye alert/confirm nativos | Estilos.html:67; FormularioGenerico.html | Confirmación consistente | Sí | Sí | Bajo | Localizado |

No se localizó un mecanismo general automático de reintento; predominan reintento manual y mensajes `failureHandler`. El cliente suele mostrar directamente `error.message`, por lo que los mensajes técnicos del servidor pueden llegar sin traducción.

### F02.6 — Referencias y dependencias de `00_INICIO`

- `src/Código.js:2` obtiene `00_INICIO` desde el libro activo.
- `src/Código.js:10` escribe un resultado en `A1` y `src/Código.js:11` escribe fecha/hora en `A2`.
- En F02 no se determina qué función produce `out` ni bajo qué error se ejecuta: diagnóstico causal reservado a F03.
- `src/Formularios.js:2978` usa `setActiveSheet(hoja)` para accesos administrativos, sin referencia directa a `00_INICIO` en esa función localizada.
- `src/EdicionDirecta.js:22` registra `EDICION_DIRECTA_DETECTADA` en historial; no escribe directamente en `00_INICIO`.
- `src/Tests_Repository.js:7460-7474` prueba el registro de `EDICION_DIRECTA_DETECTADA`; se identifica como dependencia potencial, no como causa demostrada de escritura en portada.
- No se localizaron otras referencias literales a `00_INICIO` en `src` durante F02.

### Diferencias frente al manual

- Los tres polos y su orden coinciden con el manual.
- El menú real de Navegar contiene 38 accesos agrupados en cinco submenús; el manual abstrae esta profundidad.
- Crear y gestionar datos incluye también edición, consulta de convocatoria, protección, importación y reversión. La frontera intención/administración es menos pura que la filosofía descrita.
- El menú expone nombres técnicos de relaciones (`Proyecto-Producto`, `Tarea-Recurso`, `STG_*`) que requieren conocer el modelo.
- Convocatorias aparece bajo Crear aunque incorpora ficha y edición.
- No hay separadores internos; la jerarquía depende de ocho submenús en el tercer polo.

### Hallazgos, riesgos y aspectos no verificados

- **VERIFICADO estático:** una única raíz de menú, tres polos implementados y funciones asociadas localizadas.
- **WARN:** el tercer polo agrupa creación, edición y administración, reduciendo la separación por intención.
- **WARN:** profundidad y cantidad de entradas elevadas, especialmente Materiales/proveedores y Crear/gestionar.
- **WARN:** etiquetas técnicas e IDs pueden alcanzar la interfaz y elevar la carga cognitiva.
- **WARN:** mensajes de error se propagan frecuentemente desde `error.message` sin capa uniforme de traducción.
- **PROPUESTA para fases posteriores:** medir tareas frecuentes y búsqueda de opciones antes de reorganizar; no se modifica el menú en auditoría.
- **NO VERIFICADO:** render real, orden efectivo en Google Sheets, accesibilidad por teclado, contraste, permisos, tiempos, datos reales, éxito de escritura, retorno entre modales/sidebars y comportamiento del Sheet remoto.

### Resultado y gate

**Resultado F02: VERIFICADO estático con WARN; comportamiento real NO VERIFICADO.** Se reconstruyó el mapa UX implementado sin ejecutar el sistema. No se inició F03.

**Gate F02 pendiente de aprobación humana.**

Siguiente prueba propuesta: **F03 — Diagnóstico estático de `00_INICIO`**, siguiendo `Código.js`, `myFunction`, `ejecutarSuitePaso305a310`, `pruebaPaso307_OnEditRegistraEdicionDirecta`, excepciones y `EDICION_DIRECTA_DETECTADA`, sin ejecutar ni reparar.

## F03 — Diagnóstico estático de 00_INICIO

### Alcance y trazabilidad inicial

Análisis estático de `myFunction` → suite 305–310 → prueba 307 → `onEdit` → `registrarHistorial` → lectura de `91_HISTORIAL`. No se ejecutó ni reparó código. Roadmap inicial: 57.804 bytes, SHA-256 `1ecab5d4a108e5d26695a600898b5a0613f797211704fef111e44979ad2563db`. Estado Git inicial: roadmap modificado y manual no rastreado. Manual: `a18332565c408e9f283df26201c1a6745d1699ce9fd557d709d980225321c1fc`.

Hashes implicados: `Código.js` `c5bb093173f04ab7f7226f433cc3cbcd3a8157df68687d693175d3fd4690456a`; `EdicionDirecta.js` `65ef422bf279a0506b890a2cad77a1f048b7590f30333f31bf01eb8e6232db64`; `HistorialService.js` `a66deababd7a1bd1b6522a0a9c76af7df397e655037446ecbfa0b577a63f2d71`; `Tests_Repository.js` `d31821d51b7ee80616dd9372e3e64be89d141e45e51fa227b58704d8f3082eb6`; `Tests_Repository2.js` `857d3e68f8911369cbdb6fc68f072f4aaddaf8108196d22aaeed9b4e5c7a912d`; `Repository.js` `bc8f19f506e870ddbcde507efa0b31d90c69ee445b0e93d722ee731006b5d0cb`.

### F03.1 — Cadena de entrada

| Paso | Archivo y línea | Función | Entrada | Acción | Salida | Propaga/captura error |
|---|---|---|---|---|---|---|
| 1 | Código.js:1-2 | `myFunction` | Ejecución no determinada | Obtiene `00_INICIO` | Hoja | Ausencia no capturada |
| 2 | Código.js:4-5 | `myFunction` | — | Ejecuta suite 305–310 | — | `try` captura fallo |
| 3a | Código.js:6 | `myFunction` | Suite completa | Asigna `MYFN_SUITE_305_310_OK` | Texto OK | — |
| 3b | Código.js:7-8 | `myFunction` | Excepción | Concatena mensaje y stack | Texto ERROR+stack | Captura; no relanza |
| 4 | Código.js:10 | `myFunction` | Texto | Escribe A1 | Mensaje persistente | Fuera del try |
| 5 | Código.js:11 | `myFunction` | Fecha | Escribe A2 | Marca temporal | Fuera del try |

**VERIFICADO:** éxito y error terminan en `00_INICIO!A1`; A2 recibe fecha/hora. El error incluye stack y nombres internos. Si la hoja o A1/A2 fallan, esa excepción se propaga porque la escritura queda fuera del `try/catch`.

### F03.2 — Suite 305–310

Orden en `Tests_Repository.js:7584-7591`: 305 protege hojas; 306 exige idempotencia; 307 simula `onEdit`; 308 prueba reversión y doble rechazo; 309 prueba rechazos; 310 abre formularios Material y Persona/Equipo.

| Aspecto | Evidencia | Diagnóstico | Estado |
|---|---|---|---|
| Preparación | Proteccion.js:6-23 | Incluye entidades, 90_CONFIGURACION y 91_HISTORIAL; `warningOnly` | VERIFICADO |
| Dependencia 306 | Tests_Repository.js:7447-7456 | Depende de 305 | VERIFICADO |
| Dependencia 307 | 7459-7477 | Requiere Campañas, Historial, encabezados y servicios | VERIFICADO |
| Limpieza 307 | función completa | No hay finally ni eliminación del historial creado | VERIFICADO |
| Detención | suite sin try/finally global | Fallo en 307 impide 308–310 y log final | VERIFICADO |
| Restauración | 305/306 | No restauran protecciones previas | VERIFICADO |
| Limpieza 308/309 | 7481-7522; 7527-7559 | Sí usan finally | VERIFICADO |
| Fixtures reales | hojas activas | Estado remoto no observado | NO VERIFICADO |

La suite no es aislada: altera protecciones persistentemente y 307 usa la última campaña real.

### F03.3 — Prueba 307 y precondiciones

Obtiene `01_CAMPANAS`; exige dos filas; selecciona última fila/columna 3 sin modificar la celda; lee el ID de columna 1; crea `{range, oldValue, value}`; llama directamente a `onEdit`; lee todo Historial; filtra por acción exacta, entidad `CAMPANA` e ID; falla si no hay coincidencia. No comprueba que la coincidencia sea nueva ni limpia el historial generado.

| Precondición | Evidencia | Se prepara | Se valida | Riesgo si falta | Estado |
|---|---|---:|---:|---|---|
| Existe 01_CAMPANAS | 7461 | No | No | Hoja nula | NO VERIFICADO remoto |
| Hay datos | 7462-7465 | No | Sí | Fallo explícito | Localizada |
| Última fila tiene ID | 7467 | No | No | onEdit usa FILA_n; filtro busca vacío | Riesgo estático |
| Evento tiene range | 7468 | Sí | onEdit línea 9 | Salida temprana | Cumplida |
| Hoja protegible | Ids.js:2-4; Proteccion.js:6-9 | Sí por rango | onEdit línea 12 | Salida temprana | Cumplida en código |
| Fila no es cabecera | últimaFila≥2 | Sí | onEdit línea 13 | Salida temprana | Cumplida |
| oldValue/value | 7468 | Sí | No obligatorios | Ninguno para disparo | Cumplida |
| Existe Historial | HistorialService.js:29-32 | No | registrar/listar lanzan | onEdit silencia registrar | NO VERIFICADO remoto |
| Encabezados exactos | HistorialService.js:101-113 | No | No | Fila no mapea al filtro | NO VERIFICADO remoto |
| Registrar no falla | EdicionDirecta.js:22-26 | No | No | Excepción silenciada | Riesgo VERIFICADO |
| Coincidencia nueva | 7470-7472 | No | No | Falso positivo antiguo | Riesgo VERIFICADO |
| Limpieza P307 | función completa | No | No | Acumulación | Ausente, VERIFICADO |

### F03.4 — Contrato de onEdit

`EdicionDirecta.js:7-34` sale si falta `e.range`, la hoja no está en `hojasProtegiblesMVP_` o la fila es 1. No filtra columna ni exige `value/oldValue`. Deriva la entidad desde `ENTIDADES_MVP`, lee ID de columna 1 o usa `FILA_n`, llama a `registrarHistorial` con acción `EDICION_DIRECTA_DETECTADA`, origen `SCRIPT`, resultado `ADVERTENCIA`, y muestra toast. Todo está dentro de un `try/catch`: cualquier excepción se reduce a `console.error` y no se propaga.

**VERIFICADO:** el evento de la prueba cumple el contrato visible. No simula una escritura real, pero `onEdit` no la exige.

### F03.5 — Historial

`registrarHistorial` usa `91_HISTORIAL`, valida origen, genera ID `HIS-nnnn`, obtiene usuario efectivo, crea antes/después, añade 15 columnas y hace flush. Esquema esperado: `ID_HISTORIAL, TIMESTAMP, CORRELATION_ID, USUARIO, ACCION, ENTIDAD, REGISTRO_ID, ORIGEN, ANTES_JSON, DESPUES_JSON, RESULTADO, CODIGO, ERROR, ES_PRUEBA, PRUEBA_ID`.

Acción, entidad e ID se escriben sin normalización incompatible con el filtro. `listarHistorialPorOrigen(null,true)` usa encabezados como claves, no filtra origen y sí incluye pruebas. No filtra fecha, usuario ni “último”; no usa caché, locks, propiedades o backups. La migración 12→15 columnas existe, pero su ejecución y el esquema remoto son **NO VERIFICADOS**.

### F03.6 — Hipótesis causales

| ID | Hipótesis | Evidencia favorable | Evidencia contraria | Prueba necesaria | Clasificación |
|---|---|---|---|---|---|
| H1 | El error llega a portada por diseño de myFunction | Código.js:4-10 | Ninguna | Ninguna | VERIFICADO |
| H2 | registrarHistorial lanza y onEdit silencia | catch global; prueba solo ve ausencia | Excepción concreta desconocida | Capturar error en fixture controlado | INFERENCIA fuerte |
| H3 | Encabezados/esquema remoto divergen | lector depende de nombres; hay migración | posiciones clave son compatibles si migró | Inspección autorizada | NO VERIFICADO |
| H4 | 91_HISTORIAL no existe | es requisito | otras fases lo usan aparentemente | Inspección autorizada | NO VERIFICADO |
| H5 | Evento incumple contrato | — | range/hoja/fila compatibles | Ninguna | DESCARTADA |
| H6 | Protección warning-only bloquea append | ocurre antes de 307 | warning-only no es bloqueo estricto | Prueba controlada | INFERENCIA débil |
| H7 | ID de última campaña vacío | test no lo valida | datos suelen tener ID | Inspeccionar fixture | NO VERIFICADO |
| H8 | Fila se escribe pero lector no la mapea | depende de encabezados | esquema documentado coincide | Leer encabezados/fila | NO VERIFICADO |

No se declara causa raíz funcional verificada. El defecto de observabilidad —excepción silenciada— sí está demostrado.

### F03.7 — Impacto UX

1. Causa UX verificada: `myFunction` usa A1:A2 como consola persistente y escribe stack.
2. Fallo 307 potencial: historial falla o diverge, pero `onEdit` oculta la excepción original; evento compatible.
3. Riesgo de portada: mezcla orientación operativa con diagnóstico técnico.
4. Persistencia: el mensaje puede quedar indefinidamente; A2 solo fecha la última ejecución que llegó a escribir.
5. Exposición: stack, funciones, pasos, entidades y líneas internas aparecen sin sanitización.

El defecto UX y el posible defecto del trigger son problemas separados.

### Propuestas sin implementación

| Alternativa | Archivos candidatos | Cambio conceptual | Riesgo | Prueba | Reversión |
|---|---|---|---|---|---|
| Reparación mínima | EdicionDirecta.js; Tests_Repository.js | Hacer observable el error en modo prueba; validar ID/encabezados/fila nueva y limpiar en finally | Propagar en uso real sería indeseable | Fixture aislado de 307 | Revertir cambios localizados |
| Aislamiento técnico | Código.js; canal técnico existente | No escribir stack en portada; registrar detalle fuera y mostrar estado neutro | Menos diagnóstico inmediato | Simular éxito/fallo y comprobar portada | Restaurar A1/A2 actual |
| Mejora posterior portada | Código.js y portada | Reservar portada a atención/estado y referencia segura al diagnóstico | Requiere decisión UX | Comprensión, vigencia y recuperación | Restaurar plantilla previa |

### Aspectos no verificados, resultado y gate

**NO VERIFICADO:** contenido real A1/A2; encabezados/datos/protecciones de Historial; existencia de hojas; permisos/usuario; logs; última campaña; migración; excepción concreta; comportamiento remoto.

**Resultado F03:** cadena UX a `00_INICIO` **VERIFICADA**; evento 307 **COMPATIBLE**; excepciones silenciadas **VERIFICADAS**; causa funcional concreta de ausencia **NO VERIFICADA**.

**Gate F03 pendiente de aprobación humana. No se ejecutó ni reparó nada y no se inició F04.**

Siguiente paso propuesto: F04 — Arquitectura de información, solo tras gate. Cualquier prueba dinámica o reparación de 307 requiere autorización separada.

## F04 — Arquitectura de información

### Alcance, método y trazabilidad inicial

Auditoría estática de modelo mental, profundidad, encontrabilidad, taxonomía, separación de intenciones, navegación y divulgación progresiva. Se contrastaron el menú real de F02, el manual, `Formularios.js`, `FormularioGenerico.html`, `SelectorRegistro.html`, paneles, fichas, Gantt e informes. No se ejecutó el sistema.

Roadmap inicial: 67.632 bytes; SHA-256 `6df55a52826e9545fa5893c39e502666db9b94910fa42721cfd19571588d7fff`. Estado Git inicial: roadmap modificado y manual no rastreado. Manual: `a18332565c408e9f283df26201c1a6745d1699ce9fd557d709d980225321c1fc`.

Hashes principales: `Formularios.js` `14e495f83f15708f86f5a05e57d46438fc81aca71f5d37331ac432dc843ea2de`; `FormularioGenerico.html` `a9e53541d3326dadd7b71e8e907d4104471a44b317bdc923bf4679428805a4f5`; `SelectorRegistro.html` `04e63894fdecf4ef870b4f3614e89c65f4977864beea02b70672b19484bf78a1`; `PanelCampana.html` `2c16ab26c648d1bd52db18dd6a08cdfac7bf1e3f9f09826caaab06855ff443e7`; `PanelPersonas.html` `57303b3934f2c17c5086019e6a5cd032b421b9f2969a56c1c9e9f0a501d6d41d`; `PanelRecursos.html` `62ed3751de9b5d8cc28bc2c8494eedf1a1709c9a161ad1b262e6a099d6fb647b`; `PanelOperativo.html` `662e10bd24bac1f66c4e7f313ce9457953e3ab8418138d65f9e1964dd50d80da`; `FichaProducto.html` `14b9a8e0b56231c8e5b0269cabd6f0019a836b18b016d5208f005c6fdc4e0404`; `FichaPersonaEquipo.html` `b0b8cf56eb0e1b4f89ccd98edf5dd6bbe656d14636ec9378f0fcf5cae496f550`; `FichaMaterial.html` `bbc543df1d6571608d41704c71ab3b91a95051a311612c2649f4fc225f0e1397`; `FichaProveedor.html` `a8917f0b821d6cd7da0f955cb31b4fc340a64f7ecfd0aa3984bab8c046e71fd5`; `GanttPlanReal.html` `0188bfb8e85883ad6a5071583912a08898ba1bd2ed370adf3e072afee7f1fbcf`; `InformeGenerico.html` `340dbdc5f5ffa7f0aa042a5355a82fea1c3a85f97b68b1bfd1c374c46c36315b`.

### F04.1 — Modelo mental

| Área | Modelo dominante | Evidencia | Consistencia | Fricción | Estado |
|---|---|---|---|---|---|
| Manual | Intención mediante tres polos; preguntas como marco | MANUAL, secciones 2-3 | Alta conceptualmente | Abstrae detalle operativo | VERIFICADO documental |
| Primer nivel menú | Intención: analizar/navegar/crear | Formularios.js:2508-2576 | Alta con manual | “Crear” contiene más que crear | VERIFICADO estático |
| Analizar | Tipo de tarea/resultado | 2510-2517 | Alta | Informes agrupa múltiples preguntas | VERIFICADO |
| Navegar | Dominio/entidad y después operación | 2520-2573 | Media-alta | Requiere identificar el dominio correcto | VERIFICADO |
| Crear/gestionar | Tipo de operación + dominio + administración | 2576-2655 | Baja-media | Mezcla alta, edición, consulta, confirmación, reparación | VERIFICADO |
| Formularios | Entidad y esquema de datos | ESQUEMAS_FORMULARIO_MVP | Alta técnicamente | Orden del modelo puede dominar la tarea humana | INFERENCIA estática |
| Administración | Tecnología/estructura interna | STG_*, protección, hojas; 2647-2654 | Coherente para administrador | Fricción/riesgo para perfil operativo | VERIFICADO |

La coherencia conceptual del manual es superior a la implementación detallada: el primer nivel conserva la intención, pero niveles posteriores cambian entre dominio, entidad, operación y administración.

### F04.2 — Profundidad y densidad

| Ruta de menú | Profundidad | Opciones | Tipo de acciones | Riesgo cognitivo | Evidencia |
|---|---:|---:|---|---|---|
| Taller→Analizar | 3 | 7 | Consulta/auditoría | Bajo relativo: etiquetas diferenciadas | 2510-2517 |
| Taller→Navegar→Producción | 4 | 8 | Panel, ficha, seis ediciones | Medio: repetición “Editar” y relación técnica | 2521-2530 |
| Taller→Navegar→Personas | 4 | 5 | Panel, ficha, editar | Bajo-medio | 2532-2538 |
| Taller→Navegar→Recursos | 4 | 5 | Panel, ficha, editar/asignar | Bajo-medio | 2540-2546 |
| Taller→Navegar→Materiales | 4 | 12 | Fichas y diez ediciones | Alto interno: mayor densidad del polo | 2548-2561 |
| Taller→Navegar→Seguimiento | 4 | 8 | Ficha y siete ediciones | Medio-alto: relaciones genéricas | 2563-2572 |
| Taller→Crear→Nuevo registro | 4 | 15 | Altas | Alto relativo: lista larga de entidades | 2577-2593 |
| Taller→Crear→Nueva relación | 4 | 13 | Relaciones/asignaciones | Alto: etiquetas técnicas y similares | 2595-2609 |
| Taller→Crear→Movimientos | 4 | 3 | Confirmar/crear/recalcular | Medio: mezcla operación y cálculo | 2611-2615 |
| Taller→Crear→Presupuesto | 4 | 6 | Crear+editar | Medio: rompe separación por intención | 2617-2624 |
| Taller→Crear→Competencias | 4 | 6 | Crear+editar+relacionar | Medio | 2626-2633 |
| Taller→Crear→Convocatorias | 4 | 3 | Consultar+crear+editar | Medio; ficha dentro de Crear | 2635-2639 |
| Taller→Crear→Impacto | 4 | 2 | Crear+editar | Bajo local | 2641-2644 |
| Taller→Crear→Administración | 4 | 7 | Hojas, protección, importación, reversión | Alto por riesgo y perfil distinto | 2646-2654 |

Comparación interna: Analizar ofrece siete intenciones distinguibles; Materiales, Nuevo registro y Nueva relación concentran entre 12 y 15 alternativas de forma similar, muchas con nombres de modelo. El riesgo no se basa en un límite universal, sino en esta diferencia y en la semejanza nominal entre opciones.

### F04.3 — Encontrabilidad: simulaciones estáticas

| Objetivo | Entrada esperable | Ruta implementada | Decisiones necesarias | Cambio de contexto | Fricción | Estado |
|---|---|---|---:|---:|---|---|
| Atención hoy | Analizar | Analizar→Panel operativo | 1 | 0; sidebar | Baja | SIMULACIÓN ESTÁTICA |
| Proyecto conocido | Navegar producción | Navegar→jerarquía→Gestión campaña; no ficha proyecto | 2+ campaña | 1 | Media: proyecto depende de campaña | SIMULACIÓN ESTÁTICA |
| Editar producto | Navegar | Navegar→jerarquía→Editar producto→selector | 3 | 2 modal/selector | Media | SIMULACIÓN ESTÁTICA |
| Crear tarea en proceso | Desde proceso actual | Crear→Nuevo registro→Nueva tarea o creación encadenada | 3 o contextual | 1 | Baja si encadenada; media desde menú | SIMULACIÓN ESTÁTICA |
| Registrar incidencia | Crear | Crear→Nuevo registro→Nueva incidencia | 3 | 1 | Baja | SIMULACIÓN ESTÁTICA |
| Consultar persona/equipo | Navegar | Navegar→Personas→Ficha buscar | 3 | 2 | Baja-media | SIMULACIÓN ESTÁTICA |
| Consultar material/stock | Navegar | Navegar→Materiales→Ficha material | 3 entre 12 opciones | 2 | Media | SIMULACIÓN ESTÁTICA |
| Recepción/movimiento | Operación | Crear→Movimientos→Confirmar recepción o Movimiento | 3 | 1 | Media: dos conceptos próximos | SIMULACIÓN ESTÁTICA |
| Planificación temporal | Analizar | Analizar→Gantt | 2 | 1 modal | Baja | SIMULACIÓN ESTÁTICA |
| Informe campaña | Analizar | Analizar→Informes→selección interna | 2+ filtro | 1 sidebar | Baja-media | SIMULACIÓN ESTÁTICA |

### F04.4 — Taxonomía y etiquetas problemáticas

| Etiqueta actual | Ubicación | Problema | Interpretación probable | Etiqueta comprensible propuesta | Prioridad |
|---|---|---|---|---|---|
| Editar Proyecto-Producto | Navegar/Producción | Relación N:M técnica | Cambiar participación de producto en proyecto | Editar producto asignado al proyecto | P1 PROPUESTA |
| Editar Tarea-Responsable | Navegar/Personas | Entidad técnica | Cambiar responsable de una tarea | Cambiar responsables de una tarea | P1 PROPUESTA |
| Editar Tarea-Recurso | Navegar/Recursos | Entidad técnica | Cambiar recurso asignado | Cambiar recursos de una tarea | P1 PROPUESTA |
| Pedido-Línea / Recepción-Línea | Materiales | Terminología de tabla | Editar contenido del pedido/recepción | Editar materiales del pedido/recepción | P1 PROPUESTA |
| Relación / dependencia (grafo, nueva) | Nueva relación | “Grafo” es interno/abstracto | Conectar registros dependientes | Añadir una dependencia | P2 PROPUESTA |
| Vínculo genérico (nuevo) | Nueva relación | Ambiguo | Relacionar dos registros | Vincular dos registros | P2 PROPUESTA |
| Asignación (Campaña/Proyecto/…) | Nueva relación | Etiqueta muy larga | Asignar persona/equipo a un ámbito | Asignar persona o equipo | P2 PROPUESTA |
| Importación masiva … (STG_*) | Administración | Prefijo técnico | Cargar datos preparados | Importar campaña / Importar recursos y personas | P1 PROPUESTA |
| Personas y equipos (hoja) | Administración | Expone mecanismo, no objetivo | Abrir datos maestros | Administrar personas y equipos | P2 PROPUESTA |
| Mantenimiento (revertir cambio) | Administración | Dos conceptos; riesgo poco explícito | Deshacer último cambio | Revertir el último cambio registrado | P1 PROPUESTA |
| Gestión de campaña (vista global) | Navegar | “Gestión” y “vista” compiten | Explorar árbol de campaña | Ver campaña completa | P2 PROPUESTA |
| Ver personas y equipo (jerarquía) | Navegar | Singular/plural inconsistente | Explorar equipos y personas | Ver personas y equipos | P3 PROPUESTA |

Los selectores muestran internamente etiquetas `ID - nombre` (`Formularios.js:138-149` y `FormularioGenerico.html:174-175`); ayuda a desambiguar, pero mantiene el ID visible como parte principal.

### F04.5 — Separación de intenciones

| Intención | Ubicación actual | Evaluación |
|---|---|---|
| Consultar | Analizar y fichas en Navegar; ficha Convocatoria en Crear | Parcialmente consistente |
| Localizar | Selectores tras acciones Editar/Ficha | Consistente, aunque añade un paso modal |
| Trabajar/editar | Navegar, salvo presupuesto/competencias/convocatoria/impacto en Crear | Inconsistente |
| Crear | Nuevo registro y relaciones | Consistente en núcleo |
| Relacionar | Nueva relación; algunas ediciones en Navegar | Consistente por dirección crear/editar |
| Confirmar operación | Movimientos | Correctamente diferenciada, pero bajo polo Crear |
| Administrar | Catálogos y administración | Agrupada, pero comparte polo con altas cotidianas |
| Auditar | Analizar→Integridad/Historial | Consistente |
| Reparar/revertir | Crear→Administración | Riesgo alto junto a tareas normales |

**VERIFICADO:** existe consulta dentro de Crear (ficha convocatoria), edición dentro de Crear, y administración/reversión/importación junto a altas normales. `STG_*` es visible en etiquetas operativas.

### F04.6 — Navegación entre pantallas

| Origen | Destino | Mecanismo | Conserva contexto | Retorno | Riesgo | Estado |
|---|---|---|---|---|---|---|
| Menú Editar | Selector→Formulario | modal y acción servidor | Entidad; luego ID | Cierre al libro | Paso adicional | Localizado |
| Ficha | Edición relacionada | `abrirEdicionConRetornoAFicha` | Sí: entidad/ID retorno | Vuelve a ficha | Bajo | Localizado |
| Formulario contextual | Crear hijo/hermano | retorno+prefill | Sí: padre/registro | `Cancelar y volver` | Bajo | Localizado |
| Formulario sin cambios | Cierre | Cancelar/confirmar “Cerrar sin guardar” | RETORNO si existe | Sí | Bajo | Localizado |
| Panel campaña | Crear/editar niveles | llamadas servidor | Campaña/contexto aparente | No verificado dinámico | Medio | Parcial estático |
| Gantt | Editar entidad/tarea | enlaces/chips | Pasa entidad e ID | Modal previo puede quedar/sustituirse | Solapamiento modal no verificado | Parcial |
| Gantt | Ficha producto/árbol campaña | enlaces internos | ID campaña/producto | Sin botón volver global localizado | Medio | Parcial |
| Selector | Acción | aceptar y `host.close` | Solo ID elegido | Cierra selector | Bajo | Localizado |
| Gestión catálogo | Libro | botón Cerrar | No | Cierra modal | Bajo | Localizado |

Las fichas y creación encadenada son la evidencia más clara de conservación de contexto. En accesos iniciados desde menú, el usuario suele volver al libro y reabrir el menú. La navegación usa IDs como payload y en algunos rótulos.

### F04.7 — Divulgación progresiva

- `FormularioGenerico.html` genera campos dentro de un contenedor continuo `#campos`; no se localizaron `fieldset`, `legend`, `details` o secciones semánticas de esenciales/planificación/ejecución/calidad/auditoría.
- Sí existe divulgación condicional por `visibleSi`, `ocultarAlCrear` y dependencias; por ejemplo coordinador solo para Equipo y campos de coste según modo. Esto reduce campos irrelevantes, pero no agrupa los relevantes que permanecen.
- Producto, Proceso, Tarea, Incidencia, Recurso, Documento, Asignación, Relación y Vínculo combinan identidad, jerarquía, planificación, responsabilidad, estado, relaciones o control en un mismo recorrido.
- Las relaciones complejas muestran varios selectores dependientes y etiquetas de tipo/registro. Se propone agrupar u ocultar bajo demanda, no eliminar campos.

### F04.8 — Hallazgos priorizados

| ID | Evidencia | Problema | Usuario afectado | Consecuencia | Severidad | Confianza |
|---|---|---|---|---|---|---|
| F04-H01 | Formularios.js:2576-2655 | Polo Crear mezcla ocho intenciones | Todo perfil | Dificulta predecir ubicación | P1 | Alta |
| F04-H02 | 2548-2561,2577-2609 | Submenús de 12–15 opciones similares | Operativo | Búsqueda lenta/selección errónea | P1 | Alta |
| F04-H03 | etiquetas relación/STG | Modelo de datos expuesto | Usuario no técnico | Comprensión y confianza menores | P1 | Alta |
| F04-H04 | Administración junto a altas | Protección/importación/reversión accesibles en mismo polo | Operativo/admin | Riesgo de acción administrativa accidental | P1 | Alta |
| F04-H05 | FormularioGenerico sin secciones | Conceptos heterogéneos en lista continua | Quien crea/edita | Carga y errores de omisión | P2 | Media |
| F04-H06 | Ficha convocatoria bajo Crear | Consulta situada en polo incorrecto | Gestor convocatorias | Encontrabilidad inconsistente | P2 | Alta |
| F04-H07 | Crear/editar presupuesto y competencias juntos | Separación crear/editar irregular | Gestión económica/equipos | Aprendizaje no transferible | P2 | Alta |
| F04-H08 | fichas/retorno/prefill | Contexto preservado en varios flujos | Operativo | Reduce repetición | P3 positivo | Alta |
| F04-H09 | ID - nombre | ID visible sistemáticamente | Todo perfil | Ruido, aunque desambigua | P2 | Alta |
| F04-H10 | acceso proyecto mediante campaña | No hay ficha/entrada directa de proyecto localizada | Coordinación | Paso adicional y dependencia de contexto | P2 | Media |

### Arquitectura objetivo mínima — PROPUESTA

Preserva las funciones existentes y ajusta agrupación/etiquetas, sin reescritura.

| Actual | Propuesta mínima | Acción |
|---|---|---|
| Analizar | Mantener; renombrar Integridad/Historial como “Calidad y auditoría” si se agrupan | Conservar accesos |
| Navegar y editar | Mantener dominios; incorporar ficha Convocatoria y todas las ediciones hoy dispersas | Mover accesos, no funciones |
| Crear y gestionar datos | Renombrar a Crear y registrar; conservar altas, relaciones y confirmaciones | Reducir mezcla |
| Presupuesto/Competencias/Impacto | Crear queda en Crear; editar pasa al dominio correspondiente en Navegar | Separar intención |
| Catálogos y administración | Polo/grupo administrativo separado al final | Aislar protección, STG, hojas y reversión |
| Relaciones técnicas | Etiquetas orientadas a acción | Mantener entidad subyacente |
| Portada inicial | Panel operativo como recorrido recomendado “qué requiere atención ahora” | No cambia función existente |
| Formularios extensos | Secciones: Esencial → Planificación → Ejecución → Calidad → Relaciones/Avanzado | Agrupar/plegar, sin eliminar campos |

Recorrido inicial recomendado: abrir Panel operativo; desde cada alerta navegar al panel/ficha pertinente; usar Navegar para localizar/editar; usar Crear y registrar solo al incorporar un hecho nuevo; reservar Administración a perfiles y tareas técnicas.

### Riesgos, no verificados, resultado y gate

- Reorganizar sin métricas reales podría empeorar hábitos existentes; validar recorridos frecuentes antes de mover.
- Aislar administración requiere gobernanza/perfiles aún diferidos; puede empezar solo como separación visual.
- Etiquetas más humanas deben preservar desambiguación de relaciones.
- **NO VERIFICADO:** frecuencia real, perfiles, permisos, tamaño visible de menús, render, teclado, lectura de etiquetas, solapamiento modal, retorno real, comprensión y datos remotos.

**Resultado F04:** arquitectura conceptualmente coherente en primer nivel, pero híbrida e inconsistente en niveles inferiores. Se identifican cuatro riesgos P1 de alta confianza: mezcla de intenciones, densidad, lenguaje técnico y administración no aislada. No se modificó el sistema.

**Gate F04 pendiente de aprobación humana. No se inició F05.**

Siguiente prueba propuesta: **F05 — Auditoría estática de formularios**, revisando orden, obligatoriedad, ayudas, valores por defecto, dependencias, validación, errores, duplicados, desactivación, teclado, foco, contraste y legibilidad deducible.

## F05 — Auditoría estática de formularios

### Alcance, método y trazabilidad inicial

Análisis estático de `FormularioGenerico.html`, `Formularios.js`, `Estilos.html`, `SelectorRegistro.html`, `ModalConfirmar.html`, `GestionCatalogo.html`, validación e inserción auxiliares. No se ejecutó HTML, Apps Script ni navegador.

Roadmap inicial: 84.616 bytes; SHA-256 `0937898bb1979f52b4ea5c1e9f45f3938574240eaa6e23a8c238d15897bf82ce`. Estado Git inicial: roadmap modificado y manual no rastreado. Manual: `a18332565c408e9f283df26201c1a6745d1699ce9fd557d709d980225321c1fc`.

Hashes: `FormularioGenerico.html` `a9e53541d3326dadd7b71e8e907d4104471a44b317bdc923bf4679428805a4f5`; `Formularios.js` `14e495f83f15708f86f5a05e57d46438fc81aca71f5d37331ac432dc843ea2de`; `Estilos.html` `2e3df759ede71610f7f4c1a91633bf6262c17d4969287f453f7ee0468cc1062e`; `SelectorRegistro.html` `04e63894fdecf4ef870b4f3614e89c65f4977864beea02b70672b19484bf78a1`; `ModalConfirmar.html` `dbc5c69c324007620c1e857ce28c8490ff6bbd05b41a3fc0cf1721ec88301afd`; `GestionCatalogo.html` `31f31f4d8c360a944eb68de3656009ba5da223da2dae03fa9972ca13d00471c0`; `Repository_InsertarRegistro.js` `c28502c4d93d245e66c6269f535dc59f7bb2ebb850e8a1372c57e44323d7ddd6`; `Validation.js` `6f88b5c5d29db911b32f1e97443a5e63265c41b9fa2c05d9018f99700f3a1aae`.

### F05.1 — Arquitectura del formulario común

| Etapa | Archivo y línea | Función | Entrada | Salida | Error gestionado | Estado |
|---|---|---|---|---|---|---|
| Menú/panel | Formularios.js:2579-2654 y componentes | wrappers `abrir*` | intención/entidad | función apertura | según llamador | Localizado |
| Apertura | Formularios.js:2666-2697 | crear/editar | entidad, ID, prefill, retorno | modal 420×520 | esquema inexistente | Localizado |
| Configuración | Formularios.js:263-1160 | `ESQUEMAS_FORMULARIO_MVP` | clave entidad | array campos | comprobada servidor | Localizado |
| Cargar esquema | 1162-1376 | `obtenerEsquemaFormulario` | entidad/ID | campos+opciones+valorActual | catálogo/FK/registro | Localizado |
| Render | FormularioGenerico.html:192-223,688-743 | `renderCampo`, `cargarEsquema` | esquema | DOM de controles | failureHandler global | Localizado |
| Relaciones | cliente:178-190,350-398; servidor:1200-1327 | FK/datalist/cascada | padre, entidad FK | ID oculto+etiqueta | failureHandler; vacío parcial | Localizado |
| Validación cliente | HTML:633-650,753-760 | obligatorios | controles | mensaje global/borde | solo requeridos | Localizado |
| Envío | HTML:763-830 | `guardar` | todos los campos | llamada servidor | desactiva botón | Localizado |
| Normalización | Formularios.js:2334-2372 | `guardarFormulario` | datos crudos | datos tipados/defaults | try/catch posterior | Localizado |
| Validación servidor | 1379-2332 | duplicados, negocio, FK | datos normalizados | acepta/error | traduce parcialmente | Localizado |
| Persistencia | 2420 en adelante; Repository_InsertarRegistro | insertar/actualizar | datos validados | ID/resultado | captura y traduce | Implementación estática |
| Éxito | HTML:770-824 | successHandler | resultado | “Guardado correctamente”+encadenado | — | Localizado |
| Fallo | HTML:826-829 | failureHandler | error | mensaje global; reactiva guardar | datos DOM conservados | Localizado |
| Cierre/retorno | HTML:85-100,675-685 | `cerrarOVolver_`, cancelar | RETORNO/sucio | cierre o reapertura origen | confirmación cambios | Localizado |

### F05.2 — Inventario de 37 configuraciones

Campos, obligatorios y FK son recuentos estáticos del esquema. Crear/editar: `Sí` cuando existe esquema y wrapper/selector localizado; el comportamiento real sigue no verificado. `Auto` resume defaults, sugerencias, campos ocultos al crear o derivación. Validación específica indica capa adicional además de obligatoriedad/FK general.

| Entidad | Crear | Editar | Campos | Oblig. | FK | Auto | Validación específica | Estado |
|---|---|---|---:|---:|---:|---|---|---|
| CAMPANA | Sí | Sí | 9 | 4 | 0 | Sí | fechas/estado/avance | Estática |
| PROYECTO | Sí | Sí | 19 | 7 | 3 | Sí | fechas, responsable, avance | Estática |
| PRODUCTO | Sí | Sí | 16 | 7 | 3 | Sí | vínculo proyecto, fechas, estado | Estática |
| PROCESO | Sí | Sí | 24 | 5 | 5 | Sí | orden/predecesor/fechas | Estática |
| TAREA | Sí | Sí | 26 | 5 | 3 | Sí | estados, fechas, motivos, avance | Estática |
| TAREA_RESPONSABLE | Sí | Sí | 8 | 5 | 2 | Sí | duplicado/capacidad/fechas | Estática |
| PERSONA_EQUIPO | Sí | Sí | 12 | 6 | 1 | Sí | tipo/coordinador/capacidad | Estática |
| EQUIPO_MIEMBRO | Sí | Sí | 9 | 3 | 2 | Sí | tipo, duplicado, fechas | Estática |
| RECURSO | Sí | Sí | 19 | 4 | 2 | Sí | clase/coste/ubicación | Estática |
| TAREA_RECURSO | Sí | Sí | 7 | 4 | 2 | Sí | duplicado/fechas | Estática |
| PEDIDO_PROVEEDOR | Sí | Sí | 4 | 3 | 1 | Sí | proveedor/estado | Estática |
| PEDIDO_PROVEEDOR_LINEA | Sí | Sí | 7 | 6 | 2 | Sí | duplicado/cantidades | Estática |
| RECEPCION | Sí | Sí | 5 | 3 | 2 | Sí | pedido/fecha/responsable | Estática |
| RECEPCION_LINEA | Sí | Sí | 6 | 5 | 2 | Sí | cantidades/duplicado | Estática |
| MATERIAL | Sí | Sí | 12 | 7 | 2 | Sí | stock no negativo/proveedor | Estática |
| PRODUCTO_MATERIAL | Sí | Sí | 6 | 5 | 2 | Sí | duplicado/cantidad | Estática |
| TAREA_MATERIAL | Sí | Sí | 9 | 5 | 2 | Sí | consumido/desperdicio/motivo | Estática |
| PROVEEDOR | Sí | Sí | 10 | 3 | 0 | Sí | contacto/estado | Estática |
| PROVEEDOR_MATERIAL | Sí | Sí | 7 | 6 | 2 | Sí | duplicado/precio/plazo | Estática |
| PROYECTO_PRODUCTO | Sí | Sí | 6 | 3 | 2 | Sí | duplicado/cantidad | Estática |
| DECISION | Sí | Sí | 16 | 4 | 3 | Sí | estado/resolución/fechas | Estática |
| INCIDENCIA | Sí | Sí | 20 | 6 | 6 | Sí | cascada, estado, fechas | Estática |
| DOCUMENTO | Sí | Sí | 10 | 6 | 1 | Sí | URL/versión/vigencia | Estática |
| ASIGNACION | Sí | Sí | 9 | 6 | 2 | Sí | polimorfismo/fechas | Estática |
| RELACION | Sí | Sí | 7 | 5 | 2 | Sí | origen/destino/tipo | Estática |
| VINCULO | Sí | Sí | 7 | 6 | 2 | Sí | dos tipos y registros | Estática |
| HORARIO | Sí | Sí | 9 | 6 | 1 | Sí | HH:MM/rango/vigencia | Estática |
| PRESUPUESTO | Sí | Sí | 5 | 4 | 1 | No | nivel/importe | Estática |
| FUENTE_FINANCIACION | Sí | Sí | 10 | 6 | 2 | Sí | nivel/importe/convocatoria | Estática |
| CONVOCATORIA | Sí | Sí | 12 | 5 | 0 | Sí | fechas/importes/estado | Estática |
| ETIQUETA_IMPACTO | Sí | Sí | 5 | 4 | 1 | No | nivel/categoría | Estática |
| COSTE | Sí | Sí | 8 | 6 | 1 | Sí | nivel/tipo/importe | Estática |
| COMPETENCIA | Sí | Sí | 4 | 2 | 0 | Sí | nombre/tipo | Estática |
| PERSONA_COMPETENCIA | Sí | Sí | 5 | 3 | 2 | Sí | duplicado/nivel | Estática |
| RECURSO_COMPETENCIA | Sí | Sí | 4 | 3 | 2 | Sí | duplicado/nivel | Estática |
| MOVIMIENTO_MATERIAL | Sí | Sí | 8 | 5 | 3 | No | signo, tipo, stock | Estática |
| EJECUCION_TAREA | Sí | Sí | 8 | 2 | 2 | Sí | fechas/duración/estado | Estática |

### F05.3–F05.4 — Muestra por riesgo, orden y agrupación

Se revisan las 13 entidades requeridas; pedido y recepción se tratan como un mismo ciclo, sin exclusiones.

| Entidad | Orden observado | Problema | Consecuencia | Agrupación propuesta | Prioridad |
|---|---|---|---|---|---|
| Campaña | identidad→fechas→estado/responsable | Plan y control juntos | edición densa | Esencial; planificación; seguimiento | P2 |
| Proyecto | jerarquía→plan→responsables→real | 19 conceptos | omisión/confusión plan-real | Esencial; plan; ejecución; calidad | P1 |
| Producto | identidad/vínculo→plan→calidad | relación virtual dentro del alta | efecto adicional poco visible | Esencial; contexto; plan; aceptación | P1 |
| Proceso | producto/relación→secuencia→fechas→responsables | dos vías de contexto y predecesor | alta carga | Contexto; secuencia; plan; ejecución/calidad | P1 |
| Tarea | proceso/secuencia→plan/real→estado/motivos/calidad | 26 campos, varios estados temporales | mayor riesgo de error | Esencial; plan; ejecución; calidad; avanzado | P1 |
| Tarea-Responsable | tarea/persona→rol/dedicación/fechas | relación técnica | asignación difícil de interpretar | Asignación; dedicación; vigencia | P2 |
| Incidencia | nivel→cascada completa→descripción/estado/fechas | 20 campos y 4 niveles descendentes | contexto obligatorio largo | Qué ocurrió; dónde; prioridad; resolución | P1 |
| Material | identidad→stock/proveedor | stock calculado y datos maestros próximos | edición indebida/sorpresa | Esencial; inventario; aprovisionamiento | P1 |
| Movimiento material | material/tipo/cantidad→referencias | signo/efecto no visible | movimiento inverso | Movimiento; origen; comprobación de efecto | P1 |
| Pedido/recepción | cabecera separada de líneas | flujo repartido entre cuatro entidades | pasos y consistencia | Pedido; materiales; recepción; confirmación | P1 |
| Persona/equipo | tipo→coordinador/capacidad/disponibilidad | campos cambian por tipo | correcto parcialmente por visibleSi | Identidad; organización; disponibilidad | P2 |
| Recurso | clase/ubicación/responsable→coste | 19 campos de espacio, herramienta y coste | irrelevancia según clase | Identidad; ubicación; disponibilidad; coste avanzado | P1 |
| Convocatoria | identidad→fechas/importes→estado | oportunidad y seguimiento juntos | longitud moderada | Identificación; plazos; financiación; estado | P2 |

### F05.5 — Etiquetas, obligatoriedad y ayuda

- `renderCampo` genera `<label for="campo_X">`, y controles principales usan el ID correspondiente. En FK, el label apunta al input oculto `campo_X`, no al input visible `campo_X_texto`: asociación semántica defectuosa.
- Requeridos muestran `*`, pero los controles no reciben atributo HTML `required`; la validación cliente es JavaScript propia.
- Requeridos servidor se derivan del mismo esquema, reduciendo divergencia estructural, pero reglas de negocio adicionales solo existen en servidor.
- Existe soporte `campo.ayuda`, clase `.ayuda-campo` y algunos placeholders; no todos los campos técnicos tienen ayuda.
- FK muestran `ID - nombre`; PERSONA_EQUIPO añade tipo. El ID real queda en input oculto y se extrae del texto.
- Los errores de obligatoriedad son globales y listan etiquetas; el borde inválido marca el contenedor, sin texto asociado por campo.

### F05.6 — Valores predeterminados y automatización

| Automatización | Evidencia | Beneficio | Riesgo/sorpresa | Visible/corregible | Estado |
|---|---|---|---|---|---|
| ID automático | repositorio/Ids | evita captura | se ve después | no previo | Estático |
| Código sugerido | activarSugerenciasCodigo | reduce trabajo | depende contexto/remoto | visible y editable | Estático |
| Orden/predecesor | HTML:401-445 | continuidad | propuesta automática no explicada | visible; no pisa escrito | Estático |
| Estado/defaults | `valorPorDefecto` | consistencia | puede pasar inadvertido | visible en control | Estático |
| Avance 0 al crear | Formularios.js:2355-2371 | evita campo impropio | valor oculto | no corregible al crear | Estático |
| ACTIVO/valores sistema | esquema/repositorio | consistencia | automático técnico | variable | Estático |
| Prefill padre | HTML:688-702 | conserva contexto | padre podría no advertirse | visible en FK si resuelve | Estático |
| Producto→Proyecto relación | guardarFormulario:2405-2417 | elimina segundo paso | crea relación adicional | campo normal, efecto no destacado | WARN |

### F05.7 — Relaciones y desplegables

| Campo/patrón | Fuente | Dependencia | Etiqueta mostrada | Vacío/error | Riesgo | Estado |
|---|---|---|---|---|---|---|
| Catálogo | 90_CONFIGURACION/opciones | ninguna | valor | opción `-- seleccionar --`; error global | lista vacía sin explicación | Estático |
| FK | listarRegistros activos | entidad/estado/filtro | `ID - nombre` | datalist vacío; error al cargar esquema | texto libre puede producir ID inválido | Estático |
| FK dependiente | mapa resolver | campo padre | ID-nombre | “seleccione primero”, “Cargando…”; error global | usa nombre técnico de `dependeDe` en placeholder | WARN |
| Proyecto-Producto | prefetch proyecto/producto | relación | `ID - proyecto / producto` | vacío posible | etiqueta larga | Estático |
| Persona/equipo | registros activos | tipo/filtro | ID-nombre-(tipo) | sin resultado específico | ID dominante | Estático |
| Incidencia proyecto→producto→proceso→tarea | mapas dependientes | padre anterior | ID-nombre | descendientes se limpian | pérdida de selección al cambiar padre es esperada | Estático |
| Polimórficos | tipo entidad→registro | catálogo/mapa | tipo+ID-nombre | padre obligatorio | alta carga/concepto técnico | Estático |
| Edición | `valorActual` | opción todavía válida | etiqueta si coincide; ID si no | conserva FK inactiva sin revalidar si no cambió | puede mostrar solo ID | Estático |

### F05.8 — Validación y prevención

| Regla | Cliente | Servidor | Mensaje | Riesgo divergencia | Estado |
|---|---|---|---|---|---|
| Obligatorios | JS en vivo+pre-guardar | esquema/repository | lista global/traducción | Bajo-medio | Implementada estática |
| Tipo número/fecha | input HTML min/max/type | normalización+reglas | servidor/global | Medio | Implementada estática |
| Rangos/porcentajes | min/max parcial | reglas entidad | específico variable | Medio | Implementada estática |
| Fechas/estados | limitada cliente | reglas negocio | mensajes servidor | Alto de descubrimiento tardío | Implementada estática |
| Duplicados | No | `validarDuplicidadFormulario_` | expone nombres de campos internos | UX técnica | Implementada estática |
| FK válidas | selección asistida | `validarClavesForaneasFormulario_` | incluye valor/etiqueta | Bajo funcional | Implementada estática |
| Dependientes al desactivar | consulta previa | detalle+desactivar | lista con enlaces | Bajo | Implementada estática |
| Concurrencia | No visible | locks en repositorio según operación | error servidor | NO VERIFICADO | Parcial |
| Doble envío | botón Guardar deshabilitado | no garantía completa | — | Bajo cliente | Implementada estática |
| Guardado compuesto producto-relación | No validación transaccional visible cliente | servidor | error global | Estado parcial requiere revisión posterior | NO VERIFICADO |

### F05.9 — Mensajes y recuperación

- Mensajes de éxito/error son globales en `#mensaje`; no hay región ARIA ni asociación con campo.
- Los datos permanecen en DOM tras fallo y Guardar se reactiva: recuperación positiva.
- No se enfoca el primer campo erróneo ni se desplaza explícitamente al mensaje.
- `error.message` se expone directamente; traducción servidor es parcial.
- Guardar y Desactivar se deshabilitan durante petición; indicador visual de carga no acompaña el guardado.
- Cancelar detecta formulario sucio y usa confirmación propia; `onbeforeunload` es red secundaria y el propio código reconoce que la X nativa puede no dispararla.
- No hay reintento automático; el usuario corrige y pulsa Guardar otra vez.
- Éxito se muestra 0,9 segundos antes de cierre cuando no hay encadenado; su percepción real es NO VERIFICADA.

### F05.10 — Teclado, foco y semántica

| Evidencia | Evaluación | Estado |
|---|---|---|
| DOM sigue orden del esquema | Tab probable en orden de campos | Estático |
| Sin autofocus/foco inicial | Usuario debe iniciar manualmente | WARN |
| Solo `focus()` al alta rápida “Otro” | Caso puntual, no patrón | Estático |
| Sin handlers Enter/Escape | Envío/cierre/modal no garantizados por teclado | WARN |
| Botones sin `type` | Fuera de `<form>`, efecto actual limitado; semántica incompleta | WARN |
| Spans clicables para editar/vínculos | No accesibles por teclado de forma nativa | P1 accesibilidad |
| ModalConfirmar sin role/aria-modal/foco atrapado | Lector de pantalla y teclado no reciben contexto modal | P1 accesibilidad |
| Mensajes/carga sin aria-live/role=alert | Cambios asíncronos no anunciados | P1 accesibilidad |
| Labels FK apuntan al hidden, no al input visible | Nombre accesible del buscador dudoso | P1 accesibilidad |
| Sin retorno de foco probado | Al cerrar/reabrir no se gestiona explícitamente | NO VERIFICADO |

### F05.11 — CSS y legibilidad deducible

- Base 13px; ayudas 11px; mensajes/tablas 12px. Legibles en código, pero render real NO VERIFICADO; 11px puede ser pequeño.
- Colores explícitos: texto `#202124`, secundario `#5f6368`, error `#b00020`, éxito `#1a7f37`, primario `#1a73e8` sobre blanco. Contraste parece razonable por inspección, pero no se declara WCAG sin medición/render.
- Foco elimina `outline` y solo cambia borde a azul: indicador fino y cromático, riesgo de visibilidad.
- Estado inválido usa borde rojo y mensaje global; no depende solo del color para el resumen, pero cada campo sí.
- Hover y disabled existen; no hay estilo `:focus-visible` para botones/enlaces.
- Modal 420×520; listas selector/catálogo tienen `max-height:220px` y scroll. Formulario no define adaptación `@media`; comportamiento en ventanas pequeñas NO VERIFICADO.
- Inputs 100%, textarea redimensionable, acciones flex. Etiquetas largas y datalist pueden cortar visualmente; NO VERIFICADO.

### F05.12 — Hallazgos

| ID | Alcance | Evidencia | Problema | Consecuencia | Severidad | Confianza | Tipo |
|---|---|---|---|---|---|---|---|
| F05-H01 | Motor común | renderCampo:197 vs FK:182/188 | Label apunta al hidden | Buscador sin nombre accesible | P1 | Alta | accesibilidad |
| F05-H02 | Motor común | sin aria/role | Mensajes/carga no anunciados | Lectores de pantalla pierden feedback | P1 | Alta | accesibilidad |
| F05-H03 | Modal | ModalConfirmar completo | Sin semántica/foco/Escape | Teclado puede quedar fuera | P1 | Alta | accesibilidad |
| F05-H04 | Motor común | spans onclick:119,264 | Acciones no semánticas | No operables por teclado | P1 | Alta | accesibilidad |
| F05-H05 | Tarea/Proceso/Incidencia/Recurso | 19–26 campos sin secciones | Alta carga | Omisiones/errores | P1 | Media | sistémico/configuración |
| F05-H06 | Validación | mensajes globales | No foco al primer error | Recuperación lenta | P2 | Alta | recuperación |
| F05-H07 | Validación | `error.message` | Error técnico visible | Comprensión/confianza | P1 | Alta | recuperación |
| F05-H08 | FK | datalist+extracción texto | Texto no coincidente genera ID aparente | Error tardío servidor | P2 | Alta | validación |
| F05-H09 | Guardado | botón disabled, sin spinner | Previene doble clic pero no comunica progreso | Incertidumbre | P2 | Alta | recuperación |
| F05-H10 | Cancelación | sucio+confirmación | X nativa no siempre interceptable | Pérdida posible | P1 | Media | recuperación |
| F05-H11 | CSS | outline none/borde color | Foco poco visible | Navegación difícil | P1 | Alta | accesibilidad |
| F05-H12 | Defaults | sugerencias/prefill | Automatización poco explicada | Sorpresa | P2 | Media | configuración |
| F05-H13 | Duplicados | mensaje campos internos | Nombres técnicos | Corrección difícil | P2 | Alta | validación |
| F05-H14 | Motor común | datos conservados+botón reactivo | Recuperación tras fallo correcta | Reduce pérdida | P3 positivo | Alta | recuperación |
| F05-H15 | Mantenibilidad | 37 esquemas en Formularios.js | Motor/configuración/reglas concentrados | Cambio transversal riesgoso | P2 | Alta | mantenibilidad |

### Diseño mínimo propuesto — sin implementación

Máximo cinco grupos: **Esencial**, **Contexto y relaciones**, **Planificación**, **Ejecución y calidad**, **Avanzado/auditoría**. Mostrar grupos solo si contienen campos aplicables; conservar `visibleSi` y ocultar Avanzado por defecto, sin eliminar datos.

Patrones: ayuda breve bajo etiqueta con ejemplo/formato; error junto al campo más resumen global anunciable; relación como buscador con nombre visible, ID secundario y estado vacío explícito; Guardar con progreso, éxito persistente suficiente y foco al error; Cancelar conserva confirmación; modal gestiona foco, Escape y retorno; Enter solo guarda cuando sea inequívoco.

| Problema | Cambio mínimo | Archivos candidatos | Riesgo | Verificación | Reversión |
|---|---|---|---|---|---|
| Campos sin grupos | añadir metadato grupo y contenedores plegables | Formularios.js, FormularioGenerico.html, Estilos.html | orden incorrecto | inspección 13 muestras+teclado | retirar metadato/render |
| FK sin label accesible | asociar label al input visible y describir ID | FormularioGenerico.html | romper extracción | prueba FK normal/dependiente/edición | restaurar IDs previos |
| Errores globales | mapa campo→error, resumen aria-live y foco | FormularioGenerico.html, Formularios.js | mapeo incompleto | reglas cliente/servidor | volver a mensaje global |
| Modal no accesible | role dialog, aria-modal, foco, Escape, retorno | ModalConfirmar.html, Estilos.html | conflictos teclado | recorrido solo teclado | restaurar modal actual |
| Progreso ambiguo | estado “Guardando…” y bloqueo consistente | FormularioGenerico.html | cierres tardíos | éxito/fallo/doble clic | retirar estado |
| Spans clicables | botones/enlaces semánticos | FormularioGenerico.html y componentes | cambio visual | teclado/foco | restaurar spans |
| Foco invisible | `:focus-visible` no solo cromático | Estilos.html | ruido visual | contraste/render/teclado | restaurar CSS |

### Limitaciones, resultado y gate

**NO VERIFICADO:** render, contraste medido, lector de pantalla, Tab real, Enter/Escape en sandbox, foco tras modal, respuesta remota, locks, atomicidad, catálogo vacío real, datos y permisos.

**Resultado F05:** motor común robusto en retorno, prevención de doble envío, dependencias, validación servidor y conservación tras error; presenta riesgos P1 de accesibilidad, recuperación y densidad configuracional. No se modificó código.

**Gate F05 pendiente de aprobación humana. No se inició F06.**

Siguiente prueba propuesta: **F06 — Separación backend/interfaz**, clasificando hojas y funciones como interfaz, datos maestros, relaciones, operaciones, configuración, staging, auditoría y pruebas, sin ocultar ni proteger nada todavía.
+
## F06 — Separación backend, interfaz y pruebas

### Alcance, método y línea base

Auditoría estática de los 110 ejecutables de `src` mediante funciones, llamadas y servicios. No se ejecutó código, exportador, Apps Script, pruebas ni red. Las capas describen responsabilidades observadas, no paquetes implementados.

Roadmap inicial: 106.963 bytes; SHA-256 `7e7d7b5895a26a159349720ce13179e72094e8ca83a549cb3f0995db51b760b0`. Estado Git inicial: roadmap modificado y manual no rastreado. Manual: `a18332565c408e9f283df26201c1a6745d1699ce9fd557d709d980225321c1fc`.

### F06.1 — Capas reales

| Archivo | Capa principal | Capas secundarias | Evidencia | Escritura posible | Invocado por | Invoca a | Estado |
|---|---|---|---|---|---|---|---|
| `src/appsscript.json` | CONFIGURACION | — | fn=0; test=0; Sheets=0; UI=0; gsr=0; ext=0 | No evidente | runtime | scopes/servicios | Estático |
| `src/AvanceYSecuencia.js` | UI_SERVIDOR | DOMINIO, PERSISTENCIA | fn=3; test=0; Sheets=1; UI=1; gsr=0; ext=0 | Sheets posible | menú/HTML | HtmlService/repositorios | Estático |
| `src/CacheLecturaService.js` | PERSISTENCIA | DOMINIO | fn=5; test=0; Sheets=0; UI=0; gsr=0; ext=0 | No evidente | paneles/servicios | Repository/cache | Estático |
| `src/CampaniaService.js` | DOMINIO | PERSISTENCIA | fn=7; test=0; Sheets=0; UI=0; gsr=0; ext=0 | No evidente | servicios/UI | repositorios/reglas | Estático |
| `src/Código.js` | UI_SERVIDOR | PERSISTENCIA, UI_CLIENTE | fn=1; test=0; Sheets=1; UI=0; gsr=0; ext=0 | Sheets posible | global/plantilla | SpreadsheetApp/HtmlService | Estático |
| `src/ConfigRepository.js` | CONFIGURACION | PERSISTENCIA | fn=3; test=0; Sheets=3; UI=0; gsr=0; ext=0 | Sheets posible | dominio/UI | 90_CONFIGURACION | Estático |
| `src/CorregirCatalogoTipoProyecto.js` | ADMIN_INSTALACION | CONFIGURACION, PERSISTENCIA | fn=1; test=0; Sheets=1; UI=0; gsr=0; ext=0 | Sheets posible | manual | Sheets/config | Estático |
| `src/CosteService.js` | DOMINIO | PERSISTENCIA | fn=17; test=0; Sheets=0; UI=0; gsr=0; ext=0 | No evidente | servicios/UI | repositorios/reglas | Estático |
| `src/DashboardService.js` | UI_SERVIDOR | DOMINIO, PERSISTENCIA | fn=23; test=0; Sheets=1; UI=3; gsr=0; ext=0 | Sheets posible | menú/HTML | HtmlService/repositorios | Estático |
| `src/DesviacionService.js` | UI_SERVIDOR | DOMINIO, PERSISTENCIA | fn=37; test=0; Sheets=4; UI=9; gsr=0; ext=0 | Sheets posible | menú/HTML | HtmlService/repositorios | Estático |
| `src/DisponibilidadService.js` | PERSISTENCIA | DOMINIO | fn=11; test=0; Sheets=1; UI=0; gsr=0; ext=0 | Sheets posible | servicios | SpreadsheetApp | Estático |
| `src/EdicionDirecta.js` | AUDITORIA | DOMINIO, PERSISTENCIA, UI_SERVIDOR | fn=1; test=0; Sheets=1; UI=0; gsr=0; ext=0 | Sheets posible | operación/menú/pruebas | Sheets/repositorios/UI | Estático |
| `src/Estilos.html` | UI_CLIENTE | UI_SERVIDOR | fn=0; test=0; Sheets=0; UI=0; gsr=0; ext=0 | No evidente | HtmlService | DOM/CSS | Estático |
| `src/EvidenciaSocialService.js` | DOMINIO | PERSISTENCIA | fn=3; test=0; Sheets=0; UI=0; gsr=0; ext=0 | No evidente | servicios/UI | repositorios/reglas | Estático |
| `src/ExportarCodigoProduccion.js` | ADMIN_INSTALACION | AUDITORIA, CONFIGURACION | fn=5; test=0; Sheets=0; UI=0; gsr=0; ext=3 | Drive/API | manual | UrlFetch/Drive/API | Estático |
| `src/FichaConvocatoria.html` | UI_CLIENTE | UI_SERVIDOR | fn=0; test=0; Sheets=0; UI=0; gsr=5; ext=0 | Indirecta | HtmlService | google.script.run | Estático |
| `src/FichaConvocatoriaService.js` | UI_SERVIDOR | DOMINIO, PERSISTENCIA | fn=9; test=0; Sheets=1; UI=3; gsr=0; ext=0 | Sheets posible | menú/HTML | HtmlService/repositorios | Estático |
| `src/FichaIncidencia.html` | UI_CLIENTE | UI_SERVIDOR | fn=0; test=0; Sheets=0; UI=0; gsr=6; ext=0 | Indirecta | HtmlService | google.script.run | Estático |
| `src/FichaIncidenciaService.js` | UI_SERVIDOR | DOMINIO, PERSISTENCIA | fn=8; test=0; Sheets=1; UI=3; gsr=0; ext=0 | Sheets posible | menú/HTML | HtmlService/repositorios | Estático |
| `src/FichaMaterial.html` | UI_CLIENTE | UI_SERVIDOR | fn=0; test=0; Sheets=0; UI=0; gsr=7; ext=0 | Indirecta | HtmlService | google.script.run | Estático |
| `src/FichaMaterialService.js` | UI_SERVIDOR | DOMINIO, PERSISTENCIA | fn=10; test=0; Sheets=1; UI=3; gsr=0; ext=0 | Sheets posible | menú/HTML | HtmlService/repositorios | Estático |
| `src/FichaPersonaEquipo.html` | UI_CLIENTE | UI_SERVIDOR | fn=0; test=0; Sheets=0; UI=0; gsr=3; ext=0 | Indirecta | HtmlService | google.script.run | Estático |
| `src/FichaPersonaEquipoService.js` | UI_SERVIDOR | DOMINIO, PERSISTENCIA | fn=7; test=0; Sheets=1; UI=3; gsr=0; ext=0 | Sheets posible | menú/HTML | HtmlService/repositorios | Estático |
| `src/FichaProducto.html` | UI_CLIENTE | UI_SERVIDOR | fn=0; test=0; Sheets=0; UI=0; gsr=9; ext=0 | Indirecta | HtmlService | google.script.run | Estático |
| `src/FichaProductoService.js` | UI_SERVIDOR | DOMINIO, PERSISTENCIA | fn=11; test=0; Sheets=1; UI=3; gsr=0; ext=0 | Sheets posible | menú/HTML | HtmlService/repositorios | Estático |
| `src/FichaProveedor.html` | UI_CLIENTE | UI_SERVIDOR | fn=0; test=0; Sheets=0; UI=0; gsr=6; ext=0 | Indirecta | HtmlService | google.script.run | Estático |
| `src/FichaProveedorService.js` | UI_SERVIDOR | DOMINIO, PERSISTENCIA | fn=8; test=0; Sheets=1; UI=3; gsr=0; ext=0 | Sheets posible | menú/HTML | HtmlService/repositorios | Estático |
| `src/FichaRecurso.html` | UI_CLIENTE | UI_SERVIDOR | fn=0; test=0; Sheets=0; UI=0; gsr=5; ext=0 | Indirecta | HtmlService | google.script.run | Estático |
| `src/FichaRecursoService.js` | UI_SERVIDOR | DOMINIO, PERSISTENCIA | fn=6; test=0; Sheets=1; UI=3; gsr=0; ext=0 | Sheets posible | menú/HTML | HtmlService/repositorios | Estático |
| `src/FormularioGenerico.html` | UI_CLIENTE | UI_SERVIDOR | fn=0; test=0; Sheets=0; UI=0; gsr=15; ext=0 | Indirecta | HtmlService | google.script.run | Estático |
| `src/Formularios.js` | MIXTO | UI_SERVIDOR, CONFIGURACION, DOMINIO, PERSISTENCIA, ADMIN_INSTALACION | fn=115; test=0; Sheets=7; UI=11; gsr=0; ext=0 | Sheets posible | onOpen/HTML | UI/repositorios | Estático |
| `src/GanttPlanReal.html` | UI_CLIENTE | UI_SERVIDOR | fn=0; test=0; Sheets=0; UI=0; gsr=17; ext=0 | Indirecta | HtmlService | google.script.run | Estático |
| `src/GeneracionCodigo.js` | PERSISTENCIA | DOMINIO | fn=8; test=0; Sheets=1; UI=0; gsr=0; ext=0 | Sheets posible | servicios | SpreadsheetApp | Estático |
| `src/GestionCatalogo.html` | UI_CLIENTE | UI_SERVIDOR | fn=0; test=0; Sheets=0; UI=0; gsr=2; ext=0 | Indirecta | HtmlService | google.script.run | Estático |
| `src/GestionCatalogos.js` | UI_SERVIDOR | DOMINIO, PERSISTENCIA | fn=11; test=0; Sheets=3; UI=3; gsr=0; ext=0 | Sheets posible | menú/HTML | HtmlService/repositorios | Estático |
| `src/HistorialService.js` | AUDITORIA | DOMINIO, PERSISTENCIA, UI_SERVIDOR | fn=5; test=0; Sheets=5; UI=0; gsr=0; ext=0 | Sheets posible | operación/menú/pruebas | Sheets/repositorios/UI | Estático |
| `src/Ids.js` | MIXTO | DOMINIO, PERSISTENCIA, PRUEBA | fn=9; test=6; Sheets=2; UI=0; gsr=0; ext=0 | Sheets posible | repositorios | Sheets/locks | Estático |
| `src/ImportacionMasiva.js` | UI_SERVIDOR | DOMINIO, PERSISTENCIA | fn=6; test=0; Sheets=4; UI=2; gsr=0; ext=0 | Sheets posible | menú/HTML | HtmlService/repositorios | Estático |
| `src/Includes.js` | UI_SERVIDOR | PERSISTENCIA, UI_CLIENTE | fn=1; test=0; Sheets=0; UI=2; gsr=0; ext=0 | No evidente | global/plantilla | SpreadsheetApp/HtmlService | Estático |
| `src/InformeGenerico.html` | UI_CLIENTE | UI_SERVIDOR | fn=0; test=0; Sheets=0; UI=0; gsr=5; ext=0 | Indirecta | HtmlService | google.script.run | Estático |
| `src/InstaladorAsignacion.js` | ADMIN_INSTALACION | CONFIGURACION, PERSISTENCIA | fn=1; test=0; Sheets=1; UI=0; gsr=0; ext=0 | Sheets posible | manual | Sheets/config | Estático |
| `src/InstaladorCampanaEstiuYNavidadAmpliada.js` | FIXTURE | ADMIN_INSTALACION, PERSISTENCIA | fn=3; test=0; Sheets=0; UI=0; gsr=0; ext=0 | No evidente | manual | producción/Sheets | Estático |
| `src/InstaladorCampanaMercatsTardor.js` | FIXTURE | ADMIN_INSTALACION, PERSISTENCIA | fn=8; test=0; Sheets=0; UI=0; gsr=0; ext=0 | No evidente | manual | producción/Sheets | Estático |
| `src/InstaladorCatalogosL2.js` | ADMIN_INSTALACION | CONFIGURACION, PERSISTENCIA | fn=2; test=0; Sheets=1; UI=0; gsr=0; ext=0 | Sheets posible | manual | Sheets/config | Estático |
| `src/InstaladorCompetencia.js` | ADMIN_INSTALACION | CONFIGURACION, PERSISTENCIA | fn=1; test=0; Sheets=1; UI=0; gsr=0; ext=0 | Sheets posible | manual | Sheets/config | Estático |
| `src/InstaladorConvocatoria.js` | ADMIN_INSTALACION | CONFIGURACION, PERSISTENCIA | fn=1; test=0; Sheets=1; UI=0; gsr=0; ext=0 | Sheets posible | manual | Sheets/config | Estático |
| `src/InstaladorCoste.js` | ADMIN_INSTALACION | CONFIGURACION, PERSISTENCIA | fn=1; test=0; Sheets=1; UI=0; gsr=0; ext=0 | Sheets posible | manual | Sheets/config | Estático |
| `src/InstaladorCriteriosAceptacion.js` | ADMIN_INSTALACION | CONFIGURACION, PERSISTENCIA | fn=1; test=0; Sheets=1; UI=0; gsr=0; ext=0 | Sheets posible | manual | Sheets/config | Estático |
| `src/InstaladorDatosPruebaPiloto.js` | FIXTURE | ADMIN_INSTALACION, PERSISTENCIA | fn=6; test=0; Sheets=0; UI=0; gsr=0; ext=0 | No evidente | manual | producción/Sheets | Estático |
| `src/InstaladorDatosPruebaPilotoAmpliado.js` | FIXTURE | ADMIN_INSTALACION, PERSISTENCIA | fn=5; test=0; Sheets=0; UI=0; gsr=0; ext=0 | No evidente | manual | producción/Sheets | Estático |
| `src/InstaladorEjecucionTarea.js` | ADMIN_INSTALACION | CONFIGURACION, PERSISTENCIA | fn=1; test=0; Sheets=1; UI=0; gsr=0; ext=0 | Sheets posible | manual | Sheets/config | Estático |
| `src/InstaladorEntidadPersonaDocumento.js` | ADMIN_INSTALACION | CONFIGURACION, PERSISTENCIA | fn=1; test=0; Sheets=1; UI=0; gsr=0; ext=0 | Sheets posible | manual | Sheets/config | Estático |
| `src/InstaladorEquipoMiembro.js` | ADMIN_INSTALACION | CONFIGURACION, PERSISTENCIA | fn=1; test=0; Sheets=1; UI=0; gsr=0; ext=0 | Sheets posible | manual | Sheets/config | Estático |
| `src/InstaladorHorario.js` | ADMIN_INSTALACION | CONFIGURACION, PERSISTENCIA | fn=3; test=0; Sheets=3; UI=0; gsr=0; ext=0 | Sheets posible | manual | Sheets/config | Estático |
| `src/InstaladorHorarioEquipoProduccion.js` | ADMIN_INSTALACION | CONFIGURACION, PERSISTENCIA | fn=1; test=0; Sheets=0; UI=0; gsr=0; ext=0 | No evidente | manual | Sheets/config | Estático |
| `src/InstaladorImpacto.js` | ADMIN_INSTALACION | CONFIGURACION, PERSISTENCIA | fn=1; test=0; Sheets=1; UI=0; gsr=0; ext=0 | Sheets posible | manual | Sheets/config | Estático |
| `src/InstaladorImportacionMasiva.js` | ADMIN_INSTALACION | CONFIGURACION, PERSISTENCIA | fn=1; test=0; Sheets=1; UI=0; gsr=0; ext=0 | Sheets posible | manual | Sheets/config | Estático |
| `src/InstaladorJerarquiaFisica.js` | ADMIN_INSTALACION | CONFIGURACION, PERSISTENCIA | fn=3; test=0; Sheets=0; UI=0; gsr=0; ext=0 | No evidente | manual | Sheets/config | Estático |
| `src/InstaladorMejorasAuditoriaPiloto.js` | ADMIN_INSTALACION | CONFIGURACION, PERSISTENCIA | fn=1; test=0; Sheets=1; UI=0; gsr=0; ext=0 | Sheets posible | manual | Sheets/config | Estático |
| `src/InstaladorMetodoCalculoAvance.js` | ADMIN_INSTALACION | CONFIGURACION, PERSISTENCIA | fn=1; test=0; Sheets=1; UI=0; gsr=0; ext=0 | Sheets posible | manual | Sheets/config | Estático |
| `src/InstaladorModoUso.js` | ADMIN_INSTALACION | CONFIGURACION, PERSISTENCIA | fn=2; test=0; Sheets=1; UI=0; gsr=0; ext=0 | Sheets posible | manual | Sheets/config | Estático |
| `src/InstaladorMovimientoMaterial.js` | ADMIN_INSTALACION | CONFIGURACION, PERSISTENCIA | fn=1; test=0; Sheets=1; UI=0; gsr=0; ext=0 | Sheets posible | manual | Sheets/config | Estático |
| `src/InstaladorNivelDato.js` | ADMIN_INSTALACION | CONFIGURACION, PERSISTENCIA | fn=2; test=0; Sheets=1; UI=0; gsr=0; ext=0 | Sheets posible | manual | Sheets/config | Estático |
| `src/InstaladorPaqueteInformes.js` | ADMIN_INSTALACION | CONFIGURACION, PERSISTENCIA | fn=12; test=0; Sheets=0; UI=0; gsr=0; ext=0 | No evidente | manual | Sheets/config | Estático |
| `src/InstaladorPedidoRecepcion.js` | ADMIN_INSTALACION | CONFIGURACION, PERSISTENCIA | fn=1; test=0; Sheets=1; UI=0; gsr=0; ext=0 | Sheets posible | manual | Sheets/config | Estático |
| `src/InstaladorPresupuesto.js` | ADMIN_INSTALACION | CONFIGURACION, PERSISTENCIA | fn=1; test=0; Sheets=1; UI=0; gsr=0; ext=0 | Sheets posible | manual | Sheets/config | Estático |
| `src/InstaladorProveedorMaterial.js` | ADMIN_INSTALACION | CONFIGURACION, PERSISTENCIA | fn=1; test=0; Sheets=1; UI=0; gsr=0; ext=0 | Sheets posible | manual | Sheets/config | Estático |
| `src/InstaladorRecurso.js` | ADMIN_INSTALACION | CONFIGURACION, PERSISTENCIA | fn=1; test=0; Sheets=1; UI=0; gsr=0; ext=0 | Sheets posible | manual | Sheets/config | Estático |
| `src/InstaladorRelacion.js` | ADMIN_INSTALACION | CONFIGURACION, PERSISTENCIA | fn=1; test=0; Sheets=1; UI=0; gsr=0; ext=0 | Sheets posible | manual | Sheets/config | Estático |
| `src/InstaladorRolPersonaAtendida.js` | ADMIN_INSTALACION | CONFIGURACION, PERSISTENCIA | fn=2; test=0; Sheets=1; UI=0; gsr=0; ext=0 | Sheets posible | manual | Sheets/config | Estático |
| `src/InstaladorTipoVinculoIncidencia.js` | ADMIN_INSTALACION | CONFIGURACION, PERSISTENCIA | fn=1; test=0; Sheets=1; UI=0; gsr=0; ext=0 | Sheets posible | manual | Sheets/config | Estático |
| `src/InstaladorVinculo.js` | ADMIN_INSTALACION | CONFIGURACION, PERSISTENCIA | fn=2; test=0; Sheets=1; UI=0; gsr=0; ext=0 | Sheets posible | manual | Sheets/config | Estático |
| `src/InstrumentacionService.js` | AUDITORIA | DOMINIO, PERSISTENCIA, UI_SERVIDOR | fn=5; test=0; Sheets=3; UI=0; gsr=0; ext=0 | Sheets posible | operación/menú/pruebas | Sheets/repositorios/UI | Estático |
| `src/IntegridadReporte.html` | UI_CLIENTE | UI_SERVIDOR | fn=0; test=0; Sheets=0; UI=0; gsr=1; ext=0 | Indirecta | HtmlService | google.script.run | Estático |
| `src/IntegrityService.js` | AUDITORIA | DOMINIO, PERSISTENCIA, UI_SERVIDOR | fn=42; test=1; Sheets=1; UI=3; gsr=0; ext=0 | Sheets posible | operación/menú/pruebas | Sheets/repositorios/UI | Estático |
| `src/KanbanOperativo.html` | UI_CLIENTE | UI_SERVIDOR | fn=0; test=0; Sheets=0; UI=0; gsr=7; ext=0 | Indirecta | HtmlService | google.script.run | Estático |
| `src/KanbanService.js` | UI_SERVIDOR | DOMINIO, PERSISTENCIA | fn=10; test=0; Sheets=1; UI=3; gsr=0; ext=0 | Sheets posible | menú/HTML | HtmlService/repositorios | Estático |
| `src/LecturaBatchService.js` | PERSISTENCIA | DOMINIO | fn=5; test=0; Sheets=3; UI=0; gsr=0; ext=0 | Sheets posible | paneles/servicios | Repository/cache | Estático |
| `src/ListadoFiltrable.html` | UI_CLIENTE | UI_SERVIDOR | fn=0; test=0; Sheets=0; UI=0; gsr=3; ext=0 | Indirecta | HtmlService | google.script.run | Estático |
| `src/ListadoFiltrableService.js` | UI_SERVIDOR | DOMINIO, PERSISTENCIA | fn=9; test=0; Sheets=1; UI=3; gsr=0; ext=0 | Sheets posible | menú/HTML | HtmlService/repositorios | Estático |
| `src/ModalConfirmar.html` | UI_CLIENTE | UI_SERVIDOR | fn=0; test=0; Sheets=0; UI=0; gsr=0; ext=0 | No evidente | HtmlService | DOM/CSS | Estático |
| `src/NivelDatoService.js` | DOMINIO | PERSISTENCIA | fn=3; test=0; Sheets=0; UI=0; gsr=0; ext=0 | No evidente | servicios/UI | repositorios/reglas | Estático |
| `src/PanelCampana.html` | UI_CLIENTE | UI_SERVIDOR | fn=0; test=0; Sheets=0; UI=0; gsr=10; ext=0 | Indirecta | HtmlService | google.script.run | Estático |
| `src/PanelCampanaService.js` | UI_SERVIDOR | DOMINIO, PERSISTENCIA | fn=8; test=0; Sheets=1; UI=3; gsr=0; ext=0 | Sheets posible | menú/HTML | HtmlService/repositorios | Estático |
| `src/PanelOperativo.html` | UI_CLIENTE | UI_SERVIDOR | fn=0; test=0; Sheets=0; UI=0; gsr=2; ext=0 | Indirecta | HtmlService | google.script.run | Estático |
| `src/PanelPersonas.html` | UI_CLIENTE | UI_SERVIDOR | fn=0; test=0; Sheets=0; UI=0; gsr=4; ext=0 | Indirecta | HtmlService | google.script.run | Estático |
| `src/PanelPersonasService.js` | UI_SERVIDOR | DOMINIO, PERSISTENCIA | fn=2; test=0; Sheets=1; UI=3; gsr=0; ext=0 | Sheets posible | menú/HTML | HtmlService/repositorios | Estático |
| `src/PanelRecursos.html` | UI_CLIENTE | UI_SERVIDOR | fn=0; test=0; Sheets=0; UI=0; gsr=3; ext=0 | Indirecta | HtmlService | google.script.run | Estático |
| `src/PanelRecursosService.js` | UI_SERVIDOR | DOMINIO, PERSISTENCIA | fn=2; test=0; Sheets=1; UI=3; gsr=0; ext=0 | Sheets posible | menú/HTML | HtmlService/repositorios | Estático |
| `src/PedidoRecepcion.js` | MIXTO | DOMINIO, PERSISTENCIA, UI_SERVIDOR, ADMIN_INSTALACION | fn=6; test=0; Sheets=1; UI=1; gsr=0; ext=0 | Sheets posible | menú/formularios | repositorios/UI | Estático |
| `src/ProcesoService.js` | DOMINIO | PERSISTENCIA | fn=7; test=0; Sheets=0; UI=0; gsr=0; ext=0 | No evidente | servicios/UI | repositorios/reglas | Estático |
| `src/ProductoService.js` | DOMINIO | PERSISTENCIA | fn=7; test=0; Sheets=0; UI=0; gsr=0; ext=0 | No evidente | servicios/UI | repositorios/reglas | Estático |
| `src/Proteccion.js` | ADMIN_INSTALACION | PERSISTENCIA, UI_SERVIDOR | fn=3; test=0; Sheets=4; UI=2; gsr=0; ext=0 | Sheets posible | menú | Sheets/UI | Estático |
| `src/ProyectoService.js` | DOMINIO | PERSISTENCIA | fn=7; test=0; Sheets=0; UI=0; gsr=0; ext=0 | No evidente | servicios/UI | repositorios/reglas | Estático |
| `src/ReportService.js` | UI_SERVIDOR | DOMINIO, PERSISTENCIA | fn=23; test=0; Sheets=3; UI=6; gsr=0; ext=0 | Sheets posible | menú/HTML | HtmlService/repositorios | Estático |
| `src/Repository.js` | MIXTO | PERSISTENCIA, DOMINIO, PRUEBA | fn=85; test=65; Sheets=108; UI=0; gsr=0; ext=0 | Sheets posible | servicios/pruebas | Sheets/locks/historial | Estático |
| `src/Repository_InsertarRegistro.js` | PERSISTENCIA | DOMINIO, AUDITORIA | fn=2; test=0; Sheets=2; UI=0; gsr=0; ext=0 | Sheets posible | formularios/servicios | Sheets/locks/historial | Estático |
| `src/Reversion.js` | AUDITORIA | DOMINIO, PERSISTENCIA, UI_SERVIDOR | fn=3; test=0; Sheets=1; UI=1; gsr=0; ext=0 | Sheets posible | operación/menú/pruebas | Sheets/repositorios/UI | Estático |
| `src/SelectorRegistro.html` | UI_CLIENTE | UI_SERVIDOR | fn=0; test=0; Sheets=0; UI=0; gsr=2; ext=0 | Indirecta | HtmlService | google.script.run | Estático |
| `src/SerializacionService.js` | DOMINIO | PERSISTENCIA | fn=1; test=0; Sheets=0; UI=0; gsr=1; ext=0 | Indirecta | servicios/UI | repositorios/reglas | Estático |
| `src/StockMaterialService.js` | DOMINIO | PERSISTENCIA | fn=1; test=0; Sheets=0; UI=0; gsr=0; ext=0 | No evidente | servicios/UI | repositorios/reglas | Estático |
| `src/TareaService.js` | DOMINIO | PERSISTENCIA | fn=7; test=0; Sheets=0; UI=0; gsr=0; ext=0 | No evidente | servicios/UI | repositorios/reglas | Estático |
| `src/Tests_AvanceYSecuencia.js` | PRUEBA | FIXTURE, DOMINIO, PERSISTENCIA | fn=1; test=1; Sheets=0; UI=0; gsr=0; ext=0 | No evidente | suite/manual | producción/Sheets | Estático |
| `src/Tests_CosteService.js` | PRUEBA | FIXTURE, DOMINIO, PERSISTENCIA | fn=1; test=1; Sheets=0; UI=0; gsr=0; ext=0 | No evidente | suite/manual | producción/Sheets | Estático |
| `src/Tests_ImportacionRecursosPersonas.js` | PRUEBA | FIXTURE, DOMINIO, PERSISTENCIA | fn=1; test=1; Sheets=10; UI=0; gsr=0; ext=0 | Sheets posible | suite/manual | producción/Sheets | Estático |
| `src/Tests_IntegridadGapReglasFuncional.js` | PRUEBA | FIXTURE, DOMINIO, PERSISTENCIA | fn=25; test=21; Sheets=42; UI=0; gsr=0; ext=0 | Sheets posible | suite/manual | producción/Sheets | Estático |
| `src/Tests_LecturaBatch.js` | PRUEBA | FIXTURE, DOMINIO, PERSISTENCIA | fn=1; test=1; Sheets=1; UI=0; gsr=0; ext=0 | Sheets posible | suite/manual | producción/Sheets | Estático |
| `src/Tests_Repository.js` | PRUEBA | FIXTURE, DOMINIO, PERSISTENCIA | fn=209; test=153; Sheets=66; UI=0; gsr=0; ext=0 | Sheets posible | suite/manual | producción/Sheets | Estático |
| `src/Tests_Repository2.js` | PRUEBA | FIXTURE, DOMINIO, PERSISTENCIA | fn=200; test=6; Sheets=244; UI=0; gsr=0; ext=1 | Drive/API | suite/manual | producción/Sheets | Estático |
| `src/Validation.js` | MIXTO | CONFIGURACION, DOMINIO, PERSISTENCIA, ADMIN_INSTALACION | fn=24; test=0; Sheets=119; UI=0; gsr=0; ext=0 | Sheets posible | repositorios/admin | Sheets/reglas | Estático |

La clasificación combina contenido y llamadas; no depende solo del nombre. Un recuento cero no demuestra ausencia transitiva.

### F06.2 — Dependencias entre capas

| Origen | Destino | Mecanismo | Dirección esperable | Acoplamiento | Riesgo | Evidencia |
|---|---|---|---|---|---|---|
| HTML | UI servidor | google.script.run | cliente→servidor | Alto | renombre rompe UI | 19 HTML |
| Formularios/onOpen | servicios/repositorios | globales | UI→dominio→persistencia | Alto | reglas/config en UI | Formularios.js |
| Servicios ficha/panel | Repository | directas | UI servidor→persistencia | Medio-alto | datos no sustituibles | Ficha*/Panel* |
| Repository | Sheets/historial | SpreadsheetApp/locks | persistencia→infra | Alto | escritura transversal | 108 Sheets |
| Validation | Sheets/config | SpreadsheetApp | dominio→persistencia | Inverso/alto | reglas ligadas al libro | 119 Sheets |
| Tests_* | producción | globales | prueba→producción | Necesario | B no autónomo | 1–81 dependencias |
| Repository.js | pruebas | 51 funciones | producción→prueba | Inverso | tests en A | 302–8335 |
| Ids.js | pruebas | 5 funciones | producción→prueba | Inverso | tests en A | 152–491 |
| Instaladores | Sheets/repositorios | globales | admin→persistencia | Alto | estructura/datos | Instalador* |
| onOpen | administración | addItem | menú→admin | Directo | error humano | 2646–2654 |
| Exportador | API | UrlFetch/OAuth | admin→externo | Alto | red/scopes | 378–423 |
| Exportador | Drive | folder/file/zip | admin→externo | Alto | sin rollback | 429–598 |
| Historial | Sheets | append/flush | dominio→auditoría | Transversal | fallo operativo | servicios |
| Manifest | runtime | scopes | config→todas | Global | paquete incompleto | appsscript.json |

Dependencias inversas verificadas: producción contiene pruebas en `Repository.js` e `Ids.js`; `Validation.js` mezcla dominio, persistencia e instalación. Los ciclos UI↔servicios y dominio↔persistencia/auditoría son aparentes; runtime NO VERIFICADO.

### F06.3 — Código mixto específico

| Archivo | Responsabilidades | Pruebas | Instalación | Sheets/UI | Riesgo | Dependencia oculta |
|---|---|---|---|---|---|---|
| `Repository.js` | API productiva | 51 | No | 108/0 | Muy alto | Tests/servicios |
| `Ids.js` | generación ID | 5 | No | 2/0 | Alto | locks |
| `Formularios.js` | esquemas/reglas/menú | No | admin menú | 7/11 | Muy alto | wrappers |
| `IntegrityService.js` | integridad productiva | No | No | 1/3 | Alto | Tests |
| `Validation.js` | reglas/validación física | No | 15 admin | 119/0 | Muy alto | Repository |
| `Código.js` | activa inicio | No | No | 1/0 | Bajo | myFunction |
| `HistorialService.js` | historial | marca TEST | migración | 5/0 | Medio | Repository |
| `PedidoRecepcion.js` | confirmación/estado | No | corrección | 1/1 | Alto | menú/repos |

### F06.4 — Universo de pruebas

| Elemento | Archivo | Tipo | Dependencias productivas | Riesgo al excluir | Riesgo al incluir | Estado |
|---|---|---|---|---|---|---|
| 1 | `Tests_AvanceYSecuencia.js` | Explícita | 1 | pierde cobertura | viaja a A | VERIFICADO |
| 1 | `Tests_CosteService.js` | Prueba/fixture | 3 | pierde cobertura | escribe | VERIFICADO |
| 1 | `Tests_ImportacionRecursosPersonas.js` | Prueba/fixture | 3 | pierde cobertura | escribe | VERIFICADO |
| 25 | `Tests_IntegridadGapReglasFuncional.js` | Suite | 5 | pierde cobertura | queda en A actual | VERIFICADO |
| 1 | `Tests_LecturaBatch.js` | Explícita | 2 | pierde cobertura | fixture | VERIFICADO |
| 209 | `Tests_Repository.js` | Suite | 81 | pierde suite | escribe | VERIFICADO |
| 200 | `Tests_Repository2.js` | Suite | 29 | pierde suite | escribe | VERIFICADO |
| 51 | `Repository.js` | Incrustadas | mismo archivo | no excluir | quedan en A | VERIFICADO |
| 5 | `Ids.js` | Incrustadas | IDs | no excluir | quedan en A | VERIFICADO |
| piloto | `InstaladorDatosPruebaPiloto*.js` | Fixture | repos | demo incompleta | contamina | VERIFICADO |
| campañas | `InstaladorCampana*.js` | Ambiguo | repos | demo incompleta | contamina | VERIFICADO |
| verificador | `IntegrityService.js` | Productivo | repos | pierde control | ninguno | VERIFICADO |

### F06.5 — Exportador existente

- Entradas: `exportarCodigoSinTests` y `exportarCodigoSoloTests`; lista fija de tres nombres.
- Filtra solo `SERVER_JS`: A excluye esos tres y B exige exactamente esos tres; no usa prefijo.
- Usa Apps Script API con UrlFetch/OAuth y crea en Drive TXT, índice y ZIP ordenados.
- Omite HTML y `appsscript.json`; no genera hashes, snapshot reproducible ni rollback.
- Por tanto no excluye todas las pruebas, deja incrustadas y no reconstruye paquetes completos.

### F06.6 — Simulación estática de dos pasadas

| Archivo | Paquete propuesto | Motivo | Dependencia cruzada | Riesgo | Decisión pendiente |
|---|---|---|---|---|---|
| `src/appsscript.json` | A y B (PROPUESTA) | runtime/scopes | ambos | scope | mínimo |
| `src/AvanceYSecuencia.js` | A — Producción | operativo | — | medio | allowlist humana |
| `src/CacheLecturaService.js` | A — Producción | operativo | — | medio | allowlist humana |
| `src/CampaniaService.js` | A — Producción | operativo | — | medio | allowlist humana |
| `src/Código.js` | A — Producción | operativo | — | medio | allowlist humana |
| `src/ConfigRepository.js` | A — Producción | operativo | — | medio | allowlist humana |
| `src/CorregirCatalogoTipoProyecto.js` | A — Producción | operativo | — | medio | allowlist humana |
| `src/CosteService.js` | A — Producción | operativo | — | medio | allowlist humana |
| `src/DashboardService.js` | A — Producción | operativo | — | medio | allowlist humana |
| `src/DesviacionService.js` | A — Producción | operativo | — | medio | allowlist humana |
| `src/DisponibilidadService.js` | A — Producción | operativo | — | medio | allowlist humana |
| `src/EdicionDirecta.js` | A — Producción | operativo | — | medio | allowlist humana |
| `src/Estilos.html` | A — Producción | operativo | — | medio | allowlist humana |
| `src/EvidenciaSocialService.js` | A — Producción | operativo | — | medio | allowlist humana |
| `src/ExportarCodigoProduccion.js` | Auxiliar | tooling | Drive/API | auto-inclusión | fuera A/B |
| `src/FichaConvocatoria.html` | A — Producción | operativo | — | medio | allowlist humana |
| `src/FichaConvocatoriaService.js` | A — Producción | operativo | — | medio | allowlist humana |
| `src/FichaIncidencia.html` | A — Producción | operativo | — | medio | allowlist humana |
| `src/FichaIncidenciaService.js` | A — Producción | operativo | — | medio | allowlist humana |
| `src/FichaMaterial.html` | A — Producción | operativo | — | medio | allowlist humana |
| `src/FichaMaterialService.js` | A — Producción | operativo | — | medio | allowlist humana |
| `src/FichaPersonaEquipo.html` | A — Producción | operativo | — | medio | allowlist humana |
| `src/FichaPersonaEquipoService.js` | A — Producción | operativo | — | medio | allowlist humana |
| `src/FichaProducto.html` | A — Producción | operativo | — | medio | allowlist humana |
| `src/FichaProductoService.js` | A — Producción | operativo | — | medio | allowlist humana |
| `src/FichaProveedor.html` | A — Producción | operativo | — | medio | allowlist humana |
| `src/FichaProveedorService.js` | A — Producción | operativo | — | medio | allowlist humana |
| `src/FichaRecurso.html` | A — Producción | operativo | — | medio | allowlist humana |
| `src/FichaRecursoService.js` | A — Producción | operativo | — | medio | allowlist humana |
| `src/FormularioGenerico.html` | A — Producción | operativo | — | medio | allowlist humana |
| `src/Formularios.js` | A — Producción | operativo | — | medio | allowlist humana |
| `src/GanttPlanReal.html` | A — Producción | operativo | — | medio | allowlist humana |
| `src/GeneracionCodigo.js` | A — Producción | operativo | — | medio | allowlist humana |
| `src/GestionCatalogo.html` | A — Producción | operativo | — | medio | allowlist humana |
| `src/GestionCatalogos.js` | A — Producción | operativo | — | medio | allowlist humana |
| `src/HistorialService.js` | A — Producción | operativo | — | medio | allowlist humana |
| `src/Ids.js` | A + deuda mixta | producción indispensable | B depende | tests en A | extracción futura |
| `src/ImportacionMasiva.js` | A — Producción | operativo | — | medio | allowlist humana |
| `src/Includes.js` | A — Producción | operativo | — | medio | allowlist humana |
| `src/InformeGenerico.html` | A — Producción | operativo | — | medio | allowlist humana |
| `src/InstaladorAsignacion.js` | A — Producción | operativo | — | medio | allowlist humana |
| `src/InstaladorCampanaEstiuYNavidadAmpliada.js` | B/Auxiliar | datos piloto | requiere A | contaminación | separar fixtures |
| `src/InstaladorCampanaMercatsTardor.js` | B/Auxiliar | datos piloto | requiere A | contaminación | separar fixtures |
| `src/InstaladorCatalogosL2.js` | A — Producción | operativo | — | medio | allowlist humana |
| `src/InstaladorCompetencia.js` | A — Producción | operativo | — | medio | allowlist humana |
| `src/InstaladorConvocatoria.js` | A — Producción | operativo | — | medio | allowlist humana |
| `src/InstaladorCoste.js` | A — Producción | operativo | — | medio | allowlist humana |
| `src/InstaladorCriteriosAceptacion.js` | A — Producción | operativo | — | medio | allowlist humana |
| `src/InstaladorDatosPruebaPiloto.js` | B/Auxiliar | datos piloto | requiere A | contaminación | separar fixtures |
| `src/InstaladorDatosPruebaPilotoAmpliado.js` | B/Auxiliar | datos piloto | requiere A | contaminación | separar fixtures |
| `src/InstaladorEjecucionTarea.js` | A — Producción | operativo | — | medio | allowlist humana |
| `src/InstaladorEntidadPersonaDocumento.js` | A — Producción | operativo | — | medio | allowlist humana |
| `src/InstaladorEquipoMiembro.js` | A — Producción | operativo | — | medio | allowlist humana |
| `src/InstaladorHorario.js` | A — Producción | operativo | — | medio | allowlist humana |
| `src/InstaladorHorarioEquipoProduccion.js` | A — Producción | operativo | — | medio | allowlist humana |
| `src/InstaladorImpacto.js` | A — Producción | operativo | — | medio | allowlist humana |
| `src/InstaladorImportacionMasiva.js` | A — Producción | operativo | — | medio | allowlist humana |
| `src/InstaladorJerarquiaFisica.js` | A — Producción | operativo | — | medio | allowlist humana |
| `src/InstaladorMejorasAuditoriaPiloto.js` | A — Producción | operativo | — | medio | allowlist humana |
| `src/InstaladorMetodoCalculoAvance.js` | A — Producción | operativo | — | medio | allowlist humana |
| `src/InstaladorModoUso.js` | A — Producción | operativo | — | medio | allowlist humana |
| `src/InstaladorMovimientoMaterial.js` | A — Producción | operativo | — | medio | allowlist humana |
| `src/InstaladorNivelDato.js` | A — Producción | operativo | — | medio | allowlist humana |
| `src/InstaladorPaqueteInformes.js` | A — Producción | operativo | — | medio | allowlist humana |
| `src/InstaladorPedidoRecepcion.js` | A — Producción | operativo | — | medio | allowlist humana |
| `src/InstaladorPresupuesto.js` | A — Producción | operativo | — | medio | allowlist humana |
| `src/InstaladorProveedorMaterial.js` | A — Producción | operativo | — | medio | allowlist humana |
| `src/InstaladorRecurso.js` | A — Producción | operativo | — | medio | allowlist humana |
| `src/InstaladorRelacion.js` | A — Producción | operativo | — | medio | allowlist humana |
| `src/InstaladorRolPersonaAtendida.js` | A — Producción | operativo | — | medio | allowlist humana |
| `src/InstaladorTipoVinculoIncidencia.js` | A — Producción | operativo | — | medio | allowlist humana |
| `src/InstaladorVinculo.js` | A — Producción | operativo | — | medio | allowlist humana |
| `src/InstrumentacionService.js` | A — Producción | operativo | — | medio | allowlist humana |
| `src/IntegridadReporte.html` | A — Producción | operativo | — | medio | allowlist humana |
| `src/IntegrityService.js` | A — Producción | operativo | — | medio | allowlist humana |
| `src/KanbanOperativo.html` | A — Producción | operativo | — | medio | allowlist humana |
| `src/KanbanService.js` | A — Producción | operativo | — | medio | allowlist humana |
| `src/LecturaBatchService.js` | A — Producción | operativo | — | medio | allowlist humana |
| `src/ListadoFiltrable.html` | A — Producción | operativo | — | medio | allowlist humana |
| `src/ListadoFiltrableService.js` | A — Producción | operativo | — | medio | allowlist humana |
| `src/ModalConfirmar.html` | A — Producción | operativo | — | medio | allowlist humana |
| `src/NivelDatoService.js` | A — Producción | operativo | — | medio | allowlist humana |

| Archivo | Paquete propuesto | Motivo | Dependencia cruzada | Riesgo | Decisión pendiente |
|---|---|---|---|---|---|
| `src/PanelCampana.html` | A — Producción | operativo | — | medio | allowlist humana |
| `src/PanelCampanaService.js` | A — Producción | operativo | — | medio | allowlist humana |
| `src/PanelOperativo.html` | A — Producción | operativo | — | medio | allowlist humana |
| `src/PanelPersonas.html` | A — Producción | operativo | — | medio | allowlist humana |
| `src/PanelPersonasService.js` | A — Producción | operativo | — | medio | allowlist humana |
| `src/PanelRecursos.html` | A — Producción | operativo | — | medio | allowlist humana |
| `src/PanelRecursosService.js` | A — Producción | operativo | — | medio | allowlist humana |
| `src/PedidoRecepcion.js` | A — Producción | operativo | — | medio | allowlist humana |
| `src/ProcesoService.js` | A — Producción | operativo | — | medio | allowlist humana |
| `src/ProductoService.js` | A — Producción | operativo | — | medio | allowlist humana |
| `src/Proteccion.js` | A — Producción | operativo | — | medio | allowlist humana |
| `src/ProyectoService.js` | A — Producción | operativo | — | medio | allowlist humana |
| `src/ReportService.js` | A — Producción | operativo | — | medio | allowlist humana |
| `src/Repository.js` | A + deuda mixta | producción indispensable | B depende | tests en A | extracción futura |
| `src/Repository_InsertarRegistro.js` | A — Producción | operativo | — | medio | allowlist humana |
| `src/Reversion.js` | A — Producción | operativo | — | medio | allowlist humana |
| `src/SelectorRegistro.html` | A — Producción | operativo | — | medio | allowlist humana |
| `src/SerializacionService.js` | A — Producción | operativo | — | medio | allowlist humana |
| `src/StockMaterialService.js` | A — Producción | operativo | — | medio | allowlist humana |
| `src/TareaService.js` | A — Producción | operativo | — | medio | allowlist humana |
| `src/Tests_AvanceYSecuencia.js` | B — Pruebas | prueba explícita | requiere A | escrituras | dependencias |
| `src/Tests_CosteService.js` | B — Pruebas | prueba explícita | requiere A | escrituras | dependencias |
| `src/Tests_ImportacionRecursosPersonas.js` | B — Pruebas | prueba explícita | requiere A | escrituras | dependencias |
| `src/Tests_IntegridadGapReglasFuncional.js` | B — Pruebas | prueba explícita | requiere A | escrituras | dependencias |
| `src/Tests_LecturaBatch.js` | B — Pruebas | prueba explícita | requiere A | escrituras | dependencias |
| `src/Tests_Repository.js` | B — Pruebas | prueba explícita | requiere A | escrituras | dependencias |
| `src/Tests_Repository2.js` | B — Pruebas | prueba explícita | requiere A | escrituras | dependencias |
| `src/Validation.js` | A — Producción | operativo | — | medio | allowlist humana |

SIMULACIÓN ESTÁTICA: no es un listado ejecutable ni autoriza copia/exportación.

### F06.7 — Casos críticos

| Caso | Respuesta | Estado | Evidencia |
|---:|---|---|---|
| 1 | Sí como archivo, no como suite autosuficiente | VERIFICADO | 0 llamadas a Repo2; 81 dependencias A |
| 2 | No se localizaron llamadas a definiciones de Repo1 | VERIFICADO | 209/200 definiciones; intersección 0 |
| 3 | No se localizaron funciones productivas consumidas desde producción | INFERENCIA | análisis nominal; runtime no ejecutado |
| 4 | Sí: Repository.js e Ids.js; siete Tests_* totales | VERIFICADO | 51+5 incrustadas |
| 5 | Sí, elimina API productiva necesaria | VERIFICADO | consultas/actualización/baja |
| 6 | Sí, introduce 51 pruebas históricas | VERIFICADO | funciones 302–8335 |
| 7 | No puede excluirse sin romper generación ID | VERIFICADO | obtenerSiguienteId*/locks |
| 8 | Auxiliar/fixtures, no A por defecto | PROPUESTA | datos piloto ejecutables |
| 9 | Orden nominal no debería mandar; inicializaciones globales pueden importar | INFERENCIA | runtime no verificado |
| 10 | Cada paquete desplegable necesita manifiesto, posiblemente mínimo distinto | PROPUESTA | actual no lo exporta |

### F06.8 — Riesgo UX y operativo

| Área | Efecto | Riesgo |
|---|---|---|
| Menú | operación y admin juntas | error humano |
| Globales | pruebas invocables | ejecución accidental |
| Errores | capas filtran detalles | mensajes técnicos |
| Mantenimiento | archivos mixtos | regresión/tiempo |
| Pruebas | fixtures escriben | datos reales |
| Despliegue | lista nominal | paquete contaminado/incompleto |
| Revisión | archivos gigantes | alcance difícil |
| Trazabilidad | sin hashes | contenido no probado |
| Reversión | Drive sin cleanup | artefactos parciales |

### F06.9 — Hallazgos

| ID | Evidencia | Problema | Consecuencia | Severidad | Confianza | Ámbito |
|---|---|---|---|---|---|---|
| F06-H01 | 7 Tests_* frente a lista 3 | 4 pruebas quedan en A | despliegue contaminado | P0 | Alta | exportación |
| F06-H02 | Repository: 51 pruebas | archivo mixto | ejecución/revisión | P1 | Alta | arquitectura |
| F06-H03 | Ids: 5 pruebas | generador mixto | no excluible | P1 | Alta | arquitectura |
| F06-H04 | filtro SERVER_JS | omite HTML/manifiesto | no reconstruible | P0 | Alta | exportación |
| F06-H05 | índice sin hashes | evidencia nominal | contenido no verificable | P1 | Alta | trazabilidad |
| F06-H06 | estado remoto/fecha | sin snapshot | no reproducible | P1 | Alta | exportación |
| F06-H07 | Drive sin cleanup | sin rollback | residuos | P2 | Alta | operación |
| F06-H08 | B solo tres pruebas | sin producción | suite no autónoma | P1 | Alta | pruebas |
| F06-H09 | Formularios 115 funciones | capas juntas | cambio transversal | P1 | Alta | arquitectura |
| F06-H10 | Validation 119 Sheets | regla/aplicación juntas | difícil probar | P1 | Alta | arquitectura |
| F06-H11 | fixtures ejecutables | entorno ambiguo | contaminación | P1 | Alta | datos |
| F06-H12 | onOpen→admin | acciones sensibles | error humano | P2 | Alta | UX |
| F06-H13 | script ID fijo/scopes | origen acoplado | origen erróneo | P1 | Alta | config |
| F06-H14 | Integrity productivo | exclusión por nombre | pierde controles | P1 | Alta | clasificación |
| F06-H15 | Repo1/2 independientes entre sí, dependientes de A | separación nominal | B requiere matriz | P2 | Alta | pruebas |

### Propuestas sin implementación

| Alternativa | Cambio requerido | Ventaja | Riesgo | Mantenibilidad | Reversión |
|---|---|---|---|---|---|
| Lista explícita | allowlist A/B/Aux+hash | falla ante nuevos | manual | Alta | retirar lista |
| Prefijo | Tests_* | simple | no ve incrustadas | Media | fácil |
| Extracción física | mover tests mixtos | separación real | regresión | Alta futura | compleja |
| Manifiesto de paquete | JS/HTML/JSON/bytes/hash | reconstruible | más diseño | Alta | mantener anterior |
| Dos proyectos | runtime A/B | aislamiento | doble gestión | Alta | volver a uno |

**PROPUESTA:** empezar sin mover fuentes: allowlist cerrada A/B/Aux, error ante no clasificados, manifiesto con ruta/tipo/bytes/SHA-256, HTML y JSON, dependencias cruzadas y revisión humana. Repository/Ids quedan temporalmente en A como deuda; B declara dependencia de A. Extraer físicamente solo después de cobertura y reversión probadas.

### Hashes de los 110 ejecutables analizados

| Archivo | SHA-256 |
|---|---|
| `src/appsscript.json` | `8b154472f9fbeb54d6ac82f8c0622d16f4243a61932aa024825a0e0f7e080b4f` |
| `src/AvanceYSecuencia.js` | `752fa1c0d59825e05c1e51333d7ae77a91d242123cd350c30eedac0bdc90b234` |
| `src/CacheLecturaService.js` | `b2a3ceaaf206d71eae20ff7c0fc916fca97654ce9e7360f16e5b919215dd5401` |
| `src/CampaniaService.js` | `8fdeed02ef0d587fe4c889234570dd7c7dc900019655b80823c0117c15fbacd1` |
| `src/Código.js` | `c5bb093173f04ab7f7226f433cc3cbcd3a8157df68687d693175d3fd4690456a` |
| `src/ConfigRepository.js` | `647fd4202287c8ac9a9631a4a49b8fdaf18a3589ca793e36afc6f1575365e5b5` |
| `src/CorregirCatalogoTipoProyecto.js` | `cb262bab21508885a90a47dffd0b03856097b64aaa5f1f6fbe70119a36c54c59` |
| `src/CosteService.js` | `f788e998b19f48f8187e1b0ff0c0ffab25d777bcb2dad90a9e6bb9241e41f973` |
| `src/DashboardService.js` | `f452c90ae013f8a54db22133b200faed5f9fd39b102cb8b4ff8c08b927fd522e` |
| `src/DesviacionService.js` | `e389211b9759a996d9cbe53e1ba054bdff20cd7bb114391693135f8531ceec61` |
| `src/DisponibilidadService.js` | `4e6e286291b9ade40c7ce0515d940049bf2b8300e818992c669c38f2b2a4e439` |
| `src/EdicionDirecta.js` | `65ef422bf279a0506b890a2cad77a1f048b7590f30333f31bf01eb8e6232db64` |
| `src/Estilos.html` | `2e3df759ede71610f7f4c1a91633bf6262c17d4969287f453f7ee0468cc1062e` |
| `src/EvidenciaSocialService.js` | `b347969c382b5999250ffb4c0090e5f6b235f02a436389674187c94185bf989d` |
| `src/ExportarCodigoProduccion.js` | `41827821a90a53b97a11d52d85784baa45caa4ee706524ba82b0707d6f331185` |
| `src/FichaConvocatoria.html` | `97c31ea1c13eca948d5255d550ea38b6693ad91b0806b40d751e5fff63c7fbeb` |
| `src/FichaConvocatoriaService.js` | `c5dc19eddd924ed9272688774dd2181606aa03fe4e018a83cb9f507d53c219c2` |
| `src/FichaIncidencia.html` | `8542701d57c43beeed7c4925fb65d6d08fb6910422cbaeb8d3d34c27be882c3d` |
| `src/FichaIncidenciaService.js` | `d87c21abe4ea4694a98e544a1ba30181f61bf4850e7422f45c35b4a6b18dcb47` |
| `src/FichaMaterial.html` | `bbc543df1d6571608d41704c71ab3b91a95051a311612c2649f4fc225f0e1397` |
| `src/FichaMaterialService.js` | `c4ca89c83aeba226fab66fb3f669e8a6c9433b3128ccc5f882888cab67f7c96d` |
| `src/FichaPersonaEquipo.html` | `b0b8cf56eb0e1b4f89ccd98edf5dd6bbe656d14636ec9378f0fcf5cae496f550` |
| `src/FichaPersonaEquipoService.js` | `0ab389071c8ac207b4b7fd426946c0cb0f3044ab6e268c63fc5c55730ba8f4cb` |
| `src/FichaProducto.html` | `14b9a8e0b56231c8e5b0269cabd6f0019a836b18b016d5208f005c6fdc4e0404` |
| `src/FichaProductoService.js` | `cfbc714223152591b3c22fcfff52d6d441b203afeaf508e73e515d0fd128817c` |
| `src/FichaProveedor.html` | `a8917f0b821d6cd7da0f955cb31b4fc340a64f7ecfd0aa3984bab8c046e71fd5` |
| `src/FichaProveedorService.js` | `db067fc529eb4949a45ebd03e3184a04afa60fe2d55343fcb89b2879413a7fad` |
| `src/FichaRecurso.html` | `6eb88fe2ab8db9b42b95e32fd3669baa41a8f360017bd991b04dde55cec86ec2` |
| `src/FichaRecursoService.js` | `23997911c62386a274e37c8e7d7e625be31ddf484405a178dc9d03a0ab114bcb` |
| `src/FormularioGenerico.html` | `a9e53541d3326dadd7b71e8e907d4104471a44b317bdc923bf4679428805a4f5` |
| `src/Formularios.js` | `14e495f83f15708f86f5a05e57d46438fc81aca71f5d37331ac432dc843ea2de` |
| `src/GanttPlanReal.html` | `0188bfb8e85883ad6a5071583912a08898ba1bd2ed370adf3e072afee7f1fbcf` |
| `src/GeneracionCodigo.js` | `aded9126acd0b8e9523f9a85f8a6cfb33dc214cf83ef41551e45bca4767cc319` |
| `src/GestionCatalogo.html` | `31f31f4d8c360a944eb68de3656009ba5da223da2dae03fa9972ca13d00471c0` |
| `src/GestionCatalogos.js` | `63aaf48250cb783029836d8758e27607c46e097c02273f34fe5a16a5b468dd0a` |
| `src/HistorialService.js` | `a66deababd7a1bd1b6522a0a9c76af7df397e655037446ecbfa0b577a63f2d71` |
| `src/Ids.js` | `17f75da065a8e210382e15b7104ea1f9cbafad28b7767769970d5b7d96bcff8e` |
| `src/ImportacionMasiva.js` | `cba55c2a18d48bafcf5077a051b6acd5e16793e8e5b48b0295e5f4012eeefa36` |
| `src/Includes.js` | `bb3ba83d64e0b31954a0fa03a7ee28c27a065a716dd7b99c18976b42a03617e8` |
| `src/InformeGenerico.html` | `340dbdc5f5ffa7f0aa042a5355a82fea1c3a85f97b68b1bfd1c374c46c36315b` |
| `src/InstaladorAsignacion.js` | `51b33af8953423c16f62c29d3d6b76e5bb861535d4123c82952abeafee7447c1` |
| `src/InstaladorCampanaEstiuYNavidadAmpliada.js` | `47dfc5d483402cbcf30c5c27cc658c9ef064c438f6945e9cf954d0664474910c` |
| `src/InstaladorCampanaMercatsTardor.js` | `9e36916e25674bcfba0143cf4a7f08b6bb8e13edf7913b4eabd05c9976f8eb03` |
| `src/InstaladorCatalogosL2.js` | `92a8cd799352c2aa8f4641277116f6e6eff0b62904c0e7254fe698e91359c00a` |
| `src/InstaladorCompetencia.js` | `1e60e04bcba81ae767fbd6331793b1e6c438c459f24a28b15ff3614e8abcb101` |
| `src/InstaladorConvocatoria.js` | `ceef7c39e4abee7aa1d8aeecf9980e1ad4131164307255081cc0ae9eadfabb1e` |
| `src/InstaladorCoste.js` | `207ccecf3060a40939762b652845174c2d66ce8f17d1b1d0945c57c6044925e2` |
| `src/InstaladorCriteriosAceptacion.js` | `9012e1c99c97987d677c57f4b705e7ea7a0b2bb9e31b161ee4d827b683ab3c09` |
| `src/InstaladorDatosPruebaPiloto.js` | `63cc7b394d525a6552f52e6a0ad3327892cdaab8eec96dd89fa0bbe6c1b2e937` |
| `src/InstaladorDatosPruebaPilotoAmpliado.js` | `f1c858f50a88f5d33232d7cebbf712481d6f74a69d69854f82fd098c63455d58` |
| `src/InstaladorEjecucionTarea.js` | `d9c8ea861383ac52b15f7a7c1eb094c29c574cb845322a7b8f905e893ff53260` |
| `src/InstaladorEntidadPersonaDocumento.js` | `f08cd6b1117d7b04830adc1433f2b291a00db61e2e5a130c32af56c7a7e7c4d9` |
| `src/InstaladorEquipoMiembro.js` | `98c7c2d31d4a45d70eba6f3d71a9ae7f7b80d32af81c09a835b9eedd3638cdd9` |
| `src/InstaladorHorario.js` | `9c016a530911b0fe2799b28a95be33107bc215cd72ce419e890314a297b29527` |
| `src/InstaladorHorarioEquipoProduccion.js` | `1132faf06f5b6e4652ce679b577c53d175260928431e76f616fc9af7ff32d57d` |
| `src/InstaladorImpacto.js` | `c140f912c6abb43a08033c6bb89b76dac8057a129971d2d43e569f99b908de85` |
| `src/InstaladorImportacionMasiva.js` | `03709f3c9d8b09aa2a5705079e8b00d2fe25da4369d96446905c70915e5cbaaa` |
| `src/InstaladorJerarquiaFisica.js` | `1891da7b224c8065aeea9f8766ecaaad8324abf92eb1f9504f68e035f7ccf398` |
| `src/InstaladorMejorasAuditoriaPiloto.js` | `2078bff0a57eca32220248bab6a211531f3b74d0afd052047c5fa7b1001f0ab7` |
| `src/InstaladorMetodoCalculoAvance.js` | `087328f079d168756df40dcbb363365d7a950a6da15de1095f4d0a1730db34fe` |
| `src/InstaladorModoUso.js` | `a33b75369c8edd9c4c4d3515fc8ecb5a7754de2027657f5ac48d1ecbce44500d` |
| `src/InstaladorMovimientoMaterial.js` | `66b7b698a24cf50e7d09c4679ed503eda3004cf3b08a7b2e4417fc8137c4b790` |
| `src/InstaladorNivelDato.js` | `fb9b61a7b9e1ac4ec73abc5f0eeed6772f6f823953bde02d0bc95f43fc1ed4bf` |
| `src/InstaladorPaqueteInformes.js` | `28532180877aae7e312f8f56eb7b4347f5579b6ffa1d5be1eebcadd5f9b7f28c` |
| `src/InstaladorPedidoRecepcion.js` | `1e425e84d907a2d407d07e62213c0504ca36a20190e9170b39ef126dfd37d30b` |
| `src/InstaladorPresupuesto.js` | `948b547d27dbc5550656036b8e24a17b1dba720d2d073267aa5ce7433227818a` |
| `src/InstaladorProveedorMaterial.js` | `e1d762cd81b176fdc1e9284ba30ed24ea9600d48da9ce492814a81dea7999b3f` |
| `src/InstaladorRecurso.js` | `a8201a9d95a5bed1e6e2fb20267ecbd2278faabf1df3bdcf3039b7b38436c8f6` |
| `src/InstaladorRelacion.js` | `73f95d454e70b1fabbed38530b3cb6169b4647a72ef2d9d822bd9a6269570414` |
| `src/InstaladorRolPersonaAtendida.js` | `e755ca91a06d3b5682c4f14829022c876ca8330477895fccbdef079092ef9194` |
| `src/InstaladorTipoVinculoIncidencia.js` | `349f79c5fc292c3d46aa86a8884445bd32d02d59041b44fb6de5e2704aae7394` |
| `src/InstaladorVinculo.js` | `ef34cd381bc3bcc8d8675d3f741f445cc695c9b90310dd66021c2b43effd85a1` |
| `src/InstrumentacionService.js` | `e16f6cd90c2a0ccc99a4203c765ee0db47509d44411ad2a03480915559f870b3` |
| `src/IntegridadReporte.html` | `f38bbe152a5e257cf365259f43e56d1bbdba94f1dc76bb81bc984664052af971` |
| `src/IntegrityService.js` | `c8bf30e81ca85a0fa3f5824aabc4e99a4953296c6e2ba7b89aab8f9b36c29026` |
| `src/KanbanOperativo.html` | `219f45815c90aeba056f79c05b3b45ffcbb74d31586ad968f53272aab6a727a8` |
| `src/KanbanService.js` | `93d26cb68389cdb4985a02b8eadcd2d2c5989957b4bc99e9828aaf78e8be9755` |
| `src/LecturaBatchService.js` | `321d42f087f8dad6cf2db3b8cb4c11c26ba61a2a5d1de443cd070773fa64e857` |
| `src/ListadoFiltrable.html` | `a63f41ec683c353ce7e1e4c8c9e8b219f4b2704b82d1d8504b72d1e8954fe8af` |
| `src/ListadoFiltrableService.js` | `1587ca25a38b40f3f2fb3fda159b9a26c2eb3f71dc360b5890a10e7ff9144300` |
| `src/ModalConfirmar.html` | `dbc5c69c324007620c1e857ce28c8490ff6bbd05b41a3fc0cf1721ec88301afd` |
| `src/NivelDatoService.js` | `d451b59694a7c4086259a188c0d7f6184e7df91d454aed7e8e1ccc74d8b9cb94` |
| `src/PanelCampana.html` | `2c16ab26c648d1bd52db18dd6a08cdfac7bf1e3f9f09826caaab06855ff443e7` |
| `src/PanelCampanaService.js` | `2d28226a336461b68210df3ee921165ea298a336804c6d7c68e02e1ac4d31067` |
| `src/PanelOperativo.html` | `662e10bd24bac1f66c4e7f313ce9457953e3ab8418138d65f9e1964dd50d80da` |
| `src/PanelPersonas.html` | `57303b3934f2c17c5086019e6a5cd032b421b9f2969a56c1c9e9f0a501d6d41d` |
| `src/PanelPersonasService.js` | `6cda80096224bc98d3274f67b3c9d70eee85e14a7692193f8e1b91bdab5346d4` |
| `src/PanelRecursos.html` | `62ed3751de9b5d8cc28bc2c8494eedf1a1709c9a161ad1b262e6a099d6fb647b` |
| `src/PanelRecursosService.js` | `2d221cb0491cde34c1d371736959a69f138eedfaec1ab5dba24b36dfd9119ac7` |
| `src/PedidoRecepcion.js` | `02b2e27989053f71e4971fcbc4c479c612a7d098ae05354998de00307072785a` |
| `src/ProcesoService.js` | `07edc944f54100b2cb34ded2379d11096a0d1470207985cdefec5471a4d18b78` |
| `src/ProductoService.js` | `5ce352725445cf5580d782fe47cb84b98b3dd3f5c620896d45257e9fff62b547` |
| `src/Proteccion.js` | `4d94822d5d1f51678147614977cf9210c3333c7eaa105ef7e971de954654f241` |
| `src/ProyectoService.js` | `373066e6d9d632747de61d1cb13586973b8e713f4b149619fb38bdec52f80a33` |
| `src/ReportService.js` | `923dbffd097163fc55e3b76210ed5f0652c7f47d654e9efac3252028deebca4f` |
| `src/Repository.js` | `bc8f19f506e870ddbcde507efa0b31d90c69ee445b0e93d722ee731006b5d0cb` |
| `src/Repository_InsertarRegistro.js` | `c28502c4d93d245e66c6269f535dc59f7bb2ebb850e8a1372c57e44323d7ddd6` |
| `src/Reversion.js` | `d81b5f1232f5f2a9a8d82191f3ad508bfb150c0cbd2782304099daf9f94b0735` |
| `src/SelectorRegistro.html` | `04e63894fdecf4ef870b4f3614e89c65f4977864beea02b70672b19484bf78a1` |
| `src/SerializacionService.js` | `35c31d085ec5144fe2ec699829ccabc0a65fc35d9f98ba8a1042fc5dd9a0a120` |
| `src/StockMaterialService.js` | `ec3230cf7f659e7fe07a67ffa9dad31e0062730b8f9cb79ee25b4a6cf9600eea` |
| `src/TareaService.js` | `6bc902c0ecce4c563e3431147b93dbf9352009841f83a4c359bc5d3169f2e42f` |
| `src/Tests_AvanceYSecuencia.js` | `d0a25ffad2b7717412a9f12918d70026432dd71b4a8f8710b6098b572ee22561` |
| `src/Tests_CosteService.js` | `1fa00cf5cf57a9807f9510ce86c8f0e9834d3774864c6a9b5c864ed844d71f90` |
| `src/Tests_ImportacionRecursosPersonas.js` | `43ced7eb6cebc0e5c518e81b320b94d988ed4cab2c229b3ec15c55691ffdb164` |
| `src/Tests_IntegridadGapReglasFuncional.js` | `d3aae8e9b6c4d1f9a122b7828e502b64e919057c23dbb390af11b1a8a5032848` |
| `src/Tests_LecturaBatch.js` | `9dea37c0c516e8c0c114c8c16e14a91b60f675875fc240559273ef9af85167b4` |
| `src/Tests_Repository.js` | `d31821d51b7ee80616dd9372e3e64be89d141e45e51fa227b58704d8f3082eb6` |
| `src/Tests_Repository2.js` | `857d3e68f8911369cbdb6fc68f072f4aaddaf8108196d22aaeed9b4e5c7a912d` |
| `src/Validation.js` | `6f88b5c5d29db911b32f1e97443a5e63265c41b9fa2c05d9018f99700f3a1aae` |

### Limitaciones, resultado y gate

**NO VERIFICADO:** runtime, carga global, permisos efectivos, contenido remoto, script ID, datos, atomicidad, tiempos, colisiones, reconstrucción, scopes mínimos y fallo parcial. No hubo red.

**Resultado F06:** separación insuficiente. Archivos mixtos, pruebas incrustadas y exportación nominal impiden garantizar A limpio y B reproducible. Dos pasadas solo son viables como PROPUESTA con clasificación explícita, dependencias, manifiestos completos y hashes.

**Gate F06 pendiente de aprobación humana. No se inició F07.**

Siguiente fase propuesta: **F07 — matriz de separación y contrato de empaquetado**, sin mover archivos ni exportar hasta aprobación.

## F07 — Matriz de separación y contrato de empaquetado

### Alcance, línea base y universo cerrado

Diseño documental únicamente. Continúa el **NO_GO operativo** para exportar, desplegar, copiar, crear paquetes o ejecutar instaladores. Línea base: roadmap 159.741 bytes y SHA-256 `0b396e23497c905f9a47828f6a73482aa896d0554e97cee980b4bc9660774618`; Git: roadmap modificado y manual no rastreado; manual `a18332565c408e9f283df26201c1a6745d1699ce9fd557d709d980225321c1fc`.

| Magnitud | Recuento | Evidencia |
|---|---:|---|
| Universo F01 | 134 | rutas únicas del inventario |
| Ejecutables F06 | 110 | 88 JS + 21 HTML + `src/appsscript.json` |
| Documentos | 23 | Markdown |
| Configuración no ejecutable | 1 | `.clasp.json` |
| Rutas duplicadas | 0 | comparación exacta |
| Sin decisión | 0 | matriz siguiente |

Cierre: **64 Producción + 7 Pruebas + 34 Auxiliar + 24 Excluidos + 5 Mixtos = 134**. La fila del propio roadmap usa el hash real previo a F07: un hash posterior escrito dentro de sí mismo es autorreferencial e inestable; el hash posterior se verifica externamente al final.

### F07.2 — Matriz canónica

| Ruta relativa | Tipo | SHA-256 actual | Categoría | Incluir | Dependencias | Motivo | Riesgo | Decisión humana |
|---|---|---|---|---|---|---|---|---|
| `.clasp.json` | json | `74afd2762554f31b9c3d125c75d94bd7362120fc6bdfa25d9a7e8cdd7b13161d` | Excluidos | No | clasp local | no desplegable | inclusión accidental | Aprobar matriz |
| `ACTA_CIERRE_SESION.md` | md | `68e6d5310851f8bda26a99d84d365af45e6f0e5bd3e2955bf5ee41b0717e7436` | Excluidos | No | ninguna runtime | no desplegable | inclusión accidental | Aprobar matriz |
| `AUDITORIA_POR_BLOQUES.md` | md | `380d6f34d8c4879633504ace754c3b1e1e1721dfb717c00d436e5e3c4037c959` | Excluidos | No | ninguna runtime | no desplegable | inclusión accidental | Aprobar matriz |
| `BACKLOG_CONSOLIDADO.md` | md | `c89b9fb466657daea8c5b50564b135bf23e3fc07adb4ab0f6ff21a948036e950` | Excluidos | No | ninguna runtime | no desplegable | inclusión accidental | Aprobar matriz |
| `BASELINE_DESARROLLO.md` | md | `447e8bee12b758bf1db85f119cd78d84ca781ad8c958d6c118eb81fcb615af9a` | Excluidos | No | ninguna runtime | no desplegable | inclusión accidental | Aprobar matriz |
| `HASHES_CIERRE.md` | md | `7cd2e2f34a17661c65eeb69aa3b439105d2b5f1236651117d0ad3d3f9de58348` | Excluidos | No | ninguna runtime | no desplegable | inclusión accidental | Aprobar matriz |
| `INFORME_CIERRE_AUDITORIA_GLOBAL.md` | md | `68b5e3518f56562a224a1f182c057ff9fed35b605273a1c68a7c495deeeb1704` | Excluidos | No | ninguna runtime | no desplegable | inclusión accidental | Aprobar matriz |
| `MANUAL_MARCO_FUNDAMENTAL.md` | md | `a18332565c408e9f283df26201c1a6745d1699ce9fd557d709d980225321c1fc` | Excluidos | No | ninguna runtime | no desplegable | inclusión accidental | Aprobar matriz |
| `PROPUESTA_CAMPANA_ALTA_PLANIFICACION.md` | md | `1d68b73f2eba7ac5fc42c66e888b9480c8a84b00bb65f18d27e30d06eb42b729` | Excluidos | No | ninguna runtime | no desplegable | inclusión accidental | Aprobar matriz |
| `PROPUESTA_DECISION_ALTA.md` | md | `33b95abd2219a2d0557ea9d61b9d5938fd4d3c17af6fd1f7e58e655936b2d678` | Excluidos | No | ninguna runtime | no desplegable | inclusión accidental | Aprobar matriz |
| `PROPUESTA_DOCUMENTO_ALTA.md` | md | `6826d6b383e18c24765e6cdd28c1ecc18e9779741e3b77a52ef80196995804c8` | Excluidos | No | ninguna runtime | no desplegable | inclusión accidental | Aprobar matriz |
| `PROPUESTA_INCIDENCIA_ALTA.md` | md | `078f7d10221bd563b9056fac635858cf985bbe299ac4d19d3a70c00740a99917` | Excluidos | No | ninguna runtime | no desplegable | inclusión accidental | Aprobar matriz |
| `PROPUESTA_PROCESO_ALTA.md` | md | `9ec74372e169eb21fc431c9e2140c4838a3b1d9b23ed8c17699e87fd2b246d22` | Excluidos | No | ninguna runtime | no desplegable | inclusión accidental | Aprobar matriz |
| `PROPUESTA_PRODUCTO_ALTA.md` | md | `20b0f36f8db8bf88e470d750019d531d282f3360cc5d5043a7cb63852217a14a` | Excluidos | No | ninguna runtime | no desplegable | inclusión accidental | Aprobar matriz |
| `PROPUESTA_PROVEEDOR_ALTA.md` | md | `dde5b3e88f1d38cea3a690496ae12a003d16e2224185d93939fc7ab23f470e3f` | Excluidos | No | ninguna runtime | no desplegable | inclusión accidental | Aprobar matriz |
| `PROPUESTA_PROYECTO_ALTA_PLANIFICACION.md` | md | `d50ab6c9e1c032f31f1c17619e8493cd8597f4ad3888583ec9fc843c36e7d08a` | Excluidos | No | ninguna runtime | no desplegable | inclusión accidental | Aprobar matriz |
| `PROPUESTA_PROYECTO_PRODUCTO_RELACION.md` | md | `f31e8f845f12572d837f4fdafd2f7583d119fbf737ef6eba8ae59a682415ec40` | Excluidos | No | ninguna runtime | no desplegable | inclusión accidental | Aprobar matriz |
| `PROPUESTA_RECURSO_MATERIAL.md` | md | `5edd69f81a0cbf2cebcf1cc9be0d4d62bdf3335964ffd470f7f3b8e29207f96b` | Excluidos | No | ninguna runtime | no desplegable | inclusión accidental | Aprobar matriz |
| `PROPUESTA_TAREA_ALTA.md` | md | `926d97ab1438b76d254de661f03ebd6e107c7deb827c70f59ee56880da872d44` | Excluidos | No | ninguna runtime | no desplegable | inclusión accidental | Aprobar matriz |
| `PRUEBA_PILOTO_END_TO_END.md` | md | `fbcbf5818b447e57183efcba40ebfd222de34c89cf8f03ee0b71ca2053f7614a` | Excluidos | No | ninguna runtime | no desplegable | inclusión accidental | Aprobar matriz |
| `PRUEBA_REAL_CAMPANA.md` | md | `ba956277fea231b9477d9c7f0c6dc101f991d663d4628f16a842aa018e5c3496` | Excluidos | No | ninguna runtime | no desplegable | inclusión accidental | Aprobar matriz |
| `ROADMAP_AUDITORIA_UX.md` | md | `0b396e23497c905f9a47828f6a73482aa896d0554e97cee980b4bc9660774618` | Excluidos | No | ninguna runtime | no desplegable | inclusión accidental | Aprobar matriz |
| `ROADMAP_BACKLOG_MEJORAS.md` | md | `f0c2c8f9c19280f9a1c68b80c7d2d470855226acf31e012502aa048eee989456` | Excluidos | No | ninguna runtime | no desplegable | inclusión accidental | Aprobar matriz |
| `ROADMAP_IMPLEMENTACION.md` | md | `2d90f3f385d5977ddbc7fa724c2614be31a3ff2d4a426a01bc7f9a07b6ff1e6d` | Excluidos | No | ninguna runtime | no desplegable | inclusión accidental | Aprobar matriz |
| `src\appsscript.json` | json | `8b154472f9fbeb54d6ac82f8c0622d16f4243a61932aa024825a0e0f7e080b4f` | Producción | A | runtime/scopes | operación/UI/config | omisión rompe A | Aprobar matriz |
| `src\AvanceYSecuencia.js` | js | `752fa1c0d59825e05c1e51333d7ae77a91d242123cd350c30eedac0bdc90b234` | Producción | A | A: globales/repos | operación/UI/config | omisión rompe A | Aprobar matriz |
| `src\CacheLecturaService.js` | js | `b2a3ceaaf206d71eae20ff7c0fc916fca97654ce9e7360f16e5b919215dd5401` | Producción | A | A: globales/repos | operación/UI/config | omisión rompe A | Aprobar matriz |
| `src\CampaniaService.js` | js | `8fdeed02ef0d587fe4c889234570dd7c7dc900019655b80823c0117c15fbacd1` | Producción | A | A: globales/repos | operación/UI/config | omisión rompe A | Aprobar matriz |
| `src\Código.js` | js | `c5bb093173f04ab7f7226f433cc3cbcd3a8157df68687d693175d3fd4690456a` | Producción | A | A: globales/repos | operación/UI/config | omisión rompe A | Aprobar matriz |
| `src\ConfigRepository.js` | js | `647fd4202287c8ac9a9631a4a49b8fdaf18a3589ca793e36afc6f1575365e5b5` | Producción | A | A: globales/repos | operación/UI/config | omisión rompe A | Aprobar matriz |
| `src\CorregirCatalogoTipoProyecto.js` | js | `cb262bab21508885a90a47dffd0b03856097b64aaa5f1f6fbe70119a36c54c59` | Auxiliar | C | A; manual | instalación/fixture/tooling | ejecución accidental | Confirmar ejecución |
| `src\CosteService.js` | js | `f788e998b19f48f8187e1b0ff0c0ffab25d777bcb2dad90a9e6bb9241e41f973` | Producción | A | A: globales/repos | operación/UI/config | omisión rompe A | Aprobar matriz |
| `src\DashboardService.js` | js | `f452c90ae013f8a54db22133b200faed5f9fd39b102cb8b4ff8c08b927fd522e` | Producción | A | A: globales/repos | operación/UI/config | omisión rompe A | Aprobar matriz |
| `src\DesviacionService.js` | js | `e389211b9759a996d9cbe53e1ba054bdff20cd7bb114391693135f8531ceec61` | Producción | A | A: globales/repos | operación/UI/config | omisión rompe A | Aprobar matriz |
| `src\DisponibilidadService.js` | js | `4e6e286291b9ade40c7ce0515d940049bf2b8300e818992c669c38f2b2a4e439` | Producción | A | A: globales/repos | operación/UI/config | omisión rompe A | Aprobar matriz |
| `src\EdicionDirecta.js` | js | `65ef422bf279a0506b890a2cad77a1f048b7590f30333f31bf01eb8e6232db64` | Producción | A | A: globales/repos | operación/UI/config | omisión rompe A | Aprobar matriz |
| `src\Estilos.html` | html | `2e3df759ede71610f7f4c1a91633bf6262c17d4969287f453f7ee0468cc1062e` | Producción | A | UI servidor | operación/UI/config | omisión rompe A | Aprobar matriz |
| `src\EvidenciaSocialService.js` | js | `b347969c382b5999250ffb4c0090e5f6b235f02a436389674187c94185bf989d` | Producción | A | A: globales/repos | operación/UI/config | omisión rompe A | Aprobar matriz |
| `src\ExportarCodigoProduccion.js` | js | `41827821a90a53b97a11d52d85784baa45caa4ee706524ba82b0707d6f331185` | Auxiliar | C | A; manual | instalación/fixture/tooling | ejecución accidental | Confirmar ejecución |
| `src\FichaConvocatoria.html` | html | `97c31ea1c13eca948d5255d550ea38b6693ad91b0806b40d751e5fff63c7fbeb` | Producción | A | UI servidor | operación/UI/config | omisión rompe A | Aprobar matriz |
| `src\FichaConvocatoriaService.js` | js | `c5dc19eddd924ed9272688774dd2181606aa03fe4e018a83cb9f507d53c219c2` | Producción | A | A: globales/repos | operación/UI/config | omisión rompe A | Aprobar matriz |
| `src\FichaIncidencia.html` | html | `8542701d57c43beeed7c4925fb65d6d08fb6910422cbaeb8d3d34c27be882c3d` | Producción | A | UI servidor | operación/UI/config | omisión rompe A | Aprobar matriz |
| `src\FichaIncidenciaService.js` | js | `d87c21abe4ea4694a98e544a1ba30181f61bf4850e7422f45c35b4a6b18dcb47` | Producción | A | A: globales/repos | operación/UI/config | omisión rompe A | Aprobar matriz |
| `src\FichaMaterial.html` | html | `bbc543df1d6571608d41704c71ab3b91a95051a311612c2649f4fc225f0e1397` | Producción | A | UI servidor | operación/UI/config | omisión rompe A | Aprobar matriz |
| `src\FichaMaterialService.js` | js | `c4ca89c83aeba226fab66fb3f669e8a6c9433b3128ccc5f882888cab67f7c96d` | Producción | A | A: globales/repos | operación/UI/config | omisión rompe A | Aprobar matriz |
| `src\FichaPersonaEquipo.html` | html | `b0b8cf56eb0e1b4f89ccd98edf5dd6bbe656d14636ec9378f0fcf5cae496f550` | Producción | A | UI servidor | operación/UI/config | omisión rompe A | Aprobar matriz |
| `src\FichaPersonaEquipoService.js` | js | `0ab389071c8ac207b4b7fd426946c0cb0f3044ab6e268c63fc5c55730ba8f4cb` | Producción | A | A: globales/repos | operación/UI/config | omisión rompe A | Aprobar matriz |
| `src\FichaProducto.html` | html | `14b9a8e0b56231c8e5b0269cabd6f0019a836b18b016d5208f005c6fdc4e0404` | Producción | A | UI servidor | operación/UI/config | omisión rompe A | Aprobar matriz |
| `src\FichaProductoService.js` | js | `cfbc714223152591b3c22fcfff52d6d441b203afeaf508e73e515d0fd128817c` | Producción | A | A: globales/repos | operación/UI/config | omisión rompe A | Aprobar matriz |
| `src\FichaProveedor.html` | html | `a8917f0b821d6cd7da0f955cb31b4fc340a64f7ecfd0aa3984bab8c046e71fd5` | Producción | A | UI servidor | operación/UI/config | omisión rompe A | Aprobar matriz |
| `src\FichaProveedorService.js` | js | `db067fc529eb4949a45ebd03e3184a04afa60fe2d55343fcb89b2879413a7fad` | Producción | A | A: globales/repos | operación/UI/config | omisión rompe A | Aprobar matriz |
| `src\FichaRecurso.html` | html | `6eb88fe2ab8db9b42b95e32fd3669baa41a8f360017bd991b04dde55cec86ec2` | Producción | A | UI servidor | operación/UI/config | omisión rompe A | Aprobar matriz |
| `src\FichaRecursoService.js` | js | `23997911c62386a274e37c8e7d7e625be31ddf484405a178dc9d03a0ab114bcb` | Producción | A | A: globales/repos | operación/UI/config | omisión rompe A | Aprobar matriz |
| `src\FormularioGenerico.html` | html | `a9e53541d3326dadd7b71e8e907d4104471a44b317bdc923bf4679428805a4f5` | Producción | A | UI servidor | operación/UI/config | omisión rompe A | Aprobar matriz |
| `src\Formularios.js` | js | `14e495f83f15708f86f5a05e57d46438fc81aca71f5d37331ac432dc843ea2de` | Mixtos | A provisional; deuda | A/B por función | producción+deuda | A no limpio | Decidir extracción |
| `src\GanttPlanReal.html` | html | `0188bfb8e85883ad6a5071583912a08898ba1bd2ed370adf3e072afee7f1fbcf` | Producción | A | UI servidor | operación/UI/config | omisión rompe A | Aprobar matriz |
| `src\GeneracionCodigo.js` | js | `aded9126acd0b8e9523f9a85f8a6cfb33dc214cf83ef41551e45bca4767cc319` | Producción | A | A: globales/repos | operación/UI/config | omisión rompe A | Aprobar matriz |
| `src\GestionCatalogo.html` | html | `31f31f4d8c360a944eb68de3656009ba5da223da2dae03fa9972ca13d00471c0` | Producción | A | UI servidor | operación/UI/config | omisión rompe A | Aprobar matriz |
| `src\GestionCatalogos.js` | js | `63aaf48250cb783029836d8758e27607c46e097c02273f34fe5a16a5b468dd0a` | Producción | A | A: globales/repos | operación/UI/config | omisión rompe A | Aprobar matriz |
| `src\HistorialService.js` | js | `a66deababd7a1bd1b6522a0a9c76af7df397e655037446ecbfa0b577a63f2d71` | Producción | A | A: globales/repos | operación/UI/config | omisión rompe A | Aprobar matriz |
| `src\Ids.js` | js | `17f75da065a8e210382e15b7104ea1f9cbafad28b7767769970d5b7d96bcff8e` | Mixtos | A provisional; deuda | A/B por función | producción+deuda | A no limpio | Decidir extracción |
| `src\ImportacionMasiva.js` | js | `cba55c2a18d48bafcf5077a051b6acd5e16793e8e5b48b0295e5f4012eeefa36` | Producción | A | A: globales/repos | operación/UI/config | omisión rompe A | Aprobar matriz |
| `src\Includes.js` | js | `bb3ba83d64e0b31954a0fa03a7ee28c27a065a716dd7b99c18976b42a03617e8` | Producción | A | A: globales/repos | operación/UI/config | omisión rompe A | Aprobar matriz |
| `src\InformeGenerico.html` | html | `340dbdc5f5ffa7f0aa042a5355a82fea1c3a85f97b68b1bfd1c374c46c36315b` | Producción | A | UI servidor | operación/UI/config | omisión rompe A | Aprobar matriz |
| `src\InstaladorAsignacion.js` | js | `51b33af8953423c16f62c29d3d6b76e5bb861535d4123c82952abeafee7447c1` | Auxiliar | C | A; manual | instalación/fixture/tooling | ejecución accidental | Confirmar ejecución |
| `src\InstaladorCampanaEstiuYNavidadAmpliada.js` | js | `47dfc5d483402cbcf30c5c27cc658c9ef064c438f6945e9cf954d0664474910c` | Auxiliar | C | A; manual | instalación/fixture/tooling | ejecución accidental | Confirmar ejecución |
| `src\InstaladorCampanaMercatsTardor.js` | js | `9e36916e25674bcfba0143cf4a7f08b6bb8e13edf7913b4eabd05c9976f8eb03` | Auxiliar | C | A; manual | instalación/fixture/tooling | ejecución accidental | Confirmar ejecución |
| `src\InstaladorCatalogosL2.js` | js | `92a8cd799352c2aa8f4641277116f6e6eff0b62904c0e7254fe698e91359c00a` | Auxiliar | C | A; manual | instalación/fixture/tooling | ejecución accidental | Confirmar ejecución |
| `src\InstaladorCompetencia.js` | js | `1e60e04bcba81ae767fbd6331793b1e6c438c459f24a28b15ff3614e8abcb101` | Auxiliar | C | A; manual | instalación/fixture/tooling | ejecución accidental | Confirmar ejecución |
| `src\InstaladorConvocatoria.js` | js | `ceef7c39e4abee7aa1d8aeecf9980e1ad4131164307255081cc0ae9eadfabb1e` | Auxiliar | C | A; manual | instalación/fixture/tooling | ejecución accidental | Confirmar ejecución |
| `src\InstaladorCoste.js` | js | `207ccecf3060a40939762b652845174c2d66ce8f17d1b1d0945c57c6044925e2` | Auxiliar | C | A; manual | instalación/fixture/tooling | ejecución accidental | Confirmar ejecución |
| `src\InstaladorCriteriosAceptacion.js` | js | `9012e1c99c97987d677c57f4b705e7ea7a0b2bb9e31b161ee4d827b683ab3c09` | Auxiliar | C | A; manual | instalación/fixture/tooling | ejecución accidental | Confirmar ejecución |
| `src\InstaladorDatosPruebaPiloto.js` | js | `63cc7b394d525a6552f52e6a0ad3327892cdaab8eec96dd89fa0bbe6c1b2e937` | Auxiliar | C | A; manual | instalación/fixture/tooling | ejecución accidental | Confirmar ejecución |
| `src\InstaladorDatosPruebaPilotoAmpliado.js` | js | `f1c858f50a88f5d33232d7cebbf712481d6f74a69d69854f82fd098c63455d58` | Auxiliar | C | A; manual | instalación/fixture/tooling | ejecución accidental | Confirmar ejecución |
| `src\InstaladorEjecucionTarea.js` | js | `d9c8ea861383ac52b15f7a7c1eb094c29c574cb845322a7b8f905e893ff53260` | Auxiliar | C | A; manual | instalación/fixture/tooling | ejecución accidental | Confirmar ejecución |
| `src\InstaladorEntidadPersonaDocumento.js` | js | `f08cd6b1117d7b04830adc1433f2b291a00db61e2e5a130c32af56c7a7e7c4d9` | Auxiliar | C | A; manual | instalación/fixture/tooling | ejecución accidental | Confirmar ejecución |
| `src\InstaladorEquipoMiembro.js` | js | `98c7c2d31d4a45d70eba6f3d71a9ae7f7b80d32af81c09a835b9eedd3638cdd9` | Auxiliar | C | A; manual | instalación/fixture/tooling | ejecución accidental | Confirmar ejecución |
| `src\InstaladorHorario.js` | js | `9c016a530911b0fe2799b28a95be33107bc215cd72ce419e890314a297b29527` | Auxiliar | C | A; manual | instalación/fixture/tooling | ejecución accidental | Confirmar ejecución |
| `src\InstaladorHorarioEquipoProduccion.js` | js | `1132faf06f5b6e4652ce679b577c53d175260928431e76f616fc9af7ff32d57d` | Auxiliar | C | A; manual | instalación/fixture/tooling | ejecución accidental | Confirmar ejecución |
| `src\InstaladorImpacto.js` | js | `c140f912c6abb43a08033c6bb89b76dac8057a129971d2d43e569f99b908de85` | Auxiliar | C | A; manual | instalación/fixture/tooling | ejecución accidental | Confirmar ejecución |
| `src\InstaladorImportacionMasiva.js` | js | `03709f3c9d8b09aa2a5705079e8b00d2fe25da4369d96446905c70915e5cbaaa` | Auxiliar | C | A; manual | instalación/fixture/tooling | ejecución accidental | Confirmar ejecución |
| `src\InstaladorJerarquiaFisica.js` | js | `1891da7b224c8065aeea9f8766ecaaad8324abf92eb1f9504f68e035f7ccf398` | Auxiliar | C | A; manual | instalación/fixture/tooling | ejecución accidental | Confirmar ejecución |
| `src\InstaladorMejorasAuditoriaPiloto.js` | js | `2078bff0a57eca32220248bab6a211531f3b74d0afd052047c5fa7b1001f0ab7` | Auxiliar | C | A; manual | instalación/fixture/tooling | ejecución accidental | Confirmar ejecución |
| `src\InstaladorMetodoCalculoAvance.js` | js | `087328f079d168756df40dcbb363365d7a950a6da15de1095f4d0a1730db34fe` | Auxiliar | C | A; manual | instalación/fixture/tooling | ejecución accidental | Confirmar ejecución |
| `src\InstaladorModoUso.js` | js | `a33b75369c8edd9c4c4d3515fc8ecb5a7754de2027657f5ac48d1ecbce44500d` | Auxiliar | C | A; manual | instalación/fixture/tooling | ejecución accidental | Confirmar ejecución |
| `src\InstaladorMovimientoMaterial.js` | js | `66b7b698a24cf50e7d09c4679ed503eda3004cf3b08a7b2e4417fc8137c4b790` | Auxiliar | C | A; manual | instalación/fixture/tooling | ejecución accidental | Confirmar ejecución |
| `src\InstaladorNivelDato.js` | js | `fb9b61a7b9e1ac4ec73abc5f0eeed6772f6f823953bde02d0bc95f43fc1ed4bf` | Auxiliar | C | A; manual | instalación/fixture/tooling | ejecución accidental | Confirmar ejecución |
| `src\InstaladorPaqueteInformes.js` | js | `28532180877aae7e312f8f56eb7b4347f5579b6ffa1d5be1eebcadd5f9b7f28c` | Auxiliar | C | A; manual | instalación/fixture/tooling | ejecución accidental | Confirmar ejecución |
| `src\InstaladorPedidoRecepcion.js` | js | `1e425e84d907a2d407d07e62213c0504ca36a20190e9170b39ef126dfd37d30b` | Auxiliar | C | A; manual | instalación/fixture/tooling | ejecución accidental | Confirmar ejecución |
| `src\InstaladorPresupuesto.js` | js | `948b547d27dbc5550656036b8e24a17b1dba720d2d073267aa5ce7433227818a` | Auxiliar | C | A; manual | instalación/fixture/tooling | ejecución accidental | Confirmar ejecución |
| `src\InstaladorProveedorMaterial.js` | js | `e1d762cd81b176fdc1e9284ba30ed24ea9600d48da9ce492814a81dea7999b3f` | Auxiliar | C | A; manual | instalación/fixture/tooling | ejecución accidental | Confirmar ejecución |
| `src\InstaladorRecurso.js` | js | `a8201a9d95a5bed1e6e2fb20267ecbd2278faabf1df3bdcf3039b7b38436c8f6` | Auxiliar | C | A; manual | instalación/fixture/tooling | ejecución accidental | Confirmar ejecución |
| `src\InstaladorRelacion.js` | js | `73f95d454e70b1fabbed38530b3cb6169b4647a72ef2d9d822bd9a6269570414` | Auxiliar | C | A; manual | instalación/fixture/tooling | ejecución accidental | Confirmar ejecución |
| `src\InstaladorRolPersonaAtendida.js` | js | `e755ca91a06d3b5682c4f14829022c876ca8330477895fccbdef079092ef9194` | Auxiliar | C | A; manual | instalación/fixture/tooling | ejecución accidental | Confirmar ejecución |
| `src\InstaladorTipoVinculoIncidencia.js` | js | `349f79c5fc292c3d46aa86a8884445bd32d02d59041b44fb6de5e2704aae7394` | Auxiliar | C | A; manual | instalación/fixture/tooling | ejecución accidental | Confirmar ejecución |
| `src\InstaladorVinculo.js` | js | `ef34cd381bc3bcc8d8675d3f741f445cc695c9b90310dd66021c2b43effd85a1` | Auxiliar | C | A; manual | instalación/fixture/tooling | ejecución accidental | Confirmar ejecución |
| `src\InstrumentacionService.js` | js | `e16f6cd90c2a0ccc99a4203c765ee0db47509d44411ad2a03480915559f870b3` | Producción | A | A: globales/repos | operación/UI/config | omisión rompe A | Aprobar matriz |
| `src\IntegridadReporte.html` | html | `f38bbe152a5e257cf365259f43e56d1bbdba94f1dc76bb81bc984664052af971` | Producción | A | UI servidor | operación/UI/config | omisión rompe A | Aprobar matriz |
| `src\IntegrityService.js` | js | `c8bf30e81ca85a0fa3f5824aabc4e99a4953296c6e2ba7b89aab8f9b36c29026` | Producción | A | A: globales/repos | operación/UI/config | omisión rompe A | Aprobar matriz |
| `src\KanbanOperativo.html` | html | `219f45815c90aeba056f79c05b3b45ffcbb74d31586ad968f53272aab6a727a8` | Producción | A | UI servidor | operación/UI/config | omisión rompe A | Aprobar matriz |
| `src\KanbanService.js` | js | `93d26cb68389cdb4985a02b8eadcd2d2c5989957b4bc99e9828aaf78e8be9755` | Producción | A | A: globales/repos | operación/UI/config | omisión rompe A | Aprobar matriz |
| `src\LecturaBatchService.js` | js | `321d42f087f8dad6cf2db3b8cb4c11c26ba61a2a5d1de443cd070773fa64e857` | Producción | A | A: globales/repos | operación/UI/config | omisión rompe A | Aprobar matriz |
| `src\ListadoFiltrable.html` | html | `a63f41ec683c353ce7e1e4c8c9e8b219f4b2704b82d1d8504b72d1e8954fe8af` | Producción | A | UI servidor | operación/UI/config | omisión rompe A | Aprobar matriz |
| `src\ListadoFiltrableService.js` | js | `1587ca25a38b40f3f2fb3fda159b9a26c2eb3f71dc360b5890a10e7ff9144300` | Producción | A | A: globales/repos | operación/UI/config | omisión rompe A | Aprobar matriz |
| `src\ModalConfirmar.html` | html | `dbc5c69c324007620c1e857ce28c8490ff6bbd05b41a3fc0cf1721ec88301afd` | Producción | A | UI servidor | operación/UI/config | omisión rompe A | Aprobar matriz |
| `src\NivelDatoService.js` | js | `d451b59694a7c4086259a188c0d7f6184e7df91d454aed7e8e1ccc74d8b9cb94` | Producción | A | A: globales/repos | operación/UI/config | omisión rompe A | Aprobar matriz |
| `src\PanelCampana.html` | html | `2c16ab26c648d1bd52db18dd6a08cdfac7bf1e3f9f09826caaab06855ff443e7` | Producción | A | UI servidor | operación/UI/config | omisión rompe A | Aprobar matriz |
| `src\PanelCampanaService.js` | js | `2d28226a336461b68210df3ee921165ea298a336804c6d7c68e02e1ac4d31067` | Producción | A | A: globales/repos | operación/UI/config | omisión rompe A | Aprobar matriz |
| `src\PanelOperativo.html` | html | `662e10bd24bac1f66c4e7f313ce9457953e3ab8418138d65f9e1964dd50d80da` | Producción | A | UI servidor | operación/UI/config | omisión rompe A | Aprobar matriz |
| `src\PanelPersonas.html` | html | `57303b3934f2c17c5086019e6a5cd032b421b9f2969a56c1c9e9f0a501d6d41d` | Producción | A | UI servidor | operación/UI/config | omisión rompe A | Aprobar matriz |
| `src\PanelPersonasService.js` | js | `6cda80096224bc98d3274f67b3c9d70eee85e14a7692193f8e1b91bdab5346d4` | Producción | A | A: globales/repos | operación/UI/config | omisión rompe A | Aprobar matriz |
| `src\PanelRecursos.html` | html | `62ed3751de9b5d8cc28bc2c8494eedf1a1709c9a161ad1b262e6a099d6fb647b` | Producción | A | UI servidor | operación/UI/config | omisión rompe A | Aprobar matriz |
| `src\PanelRecursosService.js` | js | `2d221cb0491cde34c1d371736959a69f138eedfaec1ab5dba24b36dfd9119ac7` | Producción | A | A: globales/repos | operación/UI/config | omisión rompe A | Aprobar matriz |
| `src\PedidoRecepcion.js` | js | `02b2e27989053f71e4971fcbc4c479c612a7d098ae05354998de00307072785a` | Mixtos | A provisional; deuda | A/B por función | producción+deuda | A no limpio | Decidir extracción |
| `src\ProcesoService.js` | js | `07edc944f54100b2cb34ded2379d11096a0d1470207985cdefec5471a4d18b78` | Producción | A | A: globales/repos | operación/UI/config | omisión rompe A | Aprobar matriz |
| `src\ProductoService.js` | js | `5ce352725445cf5580d782fe47cb84b98b3dd3f5c620896d45257e9fff62b547` | Producción | A | A: globales/repos | operación/UI/config | omisión rompe A | Aprobar matriz |
| `src\Proteccion.js` | js | `4d94822d5d1f51678147614977cf9210c3333c7eaa105ef7e971de954654f241` | Producción | A | A: globales/repos | operación/UI/config | omisión rompe A | Aprobar matriz |
| `src\ProyectoService.js` | js | `373066e6d9d632747de61d1cb13586973b8e713f4b149619fb38bdec52f80a33` | Producción | A | A: globales/repos | operación/UI/config | omisión rompe A | Aprobar matriz |
| `src\ReportService.js` | js | `923dbffd097163fc55e3b76210ed5f0652c7f47d654e9efac3252028deebca4f` | Producción | A | A: globales/repos | operación/UI/config | omisión rompe A | Aprobar matriz |
| `src\Repository.js` | js | `bc8f19f506e870ddbcde507efa0b31d90c69ee445b0e93d722ee731006b5d0cb` | Mixtos | A provisional; deuda | A/B por función | producción+deuda | A no limpio | Decidir extracción |
| `src\Repository_InsertarRegistro.js` | js | `c28502c4d93d245e66c6269f535dc59f7bb2ebb850e8a1372c57e44323d7ddd6` | Producción | A | A: globales/repos | operación/UI/config | omisión rompe A | Aprobar matriz |
| `src\Reversion.js` | js | `d81b5f1232f5f2a9a8d82191f3ad508bfb150c0cbd2782304099daf9f94b0735` | Producción | A | A: globales/repos | operación/UI/config | omisión rompe A | Aprobar matriz |
| `src\SelectorRegistro.html` | html | `04e63894fdecf4ef870b4f3614e89c65f4977864beea02b70672b19484bf78a1` | Producción | A | UI servidor | operación/UI/config | omisión rompe A | Aprobar matriz |
| `src\SerializacionService.js` | js | `35c31d085ec5144fe2ec699829ccabc0a65fc35d9f98ba8a1042fc5dd9a0a120` | Producción | A | A: globales/repos | operación/UI/config | omisión rompe A | Aprobar matriz |
| `src\StockMaterialService.js` | js | `ec3230cf7f659e7fe07a67ffa9dad31e0062730b8f9cb79ee25b4a6cf9600eea` | Producción | A | A: globales/repos | operación/UI/config | omisión rompe A | Aprobar matriz |
| `src\TareaService.js` | js | `6bc902c0ecce4c563e3431147b93dbf9352009841f83a4c359bc5d3169f2e42f` | Producción | A | A: globales/repos | operación/UI/config | omisión rompe A | Aprobar matriz |
| `src\Tests_AvanceYSecuencia.js` | js | `d0a25ffad2b7717412a9f12918d70026432dd71b4a8f8710b6098b572ee22561` | Pruebas | B | A versionado | prueba explícita | entrada en A | Aprobar matriz |
| `src\Tests_CosteService.js` | js | `1fa00cf5cf57a9807f9510ce86c8f0e9834d3774864c6a9b5c864ed844d71f90` | Pruebas | B | A versionado | prueba explícita | entrada en A | Aprobar matriz |
| `src\Tests_ImportacionRecursosPersonas.js` | js | `43ced7eb6cebc0e5c518e81b320b94d988ed4cab2c229b3ec15c55691ffdb164` | Pruebas | B | A versionado | prueba explícita | entrada en A | Aprobar matriz |
| `src\Tests_IntegridadGapReglasFuncional.js` | js | `d3aae8e9b6c4d1f9a122b7828e502b64e919057c23dbb390af11b1a8a5032848` | Pruebas | B | A versionado | prueba explícita | entrada en A | Aprobar matriz |
| `src\Tests_LecturaBatch.js` | js | `9dea37c0c516e8c0c114c8c16e14a91b60f675875fc240559273ef9af85167b4` | Pruebas | B | A versionado | prueba explícita | entrada en A | Aprobar matriz |
| `src\Tests_Repository.js` | js | `d31821d51b7ee80616dd9372e3e64be89d141e45e51fa227b58704d8f3082eb6` | Pruebas | B | A versionado | prueba explícita | entrada en A | Aprobar matriz |
| `src\Tests_Repository2.js` | js | `857d3e68f8911369cbdb6fc68f072f4aaddaf8108196d22aaeed9b4e5c7a912d` | Pruebas | B | A versionado | prueba explícita | entrada en A | Aprobar matriz |
| `src\Validation.js` | js | `6f88b5c5d29db911b32f1e97443a5e63265c41b9fa2c05d9018f99700f3a1aae` | Mixtos | A provisional; deuda | A/B por función | producción+deuda | A no limpio | Decidir extracción |

### F07.3 — Contrato cerrado del paquete A

Finalidad: runtime operativo completo de producción. Su lista cerrada son exactamente las 64 filas `Producción` más los cinco `Mixtos` solo bajo excepción provisional declarada; ninguna otra ruta puede entrar.

- Debe incluir los 21 HTML, `src/appsscript.json`, servicios, UI servidor, dominio y persistencia clasificados A.
- Debe excluir los siete `Tests_*`, los 34 elementos C y los 24 Excluidos.
- `Repository.js`, `Ids.js`, `Formularios.js`, `Validation.js` y `PedidoRecepcion.js` acompañan A provisionalmente, pero el manifiesto debe declarar que A **no está limpio**.
- Cada entrada queda fijada por ruta, tipo, bytes y SHA-256; el hash agregado conceptual es SHA-256 de líneas canónicas ordenadas `ruta\0tipo\0bytes\0sha256`, con UTF-8 y LF.
- Dependencias globales se resuelven contra la misma versión de matriz; no se admite completar A desde estado remoto implícito.

`NO_GO A`: ruta nueva/desconocida; falta o sobra una entrada; hash cambiado sin revisión; aparece `Tests_*`; falta HTML requerido o manifiesto; función nueva `test*`, `prueba*`, `probar*`, `suite*` o `assert*` en A sin decisión; mixto no declarado; dependencia crítica no resuelta; validación humana pendiente. Solo habrá `GO` tras cumplir todo y autorizar destino en otro gate.

### F07.4 — Contrato cerrado del paquete B

Lista obligatoria e individual: `Tests_AvanceYSecuencia.js`, `Tests_CosteService.js`, `Tests_ImportacionRecursosPersonas.js`, `Tests_IntegridadGapReglasFuncional.js`, `Tests_LecturaBatch.js`, `Tests_Repository.js` y `Tests_Repository2.js`. Los dos repositorios de pruebas son entradas separadas y no se sustituyen entre sí.

B puede depender de A, pero debe fijar versión/hash agregado de A y declarar sus 1–81 dependencias productivas por archivo. Requiere configuración mínima explícita, entorno aislado o copia autorizada, fixtures identificados, permisos mínimos y prohibición de datos reales. Orden lógico propuesto: configuración/runtime → A → fixtures autorizados → pruebas unitarias/servicios → `Tests_Repository.js` → `Tests_Repository2.js`; el orden real de carga queda `NO VERIFICADO`.

Autonomía significa que B más la versión declarada de A y fixtures autorizados basta para reproducir la suite; no significa duplicar A silenciosamente. `NO_GO B`: falta uno de los siete, se fusionan Repository1/2, A no está versionado, faltan fixtures/configuración, entorno no autorizado, hash divergente, dependencia desconocida o revisión humana pendiente.

### F07.5 — Contrato cerrado del paquete C

| Grupo/elemento | Finalidad | Cotidiano en producción | Ejecución | Confirmación humana | Decisión |
|---|---|---|---|---|---|
| Instaladores estructurales `Instalador*` | preparar/migrar esquema | No | manual | obligatoria | C |
| `InstaladorDatosPruebaPiloto*` | fixtures de prueba | Prohibido | manual y aislada | obligatoria | C |
| `InstaladorCampana*` | campañas piloto | Peligroso | manual y aislada | obligatoria | C |
| `CorregirCatalogoTipoProyecto.js` | reparación puntual | No | manual | obligatoria con backup | C |
| `ExportarCodigoProduccion.js` | herramienta heredada | Bloqueado | no autorizada | nuevo gate | C |
| Migraciones dentro de servicios | preparación excepcional | No | manual | obligatoria | Mixto/deuda |
| Integrity/diagnóstico productivo | control operativo | Sí, solo lectura/flujo previsto | según función | según impacto | A, no confundir con prueba |

C no se ejecuta ni se incluye en A/B por defecto. Cada elemento exige propósito, origen, destino, precondiciones, reversión y autorización propios.

### F07.6 — Archivos mixtos

| Archivo | Funciones productivas | Funciones de prueba | Dependencias | Riesgo de extracción | Tratamiento provisional | Criterio futuro |
|---|---:|---:|---|---|---|---|
| `Repository.js` | 34 aprox. | 51 | Sheets, locks, historial, servicios/tests | Muy alto | incluir en A, declarar A no limpio | mover tests con cobertura y mapa de llamadas |
| `Ids.js` | 4 aprox. | 5 | entidad, Sheets, locks, repositorios | Alto | incluir en A, declarar deuda | extraer tests sin cambiar API global |
| `Formularios.js` | 115 | 0 explícitas | HTML, menú, reglas, repositorios | Muy alto | incluir en A como mezcla de capas | separar UI/config/dominio por contrato probado |
| `Validation.js` | 24 | 0 explícitas | Sheets, reglas, instalación | Muy alto | incluir en A; admin declarado | aislar validación pura de aplicación física |
| `PedidoRecepcion.js` | 5 operativas | 0 | menú, UI, repositorios | Alto | incluir en A; corrección admin declarada | mover reparación a C sin romper flujo |

Los recuentos “aprox.” distinguen por intención estática y no equivalen a cobertura ejecutada. Política provisional: ningún informe puede llamar “producción limpia” a A mientras estos cinco archivos sigan mixtos.

### F07.7 — Esquema documental del manifiesto

| Campo | Regla mínima |
|---|---|
| Identificador | único e inmutable por ejecución |
| Paquete/versión/categoría | A, B o C y versión de contrato |
| Fecha | UTC ISO-8601 |
| Commit/rama/origen | valor local explícito; `DIRTY` permitido pero bloqueante según gate |
| Entrada | ruta relativa canónica, tipo, bytes y SHA-256 |
| Dependencias | paquete, versión, hash agregado y rutas necesarias |
| Excluidos/mixtos | listas explícitas y razón/decisión |
| Herramienta | nombre y versión/hash de generador |
| Validación | controles ejecutados, resultado y errores |
| Aprobación | persona/gate/fecha y destino autorizado |
| Hash agregado | algoritmo canónico documentado, nunca dependiente del orden del sistema |

No se crea JSON, YAML ni archivo físico en F07.

### F07.8 — Verificación reproducible futura

1. Resolver físicamente el universo. **Gate humano U:** aceptar alcance y estado Git.
2. Validar 1:1 la matriz, categorías y duplicados.
3. Recalcular tamaños y hashes.
4. Fallar ante desconocidos, ausentes, sobrantes o divergencias.
5. Construir en directorio temporal único, sin publicar.
6. Verificar contenido, HTML, manifiesto, pruebas y dependencias.
7. Calcular manifiesto y hash agregado.
8. **Gate humano V:** revisar diff de paquete y riesgos mixtos.
9. **Gate humano D:** autorizar destino exacto y permisos.
10. Publicar de forma atómica o promocionar artefacto validado.
11. Verificar destino contra manifiesto.
12. **Gate humano C:** aceptar evidencia o activar reversión.

### F07.9 — Reversión propuesta

**PROPUESTA:** nunca sobrescribir; usar ID único; validar antes de publicar; registrar IDs de todos los objetos creados; si falla, eliminar solo objetos cuyo ID figure en esa ejecución; no seleccionar por nombre, fecha aproximada ni prefijo; preservar log, manifiesto, error y decisión. La publicación solo se marca completa después de verificación contra hashes. No se autoriza ninguna ejecución en esta fase.

### F07.10 — Matriz GO/NO_GO

| Condición | Paquete A | Paquete B | Paquete C | Resultado actual |
|---|---|---|---|---|
| Universo completo | requerido | requerido | requerido | GO documental |
| Hashes presentes | requerido | requerido | requerido | GO documental, excepción autorreferencial registrada |
| HTML presente | 21 obligatorios | si la suite lo requiere | no por defecto | GO diseño |
| Manifiesto presente | obligatorio | obligatorio/mínimo | obligatorio | NO_GO operativo: no existe físico |
| Pruebas excluidas de A | obligatorio | siete incluidas | fixtures separados | NO_GO actual por pruebas incrustadas |
| Dependencias declaradas | obligatorio | A versionado | A/entorno | GO diseño; validar al construir |
| Mixtos declarados | cinco | dependencia | migraciones | GO documental |
| Destino autorizado | obligatorio | obligatorio | obligatorio | NO_GO |
| Reversión disponible | obligatoria | obligatoria si publica | obligatoria | NO_GO actual |
| Verificación humana | obligatoria | obligatoria | obligatoria | Pendiente |

Resultado operativo global: **NO_GO** para A, B y C hasta implementación autorizada, manifiestos físicos, destino y gates posteriores.

### F07.11 — Hallazgos y decisiones pendientes

| ID | Tipo | Evidencia | Riesgo/bloqueo | Decisión pendiente | Estado |
|---|---|---|---|---|---|
| F07-H01 | Hallazgo | universo 134 cierra 1:1 | ninguno documental | aprobar matriz | VERIFICADO |
| F07-H02 | Bloqueo real | A contiene Repository/Ids mixtos | A no limpio | aceptar deuda o separar | NO_GO operativo |
| F07-H03 | Hallazgo | cinco mixtos explícitos | cambio transversal | orden de extracción | VERIFICADO |
| F07-H04 | Bloqueo real | exportador omite HTML/manifiesto | paquete incompleto | herramienta futura | NO_GO |
| F07-H05 | Riesgo | B depende de A | falsa autonomía | versión/hash A | Pendiente implementación |
| F07-H06 | Riesgo | 34 auxiliares ejecutables | daño/contaminación | subcategorizar ejecución | Pendiente humana |
| F07-H07 | Propuesta | allowlist exacta y fail-closed | mantenimiento manual | adoptar contrato | PROPUESTA |
| F07-H08 | Propuesta | manifiesto/hash agregado | diseño por implementar | algoritmo final | PROPUESTA |
| F07-H09 | Riesgo | roadmap autorreferencial | hash interno posterior imposible | aceptar hash pre-F07 + evidencia externa | Decisión humana |
| F07-H10 | Bloqueo real | destino/reversión no autorizados | publicación insegura | gate futuro | NO_GO |

Decisiones humanas pendientes: aprobar categorías; aceptar los cinco mixtos provisionales; decidir subcategorías de C; fijar configuración mínima de B; adoptar canonicalización del hash agregado; definir herramienta futura, destino y reversión. No quedan rutas sin categoría, pero sí bloqueos operativos deliberados.

### Resultado y gate

**Resultado F07:** contrato documental cerrado sobre 134 rutas, sin desconocidos ni duplicados. El diseño evita silencios mediante listas exactas, hashes, fallo ante divergencias, declaración de mixtos, HTML/manifiesto obligatorios y gates humanos. No implica que los paquetes actuales sean válidos ni autoriza construirlos.

**NO VERIFICADO:** herramienta futura, paquete físico, hash agregado real, carga Apps Script, autonomía de B, permisos, destino, publicación y reversión ejecutada.

**Gate F07 pendiente de aprobación humana. Continúa el NO_GO operativo. No se inició implementación ni una fase posterior.**

## F08 — Consolidación y roadmap de optimización UX

### Alcance, línea base y cobertura

Cierre documental de F02–F07; no implementa ni valida el Sheet real. Línea base: roadmap 198.829 bytes, SHA-256 `ab8f2f6ad2c22b896c937a792c11563516beb6390d292e4426a563c17ea1d0de`; Git: roadmap modificado y manual no rastreado; manual `a18332565c408e9f283df26201c1a6745d1699ce9fd557d709d980225321c1fc`. Los otros 133 archivos conservan sus hashes individuales de F07; agregado conceptual físico ordenado `ruta<TAB>sha256`: `77ffaee1683ba9d733b7aff8244b1896437e2fcc4f7d1a291405689eaf5cd537`.

| Fase | Hallazgos recuperados | Convención |
|---|---:|---|
| F03 | 8 hipótesis + 5 impactos UX; además defectos verificados de suite/precondiciones | referencias `F03/H1–H8`, `F03.7/1–5` y sección |
| F04 | 10 | `F04-H01–H10` |
| F05 | 15 | `F05-H01–H15` |
| F06 | 15 | `F06-H01–H15` |
| F07 | 10 | `F07-H01–H10` |

F03 no asignó IDs formales a sus impactos; F08 no los rebautiza como hechos. H2/H6 son inferencias; H3/H4/H7/H8 siguen `NO VERIFICADOS`; H5 está descartada. F07-H07/H08 son propuestas, no defectos.

### F08.1 — Matriz maestra consolidada

| ID consolidado | Origen | Evidencia | Problema | Ámbito | Consecuencia | Severidad | Confianza | Estado |
|---|---|---|---|---|---|---|---|---|
| C01 | F03/H1; F03.7/1,3,4,5 | `myFunction` escribe A1:A2 y stack | portada usada como consola persistente | UX-PORTADA | desorientación/exposición técnica | P1 | Alta | VERIFICADO |
| C02 | F03/H2,H3,H4,H6,H7,H8; F03.7/2 | `onEdit` silencia; remoto desconocido | causa real del fallo no observable | OBS | diagnóstico y trazabilidad débiles | P1 | Mixta | VERIFICADO solo el silenciamiento; resto inferencia/NO VERIFICADO |
| C03 | F03/H5 | evento cumple contrato | hipótesis de evento inválido | VALID | no debe guiar cambios | — | Alta | DESCARTADA |
| C04 | F03.2–F03.3 | suite altera protecciones; 307 sin `finally`, fila nueva ni limpieza | prueba no aislada | VALID | residuos/falsos positivos | P1 | Alta | VERIFICADO estático |
| C05 | F04-H01,F04-H02,F04-H06,F04-H07,F04-H10 | menús largos y ubicación irregular | encontrabilidad y modelo mental débiles | UX-IA | búsqueda lenta/pasos extra | P1 | Alta/Media | VERIFICADO estático |
| C06 | F04-H03,F04-H09; F05-H13 | IDs, STG y campos internos visibles | lenguaje técnico expuesto | UX-IA/UX-FORM | menor comprensión/confianza | P1 | Alta | VERIFICADO estático |
| C07 | F04-H04; F06-H12 | administración junto a operación | acciones sensibles cercanas | UX-IA | error humano | P1 | Alta | VERIFICADO estático |
| C08 | F04-H05; F05-H05 | 19–26 campos sin secciones | densidad de formularios | UX-FORM | omisiones/carga | P1 | Media | VERIFICADO estructura; impacto inferido |
| C09 | F04-H08 | retorno/prefill preservan contexto | fortaleza de continuidad | UX-FORM | reduce repetición | P3 positivo | Alta | VERIFICADO estático |
| C10 | F05-H01 | label FK apunta a hidden | buscador sin nombre accesible | UX-A11Y | lector/teclado perjudicados | P1 | Alta | VERIFICADO estático |
| C11 | F05-H02 | sin `aria-live`/role | feedback asíncrono no anunciado | UX-A11Y | pérdida de estado | P1 | Alta | VERIFICADO estático |
| C12 | F05-H03 | modal sin role/foco/Escape | diálogo no accesible | UX-A11Y | foco fuera/bloqueo | P1 | Alta | VERIFICADO estático |
| C13 | F05-H04 | spans con `onclick` | acciones no semánticas | UX-A11Y | no operables por teclado | P1 | Alta | VERIFICADO estático |
| C14 | F05-H06 | error global sin foco | recuperación lenta | UX-FORM/A11Y | corrección costosa | P2 | Alta | VERIFICADO estático |
| C15 | F05-H07; tensión con C02 | `error.message` visible al cliente | detalle técnico expuesto mientras otros errores se silencian | OBS/UX-FORM | inconsistencia/confusión | P1 | Alta | CONTRADICCIÓN entre sobreexposición y ocultación |
| C16 | F05-H08 | datalist acepta texto no coincidente | FK inválida se descubre tarde | UX-FORM | error servidor evitable | P2 | Alta | VERIFICADO estático |
| C17 | F05-H09 | botón disabled sin progreso | guardado ambiguo | UX-FORM | incertidumbre/reintento | P2 | Alta | VERIFICADO estático |
| C18 | F05-H10 | X nativa no interceptable | cierre accidental posible | UX-FORM | pérdida de datos | P1 | Media | Riesgo estático; runtime NO VERIFICADO |
| C19 | F05-H11 | outline eliminado/borde cromático | foco poco visible | UX-A11Y | navegación difícil | P1 | Alta | VERIFICADO estático |
| C20 | F05-H12 | defaults/prefill poco explicados | automatización sorprendente | UX-FORM | errores de comprensión | P2 | Media | INFERENCIA UX |
| C21 | F05-H14 | DOM conserva datos/reactiva botón | recuperación tras error funciona | UX-FORM | reduce pérdida | P3 positivo | Alta | VERIFICADO estático |
| C22 | F05-H15; F06-H09 | 37 esquemas/115 funciones en Formularios | UI, reglas y config concentradas | ARCH | cambio transversal | P1 | Alta | VERIFICADO estático |
| C23 | F06-H01 | 7 tests frente a allowlist 3 | pruebas explícitas entran en A | PKG | contaminación | P0 | Alta | VERIFICADO estático |
| C24 | F06-H02; F07-H02 | 51 pruebas en Repository | producción/pruebas mezcladas | ARCH/PKG | A no limpio | P1 | Alta | VERIFICADO; NO_GO operativo |
| C25 | F06-H03 | 5 pruebas en Ids | generador crítico mixto | ARCH/PKG | no excluible por archivo | P1 | Alta | VERIFICADO |
| C26 | F06-H04; F07-H04 | `SERVER_JS` omite HTML/manifiesto | paquete incompleto | PKG | no reconstruible | P0 | Alta | VERIFICADO; NO_GO |
| C27 | F06-H05,F06-H06; F07-H07,F07-H08 | índice sin hashes/snapshot | exportación no reproducible | PKG | evidencia insuficiente | P1 | Alta | Hallazgo + PROPUESTA documental |
| C28 | F06-H07; F07-H10 | Drive sin cleanup/destino autorizado | reversión/publicación inseguras | PKG | residuos/daño | P1 | Alta | NO_GO operativo |
| C29 | F06-H08,F06-H15; F07-H05 | B depende de A | autonomía solo nominal | PKG/VALID | suite irreproducible sin versión A | P1 | Alta | VERIFICADO estático |
| C30 | F06-H10 | Validation mezcla 119 accesos y aplicación | reglas acopladas a Sheets/admin | ARCH | prueba/portabilidad difíciles | P1 | Alta | VERIFICADO estático |
| C31 | F06-H11; F07-H06 | 34 auxiliares/fixtures ejecutables | frontera de entorno ambigua | ARCH/PKG | contaminación accidental | P1 | Alta | VERIFICADO; decisión pendiente |
| C32 | F06-H13 | script ID fijo/scopes | exportador acoplado a origen | PKG | destino equivocado/permisos | P1 | Alta | VERIFICADO estático |
| C33 | F06-H14 | Integrity es productivo | exclusión por nombre sería errónea | ARCH/PKG | pérdida de control | P1 | Alta | VERIFICADO |
| C34 | F07-H01,H07,H08 | universo 134 y contrato fail-closed | fortaleza documental, no implementación | PKG | reduce omisiones futuras | P3 positivo | Alta | VERIFICADO/PROPUESTA |
| C35 | F07-H03 | cinco mixtos declarados | deuda transversal explícita | ARCH | orden de extracción pendiente | P1 | Alta | VERIFICADO |
| C36 | F07-H09 | hash interno del roadmap autorreferencial | evidencia requiere hash externo | PKG | confusión de snapshot | P2 | Alta | Decisión documental pendiente |

Cobertura: los 50 IDs formales F04–F07 aparecen al menos una vez; F03 conserva H1–H8, impactos 1–5 y los defectos de suite. No se elevó severidad: C07 baja el P1/P2 combinado al máximo ya existente; C28 usa P1 por bloqueo de publicación documentado en F07, no por F06-H07 aislado.

### F08.2 — Líneas de trabajo

| Línea | Objetivo | Consolidados |
|---|---|---|
| UX-PORTADA | separar orientación diaria de diagnóstico | C01 |
| UX-IA | menú, polos, etiquetas y acceso | C05–C07 |
| UX-FORM | densidad, relaciones, validación y recuperación | C08,C09,C14,C16–C18,C20,C21 |
| UX-A11Y | semántica, teclado, foco y anuncios | C10–C13,C19 |
| OBS | errores útiles sin stack ni silencio | C02,C15 |
| ARCH | reducir mezcla y dependencias | C22,C24,C25,C30,C31,C33,C35 |
| PKG | paquetes cerrados/reproducibles/reversibles | C23,C26–C29,C32,C34,C36 |
| VALID | pruebas aisladas y contraste real | C03,C04,C18,C29 |

### F08.3 — Backlog priorizado

| Backlog ID | Línea | Problema | Cambio mínimo | Dependencias | Riesgo | Validación | Reversión | Prioridad |
|---|---|---|---|---|---|---|---|---|
| B01 | PKG | tests explícitos en A | allowlist exacta fail-closed | F07; B02 | omitir producción | matriz+fixture de archivo nuevo | volver a NO_GO sin publicar | P0 |
| B02 | PKG | faltan HTML/manifiesto | contrato de contenido completo | B01 | paquete inválido | comparación 134/manifest | descartar artefacto temporal | P0 |
| B03 | UX-PORTADA | consola en portada | estado neutro + referencia técnica | B04; decisión D01 | perder diagnóstico | éxito/fallo estático+DEV+humana | restaurar A1/A2 | P1 |
| B04 | OBS | errores silenciados/expuestos | canal técnico estructurado y mensaje seguro | historial; permisos | ocultar causa útil | error controlado local/DEV | restaurar handlers | P1 |
| B05 | VALID | suite 307 no aislada | fixture, fila nueva, `finally`, correlación | B04 | alterar datos | DEV aislado/verificación datos | restaurar fixture/limpiar IDs | P1 |
| B06 | UX-A11Y | FK sin label visible | asociar label al input texto | formulario común | romper extracción | DOM estático+lector/teclado | restaurar IDs/for | P1 |
| B07 | UX-A11Y | mensajes no anunciados | región `aria-live`/alert adecuada | B04 | anuncios duplicados | DOM+lector pantalla DEV | retirar atributos | P1 |
| B08 | UX-A11Y | modal/foco/Escape | contrato de diálogo y retorno de foco | Modal/CSS | cierres involuntarios | teclado+inspección visual | restaurar modal | P1 |
| B09 | UX-A11Y | spans/foco no semánticos | botones/enlaces y `focus-visible` | estilos comunes | cambio visual | Tab/Enter/Escape | restaurar elementos/CSS | P1 |
| B10 | UX-FORM | formularios densos | metadato de grupos sin cambiar datos | esquemas; B06–B09 | ocultar campo | 13 muestras+edición DEV | retirar grupos | P1 |
| B11 | UX-FORM | cierre accidental | advertencia coherente y guardado de estado | limitación X nativa | falsa seguridad | cerrar por todos los caminos | restaurar confirmación | P1 |
| B12 | UX-IA | menú/admin mezclados | separar operación/administración | decisión D02/D06 | romper hábitos | inventario menús+usuarios | restaurar onOpen | P1 |
| B13 | UX-IA | lenguaje técnico/IDs | etiquetas humanas con ID secundario | catálogos/FK | ambigüedad | comprensión+selección | restaurar etiquetas | P1 |
| B14 | ARCH | Formularios/Validation mixtos | fronteras documentadas antes de mover | cobertura B05–B11 | regresión transversal | mapa llamadas+tests | no mover hasta gate | P1 |
| B15 | ARCH | Repository/Ids con pruebas | extracción mecánica por funciones | B01,B05; suite | romper globales | diff+suite DEV completa | revertir movimiento | P1 |
| B16 | PKG | sin hashes/snapshot | manifiesto canónico y agregado | B01,B02 | falsa reproducibilidad | reconstrucción doble | descartar generador | P1 |
| B17 | PKG | sin rollback/destino | publicación transaccional por IDs | B16; autorización | borrar objeto ajeno | fallo parcial simulado | eliminar solo IDs de ejecución | P1 |
| B18 | PKG | B no autónomo | fijar versión/hash de A y fixtures | B15,B16 | divergencia | suite desde snapshot limpio | volver a matriz previa | P1 |
| B19 | ARCH | auxiliares ambiguos | subcategorizar preparación/prueba/reparación/tooling | D04 | exclusión errónea | revisión 34/34 | restaurar categoría C común | P1 |
| B20 | UX-FORM | FK inválida tardía | exigir coincidencia antes de enviar | B06 | bloquear valor válido | FK normal/dependiente/edición | restaurar validación servidor | P2 |
| B21 | UX-FORM | progreso/errores globales | “Guardando”, foco al primer error, mensaje junto campo | B04,B07 | estados inconsistentes | éxito/fallo/doble clic | retirar estados locales | P2 |
| B22 | UX-FORM | defaults sorprendentes | ayuda breve y origen del valor | B10 | ruido | comprensión humana | retirar ayudas | P2 |
| B23 | UX-IA | acceso irregular | ficha directa y polos coherentes | B12 | menú mayor | tareas de encontrabilidad | restaurar rutas | P2 |
| B24 | ARCH | Integrity puede excluirse mal | regla explícita productiva | B01 | paquete sin control | matriz/allowlist | restaurar clasificación | P2 |
| B25 | PKG | roadmap autorreferencial | hash externo de evidencia | B16 | confusión | recalcular antes/después | conservar snapshot anterior | P2 |

### F08.4 — Orden mínimo de implementación

| Ola | Alcance | Backlog | Justificación | Gate de salida |
|---:|---|---|---|---|
| 0 | Mantener NO_GO y baseline | B01,B02 | evita construir sobre contrato inválido | backlog aprobado |
| 1 | Observabilidad antes de ocultar consola | B04,B05 | primero preservar causa y trazabilidad | diseño+parche+DEV autorizados |
| 2 | Portada operativa | B03 | ya existe canal técnico seguro | prueba humana portada |
| 3 | Semántica/foco común | B06–B09 | cambio transversal pequeño antes de layout | teclado/lector/visual |
| 4 | Agrupación sin modelo | B10,B20–B22 | reduce carga sin tocar datos | 13 formularios+datos |
| 5 | IA y lenguaje | B12,B13,B23 | depende de decisiones de roles/menú | encontrabilidad humana |
| 6 | Separar administración | B12,B19 | reduce ejecución accidental | perfiles/permisos |
| 7 | Formalizar paquetes | B16,B18,B24,B25 | contrato antes de mover código | reconstrucción local |
| 8 | Extraer pruebas mixtas | B14,B15 | requiere cobertura y manifiesto | suite DEV completa |
| 9 | Sustituir exportador | B17 | solo tras paquete reproducible | autorización exportación |
| 10 | Validación real | todos | confirma hipótesis UX/runtime | aceptación humana final |

Se intercambian los pasos 1 y 2 sugeridos originalmente: observabilidad precede al aislamiento de `00_INICIO` para no ocultar la única evidencia técnica disponible.

### F08.5 — Cambios mínimos por archivo

| Cambio | Archivos candidatos | Funciones/zonas | No debe cambiar | Riesgo de regresión | Prueba local | Prueba humana |
|---|---|---|---|---|---|---|
| Portada neutra | `Código.js` | `myFunction`/A1:A2 | lógica suite/datos | perder causa | ramas éxito/error estáticas | claridad/vigencia |
| Error estructurado | `EdicionDirecta.js`,`HistorialService.js`,`Tests_Repository.js` | `onEdit`, registro, 307 | trigger productivo | ruido/pérdida log | fixture/mocks futuros | mensaje DEV |
| Label FK | `FormularioGenerico.html` | `renderCampo` | ID oculto/guardado | FK rota | DOM/IDs | lector/teclado |
| Feedback accesible | `FormularioGenerico.html`,`Estilos.html` | mensaje/carga/foco | datos conservados | anuncio duplicado | DOM/CSS | lector/visual |
| Modal accesible | `ModalConfirmar.html`,`Estilos.html` | role/foco/Escape | decisión/callback | cierre erróneo | eventos | solo teclado |
| Controles semánticos | HTML comunes | spans onclick | acción/retorno | estilo | DOM/eventos | Tab/Enter |
| Grupos | `Formularios.js`,`FormularioGenerico.html`,`Estilos.html` | metadatos/render | esquema y persistencia | ocultación | 37 esquemas | 13 muestras |
| FK preventiva | `FormularioGenerico.html`,`Formularios.js` | datalist/validación | validación servidor | falsos rechazos | casos FK | corrección error |
| Menú/polos | `Formularios.js` | `onOpen` | funciones destino | hábito/permisos | mapa callbacks | encontrabilidad |
| Etiquetas humanas | `Formularios.js`, HTML fichas/paneles | labels ID-nombre | IDs reales | ambigüedad | snapshot textos | comprensión |
| Clasificación | futuro tooling; no fuente aún | matriz/manifest | archivos físicos | omisión | 134/134 | revisión diff |
| Extraer tests | `Repository.js`,`Ids.js`, `Tests_Repository*.js` | funciones prueba | firmas productivas | globales | análisis llamadas | suite DEV autorizada |
| Exportador futuro | sustituto por diseñar | snapshot/hash/rollback | origen/destino | publicación parcial | temp/reconstrucción | autorización destino |

### F08.6 — Plan de validación no ejecutado

| Prueba | Tipo | Evidencia esperada | Entorno/gate |
|---|---|---|---|
| Navegación y retorno | estática local + inspección visual | callbacks/ruta/retorno | local y Apps Script DEV autorizado |
| Encontrabilidad | prueba humana | tiempo, errores, primera elección | 3–5 perfiles/DEV |
| Creación/edición | Apps Script DEV + datos | ID, persistencia, historial | copia/DEV autorizada |
| Relaciones dependientes | DEV + verificación datos | cascada, limpieza, ID válido | fixtures controlados |
| Validación | local simulada + DEV | cliente/servidor coherentes | gate de pruebas |
| Recuperación tras error | DEV + visual | datos conservados, foco y reintento | fallo inducido autorizado |
| Teclado/foco/modal | inspección visual + humana | Tab/Enter/Escape/retorno | navegador DEV |
| Cierre accidental | prueba humana | cancelar/X/navegación sin pérdida | datos ficticios |
| Mensajes/observabilidad | estática + DEV | texto seguro y correlación técnica | gate OBS |
| `00_INICIO` | visual + humana | orientación, vigencia, sin stack | DEV |
| Ausencia de pruebas en A | estática local | allowlist y escaneo de funciones | constructor futuro |
| Integridad paquete | ejecución local simulada | 134 decisiones, hash, HTML, manifest | temporal sin publicar |
| Reversión | simulación local/DEV aislado | elimina solo IDs de ejecución | autorización específica |

#### Ampliación para baseline dinámico y UX

F08.6 continúa siendo un plan no ejecutado. Su objetivo ampliado es obtener evidencia dinámica y una línea base UX antes de implementar optimizaciones; cualquier ejecución requiere los gates humanos posteriores de F08.7 y los criterios de F08.8.

- Entorno: la ejecución futura se limitará al navegador y a una Sheet DEV cuya identidad, URL, cuenta autorizada y separación de producción hayan sido verificadas. Producción queda prohibida.
- Datos: solo podrán utilizarse datos sintéticos, identificables mediante la etiqueta única `UXF08-AAAAMMDD-HHMM`, reversibles e inventariados. No se modificarán registros preexistentes.
- Progresión: D0 será solo lectura; D1, mínimo funcional; D2, flujo operativo coherente; D3, volumen operativo realista con cantidades aún pendientes de justificación; D4, carga elevada o casos límite bajo un gate independiente.
- Ejecución: se realizará un caso por vez, con lectura previa, escritura enumerada, verificación posterior e inventario de cada registro creado o modificado. Cualquier `ERR`, `NO_GO`, identidad ambigua, pérdida de sesión, efecto destructivo o imposibilidad de verificar detendrá la ejecución.
- Evidencias: cada caso conservará estado inicial, estado previo al guardado, resultado posterior, historial y trazabilidad asociados, mensajes de éxito o error y evidencia de limpieza.
- Métricas: se registrarán tarea completada o no completada, tiempo, pasos o interacciones, cambios de contexto, errores, bloqueos, necesidad de ayuda, capacidad de recuperación y fricción observada.
- Separación de medidas: el tiempo técnico corresponde a automatización o ejecución por el agente; el tiempo humano solo será válido cuando una persona realice la tarea; la valoración humana se registrará separadamente.
- Verificación humana: claridad, encontrabilidad, esfuerzo, comodidad, confianza y recuperación permanecerán pendientes hasta que una persona las valore; no se inventarán respuestas.
- Espacios operativos: se comprobarán orden y separación entre operación, administración, configuración, historial y pruebas, además de navegación, formularios, paneles, foco, teclado, accesibilidad, feedback y prevención de errores.
- Controles transversales: antes de los casos funcionales se verificarán identidad DEV, cuenta y separación de producción; después de cualquier escritura se consultarán resultado, historial y trazabilidad; el cierre exigirá limpieza final y residuos cero.
- Limpieza: se realizará en orden inverso de dependencias, seguida de una comprobación explícita. Si queda cualquier residuo, se detendrá la ejecución y se solicitará intervención humana.
- Recomendaciones: cada hallazgo futuro se clasificará P0, P1 o P2 e incluirá evidencia, riesgo, impacto, cambio mínimo, criterio de aceptación, prueba de regresión, reversibilidad y gate humano.
- No duplicación: no se repetirán pruebas unitarias P0, inventarios, validaciones estáticas campo a campo, integridad o empaquetado salvo que exista una pregunta concreta de integración.
- Separación de fases: F08.6 obtendrá el baseline y formulará recomendaciones. Una fase posterior expresamente autorizada podrá implementar y comparar mejoras reutilizando la evidencia; no se crea F09 ni un proyecto paralelo denominado `UX-LAB`.
- Gates: serán obligatorios los gates de identidad DEV y cuenta, planificación ejecutable, autorización de navegador, autorización de escrituras D1/D2, validación humana, limpieza y cierre.

El `NO_GO REMOTO VIGENTE` continúa hasta que un gate humano conceda una excepción limitada a una Sheet DEV concreta. Esta ampliación no autoriza navegador, escrituras ni validación dinámica.
### F08.7 — Gates humanos obligatorios

1. G-BACKLOG: aprobar prioridades y decisiones materiales.
2. G-DISEÑO: aprobar diseño de cada cambio; no autoriza código.
3. G-PARCHE: autorizar redactar/modificar fuentes.
4. G-DIFF: revisar alcance, hashes y reversión.
5. G-TEST: autorizar cada ejecución y entorno/datos.
6. G-CLASP: autorización explícita e independiente para cualquier `clasp push`.
7. G-DEV: validar resultado en DEV con evidencia.
8. G-EXPORT: autorizar construcción/exportación, destino y rollback.
9. G-DEPLOY: autorizar despliegue productivo tras evidencia.

Pedir código no autoriza ejecutar, probar, exportar ni desplegar.

### F08.8 — Criterios de cierre

| Prioridad | Evidencia mínima | Gate | Criterio de cierre |
|---|---|---|---|
| P0 | universo/hash/manifest, prueba de contaminación y reconstrucción | G-DIFF,G-EXPORT | riesgo bloqueante eliminado y paquete reproducible |
| P1 | diff revisado, pruebas locales+DEV pertinentes, reversión y aprobación humana | G-DIFF,G-TEST,G-DEV | consecuencia principal no se reproduce |
| P2 | diff, prueba focal y validación humana cuando afecte UX | G-DIFF,G-DEV | mejora medible sin regresión |
| P3 | inspección visual/estática y aceptación | G-DIFF | refinamiento consistente |

Nunca usar `completado` sin diff revisado, pruebas realizadas, resultados escritos, reversión disponible y aprobación humana.

### F08.9 — Quick wins críticos, no implementados

| Quick win | Impacto | Por qué es acotado | Riesgo residual |
|---|---|---|---|
| Asociar label FK al input visible | accesibilidad transversal | un patrón común, sin modelo | extracción/IDs deben probarse |
| Añadir `aria-live` al mensaje | feedback lector | atributo/región común | anuncios duplicados |
| Añadir `focus-visible` | teclado | CSS reversible | contraste real pendiente |
| Estado “Guardando…” | reduce incertidumbre | estado cliente, sin datos | latencia/cierre real pendiente |
| Separar submenú Administración | evita error humano | reorganiza callbacks existentes | roles/permisos aún no resueltos |

### F08.10 — Decisiones materiales pendientes

| Decisión | Opciones | Impacto | Recomendación | Gate |
|---|---|---|---|---|
| D01 función de `00_INICIO` | orientación; dashboard; consola | arquitectura UX | orientación/estado vigente, diagnóstico fuera | G-BACKLOG |
| D02 menú final | tarea; dominio; rol | encontrabilidad | tarea primero, admin separado | G-DISEÑO |
| D03 mixtos | aceptar deuda; extraer gradual; proyectos separados | riesgo/tiempo | extracción gradual tras cobertura | G-BACKLOG |
| D04 instaladores/fixtures | C único; subpaquetes; repo separado | seguridad | subcategorías explícitas C | G-DISEÑO |
| D05 contrato paquetes | manifiesto único; por paquete; firma externa | reproducibilidad | manifiesto por paquete + hash agregado | G-EXPORT |
| D06 perfiles/permisos | menú común; ocultación; autorización servidor | seguridad/UX | servidor autoriza; UI refleja rol | G-DISEÑO |
| D07 destino exportación | local temporal; Drive; repositorio | reversión/permisos | local temporal primero | G-EXPORT |

### F08.11 — Resultado ejecutivo

Fortalezas reales: inventario trazable 134/134; motor común; conservación de datos tras fallo; retorno contextual; validación servidor; controles de integridad; contrato documental fail-closed. Fallos estructurales: portada técnica, IA densa, accesibilidad transversal, errores simultáneamente silenciados y sobreexpuestos, capas/ pruebas mezcladas y exportador no reconstruible. Riesgos prioritarios: contaminación P0, paquete incompleto P0, pérdida de trazabilidad, cierre accidental, acciones administrativas y falta de acceso por teclado.

Secuencia recomendada: congelar empaquetado; asegurar observabilidad; limpiar portada; corregir semántica/foco; agrupar formularios; ordenar IA/admin; formalizar paquetes; extraer pruebas; sustituir exportador; validar en DEV y con usuarios. La auditoría fue estática y documental: no midió contraste/render, no ejecutó Sheet, Apps Script, fixtures, permisos, carga, publicación ni reversión.

**Resultado F08:** existe un plan único, priorizado, reversible y con gates; no existe ninguna corrección implementada ni validada. El Sheet **no se declara optimizado**.

**NO_GO de empaquetado/exportación/despliegue: vigente.**

**Gate final de auditoría pendiente de aprobación humana. No se inicia ninguna fase posterior.**

## P0-IMP01 — Empaquetador cerrado y reproducible

### Autorización, alcance y baseline

Autorizado exclusivamente: crear `tools/packager/build-packages.mjs`, `package-map.json`, `build-packages.test.mjs`, `README.md` y actualizar este roadmap. No se autoriza ejecutar Node, pruebas o empaquetador; construir/copiar paquetes; usar red, Drive, API, OAuth o `clasp`; modificar `src`; exportar, desplegar o hacer commit.

Gate 0 verificado: proyecto `C:\Users\pc\Desktop\LaTroballa.audit`; rama `main`; commit `752e1c14ea3d9cadff102aa52780616d0e58336a`; Git inicial: roadmap modificado y manual no rastreado. Roadmap: 220.743 bytes, SHA-256 `c88fcb535e148b9a325d0336e035ef3de8d9d203bf6de98de8f95f1c22378f6f`. Manual: `a18332565c408e9f283df26201c1a6745d1699ce9fd557d709d980225321c1fc`.

Matriz recuperada: 64 Producción + 7 Pruebas + 34 Auxiliar + 24 Excluidos + 5 Mixtos = 134; rutas únicas 134; otros 133 archivos sin cambios. Verificados individualmente siete `Tests_*`, 21 HTML y `src/appsscript.json`. F06–F08 releídas. `tools/packager` y los cuatro destinos no existían.

### Diseño previsto y riesgos

Node.js 24 sin dependencias; módulos integrados permitidos; matriz exacta y fail-closed; `--check` sin escritura y `--build` explícito; selección A/B/C o `--all`; salida segura; construcción temporal y publicación por rename; hashes y manifiestos canónicos; escaneo textual conservador; códigos 0–5; logs estructurados. Tooling queda fuera del universo Apps Script mediante exclusión literal `tools/packager/`.

Riesgos: parser textual no completo; semántica de symlinks/plataforma; atomicidad de rename entre volúmenes; cinco mixtos mantienen deuda; B depende de A; C es peligroso; fecha/metadatos no forman parte del hash agregado. Excepción autorreferencial: la entrada del roadmap fija el hash anterior a P0-IMP01 y se valida como baseline informativo excluido; exigir su hash posterior dentro de sí mismo es imposible. Todos los demás hashes son bloqueantes.

**NO_GO vigente:** empaquetado, ejecución, pruebas, exportación, `clasp push` y despliegue.

### Archivo 1/4 — `tools/packager/package-map.json`

Creado como configuración declarativa cerrada: 32.456 bytes; SHA-256 `510e445d1b95a2804316793c29bac02dd4325b503f1f9eb570e69f85df57f67b`. Contiene 134 objetos `path`, 134 rutas normalizadas y los campos exigidos. Recuento textual: 21 HTML, siete `Tests_*`, un `src/appsscript.json` y cinco mixtos. Paquetes: A para producción/mixtos, B para pruebas, C para auxiliares y NONE para excluidos. `required:true` significa que toda ruta del universo debe existir, incluso si no se empaqueta.

Decisión: el roadmap usa el SHA-256 previo a P0-IMP01 como baseline autorreferencial y queda en `selfReferentialBaselines`; no participa en A/B/C. Riesgo: JSON todavía no ha sido parseado ni probado; su coherencia se revisará solo estáticamente en este gate.

### Archivo 2/4 — `tools/packager/build-packages.mjs`

Creado inicialmente con 22.623 bytes y SHA-256 `38d8916675b7127e553be625ad642de850508f80e8e9f32614f4d7e224a49196`. Revisión estática posterior añadió identificación del generador y registro futuro de temporal/salida; la huella final se registra en la matriz de cierre. Propósito: CLI local fail-closed, validación de matriz/universo/hashes/contaminación, hash agregado canónico, manifiestos e informes conceptuales y futura construcción temporal con publicación por `rename`.

Decisiones: sin argumentos solo ayuda; ningún paquete implícito; `--check` no escribe; `--build` exige salida; salida preexistente se rechaza; symlinks se rechazan; tooling y `.git` se excluyen del escaneo; el temporal solo puede borrarse si es hijo directo del padre de salida y su nombre empieza por `.engremiat-packager-`. B fija el hash de A; C emite la advertencia exigida; A se denomina `PRODUCTION_WITH_DECLARED_MIXED_DEBT`.

Revisión estática inicial: imports limitados a `node:fs`, `node:path`, `node:crypto`, `node:os`, `node:process` y `node:url`; cero coincidencias de red, Drive, OAuth, `clasp`, `eval`, `Function`, `vm`, procesos hijo o ejecución de fuentes. Riesgo: sintaxis y comportamiento no ejecutados; atomicidad de `rename` depende de que temporal y salida compartan padre/volumen.

### Archivo 3/4 — `tools/packager/build-packages.test.mjs`

Creado: 10.723 bytes; SHA-256 `9143f5d7f08fa0e6864c9ef50c8f0c9aaf031f512f4d6752f3c709ef34eb895c`; 308 líneas; 25 casos `test(...)` redactados. Cubre universo/unicidad/categorías/rutas, desconocidos/ausentes/hashes, contratos A/B, HTML/manifiesto, mixtos/contaminación, destinos, modo check, temporal/no sobrescritura, hash agregado, manifiesto y códigos.

La suite usa un harness propio y solo módulos permitidos; en un gate futuro crea y retira temporales con prefijo propio. No se importó `node:test`, no hay dependencias NPM y no aparecen red, Drive, OAuth, `clasp`, evaluación dinámica, procesos hijo ni ejecución de fuentes. Estado: **REDACTADA, NO EJECUTADA, NO PROBADA**.

### Archivo 4/4 — `tools/packager/README.md`

Creado: 6.966 bytes; SHA-256 `1ec587d298b2bf9d21727bab920b968fc355bca1dafb7046c55b142fc732aa04`; 159 líneas. Documenta propósito, amenazas, arquitectura, A/B/C, deuda mixta, opciones, uso futuro, algoritmo agregado, seguridad, códigos, reversión, límites y gates.

Declara expresamente `IMPLEMENTADO ESTÁTICAMENTE`, `NO EJECUTADO`, `NO PROBADO` y el `NO_GO`; no afirma resolución de P0. Riesgo residual: ejemplos de uso son exclusivamente futuros y no constituyen autorización.

### Matriz final de cambios

| Ruta | Propósito | Tamaño | SHA-256 final | Estado |
|---|---|---:|---|---|
| `tools/packager/build-packages.mjs` | motor/CLI | 22.780 | `4c48a787eff8443208a97883cdc89938326a78a8600ba3a0faba6a8da2f7d36c` | IMPLEMENTADO ESTÁTICAMENTE |
| `tools/packager/package-map.json` | matriz 134 | 32.456 | `510e445d1b95a2804316793c29bac02dd4325b503f1f9eb570e69f85df57f67b` | IMPLEMENTADO ESTÁTICAMENTE |
| `tools/packager/build-packages.test.mjs` | 25 pruebas | 10.723 | `9143f5d7f08fa0e6864c9ef50c8f0c9aaf031f512f4d6752f3c709ef34eb895c` | REDACTADO; NO EJECUTADO |
| `tools/packager/README.md` | contrato/gates | 6.966 | `1ec587d298b2bf9d21727bab920b968fc355bca1dafb7046c55b142fc732aa04` | DOCUMENTADO |
| `ROADMAP_AUDITORIA_UX.md` | trazabilidad P0-IMP01 | autorreferencial | hash posterior externo | MODIFICADO AUTORIZADO |

### Revisión estática final

`package-map.json`: 134 entradas/134 rutas únicas; absolutas 0; `..` 0; backslashes 0; campos requeridos 134; hashes de 64 hex 134; categorías 64 production, 7 test, 34 auxiliary, 24 excluded y 5 mixed; paquetes A=69, B=7, C=34, NONE=24; HTML A=21; `appsscript.json` A=1; tests B=7; mixtos A=5. Delimitadores textuales equilibrados (135/135 llaves, 3/3 corchetes). Inspección coherente, **no parseada ni ejecutada**.

Código y pruebas: imports exclusivamente permitidos; opciones y códigos localizados; selección explícita; `--check` sin rama de escritura; `--build`/output obligatorios; symlinks, desconocidos, ausentes, hashes, contaminación y destinos inseguros tratados; copia `COPYFILE_EXCL`; temporal, verificación, rename y cleanup acotado localizados. Cero coincidencias en MJS de red, Drive, UrlFetch, OAuth, `clasp`, `eval`, `Function`, `vm`, procesos hijo o ejecución de fuentes.

### Pruebas redactadas y no ejecutadas

25 casos individuales cubren los 25 requisitos: universo, unicidad, categorías, rutas, desconocidos/ausentes/hash, A/B/repositorios, HTML/manifiesto, mixtos/contaminación, destinos, check, cleanup/no sobrescritura, hash agregado, manifiesto y códigos. **NO EJECUTADAS; NO PROBADAS.** No se invocó Node ni se creó temporal o paquete.

### Aspectos no verificados y riesgos

Sintaxis real de Node 24, JSON.parse real, resultado de los 25 tests, permisos Windows, symlinks reales, lectura Git empaquetada, canonicalización en runtime, detección textual completa, `rename`/cleanup ante fallos, determinismo de manifiesto, producción de logs, construcción A/B/C y reversión. El roadmap autorreferencial produce WARN deliberado. A conserva cinco mixtos; B depende de A; C requiere autorización.

### Reversión propuesta, no ejecutada

Previa autorización humana: retirar únicamente los cuatro archivos nuevos y revertir exclusivamente esta sección P0-IMP01. No usar `git reset`, `git checkout`, borrado recursivo amplio ni tocar `src`, manual u otras fases. No se revierte automáticamente.

### Resultado y gate siguiente

Resultado permitido: **IMPLEMENTADO ESTÁTICAMENTE — NO EJECUTADO — NO PROBADO — NO_GO operativo vigente**. Los bloqueos P0 no se declaran resueltos; solo existe una implementación candidata local.

Gate solicitado: **P0-TEST01 — autorización independiente para ejecutar pruebas locales del empaquetador en un directorio temporal, sin construir paquetes definitivos ni usar red**.

## P0-TEST01 — Pruebas locales del empaquetador

### Autorización, alcance y línea base previa

Gate P0-IMP01 aprobado. Se autoriza exclusivamente Node.js local, comprobación sintáctica, una ejecución de la suite, el empaquetador en modo `--check`, argumentos inválidos controlados, temporales propios y esta actualización documental. Continúan prohibidos `--build` sobre el proyecto real, paquetes definitivos, red, Drive/OAuth/APIs/Apps Script/`clasp`, exportación, despliegue, cambios en `src`, cambios en los cuatro archivos del empaquetador durante la primera pasada y commit. **NO_GO operativo vigente**.

Baseline verificado el 2026-08-04 antes de la primera prueba: proyecto `C:\Users\pc\Desktop\LaTroballa.audit`; Node `C:\Program Files\nodejs\node.exe`, versión `v24.18.0`; rama `main`; commit `752e1c14ea3d9cadff102aa52780616d0e58336a`. Estado Git exacto: roadmap modificado y, sin rastrear, manual y los cuatro archivos de `tools/packager`; coincide con el estado autorizado. Los 110 archivos contractuales bajo `src` conservan sus SHA-256 (`0` divergencias).

| Archivo | Bytes | SHA-256 previo |
| --- | ---: | --- |
| `tools/packager/build-packages.mjs` | 22.780 | `4c48a787eff8443208a97883cdc89938326a78a8600ba3a0faba6a8da2f7d36c` |
| `tools/packager/package-map.json` | 32.456 | `510e445d1b95a2804316793c29bac02dd4325b503f1f9eb570e69f85df57f67b` |
| `tools/packager/build-packages.test.mjs` | 10.723 | `9143f5d7f08fa0e6864c9ef50c8f0c9aaf031f512f4d6752f3c709ef34eb895c` |
| `tools/packager/README.md` | 6.966 | `1ec587d298b2bf9d21727bab920b968fc355bca1dafb7046c55b142fc732aa04` |
| `ROADMAP_AUDITORIA_UX.md` | 229.630 | `3ea6f5924575b3c3f1f842d301c3c28c3bb80f1df6630ad19735d210f8824db2` |
| `MANUAL_MARCO_FUNDAMENTAL.md` | 11.491 | `a18332565c408e9f283df26201c1a6745d1699ce9fd557d709d980225321c1fc` |

Los cuatro hashes del empaquetador coinciden exactamente con P0-IMP01. Temporal creado mediante nombre aleatorio del sistema, comprobado como inexistente y distinto de raíz de unidad, proyecto y `src`: `C:\Users\pc\AppData\Local\Temp\P0-TEST01-20260804-225912-37be740517774f19a5826eda066593d8`. Log externo al repositorio: `P0-TEST01-20260804-225912.log`.

### Ejecuciones previstas, riesgos y parada

Orden cerrado: `node --check tools/packager/build-packages.mjs`; `node --check tools/packager/build-packages.test.mjs`; una sola ejecución de `node tools/packager/build-packages.test.mjs`; `node tools/packager/build-packages.mjs --check --all --project-root "C:\Users\pc\Desktop\LaTroballa.audit"`; y ocho comprobaciones individuales de ayuda/argumentos inválidos con destinos controlados. No se ejecutará `--build` válido ni se habilitará red.

Riesgos: escritura inesperada, divergencia de hashes, recuento distinto de 25/25, matriz distinta del contrato, advertencias mixtas incompletas, código de salida incorrecto, destino inseguro aceptado o residuos temporales. Criterio de parada: ante el primer fallo, diferencia del proyecto, `ERR`, omisión, hash divergente, paquete creado o salida no contractual se documenta `NO_GO`, no se reintenta, no se edita y no se avanza al siguiente test.

| Test | Comando | Resultado | Código | Evidencia | Cambios detectados | Estado |
| ---- | ------- | --------- | -----: | --------- | ------------------ | ------ |
| TEST-01 | `node --check tools/packager/build-packages.mjs` | sintaxis válida; salida vacía | 0 | 2026-08-04 23:00:27 CEST; 74 ms | ninguno: Git esperado, 4 hashes y 110 `src` intactos; solo log temporal; cero paquetes | OK |
| TEST-02 | `node --check tools/packager/build-packages.test.mjs` | sintaxis válida; salida vacía | 0 | 2026-08-04 23:00:57 CEST; 74 ms | ninguno: Git esperado, 4 hashes y 110 `src` intactos; solo log temporal; cero paquetes | OK |
| TEST-03 | `node tools/packager/build-packages.test.mjs` | 25 descubiertas, 25 aprobadas, 0 fallidas, 0 omitidas | 0 | 2026-08-04 23:01:32 CEST; 161 ms; salida completa debajo | ninguno: Git esperado, 4 hashes y 110 `src` intactos; suite limpió sus temporales; cero paquetes | OK |

Salida completa de TEST-03 (única ejecución):

```text
ENGREMIAT_PACKAGE_BEGIN tests=25
OK 01 universo de 134 entradas
OK 02 rutas únicas
OK 03 categorías válidas y recuentos
OK 04 rechazo de ruta absoluta
OK 05 rechazo de ruta padre
OK 06 rechazo de archivo desconocido
OK 07 rechazo de archivo ausente
OK 08 rechazo de hash modificado
OK 09 exclusión de siete tests en A
OK 10 inclusión individual de siete tests en B
OK 11 repositorios de tests separados
OK 12 inclusión de 21 HTML en A
OK 13 inclusión de appsscript.json en A
OK 14 advertencia por cinco mixtos
OK 15 error por prueba en producción no mixta
OK 16 rechazo de destino no vacío o preexistente
OK 17 rechazo de raíz del proyecto
OK 18 rechazo de src y tooling
OK 19 ausencia de escritura en check
OK 20 limpieza del temporal tras fallo
OK 21 no sobrescritura
OK 22 hash agregado estable ante orden distinto
OK 23 hash agregado independiente de fecha y raíz
OK 24 manifiesto determinista con metadatos fijados
OK 25 códigos de salida y argumentos
NEXT solicitar_gate_de_build
ENGREMIAT_PACKAGE_END result=OK failures=0
```

| Test | Comando | Resultado | Código | Evidencia | Cambios detectados | Estado |
| ---- | ------- | --------- | -----: | --------- | ------------------ | ------ |
| TEST-04 | `node tools/packager/build-packages.mjs --check --all --project-root "C:\Users\pc\Desktop\LaTroballa.audit"` | validación real fallida: 2 archivos clasificados como producción contienen marcadores detectados; solo 2/5 mixtos se notifican | 1 | 2026-08-04 23:02:13 CEST; 136 ms; salida completa debajo | ninguno: Git esperado, 4 hashes y 110 `src` intactos; solo log temporal; cero paquetes | ERR — NO_GO |
| TEST-05 | no ejecutado | parada obligatoria tras TEST-04 | — | criterio de parada aprobado | ninguno | OMITIDO POR NO_GO |
| TEST-06 | no ejecutado como fase independiente | parada obligatoria tras TEST-04; durante TEST-01–04 no se invocó red, navegador, autenticación, Drive, Apps Script API ni `clasp` | — | comandos registrados y salida local | ninguno | NO ALCANZADO |

Salida completa de TEST-04:

```text
ENGREMIAT_PACKAGE_BEGIN run=LOCAL-3bf991138aed0357
WARN BASELINE_AUTORREFERENCIAL_NO_COMPARABLE ROADMAP_AUDITORIA_UX.md expected=c88fcb535e148b9a325d0336e035ef3de8d9d203bf6de98de8f95f1c22378f6f
WARN DEUDA_TEST_MIXTA src/Ids.js markers=function prueba*,function probar*
WARN DEUDA_TEST_MIXTA src/Repository.js markers=function prueba*,function probar*
ERR PRUEBA_EN_PRODUCCION_NO_MIXTA src/Código.js markers=ejecutarSuite*
ERR PRUEBA_EN_PRODUCCION_NO_MIXTA src/IntegrityService.js markers=function probar*
ERR VALIDACION_FALLIDA
NEXT corregir_y_repetir_solo_con_gate
ENGREMIAT_PACKAGE_END result=ERR code=1
```

### Diagnóstico, integridad y resultado de esta pasada

TEST-01 y TEST-02 verifican la sintaxis. TEST-03 verifica localmente los 25 casos redactados: 25 descubiertos, 25 aprobados, 0 fallidos y 0 omitidos. Sin embargo, TEST-04 contradice el resultado requerido para la matriz física: el proceso terminó con código `1`, tres líneas `ERR` y solo declaró como deuda mixta `src/Ids.js` y `src/Repository.js`, no las cinco rutas mixtas contractuales. Detectó además `ejecutarSuite*` en `src/Código.js` y `function probar*` en `src/IntegrityService.js`, ambos configurados como producción no mixta. Que esos marcadores sean pruebas reales o falsos positivos semánticos queda **NO VERIFICADO** en esta fase; el hecho verificado es que el validador los clasifica como contaminación y bloquea.

Se aplicó la parada inmediata: no hubo reintento, edición del empaquetador, TEST-05, TEST-06 independiente, construcción, paquete definitivo, exportación, despliegue, red ni publicación. Tras TEST-04, el estado Git continuó siendo el esperado; los cuatro hashes del empaquetador y los 110 hashes de `src` conservaron su valor; el temporal propio contenía únicamente el log; no existían candidatos A/B/C, `packages`, `dist` o `build` en la raíz.

Resultado de P0-TEST01: **NO_GO**. Evidencia parcial válida: sintaxis OK y `25/25 pruebas OK`; evidencia bloqueante: `--check` **ERR**, por lo que no corresponde declarar `VERIFICADO LOCALMENTE` en conjunto. Estados: **NO CONSTRUIDO — NO EXPORTADO — NO DESPLEGADO — NO_GO operativo vigente**.

Incidencia a resolver solo con nueva autorización: revisar la correspondencia entre marcadores detectados, las clasificaciones `mixed` de las cinco rutas contractuales y las reglas de contaminación; decidir si `src/Código.js` y `src/IntegrityService.js` son mixtos reales o falsos positivos. No se propone editar automáticamente.

Gate humano pendiente: autorizar, si procede, una fase correctiva separada del empaquetador y su suite. **P0-BUILD01 no se solicita ni se ejecuta mientras `--check --all` no sea OK.**

## P0-FIX01 — Corrección del detector de contaminación

### Autorización y baseline

Gate P0-TEST01 confirmado como NO_GO. Alcance exclusivo: diagnóstico estático y cambios en `build-packages.mjs`, `build-packages.test.mjs`, `package-map.json` solo si la clasificación resultaba incorrecta, `README.md` y este roadmap. Prohibidos Node, pruebas, `--check`, build, cambios en `src`, eliminación del log, red, Drive/OAuth/APIs/`clasp`, dependencias, commit y P0-BUILD01. **NO_GO operativo vigente**.

Baseline del 2026-08-05: rama `main`; commit `752e1c14ea3d9cadff102aa52780616d0e58336a`; Git coincide exactamente con el estado esperado (roadmap modificado; manual y cuatro archivos del empaquetador no rastreados). Roadmap: 238.310 bytes, SHA-256 `756ba7b514a34816c4799caa30d79810bb17efc1845dac6cf06ee9b68dd0148b`. Manual: 11.491 bytes, `a18332565c408e9f283df26201c1a6745d1699ce9fd557d709d980225321c1fc`. Los 110 archivos contractuales de `src` presentan 0 divergencias.

| Archivo | SHA-256 anterior |
|---|---|
| `build-packages.mjs` | `4c48a787eff8443208a97883cdc89938326a78a8600ba3a0faba6a8da2f7d36c` |
| `package-map.json` | `510e445d1b95a2804316793c29bac02dd4325b503f1f9eb570e69f85df57f67b` |
| `build-packages.test.mjs` | `9143f5d7f08fa0e6864c9ef50c8f0c9aaf031f512f4d6752f3c709ef34eb895c` |
| `README.md` | `1ec587d298b2bf9d21727bab920b968fc355bca1dafb7046c55b142fc732aa04` |

Log P0-TEST01 conservado en su ruta original: 3.035 bytes; SHA-256 `15a601b5ff29bc4fe05194c5ff212ecf657153131fb5fcc6325cb175abad1823`. Su evidencia TEST-04 se releyó físicamente; no se reconstruyó ni alteró.

### Reconstrucción exacta de TEST-04

| Archivo | Línea | Fragmento mínimo | Regla aplicada entonces | Tipo | Resultado anterior |
|---|---:|---|---|---|---|
| `src/Ids.js` | 152 (primera) | `function probarConfiguracionEntidadesIds()` | `function probar*` | declaración | `WARN DEUDA_TEST_MIXTA` legítimo como test embebido |
| `src/Repository.js` | 302 (primera) | `function probarValidacionInsercionTransaccional()` | `function probar*` | declaración | `WARN DEUDA_TEST_MIXTA` legítimo como test embebido |
| `src/Código.js` | 5 | `ejecutarSuitePaso305a310();` | `(?:function )?ejecutarSuite*` | llamada | `ERR` falso positivo |
| `src/IntegrityService.js` | 3515 | `function probarReporteIntegridad()` | `function probar*` | declaración | `ERR` legítimo |

El log no notificó `Formularios.js`, `PedidoRecepcion.js` ni `Validation.js` porque la implementación anterior solo generaba WARN para un mixto cuando encontraba declaraciones con sus expresiones regulares; confundía así mezcla arquitectónica con código de prueba embebido.

### Diagnóstico individual

`Código.js` no declara una función de prueba ni un ejecutor: invoca `ejecutarSuitePaso305a310`, definido externamente. El fragmento está en código ejecutable, no en cadena o comentario, pero su tipo es **llamada**. Diagnóstico: **FALSO POSITIVO** provocado por el `function` opcional del patrón antiguo.

`IntegrityService.js` contiene controles productivos de integridad y, separadamente, declara `probarReporteIntegridad` en la línea 3515. No es una simple comprobación productiva, llamada, referencia, texto o comentario: es una **declaración real de prueba/diagnóstico embebida en producción no mixta**. Diagnóstico: **ERR legítimo**. No se reclasifica el servicio ni se modifica la fuente; TEST-04 previsiblemente seguirá bloqueado hasta una decisión posterior sobre ese código.

| Archivo | Motivo F07 | Capas mezcladas | Pruebas declaradas | MIXED_ARCHITECTURE | EMBEDDED_TEST_CODE |
|---|---|---|---:|---|---|
| `Formularios.js` | mezcla de capas | UI, configuración, dominio y repositorios | 0 explícitas | sí | no |
| `Ids.js` | producción + deuda | IDs, entidad, Sheets, locks y acceso | 6 localizadas (F07 estimó 5) | sí | sí |
| `PedidoRecepcion.js` | operación + corrección administrativa | menú, UI y repositorios | 0 | sí | no |
| `Repository.js` | producción + pruebas | persistencia, reglas, historial, locks y pruebas | 51 según F07; numerosas declaraciones verificadas | sí | sí |
| `Validation.js` | validación + aplicación física/admin | reglas, Sheets e instalación | 0 explícitas | sí | no |

La diferencia 6 frente a las 5 aproximadas de F07 en `Ids.js` se debe a las declaraciones localizadas estáticamente en líneas 152, 284, 341, 391, 466 y 491; no se reformula el recuento anterior como cobertura ejecutada.

### Causa raíz y contrato corregido

Causa raíz doble: (1) los patrones `ejecutarSuite*` y `assert*` aceptaban opcionalmente `function`, por lo que confundían invocaciones con declaraciones; (2) el WARN de un archivo `mixed:true` dependía de hallar marcadores de test, aunque F07 clasificó tres de ellos por mezcla de capas sin pruebas explícitas. Adicionalmente, el texto completo se examinaba sin retirar comentarios, strings o template literals y la evidencia no incluía línea ni tipo.

`build-packages.mjs` incorpora un enmascarado léxico conservador que preserva saltos de línea e ignora comentarios de línea/bloque, strings simples/dobles y template literals. Detecta únicamente declaraciones `function nombre(...)` y asignaciones inequívocas `const|let|var nombre = function|arrow` cuyos nombres siguen el vocabulario de prueba. Las llamadas y referencias no coinciden. Toda entrada `mixed:true` genera `WARN MIXED_ARCHITECTURE`; solo sus declaraciones de prueba generan además `WARN EMBEDDED_TEST_CODE`; una declaración en `production` genera `ERR EMBEDDED_TEST_CODE_IN_PRODUCTION`. Cada evidencia incorpora ruta, línea, tipo, nombre y motivo. Un estado léxico sin cierre produce `WARN AMBIGUOUS_TEST_ANALYSIS`, no falso OK.

Las reglas antiguas inseguras se retiraron, no quedan activas en paralelo. `package-map.json` no se modificó: la matriz arquitectónica de cinco mixtos sigue siendo la evidencia aplicable y no se falseó para incorporar `IntegrityService.js`.

### Pruebas redactadas, no ejecutadas

Total anterior: 25. Se añadieron 18 casos numerados 26–43; total nuevo esperado: **43**. Cubren declaraciones `prueba`, `test` y ejecutor; llamada externa; string simple/doble; template literal; comentario de línea/bloque; archivo B; cinco WARN arquitectónicos; evidencia real de Ids y Repository; mixto sin pruebas; línea correcta; `Código.js`; `IntegrityService.js`; y ambigüedad sin falso OK. El caso 14 previo se hizo estricto para exigir los cinco `MIXED_ARCHITECTURE`, y el caso 15 usa el nuevo ERR. **No se ejecutó ninguna prueba ni Node.**

### Revisión estática, riesgos y hashes

Relectura estática: solo permanecen imports integrados de Node ya existentes; no hay nuevas dependencias, red, Drive, OAuth, API, `clasp`, procesos hijo, evaluación ni ejecución de fuentes. `--check` conserva su flujo de lectura; las escrituras continúan aisladas en la rama de build no autorizada. Riesgos: el analizador no es parser completo; no interpreta semántica, alias, regex complejas ni todas las formas posibles de asignación; una construcción léxica excepcional puede producir advertencia ambigua. La sintaxis y el comportamiento quedan pendientes de P0-RETEST01.

| Archivo | Bytes posteriores | SHA-256 posterior | Estado P0-FIX01 |
|---|---:|---|---|
| `build-packages.mjs` | 25.418 | `18e34064755e0bff61afd24f719c4595d7547cd0bb8812942291655d02ddaadf` | modificado autorizado |
| `package-map.json` | 32.456 | `510e445d1b95a2804316793c29bac02dd4325b503f1f9eb570e69f85df57f67b` | intacto |
| `build-packages.test.mjs` | 15.191 | `bf852271bfaaa7a72678636f7128945778e6afb6a4c9614f613b9f217c5734e3` | modificado autorizado; no ejecutado |
| `README.md` | 8.707 | `1177af6edaa54337eaee2953fd0e957bf873345b5045e13c212d780d233acfa2` | modificado autorizado |

Resultado: **CORREGIDO ESTÁTICAMENTE — NO EJECUTADO — NO PROBADO — NO_GO operativo vigente**. TEST-04 no se declara resuelto. Gate humano siguiente propuesto: **P0-RETEST01 — repetir comprobación sintáctica, suite completa y `--check` tras la corrección, sin construir paquetes**. P0-BUILD01 continúa prohibido.

## P0-FIX02 — Separación de pruebas y runner técnico

### Baseline y autorización

Gate P0-FIX01 aprobado estáticamente; P0-RETEST01 y P0-BUILD01 permanecen bloqueados. Se autorizó exclusivamente modificar los ocho archivos enumerados para P0-FIX02, sin crear archivos, ejecutar Node/Apps Script/pruebas/`--check`, construir, usar red/`clasp` ni hacer commit.

Baseline: rama `main`; commit `752e1c14ea3d9cadff102aa52780616d0e58336a`; Git inicial coincidente con el estado heredado. Manual `a18332565c408e9f283df26201c1a6745d1699ce9fd557d709d980225321c1fc`; roadmap 246.410 bytes y SHA-256 `d3777c99c865e36453130138feeabb403b55b8bec53a42d3380e2de0d221e0d4`. Las 110 fuentes coincidían con los hashes de la matriz. Se releyeron F03, F06, F07, P0-TEST01 y P0-FIX01 antes de decidir.

| Archivo autorizado | SHA-256 anterior |
|---|---|
| `src/IntegrityService.js` | `c8bf30e81ca85a0fa3f5824aabc4e99a4953296c6e2ba7b89aab8f9b36c29026` |
| `src/Tests_IntegridadGapReglasFuncional.js` | `d3aae8e9b6c4d1f9a122b7828e502b64e919057c23dbb390af11b1a8a5032848` |
| `src/Código.js` | `c5bb093173f04ab7f7226f433cc3cbcd3a8157df68687d693175d3fd4690456a` |
| `tools/packager/package-map.json` | `510e445d1b95a2804316793c29bac02dd4325b503f1f9eb570e69f85df57f67b` |
| `tools/packager/build-packages.mjs` | `18e34064755e0bff61afd24f719c4595d7547cd0bb8812942291655d02ddaadf` |
| `tools/packager/build-packages.test.mjs` | `bf852271bfaaa7a72678636f7128945778e6afb6a4c9614f613b9f217c5734e3` |
| `tools/packager/README.md` | `1177af6edaa54337eaee2953fd0e957bf873345b5045e13c212d780d233acfa2` |

### Análisis de `probarReporteIntegridad`

Ubicación anterior: `IntegrityService.js:3515–3523`. Función global sin parámetros y sin retorno explícito. Invoca la API productiva `obtenerReporteIntegridad()`, serializa el resultado con `JSON.stringify(..., null, 2)` y lo envía a `console.log`; su único efecto lateral es diagnóstico en el registro. No requiere variables locales/globales adicionales fuera de esas dependencias.

| Elemento | Evidencia | Dependencia productiva | Dependencia de prueba | Riesgo de mover |
|---|---|---|---|---|
| Declaración | `function probarReporteIntegridad()` | ninguna entrada productiva | prueba manual | bajo |
| Obtención | llamada a `obtenerReporteIntegridad()` | reutiliza API productiva sin modificarla | objeto bajo inspección | conservar carga de A antes de B |
| Salida | `console.log(JSON.stringify(...))` | ninguna UI/menú | diagnóstico manual | cambio de disponibilidad si solo se carga A |
| Entrantes | búsqueda global: solo declaración y referencias documentales/de prueba | ninguna | caso estático del empaquetador | bajo |
| Menú/triggers/formularios | cero referencias localizadas; el menú usa `abrirIntegridad` | `abrirIntegridad` permanece | ninguna | ninguno localizado |

Gate: **GO para extracción mecánica**. Es exclusivamente una prueba/diagnóstico manual sin llamada productiva entrante. Se movió completa, sin cambiar nombre, parámetros, cuerpo, mensajes, comportamiento o dependencia, a una sección `PRUEBAS MANUALES DEL REPORTE DE INTEGRIDAD` al final de `Tests_IntegridadGapReglasFuncional.js`. No se duplicó ni ejecutó.

Verificación estática: existe una única declaración global, ahora en `Tests_IntegridadGapReglasFuncional.js:766–774`; `IntegrityService.js` no conserva referencia al nombre y su siguiente función productiva enlaza directamente tras `abrirIntegridad`. Ninguna otra función productiva fue movida.

### Análisis y decisión sobre `Código.js`

El archivo completo tiene 13 líneas y una sola función, `myFunction`. Obtiene `00_INICIO`, ejecuta `ejecutarSuitePaso305a310()`, captura éxito/error y escribe el resultado y fecha en `A1:A2`. F03 verificó que la portada funciona como consola persistente y expone stack. La suite se declara en `Tests_Repository.js:7584`; no hay referencia a `myFunction` desde menú, trigger, manifiesto, formulario o código productivo. El manifiesto no declara triggers. La escritura no es funcionalidad operativa localizada, sino diagnóstico técnico de la suite.

Clasificación: **TEST_RUNNER_ONLY**. `Código.js` no se borró ni modificó: conserva 389 bytes y su hash anterior. `package-map.json` lo reclasifica como `auxiliary`, paquete C, requerido, no mixto, con razón exacta `manual test runner for suite 305-310; writes diagnostics to 00_INICIO`. Si no entra en A, desaparecen de producción el runner y sus escrituras diagnósticas; la UI productiva de integridad y `00_INICIO` no dependen de él según las referencias localizadas.

### Matriz y detector

Se actualizaron únicamente los hashes contractuales de `IntegrityService.js` y `Tests_IntegridadGapReglasFuncional.js`, además de la categoría/paquete/razón de `Código.js`. Universo: 134 entradas y 134 rutas únicas.

| Recuento | Anterior | Posterior | Variación |
|---|---:|---:|---:|
| production | 64 | 63 | -1 |
| test | 7 | 7 | 0 |
| auxiliary | 34 | 35 | +1 |
| excluded | 24 | 24 | 0 |
| mixed | 5 | 5 | 0 |
| paquete A | 69 | 68 | -1 |
| paquete B | 7 | 7 | 0 |
| paquete C | 34 | 35 | +1 |
| paquete NONE | 24 | 24 | 0 |

El detector conserva declaraciones de prueba en `production/A` como ERR, en `test/B` permitidas y en `mixed/A` como WARN. Añade detección separada de llamadas directas inequívocas `ejecutarSuite*`: en `production/A`, `ERR SUITE_CALL_IN_PRODUCTION`; en `auxiliary/C`, `WARN APPROVED_SUITE_RUNNER`; en mixtos, WARN. Comentarios, strings y template literals siguen enmascarados. Una llamada productiva normal que solo contiene una palabra parecida no coincide. La matriz cerrada del detector usa ahora 63/7/35/24/5.

### Pruebas redactadas, no ejecutadas

Se conservaron/adaptaron los 43 casos de P0-FIX01 y se añadieron diez, 44–53: `probarReporteIntegridad` en A y B; llamada de `Código.js` en A y C; llamada productiva similar; clasificación de `Código.js`; nuevos hashes; nuevos recuentos; declaración única; ausencia en `IntegrityService.js`. Total esperado: **53**. No se ejecutaron.

### Hashes posteriores, riesgos y reversión

| Archivo | Bytes | SHA-256 posterior |
|---|---:|---|
| `src/IntegrityService.js` | 95.637 | `9ea74302397f0b79f520589694b936d8eedbd25ab9c88970b60f30ce7b672c36` |
| `src/Tests_IntegridadGapReglasFuncional.js` | 30.670 | `cb3f158d590be214e875d00a8585e4a8db278be577a321cb261a3f345c2576de` |
| `src/Código.js` | 389 | `c5bb093173f04ab7f7226f433cc3cbcd3a8157df68687d693175d3fd4690456a` |
| `tools/packager/package-map.json` | 32.504 | `b06a0d3ebca394aa451995ff5c48d4e416bb54e36abd72ef588c3c7766759a5b` |
| `tools/packager/build-packages.mjs` | 26.581 | `b6aa3708056748c8c081c4eed217694a2c8eb31c6a2b3d76a6edd6d9b98b8630` |
| `tools/packager/build-packages.test.mjs` | 18.531 | `40b944ab02bbd92da92afa54d8aa7a8f64fd0f2d2e13ca50ec59e0c38c3f67f4` |
| `tools/packager/README.md` | 9.206 | `7d22d274dbbe33b3aa79f59098c57c8e42c8ffc7c3a90848131cc16c2dcb6f18` |

Riesgos: Apps Script usa espacio global y B requiere A cargado; la ausencia de referencias está probada estáticamente, no en despliegue; el detector léxico no es parser completo; los recuentos/hashes y 53 casos todavía no han sido ejecutados. La prueba manual sigue pudiendo leer datos mediante `obtenerReporteIntegridad` cuando B se cargue expresamente.

Reversión propuesta, no ejecutada: retirar la función completa de líneas 766–774 del archivo de pruebas y devolverla entre `abrirIntegridad` y `detectarRelacionesMaterialConPadresInactivos_`; restaurar los dos hashes de fuentes; devolver `Código.js` a `production/A` con razón `operación/UI/config`; restaurar recuentos 64/7/34/24/5 y A=69/C=34; restaurar detector, diez casos y README a sus hashes anteriores; revertir exclusivamente esta sección P0-FIX02. No usar reset ni tocar otros archivos.

Resultado: **SEPARADO ESTÁTICAMENTE — NO EJECUTADO — NO PROBADO — NO_GO vigente**. Siguiente gate humano solicitado: **P0-RETEST01 — Sintaxis, suite completa y `--check` con la nueva matriz, sin construir paquetes**. P0-BUILD01 continúa bloqueado.

## P0-RETEST01 — Retest del empaquetador corregido

### Autorización y baseline previo

Gate P0-FIX02 aprobado estáticamente. Autorizados únicamente Node local, sintaxis, una ejecución de la suite, empaquetador solo con `--check`, argumentos/destinos seguros, temporal propio, log y esta documentación. Prohibidos `--build`, paquetes, cambios de código tras iniciar el retest, cambios en `src`, red/Drive/APIs/OAuth/`clasp`, exportación, despliegue, commit y P0-BUILD01.

Baseline del 2026-08-05: Node `C:\Program Files\nodejs\node.exe` v24.18.0; rama `main`; commit `752e1c14ea3d9cadff102aa52780616d0e58336a`; Git exactamente esperado. Los ocho hashes posteriores de P0-FIX02 coinciden; los 110 archivos `src` coinciden con la matriz. Los únicos cambios Git en `src` son `IntegrityService.js` y `Tests_IntegridadGapReglasFuncional.js`. Existe una sola declaración global de `probarReporteIntegridad`, cero en producción y una en el archivo de pruebas (línea 766). `Código.js` conserva hash `c5bb093173f04ab7f7226f433cc3cbcd3a8157df68687d693175d3fd4690456a` y está declarado `auxiliary/C`. Manual intacto: `a18332565c408e9f283df26201c1a6745d1699ce9fd557d709d980225321c1fc`. Roadmap inicial: SHA-256 `ef7ce7c30834df6874a031f77574fd80ceb42cdb8cdb902a31601f6a93a24c1a`.

Temporal exclusivo, previamente inexistente y distinto de raíz/proyecto/`src`: `C:\Users\pc\AppData\Local\Temp\P0-RETEST01-20260805-063129-ee5dd383ef014cfc989af7221f336a4f`. Log: `P0-RETEST01-20260805-063129.log`. Inventario previo externo al repositorio: 138 archivos, con ruta, bytes y SHA-256.

Comandos previstos, en orden: `node --check` para los dos MJS; una ejecución de `node tools/packager/build-packages.test.mjs`; `node tools/packager/build-packages.mjs --check --all --project-root "C:\Users\pc\Desktop\LaTroballa.audit"`; comparación física; y argumentos/destinos inválidos controlados. Criterio de parada: cualquier código/recuento/warning distinto, `ERR`, hash divergente, escritura inesperada o paquete creado implica NO_GO inmediato, sin reintento ni edición.

| Retest | Comando | Esperado | Obtenido | Código | Evidencia | Estado |
| ------ | ------- | -------- | -------- | -----: | --------- | ------ |
| RETEST-01 | `node --check tools/packager/build-packages.mjs`; `node --check tools/packager/build-packages.test.mjs` | ambos 0, sin salida ni cambios | ambos 0; salida vacía; 75 ms y 48 ms | 0 / 0 | hashes del empaquetador y 110 `src` intactos; cero paquetes | OK |

Incidencia no funcional: el wrapper de registro emitió después de ambos procesos un error PowerShell al formar la marca `NEXT` (`Where-Object Code -ne0`). No afectó a los comandos Node ni a sus códigos/salidas y no se repitieron. Se registró como WARN de trazabilidad y se corrigió únicamente la escritura del log, no código del proyecto.

| Retest | Comando | Esperado | Obtenido | Código | Evidencia | Estado |
| ------ | ------- | -------- | -------- | -----: | --------- | ------ |
| RETEST-02 | `node tools/packager/build-packages.test.mjs` (una sola ejecución) | 53 descubiertas, 53 OK, 0 fallidas, 0 omitidas, código 0 | 53 descubiertas, 52 OK, 1 fallida, 0 omitidas | 1 | fallo 29 `llamada a suite externa no produce ERR`: `STRUCTURES_DIFFER`; salida completa debajo | ERR — NO_GO |
| RETEST-03 | no ejecutado | `--check --all` | parada tras RETEST-02 | — | criterio obligatorio | NO ALCANZADO |
| RETEST-04 | comparación posterior a suite | solo roadmap autorizado | árbol: únicamente roadmap; hashes y Git esperados; cero paquetes | 0 | inventario físico de 138 archivos | OK DE INTEGRIDAD, FASE DETENIDA |
| RETEST-05 | no ejecutado | argumentos/destinos | parada tras RETEST-02 | — | criterio obligatorio | NO ALCANZADO |
| RETEST-06 | no ejecutado como fase independiente | ausencia de red/procesos | parada tras RETEST-02; ningún comando de red, navegador, Drive, `clasp` o fuente ejecutado | — | comandos y procesos invocados | NO ALCANZADO |

Salida completa de RETEST-02:

```text
ENGREMIAT_PACKAGE_BEGIN tests=53
OK 01 universo de 134 entradas
OK 02 rutas únicas
OK 03 categorías válidas y recuentos
OK 04 rechazo de ruta absoluta
OK 05 rechazo de ruta padre
OK 06 rechazo de archivo desconocido
OK 07 rechazo de archivo ausente
OK 08 rechazo de hash modificado
OK 09 exclusión de siete tests en A
OK 10 inclusión individual de siete tests en B
OK 11 repositorios de tests separados
OK 12 inclusión de 21 HTML en A
OK 13 inclusión de appsscript.json en A
OK 14 advertencia por cinco mixtos
OK 15 error por prueba en producción no mixta
OK 16 rechazo de destino no vacío o preexistente
OK 17 rechazo de raíz del proyecto
OK 18 rechazo de src y tooling
OK 19 ausencia de escritura en check
OK 20 limpieza del temporal tras fallo
OK 21 no sobrescritura
OK 22 hash agregado estable ante orden distinto
OK 23 hash agregado independiente de fecha y raíz
OK 24 manifiesto determinista con metadatos fijados
OK 25 códigos de salida y argumentos
OK 26 declaración function prueba en producción produce ERR
OK 27 declaración function test en producción produce ERR
OK 28 ejecutor de suite declarado en producción produce ERR
ERR 29 llamada a suite externa no produce ERR message=STRUCTURES_DIFFER
OK 30 nombre de prueba en string simple se ignora
OK 31 nombre de prueba en string doble se ignora
OK 32 nombre de prueba en template literal se ignora
OK 33 nombre de prueba en comentario de línea se ignora
OK 34 nombre de prueba en comentario de bloque se ignora
OK 35 archivo B permite declaraciones de prueba
OK 36 los cinco mixtos reales declaran MIXED_ARCHITECTURE
OK 37 Ids real contiene EMBEDDED_TEST_CODE
OK 38 Repository real contiene EMBEDDED_TEST_CODE
OK 39 mixto sin pruebas no declara EMBEDDED_TEST_CODE
OK 40 evidencia informa línea correcta
OK 41 Código.js real es llamada y no declaración
OK 42 IntegrityService.js real queda sin prueba embebida tras extracción
OK 43 análisis léxico ambiguo no produce falso OK
OK 44 probarReporteIntegridad en producción produce ERR
OK 45 probarReporteIntegridad en B está permitida
OK 46 Código.js en A llamando a suite produce ERR
OK 47 Código.js en C produce WARN y no ERR
OK 48 llamada productiva con palabra similar está permitida
OK 49 matriz clasifica Código.js como auxiliary C
OK 50 hashes nuevos de archivos de integridad
OK 51 recuento actualizado de categorías y paquetes
OK 52 única declaración global de probarReporteIntegridad
OK 53 ausencia de probarReporteIntegridad en IntegrityService.js
NEXT corregir_sin_construir
ENGREMIAT_PACKAGE_END result=ERR failures=1
```

### Parada, integridad y resultado

La expectativa del caso 29 pertenecía al contrato P0-FIX01 (“llamada a suite externa sin ERR”), mientras P0-FIX02 endureció el contrato para que una llamada directa inequívoca `ejecutarSuite*` desde producción/A sea ERR. La ejecución demuestra una contradicción entre ese caso conservado y la regla nueva; determinar la corrección exacta requiere un gate separado. No se modifica ni reintenta nada en P0-RETEST01.

Tras la parada: comparación contra el inventario previo de 138 archivos muestra únicamente `ROADMAP_AUDITORIA_UX.md` modificado por documentación autorizada; cero divergencias en los 110 `src` y cuatro hashes del empaquetador; Git conserva el estado esperado; no existen A/B/C, `packages`, `dist` ni `build`. El temporal contiene solo el log y `project-before.csv`; se conserva completo por NO_GO. No se ejecutaron `--check`, argumentos, build, fuentes Apps Script, red, procesos hijo, navegador, Drive, API, OAuth ni `clasp`.

Resultado P0-RETEST01: **NO_GO**. Evidencia válida: sintaxis 2/2 OK y 52/53 casos OK; evidencia bloqueante: caso 29 fallido y código 1. No se puede declarar `VERIFICADO LOCALMENTE`, `53/53 OK` ni `--check OK`. Estados: **NO CONSTRUIDO — NO EXPORTADO — NO DESPLEGADO — NO_GO operativo vigente**.

Gate siguiente pendiente de aprobación humana: fase correctiva estática para resolver la contradicción del caso 29 frente a `SUITE_CALL_IN_PRODUCTION`, sin ejecutar ni construir. P0-BUILD01 continúa bloqueado.

## P0-FIX03 — Corrección de expectativa contradictoria

### Baseline y diagnóstico

Gate P0-RETEST01 confirmado NO_GO. Alcance exclusivo: suite, README y este roadmap; detector solo si existiera inconsistencia documental demostrada. Prohibidos cambios en `src` o matriz, Node, pruebas, `--check`, build, red/`clasp`, commit y P0-BUILD01.

Baseline: rama `main`, commit `752e1c14ea3d9cadff102aa52780616d0e58336a`; Git esperado. Empaquetador: `build-packages.mjs` `b6aa3708056748c8c081c4eed217694a2c8eb31c6a2b3d76a6edd6d9b98b8630`, suite `40b944ab02bbd92da92afa54d8aa7a8f64fd0f2d2e13ca50ec59e0c38c3f67f4`, matriz `b06a0d3ebca394aa451995ff5c48d4e416bb54e36abd72ef588c3c7766759a5b`, README `7d22d274dbbe33b3aa79f59098c57c8e42c8ffc7c3a90848131cc16c2dcb6f18`. Roadmap inicial `e6c5afb7806c3e8abc820c72632894168acdde796bce8880e54ec9502cee48bd`; manual `a18332565c408e9f283df26201c1a6745d1699ce9fd557d709d980225321c1fc`; 110 `src` sin divergencias. Log P0-RETEST01 conservado: 3.720 bytes, SHA-256 `79b7c6a9d4f652c8b67eace89d20e2d59e562d2ea930b8564665384f5798552d`.

| Elemento | Valor |
|---|---|
| Nombre exacto | `29 llamada a suite externa no produce ERR` |
| Fixture de entrada | `ejecutarSuiteExterna();` |
| Categoría | producción implícita del helper (`mixed:false`) |
| Paquete | A, valor predeterminado de `contaminationForSource` |
| Código analizado | llamada directa, línea 1, a nombre inequívoco `ejecutarSuite*` |
| Resultado esperado anterior | `result.errors` vacío |
| Resultado real | `SUITE_CALL_IN_PRODUCTION`, por lo que `STRUCTURES_DIFFER` |
| Regla aplicada | llamada directa `ejecutarSuite*` desde production/A = ERR |

Las tres condiciones se cumplen: llamada inequívoca, producción/A y bloqueo exigido por P0-FIX02. Clasificación: **TEST_EXPECTATION_OBSOLETE**. La causa no está en el detector sino en que el caso 29 conservó el contrato P0-FIX01 después del endurecimiento aprobado en P0-FIX02.

### Contrato preservado y cambio exacto

Se preserva sin cambios: **llamada directa `ejecutarSuite*` desde production/A = `ERR SUITE_CALL_IN_PRODUCTION`**. Permitirla reintroduciría runners de prueba en A, podría ejecutar escrituras/diagnósticos y reproduciría el problema de `Código.js`. `build-packages.mjs` permanece byte a byte intacto.

El caso 29 conserva `ejecutarSuiteExterna();`, se renombra a `29 llamada ejecutarSuite externa desde producción produce ERR` y ahora exige `SUITE_CALL_IN_PRODUCTION`, `src/sample.js`, línea 1, tipo `llamada` y nombre `ejecutarSuiteExterna`. El caso 48 pasa a ser el control neutral separado: `procesarDatosExternos()` en producción/A debe dejar `errors=[]`; no usa `test`, `prueba`, `probar`, `suite` ni `ejecutarSuite`.

Los casos 30–34 conservan la cobertura de declaraciones ocultas y añaden la llamada `ejecutarSuiteOculta()` dentro de string simple, string doble, template literal, comentario de línea y comentario de bloque; verifican por separado que ni declaraciones ni llamadas atraviesen el enmascarado léxico.

### Cobertura final, README y hashes

Cobertura estática separada:

- declaración de prueba en A → ERR: casos 26/27/44;
- llamada `ejecutarSuite*` en A → ERR: casos 29 y 46 (fixture genérico frente a `Código.js` real; no equivalentes);
- runner en C → WARN: caso 47;
- llamada externa normal en A → permitida: caso 48;
- llamada en strings/template/comentarios → ignorada: casos 30–34.

El total permanece en **53**: no se añadió ni eliminó ningún caso, solo se corrigió la expectativa obsoleta y se enriquecieron fixtures léxicos. README aclara que referencias y llamadas generales no contaminan; `ejecutarSuite*` en A es ERR; el mismo runner autorizado en C es WARN; las declaraciones de prueba en A son ERR.

| Archivo | SHA-256 anterior | Bytes posteriores | SHA-256 posterior |
|---|---|---:|---|
| `build-packages.test.mjs` | `40b944ab02bbd92da92afa54d8aa7a8f64fd0f2d2e13ca50ec59e0c38c3f67f4` | 19.185 | `973d03e9c810fa4a601f3f48ca0d672a018668529bd5cca5f98bf86f2b45ce74` |
| `README.md` | `7d22d274dbbe33b3aa79f59098c57c8e42c8ffc7c3a90848131cc16c2dcb6f18` | 9.453 | `12c024c76c4c06149c334f26febec5c79f6996fc65525966623a7afee59b63e6` |
| `build-packages.mjs` | `b6aa3708056748c8c081c4eed217694a2c8eb31c6a2b3d76a6edd6d9b98b8630` | 26.581 | sin cambios |
| `package-map.json` | `b06a0d3ebca394aa451995ff5c48d4e416bb54e36abd72ef588c3c7766759a5b` | 32.504 | sin cambios |

Limitación: la coherencia se verificó solo por lectura; la nueva expectativa y los 53 casos no se ejecutaron. `src`, matriz, manual y log permanecen intactos.

Resultado: **EXPECTATIVA CORREGIDA ESTÁTICAMENTE — NO EJECUTADO — NO PROBADO — NO_GO vigente**. Gate siguiente solicitado: **P0-RETEST02 — repetir sintaxis, suite completa, `--check` y validaciones de argumentos, sin construir paquetes**. P0-BUILD01 continúa bloqueado.

## P0-RETEST02 — Retest completo previo a construcción

### Autorización y baseline previo

Gate P0-FIX03 aprobado estáticamente. Se autorizan Node local, una suite, `--check`, argumentos inválidos, temporal/log y este roadmap. Prohibidos cambios de código durante el retest, `--build` con combinación válida, paquetes, cambios en `src`, red/Drive/OAuth/API/`clasp`, exportación, despliegue, commit y P0-BUILD01.

Baseline 2026-08-05: Node v24.18.0; rama `main`; commit `752e1c14ea3d9cadff102aa52780616d0e58336a`; Git esperado. Hashes P0-FIX03 coincidentes: detector `b6aa3708056748c8c081c4eed217694a2c8eb31c6a2b3d76a6edd6d9b98b8630`, suite `973d03e9c810fa4a601f3f48ca0d672a018668529bd5cca5f98bf86f2b45ce74`, matriz `b06a0d3ebca394aa451995ff5c48d4e416bb54e36abd72ef588c3c7766759a5b`, README `12c024c76c4c06149c334f26febec5c79f6996fc65525966623a7afee59b63e6`. Manual `a18332565c408e9f283df26201c1a6745d1699ce9fd557d709d980225321c1fc`; roadmap inicial `2915e3edbcf8832bfd0b7e24ba65e2c1da7c71a52f9f55e4a39d6da7e1b3fdbf`.

Integridad: 110 `src`, 0 divergencias; una declaración global de `probarReporteIntegridad` en el archivo de pruebas; `Código.js` intacto y `auxiliary/C`. Matriz: 134 entradas/134 rutas únicas; categorías 63/7/35/24/5; paquetes A=68, B=7, C=35, NONE=24.

Temporal exclusivo y seguro: `C:\Users\pc\AppData\Local\Temp\P0-RETEST02-20260805-064058-0886cdd4089545de9a30e3496761e45c`. Log `P0-RETEST02-20260805-064058.log`; inventario previo `project-before.csv`, 138 archivos. Orden previsto: sintaxis 2/2; suite una vez; `--check --all`; comparación física; argumentos/destinos individualmente; seguridad final. Riesgos: fallo contractual, warning ausente, escritura, hash divergente o destino aceptado. Cualquiera implica parada inmediata sin reintento ni edición.

| Retest | Esperado | Obtenido | Código | Escrituras | Estado |
| ------ | -------- | -------- | -----: | ---------- | ------ |
| RETEST-01 — sintaxis | 2/2 OK, códigos 0 | 2/2 OK; salidas vacías; 76 ms y 58 ms | 0 / 0 | ninguna; hashes y Git intactos; cero paquetes | OK |
| RETEST-02 — suite | 53 descubiertas/53 OK/0 fallidas/0 omitidas | 53/53/0/0; 614 ms; casos 29, 48 y 30–38, 41–53 OK | 0 | ninguna; suite limpió fixtures; hashes intactos | OK |

Salida completa de la suite conservada en el log. Cierre: `NEXT solicitar_gate_de_build`; `ENGREMIAT_PACKAGE_END result=OK failures=0`.

| Retest | Esperado | Obtenido | Código | Escrituras | Estado |
| ------ | -------- | -------- | -----: | ---------- | ------ |
| RETEST-03 — `--check --all` | código 0, 5 MIXED, 2 EMBEDDED, 1 runner, 0 ERR, sin warnings no previstos | código 0; 5 MIXED; **71 EMBEDDED**; 1 runner; 2 AMBIGUOUS; 0 ERR | 0 | ninguna, según comparación física posterior | ERR CONTRACTUAL — NO_GO |
| RETEST-04 | integridad formal | no ejecutado por parada; comprobación de seguridad limitada confirma solo roadmap autorizado, hashes intactos y cero paquetes | — | ninguna inesperada | NO ALCANZADO |
| RETEST-05 | argumentos/destinos | no ejecutado por parada | — | ninguna | NO ALCANZADO |
| RETEST-06 | seguridad completa | no ejecutado por parada; hasta la parada no hubo red, navegador, Drive, APIs, `clasp`, procesos hijo ni fuentes ejecutadas | — | ninguna | NO ALCANZADO |

Salida completa de RETEST-03 conservada en el log. Líneas contractuales coincidentes: cinco `WARN MIXED_ARCHITECTURE` (`Formularios.js`, `Ids.js`, `PedidoRecepcion.js`, `Repository.js`, `Validation.js`); un `WARN APPROVED_SUITE_RUNNER src/Código.js line=5`; cero `ERR`; `OK validacion_estatica packages=A,B,C`; cierre `result=OK mode=check`.

Diferencias bloqueantes:

- esperado: dos líneas `WARN EMBEDDED_TEST_CODE`, una por cada archivo afectado; obtenido: 71 líneas, seis declaraciones de `Ids.js` y 65 de `Repository.js`;
- no previstas: `WARN AMBIGUOUS_TEST_ANALYSIS src/DesviacionService.js line=904 ... UNTERMINATED_SINGLE_STRING` y `src/ReportService.js line=427 ... UNTERMINATED_DOUBLE_STRING`;
- la advertencia autorreferencial del roadmap permanece prevista por el contrato histórico y no es la causa del NO_GO.

Aunque el proceso devolvió 0 y no emitió ERR, el recuento de advertencias y las dos ambigüedades incumplen el resultado obligatorio. Se aplicó parada inmediata: no se ejecutaron argumentos ni pasos posteriores, no se reintentó y no se modificó código.

### Integridad, temporal y resultado

La comprobación de seguridad posterior a la parada comparó el inventario de 138 archivos: solo el roadmap cambió por documentación autorizada. Los 110 hashes de `src`, detector, suite, matriz y README permanecen intactos; Git coincide; no existen paquetes A/B/C, `packages`, `dist` o `build`. El temporal contiene únicamente el log completo y `project-before.csv`; se conserva por NO_GO.

Resultado P0-RETEST02: **NO_GO**. Evidencia válida: sintaxis 2/2 OK, suite 53/53 OK y `--check` sin ERR/código 0/sin escritura. Evidencia bloqueante: salida de warnings distinta del contrato. No se declara `--check OK` contractual ni `ARGUMENTOS Y DESTINOS OK`. Estados: **NO CONSTRUIDO — NO EXPORTADO — NO DESPLEGADO — NO_GO operativo vigente**.

Gate humano pendiente: **P0-FIX04 — corrección estática separada para agregar `EMBEDDED_TEST_CODE` por archivo —con detalle de declaraciones sin multiplicar la advertencia contractual— y diagnosticar las dos ambigüedades léxicas**. P0-BUILD01 continúa bloqueado.

## P0-FIX04 — Consolidación de advertencias y corrección léxica

### Baseline y evidencia de P0-RETEST02

Gate P0-RETEST02 confirmado NO_GO. Autorizados únicamente detector, suite, README y este roadmap; prohibidos `src`, matriz, Node, pruebas, `--check`, build, dependencias, red/`clasp`, commit y P0-BUILD01.

Baseline: rama `main`; commit `752e1c14ea3d9cadff102aa52780616d0e58336a`; Git esperado. Detector `b6aa3708056748c8c081c4eed217694a2c8eb31c6a2b3d76a6edd6d9b98b8630`; suite `973d03e9c810fa4a601f3f48ca0d672a018668529bd5cca5f98bf86f2b45ce74`; README `12c024c76c4c06149c334f26febec5c79f6996fc65525966623a7afee59b63e6`; matriz intacta `b06a0d3ebca394aa451995ff5c48d4e416bb54e36abd72ef588c3c7766759a5b`; roadmap inicial `08f55ef73e0038f2da6676a5075795d8a8bbaab78a132df4fb166d9e7dac44b2`; manual `a18332565c408e9f283df26201c1a6745d1699ce9fd557d709d980225321c1fc`; 110 `src` sin divergencias. Log P0-RETEST02 conservado: 14.617 bytes, `ad3d624d2105db2c1548f1d30c9e875440b52528238b1cbff0d6951840eefac9`.

Las 71 líneas públicas provenían de iterar cada declaración y emitir un WARN individual, pese a que el contrato exige una línea pública por archivo.

| Archivo | Coincidencias | Tipos | Líneas | WARN anteriores |
|---|---:|---|---|---:|
| `src/Ids.js` | 6 | declaración | 152, 284, 341, 391, 466, 491 | 6 |
| `src/Repository.js` | 65 | declaración | 302, 371, 420, 469, 522, 570, 622, 676, 727, 778, 830, 885, 963, 1038, 1127, 1185, 1258, 1332, 1406, 1461, 1566, 1626, 1733, 1794, 1873, 1901, 2012, 2119, 2226, 2318, 2464, 2553, 2653, 2742, 2790, 2871, 3089, 3124, 3446, 3688, 3930, 4242, 4347, 4559, 4820, 4894, 4951, 5059, 5234, 5409, 5476, 5654, 5832, 6015, 6197, 6383, 6563, 6887, 7054, 7213, 7381, 7587, 7826, 8026, 8335 | 65 |

Todas las coincidencias son declaraciones con nombres del vocabulario de prueba; no se ocultaron para reducir el recuento. Causa raíz: el detalle interno y el protocolo público compartían el mismo bucle de emisión.

### Diagnóstico de ambigüedades

| Archivo | Inicio real | Fragmento mínimo | Estado previo | Carácter interpretado | Construcción real | Causa |
|---|---:|---|---|---|---|---|
| `DesviacionService.js` | 781 | `.replace(/"/g, '""')` | código, después de `(` | `"` tomado como inicio de string doble | regex literal `/"/g` | el scanner no reconocía regex; el estado erróneo acabó reportado al EOF como línea 904 |
| `ReportService.js` | 313 | `.replace(/"/g, '""')` | código, después de `(` | `"` tomado como inicio de string doble | regex literal `/"/g` | misma causa; el estado erróneo acabó reportado al EOF como línea 427 |

Clasificación de ambos: **FALSE_AMBIGUITY_REGEX_LITERAL**. Los literales están cerrados, tienen flag `g` y aparecen en contexto conservador de inicio de expresión. No existe error real de sintaxis deducible y no se modifica `src`.

### Cambios del detector

`maskNonCode` reconoce ahora regex después de contextos conservadores: inicio, `(`, `[`, `{`, coma, `=`, `:`, `!`, `?`, `;`, `return`, `case` y `=>`. Enmascara escapes, clases, barras/comillas internas y flags preservando líneas. Después de identificador, número, string cerrado, `)` o `]`, `/` se conserva como división. Un contexto restante genera `AMBIGUOUS_SLASH_CONTEXT`; regex, string, template o comentario de bloque sin cierre continúan advertidos. No hay excepciones por archivo ni dependencias nuevas.

`validateContamination` mantiene evidencia detallada por coincidencia como objetos `path`, `line`, `kind`, `name`, `reason`, ordenados por ruta/línea/nombre. Para mixtos emite una única línea pública por archivo: `EMBEDDED_TEST_CODE path=... matches=... lines=... kinds=...`; líneas se deduplican y ordenan, tipos se deduplican. El proyecto real debe emitir exactamente dos WARN públicos, preservando las 71 evidencias. `runCheck` devuelve la evidencia estructurada y el futuro `validation-report.json` la conserva en `embeddedTestEvidence`. Las entradas se procesan por ruta para salida determinista.

### Pruebas redactadas, no ejecutadas

Se conservan los 53 casos y se añaden 20, numerados 54–73: consolidación de múltiples pruebas; detalle completo; líneas únicas/ordenadas; dos archivos/dos WARN; cinco mixtos; regex con comillas, `\/`, clases, barra interna y flags; división numérica/identificadores; comentario tras división; slash ambiguo; literal realmente abierto; casos reales de Desviacion/Report; determinismo con orden invertido; y recuento público real igual a dos. Total esperado: **73**. No se ejecutó ninguno.

README documenta advertencia consolidada frente a evidencia, deduplicación, regex/división, ambigüedades, limitaciones y significado del recuento público. No afirma que la corrección esté probada.

### Hashes, integridad y riesgos

| Archivo | SHA-256 anterior | Bytes posteriores | SHA-256 posterior |
|---|---|---:|---|
| `build-packages.mjs` | `b6aa3708056748c8c081c4eed217694a2c8eb31c6a2b3d76a6edd6d9b98b8630` | 30.056 | `74d36176f37f8ef187d5ad8f534094028957862e7350971a0d18c6b9d5e51f61` |
| `build-packages.test.mjs` | `973d03e9c810fa4a601f3f48ca0d672a018668529bd5cca5f98bf86f2b45ce74` | 24.052 | `b1398a876c7942173e855fe7c1d65ace2e3da07df4e31e77bb961282f6e002f7` |
| `README.md` | `12c024c76c4c06149c334f26febec5c79f6996fc65525966623a7afee59b63e6` | 10.950 | `a86e3cebb393130308552f5dbc0a191466340a58cb4baa34649118501895500d` |
| `package-map.json` | `b06a0d3ebca394aa451995ff5c48d4e416bb54e36abd72ef588c3c7766759a5b` | 32.504 | sin cambios |

Riesgos/limitaciones: no es parser completo; flags desconocidos o gramática contextual compleja requieren revisión; `}` y otros contextos no concluyentes generan warning deliberado; templates se ignoran enteros; comportamiento y sintaxis quedan pendientes de retest. Sin imports nuevos, red, procesos hijo, evaluación o ejecución de fuentes.

Resultado: **CORREGIDO ESTÁTICAMENTE — NO EJECUTADO — NO PROBADO — NO_GO vigente**. Gate solicitado: **P0-RETEST03 — sintaxis, suite ampliada, `--check` y validaciones de argumentos, sin construir paquetes**. P0-BUILD01 continúa bloqueado.

## P0-RETEST03 — Retest del contrato corregido

### Autorización y baseline previo

Gate P0-FIX04 aprobado estáticamente. Autorizados Node local, una ejecución de la suite, `--check`, combinaciones inválidas, temporal/log y roadmap. Prohibidos cambios de código, construcción válida, paquetes, cambios `src`, red/Drive/API/OAuth/`clasp`, exportación, despliegue, commit y P0-BUILD01.

Baseline 2026-08-05: Node v24.18.0; rama `main`; commit `752e1c14ea3d9cadff102aa52780616d0e58336a`; Git esperado. Hashes P0-FIX04: detector `74d36176f37f8ef187d5ad8f534094028957862e7350971a0d18c6b9d5e51f61`; suite `b1398a876c7942173e855fe7c1d65ace2e3da07df4e31e77bb961282f6e002f7`; README `a86e3cebb393130308552f5dbc0a191466340a58cb4baa34649118501895500d`; matriz `b06a0d3ebca394aa451995ff5c48d4e416bb54e36abd72ef588c3c7766759a5b`. Manual `a18332565c408e9f283df26201c1a6745d1699ce9fd557d709d980225321c1fc`; roadmap inicial `3bc23fe28bf27ccc1f482b14bd2f4e2f9a7afac152a4b111142098ecd35ed058`.

Integridad: 110 fuentes/0 divergencias; 134 entradas/134 rutas únicas; una declaración global de `probarReporteIntegridad`; `Código.js` auxiliar/C. Recuentos 63 production, 7 test, 35 auxiliary, 24 excluded, 5 mixed; A=68, B=7, C=35, NONE=24.

Temporal exclusivo: `C:\Users\pc\AppData\Local\Temp\P0-RETEST03-20260805-070009-532ab11722ae4ddc9be39a1da41a7a05`; log `P0-RETEST03-20260805-070009.log`; inventario previo 138 archivos. Orden: sintaxis 2/2; suite una vez; `--check --all`; integridad; argumentos/destinos; seguridad. Parada ante cualquier código, recuento, warning, evidencia, hash o escritura diferente, sin reintento ni edición.

| Retest | Esperado | Obtenido | Código | Escrituras | Estado |
| ------ | -------- | -------- | -----: | ---------- | ------ |
| RETEST-01 | sintaxis 2/2 OK | 2/2 OK; salidas vacías; 79 ms y 39 ms | 0 / 0 | ninguna | OK |
| RETEST-02 | 73/73 OK, 0 fallidas/omitidas | 73 descubiertas, 72 OK, 1 fallida, 0 omitidas; 10.650 ms | 1 | ninguna; fixtures limpiados | ERR — NO_GO |
| RETEST-03 | `--check --all` | no ejecutado por parada en suite | — | ninguna | NO ALCANZADO |
| RETEST-04 | integridad formal | no ejecutado; comprobación de seguridad limitada confirma solo roadmap autorizado, hashes intactos y cero paquetes | — | ninguna inesperada | NO ALCANZADO |
| RETEST-05 | argumentos/destinos | no ejecutado | — | ninguna | NO ALCANZADO |
| RETEST-06 | seguridad completa | no ejecutado; hasta la parada no hubo red, navegador, Drive, API, `clasp`, procesos hijo ni fuentes ejecutadas | — | ninguna | NO ALCANZADO |

Fallo exacto de RETEST-02: caso `20 limpieza del temporal tras fallo`; esperado fragmento `NO_SE_PUEDE_LEER`; obtenido `CONSTRUCCION_INCOMPLETA`, por lo que la suite informó `UNEXPECTED_ERROR CONSTRUCCION_INCOMPLETA`. Los casos 1–19 y 21–73 aprobaron, incluidos consolidación, detalle estructurado, regex/división, ambigüedad real y casos reales Desviacion/Report. Salida completa de los 73 resultados preservada en el log.

Diagnóstico estático posterior, sin editar: P0-FIX04 añadió `validateContamination(projectRoot, map)` al inicio de `buildPackages` para generar `embeddedTestEvidence`. El fixture del caso 20 usa deliberadamente `missing.js`. Esa lectura previa lanza un error nativo dentro del `try`, que el catch traduce a `CONSTRUCCION_INCOMPLETA`, antes de alcanzar la ruta histórica que producía `NO_SE_PUEDE_LEER`. Queda pendiente decidir en gate separado si la validación debe ocurrir antes del temporal mediante error contractual de lectura o si el caso debe aceptar la nueva precedencia; no se modifica ni reintenta aquí.

### Parada e integridad

Se aplicó parada inmediata: no hubo `--check`, argumentos, build ni pasos posteriores. La comparación de 138 archivos muestra solo el roadmap modificado por documentación; 110 `src`, detector, suite, matriz y README conservan hashes; Git esperado; cero paquetes; cero residuos `engremiat-packager-test-*`. El temporal propio contiene únicamente log e inventario y se conserva.

Resultado P0-RETEST03: **NO_GO**. Evidencia válida: sintaxis 2/2 OK y 72/73 pruebas OK. Evidencia bloqueante: caso 20/código 1. No se declaran `--check OK`, contrato WARN ni argumentos/destinos verificados. Estados: **NO CONSTRUIDO — NO EXPORTADO — NO DESPLEGADO — NO_GO operativo vigente**.

Gate humano pendiente: **P0-FIX05 — corrección estática separada de la precedencia de validación/lectura y limpieza del caso 20, preservando `embeddedTestEvidence` y cleanup seguro**. P0-BUILD01 continúa bloqueado.

## P0-FIX05 — Precedencia de validación y cleanup

### Baseline y alcance

Gate P0-RETEST03 confirmado como `NO_GO`. Fase limitada a corrección estática de `tools/packager/build-packages.mjs`, su suite, README y este roadmap. No se ejecutaron Node, pruebas, `--check`, builds, fuentes, red, `clasp` ni commits; no se modificaron `src` ni `package-map.json`.

Baseline verificado: rama `main`; commit `752e1c14ea3d9cadff102aa52780616d0e58336a`; detector 30.056 bytes, `74d36176f37f8ef187d5ad8f534094028957862e7350971a0d18c6b9d5e51f61`; suite 24.052 bytes, `b1398a876c7942173e855fe7c1d65ace2e3da07df4e31e77bb961282f6e002f7`; README 10.950 bytes, `a86e3cebb393130308552f5dbc0a191466340a58cb4baa34649118501895500d`; matriz 32.504 bytes, `b06a0d3ebca394aa451995ff5c48d4e416bb54e36abd72ef588c3c7766759a5b`; roadmap 283.195 bytes, `e47554cce4a8c8e2441a91033e5fcf38f5e95bfc9e9b8d089386bca4b473750f`; manual 11.491 bytes, `a18332565c408e9f283df26201c1a6745d1699ce9fd557d709d980225321c1fc`.

El log preservado de P0-RETEST03 existe en `C:\Users\pc\AppData\Local\Temp\P0-RETEST03-20260805-070009-532ab11722ae4ddc9be39a1da41a7a05\P0-RETEST03-20260805-070009.log`: 4.762 bytes, SHA-256 `1dbe8dac12dfa7c49f79f2eb870e5607e610ee38d705b0dd62f16bf879e22fa4`. Registró 73 casos descubiertos, 72 correctos y un fallo: caso 20 esperaba `NO_SE_PUEDE_LEER` y obtuvo `CONSTRUCCION_INCOMPLETA`.

### Trazado anterior y causa raíz

| Orden anterior | Función | Acción | Archivo | Error posible | Traducción |
|---:|---|---|---|---|---|
| 1 | `buildPackages` | valida destino | salida | destino inseguro | error contractual |
| 2 | `validateContamination` | abre directamente cada JS de A/C | `missing.js` | `ENOENT` nativo | todavía no contractual |
| 3 | detector | genera `embeddedTestEvidence` | contenido leído directamente | análisis léxico | no alcanzado en caso 20 |
| 4 | `mkdtempSync` | crea temporal | temporal hermano | error de escritura | no alcanzado |
| 5 | `catch` | ejecuta cleanup | `tempDir=null` | operación vacía | ninguno |
| 6 | `catch` | envuelve error no contractual | error `ENOENT` | pérdida de precedencia | `CONSTRUCCION_INCOMPLETA` |

Causa raíz verificada: `validateContamination` recibía raíz y matriz y ejecutaba su propia lectura antes de `packageEntries`, que era la ruta que aplicaba `assertRegularNoSymlink` y traducía la ausencia a `NO_SE_PUEDE_LEER`. El `catch` de `buildPackages` convertía el `ENOENT` prematuro en `CONSTRUCCION_INCOMPLETA`. Además, una excepción de cleanup podía sustituir el error principal.

### Orden corregido y cambios

El flujo queda: argumentos; matriz/rutas; ruta segura; rechazo de symlink; existencia/lectura; tamaño y SHA-256; comparación; registro validado en memoria; detector sobre ese contenido; evidencia estructurada; paquete; y solo entonces temporal, copia desde el buffer validado, verificación y publicación.

`validateUniverse` construye registros ordenados con `path`, `absolutePath`, metadatos de matriz, `size`, `sha256`, `buffer` y `content` solo para JavaScript. Existe una única llamada de lectura de cada fuente dentro de esa validación. `validateContamination` acepta los registros; el flujo de check/build le entrega contenido validado y no rutas. Hash, detector, copia y `embeddedTestEvidence` usan el mismo buffer. Buffer/contenido no se serializan en manifiestos, reportes ni logs.

`buildPackages` valida antes de crear el temporal. Ausencia/ilegibilidad conserva `NO_SE_PUEDE_LEER`; hash distinto conserva `HASH_DIVERGENTE`; contaminación posterior se identifica como `CONTAMINACION`; errores propios de construcción quedan como `CONSTRUCCION_INCOMPLETA`. `preservePrimaryError` protege el error inicial y adjunta un eventual fallo de cleanup como `details.cleanupError`. `safeCleanupTemp` continúa restringido al temporal hermano con prefijo propio. No se tocaron las reglas de regex/división, consolidación, runners o detección.

### Pruebas redactadas, no ejecutadas

Se conservan los casos 1–73 y se añaden 74–89: ausencia; lectura única/registro coherente; evidencia sin relectura; hash y detector sobre el mismo contenido; cleanup vacío antes del temporal; eliminación exclusiva del temporal propio; conservación del error ante fallo de cleanup; evidencia secundaria; precedencia de hash; rechazo de symlink previo a lectura; contaminación posterior a hash correcto; caso 20 sin renombrar y con `NO_SE_PUEDE_LEER`; 71 evidencias; dos WARN consolidados; determinismo del error; y ausencia de temporal en check. Total esperado: **89**. No se ejecutó ningún caso.

### Hashes, integridad, riesgos y reversión

| Archivo | SHA-256 anterior | Bytes posteriores | SHA-256 posterior estático |
|---|---|---:|---|
| `build-packages.mjs` | `74d36176f37f8ef187d5ad8f534094028957862e7350971a0d18c6b9d5e51f61` | 31.863 | `70bbe6f270e9dbe33b73c048074a533ff75e97acec3724c0e91928c52b7576a3` |
| `build-packages.test.mjs` | `b1398a876c7942173e855fe7c1d65ace2e3da07df4e31e77bb961282f6e002f7` | 31.366 | `a39daaad9adb35afdd9d4b157a8d747323395274d10f7690385e5dc733a34507` |
| `README.md` | `a86e3cebb393130308552f5dbc0a191466340a58cb4baa34649118501895500d` | 12.654 | `85dc5a6812361d68ee9f05d4faa11af881831bfd2fb9971632bf82e1bb10bd85` |
| `package-map.json` | `b06a0d3ebca394aa451995ff5c48d4e416bb54e36abd72ef588c3c7766759a5b` | 32.504 | sin cambios |

Integridad estática posterior: 110 archivos `src`, 0 divergencias respecto de la matriz; matriz y manual intactos; log previo conservado. El estado Git preexistente de `src/IntegrityService.js`, `src/Tests_IntegridadGapReglasFuncional.js` y el manual no fue provocado por P0-FIX05.

Riesgos y límites: interfaz y pruebas aún no han sido interpretadas por Node; no se ha demostrado el recuento de 71 evidencias ni los dos WARN mediante ejecución; el buffer aumenta memoria proporcionalmente al universo; las comprobaciones multiplataforma, permisos, symlinks y fallos reales de cleanup quedan pendientes. Reversión autorizable: retirar exclusivamente los cambios P0-FIX05 de los tres archivos de tooling y esta sección, sin `reset`, checkout destructivo ni cambios en fuentes.

Resultado: **CORREGIDO ESTÁTICAMENTE — NO EJECUTADO — NO PROBADO — NO_GO vigente**.

Gate siguiente solicitado: **P0-RETEST04 — Sintaxis, suite ampliada, `--check`, argumentos y seguridad, sin construir paquetes**. P0-BUILD01 continúa bloqueado.

## P0-RETEST04 — Retest integral previo a construcción

### Baseline, autorización y criterios de parada

Gate P0-FIX05 aprobado estáticamente. Se autoriza Node local, una ejecución de la suite, exclusivamente `--check`, argumentos y destinos inválidos, un temporal/log exclusivo y documentación. Continúan prohibidos cualquier build válido, paquetes, cambios de código o `src`, red/Drive/API/OAuth/`clasp`, exportación, despliegue, commit y P0-BUILD01.

Baseline: rama `main`; commit `752e1c14ea3d9cadff102aa52780616d0e58336a`; roadmap inicial 289.594 bytes y SHA-256 `2c53b69c55b36bdc63677dd36d6dde682d5cff552e37ef4de2f0d4d8dd42fb50`. Detector `70bbe6f270e9dbe33b73c048074a533ff75e97acec3724c0e91928c52b7576a3`; suite `a39daaad9adb35afdd9d4b157a8d747323395274d10f7690385e5dc733a34507`; README `85dc5a6812361d68ee9f05d4faa11af881831bfd2fb9971632bf82e1bb10bd85`; matriz `b06a0d3ebca394aa451995ff5c48d4e416bb54e36abd72ef588c3c7766759a5b`; manual `a18332565c408e9f283df26201c1a6745d1699ce9fd557d709d980225321c1fc`.

Verificado: 134 entradas y rutas únicas; categorías 63/7/35/24/5; paquetes A=68, B=7, C=35, NONE=24; 21 HTML en A; `src/appsscript.json` en A; 110 fuentes y cero divergencias; una declaración de `probarReporteIntegridad`; `src/Código.js` en C/auxiliary. Estado Git previo esperado, con cambios anteriores en roadmap, `IntegrityService.js`, `Tests_IntegridadGapReglasFuncional.js`, manual y tooling.

Temporal exclusivo: `C:\Users\pc\AppData\Local\Temp\P0-RETEST04-20260805-071848-a997c8e6ca6c4e06bd359e7369640e98`. Log: `P0-RETEST04-20260805-071848.log`.

Orden autorizado: sintaxis 2/2; suite una vez; `--check --all`; integridad; argumentos/destinos; seguridad. Ante cualquier fallo se detendrá sin reintento, sin edición de código y sin continuar a pruebas posteriores; se preservarán temporal y log.

| Retest | Esperado | Obtenido | Código | Escrituras | Estado |
| ------ | -------- | -------- | -----: | ---------- | ------ |
| RETEST-01 Sintaxis | 2/2 OK | 2/2 OK | 0, 0 | ninguna en proyecto | OK |
| RETEST-02 Suite | 89/89, 0 fallos | 89/89, 0 fallos, 0 omitidas | 0 | fixtures solo en temporales propios de la suite | OK |
| RETEST-03 `--check --all` | WARN 5/2/1, evidencia 71, ERR 0 | MIXED=5, EMBEDDED=2, RUNNER=1, Ids=6, Repository=65, total=71, ambigüedad=0, ERR=0 | 0 | ninguna en proyecto | OK |
| RETEST-04 Integridad | cero cambios/paquetes | hashes fijos y 110 fuentes intactos; 0 temporales de build; 0 paquetes | 0 | solo roadmap y log autorizados | OK |
| RETEST-05 Argumentos/destinos | rechazos contractuales | 12/12 combinaciones con códigos esperados; symlink condicional no disponible por privilegios | 0/2/4 esperados | fixtures controlados solo en temporal | OK con WARN |
| RETEST-06 Seguridad | sin efectos externos ni paquetes | sin red, navegador, Drive, API, OAuth, `clasp`, procesos hijo, ejecución de fuentes o paquetes | 0 | ninguna fuera del temporal/roadmap | OK |

### Resultados y evidencia

RETEST-01 comprobó sintaxis de los dos módulos: 2/2 OK, ambos código 0. RETEST-02 ejecutó la suite una única vez: 89 descubiertas, 89 aprobadas, 0 fallidas, 0 omitidas, código 0. El caso 20 conservó nombre y expectativa `NO_SE_PUEDE_LEER`; los casos 74–89 verificaron lectura única, evidencia en memoria, mismo contenido para hash/detector, precedencia de hash, symlink previo a lectura mediante inspección contractual, cleanup vacío/propio, error original, detalle secundario, 71 evidencias, dos WARN y determinismo. Los casos heredados de regex/división también aprobaron.

RETEST-03 ejecutó una sola vez `--check --all` contra la raíz autorizada. Resultado: código 0; `ENGREMIAT_PACKAGE_BEGIN`, `OK`, `WARN`, `NEXT` y `ENGREMIAT_PACKAGE_END`; ningún `ERR`. Recuentos públicos: cinco `MIXED_ARCHITECTURE`, dos `EMBEDDED_TEST_CODE`, un `APPROVED_SUITE_RUNNER`, cero `AMBIGUOUS_*` y cero `UNTERMINATED_*`. Evidencia: `Ids.js` 6, `Repository.js` 65, total 71, con líneas/tipos consolidados, únicos y ordenados. Se conservó aparte el WARN documentado `BASELINE_AUTORREFERENCIAL_NO_COMPARABLE` del roadmap. Universo: 134/134; categorías y paquetes conformes; 21 HTML en A; manifiesto Apps Script en A; cero desconocidos, ausentes o hashes divergentes; cero pruebas/runners indebidos en A.

RETEST-04 y la verificación final no localizaron cambios en detector, suite, README, matriz, manual ni 110 fuentes respecto del baseline; no aparecieron temporales de build ni paquetes. Las únicas escrituras fueron esta documentación y el log/fixtures dentro del temporal exclusivo.

RETEST-05: sin argumentos mostró ayuda con código 0. Opción desconocida, build sin salida, build sin selección, `--package` con `--all`, paquete inválido y output sin build devolvieron código 2. Proyecto, `src`, tooling, raíz de unidad y destino preexistente/no vacío devolvieron código 4. Ninguna combinación alcanzó un build válido. La creación del symlink controlado fue omitida con `WARN: SYMLINK_DYNAMIC_NOT_VERIFIED` porque Windows exigió privilegios administrativos; no se elevó permiso.

RETEST-06: ninguna operación de red, navegador, Drive, API, OAuth, `clasp`, proceso hijo, fuente Apps Script, borrado externo, exportación o despliegue. Cero paquetes construidos.

### Limitaciones, resultado y gate

Limitación residual: el rechazo de un symlink real no se ejercitó dinámicamente por falta de privilegios; sí aprobaron el caso 83 y la precedencia estática de `assertRegularNoSymlink`. El roadmap es autorreferencial y mantiene su advertencia de baseline. No se probó ninguna construcción válida, publicación, reproducibilidad de paquetes ni despliegue.

Resultado: **VERIFICADO LOCALMENTE — 89/89 OK — `--check` OK — CONTRATO DE WARN OK — ARGUMENTOS Y DESTINOS OK — NO CONSTRUIDO — NO EXPORTADO — NO DESPLEGADO — NO_GO vigente hasta P0-BUILD01**.

Gate siguiente solicitado, sin ejecutarlo: **P0-BUILD01 — Construcción repetida de A, B y C en temporales, inspección de manifiestos, comparación reproducible y destrucción controlada, sin red ni publicación**.

## P0-BUILD01 — Construcción reproducible en temporales

### Autorización, baseline y preparación

Gate P0-RETEST04 aprobado. Se autorizan dos construcciones locales `--build --all` en destinos temporales independientes, inspección/comparación, log, documentación y eliminación exclusiva de paquetes propios. Continúan prohibidos red, Drive/API/OAuth/`clasp`, publicación, exportación externa, despliegue, cambios en empaquetador o `src`, elevación, symlinks y commit. Se conserva `WARN: SYMLINK_DYNAMIC_NOT_VERIFIED`.

Baseline: rama `main`; commit `752e1c14ea3d9cadff102aa52780616d0e58336a`; roadmap inicial 295.655 bytes, SHA-256 `816a3e0d4f0169ad75fd3ccc2c561ba521319c277f429753445ff089a9d9d470`; detector `70bbe6f270e9dbe33b73c048074a533ff75e97acec3724c0e91928c52b7576a3`; suite `a39daaad9adb35afdd9d4b157a8d747323395274d10f7690385e5dc733a34507`; README `85dc5a6812361d68ee9f05d4faa11af881831bfd2fb9971632bf82e1bb10bd85`; matriz `b06a0d3ebca394aa451995ff5c48d4e416bb54e36abd72ef588c3c7766759a5b`; manual `a18332565c408e9f283df26201c1a6745d1699ce9fd557d709d980225321c1fc`; log P0-RETEST04 `47d834630eacdc76f6de5787ff1116531252dd875c573e0b4156e96fd450a89c`. Verificados 110 archivos `src`, cero divergencias, 134 rutas únicas y recuentos A=68, B=7, C=35, NONE=24.

El check previo único devolvió código 0, `MIXED_ARCHITECTURE=5`, `EMBEDDED_TEST_CODE=2`, `APPROVED_SUITE_RUNNER=1`, `ERR=0`. Las 89/89 pruebas permanecen documentadas por P0-RETEST04 y no se repiten.

Raíz temporal exclusiva: `C:\Users\pc\AppData\Local\Temp\P0-BUILD01-20260805-072914-d7fc1919b62c4b28b8ee08b3d3206f50`. Destinos inicialmente inexistentes: `run-01` y `run-02`, hijos directos de esa raíz, fuera del proyecto y de cualquier raíz de unidad/zona prohibida. Comandos previstos: `node tools/packager/build-packages.mjs --build --all --output <raíz>\run-01` y posteriormente el equivalente para `run-02`.

Política: detener ante cualquier código no cero, `ERR`, divergencia contractual, escritura externa o diferencia canónica; no ejecutar BUILD-02 si RUN-01 falla. Limpiar solo los dos hijos absolutos comprobados, nunca proyecto, `src`, tooling o rutas dudosas; conservar el log. Publicación y despliegue mantienen `NO_GO`.

| Fase | Acción | Resultado | Código | Evidencia | Estado |
| ---- | ------ | --------- | -----: | --------- | ------ |
| Gate 0 | Baseline y `--check --all` | hashes/universo conformes; WARN 5/2/1; ERR 0 | 0 | log temporal | OK |
| BUILD-01 | Construir A/B/C en `run-01` | A=68, B=7, C=35; cero ERR | 0 | salida completa y paquetes preservados | OK |
| Inspección RUN-01 | Contenido, manifiestos e informes | copias/hashes/recuentos conformes; orden A no coincide con orden ordinal comprobado | 1 (inspección) | inversiones exactas en manifiesto A | NO_GO |

### Resultado parcial de RUN-01 y criterio de parada

La primera construcción se ejecutó una sola vez entre `2026-08-05T07:30:03.8132284+02:00` y `2026-08-05T07:30:06.7159314+02:00`. El empaquetador devolvió código 0, sin `ERR`, y creó únicamente A, B, C y `packager.log` dentro de `run-01`.

Inventario verificado antes de la parada:

| Paquete | Fuentes | Hash agregado | Estado | Copias divergentes | Evidencia |
|---|---:|---|---|---:|---:|
| A | 68 | `538d7da4cb4b476e34303edbb76183cdf76283b51bc737d5824ffcca1c730005` | `PRODUCTION_WITH_DECLARED_MIXED_DEBT` | 0 | 71 |
| B | 7 | `5230de196415b9f86390a15846e24403130b5e70aa1ee646a78bee05997b5049` | `TESTS_DEPEND_ON_VERSIONED_PACKAGE_A` | 0 | 71 |
| C | 35 | `67e33d61348f865fbcd583bb552d214ac84fa24b53850d58cd5e7e0e83e711f7` | `AUXILIARY_EXECUTION_REQUIRES_HUMAN_AUTHORIZATION` | 0 | 71 |

A contiene 21 HTML, `src/appsscript.json`, cero `Tests_*`, cero `Código.js`, cero declaración `probarReporteIntegridad` en `IntegrityService.js` y deuda mixta declarada de cinco archivos. No se describe como producción limpia. B contiene siete `Tests_*`, ambos repositorios independientes y una declaración de `probarReporteIntegridad`; su dependencia referencia exactamente el hash agregado de A. C contiene 35 auxiliares y `Código.js`. Los tres informes son JSON legible, `ok=true`, conservan 71 evidencias (Ids=6, Repository=65); los manifiestos declaran esquema 1, paquete, commit, rama, categorías, hashes, cinco deudas mixtas y 24 exclusiones. No se localizaron copias desconocidas, divergencias byte a byte, barras invertidas en rutas, credenciales ni contenido fuente en metadatos.

La inspección exigía lista ordenada. El manifiesto A no coincide con el orden ordinal de ruta: `src/appsscript.json` precede a `src/AvanceYSecuencia.js`, y `src/Repository_InsertarRegistro.js` precede a `src/Repository.js`. El orden observado es compatible con el uso actual de `localeCompare`, pero no se puede reformular como orden canónico ordinal ni asumir independiente de configuración regional. La comprobación clasificó la inspección con código 1.

Se aplica el criterio de parada: **NO_GO**. BUILD-02 no se ejecutó; no existe comparación 2/2; no se limpió `run-01`; `run-02` permanece inexistente. El temporal y el log quedan preservados para revisión. No se modificó código ni `src`, y no se publicó, exportó o desplegó nada. Se conserva `WARN: SYMLINK_DYNAMIC_NOT_VERIFIED`.

Siguiente decisión humana propuesta: autorizar una corrección estática separada que defina orden canónico independiente de locale, o aceptar explícitamente `localeCompare` como contrato y autorizar una nueva inspección desde cero. P0-CLOSE01 no se inicia y permanece `NO_GO para publicación, clasp push y despliegue`.

## P0-FIX06 — Orden canónico UTF-8 independiente del locale

### Decisión, baseline y evidencia preservada

Decisión humana: `localeCompare` no se acepta como contrato. El identificador obligatorio es `UTF8_NFC_BYTEWISE_V1`. Fase limitada a cambios estáticos en empaquetador, suite, README y roadmap; sin Node, pruebas, `--check`, builds, red, `clasp`, commit ni cambios en fuentes/matriz.

Baseline: rama `main`; commit `752e1c14ea3d9cadff102aa52780616d0e58336a`; detector 31.863 bytes, `70bbe6f270e9dbe33b73c048074a533ff75e97acec3724c0e91928c52b7576a3`; suite 31.366 bytes, `a39daaad9adb35afdd9d4b157a8d747323395274d10f7690385e5dc733a34507`; README 12.654 bytes, `85dc5a6812361d68ee9f05d4faa11af881831bfd2fb9971632bf82e1bb10bd85`; matriz `b06a0d3ebca394aa451995ff5c48d4e416bb54e36abd72ef588c3c7766759a5b`; roadmap 301.227 bytes, `9562349262227d8398499e0ca07fd0d7a576cbf57fd05fdbc9ad2b1e85e2f1b8`; manual `a18332565c408e9f283df26201c1a6745d1699ce9fd557d709d980225321c1fc`; 110 fuentes, cero divergencias.

RUN-01 anterior permanece en `C:\Users\pc\AppData\Local\Temp\P0-BUILD01-20260805-072914-d7fc1919b62c4b28b8ee08b3d3206f50\run-01`: 117 archivos y nueve directorios. Log: 5.757 bytes, `3bcec3d4151e311656b515b824f7d1c5c1ec8bcfa69d6c497b7c7d9f85b0ca88`. Manifiestos: A `aa6d78eae6a1407639540ed59b3c9e29923987c48bf2449e80c0eb4613dd6d50`; B `08a064e4e1aeb970110fcf6f9d890522a540a8ae19e9b2af6616b3d1fa38a22e`; C `1c7f16207489eb1550ce37749da909046417a66944f6294f619ae6a6c7bf1a12`. Sus hashes agregados antiguos A/B/C (`538d…`, `5230…`, `67e3…`) son evidencia del algoritmo anterior y no baseline del nuevo. RUN-01 es evidencia lógica de solo lectura, no se modifica ni reutiliza.

### Inventario de ordenamientos

| Ubicación/colección | Orden anterior | Hash | Salida | Cambio |
|---|---|---:|---:|---|
| listas de tests/mixtos en matriz | `.sort()` implícito | no | validación | comparador canónico |
| enumeración `readdirSync` y árbol | `localeCompare`/`.sort()` | indirecto | sí | comparador canónico |
| matriz y archivos validados | `localeCompare(path)` | sí | sí | comparador canónico |
| marcadores y nombres técnicos | línea + `localeCompare` | no | evidencia | línea numérica + bytewise |
| entradas A/C del detector | `localeCompare(path)` | no | warnings/evidencia | comparador canónico |
| tipos consolidados | `.sort()` implícito | no | warning | bytewise; líneas siguen numéricas |
| evidencia estructurada | ruta + línea + nombre con locale | no | informe | ruta/nombre bytewise, línea numérica |
| concatenación del hash | `localeCompare(path)` | sí | manifiesto | NFC y bytes UTF-8 |
| selección A/B/C | `localeCompare(path)` | sí | paquetes | comparador canónico |
| deuda mixta/exclusiones/entradas | matriz o `.sort()` implícito | no/sí | manifiesto | rutas NFC bytewise |
| claves de JSON estable | `.sort()` implícito | no | ficheros técnicos | comparador bytewise |
| paquetes solicitados | orden de entrada | no | build/log | comparador canónico |

Sets y Maps de validación conservan función de pertenencia/recuento; cuando su contenido se publica se materializa y ordena explícitamente. Dependencias contienen una única referencia A y no presentan ambigüedad de orden. No queda `localeCompare` en el empaquetador.

### Algoritmo, colisiones y aplicación

`canonicalPath` valida ruta relativa, convierte separadores a `/` y normaliza Unicode NFC. `compareCanonicalPaths` codifica ambas rutas en UTF-8 y usa `Buffer.compare`, sin locale, case folding o dependencia del filesystem. Los ejemplos quedan: `AvanceYSecuencia.js` antes de `appsscript.json`; `Repository.js` antes de `Repository_InsertarRegistro.js`; mayúsculas antes de minúsculas según bytes; `Código.js` se conserva NFC.

`validateCanonicalPathSet` diferencia: duplicado original exacto → `DUPLICATE_CANONICAL_PATH`; originales distintos con la misma NFC → `CANONICAL_PATH_COLLISION`; diferencia solo por casing → `CASE_INSENSITIVE_PATH_COLLISION`. La última se emite como WARN y añade bloqueo `CANONICAL_PATH_REVIEW_REQUIRED`; ninguna ruta se renombra o pliega automáticamente.

Matriz, escaneo, archivos validados, paquetes, manifiestos, deudas, exclusiones, warnings, evidencia, JSON técnico y hash agregado utilizan el comparador común. Las líneas mantienen orden numérico. El hash normaliza y ordena antes de concatenar `path + LF + sha256 + LF + size + LF`. El manifiesto añade `canonicalSort` con ID, NFC, UTF-8, comparación unsigned bytewise y `localeDependent:false`. Metadatos temporales/fecha/ejecución continúan fuera del hash.

### Pruebas redactadas, no ejecutadas

Se conservan 89 casos y se añaden 24 (90–113): los dos pares de RUN-01; casing; `Código.js`; compuesto/descompuesto; colisiones NFC, exacta y case-insensitive; independencia de locales español/inglés, entrada y `readdir`; manifiestos A/B/C; informe y evidencia; estabilidad/cambios del hash; metadatos no canónicos; declaración del algoritmo; ausencia de `localeCompare`; y uso de `Buffer.compare`. Total previsto: **113**. No se ejecutaron.

### Hashes, integridad, reversión y gate

| Archivo | SHA-256 anterior | Bytes posteriores | SHA-256 posterior estático |
|---|---|---:|---|
| `build-packages.mjs` | `70bbe6f270e9dbe33b73c048074a533ff75e97acec3724c0e91928c52b7576a3` | 34.819 | `41e0bfeeb0ebe73ed416da46b4712188da5dc68da4b71291af1e9974c9cd8225` |
| `build-packages.test.mjs` | `a39daaad9adb35afdd9d4b157a8d747323395274d10f7690385e5dc733a34507` | 37.367 | `8ca58185c8c27c163d08c449a2b6c7324cae119be7a26e6eee1e8058f5d56150` |
| `README.md` | `85dc5a6812361d68ee9f05d4faa11af881831bfd2fb9971632bf82e1bb10bd85` | 14.526 | `836aac676da3368e9ef9ef7cf86e8de07be785159f311b0c63dbda2bc7f3cfd8` |
| `package-map.json` | `b06a0d3ebca394aa451995ff5c48d4e416bb54e36abd72ef588c3c7766759a5b` | 32.504 | sin cambios |

Integridad estática: matriz, manual y 110 fuentes intactos; RUN-01 preservado; sin dependencias, red o procesos hijo nuevos; `git diff --check` correcto. Riesgo residual: sintaxis, 113 casos, colisiones y hashes nuevos no están ejecutados. Los hashes viejos son deliberadamente incompatibles.

Reversión autorizable: retirar exclusivamente los cambios P0-FIX06 de los tres archivos de tooling y esta sección, sin tocar RUN-01, fuentes o matriz.

Resultado: **ORDEN CORREGIDO ESTÁTICAMENTE — RUN-01 ANTERIOR PRESERVADO — NO EJECUTADO — NO PROBADO — NO_GO vigente**.

Gate solicitado: **P0-RETEST05 — Sintaxis, suite ampliada y `--check` con verificación explícita del orden canónico, sin construir paquetes**. No se autoriza todavía una nueva construcción.

## P0-RETEST05 — Verificación del orden canónico

### Baseline, temporal y criterios de parada

Gate P0-FIX06 aprobado estáticamente. Autorizados Node local, dos comprobaciones de sintaxis, una ejecución de 113 pruebas, exclusivamente `--check`, cálculo interno de orden/hashes sin build, fixtures/log temporal y roadmap. Prohibidos `--build`, paquetes, cambios de código o `src`, modificación/eliminación de RUN-01, red/Drive/API/OAuth/`clasp` y commit.

Baseline: rama `main`; commit `752e1c14ea3d9cadff102aa52780616d0e58336a`; roadmap inicial 307.868 bytes, `6ec3f7a0c733817c0bfeeeb17fe68923615d46f77d7bd8506adb46d267c541b6`; detector `41e0bfeeb0ebe73ed416da46b4712188da5dc68da4b71291af1e9974c9cd8225`; suite `8ca58185c8c27c163d08c449a2b6c7324cae119be7a26e6eee1e8058f5d56150`; README `836aac676da3368e9ef9ef7cf86e8de07be785159f311b0c63dbda2bc7f3cfd8`; matriz `b06a0d3ebca394aa451995ff5c48d4e416bb54e36abd72ef588c3c7766759a5b`; manual `a18332565c408e9f283df26201c1a6745d1699ce9fd557d709d980225321c1fc`. Universo 134/134; 110 fuentes, cero divergencias. Empaquetador: cero `localeCompare`, contrato `UTF8_NFC_BYTEWISE_V1`, NFC y `Buffer.compare` presentes.

RUN-01 anterior: 117 archivos y cero divergencias en log/manifiestos; no se reutiliza. Temporal nuevo: `C:\Users\pc\AppData\Local\Temp\P0-RETEST05-20260805-074350-ce275dd474994ee19f3b7962d74ee950`; log `P0-RETEST05-20260805-074350.log`.

Orden: sintaxis; suite una vez; `--check --all`; cálculo en memoria de manifiestos/orden/hashes; integridad y seguridad. Ante cualquier fallo: parada sin reintento, edición ni construcción; conservación del temporal/log; P0-BUILD02 bloqueado.

| Retest | Esperado | Obtenido | Código | Escrituras | Estado |
| ------ | -------- | -------- | -----: | ---------- | ------ |
| RETEST-02 Suite | 113/113 OK | 110 OK, 3 fallos, 0 omitidas | 1 | fixtures solo en temporales propios | NO_GO |

### Fallo y parada

La suite se ejecutó exactamente una vez. Descubrió 113 casos; 110 aprobaron y fallaron 93, 94 y 95; código final 1. No se reintentó.

| Caso | Esperado | Obtenido | Diagnóstico estático posterior |
|---:|---|---|---|
| 93 | descompuesto `Co` + U+0301 → compuesto `Código.js` | esperado literal `CÃ³digo.js`; actual `Código.js` | el algoritmo NFC produjo el valor correcto, pero el literal compuesto del fixture está mojibake |
| 94 | compuesto y descompuesto equivalentes | lados `Código.js` y `CÃ³digo.js` | misma inconsistencia de codificación del fixture |
| 95 | `CANONICAL_PATH_COLLISION` | ninguna colisión | las dos entradas del fixture no normalizan a la misma cadena porque una contiene mojibake |

Los casos 90–92 y 96–113 aprobaron, incluidos los dos pares de orden de RUN-01, casing, colisión exacta, colisión case-insensitive, independencia de entrada/readdir, manifiestos A/B/C, evidencia, hash agregado, metadatos, declaración `UTF8_NFC_BYTEWISE_V1`, ausencia de `localeCompare` y `Buffer.compare`. No se reformula el resultado como verificación completa.

Se aplica el criterio de parada: RETEST-03 `--check --all`, orden calculado, hashes agregados y fases 04–07 no se ejecutaron. No se modificó código, no se construyeron paquetes y RUN-01 permanece preservado. El temporal/log P0-RETEST05 se conserva. `WARN: SYMLINK_DYNAMIC_NOT_VERIFIED` continúa vigente.

Resultado: **NO_GO — 110/113 OK — FIXTURES UNICODE 93–95 INCONSISTENTES — NO CONSTRUIDO — NO EXPORTADO — NO DESPLEGADO**.

Siguiente decisión humana propuesta: autorizar **P0-FIX07 — corrección estática limitada de los tres fixtures Unicode y su documentación, sin modificar el algoritmo**; P0-BUILD02 no se autoriza.

## P0-FIX07 — Corrección de fixtures Unicode

### Baseline y evidencia

Gate P0-RETEST05 confirmado `NO_GO`. Autorización limitada a suite, README solo si contenía mojibake, y roadmap. No se ejecutaron Node, pruebas, `--check` o builds; no se modificaron algoritmo, empaquetador, matriz, fuentes, RUN-01 ni README.

Baseline: rama `main`; commit `752e1c14ea3d9cadff102aa52780616d0e58336a`; detector `41e0bfeeb0ebe73ed416da46b4712188da5dc68da4b71291af1e9974c9cd8225`; suite 37.367 bytes, `8ca58185c8c27c163d08c449a2b6c7324cae119be7a26e6eee1e8058f5d56150`; README `836aac676da3368e9ef9ef7cf86e8de07be785159f311b0c63dbda2bc7f3cfd8`; matriz `b06a0d3ebca394aa451995ff5c48d4e416bb54e36abd72ef588c3c7766759a5b`; manual `a18332565c408e9f283df26201c1a6745d1699ce9fd557d709d980225321c1fc`; roadmap 311.594 bytes, `b78c1ef1933694d8110124d3297fdd61baf2ffbafb2b5c26d4fe7a207e1a5aa7`; 110 fuentes, cero divergencias. RUN-01 conserva 117 archivos y cero divergencias. Log P0-RETEST05: 7.194 bytes, `1798cf0e7fa2934648cdcc1b3145f731aec92a6ecf14e9970e0403253ce48dbe`.

### Code points anteriores y causa

| Caso | Literal actual anterior | Code points sensibles | Valor semántico previsto | Estado |
|---:|---|---|---|---|
| 93 | `src/CÃ³digo.js` | `C U+0043`, `Ã U+00C3`, `³ U+00B3` | `src/Código.js`, con `ó U+00F3` | mojibake verificado |
| 94 | compuesto `src/CÃ³digo.js`; descompuesto `src/Co\u0301digo.js` | compuesto `U+00C3 U+00B3`; descompuesto `U+006F U+0301` | dos representaciones del mismo valor | fixture inconsistente |
| 95 | mismas dos rutas | no convergían tras NFC | dos originales distintos con NFC igual | colisión no activada |

Secuencia completa prevista para caso 93: `U+0073 U+0072 U+0063 U+002F U+0043 U+00F3 U+0064 U+0069 U+0067 U+006F U+002E U+006A U+0073`. La causa fue doble recodificación UTF-8/representación, no el algoritmo: el resultado real ya produjo `Código.js` correctamente.

### Corrección aplicada

Caso 93 usa exclusivamente `"src/C\u00F3digo.js"` y `"src/Co\u0301digo.js"`; verifica igualdad, NFC, posición bytewise antes de `src/D.js` y la lista completa de code points. Caso 94 usa compuesto `"src/Caf\u00E9.js"` y descompuesto `"src/Cafe\u0301.js"`; demuestra originales distintos, code points previos (`U+00E9` frente a `U+0065 U+0301`) e igualdad posterior a NFC. Caso 95 reutiliza esas dos entradas distintas, verifica NFC igual y espera `CANONICAL_PATH_COLLISION` sin warnings ni escrituras.

El control anti-mojibake se limita al conjunto de fixtures Unicode de la suite y rechaza `\u00C3`, `\u00C2` y `\uFFFD`. El fixture técnico residual del caso 101 también usa `"C\u00F3digo.js"`. No queda la secuencia literal `CÃ³digo` en la suite. El README no contenía `Ã`, `Â` o `�`, por lo que no se modificó.

### Hashes, integridad y gate

| Archivo | SHA-256 anterior | Bytes posteriores | SHA-256 posterior estático |
|---|---|---:|---|
| `build-packages.test.mjs` | `8ca58185c8c27c163d08c449a2b6c7324cae119be7a26e6eee1e8058f5d56150` | 38.670 | `d2abf98f4be6224e007401d40c4ef73e08e27030c3fa12a488f418f62b8cb1ab` |
| `build-packages.mjs` | `41e0bfeeb0ebe73ed416da46b4712188da5dc68da4b71291af1e9974c9cd8225` | 34.819 | sin cambios |
| `README.md` | `836aac676da3368e9ef9ef7cf86e8de07be785159f311b0c63dbda2bc7f3cfd8` | 14.526 | sin cambios |
| `package-map.json` | `b06a0d3ebca394aa451995ff5c48d4e416bb54e36abd72ef588c3c7766759a5b` | 32.504 | sin cambios |

Verificación estática: escapes exactos presentes; cero `CÃ³digo` en suite; compuesto/descompuesto y expectativa de colisión presentes; total 113 casos; `git diff --check` correcto. Empaquetador, matriz, README, manual, 110 fuentes y RUN-01 intactos. Reversión: retirar únicamente los cambios P0-FIX07 de los fixtures y esta sección.

Resultado: **FIXTURES UNICODE CORREGIDOS ESTÁTICAMENTE — ALGORITMO INTACTO — NO EJECUTADO — NO PROBADO — NO_GO vigente**.

Gate solicitado: **P0-RETEST06 — Sintaxis, 113 pruebas y `--check` con orden canónico, sin construir paquetes**. P0-BUILD02 permanece bloqueado.

## P0-RETEST06 — Retest del orden canónico y Unicode

### Baseline, temporal y parada

Gate P0-FIX07 aprobado estáticamente. Autorizados Node local, sintaxis, una ejecución de 113 pruebas, exclusivamente `--check`, cálculo en memoria sin build, temporal/log y roadmap. Prohibidos cambios de código/`src`, `--build`, paquetes, modificación de RUN-01, red/Drive/API/OAuth/`clasp` y commit.

Baseline: rama `main`; commit `752e1c14ea3d9cadff102aa52780616d0e58336a`; roadmap inicial 315.637 bytes, `3a76f7d05b8e361682a7d58766b08a33b20e62edd150d508f3e6ceab3733b793`; detector `41e0bfeeb0ebe73ed416da46b4712188da5dc68da4b71291af1e9974c9cd8225`; suite `d2abf98f4be6224e007401d40c4ef73e08e27030c3fa12a488f418f62b8cb1ab`; README `836aac676da3368e9ef9ef7cf86e8de07be785159f311b0c63dbda2bc7f3cfd8`; matriz `b06a0d3ebca394aa451995ff5c48d4e416bb54e36abd72ef588c3c7766759a5b`; manual `a18332565c408e9f283df26201c1a6745d1699ce9fd557d709d980225321c1fc`. Universo 134/134; 110 fuentes, cero divergencias; 113 casos; cero `CÃ³digo`; escapes `\u00F3`, `\u00E9`, `\u0301` presentes. RUN-01: 117 archivos, manifiestos intactos.

Temporal exclusivo: `C:\Users\pc\AppData\Local\Temp\P0-RETEST06-20260805-075517-263bbf8cdbe64d3a9305c8767eac35a7`; log `P0-RETEST06-20260805-075517.log`. Orden: sintaxis; suite una vez; `--check --all`; orden/hashes calculados en memoria; integridad/seguridad. Ante fallo: parada sin reintento, edición o construcción; conservación del temporal/log y bloqueo de P0-BUILD02.

| Retest | Esperado | Obtenido | Código | Escrituras | Estado |
|---|---|---|---:|---|---|
| RETEST-01 Sintaxis | 2/2 OK | 2/2 OK | 0, 0 | ninguna en proyecto | OK |
| RETEST-02 Suite | 113/113 OK | 113 aprobadas, 0 fallidas, 0 omitidas | 0 | fixtures temporales propios | OK |
| RETEST-03 `--check --all` | código 0, WARN 5/2/1, colisiones/ERR 0 | contrato completo conforme; evidencia 6+65=71 | 0 | ninguna en proyecto | OK |
| RETEST-04 Orden | pares y declaración canónica conformes | A: Avance posición 0, appsscript 67; Repository 59, Repository_Insertar 60; Código.js en C posición 1 | 0 | cálculo solo en memoria | OK |
| RETEST-05 Hashes | SHA-256 canónicos deterministas | A `fe9b2c…`, B `5230de…`, C `2f10ac…`; doble cálculo interno igual | 0 | cálculo solo en memoria | OK |

### Resultados canónicos y Unicode

Sintaxis: 2/2, códigos 0. Suite ejecutada exactamente una vez: 113 descubiertas, 113 aprobadas, cero fallidas/omitidas, código 0. Caso 93 confirmó `Código.js`, NFC y control anti-mojibake; 94 confirmó equivalencia compuesto/descompuesto; 95 produjo `CANONICAL_PATH_COLLISION`. También aprobaron orden bytewise, colisiones exacta/case-insensitive, manifiestos A/B/C, hashes y exclusión de metadatos no canónicos.

`--check --all` se ejecutó una vez: código 0; A=68, B=7, C=35, NONE=24; 134 rutas; 21 HTML; `appsscript.json`; WARN públicos `MIXED_ARCHITECTURE=5`, `EMBEDDED_TEST_CODE=2`, `APPROVED_SUITE_RUNNER=1`; ambigüedades, colisiones y ERR=0; evidencia Ids=6, Repository=65, total=71. Se conserva el WARN autorreferencial del roadmap por separado.

Orden serializado calculado mediante `createManifest` en memoria: A comienza `src/AvanceYSecuencia.js` y termina `src/appsscript.json`; posiciones A: Avance 0, appsscript 67, Repository 59, Repository_InsertarRegistro 60. B comienza `src/Tests_AvanceYSecuencia.js` y termina `src/Tests_Repository2.js`. C comienza `src/CorregirCatalogoTipoProyecto.js`, termina `src/InstaladorVinculo.js` y contiene `src/Código.js` en posición 1. Los tres manifiestos en memoria declaran ID `UTF8_NFC_BYTEWISE_V1`, NFC, UTF-8, `unsigned bytewise` y `localeDependent=false`; cero `localeCompare`.

Hashes canónicos calculados dos veces dentro del mismo proceso y coincidentes:

| Paquete | Entradas | SHA-256 canónico |
|---|---:|---|
| A | 68 | `fe9b2ccd9c1e12cb684a9652c4ce216f6df2d64dd66afd375d22d197bd40739c` |
| B | 7 | `5230de196415b9f86390a15846e24403130b5e70aa1ee646a78bee05997b5049` |
| C | 35 | `2f10acc26b5aac8917aabd3ad449ac8826d6fbd7868812c7017d01e531bd968b` |

Estos valores no se comparan como identidad con RUN-01 anterior. Fecha fijada, temporal y locale quedan fuera del agregado.

| Retest | Esperado | Obtenido | Código | Escrituras | Estado |
|---|---|---|---:|---|---|
| RETEST-06 Solo lectura/seguridad | cero cambios, paquetes y efectos externos | tooling/fuentes/RUN-01 intactos; temporal contiene solo log; cero paquetes/red/procesos hijo | 0 | solo roadmap y log autorizados | OK |

### Integridad, limitaciones y gate

Tooling, matriz, README, manual y 110 fuentes conservan hashes de baseline; RUN-01 mantiene 117 archivos y manifiestos antiguos intactos; cero paquetes nuevos en el proyecto; el temporal nuevo contiene únicamente el log. Sin red, navegador, Drive/API/OAuth/`clasp`, procesos hijo, ejecución de fuentes o elevación. Se mantiene `WARN: SYMLINK_DYNAMIC_NOT_VERIFIED`.

Limitación: los manifiestos y hashes se calcularon en memoria sin construir; reproducibilidad física y limpieza corresponden a P0-BUILD02, aún no autorizado.

Resultado: **VERIFICADO LOCALMENTE — 113/113 OK — UNICODE/NFC OK — ORDEN CANÓNICO OK — `--check` OK — NO CONSTRUIDO — NO EXPORTADO — NO DESPLEGADO — NO_GO vigente hasta P0-BUILD02**.

Gate solicitado: **P0-BUILD02 — Construcción doble desde cero usando UTF8_NFC_BYTEWISE_V1, comparación reproducible y limpieza controlada**. No se ejecuta en esta fase.

## P0-BUILD02 — Construcción doble canónica

### Autorización y baseline

Gate P0-RETEST06 aprobado. Autorizadas exactamente dos construcciones `--build --all` en un temporal nuevo, inspección/comparación, documentación, log y limpieza exclusiva de los nuevos paquetes. Prohibidos cambios de código/`src`, reutilización o eliminación de RUN-01 anterior, red/Drive/API/OAuth/`clasp`, publicación, exportación, despliegue, elevación, symlinks y commit.

Baseline: rama `main`; commit `752e1c14ea3d9cadff102aa52780616d0e58336a`; roadmap inicial 320.988 bytes, `5bd9d70c5038c5326129d7cf6c301025b3020d70058de4263fe7a0d7741fa1d0`; detector `41e0bfeeb0ebe73ed416da46b4712188da5dc68da4b71291af1e9974c9cd8225`; suite `d2abf98f4be6224e007401d40c4ef73e08e27030c3fa12a488f418f62b8cb1ab`; README `836aac676da3368e9ef9ef7cf86e8de07be785159f311b0c63dbda2bc7f3cfd8`; matriz `b06a0d3ebca394aa451995ff5c48d4e416bb54e36abd72ef588c3c7766759a5b`; manual `a18332565c408e9f283df26201c1a6745d1699ce9fd557d709d980225321c1fc`; log P0-RETEST06 `746da3791889f37e3d2c899e5d03189c22461fc04e3f70fee5ea720791983f0c`; 110 fuentes sin divergencias; RUN-01 anterior 117 archivos y manifiestos intactos. Check previo único: código 0, cero ERR.

Hashes esperados: A `fe9b2ccd9c1e12cb684a9652c4ce216f6df2d64dd66afd375d22d197bd40739c`; B `5230de196415b9f86390a15846e24403130b5e70aa1ee646a78bee05997b5049`; C `2f10acc26b5aac8917aabd3ad449ac8826d6fbd7868812c7017d01e531bd968b`.

Temporal nuevo: `C:\Users\pc\AppData\Local\Temp\P0-BUILD02-20260805-080912-c892d70a0dc34034a1c9529d4e19aaf4`. Destinos absolutos inicialmente inexistentes y con ese padre directo: `canonical-run-01`, `canonical-run-02`; fuera del proyecto, RUN-01 anterior, raíz de unidad y rutas sensibles. Comandos exactos: `node tools/packager/build-packages.mjs --build --all --output <temporal>\canonical-run-01` y el equivalente para `canonical-run-02`.

Parada ante código no cero, ERR, divergencia de contenido/hash/orden o escritura externa. Limpieza prevista solo después de documentar éxito: revalidar rutas absolutas y eliminar exclusivamente los dos hijos canónicos; conservar log y RUN-01 anterior. `NO_GO` para publicación/despliegue.

| Fase | Esperado | Obtenido | Código | Evidencia | Estado |
|---|---|---|---:|---|---|
| Gate 0 | baseline y check conformes | hashes, fuentes, RUN-01 y check OK | 0 | log temporal | OK |
| BUILD02-01 | A/B/C canónicos | 68/7/35, hashes esperados, ERR 0 | 0 | canonical-run-01 | OK |
| Inspección 01 | contenido/orden/manifiestos | copias 0 divergencias; evidencia 71; A HTML=21, Tests=0 | 0 | inventario y hashes | OK |
| BUILD02-02 | segunda A/B/C desde cero | 68/7/35, hashes esperados, ERR 0 | 0 | canonical-run-02 | OK |
| Comparación 2/2 | identidad canónica igual | rutas, orden, bytes, hashes, manifiestos e informes iguales | 0 | comparación completa | OK |

### Inventarios, manifiestos y reproducibilidad

Ambas ejecuciones produjeron A=68, B=7 y C=35. A contiene 21 HTML, `src/appsscript.json`, cero `Tests_*`, cero `Código.js` y cinco mixtos declarados; estado `PRODUCTION_WITH_DECLARED_MIXED_DEBT`, por lo que no se considera producción limpia. B contiene siete pruebas, ambos `Tests_Repository` independientes y `probarReporteIntegridad`; depende del hash agregado de A. C contiene 35 auxiliares y `Código.js`; estado `AUXILIARY_EXECUTION_REQUIRES_HUMAN_AUTHORIZATION`.

Todas las copias de canonical-run-01 coincidieron byte a byte y por SHA-256 con origen; cero desconocidos. La segunda ejecución coincide con la primera en conjunto y orden de rutas, cantidades, contenido, tamaños/hashes individuales, hash agregado, evidencia, warnings, dependencias, deuda, exclusiones y `canonicalSort`. Los informes son idénticos y conservan 71 evidencias (Ids=6, Repository=65). Los manifiestos son idénticos al excluir `builtAtUtc`; la fecha difiere y está identificada como metadato no canónico. ID de ejecución y rutas temporales solo aparecen en logs, no en identidad/hash.

| Paquete | RUN-01 | RUN-02 | Coincide |
|---|---|---|---|
| A | `fe9b2ccd9c1e12cb684a9652c4ce216f6df2d64dd66afd375d22d197bd40739c` | mismo | sí |
| B | `5230de196415b9f86390a15846e24403130b5e70aa1ee646a78bee05997b5049` | mismo | sí |
| C | `2f10acc26b5aac8917aabd3ad449ac8826d6fbd7868812c7017d01e531bd968b` | mismo | sí |

Los tres manifiestos declaran `UTF8_NFC_BYTEWISE_V1`, NFC, UTF-8, `unsigned bytewise`, `localeDependent=false`. Orden A verificado: Avance posición 0; Repository 59; Repository_InsertarRegistro 60; appsscript 67. C contiene Código en posición 1. Sin credenciales ni contenido fuente en metadatos.

Reconstrucción documental: 68 + 7 + 35 + 24 excluidos = 134; cero archivos sin decisión; pruebas explícitas separadas en B; runner técnico separado en C; HTML y manifiesto Apps Script incluidos en A. No se ejecutó Apps Script ni `clasp`.

Resultado previo a limpieza: **CONSTRUIDO LOCALMENTE — REPRODUCIBLE 2/2 — ORDEN CANÓNICO VERIFICADO — A=68 — B=7 — C=35 — HTML=21 — appsscript.json PRESENTE — Tests_* EN A=0 — NO PUBLICADO — NO EXPORTADO A DRIVE — NO DESPLEGADO**.

Se propone para cierre humano: `P0 TESTS EXPLÍCITOS EN A: RESUELTO LOCALMENTE` y `P0 HTML/MANIFIESTO OMITIDOS: RESUELTO LOCALMENTE`. Persisten cinco mixtos y `WARN: SYMLINK_DYNAMIC_NOT_VERIFIED`.

| Fase | Esperado | Obtenido | Código | Evidencia | Estado |
|---|---|---|---:|---|---|
| Limpieza | eliminar solo paquetes canónicos nuevos | canonical-run-01 y canonical-run-02 ausentes; log y RUN-01 anterior conservados | 0 | rutas absolutas revalidadas | OK |

### Integridad final, limitaciones y gate

Después de ambas construcciones y limpieza: tooling, matriz, README, manual y 110 fuentes conservan hashes de baseline; estado Git sin cambios nuevos salvo roadmap; cero archivos/temporales de paquete dentro del proyecto; RUN-01 anterior mantiene 117 archivos. El nuevo temporal conserva únicamente el log. No hubo red, Drive/API/OAuth/`clasp`, publicación, exportación, despliegue, symlinks, elevación ni commit.

Limitaciones: no se desplegaron paquetes ni se ejecutó Apps Script; la reproducibilidad se ha demostrado localmente en el mismo entorno. A conserva cinco archivos mixtos y no se declara producción limpia. `WARN: SYMLINK_DYNAMIC_NOT_VERIFIED` permanece.

Resultado final: **CONSTRUIDO LOCALMENTE — REPRODUCIBLE 2/2 — ORDEN CANÓNICO VERIFICADO — A=68 — B=7 — C=35 — HTML=21 — appsscript.json PRESENTE — Tests_* EN A=0 — NO PUBLICADO — NO EXPORTADO A DRIVE — NO DESPLEGADO**.

Gate solicitado: **P0-CLOSE01 — Cierre documental de los dos P0 y decisión sobre limpieza de RUN-01 anterior y commit local**. No se elimina RUN-01 anterior, no se hace commit y se mantiene `NO_GO para publicación, exportación externa, clasp push y despliegue`.

## P0-CLOSE01 — Cierre local de bloqueos de empaquetado

### Decisión y evidencia de cierre

Gate P0-BUILD02 aprobado. Decisión humana: cerrar los dos P0 localmente, eliminar únicamente el paquete RUN-01 inválido del algoritmo anterior, conservar logs/directorios de evidencia y preparar —sin stage ni commit— un alcance exacto para un gate independiente.

| P0 | Evidencia inicial | Corrección | Pruebas | Construcción | Estado |
|---|---|---|---|---|---|
| P0-01 | pruebas explícitas podían entrar en A | siete pruebas en B; `Código.js` en C; `probarReporteIntegridad` movida a pruebas | 113/113; cero `Tests_*` en A | doble build, hashes 2/2 iguales | **RESUELTO LOCALMENTE** |
| P0-02 | A omitía HTML y `appsscript.json` | matriz cerrada incluye 21 HTML y manifiesto Apps Script en A | copias byte a byte, manifiestos y hashes canónicos | doble build reproducible 2/2 | **RESUELTO LOCALMENTE** |

Hashes canónicos de cierre: A `fe9b2ccd9c1e12cb684a9652c4ce216f6df2d64dd66afd375d22d197bd40739c`; B `5230de196415b9f86390a15846e24403130b5e70aa1ee646a78bee05997b5049`; C `2f10acc26b5aac8917aabd3ad449ac8826d6fbd7868812c7017d01e531bd968b`. Log P0-BUILD02 preservado: 9.079 bytes, `07dcad635fd344a57108e6630025cb17b24974b358e9275d9aae05e251eb070a`.

### Riesgos residuales y estado remoto

- A conserva cinco archivos mixtos y estado `PRODUCTION_WITH_DECLARED_MIXED_DEBT`; no es producción limpia.
- Persisten 71 declaraciones de prueba incrustadas en dos mixtos: Ids=6 y Repository=65.
- `WARN: SYMLINK_DYNAMIC_NOT_VERIFIED`.
- No se ha usado `clasp`, reconstruido en Apps Script, publicado o desplegado.
- Permisos y runtime remoto no están validados.

Clasificación: **NO_GO publicación; NO_GO exportación externa; NO_GO `clasp push`; NO_GO despliegue**.

### Limpieza del RUN-01 inválido

Temporal antiguo resuelto: `C:\Users\pc\AppData\Local\Temp\P0-BUILD01-20260805-072914-d7fc1919b62c4b28b8ee08b3d3206f50`. Antes de borrar contenía exactamente un subdirectorio no-symlink `run-01` y el log separado `P0-BUILD01-20260805-072914.log`. Paquete: 117 archivos, 2.338.625 bytes; manifiestos A `aa6d78eae6a1407639540ed59b3c9e29923987c48bf2449e80c0eb4613dd6d50`, B `08a064e4e1aeb970110fcf6f9d890522a540a8ae19e9b2af6616b3d1fa38a22e`, C `1c7f16207489eb1550ce37749da909046417a66944f6294f619ae6a6c7bf1a12`.

El log se copió nuevamente al portapapeles y conserva SHA-256 `3bcec3d4151e311656b515b824f7d1c5c1ec8bcfa69d6c497b7c7d9f85b0ca88`. Se eliminó exclusivamente el subdirectorio absoluto `run-01`; el log y directorio padre permanecen. Los runs canónicos ya estaban eliminados y el log P0-BUILD02 permanece. Cero paquetes temporales restantes. El paquete eliminado no es recuperable desde esa ruta; puede reconstruirse conceptualmente con el algoritmo histórico si fuese necesario.

### Revisión completa del diff

| Archivo | Estado | Cambio | Motivo | Riesgo | Validación |
|---|---|---|---|---|---|
| `ROADMAP_AUDITORIA_UX.md` | M | ejecución auditada F00–P0-CLOSE01 | trazabilidad/gates | volumen documental | secciones y `diff --check` |
| `MANUAL_MARCO_FUNDAMENTAL.md` | nuevo | incorporación íntegra, sin alteración | marco funcional | no estaba rastreado | 11.491 bytes; hash `a183…c1fc` |
| `src/IntegrityService.js` | M | elimina función manual de 10 líneas | separar prueba de producción | referencia global | hash `9ea743…2c36`; diff revisado |
| `src/Tests_IntegridadGapReglasFuncional.js` | M | añade la misma función y encabezado | alojar prueba explícita en B | carga global Apps Script | hash `cb3f15…76de`; una declaración |
| `tools/packager/build-packages.mjs` | nuevo | empaquetador A/B/C, validación y orden canónico | resolver P0 | tooling nuevo | 113/113, check y build 2/2 |
| `tools/packager/build-packages.test.mjs` | nuevo | 113 pruebas locales | cobertura contractual | suite local | 113/113 |
| `tools/packager/package-map.json` | nuevo | matriz cerrada de 134 rutas | clasificación exacta | baseline autorreferencial roadmap | 134/134, hashes verificados |
| `tools/packager/README.md` | nuevo | operación, seguridad y gates | uso reproducible | documentación puede quedar obsoleta | alineado con algoritmo final |

`Código.js` no cambió: hash `c5bb093173f04ab7f7226f433cc3cbcd3a8157df68687d693175d3fd4690456a`, clasificado C/auxiliary. `probarReporteIntegridad` tiene una única declaración en `Tests_IntegridadGapReglasFuncional.js:766`; el cuerpo coincide mecánicamente con el retirado. Matriz 134 entradas/134 únicas; suite 113; manual incorporable sin cambios. No se localizaron cambios ajenos ni archivos temporales dentro del proyecto.

### Git y propuesta de commit

Rama `main`; commit base `752e1c14ea3d9cadff102aa52780616d0e58336a`; cero remotos configurados. Diff rastreado previo al cierre: roadmap +2.825 líneas, IntegrityService −10, Tests_Integridad +14; cinco archivos nuevos no rastreados. `git diff --check` correcto. No se ejecutaron `git add`, commit o push.

Alcance exacto propuesto:

```text
ROADMAP_AUDITORIA_UX.md
MANUAL_MARCO_FUNDAMENTAL.md
src/IntegrityService.js
src/Tests_IntegridadGapReglasFuncional.js
tools/packager/build-packages.mjs
tools/packager/build-packages.test.mjs
tools/packager/package-map.json
tools/packager/README.md
```

Mensaje recomendado: `feat: add reproducible local Apps Script packager`.

Cuerpo recomendado:

```text
- split explicit integrity test from production service
- classify test runner outside production package
- add closed A/B/C package matrix
- include HTML and appsscript manifest in package A
- enforce canonical UTF-8 NFC bytewise ordering
- add validation, manifests, hashes and safe temporary builds
- document UX audit findings and packaging gates
```

No incluir logs temporales. Resultado: **P0-01 RESUELTO LOCALMENTE — P0-02 RESUELTO LOCALMENTE — RUN-01 INVÁLIDO ELIMINADO — LOGS PRESERVADOS — COMMIT PREPARADO, NO EJECUTADO — NO PUBLICADO — NO DESPLEGADO — NO_GO REMOTO VIGENTE**.

Gate solicitado: **P0-COMMIT01 — Crear un único commit local con el alcance exacto aprobado, sin remoto, push, exportación ni despliegue**.

## P0-COMMIT01 — Commit local del empaquetador reproducible

### Autorización y precommit

Autorización humana expresa para completar esta sección, añadir al índice exactamente ocho archivos, revisar el diff staged y crear un único commit local. Prohibidos archivos adicionales, cambios de código, pruebas/builds, red, remotos, push, `clasp`, exportación, despliegue, tags, amend y commits adicionales.

Rama `main`; commit padre `752e1c14ea3d9cadff102aa52780616d0e58336a`; cero remotos; índice inicialmente vacío; `git diff --check` correcto; cero paquetes y logs dentro del proyecto. Estado compatible con P0-CLOSE01.

Alcance exacto 8/8:

```text
ROADMAP_AUDITORIA_UX.md
MANUAL_MARCO_FUNDAMENTAL.md
src/IntegrityService.js
src/Tests_IntegridadGapReglasFuncional.js
tools/packager/build-packages.mjs
tools/packager/build-packages.test.mjs
tools/packager/package-map.json
tools/packager/README.md
```

### Hashes precommit

| Archivo | Bytes | SHA-256 previo a esta sección |
|---|---:|---|
| `ROADMAP_AUDITORIA_UX.md` | 333.828 | `9f8d586af41c45497c76a8cec7dcc22772b84b1d1c4ea1817e8663cea1ba68b9` |
| `MANUAL_MARCO_FUNDAMENTAL.md` | 11.491 | `a18332565c408e9f283df26201c1a6745d1699ce9fd557d709d980225321c1fc` |
| `src/IntegrityService.js` | 95.637 | `9ea74302397f0b79f520589694b936d8eedbd25ab9c88970b60f30ce7b672c36` |
| `src/Tests_IntegridadGapReglasFuncional.js` | 30.670 | `cb3f158d590be214e875d00a8585e4a8db278be577a321cb261a3f345c2576de` |
| `tools/packager/build-packages.mjs` | 34.819 | `41e0bfeeb0ebe73ed416da46b4712188da5dc68da4b71291af1e9974c9cd8225` |
| `tools/packager/build-packages.test.mjs` | 38.670 | `d2abf98f4be6224e007401d40c4ef73e08e27030c3fa12a488f418f62b8cb1ab` |
| `tools/packager/package-map.json` | 32.504 | `b06a0d3ebca394aa451995ff5c48d4e416bb54e36abd72ef588c3c7766759a5b` |
| `tools/packager/README.md` | 14.526 | `836aac676da3368e9ef9ef7cf86e8de07be785159f311b0c63dbda2bc7f3cfd8` |

### Evidencia, cierre y riesgos

Pruebas ejecutadas: sintaxis 2/2; suite 113/113; `--check --all` código 0; construcción canónica A/B/C reproducible 2/2; copias byte a byte; limpieza controlada. Hashes: A `fe9b2ccd9c1e12cb684a9652c4ce216f6df2d64dd66afd375d22d197bd40739c`; B `5230de196415b9f86390a15846e24403130b5e70aa1ee646a78bee05997b5049`; C `2f10acc26b5aac8917aabd3ad449ac8826d6fbd7868812c7017d01e531bd968b`.

Estados: **P0-01 RESUELTO LOCALMENTE** y **P0-02 RESUELTO LOCALMENTE**. Persisten cinco mixtos en A, 71 declaraciones incrustadas, symlink dinámico no verificado y ausencia de validación remota/Apps Script/permisos. Se mantienen `NO_GO` para publicación, exportación externa, `clasp push` y despliegue.

Mensaje autorizado: `feat: add reproducible local Apps Script packager`.

Cuerpo autorizado:

```text
- split explicit integrity test from production service
- classify test runner outside production package
- add closed A/B/C package matrix
- include HTML and appsscript manifest in package A
- enforce canonical UTF-8 NFC bytewise ordering
- add validation, manifests, hashes and safe temporary builds
- document UX audit findings and packaging gates
```

El hash del commit resultante se registra externamente porque escribirlo dentro del contenido comprometido modificaría el propio commit.

En el cierre P0-COMMIT01 se previó no volver a modificar el roadmap dentro de aquella secuencia de commit. La reparación documental posterior DOC-FIX01 queda expresamente trazada a continuación. El commit permanece únicamente local, sin remoto, push, exportación ni despliegue.

### Nota posterior — DOC-FIX01

Esta reparación documental se realizó después del commit `b4d2524`. Se limitó a reorganizar las fases P0 y corregir la atribución de evidencias ya existentes; no reejecutó pruebas ni modificó código. El roadmap reparado todavía no forma parte de un nuevo commit.
## DOC-CLOSE01 — Trazabilidad documental posterior al commit

- DOC-REC01 detectó desorden y atribuciones contradictorias; resultado: NO_GO_DOCUMENTAL.
- DOC-FIX01 reordenó las 19 fases P0 y corrigió sus atribuciones; resultado verificado.
- DOC-REVIEW01 confirmó la conservación semántica y detectó tablas fragmentadas.
- DOC-FIX02 añadió cinco cabeceras y cinco separadores, y detectó cambios no autorizados de finales de línea.
- DOC-EOL01 verificó 15 conversiones preexistentes de CRLF a LF.
- DOC-FIX03, DOC-FIX03B y DOC-FIX03C produjeron candidatos físicos válidos; las publicaciones fallaron o fueron recuperadas sin pérdida.
- DOC-FORMAL01 identificó el falso negativo del marcador y la fragmentación de la tabla PanelCampana.
- DOC-FIX04 reparó PanelCampana en una candidata y detectó que la fila Administración tenía siete columnas.
- DOC-FIX05 corrigió Administración a seis columnas y validó 100/100 tablas.
- DOC-UNTRACKED01 y DOC-HEAD01 identificaron y verificaron el fixture posteriormente comprometido.
- DOC-PREVAL01 identificó una deriva de alcance en el contador de hashes.
- DOC-PUBLISH02E publicó localmente el roadmap con coincidencia byte a byte con la candidata, 28/28 controles, 100/100 tablas, 1.569 filas y cero defectos.
- El baseline publicado por DOC-PUBLISH02E, anterior a DOC-CLOSE01, es 045cbe0c70a688ad54aee8f1627505c9987dadd37d8304244956b24437aaac88.
- Quedan confirmadas la restauración de 15 terminadores preexistentes, la reparación de PanelCampana y la corrección de Administración; no se reejecutaron pruebas productivas ni se realizaron builds, Apps Script, clasp, red, exportación o despliegue. NO_GO REMOTO VIGENTE.
- La incorporación de DOC-CLOSE01 se realiza mediante gates independientes de validación, publicación y commit.
