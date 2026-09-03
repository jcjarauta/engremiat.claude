# Censo real de entidades del universo Engremiat

Generado el 2026-09-03T09:38:53.205Z cruzando 10 fuentes reales: 8 grafos (Apps Script, Node, n8n, 91_HISTORIAL, jerarquia Sheet, PAQUETE_CLIENTE, Telar, wikilinks de la boveda) mas la estructura atomica completa de Sheet (70 pestanas), Baserow (18 tablas), y mencion textual literal en cualquier ficha real de la boveda (no solo wikilinks -- anadida en §8.29 tras encontrar que un "## Vinculo real" en texto plano no contaba como corroboracion). Ver `PROPUESTA_BASTIDOR_GESTOR_PROYECTOS_ENGREMIAT.md` §8.23.

**Limite honesto**: el cruce de identidad es por coincidencia de nombre/tokens normalizados, no por ID unico todavia -- primer barrido exhaustivo real, no un censo perfecto. Cada fila lleva su evidencia al lado para que se pueda revisar a mano.

## Resumen: 225 entidades candidatas reales

- **46 confirmar** -- ficha real ya existente, bien corroborada.
- **49 promover** -- sin ficha propia hoy, corroborada por >=3 fuentes reales independientes.
- **46 revisar** -- ficha real ya existente pero apenas corroborada fuera de la boveda.
- **84 descartar** -- evidencia real insuficiente hoy.

## Ciclos reales encontrados: 4

- **malla de 70 nodos** (no es un bucle simple, es una red de referencias mutuas -- ver `censo_entidades.json` para la lista completa): 00_mapa <-> 92_bus_trabajo <-> acervo <-> acervo_filosofico <-> acervo_logico <-> acervo_logistico <-> acervo_narrativo <-> acervo_prompter ... (+62 mas)
- chequear_libreria_clientes <-> ejecutar_chequeo_libreria
- dato:appsscript.json <-> dato:clientes.json <-> dato:libreria.json <-> tools/constructor/montar-cliente.mjs <-> tools/constructor/montar-cliente.test.mjs
- aprobada_sin_ejecutar <-> concilio_convocando <-> deliberando <-> devuelta <-> esperando_relevo <-> huella <-> orientacion <-> puerta_ejecutada <-> puerta_en_curso <-> puerta_err <-> puerta_pendiente <-> puerta_warn <-> sin_seleccionar <-> tejiendo

Nota honesta sobre el primer ciclo (la malla grande): no es un bucle de dependencia problematico -- es el efecto esperable de que muchas fichas del Holon se enlazan mutuamente ([[A]] enlaza a [[B]] y [[B]] enlaza de vuelta a [[A]]), lo que convierte a Tarjan casi todo el mesh en una sola componente fuertemente conexa. Los otros tres ciclos son mas pequenos y mas interesantes: dos scripts que se referencian de verdad entre si, un grupo real de ficheros de datos compartidos entre montar-cliente.mjs y su test, y el ciclo de vida real de Telar (esperado, ya validado en B0).

## Vocabulario de relacion real, por frecuencia

| tipo | total | capas donde aparece |
|---|---|---|
| calls | 2994 | apps_script:2994 |
| contains | 1573 | apps_script:1573 |
| wikilink | 290 | wikilinks:290 |
| conexion_n8n | 138 | n8n:138 |
| indirect_call | 100 | apps_script:100 |
| toco_en_operacion | 81 | historial:81 |
| parte_de_jerarquia | 43 | jerarquia:43 |
| toca_recurso | 39 | node:39 |
| escribe_debil | 22 | node:22 |
| transicion_estado | 19 | telar_estados:19 |
| lee_debil | 14 | node:14 |
| depende_de | 8 | wikilinks:8 |
| opera_en | 8 | wikilinks:8 |
| lee | 8 | node:8 |
| import | 6 | node:6 |
| escribe | 4 | node:4 |
| gobierna_a | 3 | wikilinks:3 |
| modulo_activo | 3 | paquete_cliente:3 |
| alimenta_a | 2 | wikilinks:2 |
| parte_de | 2 | wikilinks:2 |
| activa_a | 1 | wikilinks:1 |
| verifica_a | 1 | wikilinks:1 |
| corrige_a | 1 | wikilinks:1 |
| cites | 1 | apps_script:1 |

