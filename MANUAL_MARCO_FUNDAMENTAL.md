# Manual del sistema — el marco de las 8 preguntas y cómo se usa

**Fecha:** 2026-08-04
**Propósito:** este documento no es una guía paso a paso de clicks — es el razonamiento que conecta la filosofía de diseño del sistema (por qué existe cada pieza) con sus funciones concretas (qué menú, qué pantalla, qué entidad la resuelve). Sirve para entender el sistema desde arriba antes de perderse en el detalle de cada formulario.

---

## 1. La filosofía: un taller se gestiona respondiendo 8 preguntas

Desde la Fase M el roadmap dejó de organizarse por "qué entidad construyo esta semana" y empezó a organizarse alrededor de un marco de 8 preguntas fundamentales — las que cualquier persona que dirige un taller de producción se hace, en este orden de madurez:

**Qué → Quién → Dónde → Con qué → Cuándo → Cómo → Cuánto → Por qué**

Las 5 primeras (Qué/Quién/Dónde/Con qué/Cuándo) se resolvieron con el modelo de datos y la jerarquía, entre las Fases L y M. Las 3 últimas (Cómo/Cuánto/Por qué) eran preguntas de **análisis**, no de estructura — hacían falta datos ya capturados por las primeras 5 antes de poder responderlas — y se cerraron en esta sesión (N3, N5, N6). Que las 8 estén cerradas **no significa que el sistema esté terminado**: significa que ya no falta una pieza estructural. Lo que queda de aquí en adelante es refinamiento de lo que existe y expansión hacia territorio nuevo (L6, Convocatorias), no completar huecos.

---

## 2. Cómo interactuamos con el sistema: el menú de 3 polos

Todo el sistema se opera desde un único menú personalizado en Google Sheets — "Taller de Producción" — organizado en 3 polos que reflejan **para qué entras al sistema en ese momento**, no qué entidad quieres tocar:

| Polo | Para qué sirve | Ejemplo de uso |
|---|---|---|
| 📊 **Analizar** | Vistas de consulta, sin edición profunda — "¿cómo va esto?" | Ver el Panel operativo antes de empezar el día |
| 🌳 **Navegar y editar** | Árboles de jerarquía + fichas de registro, con su "Editar X" al lado — el espacio de trabajo diario | Buscar la ficha de un producto y editarlo |
| ➕ **Crear y gestionar datos** | Alta de registros/relaciones nuevas y administración — "voy a añadir algo que no existía" | Dar de alta una campaña nueva, un proveedor nuevo |

Esta separación importa porque cada pregunta fundamental tiene una **pantalla natural** dentro de uno de estos 3 polos — no hay que memorizar dónde está cada cosa, basta con preguntarse "¿estoy consultando, navegando/editando, o creando?".

---

## 3. Las 8 preguntas, una por una: qué parte del sistema las responde

### Qué — la jerarquía de producción
**Responde:** qué se está produciendo, en qué campaña, con qué estructura.
**Entidades:** `CAMPANA` → `PROYECTO` → `PRODUCTO` → `PROCESO` → `TAREA` (relación N:M `PROYECTO_PRODUCTO` porque un producto se puede reutilizar en varios proyectos).
**Dónde se ve/edita:**
- 🌳 *Navegar y editar → Campaña → Proyecto → Producto → Proceso → Tarea* — el submenú completo de edición nivel a nivel.
- **Panel de campaña** (`abrirPanelCampana`) — vista global en árbol de toda la jerarquía de una campaña, con creación encadenada padre→hijo.
- **Ficha de producto** (`abrirFichaProductoBuscar`) — agregador de solo lectura: proyectos vinculados, procesos/tareas, materiales, documentos, avance.
- ➕ *Crear y gestionar datos → Nuevo registro* — alta de cada nivel; **Importación masiva de campaña** para cargar un árbol completo de una vez.

