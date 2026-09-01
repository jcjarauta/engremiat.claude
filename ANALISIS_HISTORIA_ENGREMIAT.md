# Análisis conjunto -- historia real de Engremiat

Recuperado del triaje real de 47 documentos históricos (lanzado por API directa,
verificado con el Coordinador). Estos son los **20 documentos clasificados como
"historia"** (el universo propio de Engremiat) -- los 27 de "leyes y gobernanza"
del Sheet quedan aparte, tal como se decidió.

Cada entrada es la síntesis real generada por el Concilio (Acervo Lógico +
Acervo Narrativo) a partir del contenido real del documento -- personajes/lugares/
reglas/arcos que contiene, y si está vigente, superado o histórico.

---

## 1. CICLO_AUDITORIA_ENGREMIAT

Basado en el documento real de CICLO_AUDITORIA_ENGREMIAT y las propuestas de los acervos, sintetizo la única idea concreta y coherente:

**Idea sintetizada: Clasificar CICLO_AUDITORIA_ENGREMIAT como documento VIGENTE que consolida el ciclo de auditoría de 4 fases del ecosistema Engremiat, integrando los personajes y mecanismos reales ya existentes en el tejido.**

El documento describe un proceso de cuatro pasadas —Código, Integración, Comportamiento con datos simulados, e Interfaz— donde cada una encuentra una clase distinta de defecto, consolidado a partir de lo aplicado en los ciclos 1 y 2 fechados en 2026-08-20. Los personajes y mecánicas que podemos extraer son: **los subagentes general-purpose** ejecutando la Fase 1 en paralelo (nunca `Explore`, porque requiere juicio); como reglas verificables de conexión, los servicios transversales **NivelDatoService, CosteService, EvidenciaSocialService y DesviacionService** que la Fase 2 comprueba con grep en ambas direcciones; y como arsenal de simulación para la Fase 3, los instaladores **`InstaladorDatosPruebaPiloto.js`/`InstaladorDatosPruebaPilotoAmpliado.js`** con las marcas `esPrueba`/`pruebaId` ya soportadas por `insertarRegistroTransaccional` y el filtrado `incluirPruebas` existente en PanelTemporal. El guardarraíl no negociable de la Fase 3 —nunca ejecutar un flujo con efecto irreversible fuera del propio Sheet— establece al **Sheet de gestor-proyectos como espacio contenido**, y los documentos referenciados `ROADMAP_ECOSISTEMA_AGENTICO.md` y `GUIA_DISENO_ENGREMIAT.md` son artefactos reales del Vault que lo enmarcan. Todo lo descrito en el documento (servicios que YA EXISTEN, marcas ya soportadas, dinámica ya aplicada en ciclos reales) existe o funciona hoy, por lo que la clasificación es VIGENTE — el Acervo Lógico lo erró al descartarlo como histórico, ya que el documento no es un registro muerto sino la guía operativa actual que el propio tejido de Engremiat utiliza.

---

## 2. CLAIMS_LOTE1

**1. Personajes/lugares/reglas/arcos reales de Engremiat que aparecen o se pueden extraer:**

- **Workers**: "DeepSeek" y "Codex" aparecen como entidades funcionales que ejecutan tareas en ramas separadas (lote1-deepseek, lote1-codex). Son los equivalentes operativos de los Acervos en producción.
- **Concilio**: La estructura de "reparto fijado de antemano, sin solapamiento de ficheros entre ramas" refleja la labor de coordinación del Concilio, que asigna incidencias a workers específicos.
- **Vigilia**: La exclusión explícita de INC-0037, INC-0047 e INC-0048 (por no vivir en este repo) muestra el criterio de Vigilia para evitar que un worker "alucine un fichero inexistente" — un principio de verificación determinista.
- **Baserow**: Aunque no se menciona directamente, el patrón de tabla con Incidencia/Rama/Worker/Fichero(s) es consistente con la estructura de datos que se gestionaría en Baserow.
- **VPS**: La referencia a "git worktree" y ramas separadas implica infraestructura de servidor (VPS) para alojar los repositorios.
- **Cronista**: El documento en sí funciona como registro del Cronista, catalogando qué incidencia fue a qué worker con qué ficheros.

**2. Estado del documento:** **HISTÓRICO**.

**3. Razón:** El documento describe una delegación concreta del "lote 1" con ramas específicas (lote1-deepseek, lote1-codex) y un reparto fijado. No hay indicios de que estas ramas sigan activas hoy — el lenguaje en pasado ("Reparto fijado de antemano") y la naturaleza de un lote (que implica lotes posteriores) sugieren que esto registra una operación completada. Su valor es como registro de cómo se estructuró una delegación real, no como descripción del estado actual de producción.

---

## 3. DIARIO_DE_NAVEGACION

**1. Personajes/Lugares/Reglas/Arcos reales identificados:**

- **Concilio (local/DeepSeek)**, **Claude (Relevo)**, **Humano (Cuadrilla)**: Roles de autoría en commits según quién produjo cada nodo de exploración.
- **Baserow**: Fuente de verdad para contenido de producción (VIGILIA_TAREA, ACERVO), con el Sheet y n8n como herramientas de integración.
- **Relevo**: Mecanismo decisorio que elige qué rama "gana" y copia su contenido a ACERVO como recurso real.
- **Git**: Base del grafo acíclico dirigido (DAG) usado como memoria de decisiones, con ramas reales como `rama/reparto-A-solofisico`.
- **Vigilia**: Contexto de exploración registrado en commits, vinculado al `diario-navegacion/`.