## Candidatas a PROMOVER (sin ficha propia, corroboradas por >=3 fuentes reales)

| nombre | corroboracion | fuentes reales | tipo candidato |
|---|---|---|---|
| DOCUMENTO | 7 | baserow_estructura, codigo_appsscript, codigo_node, datos_negocio, n8n, sheet_estructura, vault_mencion | recurso_codigo, tabla_baserow |
| TAREA | 6 | baserow_estructura, codigo_appsscript, codigo_node, datos_negocio, n8n, sheet_estructura | recurso_codigo, tabla_baserow |
| 38_CLIENTE | 5 | baserow_estructura, codigo_node, datos_negocio, sheet_estructura, vault_mencion | recurso_codigo, pestana_sheet_negocio |
| Verificación | 5 | baserow_estructura, datos_negocio, n8n, sheet_estructura, vault_mencion | entidad_negocio_proceso |
| 06_TAREAS | 5 | baserow_estructura, codigo_node, datos_negocio, sheet_estructura, vault_mencion | pestana_sheet_negocio |
| 13_INCIDENCIAS | 4 | codigo_node, datos_negocio, sheet_estructura, vault_mencion | recurso_codigo, pestana_sheet_negocio |
| 18_VINCULO | 4 | codigo_node, datos_negocio, sheet_estructura, vault_mencion | recurso_codigo, pestana_sheet_negocio |
| Acervos | 4 | baserow_estructura, codigo_node, vault_mencion, vault_wikilink | referencia_sin_ficha |
| PLANTILLA_MISION | 4 | baserow_estructura, codigo_node, n8n, vault_mencion | recurso_codigo, tabla_baserow |
| 46_TAREA_RECURSO_NECESIDAD | 4 | codigo_appsscript, codigo_node, sheet_estructura, vault_mencion | pestana_sheet_negocio |
| 02_PROYECTOS | 4 | baserow_estructura, datos_negocio, sheet_estructura, vault_mencion | pestana_sheet_negocio |
| 04_PROYECTO_PRODUCTO | 4 | codigo_appsscript, datos_negocio, sheet_estructura, vault_mencion | pestana_sheet_negocio |
| 11_PERSONAS_EQUIPOS | 4 | codigo_appsscript, datos_negocio, sheet_estructura, vault_mencion | pestana_sheet_negocio |
| STG_TAREA_RECURSO | 4 | codigo_appsscript, codigo_node, sheet_estructura, vault_mencion | pestana_sheet_utilidad |
| 14_DOCUMENTOS | 4 | baserow_estructura, codigo_node, sheet_estructura, vault_mencion | pestana_sheet_negocio |
| 24_TAREA_RECURSO | 4 | codigo_appsscript, codigo_node, sheet_estructura, vault_mencion | pestana_sheet_negocio |
| 34_PERSONA_COMPETENCIA | 4 | baserow_estructura, codigo_appsscript, sheet_estructura, vault_mencion | pestana_sheet_negocio |
| COMPETENCIA | 4 | baserow_estructura, codigo_appsscript, sheet_estructura, vault_mencion | tabla_baserow |
| PERSONA_COMPETENCIA | 4 | baserow_estructura, codigo_appsscript, sheet_estructura, vault_mencion | tabla_baserow |
| VIGILIA_TAREA | 3 | baserow_estructura, codigo_node, vault_mencion | recurso_codigo, tabla_baserow |
| METRICA_FABRICACION | 3 | baserow_estructura, codigo_node, vault_mencion | recurso_codigo, tabla_baserow |
| PERSONAJE | 3 | baserow_estructura, codigo_node, vault_mencion | recurso_codigo, tabla_baserow |
| EJECUTOR_LOCAL | 3 | baserow_estructura, datos_negocio, vault_mencion | modulo_real |
| Telar Interactivo | 3 | codigo_node, n8n, vault_mencion | workflow_n8n |
| 39_PEDIDO_CLIENTE | 3 | codigo_appsscript, sheet_estructura, vault_mencion | pestana_sheet_negocio |
| 40_PEDIDO_CLIENTE_LINEA | 3 | codigo_appsscript, sheet_estructura, vault_mencion | pestana_sheet_negocio |
| 42_ENTREGA_LINEA | 3 | codigo_appsscript, sheet_estructura, vault_mencion | pestana_sheet_negocio |
| 43_CONTRATO_SERVICIO | 3 | codigo_appsscript, sheet_estructura, vault_mencion | pestana_sheet_negocio |
| 45_TAREA_COMPETENCIA | 3 | codigo_appsscript, sheet_estructura, vault_mencion | pestana_sheet_negocio |
| 01_CAMPANAS | 3 | datos_negocio, sheet_estructura, vault_mencion | pestana_sheet_negocio |
| 03_PRODUCTOS | 3 | datos_negocio, sheet_estructura, vault_mencion | pestana_sheet_negocio |
| 05_PROCESOS | 3 | datos_negocio, sheet_estructura, vault_mencion | pestana_sheet_negocio |
| 07_TAREA_RESPONSABLE | 3 | codigo_appsscript, sheet_estructura, vault_mencion | pestana_sheet_negocio |
| 09_PRODUCTO_MATERIAL | 3 | codigo_appsscript, sheet_estructura, vault_mencion | pestana_sheet_negocio |
| 10_TAREA_MATERIAL | 3 | codigo_appsscript, sheet_estructura, vault_mencion | pestana_sheet_negocio |
| STG_EQUIPO_MIEMBRO | 3 | codigo_appsscript, sheet_estructura, vault_mencion | pestana_sheet_utilidad |
| STG_TAREA_RESPONSABLE | 3 | codigo_appsscript, sheet_estructura, vault_mencion | pestana_sheet_utilidad |
| 19_MOVIMIENTO_MATERIAL | 3 | codigo_appsscript, sheet_estructura, vault_mencion | pestana_sheet_negocio |
| 20_EJECUCION_TAREA | 3 | codigo_appsscript, sheet_estructura, vault_mencion | pestana_sheet_negocio |
| 21_PROVEEDOR_MATERIAL | 3 | codigo_appsscript, sheet_estructura, vault_mencion | pestana_sheet_negocio |
| 22_EQUIPO_MIEMBRO | 3 | codigo_appsscript, sheet_estructura, vault_mencion | pestana_sheet_negocio |
| 25_PEDIDO_PROVEEDOR | 3 | codigo_appsscript, sheet_estructura, vault_mencion | pestana_sheet_negocio |
| 26_PEDIDO_PROVEEDOR_LINEA | 3 | codigo_appsscript, sheet_estructura, vault_mencion | pestana_sheet_negocio |
| 28_RECEPCION_LINEA | 3 | codigo_appsscript, sheet_estructura, vault_mencion | pestana_sheet_negocio |
| 31_FUENTE_FINANCIACION | 3 | codigo_appsscript, sheet_estructura, vault_mencion | pestana_sheet_negocio |
| 33_COMPETENCIA | 3 | baserow_estructura, sheet_estructura, vault_mencion | pestana_sheet_negocio |
| 35_RECURSO_COMPETENCIA | 3 | codigo_appsscript, sheet_estructura, vault_mencion | pestana_sheet_negocio |
| 37_ETIQUETA_IMPACTO | 3 | codigo_appsscript, sheet_estructura, vault_mencion | pestana_sheet_negocio |
| 98_LOG_GOBIERNO | 3 | codigo_node, sheet_estructura, vault_mencion | pestana_sheet_utilidad |

