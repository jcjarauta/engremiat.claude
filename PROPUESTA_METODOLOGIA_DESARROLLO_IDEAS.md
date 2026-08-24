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

### 3.bis. Todo elemento nuevo del ecosistema nace registrado (2026-08-23)

Añadido tras encontrar 4 desincronizaciones reales el mismo día (Consola↔Sheet,
rama vs main, prompt desactualizado, trigger desactivado sin avisar -- ver
`SALUD_ECOSISTEMA.md`). Regla: **crear un prompt operativo, un trigger
programado, o un script de sincronización nuevo no está "Hecho" hasta que
también se añade a `tools/registro_ecosistema.json`**, en el mismo
commit/sesión, no después. El ritual de salud (`tools/salud_ecosistema.mjs`)
lee ese registro sin nombres fijos -- si algo no está ahí, no se vigila, y
puede desincronizarse sin que nadie se entere.

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

**Cierre de esta ronda de pruebas**: no se abren más spikes de este tipo por ahora -- la regla se considera suficientemente validada (5 pruebas convergentes) para fijarse como parte de la metodología v1. Próxima validación real: aplicarla a un proyecto de desarrollo concreto (ver ejemplo de escape rooms en la conversación del 2026-08-23, que encaja con INC-0055), no a más pruebas sintéticas.

**Matiz añadido tras el ejemplo de escape rooms**: una tarea "abierta" a menudo lo es solo hasta que alguien invierte trabajo en acotarla -- ej. "redactar un guion" es abierto, "redactar un guion de 150-200 palabras siguiendo esta plantilla de tono/estructura" ya es acotado y delegable. Parte real del trabajo de Claude/humano en un proyecto no es solo resolver las tareas difíciles, es **convertir tareas abiertas en tareas acotadas** (especificar la Definición de Hecho con precisión suficiente) para que después sí puedan delegarse de verdad. Es el puente concreto entre "diseñar" (esta conversación) y "automatizar" (Ejecutor y otros agentes).

## El carril "A valorar" nunca lo trabaja un worker autónomo (fijado 2026-08-23)

Precisión importante sobre la regla de delegación, para no confundir dos
cosas parecidas: lo único automatizable alrededor del carril "A valorar"
es la mecánica de fuera -- clasificar en qué carril entra una idea nueva
(tarea acotada, ya validada con DeepSeek en el spike 1), o avisar de que
hay algo esperando. **El contenido del carril en sí -- diseñar, decidir
arquitectura, definir funciones nuevas -- es trabajo genuino que necesita
al operador interactuando, siempre, sin excepción.** Ningún worker
autónomo entra ahí a avanzar la idea por su cuenta, ni siquiera de forma
parcial. El resto de piezas del ecosistema (Ejecutor, futuros triajes,
sincronización) sí se preparan para trabajo autónomo -- esta es la única
excepción explícita, y es la más importante de todas.

## Spike 6: 4 variantes reales de auditoría (fichero completo/Graphify × solo/pipeline)

**Pregunta**: ¿alguna combinación de DeepSeek/local/Graphify encuentra el bug real y ya conocido de INC-0052 (falta `filtrarPorNivelDato_` en `ReportService.js`), y cuál sale más barata?
**Cómo se mide**: 4 variantes ciegas (no se les dice el bug) contra el código real de `ReportService.js`, con el criterio real de `CICLO_AUDITORIA_ENGREMIAT.md` Fase 1 -- DeepSeek solo (fichero completo / Graphify) y Local→DeepSeek-revisor (fichero completo / Graphify).
**Resultado**: ⚠️ **Ninguna de las 4 encontró el bug real que ya sabíamos que estaba ahí.** No valida delegar la auditoría completa de Ejecutor a DeepSeek.

Hallazgos positivos reales, aunque no resuelvan la pregunta principal:
- **Graphify redujo el coste ~3x** (22.463 vs 66.145 tokens) sin perder especificidad -- y tiró de ficheros relacionados reales a través de las llamadas, no solo del fichero pedido.
- **El patrón de revisión (local borrador → DeepSeek revisor) actuó como filtro de calidad real**: rechazó correctamente 4/4 hallazgos vagos de un borrador, y en el otro caso aceptó solo lo verificable con una salvedad explícita ("si no puedes confirmar que el símbolo no existe, retíralo") -- más honesto sobre su propia incertidumbre que en los spikes 2/3/5 de esta mañana, posiblemente porque aquí tenía un criterio de aprobado/rechazado explícito, no una pregunta abierta.