**2. Estado del documento:** **VIGENTE**.

**3. Razonamiento:**  
El documento describe un sistema operativo en tiempo real: las ramas git existen físicamente (`rama/reparto-A-solofisico`), los roles de autoría están definidos, y Baserow sigue siendo la fuente de verdad para producción. No menciona reemplazos ni desuso; al contrario, detalla limitaciones conocidas (escalabilidad de Git) y un ejemplo concreto de 2026-08-30 con ramas creadas pero sin fusionar, lo que indica que el sistema está activo y en uso. La ausencia de menciones a "reemplazos" o "actualizaciones" confirma su vigencia.

---

## 4. DICCIONARIO_ENGREMIAT

**Síntesis de Concilio — Clasificación del "DICCIONARIO_ENGREMIAT"**

**1. Elementos reales del universo Engremiat extraíbles:**
- **Núcleo**: Engremiat (proyecto raíz), Baserow (BD real), n8n (motor de workflows), Generador (`engremiat-generador-n8n`, aislado en 127.0.0.1:5680), Puerta Humana (regla no negociable).
- **Ciclos construidos**: Cronista (segmentación de documentos y generación de informes/imágenes), Concilio (con `concilio_proponer` y presupuesto vía `GASTO_API`), Vigilia (cola nocturna con cierre por correo, probada en dos jornadas reales), Ágora (construido, sin motor de saldo real), Ramas (campos `RAMA`/`RAMA_ELEGIDA` construidos y sembrados; `fusionar_rama` solo diseñada).
- **Ciclos solo diseñados**: Pregonero ampliado (vídeo H5P + Piper), Oportunidad (detección por intereses comunitarios), Acervo (almacén común y sus "Acervos con carácter").
- **Prototipo probado**: Ejecutor/Ejecutor Local con confirmación humana obligatoria.
- **Diseñado sin evidencia de construcción**: Cuadrilla (v1 crowdsourcing y v2 conversación cooperativa).

**2. Clasificación del documento:** **VIGENTE**.

**3. Razón breve:** El diccionario se auto-declara "referencia rápida" y "actualizado según se añaden piezas nuevas" a fecha 2026-08-31, presentando cada ciclo con su estado exacto (construido/diseñado/prototipo) como fotografía actual. No contiene marcas internas de sustitución ni degradación; las entradas "solo diseñadas" son implementaciones pendientes dentro del plan del sistema, no estados superados. Por tanto, todo lo afirmado como construido se puede tomar como cierto hoy — siguiendo la regla anti-fabricación, **no se puede afirmar que Cuadrilla, `fusionar_rama`, Acervo, Oportunidad ni el Pregonero ampliado funcionan**, pues el propio documento los describe como diseño no implementado.

---

## 5. GUIA_DISENO_ENGREMIAT

**Síntesis del Concilio — GUIA_DISENO_ENGREMIAT**

El documento es una guía operativa **VIGENTE** para la 4ª pata del ciclo de auditoría (código → comportamiento con datos → diseño), que establece un checklist de referencia citando estándares externos (WCAG 2.1/2.2 de W3C/WAI, heurísticas de Nielsen Norman Group) y precedentes internos del código. Su función es convertir hallazgos de diseño en **incidencias** (misma nomenclatura que las de código, registradas por el **Cronista**), exigiendo citar el criterio concreto incumplido en lugar de impresiones generales, en línea con la disciplina del **Acervo Técnico**. El documento se ancla al presente mediante la referencia a la **INC-0017** (patrón de badges reutilizado en Panel de Clientes y Gestión remota) como precedente cerrado, y al caso abierto de `Estilos.html:35`, donde el `outline: none` que sustituye el foco nativo por un mero cambio de `border-color` está pendiente de verificación contra WCAG 2.4.7 — un arco narrativo en curso, sin fallo confirmado aún. La guía se apoya en artefactos reales del sistema (`src/Estilos.html`, `ModalConfirmar.html`, clases `.badge`/`.boton-primario`) y en la convención propia del proyecto: colores desde variables CSS (`--color-primario`), acciones destructivas por `ModalConfirmar.html` y no por `confirm()` nativo, y botones alineados a la derecha en `.acciones` — verificable primero contra la convención interna antes de mirar estándares externos. No menciona **Baserow**, **n8n**, **VPS**, **Tailscale** ni el **Sheet** explícitamente, por lo que no se puede afirmar su participación; el precedente "había dos rojos distintos y dos verdes distintos" sugiere que la centralización de tokens visuales vive en el código, pero queda como lectura implícita, no como hecho descrito.

---

## 6. INFRAESTRUCTURA

# SINTESIS DE CONCILIO — DOCUMENTO: INFRAESTRUCTURA

El documento **INFRAESTRUCTURA** está **VIGENTE** como registro del estado actual de la infraestructura operativa de Engremiat: describe la decisión explícita del **Promotor** (2026-08-31) de trabajar sobre el **VPS de Hetzner** (`engremiat-dev-hetzner`, Tailscale 100.107.171.88) como entorno que registra datos reales y hace backups, mientras la **Pi** (`nodo-pi-engremiat`, 100.125.52.52) pasa a ser banco de pruebas de concepto — ambos conectados por **Tailscale** como red privada sin exposición pública (puertos 80/5678 atados solo a IP privada, nunca `0.0.0.0`). Las reglas activas derivadas incluyen: soberanía del cliente final (FCAFA-TDAH u otro — el sistema debe vivir en hardware del cliente, ni VPS ni Pi son destino final), claves SSH dedicadas no reutilizables, y clonación de configuración sin datos (el VPS arrancó con Baserow y n8n vacíos). La **migración de datos** de la Pi al VPS sigue pendiente como decisión separada, y los datos actuales (`VIGILIA`, `GASTO_API`) viven en la Pi hasta que se ejecute. Se abren los arcos de la migración pendiente y del producto para cliente real, con los dispositivos desconectados del promotor como registro histórico sin relación con Engremiat.

