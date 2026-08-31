# Telar

El constructor de historias de Engremiat. Cuatro ciclos de Vigilia,
cada uno responsable de una etapa distinta -- el mismo pipeline que ya
usa la industria (guion, novela, videojuegos), llegado por intuición
propia antes de investigarlo: Story Bible -> Beat Sheet -> Draft ->
Pase editorial. En español, y coherente con el vocabulario gremial ya
existente (Concilio delibera, Vigilia vela, Acervo almacena, Taller
construye, Feria muestra), los cuatro ciclos se llaman por su lugar en
el tejido -- "trama" significa a la vez tejido y argumento en español,
no es una coincidencia forzada.

## Los cuatro ciclos

1. **Urdimbre** -- los hilos base tensados antes de tejer nada:
   arquitectura, personajes, escenario, tono, complicaciones centrales.
   Un único nodo fijo, no se ramifica. Preguntas sistemáticas (ver
   abajo) respondidas una vez.
2. **Trama** -- el tejido propiamente dicho, sobre la urdimbre ya
   fijada. Aquí es donde nacen las ramas -- distintas Tramas posibles
   sobre la misma Urdimbre, coherente con el modelo "elige, no
   fusiones" ya establecido para Ramas.
3. **Hilo conductor** -- cada Trama se desarrolla capítulo a capítulo
   (esqueleto: Story Circle de Dan Harmon, 8 pasos -- Tú, Necesidad, Ir,
   Buscar, Encontrar, Tomar, Volver, Cambiado) hasta completarse.
4. **Parte de Vigilia / Relevo** -- el tejido terminado se revisa antes
   de publicarse. El promotor y Claude confirman y deciden si se
   continúa la misma historia o se inicia una nueva.

## Relevo ligero tras la Urdimbre -- no negociable en temas sensibles

Cuando el tema toca una población real y vulnerable (como la primera
historia de este Telar), no es prudente dejar correr Trama e Hilo
conductor en autopiloto durante tres ciclos enteros antes de la primera
revisión humana. Se añade un **Relevo ligero al final del Ciclo 1**,
solo para confirmar las preguntas sistemáticas -- antes de invertir el
resto del trabajo. Para temas de menor sensibilidad, el Ciclo 1 puede
correr con más autonomía, alimentado por Oportunidad.

## Preguntas sistemáticas de Urdimbre (plantilla reutilizable)

Para cualquier historia futura, no solo esta:

1. **Punto de vista** -- ¿quién es la lente narrativa? Protagonista
   directo vs. testigo/acompañante -- decisión con implicaciones éticas
   reales cuando el tema toca vulnerabilidad.
2. **Quiere (externo) vs. Necesita (interno)** -- distinción de Harmon,
   casi nunca son lo mismo.
3. **Tono y sensibilidad** -- ¿toca una población real vulnerable?
   ¿requiere el Relevo ligero extra?
4. **Filosofía del final** -- ¿encaja un final resuelto/mágico, o exige
   honestidad con datos reales del contexto?
5. **Enlace a un recurso real** -- ¿esta historia puede llegar a
   jugadores reales vía Feria? Si sí, ¿apunta a algo real al terminar
   (coherente con Pregonero/Oportunidad)?
6. **Escenario** -- dónde, cuándo, reglas del mundo.
7. **Complicaciones centrales** -- el conflicto motor de la historia.

## Arquitectura estimada del primer ciclo completo

No un salto ciego a la escala de un libro "Elige tu propia aventura"
clásico (*The Cave of Time*, 1979: 39 decisiones, 40 finales, casi sin
fusión de ramas -- la referencia histórica real, pero muy por encima de
lo calibrado hasta ahora). Primer ciclo real, calibrado sobre lo ya
probado (3 decisiones cómodas, 8 el siguiente paso razonable):

- 1 Urdimbre (fija) -> 2 Tramas -> 8 capítulos por trama (Story Circle,
  1 hito cada uno) = **19 nodos en total**.
- El siguiente ciclo decide, con el coste real de revisar esto, si se
  añade una tercera trama o más hitos por capítulo -- no antes.

## Valor añadido de la metodología (estimación como asesor estratégico)

- **Coste marginal decreciente por Trama adicional**: una vez escrita la
  Urdimbre (personajes, mundo, tono), cada Trama nueva sobre la misma
  base cuesta una fracción de escribir una historia desde cero -- el
  mismo principio económico que ya bajó el coste de Canvas+DAFO a
  céntimos.
- **Reutilizable más allá de Feria**: la investigación confirma que el
  mismo patrón (bible -> beats -> hilo -> revisión) es el que usan los
  diseñadores de escape rooms reales, mapeando beats a dependencias de
  puzzles. El Telar no es solo para cuentos -- es la semilla de
  escape rooms y experiencias interactivas personalizadas, sin cambiar
  el esqueleto, solo el tipo de hito.
- **Activo de propiedad intelectual real**: una Urdimbre bien construida
  (personajes, mundo) es un activo reutilizable de Engremiat, no
  contenido de un solo uso -- coherente con lo que Acervo ya pretendía
  ser desde el principio de la sesión.

