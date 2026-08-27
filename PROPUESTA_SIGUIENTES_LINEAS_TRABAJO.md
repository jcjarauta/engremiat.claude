# Valoración global de Engremiat y propuesta de siguientes líneas de trabajo

**Fecha:** 2026-08-25
**Contexto:** cierre de una sesión larga (24-25 agosto) dedicada a validar en vivo
un ecosistema de workers complementarios (Codex, DeepSeek, worker local) y a
resolver un desfase real de librería en producción. Este documento recoge la
valoración de conjunto pedida al cierre, no solo lo de esta sesión.

## 1. Dónde está Engremiat de verdad hoy

**El producto**: dos clientes reales (La Troballa, Gestor de Proyectos), core
estable, siete Fichas con patrón consistente, sistema de incidencias con
disciplina real de causa raíz (no solo síntoma), auditoría metódica de 4 fases
ya rodada en varios ciclos. No es un prototipo — es un sistema en producción
con historial de incidentes reales, corregidos y documentados.

**El ecosistema agéntico**: esto es lo que ha crecido más rápido y con menos
visibilidad de conjunto. Hoy existen, funcionando de verdad, no en diseño:

- **Ejecutor** (RemoteTrigger) — ciclos automáticos de auditoría + resolución,
  con metodología de 4 fases y triage ya validado en la práctica.
- **Worker local** (devstral-dev/Ollama) — gratis, rápido (~12-17s por tarea),
  con un techo de capacidad ahora *medido*, no supuesto: fiable para triaje y
  formato, con acierto real de 3/5 a veces perfecto en diagnóstico de código
  algo más complejo.
- **Codex y DeepSeek** — validados hoy por primera vez en vivo (no solo
  investigados) como complemento real para incidencias acotadas, con la misma
  disciplina de gobierno que ya regía para Ejecutor.
- **Consola Engremiat** (Artifact) — panel de gobierno humano, con las
  limitaciones ya conocidas (sin red en vivo, sincronización ritual, no
  automática).

Cuatro piezas que hoy trabajan de forma aislada, cada una probada por
separado, sin bus de eventos real que las conecte — el diseño existe desde
hace días, la conexión real no.

## 2. La cultura de gobierno, que es el activo menos visible y más valioso

Lo que distingue esta sesión (y varias anteriores, a juzgar por la memoria del
proyecto) no es la cantidad de código escrito, es la disciplina alrededor de
él: **nunca fiarse de la confianza autodeclarada de un worker**, verificar con
adversariales fuera del propio criterio del que hizo el trabajo, corregir en
público los propios errores de indexado en vez de enterrarlos, preferir un
"no lo sé" a una respuesta inventada. Esto se ha probado hoy con tres workers
distintos y ha aguantado los tres. Es un activo real, no una anécdota — es lo
que ha permitido delegar trabajo real sin que un solo error silencioso llegue
a producción.

## 3. Fragilidades reales encontradas hoy (no teóricas)

- **Git local puede divergir de lo publicado de verdad**, confirmado con un
  caso real (`PanelClientesService.js`) — cualquier automatización que asuma
  que el checkout es la fuente de verdad hereda ese riesgo.
- **El dato de seguimiento (`LIBRERIA_VERSION` en el Sheet) puede mentir**
  sin que nadie lo note — encontrado con un desfase real en producción.
- **La automatización de navegador no es fiable todavía** para acciones que
  disparan `google.script.run` desde menús anidados — fallo reproducible, sin
  causa raíz identificada aún.
- **El paralelismo real de procesos** necesita herramientas que lo hagan de
  verdad (`run_in_background`), no comandos de shell improvisados — ya
  corregido, pero fue un fallo silencioso la primera vez.
- **`git worktree`** hace falta en cuanto dos workers tocan el mismo repo a
  la vez — confirmado con un cruce real, sin daño, pero real.

Ninguna de estas es grave por sí sola. Juntas, dibujan un patrón: el
ecosistema ha crecido más rápido que su propia instrumentación de
verificación de estado. Eso es exactamente lo que esta sesión ha empezado a
arreglar.

## 4. Propuesta de líneas de trabajo