---

## 7. MAPA_DOMINIOS_DATOS

# Síntesis de Concilio: MAPA_DOMINIOS_DATOS

**Clasificación: VIGENTE.**

**Razón:** El documento describe la arquitectura actual del ecosistema Engremiat: la separación Sheets/Baserow sigue operativa, las tablas enumeradas en Baserow existen hoy (incluidas `ACERVO` y `VIGILIA_TAREA`), y la regla de propiedad de datos continúa siendo el criterio guía para asignar datos nuevos. El precedente citado (sincronización en vivo fallida Consola↔Sheet) es histórico como hecho, pero funciona como fundamento vigente de la regla actual contra cruces automáticos.

**Elementos reales identificados:**

1. **Lugares/Infraestructura:** La Pi con Baserow (`192.168.8.230`, BD 76) como núcleo soberano sin Google; Sheets/Apps Script como dominio operativo de clientes existentes (La Troballa, Gestor de Proyectos). La diversidad Sheets/Baserow es intencional, no una carencia.
2. **Regla de propiedad de datos:** Todo dato nuevo se asigna deliberadamente a un dominio según a quién sirve, antes de construir nada; nada se duplica "por si acaso".
3. **Regla de cruce entre dominios:** Prohibida la sincronización en vivo (ya fracasó una vez); se permite solo el patrón de script deliberado con copia fechada, como existe para la Consola. Ningún puente de este tipo existe todavía entre Sheets y Baserow.
4. **Tablas reales en Baserow:** `ENTIDAD_ORGANIZATIVA`, `UBICACION_GEOGRAFICA`, `COMPETENCIA`, `PERSONA_COMPETENCIA`, `PERSONAJE`, `PLANTILLA_MISION`, `TAREA`, `PAQUETE_CLIENTE`, `ACERVO`, `GASTO_API`, `VIGILIA_TAREA`.
5. **Acervos:** La tabla `ACERVO` existe en Baserow — es el hogar formal de la narrativa de Acervos, ya no en Sheets.
6. **Documentos referenciados:** `tools/consola/SINCRONIZACION.md`, `PROPUESTA_EMPAQUETADO_PRODUCTO_CLIENTE_FINAL.md` (decisión 2026-08-31, dependencia no-24/7 de la Pi), `tools/registro_ecosistema.json` (prompts, triggers y scripts sujetos a chequeo de salud).

**Personajes/roles:** El documento no menciona personajes explícitos de Engremiat, pero invoca funciones indirectamente: el **Cronista** (el documento mismo fija por escrito dónde vive cada dato), **Vigilia** (tabla `VIGILIA_TAREA` + `registro_ecosistema.json` como chequeo de salud de lo que existe), **Acervos** (tabla `ACERVO` como hogar formal). No se inventan roles nuevos: se reutilizan los existentes como custodia de los dominios descritos.

---

## 8. PENDIENTES_JORNADA_2026-08-30-31

**Análisis del documento "PENDIENTES_JORNADA_2026-08-30-31"**

## (1) Entidades reales de Engremiat identificadas

**Roles/órganos:**
- **Concilio** — mencionado en el laboratorio Vigilia/Concilio y en la pieza diseñada "Cuadrilla v2" (Concilio conversacional con aviso Art. 50 UE).
- **Vigilia** — proceso de monitoreo que, según el documento, no puede correr desatendida de verdad hasta resolver el bug del webhook.
- **Relevo** — proceso de cierre de sesión ("Relevo completo de cierre") y como instancia que debe tomar decisiones reales para que se construya `fusionar_rama`.
- **Telar** — proceso de la jornada y wizard diseñado (`/telar` por Telegram).
- **Cronista** (función afín, no nombrada) — el documento es un consolidado de pendientes, similar a un registro de jornada.

**Infraestructura:**
- **Baserow** — limitación real confirmada: los tokens API no pueden crear tablas ni campos (probado con dos tokens distintos).
- **n8n** (implícito) — el webhook `notificar-humano` y los workflows desactivar/reactivar corresponden a la orquestación existente.
- **Telegram** — bot `@EngremiatTelar_bot` con sondeo cada 15s, para no exponer el generador aislado.
- **Generador** — donde corre el workflow "Telar Interactivo".
- **13_INCIDENCIAS** — conexión mencionada en el informe de cierre.

**Reglas/arcos:**
- **RAMA_ELEGIDA** — convención sin marcar aún en las tres variantes A/B/C de "Reparto de tareas vecinales".
- **Regla de "final sin magia"** — incumplida por Trama 2.
- **Art. 50 UE** — aviso regulatorio incluido en el diseño de Cuadrilla v2.
- **Arco "El vecino del banco"** — dos Tramas generadas (16 capítulos, $0,0124), ninguna lista para publicar.

**Piezas diseñadas pero NO construidas** (según el propio documento): Cuadrilla v1 y v2, `fusionar_rama`, `/telar`. **Sí construido y probado parcialmente**: modo interactivo de Trama capítulo a capítulo.

