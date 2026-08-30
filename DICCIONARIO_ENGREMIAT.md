# Diccionario de términos Engremiat

Referencia rápida de vocabulario propio, para no perdernos a medida que el
sistema crece. Cada entrada dice qué es, y si está construido o solo
diseñado a fecha de 2026-08-30. Se actualiza según se añaden piezas nuevas.

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
  cuento, un proyecto de software o una cooperativa. **Solo diseñado**.

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
- **`PAQUETE_CLIENTE`** -- qué módulos tiene activos un cliente.
- **Jerarquía** -- el patrón general de árbol que sustenta todo lo
  anterior.

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

- El mecanismo de "promocionar" una versión de Escenario sin editar
  Baserow a mano.
- El nombre definitivo para el catálogo de Escenarios cuando deje de vivir
  hardcodeado en el código de Feria.