## Fichas reales a REVISAR (existen, pero con poca corroboracion cruzada)

| nombre | tipo (vault) | corroboracion | fuentes reales |
|---|---|---|---|
| Modulos acoplables | modulo | 3 | vault_ficha, vault_mencion, vault_wikilink |
| 00_Mapa | mapa | 3 | vault_ficha, vault_mencion, vault_wikilink |
| Mensajero | personaje | 3 | vault_ficha, vault_mencion, vault_wikilink |
| VPS y Tailscale | espacio | 3 | vault_ficha, vault_mencion, vault_wikilink |
| El Sheet | espacio | 3 | vault_ficha, vault_mencion, vault_wikilink |
| Sesion 2026-09-01 | sesion | 3 | vault_ficha, vault_mencion, vault_wikilink |
| Narrador | personaje | 3 | vault_ficha, vault_mencion, vault_wikilink |
| Acervo Narrativo | personaje | 3 | vault_ficha, vault_mencion, vault_wikilink |
| Estilo | estilo | 3 | vault_ficha, vault_mencion, vault_wikilink |
| Verificador de Campos | personaje | 3 | vault_ficha, vault_mencion, vault_wikilink |
| El universo no se ha usado sobre si mismo | hilo | 3 | vault_ficha, vault_mencion, vault_wikilink |
| La fragua protegida | espacio | 3 | vault_ficha, vault_mencion, vault_wikilink |
| IntegrityService | modulo | 3 | vault_ficha, vault_mencion, vault_wikilink |
| Acervo Logico | personaje | 3 | vault_ficha, vault_mencion, vault_wikilink |
| Decidir el tono del universo | hilo | 3 | vault_ficha, vault_mencion, vault_wikilink |
| Acervo Filosofico | personaje | 3 | vault_ficha, vault_mencion, vault_wikilink |
| Acervo Sociocracia | personaje | 3 | vault_ficha, vault_mencion, vault_wikilink |
| El Sheet manda | regla | 3 | vault_ficha, vault_mencion, vault_wikilink |
| Los dos continentes de datos | regla | 3 | vault_ficha, vault_mencion, vault_wikilink |
| Arco del incidente | arco | 3 | vault_ficha, vault_mencion, vault_wikilink |
| Arco de la calibracion | arco | 3 | vault_ficha, vault_mencion, vault_wikilink |
| Arco del cierre del autociclo | arco | 3 | vault_ficha, vault_mencion, vault_wikilink |
| Cerrar el circulo via incidencias | hilo | 3 | vault_ficha, vault_mencion, vault_wikilink |
| El Vault | espacio | 3 | vault_ficha, vault_mencion, vault_wikilink |
| Formularios | modulo | 3 | vault_ficha, vault_mencion, vault_wikilink |
| ConfigRepository | modulo | 3 | vault_ficha, vault_mencion, vault_wikilink |
| Acervo Tecnico | personaje | 3 | vault_ficha, vault_mencion, vault_wikilink |
| Acervo Logistico | personaje | 3 | vault_ficha, vault_mencion, vault_wikilink |
| Acervo Usuario | personaje | 3 | vault_ficha, vault_mencion, vault_wikilink |
| Honestidad del fallo | regla | 3 | vault_ficha, vault_mencion, vault_wikilink |
| Arco del bug oculto | arco | 3 | vault_ficha, vault_mencion, vault_wikilink |
| Arco de la construccion del universo | arco | 3 | vault_ficha, vault_mencion, vault_wikilink |
| Unir historia y gobernanza | hilo | 3 | vault_ficha, vault_mencion, vault_wikilink |
| El ciclo de vida remoto | espacio | 3 | vault_ficha, vault_mencion, vault_wikilink |
| Headscale | espacio | 3 | vault_ficha, vault_mencion, vault_wikilink |
| Gantt | modulo | 3 | codigo_appsscript, vault_ficha, vault_wikilink |
| Arco del nacimiento del generador | arco | 3 | vault_ficha, vault_mencion, vault_wikilink |
| Quien dispara el primer lote | hilo | 3 | vault_ficha, vault_mencion, vault_wikilink |
| Migrar el hardcode de token en n8n | hilo | 3 | vault_ficha, vault_mencion, vault_wikilink |
| Diversificar el roster de Acervos | hilo | 3 | vault_ficha, vault_mencion, vault_wikilink |
| Separar el Holon en notas propias | hilo | 3 | vault_ficha, vault_mencion, vault_wikilink |
| AGORA | recurso, modulo_real, tabla_baserow | 3 | baserow_estructura, datos_negocio, vault_ficha |
| Zona de aterrizaje STG | recurso | 3 | vault_ficha, vault_mencion, vault_wikilink |
| Sesion 2026-08-31 | sesion | 3 | vault_ficha, vault_mencion, vault_wikilink |
| n8n | espacio | 2 | vault_ficha, vault_wikilink |
| 00_Nucleo | sin_tipo | 2 | vault_ficha, vault_mencion |

