# Auditoría por bloques del sistema

Sistema de trabajo recurrente para auditar y mejorar LaTroballa por partes, en vez de en un único recorrido monolítico (como fue `PRUEBA_PILOTO_END_TO_END.md`). Complementa a ese documento: aquel fue un recorrido funcional de punta a punta; este es un marco para volver, bloque a bloque, con la misma disciplina.

## Los dos ejes no son alternativos, son una matriz

- **Eje de flujo** (cómo entra/sale el dato): **Input** (formularios, importación masiva) vs. **Output** (informes, Gantt, panel operativo, historial, exportaciones).
- **Eje de dominio** (qué gestiona): **Producción**, **Personas**, **Proveedores/Materiales**, **Espacios/Recursos**.

Cada bloque de dominio tiene su propia zona de entrada y su propia proyección en los outputs. Auditar solo por flujo mezclaría problemas de naturaleza distinta; auditar solo por dominio dejaría fuera piezas que son 100% output (como el Gantt, que no tiene formulario propio). La auditoría cruza ambos ejes.

## Bloques de dominio y su relación

```
Personas (PERSONA_EQUIPO, EQUIPO_MIEMBRO)
  └─ referenciada por TODO lo demás (RESPONSABLE_ID/VALIDADOR_ID en
     Campaña, Proyecto, Producto, Proceso, Tarea, Decisión, Incidencia,
     Recurso, Material...). Es infraestructura transversal: no genera
     producción por sí misma, no depende de ningún otro bloque.

Espacios/Recursos (RECURSO: herramienta/maquinaria/equipo_auxiliar/espacio)
  └─ usado por Producción (TAREA_RECURSO) y por Materiales (UBICACION)
  └─ jerarquía propia: un RECURSO clase Espacio puede ser la ubicación
     de otro RECURSO

Proveedores/Materiales (PROVEEDOR → MATERIAL → PEDIDO_PROVEEDOR/RECEPCION)
  └─ MATERIAL depende de PROVEEDOR (opcional) y de Espacios (UBICACION)
  └─ alimenta a Producción vía PRODUCTO_MATERIAL/TAREA_MATERIAL —
     la conexión menos probada hasta ahora (consumo real, mermas)

Producción (CAMPANA → PROYECTO → PRODUCTO → PROCESO → TAREA)
  └─ el núcleo: depende de los tres bloques anteriores
  └─ es la única fuente de la que se calculan los outputs (informes,
     Gantt, panel, desviación) — ninguno consulta Personas/Proveedores/
     Espacios directamente, siempre a través de Producción
```

**Consecuencia práctica**: casi todo el trabajo hecho hasta ahora (auditoría piloto, Gantt, desviación) se concentró en Producción y en los outputs. Personas, Proveedores y Espacios solo han recibido atención indirecta, como datos de apoyo. Es la parte con más riesgo de tener huecos sin detectar.

## Las 6 dimensiones de auditoría

Para cada bloque de dominio, revisar sistemáticamente:

| # | Dimensión | Pregunta guía |
|---|---|---|
| 1 | **Input** | ¿El formulario pide lo mínimo necesario? ¿Valores por defecto sensatos? ¿Alta rápida de catálogo donde aplique? |
| 2 | **Modelo de datos** | ¿El esquema refleja la realidad del taller? ¿Hay campos muertos o huecos (p. ej. el "(sin RESPONSABLE_ID)" detectado en Tareas)? |
| 3 | **Relaciones** | ¿Las FK hacia otros bloques están bien filtradas/contextualizadas? ¿Hay huérfanos (`IntegrityService`)? |
| 4 | **Output** | ¿Aparece en informes/panel/Gantt? ¿Se puede exportar? ¿Se puede cruzar con otros bloques? |
| 5 | **Trazabilidad** | ¿Queda registro en Historial? ¿Es reversible? |
| 6 | **Rendimiento/escala** | ¿La búsqueda/listado aguanta si crece el volumen? |

Los hallazgos de cada dimensión se clasifican con el mismo criterio ya usado en `PRUEBA_PILOTO_END_TO_END.md`: `ERROR` / `BLOQUEO` / `FRICCIÓN DE USO` / `MEJORA FUNCIONAL` / `MEJORA DE RENDIMIENTO` / `MEJORA DE TRAZABILIDAD`.

## Orden de auditoría

Bottom-up, siguiendo el grafo de dependencias — se audita primero lo que los demás bloques dan por hecho, para no tener que repetir la pasada cuando se detecte un hueco en una dependencia:

1. **Personas** — la dependencia más transversal; un hueco aquí contamina la auditoría de todo lo demás.
2. **Espacios/Recursos**
3. **Proveedores/Materiales** — la conexión menos probada hasta ahora.
4. **Producción** — ya es el bloque más maduro, pero conviene una pasada final una vez saneados 1-3.
5. **Outputs** (informes/Gantt/panel/historial) — última pasada, para verificar que cruzan bien los cuatro bloques ya revisados.

## Estado de las auditorías

| Bloque | Estado | Sesión | Hallazgos |
|---|---|---|---|
| Personas | ⬜ Pendiente | — | — |
| Espacios/Recursos | ⬜ Pendiente | — | — |
| Proveedores/Materiales | ⬜ Pendiente | — | — |
| Producción | ⬜ Pendiente (pasada final) | — | — |
| Outputs | ⬜ Pendiente | — | — |

*(Cada fila se actualiza al cerrar la auditoría de su bloque, con fecha y enlace a los hallazgos registrados en `ROADMAP_BACKLOG_MEJORAS.md` o en una sección propia de este documento.)*

---

## Plantilla de hallazgos por bloque

Al auditar un bloque, copiar esta plantilla y rellenarla:

```
### Bloque: <nombre>
Fecha: <fecha>

#### 1. Input
- Hallazgo — Clasificación — Estado (construido/diferido)

#### 2. Modelo de datos
- ...

#### 3. Relaciones
- ...

#### 4. Output
- ...

#### 5. Trazabilidad
- ...

#### 6. Rendimiento/escala
- ...

**Resumen**: N hallazgos, M construidos, K diferidos.
```
