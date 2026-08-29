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
3. **Fase 2 -- dirección de entrada (opcional)**: Custom Connector MCP
   expuesto vía túnel, para que el cliente entre desde su propio chat.
4. **Fase 3 -- personalización real de la bóveda**: plantillas de exportación
   por combinación de módulos, mismo patrón que CAM-0002.
5. **Fase 4 -- asistente conversacional de gestión + onboarding automatizado**.

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
