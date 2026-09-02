# Propuesta: el ecosistema conectado — Baserow, Grafana, Graphify, DeepSeek, OpenRouter, LiteLLM, n8n, Headplane, Portainer

Investigación aplicada, siguiendo el mismo criterio que el resto de propuestas de este repo: partir de lo que ya está desplegado y verificado en real, no proponer una arquitectura nueva desde cero. Fecha: 2026-09-02.

---

## 0. Hallazgo de partida

Ya existe una convención real y consistente en todo lo desplegado hasta hoy, visible en cada `docker-compose.yml` del proyecto (`tools/gobierno/headscale/`, `tools/gobierno/monitorizacion/`): **todo se ata a la IP real de Tailscale del VPS (`100.107.171.88`), nunca a `0.0.0.0`**, y cada stack nuevo pide autorización humana explícita antes de `docker compose up -d` en real. No hace falta inventar una política de conexión — hace falta que cada pieza nueva de esta lista (Portainer, Headplane, un gateway LiteLLM en el VPS) **herede la misma**, no una ad hoc.

Segundo hallazgo, más importante: **ya hay un hub de datos real y compartido entre piezas que se diseñaron por separado** — `GASTO_API` (Baserow, tabla 285). Lo usan hoy, de forma independiente: `spike_concilio_coop` (coste de deliberación real), `telar/b2/deliberar_b2.mjs` (coste de la deliberación estructurada), y `exportador_prometheus_gasto.mjs` → Prometheus → Grafana (panel real, desplegado y verificado con datos reales el 2026-09-01). Esto no se diseñó como "el hub de observabilidad del ecosistema" — pasó a serlo porque cada pieza nueva, al necesitar registrar coste, reutilizó la misma tabla en lugar de inventar la suya. Es la misma clase de convergencia no buscada que ya se documentó en el Bastidor (§6.3: `correlationId`/`ES_PRUEBA`) — vale la pena reconocerla y apoyarse en ella a propósito, no solo dejar que siga pasando por casualidad.

Tercer hallazgo, que cambia cómo hay que leer esta lista de herramientas: **n8n ya aloja, en real, al menos un Oficio con nombre propio del Núcleo.** El ciclo "Cronista" (workflow real `hp0KxDO46YkYsMM8`, montado y probado sobre el stack `engremiat-*`) hace exactamente lo que la ficha del Oficio Cronista de la taxonomía dice que hace — "documenta desde datos reales, propone memoria, no crea canon". No es una coincidencia de nombre a ignorar: significa que n8n no es "un servicio más de la lista", es ya el sitio real donde vive la parte automatizable de un Oficio. Eso cambia la prioridad de conectar n8n de forma deliberada — como plataforma de Oficios, no solo como motor de automatización genérico — frente a tratarlo como un nodo de infraestructura más.

Cuarto hallazgo, que responde directamente a "cómo empezamos a operar Engremiat desde un todo": **ya existe un "Consola" real, construido, versionado y con su propio ritual de sincronización** — `tools/consola/consola-engremiat.html`, hoy con un alcance concreto (cola de trabajo de `13_INCIDENCIAS` por actor). No es la misma pieza que el Espacio núcleo abstracto "Consola" de la taxonomía ("gobernar permisos, módulos, recursos, riesgos y salud del universo" — `Arquitectura_Nucleo.canvas`), pero es la prueba real de que ese Espacio ya tiene un patrón de interfaz que funciona y que el usuario ya conoce: **una foto estática, con sello explícito de "sincronizado hace X"**, nunca un espejo en vivo que finja estar actualizado sin estarlo (la propia consola lo dice: "GRUPOS es una foto manual, no un espejo en vivo de 13_INCIDENCIAS... evita confiar en datos desactualizados sin saberlo"). Esa disciplina de honestidad es exactamente la que hace falta para un panel de salud del ecosistema — y ya está probada, no hay que inventarla.

---

## 1. Mapa real de lo que ya existe (no supuesto — verificado en sesiones anteriores)

