# Propuesta consolidada — Abstracción RECURSO (evolución de MATERIAL)

**Origen:** F-079, análisis anticipado sobre las limitaciones de `MATERIAL` para representar herramientas, maquinaria, espacios, servicios y capacidad humana.
**Estado:** propuesta de diseño, sin desarrollar. **Nota metodológica**: a diferencia de las 78 fricciones anteriores, esta se escribió antes de crear un `MATERIAL` real en la prueba — sigue pendiente esa verificación empírica.

## Problema del modelo actual
`MATERIAL` está pensado para inventario (código, unidad, stock, stock mínimo, proveedor, reposición, ubicación). No representa correctamente herramientas reutilizables, maquinaria, espacios, equipos, vehículos, servicios externos, capacidad humana, participación voluntaria, competencias o recursos digitales. Forzarlos dentro de `MATERIAL` produciría campos vacíos, reglas ambiguas y validaciones difíciles de mantener.

## Modelo recomendado

### Entidad maestra RECURSO
```
ID_RECURSO / CODIGO / NOMBRE / DESCRIPCION / TIPO_RECURSO / SUBTIPO_RECURSO / ESTADO /
UBICACION_ID / RESPONSABLE_ID / UNIDAD_CAPACIDAD / CAPACIDAD_TOTAL / ACTIVO / OBSERVACIONES /
FECHA_CREACION / CREADO_POR / FECHA_MODIFICACION / MODIFICADO_POR
```
Tipos: CONSUMIBLE / MATERIAL_REUTILIZABLE / HERRAMIENTA / MAQUINARIA / ESPACIO / PERSONA / EQUIPO_HUMANO / SERVICIO / RECURSO_DIGITAL / DOCUMENTACION.

### Extensiones especializadas por tipo (no todo en RECURSO)

**Consumibles/materiales** (`RECURSO_INVENTARIO`): `RECURSO_ID`, `UNIDAD_STOCK`, `STOCK_ACTUAL`, `STOCK_MINIMO`, `CANTIDAD_RESERVADA`, `PUNTO_REPOSICION`, `CANTIDAD_REPOSICION`, `PROVEEDOR_PREFERENTE_ID`, `PLAZO_REPOSICION_DIAS`.

**Herramientas/maquinaria** (`RECURSO_ACTIVO`): `RECURSO_ID`, `NUMERO_SERIE`, `CAPACIDAD`, `ESTADO_OPERATIVO`, `REQUIERE_MANTENIMIENTO`, `FECHA_ULTIMA_REVISION`, `FECHA_PROXIMA_REVISION`, `PROTOCOLO_ID`.

**Espacios** (`RECURSO_ESPACIO`): `RECURSO_ID`, `AFORO`, `SUPERFICIE`, `HORARIO_DISPONIBLE`, `RESTRICCIONES`, `REQUIERE_RESERVA`.

**Personas/equipos** (`RECURSO_REFERENCIA` — sin duplicar `PERSONA_EQUIPO`): `RECURSO_ID`, `ENTIDAD_TIPO`, `ENTIDAD_ID` (ej. `ENTIDAD_TIPO=PERSONA_EQUIPO`, `ENTIDAD_ID=PER-0001`). Evita copiar nombres, disponibilidad o competencias en dos tablas — única fuente de verdad.

## Participación humana (no como stock)
```
HORAS_DISPONIBLES / HORAS_ASIGNADAS / PORCENTAJE_CAPACIDAD / COMPETENCIAS / NECESITA_ACOMPAÑAMIENTO / ROL / CALENDARIO
TIPO_PARTICIPACION (PROFESIONAL/VOLUNTARIA/PERSONA_ATENDIDA/COLABORADORA/FORMADORA/APRENDIZ) — no mezclar con TIPO_RECURSO
```

## Relación genérica TAREA_RECURSO
```
TAREA_RECURSO
- ID_RELACION / TAREA_ID / RECURSO_ID / TIPO_USO
  (CONSUME/RESERVA/UTILIZA/REQUIERE/ASIGNA/OCUPA/GENERA)
  / CANTIDAD_REQUERIDA / UNIDAD / FECHA_INICIO / FECHA_FIN / ES_OBLIGATORIO / ESTADO / OBSERVACIONES
```
Ejemplos: TAR-0004 consume 10 hojas de papel; TAR-0010 utiliza una sierra; TAR-0012 ocupa el espacio de pintura; TAR-0020 requiere persona con competencia X; TAR-0021 asigna un equipo de apoyo.

**Ventaja**: el futuro motor por eventos respondería de forma uniforme a "¿qué recursos necesita/tiene disponibles/bloquea esta tarea? ¿hay solapamientos o sobreconsumo?" para cualquier tipo de recurso, no solo materiales.

