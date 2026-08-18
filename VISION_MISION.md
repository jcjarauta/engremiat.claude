# Visión y misión — LaTroballa / el ecosistema

Este documento no es un roadmap técnico (para eso están `ROADMAP_IMPLEMENTACION.md`,
`ROADMAP_AUDITORIA_UX.md`, `ROADMAP_BACKLOG_MEJORAS.md` y
`ROADMAP_GESTOR_PROYECTOS_CLIENTE_VENTAS.md`). Es la conversación de fondo que
explica *por qué* se está construyendo lo que se construye, para que cualquier
decisión técnica futura pueda contrastarse contra esto en vez de perderse en el
detalle del sprint. Nace de una conversación de asesoría estratégica el
2026-08-17, con el runner de 346 pruebas reactivas corriendo en segundo plano.

## El diagnóstico

La crisis no es escasez de recursos — es desconexión entre oferta y demanda.
Existen capacidades (personas, espacios, materiales, conocimiento) y existen
necesidades, pero no se ven entre sí. Eso es verdad a escala pequeña (La
Troballa no siempre sabe qué tiene disponible cuando lo necesita) y es la
lectura de fondo de por qué falla el sistema económico actual a escala grande.

El software no resuelve la crisis fabricando más recursos. Resuelve la
**visibilidad**: hace que lo que un ecosistema puede ofrecer y lo que necesita
se encuentren.

## La misión

Construir un sistema que, partiendo de la gestión operativa real de una
organización (campañas, proyectos, personas, espacios, materiales), aprenda a:

1. **Hacer visible la relación necesidad-capacidad** dentro de la propia
   organización — antes de nada, que La Troballa se vea a sí misma con
   claridad.
2. **Proponer encajes** entre lo que sobra y lo que falta, primero dentro de
   la organización, después entre organizaciones de un mismo ecosistema.
3. **Responder a un hueco de capacidad con formación, no con extracción** —
   cuando falta algo, la primera respuesta del sistema no es comprarlo fuera,
   es proponer cómo construir esa capacidad dentro del ecosistema.
4. **Usar la salida al mercado fiat como sensor, no como fracaso** — cada vez
   que hace falta comprar/contratar fuera del ecosistema es una señal de qué
   formación o qué proyecto conviene impulsar después. El sistema no solo
   registra el hueco: propone estrategias para cerrarlo.

## Principios de diseño

- **Procomún, no contabilidad de deudas.** Cuando La Troballa tiene un
  excedente (un espacio libre, material sobrante) y otra organización del
  ecosistema lo necesita, el sistema **propone** el encaje a quien tiene la
  necesidad. No lleva un balance de quién debe a quién — se aporta y se
  dispone según necesidad, confiando en que el ecosistema se equilibra con el
  tiempo. Mismo espíritu que el encaje de Oportunidad ya construido: puntúa y
  propone, no factura.