## Arquitectura núcleo + capas (2026-08-31)

Las 7 preguntas de Urdimbre no son específicas de narrativa -- son
domain-agnostic con vocabulario disfrazado de historia. Tabla de
equivalencia atómica:

| # | Pregunta atómica | Historia | Software/Negocio | Proyecto comunitario |
|---|---|---|---|---|
| 1 | ¿Desde qué perspectiva? | Punto de vista narrativo | Usuario final vs. operador | Quién convoca, quién decide |
| 2 | ¿Qué se pide vs. qué hace falta de verdad? | Quiere vs. necesita (Harmon) | Petición del cliente vs. problema real | Demanda explícita vs. necesidad real de gobernanza |
| 3 | ¿Es sensible? | Población vulnerable, tono | Dato sensible, RGPD | Consentimiento, poder real en el grupo |
| 4 | ¿Qué define el cierre? | Filosofía del final | Definición de éxito/MVP | Qué cuenta como "acuerdo" real |
| 5 | ¿Enlaza a algo real? | Recurso real | Alianzas estratégicas | Red real de apoyo/financiación |
| 6 | ¿En qué contexto vive? | Escenario | Mercado/comunidad de clientes | Territorio o colectivo concreto |
| 7 | ¿Cuál es el conflicto central? | Complicaciones | DAFO / problema real | Tensión de poder o de recursos |

**Núcleo**: las 4 fases (Urdimbre → Trama → Hilo conductor → Parte de
Vigilia/Relevo) + Ramas + Diario de Navegación + personas de Acervo
intercambiables. Domain-agnostic, construido y validado dos veces.

**Capas**:
- **Historia** -- construida (Feria/Taller).
- **Software/Negocio** -- ya construida, sin saberlo: `generar_canvas_dafo`
  es esta capa con vocabulario de producto. No requiere reconstrucción,
  solo reconocimiento retroactivo.
- **Proyecto comunitario** -- diseñada, no construida. Construir solo
  cuando haya un cliente o proyecto cooperativo real que la necesite
  (ver sección siguiente -- puede que ese cliente real sea el propio
  Engremiat).

## Trama interactiva, capítulo a capítulo (2026-08-31)

Hallazgo real tras el primer Ciclo 3 completo ("El vecino del banco"):
generar 8 capítulos encadenados sin ningún punto de control intermedio
deja que el modelo se desvíe del tono acordado sin que nadie lo note
hasta el final -- en la práctica, apareció una imagen fuera de lugar,
una ruptura de continuidad, y un final que incumplía la regla de "sin
magia" pactada en la Urdimbre (ver
`diario-navegacion/2026-08-31-vecino-del-banco/hilo-conductor.md`).

**Corrección de diseño, no solo parche**: en vez de generar la Trama
completa en lote, un bot (extensión de `/telar`, reutilizando Cuadrilla
v2) presenta 2-3 direcciones posibles en cada capítulo y un humano
elige en vivo -- el punto de control deja de ser "al final", pasa a ser
"en cada paso", por construcción. El propio menú de opciones puede
recordar el tono de la Urdimbre en cada elección, actuando como barrera
contra la deriva.

Consecuencia estratégica: la misma herramienta que un co-creador usa
para *construir* una historia es, arquitectónicamente, la misma que un
jugador usaría para *vivir* una historia ya construida -- un "modo
autor" y un "modo jugador" sobre un único motor, no dos productos
distintos. Coherente con el origen real de "Elige tu propia aventura"
(Edward Packard la inventó contándola en vivo a sus hijas, el libro
vino después como formalización).

**Construido y probado en vivo el 2026-08-31.** Workflow "Telar
Interactivo" (generador, id `4VSsZ98zNPZ5tGnN`), bot dedicado
`@EngremiatTelar_bot` -- separado de Feria/Taller, cero riesgo para
producción. Como el generador está deliberadamente aislado (sin acceso
ni desde la LAN), no puede recibir webhooks de Telegram -- se implementó
por **sondeo** (`getUpdates`, cada 15 segundos) en vez de webhook,
manteniendo el aislamiento intacto. Tabla `TELAR_SESION` (id 290) guarda
el estado (capítulo actual, historial acumulado, opciones pendientes).

Primera prueba real: capítulo 1 de "El vecino del banco" generado tras
elegir una opción -- texto concreto, digno, sin desviarse del tono ni
del escenario (a diferencia del lote generado la noche anterior), coste
$0,000508. Avanzó correctamente al capítulo 2 con nuevas opciones
basadas en el capítulo 1 real como contexto.

## Límites y honestidad

- Nada de esto está construido en el generador todavía -- es
  metodología y plantilla documentadas, la Urdimbre de la primera
  historia (ver `diario-navegacion/2026-08-31-vecino-del-banco/`) es el
  primer caso real, preparado a mano antes de automatizar nada.
- La cifra de "19 nodos" es una estimación de diseño, no una medición --
  el primer Relevo real dirá si es un tamaño cómodo o hay que ajustar.
