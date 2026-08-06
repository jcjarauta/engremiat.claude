# Empaquetador local cerrado de LaTroballa

Estado: **CORREGIDO ESTÁTICAMENTE — NO EJECUTADO — NO PROBADO**.

Continúa el **NO_GO operativo** para ejecutar el empaquetador, ejecutar sus pruebas, construir paquetes, exportar, usar `clasp` o desplegar. Este directorio no es parte del universo Apps Script de 141 archivos y el propio empaquetador lo excluye literalmente del escaneo, igual que `.git/` y `.claude/` (config local de Claude Code, no versionada).

## Propósito

Definir y, tras un gate futuro, comprobar/construir localmente paquetes reproducibles:

- A: runtime de producción con deuda mixta declarada.
- B: ocho archivos de pruebas, dependientes de una versión fijada de A.
- C: instaladores, migraciones, fixtures, reparadores y tooling auxiliar.

Evita selección implícita, pruebas explícitas en A, pérdida de HTML o manifiesto, archivos desconocidos, hashes divergentes, salidas inseguras, sobrescrituras y publicaciones parciales presentadas como completas.

## Arquitectura

| Archivo | Responsabilidad |
|---|---|
| `package-map.json` | allowlist exacta de las 141 rutas originales, con `module` por archivo de A y `moduleDependencies` |
| `build-packages.mjs` | CLI, validación, escaneo textual y futura construcción |
| `build-packages.test.mjs` | 73 pruebas locales redactadas; las 20 de P0-FIX04 aún no ejecutadas |
| `generate-shell-wrappers.mjs` | calcula, para un conjunto de módulos, qué funciones (menú/`google.script.run`/triggers) quedan dentro del cierre y genera sus envoltorios de una línea para el futuro cascarón del cliente |
| `generate-shell-wrappers.test.mjs` | 25 pruebas, incluidas 3 contra el repositorio real |
| `README.md` | contrato, uso, seguridad, límites y gates |

Solo se usan módulos integrados de Node.js 24. No hay NPM, `package.json`, red, Drive, Apps Script API, OAuth, `clasp`, evaluación dinámica, procesos hijo ni ejecución del código fuente.

## Contrato de paquetes

### A — `PRODUCTION_WITH_DECLARED_MIXED_DEBT`

Incluye las 68 entradas `production` y un `mixed` (69 entradas A). Contiene obligatoriamente los 21 HTML y `src/appsscript.json`. Excluye los ocho `Tests_*`, las 37 auxiliares y 27 excluidas.

Cada entrada de A declara además un `module` (subconjunto lógico dentro de A, no un paquete nuevo): `CORE` (56, cimiento — jerarquía, personas, espacios, formularios genéricos, paneles, integridad, historial, protección, selectores, catálogos, kanban, listados, informes genéricos), `GANTT` (3: `DesviacionService.js`, `DisponibilidadService.js`, `GanttPlanReal.html`), `ECONOMICO` (1: `CosteService.js`), `IMPACTO` (1: `EvidenciaSocialService.js`), `COMPRAS` (6: ficha material/proveedor, `PedidoRecepcion.js`, `StockMaterialService.js`) y `CONVOCATORIAS` (2: ficha convocatoria). `map.moduleDependencies` declara el cierre requerido por módulo (p.ej. `IMPACTO` exige `CORE` + `ECONOMICO`); `--modules` resuelve ese cierre transitivo antes de filtrar. `COMPETENCIAS` y `PRESUPUESTO/FUENTE_FINANCIACION` no tienen archivos propios — sus esquemas viven embebidos en `src/FormularioEsquemas.js` (CORE) y no se separan sin refactorizarlo.

No es “producción limpia”. Mantiene deuda individual (mezcla de capas UI/dominio, no código de prueba) en:

- `src/PedidoRecepcion.js`

El resto de la deuda original se cerró (ver `PROPUESTA_MODULARIZACION_LIBRERIA.md`): `src/Ids.js` y `src/Repository.js` tenían código de prueba embebido, extraído a `Tests_Ids.js`/`Tests_Repository2.js`. `src/Validation.js` se reclasificó a C: sin referencias externas en todo el repositorio y valida un esquema de 17 hojas obsoleto frente a las 37+ entidades reales — mismo perfil que los `Instalador*.js`. `src/Formularios.js` (2987 líneas, mezcla UI+DOMINIO activa referenciada desde el menú real) se separó en `src/FormularioMotorUI.js` (UI_SERVIDOR), `src/FormularioValidacionService.js` (DOMINIO) y `src/FormularioEsquemas.js` (CONFIGURACION).

