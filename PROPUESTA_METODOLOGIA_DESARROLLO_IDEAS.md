# Propuesta — Metodología de desarrollo de ideas "a valorar" (Canvas + Scrum ligero)

**Fecha de apertura:** 2026-08-23
**Estado:** A valorar -- diseño en curso, se construye a la vez que se aplica a INC-0056 como caso piloto
**Incidencia Sheet:** INC-0057 (`13_INCIDENCIAS`, A valorar)
**Google Doc vinculado:** (enlace añadido tras crear el Doc)
**Por qué existe este fichero:** separar "cómo trabajamos las ideas" de "qué estamos construyendo" -- vive aparte de `PROPUESTA_ECOSISTEMA_AGENTICO_HIBRIDO.md` (INC-0056) para que la metodología no quede enterrada dentro del primer proyecto al que se aplica, y sea reutilizable el día que se aplique a una tercera idea.

## Disparador

Durante el diseño de INC-0056 (ecosistema agéntico), la conversación derivó en cómo estructurar el propio proceso de llevar una idea "a valorar" desde que se abre hasta que se decide -- Business Model Canvas, Scrum, e incorporación futura de trabajadores humanos. El operador señaló, con razón, que mezclar "el proceso" con "el primer proyecto que lo usa" (INC-0056) diluye ambas cosas -- de ahí esta incidencia separada.

## Decisión de secuenciación

**No construir la metodología completa antes de aplicarla.** Se construye lo mínimo necesario y se pone a prueba en vivo contra INC-0056 (que ya tiene contenido real generado) -- evita el riesgo clásico de diseñar un proceso limpio en el papel pero impráctico, sin nadie presionándolo con un caso real.

## Alcance mínimo (v1) -- lo que SÍ se construye ahora

### 1. Criterio de entrada: micro-canvas vs. Business Model Canvas completo

Toda incidencia "a valorar" nueva se clasifica al abrirla:
- **Interna/técnica** (la mayoría) -> micro-canvas de 6 campos, sin alimentar ningún business plan.
- **Productizable** (candidata a venderse a un cliente o justificar una subvención) -> Business Model Canvas completo (9 bloques de Osterwalder).

**Micro-canvas (6 campos):**
1. Disparador/Problema
2. Propuesta (solución)
3. Impacto esperado
4. Esfuerzo/Riesgo/Incógnitas
5. Alternativas consideradas
6. Decisión/Responsable

**Business Model Canvas completo (9 bloques):** Segmentos de clientes, Propuesta de valor, Canales, Relación con clientes, Fuentes de ingresos, Recursos clave, Actividades clave, Socios clave, Estructura de costes.

### 2. El BMC como material reutilizable, no como documento final

El Canvas relleno de una idea productizable NO se reescribe a mano como business plan o memoria de subvención -- ese documento externo se **genera a partir de** los Canvas ya rellenos cuando haga falta presentarlo, igual que la Consola se genera a partir del Sheet. Evita mantener el mismo contenido dos veces.

### 3. "Definición de Hecho" por tarea del backlog

Cada tarea de `13_INCIDENCIAS` que pase a ejecución lleva una definición explícita de qué significa "terminado" -- no solo quién la hace. Esto hace que una tarea sea asignable indistintamente a un agente IA o a una persona (`RESPONSABLE_ID` ya soporta cualquier tipo de actor, no hace falta cambiar el esquema) sin fricción, y de paso es literalmente el encargo que se le pasaría a un freelance el día que se contrate.

### 4. Formato de "prueba"/spike, distinto de una tarea normal

Para experimentos acotados (ej. "¿DeepSeek V4 sirve para esta tarea concreta, sí o no, medido cómo?") -- una prueba no es un entregable, es una pregunta con fecha límite que se responde y se descarta o se adopta. Se documenta con: pregunta a responder, cómo se mide, fecha límite, resultado.

## Deliberadamente FUERA del alcance v1 (pendiente hasta tener experiencia real)