## Fichas reales CONFIRMADAS (bien corroboradas por el resto del ecosistema)

| nombre | tipo (vault) | corroboracion | fuentes reales |
|---|---|---|---|
| Cliente | modulo | 8 | baserow_estructura, codigo_appsscript, codigo_node, datos_negocio, sheet_estructura, vault_ficha, vault_mencion, vault_wikilink |
| Ejecutor | personaje | 7 | baserow_estructura, codigo_appsscript, datos_negocio, sheet_estructura, vault_ficha, vault_mencion, vault_wikilink |
| Cronista | personaje, modulo_real | 7 | baserow_estructura, codigo_node, datos_negocio, n8n, vault_ficha, vault_mencion, vault_wikilink |
| Concilio | personaje | 6 | codigo_node, n8n, telar, vault_ficha, vault_mencion, vault_wikilink |
| Coordinador | personaje | 6 | codigo_appsscript, codigo_node, sheet_estructura, vault_ficha, vault_mencion, vault_wikilink |
| Vigilia | personaje | 6 | baserow_estructura, codigo_node, n8n, vault_ficha, vault_mencion, vault_wikilink |
| Relevo | personaje | 6 | baserow_estructura, codigo_node, telar, vault_ficha, vault_mencion, vault_wikilink |
| Oportunidad | modulo | 6 | baserow_estructura, codigo_appsscript, sheet_estructura, vault_ficha, vault_mencion, vault_wikilink |
| Ejecucion | modulo | 6 | codigo_appsscript, codigo_node, sheet_estructura, vault_ficha, vault_mencion, vault_wikilink |
| Baserow | espacio | 5 | codigo_node, n8n, vault_ficha, vault_mencion, vault_wikilink |
| Acervo | personaje, recurso_codigo, tabla_baserow | 5 | baserow_estructura, codigo_node, vault_ficha, vault_mencion, vault_wikilink |
| GASTO_API | recurso, recurso_codigo, tabla_baserow | 5 | baserow_estructura, codigo_node, vault_ficha, vault_mencion, vault_wikilink |
| Telar | espacio | 5 | baserow_estructura, codigo_node, n8n, vault_ficha, vault_wikilink |
| 92_BUS_TRABAJO | recurso, pestana_sheet_utilidad | 5 | codigo_node, sheet_estructura, vault_ficha, vault_mencion, vault_wikilink |
| DOCUMENTO_ENGREMIAT | recurso, recurso_codigo, tabla_baserow | 5 | baserow_estructura, codigo_node, vault_ficha, vault_mencion, vault_wikilink |
| Impacto | modulo | 5 | codigo_appsscript, sheet_estructura, vault_ficha, vault_mencion, vault_wikilink |
| Escenarios | modulo | 5 | baserow_estructura, codigo_appsscript, vault_ficha, vault_mencion, vault_wikilink |
| Bus de trabajo | oficio | 5 | codigo_node, sheet_estructura, vault_ficha, vault_mencion, vault_wikilink |
| Salud del ecosistema | oficio | 5 | codigo_node, datos_negocio, vault_ficha, vault_mencion, vault_wikilink |
| Actualizar libreria cliente | oficio | 5 | codigo_appsscript, codigo_node, vault_ficha, vault_mencion, vault_wikilink |
| Consola | espacio | 5 | codigo_appsscript, codigo_node, sheet_estructura, vault_ficha, vault_mencion |
| Puerta Humana | regla | 4 | n8n, vault_ficha, vault_mencion, vault_wikilink |
| CORE | modulo | 4 | codigo_appsscript, datos_negocio, vault_ficha, vault_wikilink |
| Acervo Prompter | personaje | 4 | codigo_node, vault_ficha, vault_mencion, vault_wikilink |
| Repository | modulo | 4 | codigo_appsscript, vault_ficha, vault_mencion, vault_wikilink |
| Verificador de Capacidades | personaje | 4 | codigo_node, vault_ficha, vault_mencion, vault_wikilink |
| Ventas | modulo | 4 | codigo_appsscript, vault_ficha, vault_mencion, vault_wikilink |
| Aprovisionamiento | modulo | 4 | codigo_appsscript, vault_ficha, vault_mencion, vault_wikilink |
| Convocatorias | modulo | 4 | codigo_appsscript, vault_ficha, vault_mencion, vault_wikilink |
| Economico | modulo | 4 | codigo_appsscript, vault_ficha, vault_mencion, vault_wikilink |
| Comunicacion | modulo | 4 | codigo_appsscript, vault_ficha, vault_mencion, vault_wikilink |
| Verificar contra hechos | regla | 4 | n8n, vault_ficha, vault_mencion, vault_wikilink |
| EstructuraInicial | modulo | 4 | codigo_appsscript, vault_ficha, vault_mencion, vault_wikilink |
| Física | regla | 4 | codigo_appsscript, vault_ficha, vault_mencion, vault_wikilink |
| Compras | modulo | 4 | codigo_appsscript, vault_ficha, vault_mencion, vault_wikilink |
| Operativa | modulo | 4 | codigo_appsscript, vault_ficha, vault_mencion, vault_wikilink |
| Seguimiento | modulo | 4 | codigo_appsscript, vault_ficha, vault_mencion, vault_wikilink |
| Chequear libreria clientes | oficio | 4 | codigo_node, vault_ficha, vault_mencion, vault_wikilink |
| Puente historia leyes | oficio | 4 | codigo_node, vault_ficha, vault_mencion, vault_wikilink |
| Chequear consistencia | oficio | 4 | codigo_node, vault_ficha, vault_mencion, vault_wikilink |
| Extraer decisiones | oficio | 4 | codigo_node, vault_ficha, vault_mencion, vault_wikilink |
| Pregonero | personaje | 4 | baserow_estructura, vault_ficha, vault_mencion, vault_wikilink |
| Cerrar ciclo | oficio | 4 | codigo_node, vault_ficha, vault_mencion, vault_wikilink |
| Ejecutar chequeo libreria | oficio | 4 | codigo_appsscript, vault_ficha, vault_mencion, vault_wikilink |
| Exportador de gasto | oficio | 4 | codigo_node, vault_ficha, vault_mencion, vault_wikilink |
| Regenerar estatico | oficio | 4 | codigo_node, vault_ficha, vault_mencion, vault_wikilink |

