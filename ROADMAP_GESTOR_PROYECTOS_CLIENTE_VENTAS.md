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
- **Reclasificada de "no bloqueante" a siguiente paso confirmado**
  (asesoría estratégica 2026-08-17, ver `VISION_MISION.md`): comunicación
  y acceso para actualizar el Sheet de un cliente ya entregado. Verificado
  esta sesión que actualizar la librería (`1fRR...`, siempre nuestra) NO
  basta -- cada cliente tiene su `appsscript.json` fijado a un número de
  versión concreto, y hace falta editar SU proyecto de Apps Script
  (`clasp push` del `Codigo.js` regenerado + bump de versión) para que
  reciba el cambio. Si al entregar el Sheet se transfiere la propiedad de
  Drive o se nos retira como editores del proyecto de script, perdemos esa
  capacidad -- distinto del acceso al Sheet como documento. Falta definir:
  (a) qué nivel de acceso técnico se conserva al entregar un cliente,
  (b) un `CLIENTE.LIBRERIA_VERSION` visible en la ficha para saber quién
  está desactualizado sin mirar `clientes.json`, (c) una rutina de
  aviso/actualización (¿el cliente ejecuta él mismo "Actualizar" desde su
  menú? ¿se lo pedimos por email?) -- encaja como parte de Mantenimiento,
  no como módulo aparte.

### El canal de comunicación: bot de Telegram como relé (Fase 1a)

Diseño acordado (asesoría estratégica 2026-08-17, ver `VISION_MISION.md`
capa "Comunicación" del ecosistema): un bot de Telegram como entrada de
acceso sencilla y segura, **relé, no ejecutor** -- el cliente escribe,
se registra una `INCIDENCIA`, se avisa por correo. Nadie ejecuta nada en
el Sheet del cliente automáticamente en esta fase.

- **Autenticación gratis**: cada `chat_id` de Telegram es una identidad ya
  verificada -- mismo patrón de seguridad que `EMAILS_AUTORIZADOS_MONTAJE`
  (Fase 3 Aprovisionamiento), aplicado a `chat_id` en vez de email. No hace
  falta login propio.
- **Sin infraestructura externa**: Apps Script puede desplegarse como Web
  App (`doPost`) y recibir el webhook de Telegram directamente;
  `UrlFetchApp` para responder. Todo dentro del mismo stack técnico ya
  usado en el resto del proyecto (sin n8n, sin servidor propio).
- **Modelo del bot, estandarizado pero dinámico**: `REGISTRO_COMANDOS_BOT_`
  -- registro declarativo (comando, módulo del que depende, handler),
  mismo idioma que `REGISTRO_INFORMES_` y el filtrado de menú por
  `moduloInstalado_()`/`MODULOS_INSTALADOS_CLIENTE` ya construidos. El
  motor del bot filtra qué comandos anuncia/responde según los módulos
  reales del cliente que escribe -- no hay que inventar una segunda forma
  de "esto depende del módulo X".
- **Bots y grupos son lo mismo estructuralmente**: un `chat_id` (privado o
  de grupo) se resuelve contra un `CLIENTE`; quien reporta se identifica
  por nombre/usuario de Telegram en texto libre, sin necesidad de que cada
  persona del cliente tenga su propio `PERSONA_EQUIPO`.
- **Incidencia aprobada -> Tarea -- CONSTRUIDO (2026-08-18)**: al pasar
  una `INCIDENCIA` de cliente a `ESTADO='En resolución'` (se reutiliza
  este estado existente como disparador -- `CFG_ESTADO_INCIDENCIA` nunca
  tuvo un valor `'Aprobada'`, no hacía falta inventar uno nuevo), se crea
  una `TAREA` bajo el `PROYECTO` tipo `Mantenimiento` de ese cliente
  (opción A de arriba), enlazada vía `VINCULO` (18_VINCULO, ya existe --
  enlace polimórfico genérico, no hace falta una relación nueva). Ver
  `IncidenciaMantenimientoService.js` (módulo `CLIENTE`): la cadena
  completa CAMPANA->PROYECTO->PRODUCTO->PROCESO (obligatoria para que
  exista una TAREA) se crea perezosamente una sola vez por cliente, bajo
  una CAMPANA paraguas compartida "Mantenimiento de clientes". Idempotente
  (comprueba si la incidencia ya generó una tarea antes de crear otra).
  Cierra el círculo con "Proyecto 0": una tarea
  nacida de soporte es indistinguible de cualquier otra, así que si algún
  día una IA interna ejecuta tareas, esta cola ya encaja sin cambios.
