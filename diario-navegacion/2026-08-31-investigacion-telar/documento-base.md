# Documento base: investigación sobre el rediseño de Telar

Resultado de la primera Vigilia usada como motor de investigación (no
de decisión) -- 12 elementos, 6 preguntas concretas, equipo de Concilio
ampliado (Técnico, Lógico, Filosófico, Usuario, Narrativo). Coste real:
ver `GASTO_API`, muy por debajo de los €2 asignados. **Nada de esto se
ha aplicado al bot -- es la base para que el promotor y Claude decidan
juntos (Relevo).**

## Hallazgo real antes de las respuestas: contaminación cruzada por colisión de ORDEN

Las preguntas de profundización (`P1.2`, `P2.2`, `P3.2`) usan el
mecanismo de "buscar capítulo anterior" de Vigilia, que filtra por
`ORDEN - 1` **sin distinguir por `RAMA`**. Esta investigación reutilizó
los mismos valores de `ORDEN` (60, 70, 80...) que el lote de "Reparto de
tareas vecinales" de horas antes -- así que varias preguntas de
profundización recuperaron como "capítulo anterior" el contenido de
**esa otra investigación**, no el de la pregunta que realmente
precedía. Se nota claramente en `P1.2`, `P2.2` y `P3.2`, que hablan de
tablones físicos, vecinos y SMS en vez de Telar. **Lección para
próximas Vigilias: usar rangos de `ORDEN` globalmente únicos, o arreglar
el mecanismo para que filtre también por `RAMA`.**

## 1. Migrar capítulos de Telar a `TAREA`

**Fiable (P1.1)**: normalizar `HISTORIAL` por capítulo, insertar cada
uno como fila en `TAREA` (relación con la tarea original, número de
capítulo, contenido), validar con DeepSeek fragmentos incompletos,
webhook para que capítulos futuros se inserten ya estructurados. Coste
técnico bajo -- Baserow y n8n ya están integrados.

**P1.2 descartada** -- contaminada (habla de un tablón físico y
capacitación presencial, no de Telar).

## 2. Cierre dinámico del bucle por objetivo conseguido

**Fiable (P2.1)**: señal explícita `GOAL_ACHIEVED` + resumen del logro,
mínimo 3 pasos / máximo 12 (coincide con lo ya propuesto antes de esta
investigación), fallback si el modelo da respuestas ambiguas. n8n evalúa
la condición de cierre en cada iteración.

**P2.2 descartada** -- misma contaminación (habla de vecinos y SQLite).

## 3. Árbol de navegación de capítulos en Telegram

**Fiable y detallada (P3.1)**: cada capítulo confirmado como mensaje
anclado con `ID` único en un canal privado (el "tronco"), botones
`⬅️ Anterior / Siguiente ➡️ / 🌿 Ramificar / 📜 Historial`, ramificar
copia el nodo actual con `editMessageText` y lo enlaza al padre vía
`callback_data`, estructura de árbol en memoria/JSON. Coincide y
concreta lo ya intuido en la conversación (checkout+branch aplicado a
Telegram).

**P3.2 descartada** -- misma contaminación (habla de "Ver tareas /
Calendario / Delegar", ajeno a Telar).

## 4. Registro de lenguaje adaptativo

**Fiable (P4.1)**: análisis NLP de las respuestas (longitud de frase,
diversidad léxica, nivel de abstracción) para asignar un perfil de
interacción, con transparencia (el usuario puede revisar/corregir la
evaluación), ajuste continuo turno a turno, procesamiento local o
anonimizado. Coherente con "Nothing About Us Without Us".

**P4.2 (no contaminada, pero poco accionable)**: propone un "Archivo de
Presencias Continuas" -- acumular micro-observaciones en el tiempo en
vez de juzgar por una respuesta -- idea válida pero expresada de forma
muy poética/abstracta, sin pasos concretos de implementación.

## 5. Memoria entre sesiones

**Fiable (P5.1)**: tabla `Coordinadores` en Baserow (correo único,
nombre, relación a historias), reconocimiento por correo al iniciar
sesión, panel "Continuar donde quedaste" con las últimas 3 historias.
Sin infraestructura nueva compleja, como se pedía.

**P5.2 (no contaminada, pero poco accionable)**: plantea límites de
privacidad reales y válidos (el usuario decide qué se recuerda, "clave
de silencio" para borrar) pero, otra vez, en registro muy metafórico
-- vale como principio, no como especificación.

## 6. Consola de Relevo

**Fiable y sólida (P6.1)**: panel con tarjetas de decisión (extracto
por IA, semáforo de urgencia, botones Aprobar/Cambios/Rechazar
sincronizados con Telegram), métricas de flujo, filtros, historial de
decisiones, notificaciones solo por umbral -- con estimación de coste y
tiempo de desarrollo (2-3 semanas, mayoría en planes gratuitos).

**Fiable y directamente útil (P6.2)**: resuelve la pregunta difícil
concreta -- sin token de esquema, la consola solo puede actualizar
filas existentes (PATCH), no crear nuevas ni tocar estructura. Solución
propuesta: n8n como intermediario, o pre-generar filas vacías en
Baserow para "crear" desde la consola actualizándolas después.

## Valoración honesta general

De 12 respuestas, **7 son sólidas y usables** (P1.1, P2.1, P3.1, P4.1,
P5.1, P6.1, P6.2), **3 quedan descartadas por contaminación real** (P1.2,
P2.2, P3.2 -- no error de contenido, error de mecanismo), y **2 son
válidas pero demasiado abstractas para implementar tal cual** (P4.2,
P5.2 -- sirven como principio, no como especificación).

**Recomendación**: las 6 preguntas base ya tienen respuesta sólida de
partida (todas las `.1`). Las profundizaciones habría que repetirlas
con el bug de `ORDEN` corregido antes de confiar en ellas -- no se
recomienda usar P1.2/P2.2/P3.2 para nada.

## Nivel de revisión automático (GPT-5.6 Luna) -- construido y probado

Tras esta primera investigación, se construyó un nivel de revisión
automático (`revisar_relevo`, generador) que usa un modelo de familia
distinta a DeepSeek/local (GPT-5.6 Luna, OpenAI) para juzgar cada
respuesta como sólida/contaminada/abstracta -- formaliza lo que hasta
ahora hacía Claude a mano en cada Relevo.

**Bug real encontrado y corregido durante la construcción**: el Code
node que extraía el veredicto corría en modo "una vez para todos los
items" en vez de "una vez por item", así que de 12 tareas a revisar solo
procesaba la primera. Corregido fijando el modo explícitamente.

**Resultado de la prueba real, comparado contra la revisión manual ya
conocida (esta misma investigación)**: **9 de 12 aciertos**. Acertó las
7 sólidas, la abstracta P5.2, y una de las tres contaminadas (P2.2).
**Se le escaparon 2 de las 3 contaminaciones reales** (marcó P1.2 y
P3.2 como sólidas, cuando estaban contaminadas por la colisión de
`ORDEN`) y confundió P4.2 (abstracta) con sólida.

**Conclusión honesta**: el nivel de revisión automático funciona como
mecanismo (procesa el lote completo, coste real ~$0,00015/revisión) pero
**no es fiable todavía para el tipo de error que más importa detectar**
-- la contaminación de contexto. Sirve como primer filtro barato, no
como sustituto de la revisión humana en el Relevo real.
