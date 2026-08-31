# Telar

El constructor de historias de Engremiat. Cuatro ciclos de Vigilia,
cada uno responsable de una etapa distinta -- el mismo pipeline que ya
usa la industria (guion, novela, videojuegos), llegado por intuición
propia antes de investigarlo: Story Bible -> Beat Sheet -> Draft ->
Pase editorial. En español, y coherente con el vocabulario gremial ya
existente (Concilio delibera, Vigilia vela, Acervo almacena, Taller
construye, Feria muestra), los cuatro ciclos se llaman por su lugar en
el tejido -- "trama" significa a la vez tejido y argumento en español,
no es una coincidencia forzada.

## Los cuatro ciclos

1. **Urdimbre** -- los hilos base tensados antes de tejer nada:
   arquitectura, personajes, escenario, tono, complicaciones centrales.
   Un único nodo fijo, no se ramifica. Preguntas sistemáticas (ver
   abajo) respondidas una vez.
2. **Trama** -- el tejido propiamente dicho, sobre la urdimbre ya
   fijada. Aquí es donde nacen las ramas -- distintas Tramas posibles
   sobre la misma Urdimbre, coherente con el modelo "elige, no
   fusiones" ya establecido para Ramas.
3. **Hilo conductor** -- cada Trama se desarrolla capítulo a capítulo
   (esqueleto: Story Circle de Dan Harmon, 8 pasos -- Tú, Necesidad, Ir,
   Buscar, Encontrar, Tomar, Volver, Cambiado) hasta completarse.
4. **Parte de Vigilia / Relevo** -- el tejido terminado se revisa antes
   de publicarse. El promotor y Claude confirman y deciden si se
   continúa la misma historia o se inicia una nueva.

## Relevo ligero tras la Urdimbre -- no negociable en temas sensibles

Cuando el tema toca una población real y vulnerable (como la primera
historia de este Telar), no es prudente dejar correr Trama e Hilo
conductor en autopiloto durante tres ciclos enteros antes de la primera
revisión humana. Se añade un **Relevo ligero al final del Ciclo 1**,
solo para confirmar las preguntas sistemáticas -- antes de invertir el
resto del trabajo. Para temas de menor sensibilidad, el Ciclo 1 puede
correr con más autonomía, alimentado por Oportunidad.

## Preguntas sistemáticas de Urdimbre (plantilla reutilizable)

Para cualquier historia futura, no solo esta:

1. **Punto de vista** -- ¿quién es la lente narrativa? Protagonista
   directo vs. testigo/acompañante -- decisión con implicaciones éticas
   reales cuando el tema toca vulnerabilidad.
2. **Quiere (externo) vs. Necesita (interno)** -- distinción de Harmon,
   casi nunca son lo mismo.
3. **Tono y sensibilidad** -- ¿toca una población real vulnerable?
   ¿requiere el Relevo ligero extra?
4. **Filosofía del final** -- ¿encaja un final resuelto/mágico, o exige
   honestidad con datos reales del contexto?
5. **Enlace a un recurso real** -- ¿esta historia puede llegar a
   jugadores reales vía Feria? Si sí, ¿apunta a algo real al terminar
   (coherente con Pregonero/Oportunidad)?
6. **Escenario** -- dónde, cuándo, reglas del mundo.
7. **Complicaciones centrales** -- el conflicto motor de la historia.

## Arquitectura estimada del primer ciclo completo

No un salto ciego a la escala de un libro "Elige tu propia aventura"
clásico (*The Cave of Time*, 1979: 39 decisiones, 40 finales, casi sin
fusión de ramas -- la referencia histórica real, pero muy por encima de
lo calibrado hasta ahora). Primer ciclo real, calibrado sobre lo ya
probado (3 decisiones cómodas, 8 el siguiente paso razonable):

- 1 Urdimbre (fija) -> 2 Tramas -> 8 capítulos por trama (Story Circle,
  1 hito cada uno) = **19 nodos en total**.
- El siguiente ciclo decide, con el coste real de revisar esto, si se
  añade una tercera trama o más hitos por capítulo -- no antes.

## Valor añadido de la metodología (estimación como asesor estratégico)

- **Coste marginal decreciente por Trama adicional**: una vez escrita la
  Urdimbre (personajes, mundo, tono), cada Trama nueva sobre la misma
  base cuesta una fracción de escribir una historia desde cero -- el
  mismo principio económico que ya bajó el coste de Canvas+DAFO a
  céntimos.
