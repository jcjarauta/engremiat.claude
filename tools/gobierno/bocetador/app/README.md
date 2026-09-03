# Bocetador Engremiat — prototipo real

Herramienta interna de diseño (no de producción) descrita en
`PROPUESTA_BASTIDOR_GESTOR_PROYECTOS_ENGREMIAT.md` §8. Pizarra compartida
basada en el SDK de [tldraw](https://tldraw.dev/) donde el usuario y Claude
bocetan juntos Espacios y Relaciones del Núcleo, siempre contra el mismo
contrato JSON ya validado en `../schemas/` y `../fixtures/`.

## Arrancar

```
npm install
npm run dev
```

Se abre en `http://localhost:5173`. Es una herramienta de uso local,
entre dos personas — no está pensada para desplegarse, por eso corre
siempre en modo desarrollo (no necesita clave de licencia de tldraw,
que solo se exige en producción/HTTPS/dominio no-localhost).

## Cómo funciona

- **Cargar Universo real (recomendado)**: lee `src/universo_real.json`,
  generado por `../cargar_desde_vault.mjs` a partir de la bóveda real
  de Obsidian (`01_Mundo/Espacios/`, `01_Mundo/Recursos/`,
  `01_Mundo/Modulos/`, `02_Personajes/`, `08_Oficios/`, `03_Reglas/`,
  `07_Holon_Relaciones/`) — 63 nodos y 18 relaciones reales, no
  inventados. El orden espacial reutiliza la propia taxonomía de
  carpetas del vault (una columna por tipo), y el vocabulario de
  relaciones (`activa_a`, `alimenta_a`, `opera_en`...) es el que ya
  estaba en uso real en `07_Holon_Relaciones/`, más rico que el
  puñado de aristas que traía el primer prototipo. Para regenerar el
  paquete tras editar la bóveda: `node ../cargar_desde_vault.mjs` y
  copiar el resultado a `src/universo_real.json`.
- **Cargar Núcleo (canvas)**: la carga original, más pequeña — los 4
  Espacios y las 3 Relaciones de `../fixtures/`, más 3 cajas de
  referencia (Constitución, Puerta Humana, Relevo). Útil para probar
  rápido sin el ruido del universo completo.
- Dibuja un rectángulo o una flecha con las herramientas de tldraw;
  al seleccionarlo, el panel de la derecha ofrece "Convertir en
  Espacio" / "Convertir en Relación".
- Con una figura ya convertida seleccionada, el panel muestra un
  formulario real — los desplegables (capa, variabilidad, tipo de
  relación) usan el mismo vocabulario cerrado que `espacio.schema.json`
  / `relacion.schema.json`, así que no se puede escribir un valor
  inválido desde la UI.
- **Exportar y validar**: recorre todas las figuras marcadas, arma el
  JSON real (mismo formato que los fixtures) y avisa si falta algo
  obligatorio (nombre, propósito, origen/destino de una relación sin
  fijar). Para la validación completa y autoritativa contra el
  esquema, sigue siendo `../validar_bocetador.mjs` el que manda —
  este panel es una ayuda en el momento de dibujar, no lo sustituye.
- **Paleta** (panel derecho, bajo "Cargado..."): seis botones (Espacio,
  Personaje, Recurso, Módulo, Herramienta, Regla) colocan una caja en
  blanco del tipo correcto en el centro de la vista. Una Relación no
  se crea desde la paleta: se dibuja con la herramienta de flecha
  nativa de tldraw y se suelta sobre dos cajas.
- **Las flechas están ligadas de verdad** (`editor.createBindings`,
  tipo `arrow` nativo de tldraw) — mover una caja mueve con ella
  cualquier relación conectada, tanto las cargadas por código como
  las que dibujes a mano.
- **Paleta de relaciones**: elige un tipo (agrupados por familia) antes
  de dibujar -- arma la herramienta de flecha, y la siguiente flecha
  que sueltes sobre dos cajas se etiqueta sola (tipo + origen/destino
  reales), sin pasar por el desplegable manual.

## Lo que falta (a propósito, no es un v1 completo)

- Personajes/Oficios/Reglas/Recursos/Módulos se cargan y se pueden
  editar (nombre, resumen), pero todavía no tienen un contrato JSON
  propio como Espacio/Relación (§8.2) — son informativos, no
  validados. `../cargar_desde_vault.mjs` no toca la bóveda (solo
  lectura), así que no hay riesgo de escribir mal ahí.
- Misión (Telar) y las entidades de módulo específico (Cliente,
  Oportunidad...) están propuestas en §8.9 del documento de Bastidor
  pero no construidas todavía — no hay figura propia para ellas.
- 3 relaciones reales del vault no se dibujan porque su destino es un
  grupo descriptivo ("2 Acervos-o-mecanismos") sin caja propia — se
  avisa en pantalla al cargar, no se pierden en silencio.
- No hay guardado ni carga de bocetos propios todavía — cada sesión
  empieza en blanco (o con el universo real, si se pulsa el botón).
  "Descargar JSON" es hoy la única forma de llevarse un boceto fuera
  del navegador.
