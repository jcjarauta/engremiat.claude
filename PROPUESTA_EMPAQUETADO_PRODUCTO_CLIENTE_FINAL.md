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