- **Huecos para personalizar por cliente**: campo `CLIENTE.CONFIG_BOT`
  (JSON libre), consultado como capa de overrides sobre el registro
  estándar -- mismo espíritu que `InstaladorClienteL4.js`/
  `InstaladorComprasL4.js` (instalación incremental sobre una base común,
  no un fork por cliente).
- **Piezas nuevas reales** (todo lo demás reutiliza mecanismos ya
  construidos): `REGISTRO_COMANDOS_BOT_`, `CLIENTE.TELEGRAM_CHAT_ID`,
  `CLIENTE.CONFIG_BOT`, lógica de creación perezosa del `PROYECTO`
  `Mantenimiento` por cliente.
- **Deliberadamente fuera de esta fase**: ejecución remota de acciones
  contra el Sheet del cliente desde el bot (reinstalar módulo, regenerar
  `Codigo.js`...) -- superficie de riesgo distinta, se aborda cuando el
  módulo `COMUNICACION` completo esté en marcha, no hace falta para
  desbloquear el voluntariado tecnológico.

### Dos bots distintos, no uno (asesoría estratégica 2026-08-18)

Corrección importante antes de normalizar la construcción de bots: hay
**dos bots con propósito y alcance distintos**, que comparten tecnología
pero no esquema:

1. **Bot de soporte** (Fase 1a, ya con esquema) -- La Troballa ↔ cada
   cliente como cuenta. Un solo `CLIENTE.TELEGRAM_CHAT_ID` porque solo
   hay una relación: nosotros y ellos.
2. **Bot operativo del cliente** -- el equipo de cada cliente ↔ su propia
   instancia. Vive *dentro* de cada Sheet de cliente, no en el maestro.
   Aquí sí hace falta administrador/usuario, porque dentro de una misma
   organización cliente hay varias personas con distinto nivel de
   confianza.

### Modelo de permisos del bot operativo

Reutiliza catálogos ya existentes en vez de inventar un sistema de roles
nuevo:

- Cada `PERSONA_EQUIPO` del cliente (no `CLIENTE` -- esto vive dentro de
  la instancia de cada cliente) lleva su propio `TELEGRAM_CHAT_ID`, para
  identificar a la persona exacta que escribe, no solo "alguien del
  cliente X".
- El rol organizativo (`ROL_PERSONA`: Coordinación, Producción, Diseño,
  Logística, Administración, Voluntariado, Persona atendida, Otra) **no**
  se reutiliza directamente como nivel de permiso -- un "Voluntariado"
  podría ser el administrador del bot en una organización pequeña. Nivel
  de permiso separado, campo nuevo `PERSONA_EQUIPO.NIVEL_PERMISO_BOT`,
  tres niveles:
  - **Administrador**: todo lo que el bot ofrece, incluida configuración
    propia y aprobación de acciones sensibles -- mismo patrón que
    `EMAILS_AUTORIZADOS_MONTAJE` (Fase 3), aplicado a `chat_id` en vez de
    email.
  - **Colaborador**: consulta + acciones normales (reportar tarea del
    día, responder a una convocatoria) -- el grueso del equipo.
  - **Consulta**: solo lectura -- útil para "personas atendidas" o
    colaboradores muy puntuales.
- `REGISTRO_COMANDOS_BOT_` (ya diseñado, filtrado por módulo instalado)
  se filtra también por este nivel -- mismo mecanismo, un eje más.

