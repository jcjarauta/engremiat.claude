# Propuesta — Ecosistema agéntico híbrido (local + nube medida) para Engremiat

**Fecha de apertura:** 2026-08-23
**Estado:** A valorar -- diseño en curso, sin urgencia de implementación
**Incidencia Sheet:** INC-0056 (`13_INCIDENCIAS`, A valorar)
**Google Doc vinculado (edición libre del operador):** (enlace añadido tras crear el Doc)
**Por qué existe este fichero:** conversación larga (2026-08-23) que fue de "sistematizar una sincronización" a diseñar la arquitectura completa del ecosistema agéntico -- varias decisiones y correcciones de rumbo que no deben perderse en el historial de chat. Mismo patrón que `PROPUESTA_EXPERIENCIAS_INTERACTIVAS_MULTIMEDIA.md` y `PROPUESTA_MODULARIZACION_LIBRERIA.md`: documento vivo, se amplía en sesiones futuras.

## Disparador

Al arreglar la desincronización de la Consola (INC-0052 a INC-0055, ver commits `f376277` y `c921ed0`), el operador planteó una pregunta más amplia: si esto ya coincide con multiagentes y el ecosistema `engremiat.claude`, ¿podemos diseñar espacios Claude dedicados (como Ejecutor) para delegar trabajo repetitivo de esta conversación, con coste controlado y sin depender de memoria/contexto?

## Diagnóstico de partida

Tres espacios ya existen sin protocolo de comunicación definido entre ellos:
- **Esta conversación** (Claude Code) -- diseño y asesoramiento, facturado por cuota mensual.
- **Ejecutor** (`RemoteTrigger`) -- ciclos automáticos de auditoría/resolución, ya independiente de esta conversación para *arrancar*, pero el cierre de jornada (validar + fusionar a `main`) sigue dependiendo de Claude por diseño (punto de control deliberado, no limitación técnica -- ver [[reference_columnas_13_incidencias_indices]] para el precedente de por qué existe ese filtro).
- **Artifacts publicados** (Consola) -- sandbox sin acceso a red arbitraria.

Puntos de dolor concretos:
1. Comunicación entre espacios resuelta con puentes ad-hoc (scripts nuevos cada vez), no con un protocolo.
2. La fuente de verdad (`13_INCIDENCIAS`, `97_ESTADO_CONSOLA`, `98_LOG_GOBIERNO`) ya funciona de facto como bus de eventos (ver `registrarIncidenciaDrift_`, caso INC-0050) pero no está declarada ni generalizada como tal.
3. Coste/consumo invisible -- no hay ningún panel de gasto por agente hoy.
4. Diseño y automatización mezclados por defecto en vez de por decisión.

## Arquitectura propuesta

### Bus de eventos vía Sheet (patrón transactional outbox)

Formalizar lo que `13_INCIDENCIAS` ya hace de facto: cada agente escribe su resultado + una fila de evento en la misma operación; otro agente sondea solo las filas en su estado pendiente, las reclama (actor + timestamp, evita dobles procesados) y las resuelve. Un esquema mínimo común (qué tabla, campo de actor, campo de coste) para que cualquier agente nuevo lo herede en vez de reinventarlo.

### Coste controlable por diseño, no por disciplina

Investigado el 2026-08-23 (ver bitácora de la conversación para fuentes completas):
- **Workspaces de Anthropic con límite de gasto propio por agente** -- Ejecutor (y cualquier agente nuevo) con su propia API key y tope mensual, aislado del resto. Supera el límite -> error distinguible, no sorpresa en factura.
- **Prompt caching** -- contexto estable (esquema, instrucciones) cacheado a ~10% del coste de lectura normal; máximo impacto en los ciclos repetitivos de Ejecutor.
- **Batch API** -- 50% de descuento para trabajo asíncrono sin urgencia (ciclos nocturnos).
- **Rate Limits API** -- consulta programática del gasto/velocidad restante por Workspace, alimentaría una tarjeta de coste real en la Consola.

