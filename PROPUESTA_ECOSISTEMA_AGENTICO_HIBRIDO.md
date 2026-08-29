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

## Business Model Canvas (primer relleno, piloto de INC-0057)

Primer uso en vivo de la metodología definida en INC-0057 -- Canvas completo, no micro-canvas, porque esta idea es productizable.

| Bloque | Contenido |
|---|---|
| **Segmentos de clientes** | Clientes actuales/futuros de Engremiat, segmentados por nivel de infraestructura que aceptan (solo software / + hardware local / + API externa). El propio estudio es "cliente cero". |
| **Propuesta de valor** | Nivel 1: gestión sin IA, coste fijo. Nivel 2: asistencia IA privada, datos nunca salen de tu cuenta, sin coste variable. Nivel 3: razonamiento avanzado bajo demanda, pagado por uso, con tope de gasto real desde el día uno. Transversal: nunca depender de un único proveedor de IA. |
| **Canales** | Directo (relación ya existente con clientes Engremiat) + partner tecnológico para instalación/mantenimiento de hardware. |
| **Relación con clientes** | Autoservicio en nivel 1; acompañamiento técnico continuo en niveles 2-3, vía el partner. |
| **Fuentes de ingresos** | Licencia de software (fija) + venta/renting de hardware + consumo de API repercutido al cliente + instalación/mantenimiento recurrente. |
| **Recursos clave** | El core Engremiat ya construido, la metodología/arquitectura del ecosistema agéntico, el conocimiento de integración multi-proveedor. |
| **Actividades clave** | Diseño y mantenimiento de la arquitectura, aprovisionamiento por cliente (cuenta API propia + tope de gasto + hardware), soporte continuo. |
| **Socios clave** | Partner tecnológico (hardware/instalación), proveedores de IA en plural (Anthropic, DeepSeek, otros vía router -- a propósito, no exclusivo), Google (Sheets como infraestructura de datos del cliente). |
| **Estructura de costes** | Tiempo de diseño/mantenimiento propio, coste de API en uso interno (presupuestado: 2-45€/mes según nivel para el caso de sincronización), hardware si el estudio lo compra para revender, soporte. |

**Sin decidir a propósito** (el Canvas lo deja visible, no lo esconde): margen sobre el consumo de API repercutido al cliente (¿a coste, o con margen?), y si el hardware se vende o se renta vía el partner. Son decisiones de precio, no de arquitectura -- no hace falta cerrarlas ahora.

## Backlog de tareas automatizables (propuesta 2026-08-23, sin priorizar aún)

Generado tras validar el ciclo de Ejecutor y la regla de delegación. Cada
tarea aplica esa regla: acotada -> delegable; abierta -> se queda en
"A valorar" con supervisión, nunca aquí.

### Por horario (cron, como Ejecutor) -- bajo riesgo

1. `salud_ecosistema.mjs` en cron diario -- hoy solo corre si alguien se
   acuerda; detectaría desincronizaciones como las de hoy sin esperar a
   que se noten por casualidad.
2. Chequeo Consola↔Sheet diario, no solo al trabajar la Consola.
3. Limpieza automática de tarjetas cerradas en Sheet pero vivas en
   Consola (el caso real de INC-0006/7/22/23 de hoy).
4. Copia de seguridad periódica del Sheet maestro y del repo.
5. Memoria de producción / informe ejecutivo (`ReportService.js`, ya
   construidos) -- generación automática semanal/mensual en vez de bajo
   demanda.
6. Informe de coste real de IA (DeepSeek/local/Claude) -- alimenta con
   datos reales el panel "Salud del sistema", hoy solo estimaciones.
7. Triaje de incidencias nuevas con DeepSeek (validado en los spikes) --
   cierra el hueco de INC-0052-0055 de forma recurrente.

### Por eventos -- reacciona a algo, no espera a la hora

8. Incidencia nueva creada -> triaje inmediato. Aviso: probablemente
   choque con el bloqueo de red conocido de Apps Script hacia fuera --
   no es gratis, habría que resolver eso primero.
