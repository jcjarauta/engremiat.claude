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

## Pendiente de concretar / preguntas abiertas

- ¿Quién y con qué cadencia revisa el propio funcionamiento de esta metodología (la "Retrospectiva" que queda fuera del alcance v1)?
- Formato exacto de la "Definición de Hecho" -- campo nuevo en el Sheet, o convención dentro de `OBSERVACIONES`/`ACCION_CORRECTORA`, sin decidir todavía.
- Cuándo y cómo se dispara la generación del business plan/memoria de subvención a partir de los Canvas acumulados -- no diseñado aún.

## Bitácora

- **2026-08-23**: apertura del documento, separado deliberadamente de INC-0056 para no mezclar "cómo trabajamos" con "qué construimos". Primer uso previsto: rellenar el BMC completo de INC-0056.
