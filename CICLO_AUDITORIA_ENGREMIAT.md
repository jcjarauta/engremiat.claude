# Ciclo de auditoría Engremiat -- 4 patas

Dinámica de trabajo consolidada a partir de lo aplicado en los ciclos 1 y
2 (2026-08-20). Cuatro pasadas distintas porque cada una encuentra una
clase de defecto que las otras tres no ven -- código correcto no implica
comportamiento correcto con datos reales, y ninguno de los dos implica
una interfaz usable. Ver también `ROADMAP_ECOSISTEMA_AGENTICO.md` (marco
general Claude-local-worker) y `GUIA_DISENO_ENGREMIAT.md` (checklist de
la pata 4).

## Las 4 patas

### Pata 1 -- Código

- **Busca**: campos obsoletos, deriva copia-pega entre módulos hermanos,
  fallos silenciosos, funciones que crashean en un caso real,
  desconexión de catálogos/esquemas.
- **Quién ejecuta**: subagentes `general-purpose` en paralelo, uno por
  lote de módulos (2-3 módulos cada uno), nunca `Explore` -- hace falta
  juicio, no solo localizar código.
- **Criterio de hallazgo válido**: solo defectos objetivamente
  verificables, anclados a fichero:línea, con escenario de fallo
  concreto. Nunca opinión de arquitectura ni "esto podría ser mejor".
  Máximo 3-6 hallazgos por lote.
- **Se registra como**: INCIDENCIA, `ORIGEN_CREACION` = "Revisión de
  código".

### Pata 2 -- Integración entre módulos

- **Busca**: si los mecanismos transversales que YA EXISTEN en código
  (NivelDatoService, CosteService, EvidenciaSocialService,
  DesviacionService...) están bien conectados por los módulos que
  deberían usarlos, o si quedaron huérfanos. No inventa features de
  sinergia nuevas -- eso sería construir por delante de necesidad
  demostrada.
- **Quién ejecuta**: un subagente dedicado, con la lista concreta de
  mecanismos a verificar (grep en las 2 direcciones, confirmar con
  lectura real antes de reportar un hueco).
- **Criterio de hallazgo válido**: "conectado correctamente, verificado
  en fichero:línea" o "hueco confirmado, sin resultados en grep de [X]".
  Nunca reportar un hueco sin haberlo verificado.
- **Se registra como**: INCIDENCIA, `ORIGEN_CREACION` = "Revisión de
  código" (misma pata que código en la práctica, ya que ambas parten de
  lectura estática) -- los hallazgos de integración suelen ser de alcance
  mayor (Media/Alta prioridad, marcados "pendiente de diseño" si no son
  un fix mecánico).

### Pata 3 -- Comportamiento con datos simulados

- **Busca**: bugs que solo aparecen ejecutando de verdad -- cálculos
  raros con números reales, timeouts con volumen, fricción de un flujo
  completo de principio a fin.
- **Quién ejecuta**: Claude con el Browser, contra el Sheet real de
  gestor-proyectos, usando SOLO datos marcados como piloto (
  `InstaladorDatosPruebaPiloto.js`/`InstaladorDatosPruebaPilotoAmpliado.js`,
  `esPrueba`/`pruebaId` ya soportados por `insertarRegistroTransaccional`,
  filtrado por `incluirPruebas` ya existente en PanelTemporal).
- **Guardarraíl no negociable**: nunca ejecutar un flujo con efecto
  irreversible fuera del propio Sheet (aprobar una solicitud de montaje
  real crea un proyecto de Google Cloud de verdad) ni disparar el bot de
  Telegram real o un correo real sin avisar antes -- esos flujos quedan
  fuera de esta pata salvo petición explícita.
- **Se registra como**: INCIDENCIA, `ORIGEN_CREACION` = "Prueba
  funcional".

### Pata 4 -- Diseño

- **Busca**: inconsistencia visual/de interacción objetiva, contra
  `GUIA_DISENO_ENGREMIAT.md` (WCAG 2.1/2.2 AA + heurísticas de Nielsen +
  convención propia del proyecto ya establecida en `Estilos.html`/
  `ModalConfirmar.html`).
- **Quién ejecuta**: Claude con el Browser, inspección visual real de
  paneles (no solo lectura de HTML).
- **Criterio de hallazgo válido**: citar el criterio concreto incumplido
  (p.ej. "WCAG 1.4.3" o "NN/g -- Consistencia y estándares"), nunca gusto
  personal. Se aprovechan los flujos ya ejercitados en la pata 3 en vez
  de auditar cada panel suelto desde cero.
- **Se registra como**: INCIDENCIA, `ORIGEN_CREACION` = "Diseño".

## Triage común (después de las 4 patas)

Mismo criterio ya validado en los ciclos 1 y 2: cada hallazgo se clasifica

- **Delegable al worker local** (`sugerir-parche.sh`): cambio mecánico,
  1-3 líneas, un solo fichero o el mismo patrón repetido en varios
  ficheros idénticos (ver INC-0012/INC-0025).
- **Claude directamente**: refactor, integración entre módulos, cambio de
  flujo, o cualquier cosa marcada "pendiente de diseño" en la propia
  incidencia.

## Cadencia

No hay disparador automático -- deliberado, mismo principio que ya
aplicamos con el worker local y el daemon del Agent SDK (no construir
automatización sin necesidad demostrada). El ciclo se lanza cuando el
usuario lo pide o cuando la cola delegable se vacía y toca decidir el
siguiente lote. Las 4 patas no tienen por qué correr siempre juntas -- se
puede lanzar solo la pata 1 sobre un módulo nuevo, o solo la pata 4 sobre
un panel concreto.

## Cierre de ciclo

Mismo correo de siempre (`notificar_operador`, con `cuerpoHtml`), con una
sección por pata que haya corrido: terminadas (con cómo probarlas),
pendientes (con su origen), siguiente paso sugerido.

## Revisión de la propia dinámica

Después de unos cuantos ciclos completos, revisar si alguna pata deja de
aportar señal real (p.ej. si "diseño" deja de encontrar nada verificable
en varias pasadas seguidas) -- en ese caso espaciarla en vez de correrla
en cada ciclo por inercia. Mismo principio de "medir antes de asumir" que
ya aplicamos con el propio worker local (`puente-cline/metricas.md`).