## (2) Clasificación: **HISTÓRICO** (con matices)

## (3) Razón breve:
El documento es un consolidado de pendientes de una jornada concreta (2026-08-30/31), registrando bugs reales (webhook intermitente, tokens Baserow), decisiones abiertas y estados de ese momento específico. Aunque algunos pendientes podrían seguir vigentes hoy (como el webhook intermitente), el documento no describe el estado actual del sistema sino un punto temporal; su valor es de trazabilidad histórica, no de configuración vigente. Para confirmar qué pendientes siguen abiertos sería necesario consultar el estado actual de los mecanismos.

---

## 9. PROMPT_EJECUTOR

# SÍNTESIS DE CONCILIO — PROMPT_EJECUTOR

## Personajes, lugares, reglas y arcos reales

**Personajes**: Ejecutor (agente operativo sin memoria, disparado por trigger automático), Claude (local) como contraparte que registra hallazgos en el Sheet, y el Operador humano que fija parámetros vía botón "Guardar ritmo" en la Mesa de Revisión.

**Lugares/artefactos**: Repo `jcjarauta/engremiat.claude` (rama activa vía `#ramaActiva`), el artefacto Mesa de Revisión (con `data-tipo="auditoria_hallazgo"` y `<div id="configEjecutor">`), y el Sheet como referencia histórica subordinada (pestaña `96_PROMPT_EJECUTOR`, tabla `13_INCIDENCIAS`).

**Reglas/arcos**: La auditoría en 4 fases (Código, Contexto, Datos reales, Diseño) con Fases 3-4 bloqueadas; bloqueos estructurales permanentes del entorno (sin Browser, sin PowerShell, sin escritura en Sheets, webhook `script.google.com` bloqueado por proxy); Graphify como atajo de contexto acotado (Fase 1); y el mecanismo de caducidad de ~7 días con verificación vía `tools/salud_ecosistema.mjs`.

## Clasificación: **VIGENTE**

## Razón breve

El documento se autodefine como "fuente de verdad" operativa para cada disparo del trigger, con fecha de revisión reciente (2026-08-23) y mecanismo explícito de auto-verificación de caducidad integrado. Describe bloqueos estructurales actuales del entorno, no hechos pasados, y establece precedencia jerárquica sobre el Sheet — se posiciona como lo más actualizado del ecosistema. La vigencia está condicionada a esa fecha de revisión, pero el propio documento gestiona esa desactualización, por lo que la clasificación de fondo es VIGENTE, no SUPERADO ni HISTORICO.

---

## 10. PROPUESTA_APOYO_AUTONOMIA_NEURODIVERGENC

# Veredicto sintetizado: PROPUESTA_APOYO_AUTONOMIA_NEURODIVERGENCIA

## (1) Extracción de piezas reales de Engremiat

El documento **ancla en el Concilio** como espacio deliberativo donde esta propuesta queda "a valorar", derivada de la exploración del ecosistema agéntico (INC-0056). Propone **reutilizar al Coordinador** como filtro de tareas según capacidad diaria (spoon theory), con visibilidad opt-in explícito entre personas — regla que resonaría con la **Puerta Humana** (la persona como usuaria principal, no objeto de vigilancia). El principio *"consent beats compliance"* conecta con la **Vigilia**: el sistema está disponible, no impone recordatorios. El escalado vía Redes de Apoyo Mutuo de 3-8 hogares con timebanking replica el patrón de **Relevo** entre nodos pequeños, no un grupo central.

## (2) Clasificación: **VIGENTE**

## (3) Razón

El documento se autodescribe como "a valorar — primer piloto documentado en abstracto", con fecha de apertura reciente (2026-08-25) y sin indicios de sustitución o cierre. **Describe un diseño propositivo no implementado**: sus principios y hallazgos de investigación (spoon theory, DSM-5, mutual aid networks) son referencias reales citadas como tales, pero **no afirma que ningún mecanismo del sistema ya funcione**. Su valor es como propuesta activa en consideración — semilla viva, no edificio construido — y por tanto sigue siendo cierto como documento de propuesta, no como descripción de un sistema operativo.

---

## 11. PROPUESTA_ECOSISTEMA_AGENTICO_HIBRIDO

**Clasificación:** HISTÓRICO (con valor vivo como registro de diseño)

**Personajes, lugares y reglas de Engremiat identificados (con nombres concretos):**
- **Ejecutor** (`RemoteTrigger`) — espacio agéntico existente con ciclos automáticos de auditoría/resolución; el documento propone dotarlo de límite de gasto propio por diseño.
- **Esta conversación** (Claude Code) — espacio de diseño y asesoramiento, facturado por cuota mensual; el cierre de jornada (validar + fusionar a `main`) depende de ella por **punto de control deliberado** (no limitación técnica), con precedente en `[[reference_columnas_13_incidencias_indices]]`.
- **La Consola / Artifacts publicados** — sandbox sin acceso a red arbitraria.
- **El Sheet como bus de eventos de facto** — específicamente `13_INCIDENCIAS` (caso INC-0050, `registrarIncidenciaDrift_`), `97_ESTADO_CONSOLA` y `98_LOG_GOBIERNO`; el documento propone formalizarlo como patrón *transactional outbox*, pero esto es **propuesta**, no estado actual.
- **INC-0052 a INC-0055** (desincronización de Consola, commits `f376277` y `c921ed0`) — arco de incidencias que disparó la propuesta.
- **INC-0056** (`13_INCIDENCIAS`, estado "A valorar") — incidencia que registra este documento.
- **Patrón de documento vivo** — misma regla que `PROPUESTA_EXPERIENCIAS_INTERACTIVAS_MULTIMEDIA.md` y `PROPUESTA_MODULARIZACION_LIBRERIA.md`: se amplía en sesiones futuras.

