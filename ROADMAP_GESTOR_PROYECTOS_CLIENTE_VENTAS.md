# Roadmap: Cliente, Mantenimiento y Ventas en Gestor de Proyectos

Consolidación de la conversación de asesoría técnica sobre cómo cerrar el
ciclo Proveedor→Material→Producto→Proyecto→**Cliente→Venta** en el Gestor
de Proyectos. Prioriza lo económico: primero lo que genera trazabilidad de
ingreso/margen real, después CRM/prospección avanzada, después
automatización de infraestructura (no es urgente, es conveniencia).

No sustituye ni compite con el proceso de auditoría formal de La Troballa
(`package-map.json`, `ROADMAP_AUDITORIA_UX.md` etc.) -- es la hoja de ruta
de una ampliación nueva, sobre Gestor de Proyectos.

## Fase 0 -- Cliente (fundación, sin esto nada de lo demás encaja)

Entidad nueva `CLIENTE` (hoja `38_CLIENTE`, prefijo `CLI`), primera pieza
sin precedente directo en las 37 tablas actuales del Core (lo más cercano
es `PROVEEDOR`, mismo patrón de ficha).

- Identificación: `CODIGO`, `NOMBRE`, `TIPO_CLIENTE` (catálogo:
  Entidad social / Ayuntamiento / Empresa / Particular / Cliente_software).
- Contacto: `NIF_CIF`, `PERSONA_CONTACTO`, `EMAIL`, `TELEFONO`, `DIRECCION`.
- Relación comercial: `RESPONSABLE_CUENTA_ID` (fk PERSONA_EQUIPO),
  `ESTADO` (catálogo ESTADO_CLIENTE: Prospecto/Activo/En_pausa/Baja).
- Puente con el mundo técnico: `SHEET_URL`, `SCRIPT_ID`,
  `MODULOS_CONTRATADOS` -- hoy solo viven en `tools/constructor/clientes.json`;
  aquí es donde un futuro flujo de aprovisionamiento (ver Fase 3)
  escribiría el resultado real.
- `PROYECTO` gana `CLIENTE_ID` (opcional -- proyectos internos como el
  propio Gestor de Proyectos no llevan cliente).
- `INCIDENCIA.NIVEL_INCIDENCIA` gana el valor `Cliente` (catálogo abierto,
  mismo patrón que Campaña/Proyecto/Producto/Proceso/Tarea).
- `DOCUMENTO`/`ASIGNACION` (genéricas, ya existentes) se reutilizan tal
  cual -- sin cambios.

## Fase 1 -- Mantenimiento (usa Cliente, sin entidades nuevas)

- (A, recomendado para empezar) `PROYECTO` de tipo `Mantenimiento` (ya
  existe el hueco en `TIPO_PROYECTO`, ya validado con el piloto
  `PRO-0003`) como contenedor de incidencias de soporte de un cliente ya
  entregado, sin fecha de fin obligatoria.
- (B, solo si hace falta formalizar SLA/cuota) entidad `CONTRATO_SERVICIO`
  -- ver Fase 2, se fusiona con el lado de ingresos por servicio.
- `PanelClientes.html` (mismo patrón que `PanelCampana`/`PanelRecursos`):
  cartera de clientes, incidencias abiertas por cliente y antigüedad,
  accesos directos a "Nueva incidencia" / "Ver Sheet real"
  (`CLIENTE.SHEET_URL`). Reutiliza el exportador CSV compartido
  (`construirCsvConBom_`/`abrirDialogoDescargaCSV_`).
- **No bloqueante, pendiente de definir**: comunicación y acceso para
  actualizar el Sheet de un cliente ya entregado. Verificado esta sesión
  (ver conversación) que actualizar la librería (`1fRR...`, siempre
  nuestra) NO basta -- cada cliente tiene su `appsscript.json` fijado a
  un número de versión concreto, y hace falta editar SU proyecto de
  Apps Script (`clasp push` del `Codigo.js` regenerado + bump de
  versión) para que reciba el cambio. Si al entregar el Sheet se
  transfiere la propiedad de Drive o se nos retira como editores del
  proyecto de script, perdemos esa capacidad -- distinto del acceso al
  Sheet como documento. Falta definir: (a) qué nivel de acceso técnico
  se conserva al entregar un cliente, (b) un `CLIENTE.LIBRERIA_VERSION`
  visible en la ficha para saber quién está desactualizado sin mirar
  `clientes.json`, (c) una rutina de aviso/actualización (¿el cliente
  ejecuta él mismo "Actualizar" desde su menú? ¿se lo pedimos por
  email?) -- encaja como parte de Mantenimiento, no como módulo aparte.

