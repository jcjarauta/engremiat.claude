# Propuesta consolidada — Gestión de proveedores

**Origen:** fricciones F-089 a F-098 (renumeradas; local F-059 a F-068 colisionaba con INCIDENCIA/DOCUMENTO), detectadas al dar de alta PRV-0005.
**Estado:** propuesta de diseño, sin desarrollar.

## Esquema real verificado
`PROVEEDOR` (`Formularios.js:307-318`): `CODIGO`, `NOMBRE`, `NIF_CIF`, `PERSONA_CONTACTO` (único, texto), `EMAIL`, `TELEFONO`, `DIRECCION` (texto único), `PLAZO_ENTREGA_DIAS` (global, no por material), `ESTADO` (`CFG_ESTADO_PROVEEDOR`), `OBSERVACIONES`. Confirma todas las afirmaciones del lote.

**Hallazgo más importante**: `PRV-0005` quedó `ESTADO=Activo` pese a que sus propias observaciones dicen que no representa relación comercial confirmada — **4ª aparición del patrón "estado sin criterio verificable"** (tras PROCESO F-033, TAREA F-044, INCIDENCIA F-065). Ya es una característica sistémica de cómo se diseñaron los catálogos de estado en todo el sistema, no un caso aislado — tratar como una única decisión de diseño transversal (precondiciones deterministas por estado, en general), no como arreglos independientes por entidad.

## Modelo estructural propuesto
```
PROVEEDOR            → identidad y gobierno
PROVEEDOR_MATERIAL   → oferta concreta (misma familia que PRODUCTO_MATERIAL/TAREA_MATERIAL)
PEDIDO/RECEPCION     → operación real
EVALUACION_PROVEEDOR → desempeño histórico
```

## Identidad y código
```
TIPO_PROVEEDOR (COMERCIAL/FABRICANTE/DISTRIBUIDOR/SERVICIOS/LOGISTICO/COLABORADOR/DONANTE/INTERNO/ENTIDAD_SOCIAL/ADMINISTRACION)
RAZON_SOCIAL / NOMBRE_COMERCIAL / PAIS_FISCAL / SITIO_WEB / ESTADO_PROVEEDOR / ACTIVO
```
Código normalizado: `PRV-<FAMILIA>-<SECUENCIA>` (ej. `PRV-PAP-0002`), longitud uniforme, generación asistida, no reutilizable tras baja. Relevante para LaTroballa: proveedores no comerciales (donantes, entidades sociales) son un caso real, no un edge case.

## Identificación fiscal
```
TIPO_IDENTIFICADOR_FISCAL / IDENTIFICADOR_FISCAL / ESTADO_VALIDACION_FISCAL (NO_INFORMADO/PENDIENTE_VALIDACION/VALIDADO/INVALIDO/NO_APLICA) / FECHA_VALIDACION_FISCAL / VALIDADO_POR
```
Permitir vacío para donantes/colaboradores/registros preliminares; `Activo` no debe equivaler a identidad fiscal validada.

## F-089 — Código manual sin normalización
Prioridad: media.

## F-090 — Un único contacto
```
PROVEEDOR_CONTACTO
- ID_CONTACTO / PROVEEDOR_ID / NOMBRE / CARGO / DEPARTAMENTO / EMAIL / TELEFONO / CANAL_PREFERENTE /
  TIPO_CONTACTO (COMERCIAL/ADMINISTRACION/LOGISTICA/SOPORTE_TECNICO/FACTURACION/EMERGENCIAS/GENERAL) /
  ES_PRINCIPAL / HORARIO_CONTACTO / ACTIVO / OBSERVACIONES
```
Prioridad: media.

## F-091 — Dirección única y no estructurada
```
PROVEEDOR_DIRECCION
- ID_DIRECCION / PROVEEDOR_ID / TIPO_DIRECCION (FISCAL/ALMACEN/RECOGIDA/DEVOLUCIONES/OFICINA) /
  VIA / NUMERO / COMPLEMENTO / CODIGO_POSTAL / LOCALIDAD / PROVINCIA / PAIS / INSTRUCCIONES / ACTIVO
```
Prioridad: baja/media.

