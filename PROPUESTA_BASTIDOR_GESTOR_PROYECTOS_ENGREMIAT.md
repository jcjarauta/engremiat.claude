# Bastidor — el Gestor de Proyectos Engremiat

**Fecha**: 2026-09-02
**Estado**: tabla de correspondencia real, primera versión. Sin tocar el Sheet real (`Gestor de Proyectos - LaTroballa Software`, id `142vRqXfDj4C7KyY7TVf5Oh18gwtDcvAkYxFQ0lb6CGQ`) — se estudia su esquema, nunca sus datos.
**Decisión de nombre**: este proyecto deja de llevar referencia a La Troballa — es el **Gestor de Proyectos Engremiat**, nombre de trabajo **Bastidor** (el armazón real de un Telar, antes de tejer nada).
**Relacionado**: [[PROPUESTA_NOMENCLATURA_UNIVERSO_ENGREMIAT]] (Núcleo, Constitución, las 4 capas), [[PROPUESTA_TELAR_INTERFAZ_OPERATIVA]], `00_Nucleo/Arquitectura_Nucleo.canvas`

---

## 0. Hallazgo de partida

El Sheet real de trabajo diario tiene **70 pestañas** (55 de negocio + 15 de staging técnico `STG_*`, no analizadas aquí). Leídas sus cabeceras reales, la convergencia con el Núcleo que ya habíamos diseñado por otro camino (Telar, la Constitución, las 4 capas) es mucho más fuerte de lo esperado — hasta `Compromiso`, la única pieza que habíamos aparcado por falta de caso real (Telar §19.1), ya tiene tabla real (`20_EJECUCION_TAREA`, con campo `RESULTADO`).

**Dos niveles de escala reales que no teníamos**: la cadena real es `Campaña → Proyecto → Producto → Proceso → Tarea`, no la escala de 5 niveles que habíamos fijado (`Universo → Campaña → Proyecto → Misión → Sesión`). **Producto** (el entregable) y **Proceso** (una fase/secuencia dentro de un Producto) son conceptos reales que faltaban.

---

## 1. Escala — corregida con datos reales

| Nivel (nuevo) | Tabla real | Nota |
|---|---|---|
| Universo | — | No existe como tabla; es el Sheet entero + Baserow + bóveda juntos |
| Campaña | `01_CAMPANAS` | Ya en nuestra escala anterior, confirmado real |
| Proyecto | `02_PROYECTOS` | Ya confirmado; tiene `CLIENTE_ID` — un Proyecto pertenece a un cliente real |
| **Producto** *(nuevo)* | `03_PRODUCTOS` + `04_PROYECTO_PRODUCTO` | El entregable concreto de un Proyecto — faltaba en nuestra escala |
| **Proceso** *(nuevo)* | `05_PROCESOS` | Una fase secuenciada dentro de un Producto, con predecesor — faltaba en nuestra escala |
| Misión / Tarea | `06_TAREAS` | Ya confirmado — `OBJETIVO`, `RESULTADO_ESPERADO`, `CRITERIOS_ACEPTACION`, `DEFINITION_OF_DONE` ya son casi literalmente el esquema de Misión de Telar §3.1 |
| Sesión | `20_EJECUCION_TAREA` | Una ejecución concreta de una Tarea — ver Compromiso abajo |

---

## 2. Ontología del Núcleo — correspondencia real completa

### 2.1 Ya núcleo, ahora con tabla real

| Concepto del Núcleo | Tabla real | Columnas que lo confirman |
|---|---|---|
| Necesidad (entrada de Vigilia) | `13_INCIDENCIAS` | `TITULO`, `DESCRIPCION`, `IMPACTO`, `ACCION_CORRECTORA`, `RESPONSABLE_ID` |
| Decisión | `12_DECISIONES` | `CONTEXTO`, `TIPO`, `IMPACTO`, `RESOLUCION`, `OBJETIVO`, `CRITERIOS_ACEPTACION` |
| **Compromiso** *(ya no aparcado — caso real encontrado)* | `20_EJECUCION_TAREA` | `RESPONSABLE_ID`, `FECHA_INICIO/FIN`, `RESULTADO` — la Huella de una Tarea concreta |
| Evidencia / Archivo Vivo | `14_DOCUMENTOS` | `ENTIDAD_TIPO`+`ENTIDAD_ID` (polimórfico), `VERSION`, `URL` |
| Participante | `11_PERSONAS_EQUIPOS` | `TIPO` (persona/equipo), `CAPACIDAD_SEMANAL_DIAS`, `NIVEL_PERMISO_BOT` |
| Asignación (Participante↔lo-que-sea) | `16_ASIGNACION` | `ENTIDAD_TIPO`+`ENTIDAD_ID` polimórfico — el precedente real de `Participante` ya citado en Telar §3.3 |
| Relación / Vínculo | `17_RELACION`, `18_VINCULO` | Ya el mecanismo real de Mensajero |
| Recurso | `23_RECURSO` | `CLASE_RECURSO`, `CATEGORIA_RECURSO`, `CAPACIDAD`, `MODO_COSTE` — más rico que nuestro Recurso actual |
| Presupuesto / Coste (dominio del Guardián de Recursos) | `30_PRESUPUESTO`, `32_COSTE` | `IMPORTE_PREVISTO` vs. `IMPORTE` real — exactamente estimado-vs-real |
| **Memoria / Historial** *(ya construido, más maduro que Telar B3)* | `91_HISTORIAL` | `CORRELATION_ID`, `ANTES_JSON`/`DESPUES_JSON`, `ES_PRUEBA` — auditoría real más completa que `auditoria.json` de Telar B3 |
| **Log de gobierno** *(el Guardián de Cumplimiento, ya real)* | `98_LOG_GOBIERNO` | `MECANISMO`, `RESULTADO`, `DETALLE` |
| **Triage local** *(Vigilia, pre-check con modelo local)* | `99_TRIAGE_LOCAL` | `RIESGO`, `VERIFICADO_POR_CLAUDE` |
| Bus de trabajo (Coordinador) | `92_BUS_TRABAJO` | Ya conocido en detalle |
| Configuración (capa 3 de las 4 capas) | `90_CONFIGURACION` | `CATEGORIA`/`CLAVE`/`VALOR` — literal |
| Estado de Consola | `97_ESTADO_CONSOLA` | — |
| Prompt vivo del Ejecutor | `96_PROMPT_EJECUTOR` | Cada universo tendría el suyo — el mecanismo es núcleo, el contenido es configuración |

### 2.2 Nuevo hallazgo — Competencia y Disponibilidad ya tienen subsistema real

| Concepto | Tablas reales |
|---|---|
| Competencia (mismo patrón que `jerarquia.yaml`/ESCO) | `33_COMPETENCIA`, `34_PERSONA_COMPETENCIA`, `35_RECURSO_COMPETENCIA`, `45_TAREA_COMPETENCIA` |
| Disponibilidad / Horario *(concepto nuevo, no estaba en el Núcleo)* | `29_HORARIO` |
| Necesidad de recurso de una Tarea *(nuevo)* | `46_TAREA_RECURSO_NECESIDAD` |

### 2.3 Candidato núcleo que faltaba nombrar

| Tabla real | Por qué es candidata a núcleo |
|---|---|
| `SOLICITUDES_MONTAJE` | El mecanismo real de "un universo pide nacer" — `MODULOS`, `ESTADO`, `APROBADO_POR`. Esto es, literalmente, el primer paso del futuro Rito de Fundación (Telar, deliberadamente aparcado). Aquí ya existe, en producción. |

---

## 3. Específico — no viaja al Núcleo, es de La Troballa o de un dominio comercial concreto

| Tabla real | Por qué es específica |
|---|---|
| `38_CLIENTE` | Ficha de cliente comercial — `NIF_CIF`, `SHEET_URL`, `SCRIPT_ID`, `LIBRERIA_VERSION`: específico de cómo Engremiat gestiona SUS clientes de software hoy |
| `39/40_PEDIDO_CLIENTE(+LINEA)`, `41/42_ENTREGA(+LINEA)`, `43_CONTRATO_SERVICIO`, `44_OPORTUNIDAD` | Ciclo comercial completo — venta, contrato, entrega. Específico de un negocio de servicios |
| `15_PROVEEDORES`, `21_PROVEEDOR_MATERIAL`, `25/26_PEDIDO_PROVEEDOR(+LINEA)`, `27/28_RECEPCION(+LINEA)` | Cadena de suministro física — proveedores, pedidos, recepciones |
| `08_MATERIALES`, `09_PRODUCTO_MATERIAL`, `10_TAREA_MATERIAL`, `19_MOVIMIENTO_MATERIAL` | Materiales físicos e inventario — específico de un dominio con producción material |
| `36_CONVOCATORIA`, `31_FUENTE_FINANCIACION` | Subvenciones/financiación externa — específico del modelo de ingresos de este cliente |
| `37_ETIQUETA_IMPACTO` | Frontera: podría alimentar al Vocal Filosófico en cualquier universo, pero tal como está modelada (`CATEGORIA_IMPACTO` libre) es configuración, no núcleo — a revisar cuando haya un segundo dominio real |

---

## 4. Lo que este hallazgo cambia en los documentos anteriores

- **Telar §19.1** (Compromiso aparcado): revisar — el caso real ya existe (`20_EJECUCION_TAREA`). Se puede retomar el diseño de Compromiso contra este esquema real, no contra una hipótesis.
- **Nomenclatura §1** (escala): añadir Producto y Proceso entre Proyecto y Misión.
- **Nomenclatura §6** (ontología): Memoria/Historial, Log de gobierno y Triage local dejan de ser solo nombres — ya tienen esquema real maduro, más completo que lo construido en Telar B3.

---

## 5. La UX real del Sheet — menú, paneles, fichas (analizado sobre `src/` real, no supuesto)

Se localizó el proyecto real de Apps Script (`.clasp.json` de este mismo repo, `src/FormularioMotorUI.js`, función `onOpen()`). No hay que inventar una experiencia nueva para Bastidor — hay que **extraer y renombrar** la que ya existe, probada con datos reales.

### 6.1 La escala real, confirmada en el propio menú

El submenú de navegación se llama, literalmente, `'Campaña → Proyecto → Producto → Proceso → Tarea'` (línea 211 de `FormularioMotorUI.js`). No es una hipótesis que dedujimos de las cabeceras — es el título real del menú. Confirma sin ambigüedad la cadena que ya habíamos corregido en §1.

### 6.2 Dos mecanismos de UI, con un criterio ya claro — no hace falta inventarlo

| Mecanismo real | Cuándo se usa | Ejemplos reales |
|---|---|---|
| **`showSidebar`** (barra lateral) | Vistas de conjunto, quedan abiertas mientras trabajas sobre la hoja | Mapa del sheet (inicio), Panel operativo, Panel de campaña, Panel de clientes, Panel de personas, Panel de recursos, Panel temporal, Panel de ventas, Listado filtrable, Verificar integridad, Informes |
| **`showModalDialog`** (ficha modal) | Trabajo puntual y bloqueante sobre un registro concreto | Ficha de Tarea/Proyecto/Campaña/Producto/Proceso/Persona/Recurso/Material/Proveedor/Incidencia, formularios de creación, Kanban, Mi Trabajo, Importación masiva |

El criterio real ya es: **consultar/vigilar = sidebar persistente; decidir/editar un registro concreto = modal enfocado**. Esto **es** la misma distinción que ya hicimos en Telar entre Archivo Vivo (consultar) y Telar (decidir) — otra convergencia real, no una coincidencia. Propuesta: Bastidor reutiliza este mismo criterio tal cual, sin inventar un tercero. "Ficha" ya es un nombre bueno y real — no hace falta renombrarlo.

### 6.3 Tres niveles de visibilidad reales — no dos

El código ya distingue, con comentarios explícitos:
1. **Núcleo** — siempre visible (Campaña/Proyecto/Producto/Proceso/Tarea, Relación, Asignación — "no es algo desactivable").
2. **Cliente** — visible solo si el módulo correspondiente está instalado (`moduloInstalado_('COMPRAS')`, etc.) — el paquete contratado.
3. **Interno/Operador** — `construirSubmenuAprovisionamiento_` (gestión de otros clientes) y `construirSubmenuDesarrollo_` (herramientas de desarrollo/pruebas): "nunca mezclada con lo que sí ve un cliente", cita real del propio código.

Esto añade un tercer nivel a la Constitución (§2 del documento de nomenclatura) que no teníamos explícito: no solo Núcleo vs. Configurable/Modular — hay una franja **exclusiva del operador**, nunca entregable a ningún cliente por diseño. Bastidor y Consola deben respetar esta misma frontera, ya probada.

### 6.4 Módulos reales confirmados por el propio menú (lista ampliada)

Además de los 10 ya documentados (Ventas, Oportunidad, Cliente, Compras, Gantt, Impacto, Convocatorias, Económico, Comunicación, Aprovisionamiento): **Operativa**, **Seguimiento**, **Ejecución**, **Escenarios**, **Interno** — todos reales, todos con su propia condición `moduloInstalado_()` en el menú.

**Sobre "forma parte del módulo ventas/cliente"**: confirmado — son dos módulos reales distintos que casi siempre se activan juntos (`moduloInstalado_('CLIENTE') || moduloInstalado_('VENTAS')`), no uno solo inventado por mí. El bloque "Específico" de §3 de este documento (`38_CLIENTE`, `39/40_PEDIDO_CLIENTE`, `41/42_ENTREGA`, `43_CONTRATO_SERVICIO`, `44_OPORTUNIDAD`) se etiqueta ahora formalmente como **módulos VENTAS + CLIENTE** (+ OPORTUNIDAD para `44_OPORTUNIDAD` en concreto), con sus nombres reales, no una categoría nueva.

---

## 6. Nivel atómico — cómo se vincula de verdad Bastidor ↔ Sheet ↔ Bóveda

Bajado hasta el código real (`src/Ids.js`, `src/Repository_InsertarRegistro.js`, `src/HistorialService.js`, `src/ReportService.js`). Tres piezas atómicas ya reales, no hay que inventar ninguna arquitectura nueva:

### 6.1 La puerta única de escritura — `insertarRegistroTransaccional`

Todo lo que se escribe en cualquiera de las 55 pestañas de negocio pasa por **una sola función** (`Repository_InsertarRegistro.js`), nunca por escritura directa de celdas:

```
insertarRegistroTransaccional(claveEntidad, datos, opciones)
```

Dentro, `LockService.getScriptLock().waitLock(10000)` envuelve en un único bloqueo atómico: generar el ID (`obtenerSiguienteIdEntidad`) + escribir la fila + registrar el historial. `opciones` ya acepta, hoy, sin tocar nada: `origen`, `correlationId`, `esPrueba`, `pruebaId`. Esta es literalmente la puerta por la que Bastidor tiene que entrar — nunca escribir celdas por su cuenta.

### 6.2 El identificador atómico — `ENTIDADES_MVP`

Cada entidad real tiene un prefijo de 3 letras y una hoja fija (`TAREA` → `TAR-0001`, `DECISION` → `DEC-0001`, `PROYECTO` → `PRO-0001`...) en `src/Ids.js`. `obtenerSiguienteIdEntidadSeguro()` **lanza error a propósito** si se llama fuera de la operación bloqueada — regla explícita: generar el ID y escribir son una sola operación, nunca dos pasos. Bastidor debe leer `ENTIDADES_MVP`, nunca inventar su propio espacio de IDs.

### 6.3 El historial real — `registrarHistorial` (más maduro que lo construido en Telar B3)

Cada escritura real deja una fila en `91_HISTORIAL` con `CORRELATION_ID` (UUID), `ANTES_JSON`/`DESPUES_JSON`, `ORIGEN` y `ES_PRUEBA`/`PRUEBA_ID`. **Convergencia real, no buscada**: el `correlationId` de esta función es el mismo concepto que ya usa el sobre de eventos de Telar B0/B3 (§17.1 del documento de Telar); `ES_PRUEBA` es el mismo concepto que el campo `_fixture: true` que inventamos por separado en los fixtures de Telar B0. Dos diseños distintos llegando al mismo sitio otra vez.

`ORIGENES_HISTORIAL_VALIDOS = ['UI', 'SCRIPT', 'TEST', 'ADMIN', 'N8N']` — **cambio atómico concreto que hace falta**: añadir `'BASTIDOR'` (o `'TELAR'`) a esta lista, una línea. Sin eso, Bastidor no puede escribir de verdad en el Sheet sin mentir sobre su origen.

**Propuesta de vínculo Bastidor→Sheet**: el `correlationId` que ya genera el sobre de eventos de Telar (Tejido→Relevo→Puerta Humana) se pasa tal cual como `opciones.correlationId` al escribir en el Sheet — una sola traza de principio a fin, desde la decisión en Telar hasta la fila real en `91_HISTORIAL`. El `_fixture`/`esPrueba` de Telar se pasa igual como `opciones.esPrueba`.