## MODELO_CAPACIDAD (comportamiento por tipo, no hardcodeado)
| Tipo | Magnitud | Comportamiento |
|---|---|---|
| Consumible | cantidad | se consume |
| Herramienta | disponibilidad | se reserva y devuelve |
| Maquinaria | tiempo/capacidad | se agenda |
| Espacio | franja/aforo | se ocupa |
| Persona | horas/competencia | se asigna |
| Equipo | capacidad agregada | se distribuye |
| Servicio | horas/unidades | se contrata |
| Digital | licencia/capacidad | se habilita |

```
MODELO_CAPACIDAD: CONSUMIBLE / REUTILIZABLE / TEMPORAL / HUMANO / LICENCIA / SERVICIO
```

## Riesgos explícitos (NO_GO)
1. **Tabla `RECURSO` con 60 columnas** — demasiados nulos, reglas condicionales complejas, formularios incontrolables.
2. **Duplicar `PERSONA_EQUIPO` dentro de `RECURSO`** — debe existir una única fuente de verdad para identidad/disponibilidad/competencias/capacidad/estado.
3. **Migración prematura** — cambiar `MATERIAL` ahora afectaría `PRODUCTO_MATERIAL`, `TAREA_MATERIAL`, stock, proveedores, integridad, formularios, informes, tests. No durante la prueba operativa ni antes de cerrar la auditoría.

## Estrategia de migración por fases
- **R1 — Abstracción sin romper lo existente**: mantener `MATERIAL`/`PERSONA_EQUIPO`; añadir conceptualmente `RECURSO`/`TAREA_RECURSO` referenciando entidades existentes.
- **R2 — Nuevos recursos**: herramienta, maquinaria, espacio, servicio, recurso digital.
- **R3 — Inventario unificado**: migrar `MATERIAL → RECURSO + RECURSO_INVENTARIO` con script de migración, validación y reversión.
- **R4 — Planificación de capacidad**: reservas, calendarios, disponibilidad, solapamientos, competencias, sobrecarga.

## Verificación empírica (alta real de MAT-0005, tras crear MATERIAL en la prueba)

Confirmado contra el esquema real (`Formularios.js:263-283`) y datos reales de MAT-0005 ("Papel A4 reciclado"):
- `UBICACION` es texto libre — confirma la mejora original que abrió esta conversación ("desplegable personalizado" para ubicación de material).
- `PROVEEDOR_ID` es un único FK — "varios proveedores por material" es un gap real, no solo deseable.
- `STOCK_ACTUAL` es un número editable plano — reconfirma con evidencia real la necesidad de `RECURSO_MOVIMIENTO` (antes solo anticipada en F-079).
- Reglas de stock reservado>disponible y stock<=mínimo ya existen en `IntegrityService.js:481-535,1095-1096`.

**Módulo "logística/almacén"** — no es una idea nueva independiente, es la capa operativa/UI de `RECURSO_INVENTARIO` + `RECURSO_MOVIMIENTO` de la Fase R3: separar ubicación por catálogo/entidad `UBICACION`; lote, fecha de entrada y caducidad cuando proceda; distinguir stock físico/reservado/disponible/comprometido; varios proveedores por material con precio y plazo por proveedor; unidad de compra vs. unidad de consumo; movimientos de inventario (entradas/salidas/ajustes/mermas) en vez de editar `STOCK_ACTUAL` directamente; código generado por categoría; QR/código de barras.

## Ampliación desde TAREA_MATERIAL (F-081 a F-088)

**Verificado** (`Formularios.js:295-305`): `TAREA_MATERIAL` no tiene `CANTIDAD_RESERVADA`/`CANTIDAD_DEVUELTA`, `UNIDAD` no se hereda del material, `MOTIVO_DESVIACION` es texto libre, `ESTADO` usa el catálogo genérico `CFG_ESTADO_RELACION` sin ciclo reserva/entrega/cierre.

**`MOVIMIENTO_MATERIAL` (propuesto aquí) es el mismo concepto que `RECURSO_MOVIMIENTO` de la sección anterior** — unificar en un único diseño, no construir dos libros de movimientos distintos.

### Modelo completo de TAREA_MATERIAL propuesto
```
ID_TAREA_MATERIAL / TAREA_ID / MATERIAL_ID / TIPO_USO / UNIDAD_PLANIFICACION /
CANTIDAD_PREVISTA / CANTIDAD_RESERVADA / CANTIDAD_ENTREGADA / CANTIDAD_CONSUMIDA /
CANTIDAD_DESPERDICIADA / CANTIDAD_DEVUELTA / ESTADO / MOTIVO_DESVIACION_ID / DETALLE_DESVIACION /
UBICACION_ORIGEN_ID / LOTE_ID / RESPONSABLE_ENTREGA_ID / RESPONSABLE_CONSUMO_ID /
FECHA_NECESIDAD / FECHA_RESERVA / FECHA_ENTREGA / FECHA_CIERRE / ACTIVO / OBSERVACIONES
```

