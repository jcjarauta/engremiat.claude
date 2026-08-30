# Propuesta — Empaquetar Engremiat para uso real: infraestructura descentralizada, bóveda Obsidian y vínculo con Claude

**Fecha de apertura:** 2026-08-29
**Estado:** A valorar -- diseño en curso
**Incidencia Sheet:** INC-0066 (`13_INCIDENCIAS`, A valorar)
**Proyecto Sheet:** PRO-0022 (`02_PROYECTOS`, Gestor de Proyectos, CAM-0004)
**Fusiona con:** `PROPUESTA_PRODUCTO_LOCAL_INDEPENDIENTE.md` (PRO-0018, pausada
25/08/2026 "hasta demanda real de un cliente") -- esa demanda real es esta
misma prueba, con hardware propio del operador (Raspberry Pi + SSD externo
ya disponibles). Ambos documentos describen el mismo eje (independencia de
la nube, control del propio dato/cómputo); este documento es ahora la versión
viva, `PRO-0018` queda como antecedente histórico, no se duplica el diseño.
**Origen:** conversación derivada del piloto TEST-Cliente-2026-08-29 (PRO-0020)
-- al ver el ciclo completo funcionar de principio a fin, la pregunta pasó de
"¿funciona la tecnología?" a "¿cómo se lo servimos a alguien real, con
soberanía real sobre sus propios datos e infraestructura?"

## Decisión central de esta versión: la soberanía es el producto, no un detalle técnico

La prueba se hace con hardware propio del operador (Raspberry Pi + SSD
externo), no con infraestructura de un proveedor cloud. La idea rectora,
explícita del operador: **el cliente tiene el control de sus datos y de su
infraestructura de IA en sus propias máquinas, y solo acude a Claude (nube)
en momentos de trabajo más intensos.** Esto no es un detalle de despliegue --
es el diferenciador de producto frente a cualquier competidor que solo ofrezca
"un chatbot más" encima de una nube ajena.

## Dos direcciones distintas -- no confundirlas (corrección sobre la versión anterior)