**Construido (2026-08-18), pendiente de verificación en vivo**: primer
incremento de solo lectura -- módulo `COMUNICACION` nuevo,
`WebhookTelegramService.js` (doPost compartido con Nexo, CORE) y
`BotOperativoService.js` (`REGISTRO_COMANDOS_BOT_`, comandos `/ayuda`,
`/mis_tareas`, `/hoy`). Gates de empaquetado en verde, pero **no
probado contra un bot de Telegram real todavía** -- a diferencia de
Nexo, no se puede probar en el propio maestro/Gestor de Proyectos
porque `moduloInstalado_('INTERNO')` se comprueba antes que
`COMUNICACION` en el despachador y siempre gana ahí. Hace falta un
Sheet de cliente real o de prueba con `COMUNICACION` instalado (y no
`INTERNO`) para verificar el flujo completo end-to-end.

### Estandarizar y automatizar la creación de clientes (menos fricción del operador)

Frente distinto, para cuando haya evidencia real de que hace falta (no
antes de un segundo o tercer cliente dado de alta -- automatizar algo
hecho una sola vez es prematuro):

1. **Plantillas de producto**: paquetes de módulos predefinidos
   ("Voluntariado tecnológico estándar" = CORE+OPERATIVA+SEGUIMIENTO;
   "Ecosistema completo" = + COMPRAS+VENTAS) en vez de elegir módulo a
   módulo cada vez.
2. **Un solo flujo de alta**: diálogo "Nuevo cliente" que encadena crear
   el registro `CLIENTE`, disparar el aprovisionamiento ya construido
   (`crearProyectoScript_`/`subirContenidoScript_`) y dejar preparado el
   hueco del bot -- hoy son pasos sueltos que hay que recordar en orden.
3. **Panel de estado de onboarding por cliente**: mismo patrón que
   `SOLICITUDES_MONTAJE` -- visibilidad de en qué punto está cada cliente
   (aprovisionado / bot vinculado / primera formación hecha).
4. `CLIENTE.LIBRERIA_VERSION` (ya señalado como pendiente más arriba en
   esta fase) encaja aquí directamente, como parte del mismo panel.

**Orden recomendado**: cerrar el modelo de permisos primero (decisión de
diseño barata ahora, cara de deshacer si el bot operativo ya está
construido sin ella) -- la automatización del alta de clientes espera a
que haya un segundo/tercer cliente real.

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

## Fase 3 -- Aprovisionamiento (infraestructura, no económico)

**Activada y probada de extremo a extremo** (ver
[`src/AprovisionamientoService.js`](src/AprovisionamientoService.js)):
trigger instalable sobre una hoja `SOLICITUDES_MONTAJE` protegida que,
al aprobar una fila (`NOMBRE` + `MODULOS`), crea el Sheet+Script nuevo
vinculado a la librería CORE (`script.projects.create`), sube su
`Codigo.js`/`appsscript.json` generados
(`GeneradorEnvoltoriosEmbebido.js`, puerto de
`generate-shell-wrappers.mjs` a Apps Script, verificado byte a byte
idéntico al generador Node), e instala su estructura de hojas/catálogo
(`instalarEstructuraInicial`) -- todo en una sola ejecución, sin pasos
manuales. Scopes `script.scriptapp`/`script.projects` añadidos y
autorizados. Sacada de la librería (`package C`, auxiliar): dar a
cualquier cliente externo la capacidad de crear proyectos de Apps
Script nuevos era más alcance del debido para una herramienta de
administración interna de LaTroballa Software -- solo el Sheet maestro
y proyectos internos la ven (`moduloInstalado_('INTERNO')`, pseudo-
módulo que ningún cliente real pide nunca).

### Menú y hojas condicionados por módulo (mecanismo transversal)

