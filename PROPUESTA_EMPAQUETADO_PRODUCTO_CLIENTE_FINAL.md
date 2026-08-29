# Propuesta — Empaquetar Engremiat para uso real: infraestructura de cliente, bóveda Obsidian y vínculo conversacional

**Fecha de apertura:** 2026-08-29
**Estado:** A valorar -- diseño en curso
**Incidencia Sheet:** INC-0066 (`13_INCIDENCIAS`, A valorar)
**Proyecto Sheet:** PRO-0022 (`02_PROYECTOS`, Gestor de Proyectos, CAM-0004)
**Origen:** conversación derivada del piloto TEST-Cliente-2026-08-29 (PRO-0020) --
al ver el ciclo completo funcionar de principio a fin sobre un cliente real, la
pregunta natural fue "¿cómo empaquetamos esto para un usuario final de verdad?"

## Disparador

TEST-Cliente-2026-08-29 demostró que el ciclo completo funciona: montaje
automático, bot operativo, exportador Obsidian, incidencia real cerrada y
verificada por el ciclo agéntico. La pregunta que abre este documento es
distinta: no "¿funciona la tecnología?" sino "¿cómo se lo servimos a alguien
que no es el propio operador?" -- infraestructura (Raspberry Pi + PC como
worker bajo demanda), bóveda Obsidian personalizable, interfaz web, bot de
Telegram, y sobre todo: que el cliente pueda abrir su propia conversación de
Claude/ChatGPT y, desde ahí, interactuar con los ciclos del Ejecutor para
personalizar su propia experiencia del sistema.

## Hallazgo crítico de la investigación (cambia la arquitectura, no es un detalle)

**Un Custom Connector de Claude.ai exige que el servidor MCP sea alcanzable
públicamente desde las IPs de Anthropic.** Una Raspberry Pi detrás de NAT
doméstico, o cualquier red privada/VPN, **no sirve tal cual** -- la conexión
se origina desde los servidores de Anthropic, no desde la red del cliente.
Hace falta un túnel expuesto delante del Pi/PC: **Tailscale Funnel** (gratis,
sin gestión de certificados, pero solo 3 puertos exponibles: 443/8443/10000),
Cloudflare Tunnel, o ngrok. Esto determina el diseño de la capa de red desde
el principio, no es un paso posterior de "despliegue".

