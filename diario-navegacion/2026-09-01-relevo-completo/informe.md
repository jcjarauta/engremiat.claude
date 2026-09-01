# Relevo completo -- continuación de sesión, cierre 2026-09-01

Informe de cierre de la parte de sesión posterior al relevo de
`2026-08-31-relevo-completo/informe.md` (ese informe cubre hasta el
commit `bc5096b`; este cubre desde `8f9f271` hasta `538e5a5`). Enlaza
al detalle real en cada documento -- este informe es la síntesis, no
lo duplica.

## 1. Resumen ejecutivo

Se construyó el **Coordinador** (`tools/coordinador.mjs`), el primer
intento real de "autociclo de Relevo exponencial": verifica una
respuesta ya procesada contra hechos reales (campos + capacidades) y,
si está limpia, la atomiza en sub-preguntas más concretas -- nunca
publica nada, siempre deja el freno de Relevo humano intacto. Se probó,
falló, se corrigió, se volvió a probar -- dos veces -- hasta quedar
calibrado de verdad. Por el camino aparecieron **tres bugs reales de
infraestructura n8n** sin relación directa con el Coordinador (un
resto del incidente de credenciales de anoche, y un bug de
concurrencia distinto al ya conocido), y se cerraron los tres puntos
de una propuesta de mejora del autociclo, todos probados con datos
reales, no solo diseñados.

**Lo más importante para decidir hoy**: el Coordinador funciona en la
dirección segura -- nunca ha dejado pasar una fabricación real sin
marcarla -- pero **todavía no ha demostrado un ciclo completo real de
principio a fin sin intervención manual mía** (yo disparé cada
ejecución, limpié cada lock colgado, until until until, en la practica
esta noche ha sido un humano orquestando manualmente cada paso del
"autociclo"). Antes de dejarlo correr solo, falta al menos automatizar
el disparo secuencial y el manejo de errores de red/lock que hoy
requirieron intervención mía repetidas veces.

## 2. El Coordinador -- construcción, dos regresiones capturadas, calibración final

- **Primera versión**: 0 de 5 respuestas reales (`BOVEDA1-5`) pasaron
  el filtro -- el extractor de capacidades confundía lenguaje de
  diseño propuesto ("el script compara...") con afirmaciones de que
  algo ya existe.
- **Primera corrección**: se pasó la pregunta original al extractor.
  **Regresión real capturada antes de confiarla**: la nueva regla
  eximía cualquier presente relacionado con el tema, no solo el de
  preguntas de diseño -- dejó pasar sin marcar la misma fabricación ya
  conocida de `PEND1` cuando aparecía en una pregunta de tipo
  "explica/justifica".
- **Segunda corrección**: se separó la regla en dos casos explícitos
  (diseño vs. explicación/justificación). Resultado: 3 de 5 pasan
  limpias con sub-preguntas reales, 2 de 5 correctamente marcadas por
  fabricación de capacidad confirmada a mano contra el catálogo real.
- **Verificador de campos, mismo problema, arreglo sin LLM**: 3
  "campos fabricados" restantes resultaron ser falsos positivos (una
  cita del *valor* de un campo real leída como nombre de campo nuevo;
  dos nombres de campo propuestos dentro de una respuesta de diseño
  pedido). Corregido con dos filtros deterministas de proximidad de
  texto (sin LLM): exclusión de patrón `CAMPO=valor`, y exclusión de
  candidatos precedidos por señales léxicas de propuesta.
- **Tope de profundidad real**: existía como constante sin usar --
  ahora cada fila lleva su propia profundidad y solo se atomiza si
  está por debajo del tope (subido a 2). Probado sembrando las 9
  sub-preguntas de nivel 1 en `VIGILIA_TAREA` y procesándolas por el
  pipeline real: 5 de 9 salen limpias pero se frenan por el tope
  (primera vez que ese freno actúa de verdad, no solo el de limpieza).
- **Propagación de contexto "ya propuesto" entre niveles**: los 3
  falsos positivos de campos heredados del nivel padre desaparecen sin
  perder sensibilidad sobre la fabricación real que seguía presente.

