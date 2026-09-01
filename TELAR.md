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

### Arreglo real del lock -- construido y probado con una carrera de verdad (2026-08-31)

El bug de concurrencia queda cerrado de verdad, no solo mitigado. Campo
nuevo `PROCESANDO_DESDE` (texto, en `VIGILIA_TAREA`) en vez de tocar el
`ESTADO` real (evita el bug conocido de editar opciones de
`single_select`). Nuevo nodo **`Bloquear elemento pendiente (lock)`**
entre `Buscar siguiente Vigilia pendiente` (ahora trae 20 candidatos,
no 1) y `¿Hay Vigilia pendiente?`: recorre los candidatos, elige el
primero sin bloqueo activo (o con bloqueo de más de 10 minutos --
recuperación automática si algo se cuelga), y marca
`PROCESANDO_DESDE` en el mismo paso antes de devolver el elemento.

**Probado con una condición de carrera real, no solo en teoría**: dos
disparos del webhook con 5 segundos de diferencia mientras el primer
elemento (`PEND1`) seguía bloqueado -- el segundo disparo cogió
`PEND2`, no repitió `PEND1`. Confirma que el lock funciona bajo carga
concurrente real.

**Decisión explícita sobre el intervalo del cron**: se deja en 15
minutos por ahora, a propósito -- "ser generosos con el tiempo hasta
tener datos reales de duración/coste del worker local". Acortarlo se
hará con datos reales del Relevo (tiempos y coste medidos), no a
ciegas, aunque el lock ya lo permite con seguridad.

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

## Verificador determinista -- primer prototipo, probado y validado (2026-08-31)

Primera pieza de la propuesta de ciclos exponenciales más seguros
(sección anterior), construida y probada contra un caso ya conocido
antes de confiar en ella.

**Mecanismo**: extrae del texto de una respuesta cualquier palabra con
forma `snake_case` (mayúsculas o minúsculas) y la compara contra el
esquema real completo de Baserow (137 campos, 17 tablas, capturado en
vivo vía API) -- no contra el juicio de otro modelo.

**Validación real**: probado contra `G2` (la respuesta de hace unas
horas que inventó campos de Baserow) -- **acierto total, sin falsos
negativos**: detectó como no verificados exactamente los 10 campos
inventados (`id_elemento`, `tipo_concilio`, `fecha_cierre_relevo`...),
y reconoció `GASTO_API` como tabla real (no como campo sospechoso).
Probado también contra `OBS1` (respuesta sólida) para comprobar que no
da falsos positivos con contenido real -- confirmado.

**Limitación real encontrada en la propia validación, no teórica**:
`TIPO_DOCUMENTO` aparece como "verificado" en la prueba contra OBS1,
pero pertenece a la tabla `DOCUMENTO`, no a `DOCUMENTO_ENGREMIAT`, de
la que hablaba esa respuesta -- el prototipo comprueba existencia **en
cualquier tabla**, no en la tabla concreta de la que se habla. Es una
coincidencia de nombre, no una confirmación real. **Pendiente antes de
confiar en él para el encadenado automático de ciclos**: acotar la
verificación a la tabla mencionada en el contexto de la pregunta, no
al esquema global.

**Estado**: prototipo de línea de comandos (`verificador_determinista.mjs`),
no integrado todavía en el flujo de Vigilia/Concilio -- ese cableado
es el siguiente paso, no hecho esta noche.

### Corrección real: acotado por tabla (2026-08-31)

Arreglada la limitación anterior -- el verificador ahora recibe la
tabla relevante como parámetro y distingue 3 categorías, no 2:
**verificado en la tabla** / **existe pero en otra tabla (sospechoso,
a revisar)** / **no existe en ningún sitio (fabricado)**. Reprobado
contra los mismos dos casos: `G2` sigue detectando las 10
fabricaciones al 100%, y `TIPO_DOCUMENTO` en `OBS1` ahora aparece
correctamente como "existe en `DOCUMENTO`, sospechoso" en vez de un
falso "verificado". Corrección real, validada contra los mismos casos
que descubrieron el fallo.

### Cableado real en el generador -- probado de extremo a extremo (2026-08-31)

El verificador ya no es solo un prototipo de línea de comandos --
está insertado de verdad en el flujo de n8n, entre la síntesis de
Concilio y el guardado en Baserow (`Llamar a Concilio (interno)` →
**`Verificar contra esquema real`** → `Guardar resultado en Vigilia`).
Dos campos nuevos en `VIGILIA_TAREA`: `TABLA_RELEVANTE` (si está vacío,
se salta la verificación -- no aplica a preguntas narrativas) y
`VERIFICACION_DETERMINISTA` (donde se guarda el veredicto).

