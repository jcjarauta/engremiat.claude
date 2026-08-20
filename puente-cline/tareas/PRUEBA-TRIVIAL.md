# PRUEBA-TRIVIAL -- Cambio de una sola línea (aislar la variable complejidad)

Prueba diagnóstica (ver conversación -- INC-0004, 9 intentos previos con
1 éxito). Objetivo: comprobar si una tarea MÁS SENCILLA que TAR-0002
(sin patrón HTML que replicar, un solo cambio de texto) es más fiable.

## Resultado esperado

En `src/Biblioteca.html`, cambia únicamente el texto del subtítulo:

De:
```
<div class="subtitulo">Qué es cada cosa en el taller, en dos frases.</div>
```

A:
```
<div class="subtitulo">Qué es cada cosa en el taller, explicado en dos frases.</div>
```

Es literalmente un cambio de una palabra ("Qué es cada cosa en el
taller, en dos frases" -> "...explicado en dos frases"). No hay
estructura que replicar, no hay HTML nuevo.

## Definition of done

1. Solo esa línea cambia en `src/Biblioteca.html`, nada más.
2. Mensaje final con el formato ESTADO/RESUMEN/ARCHIVOS/GATES de
   `.clinerules` (GATES: no hace falta correrlos para un cambio de
   texto puro, pon "no aplica").