## F-092 — Plazo global no contextual
```
PLAZO_ESTANDAR_PROVEEDOR / PLAZO_ESPECIFICO_MATERIAL / TIPO_DIAS (NATURALES/LABORABLES) / PLAZO_URGENTE / FECHA_ULTIMA_REVISION
PLAZO_REAL_MEDIO / DESVIACION_MEDIA_DIAS / PORCENTAJE_ENTREGAS_A_TIEMPO  (derivados de recepciones históricas)
```
Prioridad: alta.

## F-093 — Un único proveedor por material (mejora funcional prioritaria según el autor)
```
PROVEEDOR_MATERIAL
- ID_PROVEEDOR_MATERIAL / PROVEEDOR_ID / MATERIAL_ID / CODIGO_MATERIAL_PROVEEDOR / UNIDAD_COMPRA /
  CANTIDAD_POR_UNIDAD_COMPRA / PRECIO_UNITARIO / MONEDA / PEDIDO_MINIMO / PLAZO_ENTREGA_DIAS / TIPO_DIAS /
  ES_PREFERENTE / CALIDAD_HOMOLOGADA / FECHA_INICIO_VIGENCIA / FECHA_FIN_VIGENCIA / ESTADO / ACTIVO / OBSERVACIONES
  (ESTADO: PROPUESTO/EN_VALIDACION/HOMOLOGADO/PREFERENTE/SUSPENDIDO/DESCATALOGADO)
```
`MATERIAL.PROVEEDOR_ID` actual podría mantenerse provisionalmente como proveedor preferente; la fuente futura sería `PROVEEDOR_MATERIAL`. Prioridad: alta — resuelve simultáneamente alternativas, plazos, precios, unidades de compra y resiliencia de suministro.

## Condiciones comerciales y tarifas versionadas
```
MONEDA / FORMA_PAGO / PLAZO_PAGO_DIAS / PEDIDO_MINIMO / GASTOS_ENVIO / ENVIO_GRATIS_DESDE / DESCUENTO_GENERAL / CONDICIONES_DEVOLUCION / IVA_APLICABLE

TARIFA_PROVEEDOR
- ID_TARIFA / PROVEEDOR_MATERIAL_ID / PRECIO / MONEDA / CANTIDAD_MINIMA / DESCUENTO / FECHA_INICIO / FECHA_FIN / DOCUMENTO_ORIGEN_ID / ESTADO
```
No sobrescribir precios históricos — permite saber qué precio estaba vigente y comparar viabilidad entre proveedores.

## F-095 — Estado "Activo" insuficiente (4ª aparición del patrón "estado sin criterio verificable")
```
ACTIVO → vigencia técnica
ESTADO_PROVEEDOR (BORRADOR/PENDIENTE_VALIDACION/HOMOLOGADO/ACTIVO/SUSPENDIDO/BLOQUEADO/INACTIVO/DESCARTADO)
```
Reglas: activo no implica homologado; bloqueado no admite pedidos; suspendido conserva histórico; homologación requiere documentación mínima; no borrar proveedores con movimientos/pedidos asociados. Prioridad: alta.

## F-096 — Sin documentación ni vigencias
```
PROVEEDOR_DOCUMENTO
- ID_RELACION / PROVEEDOR_ID / DOCUMENTO_ID / TIPO_DOCUMENTO (CONTRATO/TARIFA/CERTIFICADO/FICHA_TECNICA/SEGURO/DOCUMENTO_FISCAL/CONDICIONES_COMERCIALES/PROTECCION_DATOS) / FECHA_EMISION / FECHA_CADUCIDAD / ESTADO_VALIDACION / VALIDADO_POR / ACTIVO
```
Alimentaría al motor por eventos: documento próximo a caducar, tarifa obsoleta, certificado ausente. Prioridad: media.

