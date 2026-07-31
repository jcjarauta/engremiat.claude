# Propuesta consolidada — Mejora de la relación PROYECTO_PRODUCTO

**Origen:** fricciones F-021 a F-025 de `PRUEBA_REAL_CAMPANA.md`, detectadas al vincular PPR-0002 (PRO-0003 ↔ PRD-0002).
**Estado:** propuesta de diseño, sin desarrollar. F-025 pendiente de confirmación empírica (ver más abajo), no es una mejora de diseño sino una posible incidencia de datos.

## Esquema real verificado

**Corrección (2026-07-31)**: la primera lectura de este documento se basó solo en `Formularios.js`/`Repository.js` (campos de negocio: `PROYECTO_ID`, `PRODUCTO_ID`, `CANTIDAD_ASIGNADA`, `PRIORIDAD`, `ESTADO`) y concluyó erróneamente que faltaba `ACTIVO` separado. Verificado después contra la hoja real `04_PROYECTO_PRODUCTO` vía `gsheets`: **sí existe `ACTIVO` separado de `ESTADO`** (más `FECHA_REQUERIDA`, `FECHA_CREACION`, `CREADO_POR`, `FECHA_MODIFICACION`, `MODIFICADO_POR`, `OBSERVACIONES` como columnas de sistema no listadas en `Repository.js`). **F-023 queda invalidado** — ver sección 9 más abajo, mantenida solo como registro histórico del error de verificación.

## 1. Buscador real en desplegables (F-021)

Con muchos registros el `<select>` deja de ser operativo. Añadir búsqueda por ID/código/nombre, autocompletado, orden por relevancia, recientes, favoritos, visualización de estado/tipo. Ejemplo: `PRD-0002 · IMP-MASIVA-V1 · Módulo de importación masiva v1 · Borrador`.

## 2. Filtros de selección

`Solo activos / Solo disponibles / Todos / Incluir inactivos / Ya vinculados / No vinculados`. Por defecto: solo activos, ocultar ya vinculados, advertir antes de reutilizar producto obsoleto/inactivo.

## 3. Vista contextual antes de vincular

Resumen de proyecto (campaña, responsable, prioridad, estado, fechas) y producto (código, versión, tipo, responsable, estado, proyectos donde ya se usa) antes de confirmar la relación.

## 4. ROL_PRODUCTO

```
ROL_PRODUCTO
- Entregable principal / Entregable secundario / Componente / Prototipo /
  Documento / Servicio / Resultado intermedio / Producto reutilizado
```

Para PPR-0002: `ROL_PRODUCTO=ENTREGABLE_PRINCIPAL`.

## 5. Versión contextual

`VERSION_REQUERIDA`, `VERSION_ENTREGADA`, `VERSION_ACEPTADA` — evita que un cambio futuro en `PRODUCTO.VERSION` altere implícitamente proyectos anteriores.

## 6. Fechas de la relación

`FECHA_NECESARIA`, `FECHA_ENTREGA_PREVISTA`, `FECHA_ENTREGA_REAL`, `FECHA_ACEPTACION` — la fecha requerida del producto global puede no coincidir con la de cada proyecto.

## 7. Responsable contextual

`RESPONSABLE_RELACION_ID`, `EQUIPO_RESPONSABLE_ID`, `VALIDADOR_ID` — el responsable global del producto puede diferir del responsable de su implantación en un proyecto concreto.

## 8. Criterios de aceptación contextual

`CRITERIOS_ACEPTACION`, `RESULTADO_ESPERADO`, `DEFINITION_OF_DONE`, `RESULTADO_VALIDACION`.

## 9. Estado mejor definido (F-023 — INVALIDADO, ver corrección arriba)

~~Separar `ACTIVO=SÍ/NO` de `ESTADO_RELACION`~~ — no hace falta, `ACTIVO` ya existe en la hoja real, separado de `ESTADO`. Sin acción.

## 10. Prioridad heredada o específica

```
PRIORIDAD_EN_PROYECTO
- Heredar del proyecto / Heredar del producto / Definir específicamente
```
Registrar también `ORIGEN_PRIORIDAD` para saber cuál prevalece.

## 11. Cantidad y unidad contextual

```
TIPO_ASIGNACION  (CANTIDAD / ENTREGA_UNICA / VERSION / HORAS / SESIONES / PLAZAS / CAPACIDAD)
UNIDAD_ASIGNACION
CANTIDAD_ASIGNADA
```
Para PPR-0002: `TIPO_ASIGNACION=ENTREGA_UNICA`, `CANTIDAD_ASIGNADA=1`.

## 12. Orden y dependencia entre entregables

`ORDEN_ENTREGA`, `DEPENDE_DE_PPR_ID`, `BLOQUEA_PPR_ID` — permite representar cadenas tipo "plantilla → staging → validación → importador → informe".

## 13. Reutilización controlada (F-022 — patrón nuevo, no visto en niveles anteriores)

Antes de vincular un producto existente: nº de proyectos activos que lo usan, versión, disponibilidad, incompatibilidades, carga del responsable, dependencias, riesgo de cambio compartido.

```
MODO_USO
- Referencia compartida / Reutilización sin cambios / Adaptación específica / Clonación como nuevo producto
```

**Nota**: a diferencia de los mecanismos transversales de asignación/relación/clasificación/aceptación vistos en CAMPANA→PROYECTO→PRODUCTO, este es específico de relaciones N:M de *recurso compartido reutilizado* — candidato a reaparecer en `PRODUCTO_MATERIAL`/`TAREA_MATERIAL`, que son el mismo patrón.

## 14. Operaciones desde ambos sentidos

Crear desde `Proyecto → Añadir producto` y `Producto → Vincular a proyecto`; consultar desde ambos registros.

## 15. Edición y baja segura

Editar contexto, desactivar relación, motivo de retirada, conservar historial, impedir borrado físico, advertir si hay procesos/tareas/documentos dependientes. Campos: `MOTIVO_DESVINCULACION`, `FECHA_DESVINCULACION`, `DESVINCULADO_POR`.

## 16. Validaciones de integridad nuevas propuestas

```
FUNC-REL-002  Relación duplicada activa
FUNC-REL-003  Proyecto inactivo relacionado
FUNC-REL-004  Producto inactivo relacionado
FUNC-REL-005  Versión requerida ausente cuando aplica
FUNC-REL-006  Fecha de entrega anterior al inicio del proyecto
FUNC-REL-007  Relación aceptada sin validación
FUNC-REL-008  Producto reutilizado con versiones incompatibles
FUNC-REL-009  ID no normalizado
```
Cobertura actual verificada: solo FK y cantidad positiva (`FUNC-REL-001`). Sin evidencia de reglas contextuales — no implementar hasta que el modelo de campos exista.

## Prioridad recomendada para una primera iteración

Buscador y filtro de activos; `ROL_PRODUCTO`; `VERSION_REQUERIDA`; `FECHA_ENTREGA_PREVISTA`; `RESPONSABLE_RELACION_ID`; `CRITERIOS_ACEPTACION`; separar `ACTIVO`/`ESTADO_RELACION`; normalización estricta de IDs.

## F-025 — posible ID no normalizado — DESCARTADO

Verificado contra la celda real (`gsheets`, hoja `04_PROYECTO_PRODUCTO`): `PRODUCTO_ID="PRD-0002"`, exacto, sin espacio. Era artefacto del texto pegado en el chat. Sin acción.