Fuente: [Get started with custom connectors using remote MCP](https://support.claude.com/en/articles/11175166-get-started-with-custom-connectors-using-remote-mcp),
[Connect to remote MCP Servers](https://modelcontextprotocol.io/docs/2026-07-28/develop/connect-remote-servers),
[Using ngrok as your MCP gateway](https://ngrok.com/docs/using-ngrok-with/using-mcp).

## Qué ya existe y no hay que reinventar

| Pieza necesaria | Ya construido en Engremiat |
|---|---|
| Bot operativo por cliente | `WebhookTelegramService.js`, probado en vivo (TEST-Cliente-2026-08-29) |
| Datos → nota exportable | `generarNotaObsidian()` (`ReportService.js`, v177 de la librería) |
| Grafo de entidades | `17_RELACION`/`18_VINCULO` -- **ya es un grafo tipado**, no texto plano a extraer |
| Interfaz web ligera | Consola Engremiat (`tools/consola/`), Artifact estático ya sincronizado |
| Cola de trabajo con estado | `92_BUS_TRABAJO` (reclamada→en_progreso→lista_para_revision→verificada) |
| Puente incidencia→trabajo real | Flujo `NIVEL_INCIDENCIA=Producto` → `PROCESO`/`TAREA` auto-generados |

## Panorama de proyectos comparables (qué funciona, qué no)

- **Khoj** ([github.com/khoj-ai/khoj](https://github.com/khoj-ai/khoj)): "segundo
  cerebro" autoalojable, 35k+ estrellas, activo, soporta LLMs locales y en la
  nube, agentes personalizables y automatizaciones programadas. Confirma que
  el patrón "second brain personal, self-hosted, con agente conversacional"
  es maduro en 2026, no experimental -- pero está pensado para **una persona**,
  no para gestionar el ciclo de vida de un cliente de negocio (proyectos,
  tareas, incidencias). Engremiat ya tiene esa capa de negocio; lo que le
  falta es justo la capa conversacional que Khoj sí resuelve bien.
- **Onyx / antes Danswer** ([tooldirectory.ai/tools/onyx](https://tooldirectory.ai/tools/onyx)):
  buscador empresarial + asistente IA, 40+ conectores, MIT, autoalojable
  gratis. Referencia de "cómo conectar muchas fuentes de datos a un único
  asistente" -- relevante si en el futuro un cliente Engremiat quiere que el
  asistente también lea correo/Drive/Slack, no solo su Sheet.
- **Plugins de IA para Obsidian** (Smart Connections, Copilot, Text
  Generator, Obsidian Local AI): confirman la receta estándar 2026 -- Ollama
  local + `nomic-embed-text` para embeddings + `llama3.2` (o similar) para
  chat, todo apuntando a `localhost:11434`. Un vault de 10.000 notas se
  indexa en ~2.5 min en hardware modesto, búsqueda en <100ms. Esta receta es
  literalmente reutilizable tal cual para la bóveda de cada cliente Engremiat.
- **Raspberry Pi como nodo de inferencia siempre encendido**, emparejado con
  un "workstation" más potente para cargas pesadas: patrón ya documentado y
  probado por terceros (Pi 5 8GB como nodo estable de bajo consumo + Ollama/
  llama.cpp en un equipo más grande para lo pesado). Encaja exactamente con
  la idea del usuario: Pi = siempre vivo, PC = bajo demanda.
- **Onboarding conversacional**: el patrón "la primera interacción es una
  conversación que declara intención, y la ruta se adapta a esa intención"
  mide 3.2x más activación que un tour de producto fijo (benchmark Perspective
  AI 2026). Confirma que la idea del usuario ("qué quiero aprender, qué
  quiero conseguir...") no es una ocurrencia, es la práctica recomendada
  actual para dar de alta un cliente nuevo en cualquier producto con IA.

## Arquitectura propuesta (por capas)

### 1. Infraestructura: Raspberry Pi (control) + PC (cómputo bajo demanda)

La Pi es el **plano de control**, siempre encendida, bajo consumo: aloja el
servidor MCP remoto (expuesto vía Tailscale Funnel), el bot de Telegram, y
la sincronización con el Sheet del cliente. El PC es el **worker elástico**:
solo se enciende/usa cuando hace falta cómputo pesado real (generación
masiva de la bóveda, un análisis GraphRAG completo, un lote de incidencias).
La cola ya existente (`92_BUS_TRABAJO`) es el mecanismo de reparto -- la Pi
encola, el PC (con DeepSeek/Ollama) reclama cuando está disponible, exactamente
el mismo patrón que ya usa `bus_trabajo.mjs` hoy con workers humanos/Claude.

### 2. Bóveda Obsidian: construcción y personalización

Construida a partir de las entidades reales del cliente (`DOCUMENTO`,
`DECISION`, `TAREA`, `PROYECTO`...), reutilizando `generarNotaObsidian()` ya
construido y probado. Personalización real, no cosmética: **qué entidades se
exportan como notas depende de los módulos contratados** -- mismo patrón que
ya usamos en CAM-0002 (una configuración por combinación de módulos). Un
cliente con COMPRAS instalado tendrá notas de proveedor/material; uno sin él,
no. Búsqueda semántica ligera (embeddings locales estilo Smart Connections)
vive en la Pi; el razonamiento pesado sobre todo el grafo (resúmenes por
comunidad, preguntas "qué está pasando en todo mi negocio") se delega al PC.

**Recomendación técnica sobre GraphRAG**: no adoptar el GraphRAG completo de
Microsoft tal cual -- fue diseñado para *extraer* un grafo de texto no
estructurado, un paso costoso que Engremiat **ya no necesita**: `17_RELACION`/
`18_VINCULO` ya son un grafo tipado desde el origen. La alternativa más
adecuada es un enfoque más ligero (estilo `LightRAG`) que recorra ese grafo
ya existente en vez de reconstruirlo -- mucho más barato en cómputo local/Pi,
y coherente con lo que `generarNotaObsidian()` ya hace de forma determinista
(resolver wikilinks vía `VINCULO`). El LLM entra para *narrar* el
recorrido, no para *descubrir* el grafo.

### 3. Bot de Telegram

Ya construido. Su rol en esta propuesta: canal rápido/asíncrono (recordatorios,
consultas puntuales, disparar una síntesis). No es el canal de personalización
profunda -- eso vive en la conversación Claude/ChatGPT vinculada.

### 4. Vínculo con una conversación de Claude/ChatGPT (el hallazgo central)

El cliente añade un **Custom Connector** en su propia cuenta de Claude.ai
apuntando al servidor MCP remoto de su Pi (expuesto vía túnel). Desde su
propia conversación, con sus propias credenciales, el cliente puede: leer el
estado de sus incidencias/proyectos, pedir una nota Obsidian de algo
concreto, o registrar una nueva necesidad -- todo mediado por herramientas
MCP concretas y auditable (autenticación OAuth en el propio conector, no
acceso libre). Referencia real de un conector MCP casero ya construido por
terceros para este mismo propósito: [aki-mcp-sv](https://github.com/lacvietanh/aki-mcp-sv).

### 5. Interfaz web

No hace falta construir una interfaz nueva: la Consola Engremiat
(`tools/consola/`) ya es un Artifact estático sincronizado. Extenderla a
"vista de cliente" (permisos acotados a su propio Sheet) es mucho más barato
que un desarrollo desde cero.

### 6. ¿Un asistente dentro del sistema?

Sí, pero como **capa fina sobre lo que ya existe**, no un proyecto aparte.
Khoj y Onyx confirman que el patrón funciona y está maduro -- la propuesta no
es adoptar ninguno de los dos tal cual (están pensados para un caso de uso
distinto: conocimiento personal / búsqueda empresarial genérica, no gestión
de proyectos de cliente), sino tomar prestada su receta de agente + memoria
+ automatizaciones programadas, e implementarla llamando a lo que Engremiat
ya tiene: `generarNotaObsidian`, búsqueda semántica local, y el propio
`92_BUS_TRABAJO`.

### 7. Onboarding conversacional

Modelarlo como una **incidencia especial** generada automáticamente en el
mismo instante en que `crearProyectoEnGestorDeProyectos_` crea el PROYECTO
de un cliente nuevo (mismo gancho ya construido para el auto-registro de
montajes): una `TAREA` "Onboarding conversacional" con un guion de preguntas
adaptativas (qué quiero aprender / conseguir / qué me hace falta / cuánto me
cuesta / en qué beneficia al ecosistema), siguiendo el patrón validado de
"primera interacción conversacional, ruta adaptada a la intención declarada".

## Extensión: análisis de oportunidades y comunicación asistida sobre el grafo

- **Análisis de oportunidades**: el módulo `OPORTUNIDAD` (`44_OPORTUNIDAD`)
  ya vive en el mismo grafo. Un recorrido asistido por LLM sobre
  `OPORTUNIDAD` + sus `TAREA`/`RECURSO`/`COMPETENCIA` vinculados puede
  detectar oportunidades sobre-comprometidas o con recursos insuficientes --
  extensión natural del rol de Ejecutor: en vez de auditar solo código,
  audita también el grafo de negocio del cliente, y genera incidencias de
  nivel `Proyecto`/`Oportunidad`, no solo `Producto`.
- **Comunicación asistida**: el bot de Telegram ya existe; la extensión es
  que las respuestas se apoyen en búsqueda semántica local sobre el vault
  antes de contestar (patrón "Vault QA" de Copilot para Obsidian) -- grounded
  en lo que el cliente realmente tiene escrito, no en generación libre.

## Fases propuestas (de más barato/reversible a más comprometido)

1. **Fase 0 (ya hecha, sin saberlo)**: TEST-Cliente-2026-08-29 es literalmente
   el piloto técnico de esta propuesta -- Sheet, bot, exportador, ciclo
   agéntico verificado.
2. **Fase 1 -- probarlo primero con el propio operador**: exponer un
   servidor MCP mínimo (2-3 herramientas de solo lectura: nota Obsidian de
   una entidad, listar incidencias abiertas) desde el PC actual (no la Pi
   todavía) detrás de Tailscale Funnel, y vincularlo a una conversación
   Claude propia antes de pensar en dárselo a nadie más.
3. **Fase 2 -- mover el rol "siempre encendido" a la Raspberry Pi**: MCP
   server + bot de Telegram + sincronización con el Sheet en la Pi; el PC
   queda como worker bajo demanda (DeepSeek/Ollama) para carga pesada real.
4. **Fase 3 -- personalización real de la bóveda**: plantillas de exportación
   por combinación de módulos, mismo patrón que CAM-0002.
5. **Fase 4 -- asistente conversacional de gestión + onboarding automatizado**.

## Deliberadamente fuera de alcance por ahora

- Multi-tenant real (varios clientes compartiendo una misma Pi/PC) -- sin
  demanda real todavía, y la Fase 1 es de un solo cliente (el propio piloto).
- GraphRAG completo estilo Microsoft (community summarization sobre todo el
  corpus) -- coste de cómputo no justificado mientras el grafo siga siendo
  pequeño y ya estructurado.
- Cualquier automatización que escriba en el Sheet del cliente sin
  verificación humana/Ejecutor de por medio -- mismo criterio de gobernanza
  que el resto del proyecto.

## Pendiente de concretar

- Elegir el mecanismo de túnel definitivo (Tailscale Funnel vs Cloudflare
  Tunnel vs ngrok) -- Tailscale Funnel es gratis pero limita a 3 puertos;
  decidir cuando se llegue a Fase 2.
- Modelo de coste real para el cliente (hardware Pi propio vs alquilado,
  cuota de uso del worker PC) -- no abordado en este documento.
- Alcance exacto de las 2-3 primeras herramientas MCP de la Fase 1.

## Bitácora

- **2026-08-29**: apertura del documento tras el piloto TEST-Cliente-2026-08-29
  (PRO-0020), con investigación real aplicada al diseño el mismo día. Registrado
  como INC-0066 / PRO-0022 (CAM-0004) en Gestor de Proyectos.