**Razón de la clasificación:**
El documento se abre con "Estado: A valorar — diseño en curso, sin urgencia de implementación" y se registra explícitamente para preservar decisiones de una conversación larga (2026-08-23), no para describir el estado actual del sistema. Lo que describe como existente (los tres espacios, el bus de eventos de facto en el Sheet) es el **diagnóstico de partida** — cierto en su momento y base del diseño — pero la arquitectura propuesta (formalizar el bus, límites de gasto por agente, workspaces Anthropic con API keys propias, prompt caching, Batch API) está planteada como dirección futura, no como mecanismo operativo. Es valioso como registro de intención arquitectónica y evolución del pensamiento, pero no como descripción veraz de lo que funciona hoy en Engremiat.

---

## 12. PROPUESTA_EXPERIENCIAS_INTERACTIVAS_MULT

**Síntesis del Concilio sobre "PROPUESTA_EXPERIENCIAS_INTERACTIVAS_MULTIMEDIA"**

**Clasificación: VIGENTE con núcleo valorativo cerrado.**

El documento describe una incidencia viva (INC-0055, estado "A valorar") cuyo análisis de Audio Estudio concluye en una decisión tomada: no es integrable por API y no merece replicarse entera. Esa conclusión permanece vigente como criterio, pero lo que sigue abierto es la propuesta concreta que de ella se deriva: que Engremiat dispare generación TTS (Gemini o ElevenLabs vía API) desde una ficha/tarea, guardando el resultado como Documento adjunto — un patrón que el propio texto señala como análogo al ya existente para otros ficheros generados, aunque no detalla si ese disparo automático está implementado hoy o es diseño a construir. El documento también establece una regla operativa activa: toda incidencia "a valorar" nueva lleva su propio Google Doc desde el principio, patrón ya usado por `PROPUESTA_MODULARIZACION_LIBRERIA.md` y el resto de `PROPUESTA_*.md` del repo.

**Entidades reales de Engremiat extraídas:** La Consola (superficie de gestión de incidencias), el Sheet `13_INCIDENCIAS` con el ID concreto INC-0055, el patrón `PROPUESTA_*.md` como estructura viva del repo, el precedente `feedback_incidencias_a_valorar_google_doc` como directriz de memoria, y el operador como figura humana que comparte enlaces y edita el Google Doc vinculado. No se nombran Concilio, Vigilia, Acervos, n8n, VPS/Tailscale ni Puerta Humana — el documento no los menciona. La herramienta externa Audio Estudio aparece analizada con fecha, pero como instrumento manual del operador, no como parte del ecosistema.

**Razón de la clasificación:** El estado "A valorar" y la fecha de apertura reciente (2026-08-23) indican que la propuesta no ha sido resuelta ni sustituida; el análisis de Audio Estudio sigue siendo cierto (sin API pública), y la política del Google Doc vinculado es una regla activa que se aplica a incidencias futuras. El documento es, por tanto, un análisis vivo con una valoración cerrada y una propuesta pendiente de desarrollo.

---

## 13. PROPUESTA_METODOLOGIA_DESARROLLO_IDEAS

**Triaje del documento `PROPUESTA_METODOLOGIA_DESARROLLO_IDEAS`**

---

### (1) Elementos reales de Engremiat que aparecen o se pueden extraer

- **Arco real:** El documento es un **arco de diseño metodológico** — la incidencia **INC-0057** (estado "A valorar", en `13_INCIDENCIAS`), que se aplica como caso piloto al arco **INC-0056** (ecosistema agéntico, `PROPUESTA_ECOSISTEMA_AGENTICO_HIBRIDO.md`). No es un proyecto aislado, sino la **norma de cómo se documentan y trian las ideas del estudio**.
- **Personaje/rol existente:** Se menciona explícitamente al **operador** (humano que dirige el estudio y señaló la necesidad de separar proceso de proyecto). No se nombran Concilio, Acervos, Vigilia, Coordinador, Ejecutor, Cronista, Pregonero ni Relevo — y no los invento.
- **Lugar/plataforma:** El **Sheet de incidencias** `13_INCIDENCIAS` (donde vive INC-0057) y el **Google Doc vinculado** (pendiente de crear). El fichero vive aparte de `PROPUESTA_ECOSISTEMA_AGENTICO_HIBRIDO.md` para que la metodología sea reutilizable más allá de su primer caso.
- **Herramientas/metodología nombradas:** **Business Model Canvas** (con variante **micro-canvas de 6 campos** para ideas internas/técnicas y **BMC completo de 9 bloques** para ideas productizables), **Scrum ligero**, y el **formato Spike** (prueba de concepto: pregunta acotada, cómo se mide, fecha límite, resultado adoptado/descartado).
- **Reglas/normas extraídas:**
  1. **Criterio de entrada:** Toda incidencia "a valorar" nueva se clasifica al abrirla como interna/técnica (micro-canvas) o productizable (BMC completo).
  2. **Secuenciación en vivo:** No construir la metodología completa antes de aplicarla — se construye lo mínimo y se prueba contra INC-0056 como caso real.
  3. **Generalización de alcance (2026-08-25):** El formato Spike — descrito como validado 10 veces — se convierte en la fase inicial oficial de documentación de **cualquier** proyecto nuevo del estudio (software, voluntariado, etc.), no solo de Engremiat como producto.
  4. **El BMC como material reutilizable:** El Canvas relleno de una idea productizable se usa para **generar** el business plan o memoria de subvención, no se reescribe a mano como documento final.