**Conclusión de arquitectura**: la auditoría real de Ejecutor se queda con Claude -- este spike no encontró una forma válida de sustituirlo ahí. Lo que sí se adopta ya: usar Graphify para acotar contexto de código (ahorro de coste real, sin coste de calidad) y el patrón de revisión con criterio explícito para cualquier tarea donde SÍ se delegue a un modelo barato.

## Spikes 7 y 8: "turno de noche" del worker local (bitácora y código muerto)

**Spike 7 -- borrador de bitácora, con grafo vs sin grafo**: material real (commit `fe84c0f`, ciclo de Ejecutor 2026-08-21). Los dos borradores fueron correctos y usables. Graphify NO aportó ventaja de coste ni calidad aquí (subió tokens en vez de bajarlos, porque se añadió sobre el diff en vez de sustituir un fichero grande) -- confirma que Graphify sirve para "qué hace este código", no para "qué cambió hoy". **Tarea 1 validada para delegar al worker local como borrador.**

**Spike 8 -- código muerto candidato, con grafo vs sin grafo**: objetivo real y conocido (`listarProyectos()`, INC-0053). Resultado grave, más serio que cualquier hallazgo anterior de hoy:
- **Sin grafo**: el worker **fabricó** tres hallazgos falsos (`crearProyecto`, `buscarCampanas`, `abrirBiblioteca`), citando *"grep -rn X src/ -- 0 resultados"* **sin haber ejecutado ningún grep** -- verificado después: `crearProyecto` sí tiene llamadas reales. No encontró el objetivo real.
- **Con grafo**: no fabricó nada, pero tampoco concluyó -- solo describió qué comandos habría que correr, sin ejecutarlos.

**Diferencia de gravedad con los hallazgos anteriores (spikes 2/3/5)**: ahí el modelo razonaba mal o no avisaba de sus suposiciones. Aquí **fabricó la propia prueba de verificación exigida como salvaguarda** (el formato de cita "grep confirmado") -- más peligroso, porque un revisor que confíe en el formato sin re-comprobarlo deja pasar una afirmación falsa disfrazada de verificada.

**Regla resultante, corrige el optimismo inicial de la propuesta de "turno de noche"**: la tarea 1 (bitácora) se mantiene delegable al worker local como borrador. **La tarea 2 (código muerto) se retira de la delegación al worker local**, incluso como borrador para revisar -- el riesgo no es equivocarse, es fingir haber comprobado algo que no comprobó.

## Spike 9: seis candidatas más para el "turno de noche", con material real

Probadas con material real de Engremiat (algunas con referencia real para
comparar). Resultado mixto -- corrige el criterio "autocontenido = seguro"
del spike 8, que no era suficiente por sí solo:

- ✅ **Validadas tal cual**: mensaje de aviso (Telegram/email), sugerir
  título corto, adaptar tono técnico a cliente, borrador de mensaje de
  commit desde un diff real (casi idéntico al mensaje real escrito por
  Claude).
- ⚠️ **Micro-canvas (6 campos), parcial**: el campo "Disparador/Problema"
  salió bien (extracción pura), pero "Propuesta" se disparó a proponer
  construir una API entera para emular una herramienta externa,
  **contradiciendo la conclusión real ya alcanzada** (que decía
  explícitamente no replicarla). Corrección: solo delegar el campo
  "Disparador/Problema"; "Propuesta" y "Decisión" exigen criterio de
  diseño real -- se quedan con Claude, mismo principio que ya protege el
  carril "A valorar" completo.
- ❌ **Extraer datos ya presentes en el texto, no adoptada**: pese a la
  instrucción explícita de no inventar nada fuera del texto, infirió
  Tipo="bug" y Prioridad="alta" cuando el dato real era Mejora/Baja.
  Corrige la idea de que "autocontenido" por sí solo garantiza
  seguridad -- hace falta además una instrucción mucho más estricta
  ("si no está explícito, responde 'no especificado'") y una nueva
  prueba antes de confiar en esta tarea.

## Pendiente de concretar / preguntas abiertas

- ¿Quién y con qué cadencia revisa el propio funcionamiento de esta metodología (la "Retrospectiva" que queda fuera del alcance v1)?
- Formato exacto de la "Definición de Hecho" -- campo nuevo en el Sheet, o convención dentro de `OBSERVACIONES`/`ACCION_CORRECTORA`, sin decidir todavía.
- Cuándo y cómo se dispara la generación del business plan/memoria de subvención a partir de los Canvas acumulados -- no diseñado aún.

## Bitácora

- **2026-08-23**: apertura del documento, separado deliberadamente de INC-0056 para no mezclar "cómo trabajamos" con "qué construimos". Primer uso previsto: rellenar el BMC completo de INC-0056.