Detalle completo con cada antes/después: `TELAR.md`, secciones
"Coordinador" en orden cronológico.

## 3. Bugs reales de infraestructura n8n, sin relación con el Coordinador

- **Resto del incidente de credenciales de anoche, no detectado
  entonces**: la limpieza tras el aviso de GitGuardian solo revisó el
  repo de git -- nunca los workflows de n8n, que no están versionados.
  Aparecieron **8 nodos más** (6 en el workflow "Cronista/Vigilia", 2
  en "Telar Interactivo", no tocado hasta ahora) con el token de
  Baserow ya filtrado/rotado hardcodeado -- rotos en producción desde
  la rotación, sin que nadie lo notara. Todos corregidos.
- **Bug de concurrencia real, distinto al ya conocido y ya "cerrado"
  anoche**: el nodo `Construir tema con contexto` ignoraba qué fila
  había bloqueado realmente el nodo de lock, y siempre usaba la
  primera pendiente original de la búsqueda. El lock sí reservaba
  filas distintas correctamente -- pero el trabajo real y el guardado
  del resultado siempre caían en la misma fila. De 9 disparos
  concurrentes, solo 1 quedó procesado de verdad; los otros 8 quedaron
  bloqueados sin resultado. Corregido. **Nota honesta**: el test de
  concurrencia de anoche verificó que el lock reserva filas distintas,
  pero nunca verificó que el contenido guardado correspondiera a la
  fila correcta -- un hueco real en aquella verificación que este bug
  destapó.
- **Límite real descubierto del sandbox de Code node de esta versión
  de n8n**: no soporta acceso a credenciales desde código (ni
  `this.getCredentials()` ni `this.helpers.httpRequestWithAuthentication()`
  funcionan). El hardcode de token en los Code node sigue siendo la
  única vía funcional hoy -- **pendiente real sin resolver**: migrar
  estas llamadas a nodos HTTP Request nativos con la credencial ya
  existente, documentado en `tools/n8n-workflows/README.md`.

## 4. Workflows n8n exportados a git, con secretos redactados

Hasta ahora los 2 workflows reales de la instancia "generador" (puerto
5680) solo vivían dentro de n8n, sin diff ni historial. Exportados a
`tools/n8n-workflows/` con todo valor de token (actual y el viejo ya
filtrado) sustituido por el marcador `__BASEROW_TOKEN__` -- verificado
con `grep` antes de comitear, nunca asumido. El valor real solo vive
en el n8n en ejecución.

## 5. Tres mejoras del autociclo, propuestas y cerradas en la misma sesión

Diagnóstico de partida: los verificadores y el tope de profundidad
funcionan -- el problema seguía siendo la fuente (la síntesis DeepSeek
fabricaba con la misma confianza tanto si se le prohibía como si no).

1. **Síntesis anclada al catálogo real** -- en vez de prohibir inventar
   en abstracto, se inyecta en el propio prompt el catálogo real de
   mecanismos, con instrucción de marcar como "propuesta" cualquier
   cosa fuera de esa lista. **Probado contra el mismo caso de control
   que fabricaba antes**: la fabricación original desaparece, la
   respuesta cita el mecanismo real correcto en vez de inventar. Efecto
   secundario real: expuso que el extractor de capacidades no
   distinguía negaciones ("no existe X") de afirmaciones de existencia
   -- corregido con un filtro determinista de respaldo (regex, no
   delegado a otro LLM) y una comprobación de cita directa al catálogo
   por solapamiento de palabras en vez de substring exacto.
2. **Ciclo de corrección antes de Relevo** -- cuando una respuesta sale
   marcada, se le devuelve a DeepSeek la lista exacta de lo no
   confirmado y se le pide reescribir solo esos puntos; se re-verifica
   una vez. **Probado contra 3 casos REVISAR reales**: los 2 casos de
   campo fabricado se corrigen de forma consistente en corridas
   repetidas (el texto corregido reescribe el nombre inventado como
   propuesta explícita, sin gutear el resto). El caso límite de
   capacidades fue inconsistente entre corridas -- una vez se corrigió,
   otra vez no y fue correctamente a Relevo con el intento documentado.
   **Comportamiento honesto esperado**: el ciclo no fuerza un limpio
   falso cuando la corrección no basta de verdad.