**Bug real de la propia construcción, corregido antes de confiar en
ello**: la primera versión del nodo se guardó corrompida -- el shell
de bash interpretó `$('Construir tema con contexto')` y `\b` como
sintaxis propia y se comió los caracteres, dejando el código roto sin
avisar. Corregido escribiendo el código en un fichero aparte y
subiéndolo sin pasar por comillas de bash.

**Prueba real de extremo a extremo**: fila de prueba con una pregunta
que mezclaba campos reales de `VIGILIA_TAREA` con uno inventado
(`CAMPO_INVENTADO_PRUEBA`) a propósito. Resultado real del propio n8n
en producción: detectó `CAMPO_INVENTADO_PRUEBA` como fabricación y
`VERIFICACION_DETERMINISTA` como campo real verificado.

**Limitación nueva, encontrada solo en esta prueba en vivo, no antes**:
se le escaparon `NOMBRE` y `ESTADO` -- el patrón solo detecta palabras
compuestas con guion bajo (`campo_con_guion`), no campos reales de una
sola palabra. Pendiente: añadir una segunda pasada que compare
palabras sueltas contra la lista exacta de campos reales, no solo el
patrón de guion bajo.

## Cierra el círculo: laboratorio Baserow → gobierno real del Sheet (2026-08-31)

Decisión de fondo del promotor: el Sheet (Ejecutor + `13_INCIDENCIAS` +
Mesa de Revisión) sigue siendo el **gobierno real** -- Baserow/Vigilia/
Concilio es el **laboratorio** donde se investiga y valida antes de
proponer, no una segunda autoridad paralela. La Consola Engremiat
queda pendiente de revisión (puede que su función de panel de revisión
ya la cubra el propio ciclo Vigilia→Relevo, sin comprobar todavía si
aporta algo más -- no se da por obsoleta sin verificarlo).

**Protocolo real, no inventado**: `PROMPT_EJECUTOR.md` ya decía que el
Ejecutor no tiene escritura en Sheets y publica hallazgos para que
"Claude los registre al verlos" -- ese mismo protocolo, ya existente,
es el que cierra el círculo: hallazgos validados del laboratorio se
registran como incidencias reales en `13_INCIDENCIAS`, sin construir
ningún puente nuevo.

**Primera prueba real, hecha esta noche**: `INC-0067` -- el hallazgo
del verificador determinista, registrado en `13_INCIDENCIAS` del Sheet
real (`Gestor de Proyectos - LaTroballa Software`,
`142vRqXfDj4C7KyY7TVf5Oh18gwtDcvAkYxFQ0lb6CGQ`) siguiendo el formato
real de incidencia (OBJETIVO/RESULTADO_ESPERADO/CRITERIOS_ACEPTACION/
DEFINITION_OF_DONE).

**Bug real cometido y corregido en el propio acto de escribir**: la
primera escritura se quedó corta un valor en blanco (faltó
`FECHA_RESOLUCION`), desplazando todas las columnas siguientes una
posición -- `ORIGEN_CREACION` quedó vacío y el resto desalineado.
Detectado al releer la fila, corregido con una reescritura completa y
verificado columna por columna antes de darlo por bueno. Recordatorio
real de por qué escribir en producción exige releer siempre lo escrito,
no solo confiar en que la llamada respondió 200.

**Estado**: el Ejecutor recogerá `INC-0067` en su próximo ciclo de
triaje normal -- no se ha forzado nada, solo se ha alimentado la cola
real. Pendiente: definir si esto se convierte en un ritual repetible
(cada cierre de lote de Vigilia con Relevo revisa qué hallazgos
merecen pasar a incidencia real) o se hace caso por caso.

## Decisión de fondo: migrar el gobierno de Ejecutor+Consola hacia el Holon (2026-08-31, no ejecutada)

Corrección real hecha en el propio proceso: el artefacto de la Consola
("Mesa de Revisión", `7f075613-6072-4e42-b41a-66ca41d4f089`) **no es
redundante con Vigilia/Concilio** -- es el panel de control operativo
real del Ejecutor (Play/Stop/Tarea puntual, horario, cola de
solicitudes por actor: `{ humano: ['decision'], claude: ['valorar'],
worker: [], ejecutor: ['ciclo','backlog'] }`). Cumple una función
distinta a Vigilia, no se "desplaza" a Concilio sin más.