El detector separa dos conceptos:

- `MIXED_ARCHITECTURE`: toda entrada con `mixed:true` genera siempre este `WARN`, aunque no declare pruebas. Describe mezcla de capas o responsabilidades.
- `EMBEDDED_TEST_CODE`: un mixto que además declara funciones de prueba genera este segundo `WARN`. Una declaración equivalente en `production` genera `ERR EMBEDDED_TEST_CODE_IN_PRODUCTION`.

Se considera declaración `function nombre(...)` o una asignación inequívoca mediante `const`, `let` o `var` a `function`/arrow cuando el nombre comienza por `prueba`, `probar`, `test`, `ejecutarSuite` o `assert`. Las referencias y llamadas generales como `procesarDatosExternos()` no son contaminación. Una llamada directa inequívoca `ejecutarSuite*()` sí es contaminación en producción/A (`ERR SUITE_CALL_IN_PRODUCTION`) y runner aprobado en auxiliar/C (`WARN APPROVED_SUITE_RUNNER`). Coincidencias dentro de strings, template literals o comentarios se ignoran. Cada hallazgo informa ruta, línea, tipo, nombre y motivo. Un elemento léxico sin cierre genera `WARN AMBIGUOUS_TEST_ANALYSIS`, nunca un falso OK.

Ejemplos mínimos:

```js
function probarCaso() {} // declaración: WARN en mixed, ERR en production
ejecutarSuiteExterna();  // ERR en A; WARN de runner aprobado en C
procesarDatosExternos(); // llamada general: permitida
const texto = 'function probarCaso() {}'; // string: ignorado
```

### B — `TESTS_DEPEND_ON_VERSIONED_PACKAGE_A`

Incluye exactamente:

1. `src/Tests_AvanceYSecuencia.js`
2. `src/Tests_CosteService.js`
3. `src/Tests_Ids.js`
4. `src/Tests_ImportacionRecursosPersonas.js`
5. `src/Tests_IntegridadGapReglasFuncional.js`
6. `src/Tests_LecturaBatch.js`
7. `src/Tests_Repository.js`
8. `src/Tests_Repository2.js`

Los dos repositorios permanecen separados. El manifiesto de B declara el hash agregado de A, los mixtos y la limitación de autonomía. Los fixtures concretos requieren decisión humana antes de ejecutar.

### C — `AUXILIARY_EXECUTION_REQUIRES_HUMAN_AUTHORIZATION`

Incluye exactamente las 37 entradas `auxiliary`. El empaquetador las copia en un futuro build autorizado, pero nunca las ejecuta. No deben usarse cotidianamente en producción.

`src/Código.js` pertenece a C como runner manual de la suite 305–310: conserva `myFunction`, ejecuta `ejecutarSuitePaso305a310()` y escribe diagnóstico en `00_INICIO!A1:A2`. No tiene entrada productiva localizada. El detector emite `WARN APPROVED_SUITE_RUNNER` para esta llamada en C; la misma llamada directa desde producción A sería `ERR SUITE_CALL_IN_PRODUCTION`. No se convierten en error llamadas productivas ordinarias con palabras parecidas.

### Advertencias consolidadas y evidencia

`EMBEDDED_TEST_CODE` es un recuento público por archivo, no por función. Cada mixto afectado produce una sola línea determinista con `path`, número de `matches`, lista de líneas ordenada/sin duplicados y tipos únicos. El detalle no se elimina: `validateContamination` conserva una colección estructurada por coincidencia (`path`, `line`, `kind`, `name`, `reason`), ordenada por ruta/línea/nombre, y el futuro `validation-report.json` la incluye como `embeddedTestEvidence`. Tras extraer las 71 declaraciones de Ids.js/Repository.js a sus `Tests_*.js`, el proyecto real ya no publica ningún `EMBEDDED_TEST_CODE`.

