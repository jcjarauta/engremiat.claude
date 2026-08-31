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

## Cuadrilla v2: Concilio visible en un grupo de Telegram (2026-08-31, solo diseñada)

Propuesta del promotor durante el piloto Holon sobre Telar: en vez de
recibir solo la síntesis final de un ciclo de Concilio, poder ver a los
Acervos "hablar" entre ellos en tiempo real dentro de un grupo de
Telegram, y poder añadir la propia opinión en medio del debate antes de
que se cierre. **No es una idea nueva** -- es la primera vez que se
conecta con un mecanismo concreto de construcción para lo que ya
estaba descrito como "Cuadrilla v2" en `DICCIONARIO_ENGREMIAT.md:58-65`
(conversación cooperativa humano-Concilio vía grupo de Telegram, con
divulgación obligatoria de interacción con IA desde el primer mensaje,
Art. 50 del Reglamento de IA de la UE).

**Mecanismo propuesto**:

- Cada Acervo publica su propuesta como un mensaje propio en el grupo,
  no como bloque único al final -- etiquetado por nombre (`🔧 Acervo
  Técnico: ...`, `📜 Acervo Narrativo: ...`), la etiqueta identifica
  quién habla, no decora. `sendChatAction` (typing) entre mensajes da
  sensación real de debate en curso, en vez de un silencio opaco
  seguido de un bloque de texto.
- **Punto de entrada humano explícito, no interrupción libre en
  cualquier momento** -- reutiliza el mismo patrón de puerta ya probado
  en el wizard interactivo de Trama (confirmar/pedir ajuste): tras cada
  ronda de propuestas, el bot pausa y pregunta explícitamente si el
  coordinador quiere añadir su voz antes de la síntesis, con ventana de
  tiempo. La respuesta humana entra como una voz más, con el mismo peso
  que un Acervo IA, antes de que el Coordinador (ver más abajo) cierre
  con la síntesis.
- Encaja directamente con el "Facilitador" y "Coordinador" propuestos
  el mismo día como ampliación del Concilio base (enrutado por tema
  hacia el Acervo experto, tope de acervos invitados por ronda, cierre
  obligatorio en síntesis) -- ver sección siguiente para el piloto real
  de esos dos roles.

**Por qué vale la pena, con evidencia real de esta misma noche**: el
piloto Holon sobre Telar (ver más abajo) se quedó colgado 5 minutos
por pregunta con el worker local saturado, sin ninguna señal visible
más que sondear Baserow a ciegas. Con este mecanismo montado, esa
misma espera se habría visto en el grupo como "🔧 Acervo Técnico está
escribiendo..." colgado 5 minutos -- información útil en vez de
opacidad, sin cambiar nada del coste real en tokens (es forma de
presentación, no más llamadas a IA salvo que el humano decida
intervenir).

**Decisión explícita de no construir todavía**: el worker local está
saturado en el momento de este diseño (piloto Holon en curso, ver
abajo) -- construir una feature nueva de UI en vivo encima de un worker
que ya está fallando repite el mismo error que la deriva de "El vecino
del banco": apilar trabajo nuevo sobre una base que no ha demostrado
estar sana todavía. Queda documentada para construir cuando el worker
esté descansado y el piloto actual haya cerrado.

## Piloto real: Holon presupuestado sobre Telar (2026-08-31)

Primera prueba real de la propuesta de "Holon" (ciclo de investigación
con presupuesto fijo, artefactos verificables como evidencia -- no
autoinformes del propio sistema -- y alarmas con disparador definido de
antemano, no discrecionales). Piloto elegido: las 5 preguntas abiertas
de la "visión global" de Vigilia (ver
`diario-navegacion/2026-08-31-investigacion-telar/documento-base.md`),
pasadas por una versión ampliada de Concilio con enrutado por tema
(rama `Piloto-Holon-Telar-2026-08-31`, tabla 287, `ORDEN` 1000-1004,
rango elegido para no colisionar con lotes anteriores tras el bug de
contaminación cruzada ya documentado).

**Enrutado por tema (el "Facilitador" en la práctica -- una tabla
explícita, no una IA adivinando a quién invitar)**:

- H1 (co-creación vs. sugerencia algorítmica) -> Acervo Filosófico +
  Acervo Usuario.
- H2 (ramas narrativas abandonadas) -> Acervo Técnico + **Acervo
  Logístico** (nuevo).
- H3 (propósito colectivo entre familias) -> Acervo Narrativo + Acervo
  Filosófico.
- H4 (burocratización de `TAREA`) -> Acervo Técnico + Acervo Usuario.
- H5 (innovaciones de familias vs. Urdimbre fija) -> **Acervo
  Sociocracia** (nuevo) + Acervo Filosófico.

Dos Acervos nuevos creados para este piloto: **Acervo Logístico**
("ve el flujo real de trabajo -- quién hace qué, cuándo, con qué
recursos -- pregunta si una idea es sostenible con la gente y las
herramientas que de verdad hay") y **Acervo Sociocracia** ("juzga por
consentimiento, no por mayoría -- pregunta quién tiene una objeción
razonada, y si el proceso para decidir es legítimo, no solo si el
resultado es bueno"). El rol de **Coordinador** (síntesis + relanzar lo
sin resolver a la siguiente ronda) no se ha aplicado todavía a un nodo
propio -- por precaución, no se ha tocado el nodo compartido "Preparar
sintesis Concilio" (usado por todo el generador) solo para probar un
piloto; la síntesis honesta de este lote la hace Claude a mano, como
Relevo real.

**Bug real encontrado durante el piloto, no relacionado con el
diseño**: los primeros disparos manuales (espaciados 12s) provocaron
una condición de carrera real -- varias ejecuciones paralelas
recuperaban el mismo elemento "pendiente" antes de que la anterior
terminara de marcarlo `procesado`, gastando presupuesto de más en
repetir la misma pregunta en vez de avanzar. El dispatcher de Vigilia
no tiene bloqueo de concurrencia. Corregido operativamente disparando
uno a uno; **pendiente real: añadir un lock (ESTADO `procesando` antes
de empezar, como ya hace el modo interactivo de Trama) al dispatcher de
Vigilia para que esto no dependa de la disciplina de quien dispara**.

**Estado en el momento de escribir esto**: H1 procesado. H2-H5 en cola,
bloqueados por saturación real del worker local (`local-potente`,
timeout de 5 minutos en la llamada de propuesta de persona,
confirmado en las ejecuciones de n8n, no es un fallo de código nuevo).
Pendiente: cerrar el piloto cuando el worker esté libre, escribir la
síntesis honesta de las 5 respuestas y decidir junto al promotor si
Facilitador/Coordinador se construyen como roles reales de Concilio.

## Sistema de grafos operativo: propuesta de 4 capas (2026-08-31, solo diseñada)

Propuesta del promotor: encontrar los límites reales del sistema
(cuánto se puede producir, en cuánto tiempo, qué depende del humano y
qué se puede delegar) requiere poder ver -- y recorrer -- el histórico
real de decisiones, no solo documentos sueltos. Investigación real
antes de proponer (no adoptar herramientas nuevas por moda):

- **Capa 1 -- fuente de verdad**: Baserow ya es un grafo (`NODO_PADRE`,
  `RAMA`/`ORDEN`, relaciones de `TAREA`) -- no hace falta una base de
  datos de grafos nueva, sería peso muerto en el Pi.
- **Capa 2 -- visualización para humanos: Mermaid generado, no dibujado
  a mano.** Patrón real confirmado (n8n tiene nodos de comunidad y
  ejemplos documentados para esto). **Construida la primera prueba
  real** -- ver siguiente sección.
- **Capa 3 -- navegación en Obsidian: Bases**, no Dataview -- de fábrica
  en 2026, sin plugin de terceros que mantener.
- **Capa 4 -- recorrido para IA: generalizar Graphify**, no adoptar
  LangGraph ni un framework de agentes nuevo -- Graphify ya puntúa y
  selecciona contexto relevante para código, la misma lógica aplicada a
  las filas de Vigilia/Ramas/Relevos como grafo de decisiones.

El Concilio de supervisión/optimización que se planteó antes en la
noche depende de esto -- sin histórico real consultable, opinaría a
ciegas sobre su propio sistema.