- **Reutilizable más allá de Feria**: la investigación confirma que el
  mismo patrón (bible -> beats -> hilo -> revisión) es el que usan los
  diseñadores de escape rooms reales, mapeando beats a dependencias de
  puzzles. El Telar no es solo para cuentos -- es la semilla de
  escape rooms y experiencias interactivas personalizadas, sin cambiar
  el esqueleto, solo el tipo de hito.
- **Activo de propiedad intelectual real**: una Urdimbre bien construida
  (personajes, mundo) es un activo reutilizable de Engremiat, no
  contenido de un solo uso -- coherente con lo que Acervo ya pretendía
  ser desde el principio de la sesión.

## Arquitectura núcleo + capas (2026-08-31)

Las 7 preguntas de Urdimbre no son específicas de narrativa -- son
domain-agnostic con vocabulario disfrazado de historia. Tabla de
equivalencia atómica:

| # | Pregunta atómica | Historia | Software/Negocio | Proyecto comunitario |
|---|---|---|---|---|
| 1 | ¿Desde qué perspectiva? | Punto de vista narrativo | Usuario final vs. operador | Quién convoca, quién decide |
| 2 | ¿Qué se pide vs. qué hace falta de verdad? | Quiere vs. necesita (Harmon) | Petición del cliente vs. problema real | Demanda explícita vs. necesidad real de gobernanza |
| 3 | ¿Es sensible? | Población vulnerable, tono | Dato sensible, RGPD | Consentimiento, poder real en el grupo |
| 4 | ¿Qué define el cierre? | Filosofía del final | Definición de éxito/MVP | Qué cuenta como "acuerdo" real |
| 5 | ¿Enlaza a algo real? | Recurso real | Alianzas estratégicas | Red real de apoyo/financiación |
| 6 | ¿En qué contexto vive? | Escenario | Mercado/comunidad de clientes | Territorio o colectivo concreto |
| 7 | ¿Cuál es el conflicto central? | Complicaciones | DAFO / problema real | Tensión de poder o de recursos |

**Núcleo**: las 4 fases (Urdimbre → Trama → Hilo conductor → Parte de
Vigilia/Relevo) + Ramas + Diario de Navegación + personas de Acervo
intercambiables. Domain-agnostic, construido y validado dos veces.

**Capas**:
- **Historia** -- construida (Feria/Taller).
- **Software/Negocio** -- ya construida, sin saberlo: `generar_canvas_dafo`
  es esta capa con vocabulario de producto. No requiere reconstrucción,
  solo reconocimiento retroactivo.
- **Proyecto comunitario** -- diseñada, no construida. Construir solo
  cuando haya un cliente o proyecto cooperativo real que la necesite
  (ver sección siguiente -- puede que ese cliente real sea el propio
  Engremiat).

## Trama interactiva, capítulo a capítulo (2026-08-31)

Hallazgo real tras el primer Ciclo 3 completo ("El vecino del banco"):
generar 8 capítulos encadenados sin ningún punto de control intermedio
deja que el modelo se desvíe del tono acordado sin que nadie lo note
hasta el final -- en la práctica, apareció una imagen fuera de lugar,
una ruptura de continuidad, y un final que incumplía la regla de "sin
magia" pactada en la Urdimbre (ver
`diario-navegacion/2026-08-31-vecino-del-banco/hilo-conductor.md`).

**Corrección de diseño, no solo parche**: en vez de generar la Trama
completa en lote, un bot (extensión de `/telar`, reutilizando Cuadrilla
v2) presenta 2-3 direcciones posibles en cada capítulo y un humano
elige en vivo -- el punto de control deja de ser "al final", pasa a ser
"en cada paso", por construcción. El propio menú de opciones puede
recordar el tono de la Urdimbre en cada elección, actuando como barrera
contra la deriva.

Consecuencia estratégica: la misma herramienta que un co-creador usa
para *construir* una historia es, arquitectónicamente, la misma que un
jugador usaría para *vivir* una historia ya construida -- un "modo
autor" y un "modo jugador" sobre un único motor, no dos productos
distintos. Coherente con el origen real de "Elige tu propia aventura"
(Edward Packard la inventó contándola en vivo a sus hijas, el libro
vino después como formalización).

**Construido y probado en vivo el 2026-08-31.** Workflow "Telar
Interactivo" (generador, id `4VSsZ98zNPZ5tGnN`), bot dedicado
`@EngremiatTelar_bot` -- separado de Feria/Taller, cero riesgo para
producción. Como el generador está deliberadamente aislado (sin acceso
ni desde la LAN), no puede recibir webhooks de Telegram -- se implementó
por **sondeo** (`getUpdates`, cada 15 segundos) en vez de webhook,
manteniendo el aislamiento intacto. Tabla `TELAR_SESION` (id 290) guarda
el estado (capítulo actual, historial acumulado, opciones pendientes).

