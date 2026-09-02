# Propuesta: nomenclatura y arquitectura del universo Engremiat

**Versión**: 2.0 (formalizada desde el ejercicio interactivo del mapa vivo)
**Fecha**: 2026-09-02
**Estado**: propuesta de diseño — no se ha renombrado ni movido ningún fichero real todavía.
**Método**: empezar por la función ("¿qué hace esto de verdad?"), no por el nombre — y separar siempre la **regla** de **quién la representa**.
**Relacionado**: [[PROPUESTA_TELAR_INTERFAZ_OPERATIVA]] §21, `manifiestos/*.yaml`, vault `02_Personajes/`, `08_Oficios/`

---

## 0. El pilar

> "Un universo Engremiat es un entorno cooperativo vivo donde personas, inteligencias y recursos convierten necesidades reales en misiones compartidas y resultados verificables. Cada decisión permanece bajo control humano y deja una huella trazable que modifica lo que el universo sabe, puede hacer y propone después."

Esta frase (del operador, confirmada 2026-09-02) es la definición de referencia. Todo lo demás en este documento se deriva de ella, no al revés.

**Ampliación arquitectónica** (añade la distinción esencial: lo universal no son necesariamente los personajes):

> Un universo Engremiat es un sistema cooperativo persistente donde personas, inteligencias y recursos transforman necesidades reales en Misiones, decisiones, compromisos y resultados verificables. Todos los universos comparten unas mismas leyes de control humano, trazabilidad, límites y memoria; cada cliente las concreta mediante sus propios módulos, roles, fuentes, recursos y lenguaje narrativo.

---

## 1. Escala (corregida — Universo ≠ Campaña)

Una primera versión de este documento fijaba "Universo = Campaña, Misión = Proyecto" (metáfora útil, propuesta por el operador). Corrección real: un Universo persistente puede alojar varias Campañas/Proyectos a la vez, y una Misión de 30 minutos no es la misma escala que un Proyecto de 6 meses. Escala real, de mayor a menor:

| Nivel | Significado |
|---|---|
| **Universo** | Instancia persistente de un cliente o comunidad |
| Campaña | Ciclo estratégico u programa, opcional |
| Proyecto | Resultado real que exige coordinación sostenida |
| **Misión** | Arco jugable acotado: necesidad → decisión → Compromiso → Huella |
| Sesión | Una interacción concreta de uno o varios participantes |

Una Misión puede pertenecer a un Proyecto, cruzar varios, o limitarse a investigar una incertidumbre sin Proyecto detrás.

---

## 2. Constitución — leyes que ningún módulo puede violar

Estas leyes ya existían, dispersas, decididas pieza a pieza a lo largo de Telar (§3.4, §8, §19.1) — se reúnen aquí como un solo cuerpo, porque nunca se habían escrito juntas:

1. **Autoridad humana**: la IA propone, compara y prepara; decidir o ejecutar de verdad exige autoridad humana.
2. **Procedencia visible**: todo hecho, propuesta, decisión y Huella conserva fuente, autoría, fecha y versión.
3. **Separación operativa**: proponer, decidir, autorizar, ejecutar y verificar son acciones distintas, nunca un solo paso.
4. **Incertidumbre explícita**: ningún dato no verificado se presenta como firme ("Pendiente de comprobar", nunca silencio).
5. **Riesgo proporcional**: cuanto mayor el impacto o menor la reversibilidad, mayor la inspección y el gate humano.
6. **Voz de las personas afectadas**: una IA no simula consentimiento ni sustituye la participación humana necesaria.
7. **Memoria revisable**: se corrige o se declara obsoleta, nunca se borra el historial anterior.
8. **Modularidad subordinada**: ningún módulo amplía permisos ni contradice la Constitución.
9. **Recursos visibles**: coste, capacidad, tiempo y disponibilidad se muestran antes de comprometer trabajo.
10. **Fallo seguro**: `ERR` detiene el avance, `WARN` exige revisión, ningún error desaparece del historial.
11. **Derecho a pausar**: bloquear, aplazar, pedir ayuda o cerrar como aprendizaje son desenlaces legítimos, no fracasos.
12. **Consecuencia verificable**: una Misión se completa por dejar una decisión/cambio comprobable, nunca solo por producir texto.

---

## 3. Las cuatro capas — corrección de fondo

No todo lo Núcleo necesita cara de personaje. Antes de clasificar nada, se separa en cuatro capas:

| Capa | Qué contiene | Ejemplo real (control presupuestario) |
|---|---|---|
| **Constitución** | Principios que ningún módulo puede vulnerar | "Ningún recurso se consume fuera de los límites autorizados" |
| **Capacidad de Núcleo** | Función reutilizable, presente en cualquier universo | Control presupuestario determinista |
| **Configuración** | Valores concretos de cada cliente | Tope de `GASTO_API`: $5 cada 30 días |
| **Representación** | Cómo se muestra — un personaje es solo una opción | El personaje "Guardián de Recursos" explica el resultado |

