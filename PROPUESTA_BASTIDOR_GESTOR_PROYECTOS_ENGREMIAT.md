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

### 8.42 "Prefiero el concepto radial, y necesitamos también las entidades que surgen de Sheet y Baserow"

El operador comparó dos capturas: el layout jerárquico izquierda→derecha de `anatomia.html` (§8.41, resultado plano, poco legible) contra el layout radial de `sheet-real.html` (91_HISTORIAL, un hub central con satélites reales alrededor) -- prefiere el segundo como concepto. Pidió además cubrir las entidades que salen de Sheet/Baserow, no solo n8n/Apps Script/Node.

**Layout radial real, calculado a mano** (`vis-network` no trae uno nativo): BFS desde la cabeza da el anillo de cada nodo (cada paso real de distancia, un anillo más), y el ángulo de cada rama se reparte en proporción al número real de hojas de su subárbol -- una extremidad con mucho detrás ocupa más arco que una suelta, sin inventar pesos. Reemplaza el `layout.hierarchical` anterior, mismo dato (`espina`/`extremidades`) por debajo, solo cambia la geometría.

**Dos fuentes reales más, sin inventar ningún flujo nuevo**:
- **Sheet** -- los mecanismos que ya tienen su propio grafo dirigido real en `sheet-real.html`: `91_HISTORIAL` (por `correlationId`) y `PAQUETE_CLIENTE` (módulos activos por cliente), resueltos cuando una ficha los cita por nombre exacto en su `## Vínculo real` -- no cualquier pestaña suelta, solo las que de verdad tienen un flujo real que recorrer. `Zona de aterrizaje STG` y `Cliente` ganan así una segunda fuente real cada una.
- **Bóveda** (respaldo) -- para cualquier ficha real sin código/n8n/mecanismo Sheet propio, su cuerpo es su propio vecindario en el Holon (`grafo_wikilinks.json`, §8.33): las aristas semánticas dirigidas (`opera_en`/`depende_de`/...) como columna, los wikilinks reales como extremidades -- mismo dato ya calculado, sin construir nada nuevo. Cierra 18 entidades más (Concilio, los 8 Acervos, Coordinador, Ejecutor, Relevo, Mensajero, El Sheet, VPS y Tailscale, El Vault, Headscale, GASTO_API, DOCUMENTO_ENGREMIAT) que antes se quedaban sin cuerpo por no citar código directamente.

**Resultado real**: de 31 a **49 entidades con anatomía real** de las 124 fichas -- verificado en el navegador con Cronista (radial, columna de 14, forma de espina legible), Concilio (respaldo Bóveda, 68 nodos) y Cliente (2 fuentes reales a la vez, Node + Sheet).

### 8.43 "Las tablas son entidades con propiedades que pueden configurar su representación -- toda parte de Engremiat debe poder representarse, en Sheet y en Baserow"

Corrección justa del operador sobre §8.42: una tabla no tiene flujo de ejecución, pero eso no significa que no tenga una forma real que dibujar -- tiene columnas, y tiene relaciones reales con otras tablas. Investigado antes de construir, en los dos sistemas:

- **Sheet**: `tools/gobierno/bocetador/estructura_sheet.json` ya tiene las cabeceras reales de las 70 pestañas. 96 columnas reales terminan en `_ID` -- comprobado contra `ENTIDADES_MVP` (`src/Ids.js`, 47 claves reales, clave→hoja), una columna `CLIENTE_ID` apunta de verdad a `38_CLIENTE` por la misma convención de nombres que ya rige todo el proyecto. No se adivina la relación: se verifica contra el mismo diccionario real que ya gobierna qué pestaña pertenece a qué módulo.
- **Baserow**: `estructura_baserow.json` (dump real de la API, `/api/database/fields/table/{id}/`) ya devuelve el tipo real de cada campo -- 9 campos reales de tipo `link_row` conectan de verdad 5 de las 18 tablas (`PAQUETE_CLIENTE→ENTIDAD_ORGANIZATIVA`, `PERSONA_COMPETENCIA→PERSONA_ID/COMPETENCIA_ID`...). Baserow ya expone la relación, no hay que inferirla por convención.

**Construidas dos fuentes reales más** en `extraer_anatomia_entidad.mjs`: `fuenteSheetSchema` (cabeza = la pestaña citada con menos aristas de FK entrantes; columna = la cadena real de FK entre pestañas; extremidades = sus columnas reales) y `fuenteBaserowSchema` (mismo criterio, relación real vía `link_row` en vez de inferida). Una tabla sin código propio ya tiene, con esto, exactamente el mismo tipo de retrato que un script o un workflow -- solo que su "recorrido" es su esquema real, no su ejecución.

**Resultado real**: de 49 a **60 entidades con anatomía real** de 91 (excluyendo las 32 fichas-relación de `07_Holon_Relaciones/`, que no son entidades). Los 11 módulos de negocio (Ventas, Compras, Oportunidad, Impacto, Convocatorias, Económico, Seguimiento, Ejecución, CORE) ganan cuerpo real por primera vez -- verificado con Ventas (cadena real de FK `39_PEDIDO_CLIENTE`→`43_CONTRATO_SERVICIO`→`38_CLIENTE`) y `DOCUMENTO_ENGREMIAT` (9 campos reales de Baserow). Quedan 31 sin cubrir, honestamente: 25 son narrativas puras (arcos, sesiones, hilos abiertos, sin ninguna relación real que dibujar) y 6 citan código/infraestructura que Graphify no puede leer todavía (un script más nuevo que `grafo_node.json`, un `.ps1`, configuración de red) -- documentado, no oculto.

### 8.44 "¿Merece la pena regenerar grafo_node.json para cerrar Física?"

Sí -- confirmado antes de hacerlo: `mapear_grafo_node.mjs` recorre todo `tools/` de verdad (incluido `tools/gobierno/graphify_visor/`), no un subconjunto fijo -- el `grafo_node.json` de antes estaba simplemente desactualizado, generado antes de construir el censo/Holon/anatomía de esta sesión. Solo lectura, sin riesgo. Regenerado: de 89 a **59 scripts + 41 ficheros de datos + 21 recursos compartidos = 121 nodos reales, 155 aristas**.

`Física` gana su fuente Node real (`analizar_entidades_reales.mjs`, 13 nodos -- los `.json` reales que lee/escribe: `censo_entidades.json`, `grafo_wikilinks.json`, `PAQUETE_CLIENTE`...). De 60 a **61 entidades con anatomía real de 91**. Ningún otro hueco se cerró con este regenerado -- los 30 restantes siguen siendo el límite honesto ya documentado en §8.42 (narrativas puras o código/infraestructura que Graphify no lee).

### 8.45 "¿Es esto la expresión viva de crecer y decrecer que buscamos? Avanzamos a construirlo así"

Propuesta como asesor técnico y de teoría de grafos, a partir de la captura de `Chequear librería clientes` (9 nodos reales): con el macro (`grafo_maestro.html`) y el micro (anatomía por entidad) ya construidos, la pregunta de fondo pasa a ser **cuál es la unidad mínima real que merece ficha propia** -- no solo tamaño de cuerpo, sino identidad.

**Investigado antes de proponer**: crucé `corroboracionCruzada` (censo) contra tamaño real de cuerpo (anatomía) para las 61 entidades -- son señales casi sin correlación. Oficios de un solo nodo (`Cerrar ciclo`) ya son personajes completos. Pero doce entidades del componente compartido del Holon (Concilio, los 8 Acervos, El Sheet, El Vault, Headscale, Mensajero) devolvían **el mismo cuerpo, cabeza y columna, letra por letra** -- confirmado comparando `Concilio`/`Acervo Tecnico`/`El Sheet`/`Mensajero` a mano. Causa real: `calcularEspina()` elegía el mejor camino GLOBAL del grafo compartido, no el camino desde la posición propia de cada entidad -- un bug real, no una propiedad del universo.

**Propuesta aceptada y construida**: dos preguntas, no una, para que una unidad de código real tenga ficha propia:
1. **¿Tiene agencia real?** -- aristas reales salientes desde su propia cabeza. Nueva métrica `agenciaReal` en cada fuente.
2. **¿Tiene una posición propia distinguible?** -- corregido forzando la raíz de `calcularEspina()` en la propia entidad (`raizForzada`) para la fuente relacional, en vez de dejar que el algoritmo elija la mejor entrada global. Nueva métrica `territorioPropio`: de la columna real de una entidad, qué % no aparece en la columna de ninguna otra del mismo componente -- cuánto de su cuerpo es identidad exclusiva frente a sustrato compartido.

**Resultado real, verificado**: `Concilio` ahora tiene su propia cabeza (`concilio`), columna de 3 pasos, agencia 19, territorio propio 0% (honesto: está en el centro del sustrato, casi todo lo comparte). `El Sheet` revela algo nuevo y honesto: columna de 1 solo paso -- no tiene ninguna relación Holon saliente propia, es un espacio que recibe, no que actúa. `Acervo Tecnico` y `Mensajero` ya tienen cuerpos propios, distintos entre sí. Esto es la expresión viva de crecer/decrecer en dos niveles: el *cuerpo* (tamaño, ya vivo desde §8.41 al regenerarse del código real) y ahora la *identidad* (agencia y territorio propio, recalculables cada vez que el censo se regenera) -- un componente puede madurar hacia personaje real o disolverse en el sustrato compartido, medido, no decidido a mano.

Desplegado y verificado en el navegador.

### 8.46 "¿Qué nos diferencia entre nodos y qué nos parece? El perfil del personaje, su familia"

Construida la propuesta de §8.45 (rol real): `calcularRolReal()` en `extraer_anatomia_entidad.mjs` toma el verbo real dominante de las aristas que salen de la propia cabeza y lo traduce a un vocabulario pequeño de roles universales, comparable entre las siete fuentes -- `Operador` (opera_en), `Guardián` (gobierna_a/verifica_a/corrige_a), `Proveedor` (alimenta_a), `Orquestador`/`Dependiente` (depende_de, según el número), `Ejecutor` (llama, Apps Script), `Compositor` (import, Node), `Utilidad` (lee/escribe/toca_recurso sin import), `Esquema dependiente` (FK/link_row), `Disparador`/`Decisor` (n8n, por tipo real del nodo de entrada), `Pasivo` (sin ninguna arista funcional real).

**Bug real encontrado y corregido durante la construcción**: el `wikilink` (mención narrativa) competía con los verbos Holon reales por ser "dominante" -- y a veces ganaba, aunque no sea una acción funcional. Corregido excluyendo `wikilink` del cálculo de rol (sigue contando para `agenciaReal`, que mide "actúa", no "qué tipo de acción").

**Resultado real, verificado**: los 8 Acervos, Headscale, Relevo y Mensajero comparten la misma familia real (`Operador`, 9 miembros) pese a estar en tres equipos distintos (Concilio/Guardia/Frontera) -- el parecido es de comportamiento, no de vecindario, exactamente la pregunta planteada. `Concilio` sale solo en `Orquestador` (depende de 7 cosas reales). `El Sheet` cae en `Pasivo` -- cero aristas Holon salientes propias, solo se le menciona. 26 entidades (los módulos de negocio y tablas) caen en `Esquema dependiente`.

**Construido en `anatomia.html`**: panel "Familias reales" en el lateral, con el conteo real de cada rol, clicable para filtrar la lista de entidades -- y el rol visible como insignia en cada ficha de fuente. Verificado: filtrar por "Operador" muestra los 8 Acervos + Headscale/Relevo/Mensajero; la ficha de Acervo Técnico muestra la insignia "Operador" junto a "BÓVEDA".

Con esto, la ficha de personaje completa (§8.45+8.46) responde: **quién soy** (agencia + territorio propio), **de qué familia soy** (rol real), **con quién hablo** (extremidades) -- las tres, sacadas del mismo dato real, sin redactar nada a mano.

### 8.47 "Empezamos por el puente de datos + los design tokens, será una herramienta fundamental para el Bastidor"

Investigado antes de construir (§8.46 cierre): busqué herramientas gráficas reales que pudieran consumir el dato de anatomía sin reinventar nada -- AntV G6 (JSON-nativo, layouts de clúster, `treeToGraphData`) para dibujar familias/miembros; Design Tokens en formato DTCG (estándar W3C 2026) + Style Dictionary para consolidar el estilo; Rive señalado para más adelante, cuando exista el panel del juego (Data Binding real, ya usado en producción por Duolingo para fichas de personaje). El operador pidió empezar por las dos piezas de datos, no por el dibujo todavía.

**Construido `exportar_atlas_familias.mjs`**: convierte `anatomia_entidades.json` (grafo en bruto, pensado para calcular) en `atlas_familias.json` (datos aplanados, pensados para dibujar) -- cruza censo (corroboración/centralidad), wikilinks (tipo real) y Holon (equipo real). Una entidad puede aparecer en varias familias si de verdad juega varios roles reales -- nunca forzada a una sola. Real: **11 familias, 70 apariciones de entidad de 61 entidades reales**.

**Construido `design-tokens.json`**: fuente de verdad real del estilo, formato DTCG. Consolida los colores de equipo/tipo/fuente/rol que hoy viven repetidos y ya ligeramente divergentes entre `grafo_maestro.html`/`holon.html`/`anatomia.html` -- **encontradas y documentadas dos colisiones reales de color por accidente** (`fuente.n8n` = `equipo.frontera`, `fuente.node` = `equipo.guardia`), nunca corregidas antes porque cada vista se diseñó por separado sin mirar las otras. Los roles reales sin ningún miembro hoy (Guardián/Proveedor/Decisor/Actor/Destino) quedan marcados `reservado` en vez de omitidos -- el color ya existe para cuando aparezca la primera entidad real, no se improvisa entonces.

**Construido `generar_tokens_css.mjs`**: equivalente funcional a Style Dictionary sin dependencia npm -- mismo criterio de todo `tools/` (solo Node built-in). Lee el JSON DTCG y escribe `tokens.css` con las variables reales. 46 tokens exportados, verificado.

**Pendiente honesto, explícito**: las tres vistas existentes (`grafo_maestro.html`/`holon.html`/`anatomia.html`) todavía no leen `tokens.css` -- siguen con sus paletas hardcodeadas propias. Migrarlas es el siguiente paso natural, no hecho todavía a propósito (el operador pidió el puente primero).

Desplegado (con un tropiezo real de infraestructura corregido en el camino: montar un fichero que todavía no existe en el host crea un directorio vacío en Docker, no un placeholder -- hubo que parar el contenedor, borrar los 3 directorios fantasma, subir los ficheros reales y arrancar de nuevo) y verificado: `atlas_familias.json`/`design-tokens.json`/`tokens.css` sirven con 200 real desde el VPS.

### 8.48 "Migra las tres vistas a tokens.css"

Cerrado el pendiente explícito de §8.47. Las tres vistas (`grafo_maestro.html`, `holon.html`, `anatomia.html`) ya no hardcodean su propia paleta -- enlazan `tokens.css` y leen cada color real vía un helper `tokenColor(nombre)` (`getComputedStyle(document.documentElement).getPropertyValue('--' + nombre)`), nunca un hex propio del fichero.