## F-098 — Sin gestión de pedidos y recepciones (fase logística posterior)
```
SOLICITUD_COMPRA → PEDIDO_PROVEEDOR → PEDIDO_LINEA → RECEPCION → RECEPCION_LINEA → DEVOLUCION_PROVEEDOR
```
Cada recepción actualizaría inventario vía `MOVIMIENTO_MATERIAL`/`RECURSO_MOVIMIENTO` (mismo mecanismo unificado de `PROPUESTA_RECURSO_MATERIAL.md`), no edición directa de `STOCK_ACTUAL`. Prioridad: alta, para fase posterior.

## F-094 — Sin evaluación histórica
```
EVALUACION_PROVEEDOR
- ID_EVALUACION / PROVEEDOR_ID / PERIODO / ENTREGAS_TOTALES / ENTREGAS_A_TIEMPO / RETRASO_MEDIO_DIAS /
  INCIDENCIAS_CALIDAD / DEVOLUCIONES / VALORACION_CALIDAD / VALORACION_PRECIO / VALORACION_SERVICIO /
  RIESGO_SUMINISTRO / RESULTADO (PREFERENTE/APTO/APTO_CON_WARN/EN_REVISION/NO_APTO) / OBSERVACIONES
```
Métricas calculadas desde hechos reales cuando sea posible. Prioridad: media.

## F-097 — Sin condiciones comerciales ni precios versionados
Ver "Condiciones comerciales y tarifas versionadas" arriba. Prioridad: media.

## Riesgos y continuidad de suministro (sin F numerada)
```
ES_PROVEEDOR_UNICO / DEPENDENCIA_CRITICA / RIESGO_SUMINISTRO / ALTERNATIVA_DISPONIBLE / MATERIALES_CRITICOS_ASOCIADOS
```
Casos: material crítico con proveedor único, retrasos recurrentes, proveedor bloqueado con reservas activas, sin alternativa, tarifa/contrato caducado.

## Motor por eventos (futuro)
`PROVEEDOR_NUEVO_PENDIENTE_VALIDACION`, `DOCUMENTO_PROXIMO_A_CADUCAR`, `PLAZO_REAL_SUPERA_ESTIMADO`, `RETRASO_REITERADO`, `PROVEEDOR_UNICO_CRITICO`, `PRECIO_INCREMENTADO`, `MATERIAL_DESCATALOGADO`, `PROVEEDOR_SUSPENDIDO` — acciones siempre pendientes de aprobación humana.

## Validaciones de integridad propuestas
```
FUNC-PRV-001  Código normalizado y único
FUNC-PRV-002  Identificador fiscal duplicado
FUNC-PRV-003  Email inválido
FUNC-PRV-004  Plazo negativo o no entero
FUNC-PRV-005  Proveedor homologado sin documentación obligatoria
FUNC-PRV-006  Proveedor bloqueado con nuevos pedidos
FUNC-PRV-007  Más de un contacto principal del mismo tipo
FUNC-PRV-008  Más de un proveedor preferente activo para el mismo material sin autorización
FUNC-PRV-009  Proveedor-material sin unidad de compra
FUNC-PRV-010  Precio sin vigencia o moneda
FUNC-PRV-011  Material crítico con proveedor único
FUNC-PRV-012  Proveedor inactivo referenciado como preferente
```

## Priorización (según el autor)
Bloque mínimo: `TIPO_PROVEEDOR`, separar razón social/nombre comercial, normalización código/NIF, estados de validación/homologación, `PROVEEDOR_MATERIAL` N:M, plazo por material, preferente/alternativos. Segundo bloque: contactos múltiples, documentos/caducidades, tarifas versionadas, condiciones comerciales, direcciones estructuradas. Tercer bloque: solicitudes/pedidos, recepciones/devoluciones, integración con movimientos, evaluación automática, motor por eventos.