**Consecuencia directa**: el Núcleo se define por qué *capacidades* tiene, no por qué *personajes* existen. Esto reordena todo lo que sigue.

---

## 4. Investigación aplicada

**Gremios medievales reales** (Maestro/Oficial/Aprendiz, Cofradía, Veedores, Contador, Escribano, Capítulo) — base del vocabulario de personajes (§6).

**Six Thinking Hats** (de Bono, 1985) — **cita corregida**: no son seis personalidades fijas, son modos de pensamiento temporales que un mismo grupo aplica sucesivamente. Sirven para comprobar que una deliberación cubre hechos/riesgo/beneficio/creatividad/proceso/personas — no para justificar que deban existir seis personajes permanentes. Los Vocales de contenido núcleo (§6.1) se sostienen por mérito propio, domain-agnostic real, no por esta cita.

**Sociocracia real**: cualquier rol nuevo en un círculo (de proceso u operativo) se crea siempre por **propuesta + consentimiento**, nunca por decisión unilateral. La práctica real exige definir primero dominio, propósito y autoridad — la selección de rol viene después. Un Concilio de IA puede formular propuesta, detectar objeciones y comprobar procedimiento — pero nunca puede declarar "existe consentimiento sociocrático" si no han participado las personas humanas con autoridad real sobre ese dominio.

**Teoría de sistemas**: un sistema no se define solo por sus elementos, sino por sus interconexiones y su propósito — dos universos con los mismos Espacios pueden comportarse de forma completamente distinta según quién decide y qué consecuencias quedan registradas. Justifica por qué este documento antepone la Constitución (§2) a la lista de piezas.

**Worldbuilding colaborativo estructurado**: Microscope (Preguntas→Respuestas, marco fundacional antes de detalle), Dawn of Worlds (territorio → habitantes → conflicto, por capas), The Quiet Year (comunidad, proyectos, escasez — más cercano a un universo operativo vivo que una enciclopedia narrativa), Kingdom (Power/Perspective/Touchstone: quien decide, quien anticipa consecuencias y quien representa a los afectados no deben confundirse — ya aplicado en §6.2/§6.3).

