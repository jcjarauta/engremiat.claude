# Propuesta consolidada — Mejora de DOCUMENTO

**Origen:** fricciones F-066 a F-073, detectadas al dar de alta DOC-0002 (vinculado a CAM-0010).
**Estado:** propuesta de diseño, sin desarrollar.

## Esquema real verificado
`DOCUMENTO` (`Formularios.js:471-482`): `ENTIDAD_TIPO`, `ENTIDAD_ID` (FK dependiente única), `TIPO_DOCUMENTO`, `TITULO`, `DESCRIPCION`, `VERSION` (texto libre), `URL` (texto libre obligatorio, sin validación de formato), `ESTADO`, `FECHA_DOCUMENTO`, `OBSERVACIONES`. Confirma F-066, F-067, F-068, F-069, F-070, F-072 exactamente.

**Relación con trabajo ya existente**: `IntegrityService.js` ya tiene reglas `FUNC-DOC-001` a `006` (Fase F de esta auditoría: FK huérfana/inactiva, doble vigencia, duplicado exacto, formato de VERSION/URL). Complementarias a este lote, no redundantes — diseñar juntas al implementar para no duplicar semántica de "versión válida".

## F-066 — Alta documental depende de URL externa
```
[Crear Google Doc] / [Seleccionar desde Drive] / [Subir archivo] / [Introducir URL]
```
Flujo: crear/seleccionar → obtener `FILE_ID` → registrar `DOCUMENTO` → crear `DOCUMENTO_CONTEXTO` → mismo `CORRELATION_ID`. Prioridad: alta.

## F-067 — Documento limitado a una sola entidad
```
DOCUMENTO_CONTEXTO
- ID_RELACION / DOCUMENTO_ID / ENTIDAD_TIPO / ENTIDAD_ID / TIPO_RELACION
  (DOCUMENTO_BASE/ESPECIFICACION/EVIDENCIA/RESULTADO/MANUAL/TUTORIAL/ACTA/REFERENCIA/APROBACION)
  / ES_PRINCIPAL / ACTIVO
```
Para DOC-0002: debería poder relacionarse también con PRO-0003, DEC-0003, INC-0014, TAR-0004. Prioridad: alta.

## F-072 — No existe documento principal
```
ES_PRINCIPAL / ORDEN_VISUALIZACION
```
Regla: una entidad puede tener varios documentos, pero solo un `DOCUMENTO_BASE` principal activo por tipo. Prioridad: alta.

## F-068 — Versionado no controlado
```
DOCUMENTO_LOGICO_ID / DOCUMENTO_PADRE_ID / VERSION / ES_VERSION_VIGENTE / SUSTITUYE_A_ID / MOTIVO_NUEVA_VERSION / FECHA_VIGENCIA
```
Reglas: una sola versión vigente por documento lógico; versión aprobada no se sobrescribe; nueva versión indica qué sustituye; versiones anteriores consultables; URL puede cambiar por versión. Prioridad: alta.

## Separar estado documental y vigencia (sin F numerada, parte de F-069)
```
ESTADO_REVISION  (BORRADOR/EN_REVISION/REQUIERE_CAMBIOS/APROBADO/RECHAZADO)
ESTADO_VIGENCIA  (PENDIENTE/VIGENTE/OBSOLETO/RETIRADO/ARCHIVADO)
```
Un documento puede estar aprobado pero no vigente todavía.

## F-069 — Falta de revisión y aprobación (recalibrado a "alta", ver valoración)
```
AUTOR_ID / REVISOR_ID / APROBADOR_ID / FECHA_REVISION / FECHA_APROBACION / RESULTADO_REVISION / OBSERVACIONES_REVISION
```
Crítico conceptualmente para manuales, procedimientos, tutoriales, decisiones, documentación generada por IA. Prioridad: alta (no crítica — gap real, pero sin comportamiento incorrecto activo).

## F-070 — URL sin validación demostrada
```
PROVEEDOR / FILE_ID_EXTERNO / URL_CANONICA / ESTADO_ENLACE (ACCESIBLE/SIN_PERMISO/NO_ENCONTRADO/URL_INVALIDA/NO_VERIFICADO) / ULTIMA_COMPROBACION
```
Validaciones: URL bien formada, protocolo permitido, proveedor reconocido, FILE_ID extraíble, recurso accesible, duplicidad, permisos, tipo de archivo. Prioridad: alta.

## Detección de duplicados (sin F numerada)
Antes de guardar, comprobar misma URL canónica / mismo FILE_ID / mismo título+versión / mismo documento lógico+versión. Ofrecer `[Usar existente]`/`[Nueva relación]`/`[Nueva versión]` en vez de duplicar.

## F-071 — Tipología documental insuficiente
Ampliar catálogo: PLAN, ESPECIFICACION, REQUISITOS, MANUAL, TUTORIAL, CHECKLIST, MEMORIA, ACTA, INFORME, EVIDENCIA, DISEÑO, PRUEBA, PROTOCOLO, FICHA_TECNICA, PRESUPUESTO, REFERENCIA, DECISION. "Otro" exige descripción específica. Para DOC-0002 el tipo más adecuado sería `PLAN` o `MEMORIA_OPERATIVA`, no "Otro". Prioridad: media.

## Metadatos técnicos (sin F numerada)
```
FORMATO / IDIOMA / CONFIDENCIALIDAD / ETIQUETAS / TAMAÑO / HASH / FECHA_ULTIMA_MODIFICACION_EXTERNA
```
El hash permitiría detectar cambios externos no registrados.

## F-073 — Sin detección de cambios externos
Guardar `FILE_ID`, fecha externa y hash — el archivo puede modificarse en Drive sin registrar versión ni revisión. Prioridad: media.

## Revisión periódica (sin F numerada)
```
REQUIERE_REVISION / FECHA_PROXIMA_REVISION / CADENCIA_REVISION / MOTIVO_REVISION
```
Alimentaría al futuro motor por eventos: `DOCUMENTO_VIGENTE + REVISION_VENCIDA → proponer revisión`.

## Documentos obligatorios según estado (sin F numerada, diseño futuro)
Reglas configurables (WARN/ERR): campaña cerrada → memoria final; producto aceptado → evidencia de validación; tarea preparada → manual/checklist si aplica; incidencia cerrada → evidencia de verificación; decisión aprobada → resolución documentada.

## Navegación/búsqueda y acciones desde la entidad (sin F numerada, mismo patrón ya visto)
Búsqueda por ID/título/tipo, filtros (entidad/estado/vigente/autor), recientes, principales, sin revisar, enlaces rotos. Acciones directas desde campaña/proyecto/tarea/decisión/incidencia: `[Añadir documento]`/`[Ver documentos]`/`[Marcar principal]`/`[Crear nueva versión]`.

## Prioridad recomendada (según el autor)
`DOCUMENTO_CONTEXTO`, `ES_PRINCIPAL`, `FILE_ID_EXTERNO`+`URL_CANONICA`, versionado controlado, `REVISOR_ID`+`APROBADOR_ID`, creación/selección desde Drive, validación de enlace, ampliación de catálogo.

**Hallazgo principal**: DOCUMENTO funciona como registro de enlace, no como sistema documental completo (archivo → contexto → versión → revisión → aprobación → vigencia → trazabilidad → reutilización).