## Primera prueba real de Capa 2: grafo Mermaid generado desde datos reales (2026-08-31)

Primer Mermaid generado a partir de la tabla `VIGILIA` (287) y
`GASTO_API` (285), no dibujado a mano -- publicado como sección nueva
en el Artifact "Holon de Engremiat". Representa los 22 elementos reales
de los 4 lotes de esta noche (Investigación Telar, Visión global,
Piloto Holon, Vigilia software), coloreados por el veredicto real del
Relevo hecho a mano sobre cada uno (sólida / contaminada / abstracta /
necesita corrección). Coste real total del día: **$0,054** (70 líneas
en `GASTO_API`).

**Límite honesto**: generado a mano esta vez (consulta puntual +
edición del HTML), no automatizado todavía -- la Capa 2 completa
necesitaría un workflow de n8n que regenere el bloque Mermaid solo,
cada vez que se cierra un Relevo. Queda como el siguiente paso concreto
si se decide construir esta pieza de verdad.

## Vigilia sobre plantillas de Capa 2: hallazgo real distinto a los anteriores (2026-08-31)

Lanzadas 5 preguntas (rama `Diseno-Capa2-Grafo-2026-08-31`, Acervo
Técnico/Lógico/Narrativo/Usuario/Logístico/Filosófico) sobre estilo,
tipo de dato, relevancia, disparo y escala a meses de la Capa 2. Relevo
honesto: **el problema esta vez no es contaminación de contexto ni
condición de carrera -- es invención de datos técnicos con lenguaje
seguro y concreto que no corresponde a nada real.**

- **G2 (mapeo de campos)** describe campos que **no existen** en
  Baserow: `id_elemento`, `veredicto`, `tipo_concilio`,
  `fecha_cierre_relevo`, `costo_estimado` en `VIGILIA`; relaciones
  `id_origen`/`id_destino`/`intensidad_relacion` en `TAREA`. Los
  campos reales de `VIGILIA` (tabla 287) son `NOMBRE`, `ORDEN`, `TEMA`,
  `ESTADO`, `RESULTADO`, `FECHA_PROCESADO`, `PERSONAS_JSON`, `ACCION`,
  `RAMA`, `RAMA_ELEGIDA` -- ninguno de los nombres que usa G2 coincide.
  Justo el Acervo Técnico, cuyo enfoque es "desconfiar de las ideas
  bonitas sin plan de construcción", es el que inventó el plan sin
  comprobar el esquema real.
- **G1** inventa una taxonomía de "Concilio Mayor / Menor / Abierto"
  que no existe en el vocabulario de Engremiat -- suena a jerga
  genérica de participación ciudadana, no a este proyecto.
- **G3** hereda los campos inventados de G2 y añade umbrales
  arbitrarios ("costo_estimado > 1000") sin unidad ni justificación.
- **G4** repite, sin resolverlo, el mismo punto ciego que ya se marcó
  en el Relevo de `BUG-CONCURRENCIA`: propone un "lock transaccional"
  sin confirmar si Baserow soporta de verdad una escritura condicional
  atómica.
