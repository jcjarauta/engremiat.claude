# Roadmap y baseline de Engremiat -- para autogestión asistida vía Gestor de Proyectos

Documento de entrada pensado para pasar por el mismo ciclo Cronista/Ejecutor
que Engremiat ya usa con cualquier cliente: fases con una intención breve,
seguidas de tareas atómicas y verificables -- exactamente el formato que
Cronista sabe segmentar en filas de `TAREA`. La intención es literal: que
Engremiat gestione su propio desarrollo con sus propias herramientas, no
solo que las venda. Fecha base: 2026-08-30. Sustituye ninguna sección de
`PROPUESTA_EMPAQUETADO_PRODUCTO_CLIENTE_FINAL.md` -- la resume y ordena
como *plan de acción*, no como bitácora de decisiones.

## Cómo usar este documento

1. Se importa como "tutorial" en el workflow Cronista (el mismo que ya
   segmenta tutoriales reales en tareas para un cliente), contra un cliente
   nuevo: **Engremiat como su propio operador**, representado por una fila
   de `ENTIDAD_ORGANIZATIVA` (`TIPO_NIVEL=confederacion`, nombre "Engremiat
   -- núcleo") -- la misma tabla que ya sirve a cualquier asociación o
   persona, sin inventar una entidad especial para "nosotros mismos".
2. Cada tarea generada se sigue con Ejecutor/Ejecutor Local igual que
   cualquier tarea de mantenimiento real -- ninguna acción de escritura sin
   confirmación humana, mismo principio ya construido y probado.
3. Este fichero es la **baseline**: la próxima revisión del roadmap se
   compara contra esto, no se reescribe desde cero. Cuando una fase se
   cierre de verdad, se marca aquí y se abre la siguiente versión.

---

## Propuesta de valor -- qué es Engremiat cuando esto esté hecho

Una persona, una familia, un grupo de apoyo mutuo, una asociación o una
federación de asociaciones deberían poder operar su propia coordinación
digital -- tareas, biblioteca de conocimiento, calendario, intercambio de
recursos, decisiones de grupo -- sin depender de una nube ajena, con datos
que no salen de su propio hardware si así lo eligen, y **escalando sin
migrar de sistema**: la misma tabla (`ENTIDAD_ORGANIZATIVA`, ver
`jerarquia.yaml`) que hoy describe a una sola persona describe mañana a una
confederación de asociaciones, sin rediseñar nada.

Esto no es una promesa nueva -- es la síntesis de lo que ya está diseñado y,
en buena parte, probado: Cronista y Ejecutor convierten intención en tareas
reales; Ágora y red_social conectan personas por lo que tienen y lo que
necesitan; Plaza es la puerta de entrada, igual de válida en un móvil de
2026 que en un nodo desconectado de internet. Lo que falta no es más diseño
-- es recorrer, con un cliente real detrás, el camino que ya está trazado.
Y la generosidad de la propuesta está precisamente ahí: cada pieza construida
para el primer cliente (una persona neurodivergente que necesita orden y
acompañamiento) queda disponible, sin coste de rediseño, para el siguiente
-- sea otra persona, una familia, o una confederación de asociaciones.

**Límite honesto**: esto es una aspiración fundamentada en piezas ya
probadas, no una promesa de plazo. Las fases de abajo son deliberadamente
conservadoras sobre qué construir a continuación.

---

## FASE 1 -- Cerrar el prototipo del cliente real (bloqueante)

Intención: nada de lo diseñado vale si el primer cliente real (persona
neurodivergente, nodo atómico) encuentra un hueco visible al primer uso.

1. Implementar login por PIN o QR en Plaza (hoy es un campo sin validar).
2. Crear la tabla `INCIDENCIA` en Baserow y conectar la pantalla "Avisar de
   un problema" -- hoy solo guarda en el navegador del cliente, no llega a
   ningún sitio.
3. Conectar "Preguntar" con el contenido real de la Biblioteca y las tareas
   propias del usuario, citando siempre la fuente, nunca inventando.
4. Cargar una Biblioteca offline real (mirror parcial Kiwix/Appropedia) --
   hoy solo hay documentos de ejemplo.
5. Migrar los volúmenes de Docker (Baserow/n8n) al SSD en cuanto llegue --
   la microSD ya demostró ser un cuello de botella real.
6. Prueba de aceptación desconectando el WAN del router (no solo auditoría
   de código) -- la validación más exigente de "sin internet", pendiente.

## FASE 2 -- Generalizar la metodología de alta de cliente (para todos, no solo el nuevo)

Intención: el proceso de hoy (bot que recoge datos -> demo personalizada ->
escalado progresivo por `PAQUETE_CLIENTE`) tiene que ser **el mismo
procedimiento** para una persona sola, una familia, o una asociación entera
-- no un flujo especial por tipo de cliente.

7. Documentar paso a paso la sesión real de despliegue de hoy en la Pi
   (SSH, Docker, Plaza, jerarquía) como el primer "tutorial" real que pasa
   por Cronista -- ya existe el caso de uso, no hace falta esperar a un
   cliente externo para generarlo (ver FASE 3, son la misma acción).
8. Construir el bot de onboarding mínimo: recoge nombre, tipo de nivel
   (`usuario`/`familia`/`grupo`/`asociación`...), intereses/competencias
   iniciales -- y crea directamente la fila de `ENTIDAD_ORGANIZATIVA`
   correspondiente, sea cual sea el nivel.
9. Formalizar la "hoja de estilos" (tokens de acento, tamaño de texto,
   contraste) como sistema real de personalización de Plaza, no solo
   diseño de alto nivel -- un solo sistema de tokens para cualquier tipo de
   cliente.
10. Verificar que un alta de asociación (varios `SOCIO` bajo una
    `ENTIDAD_ORGANIZATIVA` de tipo `asociacion`) usa exactamente el mismo
    formulario/bot que un alta individual, sin rama de código separada.

## FASE 3 -- Engremiat se autogestiona (el encargo de hoy)

Intención: cerrar el bucle -- que este mismo roadmap se convierta en tareas
reales dentro del propio Engremiat, gestionadas con sus propias
herramientas.

11. Crear en Baserow (PC o Pi, decidir cuál es "la" instancia operador) la
    fila `ENTIDAD_ORGANIZATIVA` que representa a Engremiat como organización,
    no como cliente de sí misma disfrazado.
12. Pasar este documento (`ROADMAP_BASELINE_ENGREMIAT.md`) por el workflow
    Cronista contra esa fila -- primera prueba real de "Engremiat se
    autogenera de forma asistida", con las tareas de la Fase 1 y 2 como
    primer lote.
13. Verificar en Baserow que las tareas generadas por Cronista a partir de
    este documento son atómicas y accionables (no fusiona dos tareas en
    una, no corta ninguna a mitad de frase) -- si no lo son, es señal de
    que el propio documento necesita reescribirse más corto/plano, no que
    Cronista esté mal.
14. Dar seguimiento a esas tareas con Ejecutor Local, igual que con
    cualquier tarea de mantenimiento -- confirmando cada escritura, sin
    excepción por ser "trabajo interno".
15. Cuando se cierre un lote de tareas, repetir el chequeo de consistencia
    ya exigido para la Consola (`chequear_consistencia_consola.mjs` como
    precedente) aplicado a los manifiestos: que `estado` en cada `.yaml`
    coincida con lo que hay realmente en Baserow.

## FASE 4 -- Completar la sistematización técnica ya empezada hoy

Intención: el patrón jerárquico y el script de creación de tablas ya
funcionan en la Pi -- terminar de generalizarlos antes de apoyarse en ellos
para más módulos.

16. Crear las cuatro tablas de `jerarquia.yaml` también en el Baserow del
    PC (database 257) -- hoy solo existen en la Pi.
17. Probar con datos reales (aunque sean de prueba) un recorrido de varios
    niveles de `PADRE_ID` encadenados, y la resolución de herencia de
    `PAQUETE_CLIENTE_ID` -- hoy el mecanismo está descrito pero no
    ejercitado con filas reales.
18. Escribir el `.tablas.json` de `red_social` y `asociacionismo` (para
    tenerlos listos), pero **no crear esas tablas todavía** -- se
    materializan solo cuando una señal real (segundo cliente, o contacto
    real con una asociación) lo pida. Preparar no es lo mismo que construir.

## FASE 5 -- No construir sin señal real (recordatorio explícito, no una tarea)

Pregonero, Oportunidad, el motor de saldo real de Ágora (Cyclos), la
integración con Loomio y con Mobilizon, y la importación de ESCO/SFIA
**quedan deliberadamente en pausa**. Están diseñados y documentados en sus
manifiestos -- construirlos ahora, sin un cliente o una asociación real que
los pida, sería adivinar la prioridad en vez de que la marque quien va a
usarlos. Revisar esta fase cada vez que aparezca un cliente nuevo, no en
una fecha fija.

---

## Baseline -- estado real a 2026-08-30 (para comparar futuras revisiones)

| Pieza | Estado real | Evidencia |
|---|---|---|
| Núcleo (n8n+Baserow) | Construido y probado, en PC y en Pi | `nucleo.yaml` |
| Cronista | Construido y probado (Baserow y Sheets) | `cronista.yaml` |
| Ejecutor Local | Prototipo probado end-to-end (arregló un workflow real) | `ejecutor_local.yaml` |
| Plaza | 6 pantallas funcionales, en PC y Pi, verificado sin red externa | Sección "Plaza -- prototipo" |
| Ágora | Construido sin motor de saldo real | `agora.yaml` |
| `jerarquia` (patrón) | 4 tablas creadas y verificadas en la Pi, vacías | `jerarquia.yaml` |
| `asociacionismo` | Solo diseñado (v1, ya usa `jerarquia`) | `asociacionismo.yaml` |
| `red_social` | Solo diseñado (v1, ya usa `jerarquia`) | `red_social.yaml` |
| Pregonero / Oportunidad | Solo diseñados | `pregonero.yaml` / `oportunidad.yaml` |
| Script de creación de tablas | Probado end-to-end en la Pi | `crear_tabla_desde_manifiesto.mjs` |
| Cliente real identificado | Sí -- persona neurodivergente, nodo atómico | `PROPUESTA_APOYO_AUTONOMIA_NEURODIVERGENCIA.md` |
| Segundo cliente/asociación real | No -- toda la hipótesis B2B sigue sin validar | `asociacionismo.yaml`, sección `pendiente` |

**Regla de la baseline**: si una fila de esta tabla deja de ser cierta antes
de que exista una nueva versión de este documento, se corrige aquí mismo con
fecha, no se espera al siguiente roadmap completo -- la baseline es un
espejo del estado real, no un compromiso fijo.