## Descartadas hoy (84), por si conviene revisar el criterio

No se listan todas por volumen -- ver `censo_entidades.json` completo. Los primeros 20 candidatos descartados con mayor corroboracion (los mas cerca del umbral):

| nombre | corroboracion | fuentes reales |
|---|---|---|
| Gestor de proyectos | 2 | datos_negocio, vault_mencion |
| La Troballa - Taller Ocupacional | 2 | datos_negocio, vault_mencion |
| TEST-Cliente-2026-08-29 | 2 | codigo_node, datos_negocio |
| Vision Mision | 2 | vault_mencion, vault_wikilink |
| Proyecto 0 — Catálogo de módulos | 2 | codigo_appsscript, datos_negocio |
| Diseño | 2 | datos_negocio, vault_mencion |
| Implementación | 2 | datos_negocio, vault_mencion |
| Desplegado | 2 | datos_negocio, vault_mencion |
| Cronista - Segmentar documento en tareas (con puerta humana) | 2 | n8n, vault_mencion |
| 44_OPORTUNIDAD | 2 | sheet_estructura, vault_mencion |
| 41_ENTREGA | 2 | sheet_estructura, vault_mencion |
| SOLICITUDES_MONTAJE | 2 | codigo_appsscript, sheet_estructura |
| 08_MATERIALES | 2 | sheet_estructura, vault_mencion |
| STG_RECURSO | 2 | sheet_estructura, vault_mencion |
| STG_PERSONA | 2 | sheet_estructura, vault_mencion |
| STG_DECISION | 2 | sheet_estructura, vault_mencion |
| STG_INCIDENCIA | 2 | sheet_estructura, vault_mencion |
| STG_DOCUMENTO | 2 | sheet_estructura, vault_mencion |
| STG_HORARIO | 2 | sheet_estructura, vault_mencion |
| 12_DECISIONES | 2 | sheet_estructura, vault_mencion |

