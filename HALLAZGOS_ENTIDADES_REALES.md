# Censo real de entidades del universo Engremiat

Generado el 2026-09-03T05:47:34.746Z cruzando 9 fuentes reales: 8 grafos (Apps Script, Node, n8n, 91_HISTORIAL, jerarquia Sheet, PAQUETE_CLIENTE, Telar, wikilinks de la boveda) mas la estructura atomica completa de Sheet (70 pestanas) y Baserow (18 tablas). Ver `PROPUESTA_BASTIDOR_GESTOR_PROYECTOS_ENGREMIAT.md` §8.23.

**Limite honesto**: el cruce de identidad es por coincidencia de nombre/tokens normalizados, no por ID unico todavia -- primer barrido exhaustivo real, no un censo perfecto. Cada fila lleva su evidencia al lado para que se pueda revisar a mano.

## Resumen: 222 entidades candidatas reales

- **18 confirmar** -- ficha real ya existente, bien corroborada.
- **20 promover** -- sin ficha propia hoy, corroborada por >=3 fuentes reales independientes.
- **65 revisar** -- ficha real ya existente pero apenas corroborada fuera de la boveda.
- **119 descartar** -- evidencia real insuficiente hoy.

## Ciclos reales encontrados: 4

- **malla de 64 nodos** (no es un bucle simple, es una red de referencias mutuas -- ver `censo_entidades.json` para la lista completa): 00_mapa <-> 92_bus_trabajo <-> acervo_filosofico <-> acervo_logico <-> acervo_logistico <-> acervo_narrativo <-> acervo_prompter <-> acervo_sociocracia ... (+56 mas)
- chequear_libreria_clientes <-> ejecutar_chequeo_libreria
- dato:appsscript.json <-> dato:clientes.json <-> dato:libreria.json <-> tools/constructor/montar-cliente.mjs <-> tools/constructor/montar-cliente.test.mjs
- aprobada_sin_ejecutar <-> concilio_convocando <-> deliberando <-> devuelta <-> esperando_relevo <-> huella <-> orientacion <-> puerta_ejecutada <-> puerta_en_curso <-> puerta_err <-> puerta_pendiente <-> puerta_warn <-> sin_seleccionar <-> tejiendo

Nota honesta sobre el primer ciclo (la malla grande): no es un bucle de dependencia problematico -- es el efecto esperable de que muchas fichas del Holon se enlazan mutuamente ([[A]] enlaza a [[B]] y [[B]] enlaza de vuelta a [[A]]), lo que convierte a Tarjan casi todo el mesh en una sola componente fuertemente conexa. Los otros tres ciclos son mas pequenos y mas interesantes: dos scripts que se referencian de verdad entre si, un grupo real de ficheros de datos compartidos entre montar-cliente.mjs y su test, y el ciclo de vida real de Telar (esperado, ya validado en B0).

## Vocabulario de relacion real, por frecuencia

| tipo | total | capas donde aparece |
|---|---|---|
| calls | 2994 | apps_script:2994 |
| contains | 1573 | apps_script:1573 |
| wikilink | 263 | wikilinks:263 |
| conexion_n8n | 138 | n8n:138 |
| indirect_call | 100 | apps_script:100 |
| toco_en_operacion | 81 | historial:81 |
| parte_de_jerarquia | 43 | jerarquia:43 |
| toca_recurso | 39 | node:39 |
| escribe_debil | 22 | node:22 |
| transicion_estado | 19 | telar_estados:19 |
| lee_debil | 14 | node:14 |
| opera_en | 8 | wikilinks:8 |
| lee | 8 | node:8 |
| import | 6 | node:6 |
| escribe | 4 | node:4 |
| modulo_activo | 3 | paquete_cliente:3 |
| depende_de | 2 | wikilinks:2 |
| alimenta_a | 2 | wikilinks:2 |
| gobierna_a | 2 | wikilinks:2 |
| activa_a | 1 | wikilinks:1 |
| verifica_a | 1 | wikilinks:1 |
| corrige_a | 1 | wikilinks:1 |
| parte_de | 1 | wikilinks:1 |
| cites | 1 | apps_script:1 |