De aquí salió el hallazgo de que el menú y las hojas de cada cliente
seguían mostrando/creando todos los módulos, herencia del sheet
maestro. Se resolvió con `MODULOS_INSTALADOS_CLIENTE`: una constante
que `generate-shell-wrappers.mjs`/`GeneradorEnvoltoriosEmbebido.js`
escriben en el `Codigo.js` de cada cliente con el cierre real de
módulos resuelto. Como una librería de Apps Script corre en su propio
ámbito global (no puede leer variables globales del proyecto que la
invoca), los envoltorios de `onOpen()` y `abrirInstalarEstructuraInicial()`
la pasan como argumento explícito en vez del reenvío genérico
(`FUNCIONES_QUE_RECIBEN_MODULOS_INSTALADOS`, ambos generadores).
`moduloInstalado_()` (`FormularioMotorUI.js`) condiciona cada bloque
del menú; `hojaInstalable_()`/`categoriaInstalable_()`
(`EstructuraInicialService.js`, con `MODULO_POR_HOJA_MVP` en `Ids.js`
y `MODULO_POR_CATEGORIA_CATALOGO` en `EstructuraInicialDatos.js`)
condicionan qué hojas y catálogo semilla se crean. Cubierto por test
reactivo (`Tests_ModulosInstalados.js`).

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

**`COMPRAS` cerrado como módulo real** (deuda detectada al construir el
mecanismo de menú/hojas condicionado, ver Fase 3): tenía UI marcada como
módulo (`FichaMaterialService.js`, `FichaProveedorService.js`,
`PedidoRecepcionService.js`, `StockMaterialService.js`) pero sus 10 hojas
de entidad (`08_MATERIALES`...`28_RECEPCION_LINEA`) se instalaban siempre,
las tuviera el cliente contratado o no. Ya tenía `MODULO_POR_HOJA_MVP`/
`MODULO_POR_CATEGORIA_CATALOGO` filtrando su instalación; se completó con
`InstaladorComprasL4.js` (mismo patrón que `InstaladorClienteL4.js`) para
altas de catálogo incrementales sobre un `90_CONFIGURACION` ya poblado.

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

1. **Fase 0 -- Cliente** -- hecho.
2. **Fase 2 -- Ventas** -- hecho.
3. **Fase 4 nivel básico -- Oportunidad** -- hecho.
4. **Fase 3 -- Aprovisionamiento** -- hecho (activada, probada de
   extremo a extremo, y de paso cerró `COMPRAS` como módulo real).
5. **Fase 1 -- Mantenimiento** (UI, `PanelClientes.html` ya construido en
   Fase 0/2 -- queda pendiente comunicación/acceso para actualizar el
   Sheet de un cliente ya entregado). **Reclasificada de "no bloqueante"
   a siguiente paso confirmado** (asesoría estratégica 2026-08-17, ver
   `VISION_MISION.md`): el primer movimiento comercial real -- voluntariado
   tecnológico en Workaway/Worldpackers, cambiar implementación y
   personalización por recursos del host -- depende directamente de poder
   dar soporte a un cliente externo después de entregado. Deja de ser una
   mejora de conveniencia y pasa a ser requisito del primer plan comercial.
6. Fase 4 nivel avanzado -- scraping, sin fecha fija, se retoma cuando
   aporte valor inmediato.
7. **"Proyecto 0" -- Gestor de Proyectos como orquestador de una IA
   interna** (ver `VISION_MISION.md`): antes que cualquier módulo
   "comercial" (`FORMACION`, `GAMIFICACION`, `COMUNICACION`, `BOVEDA`),
   formalizar como `PROYECTO`/`TAREA` el propio patrón de desarrollo que
   ya se sigue hoy a mano (backlog en roadmap -> IA ejecuta -> commit ->
   gate humano). Condición que `ROADMAP_IMPLEMENTACION.md` ya exigía antes
   de construir esto ("fase posterior a un runner interno maduro") ya
   está cumplida -- el runner de pruebas reactivas con heartbeat es
   exactamente ese runner maduro.