**Nota anti-fabricación:** El documento describe el mecanismo Spike como "ya definido y validado 10 veces" y la generalización de alcance como "decisión tomada" el 2026-08-25 — eso es lo que el propio texto afirma. Sin embargo, el micro-canvas, el BMC completo y la propia metodología están explícitamente **en diseño, no implementados como norma cerrada**: el estado es "A valorar — diseño en curso, se construye a la vez que se aplica a INC-0056".

---

### (2) Clasificación: **VIGENTE** (como diseño en curso, no como norma plenamente implementada)

---

### (3) Razón breve

No es **histórico** porque su contenido sigue siendo la base de trabajo actual del estudio — no registra algo terminado. No es **superado** porque no hay evidencia en el documento de que algo lo haya sustituido. Es **vigente** en su estado de "diseño en curso": las reglas descritas (criterio de entrada, secuenciación, generalización del Spike) son las que **ahora mismo** se están aplicando al caso piloto INC-0056, y la ampliación de alcance del 2026-08-25 ya es decisión oficial tomada. La salvedad explícita: solo el formato Spike está validado (10 veces); el micro-canvas y el BMC completo están **en fase de prueba** contra el caso real — el propio documento lo dice: "se construye lo mínimo necesario y se pone a prueba en vivo".

---

## 14. PROPUESTA_SIGUIENTES_LINEAS_TRABAJO

**Síntesis de Concilio — PROPUESTA_SIGUIENTES_LINEAS_TRABAJO**

El documento registra el primer hito de validación empírica del ecosistema agéntico: un lote real de 8 incidencias contra `jcjarauta/engremiat.claude`, con 7 resueltas y verificadas, y 1 rechazada por diagnóstico inventado (INC-0036) — cazada antes de tocar `main`, demostrando en la práctica la regla de gobierno de **Vigilia**: "nunca fiarse de la confianza autodeclarada". **Se clasifica como HISTÓRICO**: valioso como acta de un punto de partida (de "cuatro piezas probadas por separado" a "dos trabajando en paralelo sin pisarse"), pero no describe el estado actual — el propio texto deja abiertas fragilidades sin resolver (divergencia de `git local`, automatización de navegador no fiable) y declara que falta el bus de eventos para el ciclo repetible sin supervisión. Los **Ejecutores** (DeepSeek y Claude, como workers externos) y el **Coordinador** (Claude orquestando a mano el reparto y la verificación) son roles reales confirmados por el documento, operando bajo el patrón de **Vigilia** como mecanismo de control — sin que esto implique que su interacción esté hoy automatizada. Queda como propuesta pendiente, no como hecho, el sistema de regeneración de envoltorios con fuente viva (diseñado pero no construido) y la identificación de causa raíz para la navegación automatizada. El documento es, en síntesis, el registro de validación que abre las fases siguientes, no una descripción de la operativa vigente.

---

## 15. ROADMAP_AUDITORIA_UX

**Síntesis del Concilio:**

**Clasificación: VIGENTE** — El documento describe un plan de auditoría activo que sigue la secuencia de fases del roadmap general; la referencia a la auditoría piloto (`PRUEBA_PILOTO_END_TO_END.md`) como base ya completada y la definición de fases M1+ con instrucciones de actualización continua (`ROADMAP_BACKLOG_MEJORAS.md`) indican que es la hoja de ruta operacional actual, no un registro superado ni histórico.

**Personajes, lugares, reglas y arcos extraídos del documento:**

- **Personajes/roles**: El **Coordinador** (en M1: "asignación de coordinador"); el **Cronista** implícito en el mantenimiento de documentos como `ROADMAP_BACKLOG_MEJORAS.md`; el **Ejecutor** (los pasos del principio de secuenciación describen su protocolo de trabajo); **Acervos** como el rol desde el que se analiza.

- **Lugares/artefactos**: **El Vault** como repositorio (los documentos `ROADMAP_AUDITORIA_UX.md`, `AUDITORIA_POR_BLOQUES.md`, `PRUEBA_PILOTO_END_TO_END.md`, `ROADMAP_BACKLOG_MEJORAS.md`); "Producción" y "UI real" referidas al sistema desplegado.

- **Reglas/procesos**: El **principio de secuenciación** (verificar contra datos/UI reales → construir → prueba reactiva → `clasp push` con autorización → verificación humana → commit → actualizar documentación); la regla **bottom-up** de no abrir un bloque sin cerrar el anterior; la distinción entre `ERROR`/`BLOQUEO` (fix en caliente) y hallazgos que requieren decisión de alcance con el usuario.

- **Arco narrativo**: Fase L (piloto end-to-end documentado) → **Fase M** (este roadmap), que cierra la deuda de auditoría en Personas, Espacios/Recursos y Proveedores/Materiales añadiendo una capa explícita de UX/UI sobre las 6 dimensiones (Input, Modelo de datos, Relaciones, Output, Trazabilidad, Rendimiento/escala).

**Nota anti-fabricación**: El documento describe un **diseño de proceso activo** —no afirma que las fases M ya estén implementadas; explícitamente dice qué falta por cubrir y qué se debe decidir con el usuario antes de construir. El protocolo descrito (verificar contra UI real, `clasp push`, verificación humana) es lo que el documento establece como método, no un mecanismo ya construido fuera del catálogo.