3. **Métrica de tasa de fabricación** -- el Coordinador calcula un
   resumen por lote y lo escribe en la tabla real `METRICA_FABRICACION`
   (id 1039, creada a mano por el promotor esta noche vía pegado
   tabulado). Verificado con una escritura de prueba real, limpiada
   después.

Detalle completo con cada prueba: `TELAR.md`, secciones desde "Punto 1
resuelto de verdad" hasta el final.

## 6. Datos reales de coste, tokens y tiempo

**Del pipeline de producción real (`GASTO_API`)**: 133 filas
acumuladas desde el `2026-08-31` (104 al cierre del relevo anterior +
29 nuevas esta sesión), coste total acumulado **$0,10527**.

**Cerrado tras escribir este informe**: las llamadas a DeepSeek del
propio `tools/coordinador.mjs` (extracción de afirmaciones,
comprobación, corrección, atomización) ahora se registran en
`GASTO_API` (`registrarUso`/`guardarGastoEnBaserow`), con la misma
fórmula de coste real que usa producción, diferenciando por `MODELO` y
`SERVICIO` -- listo para sumar GPT/Claude el día que se usen sin
rediseñar nada. Verificado con una corrida real (6 llamadas,
$0,004648). La cifra de $0,10527 de arriba sigue sin incluir el gasto
de las pruebas de esta noche (fue anterior a este arreglo), pero
cualquier corrida futura del Coordinador quedará contabilizada.

## 7. Pendientes reales, sin resolver

- **Cerrado tras escribir este informe**: construido
  `tools/ciclo_autonomo.mjs` -- dado el nombre de una rama, dispara,
  espera, limpia solo los locks realmente estancados (por antigüedad
  real en Baserow, no por el estado de ejecución de n8n, que resultó
  no ser fiable por un nodo de correo roto sin relación -- eliminado)
  y llama al Coordinador al terminar. Probado dos veces con preguntas
  nuevas: la primera prueba destapó el bug del nodo de correo: la
  segunda, ya corregido, proceso 2/2 sin ninguna intervención manual.
  **Sigue faltando**: qué dispara el PRIMER paso (sembrar un lote
  nuevo) -- eso sigue siendo decisión de Claude o del promotor, no
  automático todavía. **Siguiente mejora propuesta, sin construir**:
  cerrar el círculo vía `13_INCIDENCIAS` (detectar incidencias
  marcadas, sembrar y disparar solo; devolver resultados como
  propuesta en staging, con un solo paso de confirmación humana antes
  de escribir en el Sheet real -- nunca escritura automática directa
  al gobierno real). Detalle completo y el porqué de la reserva sobre
  la escritura automática en `TELAR.md`, sección "Siguiente mejora
  propuesta: cerrar el círculo vía incidencias".
- **Migrar el hardcode de token en Code node a nodos HTTP Request
  nativos** -- pendiente real, documentado, sin resolver por límite del
  sandbox de esta versión de n8n.
- **Extensión del tope de profundidad más allá de 2** -- no probado
  todavía, y no debería probarse hasta tener más confianza en la
  calibración del verificador de capacidades a profundidades altas.
- **Diversificar el roster de Acervos por pregunta** -- observación de
  anoche (4/5 mismo par Técnico+Lógico), sigue sin abordarse.
- **`BOVEDA3N2-2`/`BOVEDA3N2-3`**: sus campos fabricados originales
  (`BASEROW_ID`, `ruta_obsidian`) eran genuinos (no heredados), y ya se
  corrigieron con el ciclo de corrección del punto 5.2 -- pero el
  contenido final de esas dos respuestas no se ha vuelto a leer entero
  a mano, solo se confirmó que pasaron la verificación.
- **`TELAR.md` ya es un archivo muy largo** (>1100 líneas) -- sigue
  siendo el único lugar donde vive el detalle cronológico completo;
  en algún momento merecerá dividirse o indexarse mejor.
