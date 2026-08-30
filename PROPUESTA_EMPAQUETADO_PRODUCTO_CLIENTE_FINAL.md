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