### 6.4 El puente Sheet→Bóveda — `generarNotaObsidian` (ya real, ya probado)

`ReportService.js`, función `generarNotaObsidian(entidadTipo, entidadId)` — hoy solo `DOCUMENTO`/`DECISION`, probado en real contra `DOC-0001`/`DEC-0001`. Lee la fila, arma una nota Markdown con front-matter YAML (`id`/`tipo`/`estado`/`fecha`) y resuelve los vínculos reales de `18_VINCULO` como wikilinks `[[ID]]` — nunca texto libre para referenciar otra entidad. **Devuelve texto, no escribe ningún fichero** — ahí está el único hueco real.

**Extensión propuesta, barata**: añadir los casos `TAREA`/`PROYECTO`/`CAMPANA` al mismo `switch` — mismo patrón, sin arquitectura nueva.

**El hueco real que cierra el círculo**: falta el "último metro" — quién coge el texto que devuelve `generarNotaObsidian` y lo escribe de verdad en un `.md` de la bóveda. Propuesta: un script que recorra `91_HISTORIAL` (ya filtrable por `ENTIDAD`+`REGISTRO_ID`+`TIMESTAMP`, ya distingue `ES_PRUEBA`) para saber qué cambió desde la última sincronización, y para cada fila real escriba/actualice el `.md` correspondiente — mismo patrón dry-run-por-defecto/`--aplicar` que ya usa `puente_historia_leyes.mjs`. No hace falta comparar el Sheet entero cada vez — `91_HISTORIAL` ya es el changelog fiable.

### 6.5 Las pestañas `STG_*` — la zona de aterrizaje real para carga masiva (decisión 2026-09-02)

No son ruido técnico sin valor conceptual, como se especuló en el §9 anterior: son **el espacio natural para la carga masiva de datos** cuando un cliente real llega a Bastidor con datos ya existentes (una hoja de cálculo propia, un export de otra herramienta) y hay que poblar un universo nuevo sin escribir fila a fila a mano. Esto tiene una consecuencia de diseño concreta que Bastidor tiene que incorporar, no un detalle menor: **la puerta única de escritura (§6.1) sigue siendo la única vía hacia las 55 pestañas de negocio** — una carga masiva nunca escribe ahí directamente. El flujo real sería: (1) los datos del cliente aterrizan tal cual en la `STG_*` correspondiente, sin transformar; (2) un paso de validación/mapeo (candidato real para el mismo patrón de IA controlada del §8.3 — proponer el mapeo de columnas, un humano lo autoriza) convierte cada fila en una llamada real a `insertarRegistroTransaccional`; (3) el historial (§6.3) registra cada una de esas escrituras con `origen` distinguible (candidato: añadir `'CARGA_MASIVA'` a `ORIGENES_HISTORIAL_VALIDOS`, junto al `'BASTIDOR'` ya propuesto). Ninguna pestaña `STG_*` se ha analizado columna a columna todavía — sigue pendiente, pero ya no como "sin valor", sino como el diseño real del onboarding de un cliente nuevo.

### 6.6 Resumen del vínculo de tres espacios

```
Bastidor (Telar)          Sheet real                      Bóveda
   Tejer/Relevo    -->  insertarRegistroTransaccional  -->  (pendiente: script de sincronización)
   correlationId    =    opciones.correlationId              lee 91_HISTORIAL
   _fixture         =    opciones.esPrueba                   llama generarNotaObsidian()
                          registra en 91_HISTORIAL            escribe/actualiza el .md real
```

Baserow y Telegram quedan fuera de este vínculo por ahora, tal como se pidió — se piensan aparte, cuando este triángulo (Bastidor/Sheet/Bóveda) esté cerrado y verificado.

---

## 8. El Bocetador — tldraw + contrato JSON + IA controlada, la capa visual que falta

**Pregunta que lo motiva** (verbatim): no depender indefinidamente de que un generador externo interprete correctamente las reglas de Engremiat. Hoy esa dependencia es real y concreta: `Arquitectura_Nucleo.canvas` (el mapa visual del Núcleo, en el vault) lo escribí yo a mano, JSON directo, sin ninguna herramienta de edición visual ni validación de esquema — cada vez que el Núcleo cambia, alguien tiene que volver a pedírmelo en lenguaje natural y confiar en que lo interprete bien. Eso es exactamente el "generador externo" del que hay que dejar de depender.

### 8.1 Qué es tldraw, en concreto

