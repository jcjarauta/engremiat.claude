# Valoración global de Engremiat y propuesta de siguientes fases

**Fecha:** 2026-08-25 (actualizado tras la primera delegación real contra producción)
**Contexto:** esta sesión pasó de validar el ecosistema de workers en un piloto
aislado a ejecutar, por primera vez, un lote real de 8 incidencias contra el
repo de producción (`jcjarauta/engremiat.claude`), repartido entre DeepSeek y
Claude, en dos ramas separadas por `git worktree`. Este documento actualiza la
valoración anterior con ese resultado y propone las fases siguientes.

## 1. El dato que cambia la conversación: 7 de 8, con el fallo cazado antes de llegar a ningún sitio

Primer lote real: 8 incidencias delegables, repartidas sin solapamiento de
ficheros entre dos ramas aisladas. Resultado, verificado una por una antes de
commitear cualquier cosa:

- **7 de 8 resueltas y verificadas** (INC-0060, 0052, 0059 por DeepSeek;
  INC-0053, 0005, 0033 por Claude tras reasignación práctica).
- **1 de 8 rechazada** (INC-0036) por diagnóstico inventado — se detectó
  *antes* de aplicarse, no después.
- **1 de 8 deliberadamente aparcada** (INC-0034) por ser una funcionalidad
  nueva con superficie de seguridad real, no un bug — decisión consciente,
  no un olvido.
- Dentro de las 7 "correctas", uno de los fixes de DeepSeek (INC-0060)
  llevaba un error real (`'SI'` sin tilde en vez de `'SÍ'`) que habría dejado
  la vista "Mi trabajo" sin ninguna tarea — corregido antes de commitear,
  no después de que alguien lo notara en producción.

Esto no es una anécdota de una noche: es el primer dato duro de tasa de
acierto de un lote real, con la disciplina de verificación funcionando
exactamente como se diseñó — detectando el 12.5% que estaba mal antes de que
tocara `main`. Es la validación que le faltaba a todo el diseño de las
sesiones anteriores.

## 2. Dónde está Engremiat de verdad hoy

**El producto**: dos clientes reales (La Troballa, Gestor de Proyectos), core
estable, siete Fichas con patrón consistente (ahora con exportación CSV
completa en las siete, cerrado hoy), modo oscuro real ya implementado,
sistema de incidencias con disciplina de causa raíz.

**El ecosistema agéntico**: ha pasado de "cuatro piezas probadas por
separado" a "un lote real ejecutado con dos de ellas trabajando en paralelo
sobre el mismo repo, sin pisarse". Sigue sin bus de eventos automático — hoy
la orquestación (reparto, ramas, verificación) la hace Claude a mano cada
vez — pero ya no es una limitación teórica de diseño, es la única pieza que
falta para que el ciclo completo sea repetible sin supervisión constante.

## 3. La cultura de gobierno, confirmada con un caso real de esta misma noche

La regla "nunca fiarse de la confianza autodeclarada, verificar siempre
contra el código real" no es ya un principio abstracto — esta noche impidió
que un bug real (INC-0060 mal corregido) llegara a `main`. Es el mecanismo
que hace que delegar trabajo real a workers externos sea seguro, y acaba de
demostrarlo con un caso concreto, no con una promesa.

## 4. Fragilidades que siguen abiertas

- **`git local` puede divergir de lo publicado de verdad** (confirmado con
  `PanelClientesService.js`) — sigue sin resolverse el sistema de
  regeneración de envoltorios con fuente viva, diseñado pero no construido.
- **La automatización de navegador sigue sin ser fiable** para acciones que
  disparan `google.script.run` desde menús anidados — causa raíz no
  identificada.
- **INC-0036 sigue sin diagnóstico real** — dos workers distintos (worker
  local y DeepSeek) han fallado con la misma intuición equivocada. Merece
  una investigación dedicada, no un tercer intento delegado a ciegas.
- **Todavía no existe el bus de eventos** — el reparto de esta noche fue
  manual, funcionó, pero no escala sin que alguien (Claude o el operador)
  lo orqueste cada vez.

## 5. Propuesta de siguientes fases

### Fase 0 — Cerrar lo de esta noche (inmediato)

1. **Revisar y fusionar `lote1-deepseek` y `lote1-codex` a `main`** — el
   trabajo ya está hecho y verificado, falta el visto bueno final y el
   merge.
2. **Investigar INC-0036 como caso dedicado** — dos fallos del mismo tipo ya
   son patrón, no casualidad. Vale la pena mirar el código de
   `MailApp.sendEmail` con más profundidad, quizás con datos reales de la
   plataforma, antes de un tercer intento de fix.

### Fase 1 — El bus de eventos vía Sheet (la pieza que de verdad falta)

3. Con el patrón de esta noche ya probado (reparto determinista por
   ficheros, un commit por incidencia, verificación antes de merge),
   construir el mecanismo real de reclamación en `13_INCIDENCIAS` —
   convertirlo en repetible sin que Claude tenga que orquestar cada paso a
   mano.
4. **Panel de coste/tiempo real por worker**, alimentado por los datos que
   ya se generaron esta noche (duración por incidencia, tasa de acierto por
   worker) — la primera vez que hay datos reales suficientes para diseñarlo
   con criterio en vez de a ciegas.

### Fase 2 — Ampliar el volumen de trabajo real

5. **INC-0034** (adjuntar imagen a Incidencia) como su propio ciclo de
   diseño — decidir dónde vive el archivo en Drive, cómo se limita el
   tamaño, y solo entonces delegar la implementación.
6. **`chequear_libreria_clientes.mjs` en cadencia regular** (ya construido y
   verificado esta noche) — que el próximo desfase de librería se detecte
   solo, no por una investigación puntual.
7. **Auditoría de Fase 2 ampliada del patrón `filtrarPorNivelDato_`** — ya
   van 2 casos confirmados reales (INC-0052, INC-0059) sobre una muestra
   pequeña de módulos auditados; probable que haya más.

### Fase 3 — Robustecer lo que ya se rompió una vez esta noche

8. **Sistema de regeneración de envoltorios con fuente viva** (no git
   local) — diseño ya corregido tras encontrar la divergencia real,
   pendiente de construir con la misma disciplina de modo-diagnóstico-antes-
   de-aplicar.
9. **Investigar el fallo del clic de menú automatizado** en Sheets — o
   aceptarlo formalmente como límite humano conocido si no se encuentra
   causa raíz en un tiempo razonable.

### Fase 4 — Producto, más allá de la infraestructura de IA

10. **Revisar el paquete de incidencias estratégicas** (INC-0056 ecosistema
    híbrido, INC-0057 metodología, INC-0058 producto local) con la
    infraestructura ya probada como apoyo real, no como promesa.
11. **Nivel 2/3 del modelo de producto** (hardware local, API de pago) —
    retomar con la evidencia de esta noche de que la delegación real
    funciona y a qué coste/tasa de acierto.

## 6. Lo que deliberadamente sigue sin proponerse

No propongo fusionar las ramas de esta noche sin revisión humana, ni un
tercer intento de INC-0036 sin investigación real, ni construir el bus de
eventos delegando su propio diseño a un worker. La generosidad de esta
propuesta sigue estando en el volumen de trabajo puesto sobre la mesa, no en
saltarse la verificación que acaba de demostrar, con un caso real esta misma
noche, por qué existe.