---

## 16. ROADMAP_BASELINE_ENGREMIAT

# Triaje del documento: ROADMAP_BASELINE_ENGREMIAT

## 1. Elementos reales de Engremiat que aparecen o se pueden extraer

**Roles y personajes:** **Cronista** (segmenta intenciones en tareas atómicas `TAREA`), **Ejecutor/Ejecutor Local** (siguen las tareas con confirmación humana obligatoria).

**Estructuras y reglas:** tabla `ENTIDAD_ORGANITZATIVA` con `TIPO_NIVEL=confederacion` (describe desde una persona hasta una confederación sin rediseño), tabla `INCIDENCIA` en **Baserow** (por crear), workflow Cronista (el mismo que ya segmenta tutoriales reales), *principio de ninguna acción de escritura sin confirmación humana*.

**Lugares y herramientas:** **Plaza** (puerta de entrada, con login PIN/QR pendiente de implementar), **Ágora** y **red_social** (conectan personas por lo que tienen y necesitan), **Baserow** (base de datos donde se creará `INCIDENCIA`), referencias a `jerarquia.yaml` y `PROPUESTA_EMPAQUETADO_PRODUCTO_CLIENTE_FINAL.md` (resumido y ordenado como plan de acción).

**Arco narrativo:** el documento es un **plan de autogestión asistida** — Engremiat como su propio operador/cliente, con fases conservadoras y una baseline para comparar revisiones futuras. Incluye un cliente real (persona neurodivergente) como primer caso de uso.

## 2. Clasificación: **VIGENTE**

## 3. Razón

El documento es explícitamente un *roadmap* con fecha base futura (2026-08-30), definido como *plan de acción* y baseline para comparación — no una bitácora de decisiones pasadas ni algo ya sustituido. Describe aspiraciones fundamentadas en piezas ya probadas (Cronista, Ejecutor con confirmación humana) y señala claramente qué falta implementar (login PIN/QR en Plaza, tabla `INCIDENCIA`), lo que confirma que su contenido describe el estado actual del proyecto: un plan activo para ser ejecutado, no un hecho histórico ni algo superado por una versión más nueva.

---

## 17. ROADMAP_ECOSISTEMA_AGENTICO

**Clasificación: VIGENTE**

**Razón breve:** El documento describe el ecosistema de desarrollo de Engremiat en su estado actual, con las capas 1, 2, 4 y 5 marcadas explícitamente como "ya construidas y verificadas en vivo" (INC-0001, INC-0003, Graphify extendido a 78 ficheros), y la capa 3 (worker local) como la única en desarrollo activo. No registra un hecho superado ni un plan futuro — es la capa intermedia vigente entre visión y gestión de proyecto.

**Personajes, lugares, reglas y arcos concretos que emergen:**

1. **Gestor de Proyectos (el Sheet)** — regla ya verificada en vivo con INC-0001 e INC-0003: convierte Incidencia en Tarea. Es la capa de **Intención**.
2. **Graphify** — selector de contexto estructural local, ya extendido a los 78 ficheros .js de producción. Capa de **Contexto**. Solo cubre código, sin equivalente para docs/vídeo.
3. **Claude Code** — capa de **Supervisión** que verifica contra el diff/archivo REAL (nunca contra lo que el worker dice que hizo), corre los gates, publica. También aparece como ejecutor intercambiable según tipo de tarea, y su settings.json (defaultMode=acceptEdits + allow/deny) es la capa de **Permisos**, junto con **Agent View** para revisión en lote.
4. **Worker local (Cline+Ollama / Aider+devstral-dev)** — el ejecutor alternativo de la capa de **Ejecución**, probado en serio el 2026-08-20 y con resultado real: no sustituye a Claude, pero aporta como borrador supervisado en código. La GPU de 16GB local es su recurso, hoy infrautilizada.
5. **API de pago tipo DeepSeek** — regla extraída: la salida al mercado como **sensor**, no como fracaso; si la fiabilidad local no basta, pagar una API barata indica qué capacidad merece madurar en local.
6. **Vault** — lugar donde este documento se aloja junto a VISION_MISION.md y ROADMAP_PROYECTO_0.md, delimitando tres capas distintas: visión (largo plazo), gestión (el Gestor de Proyectos se usa para organizar el desarrollo) y esta capa técnica de **cómo se organiza el trabajo cuando ejecutan agentes de distinta naturaleza**.
7. **Puerta Humana implícita** — la supervisión de Claude antes de publicar, con los gates como reglas de publicación, puede mapearse al papel que un Pregonero/Cronista humano aplicaría.
8. **Relevo** — la capa de ejecución es **intercambiable** según el tipo de tarea: el worker local, Claude, o una API de pago se sustituyen según convenga.

**Regla central del documento:** la relación necesidad-capacidad aplicada al propio desarrollo: cientos de TAREAs futuras que hoy solo ejecuta Claude, una GPU local parada, y el encaje probado — delegar trabajo mecánico como borrador supervisado. Nada en el contenido sugiere que haya sido reemplazado o caducado.

---

## 18. RUEDA_DEL_GREMIO

**Síntesis integrada:**