SDK de canvas infinito para React, código abierto (**[tldraw.dev](https://tldraw.dev/)**, **[repositorio](https://github.com/tldraw/tldraw)**). El dato clave para Engremiat: **cada figura del canvas es un registro JSON** con propiedades base (posición, rotación) más un objeto `props` específico del tipo de figura, y cada tipo de figura se define con una clase `ShapeUtil` propia (render, geometría, comportamiento) — ver **[la documentación de shapes](https://github.com/tldraw/tldraw/blob/main/apps/docs/content/docs/shapes.mdx)**. Esto significa que se pueden crear figuras propias — `FiguraPersonaje`, `FiguraEspacio`, `FiguraMision` — cuyo `props` **es directamente una instancia de los esquemas JSON Schema que Telar ya construyó y validó** (`mision.schema.json`, `participante.schema.json`...), no un formato paralelo inventado para la ocasión. El canvas exporta a JSON de forma nativa, pensado para guardar/restaurar el documento completo por programa.

**Corrección de alcance (2026-09-02)**: el Bocetador **no es la interfaz de ningún juego ni de ningún cliente** — es una herramienta interna, de uso exclusivo del usuario y de mí, para bocetar juntos el diseño y el comportamiento de las herramientas que sí llegan a producción. Esto cambia dos cosas de lo escrito más abajo:

- **Licencia**: tldraw cambió su licencia en septiembre de 2025 (**[nota de licencia](https://tldraw.substack.com/p/license-updates-for-the-tldraw-sdk)**, **[términos](https://tldraw.dev/community/license)**) — en producción (HTTPS, dominio no-localhost) exige clave activa; la vía gratuita ("hobby license") mantiene una marca de agua visible y solo aplica a uso no comercial. Para un uso puramente interno, entre dos personas, la marca de agua es irrelevante — nadie ajeno la ve. La licencia comercial de pago solo entraría en juego si el Bocetador (o algo derivado de él) llegara algún día a ser cliente-facing, cosa que hoy no está planteada. **Deja de ser un coste a presupuestar para esta fase.**
- **Orden respecto al triángulo Bastidor↔Sheet↔Bóveda**: la recomendación de §8.5 de esperar a que ese triángulo funcione en real asumía que el Bocetador sería una fachada de producción. Como herramienta de diseño interna no escribe en el Sheet ni en Baserow — su salida es un contrato JSON validado que el usuario y yo discutimos y refinamos, igual que ya se hizo con el canvas interactivo de la taxonomía del Núcleo (`mapa_universo_engremiat.html`) pero con figuras ligadas de verdad a esquema en vez de HTML suelto. **Puede construirse en paralelo, no tiene que esperar** — ver §8.5 revisado.

### 8.2 El contrato JSON — reutilizar, no inventar

Los cinco esquemas de Telar B0 (`mision`, `participante`, `contribucion`, `evento`, `huella`) ya son el contrato. El Bocetador no necesita un formato nuevo: necesita dos esquemas hermanos que hoy no existen — `espacio.schema.json` y quizá `relacion.schema.json` (para las flechas, hoy solo `label` de texto libre en el `.canvas` de Obsidian) — construidos con la misma disciplina (JSON Schema 2020-12, validados con ajv, `_fixture: true` para los de prueba) que ya probó B0.

### 8.3 IA local o proveedor controlado — el patrón ya existe, se llama Telar B2

Esto ya está construido y verificado, no hay que inventarlo: `telar/b2/deliberar_b2.mjs` llama a DeepSeek con `response_format: json_object`, valida la respuesta contra el esquema real con ajv y reintenta una vez pasándole el error como feedback si falla. **El Bocetador reutiliza exactamente ese patrón**, no uno nuevo: el operador dibuja aproximadamente (cajas, flechas, texto suelto), y un paso de IA —local (Ollama/`devstral-dev`, ya el worker por defecto — ver [[proyecto_worker_local_devstral]]) o controlado (DeepSeek, mismo criterio de coste que ya registra `GASTO_API`)— propone a qué tipo de figura corresponde cada trazo y rellena los campos obligatorios del esquema. Nunca genera libremente: **solo completa un contrato ya fijado**, y el resultado pasa por la misma Puerta Humana constitucional (Sugerir→Inspeccionar→Autorizar) antes de aceptarse. La investigación externa confirma que esto es la práctica estándar 2026 para IA local fiable: desde Ollama 0.3.0, pasar un JSON Schema al parámetro `format` restringe la propia inferencia token a token — "ni una marca de código, ni texto explicativo, ni artefactos a medio pensar" (**[guía de salida estructurada](https://towardsdatascience.com/structured-output-with-local-llms/)**, **[grammars y JSON mode 2026](https://localaimaster.com/blog/json-mode-grammars-guide)**) — coste de rendimiento 5-15%, a cambio de 100% de salidas válidas contra el esquema. La comparación real de llamada a herramientas confirma el patrón mixto que ya sigue este proyecto (DeepSeek para lo fino, local para lo frecuente/privado): modelos locales igualan a los de nube en precisión de una sola llamada, pero se autocorrigen peor cuando algo falla (**[evaluación de Docker](https://www.docker.com/blog/local-llm-tool-calling-a-practical-evaluation/)**) — razón de más para que el reintento-con-error-como-feedback que ya usa B2, no el modelo, sea quien controle los reintentos.

### 8.4 El encaje real con Bastidor

No es una herramienta nueva y suelta — cierra un hueco concreto que §6 ya dejó abierto:

- **`SOLICITUDES_MONTAJE`** (§2, ya identificado como el mecanismo real de "petición de nacimiento de universo") hoy se rellena a mano en el Sheet. El Bocetador sería su interfaz visual real: el cliente dibuja qué Espacios/Personajes/módulos quiere, y ese boceto —una vez autorizado— **es** la solicitud, en el mismo formato que ya entiende `insertarRegistroTransaccional` (§6.1).
- El boceto autorizado nunca guarda su propio estado persistente — llama a la misma puerta única de escritura que todo lo demás (§6.1), con el mismo `correlationId`/`esPrueba` (§6.3). Esto es a propósito: si el Bocetador mantuviera su propia copia de la verdad, reintroduciría exactamente el problema de fragmentación de "misma verdad en tres espacios" que el vínculo atómico de §6 existe para evitar. Sería un cuarto espacio con su propia verdad, no un cuarto testigo de la misma.
- Al reabrir el Bocetador, el canvas se reconstruye leyendo el estado real (Sheet + notas de `Archivo_Vivo/` vía `generarNotaObsidian`, §6.4) — nunca desde un fichero local del Bocetador. El canvas es una vista, no un almacén.
- Sustituye, a medio plazo, la edición manual de `Arquitectura_Nucleo.canvas` — el mismo Núcleo, pero editado con figuras validadas contra esquema en vez de bloques de texto escritos por mí.

### 8.5 Coste y orden — revisado tras la corrección de alcance

Sigue siendo una inversión de ingeniería real (una app React con SDK propio, figuras custom por cada tipo de entidad) — eso no cambia. Lo que sí cambia es la dependencia: al ser herramienta interna de diseño, no de producción, **no necesita esperar a que el triángulo del §6 esté cerrado en real** — su salida no toca el Sheet ni Baserow directamente, la usamos el usuario y yo para fijar contratos antes de que se implementen. Orden propuesto, revisado: (1) construir `espacio.schema.json`/`relacion.schema.json` con fixtures, como ya se hizo en B0 — eso es prerrequisito real, no el triángulo; (2) un prototipo mínimo del Bocetador con una sola figura (`FiguraEspacio`) contra ese esquema; (3) usarlo primero para el propio Núcleo — bocetar juntos `Arquitectura_Nucleo.canvas` de nuevo, esta vez con figuras validadas en vez de bloques de texto escritos a mano — antes de extenderlo a diseñar otras herramientas.

### 8.6 Prototipo real (2026-09-02)

Los tres pasos de arriba ya están hechos, no solo propuestos. Construido y verificado en el navegador: `tools/gobierno/bocetador/app/` (Vite + React + tldraw 5.4.0). Seleccionar una figura abre un formulario real ligado a `shape.meta` (desplegables cerrados al mismo vocabulario del esquema — capa, variabilidad, tipo de relación —, así que la UI misma impide un valor inválido). "Exportar y validar" arma el JSON real y avisa de campos obligatorios ausentes. Corre solo en local (`npm run dev`, sin necesidad de licencia de tldraw, que solo aplica en producción). Ver `tools/gobierno/bocetador/app/README.md`.

### 8.7 De cajas inventadas a la bóveda real (2026-09-02, mismo día)

El usuario preguntó, con razón, si el boceto inicial podía reaprovechar lo ya construido (Sheet, Baserow, Obsidian) en vez de partir de las 4 cajas escritas a mano para el prototipo. Investigado a fondo: **la bóveda de Obsidian ya es, sin que nadie la diseñara para esto, una base de datos real y uniforme.** Cada ficha de `01_Mundo/Espacios/`, `01_Mundo/Recursos/`, `01_Mundo/Modulos/`, `02_Personajes/`, `08_Oficios/` y `03_Reglas/` comparte el mismo front-matter (`title`/`tipo`/`estado`/...) y una sección `## Relaciones` con wikilinks — y `07_Holon_Relaciones/` es, literal, una carpeta de 18 ficheros de relación reales, cada uno con `tipo_relacion`/`origen` en el front-matter.

**Hallazgo que corrige el propio §8.2**: el vocabulario cerrado de `relacion.schema.json` se había construido a partir de solo 3 aristas de `Arquitectura_Nucleo.canvas` — pero `07_Holon_Relaciones/` ya usaba en real un vocabulario más rico y anterior (`activa_a`, `alimenta_a`, `corrige_a`, `depende_de`, `gobierna_a`, `opera_en`, `parte_de`, `verifica_a`). Corregido: el esquema ahora es la unión de las dos fuentes reales, no solo la del canvas.

**Segundo hallazgo, honesto**: `01_Mundo/Espacios/` (9 fichas: Baserow, El Sheet, El Vault, Headscale, n8n, VPS y Tailscale, La fragua protegida, El ciclo de vida remoto, Telar) es una capa distinta de la de los 4 Espacios abstractos del Núcleo (Consola/Telar/Archivo Vivo/Plaza) — solo "Telar" coincide en las dos. Una es infraestructura narrada, la otra es taxonomía abstracta; no están reconciliadas todavía, y este documento no lo resuelve aquí a propósito.

**Tercer hallazgo**: los `gobernadoPor` de los fixtures de Espacio (§8.2) referenciaban leyes inventadas (`ley_autoridad_humana`...) que no corresponden a ningún fichero real — corregido para apuntar a las 5 reglas reales que sí existen en `03_Reglas/` (`Puerta Humana`, `Honestidad del fallo`...), o a un array vacío cuando no hay ficha real que lo respalde todavía.

**Construido**: `tools/gobierno/bocetador/cargar_desde_vault.mjs` (solo lectura, nunca escribe en la bóveda) recorre esas seis carpetas y genera un paquete real de 63 nodos + 18 relaciones. La app lo carga con **"Cargar Universo real"**, organizado espacialmente por columnas — una por tipo, reutilizando la propia taxonomía de carpetas del vault como criterio de orden, sin inventar uno nuevo. Verificado en el navegador: carga sin errores, 15/18 relaciones se dibujan (3 apuntan a un grupo descriptivo sin caja propia — avisado en pantalla, no perdido en silencio), seleccionar un nodo de cualquier tipo abre su panel con el resumen real extraído del cuerpo de la ficha. Ver `tools/gobierno/bocetador/app/README.md`.

---

### 8.8 Personalización real e inspiración externa — investigación (2026-09-02)

Pregunta que la motiva: qué posibilidades reales de personalización tiene tldraw para esto, y qué proyectos reales ya existen que hagan algo parecido a "bocetar universos" arrastrando y soltando.

**A. tldraw ya resolvió, dos veces, el mismo problema que se le está pidiendo al Bocetador.** "Make Real" —bocetar una interfaz y pulsar un botón para obtener una web real funcionando, usando GPT-4 con visión, en una conversación iterativa de marcado+captura ([blog oficial](https://tldraw.dev/blog/make-real-the-story-so-far), [charla de Steve Ruiz](https://gitnation.com/contents/make-real-tldraws-ai-adventure))— y "tldraw computer": **colocar nodos en el lienzo (texto, imagen, prompt), conectarlos con flechas, y al pulsar "run" un LLM lee el diagrama** ([Google AI showcase](https://ai.google.dev/showcase/tldraw), [Hack Science](https://www.hackscience.education/the-computer-you-draw-inside-tldraws-natural-language-os/)). Esto es, literalmente, la misma forma que ya tiene el Bocetador (Espacio/Relación como nodos + relleno con IA restringida) — no es una idea rara que hay que justificar desde cero, es el patrón insignia del propio tldraw. La [documentación oficial de integraciones de IA](https://tldraw.dev/docs/ai) distingue tres patrones: *canvas como salida* (mostrar contenido generado), *flujos visuales* (nodos donde la IA participa del flujo de datos — donde está el Bocetador hoy) y *agentes de IA* (el modelo lee y escribe el lienzo directamente, con permiso) — un techo real al que crecer más adelante, siempre detrás de la Puerta Humana.

**B. `@tldraw/sync` — multijugador real, autoalojable.** Capa de sincronización oficial, ligera, pensada para autoalojarse ([kit de arranque multijugador](https://tldraw.dev/starter-kits/multiplayer), [documentación de colaboración](https://tldraw.dev/sdk-features/collaboration)). Encaja con el mismo criterio de mínimo privilegio ya usado en todo el VPS este mismo día (atado solo a Tailscale, nunca `0.0.0.0`): desplegado ahí, dejaría de ser "tú lo abres, yo lo reviso por separado y te lo cuento por chat" y pasaría a ser una pizarra viva de verdad. **Coste honesto**: las figuras personalizadas en multijugador exigen mantener sincronizados el esquema del cliente y el del servidor a la vez — no es gratis, es mantenimiento real añadido.

**C. De `shape.meta` a figuras propias.** Hoy el Bocetador usa `shape.meta` sobre figuras nativas (rectángulo/flecha) — cero boilerplate, funcionando ya en real, pero las flechas no están *ligadas* de verdad a las cajas (mover una caja no arrastra su flecha). tldraw redujo en 2026 el boilerplate real para tipos de figura y de vínculo (`binding`) propios, con tipado. El salto disponible: una `EspacioShapeUtil`/`RelacionBindingUtil` de verdad — flechas ligadas, y el formulario de edición podría vivir directamente sobre la figura en el lienzo, no solo en el panel lateral.

**D. Lo que ya existe en la industria adyacente — la validación más fuerte de esta investigación.** [**articy:draft**](https://www.articy.com/en/) es la herramienta real detrás de *Disco Elysium*: mapea narrativas ramificadas, diálogo complejo y worldbuilding sobre una base de datos de contenido unificada, colaborativa multi-usuario. [**Arcweave**](https://blog.arcweave.com/top-10-tools-for-narrative-design) es su equivalente en el navegador, en tiempo real: **conecta personajes, lugares y elementos de trama con nodos para representar sus interacciones y dependencias** — Espacio/Personaje/Relación, con otro nombre, ya construido y en uso real por estudios de videojuegos. Esto no es una curiosidad: **valida que la estructura elegida para Engremiat no es una invención rara** — es el mismo patrón que un sector entero de herramientas profesionales de diseño narrativo ya usa a escala real. Lo que Arcweave tiene y el Bocetador no (todavía): variables y ramas condicionales sobre el propio grafo — relevante el día que el Bocetador necesite expresar lógica, no solo estructura, algo deliberadamente fuera de alcance por ahora.

**Propuesta de orden, generosa pero honesta sobre el coste de cada paso:**

1. *(ya hecho)* Nodos y relaciones reales cargados desde la bóveda, con columnas por tipo.
2. `EspacioShapeUtil`/`RelacionBindingUtil` propias — flechas ligadas de verdad, edición sobre la propia figura.
3. Botón **"Sugerir con IA"**: reutiliza exactamente el patrón ya construido y verificado en Telar B2 (JSON mode + validación ajv + reintento con feedback) y el gateway LiteLLM ya propuesto en `PROPUESTA_ECOSISTEMA_CONECTADO_ENGREMIAT.md` — nunca generación libre, siempre relleno de un contrato ya fijado, siempre Puerta Humana antes de aceptar. Es el patrón "flujos visuales" de tldraw, con la disciplina constitucional de Engremiat encima.
4. `@tldraw/sync` autoalojado en el VPS — recién entonces "tú y yo" (o tú y otra persona real) dibujando de verdad en la misma pizarra a la vez, no por turnos y capturas de pantalla.

No se ha construido nada de esto todavía — es la propuesta, no la ejecución. El paso 1 ya está hecho; los pasos 2-4 son coste real de ingeniería, no una tarde.

### 8.9 Flechas ligadas de verdad, y la paleta completa de figuras (2026-09-02, profundización)

**Lo dinámico, resuelto en real.** La queja era exacta: las flechas de "Cargar Núcleo/Universo real" tenían coordenadas fijas, no estaban *ligadas* — mover una caja dejaba la flecha atrás. Investigado el tipo real `TLArrowBindingProps` de tldraw (`terminal: 'start'|'end'`, `normalizedAnchor`, `isExact`, `isPrecise`, `snap`) y el método real `editor.createBindings(...)`: no hacía falta ninguna `BindingUtil` propia — tldraw ya tiene un binding nativo de tipo `'arrow'` para esto, el mismo que usa cuando dibujas una flecha a mano y la sueltas sobre una caja. Corregido: cada relación cargada ahora crea también dos bindings reales (uno por extremo). Probado en real: arrastrar "Consola" y la flecha "gobierna" la sigue.

**La paleta, construida.** Seis botones reales (`+ Espacio`, `+ Personaje`, `+ Recurso`, `+ Módulo`, `+ Herramienta`, `+ Regla`) colocan una caja en blanco, ya con el tipo correcto, lista para rellenar en el panel — probado en real (`+ Personaje` crea la caja verde, el panel "Personaje" se abre solo). Una Relación no se crea desde la paleta: se dibuja con la herramienta de flecha nativa y se suelta sobre dos cajas, mismo mecanismo que ya liga las cargadas por código.

**La paleta completa de figuras — investigación como experto en Engremiat, no inventada.** Cada figura propuesta ya existe como concepto real en algún sitio (Telar, la taxonomía del Núcleo, o la propia bóveda) — la paleta no añade ningún concepto nuevo, solo le da una forma dibujable a lo que ya había.

| Figura | Fuente real | Estado |
|---|---|---|
| **Espacio** | `espacio.schema.json` (§8.2) | Real, con esquema propio |
| **Relación** | `relacion.schema.json`, vocabulario de 16 tipos (canvas + `07_Holon_Relaciones/`) | Real, ahora con binding real |
| **Personaje** | `participante.schema.json` de Telar (`actorId`/`participantType`: human\|ai\|system/`roleId`) + las familias reales de `PROPUESTA_NOMENCLATURA_UNIVERSO_ENGREMIAT.md` §6 (Vocal de contenido, Guardián, Gobierno-protocolo, Oficio, Acompañante) | En la paleta como nodo genérico (`vaultNode`); **falta** un `personaje.schema.json` propio que una las dos fuentes — pendiente, no inventado aquí |
| **Recurso** | `01_Mundo/Recursos/` real (`GASTO_API`, `92_BUS_TRABAJO`) | En la paleta, informativo |
| **Módulo** | `01_Mundo/Modulos/` real (17 fichas: CORE + acoplables) + `MODULO_POR_ENTIDAD_MVP` real de `src/Ids.js` (§5.4) | En la paleta, informativo |
| **Herramienta** (Oficio-mecanismo) | `08_Oficios/` real (11 fichas: Bus de trabajo, Cerrar ciclo...) — **distinto** de Personaje-Oficio (Ejecutor/Coordinador, un rol con voz narrativa, no un script) | En la paleta, informativo |
| **Regla** | `03_Reglas/` real (5 fichas) | En la paleta, informativo |
| **Misión** (candidata, no construida) | `mision.schema.json` de Telar, ya con `jerarquia` (§9) — el corazón real de Telar, con 14 estados posibles | Propuesta: figura con forma distinta (rombo, no rectángulo) cuyo color siga `missionStatus`, igual que ya hace la Consola de salud (§ecosistema) con "sincronizado hace X" |
| **Entidad de módulo** (candidata, no construida) | Dominio comercial de un módulo activo (Cliente/Oportunidad/Proveedor...) — capa "específico", nunca núcleo | Propuesta: una figura genérica con `moduloQueLoHabilita` obligatorio, nunca su propio tipo de figura por entidad — mismo principio de no multiplicar tipos que ya rige el resto |

**Cómo se personaliza sin romper el núcleo — mismo criterio ya fijado, no uno nuevo.** El documento de nomenclatura ya resolvió esto en su §7 (mecanismo para añadir Vocal/Oficio, deliberadamente no completamente especificado, exige consentimiento sociocrático, nunca un tipo de figura nuevo en código por capricho). Trasladado al Bocetador: una figura "personalizada" nunca es un tipo de código nuevo — es una instancia de una de las familias base (Espacio/Personaje/Recurso/Módulo) con datos propios y, si es específica de un módulo, un `moduloRequerido` que la ata a esa activación. Es la misma disciplina que ya impide escribir un `tipo` de relación inventado — aplicada ahora a figuras.

### 8.10 Paleta de relaciones (2026-09-02, misma tarde)

Pedido directo: una paleta de "recursos relacionales" para no tener que dibujar la flecha a ciegas y luego elegir el tipo. Construida: los 16 tipos reales, agrupados por familia (Gobierno/Estructura/Flujo/Verificación/Memoria/Acompañamiento — la misma agrupación de §8.9). Elegir uno lo "arma" y cambia la herramienta activa a flecha; la siguiente flecha que el usuario suelte sobre dos cajas se etiqueta sola — sin pasar por "Convertir en Relación" + desplegable. La resolución de `origenId`/`destinoId` usa los mismos bindings reales del §8.9 (nunca coordenadas), leyendo el `meta.id` semántico de cada caja, no el id interno de tldraw. Probado en real: armar `verifica_a`, dibujar sobre dos cajas del Núcleo, seleccionar la flecha resultante — panel de Relación ya con el tipo correcto y origen/destino reales resueltos.

### 8.11 La tarjeta de Espacio, honesta sobre lo que le faltaba (2026-09-02, misma tarde)

Pregunta directa: ¿la tarjeta de Espacio es de verdad espejo del Sheet y de la ficha `.md`? Respuesta honesta: no del todo, tenía huecos reales.

**Lo que faltaba:**
- `estado` — cada ficha real del vault lo tiene en el front-matter; el Bocetador lo leía al cargar pero el formulario de Espacio nunca lo mostraba ni dejaba editarlo. Una caja nueva creada en el Bocetador no tenía estado en absoluto.
- El resumen real del cuerpo de la ficha no tenía campo propio — "Propósito" hacía ese papel a medias, pero es una pregunta distinta (por qué sirve, no qué es).
- Ningún vínculo con un sistema real (Sheet/Baserow/VPS) — a diferencia de Misión (que ya tiene `origenes` en Telar), Espacio no podía decir "esto corresponde a esta tabla/pestaña real".

**No hacía falta inventar un marco de preguntas para ordenar esto — ya existe uno real.** `00_Mapa.md` (ya escrito, no de esta sesión) organiza *todo* el universo en ocho piezas, "mismo esqueleto que las 8 preguntas reales del Sheet: Qué/Quién/Dónde/Con qué/Cuándo/Cómo/Cuánto/Por qué" — y ya asigna Espacios a la pregunta *Dónde* explícitamente. Aplicado ahora a la tarjeta: cada campo del formulario lleva la pregunta a la que responde como etiqueta visible, así el propio orden del formulario enseña la metodología en vez de ser una lista plana.

**Corregido en real**: `espacio.schema.json` gana `estado` (ahora obligatorio), `resumen`, y `vinculoReal` (mismo shape que `origenes` de `mision.schema.json` — un solo patrón de vínculo real en todo Engremiat, no dos). Los 4 fixtures actualizados y re-verificados (`validar_bocetador.mjs`, 4/4 OK) — de paso, corregido un último `ley_modularidad_subordinada` inventado que quedaba en el fixture de Taller (mismo bug de §8.7, se me había pasado uno). Probado en real: exportar el Núcleo cargado muestra `estado`, `resumen` y `vinculoReal` (`{"sistema":"repo","recordId":"tools/gobierno/telar/"}` para Telar) en el JSON real.

**Sobre "plantillas reutilizables"**: la idea de fondo (una plantilla por tipo de figura, sincronizada con las vistas reales) es correcta y es exactamente lo que ya hace `espacio.schema.json` — cada figura ES su plantilla, en JSON Schema real, no en código de formulario suelto. Lo que falta para que el resto de figuras (Personaje, Recurso, Módulo, Regla, Herramienta) tengan la misma disciplina es construirles su propio esquema, con el mismo criterio de las 8 preguntas — pendiente, no resuelto en esta pasada, para no inventar campos sin datos reales de por medio, mismo criterio que ya se aplicó a Espacio.

### 8.12 Personaje y Recurso, con esquema real -- y por qué Módulo/Regla/Herramienta no lo tienen todavía

Investigación real en el Sheet (`142vRqXfDj4C7KyY7TVf5Oh18gwtDcvAkYxFQ0lb6CGQ`), no supuesta: leídas las cabeceras reales de `11_PERSONAS_EQUIPOS`, `16_ASIGNACION`, `22_EQUIPO_MIEMBRO`, `23_RECURSO`, `08_MATERIALES`, `15_PROVEEDORES` y `12_DECISIONES`.

**Personaje** — construido y verificado. `personaje.schema.json` es espejo real de dos fuentes a la vez: `02_Personajes/*.md` del vault (title/tipo/estado) y `11_PERSONAS_EQUIPOS` del Sheet (`ROL`/`CAPACIDAD_SEMANAL_DIAS`/`DISPONIBILIDAD`/`COORDINADOR_ID`/`ESTADO`) — extiende `participante.schema.json` de Telar (`tipo` juega el papel de `participantType`) sin inventar un segundo vocabulario. 2 fixtures reales (`Acervo Lógico`, `Coordinador`), verificados.

**Recurso** — construido, pero con una distinción honesta que casi se me escapa: `01_Mundo/Recursos/` del vault (`GASTO_API`, `92_BUS_TRABAJO`) y `23_RECURSO`/`08_MATERIALES` del Sheet **no son la misma cosa** — los primeros son recursos operativos/de gobierno, los segundos físicos/de negocio. `recurso.schema.json` los distingue con `clase` (`operativo_gobierno` | `fisico_negocio`) en vez de forzar una equivalencia falsa. **Hallazgo real de paso**: `23_RECURSO` tiene cabeceras pero **cero filas de datos reales** hoy (verificado con `sheets_get_values`) — resuelve parcialmente la pregunta pendiente del §9 original ("no se ha leído ninguna fila de datos"): al menos esta pestaña está genuinamente vacía, no solo sin leer. El fixture del recurso físico queda marcado explícitamente como ilustrativo por esto mismo, no copia ninguna fila real porque ninguna existe.

**Por qué Regla se queda sin esquema por ahora**: `12_DECISIONES` del Sheet parecía el candidato obvio, pero no lo es — `12_DECISIONES` son decisiones de proyecto concretas (más cerca del `decision_humana` de una Misión de Telar), mientras `03_Reglas/*.md` son principios de gobierno del universo entero. Son primos lejanos, no la misma entidad con dos nombres. Construirle un esquema a Regla forzando esa equivalencia sería inventar un espejo que no existe — se queda pendiente, honestamente, hasta que haya un dato real que lo respalde.

**Módulo y Herramienta, igual de honesto**: Módulo no tiene pestaña propia en el Sheet — vive como `MODULO_POR_ENTIDAD_MVP` en `src/Ids.js` (código real, no filas) y como 17 fichas reales en `01_Mundo/Modulos/`. Herramienta (`08_Oficios/`) son scripts reales (`tools/gobierno/*.mjs`), no registros de ninguna base de datos. Ninguno de los dos tiene today un "Sheet real" que espejar de la misma forma que Personaje/Recurso — quedan con la representación ligera (`vaultNode`) que ya tenían, hasta que haya un caso real que justifique más.

### 8.13 El camino de vuelta: del boceto aprobado al Sheet, la bóveda y Baserow

Pregunta directa del usuario: si aprobamos un cambio en el Bocetador, ¿podemos actualizar el Sheet, la bóveda y Baserow? Sí, pero con un límite de seguridad real que no es negociable, y que ya está implícito en todo lo construido esta sesión.

**El límite**: el Bocetador es una app que corre en el navegador, sin backend propio. Un navegador **nunca** debe guardar la clave de servicio de Google (JWT), el token de Baserow, ni escribir directamente en el disco de la bóveda — cualquiera de las tres cosas, hechas desde código que se sirve al navegador, expondría la credencial a quien abra las herramientas de desarrollador. Esto no es una limitación de este proyecto en particular: es la misma razón por la que `sincronizar_boveda.mjs`, `cerrar_ciclo.mjs` y todo lo demás construido esta sesión son **scripts de Node que corren en la máquina del operador**, nunca código de navegador.

**La forma real de cerrar el círculo, entonces, es la misma disciplina de siempre — un script nuevo, no una excepción**: `tools/gobierno/bocetador/aplicar_boceto.mjs` (propuesto, no construido en esta pasada):

1. Lee el `boceto.json` que "Exportar y validar" ya descarga desde el navegador (§8 — el punto de entrega real entre el navegador y la máquina del operador, ya existe).
2. Valida contra los esquemas reales (misma función que ya usa `validar_bocetador.mjs`, reutilizada, no reescrita).
3. **Dry-run por defecto** (mismo patrón que cada script de esta sesión): imprime exactamente qué fila nueva o actualizada iría a `insertarRegistroTransaccional` (Sheet, vía el webhook real), qué fila a Baserow (vía su API real), y qué ficha `.md` se escribiría/actualizaría en la bóveda (mismo patrón que `generarNotaObsidian`) — nada se toca todavía.
4. `--aplicar` escribe de verdad, en los tres sitios, con el mismo `correlationId` en los tres (mismo criterio que §6.3) para poder rastrear un solo cambio del Bocetador a través de las tres superficies.

**Por qué esto no se construye hoy**: escribir en el Sheet y Baserow reales de producción es una acción de mayor riesgo que todo lo hecho hasta ahora en el Bocetador (que hasta este punto es de solo lectura, cero riesgo de romper nada real) — merece su propia autorización explícita y su propia sesión de pruebas, no colarse como un efecto secundario de una tarde dedicada a la pizarra. Queda como el siguiente paso concreto, con el diseño ya fijado.

### 8.14 Módulo y Herramienta, con esquema real (2026-09-02, misma tarde)

Resuelto lo que el §8.12 dejaba honestamente pendiente: `modulo.schema.json` (enum cerrado a los 12 módulos reales de `MODULO_POR_ENTIDAD_MVP` en `src/Ids.js` -- CORE + los 11 nombrados, leído del código real, no supuesto) y `herramienta.schema.json` (espejo de `08_Oficios/*.md` + el script real correspondiente en `tools/gobierno/*.mjs`). Los dos usan `vinculoReal` con `sistema: "codigo"` o `"repo"` en vez de `"Sheet"` -- honesto sobre que su fuente de verdad es código versionado, no una fila. 4 fixtures reales (`COMPRAS`, `CORE`, `Bus de trabajo`, `Cerrar ciclo`), verificados junto a los demás: **`validar_bocetador.mjs` ahora comprueba 7 tipos de figura, 16 fixtures, GATE: APROBADO**.

### 8.15 Encontrar huecos de verdad -- estructura del Sheet, sin credenciales en el navegador

El usuario aclaró la intención real detrás de "actualizar Sheet/bóveda/Baserow desde el Bocetador aprobado": no es que el navegador escriba con credenciales -- es que el Bocetador pueda **ver la estructura real** (pestañas y cabeceras, nunca filas de datos) para que el operador, trabajando con el Sheet/Obsidian/Baserow/Bocetador/Claude abiertos a la vez, pueda detectar huecos en cualquier dirección: una columna que existe en el Sheet y no tiene espejo en la bóveda, o una figura nueva en el Bocetador que debería convertirse en columna real del Sheet.

Construido, respetando el mismo límite de seguridad de siempre (la lectura corre en Node, en la máquina del operador, nunca en el navegador):

- **`cargar_estructura_sheet.mjs`** -- lee las 70 pestañas reales del Sheet y su fila de cabeceras (un solo `batchGet`, nunca las filas de datos), marca cada una `negocio` o `utilidad` (`STG_*`, `9X_*`). Verificado en real: 46 pestañas de negocio, 24 de utilidad, ninguna sin cabeceras.
- **`encontrar_huecos.mjs`** -- cruza esa estructura contra los `vinculoReal` ya declarados en los fixtures del Bocetador. Resultado real, sin maquillar: **2/46 pestañas de negocio con espejo declarado hoy** (`11_PERSONAS_EQUIPOS`, `23_RECURSO`), **44/46 todavía sin ninguno** -- un mapa honesto de cuánto queda, no un logro a esconder. El informe deja claro que no todo hueco importa igual (muchas son tablas de relación/plumbing, no entidades de dominio) -- es un mapa, no un veredicto.

**Pendiente real, no resuelto aquí**: hacer lo mismo con Baserow (solo se conocen 2 tablas reales, `GASTO_API`=285 y la "núcleo soberano" TAREA=278 -- listar el resto exige la API de workspace de Baserow, no usada todavía en este proyecto). Y wire el resultado de `encontrar_huecos.mjs` dentro de la propia app del Bocetador (hoy es un informe de terminal, no una sección visual) -- construible con el mismo patrón que `universo_real.json`, no resuelto en esta pasada por tiempo, no por dificultad.

### 8.16 Graphify -- relaciones en código puro, investigado, integración honesta pendiente

Pedido: que el Bocetador conozca también las relaciones reales en código puro (Graphify), para que un operador nuevo tenga una imagen global real, no solo narrativa/de datos. Investigado el `graph.json` real (`tools/graphify/`): **1585 nodos reales, 4665 relaciones `calls` reales**, extraídas por AST, no adivinadas.

**Por qué no se carga tal cual**: es la escala equivocada para el Bocetador. 1585 cajas reventarían cualquier lectura visual -- justo lo contrario del trabajo de ordenar hecho en §8.9/§8.10. Se comprobó la vía obvia de agrupar (por fichero fuente) y no sirve: **los 1585 nodos vienen de un solo fichero concatenado** (`engremiat-repo-live.concat.js`, el build, no el código fuente real disperso). La vía real que sí existe es la detección de comunidades que Graphify ya calcula (`community`, 96 comunidades reales) -- pero esas comunidades son clusters numéricos sin nombre de dominio todavía; convertir "comunidad 7" en "esto es del módulo VENTAS" exige un paso de etiquetado real (qué funciones caen en cada comunidad, a qué módulo pertenecen esos ficheros de origen) que no se ha hecho.

**Corrección real, misma tarde**: el propio visor ya construido (`graphify-out/graph.html`, con `vis-network`) **ya resuelve la segmentación en mini-grafos** que parecía pendiente -- tiene un panel real de 81 comunidades, cada una con su checkbox, "Select All"/individual, más buscador de nodos y panel de inspección al hacer clic. No hacía falta escribir `etiquetar_comunidades_graphify.mjs` para esto -- ya existe, solo había que encontrarlo y desplegarlo donde se pudiera usar de verdad.

**Desplegado en real, 2026-09-02**: `tools/gobierno/graphify_visor/` -- contenedor `node:22-alpine` + `serve`, atado solo a Tailscale (`100.107.171.88:9320`), mismo criterio de mínimo privilegio de siempre. Nace de un choque real de puertos: el operador tenía Docker local con `open-webui` ya ocupando el puerto 3000, y el intento de abrir el grafo localmente chocó ahí -- en vez de pelear por puertos locales, se saca del portátil, igual que Portainer/Headplane/Grafana ya salieron antes. Verificado con curl (HTTP 200) y en el navegador: **1587 nodos, 4668 aristas, 81 comunidades reales**, panel de comunidades funcionando.

**Sigue pendiente, honesto**: cruzar cada comunidad contra `MODULO_POR_ENTIDAD_MVP` para que el nombre de la comunidad sea "COMPRAS" en vez de un número o una función representativa -- el visor ya permite aislar comunidades, pero no sabe todavía a qué módulo real de negocio pertenece cada una. Y la integración con n8n (ver el propio flujo de un workflow real como otra capa de relaciones) tampoco está hecha -- pedida por el usuario como valor añadido, no investigada todavía en esta pasada.

### 8.17 Leyenda de la paleta -- para que un operador nuevo (humano o IA) no dependa de leer el JSON Schema

Construida: cada figura base de la paleta lleva ahora una leyenda real y visible en el propio Bocetador (desplegable, no un tooltip que se pierde) -- la pregunta de las 8 a la que responde, qué es en una frase, y explícitamente **qué NO es** (la confusión más probable con la figura vecina: Espacio vs. Recurso, Personaje vs. Herramienta, Regla vs. Decisión de proyecto). El texto no se inventó aparte -- es la misma disciplina que ya llevan las `description` de cada `schemas/*.json`, solo hecha visible sin tener que abrir un fichero. Objetivo explícito del usuario: que cualquier operador técnico u otra IA que llegue al proyecto pueda formarse una imagen realista y global de Engremiat mirando la propia herramienta, no leyendo seis documentos aparte primero.

### 8.18 La segunda vista real, construida el mismo día: la capa Node

Respuesta real a "necesitamos construir todas las piezas en Graphify": no con el mismo motor -- Apps Script no tiene `import`/`export` real (por eso Graphify necesita concat + AST), los 44 scripts de `tools/` sí son módulos ES reales, así que un extractor mucho más simple y honesto basta. Construido y desplegado:

- **`mapear_grafo_node.mjs`** -- solo lectura. Recorre los 44 `.mjs` reales de `tools/`, extrae imports internos reales (regex sobre `import ... from`, solo relativos cuentan como arista) y detecta toques externos reales por patrón de texto (`sheets.googleapis.com`→Sheet, `BASEROW`→Baserow, ruta real del vault→Vault, IP real del VPS→VPS) -- nunca inventado, solo lo que el propio fichero dice. Reutiliza el `que_hace` (o `que_compara`/`que_muestra`, el registro no es uniforme en el nombre del campo -- encontrado y corregido en real) ya escrito en `tools/registro_ecosistema.json`, no inventa una descripción nueva.
- **Resultado real**: 44 ficheros, **solo 6 imports internos** -- hallazgo honesto en sí mismo: a diferencia del Apps Script (4668 aristas, muy acoplado), la capa Node es deliberadamente independiente, cada script funciona solo. Tocan Sheet 10, Baserow 15, la bóveda 4, el VPS 10.
- **`nodejs.html`** -- segunda vista real, mismo `vis-network` que ya usa el visor de Graphify, desplegada junto a la primera en el mismo contenedor del VPS: `http://100.107.171.88:9320/nodejs.html`. Verificado en el navegador: nodos coloreados por sistema real que tocan, clic en un nodo muestra su ficha real (ruta, sistemas, descripción real del registro).

**Encontrado y corregido en real durante la propia construcción**: la primera versión no encontraba el `que_hace` de varios ficheros porque `tools/registro_ecosistema.json` usa nombres de campo distintos según la sección (`que_hace` en unos, `que_compara` en otros) -- corregido para comprobar los tres.

**Caveat honesto, no escondido**: el propio `mapear_grafo_node.mjs` se marca a sí mismo como "toca la bóveda" -- falso positivo real, porque su propio patrón de detección (la cadena de texto `Obsidian-Engremiat`) aparece en su código fuente al buscarla, no porque el script use de verdad esa ruta. Con solo 44 ficheros es fácil de ver a simple vista y no vale la pena una solución más compleja para un caso así.

**Lo que sigue sin resolver**: un grafo verdaderamente unificado (Apps Script + Node + bóveda + Sheet, un solo esquema de nodos/aristas) es un ejercicio de modelado de datos mayor, no dos vistas separadas sirviendo desde el mismo sitio -- eso ya está. n8n como tercera capa (ver un workflow real como su propio grafo) sigue sin investigarse.

### 8.19 Tres correcciones reales el mismo día: relaciones que faltaban, Baserow bloqueado honestamente, y n8n evaluado antes de construirlo

**Relaciones que faltaban en la capa Node -- encontradas y corregidas.** El usuario tenía razón: 6 aristas para 44 ficheros era poco. La causa real: la mayoría de estos scripts no se hablan por `import` -- se hablan **escribiendo y leyendo un `.json`** que otro genera (`cargar_estructura_sheet.mjs` escribe `estructura_sheet.json`, que `encontrar_huecos.mjs` lee; `cargar_desde_vault.mjs` escribe `universo_real.json`, que la app del Bocetador lee). Corregido: `mapear_grafo_node.mjs` ahora también detecta estas relaciones reales (mismo criterio que todo lo demás -- solo cuenta si el propio texto tiene `writeFileSync`/`readFileSync` en la misma línea que el nombre del `.json`, nunca inventado). Resultado real: de 6 aristas a **16**, más **28 ficheros de datos reales** descubiertos como nodos propios (cuadrados amarillos en el visor, distintos de los scripts). Verificado en el navegador.

**Baserow -- bloqueado de verdad, no resuelto por probar más.** Se intentó listar la estructura completa de Baserow (mismo espíritu que `cargar_estructura_sheet.mjs`) usando el token real ya guardado (`G:\Mi unidad\DEVS\engremiat-litellm\.baserow_token`). Falló en `/api/workspaces/` y en `/api/database/tables/285/` con "Authentication credentials were not provided". Causa real más probable: ese token es un **token de base de datos** (acceso a filas de una tabla concreta, el mismo tipo ya usado en `exportador_prometheus_gasto.mjs`), no una sesión de usuario -- Baserow separa a propósito los dos niveles de acceso, y listar todo el workspace exige el segundo. No se ha intentado obtener uno nuevo ni iniciar sesión -- eso es una decisión del operador, no algo que deba resolverse solo probando credenciales. Queda honestamente bloqueado, no resuelto.

**n8n -- evaluado antes de construir, no por reflejo.** Preguntado explícitamente "si aporta valor añadido". Respuesta: sí, porque es una capa real de automatización invisible en las otras dos vistas -- workflows reales, con su propia Puerta Humana ya incorporada ("Cronista - Segmentar documento en tareas **(con puerta humana)**"). Y no hacía falta ninguna credencial nueva: `tools/n8n-workflows/exportar.mjs` ya había dejado 2 workflows reales exportados con el token de n8n redactado (`cronista-segmentar-generador.json`, 78 nodos; `telar-interactivo.json`, 59 nodos) -- **137 nodos reales, 138 conexiones reales**, sin tocar la API de n8n de nuevo. Construido: `mapear_grafo_n8n.mjs` (solo lectura de esos dos ficheros ya versionados) + `n8n.html`, tercera vista, mismo `vis-network`, con selector real para aislar un workflow del otro. Desplegado junto a las otras dos en el mismo contenedor: `http://100.107.171.88:9320/n8n.html`. Verificado en el navegador: clic en un nodo real ("Ruta por acción") muestra su tipo real (`switch`) y el workflow real al que pertenece.

**Las tres vistas reales, hoy, en el mismo sitio** (lo pedido explícitamente -- "que todo viva en el mismo sitio"): `http://100.107.171.88:9320/` (Apps Script, Graphify), `/nodejs.html` (capa Node, con datos), `/n8n.html` (automatización). Un grafo verdaderamente unificado (un solo esquema para las tres) sigue siendo el ejercicio de modelado mayor que ya se apuntó -- pero ya no son tres cosas dispersas, son tres pestañas del mismo sitio.

### 8.20 Baserow desbloqueado -- error propio corregido, y un hallazgo real importante

**El bloqueo de Baserow del §8.19 era mío, no de Baserow.** El header llevaba "Token " duplicado en mi prueba con curl -- una vez corregido, el mismo token de base de datos ya usado en todo el proyecto **sí** puede listar todas las tablas reales, vía `/api/database/tables/all-tables/` -- un endpoint que ya estaba en uso real en `puente_historia_leyes.mjs` desde antes de esta sesión, que no había revisado a tiempo. Corregido y verificado con dos fuentes independientes a la vez: la llamada real a la API, y una captura real del propio operador con su sesión de Baserow abierta -- los mismos 18 nombres, exactos.

**Hallazgo real importante, no menor**: Baserow ya tiene tablas reales que no se habían cruzado al construir los esquemas de esta sesión -- **`PERSONAJE`** (id 283: NOMBRE/RASGO/QUIERE_O_NECESITA/PROCESO_ID) y **`PLANTILLA_MISION`** (id 284: NOMBRE/ESCENARIO/ORDEN/DESCRIPCION/TIPO_CAPTURA/ESTADO/VERSION) -- exactamente los dos conceptos (Personaje, Misión) para los que ya se construyó esquema en `personaje.schema.json` y se propuso Misión como figura candidata (§8.9), sin saber que Baserow ya tenía su propia versión real. También reales y sin cruzar: `ACERVO`, `VIGILIA_TAREA`, `NODO_ENGREMIAT`, `TELAR_SESION`, `TELAR_BIBLIOTECA`, `DOCUMENTO_ENGREMIAT` (con un campo real `HUECO_DETECTADO` -- alguien, en otra parte del sistema, ya lleva un registro de huecos que este mismo documento no conocía). **No se ha corregido `personaje.schema.json` en esta pasada** -- se anota como el siguiente cruce real que falta, para no volver a construir sin mirar primero.

**Construido**: `tools/gobierno/bocetador/cargar_estructura_baserow.mjs` (solo lectura, mismo patrón que `cargar_estructura_sheet.mjs`) -- 18 tablas reales, campos reales de cada una. `encontrar_huecos.mjs` extendido para cubrir las dos fuentes a la vez. Resultado real, honesto: **1/18 tablas de Baserow con espejo declarado** (`GASTO_API`), 17/18 sin ninguno todavía -- un hueco real mayor del que se pensaba, ahora visible por primera vez.

**La capa Node, reconectada de verdad.** La queja era justa -- "sigue estando muy desligada". Causa real: faltaba el tipo de relación más común de todas, dos scripts que tocan el **mismo recurso real** (la misma pestaña del Sheet, la misma tabla de Baserow) sin importarse entre sí. Corregido: `mapear_grafo_node.mjs` ahora reutiliza el vocabulario real ya generado por `cargar_estructura_sheet.mjs`/`cargar_estructura_baserow.mjs` como un tercer tipo de nodo ("recurso real", rombo rosa) con arista `toca_recurso`. Resultado: de 16 aristas a **57**, con 12 recursos reales compartidos actuando de verdad como los nodos centrales del grafo -- verificado visualmente en el navegador, clusters reales alrededor de cada recurso.

### 8.21 "Repara los huecos y sincronización" -- construido, con un límite de seguridad que se descubrió construyéndolo

**Huérfanos de la capa Node, reducidos de verdad.** Causa real: varios scripts (incluido uno mío, `mapear_grafo_n8n.mjs`) guardan el nombre del fichero en un array aparte y lo leen con una variable en otra línea -- mi comprobación "misma línea" no los pillaba. Corregido con un segundo paso, más débil pero honesto: si el nombre del `.json` aparece en cualquier parte del fichero y el fichero usa `readFileSync`/`writeFileSync` al menos una vez, se cuenta igual (marcado `_debil` para no confundirlo con el caso preciso). De 57 aristas a **93**.

**`aplicar_boceto.mjs` -- el mecanismo de §8.13, construido.** Lee un `boceto.json` real (el que exporta el Bocetador) y por cada figura escribe o actualiza una ficha real en la bóveda -- mismo front-matter que ya usan las 60+ fichas reales. Sheet y Baserow se quedan siempre en informe, nunca una llamada real, con o sin `--aplicar` -- ese límite no se ha tocado.

**Encontrado construyéndolo, antes de aplicar nada**: la primera versión de "ACTUALIZAR" habría sobrescrito por completo el contenido real de una ficha ya existente (`Telar.md`, con prosa real escrita a mano) con un placeholder genérico del Bocetador -- **una violación directa de la propia ley constitucional "memoria revisable, nunca borrada"**. Corregido antes de escribir nada de verdad: el script **nunca sobrescribe una ficha existente** -- si ya hay contenido real, lo informa para revisión manual y no toca el fichero, con o sin `--aplicar`. Solo crea fichas genuinamente nuevas.

**Probado en real, con ese límite ya puesto**: un boceto de prueba con Consola+Telar -- `Telar.md` (real, ya existía) quedó intacto y avisado para revisión manual; `Consola.md` (real hueco, no existía en `01_Mundo/Espacios/` a pesar de estar en la taxonomía del Núcleo) se creó de verdad. Verificado leyendo el fichero real resultante.

**Lo que sigue pendiente, con el mismo criterio de siempre**: una fusión real campo-a-campo para poder actualizar fichas existentes sin perder contenido (hoy solo crea, nunca actualiza) -- no construida por ser justo el tipo de mecanismo que hay que hacer bien, no rápido. Y Sheet/Baserow siguen sin ninguna escritura real, a la espera de la autorización explícita aparte ya documentada en §8.13.

### 8.22 Las cuatro vistas nuevas, construidas con datos reales -- y un índice real del sitio entero

Los 4 grafos valorados en la pasada anterior, construidos y desplegados el mismo día, en el mismo sitio que Graphify/Node/n8n (`http://100.107.171.88:9320/`, ahora con `indice.html` real enlazando las seis vistas):

- **`91_HISTORIAL` por `CORRELATION_ID`** -- 35 operaciones reales, 69 entidades reales, 81 aristas. Verificado en el navegador: un solo clic muestra, por ejemplo, una operación real que creó de golpe 10 entidades reales (Campaña→3 Proyectos→3 Productos→3 relaciones→4 Procesos) con su timestamp real.
- **Jerarquía real Campaña→Proyecto→Producto→Proceso→Tarea** -- 48 nodos, 43 aristas, vía las claves reales del Sheet. Incluye proyectos reales genuinos, no de prueba: la Yurta de 6m, el Amigurumi de Stitch a crochet (con pasos reales extraídos de un vídeo real), el Muro de bahareque.
- **`PAQUETE_CLIENTE` → módulos activos** (Baserow) -- 1 cliente real (Piloto Plaza), 3 módulos reales encendidos (CRONISTA, AGORA, EJECUTOR_LOCAL).
- **Ciclo de vida real de Telar** (`estados.json`, ya validado en B0) -- 14 estados, 19 transiciones reales, grafo de proceso distinto en tipo a los otros tres.

Las cuatro comparten una sola página (`sheet-real.html`, con pestañas) en vez de cuatro ficheros sueltos -- más cerca de lo que pedía "un grafo unificado para encontrar los huecos" sin fingir un esquema único que todavía no existe.

**Sobre `17_RELACION` vacío**: confirmado -- el objetivo real de este ejercicio (Bocetador + `aplicar_boceto.mjs`, §8.21) es justo darle a esa pestaña, y a las otras 43 que siguen sin espejo, datos reales con los que rellenarse -- no es un defecto a resolver aparte, es la razón de ser de todo lo construido hoy.

### 8.23 "¿Ya tenemos los grafos de todo Engremiat?" -- no, con números reales -- y la propuesta: análisis de entidades/relaciones/ciclos sobre lo ya construido

**La pregunta honesta primero.** No. Lo que hoy es real y completo son las dos capas de código (Apps Script vía Graphify: 1587/4668; Node vía `tools/`: 93 aristas) y la capa de automatización (n8n: 137/138). Pero la capa de negocio -- la que de verdad importa para nutrir Espacio/Personaje/Recurso -- sigue siendo una porción pequeña y elegida a mano:

- **Sheet real: 8 de 70 pestañas** tienen un grafo de relaciones (`91_HISTORIAL` + las 6 de la jerarquía Campaña→Tarea + `07_TAREA_RESPONSABLE` de rebote). Las otras 62 -- `12_DECISIONES`, `13_INCIDENCIAS`, `14_DOCUMENTOS`, `16_ASIGNACION`, `18_VINCULO`, `23_RECURSO`, `33_COMPETENCIA`, `38_CLIENTE`, las 13 `STG_*`, etc. -- no tienen grafo, solo cabeceras leídas (`estructura_sheet.json`).
- **Baserow real: 1 de 18 tablas** (`PAQUETE_CLIENTE`) tiene grafo de relaciones. Las otras 17 -- `AGORA`, `DOCUMENTO`, `ENTIDAD_ORGANIZATIVA`, `PERSONAJE`, `PLANTILLA_MISION`, `ACERVO`, `TELAR_SESION`, etc. -- solo tienen su lista de campos leída (`estructura_baserow.json`).
- **La bóveda de Obsidian (60+ fichas reales) no tiene ningún grafo propio todavía.** `cargar_desde_vault.mjs` la lee para alimentar el Bocetador, pero nunca se ha extraído el grafo real de sus propios `[[wikilinks]]` internos -- que es justo donde ya viven, escritos a mano, los vínculos reales entre Espacio/Personaje/Recurso/Módulo/Herramienta que este ejercicio busca encontrar.

**Por qué esto no es un fallo, es la forma correcta de ir despacio**: cada grafo construido hasta hoy se eligió porque había datos reales suficientes para que valiera la pena (mismo criterio de "nunca inventar sin dato real"). El resto sigue vacío o casi vacío en el propio Sheet/Baserow -- no tiene sentido graficar una pestaña sin filas.

**La propuesta -- un octavo grafo que falta, y un analizador que cruza los ocho.**

1. **Construir el grafo que falta y es el más relevante de todos**: extraer los `[[wikilinks]]` reales entre las 60+ fichas `.md` de la bóveda (regex simple sobre el contenido real, sin IA) -- da un grafo de **relaciones ya declaradas a mano por el operador**, el más directo indicio real de "qué se relaciona con qué" que existe hoy.
2. **Un script nuevo, `analizar_entidades_reales.mjs`**, que carga los 8 grafos reales (los 7 de hoy + el de wikilinks) y, por cada nombre de entidad, calcula solo con datos ya reales:
   - **Corroboración cruzada**: en cuántas de las 8 fuentes reales aparece la misma entidad (por nombre, reusando el mismo criterio de `vinculoReal`). Una entidad que aparece en Sheet *y* Baserow *y* vault *y* código no es ruido -- es una candidata fuerte a ser Espacio/Personaje/Recurso con ficha propia.
   - **Centralidad real** (grado del nodo) dentro de cada grafo -- qué entidades son de verdad nodos-bisagra.
   - **Ciclos reales** (Tarjan/DFS simple) -- si existe un bucle real de dependencia (p. ej. algo que alimenta al Bus de Trabajo que a su vez lo gobierna a ello), es candidato directo a convertirse en una `Regla` explícita del Núcleo, no una casualidad de grafo.
   - **Vocabulario de relación unificado**: hoy hay tipos de relación distintos y reales en cada capa (los 16 `tipo` de `relacion.schema.json`, `toca_recurso`/`importa`/`escribe`/`lee` en Node, las conexiones de n8n, las FK del Sheet) -- el script los cuenta todos juntos y produce una sola tabla de frecuencia real, primer paso honesto hacia un vocabulario común sin forzarlo antes de tiempo.
3. **Salida**: un informe rankeado (`HALLAZGOS_ENTIDADES_REALES.md` + una vista nueva en el visor, `entidades.html`) con las entidades reales mejor corroboradas -- la lista de candidatas a nueva ficha de Espacio/Recurso/Personaje que este ejercicio pide, con la evidencia real (qué fuentes, qué aristas) al lado de cada una, no inventada.

**Límite honesto que hay que decir antes de construirlo**: el cruce de identidad entre fuentes es por coincidencia de nombre, no por ID único todavía -- va a haber falsos positivos (dos cosas distintas con nombre parecido) y falsos negativos (la misma cosa con nombre distinto en cada sistema). Es un primer barrido real para orientar dónde mirar, no un censo definitivo -- coherente con no fingir una precisión que el dato de hoy no tiene.

**Construido y ejecutado en real el mismo día, tras la confirmación** ("necesitamos el censo definitivo, necesitamos poder considerar y descartar desde lo atomico"):

- **`cargar_grafo_wikilinks.mjs`** -- el octavo grafo, real: recorre las 9 carpetas completas de la bóveda (101 ficheros `.md`), extrae todos los `[[wikilinks]]` del cuerpo entero de cada ficha (no solo "## Relaciones"). Corrección real encontrada construyéndolo: las fichas de `07_Holon_Relaciones` (`tipo: relacion`) no son entidades, son la relación misma -- si se contaban como nodo aparte, inflaban artificialmente la centralidad y contaminaban el censo con nombres como "Concilio depende_de 7 Acervos-o-mecanismos" como si fuera una entidad. Corregido: esas fichas se convierten en UNA arista directa origen→destino con su `tipo_relacion` real (activa_a/depende_de/gobierna_a/...), igual que ya hacía `cargar_desde_vault.mjs`. Resultado real: 83 fichas-entidad + 6 nombres referenciados por wikilink sin ficha propia todavía (`Acervo`, `Acervos`, `Vision Mision`, `Física`), 281 aristas reales.
- **`analizar_entidades_reales.mjs`** -- el censo. Une los 8 grafos reales (los 7 de antes + wikilinks) y añade como candidatas TODAS las 70 pestañas del Sheet y las 18 tablas de Baserow (no solo las que ya tenían grafo propio -- así se cierra el hueco de cobertura señalado en la valoración, no dejándolo pendiente sino incluyéndolo en el censo desde ya). Por cada una de las 222 entidades candidatas reales calcula corroboración cruzada (en cuántas de 9 fuentes reales aparece), centralidad (grado real), y una decisión con su razón al lado -- nunca una etiqueta sin evidencia.
- **Resultado real**: 222 candidatas -- **18 confirmar** (ficha real bien corroborada: Cliente, Ejecutor, Cronista, Concilio, Coordinador, Vigilia, Relevo, Telar, Oportunidad, Baserow, CORE, GASTO_API, 92_BUS_TRABAJO, Impacto, Bus de trabajo, Salud del ecosistema, Actualizar librería cliente, Consola), **20 promover** (sin ficha propia hoy, corroboradas por ≥3 fuentes -- incluye pestañas/tablas reales como `13_INCIDENCIAS`, `18_VINCULO`, `PLANTILLA_MISION`, `COMPETENCIA`, y los dos nombres huérfanos `Acervo`/`Acervos`), **65 revisar** (ficha real ya existente pero apenas corroborada fuera de la bóveda -- con su `tipo` de vault mostrado al lado para distinguir de un vistazo ruido narrativo real, sesión/hilo/arco, de huecos de integración genuinos, módulo/personaje/regla), **119 descartar** (evidencia insuficiente hoy, no borradas del censo).
- **4 ciclos reales** -- uno es en realidad una malla de 64 nodos (el Holon se enlaza mucho entre sí en ambas direcciones, no es un bucle problemático, es la naturaleza de un grafo de wikilinks denso -- dicho así de claro en el informe, no maquillado como hallazgo dramático); los otros tres sí son señales reales y concretas: dos scripts que se referencian entre sí de verdad, un grupo real de ficheros de datos compartidos entre `montar-cliente.mjs` y su test, y el ciclo de vida real de Telar (esperado, ya validado en B0).
- **24 tipos de relación reales** con su frecuencia exacta -- desde `calls` (2994, código) hasta los 8 tipos reales del vocabulario del Holon (`activa_a`, `depende_de`, `gobierna_a`, etc.), cada uno con cuántas veces aparece y en qué capa.
- **Salidas**: `censo_entidades.json` (completo) + `HALLAZGOS_ENTIDADES_REALES.md` (informe legible) + una séptima vista real en el visor, `entidades.html` (`http://100.107.171.88:9320/entidades.html`) -- tabla filtrable por decisión/tipo/nombre, panel de detalle con la razón real de cada candidata, tabla de vocabulario. Desplegada y verificada en el navegador: filtro por "promover" da 20/222, clic en fila abre el panel con la razón real.

**Límite honesto que se mantiene**: el cruce sigue siendo por coincidencia de nombre/tokens normalizados, no por ID único -- es el barrido más exhaustivo posible con el dato real de hoy (9 fuentes, 222 candidatas, ninguna pestaña ni tabla real dejada fuera), no un censo con precisión perfecta. Cada fila lleva su evidencia para revisión humana antes de escribir ninguna ficha nueva.

**Consolidación real, la misma tarde** ("necesitamos el censo definitivo... investiga y termina de consolidarlo" sobre confirmar/promover/revisar; descartar se valora aparte). `consolidar_censo.mjs` añade 2 fuentes reales más -- el catálogo `MODULO_POR_ENTIDAD_MVP` de `src/Ids.js` (más fuerte que texto: es el propio código) y las transcripciones reales de `tools/gobierno/telar/b2/respuestas_originales/` -- más correspondencias verificadas a mano leyendo el fichero real (p.ej. "Verificador de Campos" de la bóveda es de verdad `tools/verificador_determinista.mjs`, solo con nombre distinto). Clasifica las 103 entidades en 11 acciones concretas, cada una con su razón real:

- **18 confirmar_ya_solido + 16 confirmar_codigo_real + 5 confirmar_patron_tecnico + 3 confirmar_uso_real_telar + 1 confirmar_verificado_a_mano = 43 confirmadas** -- de las cuales 5 (Repository, Aprovisionamiento, Comunicacion, EstructuraInicial, Gantt) son código real pero NO módulos de negocio MVP registrados -- señal real de que su `tipo: modulo` en la bóveda puede estar mal clasificado (son patrones técnicos, no módulos activables).
- **19 correcto_narrativo** -- hilos/arcos/sesiones/mapa: baja corroboración es lo esperado, sin acción.
- **10 revisar_nombre_narrativo** -- Espacios/Reglas reales con nombre narrativo ("El Sheet", "La fragua protegida", "Headscale") que el cruce por texto no puede alcanzar -- no es un hueco, es un límite del método. Acción concreta: añadir `vinculoReal` explícito a cada una.
- **15 promover_recurso_real** -- pestañas/tablas reales bien corroboradas (38_CLIENTE, 13_INCIDENCIAS, 18_VINCULO, PLANTILLA_MISION, COMPETENCIA...), candidatas sólidas a ficha de Recurso.
- **3 descartar_termino_generico** -- TAREA/DOCUMENTO/Verificación: palabras genéricas, no entidades -- ya existen las específicas reales.
- **2 revisar_inconsistencia_nombres** -- "Acervo"/"Acervos": no falta una entidad, faltan wikilinks apuntando al nombre exacto de las 7 fichas reales ya existentes.
- **11 revisar_manual_real** -- sin patrón automático aplicable, necesita ojo humano real (incluye 4 de los 7 Acervos sin script propio ni transcripción B2 -- Narrativo, Sociocracia, Usuario, Lógico -- posible hueco genuino de activación).

Verificado y desplegado: `entidades.html` ahora filtra también por acción consolidada, y el panel de detalle muestra las dos capas de razón (censo + consolidación) una debajo de otra.

**El grupo descartar, investigado tal como se pidió** ("si encontramos huecos en el grafo global será nuestra primera fuente de posibilidad, si al final no tiene sentido, lo dejamos como histórico"). Investigando a mano (no solo con reglas) apareció un bug real: `cargar_grafo_wikilinks.mjs` derivaba el destino de una relación con varios destinos desde el NOMBRE DEL FICHERO en vez del cuerpo real -- "Concilio depende_de 7 Acervos-o-mecanismos.md" producía una entidad falsa "7 Acervos-o-mecanismos" en vez de las 7 aristas reales a los 7 Acervos reales que sí están en el cuerpo. Corregido (222→220 candidatas, 8 aristas reales más).

Sobre las 117 descartadas restantes:

- **5 huecos reales concretos, investigados y RESUELTOS en la bóveda real** ("continua con esto" sobre los propios hallazgos): investigando a fondo -- no solo aplicando reglas -- se encontró que VIGILIA_TAREA/METRICA_FABRICACION/EJECUTOR_LOCAL NO eran entidades nuevas: `Vigilia.md`, `Coordinador.md` y `Ejecutor.md` (fichas reales ya existentes) ya narraban estos tres recursos en prosa, solo les faltaba el vínculo explícito -- resuelto añadiendo una sección `## Vínculo real` a cada una, sin tocar el resto del contenido (crear una ficha nueva habría sido redundante). DOCUMENTO_ENGREMIAT y AGORA sí eran huecos genuinos -- creadas de verdad `01_Mundo/Recursos/DOCUMENTO_ENGREMIAT.md` (grounded en el catálogo real de 56 filas) y `01_Mundo/Recursos/AGORA.md` (honesto sobre ser nascente).
- **2 candidatas a ficha nueva, investigadas** -- "Física" sí era un hueco real: citada ya tres veces en fichas reales (`Estilo.md`, `Coordinador.md`, `GASTO_API.md`) como concepto fundacional, nunca con ficha propia -- creada `03_Reglas/Física.md` reuniendo sin inventar nada las tres citas ya existentes. "Vision Mision" investigada más a fondo resultó NO ser una entidad nueva: es una fila real ya catalogada dentro de `DOCUMENTO_ENGREMIAT` (id 4, `ARCHIVO_HISTORICO/Documentos/VISION_MISION.md`), que el propio sistema ya marca "estado: revisar" y "contradice a MAPA_DOMINIOS_DATOS" -- correctamente histórica, ya cubierta por la ficha de DOCUMENTO_ENGREMIAT recién creada.
- **5 que ya tienen grafo real propio** (91_HISTORIAL, 01_CAMPANAS, 03_PRODUCTOS, 05_PROCESOS, PAQUETE_CLIENTE) -- el censo no las veía por cómo se construyó, no es un hueco real: corrección honesta, no hallazgo.
- **~105 restantes, histórico tal como se pidió** -- clasificadas por patrón real (instancia de negocio específica, pestaña/tabla con huella hoy insuficiente, detalle de implementación ya cubierto), no dejadas sin mirar.

**Seis escrituras reales en la bóveda, verificadas leyendo antes de tocar cada fichero** -- 3 fichas nuevas (`03_Reglas/Física.md`, `01_Mundo/Recursos/DOCUMENTO_ENGREMIAT.md`, `01_Mundo/Recursos/AGORA.md`) y 3 fichas existentes enriquecidas por adición pura, sin tocar su contenido real previo (`Vigilia.md`, `Coordinador.md`, `Ejecutor.md`, cada una con una nueva sección `## Vínculo real`). Es la primera vez en esta serie de ejercicios que el censo real produce escritura real en la bóveda, no solo informe -- exactamente el ciclo que motivó todo el ejercicio: dato real → hueco real → ficha real.

### 8.24 "Valora las 43 confirmadas, cuáles necesitan vinculoReal añadido" -- valorado y aplicado, 33 fichas reales enriquecidas

**Construidos dos scripts nuevos**: `valorar_vinculoreal_confirmadas.mjs` re-cruza cada una de las (ahora 45, tras §8.23) entidades confirmadas contra todas las fuentes reales -- incluyendo dos que el barrido anterior no cubría del todo (grafo de Apps Script completo, transcripciones reales de Telar B2) -- y decide, por cada una: **ya_tiene** (la sección `## Vínculo real` ya existe), **evidencia_precisa** (hay un script, tabla, workflow o módulo real concreto que se puede citar sin inventar nada) o **evidencia_difusa** (solo coincide con un fichero entero de 12000+ funciones o no hay nada reutilizable -- no se fuerza un vinculoReal con eso). `anadir_vinculoreal.mjs` lee esa valoración y escribe la sección real -- mismo patrón de seguridad que `aplicar_boceto.mjs`: dry-run por defecto, dos filtros de limpieza añadidos tras revisar el primer dry-run a mano (un nodo `recurso:X` de `grafo_node.json` no es un fichero de repo, es el mismo dato que ya aparece como Sheet/Baserow por otro lado -- se descarta para no escribir "repo: GASTO_API"; y las coincidencias contra el fichero entero de Apps Script se usan solo para decidir, nunca para escribir, porque un fichero de 12000 líneas no es un recordId útil).

**Primera pasada, aplicada**: de 45 confirmadas, 3 ya tenían la sección (Vigilia/Coordinador/Ejecutor, de §8.23), 33 la recibieron.

**Segunda pasada, tras la propuesta real del operador**: "si lo miramos desde la perspectiva del sheet master veremos que un sheet completo engremiat tiene que tener estas relaciones" -- valorado sobre las 9 que quedaban sin vinculoReal. Confirmado con datos reales: **CORE nunca podía encontrarse por coincidencia de texto** ("CORE" no es substring de ninguna pestaña) **pero sí es una relación de propiedad real** -- el propio `CORE.md` ya lo decía: "toda entidad sin módulo asignado en `MODULO_POR_ENTIDAD_MVP` es CORE por definición". Computado en real desde `ENTIDADES_MVP` + `MODULO_POR_ENTIDAD_MVP` de `src/Ids.js`: CORE es dueño real de 8 pestañas (`01_CAMPANAS`, `02_PROYECTOS`, `03_PRODUCTOS`, `04_PROYECTO_PRODUCTO`, `05_PROCESOS`, `06_TAREAS`, `16_ASIGNACION`, `17_RELACION`).

Añadidas también dos fuentes reales más que el barrido no cubría: **`src/`** (161 ficheros reales de Apps Script, más granulares que el único `engremiat-live.concat.js` que ve Graphify) y los **`.ps1`** del ecosistema. Resultado real: Repository → `src/Repository.js` (verificado a mano, excluyendo a propósito `ConfigRepository.js`, que es un fichero real distinto con su propia ficha ya existente), Aprovisionamiento → `src/AprovisionamientoService.js`, Comunicación → `src/WebhookTelegramService.js` (verificado leyendo la ficha real: "el bot operativo"), EstructuraInicial → `src/EstructuraInicialDatos.js` + `src/EstructuraInicialService.js`, Gantt → `src/GanttPlanReal.html`, Ejecutar chequeo librería → `tools/gobierno/ejecutar_chequeo_libreria.ps1`.

**Misma trampa de homonimia encontrada otra vez, esta vez en `src/`**: "Física" coincidía con `src/InstaladorJerarquiaFisica.js` -- verificado leyendo el fichero real, es la jerarquía FÍSICA (espacial, talleres de un cliente) de La Troballa, sentido totalmente distinto al concepto filosófico ya documentado en `Física.md`. Descartado explícitamente, no escrito.

**Resultado final, de las 45 confirmadas: 43 tienen vinculoReal real, 2 se quedan sin él a propósito** (Física y Verificar contra hechos -- ambas ya resueltas de otra forma: sus fuentes reales viven en su propia prosa o en las fichas a las que ya enlazan, no necesitan la misma plantilla). Ninguna de las 43 escrituras perdió una sola línea de contenido real previo, verificado leyendo el resultado.

### 8.25 "Valora los 20 promover: cuáles son ficha real" -- investigado, y construidos los 4 módulos reales que faltaban

**La pregunta cambió de forma investigando**: no eran 15-20 fichas de Recurso sueltas por crear -- `recurso.schema.json` ya establece que los Recursos de la bóveda son mecanismos de gobierno, no un espejo 1:1 de cada pestaña de negocio ("primos, no gemelos, nunca se fuerza equivalencia"). El hallazgo real: de los 11 módulos de negocio reales en `MODULO_POR_ENTIDAD_MVP`, **4 no tenían ninguna ficha** -- Operativa, Seguimiento, Ejecución, Escenarios -- verificado con `grep` sobre toda la bóveda (cero mención dedicada), a pesar de que Ventas/Compras/Económico/Convocatorias/Impacto/Oportunidad/Cliente sí las tienen.

**Veredicto real sobre las 20 candidatas**: 3 descartadas (términos genéricos, ya resueltos), 2 sin ficha nueva (Acervo/Acervos, inconsistencia de nombres), 4 ya cubiertas (38_CLIENTE en `Cliente.md`, 06_TAREAS/02_PROYECTOS/04_PROYECTO_PRODUCTO en `CORE.md`), 1 sin ficha propia (PLANTILLA_MISION -- nodo real "Crear fila PLANTILLA_MISION" en el workflow n8n "Telar Interactivo", añadido al `vinculoReal` de `Telar.md` en vez de crear una ficha redundante), y 10 resueltas de golpe creando los 4 módulos reales: **Operativa.md** (dueña real de 11 pestañas -- el hueco más grande de todos, con su propia cita real del código: "fusiona Recursos/Personas + Asignaciones + Horario + Encaje de competencias en un único interruptor"), **Seguimiento.md** (4 pestañas: 12_DECISIONES/13_INCIDENCIAS/14_DOCUMENTOS/18_VINCULO), **Ejecucion.md** (1 pestaña) y **Escenarios.md** (1 pestaña, con su propia cicatriz real ya documentada en `El Sheet.md`: la colisión 92_BUS_TRABAJO/92_ESCENARIOS).

**Corrección honesta encontrada construyendo**: `Modulos acoplables.md` (el índice real) decía "el barrio de los diez módulos de negocio reales" -- ya no es cierto, corregido a "catorce" con nota explícita de por qué cambió, y las 4 fichas nuevas añadidas a sus Relaciones reales.

Verificado leyendo el resultado: censo regenerado (224 candidatas, 21 confirmar) y desplegado en el visor.

### 8.26 "Valora los 12 revisar_manual_real" -- investigado uno a uno, 3 con vinculoReal real, el resto correctamente sin acción o con un hueco genuino identificado

Sin patrón automático aplicable por diseño (por eso cayeron en revisión manual) -- investigado leyendo cada ficha real, uno a uno:

- **AGORA** -- ya resuelta en §8.23-24, correctamente nascente, sin acción nueva.
- **Modulos acoplables** -- es el índice real de la categoría, no una entidad con vinculoReal propio. Correcto tal cual.
- **Pregonero** -- su propia ficha ya lo dice: "ninguna pieza construida". Aspiracional honesto, sin acción.
- **Narrador** -- `estado: por_construir` explícito en el frontmatter. Aspiracional honesto, sin acción.
- **Mensajero** -- ya muy bien documentado: cita tres mecanismos reales concretos en su propia prosa (webhooks WoL `despertar-pc-webhook`/`apagar-pi-webhook`, el bot de Telegram, el puente Historia↔Leyes) y ya enlaza a fichas que sí tienen vinculoReal (`Puente historia leyes`, `Bus de trabajo`) -- es un rol con varias encarnaciones, no una pieza única. No necesita vinculoReal propio.
- **Acervo Narrativo, Acervo Logico, Acervo Sociocracia** -- las tres citan actividad real concreta en su propia prosa (síntesis reales que analizaron la historia de Engremiat; un hallazgo real de fallo -- un umbral de votos inventado -- ya vinculado desde `Honestidad del fallo.md`). Buscado el fichero exacto de esas síntesis sin encontrarlo con certeza (candidatos reales revisados: `diario-navegacion/*/informe.md`, que mencionan PEND1/OBS1 pero no nombran estos Acervos por nombre) -- suficientemente fundamentadas por su propia prosa, no se fuerza un vinculoReal sin esa certeza.
- **Acervo Usuario** -- el único de los siete Acervos sin ninguna actividad real citada, ni en código, ni en Telar B2, ni en prosa propia. El hueco genuino real que queda de los siete.
- **IntegrityService, Formularios, ConfigRepository** -- los tres SÍ tenían evidencia real precisa sin usar: `src/IntegrityService.js` (90 reglas `FUNC-*` reales), `src/FormularioMotorUI.js` + `FormularioValidacionService.js` + `FormularioEsquemas.js` + `FormularioGenerico.html` (~25 formularios reales), `src/ConfigRepository.js`. Añadido `## Vínculo real` a las tres, verificado leyendo el resultado.

Censo regenerado y desplegado. De los doce, 3 recibieron vinculoReal real, 2 revelaron su propio hueco explícito (Pregonero/Narrador, ya honestos por diseño), 1 es un hueco genuino real que queda abierto (Acervo Usuario), y el resto está correctamente resuelto sin acción -- ni todo necesitaba vinculoReal, ni todo era un hueco.

### 8.27 "Valora los 10 revisar_nombre_narrativo" -- resuelto: 7 con vinculoReal real, 3 ya fundamentadas por relaciones

Los 10 -- Espacios/Reglas con nombre narrativo ("El Sheet", "n8n", "Headscale"...) cuyo referente real el cruce por texto nunca podía alcanzar. Leídos uno a uno, con referente real preciso cada vez:

- **VPS y Tailscale** -- las 3 IP Tailscale reales de la malla (`engremiat-dev-hetzner` 100.107.171.88, `nodo-pi-engremiat` 100.125.52.52, `pc-operador-engremiat` 100.118.79.49), ya citadas en su propia prosa.
- **n8n** -- los 2 workflows n8n reales ya exportados + `tools/n8n-workflows/`.
- **La fragua protegida** -- la instancia n8n aislada real (`engremiat-generador-n8n`, `127.0.0.1:5680`), ya citada en su propia prosa.
- **El Vault** -- su propia ruta real (`G:\...\Obsidian-Engremiat\Universos\Engremiat`) -- la ficha apunta al sitio donde vive ella misma.
- **El ciclo de vida remoto** -- los mismos identificadores reales que ya usa `Mensajero.md` (`despertar-pc-webhook`, `apagar-pi-webhook`).
- **Headscale** -- el mismo VPS real donde está autoalojado (100.107.171.88).
- **El Sheet** -- **confirmado por cruce real, no adivinado**: el Sheet ID real (`142vRqXfDj4C7KyY7TVf5Oh18gwtDcvAkYxFQ0lb6CGQ`) tiene `92_BUS_TRABAJO` y no `92_ESCENARIOS` -- exactamente la firma que la propia ficha ya usaba para distinguir cuál de sus cuatro instancias reales es "Gestor de Proyectos - LaTroballa Software". Es el mismo Sheet que usa todo este censo desde §8.23.
- **Honestidad del fallo** (regla) -- cita `98_LOG_GOBIERNO` por nombre en su propia prosa; añadido como Sheet real.
- **El Sheet manda, Los dos continentes de datos** (reglas) -- ya suficientemente fundamentadas por relaciones a fichas que ahora sí tienen vinculoReal (`El Sheet`, `Baserow`) y por nombrar tablas reales explícitas en su propia prosa -- no se duplica, mismo criterio que "Verificar contra hechos".

Censo regenerado y desplegado. De los diez, 7 recibieron vinculoReal real y preciso, 3 se quedan correctamente sin él por estar ya fundamentados. Ninguno resultó ser un hueco -- el límite era del método de cruce por texto, no del dato real, exactamente como se anticipó al clasificarlos.

### 8.28 "Valora los revisar_inconsistencia_nombres y historico_detalle_implementacion" -- el primero no era inconsistencia, era un índice que faltaba

**Investigado a fondo, no aplicada la solución ya propuesta sin más**: la valoración de §8.23 decía "faltan wikilinks apuntando al nombre exacto" para `[[Acervo]]`/`[[Acervos]]` -- leyendo los dos usos reales (`Narrador.md`: "un [[Acervo]] todavía por construir"; `Telar.md`: "los [[Acervos]]") resultó que **ninguno de los dos estaba mal apuntado**: ambos se refieren de verdad a la categoría/grupo entero, no a un Acervo concreto -- "un Acervo" (singular indefinido, un tipo) y "los Acervos" (plural, el grupo de los ocho) son usos correctos, no errores. Lo que faltaba de verdad era la ficha-índice, exactamente el mismo patrón real que ya existe para los módulos (`Modulos acoplables.md`).

**Construida `Acervo.md`** en `02_Personajes/Acervos/`, índice real de las 8 fichas reales (7 que deliberan dentro de Concilio + Acervo Prompter, que trabaja antes) -- mismo patrón, mismo criterio de "nunca inventar sin dato real". Ajustado el wikilink de `Telar.md` a `[[Acervo|Acervos]]` (alias, conserva el texto plural, apunta al fichero singular real); el de `Narrador.md` ya resolvía solo al crear la ficha. Verificado: "Acervo" pasó de candidata suelta (corroboración 3) a ficha real confirmada (corroboración 4).

**`historico_detalle_implementacion` (2)**: los nombres literales de los dos workflows n8n reales -- ya cubiertos por el `vinculoReal` de `Cronista.md`, `n8n.md` y `Telar.md` (añadidos en pasadas anteriores). Verificado, sin acción adicional -- correctamente histórico, no un hueco.

Censo regenerado (224 candidatas, 22 confirmar) y desplegado.

### 8.29 "Valora los 53 historico_pestana_sin_huella" -- el censo tenía un punto ciego real, corregido: de 53 a 5 genuinamente sin cubrir

**Investigando, no solo clasificando**: cruzando los 53 nombres contra el texto completo de la bóveda (no solo wikilinks), 17 YA estaban mencionados de verdad -- dentro de las secciones `## Vínculo real` que se acaban de añadir en los pases anteriores. El censo no los veía porque su fuente `vault_wikilink` solo reconoce `[[wikilinks]]`, nunca una mención en texto plano dentro de una bala `- Sheet: \`X\``. Límite real del método, no del dato.

**Corregido en el propio código del censo, no a mano una vez**: `analizar_entidades_reales.mjs` gana una décima fuente real, `vault_mencion` -- coincidencia de substring literal (umbral 6 caracteres, para no colar palabras comunes) contra el texto completo de las 90+ fichas reales. `consolidar_censo.mjs` gana una nueva acción, `ya_mencionado_en_boveda`, que se aplica antes que "promover"/"histórico sin huella" cuando esta fuente aparece.

**Corrección de exactitud encontrada aplicando la perspectiva del Sheet maestro por completo**: los 10 módulos de negocio que YA tenían ficha antes de hoy (Ventas/Compras/Económico/Convocatorias/Cliente) solo habían recibido el `codigo:` genérico al aplicar §8.24 -- nunca la lista completa de pestañas reales que poseen de verdad, a diferencia de los 4 módulos nuevos (Operativa/Seguimiento/Ejecución/Escenarios), que sí la tenían desde que se crearon. Añadidas las que faltaban: Ventas (`39_PEDIDO_CLIENTE`...`43_CONTRATO_SERVICIO`, 5), Compras (`08_MATERIALES`...`28_RECEPCION_LINEA`, 10), Económico (3), Convocatorias (1). **Bug real encontrado a la vez**: `Cliente.md` tenía `39_PEDIDO_CLIENTE`/`40_PEDIDO_CLIENTE_LINEA` por coincidencia de texto ("Cliente" dentro del nombre) -- pertenecen de verdad a Ventas, no a Cliente. Corregido, movidas.

**Construida `Zona de aterrizaje STG.md`** (`01_Mundo/Recursos/`), la ficha única para los 14 `STG_*` reales, grounded en el diseño real ya documentado en §6.5 (mapeo con IA controlada + Puerta Humana → `insertarRegistroTransaccional`) -- una ficha, no catorce, mismo criterio que ya se aplicó a los módulos.

**`96_PROMPT_EJECUTOR` y `95_DIARIO_NAVEGACION`** añadidas al `vinculoReal` de `Ejecutor.md` -- el segundo verificado citado por nombre en `PROMPT_EJECUTOR.md` ("el diario de coste-resultado").

**Resultado real, verificado con el censo corregido**: de 53, quedan honestamente **5 sin cubrir** -- `SOLICITUDES_MONTAJE` (real, con código propio real ya encontrado: `src/SolicitudMontaje.html` + `src/AprobarSolicitudMontaje.html`, sin dueño real obvio todavía), `93_MAPEO_IDS_TEMPORALES`, `90_CONFIGURACION`, `99_TRIAGE_LOCAL` y `NODO_ENGREMIAT` (Baserow) -- pendientes reales para una próxima pasada, no inventados hoy.

### 8.30 "Valora los 5 genuinamente sin cubrir" -- 4 con dueño real encontrado, 1 confirmado como el hueco de verdad real que queda

Investigado uno a uno, con grep real sobre `src/` y los documentos de jornada:

- **`SOLICITUDES_MONTAJE`** -- confirmado: "aprobar una fila" (la propia prosa de `Aprovisionamiento.md`) es literalmente aprobar una fila de esta pestaña real (`MODULOS`/`ESTADO`/`APROBADO_POR`/`FECHA_APROBACION`). `AprovisionamientoService.js` la toca de verdad, junto a `src/SolicitudMontaje.html` y `src/AprobarSolicitudMontaje.html` -- las tres añadidas al `vinculoReal` de `Aprovisionamiento.md`.
- **`93_MAPEO_IDS_TEMPORALES`** -- tocada de verdad por `src/ImportacionMasiva.js` y `src/EstructuraInicialDatos.js`: conecta el ID temporal de cada fila `STG_*` con su ID real ya instalado (`CORRELATION_ID`, mismo mecanismo de auditoría que `91_HISTORIAL`) -- añadida a `Zona de aterrizaje STG.md`, su dueño real.
- **`90_CONFIGURACION`** -- el named range real detrás de `obtenerCatalogo()`, tocado por **38 ficheros reales de `src/`** (el más ampliamente usado de todo el Sheet) -- añadida al `vinculoReal` de `ConfigRepository.md`.
- **`NODO_ENGREMIAT`** (Baserow, tabla 289) -- confirmado en `PENDIENTES_JORNADA_2026-08-30-31.md`: "creada y sembrada con los 4 nodos reales (Raspberry Pi, PC operador, worker local, chat operador)" el 31 de agosto -- añadida al `vinculoReal` de `VPS y Tailscale.md`.
- **`99_TRIAGE_LOCAL`** -- investigado a fondo (`grep` sobre todo el repo real), sin ningún resultado en código -- el único hueco genuino real que queda de todo este ejercicio, de 220+ candidatas reales examinadas.

Censo regenerado y desplegado: de 53 pestañas que empezaron como "histórico, sin huella", **queda exactamente 1 genuinamente sin cubrir**.

**Corrección inmediata del operador sobre esa última pestaña**: "99_TRIAGE_LOCAL, ¿esto no sería Coordinador?" -- revisado a fondo antes de responder. `PROMPT_EJECUTOR.md` tiene una "REGLA DE TRIAGE" pero es sobre el protocolo de Ejecutor, no sobre esta tabla específica. Los campos reales de `99_TRIAGE_LOCAL` (`TIPO`/`TITULO`/`RESULTADO`/`RIESGO`/`VERIFICADO_POR_CLAUDE`) son línea por línea la propia prosa ya escrita de `Coordinador.md` ("verifica lo que vuelve antes de darlo por bueno") -- el registro fila-a-fila del que `METRICA_FABRICACION` (ya en su vinculoReal) es el agregado. Añadida, con el aviso honesto de que es una atribución razonada por encaje de rol, no un script real encontrado que la toque -- distinto nivel de evidencia que las otras 4, dicho así en la propia ficha.

**Cierre real**: de 220+ candidatas examinadas en todo el ejercicio de §8.23 a §8.30, **cero quedan hoy como huecos sin resolver o sin razón documentada**.

### 8.31 "Acervo Usuario, lo creamos ya -- gestionado por DeepSeek para pruebas de concepto en universos paralelos"

El único hueco genuino que quedaba de toda la campaña (§8.26), cerrado con un cuerpo real encontrado investigando, no inventado: `src/PlantillaImportacionMasivaService.js` (Fase N9, modificado el mismo 1 de septiembre) ya construye en código la voz exacta de este Acervo -- deja que un cliente real, sin tocar el Sheet a mano, le pida a una IA externa que le rellene su plantilla y suba los CSV a `STG_*` (§8.29). Dentro de esa misma pieza vive `94_ESCENARIOS`: un escenario real con `GUION`/`EJE_COMPETENCIA`/`EJE_RECURSO`/`EJE_AUSENCIA` que deja la fricción del mundo real a propósito (encajes imperfectos, huecos de horario, incidencias sin cerrar) en vez de datos ideales -- exactamente la perspectiva de "quien usa esto sin saber nada de por dentro", hecha mecanismo.

Sobre eso, decisión real del operador incorporada en la ficha: DeepSeek opera temporalmente este Acervo para poblar y recorrer distintos `94_ESCENARIOS` ("universos paralelos" del mismo Sheet) como pruebas de concepto, antes de que ningún dato de un escenario toque las tablas reales de producción.

Escrito por adición pura sobre la ficha real ya existente (la única frase original se conserva intacta como primer párrafo) -- verificado leyendo el resultado. Censo regenerado y desplegado: **cero huecos abiertos en todo el universo Engremiat**, de más de 220 candidatas reales examinadas.

### 8.33 "Quién hace qué con quién, dónde, para qué" -- el campo real `equipo`, 13 aristas `opera_en` que faltaban, y el grafo del Holon

Propuesta del operador, actuando como asesor técnico: ahora que el universo está depurado y clasificado por lo que hace, formalizar cómo se relacionan -- quién hace qué con quién, dónde, para qué -- agrupando Personajes en equipos reales y completando el grafo relacional. Investigado antes de construir: **el 80% ya existía sin que se hubiera formalizado** -- 26 aristas reales (`opera_en`/`depende_de`/`gobierna_a`/`activa_a`/`verifica_a`/`corrige_a`/`alimenta_a`/`parte_de`) ya vivían dispersas en `07_Holon_Relaciones/`.

**Hallazgo honesto antes de tocar el schema**: `personaje.schema.json` ya tenía un campo `familia`, basado en `PROPUESTA_NOMENCLATURA_UNIVERSO_ENGREMIAT.md` §6 -- pero ese documento renombra "Acervo" a "Vocal" y propone "Guardián de Recursos"/"Guardián de Cumplimiento" como personajes nuevos. **Nunca se implementó así**: la bóveda real sigue llamándose "Acervo X", y no existen Guardianes como personajes propios. `familia` se deja tal cual, sin reconciliar hoy, con el aviso escrito en el propio schema -- `equipo` es un campo nuevo y distinto: agrupa por colaboración real ya existente en el grafo, no por tipo de rol.

**Construido**:
- **Campo `equipo`** en `personaje.schema.json` -- enum `[concilio, guardia, frontera]`, los 3 grupos reales encontrados como componentes conexas del propio grafo (no inventados): Concilio = Concilio + 8 Acervos + Vigilia (deliberación); Guardia = Ejecutor/Coordinador/Relevo/2 Verificadores, gobernados por Puerta Humana (ejecución con gate humano); Frontera = Mensajero/Cronista/Pregonero/Narrador (comunicación externa).
- **`equipo:` añadido al frontmatter de los 20 Personajes reales** -- por adición pura, verificado dry-run antes de aplicar, 20/20 escritas sin tocar el resto del contenido.
- **13 aristas reales `opera_en` que faltaban** -- de 19 Personajes (sin contar Concilio), solo 5 respondían ya "¿Dónde?". Cerradas las que tienen evidencia real ya escrita en otra ficha (nunca inventada): Concilio + 8 Acervos → Telar (ya lo decía `Telar.md`), Coordinador + Relevo → 92_BUS_TRABAJO (ya lo decía `Coordinador.md`), Verificador de Campos → Baserow (ya lo decía su `vinculoReal`), Acervo Usuario → Zona de aterrizaje STG (ya lo decía su propia ficha). Pregonero, Narrador y Verificador de Capacidades se quedan sin una a propósito -- no hay todavía un espacio real al que apunten, y no se fuerza.
- **`grafo_holon.json` + `holon.html`** -- octava vista real del visor: el grafo completo de "quién hace qué con quién, dónde" (28 nodos, 39 aristas reales), Personajes coloreados por `equipo`, clic en cualquier nodo muestra sus relaciones reales completas (verificado: Coordinador muestra sus 7 aristas reales de golpe).

Regenerado el censo (330 aristas de wikilinks, +14 sobre la pasada anterior) y desplegado.

### 8.34 "Valora los pendientes: Pregonero, Narrador y Verificador de Capacidades" -- 1 con evidencia real que se había pasado, 2 confirmados honestamente sin nada

- **Verificador de Capacidades → DOCUMENTO_ENGREMIAT** -- estaba ahí, en su propio código: `tools/verificador_capacidades.mjs` consulta en vivo la tabla Baserow **1038** filtrada por `TIPO=mecanismo_real` -- el mismo ID real que `DOCUMENTO_ENGREMIAT.md` ya documenta (56 filas: 46 documentos + 10 mecanismos). Creada la arista real, regenerado el grafo (29 nodos, 40 aristas).
- **Pregonero, Narrador** -- releídas sus fichas reales antes de concluir: "ninguna pieza construida" y `estado: por_construir`, ambas explícitas. Confirmado, no hay espacio real al que apunten todavía -- correctamente sin arista, no un olvido.

### 8.35 "¿Merece la pena publicar Física con vinculoReal real?" -- sí, pero no el que se descartó como ruido

`Física.md` se dejó sin `vinculoReal` en §8.24 porque su único hallazgo (`InstaladorJerarquiaFisica.js`) era ruido por homonimia -- jerarquía física de talleres de un cliente, no el concepto filosófico. Revisado de nuevo: el hallazgo real no era un fichero que "hable de" Física, sino que la propia maquinaria del censo construida esta sesión **es** su encarnación operativa -- `analizar_entidades_reales.mjs` cruza cada afirmación contra 10 fuentes reales antes de darla por buena, exactamente "verificarse contra el código o el Sheet reales, no quedar en narrativa suelta" (la cita ya real de `Estilo.md`). Añadido como `vinculoReal` real -- verificado leyendo el resultado, contenido previo intacto.

### 8.36 "¿Los 3 restantes también deberían tener vinculoReal?" -- 1 sí, 2 correctamente sin uno propio

Tres Reglas se habían quedado sin `## Vínculo real` en pasadas anteriores: El Sheet manda, Verificar contra hechos, Los dos continentes de datos. Revisadas una a una, no asumido que las tres necesitaran lo mismo:

- **Verificar contra hechos** -- su propio cuerpo y `## Relaciones` ya nombran los mecanismos reales exactos (Verificador de Campos, Verificador de Capacidades), y ambos ya tienen su propio `vinculoReal`. Añadir uno aquí sería duplicar, no fundamentar más. Se queda como está.
- **El Sheet manda** -- ya relacionada con `[[El Sheet]]` y `[[Baserow]]`, ambas con `vinculoReal` propio; es una instancia/consecuencia de "Los dos continentes de datos", no un mecanismo distinto que buscar por separado. Se queda como está.
- **Los dos continentes de datos** -- sí había un hallazgo real que faltaba: `tools/gobierno/bocetador/encontrar_huecos.mjs` no es un fichero que "hable de" los dos continentes, sino el que los audita por separado de verdad -- `informarSheet()` e `informarBaserow()`, dos funciones distintas sobre las dos estructuras reales, nunca fusionadas en una sola. Añadido como `vinculoReal`, verificado leyendo el resultado, contenido previo intacto.

Censo regenerado (mismos totales reales: 225 candidatas, 46 confirmar / 51 promover / 46 revisar / 82 descartar) -- sin regresión. Actualizado el resumen visual (badge `encontrar_huecos.mjs` en la tarjeta "Los dos continentes"), desplegado en VPS y republicado como Artifact.

### 8.37 "Reformula el grafo para que se puedan ver los componentes de cada equipo y sus relaciones"

`holon.html` coloreaba por `equipo` desde §8.33, pero el layout físico (forceAtlas2 libre) no agrupaba nada -- el color era la única señal, fácil de perder en 29 nodos mezclados. Reformulado con criterio espacial, no solo cromático:

- **3 carriles verticales fijos** -- cada Personaje con `equipo` recibe una `x` fija según su equipo real (Concilio/Guardia/Frontera), con dos columnas por carril para no apilar los 8 Acervos en una sola fila; la física solo reajusta su `y`. Espacios/Recursos/Reglas quedan sin `x` fija -- son el "dónde", cruzan carriles por diseño.
- **Fondo de zona + etiqueta por carril**, dibujado en coordenadas del propio grafo (`afterDrawing`) para que no se desalinee con pan/zoom.
- **Aislar equipo al clic**: clic en "Concilio"/"Guardia"/"Frontera" en la leyenda atenúa todo lo que no sea ese equipo + sus vecinos directos (relaciones entrantes/salientes reales) -- responde literalmente "ver los componentes de cada equipo y sus relaciones" sin salir del grafo. Clic de nuevo, o "✕ ver todos los equipos", restaura.

**Bug real encontrado y corregido verificando en el navegador, no solo mirando el código**: el `fit()` automático tras la estabilización se quedaba con zoom 1 fijo -- el canvas de vis-network se construye antes de que el layout flex del contenedor haya resuelto su tamaño real, y `fit()` calcula el zoom contra ese tamaño 0 cacheado. Corregido forzando `network.setSize('100%','100%')` + `redraw()` antes de `fit()`, más un listener de `resize` de ventana. Verificado con captura real en el VPS: sin la corrección, el grafo cargaba con los 3 carriles invisibles fuera de encuadre; con ella, encuadra los 29 nodos automáticamente al cargar.

Desplegado en VPS (`holon.html`), sin cambios en `grafo_holon.json` (mismos 29 nodos / 40 aristas reales -- reformulación de layout, no de datos).

### 8.38 "Antes de comparar con Obsidian: una vista gráfica limpia y al detalle de todas las entidades y sus relaciones"

`holon.html` solo muestra 29 de las 94 fichas de entidad reales -- filtra a las que tienen al menos una relación semántica del Holon, dejando fuera todo lo conectado solo por wikilink narrativo. Investigado antes de construir: el dato completo ya existía -- `grafo_wikilinks.json` ya tiene las 94 fichas de entidad reales (excluidas a propósito las 33 fichas-relación de `07_Holon_Relaciones/` y el README, que son registros de relación, no entidades) con **331 aristas reales**: 291 `wikilink` + los 40 tipos semánticos del Holon. Solo faltaba una vista que lo mostrara entero y limpio.

**Construido `grafo_maestro.html`** -- novena vista real del visor:
- Las 94 fichas, sin filtrar. 13 tipos reales encontrados en la bóveda (`modulo`21 `personaje`20 `oficio`11 `espacio`10 `hilo`8 `regla`6 `arco`6 `recurso`5 `sesion`2 `mapa`1 `estilo`1, más 2 `referencia_sin_ficha` y 1 `sin_tipo` -- huecos honestos: wikilinks a nombres sin ficha real todavía), cada uno con su propio color y forma.
- **Dos capas de arista, ocultables por separado**: wikilink (fina, gris, sin etiqueta) vs Holon (gruesa, coloreada por tipo de relación, con etiqueta) -- con las 291 wikilink ocultas de un clic, el grafo se reduce a las 40 relaciones funcionales puras, verificado en el navegador.
- Los 20 Personajes en sus 3 carriles por `equipo` real (misma técnica de §8.37), el resto libre.
- Buscador real por nombre (foco + panel de detalle) y aislar-al-clic por tipo o por equipo -- reutiliza el patrón ya validado en `holon.html`, generalizado a cualquier agrupación.

**Bug real encontrado y corregido durante el despliegue, no en el código sino en la infraestructura**: `docker-compose.yml` monta cada fichero del visor uno a uno como volumen de solo lectura -- `grafo_maestro.html` daba 404 pese a existir en el host porque nunca se añadió su línea de montaje. Corregido añadiendo el mount y recreando el contenedor (`docker compose up -d --force-recreate`); copia local de `docker-compose.yml` sincronizada de vuelta desde el VPS para no divergir.

Desplegado y verificado en el navegador: 94 nodos reales, alternar wikilinks/Holon, aislar por tipo (`Oficio`) y por equipo, buscador probado con "Coordinador" -- foco correcto y panel de detalle con sus relaciones reales distinguiendo wikilink de Holon.

### 8.39 "Analiza el grafo maestro y haz una propuesta generosa para mejorar su representación"

El usuario compartió una captura real del `grafo_maestro.html` recién construido: se veía disperso, sin nombres legibles fuera de los cuadrados de Espacio/Módulo. Investigado en vivo, no solo por la captura -- inspeccioné el DOM real del grafo en el navegador (`window.debugMaestro`), no adiviné la causa.

**Bug real encontrado**: `font.color: '#0f1013'` (casi negro) aplicado a los 13 tipos por igual. Funciona en `box`/`square` (Espacio/Módulo) porque vis-network pinta la etiqueta *dentro* de esa forma, sobre su fondo claro. Pero en las otras 11 formas (`dot`/`diamond`/`triangle`/`star`/`ellipse`/`triangleDown`/`database` -- Personaje, Recurso, Regla, Oficio, Hilo, Arco, Sesión, Mapa, Estilo y los huecos honestos) vis-network dibuja la etiqueta *fuera* del nodo, sobre el canvas casi negro -- texto invisible. Confirmado leyendo el nodo `coordinador` directamente del DataSet: mismo `font.color` que `baserow`, pero una es legible y la otra no. El mismo bug llevaba desde `holon.html` (§8.37), enmascarado ahí porque solo tiene 29 nodos y la verificación se centró en la interacción, no en la legibilidad estática.

**Propuesta aplicada, las 4 partes**:
1. **Color de fuente por forma** -- claro (`#e7e7ea`) en todo lo que no sea `box`/`square`, oscuro solo donde el texto cae dentro de una forma clara. `formaConEtiquetaInterior()` decide cuál toca.
2. **Wikilinks apagados por defecto** -- arranca mostrando solo las 40 relaciones del Holon; el usuario activa las 291 narrativas si las quiere. Menos "hairball" de Módulos sueltos en la primera vista.
3. **Tamaño de nodo por corroboración real** -- ya no es fijo por tipo, usa `centralidad` del censo (`censo_entidades.json`, cruzado por `slug`) con grado real del propio grafo como respaldo para lo que el censo no cubre. Concilio, el más corroborado, ahora se ve visiblemente más grande que una referencia suelta.
4. **Etiquetas dependientes del zoom** -- alejado, solo los nombres más corroborados se leen de golpe; acercarse revela más, sin necesidad de aislar nada. Aislar un grupo o pasar el ratón por encima de un nodo fuerza su etiqueta visible sin esperar al umbral.

Verificado en el navegador, no solo en el código: zoom directo sobre "Concilio" y "Acervo Tecnico" -- ambos legibles, tamaño de Concilio mayor, zona "GUARDIA" bien rotulada; vista general de nuevo limpia tras "ver todo el grafo". Desplegado.

### 8.40 "Elimina las barras de segmentación, compara con el grafo Obsidian, analiza la estructura de carpetas contra Sheets"

**Barras eliminadas** de `grafo_maestro.html` y `holon.html` -- el fondo de carril + etiqueta CONCILIO/GUARDIA/FRONTERA pintado en `afterDrawing` quitado en ambos (`ETIQUETA_ZONA` y su bloque de dibujo). Se conserva el carril invisible (la `x` fija por equipo) porque sigue agrupando visualmente sin ensuciar -- solo se quitó el rectángulo de color y el rótulo.

**Comparación real con el Graph View de Obsidian**, a partir de `.obsidian/graph.json` (config real, no inventada) y las capturas que compartió el operador -- sin API, la comparación es de configuración + inspección visual, honesto sobre el límite:
- `hideUnresolved: true` en Obsidian -- oculta wikilinks a notas que no existen. Nuestro `grafo_maestro.html` los muestra a propósito como `referencia_sin_ficha` (2 nodos) -- diferencia real y deliberada, no un fallo: Obsidian esconde el hueco, nosotros lo señalamos.
- `showAttachments: true` -- Obsidian puede mostrar adjuntos como nodo. Encontrado 1 real en toda la bóveda: `Arquitectura_Nucleo.canvas`. Nuestro grafo solo recorre `.md`, así que ese nodo (si algo lo enlaza) aparecería en Obsidian y no en el nuestro -- diferencia real, de una sola pieza, no sistémica.
- `showTags: false` -- coincide con nuestro parser, que tampoco convierte `tags:` en nodos.
- El resto (colorGroups por `tipo:`, `showOrphans: false`) es exactamente el mismo criterio que ya aplicamos: agrupar por el campo `tipo` real del frontmatter.

**Estructura real de carpetas cruzada contra `MODULO_POR_ENTIDAD_MVP`** (`src/Ids.js`, la fuente de verdad real de qué módulo posee qué pestaña de Sheet): 14 fichas reales en `01_Mundo/Modulos/Modulos_acoplables/` + `CORE/`. Los 11 valores reales de `MODULO_POR_ENTIDAD_MVP` (CLIENTE/COMPRAS/CONVOCATORIAS/ECONOMICO/EJECUCION/ESCENARIOS/IMPACTO/OPERATIVA/OPORTUNIDAD/SEGUIMIENTO/VENTAS) tienen los 11 -- ninguno falta, ninguno sobra respecto al código. **3 fichas reales sin entrada en `MODULO_POR_ENTIDAD_MVP`**: Gantt, Comunicación, Aprovisionamiento -- verificado que no es deriva ni error: las tres ya tienen `vinculoReal` real (`GanttPlanReal.html`, `WebhookTelegramService.js`, `AprovisionamientoService.js`+`SOLICITUDES_MONTAJE`) -- son módulos reales que no poseen ninguna pestaña `ENTIDADES_MVP` propia (vista sobre entidades ajenas, integración externa, o una pestaña de utilidad fuera del MVP), no un módulo inventado. Sin cambios necesarios -- el cruce confirma que la bóveda ya es consistente con Sheets, no al revés.

### 8.41 "Que la representación responda al '¿cómo es?' -- un recorrido de inicio a fin, como el ADN o el cuerpo y sus extremidades"

Propuesta del operador sobre la vista `PAQUETE_CLIENTE` de `sheet-real.html` (3-4 nodos sueltos para Cronista, demasiado simple para representar un personaje entero): quiere que el retrato de una entidad se lea como un cuerpo real -- cabeza, columna, extremidades -- no como un grafo de fuerzas disperso.

**Validado con datos reales antes de construir**: el workflow real de Cronista (`grafo_n8n.json`) ya es, sin tocarlo, un grafo dirigido con forma anatómica genuina -- un punto de entrada real (`Webhook Cronista Segmentar`), un nodo de decisión real (`Ruta por acción`) que se ramifica, 78 nodos reales de 6 tipos (`code`:43 `httpRequest`:24 `if`:6 `switch`:1 `webhook`:2 `scheduleTrigger`:1). El layout de fuerzas de `sheet-real.html` lo aplanaba; un layout jerárquico dirigido no.

**Construido `extraer_anatomia_entidad.mjs`**: lee el `## Vínculo real` de cada ficha real y, según la fuente citada, calcula:
- **Cabeza** = nodo real sin aristas entrantes dentro del subgrafo (el punto de entrada de verdad, nunca supuesto por nombre).
- **Columna** = el camino dirigido real más largo desde esa cabeza -- DFS con corte de ciclos (un nodo ya visitado en el camino actual no se vuelve a entrar, así que un ciclo real no cuelga el cálculo).
- **Extremidades** = todo lo demás que cuelga de la columna.

Tres fuentes reales, mismo algoritmo para las tres:
- **n8n** (`grafo_n8n.json`) -- el workflow real citado por nombre.
- **Apps Script** (`tools/graphify/graph.json` + `concat-map.json`) -- pieza que faltaba: el código de Apps Script vive todo concatenado en un solo fichero para el análisis AST, así que no hay forma de saber de qué fichero real venía cada función sin este mapeo línea-a-línea real. Verificado con `AprovisionamientoService.js`: 32 funciones reales, 85 aristas reales.
- **Node** (`grafo_node.json`) -- columna = cadena real de `import` entre scripts; extremidades = sus `lee`/`escribe`/`toca_recurso` reales.

**Resultado real, honesto**: de 124 fichas, 62 tienen `## Vínculo real`; de esas, **31 entidades reales** resuelven a una anatomía calculable (n8n, Apps Script o Node) -- las que citan solo Sheet/Baserow no tienen columna que calcular (no hay flujo dirigido en una tabla), y no se les inventa una.

**Construida `anatomia.html`** -- décima vista real del visor: buscador de las 31 entidades reales, un panel por cada fuente (varias fuentes = varios miembros del mismo cuerpo, nunca fusionadas en un esqueleto falso), layout jerárquico dirigido izquierda→derecha (`vis-network`, sin librería nueva), cabeza en forma de estrella, columna resaltada por color de fuente, extremidades atenuadas.

**Dos bugs reales encontrados y corregidos verificando en el navegador**: (1) sin física, no hay evento de estabilización que dispare un `fit()` automático -- había que forzarlo a mano; (2) un `fit()` clásico sobre una columna larga (muchos niveles reales) da un zoom ilegible -- en vez de encoger todo el cuerpo, la vista centra en la cabeza a escala legible y se recorre a mano (arrastrando), con un botón "ver el cuerpo entero" para el `fit()` clásico si se quiere. Verificado con Cronista (78 nodos, columna de 14, forma de espina con costillas real) y con el caso grande, Repository (822 nodos reales, sin errores).

## 9. Pendiente

**Resuelto 2026-09-02:**
- ~~Producto/Proceso en el esquema de Misión~~ — decisión: sí entran como niveles propios ("siempre copiamos la verdad que vive en Sheets, nunca la simplificamos"). Añadido `jerarquia` (campanaId/proyectoId/productoId/procesoId/tareaId) a `mision.schema.json`, opcional para no romper los 5 fixtures de B0 ya verificados — re-verificado con `validar_b0.mjs`, 5/5 OK, sin regresión.
- ~~`STG_*` sin valor conceptual~~ — decisión: es la zona real de aterrizaje para carga masiva de datos de cliente. Diseño documentado en §6.5 (STG_* → paso de mapeo con IA controlada + Puerta Humana → `insertarRegistroTransaccional`, nunca escritura directa).
- ~~El Bocetador sin `espacio.schema.json`/`relacion.schema.json`~~ — construidos y verificados: `tools/gobierno/bocetador/` (schemas + 4 fixtures de Espacio + 3 de Relación + 1 fixture roto a propósito), `validar_bocetador.mjs` — gate real: 4/4 Espacios válidos, 3/3 Relaciones válidas con integridad referencial real (origenId/destinoId apuntan a nodos que existen), 1/1 fixture roto rechazado correctamente. Mismo criterio que B0.
- ~~Sin prototipo visual~~ — construido y probado en el navegador: `tools/gobierno/bocetador/app/` (§8.6). Pendiente real que queda: guardar/cargar bocetos propios (hoy solo "Descargar JSON") y ligar visualmente las flechas a las cajas (hoy son posiciones fijas, no bindings reales de tldraw).

**Sin resolver, con criterio ya fijado:**
- Leer filas de datos reales (no solo cabeceras) — el usuario aclara que serían datos simulados para ver comportamiento, no datos reales de cliente. Valoración: no bloqueante para la prioridad actual (ver `PROPUESTA_ECOSISTEMA_CONECTADO_ENGREMIAT.md`); sí sería útil antes de mapear `jerarquia` contra IDs reales de Producto/Proceso o antes de analizar `STG_*` columna a columna — hacerlo entonces, no antes.
- `37_ETIQUETA_IMPACTO` — decisión: queda fuera de Bastidor a propósito, será su propio módulo/proyecto/misión más adelante. No se vuelve a tocar aquí.
- Ninguna pestaña `STG_*` se ha analizado columna a columna todavía — ahora con un propósito claro (§6.5), sigue pendiente de hacerse.