- **Independencia tecnológica como valor, no solo como cumplimiento.** La IA
  interna no es solo una medida de privacidad para datos sensibles (aunque
  también lo es — ver el patrón ya existente de pseudonimizar "Persona
  atendida"). Es una postura: coherente con la economía social, el ecosistema
  no depende de infraestructura ajena para pensar sobre sí mismo.
- **La válvula de fiat existe, pero es el último recurso y un sensor.** Cuando
  ni la formación ni el intercambio interno alcanzan (recurso que de verdad no
  existe en el ecosistema, urgencia que no da tiempo a formar a nadie), el
  sistema sale al mercado normal. Ese evento se evalúa y alimenta la
  planificación de futuras formaciones o proyectos del ecosistema — es dato,
  no derrota.
- **Aprendizaje colectivo en dos sentidos.** El sistema aprende patrones con
  el uso (sugerencias que mejoran), y las personas reflexionan juntas sobre
  decisiones pasadas y sus resultados (memoria organizativa). Ninguno sustituye
  al otro.

## Arquitectura en capas (visión, no diseño técnico cerrado)

1. **El Sheet — memoria operativa.** Qué existe, qué pasó. Lo que ya está
   construido: campañas, proyectos, personas, espacios, materiales,
   proveedores, decisiones, incidencias, y los módulos acoplables que
   permiten que cada organización encienda solo lo que necesita.
2. **El bot de Telegram — capa social, dos roles separados desde el
   principio** (tono y objetivos distintos):
   - **Filtro de formación de voluntarios**: cara externa, hacia quien
     todavía no es parte del ecosistema — evalúa, orienta, da acceso.
   - **Agente social/coordinador**: cara interna, hacia quien ya está
     dentro — informa de tareas del día, permite consultar qué se está
     haciendo, convoca a personas a acciones (a veces en abierto —
     broadcast y autoselección —, a veces en concreto — el motor de encaje
     ya existente hablando por Telegram en vez de mostrarse en un panel).
   Ambición final: un agente que alivie tareas humanas, diseñado junto con
   quien lo use, no impuesto de una vez.
3. **La bóveda de Obsidian — capa reflexiva.** Elemento gráfico potente para
   la visión interna de una organización y su lugar en el ecosistema. Datos
   abajo (generados desde el Sheet, notas enlazadas que reflejan la
   estructura relacional real), reflexión encima (las personas escriben
   sobre esos datos) — mismo espacio, no dos sistemas separados.
4. **La IA interna — quien decide qué proponer** en las tres capas
   anteriores: qué encaje sugerir, qué estrategia proponer ante un hueco de
   capacidad, qué patrón destacar en la bóveda.

## La capa gamificada

Hallazgo central de esta conversación: el sistema ya tiene, sin haberlo
buscado, la base para esto. La jerarquía CAMPANA→PROYECTO→PRODUCTO→PROCESO→
TAREA y la capacidad de importación masiva no se diseñaron pensando en
formación, pero son exactamente la estructura que necesita cualquier
tutorial, máster o formación: un curso es una campaña, un módulo es un
proyecto, una lección es una tarea. No hace falta inventar un modelo de datos
nuevo — hace falta aplicar el que ya existe a un dominio distinto.

**Mismas entidades, piel distinta**: la gamificación no es un sistema
paralelo sincronizado con el operativo — son las mismas entidades, con una
capa visual/lúdica que cambia según el "cliente" y el "proyecto". Completar
una tarea real es avanzar en el juego.

Por qué gamificar: promover la participación y evitar la fricción de "esto es
una hoja de cálculo" — el motivo es de adopción, no decorativo.

## El producto: no la herramienta, el resultado

Giro de modelo de negocio importante: no se vende el sistema, se vende lo que
el sistema produce.

Dos ofertas **realmente distintas, que comparten el mismo motor** (proyecto→
tarea→encaje) pero se diseñan y se venden por separado:

1. **Ecosistema para asociaciones/comunidades/grupos** — el paquete completo
   (Sheet + bot de Telegram + bóveda de Obsidian) ofrecido como una versión
   demo del ecosistema: cómo interactuar y gestionar relaciones e
   intercambios entre organizaciones.
2. **Temarios formativos y constructivos para escuelas** — currículos
   trazables, con seguimiento, construidos con la misma maquinaria de
   proyecto/tarea, gamificados para la participación del alumnado.

**La garantía de aprendizaje real, combinada según el tipo de formación**: la
oferta a escuelas necesita garantizar que el alumno de verdad ha comprendido
el temario — y específicamente, que no ha resuelto los ejercicios a través de
una IA sin comprenderlos. La formación puede ser de dos naturalezas muy
distintas, y la verificación se adapta a cada una:

- **Formación física** (ejemplo: fabricar una compostera) — la evidencia es
  el objeto/resultado real (foto, vídeo, verificación presencial de un
  mentor), mucho más difícil de falsificar con IA por su propia naturaleza.
- **Formación digital** (ejemplo: planificación o diseño) — aquí es donde el
  riesgo de "resuelto por IA sin comprensión" es real y hay que diseñar
  contra él explícitamente. Definido hasta ahora: la verificación pasa por el
  **proceso**, no solo por el resultado final; se valida **por ejercicio**,
  no por muestreo; y el bot de Telegram es candidato a ser el verificador
  mismo (preguntas de seguimiento conversacionales tipo "explícame por qué
  elegiste X" — si la persona no puede sostener su propia respuesta, el
  ejercicio no se da por superado).

**Riesgo computacional de verificar por ejercicio, y su respuesta**: validar
cada ejercicio (no por muestreo) tiene un coste de cómputo que crece con el
volumen. La respuesta propuesta no es centralizar ese coste en un servidor
propio de La Troballa, sino **descentralizarlo como parte del propio
ecosistema**: cada centro podría alojar su propio hardware, formando una red
de nodos descentralizados que generan recursos de cómputo para el
ecosistema. Esto no es un detalle técnico — es la "infraestructura propia"
como moneda (ver Principios de diseño) hecha literal: el hardware que cada
organización aporta *es* su contribución al procomún, del mismo modo que hoy
un espacio libre o material sobrante lo es.

**Proyectos colaborativos vía bot**: el mismo modelo de comunicación por
Telegram que sirve para convocar y verificar abre la puerta a proyectos
colaborativos coordinados a través del sistema — pendiente de concretar si
esto ocurre dentro de una organización o entre nodos de distintas
organizaciones (ver Preguntas abiertas).

## El primer producto comercial (estrategia concreta, no visión a largo plazo)

A diferencia del resto de este documento, esto no es una ambición futura —
es una estrategia de salida al mercado ejecutable con lo que ya existe hoy,
sin depender de automatización ni de más desarrollo:

**Voluntariado tecnológico como producto**: buscar "clientes" en plataformas
como Workaway o Worldpackers (hosts que ya buscan intercambiar alojamiento/
manutención por trabajo) y ofrecerles la personalización y el seguimiento del
sistema (su propia instancia de gestión de campañas/proyectos/recursos) a
cambio de sus servicios o productos — no de dinero.

**Por qué es una jugada fuerte, no solo una salida comercial**:
- Prueba el sistema con datos reales, de un tercero externo, sin la fricción
  de convencer a nadie de pagar por él.
- El operador (quien construye/personaliza) empieza a recibir compensación
  real — aunque no sea dinero.
- Es la primera validación práctica y en miniatura de todo el modelo
  económico de este documento: intercambio de capacidad por capacidad, sin
  moneda fiat, con visibilidad y propuesta en vez de venta forzada. No hay
  que esperar al "ecosistema entre organizaciones" para probar si el
  principio funciona — este es el ecosistema entre organizaciones, a escala
  de una sola relación.
- Conecta directamente con la modularidad de clientes ya construida
  (`AprovisionamientoService.js`, cada cliente = su propio Sheet
  independiente) — no hace falta nada nuevo en el modelo de datos para dar
  este primer paso.

**Quién es el operador**: la propia persona detrás de esta conversación — no
un rol futuro ni un tercero. La Troballa es el lugar de trabajo y el banco de
pruebas real; el voluntariado tecnológico en plataformas como Workaway/
Worldpackers es el primer movimiento comercial fuera de La Troballa.

**Qué recibe el host a cambio**: implementación y personalización de su
propia instancia — el mismo patrón que "Gestor de Proyectos" ya construido
(cada cliente = su propio Sheet, aprovisionado con `AprovisionamientoService.js`),
aplicado a un grupo/comunidad con sus propios documentos internos,
normativas, estatutos y proyectos. Cada espacio tiene sus particularidades
propias, igual que cada campaña de La Troballa las tiene hoy.

**Dos extensiones ya imaginadas, para construir más adelante**:
- **Formación en el espacio vía geolocalización/QR, gamificada**: cada
  recurso físico (un horno, una compostera, una herramienta) podría llevar
  un QR que, al escanearlo in situ, abra la formación específica de ese
  recurso concreto — se apoya directamente en la jerarquía de
  Espacios/Recursos ya construida (`InstaladorJerarquiaFisica.js`,
  `PanelRecursos`), sin entidades nuevas.
- **Experiencias de acercamiento**: antes de comprometerse, ofrecer un
  primer contacto ligero para que ambas partes (host y voluntario) valoren
  el encaje — reduce el tiempo que las comunidades hoy invierten a mano en
  cada voluntario antes de saber si encaja. Es la primera interacción del
  rol "filtro de formación de voluntarios" del bot, hecha experiencial en
  vez de un formulario.
- **QR/geolocalización sirve para las dos cosas a la vez**: contenido
  informativo y tarea formal del sistema. Cruzando esto con gamificación,
  se pueden construir **experiencias tipo scape room o gymkhana
  personalizada** por el espacio físico — QR en cada recurso desbloqueando
  la siguiente pista/tarea.

### Escalera comercial (valoración de asesor estratégico, 2026-08-17)

El scape room/gymkhana no es solo una forma divertida de dar la bienvenida —
es un **producto vendible en sí mismo**, independiente de si el host adopta
el sistema completo. Eso invierte el orden habitual de venta de software de
gestión (empezar pidiendo el compromiso grande):

1. **Vender la experiencia sola** — gymkhana/scape room gamificado para un
   espacio (festival, museo, hostel, escuela, comunidad). Entrega rápida,
   no exige adoptar nada más — puerta de entrada barata.
2. **Subir a la implementación completa** — una vez visto el sistema
   funcionando jugando, el salto a "gestionamos tu operación entera" (el
   voluntariado tecnológico de más arriba) es mucho más fácil de pedir.
3. **Participación en el ecosistema/red de nodos** — horizonte largo, solo
   con relación de confianza ya construida.

**Otros usos del mismo mecanismo**: team-building interno (reutilizable para
cohesionar equipo/personas atendidas ya existentes, vendible también sin
necesidad de gestión de voluntarios), activación pública en campañas y
festivales de La Troballa (actividad de cara al público + generación de
datos reales), y la propia formación para escuelas (aprender haciendo la
gymkhana, no leyendo un temario).

**Por qué importa más allá de lo comercial**: cada partida genera datos
reales de interacción (quién se detuvo en qué recurso, cuánto tiempo, qué
llamó la atención) — combustible real para el motor de encaje, no solo
marketing. El scape room es un sensor más del sistema, jugando.

## Para qué sirve lo comercial (relectura, 2026-08-17)

El objetivo de cualquier actividad comercial no es facturar — es **acumular
infraestructura propia** para depender cada vez menos de recursos ajenos. El
dinero, cuando aparece, es un puente, no la meta. Esto reordena cualquier
idea comercial futura por un criterio distinto al de ingresos:

- **Trueque directo** (genera infraestructura sin pasar por dinero): el
  voluntariado tecnológico (ver más arriba) ya es el ejemplo puro — no pide
  dinero, pide recursos/servicios/infraestructura directamente a cambio de
  la implementación. Cualquier oferta comercial futura debería preguntarse
  primero si puede plantearse así antes de asumir que hay que cobrar.
- **Fiat como puente explícito, no como fin**: cuando el cliente no tiene
  nada que aportar al ecosistema (un cliente puramente comercial, sin
  relación con la misión), cobrar en dinero normal tiene sentido — pero con
  la disciplina de etiquetar desde el principio para qué pieza concreta de
  infraestructura propia se destina ese ingreso, en vez de que se disuelva
  como "ingresos" genéricos. Mismo espíritu que la señal de fiat-como-sensor
  ya definida en Principios de diseño: aquí sería fiat-como-financiación-de-
  independencia.

**Práctica propuesta, pendiente de concretar en modelo de datos**: registrar
cada acuerdo comercial (trueque o fiat) con un campo que capture qué
infraestructura propia generó o financió. Con el tiempo, ese campo sería el
primer indicador real de si el sistema cumple su misión (acumular
independencia), no solo si sobrevive económicamente.

## Trayectoria

**La Troballa es el escenario de pruebas.** No se construye el sistema contra
una especificación cerrada — se construye sobre datos simulados,
explorando funcionalidades que, combinadas, terminan configurando el sistema
real (ver, por ejemplo, cómo la distinción Operativo/Piloto/Auditoría surgió
del uso, no de un diseño previo). Lo interorganizativo y las dos ofertas de
producto son la estrella polar, no lo próximo a construir — lo próximo a
construir sigue siendo que La Troballa se vea a sí misma con claridad
(Agenda Operativa, Bloqueos ampliados — ver `ROADMAP_BACKLOG_MEJORAS.md`
Fase O).

## Lo ya construido que sostiene esta visión

- **Encaje de Oportunidad** (Fase 4, roadmap Cliente/Ventas): primer motor de
  propuesta real, no solo registro — precedente directo del "sistema propone
  el match".
- **Distinción Operativo/Piloto/Auditoría** (Fase M): el sistema ya asume que
  crece por exploración antes que por especificación.
- **Módulos acoplables** (`package-map.json`, `moduloInstalado_`): cada
  organización enciende solo lo que necesita — modularidad técnica que ya es,
  sin haberlo llamado así, modularidad de quién participa en qué.
- **Pseudonimización de "Persona atendida"**: la privacidad como diseño desde
  el principio, no añadida después.
- **Agenda Operativa + Bloqueos** (en construcción, Fase O): primera pieza
  concreta de "que La Troballa se vea a sí misma con claridad" antes de
  pensar en el ecosistema entre organizaciones.

## Preguntas abiertas (para seguir tirando del hilo)

- Dónde vive técnicamente la señal de "esto se compró fuera porque no había
  capacidad interna" — qué entidad o flag la registra, y cómo se convierte en
  propuesta de formación o proyecto.
- Cómo se sincronizan Sheet, bot y bóveda cuando el ecosistema crece más allá
  de una organización — hoy cada cliente es un Sheet independiente
  (`AprovisionamientoService.js`); el intercambio entre organizaciones
  necesitará algún puente entre Sheets independientes, todavía sin diseñar.
- Red de nodos descentralizados de cómputo: **definido** — cada organización
  tiene su propio modelo, aprendiendo de su propia realidad (aprendizaje
  federado, no un cerebro único compartido). Queda abierto cómo se
  establece confianza entre nodos de organizaciones distintas (uno lento,
  defectuoso o malicioso podría invalidar verificaciones de otros).
- Proyectos colaborativos vía bot: sin resolver todavía si nacen dentro de
  una organización o entre nodos distintos — probablemente se responda solo
  al probar el primer producto comercial (voluntariado tecnológico, ver más
  abajo).