Presupuesto de ejemplo trabajado para el caso concreto de la sincronización Consola↔Sheet (ver conversación): la mayoría del ritual es cómputo puro sin IA (comparar datos), el coste real solo aparece cuando hay algo que decidir de verdad -- estimado en 2-5€/mes (conservador, revisión 1x/día) a 25-45€/mes (ambicioso, cada hora), con tope técnico configurado por encima de la estimación como margen de seguridad, nunca al límite exacto.

### Independencia de proveedor de IA

Investigado el 2026-08-23:
- **OpenClaw** (openclaw.ai) -- descartado para este propósito. Es un asistente personal de chat (WhatsApp/Telegram/etc.), no una capa de orquestación comparable a Claude Code. Además, su creador se incorporó a OpenAI y el proyecto pasó a estar patrocinado por ellos (2026-02) -- justo lo contrario de independencia de proveedor.
- **OpenCode** -- candidato real a sustituir/complementar Claude Code como capa de orquestación. Cambio de proveedor nativo (75+ proveedores soportados, incluido Ollama local), maduro, comunidad activa. Pendiente verificar paridad de funciones (subagentes, hooks, profundidad de soporte MCP) antes de comprometerse.
- **DeepSeek** -- proveedor externo alternativo, API compatible con el estándar OpenAI (encaja directo en un router). Aproximadamente 7-10x más barato que Claude Sonnet en input/output. Aliases de modelo cambiaron 2026-07-24 (ahora V4 Flash/Pro) -- verificar precio actual antes de presupuestar, no fiarse de cifras de V3/R1 legacy.
- **LiteLLM + OpenRouter** -- piezas de "router" que permiten que un mismo agente llame a Claude, DeepSeek o al modelo local de forma intercambiable según regla. **Claude Code Router** es el piloto de menor riesgo: se engancha delante de Claude Code (sin cambiar el flujo actual) y redirige por regla -- recomendado como primer paso antes de evaluar OpenCode como reemplazo completo.

**Principio de diseño**: cada tarea se define como un contrato (qué datos necesita, qué se le pide, qué debe devolver) independiente del proveedor concreto que la resuelva -- así una tarea se puede migrar de proveedor sin rediseñar el ecosistema.

### Viabilidad real de IA local (Raspberry Pi)

Investigado el 2026-08-23:
- **Pi 5 · 8GB** mínimo recomendado, con disipador activo obligatorio (sin él, throttling en ~90s de uso sostenido).
- Rango realista: modelos de **1-3B parámetros** (Gemma 3 1B, Phi-3 Mini 3.8B) vía Ollama.
- Gemma 3 1B: ~18-22 tok/s -- usable para bot de Telegram/triaje simple.
- Phi-3 Mini 3.8B: ~4-7 tok/s -- más "inteligente", notablemente más lento.
- **Techo claro**: nada de razonamiento fuerte, contexto largo o generación de código en la Pi -- para eso hace falta un escalón intermedio (mini-PC con GPU dedicada, 8-16GB VRAM, modelos de clase 7B) antes de la API de pago.

### Consola como app externa autoalojada (no Artifact)

Verificado en vivo el 2026-08-23: el Artifact de la Consola **no puede alcanzar Sheets en vivo** -- CSP del sandbox bloquea red arbitraria, y el único conector con escritura por celda (`gsheets`) es un servidor local sin URL pública (`claude.ai` respondió literalmente "No matching connector found" al intentar declararlo). Los conectores reales de la cuenta (Gmail, Google Drive, GitHub) no dan esa granularidad.

Consecuencia: si la Consola pasa a ser una app propia (corriendo en el mismo sitio que el worker local, ej. la Raspberry Pi del cliente), deja de tener esa limitación -- podría hablar en vivo con el Sheet, el modelo local y el router de proveedores. Sería el centro de control real, generalizando el patrón que la Consola ya tiene hoy (pausar/iniciar Ejecutor) a cualquier agente.

**Tradeoff**: deja de ser gratis en mantenimiento (hoy: publicar y ya está; app propia: alguien la aloja, mantiene y asegura). Enmarcado como siguiente hito de infraestructura, no como trabajo inmediato -- coincide de forma natural con el hardware local que se instalaría en clientes.

### Modelo de resiliencia y privacidad para clientes (versión corregida)

Primera formulación (incorrecta, corregida en la misma conversación): se asumió que "los datos viven en la máquina local del cliente", lo que generaba una tensión real entre "los datos nunca salen" y "el servicio nunca cae si el servidor local se para".

