# Relevo completo -- jornada 2026-08-31

Informe de cierre de toda la sesión, para decisión del promotor.
Enlaza al detalle real en cada documento -- este informe es la síntesis,
no la duplica.

## 1. Resumen ejecutivo

Sesión larga, arrancó documentando y revisando ~50 documentos del
proyecto, y terminó con un laboratorio real de investigación (Vigilia/
Concilio) construido, probado, conectado al gobierno real del Sheet, y
con un primer benchmark serio entre worker local y APIs de pago. Todo
lo de esta noche está commiteado en `engremiat.claude` (ver commits
desde `f43529d` hasta el cierre de este informe).

**Lo más importante para decidir hoy**: el camino API (DeepSeek+GPT) es
~50-100x más rápido y prácticamente gratis a esta escala (~$0,001/
elemento) -- pero **tanto el worker local como DeepSeek fabrican
capacidades de sistema que no existen** cuando sintetizan (no solo
nombres de campo, que sí detectamos). El verificador determinista no
cubre ese tipo de error todavía. Esto debe pesar en la decisión de
lanzar el próximo ciclo amplio con API.

## 2. Infraestructura construida y probada esta noche

- **VPS Hetzner (CX23, Helsinki)** con n8n+Baserow, en Tailscale, sin
  exposición pública directa. Baserow real migrado desde la Pi
  (verificado con datos reales).
- **Ciclo remoto de la Pi probado de extremo a extremo**: enchufe
  inteligente (sin SAI, causa real del fallo anterior) → webhook de
  despertar el PC por WoL → apagado seguro remoto → backup diario
  autónomo (espera arranque, hace backup, apaga sola).
- **Docker Desktop y LiteLLM** se habían caído en el reinicio de esta
  noche -- diagnosticados y arreglados (LiteLLM: error de codificación
  UTF-8 en su banner de arranque en consola Windows).
- Detalle completo: `INFRAESTRUCTURA.md`.

## 3. Laboratorio Vigilia/Concilio -- mecanismos nuevos, todos probados con casos reales

- **Verificador determinista**: compara afirmaciones de campo/tabla
  contra el esquema real de Baserow, acotado por tabla relevante.
  Probado contra una fabricación conocida (10/10 detectada) y contra
  una respuesta sólida (sin falsos positivos). Cableado en producción,
  en `tools/verificador_determinista.mjs`.
- **Lock de concurrencia real**: campo `PROCESANDO_DESDE` + nodo de
  bloqueo, cierra de verdad el bug de condición de carrera que llevaba
  toda la noche solo mitigado. Probado con una carrera real (dos
  disparos simultáneos, cada uno cogió un elemento distinto).
- **`OLLAMA_NUM_PARALLEL=2`**: paralelismo real confirmado en el
  worker local (dos ejecuciones simultáneas, ambas correctas).
- **Acervo Prompter**: convierte necesidad vaga + contexto real en
  pregunta de Vigilia estructurada (meta-prompting). Motor DeepSeek,
  ~4s/pregunta. Encontró y corrigió su propio bug en la primera prueba
  (confundía tabla del Sheet con tabla de Baserow).
- **Grafo de documentación real**: `DOCUMENTO_ENGREMIAT` (46 filas,
  campo `PROYECTO` reveló que la mayoría del corpus es de La Troballa,
  no del núcleo), vault de Obsidian generado desde ahí (dentro de
  Drive, sin plugin de sync de riesgo), grafo Mermaid publicado.