La versión anterior de este documento asumía una sola dirección ("el cliente
abre su chat de Claude y este entra a leer su Pi", vía Custom Connector MCP).
Esa dirección exige un servidor alcanzable públicamente desde las IPs de
Anthropic -- un túnel expuesto (Tailscale Funnel/Cloudflare Tunnel/ngrok),
delante de la Pi. Es real y sigue siendo útil más adelante, pero **diluye la
soberanía pura**: expone algo hacia fuera, aunque sea de forma controlada.

La idea que ahora plantea el operador es la dirección **contraria**, y es más
simple:

- **Salida (Pi/PC → Claude)**: la propia infraestructura del cliente decide
  cuándo pedir ayuda a Claude y le envía exactamente lo que hace falta, nada
  más. Es una llamada normal a la API de Claude, iniciada por el cliente. No
  requiere exponer ningún servidor a internet, no hay superficie de ataque
  nueva, y es coherente al cien por cien con "control de mis datos en mis
  propias máquinas": la Pi decide, la Pi pregunta, la Pi recibe la respuesta.
- **Entrada (Claude → Pi)**: lo que describía la versión anterior. Útil para
  "abro mi chat de Claude y le pregunto por mi negocio" desde cualquier
  sitio, pero exige exponer algo, aunque sea con autenticación. Queda como
  fase posterior y opcional, no como punto de partida.

**Decisión para esta prueba: empezar solo por la dirección de salida.** Es más
barata, más simple, y no obliga a decidir todavía el mecanismo de túnel.

## Corrección 2026-08-29 (2ª revisión): no es una cadena de niveles, es un solo mando con varios modelos

La versión anterior describía "Pi → LLM local → DeepSeek → Claude" como una
cadena secuencial (nivel 1 pasa al 2, el 2 pasa al 3). El operador aclara que
ya hay varios modelos locales probados y usables para propósitos distintos
(DeepSeek es el más potente de ellos, no un nivel aparte) -- y que la
interfaz (el propio chat de Telegram) debe poder mandar cada mensaje a
Claude o a la IA local según haga falta, en el momento. Encadenar niveles no
sirve para eso: hace falta un **único mando central con varios modelos
registrados**, no una cadena de favores.

La pieza que ya resuelve esto en 2026, sin construir nada a medida, se llama
**LiteLLM**: una pasarela (gateway) autoalojada que habla el mismo idioma
con más de 140 proveedores distintos -- modelos locales servidos por Ollama
(los que ya se han probado, y cualquiera nuevo que se pruebe después) y
Claude en la nube, todos por la misma puerta. Ya trae de fábrica selección
de modelo por reglas, plan B automático si un modelo falla, control de
gasto, y registro de qué se ha usado y cuánto ha costado.
Fuentes: [Build a Unified AI Gateway with LiteLLM and Ollama](https://dev.to/everylocalai/build-a-unified-ai-gateway-with-litellm-and-ollama-387a),
[Implementing LLM Model Routing: A Practical Guide with Ollama and LiteLLM](https://medium.com/@michael.hannecke/implementing-llm-model-routing-a-practical-guide-with-ollama-and-litellm-b62c1562f50f).

### Cómo queda el reparto de trabajo

- **Raspberry Pi + SSD externo** -- el cerebro siempre encendido: guarda los
  datos del cliente, corre el bot de Telegram, y aloja la propia pasarela
  LiteLLM (el "mando central"). No necesita ser potente para esto -- solo
  estar siempre disponible.
- **Varios modelos locales en el PC (vía Ollama)** -- no una jerarquía fija,
  sino un catálogo de modelos ya probados, cada uno registrado en LiteLLM
  para un propósito: uno rápido y barato para tareas sencillas, DeepSeek
  para lo más exigente que aún se quiere resolver sin salir de casa, y
  hueco libre para probar otros sin tocar nada del resto del sistema --
  añadir un modelo nuevo es una línea de configuración en LiteLLM, no un
  cambio de arquitectura.
- **Claude (nube)** -- un proveedor más dentro del mismo catálogo de
  LiteLLM, marcado como el más caro/potente. Se llama desde dentro
  (dirección de salida, ver más abajo), nunca al revés en esta fase.
- **Señal de enrutado**: por defecto, enrutado automático por complejidad
  (patrón ya investigado y maduro en 2026 -- ver RouteLLM más abajo): los
  mensajes sencillos van solos a un modelo local barato, los complejos suben
  a Claude, sin que nadie tenga que decidirlo a mano cada vez. Además,
  control manual explícito desde el propio Telegram (ver siguiente sección)
  para cuando el usuario quiere decidir él mismo.

### Enrutado automático por complejidad (RouteLLM) -- reduce coste sin perder calidad

Investigación 2026 (RouteLLM, LMSYS) muestra que **más de la mitad de los
mensajes reales (52,8%) se resuelven igual de bien con un modelo pequeño**
que con uno grande -- solo una minoría de casos difíciles necesita el modelo
más caro. Un clasificador ligero (200-500ms, sin infraestructura extra)
decide, antes de responder, si el mensaje es sencillo (va al modelo local) o
complejo (sube a Claude). Esto no sustituye el control manual -- es el
comportamiento por defecto cuando nadie elige explícitamente.
Fuente: [RouteLLM: An Open-Source Framework for Cost-Effective LLM Routing](https://www.lmsys.org/blog/2024-07-01-routellm/).

### Telegram como interfaz de selección, no solo de chat

El bot de Telegram ya construido gana una capa nueva, sin rehacer nada de lo
que ya funciona: botones en línea (`inline keyboard`, función nativa de
Telegram) para que el usuario elija "Claude" o "IA local" en el momento, o
un comando (`/modelo claude`, `/modelo local`) para fijar su preferencia
durante la sesión. Por debajo, el bot simplemente llama a LiteLLM indicando
qué modelo usar -- la pasarela ya sabe hablar con cualquiera de los dos.
Patrón ya usado por bots de Telegram reales con Claude/GPT/Gemini/Llama
registrados como opciones seleccionables.
Fuente: [Telegram Bot Features -- inline keyboards](https://core.telegram.org/bots/features).

### Beneficio adicional: esto también responde a la pregunta pendiente del coste

LiteLLM registra de fábrica cuánto se ha gastado y en qué modelo -- es
exactamente el dato que faltaba para decidir, más adelante, el modelo de
precio de un cliente real (cuota fija vs. consumo real de IA en la nube).
No hace falta instrumentar nada a mano para tener esa cifra.

## Beneficio no buscado: esto también prueba la Fase 1 de independencia de red

Al vivir en hardware propio y descentralizado, esta prueba responde de paso
la pregunta que dejó abierta `PROPUESTA_PRODUCTO_LOCAL_INDEPENDIENTE.md`: qué
pasa si se corta la conexión a internet. Diseño previsto desde el principio:
la Pi y los modelos locales del PC siguen funcionando para todo lo que no
necesite a Claude; LiteLLM ya soporta plan B automático, así que solo la
escalada a Claude queda en cola hasta que vuelva la red -- ni se pierde
trabajo, ni se bloquea todo el sistema por un corte puntual.

## Hallazgo crítico que sigue vigente para la Fase posterior (entrada)

Cuando se aborde la dirección de entrada (Claude → Pi, más adelante): un
Custom Connector de Claude.ai exige que el servidor MCP sea alcanzable
públicamente desde las IPs de Anthropic -- la conexión se origina desde los
servidores de Anthropic, no desde la red del cliente. Sigue sin resolverse el
mecanismo de túnel definitivo (Tailscale Funnel/Cloudflare Tunnel/ngrok); no
hace falta decidirlo para la Fase 1.

Fuentes: [Get started with custom connectors using remote MCP](https://support.claude.com/en/articles/11175166-get-started-with-custom-connectors-using-remote-mcp),
[Connect to remote MCP Servers](https://modelcontextprotocol.io/docs/2026-07-28/develop/connect-remote-servers),
[Using ngrok as your MCP gateway](https://ngrok.com/docs/using-ngrok-with/using-mcp).

## Qué ya existe y no hay que reinventar

| Pieza necesaria | Ya construido en Engremiat |
|---|---|
| Bot operativo por cliente | `WebhookTelegramService.js`, probado en vivo (TEST-Cliente-2026-08-29) |
| Datos → nota exportable | `generarNotaObsidian()` (`ReportService.js`, v177 de la librería) |
| Grafo de entidades | `17_RELACION`/`18_VINCULO` -- ya es un grafo tipado, no texto plano a extraer |
| Interfaz web ligera | Consola Engremiat (`tools/consola/`), Artifact estático ya sincronizado |
| Cola de trabajo con estado | `92_BUS_TRABAJO` (reclamada→en_progreso→lista_para_revision→verificada), ya sirve como mecanismo de reparto entre los tres niveles |
| Señal de escalado a Claude | Estado `rechazada` en `92_BUS_TRABAJO`, ya en uso real (`TASK-0004`) |
| Hardware de la Fase 1 | Raspberry Pi + SSD externo -- ya disponibles, sin compra pendiente |

## Panorama de proyectos comparables (qué funciona, qué no)

- **Khoj** ([github.com/khoj-ai/khoj](https://github.com/khoj-ai/khoj)): "segundo
  cerebro" autoalojable, 35k+ estrellas, activo, soporta LLMs locales y en la
  nube, agentes personalizables y automatizaciones programadas. Confirma que
  el patrón "second brain personal, self-hosted" es maduro en 2026 -- pero
  está pensado para una persona, no para gestionar el ciclo de vida de un
  cliente de negocio. Engremiat ya tiene esa capa de negocio.
- **Onyx / antes Danswer** ([tooldirectory.ai/tools/onyx](https://tooldirectory.ai/tools/onyx)):
  buscador empresarial + asistente IA, 40+ conectores, MIT, autoalojable
  gratis. Referencia si en el futuro un cliente quiere que el asistente
  también lea correo/Drive/Slack, no solo su Sheet.
- **Plugins de IA para Obsidian** (Smart Connections, Copilot, Text
  Generator, Obsidian Local AI): receta estándar 2026 -- Ollama local +
  `nomic-embed-text` para embeddings + un modelo de chat local, todo contra
  `localhost:11434`. Reutilizable tal cual para la bóveda de cada cliente.
- **Raspberry Pi como nodo de control siempre encendido**, emparejado con un
  equipo más potente para los modelos pesados: patrón ya documentado y
  probado por terceros -- encaja exactamente con el reparto descrito arriba.
- **LiteLLM** ([dev.to/everylocalai](https://dev.to/everylocalai/build-a-unified-ai-gateway-with-litellm-and-ollama-387a)):
  pasarela unificada de código abierto, estándar de facto en 2026 para
  combinar Ollama (modelos locales) con proveedores en la nube (Claude
  incluido) bajo una sola API, con enrutado, plan B automático y control de
  gasto de fábrica.
- **RouteLLM** ([lmsys.org](https://www.lmsys.org/blog/2024-07-01-routellm/)):
  enrutado automático por complejidad -- más de la mitad de los mensajes
  reales se resuelven igual de bien con un modelo pequeño que con uno caro.
- **Onboarding conversacional**: "la primera interacción es una conversación
  que declara intención, y la ruta se adapta a esa intención" mide 3.2x más
  activación que un tour de producto fijo (benchmark Perspective AI 2026).

## Arquitectura propuesta (por capas)

### 1. Infraestructura: Raspberry Pi + SSD (control + pasarela) y PC (catálogo de modelos locales)

Ver "no es una cadena de niveles, es un solo mando" arriba. La Pi aloja
LiteLLM (el mando central) y todo lo que necesita estar siempre disponible.
El PC aporta el catálogo de modelos locales (Ollama), DeepSeek incluido.
Claude es un proveedor más dentro del mismo catálogo, invocado hacia fuera,
nunca al revés en esta primera fase.

### 2. Bóveda Obsidian: construcción y personalización

Construida a partir de las entidades reales del cliente (`DOCUMENTO`,
`DECISION`, `TAREA`, `PROYECTO`...), reutilizando `generarNotaObsidian()` ya
construido y probado. Personalización real: qué entidades se exportan
depende de los módulos contratados -- mismo patrón que ya usamos en CAM-0002.
Búsqueda semántica ligera vive en la Pi; el razonamiento pesado se reparte
entre los modelos locales del PC vía LiteLLM, y solo lo verdaderamente
complejo escala a Claude.

**Recomendación técnica sobre GraphRAG**: no adoptar el GraphRAG completo de
Microsoft -- fue diseñado para extraer un grafo de texto no estructurado, un
paso costoso que Engremiat ya no necesita: `17_RELACION`/`18_VINCULO` ya son
un grafo tipado desde el origen. Un enfoque más ligero (estilo `LightRAG`)
que recorra ese grafo ya existente es mucho más barato en Pi/local, y
coherente con lo que `generarNotaObsidian()` ya hace de forma determinista.

### 3. Bot de Telegram

Ya construido. Canal rápido/asíncrono (recordatorios, consultas puntuales).
Corre en la Pi -- no depende de que el PC ni Claude estén disponibles.

### 4. Vínculo con Claude: empezar por la salida, no por la entrada

Ver sección "Dos direcciones distintas" arriba. Fase 1 de esta prueba:
LiteLLM llama a la API de Claude cuando el enrutado por complejidad lo pide,
o cuando un modelo local rechaza/no puede con una tarea. Fase posterior
(opcional): Custom Connector para que
el cliente entre desde su propio chat de Claude/ChatGPT.

### 5. Interfaz web

Reutilizar la Consola Engremiat (`tools/consola/`) extendida a "vista de
cliente" -- más barato que un desarrollo desde cero.

### 6. ¿Un asistente dentro del sistema?

Sí, como capa fina sobre lo que ya existe (ver `generarNotaObsidian`,
búsqueda semántica local, `92_BUS_TRABAJO`), inspirada en la receta de
Khoj/Onyx pero sin adoptar ninguno de los dos tal cual.

### 7. Onboarding conversacional

Incidencia especial generada automáticamente junto con el PROYECTO de cada
cliente nuevo (mismo gancho que `crearProyectoEnGestorDeProyectos_`): una
`TAREA` "Onboarding conversacional" con preguntas adaptativas (qué quiero
aprender / conseguir / qué me hace falta / cuánto cuesta / en qué beneficia).

## Extensión: análisis de oportunidades y comunicación asistida sobre el grafo

- **Análisis de oportunidades**: recorrido asistido por LLM sobre
  `OPORTUNIDAD` + `TAREA`/`RECURSO`/`COMPETENCIA` vinculados, para detectar
  oportunidades sobre-comprometidas o con recursos insuficientes.
- **Comunicación asistida**: respuestas del bot de Telegram apoyadas en
  búsqueda semántica local sobre el vault antes de contestar (patrón "Vault
  QA"), grounded en lo que el cliente realmente tiene escrito.

## Del piloto manual a "el cliente se lo monta él mismo" (nueva sección, 2026-08-29)

Todo lo hecho hasta ahora en TEST-Cliente-2026-08-29 lo ha operado el propio
Claude a mano (clasp, curl, despliegues). Para un cliente real, ese camino
tiene que desaparecer por completo: solicitud de montaje → un solo comando
en su Pi → bot, Sheet y bóveda funcionando, sin que nadie tenga que tocar
`clasp` ni `curl`.

### Lo que ya no hay que inventar

- **[hwdsl2/self-hosted-ai-stack](https://github.com/hwdsl2/self-hosted-ai-stack)**:
  Docker Compose ya empaquetado con Ollama + LiteLLM + extras, multi-arquitectura
  (`amd64`/`arm64`, es decir, ya piensa en Raspberry Pi), local-first por
  diseño. Punto de partida real para nuestro propio `docker-compose.yml`, en
  vez de escribirlo desde cero.
- **Patrón de instalación de un solo comando**: `curl -fsSL <url>/instalar.sh | bash`
  descarga el compose y lo levanta -- el mismo patrón que ya usan Docker,
  HomelabOS y decenas de proyectos self-hosted en 2026. Es lo que hace que
  "descargar e instalar Engremiat" sea real y no una entrevista técnica.

### Aviso crítico de fiabilidad en Raspberry Pi 5 (antes de que nos muerda)

Hay un bug real de firmware/kernel en la Pi 5: **carga sostenida en los 4
núcleos (Ollama por defecto los usa todos) puede provocar un kernel panic**
a partir de generaciones de ~20 tokens. Mitigación conocida: limitar Ollama
a un núcleo (`OLLAMA_NUM_THREADS=1` o afinidad de CPU) -- el coste es
respuesta más lenta (12-17s en vez de 3-5s), aceptable para un asistente
que no necesita ser instantáneo. Fijar versiones concretas de imagen en el
compose (no `latest`) es también práctica recomendada 2026 para evitar
regresiones sorpresa en un dispositivo sin supervisión.
Fuente: [Running AI on a Raspberry Pi Server](https://medium.com/@kostyantins/running-ai-on-a-raspberry-pi-server-gemma-4-ollama-883aade3442c).

### Flujo de onboarding propuesto, de punta a punta

1. **Solicitud de montaje** (ya existe): cliente pide su Sheet, se aprueba,
   se crea Sheet + Script + registro `CLIENTE` + `PROYECTO` (ya automatizado
   hoy, ver `crearProyectoEnGestorDeProyectos_`).
2. **Nuevo: "kit de instalación"** generado en el mismo paso de aprobación --
   un fichero de configuración (o un Documento en la carpeta Drive del
   cliente, mismo patrón ya usado) con los tres datos que su Pi necesita:
   URL del webhook de su cliente (ya pública), el token de su propio bot de
   Telegram (lo crea él en BotFather -- dato suyo, nunca nuestro), y el ID
   de su Sheet.
3. **Un solo comando en su Pi**: `curl -fsSL .../instalar-engremiat.sh | bash`.
   El script instala Docker si falta, descarga el `docker-compose.yml`
   (basado en el stack de arriba + nuestro `bot-local` como contenedor
   propio), coloca los tres datos del kit en un `.env`, y arranca todo con
   `restart: unless-stopped` -- sobrevive a un reinicio de la Pi sin que el
   cliente vuelva a tocar una terminal.
4. **El bot cobra vida solo.** El cliente ya puede hablarle por Telegram
   desde el minuto uno.
5. **Sincronización periódica de la bóveda real** (pieza nueva, no resuelta
   aún): un temporizador dentro del propio contenedor recorre `DOCUMENTO`/
   `DECISION`/`TAREA`/`PROYECTO` (ampliando las acciones de solo lectura ya
   creadas, no solo nota-a-nota bajo demanda) y escribe/actualiza ficheros
   `.md` reales en una carpeta del SSD -- el cliente la abre directamente
   con la app de escritorio de Obsidian. Ningún plugin de sincronización
   existente resuelve esto tal cual (sincronizan vaults entre sí, no una
   base de datos externa hacia un vault) -- es pieza propia, pero sencilla:
   mismo patrón cron + escritura de fichero ya validado en el ecosistema
   self-hosted.
6. **Crear y hacer seguimiento de proyectos desde el propio chat**: hoy las
   dos acciones de cliente (`generar_nota_obsidian`, `listar_incidencias_abiertas`)
   son deliberadamente de solo lectura. El paso que falta para que el
   cliente "cree proyectos" de verdad es una tercera acción, de escritura
   pero acotada (`crear_incidencia`, mismo patrón que ya usa el formulario
   humano `guardarFormulario`) -- una nueva necesidad contada por chat se
   registra como incidencia real, entra en el mismo ciclo ya probado
   (`13_INCIDENCIAS` → `92_BUS_TRABAJO` → Ejecutor/worker local), sin que el
   cliente necesite saber que ese ciclo existe.

### Bot de onboarding (nuevo, 2026-08-29) -- distinto del bot operativo de cada cliente

Hallazgo directo de operar el piloto: para autorizar al bot de un cliente a
responder solo a quien debe, hacía falta que alguien buscara su ID de
Telegram a mano (`@userinfobot`) y lo pasara para configurarlo -- un paso
manual que no escala a un cliente nuevo por semana. La solución no es
automatizar ese paso suelto, es no necesitarlo: **si el alta se hace
hablando con un bot, ese bot ya conoce el ID de quien le escribe desde el
primer mensaje** -- viene incluido en cada mensaje de Telegram, sin
preguntarlo aparte.

Por eso se propone un **bot de onboarding, único y separado de cada bot
operativo de cliente** -- lo opera Engremiat (nosotros), no cada cliente:

1. El futuro cliente le escribe a este bot único para darse de alta.
2. El bot captura su ID de Telegram automáticamente (para autorizarlo luego
   en su propio bot, sin volver a preguntarlo) y le pregunta qué módulos
   quiere -- llama a `crear_solicitud_montaje`, que **ya existe** en el
   webhook del maestro, no hay que construir nada nuevo aquí.
3. **La aprobación real (creación de Sheet+Script) sigue pasando por
   revisión humana**, deliberadamente -- mismo criterio que ya rige
   `EMAILS_AUTORIZADOS_MONTAJE` hoy: crear una solicitud es autoservicio
   seguro, aprobar recursos reales de pago no lo es todavía, sin más
   volumen y confianza acumulada.
4. Una vez aprobado, el bot de onboarding entrega el "kit de instalación"
   (ver más arriba) -- que ya incluye el ID de Telegram capturado en el
   paso 2, así que el script de instalación de la Pi puede configurar la
   lista de autorizados del bot del cliente sin que nadie vuelva a pedir
   ese dato a mano.
5. El cliente crea su PROPIO bot en BotFather (dato suyo, nunca nuestro,
   igual que hoy) y pega el token cuando el instalador se lo pida --
   ese paso sigue siendo manual a propósito: es la prueba de que el cliente
   controla su propia infraestructura, no algo a automatizar.

Esto no es un sistema nuevo, es un canal nuevo (Telegram) sobre capacidades
que el maestro ya tiene -- mismo principio que las acciones de cliente de
solo lectura de más arriba.

### El bot como acompañante progresivo, no una entrevista larga (investigación 2026-08-29)

El operador plantea que este bot acompañe también la creación de misión y
visión, proyectos, personas, espacios... -- la investigación dice que hacer
esto en una sola entrevista larga en el alta sería un error medible, no solo
una cuestión de estilo: **cada minuto extra en el alta reduce la conversión
de prueba a cliente activo en torno a un 3%**, y el límite recomendado en
2026 es de una o dos preguntas de golpe, nunca cinco temas distintos
seguidos. El patrón que sí funciona (con datos de 2-4x más activación) se
llama "embudo conversacional": capturar la intención en una pregunta abierta,
en las propias palabras del cliente, y dejar que el resto se rellene con el
tiempo, en conversaciones sucesivas -- no en una sola sesión.
Fuentes: [Progressive Profiling](https://userguiding.com/blog/progressive-profiling),
[The Rise of the Conversational Funnel](https://getperspective.ai/blog/the-rise-of-the-conversational-funnel-2026-saas-trend-report).

**Rediseño concreto**: el alta (bot de onboarding) se queda en lo mínimo ya
descrito (nombre + módulos). La misión/visión/proyectos/personas/espacios se
recogen **después**, en el bot ya operativo del propio cliente, de forma
progresiva y oportunista -- mismo mecanismo ya diseñado en "Onboarding
conversacional" (arquitectura, punto 7): una sola pregunta abierta inicial
("¿qué quieres conseguir con Engremiat?"), y a partir de ahí, cada vez que
el cliente mencione un proyecto, una persona o un espacio en una conversación
normal, el bot lo propone como candidato a registrar -- nunca se lo pide de
golpe como cuestionario.

**Misión y visión no necesitan un campo nuevo**: se guardan como un
`DOCUMENTO` vinculado al `CLIENTE` (entidad y tabla ya existentes,
`14_DOCUMENTOS`) -- consistente con "no construir de más" ya aplicado en
todo este documento.

### Aviso de seguridad real para cuando el bot proponga escribir datos (no solo leerlos)

Hasta ahora las acciones de cliente son de solo lectura. En cuanto el bot
proponga crear un `PROYECTO`/`PERSONA`/`RECURSO` a partir de lo que alguien
cuenta por chat, aparece un riesgo real y documentado: **no hay que confiar
en que el propio modelo decida cuándo pedir confirmación** -- un usuario
insistente, o una instrucción escondida en un mensaje, podría convencerlo de
saltarse ese paso. La práctica recomendada es una **puerta determinista, en
código, no en el criterio del modelo**: el bot siempre muestra un resumen de
lo que va a crear y exige una confirmación explícita y literal (p.ej.
responder exactamente `SI, CREAR`) comprobada por el propio código de
`bot-local.mjs`, nunca decidida por el modelo. Ninguna escritura real ocurre
sin ese paso, sin excepción -- ni aunque el mensaje "insista mucho".
Fuente: [Human-in-the-Loop AI: Why "Ask the LLM to Confirm" Isn't Enough](https://dev.to/pavelgj/human-in-the-loop-ai-why-ask-the-llm-to-confirm-isnt-enough-oij).

### Qué decide esto sobre "descargar Engremiat" como producto

No hace falta una imagen de Raspberry Pi OS a medida (como Home Assistant
OS) para empezar -- eso es mucho más caro de mantener y solo compensa con
demanda real de clientes no técnicos. El script de un comando (Docker
Compose) es el punto de partida correcto: mismo principio ya aplicado en
todo este documento -- construir lo mínimo que resuelve la necesidad real
de hoy, no lo máximo que podría hacer falta algún día.

## OpenClaw: qué tomar prestado y qué NO adoptar (investigación 2026-08-29)

OpenClaw ([openclaw/openclaw](https://github.com/openclaw/openclaw), MIT,
creado por Peter Steinberger) es una plataforma de agente IA autoalojado que
se solapa mucho con lo que estamos construyendo: pasarela a 10+ proveedores
(Ollama y Claude incluidos), 23+ canales de mensajería, plugin oficial de
Obsidian con sincronización bidireccional real, y acceso remoto ya resuelto
vía Tailscale + token de pasarela + claves de dispositivo Ed25519.

**Por qué NO se recomienda adoptarla entera**: tiene un historial real de
problemas de seguridad -- 6 CVE publicadas en los dos primeros meses de
2026, incluida una vulnerabilidad de secuestro de WebSocket "zero-click".
Su mercado de skills de comunidad (ClawHub, 13.000+ skills) tiene
**incidentes documentados de skills maliciosas** -- robo de credenciales,
exfiltración de datos, campañas coordinadas de subidas hostiles. Y hay casos
reales de facturas de la API por bucles de agente sin control (>$3.600 en un
mes). Adoptar esto entero, con su mercado abierto, contradice directamente
el eje de soberanía y control que es la base de toda esta propuesta.
Fuentes: [OpenClaw Cost Breakdown 2026](https://trustclawd.com/blog/openclaw-real-cost).

**Qué sí vale la pena tomar prestado, como patrón, sin el ecosistema abierto**:

- **Su modelo de tres tipos de extensión** (Skills -- integraciones en
  lenguaje natural definidas en Markdown; Plugins -- extensiones profundas
  en TypeScript/JavaScript; Webhooks -- endpoints HTTP que otros sistemas
  llaman) es una forma clara de organizar lo que ya tenemos: nuestras
  acciones de cliente (`generar_nota_obsidian`, `listar_incidencias_abiertas`)
  son exactamente "Webhooks" en ese modelo -- no hace falta reinventar la
  taxonomía, solo adoptar el vocabulario.
- **`dmPolicy`**: su propia documentación lo llama "el ajuste de seguridad
  más importante de tu bot de Telegram" -- filtra por ID de usuario quién
  puede hablarle. **Corregido ya en `bot-local.mjs`** (no como propuesta
  futura): sin esta lista, cualquiera que encontrara el bot podía pedir
  `/nota` o `/incidencias` y leer datos reales del cliente. Ahora funciona
  en "fail-closed" -- lista vacía significa que nadie puede hablarle hasta
  que se autorice explícitamente (`TELEGRAM_IDS_AUTORIZADOS`).
- **Su plugin de Obsidian** (sincronización bidireccional real) sigue siendo
  candidato a evaluar para la Fase 1.5 (sincronización de bóveda) -- pero
  aislado, sin pasar por ClawHub ni por el resto de la plataforma, igual que
  se evaluaría cualquier librería de terceros: leyendo su código, no
  instalándolo a ciegas desde un marketplace con historial de paquetes
  hostiles.

**Cómo aplica esto de vuelta a nuestro propio diseño**: LiteLLM ya cubre el
control de gasto que evitaría el escenario de la factura de $3.600 (límites
de gasto de fábrica, ver sección de LiteLLM más arriba) -- pero conviene
fijar también un tope explícito de peticiones/coste por cliente cuando se
active el escalón de Claude, no asumir que "ya lo cubre LiteLLM" sin
comprobarlo con datos reales de la Fase 1.

## Fases propuestas (de más barato/reversible a más comprometido)

1. **Fase 0 (ya hecha)**: TEST-Cliente-2026-08-29 -- Sheet, bot, exportador,
   ciclo agéntico verificado.
2. **Fase 1 -- esta prueba, hardware propio, solo dirección de salida**:
   Pi + SSD alojando LiteLLM como pasarela única; PC con el catálogo de
   modelos locales (Ollama, DeepSeek incluido) registrado en esa pasarela;
   Claude registrado como proveedor de salida únicamente (sin exponer nada a
   internet). Telegram habla solo con LiteLLM, con enrutado automático por
   complejidad por defecto y selección manual (`/modelo`, botones en línea)
   como opción explícita. Prueba también la resiliencia ante cortes de red.
3. **Fase 1.5 -- empaquetado y onboarding real**: kit de instalación generado
   al aprobar el montaje, script de un comando (Docker Compose sobre
   `hwdsl2/self-hosted-ai-stack`) para que el cliente lo levante en su propia
   Pi sin tocar `clasp`/`curl`, acción de escritura acotada (`crear_incidencia`)
   para que pueda crear y hacer seguimiento de proyectos desde el chat, y
   sincronización periódica de la bóveda real a ficheros `.md` en su SSD.
4. **Fase 2 -- dirección de entrada (opcional)**: Custom Connector MCP
   expuesto vía túnel, para que el cliente entre desde su propio chat.
5. **Fase 3 -- personalización real de la bóveda**: plantillas de exportación
   por combinación de módulos, mismo patrón que CAM-0002.
6. **Fase 4 -- asistente conversacional de gestión + onboarding automatizado**.

## Deliberadamente fuera de alcance por ahora

- Multi-tenant real (varios clientes compartiendo una misma Pi/PC).
- GraphRAG completo estilo Microsoft.
- La dirección de entrada (Custom Connector) hasta no tener la Fase 1 probada.
- Cualquier automatización que escriba en el Sheet del cliente sin
  verificación humana/Ejecutor de por medio.

## Pendiente de concretar

- Modelo de coste real para un futuro cliente (hardware propio vs alquilado) --
  se abordará con los datos de gasto que LiteLLM ya registra de fábrica una
  vez arranque la Fase 1, no hace falta instrumentarlo aparte.
- Qué modelos locales concretos se registran en LiteLLM y para qué propósito
  cada uno (catálogo a decidir con los ya probados por el operador).
- Reglas exactas del enrutado automático por complejidad (umbral sencillo/
  complejo) -- empezar con la configuración por defecto de RouteLLM y
  ajustar con datos reales de uso.
- Mecanismo de túnel definitivo, cuando se llegue a la Fase 2.

## Bitácora

- **2026-08-29**: apertura del documento tras el piloto TEST-Cliente-2026-08-29
  (PRO-0020). Registrado como INC-0066/PRO-0022 (CAM-0004).
- **2026-08-29 (revisión)**: el operador aporta hardware real ya disponible
  (Raspberry Pi + SSD externo) y reformula el eje central: soberanía de
  datos/infraestructura como producto, no detalle técnico. Se separan las
  dos direcciones de integración con Claude (salida vs entrada) y se fija la
  Fase 1 en la dirección de salida únicamente. Se fusiona con
  `PROPUESTA_PRODUCTO_LOCAL_INDEPENDIENTE.md` (PRO-0018).
- **2026-08-29 (2ª revisión)**: el operador aclara que hay varios modelos
  locales ya probados (DeepSeek el más potente, no un nivel aparte) y que la
  interfaz (Telegram) debe poder mandar cada mensaje a Claude o a la IA
  local según haga falta. Se sustituye la cadena de tres niveles por un
  único mando (LiteLLM) con varios modelos registrados, enrutado automático
  por complejidad (RouteLLM) como comportamiento por defecto, y selección
  manual desde Telegram como opción explícita.
- **2026-08-29 (arranque Fase 1, primer paso)**: LiteLLM instalado y probado
  en el PC del operador (`G:\Mi unidad\DEVS\engremiat-litellm\`), con los
  tres modelos locales ya existentes registrados (`qwen3:8b`, `qwen3:14b`,
  `devstral-dev`) y probados con éxito a través de la misma puerta
  (`localhost:4000`). El modelo `claude` queda registrado y falla, como se
  esperaba, solo por falta de `ANTHROPIC_API_KEY` -- credencial pendiente de
  que el operador la cree en console.anthropic.com y la configure él mismo.
  Pendiente siguiente: decidir si el bot de Telegram (hoy en Apps Script)
  pasa a hablar con esta pasarela directamente o si su lógica se traslada a
  la Pi -- ver nota de arquitectura en la conversación, no resuelto aún.
- **2026-08-29 (decisión de arquitectura + bot fuera de Apps Script)**: se
  descarta cualquier puente a "Claude en la web" vía suscripción (prohibido
  por Anthropic desde abril 2026, riesgo de baneo). Se decide sacar la
  lógica del bot de Apps Script: `bot-local.mjs` (misma carpeta) sustituye
  al webhook de Apps Script para el bot de TEST-Cliente-2026-08-29, usando
  long polling (cero exposición, ni siquiera controlada) en vez de webhook.
  Probado en vivo con éxito. Se añaden dos acciones de solo lectura a la
  librería CORE compartida (`generar_nota_obsidian`, `listar_incidencias_abiertas`,
  v178) para que el bot responda con datos reales -- deliberadamente solo en
  la librería, nunca en el `WebhookTelegramService.js` del maestro (que
  tiene acciones administrativas sensibles). Bug real encontrado: los
  despliegues web de Apps Script quedan fijados a una versión, actualizar
  el contenido no basta -- hace falta `clasp deploy -i` explícito tras cada
  cambio de librería que deba llegar a un cliente ya desplegado.
- **2026-08-29 (del piloto manual al autoservicio)**: se diseña el flujo
  completo de onboarding para que un cliente real pase de "solicitud de
  montaje" a "bot+Sheet+bóveda funcionando en su propia Pi" sin que nadie
  ejecute `clasp`/`curl` a mano -- kit de instalación generado al aprobar el
  montaje, script de un comando sobre Docker Compose (reutilizando
  `hwdsl2/self-hosted-ai-stack` en vez de construir desde cero), aviso de
  fiabilidad real de la Pi 5 (bug de kernel panic con Ollama a 4 núcleos),
  sincronización periódica a ficheros `.md` reales, y una acción de
  escritura acotada (`crear_incidencia`) para que el cliente pueda crear y
  seguir proyectos desde el propio chat, no solo consultarlos.
- **2026-08-29 (caso de uso: investigación profunda + plan automático)**: se
  valida en lenguaje no técnico un caso de uso nuevo -- el cliente cuenta un
  objetivo real ("quiero montar un huerto", "quiero un gallinero"), el
  sistema investiga en internet (calendarios, materiales, buenas prácticas),
  propone una campaña con sus proyectos/tareas ya organizados, acompaña con
  fotos/checklists vinculados como `DOCUMENTO`, y al final entrega un manual
  final (reutilizando el exportador Obsidian ya construido). Aviso explícito
  de seguridad para casos con impacto real (p.ej. recetas de pienso animal):
  la IA propone, un humano confirma antes de que se convierta en una acción
  real -- misma puerta determinista ya fijada más arriba para escrituras.
  **Prueba real hecha, no solo hablada**: `CAM-0005`/`PRO-0023` (albahaca en
  maceta) -- investigación web real sobre cultivo, y el plan generado
  reconoce explícitamente que finales de agosto no es la época ideal de
  siembra en exterior (en vez de dar un plan genérico), proponiendo un ciclo
  corto protegido como piloto y dejando la campaña de exterior para la
  próxima primavera. Primera demostración de punta a punta de la capacidad.
- **2026-08-29 (segunda prueba, más compleja: construcción)**: `PRO-0024`
  (yurta de 6m de diámetro) -- mismo caso de uso aplicado a un proyecto de
  construcción real, con lista de materiales, cantidades razonadas, y una
  estimación de coste de autoconstrucción (1.500-4.700€, rango amplio,
  explícitamente aproximado) junto a una referencia real de mercado (kit
  profesional de 6,1m, Celtic Yurts, 13.800€ estructura + 4.500€ plataforma).
  Fotos de referencia enlazadas desde Wikimedia Commons (con licencia
  verificable), no descargadas ni redistribuidas sin comprobar cada licencia.
  Límites del informe declarados explícitamente (cantidades no calculadas
  con herramienta de corte real, precios sin cotización de proveedor) --
  mismo principio de honestidad que en la prueba de la albahaca: mejor decir
  "esto es aproximado y por qué" que fingir precisión que no existe.
  `CAM-0005` renombrada de "Huerto/jardín asistido" a "Investigación y
  planificación asistida" al dejar de ser solo un caso de jardinería.
- **2026-08-29 (bug real encontrado desde la UI del propio Sheet)**: el
  operador detectó, mirando el panel "Gestión de campaña", que `CAM-0004` y
  `CAM-0005` no aparecían en el desplegable de campañas. Causa: al crearlas
  por API (no por `insertarRegistroTransaccional`) se usó una fila más corta
  de lo debido, dejando `ACTIVO` en blanco en vez de `"SÍ"` -- y
  `obtenerOpcionesCampanasActivas` filtra por `ACTIVO='SÍ'`. No era un
  filtro de "piloto/auditoría" (`NIVEL_DATO`) como se pensó al principio,
  era un campo de sistema mal escrito. Corregido escribiendo `ACTIVO="SÍ"`
  (y el resto de campos de auditoría: fechas/autor) en ambas filas.
  Lección para cualquier escritura futura por API cruda (sin pasar por
  `insertarRegistroTransaccional`): **hay que rellenar la fila completa
  hasta `ACTIVO`, no solo hasta el último campo que parezca relevante** --
  un campo de sistema olvidado deja el registro invisible para el resto del
  sistema sin ningún error visible.
- **2026-08-29 (caso de uso: vídeo/documento -> curso de taller, tercera
  prueba real)**: `PRO-0025` -- tutorial real de YouTube (Manimenos
  Manualidades, amigurumi de Stitch a crochet) convertido en 10 tareas de
  taller, cada una enlazada al minuto exacto del vídeo original. Confirmado
  en la práctica: `yt-dlp --skip-download --write-auto-sub --write-description`
  extrae subtítulos y descripción en texto sin tocar el vídeo -- el propio
  vídeo ya traía capítulos y lista de materiales puestos por la creadora,
  así que no hizo falta inventar ni segmentar nada, solo reutilizar la
  estructura real. Ningún fotograma, clip ni fragmento de transcripción
  literal se redistribuyó -- el informe final (`DOC-0002`) cita la fuente
  explícitamente y enlaza, no copia. Aviso para casos futuros: un vídeo sin
  capítulos propios exigiría un paso adicional de segmentación antes de
  llegar a esta misma estructura -- no asumir que todos los vídeos vienen
  tan bien organizados como este.
- **2026-08-29 (caso difícil confirmado: análisis multimodal real audio+vídeo)**:
  `PRO-0026` -- vídeo real sin capítulos ni lista de materiales (canal Los
  Elegi2, construcción de un muro de bahareque/barro). Se combinó la
  transcripción con fotogramas reales extraídos a intervalos (`ffmpeg`,
  copia de trabajo temporal en 240p, borrada tras el análisis, nunca
  redistribuida) -- exactamente el análisis "lo que ve + lo que oye" que
  pidió el operador. Resultado: 3 de los 6 pasos reconstruidos (amasar el
  barro con los pies, la selección de tierra en el talud, las grietas de
  secado del muro terminado) **no se habrían capturado solo con el audio**
  -- confirma que el análisis visual aporta valor real, no es redundante
  con la transcripción. Un paso (aplicar el barro sobre el armazón) se
  marcó explícitamente como **inferido, no observado** -- honestidad sobre
  el límite del método (7 fotogramas puntuales, no el vídeo completo).

## Documentación presentable: primer informe real + workers locales de generación (2026-08-30)

Objetivo de esta ronda: pasar de "datos en el Sheet" a un documento presentable de verdad para arrancar un proyecto de manualidades en el taller, y probar en la práctica los workers locales de imagen/infografía/PDF -- con la GPU real del operador (RTX 4060 Ti, 16GB) y **descubriendo por el camino que ya existían imágenes Docker preparadas** (n8n, Open WebUI, ngrok) sin haberlas usado todavía -- infraestructura de la que partir, no que construir desde cero.

### Resultados reales de esta ronda

- **Informe en PDF**: generado a partir de `DOC-0002` (amigurumi) con HTML/CSS propio +
  **Microsoft Edge en modo headless** (`msedge --headless --print-to-pdf`) -- ya viene
  con Windows, no hizo falta instalar LaTeX ni ninguna librería pesada. `weasyprint`
  (alternativa Python) se probó primero y falló por dependencias nativas de Windows
  (GTK/Pango) -- Edge headless es la vía más simple en este sistema operativo concreto.
- **Infografía real, sin generación de imagen libre**: el worker local (`qwen3:8b`, vía
  LiteLLM) agrupó los 10 pasos del amigurumi en 3 fases lógicas (Preparación, Piezas,
  Acabado) -- contenido real, no inventado por una plantilla fija. El renderizado final
  (SVG → PNG) usó una plantilla propia, no un modelo de imagen -- confirma la
  recomendación ya hecha antes: dato real + plantilla es más fiable que generación libre
  para este tipo de material.
- **Generación de imagen local**: instalación en curso (`torch`+`diffusers`, ~2.5GB) al
  cierre de esta ronda -- pendiente de completar y probar con un prompt genérico (no
  "Stitch" -- ver aviso legal siguiente).

### Aviso legal nuevo, específico de este caso (no cubierto antes)

El amigurumi de esta prueba es **Stitch, personaje registrado de Disney**. Aquí hay un
matiz que no había salido hasta ahora: **generar una imagen propia por IA del personaje
no elimina el problema de marca/derecho de autor** -- el personaje en sí está protegido,
no solo el vídeo o las fotos concretas de terceros. Es distinto de dibujar tu propia
versión genérica de "un muñeco amigurumi azul tipo alien". Recomendación: para
personajes con licencia (Stitch, Pokémon, etc.), la documentación interna de taller
puede describir y enlazar sin problema (como ya hace este informe), pero cualquier
imagen final -- generada o no -- que represente al personaje reconocible sigue
necesitando la misma cautela que una foto. Para el material gráfico propio (infografías,
ilustraciones de apoyo), mejor centrarse en diagramas de proceso -- como la infografía de
fases ya generada -- que no dependen de reproducir un personaje con marca.

### Hacia un ciclo tipo "Ejecutor" para este pipeline (diseño, no construido todavía)

El operador imagina un ciclo repetible, igual que el que ya usa `92_BUS_TRABAJO` para
código. Con el descubrimiento de que **n8n ya está preparado** (imagen Docker
descargada, sin usar todavía), la recomendación cambia: no construir un script a medida
(`bus_trabajo.mjs`-style) para este pipeline -- usar n8n como orquestador, ya pensado
para exactamente este tipo de flujo multi-paso, con interfaz visual para depurarlo.

Diseño propuesto del flujo (mismo principio de puerta humana ya fijado en todo el
documento -- nada se publica al taller sin revisión):

1. **Disparador**: nueva fila en una cola (mismo patrón que `92_BUS_TRABAJO`) con la URL
   del vídeo/documento y el tipo de proyecto deseado.
2. **Extracción**: `yt-dlp` saca transcripción + capítulos + descripción (texto, nunca el
   vídeo en sí, salvo copia de trabajo temporal para el paso 3).
3. **Análisis visual, solo si hace falta** (vídeo sin capítulos propios, como el caso del
   bahareque): fotogramas a intervalos, revisados por un modelo -- aquí sigue haciendo
   falta Claude para el razonamiento visual complejo hasta que un modelo local
   multimodal (tipo LLaVA vía Ollama) esté probado y validado para este uso.
4. **Estructuración**: el worker local convierte la transcripción/capítulos en
   `PROCESO`/`TAREA`/`MATERIAL`, escritos vía las acciones de cliente ya existentes en el
   webhook (mismo mecanismo que hoy, no uno nuevo).
5. **Generación de material gráfico**: infografía (worker local + plantilla, como se
   acaba de probar) y, cuando esté lista, ilustraciones propias para casos sin marca
   registrada de por medio.
6. **Informe final en PDF** (Edge headless, ya probado).
7. **Puerta humana obligatoria**: el resultado queda en estado "lista para revisión"
   (mismo estado que ya usa `92_BUS_TRABAJO` para código) -- nadie del taller ve el
   material hasta que una persona lo aprueba, exactamente igual que una `TAREA` de
   código no se da por buena sin verificación.

Pendiente de construir, no de diseñar: el workflow de n8n en sí (nodo por paso), y
decidir qué modelo multimodal local usar para el paso 3 antes de depender de Claude ahí
de forma permanente -- por coste y por soberanía, igual que el resto de esta propuesta.

## De "qué se hace" a "cuánto se hace": refinar el nivel de detalle del patrón (2026-08-30)

El operador señaló un límite real de la primera versión del manual del amigurumi:
saber que un paso es "tejer el cuerpo" no sirve para tejerlo -- un patrón de
crochet real necesita el **conteo de puntos y vueltas** de cada pieza. Se hizo una
segunda pasada sobre la transcripción completa (no solo los capítulos) para extraer
esos números.

**Resultado real**: se recuperaron vueltas clave verificadas para cuerpo (anillo
mágico → aumentos hasta 36 puntos → disminuciones hasta 18), brazos (patrón completo,
12 puntos, una pieza que se repite para la segunda), pies (patrón completo, técnica de
tejer "por la hebra interna" dejando la externa libre), uñas (técnica confirmada: se
bordan a crochet sobre esa hebra libre, **no son de fieltro** como decía la lista de
materiales original) y cabeza (hasta 42 puntos, la pieza más grande). Actualizado en
`TAR-0009` a `TAR-0016` y en `DOC-0002` (nueva versión del PDF).

**Honestidad sobre el límite alcanzado, otra vez**: no todo quedó al mismo nivel --
la secuencia exacta de disminuciones vuelta-a-vuelta en cuerpo y cabeza, y el patrón
completo de la nariz, no se verificaron con el mismo detalle (requeriría escuchar el
tramo completo, no solo localizar líneas con números). El manual marca explícitamente
qué pasos están "verificados" y cuáles solo tienen "hitos" -- en los segundos, se avisa
de mirar el vídeo en paralelo, no confiar solo en el documento.

**Corrección real encontrada de paso**: la lista de materiales original incluía
fieltro para las uñas -- la transcripción reveló que en realidad se bordan a crochet
directamente sobre la pieza del pie. Un ejemplo real de por qué la verificación
técnica profunda importa: una lista de materiales superficialmente correcta puede
llevar a comprar/preparar algo que no hace falta.

## Generación de imagen local: primer intento, primer tropiezo real de infraestructura (2026-08-30)

Al instalar `torch`+`diffusers` para probar generación de imagen local (GPU real:
RTX 4060 Ti, 16GB), un error de `pip` clásico hizo que se instalara por accidente la
versión **CPU** de `torch` en vez de la versión CUDA -- mezclar `--index-url` (para
la rueda de PyTorch) con `--extra-index-url` (para el resto de paquetes de PyPI) deja
que el resolutor de pip elija una versión más "nueva" del índice equivocado si no se
fija la versión exacta. Corrección: instalar `torch` con versión exacta fijada
(`torch==2.5.1+cu121`) en un paso separado, antes de instalar el resto de paquetes.
Lección para el instalador de la Fase 1.5 (Docker Compose): fijar versiones exactas
de cada pieza, no dejar que el resolutor de dependencias decida -- mismo principio de
fiabilidad que ya se recomendó para los contenedores de Ollama/LiteLLM.

**Resultado final, ya con la versión CUDA correcta**: primera imagen generada
localmente con éxito (`stabilityai/sd-turbo`, RTX 4060 Ti, **menos de 1 segundo de
inferencia** una vez cargado el modelo). Prompt deliberadamente genérico ("amigurumi
azul tipo alien, orejas grandes, ojos redondos") -- nunca se pidió "Stitch" ni
personajes con marca, coherente con el aviso legal de esta misma sección. Confirma
que la GPU disponible es más que suficiente para este uso -- el cuello de botella
real de esta ronda fue de instalación (SSL/certificados, mezcla de índices de pip),
no de cómputo.

**Pieza final añadida al catálogo de herramientas locales confirmadas**: además de
`ffmpeg`, `yt-dlp`, Pandoc y Edge headless, ahora también `torch`+`diffusers` para
generación de imagen -- todo corriendo en el mismo PC que hará de "worker local" en
la arquitectura de esta propuesta.

## Estándar visual: img2img sobre un fotograma real, no generación desde cero (2026-08-30)

El operador señaló, con razón, que una imagen generada desde texto no se parece a la
realidad del proyecto concreto. Mejora aplicada: en vez de `text2img` (prompt →
imagen), usar **`img2img`** -- se parte de un fotograma real ya extraído (mismo
mecanismo que el análisis visual de esta propuesta), y se transforma manteniendo la
composición y estructura reales, repintado en un estilo propio.

**Corrección de rumbo sobre el estilo concreto**: se descarta explícitamente imitar
el estilo de un estudio de animación conocido (el propio estudio se ha posicionado
públicamente en contra de que la IA imite su look) -- en su lugar, un estilo propio y
neutro: *"ilustración de manual, textura de acuarela suave, paleta cálida, sin
fotorrealismo, sin texto"*. Mismo resultado deseado (calidez, trazo dibujado) sin
apropiarse de la identidad visual de terceros que ya han manifestado su rechazo a
este uso.

**Probado en vivo con éxito** sobre un fotograma real del muro de bahareque (no el
del amigurumi, deliberadamente -- ver más abajo): 2 pasos de inferencia, <1 segundo,
`strength=0.55` (conserva la composición real -- tejado, muro, árboles -- mientras
cambia el acabado visual). Mismo modelo ya instalado (`sd-turbo`), sin coste adicional
de infraestructura.

**Por qué el fotograma de prueba fue el muro y no el amigurumi**: hacer `img2img`
sobre el fotograma real de Stitch habría agravado el problema de marca ya señalado
antes, no evitado -- el resultado seguiría siendo reconociblemente el personaje con
licencia, solo que en otro estilo. Regla para el estándar: `img2img` sobre un
fotograma real es la vía por defecto para proyectos sin personajes con marca; para
proyectos con personaje con licencia, seguir limitándose a texto+enlaces (como ya
hace el manual del amigurumi), nunca generar ninguna representación visual del
personaje, estilizada o no.

### El estándar, en concreto

| Material | Método | Herramienta |
|---|---|---|
| Imagen de proyecto | `img2img` sobre 1 fotograma real representativo, estilo de casa fijo (ver prompt arriba) | `sd-turbo` (local, GPU) |
| Infografía | Datos reales (worker local) + plantilla SVG propia -- nunca generación de imagen libre | LiteLLM (texto) + plantilla SVG/Inkscape |
| Informe final | Plantilla HTML/CSS propia (ya construida) → PDF | Edge headless |
| Registro | Cada material generado se registra como un `DOCUMENTO` más, vinculado al `PROYECTO` -- mismo patrón ya usado para `DOC-0001`/`DOC-0002`/`DOC-0003` | Sheet (webhook ya existente) |

## Confirmación: sí, esto se convierte en un ciclo tipo Ejecutor (2026-08-30)

Sin cambios de diseño respecto a lo ya propuesto (ver sección de n8n más arriba) --
esta ronda solo confirma que las piezas necesarias ya funcionan por separado y con
éxito: extracción (`yt-dlp`/`ffmpeg`), estructuración (worker local vía LiteLLM),
imagen (`img2img`, ahora con estilo propio definido), infografía (plantilla + datos),
informe (Edge headless). Lo único que falta es montar el flujo en n8n -- no hay
ningún obstáculo técnico nuevo que resolver antes de eso.

## "Cronista": el ciclo montado y probado en vivo (2026-08-30)

Nombre elegido para este ciclo: **Cronista** -- el que convierte lo ya trabajado
(documentos, procesos, tareas de un proyecto) en algo presentable, igual que
"Ejecutor" es el que trabaja el código. Montado en n8n, no solo diseñado.

**Descubrimiento importante al montarlo**: ya existía un stack `engremiat-*`
completo corriendo en Docker desde hace semanas -- n8n, ngrok, Open WebUI, Baserow,
Typebot -- con un ecosistema real de workflows activos para "Taller Trobaila"
(aprobación humana, Telegram, notificaciones, informes trimestrales). Cronista se
construyó reutilizando sus credenciales ya configuradas (cuenta de servicio de
Google, patrón de credencial de cabecera HTTP) en vez de crear infraestructura
paralela.

### Diseño del flujo

`Webhook (POST /webhook/cronista, {proyecto_id})` → leer `PROYECTO` (`02_PROYECTOS`)
→ leer sus `DOCUMENTOS` vinculados (`14_DOCUMENTOS`, filtro `ENTIDAD_ID`) → leer
`RECURSOS` disponibles (`23_RECURSO`, "espacios" del taller) → combinar todo en un
solo payload real → **worker local** (`local-potente`/qwen3:14b, vía LiteLLM,
`host.docker.internal:4000` desde dentro del contenedor) redacta un resumen
presentable (título, resumen, puntos clave, recursos relevantes) → **puerta humana**
(nodo de control, sin escritura automática todavía -- ver más abajo).

**Probado en vivo con dos proyectos reales, con éxito**: `PRO-0025` (amigurumi) y
`PRO-0026` (bahareque). En ambos casos el resumen generado es fiel a los datos
reales -- incluye la corrección real de materiales del amigurumi, y reproduce
correctamente los avisos de honestidad del informe del bahareque (paso inferido,
límite de 7 fotogramas) en vez de presentarlos con falsa confianza.

### Dos bugs reales encontrados y corregidos al montarlo (quedan documentados para la próxima vez)

1. **Permisos de Drive**: la cuenta de servicio de n8n nunca había sido compartida
   con el Sheet de Gestor de Proyectos (solo tenía acceso a un Sheet de pruebas
   público) -- 403 al leer. Resuelto compartiendo la carpeta raíz `engremiat.claude`
   completa con esa cuenta -- Google Drive propaga el acceso a todo lo que ya vive
   dentro, no hace falta compartir archivo por archivo. Nota real: esto cubre lo que
   ya está dentro de la carpeta -- un Sheet de cliente nuevo se crea primero en la
   raíz del Drive personal y se mueve después a su carpeta; mientras acabe dentro
   del árbol compartido, hereda el acceso igual.
2. **Ramas paralelas sin sincronizar**: conectar tres lecturas de Sheet en paralelo
   a un mismo nodo de código no garantiza que las tres hayan terminado antes de que
   el código se ejecute -- n8n dispara el nodo en cuanto llega la primera rama.
   Corregido encadenando las lecturas en secuencia. Un `RECURSO` vacío (el Sheet no
   tiene ese módulo instalado) también cortaba la cadena -- corregido con
   `alwaysOutputData` y un código defensivo (`try/catch`) en vez de asumir que
   siempre habrá datos.

### Pendiente, deliberadamente no resuelto todavía

- **Escritura de vuelta al Sheet**: el flujo termina en un nodo de control ("Puerta
  humana: revisar antes de guardar"), sin escritura automática de un nuevo
  `DOCUMENTO` -- mismo principio de esta propuesta desde el principio: nada se
  escribe solo hasta confirmar el formato exacto de salida con datos reales
  (ya hecho en esta ronda), no antes.
- **Renderizado final a PDF/imagen**: Cronista hoy entrega el contenido estructurado
  (JSON), no el PDF/infografía terminados -- esos pasos corren hoy en el PC anfitrión
  (Edge headless, `img2img`), fuera del contenedor de n8n. Conectar ambos mundos
  (que n8n dispare esos scripts del host) es el siguiente paso, no resuelto en esta
  ronda.

## Conectado: n8n ya dispara el renderizado del host (2026-08-30)

Se cierra el pendiente anterior. Nueva pieza: **`render-worker.py`** (FastAPI,
`G:\Mi unidad\DEVS\engremiat-litellm\render-worker.py`, puerto 8001 en el host) --
mismo patrón exacto que LiteLLM (`host.docker.internal`, nunca expuesto fuera del
PC). Carga el modelo de imagen una sola vez al arrancar (no en cada petición) y
expone:

- `POST /pdf` -- recibe HTML, ejecuta Edge headless, devuelve el PDF ya generado.
- `POST /imagen/texto` y `POST /imagen/estilizar` -- generación e `img2img`, mismo
  modelo (`sd-turbo`) ya probado antes, ahora como servicio persistente en vez de
  un script suelto.

Cronista se amplió con dos nodos nuevos (construir el HTML del informe a partir del
JSON del worker local, y llamar a `render-worker`), y el propio webhook de n8n se
configuró para devolver el binario del PDF como respuesta -- no solo el JSON
intermedio. **Probado en vivo, de punta a punta, con los dos proyectos reales**:
la llamada al webhook devuelve directamente un PDF descargable
(`content-type: application/pdf`, ~33KB), generado sin ninguna intervención manual
entre el disparo y el resultado.

**Detalle técnico real que costó encontrar**: por defecto, el modo de respuesta
`lastNode` del nodo Webhook de n8n serializa el último dato JSON visto, no el
binario adjunto de un nodo HTTP -- hay que decirle explícitamente que responda con
`firstEntryBinary` apuntando a la propiedad binaria correcta (`data`, el nombre por
defecto de n8n para la respuesta de un `httpRequest` en modo fichero).

**Pendiente real, ya acotado, no resuelto todavía**: la infografía (SVG/plantilla)
y la escritura del `DOCUMENTO` de vuelta al Sheet -- mismo patrón ya disponible
(`render-worker` puede exponer un endpoint más, la escritura reutiliza las acciones
de cliente ya existentes en el webhook de Apps Script), solo falta cablearlo.

## Cerrado: infografía dinámica y registro de imágenes por tarea (2026-08-30)

Se cierra el pendiente anterior. `render-worker.py` gana dos endpoints nuevos:

- **`POST /infografia`** -- recibe `{titulo, fases: [{nombre, pasos}]}` y construye
  un SVG paramétrico (círculos numerados + texto envuelto a ancho fijo), lo
  convierte a PNG con Inkscape en modo headless. Ya no es una plantilla fija
  hardcodeada como en la primera prueba con el amigurumi -- cualquier flujo puede
  mandarle su propia lista de fases. Probado con datos reales del proceso
  `PCS-0012` (preparación / cuerpo y cabeza / acabado), PNG de 49KB, correcto a la
  primera.
- **`POST /fotograma-estilizado`** -- recibe `{video_url, timestamp_segundos,
  prompt, ruta_guardado?}`. Descarga el video en baja resolución UNA vez (cache en
  disco por ID de video, nunca se redistribuye), extrae con `ffmpeg` el fotograma
  exacto del segundo indicado, lo pasa por el pipeline `img2img` ya existente y
  devuelve el PNG resultante. Si se indica `ruta_guardado`, además lo escribe en esa
  ruta del host (pensado para guardar directamente dentro de una carpeta de Drive
  sincronizada localmente -- ver más abajo).

**Segmentación de tutorial → imagen registrada por tarea, de punta a punta**: se
descubrió que cada `TAREA` del proceso `PCS-0012` (amigurumi) ya llevaba su propio
timestamp de video incrustado en `DESCRIPCION` (ej. `...Video:
https://youtu.be/DDzRMern12c?t=115`), puesto ahí en la ronda anterior sin pensar
todavía en este uso. Nuevo workflow n8n **"Cronista de Tareas - imagenes por
tarea"** (id `GOIMqlw0QKC1xgk8`, webhook `POST /webhook/cronista-tareas`, body
`{proceso_id}`): lee las `TAREA` del proceso, extrae el timestamp de cada una por
regex, llama a `/fotograma-estilizado` una vez por tarea, y añade una fila en
`14_DOCUMENTOS` por cada imagen generada (`ENTIDAD_TIPO=Tarea`,
`ENTIDAD_ID=<TAR-ID>`, `TIPO_DOCUMENTO=Imagen`). **Probado con éxito de punta a
punta contra los 10 pasos reales del amigurumi** (`TAR-0008` a `TAR-0017`): 10
imágenes generadas, 10 filas `DOCUMENTO` (`DOC-0004` a `DOC-0013`) escritas con los
datos correctos.

**Decisión de arquitectura -- por qué NO se sube la imagen vía la API de Drive**:
el primer intento usó el nodo `Google Drive` de n8n con la misma cuenta de
servicio ya usada para Sheets, y falló con `403 storageQuotaExceeded`. Es una
limitación real y conocida de Google: una cuenta de servicio no tiene cuota de
almacenamiento propia y no puede crear archivos nuevos en el "Mi unidad" de un
usuario normal (solo podría en una Unidad Compartida, que requiere Google
Workspace -- no es el caso de esta cuenta personal). Solución aplicada: puesto que
este mismo PC ya tiene la carpeta `engremiat.claude` sincronizada localmente vía
Google Drive para escritorio (`G:\Mi unidad\engremiat.claude\...`), `render-worker`
escribe el PNG directamente en esa ruta local (parámetro `ruta_guardado`) y Drive
sincroniza el archivo a la nube por su cuenta, sin que ninguna cuenta de servicio
necesite tocar la API de Drive. Carpeta destino creada para esto: `Documentos
generados - Cronista` dentro de `gestordeproyectos.claude`
(id `16c1_cxgCkhp_XQcELAY5_yd8tHLe95PA`). La fila `DOCUMENTO` queda con `URL` vacía
(igual que otros documentos ya existentes en el Sheet) y la ruta exacta anotada en
`DESCRIPCION` -- **pendiente real, no resuelto**: obtener el enlace real de Drive
del archivo ya sincronizado (requeriría una segunda pasada con la cuenta personal,
no la de servicio, para leer el `fileId` tras la sincronización).

**Bug real, causa raíz encontrada y corregida (actualizado 2026-08-30, la primera
hipótesis era incorrecta)**: la primera ejecución completa procesó las 10 tareas
reales varias veces seguidas (llegó a multiplicar hasta por 13, 130 filas
`DOCUMENTO` en una sola ejecución). La sospecha inicial fue el patrón de bucle de
`SplitInBatches` -- se probaron tres arreglos distintos sobre esa hipótesis
(conectar su salida "done", sustituirlo por un nodo Code con `fetch()`, sustituirlo
por un nodo Code con `$helpers.httpRequest()`) y **el duplicado seguía
ocurriendo incluso sin ningún nodo de bucle en el diseño**, lo que descartó esa
hipótesis del todo. La causa real: el nodo `Leer TAREAS del proceso` estaba
encadenado DESPUÉS de `Leer DOCUMENTOS existentes` (13 filas reales) -- en n8n,
un nodo estándar se ejecuta una vez POR CADA ITEM que recibe de entrada, así que
`Leer TAREAS del proceso` se re-ejecutaba 13 veces (una por cada fila de
`DOCUMENTOS`), devolviendo sus 10 filas reales cada vez -- 13×10=130. Nada que ver
con bucles. **Corregido** poniendo ambas lecturas de Sheets en paralelo (las dos
cuelgan directamente de `Entrada: PROCESO_ID`, que tiene un solo item) en vez de
encadenarlas; el nodo de preparación sigue leyendo `Leer DOCUMENTOS existentes`
por referencia con `$('Leer DOCUMENTOS existentes').all()` aunque ya no esté en
su cadena de entrada directa. **Verificado limpio con una ejecución final**:
recuento de items confirmado en 10 en cada nodo de la cadena, 10 filas
`DOCUMENTO` correctas y sin duplicar -- luego borradas por ser de prueba
(quedan `DOC-0004`-`DOC-0013` como las reales, generadas en la ronda anterior).

**Lección general**: encadenar una lectura de Sheets con N filas justo por
delante de otra lectura la multiplica por N, aunque la segunda lectura no
dependa realmente de los datos de la primera. La regla de "encadenar en
secuencia" documentada más arriba (para el Cronista original) sigue siendo
correcta cuando el nodo siguiente necesita AMBAS ramas como entrada directa --
pero si solo necesita una rama como entrada y consulta la otra por nombre
(`$('Nombre del nodo')`), esa otra rama debe quedar en paralelo, nunca por
delante.

**Cómo aplicar en general**: el patrón "extraer fotograma real → transformarlo con
`img2img` → registrarlo como `DOCUMENTO` vinculado a la entidad exacta (`Tarea`,
`Proyecto`, etc.)" es ahora reutilizable para cualquier video con timestamps ya
anotados en sus tareas -- no hace falta repetir el trabajo de análisis de video
para reutilizar la generación de imagen.

## Propuesta: "Oportunidad" -- un tercer ciclo, hermano de Ejecutor y Cronista (2026-08-30)

### El salto que pide el operador

Hasta ahora, Ejecutor cierra código y Cronista convierte datos reales en
documentación presentable -- ambos actúan sobre trabajo que **ya existe** (un
proyecto, un video, un dato del Sheet). La pregunta nueva es distinta: ¿puede el
mismo patrón (ciclo programado, lectura de datos reales, worker local, puerta
humana, salida en el Sheet) **encontrar trabajo que todavía no existe** -- un
cliente potencial, una subvención a la que se puede optar, una organización a la
que ofrecer o pedir voluntariado técnico -- y dejarlo ya elaborado, listo para que
el operador solo tenga que decidir sí o no?

Eso es "Oportunidad": no una herramienta nueva, sino la **tercera aplicación del
mismo motor** (LiteLLM + Sheet + render-worker + puerta humana) a un problema
distinto: en vez de "documentar lo que hicimos", "detectar y preparar lo que
podríamos hacer a continuación".

### Qué existe ya en el mercado para cada pieza (para no reinventar, y para saber
qué grado de ambición es razonable)

- **Detección de oportunidad + perfil ideal de cliente (ICP)**: las herramientas de
  prospección con IA (Salesforce Agentforce, Apollo, Artisan, ZoomInfo,
  PhantomBuster) codifican un "perfil ideal" con tres tipos de señal --
  firmográfica (tamaño, sector, geografía), tecnográfica (qué usa ya, qué podría
  estar sustituyendo) y de comportamiento (contrataciones, cambios recientes) -- y
  puntúan cada cuenta nueva contra ese perfil antes de gastar tiempo humano en
  ella.
- **Demo/propuesta personalizada por prospecto**: plataformas como Walnut y
  Demostack generan automáticamente una demo distinta para cada prospecto
  (ajustando qué se muestra según su sector/rol), y miden qué parte de la demo
  mira cada uno para afinar la siguiente. Herramientas de ABM (Tofu y similares)
  van un paso más allá y generan directamente una landing page HTML propia por
  cuenta objetivo, con su lenguaje y su caso de uso.
- **Matching y redacción de subvenciones**: plataformas como Instrumentl (450.000+
  perfiles de financiadores) o Fundsprout (275.000+ convocatorias activas)
  analizan la misión y capacidad de una organización y devuelven una lista
  puntuada de convocatorias que encajan, con un primer borrador de propuesta ya
  generado -- nunca envían nada solas.
- **Voluntariado técnico por habilidades**: Catchafire hace de intermediario --
  una organización publica una necesidad concreta (diseño, IT, comunicación) y el
  sistema empareja por habilidad, experiencia y valoraciones previas, con un
  tiempo medio de match de 5 días. El patrón de fondo es el mismo: **necesidad
  descrita + perfil de quien puede cubrirla + un match automático**, no una
  conversación de venta.

La conclusión práctica: el "sistema encuentra y elabora la oportunidad, la persona
decide y firma" **ya es el estándar del sector** en los tres frentes (venta,
subvención, voluntariado) -- Engremiat no está inventando el concepto, está
uniendo las tres piezas bajo un único motor que el operador ya controla y aloja
él mismo, en vez de pagar tres SaaS distintos que además se quedan con el dato.

### Diseño propuesto

**Una entidad nueva, `OPORTUNIDAD`** (pestaña nueva del Sheet, mismo patrón que
`CAMPANA`/`PROYECTO`/`DOCUMENTO`): `ID, TIPO (Cliente/Subvencion/Voluntariado),
PERFIL_OBJETIVO_ID, NOMBRE_ENTIDAD_DETECTADA, FUENTE, NIVEL_CONFIANZA,
RESUMEN_OPORTUNIDAD, PROPUESTA_GENERADA_DOC_ID, ESTADO
(Detectada/En_revision/Aprobada/Descartada/Contactada), FECHA_DETECCION,
OBSERVACIONES`. Vive junto a `DOCUMENTO` y `PROYECTO` como cualquier otra
entidad -- nada nuevo en cuanto a esquema, solo una tabla más.

**Un `PERFIL_OBJETIVO` reutilizable** (justo lo que pide el operador: "un tipo de
perfil con características que pueden ser compartidas para otros perfiles
parecidos"): en vez de definir cada oportunidad desde cero, se define una vez un
perfil-tipo (ej. "taller de manualidades pequeño, <5 personas, sin presencia
digital fuerte, activo en redes locales") con sus rasgos firmográficos y de
comportamiento, y cualquier organización real detectada se compara contra la
lista de perfiles-tipo existentes, no contra un enunciado libre cada vez -- así
un perfil bueno, una vez afinado, sirve para docenas de detecciones futuras.

**El ciclo "Oportunidad" en tres fases, calcado del patrón Cronista**:

1. **Explorar** (worker local + búsqueda web con dominio acotado): dado un
   `PERFIL_OBJETIVO` y un ámbito (ej. "talleres de manualidades en un radio de
   30km", "convocatorias de subvención cultural de la Generalitat 2026",
   "organizaciones locales que ya hacen voluntariado tecnológico"), el sistema
   busca candidatos reales y los puntúa contra el perfil -- exactamente el
   patrón de ICP scoring ya descrito arriba, pero corriendo sobre `local-potente`
   en vez de un SaaS de pago.
2. **Elaborar** (LiteLLM + render-worker, reutilizando TODO lo ya construido):
   para cada candidato que supera el umbral, generar automáticamente: un resumen
   de por qué encaja (texto), una propuesta de mejora o de intercambio concreta
   (texto, en el mismo formato que ya usa Cronista para sus informes), y un
   "kit de identidad visual" ligero -- paleta de color derivada de una semilla
   (rotación HSL, no requiere IA), una sugerencia de tipografía de una lista
   curada propia (nunca inventada por el LLM, para evitar fuentes que no
   existen), y un logo/imagen de referencia vía el mismo pipeline `img2img` o
   `text2img` que ya genera fotogramas e infografías. Con esto se cierra el PDF
   final con `render-worker /pdf`, igual que un informe de Cronista.
3. **Puerta humana, sin excepción** (igual que el nodo "revisar antes de guardar"
   de Cronista, pero aquí es innegociable, no solo prudente): la fila
   `OPORTUNIDAD` se crea en estado `Detectada`, con la propuesta ya redactada y
   el PDF ya generado, pero **nada se envía a nadie, nunca, sin que el operador
   la pase manualmente a `Aprobada`**. El sistema deja el trabajo hecho; la
   decisión de contactar sigue siendo humana en el 100% de los casos.

**Reutilización real, no nueva infraestructura**: el ciclo completo corre sobre
piezas que ya existen -- `LiteLLM` (razonamiento), `render-worker` (PDF/imagen),
el patrón n8n de `SplitInBatches` corregido esta misma ronda, y el Sheet como
única fuente de verdad. La única pieza genuinamente nueva es el endpoint
`render-worker /identidad-visual` (paleta + logo + tipografía) y la pestaña
`OPORTUNIDAD`/`PERFIL_OBJETIVO`.

### Por qué la puerta humana aquí es más estricta que en Cronista

Cronista actúa sobre datos que el propio cliente ya nos dio -- el riesgo de
equivocarse es interno. "Oportunidad" analiza e implica a **terceros que no han
pedido nada**: una empresa real, un ayuntamiento, una organización de
voluntariado. Tres límites que no son negociables, y que hay que dejar escritos
desde el diseño, no añadidos después de un incidente:

- **Nunca contacto automático**: el sistema redacta, nunca envía. Ningún email,
  mensaje o formulario sale sin que una persona pulse enviar -- el mismo
  principio ya aplicado a Cronista, pero aquí con consecuencias reales fuera de
  Engremiat si se salta (spam, mala imagen, y en la UE cuestiones de RGPD/LSSI-CE
  si hay datos personales de por medio).
- **Solo información pública y de organizaciones, nunca de personas**: el
  `PERFIL_OBJETIVO` describe organizaciones (talleres, entidades, convocatorias),
  no personas concretas -- no se construye un perfil de "Fulanito de tal",
  aunque su nombre aparezca en una web pública. Si una fase futura necesita
  datos personales (un contacto concreto dentro de la organización), eso vuelve
  a pasar por el mismo tipo de decisión que ya se tomó con el Telegram ID del
  operador: explícita, mínima, documentada.
- **Ninguna solicitud de subvención se presenta sola**: el borrador que genera el
  sistema es un punto de partida para que una persona con capacidad de firma lo
  revise y complete -- las convocatorias reales exigen representación legal,
  cuentas justificativas y compromisos que el sistema no puede asumir en nombre
  de nadie.

### Cómo se generaliza a los tres casos que pide el operador

El mismo motor, tres `PERFIL_OBJETIVO` distintos y tres fuentes de "explorar"
distintas -- nada más cambia:

| | Preventa comercial | Subvenciones | Voluntariado técnico |
|---|---|---|---|
| Fuente en "Explorar" | búsqueda web acotada + directorios locales/sectoriales | portales de convocatorias (autonómicos, estatales, UE) | redes de voluntariado tipo Catchafire, asociaciones locales |
| Qué genera "Elaborar" | demo/propuesta de producto + kit de marca + oferta de intercambio o venta | borrador de memoria + argumentario de encaje con la convocatoria | propuesta de colaboración (qué ofrecemos / qué necesitamos) |
| Puerta humana | aprobar antes de contactar | revisar y completar antes de firmar/presentar | aprobar antes de proponer el contacto |

### Pendiente, deliberadamente no resuelto todavía

- **`render-worker /identidad-visual`**: no implementado en esta ronda -- diseño
  acotado arriba (paleta programática + tipografía de lista curada + imagen vía
  `img2img`/`text2img` ya probados), pendiente de construir cuando haya un primer
  `PERFIL_OBJETIVO` real con el que probarlo.
- **De dónde sale el primer `PERFIL_OBJETIVO` real**: esta ronda documenta el
  diseño, no crea todavía ningún perfil concreto ni ninguna búsqueda real de
  clientes/convocatorias/voluntariado -- eso requiere que el operador defina el
  primer perfil objetivo real (empezando, probablemente, por el caso más simple:
  talleres de manualidades parecidos al piloto del amigurumi).
- **Límite legal de la búsqueda automatizada**: antes de programar cualquier
  "Explorar" real contra webs de terceros, revisar los términos de uso de cada
  fuente (muchos directorios y portales de convocatorias prohíben explícitamente
  el scraping automatizado) -- no asumido, a confirmar caso por caso.

## Valoración cruzada: "Oportunidad" + "Nodo Operativo Comunitario" (2026-08-30)

### El encaje entre las dos propuestas

Son dos capas distintas de la misma idea, no dos productos en competencia:

- **"Nodo Operativo Comunitario"** (Raspberry Pi + PC + energía solar, para
  comunidades aisladas) es la **infraestructura desplegable** -- lo que se
  entrega físicamente a una comunidad, cooperativa o centro sin conexión fiable.
- **"Oportunidad"** (ciclo de detección de clientes/subvenciones/voluntariado) es
  el **motor de puesta en marcha** de esa infraestructura -- quién encuentra a la
  comunidad que lo necesita, quién detecta la convocatoria que puede pagarlo, y
  quién elabora la propuesta concreta para presentarla.

El encaje es literal: el tipo de organización que necesita un Nodo Operativo
Comunitario (cooperativa rural, ONG, centro de formación en zona aislada) es
exactamente el tipo de `PERFIL_OBJETIVO` que "Oportunidad" está diseñado para
detectar, y las subvenciones de "brecha digital"/cohesión rural/cooperación al
desarrollo son exactamente el tipo de convocatoria que su fase "Explorar" debería
encontrar. **Sin "Oportunidad" (o un proceso manual equivalente), el Nodo
Operativo Comunitario no tiene manera de llegar a quien lo necesita** -- es un
producto excelente sin canal de distribución. Esta es la razón real para
construir ambas piezas juntas, no una casualidad de calendario.

### Competencia real verificada (no asumida)

La búsqueda de mercado del análisis previo se ha verificado contra fuentes
primarias -- los datos más relevantes, confirmados:

| Producto | Qué es realmente | Precio/coste verificado |
|---|---|---|
| **Kiwix Hotspot** | Dispositivo plug-and-play, SSD NVMe, hasta 24 usuarios, contenidos Wikipedia/médico/manuales | 319 USD (impuestos y envío a ~60 países incluidos) |
| **RACHEL 6** (World Possible) | Servidor educativo, 8GB RAM, **IA integrada de fábrica**, hasta 50 usuarios, usado en 40+ países | RACHEL-Plus 4.0: 500 USD |
| **SolarSPELL** | Biblioteca offline solar, resistente al agua/polvo/calor, hotspot Wi-Fi propio | Menos de 200 USD en piezas -- el coste real está en curación de contenido y soporte, no en el hardware |
| **Internet-in-a-Box** | Stack abierto sobre Raspberry Pi de 2GB+ (35 USD), integra Kolibri + Moodle + Nextcloud + WordPress | Gratuito (software libre), coste = hardware básico |
| **Project NOMAD** | **Servidor abierto con IA local vía Ollama, Wikipedia completa, mapas, Khan Academy -- sin API keys, sin nube** | Gratuito y de código abierto (proyecto en tendencia en GitHub) |

**El dato que cambia el análisis**: Project NOMAD ya hace, gratis y en código
abierto, casi exactamente lo que "IA local + biblioteca offline sin nube" iba a
ser nuestro argumento de venta -- Ollama local, sin API keys, sin datos que salgan
del dispositivo. RACHEL 6 también trae IA integrada de fábrica. **La IA local
offline ya no es una ventaja competitiva por sí sola en 2026** -- es una
característica que un proyecto gratuito de GitHub ya resuelve mejor que lo que
podríamos construir desde cero.

### Dictamen honesto sobre el valor diferencial

- **Como "biblioteca offline + IA local + Wi-Fi autónomo"**: valor diferencial
  bajo. Competimos contra software libre maduro (Project NOMAD, Internet-in-a-Box,
  RACHEL) que ya resuelve esto con años de despliegues reales en decenas de
  países. Construir esa capa desde cero sería reinventar una rueda ya gratuita.
- **Como "capa operativa sobre esa infraestructura"**: valor diferencial real y
  defendible. Ninguno de los competidores investigados (Kiwix, RACHEL, SolarSPELL,
  IIAB, NOMAD) ofrece gestión de tareas, procesos, recursos, incidencias o
  decisiones estructuradas -- son bibliotecas y aulas, no herramientas de gestión.
  Esto es precisamente lo que ya existe y funciona en el esquema de Sheets de
  Engremiat (`PROYECTO`/`TAREA`/`RECURSO`/`INCIDENCIA`/`DECISION`).
- **Como "motor de detección y financiación de despliegues"**: valor diferencial
  real y único -- ningún competidor investigado tiene nada parecido a "Oportunidad".
  Todos dependen de que una ONG, universidad o gobierno decida desplegarlos
  manualmente; ninguno se dedica a encontrar activamente dónde desplegarse ni a
  redactar la financiación que lo permite.

### Recomendación de posicionamiento (revisa la propuesta anterior)

**No competir en la capa de contenidos/IA offline.** Reutilizar Internet-in-a-Box
o Project NOMAD tal cual como la capa de biblioteca+IA del Nodo Operativo
Comunitario (ambos gratuitos, maduros, ya probados en campo) en vez de construir
una versión propia. El desarrollo propio de Engremiat se concentra en dos capas
que ningún competidor cubre:

1. **La capa operativa** (ya construida): gestión de proyectos, tareas, recursos,
   incidencias y documentación sobre el mismo Sheet que ya usa Engremiat --
   convertir el nodo de "biblioteca que se consulta" en "espacio de trabajo donde
   una comunidad gestiona sus propios procesos".
2. **La capa de detección y financiación** (`OPORTUNIDAD`, diseñada esta misma
   ronda): encontrar comunidades/organizaciones que encajan, encontrar la
   subvención que lo paga, y dejar la propuesta de despliegue ya redactada.

Esto convierte el argumento de venta de "tenemos una caja con Wikipedia offline e
IA" (débil, gratis en otro sitio) a "integramos infraestructura ya probada y
gratuita con gestión operativa real, y además encontramos y financiamos dónde
desplegarla" (sin competencia directa identificada en la investigación).

### Pendiente, no resuelto todavía

- No se ha construido ningún piloto de integración entre Internet-in-a-Box/NOMAD
  y el esquema de Sheets de Engremiat -- diseño de alto nivel únicamente.
- El consumo/dimensionado solar (Raspberry + HDD, placa 100-150W, batería LiFePO4
  30-50Ah) viene de estimaciones del análisis previo, no de medición real con
  enchufe medidor -- confirmado como pendiente en ese mismo análisis, se mantiene
  como limitación conocida.
- No se ha identificado todavía el primer sector/comunidad piloto concreto para
  probar esta combinación -- sigue siendo la recomendación central: elegir un
  sector, definir 2-3 procesos críticos reales, y probar con 5-10 usuarios antes
  de generalizar.

## Prioridad de desarrollo y el problema real que destapa el offline (2026-08-30)

### Qué conviene seguir desarrollando (dictamen)

De todo lo abierto ahora mismo -- construir `render-worker /identidad-visual`,
implementar `OPORTUNIDAD` de verdad, seguir ampliando el Nodo Operativo
Comunitario -- **ninguna de las tres es la prioridad real**. Hay un bloqueante
más básico debajo de las tres, y el propio operador lo acaba de detectar: **todo
el modelo de datos de Engremiat vive en Google Sheets, que necesita internet para
funcionar.** Mientras eso sea cierto, "Nodo Operativo Comunitario" y "la
soberanía es el producto" (la frase que abre este mismo documento) son una
promesa sin cumplir -- el nodo que se instalaría en una comunidad sin conexión
fiable seguiría dependiendo de Google para leer y escribir sus propios datos.

**Recomendación**: pausar `OPORTUNIDAD` (el diseño ya está hecho y no caduca; no
hay ningún cliente esperando) y no seguir ampliando el Nodo Operativo Comunitario
con más hardware/energía hasta demostrar que la capa de datos puede vivir fuera
de Google. Es el bloqueante que, si no se resuelve, invalida silenciosamente todo
lo demás.

### La capa de datos fuera de Google: no hay que inventarla, ya existe en el propio stack

El operador ya tiene **Baserow** corriendo en el stack Docker `engremiat-*`
(descubierto en la sesión anterior junto a n8n, ver
[[project_cronista_n8n_stack]]) -- una base de datos tipo hoja de cálculo,
autoalojada, con API REST propia y nodo nativo en n8n (confirmado: cambiar la URL
de host de `api.baserow.io` a la instancia propia es la única diferencia entre
usar la nube de Baserow o la autoalojada). Es, estructuralmente, un reemplazo
directo de Google Sheets: tablas con filas y columnas, vistas, y una API con la
que ya sabemos trabajar porque el patrón (leer/escribir filas via API) es idéntico
al que ya se usa contra Sheets.

**Por qué Baserow y no otra alternativa investigada (NocoDB, Directus, SQLite a
pelo)**: NocoDB es más ligero pero necesita una base SQL propia detrás y carece de
permisos finos y automatización -- exigiría montar más piezas. Baserow ya
gestiona su propia base, ya tiene permisos, ya está instalado, y ya se integra
con n8n sin fricción. La opción más barata no es la más ligera técnicamente, es
la que el operador ya tiene funcionando.

### Diseño de migración: no sustituir, bifurcar

No se propone abandonar Google Sheets -- los clientes actuales (La Troballa,
Gestor de Proyectos) funcionan bien con él y no hay ninguna razón para tocarlos.
Se propone una **bifurcación deliberada**:

| | Clientes cloud (actuales) | Nodos offline (nuevo) |
|---|---|---|
| Almacén de datos | Google Sheets | Baserow autoalojado (Pi o PC del nodo) |
| Lógica/dispatcher | Apps Script (`doPost`) | n8n (ya autoalojado, ya usado en Cronista) |
| Autenticación | Cuenta de servicio + OAuth Google | Token de API de Baserow (mucho más simple -- sin las cuotas y JWT de Google que ya han costado horas esta sesión) |
| Esquema de entidades | `02_PROYECTOS`, `06_TAREAS`, `14_DOCUMENTOS`... | Las mismas tablas, mismos nombres de columna -- migración de esquema, no de diseño |

El esquema de entidades (`PROYECTO`/`TAREA`/`RECURSO`/`DOCUMENTO`/`INCIDENCIA`/
`DECISION`/`VINCULO`) es el activo real de Engremiat, no el motor de
almacenamiento que hay debajo -- se replica tal cual en Baserow, con las mismas
columnas y las mismas convenciones de ID (`TAR-0008`, `DOC-0004`...). Nada de la
lógica de negocio ya diseñada (bus de trabajo, ciclos Ejecutor/Cronista/futuro
Oportunidad) cambia de forma; cambia únicamente a qué API llama cada acción del
dispatcher.

### Piloto mínimo propuesto, antes de comprometerse a nada más grande

1. Crear en la Baserow ya instalada una única tabla, `TAREA`, con las mismas
   columnas que `06_TAREAS`.
2. Un workflow n8n minúsculo: leer una tarea por ID, crear una tarea nueva --
   exactamente las dos operaciones más simples del dispatcher actual, pero contra
   Baserow en vez de contra Sheets.
3. Verificar que TODO el ciclo (crear, leer, listar) funciona **sin ninguna
   llamada a una API de Google** -- apagar la conexión a internet del PC durante
   la prueba es la validación más honesta posible.
4. Solo si esto funciona limpio, decidir si migrar `PROYECTO`/`RECURSO`/
   `DOCUMENTO` al mismo patrón para el primer nodo piloto real.

### Lo que esto NO resuelve todavía (honesto, no lo escondemos)

- **La sincronización cloud↔offline** no está diseñada: si en el futuro un nodo
  offline necesita compartir datos con el Gestor de Proyectos central cuando
  recupera conexión, hace falta un mecanismo de sincronización explícito (no
  asumir que "ya se resolverá solo") -- Baserow no sincroniza nativamente con
  Google Sheets, habría que construir ese puente en n8n si algún día hace falta.
- **La migración de Apps Script a n8n para las acciones offline** implica
  reescribir en n8n (o en un pequeño servicio Node/Python) la lógica que hoy vive
  en `WebhookTelegramService.js`/`AprovisionamientoService.js`/`ReportService.js`
  -- no es un simple cambio de endpoint, es portar lógica real, tarea no trivial
  y no estimada todavía.
- **No se ha probado Baserow bajo carga en una Raspberry Pi real** -- el stack
  Docker actual corre en el PC del operador, no en la Pi de 4GB que sería el
  hardware real del nodo; falta confirmar que Baserow (que gestiona su propia
  Postgres) cabe cómodamente en esa RAM junto al resto de servicios del nodo.

## Piloto mínimo: montado, probado y funcionando (2026-08-30)

El piloto descrito arriba se construyó y se probó de verdad, no quedó en diseño:

- Tabla `TAREA` real en Baserow (`engremiat.claude` → tabla id `832`), con las
  mismas 26 columnas que `06_TAREAS`, cargada con dos tareas reales del
  amigurumi (`TAR-0008`, `TAR-0009`) vía importación CSV.
- Workflow n8n **"Piloto Baserow - sin Google"** (id `9Yg3yEOaWWcmCmXC`),
  webhook `POST /webhook/piloto-baserow`, con las dos acciones más simples del
  dispatcher actual (`leer_tarea`, `crear_tarea`) reimplementadas contra la API
  de Baserow en vez de la de Google Sheets.
- **Probado con éxito de punta a punta**: `leer_tarea` devuelve la fila real de
  `TAR-0009`; `crear_tarea` crea una fila nueva y la deja visible al instante en
  la tabla. Ninguna de las dos llamadas invoca ninguna API de Google -- el
  workflow no contiene ni un solo nodo de Google Sheets, service account, ni
  referencia a `googleapis.com`.

**Un obstáculo técnico real, no anticipado, que vale la pena documentar** (aplica
a cualquier integración futura de n8n con esta misma Baserow autoalojada):
Baserow, al recibir una petición con una cabecera `Host` que no coincide con su
`BASEROW_PUBLIC_URL` (`http://localhost`), la trata como si fuera un dominio de
una aplicación publicada con el "Builder" de Baserow y devuelve "Site not
found" -- esto ocurre incluso llamando desde dentro de Docker via
`host.docker.internal`, porque ese nombre de host tampoco coincide con
`localhost`. La variable de entorno pensada para esto,
`BASEROW_EXTRA_ALLOWED_HOSTS`, **no resolvió el problema** (hay reportes
similares en la comunidad de Baserow) -- solo evita un rechazo a nivel de
Django, no el enrutado del "web-frontend" (Nuxt) que hace la comprobación de
dominio publicado antes de llegar a la API. Y el cliente HTTP de n8n (axios) no
deja sobrescribir la cabecera `Host` cuando la URL usa ese mismo nombre de host
-- hay que apuntar a la IP directamente y mandar `Host: localhost` como
cabecera aparte para que no haya conflicto. **Solución que sí funcionó**:
apuntar el nodo HTTP Request de n8n directamente a la IP de
`host.docker.internal` (fija en Docker Desktop, `192.168.65.254`) y añadir
manualmente la cabecera `Host: localhost` en la propia petición -- así Baserow
la trata como si viniera de sí mismo, no de una app publicada.

**Otra limitación de Baserow importante para el diseño del nodo offline**: los
tokens de API personales de Baserow solo dan acceso a nivel de fila (leer/crear/
editar/borrar) -- **no permiten crear tablas ni columnas nuevas**, eso exige una
sesión de usuario autenticada (JWT), no un token. Para este piloto, la tabla
`TAREA` la creó el propio operador importando un CSV -- para el nodo offline
real, cualquier automatización que necesite crear NUEVAS tablas (no solo filas)
tendrá que iniciar sesión como usuario, no bastará con un token de API guardado
en n8n.

**Validación de "cero Google" pendiente de la forma más honesta**: la prueba se
hizo con el PC conectado a internet -- se verificó arquitectónicamente que el
workflow no contiene ninguna llamada a Google, pero la prueba definitiva
(desconectar la red del PC y repetir `leer_tarea`/`crear_tarea`) no se ha hecho
todavía porque exige cortar la conexión de la máquina de trabajo -- pendiente de
que el operador la ejecute cuando quiera confirmarlo de la forma más exigente.

## Distinción crítica que destapa el intento de desconexión: construir vs. operar (2026-08-30)

Al intentar desconectar la red para repetir la prueba, aparece una objeción del
propio operador, certera: **si no hay internet, Claude tampoco puede ejecutar
nada** -- Claude Code es un servicio en la nube; sin conexión, no hay sesión, no
hay `Bash`, no hay forma de que yo dispare el webhook ni lea el resultado. Esto
es cierto y hay que separarlo con precisión de lo que sí se ha demostrado,
porque son dos capas distintas que se estaban mezclando sin darse cuenta:

| Capa | Qué es | ¿Necesita a Claude/internet para FUNCIONAR? |
|---|---|---|
| **Construcción/mantenimiento** | Diseñar, depurar y modificar los workflows de n8n, la tabla de Baserow, el `render-worker` | Sí -- hoy se hace con Claude Code, en la nube. Es trabajo de desarrollo puntual, no la operación diaria del nodo. |
| **Operación real del nodo** | Un usuario dispara un webhook de n8n, n8n lee/escribe en Baserow, opcionalmente llama a Ollama | **No.** n8n, Baserow y Ollama son procesos que ya corren localmente y no dependen de Claude para ejecutarse -- una vez montado el workflow, cualquier persona en la red local del nodo puede dispararlo (con un móvil, un formulario del portal, o `curl` desde otra máquina de la misma LAN) sin que Claude intervenga para nada. |

**Lo que de verdad se demostró en el piloto**: la capa de OPERACIÓN (n8n +
Baserow) no contiene ninguna llamada a Google -- eso sigue siendo cierto e
independiente de si Claude está disponible o no. Lo que NO se pudo demostrar
hoy es exactamente lo que el operador señaló: que YO pueda verificarlo por él
sin conexión -- eso es estructuralmente imposible mientras la verificación la
haga un agente en la nube. La forma correcta de validar "cero Google" con la
red del PC apagada de verdad es que una persona dispare el webhook a mano
(móvil conectado al Wi-Fi local del nodo, o el propio editor de n8n abierto en
el navegador) mientras el PC está desconectado de internet -- sin que Claude
tenga que estar despierto para comprobarlo.

## Propuesta: worker local programable ("Ejecutor Local", en la Pi)

### Lo que ya existe y ya cumple parte de la función

n8n **ya es** un worker local programable -- ejecuta lógica (código JS,
llamadas HTTP, condicionales) sin depender de ningún servicio en la nube, y ya
corre en el mismo stack Docker del operador. Ollama (`local-potente`,
`devstral-dev`) es la pieza de razonamiento/generación que puede vivir junto a
él. Para la OPERACIÓN diaria de un nodo comunitario, esta pareja (n8n + Ollama)
ya es el "worker local" que hace falta -- no hay que inventar nada nuevo para
que el nodo funcione sin Claude ni sin internet.

### Lo que sí falta: un asistente de desarrollo/mantenimiento offline

Donde el operador tiene razón en señalar un hueco real: si un técnico está
físicamente en una comunidad sin ninguna conectividad y algo se rompe (un
workflow mal configurado, una tabla con un dato erróneo), hoy la única forma de
arreglarlo con ayuda de una IA es traer a Claude, que exige internet. Un
**"Ejecutor Local"** -- una versión reducida del propio Ejecutor, pero corriendo
contra `devstral-dev` (ya probado, ya vive en el worker local de Graphify, ver
[[proyecto_worker_local_devstral]]) en vez de contra Claude -- cubriría ese
hueco: un bucle simple (leer el problema, proponer un cambio en un workflow o en
una fila de Baserow, aplicarlo, verificar) ejecutado enteramente en el PC/Pi del
nodo, sin ninguna llamada externa.

### Diseño concreto de "Ejecutor Local" (2026-08-30)

**Con qué construirlo, sin reinventar** (investigado, no asumido): el hueco de
"agente que actúa apuntando a un modelo 100% local" ya está resuelto por
software libre maduro:

- **Goose** (Block/Square, código abierto) -- agente nativo en MCP, corre
  totalmente offline contra Ollama, y se extiende añadiendo servidores MCP
  propios. Encaja mejor que construir un bucle desde cero porque el patrón
  "herramientas acotadas + modelo local" ya viene resuelto.
- **Aider** (46.000+ estrellas, terminal, consciente de git) -- mejor opción
  específica para cuando el arreglo es literalmente editar un archivo de código
  (por ejemplo `render-worker.py` corrupto), con commits automáticos que dejan
  rastro de cada cambio.

**Recomendación**: Goose como motor principal (porque la mayoría de arreglos in
situ son operativos -- reactivar un workflow, corregir un dato -- no ediciones
de código), con Aider como herramienta complementaria para el caso concreto de
tocar un archivo de código directamente. Ambos hablan con Ollama vía LiteLLM
(`local-codigo` / `devstral-dev`), ya montado y probado esta misma ronda.

**Las herramientas que se le exponen al agente, acotadas a propósito** (el
riesgo real de un modelo local de 8-14B es que se equivoque con más frecuencia
que Claude, así que el diseño compensa con un catálogo de acciones deliberadamente
pequeño, no con "acceso total" como tiene Claude Code):

| Herramienta (MCP) | Qué hace | Qué NO permite |
|---|---|---|
| `n8n_listar_workflows` / `n8n_ver_ejecuciones` | Leer estado y errores recientes | -- |
| `n8n_activar_workflow` / `n8n_desactivar_workflow` | Activar/pausar un workflow ya existente | Crear o modificar la lógica interna de un workflow |
| `baserow_leer_fila` / `baserow_editar_campo` | Leer una fila, cambiar UN campo de una fila ya existente | Crear tablas, borrar filas, editar varios campos a la vez sin confirmación |
| `docker_reiniciar_servicio` | Reiniciar un contenedor de una lista blanca (`n8n`, `baserow`) | Detener, borrar o modificar contenedores fuera de esa lista |
| `registrar_incidencia_offline` | Anotar el problema si no sabe resolverlo, para revisión cuando vuelva la conexión | -- |

**El bucle, con confirmación humana obligatoria en cada paso** (la misma
"puerta humana" de Cronista/Oportunidad, pero aquí en tiempo real porque SÍ hay
una persona presente, el técnico in situ):

1. El técnico describe el problema en lenguaje natural (interfaz: una página
   HTML sencilla servida en la LAN local del nodo, o directamente la terminal si
   es alguien técnico).
2. El agente diagnostica usando las herramientas de SOLO LECTURA primero
   (`n8n_ver_ejecuciones`, `baserow_leer_fila`).
3. Propone UNA acción concreta en texto llano: *"El workflow 'Cronista de
   Tareas' está desactivado desde las 14:32. Voy a activarlo. ¿Confirmas?
   (sí/no)"*.
4. Solo tras un "sí" explícito ejecuta la herramienta correspondiente.
5. Si no encuentra una acción segura dentro de su catálogo, usa
   `registrar_incidencia_offline` en vez de improvisar algo fuera de su alcance
   -- mismo principio de honestidad ya aplicado en los pilotos de Cronista
   (nunca inventar una solución que no está seguro de que funcione).
6. Cada sesión completa queda registrada (fecha, problema, acción, resultado)
   para que el operador la revise cuando recupere conexión -- mismo patrón de
   trazabilidad que el resto del sistema.

### Corrección al método de validación: no hace falta desconectar la conversación

El operador señala algo que mejora el plan de verificación anterior: "Ejecutor
Local", una vez construido, es un **proceso completamente aparte** de esta
conversación con Claude -- corre su propio bucle contra Ollama en local, sin
ninguna dependencia de que Claude esté conectado. Eso significa que **el sujeto
de la prueba (Ejecutor Local) y el observador de la prueba (esta sesión de
Claude) no tienen por qué compartir la misma condición de red** -- cortar todo
el Wi-Fi del PC (como se planteó antes) es innecesariamente disruptivo, porque
también corta esta conversación.

**Método de validación mejorado, más quirúrgico y sin desconectar nada**:

1. Lanzar el bucle de Ejecutor Local para un caso real (ej. diagnosticar un
   workflow desactivado).
2. Mientras corre, capturar sus conexiones de red reales -- `netstat` filtrado
   por su PID, o una regla de Firewall de Windows que bloquee salida a WAN
   *solo para ese proceso concreto* dejando pasar `localhost`/LAN.
3. Confirmar que todas sus conexiones son a `127.0.0.1`/`192.168.x.x` (Ollama,
   n8n, Baserow) y ninguna a un host externo -- esto prueba "cero dependencia de
   red externa" de forma más rigurosa que cortar el adaptador entero, porque
   audita el proceso exacto en vez de asumir que ningún otro programa del PC
   necesitaba esa conexión.
4. Esta auditoría por proceso es la validación de referencia durante el
   desarrollo. Cortar el adaptador de red completo del PC sigue teniendo
   sentido como comprobación final de aceptación, una sola vez, antes de dar
   por bueno un despliegue real -- pero no hace falta repetirla en cada
   iteración, y nunca debería depender de que esta conversación siga viva
   durante la prueba.

### Honestidad sobre el límite real

Un modelo local de 8-14B (los que corren cómodos en el hardware descrito) es
sensiblemente más limitado que Claude para razonar sobre problemas complejos o
ambiguos -- el "Ejecutor Local" debe entenderse como una red de seguridad para
arreglos simples y acotados (reactivar un workflow, corregir un valor,
reintentar una acción), no como un reemplazo de Claude para el desarrollo real
del producto. La distinción de la tabla de arriba (construir vs. operar) es la
que importa: mientras el desarrollo serio de Engremiat siga necesitando a
Claude, seguirá necesitando internet -- y eso está bien, porque el desarrollo no
ocurre en tiempo real dentro de una comunidad aislada. Lo único que debe
funcionar sin internet es la OPERACIÓN diaria, y esa ya no depende de Claude.

## Prototipo construido y probado con éxito (2026-08-30)

El diseño de arriba se construyó de verdad, no un bucle propio genérico sino el
prototipo mínimo exacto descrito: `ejecutor-local.py`
(`G:\Mi unidad\DEVS\engremiat-litellm\ejecutor-local.py`), un bucle Python de
~250 líneas contra `local-codigo` (`devstral-dev`) vía LiteLLM, con el catálogo
de 8 herramientas acotadas ya definidas arriba y confirmación humana obligatoria
antes de cualquier escritura.

**Confirmado primero lo básico**: `devstral-dev` (via Ollama/LiteLLM) soporta
tool-calling en formato OpenAI de forma nativa y limpia -- no hizo falta ningún
prompt-engineering especial para que eligiera la herramienta correcta.

**Prueba real, sobre un problema real**: se le planteó "el workflow 'Piloto
Baserow - sin Google' debería estar activo pero no responde, revísalo y
arréglalo si hace falta" -- el mismo workflow que se dejó desactivado tras el
piloto de la sección anterior. Resultado, con una sola confirmación humana:

1. Listó los 21 workflows reales del n8n del operador (no un entorno de
   prueba aislado) y localizó el correcto entre ellos.
2. Revisó sus últimas 3 ejecuciones (2 éxitos, 1 error) antes de proponer nada
   -- diagnosticó antes de actuar, como pedía el diseño.
3. Propuso **una sola vez** `n8n_activar_workflow` -- tras confirmar, lo
   activó. Verificado por API: `active: true`.
4. Sesión completa registrada en `ejecutor_local_log.jsonl` para revisión
   posterior.

**Dos bugs reales encontrados y corregidos en la primera pasada** (típicos de
que un modelo local de 8-14B razona peor que Claude, tal y como advertía el
diseño):

1. **Repetición de la misma acción de escritura**: en la primera ejecución, el
   modelo propuso `n8n_activar_workflow` con los mismos argumentos **cuatro
   veces seguidas** en vez de reconocer que ya se había resuelto tras la
   primera -- agotó las confirmaciones "sí" que se le habían preparado y acabó
   crasheando con `EOFError` al pedir una quinta. Corregido con una memoria de
   "llamadas ya ejecutadas en esta sesión" (misma herramienta + mismos
   argumentos) que responde "ya ejecutado, no se repite" en vez de volver a
   escribir.
2. **Pérdida del registro si la sesión se corta a mitad**: el log solo se
   escribía al final del todo -- si el proceso crasheaba (como en el bug
   anterior), la sesión entera se perdía sin dejar rastro, justo lo contrario
   del principio de trazabilidad de todo el sistema. Corregido con
   `try/finally` para que el log se guarde siempre, incluso ante un error o una
   interrupción.

**Verificación de "cero red externa", con el método correcto** (auditoría del
proceso, no desconexión del adaptador -- ver la corrección de método más
arriba): revisión estática de todo el código en busca de cualquier host
referenciado -- **solo aparecen tres destinos, los tres locales**:
`localhost:4000` (LiteLLM), `localhost:5678` (n8n) y `192.168.65.254` (Baserow,
vía el gateway interno de Docker Desktop). Ningún dominio externo, ninguna
llamada a Anthropic ni a ningún servicio en la nube -- confirmado sin
desconectar nada ni depender de que esta conversación siguiera viva.

### Pendiente, no resuelto todavía

- El catálogo de herramientas cubre solo n8n/Baserow/Docker -- falta añadir
  `render-worker` si algún día un arreglo in situ necesita regenerar un
  documento o una imagen.
- No se ha probado con un problema real que el modelo NO sepa resolver -- falta
  verificar en la práctica que `registrar_incidencia_offline` se dispara
  correctamente en vez de que el modelo alucine una solución fuera de catálogo.
- No se ha probado en la Raspberry Pi real, solo en el PC del operador.
- El prototipo vive sin versionar en `G:\Mi unidad\DEVS\engremiat-litellm\`,
  mismo patrón que `render-worker.py` y `bot-local.mjs` -- pendiente de decidir
  si este código pasa a un repositorio versionado cuando madure.

## Propuesta: "Pregonero" -- el cuarto ciclo, entre Cronista y Oportunidad (2026-08-30)

### La idea del operador

Cronista ya convierte datos reales de un proyecto en documentación presentable.
Oportunidad detecta a quién le interesa Engremiat. Falta la pieza que conecta
ambas hacia fuera: **un ciclo que tome lo que Cronista ya generó (informes,
manuales, infografías, fotogramas estilizados) y lo transforme en contenido de
redes sociales real, con IA local, orientado a alimentar el trabajo de
Oportunidad** -- no publicidad genérica, sino piezas que demuestran capacidad
real ante el tipo de organización que Oportunidad ya está intentando detectar.

### Qué existe en el mercado (investigado, no asumido)

- **Repurposing de contenido con IA** (Distribution.ai, Repurpose.io, Castmagic,
  Descript): convierten un post/podcast/video largo en piezas cortas para varias
  redes -- transcriben, resumen y adaptan tono por plataforma. Son SaaS de pago,
  en la nube, exactamente el tipo de dependencia externa que este documento lleva
  todo el rato evitando.
- **Publicación y programación de redes, autoalojada**: **Postiz**
  (github.com/gitroomhq/postiz-app) es la pieza más relevante encontrada -- código
  abierto, más de 32.000 estrellas en GitHub, publica en 33+ redes (X, Instagram,
  TikTok, LinkedIn, Mastodon, Bluesky, YouTube, Reddit...), tiene API pública,
  **integración nativa con n8n**, generación de imagen/video con IA integrada, y
  la versión autoalojada tiene las mismas funciones que la de pago -- sin cuota
  mensual, sin dependencia de un proveedor cloud para publicar.

**Conclusión de mercado**: la parte de "generar el contenido a partir de datos
reales con IA" no conviene comprarla (rompería la coherencia de todo lo
construido esta ronda -- LiteLLM local + render-worker ya hacen exactamente eso
sin depender de nadie). La parte de "publicar y programar en 33 redes distintas"
sí conviene reutilizarla -- reconstruir integraciones con las APIs de todas esas
redes sociales sería un proyecto en sí mismo, y Postiz ya lo resuelve gratis y
autoalojado, coherente con el resto del stack (mismo patrón que Internet-in-a-Box/
NOMAD para la capa de biblioteca: no competir donde ya hay una solución libre
madura).

### Diseño del ciclo

1. **Fuente**: un `DOCUMENTO` ya generado por Cronista (informe, manual,
   infografía) o una `OPORTUNIDAD` con su propuesta ya redactada.
2. **Adaptar** (LiteLLM `local-potente`): a partir del contenido real del
   `DOCUMENTO`, generar 3-5 "ganchos" cortos, uno por plataforma/tono (LinkedIn
   profesional, Instagram/TikTok más visual, X más directo) -- nunca inventar
   datos que no estén en el documento fuente, mismo principio de honestidad ya
   aplicado en Cronista.
3. **Ilustrar** (`render-worker`, ya construido): reutilizar directamente
   `/infografia`, `/imagen/texto` o los fotogramas estilizados ya generados para
   ese proyecto -- no se genera contenido visual nuevo desde cero si ya existe
   uno reutilizable.
4. **Puerta humana** (innegociable, más estricta incluso que en Cronista): un
   informe interno mal redactado se corrige; un post público mal redactado ya se
   ha visto y no se puede retirar del todo. Ninguna publicación sale sin
   aprobación explícita.
5. **Publicar** (Postiz, autoalojado, vía su API o el nodo n8n oficial): una vez
   aprobado, programar/publicar en los canales configurados.

### El enlace con Oportunidad

Dos direcciones de uso, no una sola:

- **General → capta**: contenido que demuestra capacidad real (el informe del
  amigurumi, la infografía del proceso) construye visibilidad de marca antes de
  que Oportunidad detecte a nadie en concreto -- cuando detecte una organización
  real, es más probable que ya la conozca.
- **Dirigida → convierte**: cuando `OPORTUNIDAD` ya tiene una propuesta concreta
  para una organización real, Pregonero puede generar una pieza pensada
  específicamente para el lenguaje/canal de ESA organización (reutilizando el
  mismo "kit de identidad visual" que genera Oportunidad), como material de apoyo
  para el contacto humano que finalmente decide -- nunca como sustituto del
  contacto, solo como material de apoyo ya preparado.

### Límites, en la misma línea que Oportunidad

- **Nunca publicación automática de material dirigido a una organización
  concreta** sin aprobación -- el riesgo reputacional de publicar algo dirigido a
  alguien sin que lo revise una persona es mayor que el de un informe interno.
- **Nunca inventar métricas ni resultados** que el documento fuente no respalde
  -- la tentación en marketing de "redondear" cifras es real y hay que
  descartarla explícitamente desde el diseño.
- **Revisar los términos de cada red social** antes de automatizar publicación
  vía Postiz -- algunas plataformas restringen la publicación totalmente
  automatizada sin supervisión (ya señalado como límite general en la sección de
  Oportunidad, aplica igual aquí).

### Pendiente, no resuelto todavía

- Nombre de trabajo únicamente ("Pregonero") -- a confirmar o cambiar por el
  operador, igual que se hizo con "Cronista".
- No se ha instalado Postiz todavía ni probado su integración real con n8n --
  diseño de alto nivel, no validado con datos reales.
- Falta decidir qué canales/redes son prioritarios antes de configurar nada --
  no tiene sentido integrar 33 redes si el operador solo usa 2 o 3.

## Cuadrar la propuesta: propuesta de valor, huecos reales y quinto ciclo (2026-08-30)

### Propuesta de valor, en una frase

Con todo lo construido hasta ahora, la frase que resume Engremiat, verificable
pieza por pieza (no aspiracional):

> **Un sistema operativo de comunidad, propiedad y alojado por quien lo usa, que
> gestiona su trabajo real (proyectos, tareas, recursos), documenta y difunde lo
> que hace con IA local, encuentra quién puede apoyarlo o financiarlo, y permite
> intercambiar recursos entre personas y nodos -- sin depender de ningún
> proveedor cloud para funcionar día a día.**

Cada cláusula de esa frase es un ciclo o pieza ya construida y probada esta
misma serie de sesiones: "gestiona su trabajo real" = el esquema de entidades
(`PROYECTO`/`TAREA`/`RECURSO`/`INCIDENCIA`); "documenta y difunde" = Cronista +
Pregonero; "encuentra quién puede apoyarlo" = Oportunidad; "intercambiar
recursos entre nodos" = el quinto ciclo que se diseña más abajo; "sin depender
de ningún proveedor cloud" = el piloto Baserow + Ejecutor Local, ya probados.

### Comparación de mercado, consolidada (todo lo investigado esta serie de sesiones)

| Categoría | Quién ya lo hace | Qué le falta a esa solución que Engremiat sí tiene |
|---|---|---|
| Infraestructura offline + IA local | Project NOMAD, RACHEL 6, Internet-in-a-Box | Ninguna gestiona tareas/proyectos/recursos ni detecta financiación |
| Redes comunitarias físicas | **LibreRouter/AlterMundi** (routers open-hardware para comunidades rurales de Latinoamérica) | Resuelve la RED, no el software de gestión ni el contenido; es infraestructura de conectividad, no de operación |
| Demos/propuestas personalizadas | Walnut, Demostack | SaaS cloud, sin capa de datos propia del cliente |
| Matching de subvenciones | Instrumentl, Fundsprout | No conectado a ninguna capa operativa real del solicitante |
| Voluntariado por habilidades | Catchafire | Sin infraestructura física ni gestión de proyectos propia |
| Publicación en redes | Postiz | Resuelve solo la distribución, no la generación desde datos reales |
| **Intercambio/moneda comunitaria** | **Cyclos** (motor de crédito mutuo LETS/Timebank, usado por Sardex y Tradaq), **Community Exchange System** (339 redes federadas en 34 países) | Resuelven la contabilidad del intercambio, no la gestión de proyectos, la IA local, ni el hardware -- son solo el "libro de cuentas" |

**Conclusión, la misma de las rondas anteriores reforzada con este dato nuevo**:
no existe ningún competidor que combine las seis piezas a la vez. Cada pieza por
separado tiene un actor maduro y probado (a menudo gratuito) que conviene
reutilizar en vez de reconstruir -- la propuesta de valor de Engremiat no es
ninguna pieza individual, es la integración de todas bajo un único esquema de
datos que el cliente controla.

### Qué falta de verdad para "cuadrar" la propuesta

**1. Interfaz operativa amigable para el cliente -- hueco real, no resuelto.**
Existe la **Consola Engremiat** (`tools/consola/consola-engremiat.html`,
publicada como artefacto "Mesa de Revisión"), pero es una herramienta de
**gobierno del ecosistema para el operador**, no un portal pensado para que un
usuario final de una comunidad la use a diario. El "portal.local" esbozado en
la sección del Nodo Operativo Comunitario sigue siendo solo un boceto -- **esta
es la pieza que de verdad falta para que un cliente no técnico pueda usar el
sistema sin depender de Telegram ni de la terminal**. Debería ser el punto de
entrada único: ver tareas, documentos, el estado del nodo, y ahora también el
nuevo ciclo de intercambio.

**2. Quinto ciclo: intercambio y cooperación -- diseñado a continuación.**

**3. Ventas del hardware sin stock, con onboarding automático -- diseñado a
continuación.**

## Propuesta: "Ágora" -- el quinto ciclo (intercambio, cooperación, gamificación)

### La idea del operador, aterrizada

Gamificar la experiencia Engremiat sobre un modelo cooperativo: optimizar
recursos e impulsar el intercambio entre usuarios y entre nodos completos (no
solo dentro de una comunidad, sino entre comunidades distintas que usan
Engremiat). El nombre propuesto, en la línea de Ejecutor/Cronista/Pregonero/
Oportunidad: **Ágora** -- la plaza pública donde en la antigua Grecia se
comerciaba, se debatía y se organizaba la comunidad, exactamente las tres
funciones que se le piden a este ciclo.

### No reinventar la contabilidad del intercambio -- ya existe, madura y libre

El error caro sería construir un sistema de puntos/moneda desde cero. **Cyclos**
(GPL, motor para LETS/Timebank/moneda complementaria, en producción real detrás
de Sardex y Tradaq) ya resuelve exactamente el "libro de cuentas" de crédito
mutuo que necesita este ciclo: cada usuario/nodo tiene un saldo que puede ir a
negativo dentro de un límite (a diferencia del dinero tradicional, nadie
necesita "tener" primero para poder ofrecer), y cada intercambio queda
registrado con trazabilidad completa. El **Community Exchange System** aporta
el patrón de FEDERACIÓN entre redes independientes (339 exchanges en 34 países)
-- relevante para cuando Engremiat tenga más de un nodo comunitario y quieran
intercambiar entre sí, no solo puertas adentro.

**Diseño**: Cyclos (o su patrón, si autoalojarlo completo resulta demasiado para
el hardware del nodo) como motor de saldos y transacciones; el Sheet/Baserow
sigue siendo donde viven `RECURSO`/`NECESIDAD`/`PERFIL_OBJETIVO` con el mismo
patrón de siempre; n8n conecta ambos mundos, igual que ya conecta Baserow con
n8n en el piloto ya probado.

### Elementos de gamificación, con propósito, no decoración

Nunca gamificar por gamificar (el "sistema de puntos que no significa nada" es
la crítica más común y justificada a la gamificación mal hecha) -- cada
mecánica debe reflejar una contribución real medible en el propio Sheet:

- **Reputación por contribución real**: completar una `TAREA`, compartir un
  `RECURSO`, resolver una `INCIDENCIA` de otro usuario -- ya son eventos que
  existen en el esquema de datos, solo hace falta que generen saldo/reputación.
- **Insignias por rol cumplido, no por actividad vacía**: "primer intercambio",
  "mentor" (ayudó a resolver incidencias de otros), "nodo puente" (facilitó un
  intercambio entre dos comunidades distintas) -- cada insignia cuenta algo
  verdadero sobre lo que esa persona/nodo aportó.
- **Visibilidad del recurso ocioso**: el valor real para "optimización de
  recursos" es simplemente hacer visible qué `RECURSO` está infrautilizado en
  un nodo y qué `NECESIDAD` sin cubrir hay en otro -- el matching automático
  (mismo patrón de scoring ya diseñado para Oportunidad) es más valioso que
  cualquier insignia.

### Límites, en la misma línea que el resto de ciclos

- **Nunca inventar valor de la nada**: el saldo de crédito mutuo debe reflejar
  intercambios reales ya ocurridos y confirmados por ambas partes, no
  estimaciones ni promesas -- el riesgo de un sistema de crédito mutuo mal
  diseñado es la inflación de confianza sin respaldo real.
- **Puerta humana en cualquier intercambio entre nodos distintos** (no dentro de
  la misma comunidad, donde el roce social ya actúa como control): un
  intercambio que cruza la frontera de una comunidad a otra debe confirmarse
  explícitamente por una persona de cada lado, igual que cualquier oferta de
  Oportunidad.
- **Revisar la regulación aplicable a monedas complementarias/crédito mutuo en
  España/UE** antes de operar con saldos reales entre organizaciones --  no
  asumido, a confirmar (Cyclos y CES ya operan legalmente en muchos países,
  pero el marco exacto aplicable depende de cómo se estructure cada despliegue).

## Automatizar la venta del hardware: sin stock, con onboarding automático

### El modelo, sin autoengaños

### Corrección importante: sí puede ser dropshipping real, si se traslada el
### único paso manual al propio cliente

La primera versión de esta sección concluía que hacía falta tocar cada unidad a
mano (flashear la SD, probar que arranca) antes de enviarla -- un cuello de
botella humano que no escala y contradice "sin stock". El operador señala la
corrección correcta: **si el objetivo es máxima autonomía del cliente, ese paso
no lo hace un operario, lo hace el propio cliente al recibir el kit** -- y en
cuanto se traslada, el hardware que se envía vuelve a ser 100% genérico
(Raspberry Pi + fuente + caja, sin nada preconfigurado), lo que sí permite
dropshipping real de componentes estándar, sin inventario propio.

### Diseño del flujo, cero intervención humana en la ruta por defecto

1. **Tienda**: Shopify -- sin cambios respecto a la versión anterior.
2. **Pedido → envío genérico automático**: el pedido en Shopify dispara el
   envío de un kit sin personalizar (Raspberry Pi, fuente, caja, cable) desde un
   proveedor de dropshipping de electrónica estándar -- nadie de Engremiat toca
   la unidad física. El pedido también genera, vía n8n, un **código de
   activación único** para ese cliente (no una unidad física personalizada).
3. **El cliente flashea su propia tarjeta**, con **Raspberry Pi Imager**
   (herramienta oficial de la Fundación Raspberry Pi, gratuita, ya diseñada para
   que cualquier persona sin conocimientos técnicos flashee una imagen
   correctamente) -- se le indica una URL donde descargar la imagen de
   Engremiat ya preparada (sistema + Baserow + n8n + Ollama incluidos), no un
   proceso de instalación manual.
4. **Primer arranque autogestionado**: al arrancar por primera vez, la Pi
   levanta su propia red Wi-Fi temporal de configuración (patrón ya estándar en
   routers domésticos y en el propio LibreRouter) -- el cliente conecta su móvil,
   Plaza se abre automáticamente en modo "Primer arranque" (una extensión del
   mismo portal ya construido, no una herramienta aparte) y le pide solo:
   su **código de activación** (del paso 2) y, si hace falta, las credenciales
   del Wi-Fi de la vivienda/local para salida a internet.
5. **Auto-aprovisionamiento, sin persona de por medio**: al confirmar el código,
   Plaza llama directamente a las acciones YA EXISTENTES del dispatcher de Apps
   Script (`crear_solicitud_montaje`, `instalar_estructura_cliente`) -- el mismo
   pipeline que ya se usó para dar de alta TEST-Cliente-2026-08-29, disparado
   esta vez por el propio cliente, no por el operador.
6. **Autodiagnóstico como "prueba de arranque"**: los mismos tres semáforos ya
   construidos en Plaza (conexión/datos/IA) hacen de comprobación de que "todo
   funciona" -- sustituyen al operario que antes probaba cada unidad a mano.
7. **Onboarding guiado por el contenido generado por Cronista** -- ver más abajo.
8. **Soporte y seguimiento, como valor añadido opcional, no como paso
   obligatorio**: la ruta por defecto no necesita a nadie -- pero se ofrece un
   nivel de servicio superior (contratable aparte) donde una persona real
   acompaña la instalación por videollamada o revisa el nodo en remoto vía
   Ejecutor Local -- así el trabajo humano se convierte en producto vendible,
   no en un coste oculto de cada venta.

### El contenido del primer tutorial de onboarding sale de la primera instalación real

Aplicando exactamente el patrón ya probado con el amigurumi y el bahareque:
**grabar la primera instalación física real (Raspberry + nodo principal + uso
móvil) con el móvil, y pasarla por Cronista** -- extraer fotogramas de cada
paso, generar el manual con `render-worker`, exactamente el mismo pipeline ya
construido y probado esta ronda para el amigurumi (`TAR-0008` a `TAR-0017`).
No hace falta inventar un proceso de documentación distinto para el
onboarding -- es el mismo Cronista, aplicado a un caso más, con el beneficio
añadido de que la primera instalación real deja de ser solo trabajo interno y
se convierte directamente en el material de venta/onboarding para el cliente
siguiente.

### Pendiente, no resuelto todavía

- Ágora es diseño de alto nivel, sin ningún componente construido -- ni
  siquiera se ha instalado Cyclos para probarlo.
- El modo "Primer arranque" de Plaza (red Wi-Fi temporal de configuración +
  formulario de código de activación) no está construido -- solo diseñado; el
  prototipo de Plaza construido esta misma ronda (ver sección siguiente) cubre
  el portal ya en uso normal, no el asistente de primera puesta en marcha.
- No se ha definido el marco legal/fiscal de vender un kit físico con software
  (¿se factura hardware + servicio? ¿garantía? ¿RGPD del cliente final?) --
  fuera del alcance técnico de este documento, requiere asesoría legal real.
- No existe todavía ninguna instalación física real que grabar para generar el
  primer onboarding -- depende de que el operador haga esa primera instalación.
- No se ha buscado todavía ningún proveedor real de dropshipping de
  electrónica estándar (Raspberry Pi + fuente + caja) -- el diseño asume que
  existe uno viable, no se ha verificado con una cotización real.

## "Plaza" -- prototipo construido y probado con éxito (2026-08-30)

El diseño del portal se construyó de verdad: `G:\Mi unidad\DEVS\engremiat-litellm\plaza\`
(HTML+CSS+JS estático, sin build, instalable como PWA), más tres acciones
nuevas añadidas al backend de n8n (`listar_tareas`, `actualizar_tarea`,
`preguntar_ia`, sumadas a `leer_tarea`/`crear_tarea` del piloto anterior --
mismo workflow, renombrado "Plaza - backend (Baserow + IA local)").

**Probado en el navegador, de punta a punta, con datos reales**:

- **Acceso**: pantalla de entrada con nombre (el PIN real y el QR de onboarding
  quedan pendientes de construir -- el prototipo guarda el nombre localmente
  para personalizar la sesión).
- **Inicio**: los tres semáforos (conexión/datos/IA) funcionan de verdad --
  reflejan si Baserow responde, no son decorativos.
- **Mis tareas**: carga las tareas reales de Baserow (`TAR-0008`, `TAR-0009`),
  y el control de avance (deslizador táctil) escribe de vuelta en Baserow al
  soltar -- verificado leyendo la fila directamente después de mover el
  deslizador.
- **Preguntar**: chat real contra `local-potente` vía LiteLLM -- probado con
  "¿Cómo voy con mis tareas?", respondió con honestidad que no tiene acceso a
  esos datos (el chat todavía no está conectado a la Biblioteca ni a las
  tareas del propio usuario -- pendiente real, no un fallo).
- **Avisar de un problema**: guarda el aviso (de momento en local, pendiente de
  tabla `INCIDENCIA` en Baserow).
- **Biblioteca** y **Ágora**: **conectadas de verdad en una segunda pasada
  (2026-08-30)**, ver más abajo.

### Biblioteca y Ágora, conectadas con datos reales

Se crearon dos tablas nuevas en Baserow -- `DOCUMENTO` (id `834`, con 3
documentos reales generados por Cronista en rondas anteriores: el manual del
amigurumi, el informe del bahareque, un fotograma estilizado) y `AGORA` (id
`833`, con recursos de ejemplo -- ofrecer/necesitar, usuario, estado, saldo) --
mismo procedimiento de importación CSV ya usado para `TAREA` (los tokens de API
de Baserow no permiten crear tablas, solo filas, ver limitación ya documentada).
Tres acciones nuevas en el backend n8n: `listar_documentos`,
`listar_recursos_agora`, `proponer_intercambio`.

**Probado en el navegador con datos reales**: Biblioteca carga y muestra los 3
documentos reales con su título y descripción. Ágora muestra los recursos con
su tipo (🎁 Ofrece / 🙏 Necesita), usuario y saldo, y el botón "Proponer
intercambio" funciona de verdad -- probado proponiendo un intercambio como
"Ana" sobre el recurso de Juan Carlos, verificado que el estado cambió a "En
proceso" y la descripción quedó anotada con quién lo propuso, leyendo la fila
directamente de Baserow después.

### Pendiente, no resuelto todavía

- Login real por PIN/QR contra una tabla de usuarios -- el prototipo no
  autentica a nadie todavía.
- El saldo de Ágora (`SALDO_USUARIO`) es un campo mostrado, no un motor de
  crédito mutuo real -- proponer un intercambio no mueve saldo todavía, solo
  cambia el estado a "En proceso". Falta la lógica de liquidación (y,
  idealmente, migrar esa parte a Cyclos como se diseñó en la sección de
  Ágora).
- Conectar el chat de "Preguntar" con el contenido real de la Biblioteca y las
  tareas del usuario, para que pueda responder con datos propios citando la
  fuente (principio ya establecido en Oportunidad).
- Crear la tabla `INCIDENCIA` en Baserow y conectar "Avisar de un problema" de
  verdad, en vez de guardarlo solo en el navegador del cliente.
- El modo "Primer arranque" descrito en la sección de venta sin stock es una
  extensión de Plaza todavía no construida.
- No probado en un móvil real ni en la Raspberry Pi real, solo en navegador de
  escritorio.

## Diseño: "Plaza" -- el portal local para el cliente (2026-08-30)

### Por qué necesita nombre propio y no es solo "una web"

Se llama **Plaza**, pareja natural de Ágora: si Ágora es el motor de intercambio,
Plaza es el sitio físico/digital donde la gente del nodo entra cada día -- ver
sus tareas, preguntar algo a la IA, mirar el estado del nodo, proponer un
intercambio. No es la Consola Engremiat (esa es gobierno del ecosistema para el
operador, ver sección anterior) -- Plaza es para el usuario final de una
comunidad, alguien que puede no saber qué es una API ni un Sheet.

### Precedente de mercado (ya investigado, no asumido de nuevo)

Todos los competidores serios de esta categoría (Internet-in-a-Box con Kolibri/
Moodle/Nextcloud/WordPress, RACHEL, Project NOMAD) resuelven exactamente este
problema de la misma forma: un navegador apuntando a una dirección local
(`http://caja.local`, `http://rachel.local`), sin instalar nada, porque
cualquier móvil o portátil ya trae un navegador. Plaza sigue ese mismo patrón
probado -- no hay motivo para inventar una app nativa que alguien tendría que
instalar.

### Principios de diseño, no solo pantallas

- **Cero fricción de acceso**: sin contraseña que se pueda olvidar sin internet
  para recuperarla. Login por **PIN corto + nombre**, o una tarjeta con **QR
  personal** entregada en el onboarding presencial (mismo mecanismo ya previsto
  para el "onboarding completamente local" de la sección de Telegram) -- nunca
  email/contraseña tradicional como único camino.
- **Diseño para el hardware real**: móviles de gama baja, conexión Wi-Fi local
  compartida entre 10-30 personas (límite ya estimado para el nodo) -- páginas
  ligeras, imágenes comprimidas, sin frameworks pesados que tarden en cargar en
  una red saturada.
- **Táctil primero**: botones grandes, poco texto por pantalla -- pensado para
  usarse de pie con un móvil, no sentado con teclado.
- **Todo lo que no cambia a menudo, cacheado para funcionar sin red en absoluto**
  (Ayuda, documentos ya vistos) vía Service Worker de PWA -- para que Plaza siga
  funcionando incluso si el propio nodo tiene un problema puntual de Wi-Fi.
- **Nunca un panel de administración disfrazado**: si una pantalla necesita
  explicar "qué es un campo" o "qué es un workflow", es la pantalla equivocada
  para Plaza -- eso vive en la Consola, para el operador.

### Las seis pantallas

1. **Inicio**: estado del nodo en tres semáforos simples -- conexión, energía
   (batería/solar), servicios (¿todo funciona?) -- nada de gráficas técnicas,
   solo verde/ámbar/rojo con una frase.
2. **Mis tareas**: lista de `TAREA` asignadas o visibles para el usuario, con
   un botón para marcar avance -- lectura y escritura mínima contra Baserow, el
   mismo patrón ya probado en el piloto (`leer_tarea`/`crear_tarea`, aquí
   extendido a `actualizar_tarea`).
3. **Biblioteca**: los `DOCUMENTO` generados por Cronista + el contenido
   reutilizado de Internet-in-a-Box/NOMAD (Wikipedia, manuales) -- una sola
   pantalla de búsqueda, sin distinguir para el usuario de dónde viene cada
   cosa.
4. **Preguntar**: chat sencillo contra Ollama (vía LiteLLM, `local-potente`),
   respondiendo solo con lo que hay en la Biblioteca del propio nodo y citando
   qué documento usó -- mismo principio de honestidad ya aplicado en Oportunidad
   ("nunca inventar sin fuente").
5. **Ágora**: recursos ofrecidos/necesitados del nodo, el saldo/reputación
   propio, y un botón para proponer un intercambio -- la interfaz de usuario
   del quinto ciclo diseñado arriba.
6. **Avisar de un problema**: un formulario de una sola pregunta ("¿qué falla?")
   que registra una `INCIDENCIA` -- y si Ejecutor Local está disponible, es la
   misma entrada que usaría un técnico para empezar a diagnosticar.

### Arquitectura, sin reinventar nada ya construido

Plaza es deliberadamente **solo la interfaz** -- toda la lógica ya vive en n8n
y los datos en Baserow, ambos ya probados en el piloto de esta misma ronda.
Un HTML+JS estático (sin build, sin framework pesado, instalable como PWA)
que llama directamente a los webhooks de n8n como si fueran su API -- el mismo
patrón `leer_tarea`/`crear_tarea` ya verificado, ampliado con las operaciones
que faltan (`listar_documentos`, `preguntar_ia`, `listar_recursos_agora`,
`proponer_intercambio`, `registrar_incidencia`). Servido por el propio n8n
(o un servidor estático mínimo en el mismo Pi) -- sin infraestructura nueva.

### Límites, en la misma línea que el resto del sistema

- **Nunca confirmar un intercambio de Ágora sin un paso de confirmación
  explícito** -- ni siquiera dentro de la misma comunidad, aunque el roce
  social actúe como control adicional.
- **El chat de "Preguntar" nunca debe inventar** cuando la Biblioteca no tiene
  la respuesta -- debe decir "no lo sé, esto no está en los documentos del
  nodo" en vez de alucinar, mismo principio ya aplicado en todos los ciclos
  anteriores.
- **El PIN/QR de acceso no sustituye ninguna medida de seguridad seria** para
  datos sensibles -- es una barrera de fricción para el uso diario, no una
  autenticación robusta; si el nodo maneja datos sensibles de verdad, hace
  falta una capa adicional, no resuelta aquí.

### Pendiente, no resuelto todavía

- Ningún componente de Plaza está construido -- diseño de alto nivel, nacido
  directamente de identificar este hueco en la ronda anterior.
- Faltan las operaciones nuevas en n8n (`actualizar_tarea`, `listar_documentos`,
  `preguntar_ia`, `listar_recursos_agora`, `proponer_intercambio`,
  `registrar_incidencia`) -- ninguna existe todavía, solo las dos del piloto
  original.
- El mecanismo exacto de PIN/QR (cómo se genera, cómo se entrega, qué pasa si
  se pierde) no está diseñado en detalle, solo el principio general.
- No se ha decidido el idioma/localización de las pantallas -- pensar en ello
  desde el principio de la construcción, no añadirlo después.

## Normalizar el paquete cliente y centralizar la experiencia Engremiat en una plataforma (2026-08-30)

### El motor de saldos, como primer caso de un patrón general

El operador decide dejar el motor de crédito mutuo de Ágora como **opción
personalizable según tipo de cliente** (ninguno / manual / Cyclos), en vez de
un componente fijo. Esa misma idea, generalizada, es la respuesta a la pregunta
de fondo de esta ronda: **Engremiat no es un producto único y cerrado, es un
núcleo más una serie de módulos activables por cliente** -- Ágora es el primer
módulo donde esto se hace explícito, pero debería aplicar a todos: no todos los
clientes necesitan Oportunidad, ni Pregonero, ni siquiera la bóveda Obsidian.

### Comparación de mercado: quién ya resuelve "muchos servicios, una sola plataforma"

Investigado explícitamente para esta pregunta -- existen productos maduros que
resuelven exactamente el problema de fondo (varios servicios autoalojados en un
Pi, presentados bajo una única experiencia coherente, instalables como
"aplicaciones"):

| Plataforma | Qué resuelve | Relevancia para Engremiat |
|---|---|---|
| **UmbrelOS** | Panel pulido sobre contenedores Docker, tienda de 300+ apps (incluye Nextcloud, Home Assistant, **Ollama**), soporta oficialmente Raspberry Pi 5 | La más cercana de todas -- el propio stack de Engremiat (n8n, Baserow, Ollama) ya son contenedores Docker, exactamente lo que Umbrel sabe empaquetar y presentar |
| **YunoHost** | Catálogo de 500+ apps, más comunitario, corre en Pi 3/4/5, pensado explícitamente para gente sin conocimientos técnicos | Precedente de que "autoalojar muchos servicios con una instalación simple" ya tiene una comunidad grande resolviendo el mismo problema |
| **Home Assistant** | Automatización local-first, la referencia de "panel único y amigable sobre integraciones dispares" en el mundo domótico | Modelo de referencia de UX -- un panel (Lovelace) que oculta la complejidad de decenas de integraciones distintas |
| **Cloudron** | Gestión de apps de nivel profesional/equipo, con SSO y correo -- de pago | Menos relevante (orientado a empresas en VPS, no a comunidades en hardware propio) |

**Conclusión**: no hay que construir un gestor de contenedores, un sistema de
actualizaciones ni una tienda de apps desde cero -- **ese problema ya está
resuelto por Umbrel (el más afín, dado que ya usa Docker+Ollama) o YunoHost**.
Lo que Engremiat aporta y ningún de ellos tiene es el contenido específico:
el esquema de entidades, los ciclos (Ejecutor/Cronista/Pregonero/Oportunidad/
Ágora), y Plaza como interfaz de comunidad -- no de administración de apps.

### Diseño: paquete cliente normalizado

**Núcleo, siempre incluido en cualquier cliente**:
- Motor: n8n + Baserow (o Sheets, para clientes cloud) + Ollama vía LiteLLM.
- Esquema base: `PROYECTO`/`TAREA`/`RECURSO`/`DOCUMENTO`/`INCIDENCIA`.
- Interfaz cliente: **Plaza**, mostrando solo los módulos contratados.
- Interfaz operador: **Consola** (gobierno del ecosistema).

**Módulos opcionales, cada uno instalable/desinstalable de forma independiente**
(cada uno definido por un **manifiesto** -- ver más abajo):

| Módulo | Qué añade | Configuración por cliente |
|---|---|---|
| Ejecutor | Ciclo de cierre de tareas de desarrollo | Solo clientes con código propio |
| Cronista | Documentación desde datos reales | Casi cualquier cliente |
| Pregonero | Contenido de redes sociales | Solo si el cliente hace difusión externa |
| Oportunidad | Detección de negocio/subvención/voluntariado | Solo clientes con foco de crecimiento |
| Ágora | Intercambio de recursos entre usuarios/nodos | Motor de saldo: Ninguno / Manual / Cyclos, a elegir |
| Ejecutor Local | Mantenimiento offline con IA local | Solo nodos con conectividad poco fiable |
| Bóveda Obsidian | Notas enlazadas para el operador/cliente avanzado | Opcional |
| Bot Telegram | Onboarding y avisos cuando hay internet | Opcional, nunca dependencia única |

**El manifiesto de un módulo**, formato propuesto (inspirado directamente en
cómo Umbrel define sus apps -- un `manifest.yml` sencillo, no un formato
inventado desde cero):

```yaml
modulo: cronista
version: 1
tablas_baserow:
  - nombre: DOCUMENTO
    csv_semilla: DOCUMENTO_import.csv
workflows_n8n:
  - archivo: cronista_documentacion.json
pantallas_plaza:
  - biblioteca
```

Esto convierte "instalar un módulo para un cliente" en un proceso **repetible y
documentado** -- exactamente lo que hoy hacemos a mano (importar un CSV,
escribir un workflow a mano, tocar `index.html`) pero con un registro
explícito de qué incluye cada módulo, en vez de reconstruirlo de memoria cada
vez.

### Cómo gestiona y opera el sistema, de un vistazo

```
Cliente nuevo → Consola (operador) elige el paquete (núcleo + módulos)
             → cada módulo aplica su manifiesto (tablas + workflows + pantallas)
             → Plaza del cliente muestra solo lo contratado
             → el cliente opera su día a día sin saber que existen "módulos"
             → el operador, desde la Consola, puede activar un módulo nuevo
               más adelante sin reconstruir nada desde cero
```

### Propuesta generosa: hacia dónde crece esto

Con el núcleo y los cinco ciclos ya diseñados (y varios ya probados con datos
reales), la pieza que falta para hablar de "una plataforma" y no de "un
conjunto de prototipos conectados a mano" es exactamente esta capa de
normalización -- y es deliberadamente la más aburrida de las propuestas de esta
ronda, precisamente porque su valor no es una función nueva sino la
**repetibilidad**: poder dar de alta al décimo cliente con la misma fiabilidad
que al primero, sin que cada instalación dependa de que alguien recuerde a
mano qué CSV había que importar. Una plataforma no se distingue de un montón de
prototipos por tener más funciones, sino por que las mismas funciones se
puedan entregar una y otra vez sin reinventar el proceso cada vez.

### Tabla `PAQUETE_CLIENTE`: creada y conectada (2026-08-30)

Se creó la tabla real en Baserow (id `835`, vía el mismo procedimiento CSV de
siempre), con una columna `SI`/`NO` por módulo (`MODULO_CRONISTA`,
`MODULO_AGORA`, `AGORA_MOTOR_SALDO`, etc.) y una fila de ejemplo. Nueva acción
de backend `leer_paquete`. Plaza ahora **oculta de verdad** de la barra de
navegación cualquier módulo no contratado -- no solo muestra un aviso de "sin
conectar" como antes.

**Probado en el navegador**: se desactivó temporalmente `MODULO_AGORA` en la
tabla, se recargó Plaza, y el botón "Ágora" desapareció de la barra de
navegación (quedaron solo Inicio/Tareas/Biblioteca/Preguntar/Avisar) --
verificado visualmente, y restaurado el valor original después.

**Decisión de diseño explícita**: si `leer_paquete` falla (por ejemplo, sin
red), Plaza deja todo visible en vez de ocultarlo -- fallar abierto, nunca
esconderle a un cliente algo que sí tiene contratado por un error transitorio.

### Manifiestos de módulo: escritos (2026-08-30)

Siete manifiestos reales en `G:\Mi unidad\DEVS\engremiat-litellm\manifiestos\`
(`nucleo`, `paquete_cliente`, `cronista`, `agora`, `ejecutor_local`,
`pregonero`, `oportunidad`), cada uno documentando de verdad -- tablas
concretas con sus IDs reales de Baserow, acciones de n8n existentes, bugs
reales ya corregidos, y honestamente marcados `construido_y_probado` o
`solo_disenado` según corresponda (Pregonero y Oportunidad son placeholders
explícitos, sin nada instalado). No son un instalador automático -- son la
especificación que hoy se sigue a mano, documentada para no depender de la
memoria de una sesión concreta.

### Pendiente, no resuelto todavía

- Los manifiestos son documentación, no ejecutables -- no existe ningún script
  que lea un `.yaml` y aplique sus cambios automáticamente; el proceso de
  instalación sigue siendo manual, solo que ahora está escrito.
- Solo hay un paquete/cliente de prueba -- falta decidir cómo Plaza sabe qué
  fila de `PAQUETE_CLIENTE` corresponde a qué usuario que ha iniciado sesión
  (hoy toma siempre la primera fila).
- No se ha decidido si construir el "instalador de módulos" como scripts
  propios (como se ha hecho hasta ahora) o adoptar directamente Umbrel/YunoHost
  como capa de infraestructura debajo de Engremiat -- decisión de arquitectura
  real, no tomada en esta ronda.
- No se ha definido el catálogo de tiers comerciales (qué combinación de
  módulos se vende como "Básico"/"Comunitario"/"Avanzado") -- esbozado en la
  tabla de módulos, no cerrado como oferta comercial.

## El embudo completo: bot de onboarding → demo local sin compra → conversión (2026-08-30)

### El caso de uso del operador, aterrizado

Un cliente potencial habla con un bot de onboarding, que actúa de asistente de
personalización. Antes de comprar nada, puede **descargar una demo de su
experiencia Engremiat personalizada y probarla en su propio ordenador**. Solo
cuando ya ha probado su propia experiencia decide comprar el kit físico y los
servicios complementarios. Todo esto, escalable y con mínima intervención
humana.

### Precedente de mercado que valida el patrón exacto

**Home Assistant** resuelve, hardware incluido, prácticamente el mismo
problema: el software (Home Assistant OS) se descarga gratis y se prueba en
cualquier máquina que el usuario ya tenga -- solo cuando decide que quiere algo
"listo para usar" compra el hardware oficial (**Home Assistant Green**, 199 USD,
plug-and-play) o una versión más flexible (**Home Assistant Yellow**). Es
literalmente "prueba el software gratis, compra el hardware cuando te
convenzas" -- el mismo embudo que propone el operador, ya validado en un
producto de referencia del propio mundo del autoalojamiento.

La investigación de tendencias 2026 en producto (PLG -- product-led growth)
confirma además el porqué funciona: los usuarios que llegan a un **hito de
activación real** durante una prueba convierten por encima del 80%, frente a
menos del 10% de quienes no lo alcanzan -- y los productos que exigen
configuración manual pierden usuarios de prueba frente a la competencia que
automatiza el arranque. Esto no es una opinión de diseño, es el dato que debe
guiar cómo se construye la demo: **tiene que funcionar sola, y tiene que
mostrar algo relevante para ESE cliente en los primeros minutos**, no una
pantalla vacía genérica.

### Diseño del embudo, reutilizando todo lo ya construido esta ronda

1. **Bot de onboarding** (Telegram, patrón híbrido ya diseñado): 1-2 preguntas
   como máximo -- "¿qué tipo de proyecto tienes?" (taller, cooperativa, ONG,
   vecinal...) y "¿cuántas personas aproximadamente?" -- perfilado progresivo,
   nunca un formulario largo de golpe.
2. **El bot elige un `PAQUETE_CLIENTE`** ya perfilado según la respuesta --
   reutiliza directamente el sistema de manifiestos de módulos ya construido:
   un taller de manualidades recibe Cronista+Ágora activados, una cooperativa
   con vocación de crecer recibe además Oportunidad, etc. Cero trabajo humano
   -- es exactamente para esto que se normalizó el paquete cliente.
3. **Demo local descargable, sin compra**: el bot entrega un paquete
   autoinstalable (un `docker-compose` con n8n+Baserow+Ollama+Plaza) **ya
   sembrado con datos de ejemplo relevantes al sector que el cliente indicó**
   -- no una plaza vacía, sino una que ya tiene tareas, documentos y recursos
   de Ágora con sentido para su caso (el mismo principio que ya se aplicó al
   piloto del amigurumi, generalizado a cualquier sector con contenido de
   muestra generado por IA local si no hay un piloto real de ese sector
   todavía).
4. **El cliente prueba su Plaza personalizada en su propio ordenador** -- sin
   comprar nada, sin dato personal expuesto a nadie, sin que el operador
   intervenga.
5. **Conversión, dentro de la propia demo**: la misma Plaza que está probando
   incluye un aviso persistente y discreto -- "¿te gusta cómo funciona?
   consigue tu nodo físico" -- que enlaza directamente con el flujo de compra
   sin stock ya diseñado (Shopify → autoaprovisionamiento → "Primer arranque").
6. **Continuidad real, no un señuelo**: la demo y el producto real son **el
   mismo software con el mismo paquete de módulos** -- no una versión recortada
   que luego "sorprende" con funciones bloqueadas. Al comprar el kit físico, se
   aprovisiona exactamente el mismo `PAQUETE_CLIENTE` que ya probó, sin volver
   a pasar por el onboarding desde cero.

### Por qué esto es coherente con todo lo demás, no una pieza suelta

Este embudo no añade ninguna pieza nueva -- **conecta cinco cosas ya
construidas o diseñadas esta ronda**: el bot de onboarding (ya diseñado en la
sección de Telegram), Oportunidad (perfil objetivo, aunque aquí el cliente se
autoidentifica en vez de ser detectado), el sistema de manifiestos de módulo
(recién escrito), Plaza (ya construida y probada), y el flujo de venta sin
stock con "Primer arranque" (ya diseñado). El valor de esta ronda es la
conexión, no una función nueva.

### Límites y riesgos, honestos

- **La fricción técnica de "descargar y ejecutar Docker" es real** -- el
  público de Engremiat (comunidades, talleres, cooperativas) puede no tener a
  nadie cómodo con la línea de comandos. Un instalador de un solo clic (que
  empaquete Docker Desktop + el compose) es imprescindible, no un detalle --
  si no existe, se pierde exactamente al perfil de cliente que más necesita el
  producto.
- **Alternativa complementaria, para el perfil menos técnico**: ofrecer también
  una demo **alojada temporalmente por el operador** (una instancia efímera,
  sin descarga) para quien no pueda o no quiera instalar nada -- cuesta
  recursos del operador por sesión, así que no sustituye a la demo
  descargable, la complementa para el segmento que la necesita.
- **Los datos de ejemplo de la demo deben quedar marcados sin ambigüedad como
  ficticios** -- nunca mezclar contenido de muestra con datos reales de otro
  cliente, ni sugerir que la IA "ya conoce" al cliente antes de que exista una
  relación real.
- **Ninguna decisión de compra debe presionarse dentro del propio producto**
  más allá de un aviso discreto -- llenar la demo de banners de venta rompería
  la confianza que se busca transmitir precisamente con la soberanía de datos.

### Pendiente, no resuelto todavía

- No existe ningún `docker-compose` empaquetable ni instalador de un clic --
  diseño de alto nivel únicamente.
- No se ha decidido cómo generar contenido de muestra realista para sectores
  sin un piloto real todavío (solo existe el ejemplo del amigurumi) -- probable
  candidato para el propio LiteLLM local, no probado con este fin.
- No se ha diseñado la demo alojada temporal (la alternativa sin descarga) --
  mencionada como necesaria, no especificada.
- No se ha decidido durante cuánto tiempo o bajo qué condiciones se ofrece la
  demo alojada antes de pedir que el cliente decida.

## Permisos, visión global del operador, e inteligencia colectiva entre nodos (2026-08-30)

### Las dos preguntas de fondo del operador

1. ¿Quién ve qué, cuando existan muchos nodos-cliente y un operador que los
   supervisa a todos?
2. ¿Cómo hace un tutorial generado en UN nodo (el ejemplo del operador: cómo
   construir un gallinero) para convertirse en conocimiento reutilizable por
   CUALQUIER otro nodo, sin romper la soberanía de cada uno?

Son la misma pregunta vista desde dos ángulos: **soberanía por defecto,
compartición explícita**.

### Modelo de permisos, tres niveles

| Nivel | Quién | Qué ve |
|---|---|---|
| **Operador** | El operador del ecosistema (tú) | Vista agregada de todos los nodos -- salud, actividad, qué módulos tiene cada uno (mismo patrón ya en uso en `tools/registro_ecosistema.json`/`salud_ecosistema.mjs`, generalizado ahora de "prompts y triggers" a "nodos cliente") |
| **Nodo/Cliente** | Cada comunidad/cliente | Solo sus propios datos -- aislamiento por defecto, ni siquiera el operador debería necesitar leer el contenido privado de un nodo para operar el ecosistema, solo su estado |
| **Común compartido** | Cualquier nodo que decida publicar | Contenido explícitamente marcado para compartir -- nunca automático |

Esto no es una tabla nueva aislada -- es una extensión natural de
`PAQUETE_CLIENTE` (que ya registra qué módulos tiene cada cliente) añadiendo
quién puede ver qué, y del propio patrón de registro del ecosistema que ya
existe para otra cosa.

### La biblioteca común: no inventar el concepto, ya existe y es maduro

El ejemplo del operador -- un tutorial de cómo construir un gallinero,
aportando a una "inteligencia colectiva" -- es exactamente lo que ya resuelven
dos proyectos reales, maduros, sin ánimo de lucro:

- **Appropedia** ("la wiki de la sostenibilidad"): comunidad global que
  documenta soluciones colaborativas de tecnología apropiada -- literalmente
  planos de bombas de agua, molinos, dispositivos solares, y cualquier
  solución práctica de bajo coste -- bajo licencia Creative Commons
  Compartir-Igual. Además, **ya tiene integración con Kiwix/ZIM en marcha**
  para acceso offline, exactamente el mismo mecanismo de biblioteca offline ya
  recomendado para el Nodo Operativo Comunitario.
- **Open Source Ecology / Global Village Construction Set**: red de
  colaboradores distribuidos documentando de forma modular las 50 máquinas
  necesarias para una civilización pequeña y sostenible -- el precedente
  exacto de "comunidades distintas aportando conocimiento práctico a un fondo
  común, cada una construyendo sobre lo que aportó otra".

**Conclusión de mercado**: no hay que inventar "una wiki de conocimiento
comunitario" desde cero -- Appropedia ya lo es, ya es libre, y ya se puede
empaquetar offline. El trabajo de Engremiat no es construir el común, es
**conectar la generación automática de contenido (Cronista) con ese común ya
existente**, y complementarlo con un común propio para lo que sea demasiado
específico de Engremiat para vivir en Appropedia.

### Diseño: de un tutorial de un nodo a conocimiento colectivo

1. **Base offline compartida por todos los nodos, desde el primer día**: un
   mirror ZIM de Appropedia (mismo patrón que NOMAD/RACHEL/IIAB ya
   recomendado) -- todo nodo arranca con este conocimiento colectivo ya
   incorporado, sin depender de que nadie lo haya generado antes.
2. **Un tutorial nuevo (el gallinero) nace privado**, como cualquier
   `DOCUMENTO` generado por Cronista -- visible solo en la Plaza de ese nodo.
3. **Publicar al común es una decisión explícita**, nunca automática: un botón
   "Compartir con la comunidad Engremiat" en la Biblioteca de Plaza -- el
   mismo principio de puerta humana ya aplicado en Cronista/Oportunidad/
   Pregonero, aquí aplicado a compartir conocimiento en vez de publicar
   contenido externo.
4. **Sincronización oportunista**: como cualquier nodo offline, la
   publicación al común (y la recepción de lo que otros nodos compartieron) se
   sincroniza solo cuando hay conexión -- internet sigue siendo "una visita
   ocasional, no el jefe", el mismo principio que abre este documento.
5. **Formato de destino**: contenido genuinamente universal (una técnica de
   construcción, un proceso agrícola) se propone para subir a Appropedia
   directamente -- beneficia a todo el mundo, no solo a la red Engremiat.
   Contenido específico de la metodología Engremiat (cómo estructurar un
   proyecto de taller, plantillas de proceso) vive en un común propio, más
   pequeño, entre nodos Engremiat.

### Sinergias entre comunidades: Ágora, pero entre nodos

Ágora ya se diseñó con **Community Exchange System** como referencia -- una
red que federa 339 intercambios locales independientes en 34 países, cada uno
soberano, conectados solo cuando quieren intercambiar entre sí. Generalizar
Ágora de "intercambio dentro de un nodo" a "intercambio y relación ENTRE
nodos" es aplicar esa misma federación, con el motor de matching que ya tiene
Oportunidad: en vez de comparar un nodo contra un prospecto externo, compara
**el perfil de un nodo contra el perfil de otro** -- "el Nodo A tiene
excedente de conocimiento en crochet y recursos de Ágora sin cubrir; el Nodo B
declaró una necesidad parecida" -- y **propone** la relación, nunca la
ejecuta sola.

### Límites, no negociables

- **Privacidad por defecto, siempre** -- ningún dato de un nodo es visible
  para otro (ni para el operador, más allá de su estado agregado) sin una
  decisión explícita de compartir.
- **Nunca publicar datos personales al común** -- solo conocimiento práctico
  genérico (técnicas, procesos, planos), nunca información que identifique a
  personas concretas de una comunidad.
- **Toda relación propuesta entre nodos pasa por aprobación humana de ambos
  lados** -- mismo principio ya establecido para Oportunidad, heredado aquí
  sin excepción.
- **Revisar la licencia exacta antes de subir nada a Appropedia** -- Creative
  Commons Compartir-Igual tiene implicaciones reales (cualquier reuso debe
  mantener la misma licencia) que hay que entender antes de contribuir, no
  asumir.

### Pendiente, no resuelto todavía

- Ninguna tabla de permisos ni de común compartido está construida -- diseño
  de alto nivel, nacido de esta conversación.
- No se ha probado la integración Kiwix/ZIM con Appropedia en la práctica --
  la propia Appropedia describe esa integración como "en marcha", no como
  garantizada y estable.
- El matching nodo-a-nodo reutiliza el motor de Oportunidad conceptualmente,
  pero no se ha adaptado el código real para comparar dos perfiles de nodo en
  vez de un nodo contra un prospecto externo.
- No se ha decidido el mecanismo técnico exacto de sincronización oportunista
  entre nodos y el común (qué protocolo, con qué frecuencia, quién aloja el
  punto de encuentro cuando ningún nodo tiene IP pública).

## Simulación del ciclo completo del cliente + UX de adopción para público no técnico (2026-08-30)

### El ciclo completo, de principio a fin, con las piezas ya construidas

1. **Descubrimiento**: bot de onboarding (Telegram) -- 1-2 preguntas, perfila
   al cliente.
2. **`PAQUETE_CLIENTE` elegido**: según el perfil, el sistema propone qué
   módulos activar (manifiestos ya escritos).
3. **Demo local sin compra**: el cliente prueba su Plaza personalizada en su
   propio ordenador.
4. **Compra**: Shopify → autoaprovisionamiento (`crear_solicitud_montaje`,
   ya construido) → kit genérico enviado sin personalizar.
5. **"Primer arranque"**: el cliente flashea su propia SD (Raspberry Pi
   Imager), Plaza levanta el asistente de primera puesta en marcha,
   autodiagnóstico con los tres semáforos.
6. **Uso diario**: Plaza -- tareas, biblioteca, preguntar, ágora, según lo
   contratado.
7. **Escalar y personalizar -- la pieza nueva de esta ronda**: el cliente pide
   una mejora ("quiero llevar un inventario de material", "necesito un módulo
   nuevo") **sin saber que existen módulos, tablas o workflows** -- solo lo
   describe en su propio lenguaje.

### Diseño del paso 7: "Pedir una mejora", conectado al bus de trabajo ya existente

Nueva pantalla de Plaza, reutilizando **el mismo `92_BUS_TRABAJO`** que ya
gobierna el ciclo Ejecutor (reclamada → en_progreso → lista_para_revisión →
verificada) -- no se inventa un sistema de tickets nuevo, se generaliza el que
ya existe de "tareas de desarrollo interno" a "solicitudes de cliente":

1. El cliente describe lo que quiere, en texto o **nota de voz** (ver más
   abajo por qué la voz importa aquí especialmente).
2. Se crea un item en el bus de trabajo, visible para el operador y para
   Ejecutor Local.
3. **Ejecutor Local intenta resolver lo que esté dentro de su catálogo
   acotado** (activar un módulo ya manifestado, ajustar un campo) --
   confirmando con el cliente antes de aplicar, igual que ya hace.
4. **Lo que exceda ese catálogo se encola para el operador** (o para una
   sesión de Claude/Ejecutor completo cuando haya conexión) -- el cliente no
   necesita saber la diferencia, solo ve el estado de su solicitud.

### Investigación: qué funciona de verdad para adopción digital en público no técnico

No es una cuestión de opinión de diseño -- hay evidencia real y contundente:

- **Digital Green** (extensión agrícola por vídeo participativo en India):
  aumentó la adopción de prácticas agrícolas **7 veces** frente al método
  clásico de extensión, y fue **10 veces más rentable por dólar invertido**,
  en un ensayo con 1.470 hogares en 16 pueblos. El hallazgo clave: la gente
  adopta mejor viendo a **personas parecidas a ellos mismos** (vecinos, otros
  agricultores) en vídeo, no a expertos ni funcionarios -- y funciona mejor
  con **mediación humana local** (alguien de la propia comunidad que pone el
  vídeo, pausa, y genera conversación), no como una herramienta puramente
  autoservicio.
- **Onboarding visual**: según Forrester, el onboarding visual aumenta la
  comprensión un 80% frente a onboarding solo de texto.
- **Onboarding progresivo**: introducir funciones gradualmente, cuando son
  relevantes para el momento del usuario, evita la sobrecarga cognitiva --
  principio de diseño 2026 confirmado, no una moda.
- **Interfaces con voz**: para usuarios con baja alfabetización o poca
  comodidad con el teclado, la voz reduce la barrera de entrada de forma
  medible.

### Cómo esto corrige y mejora el diseño ya hecho

**Corrección importante sobre "mínima intervención humana"**: la evidencia de
Digital Green sugiere que eliminar TODA mediación humana puede, de hecho,
**reducir** la adopción en el público objetivo de Engremiat -- la solución no
es cero personas, es trasladar la mediación humana **de fuera hacia dentro de
la propia comunidad**: proponer, como parte del kit, identificar a una
**persona de referencia del nodo** (no necesariamente técnica, solo alguien
de confianza local) que acompañe a los demás -- coste cero para el operador,
pero con el efecto multiplicador que muestra la evidencia.

**Mejoras concretas a Plaza y Cronista/Pregonero, derivadas de esta
investigación**:
- El contenido que Cronista/Pregonero genera para mostrar el producto debería
  priorizar **vídeos/casos de otros clientes reales** (parecidos al prospecto)
  sobre material de marketing genérico -- mismo principio que multiplicó por 7
  la adopción en Digital Green.
- **Onboarding progresivo real en Plaza**: no mostrar las seis pantallas desde
  el primer día -- revelar Biblioteca/Ágora/Pedir-una-mejora conforme el
  usuario ya se siente cómodo con Tareas y Preguntar, no todo de golpe.
- **Entrada por voz** en "Preguntar" y en "Pedir una mejora" -- transcripción
  local (un modelo de voz a texto vía Ollama, no probado todavía) para no
  depender de que el usuario escriba bien o rápido.
- **Más imagen, menos texto**: reutilizar las imágenes que `render-worker` ya
  genera (infografías, fotogramas estilizados) también dentro de la propia
  Plaza, no solo en la Biblioteca -- cada pantalla debería apoyarse en un
  icono/imagen antes que en un párrafo.

### Límites y honestidad

- El "coste cero" de la mediación humana comunitaria es una simplificación --
  en la práctica, alguien tiene que identificar y motivar a esa persona de
  referencia, que sí es trabajo del operador en el arranque de cada nodo, no
  gratis del todo.
- La entrada por voz añade una dependencia técnica nueva (transcripción local)
  no probada todavía en este stack.
- No se ha verificado que el bus de trabajo (`92_BUS_TRABAJO`, diseñado para
  trabajo interno de desarrollo) escale bien a solicitudes de muchos clientes
  distintos a la vez -- diseño extrapolado, no probado a ese volumen.

### Pendiente, no resuelto todavía

- Ninguna pantalla "Pedir una mejora" está construida en Plaza -- diseño de
  alto nivel.
- No se ha decidido el mecanismo de identificar/incentivar a la "persona de
  referencia del nodo" -- mencionado como necesario, no especificado.
- No se ha probado transcripción de voz local en este stack.
- No se ha simulado este ciclo completo con un cliente real de principio a
  fin -- sigue siendo, en su mayoría, piezas construidas por separado y
  conectadas sobre el papel.

## Primera descentralización real: núcleo desplegado en la Raspberry Pi física (2026-08-30)

Ya no es solo diseño de papel: el núcleo (n8n + Baserow) corre de verdad en la
Raspberry Pi física del operador, no solo en su PC. Se dejó configurado, de
forma reutilizable: acceso SSH sin contraseña, sudo acotado sin contraseña
(solo `apt-get`/`apt`/`docker`/`systemctl`, nunca root total), Claude Code
instalado y autenticado con Remote Control activo, y el propio repo
`engremiat.claude` clonado en la Pi -- cualquier sesión futura de Claude Code
ahí arranca con todo el contexto de este documento, sin transferir ninguna
conversación.

**Hallazgo real que hay que incorporar al diseño del kit físico**: el primer
arranque completo (descarga de imágenes + extracción + las ~600 migraciones
de base de datos de Baserow) tardó **más de una hora** en la tarjeta microSD
de serie de la Pi -- confirmado que no fue un cuelgue, solo la velocidad de
escritura de una SD genérica siendo el cuello de botella real. Esto obliga a
un ajuste concreto en el diseño de "Primer arranque" de Plaza (sección de
venta sin stock): **hay que avisar al cliente de que la primera puesta en
marcha puede tardar más de una hora**, y recomendar en la ficha del producto
una microSD clasificada A1/A2 (o un SSD por USB) en vez de la que suele venir
de fábrica -- no es un detalle menor, es la diferencia entre que el cliente
piense que el kit viene roto o que sepa que es normal esperar.

## Cierre de jornada -- consolidado, pendiente y prioridades (2026-08-30)

### Lo consolidado hoy, no solo diseñado -- probado con datos y hardware reales

- **Primera descentralización real**: la Raspberry Pi física dejó de ser un
  concepto -- tiene SSH sin contraseña, sudo acotado y auditable, Claude Code
  instalado y autenticado con Remote Control, y el repo clonado con todo el
  contexto de este documento.
- **El núcleo (n8n + Baserow) corre en la Pi**, no solo en el PC -- con el
  hallazgo real del tiempo de primer arranque en microSD, ya incorporado al
  diseño del kit.
- **Plaza corre en la Pi, con sus propias tablas, y las seis pantallas
  funcionan de verdad**, incluida la IA -- verificado en el navegador, con
  datos reales, después de resolver dos bugs de infraestructura genuinos (el
  onboarding roto de Baserow, y el perfil de red "Público" de Windows/Avast
  bloqueando todo el tráfico entrante).
- **Almacenamiento externo montado y persistente** (disco de 1TB, estructura
  de carpetas lista para cuando llegue el SSD de 4TB).
- **Todo verificado como realmente local**, por auditoría de código, no por
  suposición -- ni Plaza ni el workflow de n8n contactan ningún host de
  internet.

### Lo que queda pendiente, priorizado con honestidad

**Bloqueante o casi -- hace falta para que el prototipo sea presentable**:
1. Login real por PIN/QR (hoy es un campo sin validar).
2. Tabla `INCIDENCIA` en Baserow -- "Avisar de un problema" solo guarda en el
   navegador del cliente, no llega a ningún sitio todavía.
3. Migrar los volúmenes de Docker (Baserow/n8n) al SSD en cuanto llegue --
   la microSD ya demostró ser un cuello de botella real, no conviene seguir
   operando el nodo sobre ella a medio plazo.

**Importante pero no bloqueante -- mejora la experiencia, no impide probar
el sistema**:
4. Conectar "Preguntar" con el contenido real de la Biblioteca y las tareas
   del usuario (citando la fuente, nunca inventando).
5. Biblioteca offline real (mirror Kiwix/Appropedia) -- hoy solo hay 3
   documentos de ejemplo.
6. Prueba de aceptación final desconectando el WAN del router (no solo
   auditoría de código) -- la validación más exigente, todavía no hecha.

**Diseñado pero deliberadamente sin construir -- esperar a necesidad real**:
7. Ágora con motor de saldo real (Cyclos) -- queda como opción configurable,
   no se construye hasta que un cliente concreto lo pida.
8. Pregonero y Oportunidad -- diseño completo, cero código, correctamente
   marcados como tal en sus manifiestos.
9. El modo "Primer arranque" autogestionado de Plaza (red Wi-Fi temporal +
   activación) -- necesario para vender sin stock, no construido todavía.

### La prioridad real, mientras se analizan las necesidades del cliente

El error más caro en este punto sería seguir añadiendo módulos nuevos
(Pregonero, Oportunidad, el motor de Ágora) antes de tener un cliente real
que diga cuál de ellos hace falta primero -- ya se ha dicho varias veces en
este documento y hoy es el día en que más se nota: **hay más superficie
diseñada que superficie usada**. La prioridad no es construir más, es:

1. **Convertir el despliegue de hoy en la primera pieza real de onboarding**
   -- literalmente grabar (o documentar paso a paso) esta misma sesión de
   instalación y pasarla por Cronista, exactamente como se diseñó en la
   sección del embudo de venta. Ya existe el caso de uso real, hoy, no hace
   falta esperar a un cliente para generarlo.
2. **Cerrar los tres pendientes "bloqueantes"** (login, incidencias, migración
   a SSD) antes de enseñarle esto a nadie externo -- son los que harían que un
   cliente real notara que "algo no está terminado".
3. **No tocar Pregonero, Oportunidad ni el motor de Ágora** hasta que un
   cliente real (o un piloto con una comunidad concreta) diga cuál de los tres
   necesita antes -- diseñarlos ya fue el trabajo de hoy; construirlos sin esa
   señal sería adivinar.
4. **Cuando llegue el SSD**, migrar antes de seguir añadiendo carga al nodo --
   la molestia de la SD lenta ya se sintió hoy, no conviene repetirla con más
   datos reales encima.

### Roadmap y baseline, para autogestión asistida (2026-08-30)

El punto 1 de la lista anterior ("pasar el despliegue de hoy por Cronista")
queda desarrollado como documento propio, no como una idea suelta:
[`ROADMAP_BASELINE_ENGREMIAT.md`](ROADMAP_BASELINE_ENGREMIAT.md) --
escrito deliberadamente en el mismo formato que un tutorial real (fases con
intención breve + tareas atómicas), para que pueda pasar literalmente por
el workflow Cronista contra una `ENTIDAD_ORGANIZATIVA` que representa a
Engremiat como su propio operador. Incluye la propuesta de valor generosa
pedida, una generalización explícita de la metodología de alta de cliente
(el mismo bot/formulario para una persona, una familia o una asociación,
sin ramas de código separadas), y una tabla baseline con el estado real de
cada pieza a día de hoy, pensada para compararse contra futuras revisiones
del roadmap en vez de reescribirse desde cero cada vez.

Límite honesto: el documento en sí no se ha pasado todavía por Cronista --
es el contenido de entrada, la ejecución real (punto 12 de su Fase 3) sigue
pendiente.

### Primera prueba real, y una corrección de documentación (2026-08-30)

Al intentar ejecutar el punto 12 de la Fase 3 aparecieron dos hallazgos
reales, documentados con detalle en `ROADMAP_BASELINE_ENGREMIAT.md`,
sección "Primera prueba real de segmentación":

- **Corrección**: no existe todavía ningún workflow n8n que segmente un
  documento en tareas vía LLM -- varios manifiestos (`asociacionismo.yaml`)
  daban esto por construido cuando no lo estaba. Ya corregido en el propio
  manifiesto.
- **Prueba directa contra LiteLLM** (sin esperar al workflow): se creó la
  fila `ENTIDAD_ORGANIZATIVA` para Engremiat en la Pi (id 3) y se probó la
  segmentación llamando al modelo local con el prompt que Cronista debería
  usar. Resultado: 18 tareas limpias, sin fusiones ni cortes, con un solo
  fallo real -- una tarea tomó el nombre de fichero equivocado, cruzado
  desde una tabla 60 líneas más abajo en el mismo documento. Confirma la
  necesidad de la "puerta humana" antes de escribir nada en `TAREA`, no
  invalida el enfoque.

### El workflow con puerta humana, construido de verdad (2026-08-30)

Construido y activo: `Cronista - Segmentar documento en tareas (con puerta
humana)` (n8n, id `140Zt0iiSfjMl7dD`) -- `proponer_tareas` nunca escribe en
Baserow, solo devuelve la lista para revisión; `confirmar_tareas` escribe
solo lo que un humano ya aprobó. Detalle completo, incluida una **segunda
prueba de segmentación peor que la primera** (incluyó como tarea un
recordatorio que no lo era, mezcló fases, omitió tareas reales) y la
verificación real del tramo de escritura (2 filas creadas y confirmadas en
`TAREA`, ids 3 y 4), en `ROADMAP_BASELINE_ENGREMIAT.md`, sección "Workflow
real construido, y una segunda prueba peor que la primera".

## El cliente concreto ya existe: interfaz normalizada por fase, mobile-first (2026-08-30)

### Quién es el cliente, para que el diseño deje de ser abstracto

Ya existe un documento propio (`PROPUESTA_APOYO_AUTONOMIA_NEURODIVERGENCIA.md`,
2026-08-25) que define el caso real: personas neurodivergentes que necesitan
**orden y acompañamiento**, con principios ya fijados que ahora deben
traducirse en interfaz -- no repetirlos aquí, pero sí que la interfaz los
respete: *"normalizar lo mínimo para poder llegar a hacer un poquito más"*,
capacidad diaria variable (no fija), *"consent beats compliance"* (ningún
recordatorio se impone), y el principio de que **el diseño se valida en los
márgenes, no en el usuario promedio** -- diseñar para esta persona primero
sirve mejor a todos los demás clientes que diseñar genérico y adaptar después.

### Precedente de mercado que valida el enfoque, con evidencia real

**Tiimo** (planificador visual para TDAH/autismo, más de 500.000 usuarios
activos, certificación NHS) es la referencia directa -- ya validada
clínicamente, no una intuición de diseño:

- **Cronología visual, no lista de texto**: organiza las actividades en una
  línea de tiempo visual -- qué toca ahora, qué viene después -- en vez de una
  lista plana. Reduce la carga cognitiva de "traducir" texto a plan mental.
- **Sistema personalizable, no un estilo único**: más de 3.000 colores e
  iconos personalizables para que cada persona construya el sistema visual que
  funciona para su cabeza -- no hay un "diseño correcto" universal.
- **Accesibilidad integrada de fábrica, no añadida después**: VoiceOver,
  control por voz, texto ampliable, modo oscuro -- tratados como núcleo del
  producto, no como opción avanzada escondida.
- **Diseño sensorial deliberado**: reduce el desbordamiento sensorial de
  forma explícita, no solo "se ve bonito".

**Conclusión de mercado**: no hay que inventar cómo diseñar para esta
audiencia -- ya hay un producto maduro, clínicamente validado, con 500k
usuarios, que demuestra qué funciona. La `Mis tareas` de Plaza (hoy una lista
plana de tarjetas) debería evolucionar hacia una **línea de tiempo visual**
al estilo Tiimo, no seguir siendo una lista de texto con barra de progreso.

### Telegram como canal, con patrones reales investigados

El bot de onboarding (Telegram) ya diseñado necesita reglas de UI concretas,
no solo "hacer preguntas" -- investigado contra la documentación real de la
plataforma:

- **Teclado de respuesta (Reply Keyboard) para el menú persistente** -- igual
  papel que la barra de navegación inferior de Plaza, para que cambiar de
  Telegram a Plaza no obligue a reaprender nada.
- **Teclado en línea (Inline Keyboard) solo para acciones puntuales** ligadas
  a un mensaje concreto (confirmar, elegir una opción) -- nunca como menú
  general.
- **Editar el mensaje en el sitio (`editMessageText`) en vez de mandar
  mensajes nuevos** -- evita que el chat se llene de mensajes acumulados, un
  factor de sobrecarga real para alguien con función ejecutiva afectada, no
  solo una preferencia estética.
- **Paginar cualquier lista de más de ~5 elementos** -- un teclado demasiado
  alto empuja el mensaje fuera de pantalla, mala UX documentada por la propia
  plataforma.
- **Máximo 4 columnas de botones** si una parte relevante de los usuarios
  puede estar en escritorio -- límite real de la plataforma, no una elección
  de estilo.

### La hoja de estilos normalizada, ligada a la fase del cliente

La pregunta de fondo del operador -- "qué ve y qué puede hacer cada tipo de
cliente según la fase del onboarding" -- ya tiene la pieza de datos resuelta
(`PAQUETE_CLIENTE`, ya construida) pero le falta una dimensión: hoy solo dice
qué MÓDULOS están activos (Cronista sí/no, Ágora sí/no); falta una **fase de
complejidad**, independiente del módulo, que decida cuánto de cada módulo se
muestra. Confirmado por la investigación de mercado 2026: el onboarding
estructurado y progresivo mejora la retención un 50% frente a paneles vacíos
o completos desde el primer día -- Stripe, como referencia citada, revela
complejidad solo cuando el usuario está listo para ella, nunca antes.

**Diseño propuesto -- tres fases, no una activación binaria**:

| Fase | Qué ve el cliente | Principio que aplica |
|---|---|---|
| **1. Arranque** | Solo Inicio + Mis tareas (línea de tiempo visual, pocas tareas a la vez) | "Normalizar lo mínimo" -- ni Ágora ni Biblioteca existen todavía para este cliente |
| **2. Estable** | + Biblioteca, + Preguntar | Se añade cuando la fase 1 ya es rutina, nunca por defecto desde el día uno |
| **3. Ampliar** | + Ágora, + Pedir una mejora | Solo si el cliente (o su red de apoyo, con consentimiento explícito) decide escalar |

Esto no sustituye a `PAQUETE_CLIENTE` -- lo completa con una columna nueva
(`FASE_CLIENTE`) que Plaza ya sabe leer (mismo mecanismo de
`aplicarPaquete()` ya construido y probado hoy), sin rediseñar nada desde
cero.

**La hoja de estilos como sistema de tokens, no solo CSS suelto**: Plaza ya
usa variables CSS para color/tema -- formalizarlo como lo hacen los sistemas
de diseño white-label reales investigados (Atlassian, Salesforce, Shopify
publican los suyos abiertos bajo este mismo modelo): un token de acento
personalizable por cliente (como los 3.000 colores de Tiimo, pero acotado a
una paleta accesible predefinida, no libre del todo -- para no comprometer
contraste ni legibilidad), tamaño de texto ajustable, y modo de contraste
alto además del claro/oscuro ya implementado.

### Límites y honestidad

- Ninguna de estas mejoras (línea de tiempo visual, fases de complejidad,
  tokens personalizables) está construida todavía -- diseño de alto nivel
  nacido de esta conversación.
- El bot de Telegram sigue siendo el diseñado en rondas anteriores
  (`bot-local.mjs`) -- no se le han aplicado todavía los patrones de UI reales
  encontrados hoy (editar en el sitio, paginación, teclados diferenciados).
- Cualquier trabajo con datos reales de discapacidad/salud de un cliente
  concreto requiere la consulta legal ya señalada en el documento de
  neurodivergencia (RGPD artículo 9) -- no asumido, sigue pendiente.
- No se ha decidido si Engremiat necesita distribución como app nativa
  (tiendas de aplicaciones) o basta con la PWA ya construida en Plaza -- dado
  el principio de soberanía de todo este documento, la PWA autoalojada es la
  opción por defecto, no la app nativa con gatekeeper de terceros, salvo que
  aparezca una necesidad concreta que lo justifique.

### Pendiente, no resuelto todavía

- La columna `FASE_CLIENTE` no existe en `PAQUETE_CLIENTE` -- diseño, no
  implementación.
- La "línea de tiempo visual" de Mis tareas no está construida -- Plaza sigue
  mostrando una lista de tarjetas plana.
- Los patrones de Telegram (editar en el sitio, paginación, teclados
  diferenciados) no se han aplicado al bot real todavía.
- El sistema de tokens personalizables (acento, tamaño de texto, contraste
  alto) no está construido -- hoy Plaza solo distingue claro/oscuro por
  preferencia del sistema.

## De 1 persona a red social: diseñar atómico, preparado para escalar (2026-08-30)

### La idea del operador, aterrizada

Hoy el cliente es una persona (1 persona = 1 usuario). Pero el diseño final
para este perfil no es un gestor de tareas personal -- es una **red social**:
eventos, actividades, calendarios compartidos, intereses comunes entre
personas neurodivergentes. La instrucción del operador es correcta y barata
de aplicar ahora: **diseñar el modelo de datos ya pensando en red, aunque hoy
solo exista un nodo con una persona** -- evita una migración costosa después.

### No construir una red social desde cero -- ya existe, es libre y federada

**Mobilizon** (Framasoft, código abierto, parte del Fediverse vía ActivityPub)
es exactamente la pieza que falta: gestión de eventos, grupos, RSVP,
discusión de grupo y directorio de recursos -- diseñado explícitamente como
alternativa ética a Facebook Events/Meetup. Datos reales: 79 instancias
activas, más de 4.000 grupos, más de 376.000 eventos creados. Autoalojable,
coherente con toda la soberanía de este documento -- y al ser federado vía
ActivityPub, **encaja de forma literal con las "sinergias entre nodos" ya
diseñadas** (la misma idea que llevó a usar Community Exchange System como
referencia para Ágora): cada nodo/hogar podría tener su propia instancia
Mobilizon, federada con las demás, sin que nadie dependa de un servidor
central ajeno.

**Reparto de responsabilidades, sin solapar**: Ágora (ya diseñada) resuelve el
intercambio de recursos/habilidades; Mobilizon resolvería eventos/actividades/
calendario compartido -- dos capas complementarias de la misma federación
entre nodos, no dos proyectos distintos.

### Qué aportan las apps específicas para población neurodivergente (investigadas, no copiadas literalmente)

Existen ya productos comerciales enfocados en esta audiencia concreta
(Synchrony, Kaboose, ND Connect, Blausm) -- ninguno es código abierto, así
que no se adoptan como pieza, pero sus decisiones de diseño sí son evidencia
útil de qué funciona con esta población real:

- **Notificaciones de baja presión**: comunicación pensada para no generar
  urgencia ni ansiedad -- nunca insignias rojas ni recordatorios que se
  sientan como una exigencia (coherente con *"consent beats compliance"* ya
  fijado en el documento de neurodivergencia).
- **Preferencias de comunicación individuales**: no todo el mundo se
  comunica igual -- alguien prefiere texto, otro voz, otro un formato visual
  -- el sistema debe permitir elegir, no imponer un único canal.
- **Filtrado por interés y sensibilidad, no solo geografía**: emparejar
  actividades y personas por afinidad real e incluso por sensibilidades
  concretas (ruido, luz, aforo), no solo por cercanía.

### Diseño del modelo de datos: atómico hoy, listo para red mañana

Para que escalar de 1 persona a una red no exija rehacer nada, las entidades
nuevas (`INTERES`, `DISPONIBILIDAD`, `EVENTO`) se diseñan desde ya con una
referencia a `PERSONA_ID`/`NODO_ID`, aunque hoy solo exista una fila -- el
mismo principio de "capacidad diaria autorreportada" (spoon theory) ya
recogido en el documento de neurodivergencia se convierte, con esta
referencia, en el dato que después permite proponer actividades que encajen
con la capacidad real de cada persona ese día, no solo con su interés
declarado.

**Módulo nuevo en el catálogo de manifiestos**: `red-social` (o el nombre que
se decida), dependiente de `nucleo` y con Mobilizon como servicio externo
integrado -- **deliberadamente no se construye ahora**, seguirá el mismo
criterio ya fijado hoy de "no tocar módulos nuevos sin señal real de
necesidad": mientras exista un solo nodo/persona, no hay red que gestionar.

### Límites, heredados del documento de neurodivergencia

- Cualquier dato de intereses/disponibilidad/sensibilidades es información
  personal sensible si se cruza con condición de salud -- mismo aviso de RGPD
  artículo 9 ya señalado, reforzado aquí porque una red social implica
  visibilidad entre personas, no solo almacenamiento privado.
- Ninguna conexión entre personas o nodos debe ser automática -- opt-in
  explícito siempre, mismo principio ya aplicado a Oportunidad y a la
  biblioteca común.

### Pendiente, no resuelto todavía

- Mobilizon no está instalado ni probado en ningún nodo -- diseño de
  intención, no validado técnicamente.
- El módulo `red-social` no tiene manifiesto escrito todavía.
- Las entidades `INTERES`/`DISPONIBILIDAD`/`EVENTO` no existen en ninguna
  Baserow real -- diseño conceptual únicamente.
- No se ha decidido si Mobilizon corre por nodo (un hogar = una instancia) o
  centralizado para varios hogares -- decisión de arquitectura real, pendiente
  de con cuántos hogares reales se empiece a probar.

## Manifiesto escrito y valoración estratégica: producto B2B para asociaciones (2026-08-30)

### El manifiesto de `red_social`, escrito

`G:\Mi unidad\DEVS\engremiat-litellm\manifiestos\red_social.yaml` -- documenta
Mobilizon como servicio a integrar, tres tablas nuevas (`INTERES`,
`DISPONIBILIDAD`, `EVENTO`, todas con referencia a `PERSONA_ID`/`NODO_ID`
desde el diseño), las acciones y pantalla de Plaza propuestas, y dejó
explícito un hueco: falta el manifiesto hermano `asociacionismo`, que nace de
la valoración estratégica siguiente.

### El giro de modelo de negocio, aterrizado

La observación del operador cambia quién es el cliente que paga: existe ya
mucho asociacionismo real (familias, adultos TEA y otras neurodivergencias
organizados en asociaciones) -- el producto comercial no es "una app para una
persona", es **un servicio de integración por proyectos cooperativos**, donde
**la asociación es el cliente institucional** (paga, se da de alta, tiene
socios) y las personas neurodivergentes son las usuarias finales de Plaza,
cooperando entre sí y con socios de OTRAS asociaciones vía proyectos de
formación y construcción cooperativa.

### Comparación de mercado: el hueco real, verificado

| Categoría | Quién ya lo hace | Qué le falta a esa solución |
|---|---|---|
| Gestión de socios/asociaciones | WildApricot, Member365, MemberClicks, YourMembership, AMO | Resuelven cuotas, eventos, comunicación -- **ninguno ejecuta proyectos cooperativos reales entre socios**, son gestión administrativa, no producción |
| Decisión de grupo / deliberación cooperativa | **Loomio** (AGPL, cooperativa de trabajadores, usado en 100+ países por cooperativas y ONGs) | Resuelve cómo un grupo decide qué hacer (propuestas, votaciones, decisiones por tiempo) -- no ejecuta ni documenta el proyecto una vez decidido |
| Eventos/calendario entre asociaciones | Mobilizon (ya evaluado arriba) | Resuelve la convocatoria, no la ejecución del proyecto en sí |
| Ejecución y documentación de proyectos cooperativos reales | **Ninguna encontrada** | Este es el hueco -- exactamente lo que Cronista + Ejecutor + manifiestos de módulo ya hacen |

**Conclusión de mercado, la más clara de toda esta serie de sesiones**: el
software de gestión de asociaciones (categoría madura, muchos competidores) y
el software de deliberación cooperativa (Loomio, maduro y libre) **no se
solapan con lo que Engremiat ya sabe hacer** -- convertir un proyecto real
(un tutorial, una idea, una convocatoria decidida en grupo) en tareas
estructuradas, documentación generada y seguimiento real. Nadie identificado
en la investigación une las tres piezas.

### Diseño del producto comercial

1. **`ASOCIACION`** (nueva entidad, cliente institucional) -- tiene su propio
   `PAQUETE_CLIENTE`, igual que hoy lo tiene un nodo/persona, pero paga por
   el conjunto de sus socios, no por persona individual.
2. **`SOCIO`** -- persona vinculada a una `ASOCIACION`, con sus propios
   `INTERES`/`DISPONIBILIDAD` (módulo `red_social` ya manifestado).
3. **Loomio (nuevo, a evaluar)** para que los socios decidan en grupo qué
   proyecto de formación/construcción cooperativa emprender -- antes de que
   nada se documente, el grupo lo decide, nunca una persona lo impone (mismo
   principio ya fijado: *"consent beats compliance"*).
4. **Cronista + Ejecutor (ya construidos)** convierten la decisión del grupo
   en un plan de proyecto real, con tareas ajustadas a interés y capacidad
   declarada de cada socio (mismo mecanismo ya diseñado para el caso
   individual, ahora aplicado a un grupo).
5. **Mobilizon (ya evaluado)** organiza las sesiones presenciales del
   proyecto, dentro de la asociación y federado con otras.
6. **Ágora (ya construido)** permite intercambiar recursos/habilidades entre
   socios de la misma asociación o de asociaciones distintas.
7. **Oportunidad (ya diseñado)** cierra el círculo -- ayuda a la propia
   asociación a encontrar la subvención o el voluntariado técnico que
   financia estos proyectos, no solo a Engremiat a encontrar clientes.

### Por qué esto es coherente y no una pieza suelta

Ningún componente de este producto es nuevo -- **es la reorganización de
seis piezas ya construidas o diseñadas esta misma serie de sesiones**
(Cronista, Ejecutor, Ágora, Mobilizon/red_social, Oportunidad, el sistema de
manifiestos) alrededor de un cliente institucional en vez de individual. El
valor de esta ronda es la reorganización comercial, no una función técnica
nueva -- coherente con el propio principio ya fijado hoy: la plataforma no se
distingue por tener más funciones, sino por poder entregarlas de forma
repetible a un cliente distinto.

### Límites y honestidad

- Ninguna pieza de este producto (`ASOCIACION`/`SOCIO`, Loomio) está
  construida -- valoración estratégica y de mercado, no implementación.
- El tratamiento de datos de socios de una asociación de personas con
  discapacidad/neurodivergencia entra de lleno en RGPD artículo 9 -- la
  asociación como cliente institucional probablemente ya tiene su propio
  responsable de tratamiento y protocolo, hay que integrarse con eso, no
  asumir que Engremiat parte de cero en cumplimiento.
- No se ha contactado ni validado con ninguna asociación real todavía -- toda
  la sección es una hipótesis de mercado bien fundamentada, no una necesidad
  confirmada por un cliente institucional real.
- Cobrar por asociación (no por socio) es una hipótesis de modelo de precio,
  no una decisión cerrada -- depende del tamaño real de las asociaciones que
  se aborden primero.

### Manifiesto `asociacionismo`, escrito (2026-08-30)

`G:\Mi unidad\DEVS\engremiat-litellm\manifiestos\asociacionismo.yaml` --
documenta las entidades `ASOCIACION`/`SOCIO`/`DECISION_GRUPO`, la integración
con Loomio, y cómo conecta con cada módulo ya existente (Cronista/Ejecutor,
Ágora, red_social, Oportunidad). Deja explícita una decisión de arquitectura
real todavía sin resolver: `PAQUETE_CLIENTE` hoy asume una fila por
nodo/persona -- una asociación es un nivel institucional por encima, con
varios socios debajo, y no está decidido si el paquete se aplica a la
asociación entera en cascada o si cada socio conserva el suyo propio dentro
del paraguas de la asociación.

### Pendiente, no resuelto todavía

- Nada de este módulo está construido -- ni las tablas, ni Loomio, ni las
  acciones ni la pantalla de Plaza.
- La decisión de arquitectura sobre el alcance de `PAQUETE_CLIENTE`
  (asociación vs. socio individual) sigue abierta.
- Ninguna conversación real con una asociación de familias/personas TEA u
  otras neurodivergencias -- validar esta hipótesis de mercado es el paso
  lógico antes de construir nada de esta sección.
- Loomio no evaluado técnicamente (instalación, integración con el resto del
  stack) -- solo evaluado como candidato de mercado.

## Jerarquía general: un mismo patrón para organización, geografía y competencia (2026-08-30)

### El problema que expuso `asociacionismo.yaml`

La decisión de arquitectura que quedó abierta ayer -- ¿`PAQUETE_CLIENTE` se
aplica a la `ASOCIACION` en cascada, o cada `SOCIO` conserva el suyo? -- no es
un problema aislado de ese módulo. Es un síntoma de haber modelado
`ASOCIACION`/`SOCIO` como un par fijo de dos niveles, cuando la realidad ya
apuntada hoy es una cadena mucho más larga: **usuario -> familia -> grupo ->
asociación -> federación -> confederación**, y no hay ninguna razón para que
esa cadena se detenga ahí -- una confederación puede agrupar federaciones de
distintas regiones, un grupo de apoyo mutuo (ya descrito en
`PROPUESTA_APOYO_AUTONOMIA_NEURODIVERGENCIA.md`, 3-8 hogares) puede o no
pertenecer a una asociación formal, etc.

La instrucción de hoy generaliza esto correctamente: la misma necesidad de
"escalado jerárquico" no es exclusiva de lo organizativo. Aparece igual en:

- **Espacio geográfico**: un nodo opera en un barrio, que pertenece a un
  municipio, que pertenece a una comarca/provincia, que pertenece a una
  comunidad autónoma, que pertenece a un país. Las sinergias entre nodos
  (ya diseñadas para Ágora) dependen de saber si dos nodos están "cerca" en
  esta jerarquía, no solo de una distancia en línea recta.
- **Intereses/competencias**: el ejemplo dado hoy es exacto -- un carpintero
  puede o no ser ebanista; puede especializarse en puertas, ventanas,
  muebles o suelos. Un herrero especializado en calderería no hace lo mismo
  que uno especializado en forja. Un desarrollador de software puede ser
  backend, frontend o de redes -- son ramas distintas de un mismo árbol de
  "carpintería" o "desarrollo de software", no la misma habilidad con
  distinto nombre.

Construir tres jerarquías distintas a mano (una tabla `ASOCIACION` con
`PADRE_ID`, otra `REGION` con `PADRE_ID`, otra `OFICIO` con `PADRE_ID`) sería
repetir tres veces la misma estructura de datos. La mejora real es reconocer
que es **un solo patrón, aplicado a tres dominios**.

### Precedente real: no inventar la taxonomía de competencias

Para el árbol organizativo y el geográfico no hace falta ningún estándar
externo -- son jerarquías propias del cliente (su propia asociación, su
propio territorio). Pero para **competencias/intereses**, inventar una
taxonomía desde cero (decidir a mano si "ebanistería" cuelga de
"carpintería" o es un oficio aparte, para cada oficio posible) es exactamente
el tipo de trabajo que ya existe hecho, mantenido y gratuito:

- **[ESCO](https://esco.ec.europa.eu/en/about-esco/what-esco)** (European
  Skills, Competences, Qualifications and Occupations) -- clasificación
  multilingüe oficial de la Comisión Europea, desarrollada desde 2010.
  Describe 3.039 ocupaciones y cerca de 14.000 competencias/habilidades
  ligadas a ellas, traducidas a 28 idiomas, en formato abierto y descargable
  gratis. La rama de habilidades ("skills pillar") está organizada en una
  jerarquía real -- exactamente el "carpintero puede o no ser ebanista" del
  ejemplo de hoy ya existe codificado en ESCO como nodos distintos del árbol
  de ocupaciones/habilidades. ([Wikipedia](https://en.wikipedia.org/wiki/European_Skills,_Competences,_Qualifications_and_Occupations),
  [CEDEFOP](https://www.cedefop.europa.eu/en/news/esco-taxonomy-classification-european-skills-competences-qualifications-and-occupations-just))
- **[SFIA](https://sfia-online.org/en)** (Skills Framework for the
  Information Age) -- para el caso concreto de "desarrollo de software:
  backend/frontend/redes" del ejemplo de hoy, SFIA ya modela exactamente
  eso: habilidades TIC organizadas en categorías y subcategorías (p.ej.
  "Development and implementation" con sub-habilidades diferenciadas), cada
  una además con 7 niveles de responsabilidad/autonomía -- útil si en algún
  momento Engremiat necesita no solo "sabe backend sí/no" sino "a qué nivel".

Decisión propuesta: usar **ESCO como fuente de verdad para el árbol de
competencias/oficios en general** (carpintería, herrería, agricultura,
cuidados, etc. -- cualquier oficio manual o de servicios que aparezca en
comunidades reales) y reservar **SFIA solo para el subárbol de competencias
de desarrollo de software**, si Engremiat llega a necesitar ese nivel de
detalle para sus propios colaboradores técnicos. Ninguno de los dos se monta
todavía -- es la fuente que se referenciaría, no un sistema instalado.

### Un solo patrón de datos para los tres árboles

Un patrón de árbol autorreferenciado (`PADRE_ID` apuntando a la misma tabla)
resuelve los tres casos sin duplicar estructura:

```
ENTIDAD_ORGANIZATIVA
  ID, NOMBRE, TIPO_NIVEL (usuario/familia/grupo/asociacion/federacion/confederacion),
  PADRE_ID (-> ENTIDAD_ORGANIZATIVA.ID, NULL si es la raíz),
  PAQUETE_CLIENTE_ID (NULL = hereda el de su padre; con valor = lo sobreescribe)

UBICACION_GEOGRAFICA
  ID, NOMBRE, TIPO_NIVEL (barrio/municipio/comarca/provincia/comunidad/pais),
  PADRE_ID (-> UBICACION_GEOGRAFICA.ID, NULL si es la raíz)

COMPETENCIA
  ID, NOMBRE, CODIGO_ESCO (URI de ESCO si existe; NULL si es una rama propia
    no cubierta por ESCO, p.ej. la subrama de SFIA para desarrollo software),
  PADRE_ID (-> COMPETENCIA.ID, NULL si es la raíz)

PERSONA_COMPETENCIA   -- tabla puente muchos-a-muchos
  ID, PERSONA_ID, COMPETENCIA_ID, NIVEL (declarado por la propia persona,
    no evaluado por nadie más -- mismo principio de autorreporte que
    CAPACIDAD_DECLARADA en DISPONIBILIDAD, red_social.yaml)
```

Con esto:

- **La pregunta abierta de `asociacionismo.yaml` se resuelve con el mismo
  patrón que ya usa cualquier sistema de permisos jerárquico (CSS, ACLs de
  ficheros): un valor `NULL` en `PAQUETE_CLIENTE_ID` hereda el de su
  ancestro más cercano que sí lo tenga; un valor explícito lo sobreescribe.**
  No hace falta decidir "asociación o socio" como una disyuntiva -- ambos
  casos son el mismo mecanismo de cascada, aplicado en un punto distinto del
  árbol.
- El modelo de permisos de tres niveles (Operador/Nodo/Común) ya diseñado
  antes deja de ser un caso especial fijo -- es simplemente un fragmento
  corto de este mismo árbol (`confederación` y `federación` no existen
  todavía en el caso de un solo nodo, pero la tabla no cambia el día que
  aparezcan).
- Las "sinergias entre nodos" ya diseñadas para Ágora pueden calcular
  cercanía real recorriendo `UBICACION_GEOGRAFICA` (mismo municipio > misma
  comarca > misma provincia) en vez de comparar solo texto libre.
- El emparejamiento de Ágora/Oportunidad por habilidad deja de depender de
  texto libre ("hace muebles", "carpintero") y pasa a comparar nodos reales
  del árbol de `COMPETENCIA` -- un socio que declara "ebanistería" aparece
  automáticamente también en búsquedas de "carpintería" si el árbol lo
  modela como hijo, sin tener que declarar ambas cosas a mano.

### Límites y honestidad

- Nada de esto está construido -- ni las tres tablas, ni la importación de
  ESCO, ni el mecanismo de herencia de `PAQUETE_CLIENTE_ID`. Es un patrón de
  modelo de datos propuesto para sustituir el diseño previo de
  `ASOCIACION`/`SOCIO` como par fijo.
- Importar el árbol completo de ESCO (14.000 competencias) sería excesivo
  para el volumen real de cualquier cliente actual -- la importación
  correcta es bajo demanda (solo los nodos del árbol que un socio o nodo
  real llega a declarar), no una carga masiva inicial.
- El mecanismo de herencia por `PADRE_ID` nulo en cascada es un patrón común
  y probado (así funciona la resolución de permisos de ficheros Unix o de
  CSS), pero no se ha probado todavía con datos reales en Baserow -- hay que
  verificar que las fórmulas/consultas de Baserow soportan bien la
  recursividad antes de asumir que "se puede simplemente consultar".
- Esto reemplaza el diseño de `ASOCIACION`/`SOCIO` de `asociacionismo.yaml`
  -- ese manifiesto necesita revisión para usar `ENTIDAD_ORGANIZATIVA` en
  vez de dos tablas fijas; no reescrito todavía, solo señalado aquí.

### Pendiente, no resuelto todavía

- `asociacionismo.yaml` y `red_social.yaml` siguen usando el diseño previo
  (`ASOCIACION`/`SOCIO` fijo, `INTERES` en texto libre) -- no actualizados
  todavía a este patrón general, solo el manifiesto nuevo `jerarquia.yaml`
  documenta el patrón en sí.
- No decidido si `UBICACION_GEOGRAFICA` se puebla a mano por cliente o se
  importa de un catálogo oficial (p.ej. códigos INE para España) -- ninguna
  de las dos cosas está hecha.
- No probado en Baserow real ningún recorrido de árbol autorreferenciado ni
  la cascada de herencia de `PAQUETE_CLIENTE_ID`.

### Manifiestos actualizados al patrón (2026-08-30)

`asociacionismo.yaml` (v1) y `red_social.yaml` (v1) quedan reescritos para
usar `jerarquia.yaml` en vez del diseño previo:

- `asociacionismo.yaml`: `ASOCIACION`/`SOCIO` desaparecen como tablas
  propias -- son ahora filas de `ENTIDAD_ORGANIZATIVA` con `TIPO_NIVEL`
  distinto (`asociacion`/`usuario`), y `DECISION_GRUPO` referencia
  `ENTIDAD_ORGANIZATIVA_ID` en vez de `ASOCIACION_ID`. La decisión de
  arquitectura que quedó abierta ayer queda marcada como
  **resuelta sobre el papel** (mecanismo de herencia de
  `PAQUETE_CLIENTE_ID`), no como implementada -- sigue sin probarse en
  Baserow real.
- `red_social.yaml`: `INTERES` gana una columna `COMPETENCIA_ID` que
  referencia el árbol de `jerarquia.yaml` (respaldado por ESCO), con
  `NOMBRE_LIBRE` como vía de escape mientras ese árbol no cubra un interés
  concreto -- ningún dato existente se pierde, es una columna añadida, no
  una migración destructiva.

Nada de esto se ha creado todavía en ninguna Baserow real (ni PC ni Pi) --
son ediciones de los ficheros `.yaml` de especificación, no tablas nuevas.

## Sistematizar la creación de tablas en Baserow (2026-08-30)

### El problema

Cada módulo nuevo (`jerarquia`, `red_social`, `oportunidad`,
`asociacionismo`...) necesita tablas en Baserow, y hasta hoy el único camino
era: generar un CSV, mandártelo, que tú lo importes a mano en la interfaz.
Funciona, pero no escala -- con 9 módulos ya catalogados y varios todavía
por diseñar, ese paso manual se iba a repetir indefinidamente.

### La causa técnica y la solución

Confirmado contra el esquema OpenAPI real de la instancia local de Baserow
(`http://localhost/api/schema.json`, no documentación de terceros): los
tokens de API personales solo dan acceso a filas (`GET/POST/PATCH/DELETE`
de datos), nunca a esquema. Crear una tabla o una columna exige un JWT de
sesión de usuario -- `POST /api/user/token-auth/` (email+contraseña),
refrescable con `POST /api/user/token-refresh/`.

Se ha construido `baserow-schema.mjs` (cliente mínimo de ese API de
esquema) y `crear_tabla_desde_manifiesto.mjs` (CLI que lee un fichero
`<modulo>.tablas.json` -- versión machine-readable de
`tablas_baserow_propuestas`, con el tipo de cada columna explícito -- y
crea la tabla y cada campo por llamadas reales al API). Ambos en
`G:\Mi unidad\DEVS\engremiat-litellm\`. `manifiestos/jerarquia.tablas.json`
es la primera definición real, con las cuatro tablas de `jerarquia.yaml`.

**La contraseña de Baserow nunca la manejo yo**: el script la pide por
terminal solo la primera vez, y guarda únicamente el `refresh_token`
resultante en disco (revocable desde tu propia cuenta Baserow) -- mismo
principio ya aplicado con el token de la Pi.

### Límites y honestidad

- Verificado hasta sintaxis (`node --check`) y contra la documentación
  OpenAPI real de los tres endpoints que usa -- **no ejecutado todavía de
  extremo a extremo contra una Baserow real**, porque el login es
  intencionadamente interactivo (email+contraseña por terminal) y ese paso
  no puede automatizarse ni probarse desde aquí sin que lo ejecutes tú.
- El mecanismo para borrar los campos de fábrica (`Notes`/`Active`) que
  Baserow crea por defecto y renombrar el campo primario según el primer
  campo declarado está escrito y es lógicamente consistente con la
  documentación del API, pero tampoco probado contra datos reales todavía.
- `tablas_existentes` (ids de tablas ya creadas, para poder enlazar
  `link_row` a ellas) hay que rellenarlo a mano por entorno -- PC y Pi
  tienen ids distintos para la misma tabla lógica, el script no los
  adivina.
- Los módulos ya construidos (`cronista`, `agora`, `paquete_cliente`,
  `ejecutor_local`) siguen con sus tablas creadas por CSV -- este script
  solo se ha usado, de momento, para preparar la definición de `jerarquia`,
  no para recrear nada ya existente.

### Pendiente, no resuelto todavía

- Escribir el `.tablas.json` para el resto de módulos `solo_disenado`
  (`red_social`, `asociacionismo`, `oportunidad`, `pregonero`) -- solo
  existe para `jerarquia` de momento.
- Decidir si, una vez probado, este mecanismo sustituye también el proceso
  CSV de módulos futuros ya construidos, o convive con él.

### Primera ejecución real, en la Pi (2026-08-30)

`crear_tabla_desde_manifiesto.mjs` funcionó de extremo a extremo contra la
Baserow real de la Pi (`http://192.168.8.230`, database 76): las cuatro
tablas de `jerarquia.yaml` (`ENTIDAD_ORGANIZATIVA` id 279,
`UBICACION_GEOGRAFICA` id 280, `COMPETENCIA` id 281, `PERSONA_COMPETENCIA`
id 282) se crearon con sus campos, tipos, opciones de `single_select` y
enlaces `link_row` correctos -- verificado leyendo los campos reales por
API después de crearlos, no solo asumiendo que la ejecución sin error
significaba éxito.

Dos fallos reales, corregidos sobre la marcha:

- **Ruta relativa rota entre PC y Pi**: `baserow-schema.mjs` guardaba el
  `refresh_token` en una ruta de Windows escrita a mano
  (`G:\...\.baserow_refresh_token`), que no existe en la Pi. Corregido para
  calcular la ruta relativa al propio fichero del script
  (`fileURLToPath(import.meta.url)`), portable entre Windows y Linux sin
  configuración.
- **El bug de enrutado por `Host` de Baserow (ya documentado antes en este
  proyecto) reaparece incluso en llamadas locales dentro de la propia Pi**:
  como `BASEROW_PUBLIC_URL` de la Pi es `http://192.168.8.230`, ni siquiera
  `curl http://localhost/api/...` desde la propia Pi funciona -- hay que
  usar la IP pública también para llamadas intra-máquina. Ajustado
  documentando `BASEROW_URL=http://192.168.8.230` en vez de `localhost`
  como variable de entorno al ejecutar el script en la Pi.

Nada de esto se ha creado todavía en el Baserow del PC -- solo en la Pi.
Las tablas existen vacías: ninguna fila de datos, ninguna acción n8n ni
pantalla de Plaza las usa todavía.

## Modelo de negocio: nosotros ofrecemos la personalización, protegemos el generador (2026-08-30)

### La idea, en una frase

Hasta ahora todo el diseño trataba "soberanía" y "todo abierto" como
sinónimos. No lo son. Lo que el cliente tiene que controlar es **su
infraestructura y sus datos** (ya es la decisión central de este documento,
ver arriba) -- no hace falta que controle también el motor que decide *cómo
se configura* esa infraestructura la primera vez. Esa segunda pieza --
llamémosla el **generador de experiencias**: la lógica que convierte "una
persona neurodivergente que necesita orden" o "una asociación de artesanos"
en una `ENTIDAD_ORGANIZATIVA` bien configurada, un `PAQUETE_CLIENTE`
correcto, una hoja de estilos de Plaza ajustada, y un primer lote de tareas
-- puede quedarse como servicio nuestro, protegido, y cobrarse aparte.

### Precedente real, no una idea nueva

Este patrón ya existe y funciona comercialmente hoy: **v0.dev (Vercel)** genera
aplicaciones React completas que el usuario se lleva enteras -- código
propio, exportable, inspeccionable -- pero el generador en sí (los prompts,
la orquestación, el modelo ajustado) es propiedad de Vercel y nunca se
entrega. Mismo patrón en Cursor Composer o Replit Agent: el resultado es
100% del usuario, el motor que lo produjo no. Es el mismo principio que
"open core" (GitLab, Sentry, Mattermost: el producto desplegado es libre,
la capa de valor añadido alrededor es comercial) aplicado no a
funcionalidad sino al proceso de generación inicial.

### Qué se protege y qué NO -- la línea que no se cruza

- **Se protege**: la lógica de generación (prompts de segmentación, reglas
  de qué manifiestos activar según el tipo de cliente, plantillas de
  paquete) -- vive en un servicio nuestro, no se copia al hardware del
  cliente.
- **NO se protege, nunca**: los datos del cliente, su instancia de
  Baserow/n8n/Plaza ya desplegada, ni el código de esa instancia una vez
  entregada -- eso sigue siendo enteramente suyo, inspeccionable y
  modificable, exactamente como se ha defendido en todo este documento.
  Cruzar esta línea (esconder algo del sistema que el cliente ya opera)
  rompería la promesa de soberanía que es el diferenciador real -- no es
  negociable.
- Analogía exacta: el cliente es dueño absoluto de la casa construida; el
  arquitecto no le regala su forma de trabajar, solo la casa terminada.

### Dos vías comerciales, no una

1. **Catálogo** -- paquetes de experiencia ya diseñados, probados y
   deterministas: en la práctica, cada manifiesto de `manifiestos/` es ya
   un ingrediente de catálogo (jerarquía + un set de `PAQUETE_CLIENTE` +
   una hoja de estilos + tareas de arranque). Provisionar un cliente desde
   el catálogo no necesita LLM -- es exactamente lo que ya hace
   `crear_tabla_desde_manifiesto.mjs` más una carga de filas plantilla.
   **Coste marginal casi cero**, apto para un nivel de entrada barato o
   incluido.
2. **Personalizado** -- el cliente describe algo que no está en el
   catálogo; el generador de experiencias lo interpreta y produce una
   configuración a medida. Aquí hay una decisión de coste real:
   - **Vía modelo local** (Ollama, sin coste de API): gratis de operar, pero
     la propia prueba de hoy (ver "Workflow real construido, y una segunda
     prueba peor que la primera" en `ROADMAP_BASELINE_ENGREMIAT.md`)
     demuestra en vivo que el modelo local pierde fidelidad con textos
     largos o casos menos estándar -- evidencia real, no una suposición.
   - **Vía API de pago** (Claude/GPT): coste real por generación, pero de
     orden de magnitud pequeño frente al valor del servicio -- una
     llamada de segmentación de un documento del tamaño del roadmap de hoy
     (~3.000 tokens) cuesta del orden de céntimos de dólar, no euros.
     Justifica cobrar un precio por la vía personalizada muy por encima de
     ese coste marginal, con margen real y sin necesidad de disimularlo.

### Arquitectura necesaria para que esto sea real, no solo discurso

El generador (`Cronista - Segmentar documento en tareas`, hoy construido
en el n8n compartido del PC) tendría que vivir en un n8n **propio del
operador**, no en el mismo n8n donde corre el resto de la operación de un
cliente -- el cliente llama a este servicio (como llama a la API de Claude
hoy: una petición de salida, sin exponer nada suyo), recibe el resultado
(filas concretas para importar), y a partir de ahí su sistema vuelve a ser
100% autónomo y local. Ningún cliente necesita ver ni alojar el generador
para operar su propio Engremiat.

**Hecho (2026-08-30)**: contenedor n8n separado levantado
(`engremiat-generador-n8n`, `127.0.0.1:5680`, sin acceso ni desde la LAN) y
el workflow `Cronista - Segmentar documento en tareas` migrado ahí de
verdad -- la copia del n8n compartido del PC quedó desactivada. En el
camino se detectó y corrigió un error real: la primera clave de API que se
generó estaba creada en el n8n de la Pi, el mismo que aloja el workflow de
cara al cliente -- justo lo que había que evitar. Corregido antes de
construir nada encima. Detalle completo, con las tres rutas del workflow
migrado (`proponer_tareas`/`proponer_tareas_premium`/`confirmar_tareas`) y
sus pruebas reales, en `ROADMAP_BASELINE_ENGREMIAT.md`, sección "Generador
migrado de verdad a su propia infraestructura".

### Límites y honestidad

- Nada de esta separación arquitectónica está construida -- hoy el
  workflow de segmentación vive en el mismo n8n que el resto de la
  operación de prueba, no en un servicio aislado del operador.
- El "catálogo" no existe todavía como tal -- los manifiestos son la
  materia prima, pero nadie los ha empaquetado como oferta comercial con
  precio.
- Cobrar por la vía personalizada exige que la calidad sea consistente --
  la prueba de hoy demuestra que con el modelo local todavía no lo es;
  vender "personalización premium" antes de resolver eso sería vender algo
  que no se puede garantizar.
- Este modelo de negocio no sustituye la venta de hardware/soporte ya
  esbozada antes en este documento -- la complementa: una cosa es cómo se
  entrega el nodo físico, otra cómo se configura su contenido inicial.

### Pendiente

- Separar el generador de experiencias en su propio n8n/infraestructura,
  distinto del de cualquier cliente.
- Diseñar el primer catálogo real (2-3 paquetes de experiencia ya
  probados, con precio) a partir de los manifiestos existentes.
- Decidir el precio de la vía personalizada con margen real sobre el coste
  de API, una vez la calidad de la segmentación sea fiable.
- Nada de esto se activa antes de tener un catálogo probado -- mismo
  principio de "no construir sin señal real" ya aplicado en todo este
  documento.

## Cascada de coste: los agentes locales preparan, Claude pule (2026-08-30)

### La mejora sobre la propuesta anterior

Tratar el coste de API como **gasto de adquisición de cliente** (no como
coste operativo que hay que repercutir desde el primer día) cambia la
pregunta de "¿cómo cobramos esto?" a "¿cómo lo hacemos tan barato que dé
igual regalarlo al principio?" -- y la respuesta ya está delante: **no hay
que mandarle a Claude el trabajo pesado, solo el veredicto final.** Los
agentes locales (Cronista con el modelo local, Ejecutor Local) ya saben
leer, trocear y proponer un primer borrador -- gratis, sin límite de
llamadas, con la calidad que ya se ha visto hoy: aceptable pero con fallos
reales. La idea de hoy es exactamente resolver eso sin pagar por generar
desde cero: **que el modelo local prepare el terreno, y que Claude solo
revise y corrija un resultado ya casi hecho**, no que escriba el documento
entero. Eso es lo que hace barata una llamada de calidad profesional.

### Por qué esto no es una idea nueva en este proyecto, es una que ya estaba anotada

`config.yaml` (la pasarela LiteLLM) ya dejó escrito, desde su primera
versión: *"El enrutado automático por complejidad (RouteLLM) es un
refinamiento posterior"*. Esto es exactamente ese refinamiento, con un
propósito concreto por fin: no es "elegir el modelo según lo complejo que
parezca el prompt" en abstracto, es **una cascada de dos pasos con un
trabajo específico cada uno** -- redactar (local, gratis) y verificar
(Claude, de pago, barato porque el texto de entrada ya es corto).

### Cómo se aplicaría, con la prueba de hoy como caso concreto

La propia sesión de hoy es el ejemplo perfecto de por qué esto funciona:

1. **Paso local (gratis)**: Cronista segmenta el documento completo con
   `local-potente` -- exactamente lo que ya se probó. Resultado: una lista
   de tareas, con los fallos reales ya documentados (tarea narrativa
   colada, fases mal atribuidas, tareas reales omitidas).
2. **Paso Claude (de pago, pero barato)**: en vez de mandarle a Claude el
   documento entero otra vez, se le manda **la lista corta ya generada por
   el paso 1** (unos pocos cientos de tokens, no los ~3.000 del documento
   completo) junto con el documento original, y se le pide un trabajo
   acotado: *"verifica esta lista contra el documento: corrige fases mal
   atribuidas, elimina lo que sea texto narrativo, añade lo que falte"* --
   no "genera la lista", sino "corrige la lista". Es precisamente el tipo
   de tarea de verificación puntual donde un modelo grande rinde mucho
   mejor que redactando desde cero, y de las más baratas que existen porque
   la salida esperada es corta (una lista corregida, no un ensayo).
3. **Puerta humana, sin cambios**: el resultado de Claude sigue sin
   escribirse en Baserow directamente -- pasa por la misma revisión humana
   ya construida (`confirmar_tareas`). Esta cascada mejora lo que llega a
   esa puerta, no la elimina.

### El coste real, en orden de magnitud (no una cifra exacta)

Una llamada de este tipo -- entrada de unos pocos miles de tokens (el
documento + el borrador local), salida de unos pocos cientos (la lista
corregida) -- cae, con las tarifas públicas actuales de la API de Claude,
en el rango de **céntimos de dólar por llamada, no euros**. Incluso
asumiendo un margen generoso de error en esa estimación, regalar este paso
en el onboarding de cada cliente nuevo es un gasto de marketing trivial
frente al valor de una primera experiencia que "se comporta ya bien" desde
el primer día -- comparable a lo que cualquier negocio gasta en una demo
bien cuidada.

### El modelo de negocio que propone el operador, ya extendido

- **En el onboarding**: la cascada local+Claude corre automáticamente,
  incluida en el precio (o gratis) -- es la inversión en que la primera
  impresión sea profesional. Encaja directamente con el embudo de
  onboarding ya diseñado antes en este documento (bot → demo
  personalizada → conversión).
- **Después del onboarding**: la misma cascada queda disponible como
  **opción de pago bajo demanda** -- "mejorar cómo se comporta mi sistema"
  como acción que el cliente puede pedir desde Plaza en cualquier momento,
  no solo al darse de alta. Esto cierra un hueco que ya se había señalado
  antes en este mismo documento (el cliente "solicita mejoras a través de
  mantenimiento/Ejecutor") -- ahora con un mecanismo concreto y con un
  precio que se sostiene solo, porque el coste real por llamada es bajo y
  conocido.

### Límites y honestidad

- Nada de esta cascada está construida -- hoy el workflow de segmentación
  solo tiene el paso local; el paso de verificación con Claude no existe
  todavía como nodo real.
- La estimación de coste es una aproximación razonada, no una factura real
  todavía pagada -- antes de fijar un precio de venta hace falta medir el
  coste real de varias llamadas de este tipo contra la API de Claude, no
  solo estimarlo.
- Regalar esta cascada en cada onboarding sin límite es un riesgo de coste
  no acotado si el negocio escala -- hace falta una política explícita
  (p.ej. una pasada gratuita por cliente nuevo, las siguientes de pago) en
  vez de dejarlo abierto por defecto.
- La clave del vector de protección de propiedad intelectual (sección
  anterior) sigue aplicando aquí sin cambios: esta cascada corre en el
  generador protegido del operador, con la clave de API de Claude del
  operador -- nunca se distribuye una clave de Claude al hardware de un
  cliente.

### Pendiente

- Añadir el nodo de verificación con Claude al workflow
  `Cronista - Segmentar documento en tareas`, como segundo paso opcional
  antes de la puerta humana -- bloqueado hoy por falta de
  `ANTHROPIC_API_KEY` en el entorno.
- Medir el coste real de al menos 5-10 llamadas de verificación reales,
  antes de fijar cualquier precio de la opción de pago.
- Definir la política de cuántas pasadas gratuitas incluye el onboarding
  antes de que la mejora "cueste" al cliente.
- Decidir dónde vive la clave de API de Claude del operador de forma
  segura, coherente con la separación ya propuesta del generador en su
  propia infraestructura.

### Primera medición real, con DeepSeek, y una corrección de diseño (2026-08-30)

Mientras se resuelve el acceso a Claude, se probó la misma cascada con
DeepSeek como verificador -- resultado y coste real (no estimado) en
`ROADMAP_BASELINE_ENGREMIAT.md`, sección "Cascada real, primera medición de
coste". Resumen: mejora clara sobre el borrador local (recuperó tareas
omitidas, corrigió fases mal etiquetadas), un fallo real (mantuvo una tarea
narrativa que se le pidió excluir), y un coste medido de **$0,003-0,006 por
llamada** -- tan bajo que DeepSeek pasa a ser candidato serio para esta
cascada por derecho propio.

**Corrección de diseño, decidida el mismo día**: no son dos niveles
("local + Claude automatizado"), son **tres**: local (borrador gratis),
DeepSeek (verificación automatizada en n8n, coste marginal real), y Claude
**deliberadamente manual, por cliente** -- el operador y Claude Code
revisan y afinan a mano los casos que lo merezcan, sin automatizar esa
capa por ahora. Esto saca `ANTHROPIC_API_KEY` de la ruta crítica: DeepSeek
ya basta para el nivel de pago automatizado, y el nivel Claude se convierte
en un servicio de mayor contacto y precio ("asesoría experta de
personalización"), no en una tarea de infraestructura pendiente. Detalle
completo en `ROADMAP_BASELINE_ENGREMIAT.md`, sección "Decisión: tres
niveles, no dos".

## "Escenario": motor de proyectos cooperativos entre comunidades (2026-08-30)

### Origen

Investigación externa (no repetida aquí, ver `manifiestos/escenario.yaml`
para el resumen completo) sobre un sistema de creación cooperativa de
cuentos con gobernanza, auditoría, tutoría y publicación -- generalizada
por el operador en un catálogo de 18 "Escenarios" posibles: entornos
cooperativos digitales, limitados en el tiempo, donde comunidades asumen
roles, completan misiones y producen un bien común verificable.

### Valoración técnica -- lo que ya está construido cubre casi todo

El hallazgo principal no es que haga falta un sistema nuevo -- es que
**el patrón que pide la investigación ya se construyó hoy, con otro
nombre**: `jerarquia.yaml` demostró que un mismo árbol autorreferenciado
sirve a tres dominios distintos; "Escenario" es el mismo principio
aplicado a proyectos cooperativos con gobernanza. Mapeo real contra tablas
ya construidas y probadas:

- Comunidad participante → `ENTIDAD_ORGANIZATIVA` (sin cambios).
- Misión con dependencias → `TAREA` (ya tiene `TAREA_PREDECESORA_ID`,
  `ORDEN_SECUENCIA`, `ESTADO` -- exactamente lo que hace falta).
- Recurso intercambiado → `AGORA` (sin cambios).
- Artefacto producido → `DOCUMENTO` + render-worker (sin cambios).
- Decisión de grupo / canon → `DECISION_GRUPO` + Loomio, ya diseñado en
  `asociacionismo.yaml`.
- Segmentar idea en misiones → el workflow Cronista con puerta humana,
  construido y probado hoy mismo.

Solo dos huecos reales, y ninguno exclusivo de este módulo: una tabla
`AUDITORIA` genérica (no existe nada parecido hoy, y serviría igual a la
trazabilidad del cliente neurodivergente y a las decisiones de
asociacionismo) y un `ROL_PROYECTO` más fino que el actual modelo de
permisos de tres niveles.

### Distinción que hay que mantener

Solo el primer caso -- "Escenario: Cuento Cooperativo" -- tiene un cliente
real detrás. Los otros 17 del catálogo son exploración creativa, sin
ninguna comunidad real que los haya pedido -- mismo principio de "no
construir sin señal real" ya aplicado a Pregonero/Oportunidad/red_social
en todo este documento.

### Verificación independiente de la investigación (2026-08-30)

La investigación aportada por el operador se verificó con búsquedas
propias, no se aceptó tal cual. Confirmado: StoriumEdu sigue activo en
2026 (no es un precedente obsoleto de 2019). Confirmado: Upwelling
(Ink & Switch) es un prototipo de investigación parado desde 2023-2024,
nunca fue producto. **Hallazgo nuevo**: las herramientas de escritura con
IA de 2026 (Sudowrite Story Bible, NovelCrafter Codex, Jenova) sí resuelven
memoria de canon vía IA, pero todas para un autor o equipo cerrado --
ninguna resuelve gobernanza entre grupos ni auditoría de decisiones. El
hueco de mercado sigue exactamente igual de abierto en 2026 pese a la
explosión de IA de escritura -- Engremiat no competiría con Sudowrite,
competiría en un hueco que Sudowrite no toca. **Candidato nuevo evaluado**:
Kanka.io (375.000+ usuarios, wiki de mundos autoalojable) como posible
motor de la "biblia narrativa" -- con un límite real: licencia Commons
Clause, no libre de verdad (restringe uso comercial del propio software),
a diferencia de Loomio/Mobilizon. Alternativa más segura sin dependencia de
terceros: construir la biblia narrativa como tablas Baserow propias,
reutilizando el mismo patrón de árbol autorreferenciado de `jerarquia.yaml`.

### Límites y honestidad

- Nada de este módulo está construido -- ni `AUDITORIA`, ni `ROL_PROYECTO`,
  ni ninguna configuración de un Escenario concreto.
- No introducir blockchain para la trazabilidad -- versiones y eventos
  inmutables en `AUDITORIA` bastan, con mucho menos coste.
- Riesgo real señalado por la propia investigación: sobregestionar la
  creatividad si cada aportación necesita aprobación formal -- gobernanza
  proporcional (libertad en el borrador, control solo en canon).

### Pendiente

- Diseñar `AUDITORIA` y `ROL_PROYECTO` como manifiestos transversales,
  antes de construir nada de "Escenario" en sí.
- Concretar "Cuento Cooperativo" reutilizando las tablas ya existentes,
  sin inventar entidades nuevas más allá de las dos señaladas.
- No diseñar con más detalle el resto del catálogo mientras no aparezca
  una comunidad real interesada en un Escenario concreto.

## Telegram como puerta de entrada: cartera de clientas y sensor de demanda real (2026-08-30)

### La propuesta del operador

El sistema ya tiene madurez suficiente para empezar a captar los primeros
grupos de prueba. La idea: usar Telegram como interfaz ligera -- sin
instalar nada, sin cuenta nueva, sin fricción -- para ofrecer un catálogo
de Escenarios/juegos entre los que un grupo pueda elegir, como base
estable y motivadora antes de escalar a experiencias personalizadas.

### Por qué Telegram, con datos reales del mercado

- Telegram supera los 1.000 millones de usuarios activos, con 500 millones
  interactuando ya con Mini Apps -- el catálogo de Mini Apps pasó de 2.200
  a mediados de 2024 a casi 5.800 en octubre de 2025 (+162%), con más de
  200.000 desarrolladores registrados
  ([GramBase](https://grambase.ai/blog/telegram-mini-apps-2026)).
- El engagement de Telegram es **10 veces superior** al de Facebook o
  Instagram, con una tasa de interacción del 28%
  ([Magnetto](https://magnetto.com/blog/telegram-by-the-numbers)).
- Más del 95% de las Mini Apps con tracción real son juegos o utilidades
  gamificadas, no comercio -- mecánicas sociales como clasificaciones,
  "clanes" o retos de grupo son las que retienen usuarios. Casos con
  tracción real: Catizen (34M usuarios, 7M diarios), Major (70M usuarios,
  40M mensuales) ([PixelPlex](https://pixelplex.io/blog/viral-mechanics-on-telegram-apps/)).
- Los bots con flujo de bienvenida automatizado retienen significativamente
  más miembros que los grupos sin onboarding guiado
  ([Metricgram](https://metricgram.com/blog/best-telegram-bots-for-groups)).

Conclusión de mercado: elegir Telegram no es una apuesta -- es ir donde ya
está la tracción demostrada, con el tipo de mecánica (elección gamificada
entre escenarios, con progreso visible) que ya funciona a millones de
usuarios en otros contextos.

### El hallazgo que reduce el riesgo a casi cero: ya está construido

Se auditó el n8n real del operador -- existe ya un bot de Telegram activo
y probado en producción (`Taller Trobaila - Etapa 6 - Telegram`), con
exactamente los nodos que hacen falta para esta propuesta: disparador de
Telegram, teclados inline con callbacks (`Es callback?` /
`Answer Query a callback`), envío de documentos y mensajes de estado. **No
hay que investigar ni prototipar la integración con Telegram -- ya existe,
funciona, y se reutiliza el mismo patrón**, solo con un bot y un workflow
nuevos para Engremiat.

### Diseño propuesto

1. **Bot de Engremiat en Telegram**: mensaje de bienvenida + teclado inline
   con el catálogo de Escenarios (`escenario.yaml`) -- incluido "Cuento
   Cooperativo" (con cliente real) y el resto del catálogo (exploración).
2. **Cada Escenario elegido crea una fila real**: `ENTIDAD_ORGANIZATIVA`
   (tipo `grupo`) para el grupo que elige, y Cronista con puerta humana
   genera el primer lote de misiones (`TAREA`) -- reutilización directa de
   todo lo construido y probado hoy, ningún componente nuevo.
3. **El grupo interactúa desde el propio Telegram** al principio -- marcar
   misiones completas, ver progreso, sin necesitar instalar Plaza todavía.
   Es la versión más ligera posible del embudo ya diseñado antes en este
   documento ("bot de onboarding → demo → conversión"), ahora con canal
   concreto y tecnología ya probada, no solo diseño.
4. **Doble función del catálogo -- también es sensor de demanda real**: no
   hace falta construir los 18 Escenarios para ofrecerlos. Un botón "Próximamente
   -- vótalo" en los que no tienen desarrollo real todavía convierte el menú
   en una encuesta de demanda genuina -- se construye lo que los grupos
   reales pidan, no lo que parezca más interesante desde fuera. Coherente
   con "no construir sin señal real": esto ES el mecanismo para obtener
   esa señal, barato y ya con tecnología probada.
5. **Graduación**: un grupo que quiere personalización profunda o
   soberanía de datos (su propio nodo/Pi) escala hacia Plaza -- Telegram
   capta y engancha, Plaza y el hardware propio son el destino final para
   quien lo quiera.

### Límites y honestidad

- Nada de esto está construido todavía -- ni el bot de Engremiat, ni el
  workflow, ni el catálogo mostrado como teclado inline. Existe el
  precedente técnico probado (Taller Trobaila), no el bot nuevo en sí.
- El "botón de votación" para Escenarios sin construir es una hipótesis de
  diseño, no probada -- hay que verificar que la gente entiende que
  "Próximamente" no es un error ni una promesa de fecha.
- Captar grupos de prueba reales implica RGPD desde la primera interacción
  (el ID de Telegram y el nombre del grupo ya son datos personales) --
  igual de aplicable aquí que en el resto del documento.
- Telegram sigue siendo una plataforma de un tercero -- coherente con
  "salida controlada, sin depender de una nube ajena para los datos
  reales", el bot es solo la puerta de entrada, los datos del grupo viven
  en el Baserow del operador desde el primer mensaje, no en Telegram.

### Pendiente

- Crear el bot de Telegram de Engremiat (token propio, no reutilizar el de
  Taller Trobaila) y el workflow n8n, reutilizando el patrón ya probado.
- Decidir cuántos Escenarios del catálogo se ofrecen "reales" desde el día
  uno (recomendado: solo "Cuento Cooperativo", el resto como votación) y
  cuántos como sensor de demanda.
- Diseñar el flujo mínimo de alta de grupo desde Telegram hasta la fila
  real de `ENTIDAD_ORGANIZATIVA` y el primer lote de misiones.
- Ninguna captación real de grupos ha empezado -- esto es la propuesta,
  no una campaña en marcha.

## La propuesta de valor en lenguaje no técnico: la escalera de confianza (2026-08-30)

### En una frase

El sistema no vende una herramienta -- vende una escalera de confianza:
se empieza jugando, sin arriesgar nada, y a medida que el grupo comprueba
que el sistema es justo, transparente y cumple lo que promete, decide por
sí mismo subir un escalón más -- hasta gestionar un proyecto real, con
dinero o recursos reales, con la misma herramienta con la que empezó
jugando.

### Los escalones

- **Escalón 0 -- el juego, en Telegram, gratis, sin compromiso.** Un grupo
  prueba un Escenario (p.ej. escribir un cuento cooperativo). Sin dinero,
  sin instalación, sin riesgo. El objetivo no es producir algo valioso --
  es que el grupo sienta cómo es cooperar con este sistema: las decisiones
  se respetan, cada aportación queda reconocida.
- **Escalón 1 -- el mismo grupo, tareas un poco más reales.** Organizar
  una actividad, mapear recursos del barrio, montar un archivo de memoria
  familiar. Sigue sin haber dinero real, pero ya hay un resultado
  tangible. Aquí el grupo empieza a confiar en el *proceso*: las
  decisiones importantes quedan registradas, el trabajo de cada persona
  se puede rastrear y se reconoce.
- **Escalón 2 -- un proyecto real, pequeño y reversible.** Reparar algo
  de la comunidad, un intercambio real de objetos, un encargo con
  presupuesto modesto. Hay algo en juego de verdad, pero acotado, y sigue
  habiendo red de seguridad -- ninguna decisión importante se ejecuta
  sola, siempre pasa por revisión humana antes de comprometerse.
- **Escalón 3 -- una iniciativa productiva real, con economía real.** El
  grupo, que ya vio una y otra vez que el sistema es fiable, da el salto a
  algo con dinero real, reparto real, responsabilidad real -- una pequeña
  cooperativa, un negocio comunitario. La diferencia con empezar
  directamente aquí (que es lo que hace casi todo el mundo, y por eso casi
  todo fracasa) es que **la confianza ya se ganó antes de que hubiera algo
  que perder**.

### Por qué es una estrategia comercial inteligente, no solo una buena historia

- Captar gente cuesta casi nada -- el juego en Telegram es gratuito, no
  necesita convencer a nadie, solo invitar a probar.
- El propio juego filtra -- los grupos que cooperan bien y quieren seguir
  se auto-seleccionan, sin necesidad de un vendedor insistiendo.
- No se cobra por adelantado lo que no se ha demostrado -- se paga cuando
  ya se ha visto, en escalones anteriores, que el sistema cumple. Es mucho
  más fácil vender el escalón 3 a quien ya vivió el 0, el 1 y el 2, que
  vendérselo a un desconocido el primer día.
- Cada escalón reutiliza exactamente la misma base técnica -- no hay que
  construir un producto distinto por nivel. Crecer no cuesta más
  ingeniería, solo más confianza acumulada.

### Nombres decididos

- **Bot de Telegram**: "Feria de Engremiat" -- si Plaza es la plaza del
  pueblo donde el cliente se queda a vivir (su sistema propio, soberano),
  Feria es la feria que llega y le invita a entrar: ligera, festiva, de
  bajo compromiso.
- **Workflow n8n**: `Feria - puerta de entrada (Telegram)`, mismo patrón de
  nombres ya usado (`Plaza - backend...`, `Cronista - Segmentar
  documento...`).

### Pendiente

- Nada de esto está construido -- ni el bot "Feria", ni el workflow, ni la
  escalera de escalones como flujo real dentro del sistema. Es la
  propuesta comercial y su nombre, no la implementación.

### Construido y probado de verdad (2026-08-30)

`@EngremiatFeria_bot` existe en Telegram y el workflow
`Feria - puerta de entrada (Telegram)` corre en el n8n compartido del PC
(único de los tres n8n con salida real a internet, vía el túnel ngrok ya
usado por Taller Trobaila -- ni la Pi ni el generador aislado pueden
recibir webhooks de Telegram). Probado en vivo: `/start` responde con el
menú de Escenarios (teclado inline), y elegir "Cuento Cooperativo" creó de
verdad la primera fila de grupo (`ENTIDAD_ORGANIZATIVA` id 4, "Grupo
Telegram -- JC", `TIPO_NIVEL=grupo`, con el `chat_id` de Telegram guardado)
-- verificado leyendo Baserow por API, no solo por la respuesta del bot.
Los botones "Próximamente, vótalo" responden con acuse de recibo pero
todavía no registran el voto en ninguna tabla real.

**Pendiente real, ajustado tras la prueba**:
- Persistir los votos de interés en una tabla real (hoy solo se acusa
  recibo por Telegram, no queda ningún registro consultable).
- Tras crear el grupo, todavía no se dispara la primera misión real -- el
  mensaje de confirmación lo promete, pero Cronista no se ha conectado
  todavía a este flujo.
- Probado con un solo usuario (el operador) -- sin ningún grupo real de
  Telegram (varias personas) todavía.

## La jugabilidad, explicada sin tecnicismos (2026-08-30)

Cómo se sentiría jugar "Cuento Cooperativo", contado como un juego de mesa:

1. **Entras al puesto de la feria.** Eliges tu aventura desde Telegram, sin
   instalar nada -- como elegir mesa en una feria de juegos.
2. **Repartes papeles.** El que propone y escribe (rol por defecto), el
   guardián del canon (vigila que nada se contradiga), el revisor (opina,
   no reescribe), el tutor/acompañante (si lo hay, guía y da el visto
   bueno en los momentos importantes), el editor final (junta todo al
   terminar).
3. **Se juega por misiones cortas**, como niveles: "hoy inventamos el
   primer personaje", "hoy decidimos dónde pasa la historia" -- diez
   minutos, progreso visible.
4. **Libertad total en el borrador, votación real en lo importante.**
   Proponer es libre; cambiar algo que afecta a todo el grupo (matar un
   personaje, cambiar el final, inventar una regla del mundo) pasa por
   decisión conjunta antes de quedar fijo.
5. **Nada se pierde, aunque se rechace** -- una idea no aprobada queda
   guardada con el motivo, recuperable más adelante.
6. **Al final se ve el resultado y quién hizo qué** -- no solo el cuento
   terminado, también quién propuso qué, quién resolvió una contradicción,
   quién ayudó a un compañero atascado. Cooperar y revisar cuentan como
   aportación real, no solo escribir más.
7. **Si gustó, se sube de nivel** -- el mismo grupo, con la confianza ya
   ganada, pasa a la siguiente aventura de la escalera de confianza.

En una frase: **un juego de mesa cooperativo donde el tablero es una
historia, las fichas son las decisiones del grupo, y ganar significa haber
construido algo juntos sin que nadie se sienta ignorado ni atropellado.**

## Personalización real desde el onboarding: casi un juego por grupo (2026-08-30)

### La propuesta del operador

Durante el alta y personalización de cada grupo, el sistema podría recoger
nombres reales, roles preferidos, historia del propio grupo, y datos de su
zona (geografía, historia local) -- e invertir eso en construir el
Escenario a medida de esa realidad concreta, no una plantilla genérica.
Las reglas del juego serían las mismas para todos; el contenido, propio de
cada grupo consolidado.

### Valoración -- la idea es sólida, y hay datos reales que la respaldan

- El 62% de líderes empresariales afirma que la personalización mejora
  mucho la retención; añadir gamificación sube el engagement un 48% y la
  retención en programas de fidelización un 22%
  ([Storyly](https://www.storyly.io/post/5-stats-that-prove-gamification-boosts-retention)).
  No son cifras de este nicho exacto, pero confirman la dirección: la
  gente vuelve más a lo que siente propio.
- Precedente de mercado real: productos personalizados como los libros
  infantiles de Wonderbly (el niño es el protagonista, con su nombre y su
  pueblo) tienen éxito comercial demostrado por la misma razón -- ver tu
  propia realidad dentro de la historia genera un enganche que ninguna
  plantilla genérica iguala. En comunidades de rol de mesa, el world
  building "sobre tu propio grupo de amigos" (Kanka, World Anvil) es ya
  una práctica extendida de forma informal -- Engremiat lo sistematizaría.

### Mejora sobre la propuesta -- cuándo pedir los datos, no solo qué pedir

Pedir nombres, historia del grupo y datos locales **antes** de la primera
partida rompería justo lo que hace fuerte a Feria: cero fricción, cero
compromiso. La mejora: pedir esta información **después** de una primera
ronda genérica que ya funcionó y gustó -- como una oferta de "subir de
nivel", no como un formulario de entrada. Encaja exactamente con la
escalera de confianza ya diseñada: el Escalón 0 sigue siendo instantáneo;
la personalización real es la puerta al Escalón 1.

### No hace falta infraestructura nueva -- es el mismo motor, otro contenido

Esta personalización es exactamente la misma cascada de coste ya construida
y probada (local prepara el borrador, DeepSeek/Claude lo pule) -- aplicada
a generar un Escenario a medida en vez de segmentar un roadmap en tareas.
El generador protegido (`engremiat-generador-n8n`) es también el lugar
correcto para esta lógica: la forma de convertir "datos de un grupo real"
en "un mundo narrativo a su medida" es precisamente el tipo de propiedad
intelectual que conviene proteger, coherente con el modelo de negocio ya
definido (catálogo vs. personalizado).

### Límites y honestidad

- Nombres reales, historia de un grupo y datos de su zona son datos
  personales desde el primer campo del formulario -- RGPD aplica igual
  que en el resto de este documento, con consentimiento explícito y
  revisable, doblemente sensible si el grupo incluye menores (p.ej. un
  aula).
- Nada de esto está construido -- ni el formulario de personalización, ni
  la lógica de "tejer" los datos reales en el Escenario, ni la oferta de
  "subir de nivel" tras la primera partida gratuita.
- Riesgo a vigilar: si la personalización tarda demasiado o pide
  demasiados datos de golpe, se pierde la ligereza que hace funcionar a
  Feria -- debe seguir sintiéndose como un paso más del juego, no como
  papeleo.

### Pendiente

- Diseñar el formulario mínimo de personalización (qué datos son
  imprescindibles, cuáles opcionales) y el momento exacto en que se ofrece
  tras la primera partida.
- Extender el prompt de la cascada de coste para "tejer" datos reales de
  grupo/zona en un Escenario, no solo para segmentar tareas -- mismo
  mecanismo, prompt nuevo.
- Decidir si esta personalización es gratuita (parte de subir de escalón)
  o ya es el primer punto de cobro real -- no decidido todavía.

## Consolidar el primer cliente real: valoración y una decisión de arquitectura expuesta (2026-08-30)

### La propuesta del operador

Cuatro pasos para consolidar el grupo real ya creado hoy vía Feria: alta en
Gestor de Proyectos, enlazar el bot Feria, diseñar la arquitectura de
Obsidian, y empaquetar la interacción del usuario vía peticiones al bot.

### El hallazgo que reordena el plan

`Gestor de Proyectos` resultó ser un sistema **distinto y más antiguo**
que todo lo construido hoy: Google Sheets + Apps Script, con una carpeta
por cliente (`test-cliente-2026-08-29.claude/` como plantilla real vista
en Drive) -- separado del sistema nuevo (Baserow + `ENTIDAD_ORGANIZATIVA`
+ Feria + generador aislado, todo probado hoy mismo). No se pudo leer su
Sheet desde esta sesión -- es un fichero de Drive "solo en la nube", sin
compartir con la cuenta de servicio disponible aquí.

Esto expone una decisión de arquitectura que el plan daba por resuelta sin
estarlo: **¿este cliente vive en Gestor de Proyectos o en Baserow?**
Meterlo en los dos sería duplicar la fuente de verdad.

### Decisión recomendada

Para este tipo de cliente -- ligero, entra por Telegram, empieza jugando
-- **Baserow es la fuente de verdad**: ya tiene la fila real (id 4), ya
tiene Feria escribiendo en ella, ya tiene el generador probado. Gestor de
Proyectos queda reservado para cuando este cliente necesite de verdad su
maquinaria pesada (campañas, presupuestos, procesos formales) -- no antes,
mismo principio de "no construir sin señal real" de todo el documento. Si
hace falta más adelante, se sincroniza, no se duplica desde el día uno.

### Lo que sí se hizo hoy, sin bloqueos

`manifiestos/obsidian.yaml` -- arquitectura de un vault de Obsidian **de
solo lectura** como espejo legible en markdown de lo que ya vive en
Baserow (biblia narrativa, tareas, documentos, decisiones). Reutiliza
Obsidian (gratis, sin servidor, sin cuenta obligatoria) en vez de construir
un lector propio -- coherente con "no reinventar" ya aplicado a
Loomio/Mobilizon. Sincronización propuesta vía Syncthing o Git, nunca vía
el servicio de pago de Obsidian, para no depender de un tercero con los
datos reales. Editar en Obsidian y que vuelva a Baserow queda
deliberadamente fuera de alcance -- problema de conflicto de versiones
real, no resuelto ni necesario todavía.

### Límites y honestidad

- Nada de esto está construido -- ni el endpoint de exportación a
  Obsidian, ni ninguna sincronización con Gestor de Proyectos.
- La columna `MODULO_OBSIDIAN` existe en `PAQUETE_CLIENTE` desde el diseño
  original sin que nadie la especificara hasta hoy -- y sigue sin ningún
  cliente real que la haya pedido.
- No se intentó forzar acceso a Gestor de Proyectos sin compartirlo
  primero -- coherente con no tocar sistemas sin verificar acceso real.

### Pendiente

- Compartir el Sheet de Gestor de Proyectos con la cuenta de servicio (o
  que el operador confirme que no hace falta todavía) antes de plantear
  cualquier sincronización real.
- Construir el endpoint de exportación a Obsidian cuando exista una razón
  real para consultar el grupo 4 fuera de Baserow/Plaza/Telegram.
- "Empaquetar la interacción vía petición al bot" -- en la práctica ya es
  lo que hace Feria hoy; lo que falta es solo conectar la primera misión
  real tras crear el grupo (ya señalado como pendiente en la sección de
  Feria), no un empaquetado nuevo.

## Primera misión real conectada (2026-08-30)

Cerrado el pendiente: al elegir "Cuento Cooperativo", Feria ahora también
crea una fila real de `TAREA` ("Elegid el primer personaje de vuestra
historia", vinculada al grupo recién creado vía `PROCESO_ID`) --
**deterministica, sin pasar por Cronista ni por ningún modelo de IA**,
porque la primera misión de un Escenario de catálogo es conocida de
antemano y no necesita generarse: coste cero, coherente con el nivel
"catálogo" del modelo de negocio ya definido (la vía con IA queda
reservada para personalización real, no para el contenido fijo de la
demo). Verificado leyendo Baserow por API: fila `TAREA` id 6, `PROCESO_ID`
5 (el grupo de la prueba), `ESTADO=Pendiente`. También se quitó la firma
"Enviado automáticamente con n8n" que Telegram añadía por defecto a los
mensajes de Feria (`appendAttribution: false`).

**Pendiente resuelto en la misma jornada**: el mensaje de confirmación
ahora incluye un botón "✅ Ya elegimos personaje -- marcar como hecho" que
actualiza la fila real de `TAREA` (`ESTADO=Completada`,
`PORCENTAJE_AVANCE=100`, `MODIFICADO_POR` con el nombre real de quien
pulsó) -- probado en vivo y verificado leyendo Baserow (fila 9,
`PROCESO_ID` 8). **El ciclo completo -- elegir escenario, crear grupo,
crear misión, completar misión -- funciona de punta a punta sin salir de
Telegram**, con cada paso verificado contra datos reales, no solo por la
respuesta del bot.

Pendiente real que queda: tras completar la primera misión no se genera
todavía una segunda -- el ciclo se cierra en uno solo, tendría que
encadenarse para que la partida siga.

## "Semilla Cooperativa": del juego a proyectos cooperativos reales (2026-08-30)

### La propuesta del operador

Una capa posterior a "Cuento Cooperativo": la misma mecánica de juego,
pero orientada a formar cooperativas reales -- vivienda, asociaciones,
comunidades. Grupos semilla que, jugando con reglas de gobernanza, generan
la documentación que arranca un proyecto real dentro de Engremiat.

### Investigación real que respalda la idea

- La **sociocracia** (gobernanza por consentimiento -- "nadie tiene una
  objeción razonada", no mayoría simple) es el método real que usan
  decenas de cooperativas de vivienda y ecoaldeas, y es **más fácil de
  implantar precisamente en un grupo que se está formando**
  ([Sociocracy For All](https://www.sociocracyforall.org/sociocracy-in-intentional-community/)).
  Coincide casi literalmente con el "grupo semilla" propuesto.
- Precedente académico de que las simulaciones gamificadas son un entorno
  seguro para practicar decisión cooperativa antes de lanzar una
  iniciativa real
  ([ScienceDirect](https://www.sciencedirect.com/science/article/pii/S1877050919320575)).
- Precedente de que un proceso guiado con plantillas produce de verdad
  borradores de estatutos: **Start.coop**, con su
  ["Bylaws Starter Kit"](https://www.start.coop/bylaws).
- Casualidad favorable: **Loomio**, ya elegido como motor de decisiones en
  `asociacionismo.yaml`, **ya soporta procesos de consentimiento
  nativamente** -- no hace falta construir nada nuevo para adoptar
  sociocracia, solo usar una capacidad ya prevista.

### El diseño

Un nuevo Escenario (`escenario.yaml`, catálogo), con una diferencia clave
frente a "Cuento Cooperativo": decisiones estructurales por consentimiento
sociocrático, no por votación mayoritaria. Las misiones no son narrativas
-- son: acordar valores compartidos, definir criterios de socio, redactar
estructura de gobernanza, identificar un proyecto o solar real. El
resultado final no es un cuento -- es una fila real de `PROYECTO`,
sembrada con las decisiones y roles ya auditados durante el "juego". Es
el Escalón 3 de la escalera de confianza (ya diseñada antes en este
documento), hecho concreto en vez de abstracto.

### Límites y honestidad

- Nada de lo que genere este Escenario sustituye a un abogado o notario
  -- el sistema prepara un borrador sólido y bien documentado, nunca una
  constitución legal de cooperativa.
- Sociocracia tiene curva de aprendizaje -- el rol de tutor/facilitador
  importa aquí más todavía que en "Cuento Cooperativo".
- Cero clientes reales lo han pedido -- exploración con buen respaldo de
  investigación, no una necesidad confirmada. Mismo principio de "no
  construir sin señal real" de todo este documento.

### Pendiente

- Diseñar el circuito sociocrático concreto sobre `DECISION_GRUPO`/Loomio
  -- hoy solo está descrito, no construido.
- Definir cómo una `ENTIDAD_ORGANIZATIVA` de tipo `grupo` "gradúa" a
  `asociación` y genera su primera fila de `PROYECTO` real.
- Ninguna comunidad real (vivienda, asociación) ha pedido este Escenario
  todavía.

### Cierre de circuito: la entrada de Cronista puede ser el propio grupo (2026-08-30)

Aclaración del operador sobre "Semilla Cooperativa": la entrada de
Cronista no tiene por qué escribirla un operador -- puede ser **la propia
deliberación colectiva del grupo** (un hilo de decisión de Loomio ya
cerrado, un resumen de lo acordado jugando). Es el mismo pipeline ya en
producción (`proponer_tareas`/`confirmar_tareas` en
`engremiat-generador-n8n`) -- no hace falta construir nada nuevo, solo
cambia de dónde viene `documento_texto`: de una persona que escribe, a un
grupo que decide. Es la forma concreta de que la inteligencia colectiva de
cualquier grupo proponga proyectos reales al sistema, con seguimiento,
sin que Engremiat tenga que escribir nada por ellos.

## Misiones encadenadas: "Cuento Cooperativo" ya es una partida completa (2026-08-30)

Se encadenó la secuencia fija de misiones de "Cuento Cooperativo" en
Feria: personaje → escenario → conflicto → primer párrafo por turnos →
revisión del guardián del canon → cierre de partida. Cada misión completada
calcula y crea automáticamente la siguiente (`TAREA_PREDECESORA_ID`
enlazando cada una con la anterior), con su propio botón de "marcar como
hecho" -- todo determinista, sin IA, coherente con el nivel "catálogo" de
coste cero. Al llegar al final del catálogo, se envía un mensaje de cierre
en vez de una misión nueva.

**Límite honesto**: el catálogo de misiones está fijo en el código del
workflow (`Determinar siguiente mision`), no en una tabla editable -- para
cambiar el guion de "Cuento Cooperativo" hoy hay que tocar el workflow, no
un fichero de configuración.

## Metodología de creación de historias, con precedentes reales verificados (2026-08-30)

### Las dos preguntas del operador, respondidas con precedentes probados

**"¿Cuántos personajes según cuántos usuarios tenga el grupo?"** -- ya
resuelto por el juego de rol **Fate Core** con el método **"Phase Trio"**:
tres fases donde cada personaje se conecta obligatoriamente con al menos
otros dos del grupo, contando algo vivido juntos. Escala solo -- funciona
igual con 3 personas que con 30, porque es una cadena rotatoria, no un
número fijo.

**"¿Cómo creamos una historia base que el equipo amplíe?"** -- el
precedente más probado del mundo: **Wikipedia**. Un artículo nace como
"stub" (esbozo, marcado explícitamente como incompleto) y lo amplía un
equipo coordinado ("WikiProjects"). Es el mismo patrón de "documentación
mínima ampliada por el equipo que la desarrolla" que ya se usa en
desarrollo de software, aplicado a millones de artículos.

### La metodología, con las piezas ya construidas

- **Fase 0 -- la semilla (stub)**: título, premisa de una frase, tono,
  escenario, y tantos huecos de personaje vacíos como personas reales
  tenga el grupo de Telegram (contado con la propia API de Telegram, no
  adivinado). Determinista, sin IA, coste cero.
- **Fase 1 -- reparto de personajes, método Phase Trio**: Cronista trocea
  la semilla en una misión de "crea tu personaje" por persona real, cada
  una pidiendo conectar con el personaje de la persona anterior.
- **Fase 2 -- Ejecutor/Ejecutor Local como "WikiProject"**: mismo
  mecanismo ya construido de seguimiento de mantenimiento, aplicado a
  seguir qué huecos del stub siguen vacíos.
- **Fase 3 -- Cronista cierra el círculo** (ya construido y probado hoy):
  la deliberación colectiva del grupo, sin que nadie escriba un documento
  formal, es la entrada de `proponer_tareas`/`confirmar_tareas`.
- **Fase 4 -- Pregonero publica** el resultado final (diseñado, no
  construido).
- **Fase 5 -- Oportunidad, corregido**: no es el eslabón más débil de la
  cadena (buscar dónde publicar un Escenario terminado) -- es el
  **generador de contexto real para la semilla**, apuntando su motor de
  detección (ya diseñado en `oportunidad.yaml`) a "qué le importa de
  verdad a esta comunidad" en vez de "quién nos puede financiar". Una
  premisa anclada en un rescate local real, en vez de una fantasía
  genérica -- mismo principio de "Preguntar": nunca inventar, siempre
  citar la fuente, con puerta humana obligatoria antes de usar cualquier
  dato real detectado.

### Límites y honestidad

- Nada de esta metodología está construida más allá de lo ya probado hoy
  (la cadena fija de 5 misiones de "Cuento Cooperativo"). El método
  Phase Trio, el conteo dinámico de personajes por grupo, y el nuevo
  `PERFIL_OBJETIVO` de Oportunidad orientado a contexto local, están
  descritos, no implementados.
- Requiere crear la tabla `PERSONAJE` (biblia narrativa, ya prevista en
  `escenario.yaml`) antes de poder capturar fichas reales -- hoy no existe.
- Usar datos reales detectados por Oportunidad para una historia exige la
  misma puerta humana y el mismo cuidado de fuente que ya rige "Preguntar"
  -- nunca automático.

### Pendiente

- Diseñar el `PERFIL_OBJETIVO` de Oportunidad orientado a "contexto local
  de interés" (distinto del ya descrito para subvenciones/organizaciones).
- Crear `PERSONAJE` y conectar la captura de texto real (no solo botones)
  en Feria -- pendiente ya señalado en la sección anterior.
- Implementar el conteo dinámico de participantes vía la API de Telegram
  para escalar el número de huecos de personaje.

## Corrección de arquitectura: "Taller" separa construir de servir (2026-08-30)

### El problema real que la disparó

Un bug real lo destapó: el catálogo de misiones de "Cuento Cooperativo"
vivía hardcodeado dentro del código JavaScript de un nodo de Feria, y se
editaba **en producción**, probando contra Telegram real sin ningún
entorno intermedio -- un salto de línea sin escapar en una expresión rompió
el bot para cualquier grupo real en ese momento. El operador señaló
correctamente que se estaba construyendo "de forma desordenada".

### La corrección

Se creó `manifiestos/taller.yaml` y una tabla real,
**`PLANTILLA_MISION`** (Baserow, id 284, Pi) -- `NOMBRE`, `ESCENARIO`,
`ORDEN`, `DESCRIPCION`, `TIPO_CAPTURA`, `ESTADO`
(`en_construccion`/`publicado`). El workflow de Feria se reescribió para
**consultar esta tabla en vez de decidir el contenido en código** -- las 5
misiones de "Cuento Cooperativo" ya viven ahí, marcadas `publicado`.
Cambiar el guion de un Escenario publicado ya no exige tocar el workflow,
solo editar una fila de Baserow.

### Límites y honestidad

- Todavía no existe ningún modo de prueba separado que lea
  `en_construccion` -- Taller hoy es solo la tabla y el cambio en Feria
  para leer de ella, no un espacio de validación real todavía.
- El catálogo de **Escenarios** (qué botones aparecen en el menú principal
  de Feria) sigue hardcodeado -- solo se migró el catálogo de misiones
  dentro de un Escenario ya elegido.
- Promocionar una misión de `en_construccion` a `publicado` sigue siendo
  edición manual en Baserow, sin ninguna pantalla dedicada -- suficiente
  mientras el volumen de contenido sea bajo (un Escenario, 5 misiones).

### Pendiente

- Construir un modo de prueba (bot separado o flag) que permita jugar
  misiones en `en_construccion` antes de publicarlas.
- Migrar también el catálogo de Escenarios a una tabla real.
- Decidir si Taller necesita interfaz propia o basta con Baserow mientras
  el contenido sea poco.

## "Acervo": el ciclo mayor, explicado sin tecnicismos (2026-08-30)

### La imagen que lo explica

Engremiat funciona como un taller de gremio medieval: varios oficiales
trabajan cada uno en lo suyo -- Ejecutor hace seguimiento de encargos,
Cronista convierte ideas sueltas en planes de trabajo, Oportunidad sale a
buscar clientes y material interesante por el pueblo, Pregonero anuncia lo
ya terminado. **Acervo es el almacén común del taller** -- no es un
oficial más, es el sitio donde todos dejan y recogen material. Cada vez
que un oficial termina algo que vale la pena guardar, lo deja en el
almacén antes de olvidarlo, para que cualquier otro lo use mañana sin
inventarlo de nuevo. No es un inventario que se revisa una vez al mes --
se llena y se consulta en cada interacción, de forma continua: es lo que
hace que el sistema se sienta "vivo por interacción".

### Cómo se convierte una historia en tareas reales, paso a paso

1. Alguien tiene una chispa de idea -- juega en Feria, propone algo en
   Taller, o una conversación revela un detalle interesante.
2. Cronista escucha esa chispa y la ordena en una lista corta de pasos
   concretos.
3. Una persona de confianza revisa esa lista antes de que se dé por buena
   -- puerta humana, sin excepción.
4. Esos pasos se convierten en tareas reales, y Ejecutor las vigila hasta
   completarse.
5. Si algo de ese proceso resultó especialmente bueno, pasa al almacén
   (Acervo) para que la siguiente historia no empiece de cero.

### Los dos sentidos del tráfico

- **De abajo hacia arriba** (ya funciona, orgánico): una persona juega,
  decide, propone -- esa materia prima sube y se convierte en algo del
  almacén común.
- **De arriba hacia abajo** (pendiente, lo genuinamente nuevo): cuando el
  operador decide activar un nicho de mercado concreto (cooperativas de
  vivienda, familias con hijos neurodivergentes...), en vez de esperar a
  que alguien juegue algo sobre ese tema, **le encarga directamente a
  Cronista construir una historia a medida** para ese público, usando lo
  que ya hay en Acervo más lo que Oportunidad encuentre de real sobre ese
  nicho en ese momento. Es encargar el traje a medida en vez de esperar a
  que alguien deje uno bonito en el almacén.

### Límites y honestidad

- Nada de Acervo está construido -- ni una tabla, ni el mecanismo de
  propuesta de candidatas, ni el encargo de arriba hacia abajo.
- El sentido "de arriba hacia abajo" es el único componente genuinamente
  nuevo -- todo lo demás (Cronista, Oportunidad, la puerta humana) ya
  existe y solo hay que conectarlo.
- Ningún nicho de mercado activado todavía que necesite esto de verdad --
  diseño anticipado, no una necesidad confirmada.

### Pendiente

- Diseñar la tabla real de Acervo y sus categorías (personajes-arquetipo,
  giros narrativos, contexto real de zona, patrones de segmentación
  validados).
- Construir el mecanismo de encargo de arriba hacia abajo: el operador
  describe un nicho, Cronista devuelve una primera historia para revisar.
- Decidir si Cronista propone candidatas a Acervo automáticamente al
  cerrar cada partida, o si la curación es siempre manual y a demanda.

## El ciclo local→DeepSeek, implantado en Taller (2026-08-30)

### Lo que se construyó

Dos acciones nuevas en el generador aislado (`engremiat-generador-n8n`),
reutilizando exactamente el mismo patrón ya probado con el roadmap de
Engremiat:

- `proponer_plantillas_mision` -- dado el nombre de un Escenario y una
  idea breve, el modelo local redacta un borrador de misiones y DeepSeek
  lo verifica y corrige (orden correlativo, una acción concreta por
  misión, `tipo_captura` bien razonado). No escribe nada en Baserow.
- `confirmar_plantillas_mision` -- guarda las plantillas ya aprobadas en
  `PLANTILLA_MISION`, siempre con `ESTADO=en_construccion` -- nunca
  `publicado` directamente, ni aunque la IA las diera por buenas. La
  promoción a `publicado` sigue siendo una decisión humana en Baserow.

### Prueba real

Probado con un Escenario nuevo, "Atlas vivo del barrio": el borrador local
más la verificación de DeepSeek propusieron 4 misiones coherentes (orden
correlativo, `tipo_captura` bien justificado -- "texto" cuando hace falta
escribir algo real, "botón" cuando solo hay que confirmar). Confirmadas 2
de ellas -- filas reales creadas en `PLANTILLA_MISION` (ids 8 y 9),
verificado leyendo Baserow, en `en_construccion`.

### Límites y honestidad

- El resto del catálogo (menú de Escenarios de Feria) sigue sin usar este
  mecanismo -- de momento solo autoria el contenido de misiones dentro de
  un Escenario ya elegido.
- Ningún modo de prueba real todavía para *jugar* una plantilla en
  `en_construccion` antes de publicarla -- sigue siendo el pendiente ya
  señalado en `taller.yaml`.
- Coste real de la prueba: 383 tokens de entrada, 336 de salida en la
  verificación de DeepSeek -- del mismo orden de céntimos ya medido antes.

### Pendiente

- Aplicar el mismo mecanismo para regenerar/mejorar el catálogo de
  "Cuento Cooperativo" ya publicado, no solo para Escenarios nuevos.
- Construir el modo de prueba de Taller que permita jugar
  `en_construccion` antes de promocionar a `publicado`.

## Modo de prueba de Taller, construido (2026-08-30)

### Diseño

Comando oculto `/taller` en el mismo bot de Feria, restringido al chat_id
del operador -- lista los Escenarios con misiones `en_construccion` como
botones, y al elegir uno crea un grupo marcado `[PRUEBA TALLER]` y
encadena sus misiones exactamente igual que una partida real, pero
consultando `en_construccion` en vez de `publicado`. Las respuestas de
texto en modo prueba se guardan en `TAREA.RESULTADO_ESPERADO` (genérico,
válido para cualquier Escenario) usando un marcador `(taller_ref:ID)`
distinto del `(ref:ID)` real -- para que nunca se mezcle con la captura de
`PERSONAJE` de "Cuento Cooperativo". Al agotar el catálogo en
`en_construccion`, avisa que la prueba terminó. Ninguna fila se marca
`publicado` automáticamente -- eso sigue siendo siempre una decisión
manual en Baserow.

### Por qué esta separación importa

Evita exactamente el problema que disparó esta corrección de arquitectura
hoy: probar contenido nuevo mezclado con partidas reales, en el mismo
canal, sin ningún cortafuegos. `/taller` corre en el mismo bot (no hace
falta mantener una segunda app), pero cada partida de prueba queda
marcada, aislada, y usando un catálogo distinto (`en_construccion`) del
que ve cualquier grupo real (`publicado`).

### Límites y honestidad

- Restringido por un único chat_id fijo en el código -- no hay lista de
  usuarios autorizados ni gestión de permisos, suficiente mientras solo el
  operador prueba contenido.
- No se ha jugado todavía una partida completa de prueba real -- construido
  y desplegado, pendiente de la primera verificación en vivo.
- La promoción de `en_construccion` a `publicado` sigue siendo edición
  manual en Baserow, sin ninguna pantalla ni acción dedicada.

### Pendiente

- Verificar en vivo el flujo completo de `/taller` contra "Atlas vivo del
  barrio".
- Decidir si vale la pena una acción n8n dedicada para "promocionar" en
  vez de editar el campo `ESTADO` a mano en Baserow.

### Cuatro fallos reales, corregidos hasta que funcionó de verdad (2026-08-30)

Construir `/taller` costó más intentos de los esperados -- documentado con
honestidad porque cada fallo enseña algo real:

1. **Teclado dinámico del nodo Telegram de n8n**: el parámetro
   `inlineKeyboard.rows` no acepta sustituirse entero por una expresión
   (`={{ $json.rows }}`) -- el mensaje salía sin botones, sin error visible.
   Solución: llamar directamente a la API de Telegram vía `httpRequest`,
   con control total del JSON del teclado.
2. **Índices de conexión desalineados**: al añadir una tercera regla al
   `Switch` de callbacks, las conexiones de las dos rutas siguientes
   quedaron cruzadas -- el botón de Taller caía en el gestor de "voto
   anotado" y viceversa. Solución: recalcular el orden real
   (reglas explícitas primero, en el orden declarado; el `fallbackOutput`
   siempre al final) en vez de asumirlo.
3. **Guion bajo interpretado como Markdown**: `(taller_ref:N)` y nombres
   como `atlas_vivo_del_barrio` rompían el parseo de Telegram (`_` abre
   cursiva en Markdown sin cerrar). Solución: quitar el guion bajo del
   marcador (`tallerref:`) y mandar los mensajes de misión también por
   `httpRequest` directo, sin `parse_mode`, para no depender de escapar
   cada carácter especial que aparezca en contenido dinámico.
4. **El mismo bug de saltos de línea reales dentro de una expresión** (ya
   visto varias veces hoy) reapareció en los nodos nuevos, por seguir
   editándolos con comandos de una sola línea en la terminal en vez de con
   un fichero de script real. Ya corregido, y la lección aplicada
   definitivamente: cualquier texto con `\n` dentro de una expresión se
   edita a partir de ahora solo mediante ficheros `.mjs`, nunca con
   comandos sueltos.

## Versionado real: producción y mejora en paralelo (2026-08-30)

### Lo construido

- **Campo `VERSION`** añadido a `PLANTILLA_MISION` y a `TAREA` -- una
  misma historia puede tener varias versiones coexistiendo como filas
  distintas, sin que una sobreescriba a la otra.
- **Tercer estado, `archivado`**, junto a `en_construccion`/`publicado` --
  una versión retirada no se borra, queda marcada.
- **Cada grupo queda anclado a la versión con la que empezó**: al crear la
  primera misión se guarda su `VERSION`; cada misión siguiente se busca
  filtrando por esa misma `VERSION`, no por "lo que esté publicado ahora".
- **Nueva acción `promocionar_version`** en el generador: archiva de golpe
  toda la versión publicada actual y publica la nueva -- una sola llamada,
  con puerta humana (quien decide promocionar eres tú, no se hace solo).

### Prueba real, con las dos condiciones que importaban

1. Se creó una v2 real de "Cuento Cooperativo" (5 misiones,
   `en_construccion`) vía `confirmar_plantillas_mision`.
2. Se creó un grupo de prueba con la v1 todavía vigente (anclado a
   `VERSION=1`).
3. Se promocionó la v2 -- v1 pasó a `archivado`, v2 a `publicado`.
4. **Un grupo nuevo, a partir de ese momento, ve la v2** (verificado:
   "...v2, mejorada", `VERSION=2`).
5. **El grupo creado antes de promocionar sigue encontrando su misión 2 en
   la v1**, aunque esas filas ya estén `archivado` -- verificado leyendo
   Baserow directamente, no solo confiando en el diseño.

### Un fallo real grave, corregido en el momento

Al añadir la opción `archivado` al campo `ESTADO`, Baserow regeneró los
IDs internos de las tres opciones -- **todas las filas de
`PLANTILLA_MISION` perdieron su valor de `ESTADO`** (quedaron en `null`),
dejando "Cuento Cooperativo" sin ninguna misión publicada en producción
durante varios minutos. Corregido reasignando el estado correcto a cada
fila con los IDs nuevos, y actualizando los 6 nodos de Feria/generador que
tenían los IDs viejos escritos a mano. Lección real: cualquier cambio a
las opciones de un campo `single_select` que ya tiene datos reales debe
tratarse como una migración, no como una edición trivial.

### Límites y honestidad

- La promoción exige que la nueva versión tenga TODAS las misiones del
  Escenario en `en_construccion` antes de promocionar -- si falta alguna,
  un grupo que llegue a ese punto se quedará sin siguiente misión.
- Solo implementado para "Cuento Cooperativo" -- el resto de Escenarios
  (cuando los haya) necesitarán lo mismo si se les aplica versionado.
- No hay ninguna pantalla para ver "qué grupos siguen en qué versión" --
  solo consultando Baserow directamente.

### Pendiente

- Extender el versionado al catálogo de Escenarios en sí (qué botones
  aparecen en Feria), no solo a las misiones dentro de uno ya elegido.
- Construir una validación que impida promocionar una versión incompleta
  (falta alguna misión respecto al total esperado).

## Diccionario de términos y "Concilio" con presupuesto y sociocracia real (2026-08-30)

### Diccionario

El vocabulario ya no cabe en la cabeza -- creado
[`DICCIONARIO_ENGREMIAT.md`](DICCIONARIO_ENGREMIAT.md), referencia rápida
de cada término (Cronista, Ejecutor, Ágora, Pregonero, Oportunidad, Plaza,
Feria, Taller, Escenario, Acervo, Concilio...) con una línea de qué es y si
está construido o solo diseñado. Se actualiza según crece el sistema.

### "Concilio", nombrado y comparado con frameworks reales

Nombre elegido para el multiciclo de varios Acervos deliberando
internamente antes de que una idea llegue a Cronista -- funciona igual
para un cuento, un proyecto de software o una cooperativa de aceitunas.
Comparado con lo que ya existe en el mercado: **AutoGen** (grupo de
agentes con gestor de turno), **CrewAI** (crew de roles con objetivo
propio), **Mixture-of-Agents** (ICLR 2025 -- varios proponen, uno
sintetiza, mejora medible), **Multiagent Debate** (MIT -- rondas de
crítica mutua). Corrección real incorporada: el paper *"Talk Isn't Always
Cheap"* (2025) demuestra que el debate sin límite **empeora** el resultado
frente a algo tan simple como votar -- Concilio usa rondas acotadas (2-3)
más una síntesis final, nunca debate abierto.

### Presupuesto medible y anticipable -- la lección de OpenClaw, aplicada

Ya investigamos OpenClaw el 2026-08-29 y encontramos casos reales de
facturas de **más de $3.600 en un mes** por bucles de agente sin control.
Concilio se diseña para que el coste se calcule *antes* de ejecutar, no se
descubra después:

```
coste_estimado = numero_de_acervos × rondas × coste_medio_por_llamada (~$0,005 con DeepSeek, ya medido hoy) + 1 síntesis
```

Para 3 Acervos × 2 rondas + síntesis, del orden de **$0,035 por ejecución**
-- el riesgo real no es una ejecución, es la repetición sin límite.
Mitigación: tope de gasto real en LiteLLM (ya disponible de fábrica, sin
configurar todavía con un límite explícito para Concilio) más el gate
sociocrático de abajo.

### Sociocracia, puesta a funcionar de verdad -- de forma reflexiva

La sociocracia (ya diseñada para "Semilla Cooperativa") se aplica ahora al
propio Engremiat: el resultado sintetizado de Concilio **no pasa
automáticamente a desarrollarse de verdad** -- antes necesita el mismo
gate de consentimiento humano ("nadie tiene objeción razonada") que se
exigiría a cualquier grupo real. Evita que Concilio genere muchas ideas
baratas y las desarrolle todas sin criterio solo porque "salió barato
generarlas".

### Límites y honestidad

- Nada de Concilio está construido -- diseño con precedente real
  verificado, no una promesa de resultado.
- El tope de gasto de LiteLLM existe de fábrica pero no está configurado
  todavía con un límite explícito para este uso.
- La estimación de coste es una aproximación razonada sobre datos ya
  medidos, no una factura real de Concilio (que no existe todavía).

### Pendiente

- Configurar el tope de gasto explícito en LiteLLM antes de construir
  ninguna ejecución real de Concilio.
- Diseñar el mecanismo concreto de consentimiento (¿quién da el "sí" hoy,
  mientras solo hay un operador?).
- Mantener `DICCIONARIO_ENGREMIAT.md` actualizado con cada pieza nueva --
  no se actualiza solo.

## Tope de gasto real, construido (2026-08-30)

### Hallazgo antes de construir nada

LiteLLM tiene un sistema de presupuesto nativo, pero **no hace nada sin una
base de datos conectada** -- sin ella, el límite se ignora en silencio (un
aviso al arrancar, ninguna petición bloqueada). Configurarlo tal cual habría
sido la misma trampa ya señalada con OpenClaw ("asumir que ya está
cubierto"). Decisión, con el operador: registro propio en Baserow, sin
infraestructura nueva.

### Lo construido

- **Tabla `GASTO_API`** (Baserow, id 285): cada llamada real a DeepSeek
  registra tokens de entrada/salida y coste estimado (tarifa "punta"
  conservadora, la misma ya usada en las mediciones de hoy).
- **Comprobación antes de llamar**: el generador suma el gasto de los
  últimos 30 días antes de cada llamada a DeepSeek -- si supera el tope
  ($5 USD, ajustable en el código), **no llama a DeepSeek**, devuelve el
  borrador local sin verificar con un aviso explícito.
- Aplicado a las dos rutas que usan DeepSeek: segmentación de tareas
  (`proponer_tareas_premium`) y autoría de misiones en Taller
  (`proponer_plantillas_mision`).

### Un fallo real, instructivo, corregido en el camino

El primer intento usó `await` dentro de un nodo Code para escribir en
Baserow -- **funcionaba de forma intermitente**, sin ningún error visible:
a veces la fila se creaba, a veces no, según una condición de carrera real
del sandbox de ejecución de n8n (el nuevo "task runner" no garantiza
esperar una llamada HTTP externa dentro de un nodo Code en todos los
casos). Verificado con un diagnóstico explícito antes de descartar la
hipótesis. Solución: mover la escritura a un nodo HTTP Request real (el
mismo mecanismo ya usado con éxito en todo lo demás construido hoy), nunca
un `await` suelto dentro de un nodo Code. Un segundo fallo menor
-- el campo de coste tiene 6 decimales y el cálculo generaba más --
corregido redondeando antes de guardar. **Probado tres veces seguidas
tras el arreglo, las tres con registro real verificado en Baserow.**

### Límites y honestidad

- El tope ($5/mes) es una cifra de partida razonable, no una cifra
  validada contra ningún presupuesto real del operador.
- La tarifa usada para estimar el coste es la "punta" (peor caso) de
  DeepSeek -- el gasto real acumulado probablemente sea algo menor.
- No hay ninguna alerta ni notificación cuando se acerca al tope, solo el
  corte al superarlo.

### Pendiente

- Aplicar el mismo mecanismo si Claude llega a automatizarse alguna vez
  (hoy sigue siendo manual, sin coste de API que vigilar).
- Decidir si $5/mes es el tope correcto una vez haya uso real sostenido,
  no solo pruebas.
- Una pantalla o acción para consultar el gasto acumulado sin entrar a
  Baserow directamente.

## Concilio, primera ejecución real (2026-08-30)

### Lo construido, versión mínima deliberada

Sin rondas de debate (la corrección ya decidida: el debate abierto
empeora resultados) -- una sola pasada por Acervo:

- **Tabla `ACERVO`** (Baserow, id 286) -- el almacén en sí, listo para
  guardar personajes, giros y contexto real reutilizable (vacío todavía).
- **Dos personas de Acervo**, hoy fijas en código: *Acervo Rural* (campo,
  oficios, estaciones) y *Acervo Urbano* (barrio, vecindad, ciudad) --
  cada una propone su idea con el modelo local, gratis.
- **Una síntesis final con DeepSeek** combina ambas propuestas en una
  sola idea coherente -- con el mismo tope de gasto ya construido
  comprobado antes de llamar.

### Prueba real

Tema: *"un huerto comunitario que nadie sabe muy bien de quién es"*.
Resultado: una propuesta integrada real, con elementos rurales y
comunitarios entrelazados (memoria oral, reparto sin propietario,
relevo generacional) -- coste real registrado: **$0,00055**. Sin
desarrollar todavía -- la nota final del propio Concilio deja explícito
que hace falta decisión humana antes de pasar esto a `proponer_tareas`
(software/proyecto) o `proponer_plantillas_mision` (historia/Escenario).

### Límites y honestidad

- Las dos personas de Acervo están fijas en código, no en una tabla --
  para más de dos, o para que se puedan editar sin tocar el workflow,
  hace falta una tabla `ACERVO_PERSONA`.
- La tabla `ACERVO` existe pero está vacía -- nada de lo generado hoy se
  ha guardado ahí todavía como recurso reutilizable.
- El "consentimiento humano" antes de desarrollar la idea sigue siendo
  informal (el operador decide a ojo) -- no hay ningún circuito
  sociocrático real todavía, solo el principio aplicado de palabra.
- Solo probado una vez -- no hay todavía evidencia de que la calidad se
  mantenga con temas más complejos o ambiguos.

### Pendiente

- Tabla `ACERVO_PERSONA` para más voces y para poder editarlas sin tocar
  el workflow.
- Guardar de verdad en `ACERVO` los elementos reutilizables de una
  propuesta ya desarrollada.
- El circuito de consentimiento real (hoy es "el operador decide", no
  sociocracia de un grupo).
- Probar con un tema orientado a software, no solo a comunidad/historia,
  para confirmar que el mismo mecanismo sirve para los tres dominios que
  se pedían (cuento, software, cooperativa).

## Prueba con tema de software, y cuatro mejoras estratégicas de la misma tarde (2026-08-30)

### Prueba de software -- funciona igual la mecánica, no siempre el encaje

Mismo Concilio (Acervo Rural + Urbano), tema: una herramienta para que un
equipo pequeño decida qué error corregir primero. Resultado: propuesta
técnicamente coherente ("Cosecha Prioritaria", índice de impacto, mapa de
plagas por módulo), coste real $0,00054 -- **la tubería funciona
idéntica**, pero el resultado fuerza una metáfora agrícola sobre un
dominio que no la pedía. Hallazgo honesto, no un fallo: confirma que hacen
falta Acervos con enfoque de software (backend/frontend/redes, ya
anticipado por el árbol `COMPETENCIA`) para que la calidad, no solo la
mecánica, sea igual de buena en los tres dominios.

### Ecosistema de Acervos, sin jerarquía nueva

Los árboles `COMPETENCIA` (respaldado por ESCO) y `UBICACION_GEOGRAFICA`
ya construidos sirven para anclar Acervos reales -- *Acervo Ebanistería*,
*Acervo Backend*, *Acervo Comarca-X* -- en vez de nombres inventados en
código. Un Concilio elegiría sus voces filtrando por sector o zona real.

### Grafo de Obsidian para Acervo -- sin adoptar OpenClaw

Recuperada la investigación de ayer: no se recomienda el plugin de
Obsidian de OpenClaw (mismo ecosistema con historial de seguridad
problemático). Obsidian ya soporta `[[wikilink]]` y vista de grafo de
forma nativa -- el volcado de solo lectura ya diseñado en `obsidian.yaml`
basta para tener el grafo de Acervo sin ninguna dependencia nueva.

### Sociocracia -- honestidad sobre lo que hay hoy, y una mejora real

Con un solo operador no hay sociocracia real posible -- exige un grupo. Lo
honesto hoy sería un campo de consentimiento trazable
(`CONSENTIDO_POR`/`FECHA`), no sociocracia todavía. **Mejora real
aportada por el operador**: las propias simulaciones de Concilio (varias
voces proponen, una síntesis integra sin objeción) ya modelan el patrón
sociocrático -- etiquetadas como `demo_onboarding`, sirven de material
real para que un cliente nuevo *vea* cómo funciona antes de tener que
hacerlo de verdad, cerrando el hueco de la curva de aprendizaje ya
señalada como riesgo real de la sociocracia.

### Concilio alimenta a Pregonero y Oportunidad mientras se construyen

Las simulaciones etiquetadas `demo_onboarding` son el primer material real
de **Pregonero** (practicar publicación sin esperar a un cliente con
historia terminada) y de **Oportunidad** (cuyo contexto real detectado
alimentaría la siguiente tanda de simulaciones, ancladas cada vez más en
la realidad).

### "Vigilia" -- construido y en marcha esta misma noche

Nombre elegido para el lote de Concilio trabajando sin supervisión --
coherente con el resto del vocabulario del gremio (una guardia nocturna
mientras el resto descansa). Construido:

- **Tabla `VIGILIA_TAREA`** (Baserow, id 287) -- cola de capítulos
  pendientes, cada uno con contexto del anterior.
- **Disparador programado cada 15 minutos** en el generador: busca el
  siguiente capítulo pendiente, añade el resultado del capítulo anterior
  como contexto, llama a Concilio, guarda el resultado.
- Sembrados 4 capítulos reales, continuando "El Huerto del Abuelo" (la
  historia que generó Concilio hoy): conflicto, decisión del grupo, giro
  inesperado, cierre.
- **Verificado manualmente el mecanismo completo** antes de dejarlo
  desatendido -- capítulo 1 ya procesado con continuidad narrativa real
  confirmada. Los capítulos 2-4 los procesará la Vigilia programada
  durante la noche, para revisar el guión completo por la mañana.

### Límites y honestidad

- El disparador programado no se ha probado disparándose solo todavía --
  solo se verificó la lógica a mano, replicando lo que hará.
- Ningún Acervo por sector/zona está construido -- siguen siendo dos
  voces fijas (Rural/Urbano) en código.
- El etiquetado `demo_onboarding`/`desarrollo_real` de Concilio es una
  propuesta, no está implementado -- hoy todo lo que genera Concilio es
  indistinguible en ese sentido.

### Pendiente

- Confirmar por la mañana que la Vigilia procesó los 4 capítulos sola.
- Añadir Acervos de software (backend/frontend/redes) y probar de nuevo
  el tema técnico con voces adecuadas.
- Implementar el campo `CONSENTIDO_POR`/`FECHA` como primer paso trazable
  hacia la sociocracia real.
- Etiquetar de verdad las salidas de Concilio como `demo_onboarding` o
  `desarrollo_real`, y conectar las de demo con Pregonero.

## Vigilia ampliada: cola encadenada sin espera, tres dominios en paralelo (2026-08-30)

### La mejora sobre el diseño anterior

El disparador cada 15 minutos desperdiciaba casi todo ese tiempo esperando,
cuando cada ciclo tarda segundos. Corregido: **`Guardar resultado en
Vigilia` vuelve a conectar con `Buscar siguiente Vigilia pendiente`** en
vez de terminar -- en cuanto un elemento se procesa, empieza el siguiente
de inmediato. El disparador programado (cada 15 min) queda como red de
seguridad para arrancar la cola o recuperarla si algo la detiene, no como
el ritmo de trabajo real.

### Personas de Acervo, ahora configurables por petición

`concilio_proponer` acepta un campo `personas` opcional -- si no se manda,
usa Rural/Urbano por defecto (compatibilidad con lo ya probado). La cola
de Vigilia guarda qué personas usar por elemento (`PERSONAS_JSON`),
permitiendo comparar dominios con voces adecuadas a cada uno en el mismo
lote, sin tocar código para cada prueba.

### El lote sembrado esta noche -- tres dominios reales, no solo uno

- **Huerto del Abuelo** (capítulos 2-4, Rural + Urbano) -- termina la
  historia ya empezada hoy.
- **Reparto de tareas vecinales** (3 pasos, Acervo Backend + Acervo
  Frontend) -- un caso de software real, con voces técnicas adecuadas
  esta vez, no las mismas de la historia.
- **Taller de oficios adaptado** (3 pasos, Acervo Cuidados + Acervo
  Patrimonio) -- un caso de cooperativa/Semilla Cooperativa, con voces
  desde la diversidad funcional y la memoria de oficios.

9 elementos en total, en tres cadenas independientes (rangos de `ORDEN`
separados para que cada una encuentre su propio capítulo anterior sin
mezclarse con las otras).

### Límites y honestidad

- El encadenado sin espera no se ha visto correr todavía de verdad -- solo
  desplegado y razonado, pendiente de la primera vez que el disparador lo
  arranque.
- Las voces de Acervo (Backend/Frontend/Cuidados/Patrimonio) son nuevas,
  escritas hoy mismo, sin ninguna prueba previa aislada -- esta es su
  primera prueba real.
- Sigue sin existir ninguna tabla `ACERVO_PERSONA` -- las voces siguen
  viajando como JSON en el cuerpo de la petición, no como catálogo
  reutilizable.

### Pendiente

- Revisar mañana las tres cadenas completas -- calidad, coherencia,
  si las voces nuevas encajan mejor que Rural/Urbano en sus dominios.
- Si funciona bien, convertir `PERSONAS_JSON` en referencias a una tabla
  `ACERVO_PERSONA` real en vez de JSON suelto por fila.

## Canvas+DAFO, exportación a PDF y aviso por correo al terminar la Vigilia (2026-08-30)

### Por qué

Petición directa: poder valorar mañana no solo si una historia queda bien
contada, sino si una de las ideas de software que produce Concilio
serviría como módulo nuevo real de Engremiat -- con un documento de
negocio de verdad (Canvas, DAFO, plan, presupuesto, alianzas), exportable
como PDF entregable a un cliente o socio, y un aviso por correo cuando la
Vigilia termine, con el coste real en tiempo y tokens para decidir si
merece la pena ampliar el presupuesto mensual y encolar más trabajo.

### Qué se construyó

- **Acción `generar_canvas_dafo`** en el generador -- mismo patrón que
  `concilio_proponer` (borrador local gratuito -> comprobación de
  presupuesto -> verificación DeepSeek con coste registrado), pero en vez
  de una propuesta narrativa produce un análisis de negocio completo:
  Business Model Canvas (9 bloques), DAFO (4 cuadrantes), resumen de plan
  de negocio, presupuesto estimado de puesta en marcha, alianzas
  estratégicas reales posibles, y un veredicto explícito
  (`encaje_engremiat`) sobre si la idea encajaría como módulo nuevo de
  Engremiat -- para que la respuesta al "¿nos sirve?" no dependa solo de
  la lectura humana, sino que el propio sistema se moje primero.
- **Exportación a PDF real y duradero**: se amplió `render-worker.py`
  (el servicio que ya generaba PDFs para Cronista) para aceptar una
  `ruta_guardado` opcional -- si se manda, además de devolver el PDF a
  n8n, escribe una copia persistente en
  `G:\Mi unidad\DEVS\engremiat-litellm\documentos-generados\`. El
  generador construye un HTML con estilo propio a partir del JSON de
  Canvas+DAFO y se lo pasa a este endpoint, guardando el resultado con
  nombre único (`canvas_dafo_<timestamp>.pdf`).
- **Aviso por correo al vaciarse la cola de Vigilia**: reutilizado (no
  duplicado) el webhook `notificar-humano` que ya existía en el n8n
  compartido (correo vía SMTP, mismo remitente/destinatario que ya se
  usaba para Taller). Cuando la Vigilia ya no encuentra elementos
  pendientes, construye un resumen HTML con cada capítulo procesado, el
  gasto total del día (tokens y coste en USD, leído de `GASTO_API`) y los
  minutos transcurridos, y lo envía por correo.
- **`VIGILIA_TAREA` ahora admite un campo `ACCION` por fila** (por
  defecto `concilio_proponer`, también acepta `generar_canvas_dafo`) --
  así una misma cola puede mezclar capítulos de historia con análisis de
  negocio, sin tocar código.

### Verificado antes de dejarlo desatendido

Antes de fiar el resultado a la cola nocturna, se invocó `generar_canvas_dafo`
a mano con un tema real (herramienta de reparto de tareas vecinales) y se
confirmaron los tres puntos críticos por separado:

1. El JSON completo vuelve con los 9 bloques del Canvas, el DAFO, plan de
   negocio, presupuesto, alianzas y el veredicto de encaje -- coherente y
   completo, no truncado.
2. El gasto quedó registrado de verdad en `GASTO_API` (fila id 12:
   944 tokens de entrada, 1871 de salida, $0.002885).
3. El PDF se escribió de verdad en disco:
   `documentos-generados/canvas_dafo_1788121782815.pdf`, 70 266 bytes.

Con esto verificado, se encoló la prueba real para la Vigilia: fila
`VIGILIA_TAREA` id 13 (`Software.4 - Canvas y DAFO`, `ACCION:
generar_canvas_dafo`), colocada justo después de `Software.3` para que
reciba como contexto la idea ya desarrollada en los pasos anteriores de
esa cadena.

### Límites y honestidad

- Lo verificado es la acción aislada, llamada a mano una vez. Lo que
  **no** se ha visto todavía es que la Vigilia, corriendo sola de noche,
  llegue hasta este elemento (id 13) dentro de su cola encadenada y lo
  procese sin intervención.
- El correo de resumen al vaciarse la cola tampoco se ha visto disparar
  todavía en una ejecución real de la Vigilia -- solo se construyó y
  desplegó el nodo, razonando sobre el mismo mecanismo ya probado para
  `notificar-humano` en Taller.
- El HTML del Canvas+DAFO usa un estilo fijo definido en el generador --
  no hay todavía ninguna opción de plantilla o marca distinta según el
  destinatario (cliente final vs. uso interno).
- Solo se ha probado un tema de software. No hay ninguna garantía de que
  la calidad del análisis se sostenga igual con un tema de otro dominio
  (p. ej. una idea de cooperativa o de patrimonio) -- eso es justo parte
  de lo que hay que valorar mañana con los resultados reales.

### Pendiente

- Confirmar por la mañana que la fila 13 se procesó sola dentro de la
  Vigilia y que el correo de resumen llegó de verdad con el lote completo.
- Valorar la calidad real del Canvas+DAFO generado (no solo que la
  tubería funcione) y decidir si el "encaje_engremiat" que propone el
  propio sistema es fiable o hay que pedir una segunda verificación
  humana siempre.
- Decidir, con el coste real medido esta noche, si ampliar el tope
  mensual de $5 en DeepSeek para poder encolar más ejercicios como este.
- Si se valida el mecanismo, extender `generar_canvas_dafo` a los otros
  dos dominios sembrados (Huerto del Abuelo como posible producto,
  Taller de oficios/Semilla Cooperativa) para comparar encaje entre los
  tres.
