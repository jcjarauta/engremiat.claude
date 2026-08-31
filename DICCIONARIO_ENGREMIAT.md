# Diccionario de términos Engremiat

Referencia rápida de vocabulario propio, para no perdernos a medida que el
sistema crece. Cada entrada dice qué es, y si está construido o solo
diseñado a fecha de 2026-08-31. Se actualiza según se añaden piezas nuevas.

## Núcleo y motor

- **Engremiat** -- el proyecto raíz/librería (antes "master"). La Troballa,
  Gestor de Proyectos, etc. son clientes construidos sobre él.
- **Baserow** -- base de datos real donde vive todo (construido).
- **n8n** -- motor de workflows que conecta todo (construido).
- **Generador (`engremiat-generador-n8n`)** -- n8n aislado (127.0.0.1:5680,
  sin acceso ni desde la LAN) donde vive la lógica protegida del operador
  -- Cronista, Taller, Concilio. Nunca se distribuye a un cliente
  (construido).
- **Puerta humana** -- principio no negociable: ninguna IA escribe datos
  reales sin que una persona lo revise antes. Aplica a todo lo demás.

## Ciclos (los "oficiales" del taller de gremio)

- **Cronista** -- convierte ideas/documentos en tareas y documentación
  (construido, con dos vías: segmentación de documentos y generación de
  informes/imágenes).
- **Ejecutor** / **Ejecutor Local** -- da seguimiento a tareas y mantiene el
  sistema, con confirmación humana obligatoria antes de escribir
  (prototipo construido y probado).
- **Ágora** -- intercambio de recursos/habilidades entre nodos (construido,
  sin motor de saldo real).
- **Pregonero** -- publica el resultado terminado hacia fuera (redes,
  PDF); en su versión ampliada, produce vídeo interactivo (H5P), imagen y
  narración (Piper) -- **solo diseñado**.
- **Oportunidad** -- detecta organizaciones/convocatorias reales; su motor
  de detección, apuntado a "qué le importa a esta comunidad" en vez de
  "quién nos financia", genera el contexto real para una semilla de
  historia -- **solo diseñado**.
- **Acervo** -- el almacén común: lo reutilizable de cada interacción
  (personajes, giros narrativos, contexto real) queda disponible para la
  siguiente historia -- **solo diseñado**. Los "Acervos con carácter" son
  variantes con un enfoque temático propio (rural, urbano, accesibilidad...).
- **Concilio** -- el multiciclo que reúne varios Acervos con carácter
  distinto para deliberar internamente (rondas acotadas + síntesis final)
  antes de que una idea llegue a Cronista -- funciona igual para un
  cuento, un proyecto de software o una cooperativa. **Construido y
  probado** (acción `concilio_proponer`, con presupuesto controlado vía
  `GASTO_API`).
- **Vigilia** -- cola nocturna de Concilio, encadenada sin esperar entre
  elementos (una vez termina un ciclo, empieza el siguiente de
  inmediato); cierra con un correo de resumen (coste, tiempo, resultado
  de cada elemento). **Construida y probada** en dos jornadas reales
  (11 y 9 elementos).
- **Ramas** -- modelo de exploración paralela dentro de Vigilia, tomado
  de git pero corregido: una narrativa no se fusiona automáticamente, se
  **elige** cuál se vuelve canónica y las demás quedan archivadas como
  material del Acervo. Campos `RAMA`/`RAMA_ELEGIDA` **construidos y
  sembrados** en su primer piloto real; la acción `fusionar_rama`
  (elegir y publicar la ganadora) **solo diseñada**.
- **Cuadrilla** -- capa de workers humanos participando en Concilio junto
  a los workers IA, vía un grupo de Telegram. v1: reparto de "mini-jobs"
  atómicos (crowdsourcing clásico). v2: conversación cooperativa
  humano-Concilio para resolver un problema real (como esta misma
  conversación), con divulgación obligatoria de interacción con IA desde
  el primer mensaje (Reglamento de IA de la UE, Art. 50, en vigor desde
  2026-08-02) como parte central del diseño, no un añadido. **Solo
  diseñada**, ninguna tabla ni workflow construido todavía.
- **Concilio conversacional** -- ver Cuadrilla v2; requiere memoria de
  hilo con estado persistente (`CONCILIO_CONVERSACION`, aún no
  construida) y presupuesto por hilo, no solo por llamada.
- **Telar** -- el constructor de historias: cuatro ciclos de Vigilia
  (Urdimbre → Trama → Hilo conductor → Parte de Vigilia/Relevo),
  validados contra el pipeline real de la industria narrativa (story
  bible → beat sheet → draft → pase editorial). **Documentado**
  (`TELAR.md`), primera Urdimbre real preparada, nada más construido.
- **Urdimbre** -- Ciclo 1 del Telar: arquitectura fija de una historia
  (personajes, escenario, tono, final, complicaciones), respondida vía
  una plantilla de preguntas sistemáticas reutilizable. No se ramifica.
- **Trama** -- Ciclo 2: varias exploraciones posibles sobre la misma
  Urdimbre (modelo "elige, no fusiones", igual que Ramas).