Primera prueba real: capítulo 1 de "El vecino del banco" generado tras
elegir una opción -- texto concreto, digno, sin desviarse del tono ni
del escenario (a diferencia del lote generado la noche anterior), coste
$0,000508. Avanzó correctamente al capítulo 2 con nuevas opciones
basadas en el capítulo 1 real como contexto.

## Telar-Taller y Telar-Feria: separar quién prepara de quién juega (2026-08-31)

Hallazgo tras la primera prueba real de flujo completo: mezclar en un
solo bot la preparación de un reto (coordinador/tutor, ve todo el
proceso) y su desarrollo (participante, solo debería ver el reto ya
aprobado) confunde la experiencia. **No hace falta inventar dos bots
desde cero -- es el mismo patrón que ya existe entre Taller y Feria**,
aplicado aquí:

- **Telar-Taller** (coordinador/tutor) -- el bot ya construido
  (`@EngremiatTelar_bot`). Prepara retos: elige capa, reto temático,
  registro de lenguaje, revisa el desarrollo completo antes de que
  nadie más lo vea. Es, literalmente, la misma función que ya cumple
  Taller para las misiones de Feria.
- **Telar-Feria** (participante) -- todavía no construido. Solo vería
  retos ya marcados `aprobado`, sin menú de configuración, con el
  lenguaje ya ajustado al registro elegido por el coordinador.

### Progresión de estado de un reto en `TELAR_BIBLIOTECA`

`pendiente` (coordinador preparando) → `aprobado` (listo para
participantes) → `en_uso` → `completado`.

### Registro de lenguaje -- estándar real, no inventado

Adoptado **Lectura Fácil / Plain Language** (marco europeo de
accesibilidad cognitiva, el mismo universo que TEACCH) como los 3
niveles reales, en vez de "más simple para niños" ad hoc: **Lectura
Fácil** (infantil/necesidades cognitivas), **Estándar**, **Elaborado**
(gobernanza/filosófico). Campo `REGISTRO` en `TELAR_BIBLIOTECA`,
elegido por el coordinador al preparar el reto.

### Capa Proyecto comunitario -- patrón Polis, no la plataforma entera

Para casos como *"coordinador de comunidad quiere tomar el pulso antes
de lanzar una propuesta de trabajo colaborativo con sociocracia"*: se
adopta el **patrón** de Polis (compdemocracy.org) -- afirmaciones cortas
+ de acuerdo/en desacuerdo/paso, usado en gobernanza real (vTaiwan) como
capa de "sensemaking" previa a una propuesta formal -- como un tipo de
hito más dentro de la capa comunitaria de Telar, generado por
Concilio/Vigilia y aprobado por el coordinador. No se adopta Polis
como plataforma completa (tiene su propio motor de clustering) --
demasiado grande para lo que hace falta hoy.

### Límites y honestidad de esta pieza

- Telar-Feria no se construye todavía -- no hay ningún participante real
  esperando probarlo, y construirlo sin eso sería especular sobre una
  UX que nadie ha validado.
- El hito tipo Polis para la capa comunitaria es diseño, no código.
- Accesibilidad avanzada (texto a voz, presentaciones, avatares)
  queda explícitamente para después de consolidar esta base -- decisión
  del propio promotor, no una limitación técnica.

## Patrón base, más amplio que Telar (2026-08-31)

El bucle conversacional que hace funcionar a Telar (saludar → informar
+ preguntar → responder → repetir hasta objetivo) no es específico de
historias -- es la plantilla base de cualquier bot de Engremiat.
Documentado aquí tal cual, como referencia técnica, sin forzar un
nombre gremial nuevo -- no todo necesita vocabulario propio.

**Los 4 movimientos**: (1) saludar -- honesto, con aviso de interacción
con IA (Art. 50 UE); (2) informar brevemente + preguntar (dos mensajes
cortos, no uno largo -- ver hallazgo de bienvenida concisa); (3)
responder -- la entrada del usuario, libre o por botón; (4) repetir
hasta que el objetivo se cumpla, no un número fijo de turnos.

**Dónde ya encajaría, sin construir nada nuevo todavía**:
- **Cuadrilla v2** (Concilio conversacional, diseñado, no construido) --
  mismo bucle exacto.
- **Taller** (ya construido, lógica propia) -- podría reescribirse sobre
  esta máquina de estados genérica, sin urgencia de tocar algo que
  funciona.
