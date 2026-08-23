# Propuesta — Contenido multimedia interactivo para experiencias (tutoriales, escape rooms)

**Fecha de apertura:** 2026-08-23
**Estado:** A valorar -- sin urgencia, roadmap futuro (ver "Cuándo" más abajo)
**Incidencia Sheet:** INC-0055 (`13_INCIDENCIAS`, A valorar)
**Por qué existe este fichero:** las incidencias "a valorar" en la Consola solo tienen sitio para un resumen corto -- cuando la idea necesita investigación real (comparar herramientas, decidir arquitectura, ir añadiendo hallazgos en varias sesiones), ese resumen se queda corto y todo lo demás vive solo en la conversación, que se pierde. Este fichero es el sitio para acumular eso, siguiendo el mismo patrón que ya usan `PROPUESTA_MODULARIZACION_LIBRERIA.md` y el resto de `PROPUESTA_*.md` del repo -- vivo, no un documento cerrado el día que se escribe.

## Disparador

Enlace compartido por el operador (2026-08-23): [Audio Estudio](https://www.audioestudio.com/) — "Una voz para cada personaje de tu guion". Caso de uso propuesto: cuando el trabajo entre en desarrollo de tutoriales, escape rooms y experiencias similares, herramientas de este tipo podrían facilitar parte de la producción.

## Qué es Audio Estudio (analizado 2026-08-23)

App web/escritorio de producción de audio narrativo -- convierte un guion con personajes en un audio multipista con una voz TTS distinta por personaje.

- **Motores de voz**: ElevenLabs (clave propia), Google Gemini, Kokoro (modelo local, corre en el navegador).
- **Salida**: WAV 44.1kHz, multipista (narración/diálogo/música/efectos), timeline de montaje.
- **Privacidad**: local-first explícito -- "el audio nunca toca nuestros servidores"; sync opcional a Drive/Dropbox/OneDrive.
- **Acceso**: app web + escritorio. **Sin API pública documentada.**
- **Precio**: gratis en beta (Pro activado sin tarjeta); tras 2027, Free limitado (2 proyectos, ~1500 palabras) / Pro 7,99€/mes o 69,99€/año, con 50% descuento fundador para cuentas creadas antes de 2027.

## Valoración: ¿integrar o construir algo propio?

**No es integrable de verdad.** Sin API pública, no hay forma de que Engremiat dispare la generación de audio automáticamente desde una tarea/ficha -- sería siempre un humano abriendo la app aparte, pegando el guion, exportando el WAV y subiéndolo a mano. Eso no es integración, es una herramienta externa más en la caja de herramientas del operador.

**Tampoco tiene sentido replicarla entera.** Construir un editor de audio multipista completo sería mucho esfuerzo para resolver un problema que Engremiat no tiene (Engremiat no necesita montar podcasts) -- el problema real que sí podría tener es más estrecho: "que un personaje/escena de una experiencia tenga una locución generada". Eso no necesita un editor de audio, necesita una llamada a una API de TTS (Gemini TTS o ElevenLabs directamente) disparada desde una ficha o tarea, con el resultado guardado como Documento adjunto -- mismo patrón que ya existe hoy para otros ficheros generados. Bastante más pequeño que Audio Estudio, y sí integrable de verdad porque las APIs de los motores (no las de Audio Estudio) sí son programáticas.

**Recomendación**: usar Audio Estudio como herramienta manual externa mientras no haga falta más (gratis en beta, cero coste de integración), y si en algún momento se necesita generación de voz *disparada desde el sistema* (no manual), construir esa pieza estrecha directamente sobre la API del motor TTS, no sobre Audio Estudio.

## Ampliando la idea: más allá del audio

El operador pidió valorar el concepto completo, no solo audio: imágenes, vídeo, códigos QR en espacios físicos, geolocalización. Esto describe algo más grande que "generar audio" -- un módulo de **experiencia interactiva por nodos**, donde cada nodo (escena/parada/personaje) tiene:

- Contenido multimedia asociado (audio narrado, imagen, vídeo).
- Una condición de desbloqueo: escanear un QR físico en el espacio, estar en una geolocalización concreta, o completar el nodo anterior en secuencia.

Esto encaja con el patrón ya establecido del proyecto: Engremiat como core, con clientes/verticales construidos encima (La Troballa, Gestor de Proyectos...) -- "Experiencias interactivas" (tutoriales, escape rooms, rutas guiadas) sería candidato a vertical nueva, no una feature suelta dentro de Gestor de Proyectos. Vale la pena tenerlo en mente al valorar el alcance, no tratarlo como "un campo más" en una ficha existente.

**Piezas técnicas que ya existen o son baratas hoy**:
- QR: generación es trivial (librerías JS/Apps Script), lo caro sería la app lectora en el espacio físico, no el código QR en sí.
- Geolocalización: requiere una app cliente (móvil, PWA) con acceso a GPS -- no es algo que un Sheet/Apps Script pueda hacer por sí solo, necesita una capa de frontend distinta a la actual.
- Audio/vídeo: almacenamiento y reproducción ya son gestionables con Drive + Documentos, como el resto del sistema.

## Cuándo

No es trabajo de ahora. El propio operador lo enmarca como "cuando empecemos con tutoriales, escape room y demás" -- este documento existe para no perder el análisis mientras tanto, no para priorizar el desarrollo hoy.

## Pendiente de concretar / preguntas abiertas

- ¿"Experiencias interactivas" es un cliente/vertical nuevo sobre el core, o una extensión de un cliente ya existente?
- ¿Quién es el usuario final de la experiencia -- necesita cuenta, o es completamente anónimo/público (visitante de un escape room)? Esto condiciona mucho la arquitectura (¿app cliente propia? ¿solo web responsive?).
- ¿La geolocalización es un requisito real desde el principio, o un "sería bonito" que puede esperar a una v2 con QR-only?
- Coste real de una API de TTS (Gemini/ElevenLabs) por palabra/minuto -- no medido todavía, necesario antes de decidir "generación disparada desde el sistema" como pieza real.

## Bitácora

- **2026-08-23**: apertura del documento, análisis inicial de Audio Estudio, ampliación del concepto a multimedia+QR+geo, archivado como INC-0055.