El enmascarado léxico reconoce regex literales de forma conservadora después de contextos de expresión como `(`, `[`, `{`, coma, asignación, `:`, `!`, `?`, `;`, `return`, `case` o `=>`. Soporta escapes, `\/`, clases `[...]`, barras/comillas dentro de clases y flags. Una barra después de identificador, número, string cerrado, `)` o `]` se trata como división. Los contextos que no pueden decidirse conservadoramente generan `AMBIGUOUS_SLASH_CONTEXT`; los strings, comentarios, templates o regex realmente sin cerrar continúan generando advertencia. No hay excepciones por nombre de archivo ni parser externo.

## Uso futuro

No ejecutar hasta aprobar `P0-RETEST03`; P0-RETEST02 terminó en NO_GO por recuento público y ambigüedades léxicas, y esta corrección no está probada.

```text
node tools/packager/build-packages.mjs --check --package A
node tools/packager/build-packages.mjs --check --package B
node tools/packager/build-packages.mjs --check --package C
node tools/packager/build-packages.mjs --check --all

node tools/packager/build-packages.mjs --build --package A --output <ruta-nueva>
node tools/packager/build-packages.mjs --build --all --output <ruta-nueva>

node tools/packager/build-packages.mjs --check --modules GANTT
node tools/packager/build-packages.mjs --build --modules GANTT,CONVOCATORIAS --output <ruta-nueva>
```

Opciones:

- `--check`: valida sin escribir.
- `--build`: habilita construcción local; exige `--output`.
- `--output <ruta>`: destino nuevo y explícito.
- `--package A|B|C`: selecciona exactamente uno.
- `--all`: selecciona A, B y C; incompatible con `--package`/`--modules`.
- `--modules M1,M2`: selecciona un subconjunto de A por módulo lógico (`CORE`, `GANTT`, `ECONOMICO`, `IMPACTO`, `COMPRAS`, `CONVOCATORIAS`); resuelve automáticamente el cierre transitivo declarado en `moduleDependencies` (p.ej. pedir `IMPACTO` incluye también `CORE` y `ECONOMICO`); incompatible con `--package`/`--all`.
- `--project-root <ruta>`: raíz local explícita.

Sin argumentos muestra ayuda y no escribe. No existe paquete ni selección predeterminados: se exige exactamente una de `--package`, `--all` o `--modules`. Opciones desconocidas, incompletas o un módulo no reconocido fallan.

### Envoltorios del cascarón (`generate-shell-wrappers.mjs`)

Para el patrón de librería de Apps Script (ver `PROPUESTA_MODULARIZACION_LIBRERIA.md`), cada punto de entrada invocado desde el cascarón del cliente —ítem de menú (`addItem`), llamada `google.script.run` desde HTML, o trigger simple (`onOpen`/`onEdit`)— necesita un envoltorio de una línea si su lógica real vive en la librería. Esta herramienta calcula, para un conjunto de módulos dado, qué envoltorios son generables (la función que define el punto de entrada cae dentro del cierre de módulos pedido) y cuáles no (deuda a resolver: la función vive en un módulo no seleccionado, no tiene declaración localizable, o tiene más de una declaración ambigua).

```text
node tools/packager/generate-shell-wrappers.mjs --modules CORE,GANTT
node tools/packager/generate-shell-wrappers.mjs --modules CORE,GANTT,ECONOMICO,IMPACTO,COMPRAS,CONVOCATORIAS --output <archivo.js> --user-symbol Core
```

Opciones: `--modules M1,M2` (obligatoria, mismo cierre transitivo que `build-packages.mjs`), `--output <archivo.js>` (opcional; sin ella solo informa por consola, no escribe; no sobrescribe destinos existentes ni escribe dentro de `src/` o `tools/packager/`), `--user-symbol <Nombre>` (símbolo de la librería en `appsscript.json`, por defecto `Core`), `--project-root <ruta>`.

Cada envoltorio generado es genérico: `function nombre() { return Symbol.nombre.apply(null, arguments); }`, sin necesidad de conocer la firma real de cada función (validado en la POC: funciona de punta a punta con este patrón). Solo lee el repositorio real (no copia ni construye paquetes); no requiere `--check`/`--build` previos.