| Pieza | Estado real | Rol actual |
|---|---|---|
| **VPS** (100.107.171.88) | Desplegado | Host de todo lo de abajo salvo la Pi |
| **n8n + Baserow + Typebot + Open WebUI + ngrok** | Stack ya existente en el VPS antes de esta sesión (contenedores `engremiat-*`) | Automatización (n8n), datos operativos (Baserow), chat (Typebot/Open WebUI) |
| **Baserow tabla 278** ("núcleo soberano") | Real, con datos reales | Fuente de TAREAs que `puente_historia_leyes.mjs` referencia (nunca copia) en `18_VINCULO` del Sheet |
| **Baserow tabla 285** (`GASTO_API`) | Real, con datos reales | Hub de coste compartido — ver §0 |
| **Prometheus + Grafana** | Desplegado y verificado en el VPS, 2026-09-01 | Panel de coste real leyendo `GASTO_API` vía el exportador Node |
| **Headscale** (servidor propio de coordinación Tailscale) | Etapa 1 desplegada y verificada — contenedor sano, sin nodos migrados todavía | Candidato a sustituir la dependencia del Tailscale gestionado por terceros, sin haberlo hecho aún |
| **DeepSeek** | Proveedor real, ya en uso — Telar B2, `spike_concilio_coop` | "Proveedor controlado" real de hoy: JSON mode + validación ajv + reintento con feedback |
| **LiteLLM** (gateway) | Fase 1 solamente — 3 modelos locales de Ollama probados, clave de Claude pendiente, decisión Telegram↔LiteLLM sin resolver ([[project_litellm_gateway_fase1]]) | **No conectado a nada todavía** — ni Telar ni el spike lo usan hoy |
| **Ollama / `devstral-dev`** | Real, consolidado como worker local por defecto ([[proyecto_worker_local_devstral]]) | IA local para trabajo de mantenimiento y (vía LiteLLM, cuando se conecte) generación estructurada barata |
| **Graphify** | Real, integrado en el PROMPT del Ejecutor | No es un servicio de red — selector determinista de contexto de código, se ejecuta antes de cualquier llamada a IA |
| **Pi núcleo** | Primer despliegue físico real de n8n+Baserow, SSH/Claude Code configurados | Segundo host real del ecosistema — **corrección 2026-09-02**: ya comparte con el VPS y este PC la misma red Tailscale gestionada (`engremiat-dev-hetzner` 100.107.171.88, `pc-operador-engremiat` 100.118.79.49, `nodo-pi-engremiat` 100.125.52.52 — ver `INFRAESTRUCTURA.md`). La conectividad VPS↔Pi **ya existe hoy**, no es lo que falta |
| **OpenRouter** | No usado todavía en ningún script real de este proyecto | Aspiracional — nombrado por el usuario, sin integración previa que investigar |
| **Headplane** | No desplegado | Aspiracional — UI real para Headscale (ver §2.1) |
| **Portainer** | No desplegado | Aspiracional — gestión de contenedores multi-host (ver §2.1) |

---

## 2. Lo que falta conectar, ordenado por riesgo (de menor a mayor)

### 2.1 Observabilidad y operación — riesgo bajo, sin tocar ninguna ruta de escritura de datos reales

