# Roadmap: Proyecto 0 — Gestor de Proyectos como herramienta de desarrollo

Consolidación de la conversación de asesoría técnica del 2026-08-19. No
sustituye a `ROADMAP_BACKLOG_MEJORAS.md` (que sigue siendo el backlog
funcional del sistema en sí) ni a `VISION_MISION.md` (visión de largo
plazo) -- este documento es el puente entre ambos: **usar el propio
Gestor de Proyectos, con su infraestructura ya construida, para
organizar y ejecutar el desarrollo del sistema**, en vez de que ese
trabajo viva solo en ficheros `.md`.

## Origen y por qué ahora

`ROADMAP_GESTOR_PROYECTOS_CLIENTE_VENTAS.md` (orden de ejecución,
punto 7) ya lo anticipaba: *"Gestor de Proyectos como orquestador de
una IA interna... formalizar como PROYECTO/TAREA el propio patrón de
desarrollo que ya se sigue hoy a mano (backlog en roadmap -> IA
ejecuta -> commit -> gate humano)"*. La condición que
`ROADMAP_IMPLEMENTACION.md` exigía antes de construir esto ("fase
posterior a un runner interno maduro") ya está cumplida -- el runner de
pruebas reactivas con heartbeat (Fase O0) es exactamente ese runner
maduro.

Objetivo explícito del usuario: *"segmentar el trabajo de desarrollo y
hacerlo digerible para que una IA interna colabore en el desarrollo y
ganemos independencia de la IA externa"*.

## Modelo de datos -- cero cambios de esquema

Todo lo necesario ya existe, verificado contra el código real antes de
escribir esto (no asumido):

- **`PRODUCTO`** = 1 registro por módulo real de la librería (15 según
  `moduleDependencies`, `tools/packager/package-map.json`): `CORE,
  GANTT, ECONOMICO, IMPACTO, COMPRAS, CONVOCATORIAS, CLIENTE, VENTAS,
  OPORTUNIDAD, ESCENARIOS, OPERATIVA, SEGUIMIENTO, EJECUCION,
  APROVISIONAMIENTO, COMUNICACION`.
- **`CAM-0010` "Desarrollo y mejora del sistema LaTroballa"** (nivel
  Auditoría, ya existe desde `ROADMAP_IMPLEMENTACION.md`) sigue siendo
  la campaña paraguas -- no hace falta crear una nueva.
- **`INCIDENCIA.PRODUCTO_ID`** y **`INCIDENCIA.TAREA_ID`** ya existen
  como FK dependientes en la cadena completa `CAMPAÑA→PROYECTO→
  PRODUCTO→PROCESO→TAREA` (`FormularioEsquemas.js`) -- una incidencia
  de desarrollo puede archivarse contra un módulo entero o contra una
  tarea muy concreta, según haga falta ("la incidencia puede afectar
  solo a una parte del módulo", planteado por el usuario).
- **`OBJETIVO`/`RESULTADO_ESPERADO`/`CRITERIOS_ACEPTACION`/
  `DEFINITION_OF_DONE`** (Fase L1.3, `PROYECTO`/`PRODUCTO`/`PROCESO`/
  `TAREA`/`DECISION`) -- construidos hace tiempo pero de adopción
  voluntaria hasta ahora ("nada fuerza su uso todavía", nota del
  backlog). Este es el caso de uso que por fin los activa: la IA
  externa documenta ahí la tarea antes de que la IA interna la reciba.
- **`PERSONA_EQUIPO` + `TAREA_RESPONSABLE`**: un "agente" (IA interna,
  o distintos agentes en distintas tareas) se representa igual que
  cualquier colaborador humano -- registro `PERSONA_EQUIPO` con
  `ROL='Agente IA'` (valor nuevo en el catálogo abierto
  `CFG_ROL_PERSONA`, mismo patrón barato ya usado repetidamente),
  asignado vía `TAREA_RESPONSABLE`. Como ya tiene
  `TELEGRAM_CHAT_ID`/`NIVEL_PERMISO_BOT`, un agente podría incluso
  reportar avances por el mismo bot operativo ya construido.
- **Bloqueos** (Agenda Operativa, Fase O, O4 "Alertas de bloqueo
  ampliadas" -- en construcción): mecanismo natural para que la IA
  interna informe de un bloqueo real (decisión pendiente, material/
  recurso insuficiente, competencia ausente) sin inventar nada nuevo.
- **Kanban / Panel operativo / Agenda Operativa / Listado filtrable**:
  seguimiento del trabajo, ya construidos, sin panel nuevo.
- **`STG_PRODUCTO`** (Fase L5.3, importación masiva de campaña
  completa) -- ya existe, permite sembrar los 15 `PRODUCTO` sin
  código nuevo.

## El pipeline (rol de cada participante)

1. **Operador + IA externa** (esta conversación) deciden el siguiente
   desarrollo.
2. **IA externa** documenta la tarea: rellena `OBJETIVO`/
   `RESULTADO_ESPERADO`/`CRITERIOS_ACEPTACION`/`DEFINITION_OF_DONE` de
   la `TAREA` (o `PROCESO`/`PRODUCTO` si el alcance es mayor) --
   convierte una conversación de asesoría en un encargo digerible sin
   ambigüedad.
3. **IA interna** recibe la tarea (asignada vía `TAREA_RESPONSABLE`),
   trabaja, y:
   - si la resuelve: actualiza `ESTADO`/avance, listo para revisión.
   - si se bloquea: registra el bloqueo (Agenda Operativa/O4,
     `INCIDENCIA`, o `DECISION` si hace falta que decida un humano) e
     informa a la IA externa.
4. **Operador** supervisa con las herramientas ya construidas (Kanban,
   Panel operativo, Agenda Operativa), aprueba o afina.

## Herramientas externas -- evaluadas 2026-08-19, ver conversación

**Útiles ahora, bajo riesgo, sin esperar evidencia**:
- **Graphify**: skill de mapa de conocimiento para asistentes de
  código (incluye Claude Code) -- mejora cómo trabaja cualquier IA
  externa sobre este repo, y de paso puede materializar la "bóveda de
  Obsidian" que `VISION_MISION.md` ya preveía. No toca nada del
  sistema LaTroballa.
- **n8n**: ya en uso (webhook de notificación humana de Taller
  Troballa) -- candidato natural como capa de pegamento para que un
  bloqueo de la IA interna se enrute a Telegram/email sin escribir
  código nuevo en Apps Script.

**Candidatos reales, pero prematuros -- módulo/pieza acoplable
futura, no construir hasta que haya evidencia**:
- **Cline** (agente autónomo de código, VS Code) -- candidato a "IA
  interna" que ejecuta directamente sobre el repo.
- **OpenClaw** (openclaw.ai; asistente personal autoalojado, memoria
  persistente, multi-canal incluido Telegram, integra Obsidian/GitHub)
  -- candidato al segundo rol de bot que `VISION_MISION.md` ya
  preveía ("agente social/coordinador").
- **Open WebUI** -- interfaz para modelos locales; pieza de
  independencia total de proveedores externos a más largo plazo,
  capacidad hoy insuficiente para tareas de desarrollo complejas.
- **Flower** (`flwr.dev`) -- framework de aprendizaje federado real y
  ligero, candidato para la Red de nodos (Fase 5,
  `ROADMAP_GESTOR_PROYECTOS_CLIENTE_VENTAS.md`) cuando exista más de
  un nodo real conectado. Hoy: cero nodos reales, diseñar contra un
  vacío.
- **Oasis** (PBML -- Points/Badges/Milestones/Leaderboards,
  autoalojable, basado en eventos) -- candidato a capa gamificada
  (`VISION_MISION.md`, "mismas entidades, piel distinta"): recibiría
  el evento "tarea completada", Apps Script seguiría siendo la fuente
  de verdad. Hoy: ningún temario/curso real todavía.
- **Formación con verificación por proceso** (bot conversacional que
  evita "resuelto por IA sin comprensión"): sin herramienta de
  terceros que lo resuelva -- es diseño propio, pendiente de un
  primer temario real.

## Orden de construcción acordado

1. **Sembrar los 15 `PRODUCTO`** vía importación masiva (`STG_PRODUCTO`,
   ya construido) -- primera prueba real de este flujo con datos
   propios del sistema, no de un cliente.
2. **Generalizar `IncidenciaMantenimientoService.js`** (hoy solo
   dispara para `NIVEL_INCIDENCIA='Cliente'`): nuevo valor en el
   catálogo `CFG_NIVEL_INCIDENCIA` (p.ej. `Módulo`) -- cuando una
   incidencia con ese nivel y `PRODUCTO_ID` relleno pasa a "En
   resolución", crea/reutiliza el `PROYECTO` "Mejora continua --
   <módulo>" bajo `CAM-0010`, genera la `TAREA` -- mismo patrón
   idempotente ya probado con clientes.
3. **Migrar un único caso real del backlog** (O4, "Alertas de bloqueo
   ampliadas") a este flujo de punta a punta, con los campos de L1.3
   rellenos por la IA externa, antes de generalizar a todo el backlog
   vivo.
4. Con ese caso probado, **decidir si Cline y/o OpenClaw** entran como
   ejecutores reales de tareas.

## Explícitamente fuera de alcance por ahora

- Cualquier integración con Cline/OpenClaw/Open WebUI/Flower/Oasis --
  quedan documentadas como candidatas, no se instala/conecta nada
  todavía.
- Migrar el backlog completo de `ROADMAP_BACKLOG_MEJORAS.md` de una
  vez -- un caso real primero (paso 3), generalizar después.
- Roles/permisos formales para agentes IA más allá de reutilizar
  `NIVEL_PERMISO_BOT`/`ROL_PERSONA` -- ya señalado como diferido en
  N9 (`ROADMAP_BACKLOG_MEJORAS.md`) para personas humanas; mismo
  criterio aplica aquí.

## Principios de gobierno (heredados, sin cambios)

Mismos que el resto del roadmap (`ROADMAP_BACKLOG_MEJORAS.md`): git
local sin remoto salvo autorización explícita, ninguna IA colaboradora
despliega o cierra fase por sí misma, cambios mínimos, gate humano
obligatorio antes de cerrar cualquier bloque.