- **Ceremonias completas de Scrum** (Sprint Review/Retrospectiva con cadencia fija) -- los equivalentes ya informales (ciclos de Ejecutor, informe de cierre de jornada) siguen funcionando; formalizar cadencia y participantes se deja para después de un ciclo real de uso de esta metodología.
- **Proceso de incorporación de trabajadores humanos** (cómo se busca, contrata, paga) -- depende de tener casos reales de tareas con "Definición de Hecho" ya probadas; construirlo antes sería especular sin datos.

## Aplicación piloto: INC-0056

Primer uso real de esta metodología -- rellenar el Business Model Canvas completo de INC-0056 (ecosistema agéntico híbrido) con el contenido ya generado en la conversación del 2026-08-23 (propuesta de valor por niveles de cliente, socios = partner tecnológico, costes = API medida + hardware, segmentos = clientes por nivel de infraestructura). Cualquier fricción real al rellenarlo retroalimenta esta metodología antes de aplicarla a una tercera idea.

## Primer spike real: DeepSeek V4 Flash para triaje de incidencias

**Pregunta**: ¿DeepSeek V4 Flash clasifica y redacta con criterio suficiente una incidencia nueva (grupo de la Consola + sugerencia de una línea), a un coste sensiblemente menor que Claude?
**Cómo se mide**: llamada directa a la API de DeepSeek (sin `claude-code-router`, ver más abajo) con dos casos reales ya clasificados hoy a mano (INC-0052, INC-0053), comparando grupo elegido y calidad de la sugerencia contra el criterio ya aplicado.
**Fecha límite**: 2026-08-23 (mismo día, resuelto en la sesión).
**Resultado**: ✅ Adoptado para esta tarea. Los dos casos coincidieron exactamente con el grupo asignado manualmente (`ciclo` y `backlog`), con sugerencias de calidad comparable. Coste real: ~0,00025€ por clasificación (485-410 tokens de entrada, 222-236 de salida), frente a un coste estimado ~15-20x mayor con Claude Sonnet para la misma tarea. Tiempo de respuesta bajo 500ms.

**Hallazgo secundario (no la pregunta del spike, pero relevante)**: `claude-code-router` dio fricción de integración real -- el asistente de configuración terminó correctamente, pero al invocar Claude Code a través del perfil configurado, este rechazó el modelo (`unrecognized_model`) y pidió login, sin resolverse en el tiempo del spike. La pregunta de fondo (¿sirve DeepSeek para esto?) se resolvió igualmente con una llamada directa a la API, sin depender de esa integración. Pendiente: investigar la integración de `claude-code-router` como spike aparte, si en el futuro hace falta enrutar automáticamente desde el propio Claude Code en vez de con llamadas directas.

## Segundo spike: DeepSeek V4 Flash en revisión de código (tarea más compleja)

**Pregunta**: ¿DeepSeek encuentra, sin pista, un bug real y sutil de pérdida de datos en una revisión de código -- y dónde está su límite frente a Claude?
**Cómo se mide**: se le dio la primera versión (con bug) de `regenerar_estatico.mjs` -- exactamente el código que yo (Claude) revisé y corregí hoy antes de publicarlo -- con el mismo contexto de sistema que tenía yo, sin señalar dónde estaba el problema, y se comparó su respuesta contra el bug real ya conocido.
**Fecha límite**: 2026-08-23 (mismo día).
**Resultado**: ⚠️ Parcial -- acierto real + un falso positivo con el mismo tono de confianza.
- **Acertó** el bug real (estado reseteado a "pendiente", pierde decisiones ya publicadas) con precisión, identificando la línea exacta y el mecanismo.
- **Falló** afirmando (igual de seguro) que el script "no persiste la actualización de GRUPOS" -- incorrecto: no entendió que GRUPOS se edita a mano ANTES de ejecutar el script, y que por eso el fragmento no tocado del HTML ya lo conserva bien. Le faltó contexto del flujo completo y no lo señaló como incertidumbre.