Estado real verificado contra el proyecto: pidiendo los seis módulos completos no queda ningún hueco (176 envoltorios generables, incluidos `onOpen`/`onEdit`). Pidiendo un módulo aislado (p.ej. `GANTT`) sí aparecen huecos reales `FUERA_DE_MODULOS`, porque `onOpen()` hoy es un único menú monolítico que referencia funciones de todos los módulos — confirma la limitación ya documentada en `PROPUESTA_MODULARIZACION_LIBRERIA.md`: mientras `onOpen()` no se reparta por módulo, un cascarón module-scoped solo es autosuficiente si incluye la selección completa de módulos.

## Salida, estructura y reproducibilidad

Cada paquete futuro contiene conceptualmente:

```text
manifest.json
validation-report.json
files/
```

Si se construyen todos, cada paquete ocupa un subdirectorio A/B/C y el temporal incluye `packager.log`.

Hash agregado:

1. ordenar entradas por `path` ascendente;
2. formar por entrada `path + "\n" + sha256 + "\n" + size + "\n"`;
3. concatenar en UTF-8;
4. calcular SHA-256.

Identifica contenido y composición, no fecha, ruta absoluta u orden del sistema de archivos. Las fechas y la raíz son metadatos informativos del manifiesto y no participan en el hash agregado.

## Seguridad y efectos laterales

- El modo `--check` no llama a ninguna función de escritura.
- `--build` exige destino explícito y nuevo.
- Se rechazan raíz del proyecto, `src`, `tools/packager`, raíces de unidad, rutas dentro de zonas prohibidas y cualquier salida preexistente.
- Se rechazan symlinks y rutas absolutas/`..` en la matriz.
- Los archivos se copian sin sobrescribir y se verifican por SHA-256.
- La construcción ocurre en un temporal hermano de la salida.
- Solo después de validar se publica mediante `rename` local.
- Ante fallo solo se elimina el temporal creado por esa ejecución, validando padre y prefijo.
- Nunca se elimina una salida preexistente.
- No se ejecuta ni evalúa ninguna fuente.

El log UTF-8 registra ID de ejecución, paquetes, recuentos y hashes. No usa portapapeles; cualquier copia futura al portapapeles requeriría una solicitud y cambio expresos.

## Códigos y protocolo de salida

| Código | Significado |
|---:|---|
| 0 | OK |
| 1 | contrato o validación incumplidos |
| 2 | argumentos inválidos |
| 3 | error de lectura |
| 4 | destino inseguro |
| 5 | construcción incompleta |

La salida usa `ENGREMIAT_PACKAGE_BEGIN`, `OK`, `WARN`, `ERR`, `NEXT` y `ENGREMIAT_PACKAGE_END`. No debe mostrar tokens, credenciales ni contenido de fuentes.

## Reversión

Durante una construcción futura fallida, retirar solo el temporal con ID/prefijo de esa ejecución. No seleccionar por nombre ambiguo ni borrar salidas anteriores.

Para revertir esta implementación estática se requiere autorización humana y se retirarían únicamente estos cuatro archivos, además de revertir exclusivamente la sección P0-IMP01 del roadmap. No usar `git reset`, `git checkout` ni borrado recursivo amplio.

## Límites

- El análisis léxico conservador no es un parser JavaScript completo. Enmascara comentarios, strings y template literals preservando saltos de línea; no interpreta semántica, alias, funciones importadas ni todos los estilos posibles de asignación.
- La distinción regex/división cubre contextos conservadores, no toda la gramática JavaScript. Un slash tras una construcción no soportada permanece ambiguo y exige revisión; no se silencia.
- `probarReporteIntegridad` fue extraída mecánicamente de `src/IntegrityService.js` a la sección de pruebas manuales de `src/Tests_IntegridadGapReglasFuncional.js`. Conserva nombre, cuerpo y dependencia productiva de `obtenerReporteIntegridad`; no se ha ejecutado.
- Las 73 pruebas redactadas y el detector corregido requieren P0-RETEST03. No se ha ejecutado Node durante P0-FIX04.
- El roadmap es autorreferencial: su hash en la matriz es el baseline anterior a P0-IMP01 y genera advertencia, no participa en paquetes.
- Node/sintaxis, pruebas, permisos y comportamiento multiplataforma no están verificados.
- B no es autónomo sin A y fixtures autorizados.
- A conserva deuda mixta.
- No se ha construido ningún paquete ni probado reversión/atomicidad.

## Gates humanos