**Dato real que motivó la decisión**: el ciclo del Ejecutor lleva sin
avanzar desde el **28-08** (`95_DIARIO_NAVEGACION`, última entrada) --
3 días, no 9 como sugería a primera vista el propio artefacto
(`metricsDia` marcaba `2026-08-22`, dato desactualizado). No es
abandono claro, fue una decisión consciente del promotor no inferida
por Claude.

**Decisión explícita del promotor, con esta evidencia delante**: migrar
de verdad la función de gobierno de Ejecutor+Consola hacia el Holon
(Baserow/Vigilia/Concilio), en vez de mantener dos paneles de control
paralelos. **No ejecutada esta noche** -- es demasiado grande y toca
gobierno real en marcha para improvisarla a estas horas. Esbozo de
fases para retomar con la cabeza despejada:

1. **Hecho ya**: Holon base (Vigilia/Concilio, verificador
   determinista, `DOCUMENTO_ENGREMIAT`, vault de Obsidian,
   infraestructura VPS/Pi, protocolo probado hacia `13_INCIDENCIAS`
   con `INC-0067`).
2. **Siguiente**: representar en Baserow lo que hoy solo vive en la
   Consola -- horario de ciclo, cola de solicitudes por actor,
   métricas -- antes de tocar el artefacto.
3. **Más delicado**: el Ejecutor hoy no tiene acceso a Baserow (solo a
   Sheets/artefacto/repo) -- decidir si se le da acceso nuevo o si
   sigue pasando por Claude como puente, igual que con
   `13_INCIDENCIAS`.
4. **Último**: retirar formalmente la Consola cuando el Holon cubra
   sus funciones reales, sin perder el histórico (Sheet y diario
   quedan como archivo).

## Benchmark real: worker local vs. DeepSeek-solo, mismas 13 preguntas (2026-08-31)

Comparativa real, no estimada -- las mismas 13 preguntas (pendientes +
recorrido FCAFA-TDAH) lanzadas por dos caminos distintos para medir
velocidad, coste y calidad de verdad.

**Camino A -- worker local (qwen3:14b) + síntesis DeepSeek**, ya en
marcha por el dispatcher de Vigilia: minutos por elemento, coste casi
nulo (solo electricidad). Con `OLLAMA_NUM_PARALLEL=2` recién activado,
**confirmado paralelismo real** -- dos ejecuciones (`2839`/`2840`)
arrancaron con 0,2s de diferencia y ambas completaron sin error en la
misma ventana de ~65s.

**Camino B -- DeepSeek para todo (propuesta + síntesis) + revisión
GPT**, script aparte, sin tocar el flujo de producción: **183,9s en
total para las 13 preguntas, 14,1s de media por elemento** -- muchísimo
más rápido que el worker local. Coste real: **16.349/11.597 tokens
entrada/salida, ~$0,0095 DeepSeek + ~$0,0024 GPT de revisión = ~$0,012
el lote completo de 13 preguntas.**

**Hallazgo real, no esperado**: el revisor GPT marcó **11 de 13 como
"contaminado"**, muy por debajo de la calidad vista antes con el
camino híbrido (local propone, DeepSeek sintetiza). Comprobado a mano
(no dando el veredicto automático por bueno sin más, tal como marca la
disciplina de esta noche): esta vez el revisor acertó -- `PEND1`
("contaminado") inventaba una arquitectura real que no existe (que
13_INCIDENCIAS "alimenta a n8n y Baserow leyendo campos" -- lo que de
verdad existe es un puente manual mío, no lectura automática);
`FCAFA5` ("sólido") sí está bien fundamentada, sin inventar
infraestructura. **Conclusión real**: que DeepSeek proponga y
sintetice sin pasar por varias voces locales primero parece producir
más fabricación de arquitectura que el camino híbrido -- dato real
para decidir qué camino usar según el tipo de pregunta, no una
preferencia.

## Acervo Prompter -- construido y probado con un caso real (2026-08-31)

Primera versión real (`tools/acervo_prompter.mjs`), motor DeepSeek.
Convierte una necesidad vaga + contexto real en una pregunta de
Vigilia estructurada (meta-prompting: da la forma del razonamiento
-- contexto, pregunta con "porqué" explícito, personas sugeridas del
roster real, tabla relevante -- nunca el contenido de la respuesta).

**Bug real encontrado y corregido en la propia primera prueba**: al
generar una pregunta a partir de `INC-0067`, puso `tabla_relevante:
"13_INCIDENCIAS"` -- una tabla del **Sheet**, no de Baserow. El
verificador determinista solo conoce el esquema de Baserow -- si esto
se hubiera sembrado tal cual, habría marcado todo como "no existe" por
confusión de origen, no por fabricación real. Corregido explicitando
en el prompt que `tabla_relevante` es exclusivamente de Baserow, nunca
del Sheet aunque se mencione en el contexto. Reprobado: esta vez dejó
el campo vacío correctamente (la pregunta es sobre un patrón de
código, no sobre esquema de Baserow).