- Detalle completo: `TELAR.md` (seguir desde "Vigilia sobre plantillas
  de Capa 2" hasta el final).

## 4. Conexión al gobierno real (no un sistema paralelo)

- **Corrección de fondo**: la Consola/Mesa de Revisión no es
  redundante con Vigilia -- es el panel de control del Ejecutor
  (activo hace 3 días, no 9 como parecía a primera vista).
- **Decisión explícita del promotor**: migrar el gobierno de
  Ejecutor+Consola hacia el Holon, en 4 fases, **no ejecutada** --
  documentada como objetivo de fondo.
- **Protocolo probado con un caso real**: `INC-0067` registrada en
  `13_INCIDENCIAS` del Sheet real, siguiendo el propio protocolo de
  `PROMPT_EJECUTOR.md` (Claude registra lo que el Ejecutor no puede
  escribir). El Ejecutor la recogerá en su próximo ciclo normal.

## 5. Benchmark real: worker local vs. DeepSeek-solo vs. híbrido

Mismas 13-14 preguntas (pendientes de la jornada + recorrido completo
de FCAFA-TDAH por las 7 estaciones de la Rueda del Gremio), lanzadas
por caminos distintos.

| Camino | Tiempo/elemento | Coste/elemento | Calidad (revisado a mano) |
|---|---|---|---|
| Worker local + síntesis DeepSeek (híbrido) | minutos | ~gratis (electricidad) | Buena en campos/tablas, **pero también fabrica capacidades de sistema inexistentes** (ver PEND1 abajo) |
| DeepSeek solo (propone+sintetiza) | 14,1s | ~$0,0009 | Peor -- 11/13 marcadas contaminadas por GPT, comprobado a mano que el veredicto era correcto en los casos revisados |

**Hallazgo honesto, no solo el titular positivo**: revisando a mano
`PEND1` del worker local (el camino que creíamos mejor), la síntesis
de DeepSeek afirma que *"el Sheet 13_INCIDENCIAS opera con relaciones
transversales y consultas en tiempo real"* -- **eso no existe**, lo
único real es el puente manual que hago yo. El verificador determinista
no lo detecta porque no es un nombre de campo inventado, es una
capacidad de sistema inventada con el mismo tono seguro. **El híbrido
reduce la fabricación de nombres de campo, no la fabricación de
arquitectura/capacidades.** Esto es una limitación real, no resuelta
esta noche, y pesa en cualquier decisión de automatizar más sin
Relevo humano de por medio.

## 6. Datos reales de coste, tokens y tiempo (lo pedido explícitamente)

**Del pipeline de producción real (`GASTO_API`, hoy completo)**:
- 104 líneas de gasto reales.
- Coste total: **$0,08647**.
- Tokens entrada/salida: **85.681 / 39.657**.
- Por modelo: `deepseek-chat` $0,08411 · `gpt-5.6-luna` $0,00237.
- (No incluye el worker local -- sin coste de API, solo electricidad,
  no medida.)

**Del benchmark aparte (13 preguntas, DeepSeek+GPT, script fuera de
producción)**:
- Tiempo total del lote: 183,9s (14,1s/elemento de media).
- Tokens DeepSeek entrada/salida: 16.349 / 11.597.
- Coste: ~$0,0095 DeepSeek + ~$0,0024 GPT = **~$0,012 el lote**.

**Coste total real de la sesión en APIs de pago (producción +
benchmark + Acervo Prompter)**: aproximadamente **$0,10**.

## 7. Resultados honestos de los lotes de esta noche (worker local)

- **PEND1** (contradicción OBS1/OBS3 sobre estaciones como metadato o
  carpetas): resuelta a favor de metadato -- **pero con la fabricación
  de capacidades ya señalada en la sección 5**. No usar tal cual sin
  limpiar esa afirmación.
- **PEND2** (criterio de subdivisión en subcarpetas): 30 documentos
  como umbral -- razonable, sin banderas rojas detectadas.
- **PEND3** (diseño del Acervo Prompter): coincide en líneas generales
  con lo que ya construimos y probamos por separado -- confirma que el
  diseño real convergió con lo que la propia Vigilia habría propuesto.
- **PEND4** (primer paso barato para Cuadrilla v2): propone un piloto
  manual de 48h con 1-2 incidencias reales -- razonable, no construido.
- **PEND5** (esquema Baserow para Fase 2 Ejecutor→Holon): propone 3
  tablas interconectadas -- sin verificar campo por campo, pendiente de
  revisión antes de construir nada.
- **PEND6** (conectar Graphify): propone un "puente" sin detalle
  técnico suficiente -- floja, necesitaría una segunda pasada.
- **FCAFA1-6**: las 6 estaciones respondidas con contenido concreto y
  anclado (ficha de Oportunidad, sesión de co-creación, autoridad de
  Relevo compartida, campos de Cronista, rol del Ejecutor como
  "cerebro humano", panel de Pregonero) -- sin verificación exhaustiva
  campo por campo todavía, pero sin fabricaciones obvias detectadas en
  la revisión rápida.
- **FCAFA7** (Ágora): **sin terminar** -- ver sección 8.

## 8. Pendientes reales, sin resolver

- **`FCAFA7` y `PROMPTER-TEST1` bloqueadas sin resultado** -- el worker
  local parece agotado tras horas de carga sostenida (GPU al 95%
  durante gran parte de la noche). No forzado más -- pendiente de
  reintentar cuando el worker se libere, o de mover manualmente a
  DeepSeek.
- **Fabricación de arquitectura/capacidades no detectada por el
  verificador determinista** (sección 5) -- el hueco más importante a
  cerrar antes de confiar en cualquier automatización mayor.
- **Verificador determinista sigue sin detectar campos de una sola
  palabra** (`INC-0067`, ya en la cola real del Ejecutor).
- **`PEND1`, `PEND5`, `PEND6` necesitan limpieza/revisión** antes de
  usarse como base de nada.
- Enchufe inteligente de la Pi: confirmado que el problema real era el
  SAI, no el enchufe -- sin más pruebas de estabilidad a largo plazo.
- Migración Ejecutor+Consola→Holon: decidida, no ejecutada (4 fases
  esbozadas en `TELAR.md`).

## 9. El hueco de la sección 5 -- cerrado tras escribir este informe

Justo después de escribir la recomendación de abajo, se construyó y
probó la segunda capa que pedía: **verificador de capacidades**
(`tools/verificador_capacidades.mjs`) -- extrae afirmaciones de
capacidad/arquitectura de un texto (con DeepSeek, no hay patrón regex
posible para lenguaje natural) y comprueba cada una contra un
**catálogo real de mecanismos** (extensión de `DOCUMENTO_ENGREMIAT`
con `TIPO: mecanismo_real`, 10 mecanismos reales sembrados de esta
misma noche), no contra el juicio libre de otra IA.

**Probado con dos controles cruzados**: contra `PEND1` (la fabricación
ya conocida) -- las 4 afirmaciones extraídas, ninguna coincide con el
catálogo real, correctamente marcadas. Contra un control positivo (3
afirmaciones sobre mecanismos reales + 1 claramente inventada) -- las
3 reales reconocidas con el nombre exacto del catálogo, la inventada
correctamente sin coincidencia.

**Limitación honesta**: la extracción y la comprobación siguen usando
DeepSeek (no hay forma determinista de parsear lenguaje natural) -- lo
que se mantiene determinista es que la comprobación final es contra
una **lista cerrada y real**, no contra el criterio libre de otra IA.
Es una mitigación real, no una solución perfecta. El catálogo necesita
mantenerse -- cada mecanismo nuevo que se construya debe añadirse ahí.

## 10. Recomendación para el próximo ciclo amplio con API

Con el verificador de capacidades ya construido y probado, el hallazgo
de la sección 5 deja de ser un bloqueo total -- pero **el catálogo de
mecanismos reales tiene que mantenerse al día** para que siga
funcionando. Antes de lanzar un ciclo grande con DeepSeek+GPT como
motor principal, aplicar ambos verificadores (campos + capacidades) a
cada síntesis antes de guardarla, no solo el de campos como hasta
ahora.