---

## Consolidación real (confirmar + promover + revisar + descartar)

Segunda pasada pedida explícitamente sobre las 103 entidades de los tres primeros grupos ("investiga y termina de consolidarlo"), más una investigación real del grupo descartar con el criterio explícito dado: "si encontramos huecos en el grafo global será nuestra primera fuente de posibilidad, si al final no tiene sentido, lo dejamos como histórico".

Dos fuentes reales más que el primer censo no tenía: el catálogo real `MODULO_POR_ENTIDAD_MVP` de `src/Ids.js` (más fuerte que coincidencia de texto -- es el propio código), y las transcripciones reales ya ocurridas en `tools/gobierno/telar/b2/respuestas_originales/`. Más un puñado de correspondencias verificadas a mano leyendo el fichero real, nunca adivinadas.

### Bug real encontrado y corregido investigando

`cargar_grafo_wikilinks.mjs` derivaba el destino de una relación desde el NOMBRE DEL FICHERO, no desde el cuerpo real -- para relaciones con varios destinos (p.ej. `Concilio depende_de 7 Acervos-o-mecanismos.md`) esto producía una entidad falsa ("7 Acervos-o-mecanismos") en vez de las 7 aristas reales hacia los 7 Acervos reales que sí están, como wikilinks, en el cuerpo del fichero. Corregido: ahora lee los wikilinks reales del cuerpo. Efecto real: 222→220 candidatas, 2 entidades fantasma menos, 8 aristas reales más.