**Cerrado el círculo con un caso real, no solo generado**: la pregunta
resultante se sembró de verdad en Vigilia (`PROMPTER-TEST1`, rama
`Acervo-Prompter-2026-08-31`) y queda en la misma cola que el resto,
protegida por el lock y el verificador ya construidos esta noche.

**Tiempo/coste real**: ~4s por pregunta generada, ~700-800 tokens
entrada / ~500 salida, coste insignificante (misma tarifa DeepSeek ya
medida esta noche).

## Segundo lote real generado por el Acervo Prompter (2026-08-31)

Primer uso a escala del Prompter (5 preguntas, no 1) -- alimentado con
los resultados reales anteriores (OBS1-4 sólidas, OBS3 contradice
OBS1, PEND1 resuelve pero con fabricación detectada, PEND2 con el
umbral de 30 documentos) para que refine en vez de repetir.

Preguntas generadas (rama `Diseno-Bovedas-Obsidian-2026-08-31`,
`BOVEDA1-5`): revalidar frontmatter-vs-carpetas sin apoyarse en la
fabricación de PEND1; una bóveda o varias por proyecto/cliente; cómo
representar `TIPO=mecanismo_real` en el vault; diseño del script real
de migración; automatizar la regeneración sin arriesgar ediciones
humanas futuras. Las 5 correctamente apuntan `TABLA_RELEVANTE:
DOCUMENTO_ENGREMIAT` (real), y piden explícitamente el porqué.

**Observación real, no ideal**: 4 de las 5 preguntas eligieron el
mismo par de personas (Técnico+Lógico) -- poca diversidad de voces en
un lote generado por el propio Prompter. Pendiente de refinar el
system prompt del Prompter para forzar más variedad cuando genere
varias preguntas de una vez, no solo una.

**Pendiente real antes de confiar en los resultados de este lote**:
aplicar los dos verificadores (campos + capacidades) a cada síntesis,
no solo revisar a ojo -- es precisamente el tema donde ya se detectó
una fabricación real esta noche.

## Coordinador -- primera versión real, probada contra las 5 respuestas de BOVEDA (2026-08-31)

Primera implementación (`tools/coordinador.mjs`). Diseño: aplica los
dos verificadores (campos + capacidades) a una respuesta ya procesada;
si está limpia, pide al Prompter que la **atomice** en 2-3 sub-
preguntas (un solo nivel de profundidad esta primera vez, con tope);
si no, la deja para Relevo humano, sin atomizar. Nunca decide publicar
nada -- responde a la propuesta del promotor de "autociclo de Relevo
exponencial" con el freno explícito ya acordado.

