# Propuesta — Core como librería protegida + producto modular replicable

**Fecha:** 2026-08-06
**Contexto:** decisión estratégica de escalar el sistema como producto comercial, replicable por organización (Camino A: plantilla, no SaaS centralizado — ver `MANUAL_MARCO_FUNDAMENTAL.md` y la conversación de asesoría técnica de la sesión), con la condición explícita de que el cliente pueda autogestionar la implementación **sin acceso a la lógica del programa**.

## Por qué ocultar la lógica ahora sí se justifica

No es "un cliente cotilla mira el código" — el Core está dejando de ser un script interno para convertirse en el motor propietario de un ecosistema más amplio (integraciones con n8n, Obsidian, un grafo de relaciones, IA local y externa, y un módulo de alcance a comunidades/preventas). Con IA externa y herramientas de terceros tocando el sistema, y de cara a comunidades externas, proteger la implementación deja de ser opcional.

## La única forma nativa de Apps Script de ocultar lógica: Library

Google Apps Script no tiene "compilar" — si el cliente tiene el Sheet con el script vinculado, por defecto ve el 100% del código. La única forma real de que el cliente ejecute el sistema sin ver su implementación es el patrón de **librería**: el Core vive en un proyecto Apps Script propio (standalone), publicado como librería versionada; el Sheet del cliente tiene solo un **cascarón fino** que declara la librería como dependencia (Script ID + versión) y expone los puntos de entrada necesarios. El cliente nunca recibe permiso de Editor/Viewer sobre el proyecto de la librería.

## POC realizada — resultado: viable, con un coste concreto y ya medido

Antes de comprometer los 63 archivos de producción a este patrón, se hizo una prueba de concepto aislada (dos proyectos Apps Script reales, uno standalone como librería, uno bound a un Sheet nuevo como cascarón), para validar las dos preguntas técnicas de mayor riesgo:

1. **¿`SpreadsheetApp.getActiveSpreadsheet()` dentro de una función de librería resuelve el Sheet del cliente, o algo del contexto de la librería?**
   ✅ **Confirmado con evidencia real (Apps Script real, no simulado)**: resuelve correctamente el Sheet del cliente. El "hoja activa" depende del contexto de ejecución (qué sesión/menú lo disparó), no de en qué proyecto vive el código. Esto significa que la inmensa mayoría de `Repository.js`, `IntegrityService.js`, etc. — que dependen implícitamente de `getActiveSpreadsheet()`/`getActive()` — puede migrar a la librería sin reescritura estructural.

2. **¿`HtmlService.createTemplateFromFile()` resuelve plantillas que viven dentro del proyecto librería, cuando se invoca desde código de la librería?**
   ✅ **Confirmado**: sí, sin problema. Las 21 HTML del sistema pueden vivir junto al código de producción dentro de la librería, no en el cascarón.

3. **¿`google.script.run` desde una plantilla HTML renderizada por la librería resuelve directamente contra la librería, o necesita un envoltorio en el cascarón?**
   ❌→✅ **Confirmado el coste real**: `google.script.run` **no** resuelve contra la librería — solo conoce funciones globales del proyecto contenedor (el cascarón). Sin envoltorio, falla en el navegador con `TypeError: ... is not a function` (verificado en la consola real del navegador). Con un envoltorio de una línea en el cascarón (`function x(a){ return Poc.x(a); }`), funciona de punta a punta sin más fricción.

## Consecuencia concreta para la migración real

Cada punto de entrada necesita un envoltorio de una línea en el cascarón del cliente:
- Cada `addItem('Nombre', 'funcion')` del menú (~90 en `onOpen()` hoy).
- Cada función invocada vía `google.script.run` desde las 21 HTML (entre 100 y 150 llamadas distintas, sin deduplicar).
- Los triggers simples (`onOpen`, `onEdit`) — Apps Script no los detecta si solo existen en la librería.

Esto son entre 150 y 250 envoltorios mecánicos, generables automáticamente a partir de la matriz de módulos del packager (`tools/packager/package-map.json`) en vez de escritos a mano — es la siguiente pieza de herramienta a construir, no trabajo manual por archivo.

## Siguiente paso propuesto (no iniciado)

1. Extender `package-map.json` con un campo `module` por archivo de producción (CORE, GANTT, ECONÓMICO, IMPACTO, COMPRAS, COMPETENCIAS, CONVOCATORIAS — límites detallados en la conversación de asesoría técnica).
2. Extender el packager para generar, además del paquete de archivos, la lista de envoltorios necesarios para un cascarón dado un conjunto de módulos.
3. Cerrar la deuda de los 5 archivos mixtos (`Repository.js` con 51 pruebas embebidas, `Ids.js`, `Formularios.js`, `Validation.js`, `PedidoRecepcion.js`) antes de publicar la primera versión real de la librería — no tiene sentido proteger un Core que arrastra ese peso.
4. Publicar una primera versión real de la librería con el Core completo (no la POC de juguete) y un cascarón generado automáticamente, verificado igual que el Paquete A (`clasp push` + prueba real en navegador).

## Recordatorio de gobernanza (heredado, sin cambios)
Git local, `clasp push` con autorización explícita, cambios mínimos, verificación humana en Apps Script real antes de dar nada por cerrado — mismo criterio que el resto de este proyecto.
