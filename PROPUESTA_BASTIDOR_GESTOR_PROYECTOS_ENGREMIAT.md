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

Sigue siendo una inversión de ingeniería real (una app React con SDK propio, figuras custom por cada tipo de entidad) — eso no cambia. Lo que sí cambia es la dependencia: al ser herramienta interna de diseño, no de producción, **no necesita esperar a que el triángulo del §6 esté cerrado en real** — su salida no toca el Sheet ni Baserow directamente, la usamos el usuario y yo para fijar contratos antes de que se implementen. Orden propuesto, revisado: (1) construir `espacio.schema.json`/`relacion.schema.json` con fixtures, como ya se hizo en B0 — eso es prerrequisito real, no el triángulo; (2) un prototipo mínimo del Bocetador con una sola figura (`FiguraEspacio`) contra ese esquema; (3) usarlo primero para el propio Núcleo — bocetar juntos `Arquitectura_Nucleo.canvas` de nuevo, esta vez con figuras validadas en vez de bloques de texto escritos a mano — antes de extenderlo a diseñar otras herramientas. Prioridad relativa: por debajo de lo que el usuario ha marcado como prioritario ahora (ver `PROPUESTA_ECOSISTEMA_CONECTADO_ENGREMIAT.md`), pero ya no bloqueado por ello — puede avanzar en paralelo si hay tiempo.

---

## 9. Pendiente

**Resuelto 2026-09-02:**
- ~~Producto/Proceso en el esquema de Misión~~ — decisión: sí entran como niveles propios ("siempre copiamos la verdad que vive en Sheets, nunca la simplificamos"). Añadido `jerarquia` (campanaId/proyectoId/productoId/procesoId/tareaId) a `mision.schema.json`, opcional para no romper los 5 fixtures de B0 ya verificados — re-verificado con `validar_b0.mjs`, 5/5 OK, sin regresión.
- ~~`STG_*` sin valor conceptual~~ — decisión: es la zona real de aterrizaje para carga masiva de datos de cliente. Diseño documentado en §6.5 (STG_* → paso de mapeo con IA controlada + Puerta Humana → `insertarRegistroTransaccional`, nunca escritura directa).
- ~~El Bocetador sin `espacio.schema.json`/`relacion.schema.json`~~ — construidos y verificados: `tools/gobierno/bocetador/` (schemas + 4 fixtures de Espacio + 3 de Relación + 1 fixture roto a propósito), `validar_bocetador.mjs` — gate real: 4/4 Espacios válidos, 3/3 Relaciones válidas con integridad referencial real (origenId/destinoId apuntan a nodos que existen), 1/1 fixture roto rechazado correctamente. Mismo criterio que B0.

**Sin resolver, con criterio ya fijado:**
- Leer filas de datos reales (no solo cabeceras) — el usuario aclara que serían datos simulados para ver comportamiento, no datos reales de cliente. Valoración: no bloqueante para la prioridad actual (ver `PROPUESTA_ECOSISTEMA_CONECTADO_ENGREMIAT.md`); sí sería útil antes de mapear `jerarquia` contra IDs reales de Producto/Proceso o antes de analizar `STG_*` columna a columna — hacerlo entonces, no antes.
- `37_ETIQUETA_IMPACTO` — decisión: queda fuera de Bastidor a propósito, será su propio módulo/proyecto/misión más adelante. No se vuelve a tocar aquí.
- Ninguna pestaña `STG_*` se ha analizado columna a columna todavía — ahora con un propósito claro (§6.5), sigue pendiente de hacerse.
