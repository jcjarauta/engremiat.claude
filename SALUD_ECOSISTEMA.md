# Salud del ecosistema Engremiat

**Por qué existe esto**: el 2026-08-23 se descubrieron a la vez, en la misma
sesión, cuatro desincronizaciones reales que nadie había notado hasta
entonces: la Consola llevaba días sin reflejar incidencias nuevas del
Sheet, la rama activa de Ejecutor iba 19 commits por detrás de `main`,
`PROMPT_EJECUTOR.md` no mencionaba herramientas ya construidas, y el
trigger de Ejecutor llevaba desactivado sin que nada lo señalara. Ninguna
de las cuatro era grave por separado, pero las cuatro juntas mostraban el
mismo patrón: nada del ecosistema se comprueba solo, todo depende de que
alguien se acuerde de mirar.

Este documento fija el ritual que sustituye a "acordarse" por "comprobar
siempre, al empezar cualquier sesión de trabajo real" (no una consulta
rápida, sí cualquier sesión donde se vaya a tocar la Consola, Ejecutor, o
el repo `engremiat.claude` de forma sustancial).

## Los 4 puntos de fallo reales (no hipotéticos)

| # | Qué puede desincronizarse | Se detectó así el 2026-08-23 |
|---|---|---|
| 1 | Datos: Consola (`GRUPOS`) vs `13_INCIDENCIAS` | El operador pidió revisar por qué faltaba una incidencia -- 4 incidencias llevaban desde su creación sin aparecer |
| 2 | Código: rama activa de Ejecutor vs `main` | Al revisar si reactivar el trigger, la rama llevaba 19 commits de retraso |
| 3 | Instrucciones: `PROMPT_EJECUTOR.md` vs herramientas/reglas nuevas del repo | El mismo repaso encontró que el prompt no mencionaba el ritual de sincronización ni la regla de delegación de IA, ambos ya construidos |
| 4 | Automatización: el trigger de Ejecutor activo de verdad | El trigger estaba `enabled: false` -- nadie lo había notado porque nada lo señalaba |

## Norma: todo elemento nuevo nace registrado (2026-08-23)

`tools/registro_ecosistema.json` es la lista central de lo que este ritual
vigila -- prompts operativos, triggers programados, scripts de
sincronización. **No hay nombres fijos en el código de `salud_ecosistema.mjs`**:
lee este registro, así que cualquier pieza nueva del ecosistema se declara
ahí, en el MISMO commit que la crea, no en uno posterior ni "cuando dé
tiempo". Si no está en el registro, el ritual no la vigila y puede
desincronizarse sin que nadie se entere -- exactamente el fallo que motivó
todo este documento.

Al crear cualquiera de estos tres tipos de elemento, el checklist es:
- **Prompt operativo nuevo** (tipo `PROMPT_EJECUTOR.md`, para un agente
  nuevo): lleva desde el primer commit la cabecera `Última revisión
  humana/Claude de este fichero: AAAA-MM-DD`, y se añade una entrada en
  `prompts_operativos` del registro.
- **Trigger programado nuevo** (`RemoteTrigger action:"create"`): se añade
  una entrada en `triggers_programados` del registro con su `id` real
  (devuelto por la API al crearlo) en el mismo commit/sesión que lo crea.
- **Script de sincronización nuevo** (tipo `chequear_consistencia.mjs`): se
  añade una entrada en `scripts_sincronizacion` del registro.

## El ritual

### Automatizable (`node tools/salud_ecosistema.mjs <rama-activa> <volcado-sheet.json>`)

Cubre los puntos 1-3 en un único chequeo, leyendo `registro_ecosistema.json`:
1. Commits de diferencia entre la rama activa y `main` (aviso si son más de 5).
2. Antigüedad de la cabecera "Última revisión" de cada prompt operativo del registro (umbral configurable por prompt, 7 días por defecto).
3. Consistencia Consola↔Sheet, delegando en `tools/consola/chequear_consistencia.mjs`.

Ambos argumentos son opcionales -- sin ellos, el script omite ese chequeo
concreto y avisa de que se omitió, en vez de fallar en silencio.

### Manual, solo con herramientas de Claude (punto 4)

`salud_ecosistema.mjs` no puede comprobar esto porque necesita la
herramienta `RemoteTrigger`, que no existe fuera de una sesión de Claude.
El propio script imprime, leídos del registro, todos los `id` de trigger a
revisar:

```
RemoteTrigger action:"list"
```

Para cada trigger listado en `triggers_programados`: comprobar `enabled`
(¿está activo de verdad?) y `last_fired_at` (¿corrió cuando debía, o lleva
parado más tiempo del esperable según su `cron_expression`?).

## Cuándo ejecutarlo

- Al empezar cualquier sesión de trabajo que vaya a tocar la Consola,
  Ejecutor, o hacer cambios sustanciales en el repo -- no en cada consulta
  puntual.
- Antes de reactivar el trigger de Ejecutor después de cualquier pausa,
  sin excepción -- fue precisamente al plantear reactivarlo cuando se
  encontraron los puntos 2 y 3 el 2026-08-23.
- Al empezar la revisión periódica de `PROMPT_EJECUTOR.md` que su propia
  cabecera pide (cada ~7 días).

## Relación con las demás piezas de sincronización ya construidas

Esto no sustituye a `tools/consola/SINCRONIZACION.md` -- lo incluye como
uno de sus tres chequeos automatizables (el punto 1). `SINCRONIZACION.md`
sigue siendo la referencia detallada para el ritual completo de
sincronizar la Consola con el Sheet en las dos direcciones (incluida la
parte de trasladar decisiones del Artifact al Sheet, que `salud_ecosistema.mjs`
no cubre por diseño -- es de solo lectura/diagnóstico, no toca datos).