**Corrección real**: los datos del cliente viven en su propio Sheet (su cuenta de Google), no en la máquina local. La máquina local (Pi/worker) no es el almacén de datos, es donde se ahorra dinero -- el sitio donde el modelo gratuito resuelve lo rutinario antes de pagar por algo más elaborado. Consecuencia:
- La tensión desaparece: tanto el modelo local como un proveedor externo (vía API, en el momento de la consulta) leen/escriben el mismo Sheet de la misma forma -- si la Pi se apaga, la nube sigue teniendo acceso íntegro a los mismos datos, sin ningún hueco de continuidad.
- **La promesa correcta al cliente no es "nunca sale de tu máquina"** sino **"nunca sale de tu cuenta, nunca se queda guardado en servidores nuestros ni del proveedor de IA"** -- cada consulta lee el dato en el momento, lo usa, no queda copia en ningún servidor externo. Mismo modelo de confianza que ya usa hoy el conector de servicio de Engremiat.
- Rol del "partner tecnológico": instalar/mantener el hardware y ayudar a aprovisionar la cuenta de API propia del cliente (con su propio tope de gasto) -- nunca el estudio como intermediario central del tráfico de todos los clientes (evita convertirse en el propio punto único de fallo que se quiere evitar).

### Propuesta de producto por niveles (para clientes)

1. **Software** -- Engremiat core sin capa de IA, coste fijo de licencia.
2. **+ Hardware local** (Raspberry Pi/mini-PC) -- asistencia básica en local, sin coste variable de API. Posible renting con partner tecnológico.
3. **+ API de pago para trabajo elaborado** -- facturado por consumo real, mismo mecanismo de tope de gasto que se construye para uso interno.

Validado por consenso de mercado 2026 (enrutar lo rutinario/sensible en local, lo pesado por API bajo demanda), sin caso público de estudio exacto que copiar -- terreno propio a definir.

### Gobierno: cierre de jornada y priorización

- **Cierre de jornada de Ejecutor**: sí se puede automatizar parcialmente -- separar lo mecánico (tests, conflictos, tamaño del diff) de lo que necesita revisión (algo fuera de lo normal). Riesgo real: fallos silenciosos y sutiles (precedente: el bug de columnas desplazadas que corrompió INC-0050) son justo los que un filtro humano/Claude detecta y una automatización total no. Recomendación: definir señales explícitas que decidan solas cuándo el cierre pasa automático y cuándo espera revisión, no todo-o-nada.
- **Priorización del trabajo de desarrollo** (nuevo elemento de gobierno planteado por el operador): es la decisión más sensible de todo el sistema -- decidir qué importa más no es mecánico. Recomendación: **no** automatizar de entrada. Empezar por hacer visible en la Consola el criterio de prioridad que ya existe en el Sheet (`PRIORIDAD`), y solo delegarlo si se demuestra repetitivo y predecible con el tiempo.

## Pendiente de concretar / preguntas abiertas

- ¿Se pilota primero Claude Code Router (cambio mínimo, reversible) antes de evaluar OpenCode como reemplazo de la capa de orquestación?
- Precio actual de DeepSeek V4 Flash/Pro -- no verificado, los alias de modelo cambiaron el 2026-07-24.
- Paridad de funciones de OpenCode frente a Claude Code (subagentes, hooks, profundidad MCP) -- no confirmada.
- Dónde vive exactamente LiteLLM en la arquitectura final (recomendado: en la propia máquina del cliente, no en un servidor central del estudio) -- pendiente de validar técnicamente.
- Señales concretas para decidir cuándo el cierre de jornada de Ejecutor pasa automático vs espera revisión -- sin definir todavía.
- Diseño técnico de la Consola como app externa autoalojada (dónde corre, cómo se protege el acceso) -- sin empezar.

## Bitácora

- **2026-08-23**: apertura del documento tras una conversación larga que fue de "sistematizar la sincronización Consola↔Sheet" a diseñar la arquitectura completa del ecosistema agéntico híbrido. Archivado como INC-0056 para no perder el contexto, como ya pasó parcialmente con la primera mención de LiteLLM/OpenRouter antes de este documento.