**Clasificación: VIGENTE** — el documento describe con honestidad explícita el estado real al 2026-08-31, distinguiendo lo construido y probado (Concilio, Vigilia, Telar, Relevo validado dos veces, Cronista, Ejecutor prototipo, Ágora sin saldo) de lo solo diseñado (Oportunidad, Cuadrilla v1/v2, Pregonero), sin evidencia de que nada posterior lo haya invalidado. Los personajes reales extraídos son: **Concilio**, **Vigilia** y **Telar** (construidos y probados en producción real), **Relevo** (validado con Ramas de software y Tramas de "El vecino del banco"), **Cronista** (construido), **Ejecutor/Ejecutor Local** (prototipo probado), **Pregonero** (solo diseñado), **Cuadrilla** (diseñada en dos versiones, no construida), y **Ágora** (construido sin motor de saldo). Las reglas y arcos reales incluyen la jerarquía **Campaña → Proyecto → Tarea** (hallazgo real que conecta con el documento `TAREA` existente), el ciclo de 7 estaciones de la **Rueda del Gremio** (nunca recorrido entero de punta a punta), y los tránsitos entre estaciones **siguen siendo decisiones manuales del promotor** — no hay mecanismo automático que los mueva. El documento cierra con el hallazgo vigente de que **Telar es el prototipo de gestión de proyectos de la Rueda**, probado primero en bajo riesgo (historias) antes de confiarle algo real, con FCAFA-TDAH citado como campaña real de Oportunidad. El propio documento se declara **limitado** al admitir que cada estación se ha probado por separado pero la rueda completa nunca se ha recorrido end-to-end en un solo proyecto real — eso es un estado vigente, no superado ni histórico.

---

## 19. SALUD_ECOSISTEMA

**Clasificación**: VIGENTE

**Razón**: El documento establece una norma operativa activa ("todo elemento nuevo nace registrado") y un ritual de comprobación que se aplica a cualquier sesión de trabajo real. Las cuatro desincronizaciones del 2026-08-23 son evidencia histórica que justifica la regla, pero el ritual y la obligación de registro siguen siendo la norma actual. No hay indicación de que haya sido superado o reemplazado.

**Elementos reales de Engremiat extraídos** (reutilizando nombres existentes, sin inventar categorías nuevas):
- **Ejecutor**: su rama activa iba 19 commits detrás de `main` y su trigger estaba desactivado — punto 2 y 4 de fallo.
- **Consola (`GRUPOS`) vs `13_INCIDENCIAS` (Sheet)**: la desincronización de datos que motivó el punto 1 de fallo.
- **`PROMPT_EJECUTOR.md`**: prompt operativo que no mencionaba el ritual de sincronización ni la regla de delegación de IA, ya construidos — punto 3 de fallo.
- **`tools/registro_ecosistema.json`**: regla central — todo prompt operativo, trigger programado o script de sincronización nuevo debe declararse ahí en el MISMO commit que lo crea, con su `id` real si es un trigger.
- **`tools/salud_ecosistema.mjs <rama-activa> <volcado-sheet.json>`**: script que automatiza los puntos 1-3 (diferencia de commits, antigüedad de cabeceras "Última revisión", consistencia Consola↔Sheet).
- **Arco de la desincronización silenciosa**: las cuatro fallas paralelas que demostraron que nada del ecosistema se comprueba solo; el documento es la respuesta institucional.
- **Fecha 2026-08-23**: día del descubrimiento, usable como referencia histórica.

---

## 20. VISION_MISION

# Triaje de "VISION_MISION"

## (1) Personajes, lugares, reglas y arcos reales

El documento menciona explícitamente: **Engremiat** (plataforma raíz), **La Troballa** (primer cliente real), el **encaje de Oportunidad** (ya construido — puntúa y propone, no factura), el **patrón de pseudonimizar "Persona atendida"** (ya existente), y los roadmaps técnicos como documentos hermanos (ROADMAP_IMPLEMENTACION, ROADMAP_AUDITORIA_UX, ROADMAP_BACKLOG_MEJORAS, ROADMAP_GESTOR_PROYECTOS_CLIENTE_VENTAS).

Se pueden extraer como **reglas de diseño**: (a) **Procomún sin contabilidad de deudas** — el sistema propone encajes sin llevar balance de quién debe a quién; (b) **Formación antes que extracción** — ante un hueco de capacidad, la primera respuesta es proponer cómo construir esa capacidad internamente; (c) **Fiat como sensor, no fracaso** — salir al mercado externo registra un hueco y dispara propuestas para cerrarlo; (d) **Independencia tecnológica como postura** — la IA interna no es solo privacidad, es coherencia con la economía social.

El **arco de fondo** es el paso de la gestión operativa interna (campañas, proyectos, personas, espacios, materiales) a la visibilidad capacidad-necesidad entre organizaciones del ecosistema. La **fecha clave** es 2026-08-17 (asesoría estratégica de origen) y 2026-08-20 (nota de nomenclatura que distingue Engremiat de La Troballa).

## (2) Clasificación: **VIGENTE**

## (3) Razón

El documento se autopresenta explícitamente como "la conversación de fondo que explica por qué se está construyendo lo que se construye", y afirma que cualquier decisión técnica futura debe contrastarse contra esto. Los principios de diseño se formulan en presente como guía activa (procomún, formación no extracción, fiat como sensor), no como algo que fue y dejó de ser. La nota de nomenclatura de 2026-08-20 actualiza la comprensión del proyecto sin invalidar el contenido, y elementos como el encaje de Oportunidad y el patrón de pseudonimización se citan como ya existentes. El documento no describe un estado superado ni un hecho meramente histórico: es el marco vigente de referencia contra el que contrastar roadmaps y decisiones técnicas.

---

