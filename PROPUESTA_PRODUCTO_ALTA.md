# Propuesta consolidada — Mejora del alta de producto

**Origen:** fricciones F-014 a F-018 de `PRUEBA_REAL_CAMPANA.md`, detectadas al dar de alta PRD-0002 ("Módulo de importación masiva v1", dentro de PRO-0003/CAM-0010).
**Estado:** propuesta de diseño, sin desarrollar.

## Observación transversal (la más importante de este lote)

Con PRODUCTO se confirma por tercera vez consecutiva (CAMPANA → PROYECTO → PRODUCTO) el mismo conjunto de necesidades genéricas, no específicas de cada entidad:

1. **Asignación N:M persona/equipo** — `CAMPANA_RESPONSABLE`, `PROYECTO_PARTICIPANTE`, `PRODUCTO_PARTICIPANTE` (4ª aparición contando tarea↔persona/equipo, Fase D).
2. **Grafo de relaciones entre entidades del mismo tipo** — `PROYECTO_RELACION`, `PRODUCTO_RELACION` (2ª aparición).
3. **Clasificación en tres ejes** (tipo / prioridad / madurez-estado) — `TIPO_PROYECTO` (F-008), `TIPO_PRODUCTO` (F-016).
4. **Criterios de aceptación/cierre estructurados** — `CRITERIO_CIERRE` (CAMPANA), `PROYECTO_ENTREGABLE` (PROYECTO), `DEFINITION_OF_DONE` (PRODUCTO).

Antes de diseñar cada bloque K por separado, confirmar si PROCESO/TAREA repiten el mismo patrón. Si es así, diseñar 3-4 mecanismos polimórficos reutilizables en toda la jerarquía, no una tabla ad-hoc por nivel.

## 1. Normalización del código

Separar `CODIGO_INTERNO` / `CODIGO_GENERADO` / `ALIAS`. Patrón propuesto: `<TIPO>-<AREA>-<SECUENCIA>` (ej. `SW-IMP-0001`). Reglas: mayúsculas, sin espacios/acentos, `A-Z0-9-`, longitud limitada, unicidad global, inmutable tras aprobación, nombre modificable, alias opcional. No incluir versión en el código estable — la versión va en `VERSION`.

**Verificar contra `Ids.js` antes de diseñar más**: no crear un segundo sistema de codificación en paralelo al generador de IDs ya existente.

## 2. Vincular producto a proyecto desde el alta

Mantener `PROYECTO_PRODUCTO` (permite N:M, cantidad/fechas por relación, trazabilidad independiente) pero evitar dos flujos desconectados en la UI.

```
[Guardar y vincular]
1. Crear PRODUCTO
2. Crear PROYECTO_PRODUCTO
3. Mismo CORRELATION_ID
4. Si falla la relación, revertir el producto
5. Registrar ambas operaciones
```

**Reutiliza el patrón `CORRELATION_ID` + reversión ya existente en `HistorialService`/`Reversion.js`** — no requiere mecanismo nuevo, solo componer dos operaciones bajo una transacción.

Campos útiles en `PROYECTO_PRODUCTO`: `ROL_PRODUCTO` (ENTREGABLE_PRINCIPAL/ENTREGABLE_SECUNDARIO/COMPONENTE/PROTOTIPO/DOCUMENTACION/SERVICIO/RESULTADO_INTERMEDIO), `CANTIDAD_ASIGNADA`, `VERSION_OBJETIVO`, `FECHA_REQUERIDA`, `PRIORIDAD_CONTEXTO`, `ESTADO_RELACION`, `RESPONSABLE_CONTEXTO_ID`, `CRITERIO_ACEPTACION`, `ACTIVO`.

No añadir `PROYECTO_ID` directamente a `PRODUCTO` — rompería la relación N:M.

## 3. TIPO_PRODUCTO

```
TIPO_PRODUCTO
- FISICO / DIGITAL / DOCUMENTAL / SERVICIO / FORMACION / PROTOTIPO / ENTREGABLE_INTERNO
```

Campos condicionales por tipo: Físico (unidad/cantidad/materiales/stock), Digital (versión/repositorio/release/entorno), Documental (versión/formato/documento vigente), Servicio (alcance/capacidad/nivel de servicio), Formación (duración/público/competencia), Prototipo (hipótesis/prueba/resultado).

## 4. Criterios de aceptación

`OBJETIVO_PRODUCTO`, `RESULTADO_ESPERADO`, `CRITERIOS_ACEPTACION`, `DEFINITION_OF_DONE`, `VALIDADOR_ID`, `FECHA_VALIDACION`, `RESULTADO_VALIDACION`.

Para PRD-0002:
```
DEFINITION_OF_DONE:
- plantilla versionada; staging operativo; dryRun sin escritura;
  importación todo-o-nada; reversión probada; trazabilidad completa;
  IntegrityService limpio; pruebas de regresión superadas; documentación aprobada.
```

## 5. Versionado y baseline (prioridad media — el más especulativo)

`VERSION_ACTUAL`, `VERSION_OBJETIVO`, `ESTADO_VERSION`, `BASELINE_ID`, `REPOSITORIO_URL`, `RAMA_DESARROLLO`, `COMMIT_BASE`, `COMMIT_ENTREGA`, `FECHA_RELEASE`. Estados: BORRADOR/EN_DESARROLLO/EN_VALIDACION/APROBADA/VIGENTE/OBSOLETA/RETIRADA. Solo aplica a `TIPO_PRODUCTO=DIGITAL`, no a todos.

## 6. Fechas más precisas

Mostrar siempre zona horaria, distinguir fecha local de timestamp, no exigir fecha para productos continuos. Añadir `TIPO_COMPROMISO`, `FECHA_OBJETIVO`, `FECHA_REVISION`, `FECHA_ENTREGA_REAL`.

## 7. Responsables y equipos

`PRODUCTO_PARTICIPANTE` (`PRODUCTO_ID`, `PERSONA_EQUIPO_ID`, `ROL`, `RESPONSABILIDAD`, `DEDICACION`, `FECHA_INICIO`, `FECHA_FIN`). Roles: PROPIETARIO/RESPONSABLE_TECNICO/DESARROLLADOR/VALIDADOR/USUARIO_CLAVE/MANTENEDOR. Ver nota transversal arriba — unificar con `CAMPANA_RESPONSABLE`/`PROYECTO_PARTICIPANTE`.

## 8. Dependencias entre productos

`PRODUCTO_RELACION` (`PRODUCTO_ORIGEN_ID`, `PRODUCTO_DESTINO_ID`, `TIPO_RELACION`: DEPENDE_DE/COMPONE/SUSTITUYE/VERSION_DE/REQUIERE/GENERA/COMPLEMENTA). Ver nota transversal — unificar con `PROYECTO_RELACION`.

## 9. Documentación y evidencias

`DOCUMENTO_REQUISITOS_ID`, `DOCUMENTO_DISENO_ID`, `MANUAL_ID`, `TUTORIAL_ID`, `CARPETA_DRIVE_URL`, `REPOSITORIO_URL`. Preferir relación por ID a `DOCUMENTO` sobre URLs sueltas cuando exista la entidad.

## 10. Viabilidad y estimación

`HORAS_ESTIMADAS`, `HORAS_REALES`, `COMPLEJIDAD`, `RIESGO_TECNICO`, `VIABILIDAD_TECNICA`, `VIABILIDAD_OPERATIVA`, `VALOR_ESPERADO` — alimenta simulación/capacidad/motor por eventos/priorización a futuro, no ahora.