**Resultado real de la primera prueba (5 respuestas de `BOVEDA1-5`):
0 de 5 pasaron el filtro, las 5 a Relevo.** Revisadas a mano: en
`BOVEDA1`/`BOVEDA2` el filtro acierta (afirman capacidades presentes
que no existen, como antes). En `BOVEDA3`/`BOVEDA4`/`BOVEDA5` **el
extractor confunde lenguaje de diseño propuesto en presente ("el
script compara...", "se añade un campo...") con afirmaciones de que
algo ya existe** -- un fallo de calibración real del extractor, no
fabricaciones reales detectadas.

**Conclusión honesta**: el Coordinador funciona en la dirección
segura -- nunca deja pasar algo dudoso sin revisión, todo lo que no
está seguro va a Relevo -- pero es **demasiado estricto para ser
eficiente todavía**. Pendiente real: enseñar al extractor a distinguir
"esto se propone construir" de "esto ya funciona hoy" antes de confiar
la atomización automática a este primer filtro.

## Bug real encontrado y corregido durante esta misma construcción: fuga de credencial (2026-08-31)

Mientras se construía el Coordinador, GitGuardian alertó de un Bearer
Token de Baserow expuesto en GitHub -- dos scripts commiteados esta
noche (`tools/sembrar_mecanismos.mjs`, `tools/verificador_capacidades.mjs`)
tenían el token real escrito directamente en el código, en vez de
leerlo de un fichero local como el resto de credenciales de la sesión.
**Corregido de inmediato**: token rotado en Baserow (tres tokens
reales existían, solo uno estaba expuesto -- el promotor lo confirmó
tras rotarlos), código de ambos scripts corregido para leer de
`.baserow_token` (fichero local, fuera del repo), credencial
actualizada en n8n, y verificado dos veces (n8n y scripts locales)
que todo sigue funcionando con el valor nuevo. Recordatorio real: el
`.gitignore` no habría evitado esto -- la disciplina de nunca escribir
un secreto literal en código, sí.

## Coordinador -- extractor refinado, dos rondas reales de corrección (2026-08-31/09-01)

Primera corrección al fallo de calibración anterior: se pasó la
pregunta original al extractor (`extraerAfirmaciones(pregunta, texto)`)
y se añadió una regla explícita para no confundir lenguaje de diseño
propuesto ("diseña el script...") con afirmaciones de existencia.

**Resultado de la primera corrección, probado contra las mismas 5
respuestas**: `BOVEDA1` y `BOVEDA2` pasaron a "LIMPIO" y se atomizaron
en 3 sub-preguntas reales cada una. Antes de dar esto por bueno, se
comprobó a mano si era una mejora real o una sobrecorrección -- y lo
era: `BOVEDA1` repite literalmente la misma fabricación ya detectada
en `PEND1` ("permite que Baserow filtre y agrupe notas dinámicamente"),
en una pregunta que pedía explicar **basándose en hechos verificables**,
no diseñar nada. La regla nueva eximía cualquier presente relacionado
con el tema, no solo el de preguntas de diseño -- **regresión real**:
el extractor pasó de sobre-marcar a dejar pasar fabricaciones
conocidas sin marcarlas.

**Segunda corrección**: se separó la regla en dos casos explícitos --
(a) preguntas de diseño/propuesta, donde el presente del diseño no
cuenta como afirmación de existencia; (b) preguntas de
explicación/justificación ("basándote en hechos verificables"),
donde cualquier afirmación en presente de que algo ya funciona sí
cuenta, incluso si el propio texto dice que lo ha "verificado".

**Resultado final, mismas 5 respuestas**: las 5 vuelven a marcarse
para Relevo, pero ahora por motivos distintos y verificados a mano --
`BOVEDA1`/`BOVEDA2` por fabricación de capacidad real (confirmado:
el catálogo real solo registra "notas de Obsidian generadas desde
Baserow como vista de solo lectura", no el filtrado activo que
afirman ambas respuestas); `BOVEDA3`/`BOVEDA4`/`BOVEDA5` por campos
fabricados (1, 2 y 1 respectivamente -- **pendiente**: aún no
revisados a mano uno por uno, podría ser fabricación real o un
artefacto de calibración distinto en el verificador de campos).

**Conclusión honesta**: el extractor de capacidades ya distingue
diseño-propuesto de afirmación-de-existencia sin volver a caer en
ninguno de los dos errores anteriores (ni sobre-marcar diseño legítimo
ni dejar pasar fabricación real), verificado con un caso de regresión
real capturado antes de confiarlo.

## Verificador de campos -- mismo problema, arreglo determinista sin LLM (2026-09-01)

Revisión manual de los 3 "campos fabricados" pendientes (`BOVEDA3`:
`mecanismo_real`; `BOVEDA4`: `mecanismo_real`, `nombre_original_hash`;
`BOVEDA5`: `ultima_sincronizacion`) encontró que **ninguno era
fabricación real** -- dos causas distintas, ambas en `verificarCampos`
(pura regex, sin LLM):

1. `TIPO=mecanismo_real` es el **valor** de un campo real (`TIPO`), no
   una afirmación de que existe un campo llamado `mecanismo_real`. El
   regex no distinguía "candidato tras un `=` de campo real" de
   "candidato como nombre de campo propio".
2. `nombre_original_hash` y `ultima_sincronizacion` son nombres de
   campo **propuestos** dentro de respuestas a preguntas que pedían
   explícitamente diseñar un script de migración/sincronización --
   mismo problema de diseño-vs-existencia que el extractor de
   capacidades, pero aquí sin ninguna clasificación de tipo de
   pregunta que lo filtrase.

**Arreglo aplicado** (en `tools/coordinador.mjs` y en
`tools/verificador_determinista.mjs`, el script real usado por el
workflow n8n de Vigilia): dos filtros deterministas por proximidad de
texto, sin llamada a LLM -- (a) excluir candidatos que aparecen como
`CAMPOREAL=candidato`; (b) excluir candidatos precedidos, a menos de
60 caracteres, de una señal de propuesta ("se añade", "generar",
"nuevo campo", "propongo", "nombres únicos"...). Coherente con el
principio de la noche: la corrección es una regla determinista, no
delegar el criterio a otro modelo.

**Resultado final, mismas 5 respuestas de `BOVEDA1-5`**: 3 de 5 pasan
limpias y se atomizan con sub-preguntas reales y bien dirigidas
(`BOVEDA3`, `BOVEDA4`, `BOVEDA5` -- las sub-preguntas generadas
referencian correctamente los campos propuestos, ej. "¿cómo se
garantiza que `ultima_sincronizacion` no sea manipulado...?"). 2 de 5
siguen a Relevo por la fabricación de capacidad ya confirmada a mano
(`BOVEDA1`, `BOVEDA2`). Es el primer resultado del Coordinador donde
la atomización automática se demuestra con datos reales, no solo el
freno de seguridad.

## Coordinador -- tope de profundidad real y primera prueba de nivel 2 (2026-09-01)

Hasta ahora `TOPE_PROFUNDIDAD` existía como constante pero nunca se
usaba -- el Coordinador atomizaba sin llevar la cuenta de en qué nivel
estaba. Corregido: cada fila lleva su propia `profundidad`, y solo se
atomiza si `profundidad < TOPE_PROFUNDIDAD` (subido de 1 a 2 para esta
prueba). Si está limpia pero ya alcanzó el tope, va a Relevo humano
sin generar más sub-preguntas -- el freno de seguridad se aplica
también a la profundidad, no solo a la limpieza del contenido.

**Prueba real de segundo nivel**: se sembraron en `VIGILIA_TAREA` las
9 sub-preguntas generadas en el primer nivel (3 de `BOVEDA3`, 3 de
`BOVEDA4`, 3 de `BOVEDA5`) y se dispararon por el pipeline real de
Vigilia (worker local + síntesis DeepSeek), no simuladas a mano.

**Dos bugs reales de infraestructura encontrados y corregidos por el
camino, ninguno relacionado con el Coordinador en sí**:
1. El nodo de bloqueo de concurrencia (`Bloquear elemento pendiente
   (lock)`) tenía el token de Baserow **ya filtrado y rotado** (el
   mismo del incidente de GitGuardian) escrito directamente en su
   código -- la limpieza de esa noche solo revisó el repo de git, no
   los workflows de n8n, que no están versionados. Al revisar,
   aparecieron **5 nodos más** con el mismo token viejo hardcodeado
   (`Comprobar presupuesto...` x4, `Verificar contra esquema real`,
   `Promocionar version`). Corregidos los 6 de una vez.
2. Bug real de concurrencia distinto al ya conocido: el nodo
   `Construir tema con contexto` seguía leyendo
   `$('Buscar siguiente Vigilia pendiente').item.json.results[0]`
   -- la primera fila de la búsqueda original -- en vez de la fila
   que el nodo de lock realmente había bloqueado. El lock sí
   reservaba filas distintas correctamente, pero el trabajo real
   (pregunta a responder y fila donde guardar el resultado) siempre
   caía en la primera pendiente, no en la elegida. Detectado porque,
   tras disparar los 9 ciclos, solo 1 de 9 filas quedó realmente
   procesada -- las otras 8 quedaron bloqueadas sin resultado.
   Corregido el nodo para leer de `$('Bloquear elemento pendiente
   (lock)')`. **Nota honesta**: el test de concurrencia real de esta
   madrugada verificó que el lock reserva filas distintas, pero nunca
   verificó que el CONTENIDO guardado correspondiera a la fila
   correcta -- un hueco real en aquella verificación.

**Resultado del Coordinador sobre las 9 respuestas reales de nivel 2**:
5 de 9 salen limpias pero **se frenan por el tope de profundidad** (no
se atomizan a nivel 3, van a Relevo humano) -- primera vez que se ve
el freno de profundidad actuar de verdad, no solo el de limpieza. Las
otras 4 se marcan: 3 por campos fabricados (`BASEROW_ID`,
`ruta_obsidian`, `ultima_sincronizacion` -- estos últimos probablemente
son señales de propuesta heredadas del nivel 1 que el nivel 2 no repite
explícitamente, así que el verificador los marca de forma conservadora;
pendiente de revisar si conviene propagar el contexto de "ya propuesto"
entre niveles) y 1 por fabricación de capacidad muy clara
(`BOVEDA5N2-2`: inventa "tokens de integridad asincrónicos", "3 nodos
específicos", "~120h y ~$3.500 mensuales" -- ningún dato de esto existe
en el catálogo real).

## Límites y honestidad

- Nada de esto está construido en el generador todavía -- es
  metodología y plantilla documentadas, la Urdimbre de la primera
  historia (ver `diario-navegacion/2026-08-31-vecino-del-banco/`) es el
  primer caso real, preparado a mano antes de automatizar nada.
- La cifra de "19 nodos" es una estimación de diseño, no una medición --
  el primer Relevo real dirá si es un tamaño cómodo o hay que ajustar.

## Workflows n8n exportados a git, con un hallazgo real más de credenciales (2026-09-01)

Al exportar los 2 workflows reales de la instancia n8n "generador"
(`tools/n8n-workflows/`) para tenerlos versionados -- hasta ahora solo
vivían dentro de n8n, sin diff ni historial -- se intentó primero
eliminar el hardcode de token de los 7 nodos corregidos esa misma
noche, usando `this.getCredentials()` y luego
`this.helpers.httpRequestWithAuthentication()`. **Ninguna de las dos
funciona**: esta versión del Code node de n8n corre en un sandbox de
task-runner que no permite acceso a credenciales de ningún tipo desde
código. Revertido a token en claro (funcional, verificado con una fila
de prueba real) -- el hardcode sigue siendo un hueco real pendiente de
resolver como es debido (convertir estas llamadas a nodos HTTP Request
nativos con la credencial `httpHeaderAuth`), documentado en
`tools/n8n-workflows/README.md`.

Al exportar, se hizo un `grep` de verificación antes de comitear (regla
de esta noche: nunca asumir que una redacción fue completa sin
comprobarlo) y apareció **un hallazgo más**: el workflow "Telar
Interactivo" -- no tocado hasta ahora -- tenía el mismo token viejo ya
filtrado (el del incidente GitGuardian) hardcodeado en 2 nodos más
(`Comprobar presupuesto Telar`, `Comprobar presupuesto Urdimbre`),
rotos en producción desde la rotación sin que nadie lo notara.
Corregidos. El export final a git tiene todo valor de token (actual y
viejo) sustituido por el marcador `__BASEROW_TOKEN__` -- nunca se
commitea un secreto real, ni siquiera uno ya invalidado.

## Tres mejoras al ecosistema externo, probadas con datos reales (2026-09-01)

Tras la valoración de los resultados de nivel 1 y 2, se propusieron y
probaron tres mejoras concretas.

**1) Propagar contexto "ya propuesto" entre niveles del Coordinador --
funciona, confirmado.** `verificarCampos` ahora acepta una lista de
campos ya propuestos en el nivel padre (`CAMPOS_YA_PROPUESTOS`) y no
los vuelve a marcar como fabricados aunque el nivel hijo no repita la
señal léxica de propuesta. Probado retroactivamente contra las 9
respuestas de nivel 2 ya generadas: los 3 falsos positivos de campos
heredados (`nombre_original_hash` en `BOVEDA4N2-*`,
`ultima_sincronizacion` en `BOVEDA5N2-1/3`) desaparecen; la fabricación
de capacidad real en `BOVEDA5N2-2` sigue correctamente marcada (no se
perdió sensibilidad); `BOVEDA3N2-2/3` siguen marcadas por campos
nuevos genuinos de ese nivel (`BASEROW_ID`, `ruta_obsidian`), que no
vienen del padre y por tanto es correcto que se revisen.

**2) Instrucción anti-fabricación en el prompt de síntesis DeepSeek --
probada, NO funciona por sí sola.** Se añadió una regla explícita al
`system prompt` de "Preparar síntesis Concilio" prohibiendo afirmar
capacidades/cifras que no vengan en las propuestas recibidas. Prueba
real: se relanzó la pregunta exacta de `BOVEDA1` (la que producía "permite
que Baserow filtre y agrupe notas dinámicamente") por el pipeline real
con la regla ya activa. **Resultado honesto: la misma fabricación
reaparece, solo reformulada** ("los metadatos... son indexables por
Baserow", "consultas transversales... sin alterar la estructura de
carpetas"). El verificador de capacidades la sigue detectando (4
afirmaciones sin confirmar), así que el freno de seguridad sigue
funcionando -- pero la instrucción de prompt sola no reduce la tasa de
fabricación en la fuente. Hipótesis para la próxima iteración: pedirle
a DeepSeek que "no invente" en abstracto no basta si no tiene el
catálogo real de mecanismos delante para comprobar contra qué -- el
paso siguiente lógico es inyectar el mismo catálogo real que usa el
verificador de capacidades directamente en el prompt de síntesis, no
solo prohibir inventar sin darle con qué contrastar.

**3) Métrica de tasa de fabricación en Baserow -- diseñada, no
construida todavía.** Pendiente real: sigue siendo cierto que cada
prueba de esta noche es un veredicto puntual sin registro histórico;
no se ha construido el contador de fabricaciones/total por lote.