## Fase 2 -- Ventas (prioridad económica alta: cierra el margen real)

Módulo nuevo acoplable (`VENTAS`, dependencia `CORE`, opcional `ECONOMICO`
para cálculo de margen desde el día uno), con dos flujos de naturaleza
distinta -- no se fusionan en una sola tabla:

**Venta de producto físico** (encargo + venta directa, misma estructura
para las dos, distinguidas por el campo `CANAL`):
```
PEDIDO_CLIENTE (ID, CLIENTE_ID, OPORTUNIDAD_ID [nullable],
  PROYECTO_ID [nullable -- relleno solo si es encargo], CANAL
  (Encargo/Feria/Tienda), FECHA_PEDIDO, ESTADO...)
PEDIDO_CLIENTE_LINEA (ID, PEDIDO_CLIENTE_ID, PRODUCTO_ID, CANTIDAD,
  PRECIO_UNITARIO, ESTADO...)
ENTREGA / ENTREGA_LINEA -- espejo de RECEPCION/RECEPCION_LINEA.
```
Simetría directa con `PEDIDO_PROVEEDOR`/`RECEPCION` (comprar), en espejo
para vender.

**Ingreso por servicio de software** (Gestor de Proyectos como negocio,
recurrente, no es una línea de pedido puntual):
```
CONTRATO_SERVICIO (ID, CLIENTE_ID, OPORTUNIDAD_ID, PROYECTO_ID [el
  proyecto de Mantenimiento], MODULOS_CONTRATADOS, PERIODICIDAD
  (Mensual/Anual/Único), IMPORTE_PERIODICO, MODALIDAD_PAGO
  (Monetario/Intercambio/Mixto/Cesión_social -- el pago no siempre es
  dinero, ver Fase 4), FECHA_INICIO, FECHA_RENOVACION, ESTADO...)
```

Con `COSTE` (ya existente, módulo ECONOMICO) se calcula margen real
(ingreso − coste) por Producto/Proyecto/Cliente por primera vez en el
sistema -- objetivo económico central de esta fase.

`PanelVentas.html` + exportador CSV compartido, mismo patrón que el resto
de paneles.

## Fase 3 -- Aprovisionamiento (infraestructura, no económico -- baja prioridad)

Boceto ya escrito y NO activado en
[`src/AprovisionamientoService.js`](src/AprovisionamientoService.js):
trigger instalable sobre una hoja `SOLICITUDES_MONTAJE` protegida que,
al aprobar una fila, llama a la Apps Script API (`script.projects.create`)
para crear el Sheet+Script del nuevo cliente sin pasar por `clasp`.
Pendiente: scope OAuth `script.projects` (requiere nuevo consentimiento,
confirmación explícita antes de aplicar), `subirContenidoScript_`
(portar `generate-shell-wrappers.mjs` a texto generado en Apps Script).
Se retoma cuando el volumen de montajes lo justifique -- hoy el flujo
manual (`montar-cliente.mjs` + `clasp`) es suficiente.

## Fase 4 -- Oportunidad y prospección (CRM, dos niveles)

**Nivel básico** (embudo simple): `CLIENTE.ESTADO=Prospecto` ya cubre un
cliente potencial sin entidad nueva. Para más de una oportunidad
simultánea por prospecto (ej. ofrecer producto Y software a la vez):
```
OPORTUNIDAD (ID, CLIENTE_ID [nullable -- puede nacer sin cliente
  verificado, solo con datos de origen], ORIGEN (Prospección_web/Feria/
  Referencia/Entrante), ORIGEN_PLATAFORMA, ORIGEN_URL, AMBITO (catálogo:
  Rural/Cultural/Social/Voluntariado), DESCRIPCION_PROYECTO_ORIGEN,
  IMPORTE_OBJETIVO_CAMPANA [opcional -- no todas las plataformas lo dan],
  TIPO_OPORTUNIDAD (Producto/Servicio_software), PUNTUACION_ENCAJE,
  ESTADO (Identificada/Contactado/Propuesta_enviada/Ganada/Perdida)...)
```
`PUNTUACION_ENCAJE` v1: una sola regla determinista (coincidencia de
`AMBITO` contra catálogo de sectores objetivo), mismo patrón sin IA que
`obtenerProyectosQueEncajan_` en `FichaConvocatoriaService.js` (filtro
tipo+importe para Convocatorias). Distinto de `CONVOCATORIA`: esa mira
financiación que La Troballa puede solicitar; `OPORTUNIDAD` mira
entidades financiadas externamente que podrían ser clientes.

