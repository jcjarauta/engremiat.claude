# Roadmap: Ecosistema Engremiat de Desarrollo (Claude + IA local + agentes)

Consolidación de la conversación de asesoría técnica del 2026-08-20, tras un
día completo de experimentación real (no teórica): Graphify extendido a
todo el código de producción, 10+ intentos reales de worker local
(Cline+Ollama, luego Aider+devstral-dev), permisos de Claude Code
configurados, e investigación documentada sobre las capacidades reales
de Claude Code/Agent SDK. Este documento no sustituye a `VISION_MISION.md`
(la visión de largo plazo de Engremiat) ni a `ROADMAP_PROYECTO_0.md` (usar
el propio Gestor de Proyectos para organizar el desarrollo) -- es la capa
que falta entre ambos: **cómo se organiza, técnicamente, el trabajo de
desarrollar Engremiat cuando quien ejecuta ya no es solo un humano
escribiendo código, ni solo Claude, sino un ecosistema de agentes de
distinta naturaleza**.

## Por qué esto encaja con la visión, no es un desvío

`VISION_MISION.md` dice: la crisis no es escasez de recursos, es
desconexión entre oferta y demanda -- hacer visible la relación
necesidad-capacidad, proponer encajes, responder a un hueco de capacidad
con formación antes que con extracción, y usar la salida al mercado
como sensor, no como fracaso.

Aplicado al propio desarrollo de Engremiat:

- **Necesidad**: cientos de TAREAs futuras (código, documentación,
  eventualmente vídeo) que hoy solo puede ejecutar Claude, uno a uno.
- **Capacidad disponible pero infrautilizada**: una GPU de 16GB en local,
  parada la mayor parte del día.
- **El encaje que se intentó hoy**: delegar trabajo mecánico a esa GPU
  para liberar a Claude. Se probó en serio (no de boquilla) y el
  resultado real fue: **el worker local hoy no sustituye a Claude, pero
  sí puede aportar como borrador supervisado en tareas de código, y el
  mismo patrón se extiende a otros tipos de contenido**.
- **La salida al mercado (API de pago tipo DeepSeek) como sensor, no
  como fracaso**: si algún día la fiabilidad local no basta para una
  tarea que de verdad importa, pagar una API barata no es rendirse --
  es la señal de qué capacidad merece la pena seguir madurando en local
  (mejor modelo, mejor harness) antes de la próxima vez.

## Las cinco capas del ecosistema

Esto no es una arquitectura nueva que construir de cero -- es nombrar y
conectar piezas que ya existen, la mayoría ya construidas hoy:

```text
1. INTENCIÓN     -- Gestor de Proyectos (Sheet): Incidencia -> Tarea
                     Ya construido y verificado en vivo (INC-0001, INC-0003).
                     No hace falta un backlog/Kanban nuevo -- ya existe.

2. CONTEXTO       -- Graphify (selector de contexto estructural local)
                     Ya extendido a los 78 ficheros .js de producción.
                     Hoy: solo código. Sin equivalente aún para docs/vídeo.

3. EJECUCIÓN      -- El worker que produce el borrador, INTERCAMBIABLE
                     según el tipo de tarea (ver tabla abajo).

4. SUPERVISIÓN    -- Claude Code: revisa, verifica contra el diff/archivo
                     REAL (nunca contra lo que el worker dice que hizo),
                     corre los gates, publica.

5. PERMISOS       -- Claude Code settings.json (defaultMode=acceptEdits +
                     allow/deny), Agent View para revisar en lote lo que
                     sí necesita decisión humana.
```

Las capas 1, 2, 4 y 5 son estables y ya funcionan. La capa 3 (ejecución)
es la que se elige por tipo de tarea, hoy y en el futuro:

| Tipo de TAREA | Worker hoy | Estado | Disciplina de seguridad |
|---|---|---|---|
| Código (`.js`) | Aider + `devstral-dev` (local, `--dry-run`) | Sugiere borrador, Claude aplica | `sugerir-parche.sh`, nunca aplica solo |
| Código, contenido puro (`.html`/texto) | Aider + `devstral-dev` (local, aplica directo) | Validado, bajo riesgo | `lanzar-aider.sh`, worktree aislado + diff obligatorio |
| Documentación | *(sin worker asignado todavía)* | No construido | Mismo patrón: brief -> borrador -> Claude revisa -> publica |
| Vídeo / imagen | *(sin worker asignado todavía)* | No construido | Mismo patrón, ningún atajo por ser otro medio |
| Código/tarea que de verdad importa y lo local falla | API barata (p.ej. DeepSeek V4-Flash) | Evaluado, no activado | Misma disciplina -- un worker más caro no se libra de la revisión |