### Quién — personas, equipos y responsabilidad
**Responde:** quién hace cada cosa, con qué rol, y quién coordina a quién.
**Entidades:** `PERSONA_EQUIPO` (persona o equipo, mismo tipo con `TIPO` distinto), `EQUIPO_MIEMBRO` (pertenencia N:M), `TAREA_RESPONSABLE` y `ASIGNACION` (asignación polimórfica reutilizable en Campaña/Proyecto/Producto/Proceso/Decisión/Incidencia), competencias (`COMPETENCIA`/`PERSONA_COMPETENCIA`).
**Dónde se ve/edita:**
- 🌳 *Navegar y editar → Personas y equipos* — árbol coordinador→equipo (`abrirPanelPersonas`), ficha de persona/equipo (proyectos involucrados, tareas por fecha, horario, documentos).
- ➕ *Crear y gestionar datos → Nueva relación/vínculo* — Equipo-Miembro, Tarea-Responsable, Asignación.
- ➕ *Crear y gestionar datos → Competencias* — base de competencias, preparación determinista para L6 (skills-matching), sin la capa de IA todavía.

### Dónde — espacios y ubicación física
**Responde:** en qué espacio físico ocurre cada cosa, y qué recursos viven en cada espacio.
**Entidades:** `RECURSO` con `CLASE_RECURSO='Espacio'`, autorreferenciado vía `UBICACION_ID` para formar el árbol físico real del taller (La Troballa → Manipulados/Carpintería/Almacén/Cerámica/Cocina/Tienda/Oficina → estanterías/cajones).
**Dónde se ve/edita:**
- 🌳 *Navegar y editar → Espacios y recursos* — árbol de espacios/recursos (`abrirPanelRecursos`), ficha de espacio/recurso.

### Con qué — materiales, herramientas y proveedores
**Responde:** con qué materiales y herramientas se produce, de qué proveedor vienen, y cuánto stock queda.
**Entidades:** `MATERIAL`, `PROVEEDOR`, `PROVEEDOR_MATERIAL` (precio/plazo/preferente), `PRODUCTO_MATERIAL`/`TAREA_MATERIAL` (consumo previsto/real), `RECURSO` con `CLASE_RECURSO` Herramienta/Maquinaria/Equipo_auxiliar, `TAREA_RECURSO` (uso), `MOVIMIENTO_MATERIAL` (libro de movimientos) + `PEDIDO_PROVEEDOR`/`RECEPCION` (ciclo de compra completo).
**Dónde se ve/edita:**
- 🌳 *Navegar y editar → Materiales y proveedores* — ficha de material y de proveedor, con proveedor/precio/coste estimado ya integrado en la ficha de producto (no como ficha aislada).
- ➕ *Crear y gestionar datos → Movimientos y confirmaciones* — Confirmar recepción de pedido, Movimiento de material.
- `MATERIAL.STOCK_ACTUAL` se recalcula automáticamente desde el libro de movimientos (N7.2) — no se edita a mano.

### Cuándo — tiempo, capacidad y horarios
**Responde:** cuándo está previsto que ocurra cada cosa, cuándo ocurrió de verdad, y cuándo hay capacidad disponible.
**Entidades:** fechas plan/real en cada nivel de la jerarquía, `HORARIO` (franjas semanales recurrentes de personas/espacios, con vigencia temporal), `EJECUCION_TAREA` (ocurrencia real vs. definición reutilizable de la tarea).
**Dónde se ve/edita:**
- 📊 *Analizar → Gantt: plan vs. real* — el punto de entrada a **todas** las vistas temporales: Gantt de dos barras (plan/real), Vista del día (agenda cruzando tareas + horario + incidencias), Vista de rango (quién ha estado dónde), Calendario semanal (rejilla Lunes-Domingo × horas).
- 📊 *Analizar → Kanban operativo* y **Listado filtrable** — vistas baratas de "qué está pendiente ahora", sin necesidad de abrir un Gantt.

### Cómo — el Gantt como espacio operativo
**Responde:** cómo se está ejecutando el plan de verdad — no solo fechas, sino fases, cuellos de botella y calidad de la planificación.
**Construido en N3:** vista de fases agrupada por producto (Preproducción/Producción/Postproducción, previsto vs. real), overlay de capacidad real (`HORARIO`) sobre las barras del Gantt, indicador de cuello de botella + hitos (`FECHA_REQUERIDA`), informe de calidad de planificación (% a tiempo, desviación media por fase/responsable/recurso).
**Dónde se ve:** mismo diálogo que "Cuándo" (📊 *Analizar → Gantt: plan vs. real*) — es la misma pantalla vista con otra pregunta, no una pantalla nueva. También **Informes → Calidad de planificación**.