- Cualquier interacción futura de **Oportunidad** con un coordinador.

## Cierre dinámico del bucle: por objetivo conseguido, no por contador (2026-08-31)

El esqueleto de 8 pasos del Story Circle es una **guía de referencia**,
no un contador rígido -- tratarlo como fijo es arbitrario, no viene de
ningún principio real. Un reto sencillo puede resolver su arco en 4
pasos; uno complejo (una propuesta de gobernanza) puede necesitar más.

**Mecanismo propuesto**: cada capítulo devuelve, junto al texto, un
juicio explícito -- ¿esta historia ha llegado a su cierre natural, o
necesita más desarrollo? -- en la misma llamada que ya escribe el
capítulo (un campo más en el JSON, sin coste extra real), en vez de que
el sistema cuente ciegamente hasta 8.

**Límites de seguridad, dinámico no significa sin control**: mínimo de
pasos (p. ej. 3, evita cierres triviales) y máximo (p. ej. 12, evita que
un reto complejo se alargue sin fin y dispare coste sin control -- el
mismo principio de tope de presupuesto, aplicado ahora también a la
duración). El indicador de progreso debería dejar de fingir un total
fijo (`[Capítulo N]`, no `[Capítulo N/8]`) -- honesto sobre que la
duración real no se conoce hasta que la historia decide que ha
terminado.

**No construido esta madrugada** -- diseño confirmado, primer trabajo
real de la próxima sesión junto con la migración de capítulos a `TAREA`
(ver `RUEDA_DEL_GREMIO.md`).

## Principio guía: contexto real, no solo continuidad narrativa (2026-08-31)

Distinción explícita entre dos capas: **bloquear la sesión** (fiabilidad,
evita bugs como dobles clics) no es lo mismo que **acompañar de verdad**
(lo que diferencia un bot con base IA de uno programado). Continuidad
de contenido (`HISTORIAL` como contexto) ya existe -- falta continuidad
de la persona. Principio transversal, a aplicar en cualquier pieza nueva
de Telar o Cuadrilla, no una tarea puntual:

- **Registro adaptativo, no fijo** -- detectar el nivel de complejidad de
  las propias respuestas del usuario, no preguntarlo de antemano.
- **Memoria entre sesiones** -- reconocer a un coordinador que vuelve,
  no tratarlo como si fuera la primera vez siempre.
- **Reconocimiento dosificado** (ya diseñado para el wizard) -- aplicarlo
  de forma consistente en todo el recorrido, no solo al principio.

## Investigación acotada sobre el propio Telar (2026-08-31)

Primer uso real de Vigilia como motor de **investigación**, no de
decisión automática -- mismo patrón que `generar_canvas_dafo` (análisis
estructurado que un humano revisa después, no cambios automáticos al
bot en producción). Equipo de Concilio ampliado a 5 personas: Técnico,
Filosófico, Lógico, Narrativo, Usuario/Cotidiano -- cada una con fricción
real con las demás, no cosmética.

**Lote sembrado**: 12 elementos (`Investigacion-Telar-2026-08-31`, ids
42-53), 6 preguntas concretas × 2 pasos (propuesta + profundización) --
migración a `TAREA`, cierre dinámico del bucle, árbol de navegación en
Telegram, registro adaptativo, memoria entre sesiones, y diseño de la
Consola de Relevo. Presupuesto asignado: €2 -- coste medido de sobra
dentro de margen (~$0,0007/llamada).

**Resultado esperado**: un documento base que el promotor y Claude
revisan juntos (Relevo real) para afinar la propuesta final de cada
pieza -- no una decisión automática de cómo debe ser Telar.

## Nivel de revisión automático con GPT (2026-08-31)

Construido `revisar_relevo` (generador) -- usa GPT-5.6 Luna (OpenAI,
familia distinta a DeepSeek/local) para juzgar cada resultado de una
rama de Vigilia como sólido/contaminado/abstracto. Bug real encontrado
y corregido: un Code node en modo "una vez para todos los items" solo
procesaba 1 de 12 -- corregido a "una vez por item".

**Prueba real sobre la investigación de Telar ya conocida**: 9 de 12
aciertos frente a la revisión manual. **Se le escaparon 2 de las 3
contaminaciones reales** -- funciona como primer filtro barato
(~$0,00015/revisión), no sustituye la revisión humana para el tipo de
error que más importa (contaminación de contexto). Detalle completo en
`diario-navegacion/2026-08-31-investigacion-telar/documento-base.md`.

## Retomar o empezar nueva (2026-08-31)