**El punto importante**: la capa de ejecución es un enchufe, no una
decisión permanente. Mañana, para "generar un documento", el "worker"
podría ser otro modelo local, una API de generación de documentos, o
Claude mismo con una herramienta de composición -- el brief
(`puente-cline/tareas/*.md`), la disciplina de verificación, y el
publicado final por Claude **no cambian**. Por eso este documento se
llama "ecosistema", no "integración con Aider" -- Aider es una pieza
reemplazable de la capa 3, no el centro del diseño.

## Lo que hoy sabemos de verdad sobre la capa de ejecución local

Sin adornar el resultado (ver `13_INCIDENCIAS!INC-0004` para el
historial completo, 10+ intentos reales):

- **No hay ahorro demostrado de tokens Claude todavía.** Para poder
  acotar un brief lo bastante preciso, Claude ya tuvo que leer y
  entender el código -- el ahorro solo llegaría en tareas donde el
  worker pueda trabajar sin ese preanálisis, algo aún no demostrado.
- **El worker local no es fiable como aplicador autónomo** (falla
  produciendo diffs exactos sobre código real; en un caso reescribió
  695 de 700 líneas de un archivo real por interpretar mal un atajo).
  `--edit-format diff` + `--dry-run` lo hacen SEGURO (nunca corrompe
  nada), no FIABLE (no siempre acierta).
- **Sí aporta como sugeridor de borrador**, con Claude siempre
  verificando contra el archivo real antes de aplicar -- primer éxito
  real en TAR-0006.
- **El ahorro real hoy es de tiempo de reloj y cómputo GPU ocioso**, no
  necesariamente de tokens Claude -- un beneficio legítimo, pero
  distinto del que se buscaba al principio.

## Lo que Claude Code soporta de verdad (no lo que suena bien)

Investigado contra la documentación oficial, no supuesto:

- **Agent View / `claude --bg`**: sesiones Claude independientes en
  paralelo, cada una en su worktree, se pueden retomar/supervisar. Real,
  documentada, es la pieza que permite "dejar trabajando y revisar al
  volver".
- **Subagentes** (`.claude/agents/*.md`): especialistas dentro de una
  sesión, heredan permisos del padre automáticamente. Reales, maduros.
- **Permisos por capas**: `~/.claude/settings.json` (todo proyecto) +
  `.claude/settings.json` (este proyecto) -- el mecanismo real de
  "agrupar" reglas sin duplicarlas.
- **Agent Teams**: existe, pero el propio Anthropic lo marca
  experimental y desactivado por defecto -- no construir la arquitectura
  encima de esto todavía.
- **Cola de aprobaciones pendientes en lote**: NO existe. Cuando una
  sesión en segundo plano necesita permiso, se bloquea indefinidamente
  (no falla, no expira) hasta que alguien la atiende -- Agent View
  agrupa las que están esperando para revisarlas en una sola pasada al
  volver, que es la aproximación práctica real a "dar permisos en
  bloque", aunque no una cola persistente de verdad.
- **Claude Agent SDK**: real, en producción, para construir un agente
  propio fuera de la CLI (p.ej. un daemon que lea el Kanban del Sheet y
  dispare sesiones Claude solo). Requiere ingeniería propia y se factura
  por API -- no es una casilla que se marca, es un proyecto en sí mismo.

## Qué NO construir todavía (deliberado, no olvido)

Mismo criterio que ya rige todo el roadmap de Engremiat: no construir
por delante de necesidad demostrada.

- Agent Teams (experimental, desactivado por Anthropic mismo).
- Cola de aprobaciones -- no existe, y construirla a medida sobre el
  Agent SDK es un proyecto propio sin demanda validada aún.
- Worker de documentación o vídeo -- ningún caso real que lo pida
  todavía. El enchufe queda preparado (capa 3 es intercambiable), pero
  no se elige proveedor sin una tarea real que lo justifique.
- Daemon con Agent SDK que dispare Claude automáticamente desde el
  Sheet -- coherente con "Fase 5 -- Red de nodos" ya marcada como
  propuesta-no-construida en `ROADMAP_GESTOR_PROYECTOS_CLIENTE_VENTAS.md`.

## Próximos pasos concretos, en orden

1. Mover las reglas de permisos genéricas (no específicas de Engremiat)
   a `~/.claude/settings.json` -- ya decidido, pendiente de ejecutar.
2. Seguir usando `sugerir-parche.sh` en las próximas TAREAs de código
   real que surjan del Kanban, para acumular más datos (hoy: 1 éxito de
   1 intento real tras el fix -- muestra insuficiente para confiar del
   todo).
3. Cuando aparezca la primera necesidad real de documentación generada
   (no antes), diseñar el worker de esa capa con el mismo criterio de
   hoy: probar en real, medir fallos, documentar en incidencia, decidir
   con datos.
4. Revisar este documento cuando haya 5-10 tareas reales más pasadas
   por `sugerir-parche.sh` -- con esa muestra, decidir si el worker
   local se promueve a aplicador directo en más casos, o si se confirma
   la vía de API barata para lo que de verdad necesite autonomía.
