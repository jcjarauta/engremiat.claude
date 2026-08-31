# Pendientes de la jornada 2026-08-30 / 31

Consolidado único de todo lo abierto tras la jornada de Vigilia, Telar y
Rueda del Gremio -- para no perder nada entre los múltiples documentos
generados. Cada punto enlaza al documento fuente con el detalle
completo. Organizado por urgencia/tipo, no por orden cronológico.

## 1. Bugs reales, sin resolver de fondo

- **Webhook `notificar-humano` deja de estar registrado de forma
  intermitente** (`POST notificar-humano is not registered`) -- ha
  fallado **tres veces** esta jornada, incluso minutos después de
  verificarlo funcionando. Parcheado cada vez con
  desactivar/reactivar el workflow, nunca resuelto de raíz. **Es el
  pendiente técnico más urgente** antes de confiar cualquier Vigilia a
  correr desatendida de verdad. Ver `PROPUESTA_EMPAQUETADO_PRODUCTO_CLIENTE_FINAL.md`,
  sección "Cierre del primer piloto de ramas".
- **Los tokens de API de Baserow no pueden crear tablas ni campos**
  (confirmado con dos tokens distintos, incluido uno "sin restricción
  de tabla") -- limitación real de la plataforma, no de configuración.
  Cualquier esquema nuevo requiere que el promotor lo cree a mano en la
  UI. Sin solución alternativa conocida todavía.

## 2. "El vecino del banco" -- decisión pendiente

- Las dos Tramas generadas (16 capítulos, $0,0124, ver
  `diario-navegacion/2026-08-31-vecino-del-banco/hilo-conductor.md`)
  **no están listas para publicar** -- Trama 1 se desvía de tono a
  partir del capítulo 4 (incluye una imagen fuera de lugar, una
  ruptura de continuidad); Trama 2 incumple la regla acordada de
  "final sin magia" y tiene un error de numeración interno.
- Decisión pendiente: reescribir desde los capítulos 1-3 de Trama 1
  (los únicos sólidos), o esperar al modo interactivo capítulo a
  capítulo (punto 4) para regenerarla de otra forma.
- Ninguna rama de "Reparto de tareas vecinales" (software, noche
  anterior) tiene todavía `RAMA_ELEGIDA` marcada -- sigue sin decidirse
  cuál de las tres variantes (A/B/C) se queda.

## 3. Piezas diseñadas, ninguna construida todavía

- **Cuadrilla v1 y v2** (mini-jobs + Concilio conversacional con aviso
  Art. 50 UE) -- diseño completo, ninguna tabla ni workflow tocado.
- **`fusionar_rama`** -- acción que archivaría ramas perdedoras y
  publicaría la ganadora en Acervo. Deliberadamente no construida hasta
  que una decisión real de Relevo la necesite.
- **`/telar` (wizard de Urdimbre por Telegram)** -- diseñado, para que
  un humano responda las 7 preguntas sistemáticas sin pasar por Claude
  Code cada vez.
- **Modo interactivo de Trama, capítulo a capítulo -- CONSTRUIDO Y
  PROBADO** (2026-08-31). Workflow "Telar Interactivo" en el generador,
  bot dedicado `@EngremiatTelar_bot` (sondeo cada 15s, no webhook, para
  no exponer el generador aislado). Primera prueba real: capítulo 1 de
  "El vecino del banco" generado tras elección humana, tono correcto,
  sin desviación. Pendiente real: probar los 8 capítulos completos y
  comparar calidad contra el lote generado en bloque la noche anterior.
- **Consola de Relevo** -- HTML autocontenido con escritura real a
  Baserow (token gestionado con seguridad, nunca en el fichero) y
  métrica de "decisiones por Relevo" para calibrar el tamaño de los
  próximos lotes.
- **Capa "Proyecto comunitario" de Telar** -- diseñada (Semilla
  Cooperativa), sin construir hasta que haya un cliente real.
- **Panel holárquico (Rueda del Gremio visual)** -- doble enlace
  sociocrático aplicado a cada nivel, Grafana+Prometheus para hardware,
  panel radial a medida para la actividad -- diseño completo, nada
  construido.
- **`NODO_ENGREMIAT`** (tabla 289) -- **creada y sembrada** con los 4
  nodos reales (Raspberry Pi, PC operador, worker local, chat operador).
  Resuelto el bloqueo de esquema con un método nuevo: Claude genera un
  `.txt` separado por tabulaciones, el usuario lo pega directamente en
  "Pegar los datos de la tabla" de Baserow -- crea la tabla completa
  con datos en un solo paso, sin campo-por-campo. Documentado como
  método de trabajo por defecto para cualquier tabla nueva futura.
- **Enchufe inteligente para la Pi a demanda** -- explícitamente
  aparcado hasta concretar el Relevo del todo.

## 4. Rueda del Gremio -- nunca recorrida entera

- Las 7 estaciones (Oportunidad → Cuadrilla+Concilio/Vigilia(Telar) →
  Relevo → Cronista → Ejecutor → Pregonero → Ágora) están documentadas,
  pero **ningún proyecto real la ha recorrido de punta a punta** --
  cada estación se ha probado por separado. Candidato natural: la
  oferta de co-creación a FCAFA-TDAH, que ya tiene Oportunidad detectada
  y un primer Canvas+DAFO generado.
- No existe ningún mecanismo automático que mueva un proyecto de una
  estación a la siguiente -- cada tránsito sigue siendo manual.

## 5. Estrategia de cliente -- nada contactado todavía

- **FCAFA-TDAH** sigue siendo solo investigación y una propuesta de
  Canvas+DAFO -- **cero contacto real hecho**. Pendiente: redactar el
  primer mensaje de outreach.
- El resto de la investigación de neurodivergencia (Federació Autisme,
  altas capacidades/FANJAC) queda como segunda línea, sin tocar hasta
  validar la primera.

## 6. Gobernanza y ética -- diseñado, no implementado

- Campo `CONSENTIDO_POR`/`FECHA` (consentimiento trazable) -- sigue sin
  existir como campo real.
- Etiquetado `demo_onboarding` vs `desarrollo_real` en salidas de
  Concilio -- sigue sin implementarse.
- Tabla `ACERVO_PERSONA` real -- las personas de Acervo siguen viajando
  como JSON en cada petición, no como catálogo reutilizable.

## Dónde está cada cosa (índice de documentos de esta jornada)

- `PROPUESTA_EMPAQUETADO_PRODUCTO_CLIENTE_FINAL.md` -- diario completo,
  sección por sección, con fecha.
- `MAPA_DOMINIOS_DATOS.md` -- qué vive en Sheets vs. Baserow.
- `DICCIONARIO_ENGREMIAT.md` -- vocabulario completo actualizado.
- `TELAR.md` -- metodología de construcción de historias/proyectos.
- `RUEDA_DEL_GREMIO.md` -- ciclo completo de desarrollo de proyectos.
- `DIARIO_DE_NAVEGACION.md` -- git como grafo de decisiones.
- `diario-navegacion/2026-08-31-vecino-del-banco/` -- Urdimbre, Tramas,
  hilo conductor completo con revisión editorial.