## Candidatas a PROMOVER (sin ficha propia, corroboradas por >=3 fuentes reales)

| nombre | corroboracion | fuentes reales | tipo candidato |
|---|---|---|---|
| TAREA | 6 | baserow_estructura, codigo_appsscript, codigo_node, datos_negocio, n8n, sheet_estructura | recurso_codigo, tabla_baserow |
| DOCUMENTO | 6 | baserow_estructura, codigo_appsscript, codigo_node, datos_negocio, n8n, sheet_estructura | recurso_codigo, tabla_baserow |
| 38_CLIENTE | 4 | baserow_estructura, codigo_node, datos_negocio, sheet_estructura | recurso_codigo, pestana_sheet_negocio |
| Verificación | 4 | baserow_estructura, datos_negocio, n8n, sheet_estructura | entidad_negocio_proceso |
| 06_TAREAS | 4 | baserow_estructura, codigo_node, datos_negocio, sheet_estructura | pestana_sheet_negocio |
| 13_INCIDENCIAS | 3 | codigo_node, datos_negocio, sheet_estructura | recurso_codigo, pestana_sheet_negocio |
| Acervo | 3 | baserow_estructura, codigo_node, vault_wikilink | referencia_sin_ficha, recurso_codigo, tabla_baserow |
| 18_VINCULO | 3 | codigo_node, datos_negocio, sheet_estructura | recurso_codigo, pestana_sheet_negocio |
| Acervos | 3 | baserow_estructura, codigo_node, vault_wikilink | referencia_sin_ficha |
| PLANTILLA_MISION | 3 | baserow_estructura, codigo_node, n8n | recurso_codigo, tabla_baserow |
| 46_TAREA_RECURSO_NECESIDAD | 3 | codigo_appsscript, codigo_node, sheet_estructura | pestana_sheet_negocio |
| 02_PROYECTOS | 3 | baserow_estructura, datos_negocio, sheet_estructura | pestana_sheet_negocio |
| 04_PROYECTO_PRODUCTO | 3 | codigo_appsscript, datos_negocio, sheet_estructura | pestana_sheet_negocio |
| 11_PERSONAS_EQUIPOS | 3 | codigo_appsscript, datos_negocio, sheet_estructura | pestana_sheet_negocio |
| STG_TAREA_RECURSO | 3 | codigo_appsscript, codigo_node, sheet_estructura | pestana_sheet_utilidad |
| 14_DOCUMENTOS | 3 | baserow_estructura, codigo_node, sheet_estructura | pestana_sheet_negocio |
| 24_TAREA_RECURSO | 3 | codigo_appsscript, codigo_node, sheet_estructura | pestana_sheet_negocio |
| 34_PERSONA_COMPETENCIA | 3 | baserow_estructura, codigo_appsscript, sheet_estructura | pestana_sheet_negocio |
| COMPETENCIA | 3 | baserow_estructura, codigo_appsscript, sheet_estructura | tabla_baserow |
| PERSONA_COMPETENCIA | 3 | baserow_estructura, codigo_appsscript, sheet_estructura | tabla_baserow |

## Fichas reales a REVISAR (existen, pero con poca corroboracion cruzada)