Organizada por horizonte, no por prioridad rígida — la generosidad de la
propuesta está en poner todo lo que tiene sentido sobre la mesa, no en
fingir que hay que hacerlo todo a la vez.

### A. Cerrar lo empezado esta sesión (bajo riesgo, alto valor, ya diseñado)

1. **`tools/chequear_libreria_clientes.mjs`** — detección de desfase de
   librería en todos los clientes reales, mismo patrón que
   `salud_ecosistema.mjs`. Diseño ya validado esta noche.
2. **Sistema de regeneración de envoltorios con fuente viva** (no git local)
   — diseño ya corregido tras encontrar la divergencia real; construirlo con
   el mismo rigor de verificación de esta noche (modo diagnóstico primero,
   diff antes de push).
3. **Migrar los scripts de esta sesión** (`cerrar-ciclo.mjs`, los de
   triaje/auditoría) de la carpeta temporal del scratchpad a `tools/` del
   repo real, con nombre y sitio permanentes — si no, se pierden en el
   próximo reinicio.
4. **Convertir la cola de `99_TRIAGE_LOCAL`** (10-11 candidatas reales, ya
   verificadas) en incidencias formales y lanzar el primer lote de verdad a
   Codex/DeepSeek — la razón de ser de todo lo demás.
5. **Investigar por qué el clic de menú automatizado no dispara la acción**
   en Sheets — desbloquea automatizar el resto del ciclo de actualización de
   librería, o confirma que se queda como límite humano conocido.

### B. Sistematizar el ecosistema de workers (el hallazgo central de hoy)

6. **Bus de eventos vía Sheet** — diseñado hace días, nunca construido; hoy
   ya hay datos reales de qué tipo de tarea encaja en qué worker para
   diseñarlo con criterio, no a ciegas.
7. **Panel de coste/tiempo real por worker** — hoy son scripts sueltos que
   imprimen duración; consolidarlo en algo visible (pestaña Sheet o Consola)
   para la calibración de capacidad que ya se pidió esta noche.
8. **Regla de reparto de trabajo entre workers**, ya esbozada esta noche:
   rutinario/bajo riesgo → local; acotado con criterio objetivo → Codex/
   DeepSeek con verificación obligatoria; decisión de alcance abierto → nunca
   delegado.

### C. Robustecer la infraestructura descubierta hoy

9. **Documentar el patrón de autenticación** (JWT de cuenta de servicio para
   Sheets, refresco de token OAuth de usuario vía `clasp`) como referencia
   reutilizable — hoy vive solo en los scripts sueltos de esta sesión.
10. **`git worktree` por rama/worker** como requisito, no opcional, antes de
    escalar el piloto de dos ramas a más de dos workers en paralelo.

### D. Trabajo de producto real, más allá de la infraestructura de IA

11. **Cerrar las incidencias reales ya verificadas esta noche** (CSV export,
    modo oscuro, adjuntar imagen, webhook de mensajes largos, antigüedad en
    Consola, Graphify TargetLimit, Consola bloqueada, informes sin filtrar
    nivel de dato, código muerto, `MiTrabajoService.js` sin filtro `ACTIVO`).
12. **Auditoría de Fase 2 más amplia del patrón `filtrarPorNivelDato_`** —
    hoy se validó como un patrón real y recurrente (2 casos confirmados),
    vale la pena mirar si hay más.
13. **Revisar el paquete de incidencias estratégicas** (INC-0056 ecosistema
    híbrido, INC-0057 metodología, INC-0058 producto local) con la
    infraestructura nueva como apoyo, no como sustituto de la decisión
    humana que esas tres siguen necesitando.

## 5. Lo que deliberadamente no propongo

No propongo automatizar el cierre de jornada de Ejecutor de punta a punta, ni
delegar la actualización de librería con regeneración de envoltorios sin la
verificación en modo diagnóstico primero, ni ampliar el número de workers en
paralelo antes de resolver `git worktree`. Es la misma disciplina de toda la
sesión: la generosidad de esta propuesta está en el volumen de trabajo
identificado, no en saltarse la verificación que lo ha hecho posible.