- **G5** propone "bloqueo exclusivo Redis" -- **infraestructura nueva
  no pedida**, justo lo que ya se descartó al diseñar las 4 capas
  ("no hace falta una base de datos de grafos nueva, sería peso muerto
  en el Pi"). El mismo razonamiento aplica a Redis.

**Conclusión honesta, más importante que el resultado de estas 5
preguntas en sí**: cuando se le pide a Concilio detalle técnico
concreto (nombres de campo, umbrales, mecanismos de bloqueo) sin
inyectarle el esquema real de Baserow como contexto, **rellena los
huecos con lenguaje plausible en vez de admitir que no lo sabe**. No es
el mismo bug que la contaminación de `ORDEN` o la carrera del
dispatcher -- es el motivo exacto por el que hace falta un Relevo
humano/Claude antes de construir nada a partir de una Vigilia técnica:
un promotor no técnico no puede distinguir un campo real de uno
inventado, y aquí la respuesta sonaba igual de segura en ambos casos.
**Nada de G1-G5 se usa como especificación literal** -- sirve como
inspiración de dirección (símbolos redundantes al color, capas
semanal/trimestral, disparo tras el Relevo), no como plan técnico.
Antes de repetir este tipo de pregunta, habría que inyectar el esquema
real de las tablas en el contexto de la pregunta, no solo sus nombres.

## Vigilia software: revisión de las 2 propuestas de arreglo de mecanismo (2026-08-31)

Los dos bugs de mecanismo del piloto Holon (arrastre de contexto entre
preguntas independientes, condición de carrera en el dispatcher) se
lanzaron como Vigilia técnica (rama `Investigacion-BugsVigilia-2026-08-31`,
Acervo Técnico + Acervo Lógico). Relevo real de las dos propuestas --
ninguna de las dos está lista para aplicar tal cual.

**BUG-CONTEXTO (arrastre entre preguntas independientes)**: propone un
campo `TIPO_ENTRADA` (`trama`/`investigacion`) explícito -- correcto,
esa es la solución de fondo -- pero además propone **clasificarlo
automáticamente inspeccionando si `TEMA` contiene palabras clave
narrativas** ("capítulo", "historia", "personaje"). **Esto repite
exactamente el error que se busca corregir**: inferir en silencio en
vez de que el tipo sea una señal explícita al crear la fila. Si esa
heurística falla igual que falló la del `ORDEN`, tendremos el mismo bug
con otro nombre. **Corrección antes de implementar**: `TIPO_ENTRADA` lo
fija quien crea el lote (humano o script), nunca se infiere del
contenido.

**BUG-CONCURRENCIA (condición de carrera)**: el núcleo es correcto y es
justo el patrón que ya usa el modo interactivo de Trama (marcar
`procesando` antes de operar). Pero **no cierra la carrera de verdad**:
seguir siendo "recuperar fila, luego actualizar estado" dos pasos
separados dejan la misma ventana de carrera, solo más corta -- si la
API de Baserow no soporta una escritura condicional atómica ("solo
actualiza si sigue en pendiente, dime si no"), dos ejecuciones
simultáneas pueden seguir leyendo `pendiente` antes de que cualquiera
escriba. La propuesta no lo reconoce. El punto 5 (recuperar filas
`procesando` colgadas por timeout) sí es un acierto real, útil aparte
del resto.

**Conclusión honesta**: las dos propuestas dan un punto de partida
correcto en la dirección general, pero ninguna es segura de aplicar
sin corrección -- una reintroduce inferencia silenciosa donde hace
falta una señal explícita, la otra no demuestra que cierra la carrera
que dice cerrar. Mientras tanto, la mitigación real que ya funciona es
operativa, no de código: disparar Vigilia de una en una (cron cada 15
min, sin disparos manuales solapados).

## Propuesta: verificador determinista + Acervo Prompter + Graphify (2026-08-31, solo propuesta)

Nace de una pregunta real del promotor: ¿se pueden encadenar ciclos de
Vigilia de forma "exponencial" sin el riesgo de RSI/fabricación ya
detectado esta noche? Investigación real antes de proponer:

- **Verificación entre modelos de lenguaje no es fiable para esto,
  confirmado por la industria en 2026** -- sistemas multi-agente como
  MARCH usan varios roles (Solver/Proposer/Checker) precisamente
  porque un verificador basado en LLM cae en **sesgo de confirmación**
  ("atajos cognitivos") -- el mismo punto ciego que medimos con datos
  reales esta noche (revisor GPT: 9/12, fallando justo en las
  contaminaciones). "La verificación no es opcional en sistemas
  agénticos de producción -- es la línea entre una demo bonita y un
  producto fiable" (consenso 2026).
- **La respuesta real es un verificador determinista**, no otro LLM:
  comprueba afirmaciones concretas contra el estado real del sistema
  (¿existe este campo en Baserow? ¿existe este fichero?), no contra el
  juicio de otro modelo. Esto sí se puede encadenar entre rondas con
  seguridad -- lo fabricado se filtra antes de contaminar la siguiente
  generación, en vez de acumularse.
- **Acervo Prompter**: aplicaría *meta-prompting* (técnica real,
  documentada) -- convertir una necesidad en la estructura del
  razonamiento (pasos, restricciones), no en contenido específico.
  Mejora medida en la literatura: eficiencia de tokens y precisión de
  tarea. Sistematizaría lo que esta noche se hizo a mano (contexto
  real + pedir el porqué, no solo el qué).
- **Obsidian+LLM local como fuente de contexto del Prompter**: el
  vault ya tiene 46 documentos reales con embeddings locales (Smart
  Connections, sin construir sus plugins todavía) -- el Prompter
  consultaría ese contexto real antes de escribir un prompt nuevo, en
  vez de partir de cero. Es la Capa 4 (recorrido por IA) ya diseñada
  esta madrugada, aplicada a un uso concreto por fin.
- **Graphify infrautilizado**: ya hace selección determinista de
  contexto de código -- sería el motor real detrás del verificador
  determinista y del Prompter, no una pieza aparte. Hueco real
  detectado por el propio promotor, no construido todavía.

**Nada de esto se construye sin que se pida explícitamente** -- queda
como propuesta con investigación real detrás, no como intuición.

## Relevo: 5 preguntas sobre organización del vault de Obsidian (2026-08-31)

Lote real (rama `Organizacion-Vault-Obsidian-2026-08-31`, tabla
`VIGILIA_TAREA` id 287 en el Baserow del VPS), pensado explícitamente
como material en bruto para escribir mejores prompts de Vigilia, no
para aplicar. Relevo honesto:

- **OBS1, OBS2, OBS4: sólidas.** Ancladas en campos reales
  (`PROYECTO`, `RUTA`, `TEMA`, `HUECO_DETECTADO`, `SUPERADO_POR`),
  razonan el porqué de cada decisión (tal como se pidió), y OBS4 da un
  patrón concreto y accionable (`[CLIENTE]_[PROYECTO]`) para
  documentar un cliente nuevo desde cero.
- **OBS3: sólida pero con lógica inventada sin avisar.** Propone reglas
  de mapeo concretas (`ESTADO: revisar → _cuadrilla_concilio/`,
  `HUECO_DETECTADO no vacío → _oportunidad/`) que no vienen de ningún
  dato real que se le diera -- es diseño original del Acervo,
  presentado con el mismo tono que el resto de la respuesta, sin
  distinguir "esto lo propongo yo" de "esto se deriva de datos reales".
  No es fabricación grave (no inventa que algo *ya existe*), pero es
  el mismo patrón de fondo que hay que vigilar.
- **Contradicción real entre OBS1 y OBS3, no detectada por ninguna de
  las dos**: OBS1 concluye que las estaciones de la Rueda deben ser
  **metadato en el frontmatter**, nunca carpetas ("duplicar archivos
  rompería la trazabilidad"). OBS3 concluye lo contrario: las 7
  estaciones deben ser **directorios de primer nivel**
  (`_oportunidad/`, `_relevo/`...). Dos Acervos distintos, mismo lote,
  conclusiones estructuralmente incompatibles -- exactamente el tipo
  de conflicto real que el Relevo humano tiene que resolver antes de
  construir nada, y que ninguna de las dos respuestas por separado
  podía detectar.
- **OBS5: fallo real, sin resultado.** `ESTADO` quedó en `procesado`
  pero `RESULTADO` es `null` -- el pipeline terminó pero no generó
  contenido, sin diagnosticar la causa exacta esta noche. Pendiente:
  repetir la pregunta 5 (criterio para subdividir en subcarpetas) en
  el próximo ciclo.

**Conclusión honesta**: 3 sólidas, 1 sólida con matiz a vigilar
(lógica inventada sin distinguir), 1 contradicción real entre dos
respuestas del mismo lote, 1 fallo silencioso sin resultado. Material
real y honesto para escribir mejores prompts -- ninguna decisión de
estructura se aplica hasta que el promotor resuelva la contradicción
OBS1/OBS3 y se repita OBS5.

## Límites y honestidad

- Nada de esto está construido en el generador todavía -- es
  metodología y plantilla documentadas, la Urdimbre de la primera
  historia (ver `diario-navegacion/2026-08-31-vecino-del-banco/`) es el
  primer caso real, preparado a mano antes de automatizar nada.
- La cifra de "19 nodos" es una estimación de diseño, no una medición --
  el primer Relevo real dirá si es un tamaño cómodo o hay que ajustar.