| nombre | tipo (vault) | corroboracion | fuentes reales |
|---|---|---|---|
| Puerta Humana | regla | 3 | n8n, vault_ficha, vault_wikilink |
| Acervo Prompter | personaje | 3 | codigo_node, vault_ficha, vault_wikilink |
| Repository | modulo | 3 | codigo_appsscript, vault_ficha, vault_wikilink |
| Ventas | modulo | 3 | codigo_appsscript, vault_ficha, vault_wikilink |
| Aprovisionamiento | modulo | 3 | codigo_appsscript, vault_ficha, vault_wikilink |
| Verificador de Capacidades | personaje | 3 | codigo_node, vault_ficha, vault_wikilink |
| Convocatorias | modulo | 3 | codigo_appsscript, vault_ficha, vault_wikilink |
| Economico | modulo | 3 | codigo_appsscript, vault_ficha, vault_wikilink |
| Comunicacion | modulo | 3 | codigo_appsscript, vault_ficha, vault_wikilink |
| Verificar contra hechos | regla | 3 | n8n, vault_ficha, vault_wikilink |
| EstructuraInicial | modulo | 3 | codigo_appsscript, vault_ficha, vault_wikilink |
| Compras | modulo | 3 | codigo_appsscript, vault_ficha, vault_wikilink |
| Gantt | modulo | 3 | codigo_appsscript, vault_ficha, vault_wikilink |
| Chequear libreria clientes | oficio | 3 | codigo_node, vault_ficha, vault_wikilink |
| Chequear consistencia | oficio | 3 | codigo_node, vault_ficha, vault_wikilink |
| Extraer decisiones | oficio | 3 | codigo_node, vault_ficha, vault_wikilink |
| Pregonero | personaje | 3 | baserow_estructura, vault_ficha, vault_wikilink |
| Cerrar ciclo | oficio | 3 | codigo_node, vault_ficha, vault_wikilink |
| Ejecutar chequeo libreria | oficio | 3 | codigo_appsscript, vault_ficha, vault_wikilink |
| Exportador de gasto | oficio | 3 | codigo_node, vault_ficha, vault_wikilink |
| Puente historia leyes | oficio | 3 | codigo_node, vault_ficha, vault_wikilink |
| Regenerar estatico | oficio | 3 | codigo_node, vault_ficha, vault_wikilink |
| 00_Mapa | mapa | 2 | vault_ficha, vault_wikilink |
| Modulos acoplables | modulo | 2 | vault_ficha, vault_wikilink |
| Mensajero | personaje | 2 | vault_ficha, vault_wikilink |
| VPS y Tailscale | espacio | 2 | vault_ficha, vault_wikilink |
| n8n | espacio | 2 | vault_ficha, vault_wikilink |
| Sesion 2026-09-01 | sesion | 2 | vault_ficha, vault_wikilink |
| El Sheet | espacio | 2 | vault_ficha, vault_wikilink |
| Narrador | personaje | 2 | vault_ficha, vault_wikilink |
| El universo no se ha usado sobre si mismo | hilo | 2 | vault_ficha, vault_wikilink |
| Estilo | estilo | 2 | vault_ficha, vault_wikilink |
| La fragua protegida | espacio | 2 | vault_ficha, vault_wikilink |
| IntegrityService | modulo | 2 | vault_ficha, vault_wikilink |
| Acervo Narrativo | personaje | 2 | vault_ficha, vault_wikilink |
| Verificador de Campos | personaje | 2 | vault_ficha, vault_wikilink |
| Decidir el tono del universo | hilo | 2 | vault_ficha, vault_wikilink |
| El Sheet manda | regla | 2 | vault_ficha, vault_wikilink |
| Los dos continentes de datos | regla | 2 | vault_ficha, vault_wikilink |
| Arco del incidente | arco | 2 | vault_ficha, vault_wikilink |
| Arco de la calibracion | arco | 2 | vault_ficha, vault_wikilink |
| Arco del cierre del autociclo | arco | 2 | vault_ficha, vault_wikilink |
| Cerrar el circulo via incidencias | hilo | 2 | vault_ficha, vault_wikilink |
| El Vault | espacio | 2 | vault_ficha, vault_wikilink |
| Formularios | modulo | 2 | vault_ficha, vault_wikilink |
| ConfigRepository | modulo | 2 | vault_ficha, vault_wikilink |
| Acervo Logico | personaje | 2 | vault_ficha, vault_wikilink |
| Honestidad del fallo | regla | 2 | vault_ficha, vault_wikilink |
| Arco del bug oculto | arco | 2 | vault_ficha, vault_wikilink |
| Arco de la construccion del universo | arco | 2 | vault_ficha, vault_wikilink |
| Unir historia y gobernanza | hilo | 2 | vault_ficha, vault_wikilink |
| El ciclo de vida remoto | espacio | 2 | vault_ficha, vault_wikilink |
| Headscale | espacio | 2 | vault_ficha, vault_wikilink |
| Acervo Filosofico | personaje | 2 | vault_ficha, vault_wikilink |
| Acervo Sociocracia | personaje | 2 | vault_ficha, vault_wikilink |
| Arco del nacimiento del generador | arco | 2 | vault_ficha, vault_wikilink |
| Quien dispara el primer lote | hilo | 2 | vault_ficha, vault_wikilink |
| Migrar el hardcode de token en n8n | hilo | 2 | vault_ficha, vault_wikilink |
| Diversificar el roster de Acervos | hilo | 2 | vault_ficha, vault_wikilink |
| Separar el Holon en notas propias | hilo | 2 | vault_ficha, vault_wikilink |
| Acervo Tecnico | personaje | 2 | vault_ficha, vault_wikilink |
| Acervo Logistico | personaje | 2 | vault_ficha, vault_wikilink |
| Acervo Usuario | personaje | 2 | vault_ficha, vault_wikilink |
| Sesion 2026-08-31 | sesion | 2 | vault_ficha, vault_wikilink |
| 00_Nucleo | sin_tipo | 1 | vault_ficha |