### Los 5 huecos reales concretos, investigados y resueltos en esta misma sesión

- **VIGILIA_TAREA, METRICA_FABRICACION, EJECUTOR_LOCAL** -- investigando a fondo (no solo con reglas) se encontró que NO eran entidades nuevas: `Vigilia.md`, `Coordinador.md` y `Ejecutor.md` ya narraban estos tres recursos reales en prosa, solo les faltaba el vínculo explícito. Resuelto añadiendo una sección `## Vínculo real` a cada ficha existente, sin tocar el resto de su contenido -- crear una ficha nueva habría sido redundante.
- **DOCUMENTO_ENGREMIAT, AGORA** -- estos dos sí eran huecos genuinos: módulos/tablas reales y activos sin ninguna ficha que los narrara. Resuelto creando su ficha real: `01_Mundo/Recursos/DOCUMENTO_ENGREMIAT.md` (grounded en el catálogo real de 56 filas, 46 documentos + 10 mecanismos) y `01_Mundo/Recursos/AGORA.md` (honesto sobre ser nascente: activo para un cliente real, sin código ni narrativa propia todavía más allá de eso).

### 2 candidatas a ficha nueva, investigadas -- 1 resuelta con ficha real, 1 resultó no serlo

- **"Física"** -- sí era un hueco real: citado ya tres veces en fichas reales (`Estilo.md`, `Coordinador.md`, `GASTO_API.md`) como concepto fundacional, nunca con ficha propia. Creada `03_Reglas/Física.md`, reuniendo sin inventar nada las tres citas ya existentes.
- **"Vision Mision"** -- investigado más a fondo: NO es una entidad nueva. Es una fila real ya catalogada dentro de `DOCUMENTO_ENGREMIAT` (id 4, `ARCHIVO_HISTORICO/Documentos/VISION_MISION.md`), que el propio sistema ya marca "estado: revisar" y "contradice a MAPA_DOMINIOS_DATOS". Correctamente histórico -- ya cubierto por la ficha real de DOCUMENTO_ENGREMIAT recién creada.

### 5 que YA tienen grafo real propio -- el censo no las veía por cómo se construyó, no por un hueco real