Campos calculados (nunca manuales): `CANTIDAD_UTILIZADA = CONSUMIDA + DESPERDICIADA`; `CANTIDAD_PENDIENTE = PREVISTA - CONSUMIDA`; `CANTIDAD_NO_UTILIZADA = ENTREGADA - CONSUMIDA - DESPERDICIADA - DEVUELTA`; `DESVIACION_CANTIDAD = UTILIZADA - PREVISTA`; `PORCENTAJE_DESVIACION`; `PORCENTAJE_MERMA = DESPERDICIADA/ENTREGADA` (controlar división por cero).

### Ciclo de estados
`ACTIVO=SÍ/NO` separado de: `BORRADOR/PLANIFICADA/PENDIENTE_RESERVA/RESERVADA/ENTREGADA/EN_USO/CERRADA/CANCELADA/SIN_STOCK/SUSTITUIDA`, con precondiciones por estado (PLANIFICADA requiere tarea+material activos y cantidad>0; RESERVADA requiere stock disponible; ENTREGADA requiere responsable/evidencia; CERRADA requiere balance coherente y stock actualizado vía movimientos).

### Unidad y conversión
```
UNIDAD_MAESTRA / UNIDAD_CONSUMO / FACTOR_CONVERSION
```
Heredar por defecto la unidad del material, bloquearla salvo conversión válida, guardar cantidad normalizada en unidad maestra (ej. 1 paquete = 500 hojas).

### Stock disponible (usa el mismo `RECURSO_MOVIMIENTO`/`MOVIMIENTO_MATERIAL` unificado)
```
STOCK_FISICO / STOCK_RESERVADO / STOCK_COMPROMETIDO / STOCK_DISPONIBLE / STOCK_EN_TRANSITO
STOCK_DISPONIBLE = STOCK_FISICO - STOCK_RESERVADO
```
Vista previa antes de guardar: físico/reservado/disponible/necesario/resultado (VIABLE o no).

### Catálogo de desviación
```
CONSUMO_SUPERIOR / CONSUMO_INFERIOR / MERMA / DEFECTO_MATERIAL / ROTURA / ERROR_PLANIFICACION /
CAMBIO_DE_DISENO / SUSTITUCION / DEVOLUCION / PERDIDA / OTRO
```
Reglas: desviación≠0 → motivo obligatorio; desperdicio>0 → motivo obligatorio; desviación sobre umbral → WARN/ERR.

### Sustitución de materiales
```
PERMITE_SUSTITUCION / MATERIAL_ALTERNATIVO_ID / MATERIAL_REAL_UTILIZADO_ID / MOTIVO_SUSTITUCION / AUTORIZADO_POR
```

### Lotes, ubicaciones, proveedores por movimiento
```
UBICACION_ORIGEN_ID / LOTE_ID / FECHA_CADUCIDAD / PROVEEDOR_ID
```
Permite: consumir primero lo próximo a caducar, rastrear defectos por lote, comparar proveedores, gestionar múltiples almacenes.

### Coste (futuro)
```
COSTE_UNITARIO_PREVISTO / COSTE_UNITARIO_REAL / COSTE_PREVISTO / COSTE_REAL / MONEDA
COSTE_PREVISTO = CANTIDAD_PREVISTA × COSTE_UNITARIO_PREVISTO
COSTE_REAL = (CONSUMIDA + DESPERDICIADA) × COSTE_UNITARIO_REAL
```

### Relación con ejecución de tarea — 3ª aparición del mismo patrón
```
TAREA = definición | EJECUCION_TAREA = ocurrencia real | TAREA_MATERIAL = necesidad prevista | EJECUCION_TAREA_MATERIAL = consumo real
```
Ya anticipado sin número en `PROPUESTA_TAREA_ALTA.md` (sección "Registro de ejecución real") y ahora reforzado aquí — evita sobrescribir consumos históricos cuando una tarea reutilizable se repite.

### UX por fases
Planificación (tarea/material/cantidad prevista/fecha necesidad/unidad/permite sustitución) → Reserva (cantidad reservada/ubicación/lote/fecha) → Ejecución (entregada/consumida/desperdiciada/devuelta) → Cierre (desviación/motivo/detalle/responsable/validación). Acciones: `[Guardar borrador] [Validar disponibilidad] [Reservar material] [Registrar entrega] [Cerrar consumo] [Cancelar relación]`.