**Portainer.** Arquitectura real confirmada: un servidor central (VPS) + un **agente ligero** en cada host adicional (Pi), comunicándose por el puerto 9001/TCP — ver **[documentación de arquitectura multi-host](https://oneuptime.com/blog/post/2026-03-02-how-to-configure-portainer-for-multi-host-container-management-on-ubuntu/view)**. Con cuatro stacks Docker reales ya dispersos (`headscale/`, `monitorizacion/`, `spike_concilio_coop/`, el stack `engremiat-*` preexistente) más el de la Pi, hoy no hay un solo panel para verlos todos — es gestión por SSH + `docker compose` sueltos. Portainer no introduce ningún camino nuevo hacia los datos de negocio (Sheet/Baserow); es puro panel de operación. **Coste real**: el puerto del agente (9001) tiene que atarse igual que todo lo demás, solo a la IP de Tailscale — nunca expuesto sin más.

**Headplane.** UI real y activamente mantenida para Headscale (**[repositorio](https://github.com/tale/headplane)**, **[introducción](https://headplane.net/introduction)**) — gestión de nodos, ACLs, y SSO vía OIDC. Hoy Headscale (Etapa 1) solo tiene API/CLI. Headplane es el paso natural **antes** de la Etapa 2 (migrar nodos reales) que ya está documentada como pendiente de autorización aparte: da visibilidad real de qué se va a migrar antes de migrarlo, reduciendo el riesgo real que la propia nota del `docker-compose.yml` de Headscale ya señala ("riesgo real de cortar conectividad viva").

Ambos son aditivos, reversibles, y no tocan ninguna fila de Sheet ni Baserow — el mismo perfil de riesgo que ya se usó para justificar desplegar Headscale Etapa 1 sin pedir permiso especial.

### 2.2 El gateway de IA — riesgo medio, esto sí cambia cómo se llama a los modelos

Hallazgo honesto, no favorable: **hoy existen dos caminos de IA en paralelo que no se hablan entre sí.** Telar B2 y `spike_concilio_coop` llaman a DeepSeek **directamente**, con su propia clave y su propio cliente HTTP. LiteLLM (Fase 1) existe para ser exactamente el punto único que unifique DeepSeek + OpenRouter + Ollama local + Claude detrás de una sola API compatible con OpenAI — pero hoy no lo usa nadie. Añadir OpenRouter como "una integración más" sin resolver esto sería construir un **tercer** camino paralelo, no dos — justo el tipo de fragmentación que la pregunta original sobre el Bocetador quiere evitar, aplicada ahora a proveedores de IA en vez de a esquemas JSON.

**Propuesta concreta**: cuando se retome LiteLLM, el primer cliente real no debería ser un caso nuevo — debería ser **migrar `telar/b2/deliberar_b2.mjs` para llamar a LiteLLM en vez de a DeepSeek directamente**, manteniendo exactamente el mismo contrato (`response_format: json_object` + validación ajv + reintento con feedback, ya probado con 5/5 contratos válidos). Si eso funciona sin regresión, OpenRouter y los modelos locales de Ollama quedan disponibles para Telar/Concilio como alternativas de coste/latencia sin tocar ni una línea de la lógica de deliberación — el contrato JSON ya es agnóstico del proveedor por diseño. Registrar el coste sigue yendo a `GASTO_API`, el mismo hub — LiteLLM ya expone coste por llamada de forma nativa, dato real que hoy se calcula a mano en cada script.

Dado el tercer hallazgo del §0, el gateway no tiene por qué vivir solo detrás de scripts sueltos: **n8n, que ya orquesta a Cronista, es el candidato natural para orquestar también las llamadas al gateway** cuando un Oficio necesite deliberar de forma programada (por ejemplo, Vigilia convirtiendo una necesidad real en misión) — un solo nodo n8n hablando con LiteLLM, reutilizable por cualquier workflow futuro, en vez de que cada script nuevo reimplemente su propio cliente HTTP hacia el proveedor de turno.

### 2.0 El destino de todo esto — que la Consola del Núcleo deje de ser un documento

La pregunta que motiva esta prioridad ("empezar a operar Engremiat desde un todo") tiene una respuesta concreta si se lee junto al cuarto hallazgo del §0: el Espacio núcleo **Consola** ("gobernar permisos, módulos, recursos, riesgos y salud del universo") existe hoy solo como texto en `Arquitectura_Nucleo.canvas`. Todo lo que sigue en este documento — Portainer, Headplane, el gateway único, el coste unificado en `GASTO_API` — no son fines en sí mismos, son **las fuentes de datos que un Consola de salud del ecosistema real necesitaría leer**. Y el patrón de interfaz para construirlo ya existe y ya funciona: el mismo que `consola-engremiat.html` — una foto estática regenerada por script, con sello de "sincronizado hace X" visible, nunca una promesa de tiempo real que no se puede cumplir. No hace falta diseñar una interfaz nueva para esto; hace falta un script `regenerar_consola_salud.mjs` (mismo patrón que `regenerar_estatico.mjs` ya usa para la Consola de incidencias) que lea Grafana/Prometheus (métricas), Baserow (`GASTO_API`, estado de Oficios en n8n) y el estado de los nodos (Headscale/Portainer una vez desplegados), y escriba una foto — no que mantenga una conexión viva.

Este es también el patrón que conecta con el Bocetador (§8 de la propuesta de Bastidor): **restringir antes de generar** — Graphify restringe el contexto de código antes de llamar a un modelo; el esquema ajv de Telar B2 restringe la salida; el Bocetador restringiría la figura que la IA puede rellenar. Converger los proveedores detrás de un único gateway es la misma disciplina aplicada a la capa de transporte: un solo punto donde exigir el mismo contrato, en vez de confiar en que cada integración nueva lo respete por su cuenta.

### 2.3 Corrección real (2026-09-02): Baserow VPS↔Pi ya está conectable hoy — Headscale Etapa 2 es una cosa distinta

**Esto estaba mal planteado en la primera versión de esta sección.** VPS, Pi y este PC ya comparten la misma red Tailscale **gestionada** (no Headscale) — confirmado en `INFRAESTRUCTURA.md`: `engremiat-dev-hetzner` (100.107.171.88), `nodo-pi-engremiat` (100.125.52.52), `pc-operador-engremiat` (100.118.79.49). La Pi tiene su propio n8n+Baserow real, separado del VPS (dos instancias, no una compartida) — pero la **conectividad de red** entre ambos hosts ya existe hoy, no es lo que falta. Conectar Baserow-Pi ↔ Baserow-VPS (vía un Mensajero real, mismo patrón que `puente_historia_leyes.mjs`) es alcanzable ahora mismo, sin esperar a nada más.

Headscale Etapa 2 es un objetivo **distinto e independiente**: sustituir la dependencia del Tailscale gestionado (empresa tercera) por el servidor de coordinación propio ya desplegado en Etapa 1 — soberanía de infraestructura, no conectividad nueva. Sigue teniendo el riesgo real ya documentado (cortar backups/webhooks vivos durante la migración) y sigue pendiente de autorización explícita aparte — pero ya no es un prerrequisito para que VPS y Pi se hablen, como se afirmaba antes.

---

## 3. Orden propuesto — escalonado, mismo criterio que Telar B0→B3

Cada etapa deja algo verificable en real antes de pasar a la siguiente, igual que B0-B3 de Telar. Ninguna etapa exige la siguiente para tener valor por sí sola.

| Etapa | Qué se construye | Riesgo | Verificación real de "hecho" |
|---|---|---|---|
| **C0** | ~~Portainer (servidor VPS + agente) y Headplane~~ | Bajo — ninguna ruta de datos nueva | **HECHO y verificado 2026-09-02**: Portainer real en `https://100.107.171.88:9443` (HTTP 200). Headplane real en `http://100.107.171.88:3002/admin`. Hallazgo real en el despliegue: Headplane exige Headscale ≥0.27.0, la Etapa 1 corría 0.23.0 — subido a 0.29.3 (release estable más reciente), migración de esquema automática, "Connected to Headscale 0.29.3" confirmado en logs. Agente de Portainer para la Pi preparado pero **no desplegado** — la Pi estaba apagada/inalcanzable (apagado manual deliberado); falta conectarlo la próxima vez que esté encendida, y que el operador fije la contraseña de admin inicial en la UI de Portainer (no es una acción que Claude deba hacer) |
| **C1** | Migrar `telar/b2/deliberar_b2.mjs` de DeepSeek directo a LiteLLM, mismo contrato, mismo ajv | Medio — cambia cómo se llama al proveedor de una pieza ya verificada | Re-ejecutar `validar_b0`/la prueba de B2 con LiteLLM de por medio: 5/5 contratos válidos, sin regresión |
| **C2** | `regenerar_consola_salud.mjs` — foto estática (patrón `consola-engremiat.html`) leyendo Grafana/Prometheus + `GASTO_API` + estado de Portainer/Headplane | Bajo — solo lectura, ninguna escritura a sistemas reales | La foto muestra datos reales de al menos 3 fuentes distintas, con sello de sincronización visible |
| **C3** | Headscale Etapa 2 — migrar nodos reales de Tailscale gestionado al servidor propio (soberanía de infraestructura, **no** conectividad nueva — VPS↔Pi ya se hablan hoy, ver §2.3) | Alto — riesgo real ya documentado de cortar conectividad viva (backups, webhooks de encendido remoto) | **Sigue pendiente de autorización explícita aparte, como ya estaba decidido** — no se destraba solo por la nueva prioridad |

C0-C2 son alcanzables sin tocar la decisión pendiente de C3. C2 es el entregable que responde de verdad a "operar Engremiat desde un todo": el primer sitio real donde un humano ve, en una sola foto, salud + coste + estado de nodos del ecosistema completo — no una promesa, una extensión del mismo patrón que `consola-engremiat.html` ya prueba que funciona.

No se propone tocar Grafana/Prometheus ni `GASTO_API` — ya funcionan como el hub real que son, y añadir LiteLLM solo les da una fuente más de coste que reportar, sin cambiar su forma.

---

## 4. Pendiente

- ~~Confirmar si la Pi y el VPS comparten overlay de red~~ — **resuelto 2026-09-02**: sí, Tailscale gestionado, ver §2.3.
- OpenRouter no tiene todavía ningún caso de uso concreto más allá de "proveedor alternativo" — falta un motivo real (coste, modelo específico no disponible en DeepSeek) antes de priorizar su integración sobre migrar Telar B2 a LiteLLM.
- No se ha estimado el coste real de licencia de ninguna pieza de esta lista (Portainer/Headplane son gratuitos y de código abierto sin marca de agua, a diferencia de tldraw — confirmarlo no obstante antes de desplegar).
- `regenerar_consola_salud.mjs` (C2) no existe todavía — solo el patrón que reutilizaría (`regenerar_estatico.mjs`) y las fuentes reales que leería.
- No se ha revisado el workflow real de Cronista (`hp0KxDO46YkYsMM8`) en detalle — la afirmación de que ya implementa al Oficio Cronista se apoya en su nombre y en lo documentado en memoria, no en una lectura línea a línea del workflow en esta pasada.
- Falta decidir si futuros Oficios automatizables (Vigilia, Relevo) deberían vivir en n8n por precedente de Cronista, o si eso se decide caso a caso — no resuelto aquí a propósito, mismo criterio de no improvisar roles nuevos sin pasar por consentimiento (§7 de nomenclatura).