- **Rueda del Gremio** -- el ciclo completo de desarrollo de un proyecto
  real: Oportunidad → Cuadrilla+Concilio/Vigilia(Telar) → Relevo →
  Cronista → Ejecutor → Pregonero → Ágora, y Ágora retroalimenta a
  Oportunidad -- no es una cadena con final, es circular. **Documentada**
  (`RUEDA_DEL_GREMIO.md`), nunca recorrida entera en un proyecto real
  todavía.
- **Diario de Navegación** -- el historial de git usado como grafo de
  decisiones (Decision Graph): cada Parte de Vigilia es un commit, cada
  Rama de exploración puede ser una rama git real. No sustituye a
  Baserow (fuente de verdad del contenido de producción), es la capa
  paralela de memoria navegable. **Construido**, con las tres ramas del
  piloto de Reparto de Tareas como primer ejemplo real
  (`DIARIO_DE_NAVEGACION.md`).

## Cara al cliente

- **Plaza** -- portal web del cliente ya asentado (construido y probado).
- **Feria** -- puerta de entrada ligera por Telegram, sin instalar nada
  (construido y probado, con "Cuento Cooperativo" jugable de verdad).
- **Taller** -- espacio de autoría y prueba de Escenarios, separado de
  Feria -- comando oculto `/taller` en el mismo bot (construido y probado).
- **Escenario** -- plantilla de proyecto cooperativo con roles, misiones y
  gobernanza; "Cuento Cooperativo" es el único con cliente real hoy.
- **Semilla Cooperativa** -- Escenario orientado a formar cooperativas
  reales (vivienda, asociaciones), con gobernanza sociocrática -- **solo
  diseñado**.
- **Escalera de confianza** -- el modelo comercial: demo gratis → juego
  cooperativo → proyecto real pequeño → economía real, ganando confianza
  antes de arriesgar nada.

## Datos y esquema

- **`ENTIDAD_ORGANIZATIVA`** -- árbol autorreferenciado que representa a
  cualquier nivel (persona, familia, grupo, asociación, federación,
  confederación) con la misma tabla.
- **`UBICACION_GEOGRAFICA`** / **`COMPETENCIA`** -- mismo patrón de árbol,
  aplicado a geografía y a habilidades/oficios (respaldado por ESCO).
- **`PLANTILLA_MISION`** -- catálogo real de misiones de un Escenario, con
  `ESTADO` (`en_construccion`/`publicado`/`archivado`) y `VERSION` --
  permite tener producción y mejora en paralelo sin romper partidas en
  curso.
- **`promocionar_version`** -- acción del generador que archiva de un
  golpe todo lo `publicado` de un Escenario y publica lo `en_construccion`
  de la versión elegida -- **construida y probada** con una promoción
  real v1→v2 en vivo.
- **`GASTO_API`** -- libro de gasto real por llamada (tokens, coste
  estimado, servicio) con un tope mensual configurado ($5) comprobado
  antes de cada llamada a DeepSeek -- **construido y probado**.
- **`generar_canvas_dafo`** -- acción que produce un análisis de negocio
  completo (Canvas de 9 bloques, DAFO, plan de negocio, presupuesto,
  alianzas estratégicas, veredicto explícito de encaje como módulo
  Engremiat) y lo exporta a PDF real y duradero -- **construida y
  probada**, incluido el guardado del PDF fuera del contenedor.
- **`PAQUETE_CLIENTE`** -- qué módulos tiene activos un cliente.
- **Jerarquía** -- el patrón general de árbol que sustenta todo lo
  anterior.
- **`notificar-humano`** -- webhook compartido (correo vía SMTP) para
  avisar al operador cuando algo necesita su atención o ha terminado --
  reutilizado, no duplicado, entre Taller y Vigilia. **Construido**.
- **Mapa de dominios de datos** -- documento (`MAPA_DOMINIOS_DATOS.md`)
  que fija qué vive en Sheets/Apps Script (clientes existentes) y qué
  vive en Baserow/Pi (núcleo Engremiat nuevo, sin dependencia de
  Google), y la regla de que ningún dato se duplica "por si acaso" entre
  los dos. **Construido** como documento de gobernanza.

## Gobernanza y coste

- **Sociocracia** -- decisión por consentimiento ("nadie tiene objeción
  razonada"), no por mayoría -- el método real para grupos en formación,
  previsto para Semilla Cooperativa y para el propio Concilio.
- **Cascada de coste / tres niveles** -- local (gratis) → DeepSeek
  (automatizado, coste real medido en céntimos) → Claude (manual, por
  cliente, sin automatizar).
- **OpenClaw** -- plataforma de agentes autoalojada evaluada y **no
  adoptada entera** (CVEs reales, marketplace con skills maliciosas,
  facturas reales de más de $3.600/mes por bucles sin control) -- de ahí
  se tomó prestado el vocabulario de extensiones y la lección de poner
  topes de gasto explícitos, no confiar en que "ya está cubierto".

## Pendiente de nombrar

- El nombre definitivo para el catálogo de Escenarios cuando deje de vivir
  hardcodeado en el código de Feria.