9. Commit nuevo en `main` -> comprobación automática de que
   `salud_ecosistema.mjs` sigue en verde (CI ligero).
10. Deploy aprobado -> ejecutarlo solo. **Deliberadamente NO
    recomendado** -- `PROMPT_EJECUTOR.md` ya dice explícitamente "nunca lo
    hagas tú mismo"; zona de riesgo real (código en producción), no
    tocar sin decisión aparte.

### Más ambiciosas

11. Vigilancia de presupuesto -- compara gasto real acumulado contra el
    tope fijado y avisa antes de acercarse al límite, no después.
12. Borrador de retrospectiva semanal -- recopila datos de la semana
    (ciclos, incidencias, spikes) y prepara material para que el
    operador decida -- nunca decide por su cuenta.

## Evaluación práctica de workers complementarios (2026-08-24)

Primera evidencia real (no solo investigación) sobre los tres candidatos a
worker complementario que aparecían como pendientes en este documento.
Piloto completo en `DEV_PRUEBAS/codex-trigger-piloto` (repo separado, no
tocó el repo real de Engremiat).

| Worker | Coste | Evidencia de hoy | Techo detectado |
|---|---|---|---|
| **Worker local (devstral-dev/Ollama)** | 0€, cómputo propio | No se volvió a probar hoy -- sigue en pie la validación previa de 3 muestras (ver [[proyecto_worker_local_devstral]]): idioma correcto, formato respetado, honestidad epistémica real. | Contexto acotado por Graphify (`MaxCallers`); nada de razonamiento largo. Bueno para tareas rutinarias de bajo riesgo y alto volumen. |
| **DeepSeek** | ~7-10x más barato que Sonnet (API compatible OpenAI) | No se probó en vivo hoy tampoco -- sigue como investigación (backlog #7, "validado en los spikes" previos). Precio no reverificado tras el cambio de alias del 2026-07-24. | Pendiente de refrescar antes de presupuestar nada con cifras actuales. |
| **Codex (`openai/codex-action` / CLI)** | Cuenta OpenAI/Codex propia | **Probado en vivo hoy, 3 rondas de dificultad creciente**, todas en el repo piloto: (1) crear archivo + commit + ejecutar, trivial, correcto; (2) diagnóstico y fix de un bug real de una variable acotada (drift de columna en `13_INCIDENCIAS`), causa raíz correcta, respetó la convención `COL_INC_`, commit bien descrito; (3) reescritura no trivial de un extractor basado en regex a un escáner léxico real (balanceo de paréntesis sin límite de profundidad, respetando strings), con tests propios en verde. | **El "todo en verde" del propio Codex no bastó**: en la ronda 3 amplió el alcance por su cuenta (añadió manejo de comentarios) y lo dejó a medias -- una prueba adversarial fuera de su propio test suite encontró que una llamada dentro de un comentario `//` se sigue detectando como real. Reportó éxito con total confianza sin haber cubierto lo que él mismo había añadido. |

**Conclusión de la jornada**: Codex es un complemento real y viable para
incidencias de Engremiat bien acotadas -- diagnostica causas raíz
correctas y respeta convenciones del proyecto cuando se le dan
explícitamente, incluso en problemas de diseño no trivial. Pero confirma
la misma regla de gobierno que ya regía para Ejecutor (ver sección
"Gobierno" más abajo): **el filtro humano no es opcional cuando el
trabajo se sale, aunque sea un poco, del contrato original de la
tarea** -- ni el propio informe de éxito del agente, ni sus propios tests,
son prueba suficiente en ese caso. Nueva regla explícita para el ecosistema:
cualquier worker delegado que amplíe el alcance de una tarea por
iniciativa propia necesita verificación independiente de esa ampliación
concreta, no solo de la tarea original.

**Cómo encaja en la arquitectura de delegación segura**: no cambia el
diseño ya propuesto (bus de eventos vía Sheet + contrato de tarea por
proveedor) -- lo completa con un criterio de reparto de trabajo entre
workers, basado en evidencia real y no solo en coste:

- **Rutinario, alto volumen, bajo riesgo, contrato simple** (tarea 1, 2, 3
  del backlog por horario) -> worker local primero, es gratis y ya
  demostró seguir el formato pedido.
- **Acotado con causa raíz identificable y criterio de éxito objetivo
  verificable** (tests, no solo "parece que funciona") -> Codex es
  candidato real, con la regla de verificación independiente de arriba
  como condición, no como opcional.
- **Decisión de prioridad, cierre de jornada sin filtro, deploy** -> se
  mantiene la recomendación ya escrita en la sección "Gobierno": no se
  automatiza de entrada, cualquiera que sea el worker.

El bus de eventos vía Sheet sigue siendo el mecanismo de coordinación
correcto entre estos workers: cada uno reclama su fila, escribe su
resultado y una fila de evento -- el "quién verifica qué" se apoya sobre
esa misma traza, no sobre confiar en el reporte de texto del agente.

## Piloto de dos ramas y ahorro instrumentado (2026-08-24)

Segunda fase del piloto `codex-trigger-piloto`: dos incidencias reales
(bugs sintéticos representativos, no producción) delegadas en paralelo,
una por rama, sin solapamiento de archivos -- INC-TEST-03 (CSV sin BOM)
a Codex en `piloto-codex-lote1`, INC-TEST-04 (antigüedad con bug de
límite de día natural) a DeepSeek en `piloto-deepseek-lote1` (primera
llamada real a la API de DeepSeek de este documento, no solo
investigación).

**Resultado**: los dos diagnósticos fueron correctos a la primera y
pasaron verificación adversarial fuera de sus propios tests (10 días,
cambio de mes, fecha futura, CSV sin filas -- todos correctos). Coste
real medido de DeepSeek: ~1620 tokens totales por llamada (con caché de
prompt activo en la segunda), dato exacto del campo `usage` de la API.

**Hallazgo operativo no anticipado**: trabajar las dos ramas en la misma
carpeta de git (checkout compartido) causó un cruce real -- un cambio de
rama arrastró trabajo sin commitear de una incidencia a la rama
equivocada, más colisiones de lock file (`packed-refs.lock`) por
procesos de git concurrentes. Sin daño porque se detectó a tiempo, pero
confirma que la arquitectura real necesita **`git worktree` por
rama/worker**, no una carpeta compartida -- añadido como requisito, no
como opcional.

**Ahorro instrumentado (control real, no solo estimación)**: incidencia
de control INC-TEST-05 (mismo tamaño/dificultad, bug de `sort()` sin
comparador numérico) resuelta por Claude en solitario, con la misma
disciplina de verificación adversarial que en las delegadas. Conteo
exacto de pasos (tool calls): revisar una solución ya delegada = 2 pasos
(correr tests + 1 comprobación adversarial, sin `Read` ni `Edit` porque
el diff llega ya visible); resolver en solitario = 4 pasos reales
(`Read` + `Edit` + los mismos 2 de verificación). **Revisar cuesta
aproximadamente la mitad de pasos que resolver, y de naturaleza más
barata (validar un diagnóstico ya escrito, no generarlo)** -- confirma
con datos la estimación previa del 25-35% de coste relativo, sobre una
muestra todavía pequeña (3 incidencias).

**Regla de gobierno que se mantiene**: la verificación adversarial
independiente (fuera de los tests que el propio worker escribió o
verificó) fue la que confirmó que los dos fixes delegados eran
correctos de verdad, no solo "en verde según su propio criterio" -- ver
el hallazgo de la ronda 3 de Codex más arriba. No se retira ese paso al
escalar el método, es la parte que hace el ahorro real y no solo
aparente.

## Lote nocturno del worker local: triaje ciego instrumentado (2026-08-24)

Tercera fase del piloto. El worker local (devstral-dev/Ollama, llamado
directo vía API HTTP porque las 5 incidencias del piloto no forman
parte de ningún grafo indexado por Graphify -- `graphify-ollama.ps1`
exige un `-Symbol` de un proyecto ya indexado, no acepta tickets libres)
diagnosticó en modo ciego (sin ver las soluciones reales) las 5
incidencias del piloto de hoy, con el reparto Codex/DeepSeek **decidido
de antemano por regla determinista, no por el propio modelo local** --
distinción deliberada: el worker local triaja, no decide a quién se
delega.

**Resultado (comparado contra la causa raíz real ya conocida)**: 3 de 5
diagnósticos exactos (INC-TEST-01, 02, 03), 2 de 5 imprecisos
(INC-TEST-04: confundió el mecanismo del bug aunque señaló la función
correcta; INC-TEST-05: identificó la dirección correcta pero no el
mecanismo exacto). **El worker local reportó "confianza alta" en los 5
casos, incluidos los 2 erróneos** -- su confianza autodeclarada no es
señal fiable de acierto, mismo patrón de gobierno ya visto con Codex
(ronda 3, ampliación de alcance sin cobertura). Refuerza la regla:
ningún resultado de ningún worker se pasa a otro worker o a producción
sin marcar "sin verificar", independientemente de la confianza que
declare.

**Calibración de capacidad (dato real, no estimado)**: 84.7s para las 5
tareas (14-27s cada una, coste 0€ por ser cómputo local). A ese ritmo el
worker local tiene capacidad sobrada para decenas de triajes por noche
-- el cuello de botella hoy no es su capacidad sino la falta de un flujo
real que le dé trabajo (la integración con `13_INCIDENCIAS` vía bus de
eventos sigue siendo diseño, no está construida).

**Conclusión operativa**: el triaje del worker local sí puede ahorrar
turnos de diagnóstico a Codex/DeepSeek cuando acierta (3/5 aquí), pero
su hipótesis debe tratarse siempre como borrador a verificar, nunca como
respuesta a delegar directamente -- no cambia la arquitectura de
gobierno, la confirma con una segunda muestra independiente.

## Auditoría real contra 13_INCIDENCIAS + ciclo de Ejecutor acotado por DeepSeek (2026-08-24/25)

Cuarta fase del piloto, ya contra el Sheet real (`142vRqXfDj4C7KyY7TVf5Oh18gwtDcvAkYxFQ0lb6CGQ`), siempre en modo lectura -- ninguna escritura a `13_INCIDENCIAS` todavía.

**Corrección de proceso importante**: al enumerar las 58 filas reales a mano cometí varios errores de indexado (off-by-one/two, dos veces seguidas) que me llevaron a proponer cerrar una incidencia que en realidad seguía abierta y legítima, y a incluir en la cola dos incidencias (INC-0028, INC-0029) que su propia ficha marca explícitamente "pendiente de diseño, no es un fix mecánico" -- fallan nuestro propio criterio de "acotada" y no deberían haber estado ahí. Lección: verificar cada fila por número de fila directo, nunca recontar arrays a mano.

**Auditoría de patrón `filtrarPorNivelDato_`** (10 ficheros, grep-acotado sobre 125): 1 hallazgo real confirmado (`CosteService.js:337-356`, `obtenerComparativaCampanas`, mismo bug que INC-0052 pero en la comparativa de coste), 9 descartes razonados. Coste: ~22.000 tokens, 1.3-2.1s/fichero.

**Ciclo de "Ejecutor" acotado a DeepSeek** (Fase 1 Código + Fase 2 Integración de `CICLO_AUDITORIA_ENGREMIAT.md`, sin fase de resolución -- deliberadamente sin permiso de escritura en repo real, esa es la línea que no se cruza sin decisión aparte): Fase 1 sobre 5 módulos sin auditar, 3 hallazgos en 5.2s/6522 tokens; Fase 2 sobre integración de `calcularCosteTotalPorCategoria_`, 0 hallazgos forzados (razonó correctamente que faltaba evidencia, no inventó un hueco). **Verificación línea por línea de los 3 hallazgos de Fase 1**: 1 de 3 exacto (cita y mecanismo correctos), 2 de 3 con intuición del problema real pero **cita equivocada** (línea/función correctas del *síntoma* apuntando al sitio equivocado del código) -- mismo patrón "confiado pero impreciso en el detalle" que la ronda 3 de Codex.

**Triaje real corregido** (10 incidencias reales de `13_INCIDENCIAS`, prompt v2 tras detectar dos fallos en la v1): la v1 confundía "¿ya está arreglado?" con "¿el ticket está bien especificado?", y alucinaba nombres de fichero fuera de su dominio (`consola.py`, `graphify.py`, en un proyecto sin una sola línea de Python) en vez de decir "no lo sé". La v2 corrigió ambos: 0/3 alucinaciones de fichero (dijo explícitamente "fuera de src/"), y el mismo patrón de bug (INC-0052 vs el hallazgo nuevo de CosteService) recibió por fin el mismo veredicto -- antes eran inconsistentes sin motivo. 121.3s para 10 tareas reales, coste 0€.

**Intento de paralelismo real fallido**: lanzar los dos procesos con `&`/`wait` en el mismo shell no funcionó -- el proceso de auditoría nunca arrancó, sin error visible hasta revisar manualmente. Confirma (segunda vez, tras el cruce de `git worktree`) que la infraestructura de orquestación necesita procesos gestionados de verdad, no comandos de shell improvisados.

## Desfase de librería en Gestor de Proyectos: hallazgo, intento fallido de UI, fix real (2026-08-25)

Verificación real (no solo lectura del Sheet) de si un cliente sigue
sincronizado con la librería CORE. Dos capas de dato distintas, y las
dos pueden mentir por separado:

1. **`CLIENTE.LIBRERIA_VERSION` (Sheet)**: decía 152. Resultó ser un
   dato de seguimiento desactualizado, no la versión real bindeada.
2. **`appsscript.json` del proyecto de script del cliente (fuente de
   verdad real)**: decía 173, verificado con `clasp pull` directo
   contra el `scriptId` del cliente. La librería real publicada estaba
   en 175 (`clasp versions` contra `LIBRERIA_ID_`,
   `1fRR3hjtUIxWcZrjU1APFtG361QuDZ8GmBNQjAoKY_ZjhaYprAkvOEA7M` --
   proyecto de librería distinto del proyecto raíz/`.clasp.json` local,
   confundirlos fue un error real de esta sesión).

**Gap real: 2 versiones (175 vs 173), no 23** -- la cifra de 23 que se
reportó primero estaba basada solo en el dato de Sheet, ya desactualizado.

**Intento fallido**: activar "Panel de clientes" (menú Analizar del
maestro) vía automatización de navegador -- los submenús se abren bien,
pero el clic final que dispara la acción (`google.script.run`) no
llega a activarse, de forma reproducible en múltiples intentos con
distintas variantes de timing/hover. Se descartó reimplementar a mano
`actualizarLibreriaClienteRemoto_`/`generarEnvoltoriosParaModulos_` en
Node bajo presión de tiempo -- esa lógica ya causó un bug real serio
una vez (wrapper generator nested-callback gap).

**Fix real aplicado, más simple y más seguro de lo que parecía**: subir
solo la versión de librería NO requiere regenerar `Codigo.js` -- los
envoltorios no cambian de forma entre versiones de librería que no
añaden funciones nuevas top-level, solo el número de versión en
`dependencies.libraries[].version` de `appsscript.json`. Aplicado con
`clasp pull` (proyecto del cliente) -> editar solo ese campo -> `clasp
push -f` -- sin tocar `Codigo.js`, sin pasar por la lógica de
regeneración. Verificado con un segundo `clasp pull` que el cambio
está en vivo. Sheet actualizado a juego (175) por separado.

**Norma para sistematizar esto** (revisa la propuesta anterior de "solo
detección" -- el fix en sí también es scriptable, con este límite
claro):

- **Detección** (script, sin riesgo, candidato a
  `tools/chequear_libreria_clientes.mjs`): para cada `CLIENTE` con
  `SCRIPT_ID`, comparar `appsscript.json` real (vía `clasp pull` o la
  API de Apps Script) contra la versión real de `LIBRERIA_ID_` -- nunca
  fiarse del campo `LIBRERIA_VERSION` del Sheet como fuente de verdad,
  es solo un reflejo que puede quedarse atrás.
- **Fix simple (bump de versión, sin funciones nuevas que envolver)**:
  SÍ delegable a un script determinista -- `clasp pull` -> editar
  `dependencies.libraries[].version` -> `clasp push -f` -> actualizar
  el Sheet a juego. No requiere juicio, es mecánico.
- **Fix con regeneración de envoltorios** (cuando la librería añadió
  funciones nuevas top-level que el cliente aún no tiene envueltas):
  sigue siendo `actualizarLibreriaClienteRemoto_` vía la UI del Sheet
  (una vez se resuelva por qué el clic automatizado no dispara la
  acción) -- no delegar a un script improvisado sin probar primero
  contra ese generador real.

## Verificación real: git local NO es un espejo fiable de la librería publicada (2026-08-25)

Se verificó el punto pendiente de la sección anterior (¿se puede confiar
en el checkout local de git como fuente para regenerar envoltorios?).
**Resultado: no.** Comparado el contenido real vía API
(`LIBRERIA_ID_/content`) contra 6 ficheros del checkout local: 5/6
idénticos, pero `PanelClientesService.js` diverge de verdad --
`actualizarLibreriaClienteDesdePanel` tiene una implementación distinta
en la librería publicada (llama directo a
`actualizarLibreriaClienteRemoto_`/`actualizarLibreriaVersionEnFichaCliente_`)
frente al git local (delega en `actualizarLibreriaClienteDesdeDialogo`,
el colapso de INC-0018). No se determinó cuál de los dos está
desactualizado -- el punto importante es que **divergen**, confirmando
el riesgo que motivó la verificación.

**Diseño corregido en consecuencia**: el sistema de regeneración de
envoltorios NO debe leer del checkout local de git
(`validateAndReadFiles`, que es lo que hace `montar-cliente.mjs`) --
debe construir `aFiles` a partir del contenido **real y en vivo** de
`LIBRERIA_ID_/content` (misma llamada ya verificada esta noche),
combinado con la asignación fichero->módulo del mapa de paquetes (dato
estable, no código), y pasar eso a `resolveWrapperPlan`/
`renderWrapperStubs` (la lógica ya probada de
`tools/packager/generate-shell-wrappers.mjs`, sin tocarla). Así cada
ejecución parte de la fuente real, sin depender de que git esté al día
-- evita el modo de fallo encontrado aquí, en vez de confiar en que no
vuelva a pasar.

## Evidencia real para el Business Model Canvas (2026-08-25)

El presupuesto de "2-45€/mes" de arriba era una estimación sin datos
reales de precio. Ahora sí hay consumo real medido de esta misma noche:
~22.000 tokens para auditar 10 ficheros con DeepSeek, ~1.600 tokens por
triaje individual, lote completo de 8 incidencias reales resuelto en
minutos de cómputo -- coste real en céntimos de euro, no en euros,
para el volumen de trabajo de una sesión completa. Esto no sustituye el
presupuesto (sigue haciendo falta el precio público actual de DeepSeek,
no verificado desde el cambio de alias de julio), pero sí confirma que
el rango bajo del presupuesto (2-5€/mes) es plausible incluso para un
uso más intensivo que "revisión 1x/día" -- **decisión pendiente, no
tomada aquí**: si vale la pena refinar el presupuesto con el precio
público real antes de usarlo en una conversación con un cliente.

**Tasa de acierto real, no solo coste**: 3/4 en DeepSeek (lote 1,
2026-08-25) para tareas dentro del perfil delegable ya definido en
`PROPUESTA_METODOLOGIA_DESARROLLO_IDEAS.md`. Relevante para el nivel 3
del modelo de producto por niveles ("razonamiento avanzado bajo
demanda") -- la promesa al cliente debería incluir la disciplina de
verificación como parte del servicio, no como un detalle técnico
interno, dado que ya se ha demostrado necesaria en producción real.

## Precio real de DeepSeek verificado (2026-08-25)

Verificado contra la página oficial (`api-docs.deepseek.com`), leída dos
veces con resultado idéntico. **Aviso real**: los resultados de búsqueda
general (varios agregadores de terceros con nombres de aspecto oficial)
daban cifras distintas y más bajas que las oficiales -- no usar esas
fuentes para presupuestar, solo la documentación oficial de DeepSeek.

**DeepSeek-V4-Flash** (el modelo usado toda esta sesión, alias
`deepseek-chat`): input caché existente $0.007/1M (fuera de pico) -
$0.014/1M (pico); input caché nuevo $0.22/1M - $0.44/1M; output
$0.66/1M - $1.32/1M. Horario pico: 01:00-04:00 y 06:00-10:00 UTC, L-V.

**Coste real de toda la actividad de DeepSeek de esta sesión** (triajes,
auditorías, fixes del lote 1), calculado con precio real en el peor
caso (hora pico): **por debajo de 5 céntimos de dólar en total.**

## Hacia un presupuesto real de personalización por cliente

Con precio verificado + los tokens reales ya medidos por tipo de tarea
esta sesión (triaje individual ~1.200-1.600 tokens, fix mecánico
~1.000-3.000, auditoría de un fichero ~700-7.300 según tamaño), ya hay
base real para una tabla de coste de cómputo por tipo de tarea -- no
solo estimación. **Pieza que falta, no ignorar**: sumar el margen de
verificación ya medido (revisar cuesta ~50% de lo que cuesta resolver
desde cero, ver `PROPUESTA_METODOLOGIA_DESARROLLO_IDEAS.md`) al coste de
cómputo puro -- un presupuesto que solo cuente tokens de IA
subestimaría el coste real del trabajo.

## Pendiente de concretar / preguntas abiertas

- ¿Se pilota primero Claude Code Router (cambio mínimo, reversible) antes de evaluar OpenCode como reemplazo de la capa de orquestación?
- Precio actual de DeepSeek V4 Flash/Pro -- no verificado, los alias de modelo cambiaron el 2026-07-24.
- Paridad de funciones de OpenCode frente a Claude Code (subagentes, hooks, profundidad MCP) -- no confirmada.
- Dónde vive exactamente LiteLLM en la arquitectura final (recomendado: en la propia máquina del cliente, no en un servidor central del estudio) -- pendiente de validar técnicamente.
- Señales concretas para decidir cuándo el cierre de jornada de Ejecutor pasa automático vs espera revisión -- sin definir todavía.
- Diseño técnico de la Consola como app externa autoalojada (dónde corre, cómo se protege el acceso) -- sin empezar.

## Bitácora

- **2026-08-23**: apertura del documento tras una conversación larga que fue de "sistematizar la sincronización Consola↔Sheet" a diseñar la arquitectura completa del ecosistema agéntico híbrido. Archivado como INC-0056 para no perder el contexto, como ya pasó parcialmente con la primera mención de LiteLLM/OpenRouter antes de este documento.
- **2026-08-24**: primera evaluación práctica en vivo de Codex como worker complementario (piloto `codex-trigger-piloto`, repo separado). Ver sección "Evaluación práctica de workers complementarios" -- confirma a Codex como candidato real para incidencias acotadas, y añade la regla de gobierno "verificación independiente obligatoria cuando el worker amplía el alcance por su cuenta".
- **2026-08-24 (continuación)**: piloto de dos ramas en paralelo (Codex + primera llamada real a DeepSeek) más control instrumentado de ahorro. Ver "Piloto de dos ramas y ahorro instrumentado" -- confirma con datos (no solo estimación) que revisar cuesta ~la mitad de pasos que resolver, y añade el requisito de `git worktree` por rama tras un cruce real detectado en la práctica.
- **2026-08-24 (cierre de jornada)**: lote nocturno instrumentado del worker local, triaje ciego de las 5 incidencias del piloto. Ver "Lote nocturno del worker local" -- 3/5 diagnósticos exactos, 84.7s de coste real para las 5 tareas (capacidad sobrada, cuello de botella es falta de flujo real de trabajo), y hallazgo de gobierno: la confianza autodeclarada del worker no predice acierto.
