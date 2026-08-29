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

## Jerarquía de tres niveles (con el hardware real ya disponible)

1. **Raspberry Pi + SSD externo** -- el cerebro siempre encendido, bajo
   consumo. Guarda los datos del cliente (Sheet sincronizado, bóveda
   Obsidian, backups), corre el bot de Telegram, y modelos pequeños para
   tareas ligeras. El SSD (en vez de tarjeta SD) es la elección correcta:
   más rápido, más fiable, con espacio real para modelos y datos.
2. **PC del operador + DeepSeek** -- el "músculo" bajo demanda: se activa
   cuando hace falta más potencia de la que da la Pi, mismo patrón que ya
   usa hoy `92_BUS_TRABAJO` para repartir trabajo real.
3. **Claude (nube)** -- último recurso, solo para lo verdaderamente complejo
   o cuando el nivel 2 no da la talla. Señal de escalado ya disponible sin
   inventar nada nuevo: cuando el worker local marca una tarea como
   `rechazada` en el bus de trabajo (ya ocurrió hoy con `TASK-0004`), esa es
   la señal natural para subir al nivel 3.

## Beneficio no buscado: esto también prueba la Fase 1 de independencia de red

Al vivir en hardware propio y descentralizado, esta prueba responde de paso
la pregunta que dejó abierta `PROPUESTA_PRODUCTO_LOCAL_INDEPENDIENTE.md`: qué
pasa si se corta la conexión a internet. Diseño previsto desde el principio:
la Pi y el PC siguen funcionando para todo lo que no necesite el nivel 3; solo
la escalada a Claude queda en cola hasta que vuelva la red -- ni se pierde
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
- **Raspberry Pi como nodo de inferencia siempre encendido**, emparejado con
  un equipo más potente para cargas pesadas: patrón ya documentado y probado
  por terceros -- encaja exactamente con la jerarquía de tres niveles descrita
  arriba.
- **Onboarding conversacional**: "la primera interacción es una conversación
  que declara intención, y la ruta se adapta a esa intención" mide 3.2x más
  activación que un tour de producto fijo (benchmark Perspective AI 2026).

## Arquitectura propuesta (por capas)

### 1. Infraestructura: Raspberry Pi + SSD (control) y PC (cómputo bajo demanda)

Ver jerarquía de tres niveles arriba. La Pi es el plano de control, siempre
encendida, bajo consumo. El PC es el worker elástico. Claude es el último
recurso, invocado hacia fuera, nunca al revés en esta primera fase.

### 2. Bóveda Obsidian: construcción y personalización

Construida a partir de las entidades reales del cliente (`DOCUMENTO`,
`DECISION`, `TAREA`, `PROYECTO`...), reutilizando `generarNotaObsidian()` ya
construido y probado. Personalización real: qué entidades se exportan
depende de los módulos contratados -- mismo patrón que ya usamos en CAM-0002.
Búsqueda semántica ligera vive en la Pi; el razonamiento pesado se delega
al PC, y solo lo verdaderamente complejo escala a Claude.

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

Ver sección "Dos direcciones distintas" arriba. Fase 1 de esta prueba: la Pi
o el PC llaman a la API de Claude cuando el nivel 2 (PC+DeepSeek) rechaza o
no puede con una tarea. Fase posterior (opcional): Custom Connector para que
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
   Pi + SSD como plano de control, PC+DeepSeek como músculo bajo demanda,
   escalada a Claude solo hacia fuera (sin exponer nada a internet). Prueba
   también la resiliencia ante cortes de red.
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
  sigue sin abordarse, deliberadamente, hasta tener datos reales de esta prueba.
- Qué modelo(s) concretos corren en la Pi (candidatos ligeros: Phi-3, Qwen2
  pequeño) vs en el PC (DeepSeek, ya en uso).
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
