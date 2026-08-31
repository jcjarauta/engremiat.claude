# Mapa de dominios de datos

No existe una única base de datos para todo Engremiat, y no es el objetivo.
Sheets/Apps Script y Baserow/Pi sirven propósitos distintos a propósito --
este documento fija por escrito **qué vive dónde**, para que la decisión
de dónde va un dato nuevo esté en un solo sitio, no se improvise cada vez.
Precedente: el intento de sincronización en vivo Consola↔Sheet se
descartó por frágil, sustituido por un ritual versionado manual (ver
`tools/consola/SINCRONIZACION.md`) -- la misma lógica aplica aquí, a
mayor escala.

## Sheets / Apps Script -- operación de clientes existentes

Dominio de **La Troballa, Gestor de Proyectos** y cualquier cliente
construido sobre la librería Engremiat en Apps Script. Datos operativos
reales de clientes en producción hoy: incidencias, tareas, seguimiento,
la Consola.

No depende de que la Pi esté encendida. No tiene relación con Baserow
salvo el ritual versionado ya existente para la Consola.

## Baserow / Pi (`192.168.8.230`, base de datos 76) -- núcleo Engremiat nuevo

Dominio del núcleo soberano en construcción, deliberadamente **sin
dependencia de Google** -- esa independencia es la característica, no
una carencia a resolver. Tablas reales: `ENTIDAD_ORGANIZATIVA`,
`UBICACION_GEOGRAFICA`, `COMPETENCIA`, `PERSONA_COMPETENCIA`,
`PERSONAJE`, `PLANTILLA_MISION`, `TAREA`, `PAQUETE_CLIENTE`, `ACERVO`,
`GASTO_API`, `VIGILIA_TAREA`.

Depende de que la Pi esté encendida cuando alguien (operador o, en el
futuro, un usuario real) necesite usarlo -- no 24/7 por defecto (ver
`PROPUESTA_EMPAQUETADO_PRODUCTO_CLIENTE_FINAL.md`, decisión 2026-08-31).

## Regla de propiedad

Cualquier dato nuevo se asigna a un dominio **antes** de construir nada,
según a quién sirve -- si es para un cliente existente de Sheets, va a
Sheets; si es del núcleo soberano nuevo, va a Baserow. Nada se duplica
"por si acaso" en los dos sitios.

## Si algo necesita cruzar de verdad

No se construye sincronización en vivo (ya demostrado frágil una vez).
Se usa el mismo patrón que ya funciona para la Consola: un script que se
ejecuta deliberadamente, lee de un lado, escribe una copia fechada en el
otro, y queda documentado cuándo se hizo. Ningún puente de este tipo
existe todavía entre Sheets y Baserow -- no hay señal real de que se
necesite hoy.

## Registro de gobernanza relacionado

`tools/registro_ecosistema.json` documenta prompts operativos, triggers
programados y scripts de sincronización sujetos a chequeo de salud --
propósito distinto a este mapa (ese es "qué existe y hay que vigilar",
este es "qué vive dónde"). Se mantienen como documentos separados.