Sources:
- [Los Gremios Medievales: Estructura, Oficios y el Poder de la Artesanía Organizada](https://tutoriales.com/historia/historia-medieval/los-gremios-medievales-estructura-oficios-y-el-poder-de-la-artesania-organizada)
- [Six Thinking Hats — The Decision Lab](https://thedecisionlab.com/reference-guide/organizational-behavior/six-thinking-hats)
- [Sociocracy 3.0: Guide to Consent-Based Governance](https://peerdom.com/blog/sociocracy-guide-principles-practices)
- [Microscope como herramienta de worldbuilding](https://mythicscribes.com/community/threads/microscope-as-a-worldbuilding-tool.20393/)

Etimología de "Engremiat": no documentada en el vault — lectura razonable como *engranaje* + *gremi* (gremio, catalán), coherente con el vocabulario mecánico ya usado, pero es inferencia, no cita.

---

## 5. Espacios

| Espacio | Función | Capa |
|---|---|---|
| **Núcleo** | Base obligatoria de cualquier cliente Engremiat | Núcleo |
| **Consola** | Gobernar permisos, módulos, recursos, riesgos y salud del universo | Núcleo |
| **Telar** | Deliberar, componer decisiones, preparar Compromisos, dejar la Huella | Núcleo |
| **Archivo Vivo** *(nuevo)* | Consultar evidencia, decisiones, versiones, Huellas y memoria — hueco real: hoy Huella es un evento, nunca un espacio consultable | Núcleo |
| **Plaza** | Entrar, orientarse, participar — el contenedor, no el contenido que muestra | Núcleo |
| Asamblea | Concilio es la instancia real, un protocolo/sesión — no necesita espacio físico propio, vive dentro de Telar | Núcleo (protocolo) |
| Taller | Autoría de contenido de misión/escenario narrativo | Específico — módulo |
| Feria | Donde el cliente juega el contenido ya autorado en Taller | Específico — módulo |

**Taller ≠ Telar**: Taller autoría contenido de juego para el cliente; Telar teje decisiones del Visitante sobre el propio universo. Funcionalmente distintos, ambos conservan su nombre.

---

## 6. Personajes

### 6.1 Vocales de contenido — núcleo domain-agnostic

Deliberan sobre el contenido de una Misión concreta. Solo se quedan aquí los que aplican a cualquier dominio, no solo al caso actual de Engremiat (software/gestión de proyectos):

| Vocal | Función |
|---|---|
| Vocal Lógico | Cadena causa-efecto, sin saltarse pasos |
| Vocal Logístico | Quién, cuándo, con qué recursos — flujo ejecutable |
| Vocal Filosófico | A quién sirve, dignidad — principio ético universal |
| **Vocal de Afectados y Uso** *(antes "Vocal Usuario")* | Identifica impactos y voces ausentes. Regla explícita (Constitución, ley 6): nunca atribuye consentimiento, necesidades o emociones a personas no consultadas. |

### 6.2 Vocales de contenido — específicos del caso actual de Engremiat

| Vocal | Por qué es específico |
|---|---|
| Vocal Técnico | "Implementable, mantenible, coste de construir" — lenguaje de construcción de software |
| Vocal Narrativo | Coherencia de la historia — solo aplica si el universo tiene capa narrativa/lúdica (Taller/Feria) |

### 6.3 Guardianes — nueva familia, distinta de Vocal

Comprueban reglas, riesgos y presupuestos; **no deliberan, verifican**. Categoría separada porque su función (determinista o de control) es categóricamente distinta a la de un Vocal (voz consultiva):

| Guardián | Función | Regla de seguridad |
|---|---|---|
| **Guardián de Recursos** *(antes "Vocal Contable")* | Comprueba el gasto real de 30 días contra el tope, de forma determinista, antes de convocar Asamblea. Lógica ya real: `tope_de_gasto_construido`. | El tope se comprueba por lógica determinista — la IA explica el resultado, nunca lo calcula ni se autodeclara dentro de límite. |
| **Guardián de Cumplimiento** *(antes "Vocal Veedor")* | Comprueba controles verificables (RGPD, límites de módulo, manifiesto). | Nunca se autocertifica narrativamente — en materias sensibles exige revisión humana independiente. Un sistema no se certifica a sí mismo. |

### 6.4 Gobierno — protocolo, no personaje

| Elemento | Naturaleza |
|---|---|
| **Consentimiento sociocrático** *(antes "Vocal Sociocracia")* | Ley constitucional de gobierno del propio Concilio, no una voz que delibera sobre contenido. Un Concilio de IA puede detectar objeciones y comprobar procedimiento — nunca declarar "existe consentimiento" sin participación humana real con autoridad sobre el dominio. Representación como "Facilitador" es opcional, nunca obligatoria. |

### 6.5 Oficios — núcleo (ejecutan una función)

| Oficio | Función | Nota |
|---|---|---|
| Ejecutor | Prepara y realiza la acción ya autorizada | **No es la Puerta Humana** — la Puerta es la ley/interfaz (ya real en Telar B3); Ejecutor opera subordinado a ella |
| Vigilia | Convierte necesidades reales en misiones — cola de entrada | — |
| Relevo | Deja la Huella trazable tras el cierre | — |
| Coordinador | Reparte trabajo | No verifica su propio trabajo cuando el riesgo es significativo — la aceptación final es del responsable o verificador definido |
| Cronista | Documentación desde datos reales | Propone memoria; no crea canon automáticamente (mismo principio ya establecido: proponer nunca es confirmar) |
| Oficial Prompter | Formula la pregunta antes de la Asamblea | No debe alterar silenciosamente el origen de la necesidad |

### 6.6 Oficios — específicos (módulo)

| Oficio | Por qué es específico |
|---|---|
| Pregonero | Real, ya documentado: "solo si el cliente hace difusión externa" |
| Mensajero | La *capacidad* de intercambio autorizado entre sistemas podría ser núcleo; el *adaptador* concreto Sheets↔Baserow es siempre específico — se mantiene específico mientras no exista un segundo adaptador real que separe ambas cosas |

### 6.7 Acompañante

| Personaje | Función | Autoridad |
|---|---|---|
| Narrador | Explica, orienta, mantiene continuidad — nunca delibera ni ejecuta | Sin autoridad |

### 6.8 Personajes por módulo — principio confirmado

Cada módulo activado trae los suyos (ej. Ágora → nodo de intercambio, Escenario → personajes propios del guion). Se añaden vía una sección `personajes:` en el manifiesto — mismo formato ya real (`tablas_baserow`, `acciones_n8n`, `pantallas_plaza`), sin inventar uno nuevo. Más módulos activos = universo más complejo, por diseño.

### 6.9 El almacén común

`acervo.yaml` — guarda personajes-arquetipo, giros narrativos, contexto de zona, patrones validados, reutilizables entre historias. Se queda con el nombre **Acervo** en exclusiva, liberado ya de la colisión con los Vocales.

---

## 7. Mecanismo para añadir un Vocal/Oficio de dominio nuevo

No se improvisa. La sociocracia real ya resuelve esto: los círculos anidan sub-círculos por especialización, y cualquier rol nuevo se crea por **propuesta + consentimiento**. Aplicado a Engremiat: un módulo que necesite un Vocal de dominio (ej. "Vocal Agronómico" para un universo agrícola) lo propone con un contrato estructurado, y pasa por el mismo gate sociocrático ("nadie tiene objeción razonada") ya real en Concilio.

**Deliberadamente no fijado todavía** (mismo criterio que en Telar §19.1 — no construir por adelantado sin un caso real): el contrato completo de un rol nuevo debería incluir más que un JSON suelto — propósito, dominio, problema que lo justifica, tipo, entradas/salidas permitidas, permisos, coste esperado, riesgos, responsable humano, criterio de éxito, y procedimiento de retirada. Se deja como diseño objetivo, a formalizar contra un segundo dominio real, no contra una hipótesis.

---

## 8. Variabilidad — clasificación de 5 estados

Sustituye la clasificación de 3 estados (Núcleo/Específico/Pendiente) usada en la primera versión de este documento:

| Clasificación | Significado |
|---|---|
| Invariante | Ningún universo puede modificarlo (ej. control humano, trazabilidad) |
| Capacidad de Núcleo | Disponible siempre, aunque no tenga personaje o pantalla propia |
| Configurable | Obligatorio, pero cada cliente define sus valores (ej. tope de $5) |
| Modular | Solo existe si se activa el módulo (ej. Taller, Vocal Agronómico) |
| Experimental | En prueba, no forma parte de la base (ej. multijugador) |

---

## 9. Criterio de aceptación

> Si un universo agrícola, uno educativo y uno de desarrollo de software pueden compartir las mismas leyes y ciclos sin compartir obligatoriamente los mismos personajes, el Núcleo está bien definido.

Este es el test decisivo antes de dar por cerrada esta arquitectura.

---

## 10. Lo que no se toca, y por qué

Se evaluó renombrar `Ejecutor` → `Maestro` (paralelo gremial fuerte) y `Coordinador` → `Capataz`. No se recomienda: `Ejecutor` está embebido en infraestructura real (`PROMPT_EJECUTOR.md`, trigger real `trig_01PcwtGdVbbWVHU5zbrJrh4U`, memorias, Ejecutor Local) — el coste de renombrar supera el beneficio de precisión temática. Mismo criterio que rige todo este documento: no cambiar por pureza teórica sin necesidad real.

---

## 11. Deliberadamente aparcado (diseño objetivo, no listo para construir)

- **Esquema completo de `Compromiso`**: se mantiene como nombre en la ontología de una futura versión, no como esquema con perfiles Digital/Físico/Comunitario — sigue sin un caso real que lo justifique (ver Telar §19.1).
- **Contrato de 18 campos para un rol nuevo** (§7): se adopta el espíritu, no el formato fijo, hasta tener un segundo dominio real.
- **Rito de Fundación completo** (carta fundacional, paleta, tiempo/escala, territorio, tensiones, gobierno, habitantes, módulos, misiones de génesis, ratificación BORRADOR→SANDBOX→PILOTO→ACTIVO): diseño objetivo real y bien fundamentado para el futuro constructor de universos — hoy ya se ha recorrido informalmente parte de él (carta fundacional = el pilar §0; habitantes = §6) dentro de esta misma conversación, pero no se ha ejecutado ni probado como ritual completo y repetible.

---

## 12. Coste real de aplicar esto (para decidir, no para ejecutar todavía)

- **Vault**: fichas de Personajes a renombrar/recategorizar (Vocales de contenido, Guardianes, Prompter); `08_Oficios/` → `08_Herramientas/`; `00_Mapa.md` y `graph.json` a actualizar.
- **Código**: `ROSTER` en `spike_concilio_coop/servidor.mjs` y `telar/b2/deliberar_b2.mjs` — cambiar claves y copy visible ya construido y verificado en producción.
- **Datos ya reales**: filas ya escritas en `GASTO_API` con nombres antiguos (`CONTEXTO: 'Acervo Tecnico'`, etc.) — no se reescriben, quedan como histórico; el código nuevo escribiría con el nombre nuevo a partir de ese momento.

No es gratis — por eso sigue siendo una propuesta a confirmar fase por fase, no un cambio ya aplicado.

---

## 13. Orden propuesto

1. Confirmar esta versión formal (ya recorrida interactivamente contigo, artefacto "Mapa del Universo Engremiat").
2. Aplicar primero donde es más barato: el vault (texto, sin código en producción que dependa de ello).
3. Después, el código ya en producción (Spike + Telar B2), con la misma verificación real que en cada fase anterior.
4. `08_Oficios/` → `08_Herramientas/` al final, puramente organizativo.
5. Formalizar el Rito de Fundación completo (§11) solo cuando exista un segundo universo real contra el que probarlo.