### Cuánto — coste real
**Responde:** cuánto cuesta de verdad una campaña/proyecto/producto, comparado contra lo presupuestado, y con qué se financia.
**Construido en N5 (`CosteService.js`):** materiales (estimado desde precio de proveedor preferente), recursos (coste diario por amortización o periódico × días de uso real), actividad/otros costes directos, comparación contra `PRESUPUESTO` por categoría, múltiples `FUENTE_FINANCIACION`.
**Dónde se ve:**
- ➕ *Crear y gestionar datos → Presupuesto y financiación* — alta de presupuesto, fuentes, costes.
- 📊 *Analizar → Informes → Justificación económica* — informe completo con exportación PDF propia, comparativa entre campañas.

### Por qué — impacto y evidencia
**Responde:** por qué merece la pena esta campaña más allá del coste — qué impacto social/ecológico/económico genera, con qué evidencia.
**Construido en N6 (`EvidenciaSocialService.js`):** `ETIQUETA_IMPACTO` (categoría Social/Ecológico/Económico + descripción, en Campaña/Proyecto/Producto), impacto social (personas voluntarias/atendidas y días de dedicación, reutilizando datos de `TAREA_RESPONSABLE`), reutilización de producto/proceso como proxy de aprovechamiento de recursos.
**Dónde se ve:**
- ➕ *Crear y gestionar datos → Impacto* — alta de etiquetas de impacto.
- 📊 *Analizar → Informes → Evidencia de impacto (Por qué)* — informe dedicado, pensado para alimentar el Balanç Social anual con datos reales.

---

## 4. Mapa completo de vistas disponibles

### Vistas de consulta (📊 Analizar)
| Vista | Qué muestra |
|---|---|
| Panel operativo | Resumen del día, alertas, excepciones (recursos sin técnico disponible, etc.) |
| Informes | 7 tipos: Campaña, Proyecto, Memoria de producción, Desviación, Calidad de planificación, Justificación económica, Evidencia de impacto |
| Gantt: plan vs. real | Gantt de dos barras, Vista del día, Vista de rango, Calendario semanal |
| Kanban operativo | Tarea/Proceso/Incidencia por columnas de estado |
| Listado filtrable | Incidencias abiertas, Decisiones pendientes, Documentos vigentes |
| Verificar integridad | 90 reglas de integridad activas, ejecutables bajo demanda |
| Historial | Auditoría de cambios (`91_HISTORIAL`) |

### Vistas de navegación/edición (🌳 Navegar y editar)
| Vista | Ámbito |
|---|---|
| Panel de campaña | Árbol completo Campaña→Tarea, con creación encadenada |
| Panel de personas | Árbol coordinador→equipo |
| Panel de recursos | Árbol de espacios/recursos físico |
| Fichas de registro | Producto, Persona/Equipo, Recurso, Material, Proveedor, Incidencia, Convocatoria — todas agregadores de solo lectura con cross-navegación |
| Editar X (por entidad) | ~25 entidades, todas con buscador (`SelectorRegistro.html`) en vez de escribir el ID a ciegas |

### Vistas de creación (➕ Crear y gestionar datos)
Formulario genérico único (`FormularioGenerico.html`) reutilizado para las ~35 entidades del sistema, con validación en cliente, sugerencias automáticas de código/orden/predecesor, y detección de dependientes bloqueantes al desactivar un registro.

---

## 5. Lo que este marco NO cubre (a propósito)

El marco de 8 preguntas responde "cómo gestiono el taller que ya tengo". No responde ni pretende responder:
- **Quién puede hacer qué** (roles/permisos — N9, diferido, es una decisión de gobernanza).
- **Qué debería hacer a continuación el sistema por mí** (recomendaciones, matching automático, generación de propuestas — L6, aparcado hasta que haya evidencia real de uso).
- **Qué convocatorias externas encajan y cómo presentarse a ellas de forma automática** (Convocatoria Capas 2/3 — scraping + IA, aparcado).

Estas tres son extensiones sobre el marco, no huecos dentro de él.