**Hueco real encontrado al completar la migración**: `grafo_maestro.html`/`holon.html` usan `COLOR_REL` (los 8 verbos del Holon) para colorear aristas -- ese grupo no existía todavía en `design-tokens.json`. Añadido `color.relacion.*` (los mismos 8 verbos + wikilink) antes de migrar, para no dejar colores sin token. **Tercera colisión real encontrada y documentada**: `color.relacion.opera_en` (#4c9aff) y `color.rol.operador` (#2dd4bf) no coinciden, pese a que el rol Operador se define justo como "opera_en dominante" -- dos paletas construidas en momentos distintos de la sesión (leyenda de arista vs. filtro de familia) para el mismo concepto real, nunca reconciliadas. Documentado en `$extensions`, no fusionado a ciegas.

**De propina, con el mismo token ya disponible**: la insignia de rol y la leyenda de "Familias reales" en `anatomia.html` ahora se colorean con el `color.rol.*` real de cada familia (antes eran neutras) -- primer resultado visual concreto del "Atlas de familias" sin esperar a G6.

Verificado en el navegador: las tres vistas renderizan idénticas a como estaban, sin errores de consola -- el cambio es de dónde sale el color, no de qué color es.

### 8.49 "Haz una revisión completa e investiga sobre TODOS los ciclos que hemos consolidado"

Investigado con grep sistemático sobre toda la bóveda y todo el repo (`ciclo`/`ciclo real`/`ciclos reales`), no desde memoria. Resultado: **9 mecanismos de ciclo reales**, no los 4 propuestos en la vuelta anterior -- y de naturaleza genuinamente distinta entre sí, lo que confirma que forzarlos a un único esquema (como hacía el boceto de GPT con Campaña→Misión→Tarea) habría sido deshonesto.

**Construido `mapear_ciclos_reales.mjs`** con un componente `Cycle` real por cada uno, tagueado por `naturaleza`:
- **jerarquia** (1) -- Campaña→Proyecto→Producto→Proceso→Tarea, con `parentCycle` real derivado del propio número de hoja de `ENTIDADES_MVP` (`src/Ids.js`) -- mismo criterio de orden ya usado en `extraer_anatomia_entidad.mjs` para las FK.
- **ciclo_vida** (2) -- la Misión real (14 estados, B0-validado, `grafo_telar_estados.json`) y la ejecución real del workflow de Cronista (su columna ya calculada en `anatomia_entidades.json`, reusada sin recalcular nada).
- **plantilla** (1) -- el ciclo de trabajo del Telar (Urdimbre→Trama→Hilo conductor→Parte de Vigilia/Relevo), citado literalmente de `Telar.md`, marcado `domain-agnostic` en su propia ficha. La Misión lo instancia de verdad (`instanciaDe: plantilla_telar`).
- **operativo** (4) -- `ciclo_autonomo.mjs` (dispara→espera→comprueba→reintenta→cierra, de su propio comentario de cabecera), `CICLO_AUDITORIA_ENGREMIAT.md` (4 fases reales + Triage), `METRICA_FABRICACION` del Coordinador (agregado real de `99_TRIAGE_LOCAL`), y el propio censo de esta sesión ("dato real → hueco real → ficha real", ya nombrado así en este mismo documento).
- **fisico** (1) -- El ciclo de vida remoto, con los mismos IDs reales que ya usa `Mensajero.md`.

**Dejados fuera a propósito**: los 4 "ciclos reales" ya encontrados en §8.23 vía Tarjan/DFS (la malla del Holon, dos scripts que se referencian, ficheros de datos compartidos) -- son bucles estructurales de dependencia en el código, no procesos que se repiten en el tiempo. Meterlos en `Cycle` habría inventado una recurrencia temporal inexistente. Se quedan donde ya viven, en el censo.

Desplegado y verificado: `ciclos_reales.json` sirve 9 ciclos reales desde el VPS.

### 8.50 "Empezamos por la Fase 2 (la mesa de montaje)"

Construida la primera pieza real del plan del Bastidor en lenguaje llano (Fase 2 de 5): `mesa_montaje.html` -- undécima vista del visor.

**Investigado antes de construir**: ya existía un precedente real (`tools/gobierno/bocetador/app`, React+tldraw), pero es un lienzo libre sin conexiones tipadas ni guardado real -- su propio pendiente ya decía "guardar/cargar bocetos" y "ligar visualmente las flechas a las cajas" sin resolver. Se construyó una pieza nueva, coherente con el resto del visor (vanilla JS, sin framework nuevo, servida igual que las otras diez vistas) en vez de extender un prototipo que no encajaba con lo que pide la Fase 2.

**Qué hace, en real**: paleta con las 91 entidades reales agrupadas por familia real (`atlas_familias.json`); clic para colocarlas en la mesa; clic en dos piezas para conectarlas -- solo con los 8 tipos de relación reales del Holon, nunca una flecha inventada. Un "montaje" (piezas + conexiones + nombre) es una máquina/universo real, guardable en `localStorage` (honestamente marcado como "solo este navegador") y exportable/importable como JSON de verdad.

**Dos bugs reales encontrados y corregidos verificando en el navegador, no adivinando**:
1. El modal de conexión vivía anidado dentro del contenedor que se le pasa a `vis-network` -- la librería limpia el contenido de su propio contenedor al construirse, así que el modal desaparecía antes de que el script llegara a rellenarlo. Corregido: modal hermano, no hijo, posicionado con CSS `absolute`.
2. El contenedor de la mesa crecía sin límite (25000px de alto) -- el clásico fallo de flexbox de un hijo `flex:1` sin `min-height:0` dentro de un padre en columna.

**Verificado de extremo a extremo**: 2 piezas reales colocadas (`92_BUS_TRABAJO`, `Coordinador`), 1 conexión real creada (`opera_en`), montaje guardado con nombre y listado correctamente. La verificación con el driver de automatización tuvo su propio desajuste de escala en las coordenadas de clic (no del código real) -- resuelto disparando eventos sintéticos en las coordenadas reales del canvas, vía la propia API de `vis-network`.

### 8.51 "Seguimos con la Fase 3"

Añadido el motor de estados sobre la misma mesa de montaje (§8.50), no una vista nueva -- cada pieza colocada gana un estado real: `en_reposo` / `bloqueada` / `activa` / `terminada`. Regla de oro aplicada tal como se investigó en los informes de arquitectura (§8.47): **nada se mueve porque sí, solo por un evento real, disparado a mano y anotado**.

**Mecánica real, no inventada**:
- `bloqueada` se calcula de verdad a partir de las aristas `gobierna_a` entrantes ya dibujadas en la mesa -- si algo real la gobierna y ese gobernador todavía no está `activa`, está bloqueada. No hay estado bloqueado sin una conexión real que lo justifique.
- El evento **Activar** solo está disponible si la pieza tiene agencia real (`agenciaReal > 0`, el mismo dato ya calculado en §8.45).
- El evento **Aprobar** solo aparece en una pieza `activa` con `gobierna_a` saliente real, y desbloquea de verdad a quien gobierna -- ni antes, ni a otra pieza.
- Cada evento queda en un registro visible, con hora exacta, pieza, y de qué estado a qué estado -- la memoria mínima que pedían los informes, aunque todavía viva solo en esta sesión de navegador (la Fase 4, memoria compartida de verdad, es el siguiente paso natural, no este).

**Verificado de extremo a extremo con una relación real ya conocida**, no un ejemplo de juguete: `Puerta Humana gobierna_a Coordinador` (la misma relación del Holon, §8.33). Coordinador arranca `bloqueada` en cuanto se dibuja la conexión. Activar Puerta Humana (agencia real 1) no desbloquea nada por sí solo -- hace falta el evento explícito **Aprobar**, y solo entonces Coordinador pasa a `en_reposo`. Registro de eventos con 2 entradas reales, timestamps correctos, verificado en el navegador.

### 8.52 "Sigue Fase 4"

Fase 4 del plan del Bastidor (la memoria compartida real, "más allá de este navegador"). Antes de escribir código nuevo, investigado qué infraestructura real ya existía para reutilizar en vez de inventar: `tools/gobierno/spike_concilio_coop/servidor.mjs`, ya corriendo en el VPS (contenedor `engremiat-spike-concilio`), confirmó el patrón correcto -- un servidor Node propio, pequeño, con credenciales (cuando las hay) solo del lado servidor, nunca en el navegador. Ese servidor es de un dominio distinto (deliberación del Concilio con DeepSeek), así que no se extendió -- se construyó uno nuevo y mínimo siguiendo el mismo patrón real, no una pieza SaaS.

**Qué se construyó**: `servidor_memoria.mjs`, primer y único servicio de ESCRITURA de todo el visor (las once vistas anteriores son solo lectura vía `npx serve`). Sin credenciales externas -- persiste en un fichero JSON real en disco (`./datos_memoria`, montado `rw`, fuera del sync de código versionado). Deliberadamente NO Baserow todavía: mismo criterio de "no infraestructura prematura" ya validado al leer los dos informes de arquitectura (§8.47) -- migrar a Baserow es el paso natural si el fichero se queda corto, no antes. Tres rutas reales: `GET /api/memoria`, `POST /api/eventos` (timestamp puesto por el servidor, no por el cliente -- ningún navegador puede mentir sobre cuándo pasó algo), `POST`/`DELETE /api/montajes`.

**`mesa_montaje.html` actualizado**, no reescrito: `localStorage` pasa a ser el respaldo real (nunca desaparece, la mesa sigue funcionando sin conexión) y la memoria compartida (`100.107.171.88:9330`) pasa a ser la fuente cuando está conectada. El estado de conexión se muestra honestamente en pantalla -- "memoria compartida conectada" o "sin conexión, guardando solo en este navegador" -- nunca fingido como conectado si no lo está.

**Desplegado**: segundo servicio en el mismo `docker-compose.yml` del visor, mismo criterio de mínimo privilegio (atado solo a Tailscale, `100.107.171.88:9330`).

**Verificado, con un límite honesto**: el servidor responde con datos reales por dos vías independientes -- `curl` real por SSH contra el propio VPS, y navegación directa del navegador a `http://100.107.171.88:9330/api/memoria`. Se añadió la cabecera `Access-Control-Allow-Private-Network` (Chrome trata el rango CGNAT de Tailscale, `100.64.0.0/10`, como red privada a efectos de Private Network Access). Lo que **no** se pudo verificar dentro de esta sesión: el `fetch` cross-origen específico desde la pestaña de automatización de pruebas (herramienta de navegador en sandbox) falla con `ERR_BLOCKED_BY_CLIENT` y sin ninguna traza de red registrada -- un límite del entorno de pruebas automatizado, no del código real (la navegación directa al mismo puerto, desde la misma pestaña, sí funciona). El respaldo local se verificó de extremo a extremo (montaje guardado y listado correctamente con la memoria compartida desconectada). Pendiente: que el operador confirme en su propio navegador real que el mensaje pasa a "conectada".

### 8.53 "Continua Fase 5"

Fase 5 del plan del Bastidor (universos completos), cerrando el ciclo de 5 fases. Sobre la misma mesa de montaje (§8.50-52), no una vista nueva.

**Qué significa "universo completo" en real, no en metáfora**: no un cliente nuevo inventado (La Troballa/Gestor de Proyectos eran solo ejemplos ilustrativos del propio plan, §8.51 en adelante) sino el puente con el dato real que ya existía en el visor desde antes (`grafo_paquete_cliente.json`, "qué módulos reales tiene encendidos cada cliente real", Baserow PAQUETE_CLIENTE). Hoy hay exactamente **un** cliente real ahí: "Piloto Plaza (interno)", con 3 módulos activados.

**Qué se construyó**: sección nueva "Universos reales" en la paleta -- lista cada cliente real con sus módulos, y un botón "Cargar este universo real" que coloca en la mesa las piezas reales del almacén que le corresponden (nunca las duplica, las referencia por slug igual que cualquier otra pieza) y nombra el montaje con el nombre real del cliente. El mapeo módulo→pieza es por normalización de nombre, y si es ambiguo **no adivina** -- lo deja sin ficha antes que inventar una correspondencia falsa.

**La honestidad como parte del diseño, no un añadido**: "Piloto Plaza (interno)" tiene 3 módulos reales activados en Baserow (CRONISTA, AGORA, EJECUTOR_LOCAL), pero el almacén solo tiene ficha real para 2 (Cronista, Ejecutor) -- AGORA no tiene anatomía/atlas todavía. En vez de ocultar esto o inventar una ficha para que cuadre, la mesa lo dice tal cual en pantalla: "activados en Baserow pero sin ficha en el almacén todavía: AGORA". El origen completo (de qué cliente viene, cuándo se generó el dato, qué huecos tiene) viaja con el montaje guardado -- sobrevive a `localStorage` y a la memoria compartida de la Fase 4 por igual.

**Bug real encontrado y corregido durante la propia verificación** (no en el código nuevo de la Fase 5, sino en `vaciarMesa()`, ahí desde la Fase 3): `nodes.get(null)` en vis-network devuelve `[]` -- un array vacío, valor *truthy* -- nunca `null`/`undefined`, así que la guarda `if (!n)` de `renderFichaPieza` no se activaba nunca y `n.estado.replace(...)` fallaba con `n = []`. No se había disparado antes porque el botón "Vaciar mesa" pasa por un `confirm()` que en las pruebas automatizadas previas se saltaba sin ejecutar la función real. Corregido evitando pasarle `null` al `DataSet` en vez de confiar en lo que devuelve.

**Verificado de extremo a extremo**: cargar el universo real de "Piloto Plaza (interno)" coloca 2 piezas reales (Cronista, Ejecutor), muestra el hueco real de AGORA, guarda el montaje con su `origenReal` completo, y al recargarlo (`cargarMontaje`) el hueco y el origen se restauran exactamente igual -- probado con `localStorage` (la memoria compartida seguía con el mismo límite conocido del sandbox de pruebas, §8.52).

**Con esto se cierran las 5 fases del plan del Bastidor** (almacén de piezas → mesa de montaje → motor de estados → memoria compartida → universos completos). El plan original preguntaba "¿podemos hacer máquinas con las piezas de Engremiat para construir universos?" -- la respuesta construida y verificada es sí, con un límite real y explícito: el puente a universos completos existe y funciona, pero solo hay un universo real cargado en Baserow hoy, y una pieza real (AGORA) que el almacén todavía no conoce.

### 8.54 "Actúa como experto en juegos cooperativos multiplataforma... investiga y empieza el paso 1"

Cerradas las 5 fases del Bastidor (§8.50-53), el operador pidió valorar el encaje de todo lo construido con Engremiat como **juego cooperativo real**, no una metáfora. Investigado con datos reales: Engremiat ya tiene **tres modos de juego cooperativo reales y distintos**, construidos en momentos distintos sin saber que convergían -- Concilio (deliberación en tiempo real, 2 humanos + IA), Feria/Taller (`PLANTILLA_MISION`, escenarios versionados con puerta humana, grupo de Telegram), Telar (ficción interactiva individual, DeepSeek narra). Investigación externa real (diseño de cooperativos, gamificación de PM) confirmó que la propia jerarquía `Proyecto→Proceso→Tarea` del Sheet **ya es** la estructura quest→misión→tarea que la literatura de gamificación de gestión de proyectos describe -- no hay que inventar una capa de juego, hay que exponer la que ya existe (`TAREA_COMPETENCIA`+`NIVEL_MINIMO` = prueba de habilidad real; `DECISION`/`INCIDENCIA` = complicaciones reales).

**El Narrador -- hallazgo, no invención**: buscando qué personaje real "acompaña al visitante a resolver misiones", ninguno de los 17 `personaje` del atlas encajaba -- pero la ficha `Narrador.md` **ya existía** en la bóveda (`estado: por_construir`), con prosa casi idéntica a lo que se diseñó en esta misma conversación ("acompaña al usuario en su propia aventura por el sistema... narra la historia mientras se recorre") y aclarando explícitamente que no delibera en Concilio. Se dejó su estado real tal cual -- no se fingió que ya está construido.

Decidido con el operador: el visitante real es **el cliente real** (ej. alguien de La Troballa), y el juego puede tanto narrar trabajo ya real (por defecto, sin escribir nada -- mismo aislamiento que ya usa Taller con `taller_ref:ID`) como proponer trabajo nuevo jugando (reutilizando el patrón proponer/confirmar de Cronista, con puerta humana).

**Paso 1, construido y verificado real**: `servidor.mjs` (Concilio, spike) ya no hardcodea el roster de 7 Acervos -- lo construye desde `personajes.json`, generado por `generar_dialogos.mjs` (ya existía, sin usarse para esto: "un solo motor, dos pieles"). Filtro real: un Acervo delibera si su propia prosa del vault no dice "no delibera" -- así Acervo Prompter y Narrador quedan fuera sin mantener una lista de exclusión a mano. Verificado en real tras redeploy limpio: `docker logs` confirma "lobby de 7 Acervos" en `100.107.171.88:2568`.

Sources: [coopboardgames.com -- cooperative storytelling/RPG rankings](https://coopboardgames.com/rankings/best-storytelling-board-games/), [Gamified project management system and method (patente)](https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/10606584), [Baldur's Gate 3 Companions Guide](https://baldursgate3.wiki.fextralife.com/Companions).

### 8.55 "El visitante puede no tener proyecto -- el Narrador acompaña a construir universos, además de misiones"

Antes de construir el modo lectura, comprobado el vínculo real Cliente↔Proyecto (`02_PROYECTOS.CLIENTE_ID`) que hacía falta para resolver "los proyectos reales de este cliente" -- **roto en real**: de 26 Proyectos, solo 6 tienen `CLIENTE_ID`, y esos 6 apuntan a `CLI-0003`/`CLI-0004`, clientes que no existen en `38_CLIENTE`. `PRO-0001` ("La Troballa - Taller Ocupacional"), el más obvio candidato real, no tiene `CLIENTE_ID` en absoluto.

El operador corrigió el orden: el visitante puede llegar sin ningún proyecto real todavía -- el Narrador tiene que poder **acompañar a construirlo**, no solo narrarlo. Esto resuelve el bloqueo anterior sin arreglarlo primero: un Proyecto nuevo creado por este modo recibe su `CLIENTE_ID` correcto desde el momento de nacer, así que el modo lectura tendrá datos bien enlazados de forma orgánica, sin depender de arreglar el histórico.

**Ningún mecanismo nuevo** -- recombina dos ya reales y probados: la elicitación corta de Telar (pocas preguntas, DeepSeek sintetiza sin inventar fuera de lo dado) + el patrón proponer/confirmar de Cronista (solo un humano confirma, nunca se escribe directo).

**Construido y verificado real**: `narrador_construir_proyecto.mjs` -- la mitad "proponer". Tres respuestas reales → DeepSeek devuelve un `Proyecto` real estructurado, con `TIPO_PROYECTO`/`PRIORIDAD` leídos EN VIVO de `90_CONFIGURACION` (nunca duplicados a mano). Probado con un escenario plausible de La Troballa (taller de macetas de barro, encargo real de un vecino): clasificó `TIPO_PROYECTO=ENCARGO_CLIENTE` del catálogo real, y cuando faltó un dato real (cantidad de barro, tiempo de secado) lo anotó en `OBSERVACIONES` en vez de inventarlo. Coste real: $0.00059. La mitad "confirmar" (escritura real vía `insertarRegistroTransaccional`) necesita una acción nueva en el webhook real -- diseñada, **no desplegada**, pendiente de confirmación explícita antes de tocar producción.

### 8.56 "Diseña y despliega" -- la mitad "confirmar" del Narrador, real

Nueva acción real `confirmar_proyecto_narrador` en el dispatcher del webhook (`WebhookTelegramService.js`) -- escribe un `PROYECTO` real vía `insertarRegistroTransaccional`, mismo patrón exacto que `actualizar_cliente_montaje`. Desplegada de verdad (`clasp push` + `clasp deploy -i` sobre el deployment fijo, versión @37) y **verificada con una escritura real**: `PRO-0046`, `TEST-Narrador-2026-09-04 -- Taller de macetas de barro para otoño`.

**Un bug real encontrado y corregido en el propio camino de verificación**: `narrador_construir_proyecto.mjs` leía la columna `CLAVE` de `90_CONFIGURACION` (identificador interno, ej. `ENCARGO_CLIENTE`) en vez de la columna `VALOR` (el texto real que espera la celda, "Encargo de cliente") -- la primera escritura de prueba falló exactamente por esto, con un error real y honesto del propio `insertarRegistroTransaccional` (`ERROR_INSERCION_PROYECTO: Campos obligatorios ausentes o vacíos: ESTADO`, que además reveló un segundo campo real que faltaba). Corregido: `ESTADO` se fija ahora a `Borrador` de forma determinista (nunca pedido a la IA -- es un hecho fijo de todo Proyecto recién propuesto, no una decisión creativa).

### 8.57 "Construye los dos puntos" -- primer rediseño real de Bastidor

Los dos puntos de la valoración anterior (§8.56 fin), construidos y verificados.

**1. Paleta en pestañas reales** -- Reparto (17 personajes reales, "quién actúa") / Módulos (18, "qué tipo de historia") / Escenario (recurso+oficio+espacio+regla, el fondo fijo, nunca elenco elegible), sustituyendo la lista única mezclada por familia. Verificado en el navegador: cada pestaña filtra de verdad por `tipo` real de la pieza.

**2. Tablero de Misiones reales, en vivo** -- `servidor_memoria.mjs` gana `GET /api/proyectos`: lee `02_PROYECTOS` EN VIVO con credenciales JWT solo del lado servidor (mismo patrón ya probado en `spike_concilio_coop`/`narrador_construir_proyecto.mjs`), caché de 30s para no golpear la API de Sheets en cada pintado. La mesa lo muestra como tarjetas reales con `ESTADO`/`TIPO_PROYECTO`/`PRIORIDAD` -- literalmente "simular el trabajo real del Sheet desde Bastidor", lo que pedía el operador.

**Hallazgo real, corregido antes de darlo por bueno**: el `clienteId` de un universo cargado desde Baserow (`cliente:PAQ-0001`) y el `CLIENTE_ID` real del Sheet (`CLI-0001`) son dos espacios de IDs distintos, sin puente verificado entre ellos -- filtrar por igualdad literal habría fingido un cruce que no existe. Corregido: el filtrado por cliente solo se activa cuando el id real tiene forma de `CLIENTE_ID` del Sheet; en cualquier otro caso se muestra el tablero completo, con una nota honesta explicando por qué no está filtrado, en vez de mostrar "0 misiones" de forma engañosa.

### 8.58 "Empieza sincronizando Bocetador"

`cargar_desde_vault.mjs` regenerado (solo lectura de la bóveda real) sobre las dos copias reales (`bocetador/universo_real.json` y la que la app empaqueta, `app/src/universo_real.json`): 10 Espacios, 5 Recursos, 21 Módulos, 20 Personajes (**Narrador y Pregonero ya incluidos**, faltaban en la copia anterior), 11 Oficios, 6 Reglas, 32 Relaciones -- 73 nodos reales. Verificado en el navegador de verdad: `npm run dev`, la app carga **108 figuras sin ningún error**, con un único aviso honesto propio (3 relaciones que referencian un grupo descriptivo sin caja propia, marcado explícitamente "no es un error"). `validar_bocetador.mjs` sigue **APROBADO**.

**Hallazgo real, anotado, no corregido en esta pasada**: `encontrar_huecos.mjs` (§8.57) cruza Sheet/Baserow contra `vinculoReal`, pero solo lee `fixtures/` -- un puñado de ejemplos ilustrativos (4 Espacios, 2 Personajes...), no la bóveda completa. Y `cargar_desde_vault.mjs` tampoco extrae las secciones reales "## Vínculo real" -- solo "## Relaciones". Son **dos parsers reales del mismo vault, sin compartir datos** (el Bocetador y `extraer_anatomia_entidad.mjs` del Graphify Visor) -- por eso el informe de huecos entiende mucha menos cobertura real de la que existe hoy. Queda anotado como pendiente real, no urgente.

### 8.59 "Soluciona esto" -- unificados los dos lectores del vault

Resuelto el hallazgo anotado en §8.58. `cargar_desde_vault.mjs` gana `extraerVinculoReal(cuerpo)` -- **misma lógica real** ya probada en `extraer_anatomia_entidad.mjs` (`Sheet:\`XX_NOMBRE\``, `Baserow:\`NOMBRE\``), reutilizada letra por letra, no reinventada -- y añade el campo `vinculoReal` a cada nodo real del `universo_real.json` que tenga citas. `encontrar_huecos.mjs` completa el bucle que antes estaba vacío para leer estos vínculos reales, además de los ejemplos ilustrativos de `fixtures/`.

**Resultado real, verificado ejecutando el propio informe**: Sheet pasó de 2/46 a **46/46** pestañas de negocio con espejo real declarado (ej. `Operativa.md` ya citaba 11 pestañas reales que nadie veía desde este informe). Baserow pasó de 1/18 a **9/18** -- `PLANTILLA_MISION`/`TELAR_SESION`/`TELAR_BIBLIOTECA` ya aparecen cubiertas, y quedan huecos reales genuinos (`AGORA`, `TAREA`, `PERSONAJE`, `ACERVO`...) -- una cifra creíble, no sospechosamente perfecta, señal de que el cruce funciona de verdad y no está inflando nada. `universo_real.json` regenerado (ambas copias), verificado sin errores en el navegador.

### 8.60 "Empieza" (Tier 1 de los huecos reales)

Cerrados 2 de los 9 huecos Baserow reales del informe (§8.59), investigando cada uno antes de tocar nada.

- **`AGORA`** -- `AGORA.md` ya existía en la bóveda (real, honesto, describía el módulo activo de Piloto Plaza sin autocitarse) -- solo le faltaba su propia sección "## Vínculo real".
- **`TAREA`** (Baserow, id 278) -- añadida a `Cronista.md`, confirmada real: el mismo workflow `cronista-segmentar-generador.json` que ya escribe `PLANTILLA_MISION` también escribe filas reales en `TAREA`, con puerta humana.

**Corrección real encontrada a tiempo, antes de escribir nada mal**: `Acervo.md` (índice de los 8 personajes-voz del Concilio) **no es el mismo concepto** que la tabla `ACERVO` de Baserow (el "almacén común del taller", `TITULO`/`CATEGORIA`/`CONTENIDO`/`FUENTE`) -- mismo nombre, dos cosas reales distintas. Añadir la cita ahí habría sido exactamente el error que este ejercicio quería evitar -- movido al Tier 4 (necesita ficha nueva de verdad, no una cita prestada de una ficha que habla de otra cosa).

Baserow pasó de 9/18 a **11/18** tablas con espejo real declarado. Verificado sin errores en el navegador tras regenerar `universo_real.json`.

### 8.61 Tier 3 cerrado -- PERSONAJE (Baserow) es donde el cliente crea su propio personaje

`personaje.schema.json` ya había detectado la tabla real `PERSONAJE` (Baserow, id 283) y la había dejado fuera del roster operativo (Coordinador/Ejecutor/Acervos) a propósito, sin evidencia suficiente de a qué mecanismo real pertenecía ("candidata real, no fusionada sin más evidencia"). El operador aportó el dato real que faltaba: **es la forma real que tiene el cliente del constructor de universos de crear su propio personaje para personalizar su experiencia** -- distinto del elenco operativo de Engremiat, no una versión incompleta del mismo concepto.

Creada la ficha real propia, `Personaje de cliente.md` (`01_Mundo/Recursos/`, `tipo: recurso`), separada a propósito del `tipo: personaje` operativo para no confundir las dos cosas en ningún listado. Documenta lo que ya se sabe con certeza (qué es, para quién) sin fingir saber más de lo real (cuántos clientes la usan hoy, qué flujo real la escribe). `personaje.schema.json` actualizado para dejar de tratarlo como pregunta abierta y apuntar a la ficha real.

Baserow pasó de 11/18 a **12/18** tablas con espejo real declarado. `validar_bocetador.mjs` sigue APROBADO, app verificada sin errores.

### 8.62 Tier 2 cerrado -- el catálogo compartido de referencia

`ENTIDAD_ORGANIZATIVA`, `UBICACION_GEOGRAFICA`, `COMPETENCIA` y `PERSONA_COMPETENCIA` ya estaban nombradas en `Los dos continentes de datos.md`, pero deliberadamente sin cita real ahí (esa ficha es una regla de arquitectura, no la dueña de ninguna tabla). Las cuatro forman un real conjunto diseñado junto -- jerarquías `PADRE_ID` reales, `COMPETENCIA` basada en el código oficial ESCO de la UE, `PERSONA_COMPETENCIA` como tabla puente -- el equivalente compartido, cruzando clientes, de lo que cada Sheet ya tiene por su cuenta (`33_COMPETENCIA`/`34_PERSONA_COMPETENCIA`/`11_PERSONAS_EQUIPOS`).

Creada una única ficha real, `Catálogo compartido de referencia.md` (`01_Mundo/Recursos/`, `tipo: recurso`), en vez de cuatro fichas sueltas -- más honesto a como se diseñaron juntas. Cita las 4 tablas reales en su `## Vínculo real`, y dice explícitamente lo que no se sabe todavía (filas reales, quién las escribe/consulta) en vez de fingir un flujo verificado.

Baserow pasó de 12/18 a **16/18** tablas con espejo real declarado. `validar_bocetador.mjs` sigue APROBADO, app verificada sin errores.

### 8.63 Tier 4 cerrado -- 18/18 tablas de Baserow con espejo real

Los dos huecos genuinos, sin ficha previa ni mención en ningún otro documento.

- **`ACERVO`** -- `Almacén del taller.md` (nueva, `tipo: recurso`, distinta a propósito de `Acervo.md`, el índice de los 8 personajes-voz -- mismo nombre coloquial, dos cosas reales). Recoge tal cual la descripción real ya escrita en `PROPUESTA_EMPAQUETADO_PRODUCTO_CLIENTE_FINAL.md` ("el almacén común del taller... se llena y se consulta en cada interacción"), y dice honestamente que el ciclo que la usa sigue siendo diseño, no código.
- **`DOCUMENTO`** -- `Documento adjunto.md` (nueva), distinta a propósito de `DOCUMENTO_ENGREMIAT` (esa cataloga los documentos del propio ecosistema; esta es un adjunto polimórfico real, `ENTIDAD_TIPO`+`ENTIDAD_ID`, a cualquier entidad).

**Resultado final, verificado ejecutando el propio informe**: Baserow **18/18**, Sheet **46/46** -- **0 huecos reales** entre lo que ya existe en Sheet/Baserow y lo que la bóveda declara conocer. `validar_bocetador.mjs` sigue APROBADO, app verificada sin errores (77 nodos reales).

### 8.64 Los 4 puentes construidos + segunda opinión externa contrastada

Construidos los 4 puentes más baratos del cruce 13×8 (§8.63 fin): `/api/proyectos` ampliado (`RESPONSABLE_ID`/`FECHA_INICIO_PLAN`/`OBJETIVO`), `/api/recursos` nuevo (`GASTO_API` en vivo, mismo patrón real que `exportador_prometheus_gasto.mjs`), enlace real a `sheet-real.html` desde Memoria, `/api/misiones_feria` nuevo (`PLANTILLA_MISION` en vivo). Un bug real corregido en el camino: los campos `single_select` de Baserow llegan como `{id,value,color}`, no texto -- corregido antes de verificar. Los 3 puentes servidos verificados con dato real (curl) y con la lógica de render real de `mesa_montaje.html`.

**Segunda opinión externa, contrastada, no adoptada a ciegas**: el operador compartió esta matriz y el estado del proyecto con ChatGPT (actuando como experto en Engremiat y juegos cooperativos). Propuesta recibida y evaluada -- lo que se **adopta**:

- **Corrección de la definición de "fractal"**: no es repetir las 8 preguntas dentro de cada caja (inmanejable) -- es que las 8 preguntas son un **contrato de inspección universal**, aplicable a cualquier entidad en cualquier nivel (Universo→Misión→Proyecto→Proceso→Tarea→Decisión), no una estructura fija repetida.
- **Cuarto estado, ◇ inferido** -- distinto de ✓/~/—, para cuando el dato es una atribución razonada, no un hecho verificado. Ya existía sin nombrarlo: `Coordinador.md` ya dice *"atribución razonada por encaje de rol, no un script real encontrado que la toque"* -- exactamente un caso ◇ real, ya en la bóveda.
- **Las 104 celdas son un mapa de cobertura de desarrollo, no 104 casillas de UI que rellenar** -- corrección aceptada sobre el uso previsto de la matriz.
- **"Comunidad" (presencia/actividad en vivo) no es algo nuevo que construir -- es Feria**, ya real, ya con actividad de grupo real vía Telegram. Confirmado por el operador.

**Lo que se trata con cautela, no adoptado sin más**: el rediseño completo en 7 regiones (Estado/Constructor/Narrador/Espacio de trabajo/Comunidad/Gestor de misión/Inspector) es coherente pero implicaría rehacer de golpe lo ya construido y verificado -- se evolucionará por pasos, no de una vez. Los conectores tipo CAD (puertos/tipos/restricciones) y la idea de "quest log" son inspiración razonable, no verificadas contra dato real todavía.

### 8.65 Auditoría ◇ por entidad + siguiente puente barato (Concilio)

**Auditoría ◇ a nivel de las ~91 fichas reales**: solo **1 caso real** de ◇ inferido -- `Coordinador.md`/`METRICA_FABRICACION` ("atribución razonada por encaje de rol, no un script real encontrado"). Otros 3 candidatos reales (`AGORA.md`, `Personaje de cliente.md`, `Catálogo compartido de referencia.md`) resultaron ser huecos "—" bien documentados, no ◇ -- declaran explícitamente que no infieren más de lo que saben. `Acervo Sociocracia.md` es una categoría distinta: no un dato inferido, sino un comportamiento real de IA que contradice su propia definición (propuso un umbral de votos en vez de consentimiento). No se construyó mecanismo nuevo para 1 solo caso real -- desproporcionado.

**Siguiente puente barato construido**: Concilio ya tenía su propio endpoint real `/salud` (`spike_concilio_coop/servidor.mjs`) pero sin CORS -- no se tocó ese servidor, ajeno a este visor. Servido como proxy real server-to-server desde `servidor_memoria.mjs` (`/api/concilio_estado`, caché 10s). Mesa gana la caja real "Centro compartido -- Concilio", asientos humanos ocupados en vivo. Verificado con dato real (curl: 0/2 en el momento de la prueba) y con la lógica de render real.

### 8.66 Siguiente puente barato -- Mapa del universo (Cómo/Cuánto)

`rolReal`/`agenciaReal` ya calculados por `extraer_anatomia_entidad.mjs` y servidos en `atlas_familias.json` -- pero `cargar_desde_vault.mjs` (lo que carga el Bocetador/mapa) nunca los cruzaba. Mismo patrón exacto que la unificación de `vinculoReal` (§8.59): leer el fichero real ya existente, no recalcular nada.

Resultado real: **61/77 nodos** del mapa ganan `rolReal`/`agenciaReal` -- los 16 restantes son fichas más nuevas que `atlas_familias.json` todavía no cubre (Narrador, Acervo, Pregonero...), gap real y honesto, no oculto. `validar_bocetador.mjs` sigue APROBADO, app verificada sin errores.

### 8.67 Siguiente puente barato -- Recursos (Quién), vía 92_BUS_TRABAJO

Candidata inicial: `12_DECISIONES` para Gobierno (Cuándo/Por qué). Comprobado antes de tocar nada: **real pero vacía hoy** (0 filas, solo cabecera) -- no se construye un puente hacia dato vacío sin decirlo.

`92_BUS_TRABAJO` sí tiene actividad real rica -- 9 tareas reales, `RECLAMADO_POR` (DeepSeek, Claude, cron...), `ESTADO`, `RESULTADO`. Nuevo `/api/bus_trabajo`. La mesa muestra ahora "Quién trabajó de verdad" agrupado por trabajador real. Verificado con curl y con la lógica de render real, sin errores.

### 8.68 Corrección real de rumbo -- replicar, no enlazar al Sheet + Centro compartido ampliado

Contexto nuevo aportado por el usuario sobre `12_DECISIONES`: la escribe cada ronda real de Vigilia+Cronista al crear incidencias/tareas -- el hueco sigue siendo genuino (el cauce existe conceptualmente, no está escribiendo ahí todavía), anotado, no construido.

Propuesta inicial para el "Cómo" de Misiones (`05_PROCESOS`/`06_TAREAS`): un conteo ligero + enlace al Sheet real (Gantt/Ficha), igual que se hizo con Memoria→`sheet-real.html`. **Corregido por el usuario**: el jugador de Bastidor no tiene por qué tener acceso al Sheet -- hay que replicar la dinámica real, no enlazarla. Memoria guardada ([[feedback_bastidor_replicar_no_enlazar_sheet]]): la distinción real es dinámica de juego activa (replicar con endpoint propio) vs. registro de consulta ocasional (enlace vale, como Memoria).

Construido: `leerProcesosTareasReales(proyectoId)` en `servidor_memoria.mjs`, replicando la cadena relacional real `02_PROYECTOS → 04_PROYECTO_PRODUCTO (PRODUCTO_ID) → 05_PROCESOS (PRODUCTO_ID) → 06_TAREAS (PROCESO_ID)` -- comprobada con datos reales antes de construir (13 procesos, 19+ tareas reales, nada vacío). Nuevo `GET /api/procesos_tareas?proyectoId=X`. En `mesa_montaje.html`, cada misión de la lista es ahora clicable y despliega su "Cómo" real (procesos con estado/avance, tareas anidadas) en un panel nuevo (`#comoMision`), sin salir de Bastidor.

Verificado con curl real contra PRO-0003 (4 procesos reales, sin tareas -- honesto) y PRO-0020 (1 proceso con 1 tarea real "Terminada" anidada), y con la lógica de render real en el navegador (mock de fetch, mismo patrón de siempre por el CORS del sandbox) -- ambos casos renderizan correctamente.

Centro compartido -- Concilio (`spike_concilio_coop/servidor.mjs`) ampliado: `/salud` ahora expone `deliberando`, `mensajesCiclo`, `cicloInicio`, `costeCicloUsd` (antes solo `humanos`/`maxHumanos`). Cierra parcialmente Qué/Cuándo de Centro compartido -- el "Qué" completo (transcripción real de `sala.mensajes`) queda pendiente, requeriría exponer contenido de mensajes, no solo conteo.

Pendiente explícito para la siguiente ronda: transcripción real de Concilio (Qué), Telar (`TELAR_SESION.HISTORIAL`/workflow n8n, Qué/Cuándo), y la interfaz de disparo real de Narrador (Cómo) -- los tres exigen tocar sus propios servidores/flujos, no son puentes de solo lectura baratos.

### 8.69 Los tres pendientes cerrados + primera propuesta de layout de 6 zonas

Cerrados los tres puentes que exigían tocar servidores propios:

1. **Concilio (Qué)**: nuevo `GET /transcripcion` en `spike_concilio_coop/servidor.mjs` (mensajes reales `autor/texto/esIA`, últimos 20), proxied vía `/api/concilio_transcripcion`. `/salud` también ampliado con `deliberando/mensajesCiclo/cicloInicio/costeCicloUsd`.
2. **Telar (Qué/Cuándo)**: su sesión real vive en Baserow tabla 290 (escrita por `tools/n8n-workflows/telar-interactivo.json`) -- comprobado con datos reales antes de construir (1 sesión real, "El taller de la Rosa", `ESTADO=generando`). Nuevo `leerTelarReal()` + `GET /api/telar_estado`, mismo patrón que Recursos/Feria.
3. **Narrador (Cómo)**: `narrador_construir_proyecto.mjs` (CLI probado) envuelto en `POST /api/narrador_proponer` -- llama a DeepSeek en vivo con el mismo prompt real, coste real verificado ($0.00067/llamada). Sigue siendo SOLO "proponer", nunca escribe en el Sheet (mismo límite ya documentado en el script original). Caja propia real en la mesa (§8.56 cumplido): 3 campos + botón, dispara la llamada real, muestra la propuesta y su coste.

**Propuesta de layout de 6 zonas** (aportada por el usuario, boceto ASCII): Estado del universo (barra superior) / Narrador (franja propia) / Constructor del universo · Espacio de trabajo · Gestor de proyectos (3 columnas) / Comunidad (franja) / Información·Traza·Inspector (barra inferior). Mapeo real contra lo ya construido:
- Narrador franja propia -- coincide con §8.56, hoy no tiene sitio propio en la mesa (corregido en esta misma ronda).
- Constructor del universo = paleta Reparto/Módulos/Escenario + Universos reales (ya existe).
- Comunidad = Centro compartido (Concilio/Telar) + Feria bajo un mismo concepto (hoy repartidos por la columna).
- Información/Traza/Inspector = Registro de eventos + enlace 91_HISTORIAL + Vínculos + Esta máquina (ya existe, disperso).
- **Espacio de trabajo (centro)**: corrección real del usuario -- no es solo el canvas + "Cómo" de Misiones, es donde viven TODAS las vistas ya diseñadas y maduras del Sheet real (Ficha de producto/proyecto, árbol jerárquico 01→06, Kanban, Gantt) replicadas como vistas nativas de Bastidor, alimentadas por los mismos endpoints reales.
- **Gestor de proyectos (columna derecha)**: hipótesis mía inicial (enlazar al Sheet por ser vista de "operador") corregida por el usuario -- también es espejo, no enlace. Es un navegador real hacia las mismas vistas replicadas del Espacio de trabajo, no un destino propio. Memoria guardada ([[feedback_bastidor_replicar_no_enlazar_sheet]]) generalizada: Bastidor espeja TODO el Sheet (jerarquía, fichas, Gantt, Kanban), el único enlace real que se mantiene es Memoria/91_HISTORIAL (auditoría de bajo tráfico).

**No construido todavía** -- la zonificación 2D real es un cambio estructural mayor, no una reordenación incremental. Anotado explícitamente en la propia interfaz de la mesa (nota visible arriba del panel derecho) para que quede trazado, no oculto en un documento aparte. Verificado con curl real contra los 3 endpoints nuevos y con la lógica de render real en el navegador (mock de fetch + clic real en el botón de Narrador), 0 errores nuevos de consola (el único error visto era residuo de un clic de una sesión anterior, confirmado con una carga fresca).

### 8.70 Esqueleto del layout de 6 zonas (boceto teórico)

Nuevo `tools/gobierno/graphify_visor/boceto_layout_6_zonas.html`, deliberadamente no funcional -- sin fetch, sin datos en vivo. Ordena las 6 zonas del boceto ASCII del operador (Estado del universo / Narrador / Constructor-Espacio de trabajo-Gestor de proyectos / Comunidad / Información-Traza-Inspector) como cajas clicables, cada una con: nombre, pregunta fundamental que responde, y una lista de herramientas propuestas marcadas ya construido / parcial / pendiente (misma leyenda de 3 colores). Contenido derivado directamente del mapeo real hecho en §8.69, incluida la corrección del "Gestor de proyectos" (navegador hacia el espejo, no enlace al Sheet).

Propósito explícito: punto de partida para revisar zona por zona, en conversación, qué representar y cómo -- no una decisión de diseño cerrada. Registrado en `indice.html`. Verificado en el navegador: las 7 cajas abren/cierran al clic, sin errores nuevos de consola.

### 8.71 Constructor del universo -- puente real a Aprovisionamiento

Investigación previa a construir (el operador propuso "el módulo CORE con la idea de que el visitante pueda solicitar montajes"): se encontró que el mecanismo de "solicitar montaje" **ya existe, real, probado de extremo a extremo en producción** (`ROADMAP_GESTOR_PROYECTOS_CLIENTE_VENTAS.md`: *"Activada y probada de extremo a extremo"*) -- `SOLICITUDES_MONTAJE` (Sheet real, columnas `ID_TEMPORAL/NOMBRE/MODULOS/ESTADO/...`, columna `ESTADO` protegida por email autorizado) + `SolicitudMontaje.html`/`AprobarSolicitudMontaje.html` (diálogos Apps Script) + el webhook real (`WebhookTelegramService.js`, acción `crear_solicitud_montaje` → `AprovisionamientoService.js`).

Distinción real hecha antes de reutilizar nada: el formulario del Sheet (`SolicitudMontaje.html`) es admin puro, vive dentro de un Sheet ya existente -- no es candidato para dar cara a un "visitante" desde Bastidor. El **webhook** detrás sí lo es (server-to-server, mismo patrón ya probado con Narrador). Verificado con `curl` real antes de escribir código (`SOL-003`, dependencias resueltas correctamente VENTAS→CLIENTE→CORE).

**Hallazgo de seguridad real, registrado en `HALLAZGOS_PENDIENTES.md`** (documento nuevo para hallazgos no bloqueantes): el dispatcher del webhook no comprueba ningún token por `accion` -- cualquiera con la URL puede escribir una fila real. Bajo riesgo hoy (URL solo interna), pero la URL se guarda como secreto server-side de todas formas (`WEBHOOK_APPS_SCRIPT_URL`, nunca en el HTML servido al navegador), mismo patrón que `DEEPSEEK_KEY`/`BASEROW_TOKEN`.

Construido: `solicitarMontajeReal()` en `servidor_memoria.mjs` (proxy real al webhook), `GET /api/modulos_montaje_disponibles` (14 módulos reales de negocio, `package-map.json` menos CORE), `POST /api/aprovisionar_montaje`. En `mesa_montaje.html`: caja real "Constructor del universo -- solicitar montaje real" (nombre + checkboxes de módulos + botón), junto a Narrador. Verificado con curl real contra el endpoint propio (`SOL-007`, tras un hipo transitorio del contenedor recién reiniciado en el primer intento) y con la lógica de render real en el navegador (mock de fetch), 0 errores nuevos de consola.

### 8.72 Identidad de las 7 cajas (boceto_sheet) + investigación de estándares de juegos cooperativos

**Ejercicio "sin tocar código"**: nuevo `boceto_sheet` real (Google Sheets, `1CQY-y5FulzoamTgXTB8maG82evNFYHECe-6WxeXbBV4`), tabla con una fila por caja del layout de 6 zonas (Centro compartido se cuenta aparte de Comunidad a efectos de identidad -- 7 filas), columnas `CAJA / PREGUNTA FUNDAMENTAL / QUÉ QUIERO REPRESENTAR (propuesta) / TU AJUSTE`. Primera identidad propuesta, con la distinción clave hecha explícita por primera vez -- **Constructor del universo** (donde NACE un universo nuevo, vía Aprovisionamiento) vs. **Espacio de trabajo** (un universo YA existente, en marcha) son dos cajas reales distintas, no la misma cosa vista dos veces.

**Investigación de estándares reales de diseño de juegos cooperativos/progresión** (búsqueda web, 5 hallazgos):
1. **Engine/deck-building** -- acumular piezas interconectadas que producen más capacidad con el tiempo. Ya construido de verdad: los módulos acoplables con `moduleDependencies` resueltas automáticamente.
2. **Legacy/campaign games** -- mundo persistente, cambios permanentes, narrativa ramificada por decisiones reales. Ya real: cada montaje aprobado es irreversible; `91_HISTORIAL`/`12_DECISIONES` son el registro legacy.
3. **Progressive disclosure / revelación gradual de complejidad** -- *"complejidad revelada a medida que el jugador se la gana, no antes"*. Hallazgo clave: explica formalmente por qué la mesa se siente desordenada hoy -- se muestran las 7+ cajas completas a cualquiera, tenga o no un universo montado.
4. **Colony sim / árbol de progreso** -- construir algo desbloquea nuevas líneas de producción. Aplicado: activar un módulo debería desbloquear su caja correspondiente, no mostrar cajas vacías de módulos que el cliente no tiene.
5. **Gamificación seria de gestión de proyectos** -- existe investigación académica real sobre este mismo objetivo (cerrar la brecha teoría/práctica con decisiones simuladas), no es una idea excéntrica.

**Reformulación propuesta** (capas por madurez del universo del visitante, eje temporal sobre el layout espacial de 6 zonas ya fijado):
- **Etapa 0** (sin universo): Estado del universo + Narrador + Constructor del universo visibles; resto oculto/atenuado.
- **Etapa 1** (montaje recién aprobado): se desbloquea Espacio de trabajo (jerarquía real, vacía, invitando a la primera misión).
- **Etapa 2** (universo con actividad real): se desbloquean Gestor de proyectos y Comunidad.
- **Etapa 3** (sistema maduro): Información/Traza/Inspector cobra sentido -- hay historia real que auditar.

No construido -- reformulación de diseño, pendiente de valorar tamaño/granularidad de las 7 cajas (§8.73) antes de tocar código.

### 8.73 Sobredimensión conceptual, no de cantidad -- auditoría de las 7 cajas

El operador corrigió el enfoque: la pregunta no era "¿7 cajas es mucho o poco?" (cuestión de cantidad, ya resuelta -- 7 encaja en el rango real recomendado 4-7, ver investigación UX de §8.72), sino si cada caja representa **una sola cosa coherente**. Auditoría real, caja por caja:

Bien dimensionadas (un mecanismo real, sin mezcla): Narrador, Constructor del universo, Comunidad, Información/Traza/Inspector.

Dos problemas reales encontrados:
1. **"Estado del universo" no es una caja del mismo nivel que las demás** -- las otras son *dominios* (mecanismo/dato propio real); esta es un *resumen agregado de las otras 6*, sin mecanismo propio. Es una capa por encima, no una séptima caja al lado.
2. **"Espacio de trabajo" está sobredimensionado** -- mismo fallo que ya se encontró en "Escenario" del Bocetador (§8.63: recursos+oficios+espacios+reglas amontonados en una pestaña). Aquí se definió con Ficha+Árbol jerárquico+Kanban+Gantt+Mesa+Misiones -- 5 mecanismos reales distintos, cada uno con fichero propio en el Sheet (`FichaProyecto.html`, `Kanban*.html`, `GanttPlanReal.html`), metidos bajo un solo nombre. Efecto colateral: el límite con "Gestor de proyectos" queda borroso justo en el Gantt (¿trabajo o gobierno del trabajo?).

Propuesta (no construida): sacar Estado del universo de la lista de 7 (pasa a capa de resumen) y partir Espacio de trabajo en sus piezas reales, resolviendo explícitamente a qué caja pertenece el Gantt.

### 8.74 Pivote real -- Panel Operativo, no Bastidor, para "empezar a producir"

El operador propuso simplificar radicalmente: en vez de seguir construyendo el juego cooperativo (para futuros clientes hipotéticos), dar prioridad a una herramienta mínima para que él mismo, como operador, empiece a trabajar el backlog real del propio sistema Engremiat -- usando los ciclos ya reales (Ejecutor/Vigilia/Relevo/Cronista), sin Narrador (esta misma conversación ya cumple esa función).

**Verificado antes de construir** (mismo criterio de toda la sesión): el backlog real existe y es sustancial -- **67 incidencias reales totales, 37 abiertas**, de las cuales **49 son de `NIVEL_INCIDENCIA=Producto`** (sobre la propia librería Engremiat, no trabajo de cliente/proyecto piloto como Amigurumi/Huerto/Yurta) y **22 de esas siguen abiertas**. Este es el campo real que separa limpiamente "autoregeneración de Engremiat" de "trabajo de cliente" en la misma hoja. `18_VINCULO` (`TIPO_VINCULO='Corrige'`, `Incidencia→Tarea`) es el cruce real ya usado por el propio Sheet para enlazar una incidencia con la tarea que la corrige -- confirmado con datos reales (`VIN-0001`: `INC-0001` Corrige `TAR-0001`).

**Construido**: nueva página independiente `panel_operativo.html` (deliberadamente separada de `mesa_montaje.html` -- no repetir el error de amontonar cajas ya diagnosticado en §8.74 mismo). Dos secciones, nada más: (1) incidencias reales abiertas de nivel Producto, con sus tareas vinculadas anidadas (`leerIncidenciasProductoAbiertas()`, nuevo `GET /api/incidencias_producto_abiertas`); (2) `92_BUS_TRABAJO` reutilizado tal cual (`/api/bus_trabajo`, ya existía), agrupado por quién del ciclo real está trabajando qué. Bastidor (Narrador, Constructor del universo, Comunidad, Feria, la mesa/canvas) queda intacto, sin tocar -- sigue siendo el producto para futuros clientes, ahora explícitamente separado del uso operativo diario.

Verificado con curl real contra el endpoint nuevo (INC-0001↔TAR-0001 correctamente anidado) y con la lógica de render real en el navegador (mock de fetch), 0 errores nuevos de consola. Registrado en `indice.html`.

### 8.75 Panel Operativo espejo real del Sheet, inspirado en `PanelOperativo.html`/fichas reales

El operador aportó capturas reales de la Ficha (`FichaCampana.html`, patrón: resumen numérico arriba, botones de acción junto al título, secciones con conteo + "+Añadir") y del menú real del Taller de Producción -- y confirmó el principio rector: **el Sheet es el almacén de datos, la interfaz solo refleja** (mismo principio ya aplicado a Misiones→Cómo en §8.68, generalizado aquí a todo lo que se construya).

Investigado antes de mejorar: `src/PanelOperativo.html` (real, ya construido, container-bound al Sheet) resuelve el mismo problema de "no colapsar al operador" con un patrón maduro: secciones por tipo de señal (Tareas retrasadas / Tareas bloqueadas / Decisiones pendientes / Incidencias abiertas / Recursos no disponibles...), `botonAbrir_(entidad, id)` -- botón que abre la Ficha exacta en un clic -- y borde izquierdo rojo (`.item.alerta`) para severidad visual.

**Aplicado a `panel_operativo.html`** (fuera del Sheet, no puede usar `google.script.run`, mismo efecto por otro medio):
- Resumen KPI arriba (abiertas / Alta-Crítica / sin tarea vinculada), antes de cualquier lista.
- Dos secciones reales, no una lista plana: "Sin tarea vinculada -- nadie las está trabajando" (borde rojo, urgentes de verdad) vs. "Con tarea ya en marcha" (borde neutro).
- `urlSheet` real por incidencia (`leerIncidenciasProductoAbiertas()` ahora calcula la fila real del Sheet, `gid` real de `13_INCIDENCIAS`=`1182532531`) -- "Abrir fila en el Sheet →", un clic, sin buscar.
- Ordenado por prioridad real (Crítica→Alta→Media→Baja), no por el orden crudo de la hoja.

Verificado con curl real (URLs `#gid=1182532531&range=A{fila}` correctas, ej. `INC-0001`→`A2`) y con la lógica de render real en el navegador (mock de fetch), 0 errores nuevos de consola.

Ajustes rápidos posteriores (mismo turno): meta viewport (faltaba); incidencias colapsadas por defecto, detalle al clic (mismo patrón que `boceto_layout_6_zonas.html`); filtro por prioridad (client-side) + contador real en `document.title`.

### 8.76 "Quién trabaja de verdad" simplificado -- tiempo real por tarea, sin cruce inventado

El operador pidió simplificar la sección `92_BUS_TRABAJO` (23 tareas individuales listadas una a una) a solo lo esencial: consumo de API y tiempo por tarea. Investigado antes de construir: `DURACION_SEGUNDOS` es una columna real de `92_BUS_TRABAJO` que `leerBusTrabajoReal()` no leía todavía (comprobado con datos reales: de 2.3s a 900s según el trabajador). Se evaluó cruzar esto con `GASTO_API` por trabajador -- **descartado**: `GASTO_API.NOMBRE` es texto libre (`"DeepSeek 2026-08-30T19:48:16Z"`), sin ID de tarea real que lo ligue a una fila de `92_BUS_TRABAJO`; forzar ese cruce habría sido inventar una relación que no existe en los datos.

Construido: nueva `leerResumenTrabajoReal()` + `GET /api/resumen_trabajo` -- agrega por trabajador (tareas, duración total, duración media), sin tocar `leerBusTrabajoReal()`/`/api/bus_trabajo` (sigue usado tal cual por `mesa_montaje.html`). `panel_operativo.html`: la lista verbosa se sustituye por una tabla compacta (Trabajador/Tareas/Tiempo total/Tiempo medio, legible en s o min), más una línea aparte y honesta con el consumo total real de `GASTO_API` (`/api/recursos`, ya existente), explicitando que no hay cruce por trabajador porque el dato no lo permite.

Verificado con curl real (`cron`: 9 tareas/0s reales -- automatizado; `Claude`: 5 tareas/180s de media; `DeepSeek`: 4 tareas/3.4s de media) y con la lógica de render real en el navegador (mock de fetch), 0 errores nuevos de consola.

### 8.77 Consumo real por tokens/tiempo -- modelos de pago y locales, "todo en Sheets"

Investigación pedida por el operador: inventario real de modelos de pago (`config.yaml` de LiteLLM, `G:\Mi unidad\DEVS\engremiat-litellm\`) -- `deepseek-verificador` (ya real en `GASTO_API`, 253 llamadas) y `claude` (configurado en el gateway pero sin API medida que registrar, confirma lo dicho por el operador). Modelos locales reales (Ollama, `$0`, corriendo en este PC): `local-codigo`→`devstral-dev` (el de "desarrollo de software"), `local-rapido`→`qwen3:8b`, `local-potente`→`qwen3:14b`. Investigado también: DeepSeek no publica límites RPM/TPM fijos (concurrencia dinámica, `429` al frenar) -- "vigilar límites" solo es honesto como tendencia real de consumo en el tiempo, no como % contra un número inventado.

**Decisión del operador**: "todo en Sheets, evitamos hacer trabajo a mano" -- en vez de crear una tabla Baserow nueva (como `GASTO_API`) para el consumo local, se amplía `92_BUS_TRABAJO` (Sheet, ya real, ya con el patrón de `append` probado por cron/Claude/DeepSeek) con 3 columnas nuevas reales: `MODELO`/`TOKENS_ENTRADA`/`TOKENS_SALIDA` (vía `sheets_update_sheet_properties` + `sheets_update_values`, verificado: la cuenta de servicio SÍ tiene permiso de escritura real en este Sheet, no solo lectura -- confirmado con un `PUT` real antes de instrumentar nada).

**Instrumentado en real**: `G:\Mi unidad\DEVS\engremiat-litellm\ejecutor-local.py` (el único punto de llamada real a un modelo local con tool-calling, "Ejecutor Local") ahora firma su propio JWT (RS256, `cryptography` stdlib del venv, mismo flujo que los scripts Node del proyecto) y añade una fila real a `92_BUS_TRABAJO` al terminar cada sesión -- tokens acumulados de verdad desde `resp["usage"]` de cada llamada real a LiteLLM, duración real de la sesión completa. **Deliberadamente mejor-esfuerzo, nunca bloqueante**: todo el propósito de Ejecutor Local es correr sin conectividad, así que el registro en Sheets va en un `try/except` que nunca puede romper la sesión real -- si Google no responde, se omite en silencio y el JSONL local sigue siendo la fuente de verdad, como ya era.

Verificado con una llamada real aislada a `_registrar_bus_trabajo()` (sin lanzar toda la sesión del modelo): fila real `EJEC-LOCAL-TEST-VERIFICACION` confirmada en el Sheet con las 16 columnas correctas (`devstral-dev`, 150/80 tokens). Queda esa fila de prueba real sin borrar, marcada como tal.

**Lado de lectura**: `leerResumenTrabajoReal()` amplía su rango a `A1:P` (antes `A1:M`) y agrega `MODELO`/`TOKENS_ENTRADA`/`TOKENS_SALIDA` por trabajador; `leerRecursosReales()` (GASTO_API) ahora también lee `TOKENS_ENTRADA`/`TOKENS_SALIDA` (columnas reales ya existentes, sin leer todavía). `panel_operativo.html`: 3 tablas reales separadas -- tiempo puro (cron/Claude/DeepSeek sin tokens), modelos locales (tokens+tiempo, $0 real), modelos de pago (tokens+coste, agrupado por `servicio` dinámicamente -- listo para ChatGPT el día que aparezca una fila real, sin tocar código).

Verificado con curl real (`Ejecutor Local (devstral-dev)`: 1 tarea, 12.3s, 150/80 tokens reales) y con la lógica de render real en el navegador (mock de fetch), 0 errores nuevos de consola.

### 8.78 Árbol de campañas -- primera escritura real en el núcleo de la jerarquía

El operador pidió un árbol de navegación real (mismo espíritu que "Gestión de campaña" del Sheet) para operar directamente Campaña→Proyecto→Producto→Proceso→Tarea. Investigado antes de construir: existe un único mecanismo real genérico para crear cualquier nivel, `guardarFormulario(entidad, idRegistro, datosCrudos)` (`FormularioValidacionService.js`, schema-driven contra `ESQUEMAS_FORMULARIO_MVP`) -- la forma correcta de escribir, con validación real (FK/duplicidad/reglas de negocio), generación de ID y `91_HISTORIAL`.

**Hallazgo real crítico, encontrado con una prueba real que falló silenciosamente**: `guardarFormulario()`/`insertarRegistroTransaccional()` escriben SIEMPRE en `SpreadsheetApp.getActiveSpreadsheet()` -- para el webhook standalone del maestro, eso es su propio Sheet de desarrollo (`4.Copia de TALLER_PRODUCCION_DEV`), **nunca** Gestor de Proyectos. Confirmado con una acción nueva (`guardar_formulario`, desplegada real vía `clasp push`+`clasp deploy -i` al deployment ya existente) que reportó éxito (`CAM-0049`) pero la fila apareció en el Sheet equivocado -- limpiada después. Mismo problema ya documentado en memoria (`proyecto_master_clientes_herencia_webhook`) y en el propio código (`AprovisionamientoService.js`, comentario explícito: *"esa función siempre escribe en getActiveSpreadsheet(), no admite un destino explícito"*). No existe ningún camino real de tercer nivel (`tools/constructor/clientes.json` está vacío -- Gestor de Proyectos nunca se montó con cascarón propio con webhook aparte).

**Decisión del operador** (tres caminos presentados, elegido el recomendado): escritura cruda, sin la validación de `guardarFormulario` -- mismo patrón ya en producción para este mismo problema real (`crearProyectoEnGestorDeProyectos_`, `AprovisionamientoService.js`): API directa, ID generado a mano (regex sobre la columna real), sin `91_HISTORIAL`. Aceptado a propósito: un solo operador, riesgo de carrera bajo.

**Construido**:
- `leerJerarquiaCampanas()`: extensión real de `leerProcesosTareasReales()` hacia arriba -- `01_CAMPANAS→02_PROYECTOS→04_PROYECTO_PRODUCTO→03_PRODUCTOS→05_PROCESOS→06_TAREAS`, árbol anidado real, cada nodo con `urlSheet` (fila real, mismo patrón `#gid=X&range=A{fila}`). Nuevo `GET /api/jerarquia_campanas`.
- `crearRegistroCrudo(tipo, campos, padreId)`: escritura directa vía Sheets API (alcance `spreadsheets` completo, separado del resto de lecturas por principio de mínimo privilegio), genérica para los 5 niveles, con generación real de ID por prefijo (`CAM/PRO/PRD/PCS/TAR`) y creación automática de la fila de enlace real `04_PROYECTO_PRODUCTO` cuando se crea un Producto bajo un Proyecto (mismo patrón que `PROYECTO_VINCULAR_ID`). Nuevo `POST /api/crear_registro`.
- `guardar_formulario` (la acción del webhook, real y desplegada) queda tal cual, sin revertir -- funciona correctamente contra el Sheet del maestro, solo no es la herramienta para Gestor de Proyectos.
- Nueva página `arbol_campanas.html`: árbol colapsable (colapsado por defecto), "Ficha" real por nodo, "+Crear" del siguiente nivel con formulario mínimo (`prompt()` secuencial, NOMBRE obligatorio + 1-2 campos reales opcionales por tipo).

Verificado con escritura real de extremo a extremo antes de dar por cerrado: `CAM-0006` (Campaña) → `PRO-0027` (Proyecto, `CAMPANA_ID` correctamente enlazado) -- ambas confirmadas en el Sheet real y borradas después (limpieza de prueba). Verificado también con la lógica de render real en el navegador (mock de fetch), 0 errores nuevos de consola.

### 8.79 Home -- menú de entrada real del operador

El operador confirmó en su propio navegador que Panel Operativo y Árbol de campañas funcionan de verdad (22 incidencias reales, tabla de consumo real con `deepseek`/`(sin servicio)`, 5 campañas reales) y pidió un home sencillo, deliberadamente mínimo, con las 2 piezas actuales -- "lo vamos mejorando" con el tiempo, no una decisión de diseño cerrada.

Construido: `home.html`, menú de tarjetas real (grid simple), sin dependencias de `indice.html` (ese sigue siendo el índice técnico de las 17 herramientas de `graphify_visor`; este es el punto de entrada del operador, solo sus 2 herramientas reales de trabajo diario). Verificado en el navegador: clic real en "Panel operativo" navega correctamente, 0 errores nuevos de consola.

### 8.80 Ficha espejo en árbol_campanas.html + crear Campaña desde la raíz

El operador señaló que "Ficha" en el árbol dirigía al Sheet externo (Drive) -- mismo principio ya aplicado repetidamente (§8.68/§8.75): replicar, no enlazar. Construido `leerFichaReal(tipo, id)` -- lee la fila real completa (todas las columnas, no solo las 4 usadas en el árbol) directamente del Sheet, sin compartir caché con `leerJerarquiaCampanas()` (rangos distintos). Nuevo `GET /api/ficha?tipo=X&id=Y`.

En `arbol_campanas.html`: "Ficha" abre ahora un modal real con todos los campos con valor (etiqueta = nombre real de columna), en vez de salir de la página -- con un enlace "Editar en el Sheet →" aparte, para cuando de verdad haga falta. Verificado con curl real contra `CAM-0001` (23 campos reales, incluido `CREADO_POR=sacandofilo@gmail.com`) y con la lógica de render real en el navegador (mock de fetch).

Además, botón real "+ Nueva Campaña" a nivel raíz del árbol -- faltaba crear el primer nivel de la jerarquía (antes solo había "+Crear" para los niveles con padre). Reutiliza `crear('Campaña', null)`, la misma función real ya verificada esta sesión con `CAM-0006` (sin `padreId`, correcto para el nivel raíz).

0 errores nuevos de consola.

### 8.81 Mirada global -- KPIs reales y contadores por campaña (Capa 1)

El operador pidió una pantalla de aterrizaje real con visión global antes de bajar a la jerarquía -- "cuántos proyectos, procesos...". Investigado antes de construir: `PanelCampanaService.js` real (el motor de "Gestión de campaña" que enseñó, captura con "1 proyectos, 1 productos...") ya calcula `contadores: {proyectos, productos, procesos, tareas}` por campaña, más desviación real (`diasDesviacion`) y sobreasignación real cuando hay `FECHA_FIN_REAL`/fechas cruzadas. `DashboardService.js` real (`obtenerResumenGlobal()`, `listarTareasRetrasadas()`) da el equivalente agregado global por estado y tareas vencidas.

**Capa 1 (construida)** -- barata porque reutiliza el mismo árbol que ya se lee, sin ninguna llamada nueva al Sheet salvo `FECHA_FIN_PLAN` (ya estaba dentro del rango leído, solo faltaba extraerla):
- `leerJerarquiaCampanas()`: cada nodo Tarea lleva ahora `fechaFinPlan` y `retrasada` (mismo criterio real que `listarTareasRetrasadas()` -- estado no cerrado + fecha vencida). Cada nodo Campaña lleva `contadores` real (proyectos/productos/procesos/tareas/tareasRetrasadas), calculado agregando su propio subárbol ya construido.
- `arbol_campanas.html`: barra de KPIs globales arriba (campañas activas/proyectos/procesos/tareas/tareas retrasadas, en rojo si hay), y cada Campaña en la lista raíz muestra sus contadores reales antes de expandir (mismo dato que "1 proyectos, 1 productos..." del panel real).

**Capa 2 (pendiente, anotada, más cara)** -- requiere leer `FECHA_FIN_REAL` (desviación real por proceso/tarea ya cerrada) y cruzar `RESPONSABLE_ID`+fechas entre nodos del mismo nivel (aviso real de sobreasignación) -- mismo cálculo que `PanelCampanaService.js` ya hace, pendiente de construir cuando se valide esta primera capa en uso real.

Verificado con curl real (`CAM-0001`: 5 proyectos, 4 productos, 5 procesos, 1 tarea, 0 retrasadas) y con la lógica de render real en el navegador (mock de fetch), 0 errores nuevos de consola.

### 8.82 Corrección de rumbo -- los contadores no bastan, hacen falta los nombres

El operador corrigió la Capa 1 nada más verla: *"este dato no tiene valor, necesito saber en cada campaña los proyectos relacionados"* -- y, en la misma línea, *"quiero ver toda la jerarquía sin tener que desplegar"*. Los contadores numéricos por campaña (`5 proy · 4 prod...`) no sustituyen ver los nombres reales, y el árbol colapsado exige clic nodo por nodo para llegar a ellos.

Corregido: quitados los contadores por nodo (sin valor real, según el propio operador); añadido botón real "Expandir todo" / "Colapsar todo" que abre o cierra toda la jerarquía de una vez, en vez de exigir clics uno a uno -- los nombres reales de cada Proyecto/Producto/Proceso/Tarea quedan visibles con una sola acción. La barra de KPIs globales (agregados, no por nodo) se mantiene -- ahí sí tiene sentido un número ("13 proyectos en total"), a diferencia de repetir el mismo dato junto a cada nombre ya visible.

Verificado en el navegador: expandir/colapsar todo funciona sobre 3 niveles reales de profundidad, sin romper el toggle individual por nodo, 0 errores nuevos de consola.

### 8.83 Vista inicial del sistema -- grafo real con raíz en home.html

Pedido explícito: *"extrae el grafo de graphify que parte desde el home, quiero tener una vista inicial del sistema"*. Investigado primero: `mapear_grafo_node.mjs` (el generador real detrás de `nodejs.html`) solo escanea `.mjs` bajo `tools/` -- imports, ficheros de datos JSON, recursos reales compartidos -- y no ve páginas `.html`, enlaces `<a href>` ni llamadas `fetch()`, así que no podía dar una vista partiendo de `home.html`. Hacía falta un extractor nuevo para esta capa concreta (interfaz + servidor + API), no reutilizar el existente.

**Construido**: `mapear_grafo_visor.mjs` (solo lectura, mismo estilo honesto que su precedente) escanea las 16 páginas `.html` reales de `graphify_visor/` más `servidor_memoria.mjs`, y extrae solo lo que encuentra de verdad en el texto: enlaces reales `href="X.html"` entre páginas, llamadas reales `fetch(.../api/xxx)` desde cada página, los endpoints reales que el servidor declara (`req.url === '/api/xxx'`), y las pestañas/tablas reales que toca (mismo vocabulario de `estructura_sheet.json`/`estructura_baserow.json` que ya usa `mapear_grafo_node.mjs`). Salida: `grafo_visor.json`.

**`vista_sistema.html`** (mismo `vis-network` que el resto del visor): calcula en el propio navegador, por BFS real sobre las aristas extraídas, qué páginas son alcanzables desde `home.html` -- las pinta en azul, home en amarillo, y el resto de páginas reales (herramientas de desarrollo de sesiones anteriores: `index.html`, `nodejs.html`, `entidades.html`, etc.) en gris, con un botón para ocultarlas del todo. Endpoints reales en verde, recursos reales (Sheet/Baserow) en rosa, servidor en morado. Clic en cualquier nodo abre su ficha real (quién lo llama, qué sirve, qué toca). Enlazada desde `home.html` como tercera pieza real del menú.

Verificado en el navegador real (`http://100.107.171.88:9320/vista_sistema.html`): 17 páginas, 19 endpoints reales, 13 recursos reales tocados, 64 aristas; clic en `home.html` muestra su ficha; el botón "Ocultar herramientas de desarrollo" oculta correctamente los nodos grises sin tocar el resto del grafo.

### 8.84 Automatizar el despliegue -- desplegar_visor.mjs

El ciclo de esta sesión (generar grafo → `scp` → `ssh docker compose up -d` → `curl` de verificación) se repitió a mano varias veces, y ya había causado antes un bug real documentado: un fichero nuevo sin su línea de montaje en `docker-compose.yml` da 404 en silencio (§8.5x, `grafo_maestro.html`). El operador pidió automatizarlo: *"para generar el grafo has tenido que dar muchos pasos, podemos crear alguna herramienta para automatizarlo?"*.

**Construido**: `desplegar_visor.mjs` no mantiene una segunda lista de ficheros (eso es justo lo que causó el bug) -- lee `docker-compose.yml` y despliega exactamente los ficheros ya declarados como volumen del servicio, la única fuente real de verdad. Pasos: (1) opcionalmente regenera `grafo_visor.json` (`--grafo`), (2) `scp` de cada fichero real declarado, (3) `ssh ... docker compose up -d <servicio>` (recreate real, nunca `restart` -- lección ya aprendida esta sesión, ahora automática en vez de tener que recordarla), (4) `curl` de verificación real de cada página `.html` servida.

Verificado con una ejecución real completa (`node desplegar_visor.mjs --grafo`): regeneró el grafo (recogió automáticamente la propia `vista_sistema.html`, 16→17 páginas), copió los 32 ficheros reales declarados, recreó el contenedor, y confirmó 200 real en las 16 páginas `.html` servidas -- ciclo de ~4 pasos manuales reducido a un solo comando.

### 8.85 Personalizar `vista_sistema.html` -- sin etiquetas de golpe, fondo del sistema de diseño real

El operador, tras ver el grafo en su propio navegador (denso, con las ~50 etiquetas de nombre encima ensuciando la vista), pidió investigar cómo personalizarlo: sin etiquetas por defecto, fondo igual al del resto del visor. Investigado antes de tocar código: `grafo_maestro.html` (§8.39-40) ya resolvió exactamente este problema en este mismo proyecto -- etiqueta con opacidad dependiente del zoom real (`network.on('zoom', ...)` + `network.getScale()`) y "siempre visible la del nodo bajo el cursor" (`hoverNode`/`blurNode`), en vez de quitarlas del todo. Mejor que ocultarlas para siempre: siguen apareciendo al acercarse o al pasar el ratón, coherente con "revelación gradual" ya establecido como criterio de diseño esta sesión.

**Aplicado a `vista_sistema.html`**: mismo patrón (umbral simple de escala ≥1.6, sin necesidad de la métrica de centralidad que sí usa `grafo_maestro.html` porque este grafo es mucho más pequeño). Además, `vista_sistema.html` no cargaba `tokens.css` -- tenía sus propios hex duplicados (`#0f1013`, `#17181c`...) en vez del sistema de diseño real ya usado por las páginas "migradas" (`grafo_maestro.html`, `holon.html`, `anatomia.html`, §8.48). Corregido: `<link rel="stylesheet" href="tokens.css">` + `var(--color-base-fondo/panel/borde/texto)`.

Verificado en el navegador real, dos comprobaciones directas: (1) `getComputedStyle(document.body).backgroundColor` → `rgb(15, 16, 19)`, exactamente `--color-base-fondo`; (2) disparando eventos `wheel` reales sobre el canvas (la vía que usan los usuarios de verdad -- `moveTo()` programático NO dispara el evento `zoom` de vis-network, es una peculiaridad de la API a tener en cuenta al probar, no un bug) hasta escala 3.97, el color de fuente de `home.html` pasó de transparente a `#e7e7ea` real. Desplegado con la propia `desplegar_visor.mjs` recién construida (primer uso real en producción de la herramienta).

### 8.86 Formato de nodo uniforme + física real de "movimiento e inercias"

Pedido: *"CAMBIALO A TODO EN FORMATO NODO Y INVESTIGA SOBRE FORMAS DE MEJORAR EL COMPORTAMIENTO DEL GRAFO, MOVIMIENTO, INERCIAS"*. Investigado antes de tocar física a ciegas: `index.html`/`graph.html` -- el primer visor real de este proyecto, Graphify -- ya habían resuelto exactamente este problema, con la misma configuración mínima que `vista_sistema.html` tenía hasta ahora (solo `gravitationalConstant`+`springLength`, sin `damping`/`centralGravity`/`avoidOverlap`/congelado tras estabilizar) como defecto real a corregir: sin esos parámetros el grafo oscila sin asentarse nunca y sigue temblando solo para siempre, incluso sin que nadie lo toque.

**Formato de nodo**: quitada la distinción por forma (antes `box` para endpoint, `diamond` para recurso real) -- todo `shape: 'dot'`, la diferencia real entre página/servidor/endpoint/recurso queda solo en color y tamaño. Leyenda del panel actualizada a juego.

**Física**: adoptada la receta real ya probada en producción en `index.html`/`graph.html`: `centralGravity: 0.008` (no colapsa todo al centro), `damping: 0.4` (más fricción, para antes, sin rebote), `avoidOverlap: 0.6` (separa nodos que se pisan, mismo valor que ya usa `holon.html`), `stabilization: {iterations: 300, fit: true}`, y sobre todo `network.once('stabilizationIterationsDone', () => network.setOptions({physics:{enabled:false}}))` -- inercia cero real tras asentarse: arrastrar un nodo lo deja exactamente donde se suelta, no vuelve a moverse solo. Incluye también el fix real de tamaño-de-canvas-cero ya encontrado antes en `holon.html`/`grafo_maestro.html` (`setSize`+`redraw`+`fit` dentro del mismo callback).

Verificado en el navegador real: `network.physics.options.enabled === false` tras estabilizar; arrastrado `home.html` a otra posición y comprobado que sigue exactamente ahí 2 segundos después, sin rebote ni deriva. Desplegado con `desplegar_visor.mjs`.

### 8.87 Sistematizar la creación de grafos -- `grafos.html` (galería por tipo) + `plantilla_grafo_espacio.html`

Pedido: *"inserta este grafo en la pagina home, valora la propuesta: la idea es sistematizar la creacion de los grafos y vincularlos a partes del sistema... crea una nueva html vinculada al home para ir agrupando los grafos por tipo, por ejemplo este seria de tipo espacio... diseña una plantilla para que nos sirva de base para todos los tipo espacio"*.

**Investigado antes de inventar una taxonomía nueva**: este proyecto ya tiene una real, en `tools/gobierno/bocetador/schemas/` (espacio/personaje/recurso/modulo/herramienta) y en la propia estructura del vault (`01_Mundo/Espacios`, `02_Personajes`, `01_Mundo/Recursos`, `01_Mundo/Modulos`, `03_Reglas`, más `08_Oficios`). Usar esa, no una propia -- mismo criterio de "nunca forzar equivalencia falsa" ya aplicado en `recurso.schema.json`. Hallazgo real al clasificar: `01_Mundo/Espacios/` ya tiene fichas reales para varios de los Espacios que los grafos existentes describen -- `n8n.md`, `El Sheet.md`, `Baserow.md`, `Telar.md` -- pero **ninguna para "Panel Operativo"/"graphify_visor"**, el Espacio real que `vista_sistema.html` describe. Es un hueco real, mismo tipo de hallazgo que ya llevó a crear `Consola.md` -- anotado, no resuelto hoy (crear la ficha del vault es una acción aparte, de escritura en el vault, no pedida).

**Clasificación real de los 10 grafos existentes** (ninguna forzada -- los que cruzan varios tipos a la vez van a "Transversal"): *Espacio* -- `n8n.html`→n8n, `sheet-real.html`→El Sheet/Baserow/Telar, `vista_sistema.html`→Panel Operativo (hueco real). *Personaje* -- `holon.html`. *Herramienta* (`herramienta.schema.json` = literalmente "un script real de `tools/gobierno/*.mjs`") -- `nodejs.html`, coincidencia exacta. *Recurso/Módulo/Regla* -- 0, huecos reales honestos, señalados en la propia página en vez de omitidos en silencio. *Transversal* -- `index.html`/`graph.html` (Apps Script, cruza todos los clientes), `grafo_maestro.html`, `anatomia.html`, `entidades.html`, `resumen_universo.html` (todos cruzan tipos a propósito, por diseño).

**Construido**: `grafos.html` -- galería agrupada por tipo real, cada tarjeta con badge del Espacio real concreto que describe (no solo "tipo Espacio" genérico). Complementa a `indice.html` (lista técnica plana) y a `vista_sistema.html` (grafo estructural del propio visor) sin solaparse. `plantilla_grafo_espacio.html` -- plantilla real (no se sirve por sí sola) con la receta ya probada en producción: `tokens.css`, formato de nodo uniforme, física con `damping`/`centralGravity`/`avoidOverlap`/congelado (§8.86), etiquetas por zoom+hover (§8.85) -- todo lo genérico ya resuelto, solo quedan 3 puntos `PERSONALIZAR` marcados (título, Espacio real, ruta del JSON) y 2 `TODO` (colores por tipo de nodo, ficha). Nace tras notar que 7 grafos reales de este visor (`index.html`/`graph.html`/`nodejs.html`/`n8n.html`/`holon.html`/`grafo_maestro.html`/`vista_sistema.html`) ya tenían bloques de física casi idénticos, copiados y ligeramente divergidos cada vez -- la plantilla detiene esa deriva para los próximos.

`home.html`: la tarjeta "Vista del sistema" pasa a ser "Grafos del sistema", apuntando a la galería en vez de directamente a `vista_sistema.html` -- sigue en 3 piezas, sin romper el criterio de minimalismo ya fijado (§8.79). `vista_sistema.html`: el enlace "volver" pasa de Home a Grafos del sistema, coherente con la nueva jerarquía de navegación.

Verificado en el navegador real: home → Grafos del sistema → las 3 secciones con contenido (Espacio/Personaje/Herramienta) y las 2 vacías con su huella honesta (Recurso·Módulo·Regla, con enlace a la plantilla). Desplegado con `desplegar_visor.mjs` (un fallo transitorio real de arranque en frío del contenedor tras el recreate, en 3 páginas antiguas -- ya documentado como comportamiento conocido de `npx serve`, confirmado 200 al reintentar segundos después).

### 8.88 Corrección: solo el grafo nuevo a la vista, histórico plegado sin nombres

Pedido: *"por ahora solo quiero ver el nuevo grafo, el historico hazlo desplegable para consultar pero que no aparezca al entrar, tampoco hagas visible los nombres del historico"*. La agrupación por tipo de §8.87 se mantiene íntegra (nada se pierde), pero deja de ser lo primero que se ve: `grafos.html` ahora abre con una única sección "Nuevo" (la tarjeta de `vista_sistema.html`), y el resto de las 9 tarjetas + sus 4 secciones por tipo quedan dentro de un `<details>` nativo, cerrado por defecto -- su `<summary>` solo dice "Histórico -- 9 grafos anteriores", ningún nombre visible hasta desplegarlo. Sin JavaScript -- `<details>`/`<summary>` es HTML nativo, más simple y robusto que replicar el patrón manual de clases `.abierto` ya usado en otras páginas del visor.

Verificado en el navegador real: al entrar solo se ve la tarjeta nueva y la línea "▸ Histórico -- 9 grafos anteriores"; clic la despliega mostrando las 4 secciones por tipo completas, con su chevron cambiando a "▾".

### 8.89 Enlace a Home en panel_operativo.html y arbol_campanas.html

Pedido: *"tambien añade a tablero de control y panel de campañas el link a home"*. Ninguna de las dos páginas tenía manera de volver a `home.html` -- solo se llegaba a ellas navegando desde ahí, sin retorno. Añadido `<a class="volver" href="home.html">← Home</a>` al principio de ambas, mismo estilo ya usado en `vista_sistema.html`/`grafos.html`. Verificado en el navegador real en ambas páginas.

### 8.90 Sheet CORE nuevo -- "empezamos de limpio"

Pedido: *"crea un sheet nuevo core y vincula la web, empezamos de limpio"*. Antes de tocar nada, dado el radio de impacto real (Sheet nuevo + repuntar código en producción + abandonar datos reales de la sesión), se confirmaron 3 decisiones con el operador vía pregunta directa: estructura real vacía (cabeceras reales, sin filas de datos), ubicación dentro de `engremiat.claude` raíz, y el Sheet actual (`Gestor de Proyectos - LaTroballa Software`, `142vRqXfDj4C7KyY7TVf5Oh18gwtDcvAkYxFQ0lb6CGQ`) se queda intacto, sin tocar.

**Construido**: nuevo Sheet real `CORE` (`1Mtfjnhls8jppNzsm15Nuq6DnIFM_jbQYFu8bGh5Zv1g`), creado con la cuenta personal del operador (`create_file` del conector real de Drive, dentro de `engremiat.claude`, `parentId` `1BzVJOb6ci4tP_RJrDOQM_5NGLXd6VGsv`) -- la cuenta de servicio no puede crear ficheros sueltos, limitación ya conocida. Compartido acto seguido con `claude-sheets@engremiat.iam.gserviceaccount.com` (rol `writer`) para que `servidor_memoria.mjs` pueda leerlo/escribirlo. Las 10 pestañas reales que el backend usa (`01_CAMPANAS`...`06_TAREAS`, `13_INCIDENCIAS`, `18_VINCULO`, `92_BUS_TRABAJO`, `90_CONFIGURACION`) creadas con sus cabeceras reales exactas (leídas del Sheet viejo, nunca inventadas) y cero filas de datos -- decisión explícita del operador, incluido `90_CONFIGURACION` pese a ser un catálogo de 385 valores reales (TIPO_PROYECTO, ESTADO_*, etc.) que alimenta el Narrador: se deja vacío tal como se pidió, no se rellenó por iniciativa propia.

**`servidor_memoria.mjs` repuntado**: `SHEETS_SPREADSHEET_ID` -> el nuevo CORE; `GID_SHEET`/`GID_13_INCIDENCIAS` actualizados a los `sheetId` reales de las nuevas pestañas (para que los enlaces "Abrir fila en el Sheet"/Ficha apunten bien).

**Dos bugs reales encontrados al verificar la escritura end-to-end** (nunca detectados antes porque nunca se había probado crear una Campaña *raíz* de verdad -- las pruebas previas, CAM-0006→PRO-0027, solo crearon un Proyecto bajo una Campaña ya existente): `HOJA_ID`/`PREFIJO_ID` y el valor por defecto de `ESTADO` usaban la clave `CAMPANA` (sin tilde), pero la UI siempre manda `'Campaña'` (con tilde) y `'Campaña'.toUpperCase()` da `'CAMPAÑA'` (con Ñ) -- nunca coincidían. Corregido en las 3 ubicaciones reales. Verificado con una escritura real de extremo a extremo tras el fix: `POST /api/crear_registro` devolvió `CAM-0001` con `ESTADO=Borrador` correcto (antes del fix devolvía `Pendiente`, el valor por defecto genérico) -- fila de prueba confirmada y borrada después.

**Bug real encontrado en `desplegar_visor.mjs` al usarlo por primera vez contra el servicio `memoria-montaje`** (hasta ahora solo se había usado contra `graphify-visor`): (1) asumía que todo fichero declarado en `docker-compose.yml` existe en local -- pero `memoria-montaje` monta `datos_memoria` (directorio, solo en el VPS) y `.sheets_credenciales.json` (secreto, nunca en git) -- corregido para omitirlos con aviso en vez de fallar. (2) `docker compose up -d` no basta para un proceso Node ya corriendo (a diferencia de `graphify-visor`, que sirve estático con `npx serve` y relee del disco en cada petición) -- `servidor_memoria.mjs` carga sus constantes UNA VEZ al arrancar, así que un cambio de código sin reiniciar el proceso no tiene efecto real. Corregido añadiendo `docker compose restart` después de `up -d`, siempre, para los dos casos (recreate por volumen nuevo + reinicio de proceso).

Verificado en real, extremo a extremo: `GET /api/jerarquia_campanas`/`incidencias_producto_abiertas`/`resumen_trabajo` devuelven vacío tras el corte; `POST /api/crear_registro` escribe correctamente en el Sheet CORE nuevo (confirmado leyendo la fila real desde Sheets, no solo por la respuesta del servidor). El Sheet antiguo, verificado que sigue intacto (no se ha escrito ni borrado nada ahí).

### 8.91 Sistematizar la creación de grafos como Proyecto real en CORE

Pedido: *"actua como experto asesor tecnico y valora la propuesta: necesitamos sistematizar la creacion de grafos... la idea es crear un mecanismo propio para la generacion de grafos a traves del gestor de proyectos de forma periodica"*. Valoración dada: la propuesta no pide infraestructura nueva -- reutiliza exactamente lo ya probado (jerarquía real del CORE, `92_BUS_TRABAJO` como bus de reclamación de trabajo, worker local `ejecutor-local.py`, y el patrón de cron ya en producción de `chequear_libreria_clientes.mjs`). Matiz dado como asesor: de las 6 fases reales reconstruidas del pipeline que se ha seguido esta sesión (detectar candidato → clasificar tipo → diseño → construir extractor+página → desplegar+verificar → documentar+enlazar → regenerar periódicamente), solo 3 son mecánicas de verdad y delegables sin riesgo al worker local (construir siguiendo plantilla, desplegar, documentar) -- detectar/clasificar sigue necesitando criterio humano/Claude, no delegarlo sin más.

**Construido como primer contenido real del Sheet CORE** (jerarquía completa, verificada leyendo `GET /api/jerarquia_campanas`): Campaña `CAM-0001` "Panel Operativo" → Proyecto `PRO-0001` "Grafos del sistema" → Producto `PRD-0001` "Mecanismo de generación sistemática de grafos" (el producto es el propio pipeline, no un grafo individual -- cada grafo real es una Tarea recurrente de este mecanismo) → 6 Procesos reales (uno por fase del pipeline reconstruido) → 6 Tareas concretas bajo los procesos mecánicos: `TAR-0001` crear `plantilla_extractor.mjs` (hueco real encontrado al ordenar esto -- existe plantilla de frontend pero ninguna de backend), `TAR-0002/0003/0004` los tres extractores reales que faltan (Recurso/Módulo/Regla, mismos huecos ya señalados en `grafos.html`), `TAR-0005` `regenerar_grafos.mjs` (orquestador), `TAR-0006` registrar la tarea programada real.

No se construyó código nuevo en esta sección -- es trabajo de backlog real, listo para reclamarse vía el mismo mecanismo de `92_BUS_TRABAJO` ya probado, cuando se decida lanzar el worker local contra estas tareas concretas.

**Refinamiento del operador sobre el Proceso 1** (*"detectar candidatos lo puede hacer si el nodo crece o decrece con capturas en el tiempo, tambien puede decir lo que hace a traves de sus nodos y relaciones"*): corrige el veredicto "no delegable" dado antes -- la *señal* de detección sí es mecánica, solo el juicio final no lo es. La mitad de "describir un nodo por sus relaciones" **ya está construida y probada**: `extraer_anatomia_entidad.mjs` (§8.46) calcula `rolReal`/`agenciaReal` de cada entidad a partir de sus aristas reales salientes -- no hay que inventar nada, solo reutilizarlo sobre los grafos del visor. La mitad de "crece o decrece con capturas en el tiempo" no existe todavía -- requiere guardar capturas fechadas y diferenciar grado por nodo, puro cálculo, sin LLM. El Proceso 1 queda partido en tres sub-fases reales: 1a (capturar+diferenciar, delegable sin LLM), 1b (describir por rol real, delegable al worker local reutilizando §8.46), 1c (decidir si amerita grafo propio y de qué tipo -- sigue siendo Puerta Humana). Añadida `TAR-0007` "Crear detectar_candidatos.mjs" bajo `PCS-0001` con esta especificación.

**Segundo refinamiento -- ficha dinámica de grafo** (*"al final del proceso añadimos... los resultados de forma dinamica en una ficha para grafo informacion"*): hoy cada tarjeta de `grafos.html` lleva su texto (nombre/descripción/contadores) escrito a mano -- exactamente el tipo de dato que este proyecto nunca deja a mano cuando puede leerse en vivo del origen real. Mejora dada como asesor: en vez de tratar "ficha" y "capturas en el tiempo" (`TAR-0007`) como dos cosas separadas, se unifican en una sola estructura -- la ficha real de cada grafo (`id`, `nombre`, `tipo`, `espacioReal`, `descripcion`, `extractor`, `pagina`, `contadores`) lleva un array `historial` (`en`, `nodos`, `aristas`) que se amplía en cada regeneración, sustituyendo la idea de ficheros con fecha en el nombre -- un solo fichero por grafo sirve a la vez para documentar (Proceso 5) y para detectar candidatos por crecimiento/decrecimiento (Proceso 1a). Cada extractor escribe su propia ficha dentro de su `grafo_X.json` y la vuelca también a un manifest único `fichas_grafos.json`, para que `grafos.html` haga un solo fetch. Ninguna pestaña nueva en el Sheet -- metadato generado por código, mismo criterio ya aplicado a `design-tokens.json`/`atlas_familias.json`. Añadidas `TAR-0008` "Crear ficha dinámica de grafo" y `TAR-0009` "Migrar grafos.html a lectura dinámica", ambas bajo `PCS-0005`.

**Tercer refinamiento -- Taller, el cockpit del pipeline** (*"en una nueva pestaña html vinculada al home llamada Taller trabajaremos... un espacio para operar el constructor de grafos"*). Valorado como bueno mientras se mantenga **específico** -- un cockpit real del Proyecto `PRO-0001`, no un panel genérico más. Reutiliza piezas ya construidas: `leerProcesosTareasReales(proyectoId)` (§8.68, la cadena Proceso→Tarea de un Proyecto concreto -- exactamente lo que hace falta), `92_BUS_TRABAJO` (mismo patrón de reclamación ya usado en Panel Operativo, filtrado a este Proyecto), y la galería (`grafos.html`, enlazada, nunca duplicada). Advertencia dada como asesor: **no** incluir un botón "ejecutar ahora" que dispare scripts desde la web -- abriría ejecución remota de código en un servidor que ya tiene un hallazgo real de seguridad pendiente (`HALLAZGOS_PENDIENTES.md`, el webhook sin comprobación de secreto). Taller se queda en lectura + gestión de backlog, la ejecución real sigue siendo manual o por cron, Puerta Humana intacta.

Añadido `PCS-0007` "7. Operar el pipeline (Taller)" -- transversal a los otros 6, no cabía dentro de uno solo -- con 5 tareas reales: `TAR-0010` construir `taller.html`, `TAR-0011` estado real de `92_BUS_TRABAJO` filtrado, `TAR-0012` enlazar galería + huecos reales pendientes, `TAR-0013` ficha dinámica con historial (depende de `TAR-0008`), `TAR-0014` reclamar tarea real desde Taller (solo escribe, nunca ejecuta).

### 8.92 Construido: `taller.html` -- cockpit real del backlog

Construidas `TAR-0010`, `TAR-0011`, `TAR-0012` y `TAR-0014` de una vez (`TAR-0013` queda pendiente de `TAR-0008`, que aún no existe). `taller.html` (nueva página, enlazada desde `home.html`) muestra el Proyecto real "Grafos del sistema" -- busca por nombre en `/api/jerarquia_campanas` (no por ID fijo, más resistente a que el ID cambie), pinta sus 7 Procesos reales con las Tareas reales de cada uno, cruza cada Tarea con `/api/bus_trabajo` para mostrar si ya está reclamada y por quién, y ofrece un botón real "Reclamar" por tarea. Enlaces a `grafos.html` (galería) y a `grafos.html#historico` (huecos reales pendientes -- añadido `id="historico"` + apertura automática por hash al `<details>` de §8.88 para que el enlace funcione).

**Backend**: nueva función `reclamarTareaReal(idTarea, reclamadoPor)` + `POST /api/reclamar_tarea` -- mismo patrón de escritura cruda ya usado (append directo a `92_BUS_TRABAJO`, sin `91_HISTORIAL`), invalida la cache de `bus_trabajo` al escribir. Deliberadamente **sin ningún endpoint que ejecute código** -- coherente con la advertencia dada en el refinamiento anterior (Puerta Humana, `HALLAZGOS_PENDIENTES.md`).

Verificado en real: `POST /api/reclamar_tarea` sobre `TAR-0010` escribió correctamente en `92_BUS_TRABAJO` (confirmado leyendo la fila, luego borrada por ser de prueba); simulada la lógica exacta de `taller.html` contra `/api/jerarquia_campanas` real -- encuentra el Proyecto por nombre, cuenta 7 procesos/14 tareas, coincide exactamente con lo esperado. La verificación visual directa en el navegador de automatización queda bloqueada por el mismo `ERR_BLOCKED_BY_CLIENT` ya documentado sobre el puerto 9320 (artefacto del entorno, no del código).

### 8.93 Cierre del backlog real: `TAR-0001` a `TAR-0009`

Pedido: continuar con todo el backlog restante del Proyecto "Grafos del sistema". Construido de una vez, en orden de dependencia real:

**`TAR-0008` (ficha dinámica, primero por ser la base de las demás)**: `ficha_grafo.mjs` -- función real `actualizarFichaGrafo()` que cada extractor llama al terminar. Escribe en dos sitios: la propia ficha embebida en `grafo_X.json` (self-describing) y una entrada en el manifest único `fichas_grafos.json`. **Bug real encontrado y corregido de inmediato**: el propio extractor sobrescribe su `grafo_X.json` entero justo antes de llamar a esta función, así que leer el historial previo DEL MISMO fichero lo perdía en cada regeneración -- corregido leyendo el historial previo del manifest (el único sitio que esta función controla en exclusiva). Verificado ejecutando el extractor dos veces seguidas: el historial pasó de 1 a 2 entradas reales, confirmando la acumulación.

**`TAR-0001`**: `plantilla_extractor.mjs` -- companion real de `plantilla_grafo_espacio.html`, con la regla de oro repetida (solo lectura, nunca inventar) y el llamado a `actualizarFichaGrafo()` ya integrado.

**`TAR-0002/0003/0004` (Recurso/Módulo/Regla)**: investigado antes de escribir un extractor nuevo -- `cargar_desde_vault.mjs` (Bocetador) ya parsea estas tres carpetas del vault con sus `relacionesDeclaradas` reales (wikilinks), escribiendo `universo_real.json`. Escribir un extractor nuevo que reparseara el vault habría repetido exactamente el error ya cerrado en §8.59 ("el Bocetador y el Graphify Visor eran dos lectores del mismo vault que no se cruzaban"). Construido en su lugar `mapear_grafo_por_tipo.mjs --tipo recurso|modulo|regla`, un solo script real que lee `universo_real.json`, indexa TODAS las entidades reales (no solo las del tipo pedido -- una Regla real puede referenciar un Personaje), y resuelve cada relación declarada contra ese índice; lo que no resuelve se marca como nodo "externo" (mismo patrón honesto ya usado en `cargar_grafo_wikilinks.mjs`, nunca descartado en silencio). Páginas reales `vista_recursos.html`/`vista_modulos.html`/`vista_reglas.html` a partir de la plantilla. Verificado: 9 fichas reales de Recurso (0 externos), 21 de Módulo (0 externos), 6 de Regla (1 externo, señalado).

**Retrofit real de 5 extractores preexistentes** (no pedido explícitamente como tarea propia, pero necesario para que `TAR-0009` tuviera sentido sin dejar huérfanos los grafos ya existentes): `mapear_grafo_node.mjs`, `mapear_grafo_n8n.mjs`, `cargar_grafo_holon.mjs`, `extraer_anatomia_entidad.mjs` y el ya integrado `mapear_grafo_visor.mjs` -- los 5 ahora llaman a `actualizarFichaGrafo()`. Deliberadamente **no** se retroalimentó el pipeline de censo (`analizar_entidades_reales.mjs`/`consolidar_censo.mjs`, tiene efectos reales de escritura en el vault y pasadas manuales sucesivas), ni `sheet-real.html` (multi-dataset, no un extractor único), ni `grafo_maestro.html` (composite, lee 3 ficheros a la vez), ni `index.html`/`graph.html` (pipeline externo de Apps Script/Graphify), ni `resumen_universo.html` (curado a mano) -- los 5 quedan como tarjetas estáticas en el histórico plegado de `grafos.html`, con la razón real de cada uno explicada ahí mismo.

**`TAR-0009`**: `grafos.html` migrada a lectura dinámica real -- hace un solo `fetch('fichas_grafos.json')`, agrupa por `tipo` real y pinta las tarjetas (nombre/badge/descripción/contadores) directamente desde la ficha, sin texto hardcodeado. La sección "Nuevo" de §8.88 se reinterpreta con más precisión: ya no es "1 tarjeta fija decidida a mano", sino **todo grafo con ficha real** (= ya pasó por el pipeline formal: candidato aprobado, tipo definido, documentado) se muestra automáticamente arriba; el `<details>` plegado queda para lo construido *antes* de que existiera este pipeline formal, que bajó de 9 a 5 tarjetas reales. Responde directamente al pedido explícito del operador durante la construcción: *"que una vez aprobado el candidato y definido el tipo y ficha se almacene en el html grafos"* -- ahora ocurre solo, sin edición manual.

**`TAR-0005`**: `regenerar_grafos.mjs` -- orquestador real que ejecuta los 8 extractores reales conocidos (los 5 retrofit + los 3 nuevos) en un solo comando, con `--desplegar` opcional para subir al VPS al final. Excluye deliberadamente el pipeline de censo y Graphify por las mismas razones de arriba (efectos de escritura reales / pipeline externo). `desplegar_visor.mjs --grafo` generalizado para llamar a este orquestador en vez de a un único extractor.

**`TAR-0007`**: `detectar_candidatos.mjs` -- lee el historial real de cada ficha, calcula el delta relativo de sus contadores entre la primera y la última captura (umbral 10%, por debajo se considera ruido), y para cada candidato reutiliza el `rolReal` YA calculado por `extraer_anatomia_entidad.mjs` (§8.46) si existe, nunca recalculado. Solo lectura, no decide nada -- el Proceso 1c (Puerta Humana) sigue siendo humano. Verificado con datos reales: tras varias regeneraciones de `vista_sistema.html` durante esta misma sesión de construcción, el propio script señaló correctamente "paginas: 20 -> 23 (+15%)" como candidato real a revisar.

**`TAR-0006`**: tarea programada real registrada en Windows Task Scheduler -- `Engremiat - Regenerar grafos`, diaria a las 08:15 (15 minutos después de `Engremiat - Chequeo libreria clientes`, para no solaparse), mismo patrón exacto ya probado (`ejecutar_regenerar_grafos.ps1`: `git pull` + `node regenerar_grafos.mjs --desplegar`). Verificada con `schtasks /query` -- registrada, habilitada, próxima ejecución real confirmada.

Desplegado todo de una vez con `desplegar_visor.mjs --grafo` (que ahora regenera los 8 grafos reales antes de copiar). Verificado en el navegador real: `grafos.html` renderiza dinámicamente 8 tarjetas agrupadas por tipo con sus contadores reales, el histórico plegado bajó a 5, y `vista_recursos.html` renderiza su grafo real con nodos coloreados por tipo (Recurso/Espacio/Personaje referenciados).

**Cierre de `TAR-0013`**: el operador señaló, viendo `taller.html` real en su propio navegador (todas las tareas en "sin reclamar"), que *"el html esta incompleto"* -- faltaba la única tarea del backlog aún no construida, `TAR-0013` (mostrar ficha dinámica con historial). Añadida a `taller.html`: nueva sección que hace `fetch('fichas_grafos.json')` y muestra, por cada grafo real, su historial de capturas y un enlace directo a su página.

**Actualización real del Sheet CORE** (*"actualiza el sheet para los nuevos procesos"*): las 14 Tareas y los 7 Procesos habían quedado con `ESTADO=Pendiente` pese a estar ya construidos y desplegados -- por eso `taller.html` mostraba todo como "sin reclamar" aunque el trabajo real ya estaba hecho. Corregido escribiendo directamente en el Sheet (vía API, no por `crear_registro` -- esa solo crea filas, no las actualiza): las 14 Tareas a `Terminada`/100%, los 7 Procesos a `Completado`/100%, y el Producto/Proyecto padres también a `Completado`. Verificado leyendo `/api/jerarquia_campanas` de vuelta -- el árbol completo (Proyecto→Producto→7 Procesos→14 Tareas) refleja ahora el estado real.

### 8.94 Proceso 1c real en `grafos.html`: Candidatos + A promover

Pedido: *"nos falta botones de accion, para aceptar candidato y promover a su espacio en grafos.html, por otro lado, no me interesa ver en esta vista los grafos historicos, ocultalos"*, simplificado acto seguido: *"solo necesitamos ver una lista de candidatos y una lista a promover"*.

**Riesgo real identificado antes de construir**: si "promover" escribe en vivo en el `fichas_grafos.json` del VPS, y la próxima regeneración local (o el propio cron de las 08:15, `TAR-0006`) corre después sin traer esa promoción de vuelta, el siguiente despliegue la sobrescribiría en silencio -- mismo tipo de bug de sincronización ya visto en otros puntos de la sesión, aquí a nivel de fichero en vez de Sheet. Corregido en `regenerar_grafos.mjs`: antes de correr ningún extractor, trae el `fichas_grafos.json` vivo del VPS (ya servido en `:9320`, lectura pública) y lo fusiona con el local -- las claves promovidas a mano nunca se pisan, las de los extractores se refrescan igual que siempre.

**Backend**: `promoverGrafoReal()` + `POST /api/promover_grafo` en `servidor_memoria.mjs` -- valida el tipo contra los 6 reales, escribe una ficha manual (`extractor: "promovido a mano"`, sin `grafo_X.json` propio, historial vacío) directamente en el manifest. `docker-compose.yml`: el mismo fichero real `fichas_grafos.json` del host se monta `ro` en `graphify-visor` (lo sirve) y ahora también `rw` en `memoria-montaje` (el endpoint lo escribe) -- un solo fichero real, dos contenedores, sin duplicar estado ni reiniciar nada para que el cambio se vea.

**`grafos.html`**: quitada por completo la sección "Histórico" (antes plegada, ahora oculta del todo, tal como se pidió). Dos listas nuevas, simples, tal como se redujo el alcance: **Candidatos** -- mismo cálculo exacto de `detectar_candidatos.mjs` (delta ≥10% sobre el historial real de cada ficha) reproducido en el propio navegador sobre los datos ya cargados, solo informativo. **A promover** -- los 5 grafos reales sin ficha (mismos 5 de antes, ahora sin las tarjetas descriptivas grandes), cada uno con un `<select>` de los 6 tipos reales y un botón "Promover" que escribe de verdad y recarga -- al promoverse, desaparece de "A promover" y aparece arriba, agrupado con el resto, sin que nadie edite HTML a mano.

Verificado en real: `POST /api/promover_grafo` sobre un ítem de prueba escribió correctamente y `graphify-visor` lo sirvió de inmediato desde el mismo fichero (sin reiniciar) -- confirmado y luego revertido por ser de prueba. En el navegador: candidatos y "a promover" renderizan correctamente con datos reales (1 candidato real: `vista_sistema` +15% páginas; 5 pendientes de promover). El clic real del botón "Promover" queda bloqueado en el navegador de automatización por el mismo `ERR_BLOCKED_BY_CLIENT` ya conocido sobre el puerto 9330 -- no es un fallo del código, ya verificado aparte por `curl`.

**Corrección inmediata**: el operador pidió quitar la sección "Candidatos" del todo (no solo dejarla vacía) -- quitada de `grafos.html` (HTML + `calcularCandidatos()` + su render), sin tocar el resto. `detectar_candidatos.mjs` (CLI, Proceso 1a) sigue intacto -- solo se retira la vista en el navegador. "A promover" queda igual.

### 8.95 "A promover" real: sin pre-rellenar, con ficha borrador y prioridad

Corrección de fondo del operador sobre §8.94: *"aqui deja la lista vacia, aun no hemos iniciado ningun ciclo real, aqui tenemos que tener acceso a la ficha de grafo aunque sea un borrador, tambien tenemos que poder poner algun tipo de prioridad en la lista de a promover para no colapsar la pantalla"*. Los 5 grafos históricos que yo mismo había puesto en "A promover" eran una lista que decidí a mano -- no reflejaban ningún candidato propuesto por un ciclo real todavía, contradiciendo el principio de todo el proyecto de nunca mostrar como "en curso" algo que nadie ha iniciado de verdad.

**Construido**: `candidatos_a_promover.json` -- arranca real y vacío (`{"candidatos":[]}`), nunca pre-poblado. `proponer_candidato.mjs` -- la mitad real de "proponer" del Proceso 1c (CLI: `--id --nombre --pagina --tipo --prioridad --descripcion`), escribe un candidato con **ficha borrador** completa (tipo tentativo, descripción, página, fecha) y una `prioridad` real (Alta/Media/Baja, mismo vocabulario que `PRIORIDAD` en el catálogo `90_CONFIGURACION`). `grafos.html`: la lista ordena por prioridad, muestra Alta directamente y pliega Media/Baja detrás de un `<details>` ("no colapsar la pantalla" cuando crezca) -- cada candidato lleva un enlace real "Ver ficha (borrador)" que despliega sus campos completos, un `<select>` de tipo (preseleccionado con el tentativo, editable) y el botón "Promover" ya existente. Al promover, `promoverGrafoReal()` ahora también retira el candidato de `candidatos_a_promover.json` (mismo fichero real, ya compartido `rw` entre los dos contenedores desde §8.94) -- nunca coexisten como borrador y como ficha final a la vez.

**Segundo riesgo real de sincronización, mismo patrón que §8.94**: `candidatos_a_promover.json` es una *lista*, no un diccionario por clave -- promover *borra* una entrada en vivo. Si la copia local todavía la tiene (se propuso y nunca se volvió a sincronizar), desplegar sin cuidado la "resucitaría". Corregido en `regenerar_grafos.mjs`: la versión viva del VPS manda; de la copia local solo se añaden candidatos cuyo id no esté ya vivo **ni ya tenga ficha real** en `fichas_grafos.json` (si ya se promovió, nunca vuelve a aparecer como candidato).

Verificado en real, extremo a extremo: propuestos 2 candidatos de prueba (`sheet_real` Alta, `grafo_maestro` Media) con `proponer_candidato.mjs`; en el navegador, Alta aparece directo con ficha borrador completa al desplegar, Media queda plegada bajo "Media / Baja prioridad (1)". Limpiados después por ser de prueba -- la lista real queda vacía, tal como corresponde a que ningún ciclo real se ha iniciado todavía.

### 8.96 `taller.html`: bug real de estado + limpieza del bloque de fichas

Dos correcciones sobre `taller.html`: (1) quitado el bloque "Fichas reales de los grafos (con historial)" (TAR-0013) -- redundante ahora que `grafos.html` ya muestra bien las fichas, y el operador pidió eliminarlo. (2) **bug real encontrado con ayuda del operador** (confirmó viéndolo en su propio navegador, no solo en capturas): `renderTarea()` solo mostraba si una Tarea había sido reclamada en `92_BUS_TRABAJO` -- nunca miraba el `ESTADO` real de la propia Tarea en `06_TAREAS`. Las 14 tareas reales, ya marcadas `Terminada` en el Sheet (§8.93 cierre), seguían apareciendo como "sin reclamar" -- el reclamo y el estado real son dos señales distintas, y solo se mostraba una. Corregido: cada Tarea muestra ahora su `ESTADO` real como badge principal (verde si `Terminada`, ámbar si `En proceso`, rosa si `Bloqueada`/`Cancelada`), el reclamo de `92_BUS_TRABAJO` queda como badge secundario si existe, y el botón "Reclamar" se oculta en tareas ya `Terminada` (no tiene sentido reclamar algo terminado). Mismo tratamiento en la cabecera de cada Proceso (ya traía `estado` real de la API, nunca se pintaba). Descartada de paso una hipótesis real intermedia (CORS/Private Network Access) -- verificado con `curl` que el servidor responde correctamente a un preflight real, el problema nunca estuvo ahí. Confirmado en el navegador real del operador: los 7 Procesos y las 14 Tareas muestran ahora `Completado`/`Terminada` en verde.

### 8.97 Solo el grafo inicial a la vista, el resto plegado

Con 8 fichas reales ya generadas, el bloque dinámico agrupado por tipo volvió a mostrar todo de golpe -- la misma regresión ya corregida una vez en §8.88, esta vez sobre las tarjetas dinámicas en vez de las estáticas. Pedido: *"en este bloque solo debería de quedar el grafo inicial, oculta los antiguos"*. Aplicado el mismo criterio: `vista_sistema` (el grafo inicial, id fijo `ID_GRAFO_INICIAL`) se muestra siempre; las otras 7 fichas reales (nodejs, n8n, holon, anatomía, recurso, módulo, regla) quedan agrupadas por tipo dentro de un `<details>` plegado, "Otros grafos (7)". Nada se pierde -- solo deja de mostrarse por defecto.

### 8.98 Técnico -- fichas de prompt real, listas para delegar

Pedido: *"crea una nueva pestaña vinculada al home llamada (tecnico): actua como asesor tecnico y valora la propuesta, la idea es que en este html, podamos generar prompts structurados adaptados al modelo local, mi idea es: tu haces la seleccion de procesos y tareas inicial, lo pruebas y generas evidencia de lo que ha funcionado y lo que no para el desarrollo y hacemos una ficha de prompt para algun worker externo o interno"*.

**Valoración dada**: buena idea, cierra un hueco real que se venía citando toda la sesión ("delegable al worker local, con Puerta Humana") sin construir nunca el mecanismo que lo hace seguro. Precedente real directo a reutilizar en vez de inventar uno: `PROMPT_EJECUTOR.md` ya es un prompt versionado real, registrado en `registro_ecosistema.json` bajo `prompts_operativos`. Mejora dada: igual que `candidatos_a_promover.json` (§8.95), una ficha de prompt nunca declara "Probado" sin una prueba real detrás -- ciclo `Borrador → Probado → Listo para delegar`, con evidencia genuina (qué funcionó, qué falló) obligatoria a partir de "Probado".

**Construido**: `crear_ficha_prompt.mjs` (CLI real, JSON por stdin -- evita el infierno de escapado de comillas de una sola línea de shell, encontrado y corregido a mitad de construcción) escribe en `fichas_prompt.json`, rechazando de plano un estado distinto de "Borrador" sin `funciono`/`fallo` reales. `tecnico.html` -- visor de solo lectura (mismo criterio que Taller: ningún botón de "ejecutar", Puerta Humana intacta), agrupa por estado, cada ficha con tarea/worker destino/fecha de prueba, listas reales de qué funcionó/qué falló, y el prompt completo en un `<details>` plegado.

**Dos fichas reales pobladas de una vez** (pedido explícito: *"pruebalo y definelo con las tareas del constructor de grafos y hacemos una prueba real con contenido real"*) -- reconstruida honestamente la evidencia real de esta misma sesión, no inventada: "Escribir un extractor `mapear_grafo_X.mjs`" (TAR-0002/3/4, con la evidencia real de reutilizar `universo_real.json` y el bug de `ficha_grafo.mjs` encontrado al probarlo) y "Escribir un orquestador que regenera N extractores sin pisar estado escrito en vivo" (TAR-0005, con la evidencia real de las dos reglas de fusión distintas, diccionario vs. lista).

**Bug real encontrado y corregido al verificar en el navegador**: los prompts reales incluyen marcadores `<TIPO>` -- insertados sin escapar vía `innerHTML`, el navegador los trataba como etiquetas HTML desconocidas y los descartaba en silencio ("el tipo  que:" en vez de "el tipo `<TIPO>` que:"). Corregido con un `escapeHtml()` real aplicado a todo texto dinámico de la ficha, no solo al prompt. Verificado en el navegador real tras el fix: el prompt completo se lee correcto, con los marcadores `<TIPO>` visibles.

### 8.99 Biblioteca -- plantillas y patrones reutilizables

Pedido: *"abre una nueva pestaña vinculada al home llamada (biblioteca)"*. Nombre demasiado genérico para construir a ciegas -- preguntado qué debía contener; respuesta: plantillas y patrones reutilizables, no documentos.

**Investigado antes de construir**: solo 2 ficheros reales del repo son plantillas de *desarrollo* (`plantilla_grafo_espacio.html`, `plantilla_extractor.mjs`) -- los otros dos con "Plantilla" en el nombre (`src/PlantillaImportacionMasivaService.js`/`...Avanzada...`) son servicios de negocio reales de la app cliente, categoría distinta a propósito, no se mezclan.

**Construida `biblioteca.html`**, curada a mano (como `resumen_universo.html`) con dos capas: las 2 plantillas reales (ficheros a copiar), y **10 patrones de diseño reales** -- decisiones repetidas al menos dos veces en esta sesión, cada una con su primera aplicación real como referencia enlazada (nunca inventado): Ficha espejo, KPI como botón de filtro, Revelación gradual, Física de grafo con inercia cero, Etiquetas ocultas por zoom+hover, Ficha dinámica + historial, Extractor real (solo lectura, reutilizar antes de reparsear), Puerta Humana en dos pasos (proponer→promover), Evidencia real obligatoria antes de "Probado", y Fusión antes de regenerar. Enlazada desde `home.html` (6ª pieza real). Verificado en el navegador real: renderiza correctamente, todos los enlaces reales a su primera aplicación.

**Corrección inmediata**: pedido *"oculta de la lista los patrones de diseño reales"* -- aplicado el propio patrón "Revelación gradual" (literalmente uno de los 10 catalogados) a la página que los cataloga: los 10 quedan detrás de un `<details>` plegado, "Patrones de diseño reales (10)", visible solo el contador. Las plantillas (ficheros reales) siguen visibles directamente.

**Segunda corrección**: pedido *"esto deberia de quedar en su espacio para ir ordenando las plantillas, llamalo (grafos) y abajo crea otra seccion llamada prompts"* -- la sección única "Plantillas" se parte en espacios propios por dominio real, para poder seguir ordenando sin amontonar: **Grafos** (las 2 ya existentes) y **Prompts**, con `crear_ficha_prompt.mjs` como su primer real -- no es un fichero a copiar como los de Grafos, es el propio CLI, cuya cabecera documenta la forma exacta del JSON esperado (esa cabecera ES la plantilla real de este dominio). Añadido su volumen real a `docker-compose.yml` (antes solo se servían `fichas_prompt.json`/`tecnico.html`, nunca el propio script). Verificado en el navegador real: las dos secciones renderizan correctamente, `crear_ficha_prompt.mjs` se abre como código fuente (mismo comportamiento ya visto con `plantilla_extractor.mjs`).

### 8.100 Técnico -- valoración automática por DeepSeek, calibrada contra evidencia real

Pedido: *"la idea es crear un mecanismo que cada una de las tareas que se han generado en el taller pase por deepseek y que haga su valoracion y propuesta de desarrollo de cada tarea con contenido y contexto para evitar errores, cogemos el ejemplo de la misma tarea del constructor de grafos para tener datos para comparar resultados"*.

**Investigado antes de construir**: "DeepSeek" no era ambiguo -- ya existe como proveedor real en este repo (`tools/coordinador.mjs`, `spike_concilio_coop/servidor.mjs`): la API de pago `deepseek-chat`, con clave real en `G:/Mi unidad/DEVS/engremiat-litellm/.deepseek_key` y gasto registrado en Baserow `GASTO_API` (tabla 285, tope real documentado de $5/mes en `resumen_universo.html`). Confirmado que NO es el worker local (Ollama solo tiene `devstral-dev`/`qwen3` instalados, ningún modelo deepseek) -- se reutiliza el proveedor real ya en uso, sin inventar uno nuevo ni confundirlo con el worker local.

**Construido**: `evaluar_tarea_deepseek.mjs` (CLI, JSON por stdin como `crear_ficha_prompt.mjs`) -- por cada tarea real recibe `{id, tareaId, titulo, descripcion, contexto[]}`, comprueba primero el gasto real acumulado del mes en `GASTO_API` (aborta si ya se alcanzó el tope de $5), pide a `deepseek-chat` una valoración estructurada (`valoracion`, `propuesta`, `riesgos`, `pasos`) y registra el gasto real de la llamada en `GASTO_API` (mismo patrón de `registrarUso`/`guardarGastoEnBaserow` de `coordinador.mjs`). Escribe `evaluaciones_deepseek.json`. Un segundo CLI, `registrar_comparacion_deepseek.mjs`, anota a mano (nunca con otro LLM) el veredicto real (`coincide`/`parcial`/`diverge`) de comparar la propuesta contra lo que de verdad pasó al ejecutar la tarea -- exige al menos una coincidencia o divergencia real documentada, mismo espíritu de "evidencia real obligatoria" que ya rige `crear_ficha_prompt.mjs`.

**Prueba real pedida por el usuario**: se tomó `TAR-0002` ("Extractor real de tipo Recurso", ya Terminada) como caso de comparación -- se envió a DeepSeek el mismo contexto real que existía ANTES de escribir el extractor de verdad (que `cargar_desde_vault.mjs`/`universo_real.json` ya existían, la regla de solo lectura, el patrón de no duplicar extractores) sin revelarle la solución ya tomada, y se comparó su propuesta contra la evidencia real ya documentada en `fichas_prompt.json`. Resultado real, veredicto **parcial**: coincidió en lo estructural (reutilizar `universo_real.json` como índice global en vez de reparsear, comprobar duplicados antes de escribir, llamar a `actualizarFichaGrafo()`), pero **divergió en un punto real importante** -- propuso descartar en silencio las relaciones no resueltas en vez de marcarlas como nodo "externo" (el enfoque real, que de hecho encontró un hueco real gracias a no descartar nada). Tampoco pudo anticipar el bug real de `ficha_grafo.mjs` (historial leído del fichero ya sobrescrito) ni la parametrización por `--tipo` que solo tuvo sentido viendo las 3 tareas juntas -- confirma que la valoración complementa la evidencia real de una prueba genuina, nunca la sustituye. Coste real de la prueba: $0.001259 (606+752 tokens).

**Añadido a `tecnico.html`**: nueva sección "Valoraciones DeepSeek", debajo de las fichas reales -- por cada valoración muestra título/tarea, coste real, valoración/propuesta/riesgos, pasos y contexto enviado plegados, y el bloque de comparación real (coincidió/divergió/notas) cuando existe, o un aviso de "todavía sin ejecutar de verdad" cuando no. Mismo `escapeHtml()` ya usado en el resto de la página. Añadido volumen real `evaluaciones_deepseek.json:ro` a `docker-compose.yml` (los dos scripts `.mjs` corren solo en local -- necesitan la clave real de DeepSeek en disco, mismo patrón que `coordinador.mjs`, nunca se despliegan al VPS). Desplegado y verificado en el navegador real (`get_page_text`): la sección renderiza completa, sin fabricar nada, con el veredicto real "parcial" visible.

### 8.101 Ficha maestra real: el backlog completo (7 procesos, 14 tareas) como una sola ficha de prompt

Pedido: *"utiliza la plantilla de prompts y haz una ficha con estas tareas: 7 procesos reales, 14 tareas reales"* -- pegado el backlog completo real de "Grafos del sistema", incluida `TAR-0014 "Reclamar tarea real desde Taller"`, con la instrucción final *"para que dé más contexto y contenido y devuélveme el resultado"*.

**Verificado antes de construir**: se leyó en real la jerarquía completa (`/api/jerarquia_campanas`) y `92_BUS_TRABAJO` -- confirmados los 7 procesos y las 14 tareas exactas pegadas por el usuario, las 14 ya `Terminada`, `BUS_TRABAJO` vacío (`{"tareas":[]}`, nadie trabajando ahora mismo). Decisión tomada: reclamar en vivo una tarea ya Terminada habría fabricado una señal real de "se está trabajando ahora" que no es cierta -- viola el mismo principio de "nunca inventar" que rige todo el proyecto -- así que se interpretó el pedido como "usa la plantilla real de fichas de prompt (`crear_ficha_prompt.mjs`) para documentar, con más contenido y contexto, el backlog entero ya construido", no como una llamada real a `/api/reclamar_tarea` sobre una tarea cerrada.

**Construida** la ficha `proyecto_grafos_del_sistema_completo` con `crear_ficha_prompt.mjs`: un prompt real que describe las 7 fases del pipeline en orden (detectar candidato → diseño del grafo → construir extractor+página → desplegar y verificar → documentar y enlazar → regenerar periódicamente → operar el pipeline en Taller), como plantilla reutilizable para construir un proyecto de "grafos del sistema" análogo desde cero. `funciono`/`fallo` reales agregados de las 14 tareas reales de esta sesión (reutilizar `universo_real.json`, ficha dinámica + historial, fusión antes de regenerar, Puerta Humana en dos pasos, tarea programada real -- y los 4 bugs reales encontrados y corregidos: historial de `ficha_grafo.mjs`, `taller.html` mostrando "sin reclamar" pese a `ESTADO=Terminada`, `desplegar_visor.mjs` con ficheros server-only, `up -d` sin `restart`). Desplegado y verificado en el navegador real: la tercera ficha aparece completa en `tecnico.html`, junto a las dos ya existentes.

### 8.102 Worker local (devstral-dev) en Técnico: bloqueo real de CORS/bind, resuelto sin tocar la seguridad de Ollama

Pedido: *"en tecnico, añade un boton arriba para enviar a worker local dev stral, confirma que el uso de graphify esta actualizado en el prompt maestro"*.

**Segunda parte primero (más simple)**: revisada la ficha maestra `proyecto_grafos_del_sistema_completo` -- no mencionaba Técnico ni Biblioteca, construidos después de escribirla. Añadido un párrafo real a su `prompt` ("Continuación real del mismo visor...") describiendo ambas piezas como extensión del mismo pipeline, más una entrada nueva en `funciono` (reutilizar `tokens.css`/el patrón de fichas CLI/el propio manifest, sin infraestructura nueva). Re-escrita con `crear_ficha_prompt.mjs` (mismo id, sobrescribe).

**Primera parte -- investigado antes de construir el botón**: probado en real que Ollama en la máquina del operador (a) solo escucha en `127.0.0.1` (`netstat` confirmó que ni siquiera su propia IP Tailscale, 100.118.79.49, sirve) y (b) devuelve `403` a cualquier petición con cabecera `Origin` no ordinaria (probado con `curl -X OPTIONS` y `Origin: http://100.107.171.88:9320`) -- ninguna combinación de "botón en `tecnico.html` (servido en el VPS)" puede llamarlo en vivo sin reconfigurar la exposición de red de Ollama en la máquina del operador. Presentadas 4 opciones reales al operador (CLI+panel / abrir Ollama a la Tailnet / permitir el origen por CORS / solo copiar el prompt) -- elegida **CLI + panel de resultados**, sin tocar la configuración de seguridad de Ollama.

**Construido**: `enviar_a_worker_local.mjs` (CLI, mismo formato de entrada que `evaluar_tarea_deepseek.mjs` para poder comparar la misma tarea contra los dos proveedores) -- llama a `http://localhost:11434/api/chat` con `devstral-dev`, registra tokens/duración reales (`$0`, sin tope de gasto) y escribe `respuestas_worker_local.json`. `registrar_comparacion_worker_local.mjs` anota a mano el veredicto real, mismo criterio de evidencia obligatoria que su equivalente de DeepSeek. En `tecnico.html`, arriba del todo: caja "Enviar una ficha al worker local" con selector de ficha real, botón "Copiar prompt" (copia el `prompt` real de la ficha elegida al portapapeles) y botón "Copiar comando" (el comando real a ejecutar) -- documentado explícitamente que no hay llamada en vivo, por qué no la hay, y qué hacer en su lugar. Nueva sección "Respuestas del worker local", mismo patrón visual que "Valoraciones DeepSeek".

**Prueba real**: se envió la MISMA tarea real (`TAR-0002`, mismo contexto) ya usada con DeepSeek, para comparación directa. Veredicto real: **diverge** -- coincidió en los dos puntos más básicos (comprobar duplicados antes de escribir, llamar a `actualizarFichaGrafo()`), pero propuso "usar `cargar_desde_vault.mjs`" en vez de leer `universo_real.json` (ambiguo sobre el punto central de no reparsear), omitió por completo marcar relaciones no resueltas como "externo" (mismo punto donde DeepSeek también divergió), y detectó el riesgo de cobertura incompleta de categorías sin traducirlo a ningún paso concreto. Respuesta bastante más breve y genérica que la de DeepSeek sobre la misma tarea real -- primera comparación real entre worker local y API de pago para este tipo de tarea, con evidencia real (no opinión) de que DeepSeek fue más completo aquí. Desplegado y verificado en el navegador real: las tres secciones (fichas, valoraciones DeepSeek, respuestas worker local) renderizan completas.

### 8.103 Constructor de grafos en `grafos.html`: re-visualizar JSON real ya estructurado, nunca interpretar contenido libre

Pedido: *"añadimos un nuevo bloque superior llamado (constructor de grafos), en este espacio habra una caja donde poner una url y generar el grafo pasando por las plantillas establecidas, valora y mejora la propuesta"*.

**Decisión tomada con el operador antes de construir**: "poner una URL y generar el grafo" admite dos lecturas con riesgo muy distinto -- (a) la URL apunta a un JSON ya estructurado (misma forma que todo `grafo_*.json` de este visor: `{"nodos":[...], "aristas":[...]}`), que solo se re-visualiza con la plantilla ya establecida, o (b) la URL es una página/documento cualquiera y un modelo infiere nodos/relaciones de su contenido -- con riesgo real de inventar entidades no verificadas, contra la regla de oro de "nunca inventar" que rige todo el proyecto hasta ahora. Preguntado directamente al operador: elegida **(a)**.

**Construido**: bloque "Constructor de grafos" arriba del todo en `grafos.html` -- caja de URL + botón "Generar vista previa". `validarFormaGrafo()` rechaza con un aviso concreto (nunca intenta adivinar estructura) si falta `nodos`/`aristas`, si `nodos` está vacío, o si algún nodo real no tiene `id`. Si la forma es válida, se renderiza en el propio bloque con la MISMA física/plantilla ya establecida en `plantilla_grafo_espacio.html` (forceAtlas2Based con damping/centralGravity/avoidOverlap, congelado tras estabilizar, etiquetas ocultas por zoom/hover, ficha real al clic). Mejora real aplicada sobre lo pedido: las aristas cuyo destino no resuelve contra los nodos reales del propio JSON NUNCA se descartan en silencio -- se genera un nodo "externo" visible para cada una (mismo criterio ya usado en `mapear_grafo_por_tipo.mjs`, reutilizado aquí en vez de inventar un comportamiento nuevo). Vista previa efímera a propósito -- no escribe ningún fichero; para conservarla de verdad sigue el ciclo Puerta Humana ya existente (`proponer_candidato.mjs` → "A promover").

**Verificado en el navegador real**: generada la vista previa con `grafo_visor.json` (real, ya servido) -- 57 nodos/85 aristas, leyenda con los 4 tipos reales de ese grafo (pagina/servidor/endpoint/recurso_real) con colores generados dinámicamente (no una paleta fija por tipo, ya que un JSON externo puede traer cualquier tipo), clic en un nodo real mostró su ficha (`/api/misiones_feria -- endpoint`). Probado también el rechazo real: pegar `fichas_prompt.json` (JSON real pero de otra forma, sin `nodos`/`aristas`) mostró el aviso correcto "Falta \"nodos\" (array)...", sin intentar renderizar nada.

**Corrección inmediata**: pedido *"conecta esta vista previa con proponer_candidato.mjs"*. Mismo bloqueo real que en §8.102 (script CLI local, sin endpoint en vivo) -- mismo patrón ya elegido por el operador: en el panel de la vista previa, un mini-formulario (`id`/`nombre`/`tipo`/`prioridad`/`descripción`) se pre-rellena con datos reales de la vista generada (slug de la URL, contadores reales de nodos/aristas) y un botón "Copiar comando real" arma el comando exacto de `proponer_candidato.mjs` (con `--pagina` apuntando a la URL real usada) y lo copia al portapapeles -- nunca una llamada en vivo que no existe. Bug real encontrado al verificar en el navegador: `navigator.clipboard` puede no existir (contexto no seguro, o sin permiso) -- sin guarda, el clic lanzaba un `TypeError` sin capturar y no mostraba ningún aviso, ni de éxito ni de fallback. Corregido con una función común `copiarConFallback()` que comprueba `navigator.clipboard` antes de usarlo y muestra el comando real en un `alert()` si no está disponible -- aplicado también, por el mismo bug latente, a los dos botones de copiar ya existentes en `tecnico.html` (worker local). Verificado en el navegador real: dos clics consecutivos, ambos con el aviso correcto y el comando completo, sin errores nuevos en consola.

### 8.104 Biblioteca: sección "Grafos JSON" -- catálogo real de los 12 `grafo_*.json` como ejemplos del esquema

Pedido: *"en biblioteca añade una nueva seccion llamada (grafos json) debajo de grafos"*.

**Verificado antes de listar nada**: comprobado con un script real (`node -e`) que los 12 `grafo_*.json` existentes en el visor cumplen de verdad la forma `{"nodos":[...], "aristas":[...]}` que exige el Constructor de grafos (§8.103) -- no asumido, contado nodo a nodo/arista a arista. Descripciones reales de cada uno tomadas de donde ya estaban documentadas (`fichas_grafos.json` para los 7 con ficha dinámica propia; `sheet-real.html`/`grafo_maestro.html` para los 5 restantes, más antiguos) -- ninguna inventada de cero.

**Construida** la sección "Grafos JSON" en `biblioteca.html`, entre "Grafos" y "Prompts" -- 12 tarjetas reales, cada una enlazando al JSON real (se abre como fuente, mismo comportamiento que las plantillas) con su descripción real y sus contadores reales (nodos/aristas) de hoy. Explicita su doble propósito: ejemplos reales para probar el Constructor de grafos, o punto de partida real al escribir un extractor nuevo con `plantilla_extractor.mjs`. No requirió tocar `docker-compose.yml` -- los 12 ficheros ya estaban montados de antes. Desplegado y verificado en el navegador real: las 12 tarjetas renderizan completas, en el orden y ubicación pedidos.

**Corrección inmediata**: pedido *"oculta los grafos historicos"*. Los 12 se dividen en dos grupos reales y verificables: los 7 con ficha dinámica propia en `fichas_grafos.json` (mantenidos por un extractor real que se regenera, §8.94) y los 5 sin ella (`grafo_historial`, `grafo_jerarquia`, `grafo_paquete_cliente`, `grafo_telar_estados`, `grafo_wikilinks`) -- anteriores al mecanismo de ficha dinámica, ya no se regeneran desde este ciclo. Aplicado el mismo patrón "Revelación gradual" ya catalogado en esta misma página: los 7 mantenidos quedan visibles directamente, los 5 históricos se pliegan bajo `<details>` "Grafos históricos (5)". Verificado en el navegador real.

**Eliminada por completo** (pedido *"elimina la seccion Grafos JSON, de biblioteca"*): la sección entera (las 7 tarjetas visibles + el `<details>` de las 5 históricas) se quita de `biblioteca.html` -- vuelve a quedar solo "Grafos" y "Prompts". Desplegado y verificado con `curl -sL` (el catálogo de plantillas no necesitaba este catálogo aparte de datos de ejemplo; el descubrimiento automático real de §8.105 sigue resolviendo esa necesidad desde el propio Constructor de grafos, sin necesitar una lista aparte).

### 8.105 Constructor de grafos: descubrir el JSON real de una página propia, nunca interpretarla

Pedido: *"en Constructor de grafos, añade otro bloque: ingresar una url nuestra (ej. .../grafos) y devolvernos el JSON"*, luego, tras una pregunta de alcance (JSON directo vs. interpretar cualquier página con un modelo) que el operador no respondió directamente: *"por ahora si lee nuestros html ya va bien, ¿podemos hacer que en Constructor de grafos lo haga de forma automática?"* -- confirmado: extender la MISMA caja existente, nunca un bloque nuevo, y solo para páginas propias que ya cargan un JSON real (nunca interpretación libre con un modelo).

**Construido**: si la URL pegada no es un JSON válido directo, `descubrirJsonDePagina()` lee el HTML/JS real de esa página y prueba cada referencia real hasta encontrar la primera que cumple de verdad `validarFormaGrafo()` -- puramente mecánico, ninguna interpretación de contenido, ningún modelo implicado. Si ninguna referencia real encaja, se rechaza con aviso, igual que antes. Cuando el descubrimiento tiene éxito, la ficha de "proponer candidato" usa la URL de la PÁGINA real (no la del JSON crudo) como `--pagina`, y el estado muestra ambas URLs reales (la página y el JSON descubierto en ella) para que quede trazado de dónde salió el dato.

**Bug real encontrado al verificar (sin navegador, con `node` directo contra el VPS -- el operador había declinado la automatización del navegador en el turno anterior)**: la primera versión de la expresión regular capturaba CUALQUIER cadena entre comillas que terminara en `.json`, sin exigir que estuviera dentro de una llamada real a `fetch(...)`. Contra la propia URL de ejemplo del operador (`grafos.html`), esto capturaba el valor de ejemplo del input de la caja ("grafo_visor.json", un simple placeholder) como si `grafos.html` lo cargara de verdad -- daba un resultado válido, pero por la razón equivocada. Corregido exigiendo `fetch(['"\`]...\.json)` explícitamente. Segundo bug real, más sutil, encontrado al re-verificar: el propio comentario de código que documentaba el primer fix contenía literalmente `fetch('...json')` como ejemplo dentro de un comentario -- la regex ya corregida se capturaba A SÍ MISMA desde ese comentario. Corregido reescribiendo el comentario en prosa, sin sintaxis literal de `fetch(...)`. Re-verificado con `node` contra `vista_recursos.html` (descubre `grafo_recurso.json`, 16 nodos/11 aristas), `holon.html` (descubre `grafo_holon.json`) y `grafos.html` (ya no descubre nada válido -- correcto, esa página no tiene un grafo propio).

### 8.106 `vista_home.html` -- mapa real permanente filtrado a lo alcanzable desde home.html

Pedido: primero, confirmación de que ya existía una herramienta real que convierte nuestros propios `.html` en un grafo (sí -- `mapear_grafo_visor.mjs`, §8.83, muy anterior a esta sesión; distinto del descubrimiento de §8.105, que solo encuentra un JSON ya existente, nunca construye uno). Después: *"construye una vista que use mapear_grafo_visor.mjs igual"* -- aclarado con una pregunta (¿qué directorio real?) que el operador respondió *"solo los html vinculados a home"*.

**Investigado antes de construir**: `vista_sistema.html` ya calculaba en real (BFS sobre las aristas reales, nunca inventado) qué páginas son alcanzables desde `home.html`, y ya tenía un botón que las OCULTA (`alternarAtenuado()`) -- pero seguía mostrando las 57 entradas completas por defecto, con el filtro como acción manual. Se decidió no duplicar el extractor (`grafo_visor.json` ya tiene todo el dato real necesario) -- solo una vista nueva, siempre filtrada, sin botón.

**Construido** `vista_home.html`: mismo `grafo_visor.json`, mismo BFS real desde `home.html`, misma plantilla/física ya establecida -- pero el filtro se aplica SIEMPRE sobre el propio conjunto de nodos/aristas antes de renderizar (no solo se ocultan visualmente), y se extiende el criterio a endpoints/recursos/servidor: sobreviven si de verdad los toca una página o el servidor ya alcanzables, nunca por asunción. Enlazada desde `vista_sistema.html` ("Ver solo el mapa real desde home →"), para que la vista completa (con las páginas-herramienta) siga siendo la referencia principal y esta sea la complementaria, nunca al revés.

**Verificado con `node` directo contra el VPS** (sin navegador): de los 57 nodos reales de `grafo_visor.json`, 32 son alcanzables desde `home.html` (41 aristas), excluyendo correctamente las 11 páginas-herramienta de desarrollo (`holon.html`, `n8n.html`, `nodejs.html`, `vista_recursos/modulos/reglas.html`, `vista_sistema.html`, `anatomia.html`, `graph.html`, `boceto_layout_6_zonas.html`, `plantilla_grafo_espacio.html`) -- mismo cálculo que hace la propia página, confirmado desde fuera. `vista_home.html` responde 200 real y carga `grafo_visor.json` tal cual.

### 8.107 "Regenerar grafo_visor.json": explicado y luego construido, mismo patrón CLI+panel

Preguntado primero, en rol de asesor técnico: *"las funciones existen en mi máquina o lo tiene que ejecutar tú para crear los grafo_visor.json?"* -- respuesta real: `mapear_grafo_visor.mjs` es Node.js puro (solo módulos nativos + `ficha_grafo.mjs` local, cero dependencias que instalar), y cuando Claude lo "ejecuta" lo hace sobre la MISMA máquina del operador (la herramienta Bash de esta sesión no corre en un servidor remoto propio) -- el operador puede correr exactamente los mismos comandos él mismo, sin depender de Claude para nada especial.

Pedido después: *"prepara una nueva sección parecida a Constructor de grafos para invocar mapear_grafo_visor.mjs y poder generar yo los JSON a mano"*. Aclarado explícitamente en el propio texto de la sección: ninguna página web puede lanzar un proceso en la máquina del operador -- ni con permisos de red, ni de ningún otro modo (a diferencia del caso Ollama del §8.102, esto no es un problema de CORS/bind resoluble, es una limitación real e insalvable del sandbox del navegador). Mismo patrón ya elegido dos veces (worker local, `proponer_candidato.mjs`): CLI + panel, nunca un botón de "ejecutar" falso.

**Construida** la sección "Regenerar grafo_visor.json" en `grafos.html`: muestra en real cuándo se generó por última vez el `grafo_visor.json` ya publicado (fecha + contadores reales, leídos en vivo del propio fichero), y un botón "Copiar los 3 comandos" que copia el ciclo completo real (`cd tools/gobierno/graphify_visor` → `node mapear_grafo_visor.mjs` → `node desplegar_visor.mjs`) -- regenerar en local y publicar en el mismo paso, usando el `copiarConFallback()` ya construido en §8.105 para este mismo fichero. Desplegado y verificado con `curl`: la sección y los 3 comandos reales aparecen tal cual en el HTML servido.

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
