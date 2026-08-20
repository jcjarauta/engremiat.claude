# Guía de diseño Engremiat

Checklist de referencia para la 4ª pata del ciclo de auditoría (código →
comportamiento con datos → diseño). No es una opinión de gusto -- cada
punto cita su fuente (W3C/WAI para WCAG, Nielsen Norman Group para
heurísticas y patrones de ayuda) o el propio precedente ya establecido en
este código. Un hallazgo de diseño se registra como INCIDENCIA igual que
uno de código, citando el criterio concreto incumplido, no una impresión
general.

## 1. Convención propia del proyecto (verificar primero, es gratis)

Antes de mirar ningún estándar externo, comparar contra lo que este mismo
código ya establece como precedente en `src/Estilos.html` (incluido con
`<?!= include('Estilos') ?>` en todos los diálogos):

- Colores: `--color-primario`, `--color-peligro`, `--color-exito` y
  derivados -- un panel que define su propio rojo/verde en vez de
  reutilizar estas variables es una inconsistencia objetiva (motivo
  original de crear este fichero: "había dos rojos distintos y dos
  verdes distintos para lo mismo").
- Acciones destructivas: deben pasar por `ModalConfirmar.html`
  (`.overlay-fondo`/`.overlay-caja`), no por `confirm()`/`alert()`
  nativos del navegador.
- Badges de estado: clase `.badge` + modificador (`badge-alerta`,
  `badge-ok`) -- patrón ya reutilizado en Panel de Clientes y Gestión
  remota de clientes (INC-0017).
- Botones: `.boton-primario` para la acción principal, `.boton-peligro`
  para la destructiva, alineados a la derecha en `.acciones` -- un panel
  que invierte este orden o usa otro estilo para "Guardar" es
  inconsistente con el resto.

**Caso ya detectado al escribir esta guía, pendiente de verificar en vivo
antes de registrar como incidencia:** `Estilos.html:35` quita el
contorno de foco nativo del navegador (`outline: none`) en
inputs/selects/textareas y lo sustituye solo por un cambio de color de
borde (`border-color: var(--color-primario)`), sin cambiar el grosor.
Afecta a TODOS los formularios del sistema porque el fichero es
compartido. Hay que comprobar con el Browser si ese cambio de color por
sí solo es un indicador de foco suficientemente visible (WCAG 2.4.7) o
si hace falta reforzarlo (p.ej. `box-shadow` adicional) antes de darlo
por hallazgo real.

## 2. WCAG 2.1/2.2, nivel AA -- solo lo verificable visualmente/por DOM

Fuente: [W3C WCAG Quick Reference](https://www.w3.org/WAI/WCAG21/quickref/), [WCAG 2.2 SC 2.5.8](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)

- **1.4.3 Contraste (mínimo)** -- texto normal vs fondo ≥ 4.5:1; texto
  grande (≥18pt o ≥14pt negrita) ≥ 3:1.
- **1.4.11 Contraste no textual** -- bordes/iconos/indicadores de estado
  de componentes (botones, inputs, toggles) ≥ 3:1 contra el color
  adyacente.
- **2.4.7 Foco visible** -- todo elemento interactivo muestra un
  indicador de foco claro al navegar con tabulador; ojo con `outline:
  none` sin sustituto adecuado (ver caso de arriba).
- **1.3.1 Info y relaciones** -- campos de formulario con `<label>`/
  `aria-label` asociado programáticamente, tablas con `<th>`, la
  estructura no se transmite solo por layout visual.
- **3.3.2 Etiquetas o instrucciones** -- todo input tiene una etiqueta
  visible o instrucción clara antes de pedir que se rellene.
- **3.3.1 Identificación de errores** -- los errores de validación se
  describen en texto (no solo color/icono) y se asocian al campo
  concreto.
- **1.4.4 Cambio de tamaño de texto** -- la página es usable sin recortes
  al 200% de zoom.
- **1.4.10 Reflow** -- el contenido se adapta sin scroll horizontal a
  anchos equivalentes a 320px (zoom 400%).
- **2.5.8 Tamaño de objetivo (mínimo, WCAG 2.2 AA)** -- objetivos
  clicables ≥ 24×24px CSS, o con separación adecuada si son más pequeños
  (sospechosos habituales: botones de solo icono, acciones en filas de
  tabla).

## 3. Heurísticas de usabilidad de Nielsen Norman Group

Fuente: [NN/g -- 10 Usability Heuristics](https://www.nngroup.com/articles/ten-usability-heuristics/)

- **Visibilidad del estado del sistema** -- sin feedback tras
  guardar/borrar/una operación larga.
- **Coincidencia entre el sistema y el mundo real** -- nombres de campo
  de la base de datos en vez de los términos que usa el equipo.
- **Control y libertad del usuario** -- sin cancelar/deshacer en un
  formulario multi-paso o edición por lotes.
- **Consistencia y estándares** -- la misma acción (p.ej. "eliminar") con
  icono/etiqueta/posición distinta según la pantalla.
- **Prevención de errores** -- una acción destructiva por lotes sin
  ninguna salvaguarda antes de dispararse.
- **Reconocer en vez de recordar** -- obligar a recordar un ID de otra
  pantalla en vez de mostrarlo en línea.
- **Flexibilidad y eficiencia de uso** -- sin atajos ni acciones por
  lotes para quien usa la herramienta a diario, solo flujos de un
  registro cada vez.
- **Diseño estético y minimalista** -- una pantalla que amontona todos
  los campos/columnas visibles a la vez, enterrando lo que hace falta
  para la tarea concreta.
- **Ayudar a reconocer, diagnosticar y recuperarse de errores** -- un
  error muestra un stack trace/código en crudo en vez de texto claro con
  una vía de solución.
- **Ayuda y documentación** -- una función no obvia sin ayuda localizable
  ni orientada a la tarea.

## 4. Cuándo usar cada elemento de ayuda

Fuente: [NN/g -- Tooltip Guidelines](https://www.nngroup.com/articles/tooltip-guidelines/), [NN/g -- Confirmation Dialogs](https://www.nngroup.com/articles/confirmation-dialog/), [NN/g -- Empty States](https://www.nngroup.com/articles/empty-state-interface-design/), [NN/g -- Consequential Options Close to Benign Options](https://www.nngroup.com/articles/proximity-consequential-options/)

- **Tooltip**: solo aclaración breve y secundaria al pasar el ratón/foco
  -- nunca información necesaria para completar la tarea.
- **Texto de ayuda en línea** (`.ayuda-campo`, ya existe en Estilos.html):
  cuando la mayoría necesita la explicación de entrada, siempre visible,
  con menos peso visual que la etiqueta.
- **Estado vacío**: siempre que una lista/tabla pueda mostrar
  legítimamente cero filas -- explicar por qué está vacía y dar una
  acción siguiente directa, no solo "Sin datos".
- **Diálogo de confirmación**: solo para acciones de alta severidad y
  difícil reversión (borrado masivo, cambio de estado permanente); no
  ponerlo en cada acción o el usuario empieza a descartarlo sin leer --
  preferir "deshacer" cuando sea viable.
- **Separación física**: controles destructivos (borrar/archivar)
  separados visual y espacialmente de los controles benignos frecuentes
  (guardar/editar) para evitar clics accidentales.

## Cómo se aplica

1. Abrir el panel real con el Browser (no solo leer el HTML).
2. Comprobar primero contra la sección 1 (convención propia) -- es la
   más barata y ya tiene precedente en el propio código.
3. Comprobar los puntos de la sección 2 que apliquen a ese panel
   concreto (contraste, foco, etiquetas).
4. Registrar cada hallazgo real como INCIDENCIA, citando el criterio
   incumplido (p.ej. "WCAG 1.4.3" o "NN/g -- Consistencia y estándares"),
   `ORIGEN_CREACION` = "Diseño", máximo 3-6 hallazgos por pasada.
5. Fixes mecánicos (cambiar un color en Estilos.html, añadir un
   aria-label) van a `sugerir-parche.sh`; cambios de flujo/estructura los
   hace Claude directamente.