### Validaciones de integridad propuestas
```
FUNC-TMAT-001  CANTIDAD_PREVISTA > 0
FUNC-TMAT-002  CANTIDAD_RESERVADA no supera stock disponible
FUNC-TMAT-003  CANTIDAD_ENTREGADA no supera reservada salvo autorización
FUNC-TMAT-004  CONSUMIDA+DESPERDICIADA+DEVUELTA no supera ENTREGADA
FUNC-TMAT-005  Desviación requiere motivo
FUNC-TMAT-006  Unidad distinta requiere factor de conversión
FUNC-TMAT-007  Material inactivo no puede asignarse
FUNC-TMAT-008  Tarea cerrada no admite nuevos consumos
FUNC-TMAT-009  Relación duplicada activa misma tarea/material/lote
FUNC-TMAT-010  Estado CERRADA requiere balance coherente
FUNC-TMAT-011  Reserva caducada debe liberarse
FUNC-TMAT-012  Consumo real requiere EJECUCION_TAREA_ID cuando exista ese modelo
```

### Motor por eventos (futuro)
`STOCK_INSUFICIENTE`, `RESERVA_NO_RECOGIDA`, `MATERIAL_NO_ENTREGADO`, `CONSUMO_SUPERIOR`, `MERMA_ALTA`, `MATERIAL_SOBRANTE`, `DEVOLUCION_PENDIENTE`, `LOTE_PROXIMO_A_CADUCAR` → propuestas (reservar alternativo, solicitar compra, liberar reserva, etc.), siempre pendientes de aprobación humana.

### Fricciones (numeración corregida — continúa desde F-080)
- **F-081** — Unidad editable sin control (heredar/bloquear/convertir). Alta.
- **F-082** — No se separan previsión, reserva y consumo (un solo bloque de cantidades). Alta.
- **F-083** — No existe libro de movimientos (mismo concepto que `RECURSO_MOVIMIENTO`, unificar). Alta.
- **F-084** — Desviación no calculada ni con catálogo de motivo. Alta.
- **F-085** — No se registra devolución. Media.
- **F-086** — Consumo ligado a definición de TAREA, no a una ejecución concreta — 3ª aparición del patrón definición-vs-ejecución. Alta para el modelo futuro.
- **F-087** — Falta de ubicación y lote contextual por movimiento. Media.
- **F-088** — Estado funcional insuficiente (`Planificada` no representa reserva/entrega/consumo/cierre). Alta.

### Priorización (según el autor)
Bloque mínimo: heredar unidad, separar previsto/reservado/consumido/desperdiciado/devuelto, calcular desviación, exigir motivo, mostrar stock disponible, bloquear reservas>stock, separar ACTIVO/ESTADO. Segundo bloque: `MOVIMIENTO_MATERIAL`/`RECURSO_MOVIMIENTO` unificado, ubicación/lote, liberación de reservas, sustituciones, informes. Tercer bloque: costes, `EJECUCION_TAREA`, motor por eventos, predicción de consumo.

**Hallazgo estructural más importante de todo F-079 (confirmado dos veces, RECURSO y TAREA_MATERIAL)**: separar `TAREA_MATERIAL` (qué se necesita) de `MOVIMIENTO_MATERIAL`/`RECURSO_MOVIMIENTO` (qué ocurrió realmente).

## Mejoras a incorporar (añadidas en la valoración de esta propuesta)

1. **Unificar con la corrección de F-048**: el verificador de solapamiento temporal que hace falta arreglar para `TAREA_RESPONSABLE` (dedicación de personas) es el mismo que necesitará `TAREA_RECURSO` para reservar máquinas/espacios sin dobles reservas. Diseñar un único mecanismo reutilizable, no repetir el error de F-048 en `RECURSO_ACTIVO`/`RECURSO_ESPACIO`.
2. **`RECURSO_REFERENCIA` es la 3ª aparición de un vínculo polimórfico genérico** (`ENTIDAD_TIPO`+`ENTIDAD_ID`), tras `DOCUMENTO_CONTEXTO` y las relaciones de bloqueo de `INCIDENCIA`/`DECISION`. Candidato a mecanismo único reutilizable en todo el sistema, no una tabla `X_CONTEXTO`/`X_REFERENCIA` distinta por entidad.
3. **`RECURSO_MOVIMIENTO`** (histórico de entradas/salidas de stock, tipo libro mayor) — `STOCK_ACTUAL` como valor sobrescrito no permite responder "¿por qué se agotó este material?". Decidir en el mismo diseño de migración (Fase R3), no como extensión posterior separada.

## Recomendación

**PROPUESTA**: adoptar `RECURSO` como abstracción transversal. **NO PROPUESTA**: renombrar `MATERIAL` y añadirle personas/equipos/espacios directamente.

**Decisión operativa**: registrada la necesidad como fricción (F-079); continuar la prueba sin modificar el modelo; diseñar esta migración como bloque independiente posterior a la auditoría. Valor alto, impacto estructural alto — no acometer sin la evidencia empírica que todavía falta (alta real de `MATERIAL`/`PROVEEDOR`).