`91_HISTORIAL`, `01_CAMPANAS`, `03_PRODUCTOS`, `05_PROCESOS`, `PAQUETE_CLIENTE` -- los 4 grafos reales de negocio construidos en §8.22 no incluyen el nombre de la propia pestaña/tabla como nodo (solo sus instancias), así que el censo por nombre no podía verlos. Corrección honesta, no un hallazgo nuevo.

### El resto del grupo descartar (~108 entidades): histórico, tal como se pidió

Clasificado por patrón real, no dejado sin mirar: instancias específicas de negocio (una tarea/proceso/proyecto concreto -- correctamente fuera de la capa de gobernanza), pestañas/tablas reales con huella hoy insuficiente, y detalles de implementación ya cubiertos por su Personaje/Espacio real (p.ej. el nombre literal de un workflow n8n). Ver `censo_entidades.json` para el detalle entidad por entidad.

| acción recomendada | cuántas | qué significa |
|---|---|---|
| ya_mencionado_en_boveda | 74 | Ya aparece mencionada de verdad dentro de una ficha real de la bóveda (fuente `vault_mencion`, §8.29) -- normalmente como `vinculoReal` de su módulo dueño real. No hace falta ficha propia. |
| confirmar_ya_solido | 46 | Ya bien corroborado (≥4 fuentes) en el primer censo -- sin cambios, candidato a enriquecer con `vinculoReal`. |
| historico_instancia_negocio | 43 | Instancia real específica de negocio (una tarea/proceso/proyecto concreto) -- fuera del alcance de la capa de gobernanza. Histórico. |
| correcto_narrativo | 19 | Contenido narrativo/bitácora por diseño -- baja corroboración es lo esperado, no un hueco. |
| revisar_manual_real | 14 | Sin patrón claro aplicable -- necesita revisión humana real antes de decidir. |
| confirmar_codigo_real | 9 | Correspondencia real de código encontrada -- confirmado. |
| historico_pestana_sin_huella | 4 | Pestaña real del Sheet con huella hoy insuficiente fuera de sí misma. Histórico, revisar si gana uso real. |
| descartar_termino_generico | 3 | Palabra genérica (TAREA, DOCUMENTO...) que aparece en muchas tablas sin ser ella misma una entidad -- ya existen las entidades específicas reales. No promover. |
| confirmar_uso_real_telar | 3 | Sin script propio, pero con deliberación real ya ocurrida en Telar B2 -- personaje activo de verdad. |
| ya_cubierto_grafo_propio | 2 | Ya tiene un grafo real propio (91_HISTORIAL / jerarquía / PAQUETE_CLIENTE) -- el censo no lo veía por cómo se construyó, no es un hueco real. |
| revisar_inconsistencia_nombres | 1 | No falta una entidad -- falta consistencia de nombres entre wikilinks y fichas reales ya existentes. |
| confirmar_verificado_a_mano | 1 | Correspondencia confirmada leyendo el fichero real a mano (nombre distinto en bóveda vs. código). |
| confirmar_patron_tecnico | 1 | Real en el código, pero NO es un módulo de negocio MVP -- es un patrón técnico interno (Repository, IntegrityService...). Revisar si el `tipo` en la ficha es el correcto. |
| revisar_nombre_narrativo | 1 | Nombre narrativo del universo -- el cruce por texto no alcanza su referente real. No es evidencia de que falte, es un límite del método. Acción: añadir `vinculoReal` explícito. |
| historico_instancia_ya_catalogada | 1 | Investigado a mano: no era una entidad nueva -- ya es una fila catalogada dentro de un Recurso real (p.ej. DOCUMENTO_ENGREMIAT). Histórico, correctamente no promovido. |
| historico_detalle_implementacion | 1 | Detalle de implementación (nombre literal de un workflow) ya cubierto por su Personaje/Espacio real. Histórico. |
| historico_dato_operativo | 1 | Dato operativo real (un cliente) -- no una entidad del universo de gobernanza. Histórico. |
| historico_tabla_sin_huella | 1 | Tabla real de Baserow sin huella real todavía. Histórico, misma nota que PERSONAJE en §8.20. |

Detalle completo, entidad por entidad, con su razón real: ver `censo_entidades.json` (campos `accionRecomendada` + `accionRazon`) o la vista filtrable en `entidades.html`.