Gap real encontrado: sin esto, cualquier mensaje mientras hay una
historia a medias se interpretaba automáticamente como respuesta a la
pregunta pendiente -- no había forma de preguntar "¿dónde estaba?" ni de
elegir empezar otra sin perder la actual sin querer.

**Construido**: `/telar` enviado explícitamente mientras hay una
historia en curso (en cualquier estado del wizard o de la Trama) ofrece
elegir -- *"Continuar donde lo dejé"* o *"Empezar una nueva"*. Continuar
reenvía la pregunta u opciones pendientes tal como estaban. Empezar
nueva **archiva primero** la historia en curso en `TELAR_BIBLIOTECA`
(`ESTADO: pausada`, con su Urdimbre/progreso tal cual) antes de
reiniciar la sesión -- no se pierde, aunque hoy solo exista una fila de
sesión activa a la vez (limitación real, ver abajo).

### Límite honesto

Sigue siendo **una sola sesión activa por bot** (`TELAR_SESION`, fila
única) -- "empezar nueva" no permite tener dos historias corriendo en
paralelo, solo pausar una y archivarla antes de sustituirla. Soporte
real multi-sesión (varias historias activas a la vez, o varios
participantes) sigue pendiente de diseño -- no confundir esta pieza con
eso.

## Ciclo 1 en vivo: wizard de 3 preguntas, sin opciones prediseñadas (2026-08-31)

Corrección real tras la primera prueba: el menú de "reto" (rutinas/
organización/social/emocional) y la biblioteca pre-sembrada hacían que
Ciclo 1 se sintiera como "elegir de una lista", no como construir algo.
Investigación aplicada:

- **"Struggle Premium"** -- el valor percibido de contenido con ayuda de
  IA depende más de que se *vea* el proceso de construcción que del
  resultado pulido. Ciclo 1 tenía que dejar de ser invisible.
- **Reconocimiento en formularios conversacionales** -- cada respuesta
  se usa para formular la siguiente pregunta (no un guion fijo), con
  reconocimiento dosificado, no en cada turno (el propio hallazgo
  advierte que forzarlo demasiado cansa en vez de construir).
- **Creación de personaje en juegos** -- pocas decisiones de alto
  impacto primero, mostrar algo concreto pronto (el "boceto") antes de
  cualquier detalle fino.

### Diseño construido

Tres preguntas libres, encadenadas, sin botones prediseñados:
1. *"¿Quién la vive? ¿Desde qué perspectiva la contamos?"* (punto de vista)
2. *"¿Qué quiere a simple vista? ¿Qué necesita de verdad?"* (quiere/necesita)
3. *"¿Cuál es el conflicto central?"* (complicación)

Tras la tercera respuesta, DeepSeek estructura las tres respuestas en
una Urdimbre coherente (mismo patrón que Canvas+DAFO: estructura datos
reales, no inventa desde cero), se muestra como **boceto visible** al
coordinador, y el Ciclo 3 (Trama interactiva, ya construido) arranca
directamente sobre esa Urdimbre recién construida.

### El etiquetado para reutilizar viene después, no antes

Decisión explícita del promotor: no hacen falta categorías de "reto"
prediseñadas todavía -- el contexto real de las historias que se vayan
construyendo dará las etiquetas para Acervo, a posteriori, sobre
contenido real. `TELAR_BIBLIOTECA` deja de ser una cola de la que tirar
al empezar -- pasa a ser un archivo donde guardar y etiquetar historias
ya terminadas, para reutilizar más adelante.

### Límites y honestidad de esta pieza

- No probado todavía de extremo a extremo con el wizard nuevo -- la
  reconstrucción anterior sí se probó, esta versión está desplegada
  pero pendiente de la primera prueba real.
- El "boceto" se muestra una vez, sin posibilidad de pedir un ajuste
  antes de empezar a jugar -- si el coordinador no está conforme, hoy
  tiene que reiniciar la sesión entera, no hay un paso de "corregir".
- La construcción de la Urdimbre ahora cuesta una llamada real a
  DeepSeek (antes las opciones ya usaban el worker local, gratis) --
  coste extra pequeño pero real.

## Límites y honestidad

- Nada de esto está construido en el generador todavía -- es
  metodología y plantilla documentadas, la Urdimbre de la primera
  historia (ver `diario-navegacion/2026-08-31-vecino-del-banco/`) es el
  primer caso real, preparado a mano antes de automatizar nada.
- La cifra de "19 nodos" es una estimación de diseño, no una medición --
  el primer Relevo real dirá si es un tamaño cómodo o hay que ajustar.