**Nivel avanzado** (más adelante, explícitamente pospuesto): scraping de
plataformas (crowdfunding rural/cultural, Workaway, Worldpackers,
hacesfalta.org) para alimentar `OPORTUNIDAD` automáticamente, y
generación de propuesta de software personalizado a partir del análisis.
No diseñar hasta que el nivel básico esté en uso real.

## Arquitectura de módulos (corregido tras esta sesión)

`CLIENTE` y `VENTAS` se separaron de CORE como módulos reales en
`package-map.json`/`build-packages.mjs` (`VALID_MODULES`,
`EXPECTED_MODULE_COUNTS`, `moduleDependencies`). No fue necesario volver
a desplegar Gestor de Proyectos -- se verificó que regenerar el wrapper
con `--modules CORE,GANTT,CLIENTE,VENTAS` produce exactamente el mismo
resultado (183 envoltorios) que el ya publicado, porque los únicos
archivos dedicados de estas dos piezas (`InstaladorClienteL4.js`,
`InstaladorVentasL4.js`) ya estaban en la librería. El esquema
(`Ids.js`, `EstructuraInicialDatos.js`, `FormularioEsquemas.js`,
`FormularioMotorUI.js`) sigue viviendo en archivos compartidos por
todas las entidades y se queda en CORE -- igual que ocurre hoy con
`PROYECTO` (CORE) aunque lo visualice `GANTT`. `tools/constructor/clientes.json`
actualizado para reflejar `libreriaVersion=7` y los módulos reales de
Gestor de Proyectos (estaba desincronizado desde antes de esta sesión).

## Combinaciones de valor (cruces entre módulos)

Distinto de un "pack" (lista de módulos a instalar junta, sin lógica
nueva): esto es lógica nueva -- un informe/servicio que lee datos de
dos módulos a la vez para dar algo que ninguno de los dos da por
separado. No construir hasta que un cliente real tenga ambos módulos
activos con datos reales (evitar diseñar contra un vacío).

| Combinación | Qué añadiría | Estado |
|---|---|---|
| `COMPRAS` + `VENTAS` | Margen real (coste de `COMPRAS` − ingreso de `VENTAS`) por Producto/Proyecto/Cliente. Ya es la razón de ser del diseño de `VENTAS` (ver Fase 2). | Pendiente -- ningún cliente tiene hoy ambos módulos con datos transaccionales reales. |
| `CONVOCATORIAS` + `IMPACTO` | Informe "impacto de lo financiado": `FUENTE_FINANCIACION` → `ETIQUETA_IMPACTO` sobre el mismo proyecto, para mostrar a un financiador qué generó concretamente su aportación. | Pendiente -- candidato, sin cliente con ambos módulos activos todavía. |
| `GANTT` + `COMPRAS` | Aviso de retraso de tarea por falta de stock/material (candidato, no confirmado con el usuario). | Solo idea, sin validar. |
| `GANTT` + `VENTAS` | Fecha de entrega comprometida a cliente vs. fecha real de fin de tarea (candidato, no confirmado con el usuario). | Solo idea, sin validar. |

## Orden de ejecución acordado

1. **Fase 0 -- Cliente** (en curso).
2. **Fase 2 -- Ventas** (prioridad económica; puede empezar en paralelo a
   Fase 1 una vez Cliente esté cerrado, ya que ambas dependen solo de
   Cliente, no entre sí).
3. Fase 1 -- Mantenimiento (UI, no bloquea Ventas).
4. Fase 4 nivel básico -- Oportunidad.
5. Fase 3 -- Aprovisionamiento, y Fase 4 nivel avanzado -- scraping, sin
   fecha fija, se retoman cuando aporten valor inmediato.