1. `P0-RETEST03`: repetir sintaxis, suite ampliada, `--check` y argumentos, sin construir ni usar red.
2. Gate de corrección adicional: revisar resultados y diff si persiste algún bloqueo.
3. Gate de build: autorizar destino temporal exacto solo tras un retest válido.
4. Gate de exportación: revisar manifiestos/hashes y autorizar destino externo.
5. Gate de despliegue: autorización independiente para cualquier `clasp push` o producción.

Pedir código no autoriza ejecutar, probar, construir, exportar ni desplegar.

## Precedencia de validación y limpieza (P0-FIX05)

La validación contractual precede al análisis y a cualquier escritura: argumentos, matriz y rutas; rechazo de enlaces simbólicos; existencia y lectura; tamaño y SHA-256; comparación del hash; conservación temporal del contenido validado en memoria; detector y evidencia; paquete; y, solo en modo `--build`, temporal, copia, validación y publicación.

Cada fuente se lee una sola vez durante una validación. El registro validado conserva ruta, ruta absoluta, tipo, categoría, paquete, tamaño, hash y un buffer en memoria. Solo el texto JavaScript analizable llega al detector. Hash, detector y `embeddedTestEvidence` derivan del mismo buffer; el helper de evidencia no vuelve a abrir rutas. El contenido fuente no se incluye en logs, manifiestos ni salidas públicas.

La precedencia pública queda fijada: un archivo ausente o ilegible produce `NO_SE_PUEDE_LEER`; un hash distinto produce `HASH_DIVERGENTE`; una infracción léxica posterior produce `CONTAMINACION`; y un fallo propio de la fase de construcción produce `CONSTRUCCION_INCOMPLETA`. El primer error contractual no se sustituye por un error posterior.

La limpieza es vacía si aún no existe temporal. Cuando existe, solo admite el temporal hermano creado por la ejecución y validado por padre y prefijo. Un fallo de limpieza se conserva como detalle secundario del error principal. `--check` no crea temporales de construcción.

P0-FIX05 amplía la suite de 73 a 89 casos redactados. Esta corrección es exclusivamente estática: no se ha ejecutado Node, la suite, `--check`, argumentos ni ninguna construcción. Requiere el gate `P0-RETEST04` antes de valorar un build.

## Orden canónico portable (P0-FIX06)

Toda ruta que afecte identidad, manifiestos, informes, evidencia o hashes utiliza `UTF8_NFC_BYTEWISE_V1`: separadores `/`, ruta relativa validada, normalización Unicode NFC, codificación UTF-8 y comparación binaria sin signo de los bytes. No intervienen locale, plegado cultural, conversión a minúsculas ni orden del sistema de archivos.

Consecuencias explícitas del orden bytewise:

- `src/AvanceYSecuencia.js` precede a `src/appsscript.json`, porque `A` precede a `a`.
- `src/Repository.js` precede a `src/Repository_InsertarRegistro.js`, porque `.` precede a `_`.
- Mayúsculas y minúsculas permanecen distintas.
- Rutas con caracteres como `Código.js` se conservan en NFC en los manifiestos.

Dos originales distintos que colapsen a la misma ruta NFC producen `CANONICAL_PATH_COLLISION`. Un duplicado exacto produce `DUPLICATE_CANONICAL_PATH`. Dos rutas que solo difieran por casing producen `CASE_INSENSITIVE_PATH_COLLISION` y bloquean la construcción pendiente de decisión humana; no se renombran ni se pliegan automáticamente.

El hash agregado ordena primero las entradas con `UTF8_NFC_BYTEWISE_V1` y después concatena `path + LF + sha256 + LF + size + LF`. El manifiesto declara el identificador, NFC, UTF-8, comparación bytewise y ausencia de dependencia del locale. Fecha, ID de ejecución, ruta temporal y raíz informativa no participan en el hash.

Los hashes de RUN-01 pertenecen al algoritmo anterior basado en `localeCompare`; son evidencia histórica, no baseline del algoritmo corregido. RUN-01 no debe modificarse, reutilizarse ni compararse como identidad canónica nueva. Es obligatorio regenerar desde cero tras P0-RETEST05 y un gate de construcción independiente.

P0-FIX06 conserva las 89 pruebas y añade 24 casos, con total previsto de 113. La corrección no ha sido ejecutada ni probada.
