# Propuesta — Apoyo digital a la autonomía en hogares neurodiversos

**Fecha de apertura:** 2026-08-25
**Estado:** A valorar -- primer piloto en primera persona, documentado en abstracto
**Origen:** conversación derivada de INC-0056 (ecosistema agéntico) al explorar si la
estructura de Engremiat sirve para un producto de apoyo personal, no solo de gestión
de taller/proyecto. Cada cliente real que use este enfoque aporta su propio contexto --
este documento no fija un perfil cerrado, describe el caso piloto en abstracto.

## Caso piloto (abstraído -- cada cliente aporta su propia realidad)

Hogar con varias personas neurodivergentes/con discapacidad conviviendo, cada una con
necesidades de apoyo distintas y no intercambiables entre sí (un perfil con necesidad
de rutina y previsibilidad, otro con desregulación del ánimo, otro con impulsividad,
otro con alta dependencia física además de una condición neurológica). Contexto
económico real: no se puede ampliar ingreso fácilmente, pero sí ahorrar coste mediante
producción propia (huerto, conservas/fermentados). El cuidado no puede generalizarse --
horarios de descanso irregulares, capacidad diaria variable por persona. Objetivo
explícito del usuario piloto: *"normalizar lo mínimo para poder llegar a hacer un
poquito más"* -- estabilizar la base antes que ampliar objetivos.

## Principio rector, por encima de cualquier función concreta

La persona es la usuaria principal del sistema, no el objeto de seguimiento de un
cuidador. Cualquier visibilidad de familia/red de apoyo sobre los datos de otra
persona es opt-in explícito, nunca por defecto. Lenguaje siempre desde el objetivo
("lo que quiero conseguir"), nunca desde el déficit. Dignidad del riesgo: el sistema
apoya que la persona intente algo y falle, no se lo impide por su propio bien.

## Hallazgos de investigación aplicados al diseño (2026-08-25)

- **Capacidad diaria variable, no fija** ("spoon theory", Miserandino 2003): cada
  persona reporta su capacidad disponible cada día; el sistema filtra qué tareas
  muestra según eso, en vez de asumir una capacidad constante.
- **Coordinación de cuidado mal hecha empeora, no solo no ayuda**: investigación real
  de cuidado familiar compartido identifica patrones distintos (reparto por dominio
  fijo vs. reparto abierto vs. una sola persona cuidando todo) -- mala coordinación
  entre varios cuidadores se asocia con más síntomas depresivos. El sistema debe
  permitir configurar el patrón de reparto por tipo de tarea, no imponer uno único.
- **Escalado a "grupos de hogares" vía Redes de Apoyo Mutuo, no un grupo grande**:
  la práctica real de mutual aid networks confirma que grupos de 3-8 hogares
  coordinan bien, y que las redes más grandes se construyen conectando grupos
  pequeños entre sí, no agrandando uno solo -- con timebanking/intercambio no
  monetario como mecanismo real ya usado entre hogares.
- **Lista de la compra como dispositivo de pre-compromiso**: decidir en un momento
  estable, ejecutar en un momento inestable, tiene respaldo clínico real -- el
  DSM-5 incluye la compra compulsiva dentro del criterio de impulsividad de varios
  cuadros clínicos relevantes aquí.
- **Principios de co-diseño de la investigación de accesibilidad**: *"consent beats
  compliance"* (ningún recordatorio se impone) y *"el diseño se valida en los
  márgenes, no en el usuario promedio"* -- huir de una configuración de
  accesibilidad única para todo el hogar.
- **Referencias de patrones de interacción ya validados con poblaciones similares**
  (a mirar como inspiración, no a integrar): AutistApp (herramienta creada por y
  para comunidad autista, autorregulación/comunicación/autonomía), STap2Go
  (intervención digital de atención y funciones ejecutivas basada en estrategias de
  vida diaria).

## Mapeo sobre entidades ya existentes en Engremiat

| Necesidad | Entidad/mecanismo ya construido |
|---|---|
| Mantenimiento del hogar | `CAMPAÑA`/`PROYECTO`, `RECURSO` con jerarquía de espacios |
| Huerto, conservas/fermentados | `PRODUCTO` con su propio `PROCESO`/`TAREA` (receta = proceso), `DesviacionService.js` para "¿va según lo previsto?" |
| Rutina de compras | Módulo `COMPRAS` ya construido (`PROVEEDOR`, `PEDIDO_PROVEEDOR`, `StockMaterialService.js`) |
| Ahorro real de coste por producción propia | Módulo `COSTE` -- ya calcula previsto vs. real, aplicable directo a "cuánto ahorró el huerto este mes" |
| Tareas críticas vs. flexibles | Nuevo campo propuesto en `TAREA` -- horario real (seguridad) vs. ventana amplia ("cuando puedas") |
| Reparto de cuidado por capacidad, no por rol fijo | Extensión propuesta sobre `PERSONA_EQUIPO`/`ASIGNACION` -- capacidad diaria autorreportada |
| Escalado a comunidad/grupos de hogares | `EQUIPO`/`COORDINADOR_ID` ya existente, aplicado como red de hogares pequeños conectados por una `CAMPAÑA` compartida, no un equipo único grande |
| Recordatorios ("recuerdo", "impulso") | Bot operativo ya construido (`WebhookTelegramService.js`, `BotOperativoService.js`) |
| Apoyo visual a función ejecutiva | `KanbanService.js`, ya construido, cero coste añadido |

## Deliberadamente fuera del alcance del primer PoC

- Gamificación completa (puntos, insignias, recompensas) -- riesgo real documentado
  de dañar la motivación intrínseca y generar vergüenza si se hace mal; se deja para
  un spike aparte, co-diseñado con más personas reales, no solo el piloto inicial.
- Campo de accesibilidad de espacios/actividades para recomendación de recursos
  externos -- útil, pero depende de tener ya un piloto funcionando con datos reales.
- Reparto de cuidado por capacidad diaria configurable -- se diseña con evidencia del
  PoC mínimo, no antes.
- Red de varios hogares (mutual aid) -- fase posterior, cuando exista más de un hogar
  piloto real.

## Alcance del PoC (mismo mínimo ya acordado, con 3 añadidos)

`CORE` + `COMUNICACION` + `COMPRAS`, más: categoría crítica/flexible en `TAREA`,
lista de compra "cerrada en modo planificación" como distinción explícita, ahorro
real del huerto/producción propia visible desde el primer día vía `COSTE`. Kanban
reutilizado tal cual, sin coste de construcción.

## Aviso de cumplimiento, no solo de diseño

En cuanto el sistema trata datos de discapacidad o salud, entra en la categoría de
datos especialmente protegidos (RGPD, artículo 9) -- consulta legal real recomendada
antes de tratar datos de cualquier usuario real más allá del piloto en primera
persona del propio operador.

## Bitácora

- **2026-08-25**: apertura tras explorar si la estructura de Engremiat sirve como
  motor de apoyo personal/familiar, no solo de gestión de taller. Primer piloto en
  primera persona, con investigación real aplicada al diseño el mismo día.