## Fichas reales CONFIRMADAS (bien corroboradas por el resto del ecosistema)

| nombre | tipo (vault) | corroboracion | fuentes reales |
|---|---|---|---|
| Cliente | modulo | 7 | baserow_estructura, codigo_appsscript, codigo_node, datos_negocio, sheet_estructura, vault_ficha, vault_wikilink |
| Ejecutor | personaje | 6 | baserow_estructura, codigo_appsscript, datos_negocio, sheet_estructura, vault_ficha, vault_wikilink |
| Cronista | personaje, modulo_real | 6 | baserow_estructura, codigo_node, datos_negocio, n8n, vault_ficha, vault_wikilink |
| Concilio | personaje | 5 | codigo_node, n8n, telar, vault_ficha, vault_wikilink |
| Coordinador | personaje | 5 | codigo_appsscript, codigo_node, sheet_estructura, vault_ficha, vault_wikilink |
| Vigilia | personaje | 5 | baserow_estructura, codigo_node, n8n, vault_ficha, vault_wikilink |
| Relevo | personaje | 5 | baserow_estructura, codigo_node, telar, vault_ficha, vault_wikilink |
| Telar | espacio | 5 | baserow_estructura, codigo_node, n8n, vault_ficha, vault_wikilink |
| Oportunidad | modulo | 5 | baserow_estructura, codigo_appsscript, sheet_estructura, vault_ficha, vault_wikilink |
| Baserow | espacio | 4 | codigo_node, n8n, vault_ficha, vault_wikilink |
| CORE | modulo | 4 | codigo_appsscript, datos_negocio, vault_ficha, vault_wikilink |
| GASTO_API | recurso, recurso_codigo, tabla_baserow | 4 | baserow_estructura, codigo_node, vault_ficha, vault_wikilink |
| 92_BUS_TRABAJO | recurso, pestana_sheet_utilidad | 4 | codigo_node, sheet_estructura, vault_ficha, vault_wikilink |
| Impacto | modulo | 4 | codigo_appsscript, sheet_estructura, vault_ficha, vault_wikilink |
| Bus de trabajo | oficio | 4 | codigo_node, sheet_estructura, vault_ficha, vault_wikilink |
| Salud del ecosistema | oficio | 4 | codigo_node, datos_negocio, vault_ficha, vault_wikilink |
| Actualizar libreria cliente | oficio | 4 | codigo_appsscript, codigo_node, vault_ficha, vault_wikilink |
| Consola | espacio | 4 | codigo_appsscript, codigo_node, sheet_estructura, vault_ficha |

## Descartadas hoy (119), por si conviene revisar el criterio

No se listan todas por volumen -- ver `censo_entidades.json` completo. Los primeros 20 candidatos descartados con mayor corroboracion (los mas cerca del umbral):