## Punto 1 resuelto de verdad: síntesis anclada al catálogo real (2026-09-01)

Siguiendo la hipótesis anotada arriba, se corrigió "Preparar síntesis
Concilio" para que cargue en vivo el catálogo real de
`DOCUMENTO_ENGREMIAT` (`TIPO=mecanismo_real`) y lo inyecte en el
propio prompt, en vez de solo prohibir inventar en abstracto -- con
instrucción explícita de marcar como "propuesta" (no como hecho)
cualquier cosa fuera de ese catálogo.

**Prueba real, mismo caso de control (`BOVEDA1`) que falló con la
prohibición abstracta**: la fabricación original desapareció. La
nueva respuesta cita el mecanismo real correcto ("el Verificador
determinista de campos, mecanismo 2") en vez de inventar un filtrado
dinámico de Baserow, y enmarca la única idea especulativa como
"quedaría por construir" en vez de afirmarla como hecho.

**Efecto secundario real, no anticipado**: al mejorar la calidad de la
síntesis (ahora cita mecanismos reales por nombre, razona con
negaciones explícitas -- "no existe campo que respalde X"), el
extractor de afirmaciones del verificador de capacidades empezó a
marcar como "sin confirmar" cosas que en realidad NO son fabricación:
negaciones ("no existe X") y citas directas del catálogo con
formato ligeramente distinto. Corregido con dos arreglos deterministas
(no delegados a otro juicio de LLM): (a) filtro de negaciones por
patrón regex tras la extracción, de respaldo aunque el LLM ya reciba
la instrucción de excluirlas; (b) comprobación de cita directa al
catálogo por solapamiento de palabras (≥70%), no por substring exacto,
para que reformatos menores (negrita, orden de palabras) no rompan el
match. Resultado final sobre el mismo caso: de 5 "capacidades sin
confirmar" iniciales a 2, ambas casos límite razonables de revisión
humana (afirmaciones de diseño encadenadas al mecanismo real citado),
no fabricación clara.

**Conclusión honesta**: el punto 1 de la propuesta funciona -- ancla
la fuente, no solo el freno. El coste fue que expuso una imprecisión
ya latente en el extractor de capacidades (no distinguía negaciones de
afirmaciones), que también se ha corregido esta noche con el mismo
principio de siempre: arreglo determinista, no otro LLM juzgando en
libertad.

## Punto 2: ciclo de corrección antes de Relevo, probado y funcionando (2026-09-01)

Añadida `corregir()` al Coordinador: cuando una respuesta sale
REVISAR, se le devuelve a DeepSeek con la lista exacta de campos
fabricados y capacidades sin confirmar detectadas (por los
verificadores deterministas, no por juicio libre), pidiendo que
reescriba SOLO esos puntos -- como propuesta explícita si aplica, o
quitándolos si no aportan. Se re-verifica una vez; si sale limpia, se
trata como LIMPIO (puede atomizarse); si no, va a Relevo con el
intento documentado. Nunca se publica nada directamente -- el freno de
Relevo humano sigue intacto, esto solo reduce cuántos casos mueren en
el primer intento por un matiz corregible.

**Prueba real contra 3 casos REVISAR reales de esta noche**
(`TESTANTIFAB2` con capacidades límite, `BOVEDA3N2-2`/`BOVEDA3N2-3` con
campos fabricados reales -- `BASEROW_ID`, `ruta_obsidian`, nombres que
no existen en el esquema): los 2 casos de campo fabricado se
corrigieron de forma consistente en dos corridas repetidas -- el
texto corregido de `BOVEDA3N2-2` quita el nombre de campo inventado y
lo reescribe como propuesta explícita ("se podría añadir un campo
dedicado para esto"), sin gutear el resto del argumento. El caso límite
de capacidades (`TESTANTIFAB2`) fue inconsistente entre corridas: una
vez se corrigió, otra vez no y fue correctamente a Relevo con el
intento documentado -- **comportamiento honesto y esperado**, el
ciclo no fuerza un LIMPIO falso cuando la corrección no basta de
verdad.

## Punto 3: cálculo de tasa de fabricación, sin persistir todavía (2026-09-01)

El informe del Coordinador ahora calcula un resumen por lote
(`*_resumen.json`): limpias sin corrección, corregidas con éxito,
corrección fallida a Relevo, total de campos/capacidades fabricadas,
tasa de fabricación. **Bloqueo real**: el token de Baserow no tiene
permiso para crear tablas nuevas vía API (mismo límite ya conocido
para campos) -- no se ha podido persistir esto en Baserow todavía.
Pendiente: crear manualmente una tabla `METRICA_FABRICACION` (o
decidir otro destino) para que el resumen deje de vivir solo en
JSON local y se pueda comparar en el tiempo.