**Conclusión para la arquitectura**: para tareas acotadas y bien delimitadas (spike #1: clasificación) es fiable sin supervisión. Para revisión de código dentro de un sistema más amplio, **necesita revisión humana/Claude antes de confiar en su veredicto** -- no por mal razonamiento, sino porque no distingue ni avisa cuándo le falta contexto. Coste de esta prueba: ~4.900 tokens, céntimos de dólar.

## Spike 4: comparación real Local (devstral-dev) vs DeepSeek vs Claude

**Pregunta**: para la misma tarea acotada del spike 1, ¿qué diferencia real de tiempo/coste hay entre el worker local, DeepSeek y Claude?
**Cómo se mide**: mismo caso (INC-0052), mismo prompt, ejecutado contra `devstral-dev` local (Ollama) -- medido con `prompt_eval_count`/`eval_count`/duraciones reales de Ollama --, comparado contra los datos ya medidos de DeepSeek (spike 1) y una estimación de Claude por precio público (no medida en vivo, no se pudo aislar dentro de esta conversación).
**Resultado**: los tres coincidieron en el criterio (`ciclo`). Local: gratis, pero ~34x más lento que DeepSeek (17s vs 0,5s) y ~3x más tokens de entrada para el mismo contenido (1607 vs 485 -- causa no investigada, pendiente). Confirma que acotar bien el formato de salida esperado permite que hasta un modelo barato/local acierte de forma fiable.
**Nota de honestidad**: la columna Claude es estimación por precio público sobre volumen de tokens comparable, no una llamada medida -- no confundir con dato duro.

## Regla de delegación de IA (fijada 2026-08-23, cierra la ronda de 5 spikes)

Conclusión consolidada de los spikes 1-5 (triaje, revisión de código, arquitectura, comparación de motores, pipeline local+DeepSeek). Convergen en el mismo patrón desde ángulos distintos: lo que decide si una tarea puede delegarse sin supervisión no es qué motor se usa, es si la tarea tiene un **resultado esperado acotado y verificable**.

> **Delegar sin supervisión SOLO cuando la tarea tenga un formato de salida verificable y acotado de antemano** (ej. clasificar entre opciones fijas, devolver un JSON con campos definidos). **Cualquier tarea que dependa de contexto no completamente dado** (código dentro de un sistema mayor, decisiones de arquitectura o de negocio) **pasa siempre por revisión de Claude o humana antes de actuar sobre el resultado -- sin importar qué motor la generó, ni cuántos pasos tenga el pipeline.**

Motivo: en tareas abiertas, los modelos baratos/locales probados razonan bien pero no distinguen lo que saben de lo que suponen, y no lo avisan -- ni siquiera cuando se les pide explícitamente no asumir (spikes 2 y 3). Encadenar dos modelos (spike 5) mejora algo la robustez pero no lo resuelve del todo, y no ahorra coste ni tiempo frente a un modelo solo.

Esta regla es directamente aplicable al criterio de entrada de esta metodología (micro-canvas/BMC, "Definición de Hecho" por tarea) -- es el mecanismo concreto para decidir, tarea a tarea del backlog, si es delegable a un worker barato o necesita quedarse con Claude/humano.

**Cierre de esta ronda de pruebas**: no se abren más spikes de este tipo por ahora -- la regla se considera suficientemente validada (5 pruebas convergentes) para fijarse como parte de la metodología v1. Próxima validación real: aplicarla a un proyecto de desarrollo concreto (ver ejemplo de escape rooms en la conversación del 2026-08-23), no a más pruebas sintéticas.

## Pendiente de concretar / preguntas abiertas

- ¿Quién y con qué cadencia revisa el propio funcionamiento de esta metodología (la "Retrospectiva" que queda fuera del alcance v1)?
- Formato exacto de la "Definición de Hecho" -- campo nuevo en el Sheet, o convención dentro de `OBSERVACIONES`/`ACCION_CORRECTORA`, sin decidir todavía.
- Cuándo y cómo se dispara la generación del business plan/memoria de subvención a partir de los Canvas acumulados -- no diseñado aún.

## Bitácora

- **2026-08-23**: apertura del documento, separado deliberadamente de INC-0056 para no mezclar "cómo trabajamos" con "qué construimos". Primer uso previsto: rellenar el BMC completo de INC-0056.