| nombre | corroboracion | fuentes reales |
|---|---|---|
| VIGILIA_TAREA | 2 | baserow_estructura, codigo_node |
| DOCUMENTO_ENGREMIAT | 2 | baserow_estructura, codigo_node |
| METRICA_FABRICACION | 2 | baserow_estructura, codigo_node |
| TEST-Cliente-2026-08-29 | 2 | codigo_node, datos_negocio |
| Física | 2 | codigo_appsscript, vault_wikilink |
| PERSONAJE | 2 | baserow_estructura, codigo_node |
| Proyecto 0 — Catálogo de módulos | 2 | codigo_appsscript, datos_negocio |
| AGORA | 2 | baserow_estructura, datos_negocio |
| EJECUTOR_LOCAL | 2 | baserow_estructura, datos_negocio |
| Telar Interactivo | 2 | codigo_node, n8n |
| 39_PEDIDO_CLIENTE | 2 | codigo_appsscript, sheet_estructura |
| 40_PEDIDO_CLIENTE_LINEA | 2 | codigo_appsscript, sheet_estructura |
| 42_ENTREGA_LINEA | 2 | codigo_appsscript, sheet_estructura |
| 43_CONTRATO_SERVICIO | 2 | codigo_appsscript, sheet_estructura |
| 45_TAREA_COMPETENCIA | 2 | codigo_appsscript, sheet_estructura |
| 01_CAMPANAS | 2 | datos_negocio, sheet_estructura |
| SOLICITUDES_MONTAJE | 2 | codigo_appsscript, sheet_estructura |
| 03_PRODUCTOS | 2 | datos_negocio, sheet_estructura |
| 05_PROCESOS | 2 | datos_negocio, sheet_estructura |
| 07_TAREA_RESPONSABLE | 2 | codigo_appsscript, sheet_estructura |

---

## Consolidación real (confirmar + promover + revisar)

Segunda pasada pedida explícitamente sobre las 103 entidades de los tres primeros grupos ("investiga y termina de consolidarlo"). El grupo descartar (119) se deja intacto -- se valora aparte, al final, con el criterio ya dado: si revela un hueco real del grafo global es la primera fuente de posibilidad; si no, queda como histórico.

Dos fuentes reales más que el primer censo no tenía: el catálogo real `MODULO_POR_ENTIDAD_MVP` de `src/Ids.js` (más fuerte que coincidencia de texto -- es el propio código), y las transcripciones reales ya ocurridas en `tools/gobierno/telar/b2/respuestas_originales/`. Más un puñado de correspondencias verificadas a mano leyendo el fichero real, nunca adivinadas.

| acción recomendada | cuántas | qué significa |
|---|---|---|
| correcto_narrativo | 19 | Contenido narrativo/bitácora por diseño -- baja corroboración es lo esperado, no un hueco. |
| confirmar_ya_solido | 18 | Ya bien corroborado (≥4 fuentes) en el primer censo -- sin cambios, candidato a enriquecer con `vinculoReal`. |
| confirmar_codigo_real | 16 | Correspondencia real de código encontrada -- confirmado. |
| promover_recurso_real | 15 | Pestaña/tabla real bien corroborada -- candidata sólida a ficha de Recurso o a `vinculoReal` en una ficha existente. |
| revisar_manual_real | 11 | Sin patrón claro aplicable -- necesita revisión humana real antes de decidir. |
| revisar_nombre_narrativo | 10 | Nombre narrativo del universo -- el cruce por texto no alcanza su referente real. No es evidencia de que falte, es un límite del método. Acción: añadir `vinculoReal` explícito. |
| confirmar_patron_tecnico | 5 | Real en el código, pero NO es un módulo de negocio MVP -- es un patrón técnico interno (Repository, IntegrityService...). Revisar si el `tipo` en la ficha es el correcto. |
| descartar_termino_generico | 3 | Palabra genérica (TAREA, DOCUMENTO...) que aparece en muchas tablas sin ser ella misma una entidad -- ya existen las entidades específicas reales. No promover. |
| confirmar_uso_real_telar | 3 | Sin script propio, pero con deliberación real ya ocurrida en Telar B2 -- personaje activo de verdad. |
| revisar_inconsistencia_nombres | 2 | No falta una entidad -- falta consistencia de nombres entre wikilinks y fichas reales ya existentes. |
| confirmar_verificado_a_mano | 1 | Correspondencia confirmada leyendo el fichero real a mano (nombre distinto en bóveda vs. código). |

Detalle completo, entidad por entidad, con su razón real: ver `censo_entidades.json` (campos `accionRecomendada` + `accionRazon`) o la vista filtrable en `entidades.html`.
