# Infraestructura real de Engremiat

Registro de dónde vive cada pieza del sistema, con qué acceso, y qué es
entorno de desarrollo frente a lo que sería el producto real para un
cliente. Ver `PENDIENTES_JORNADA_2026-08-30-31.md` para el contexto de
por qué se creó esto.

## Roles reales, redefinidos (2026-08-31)

Decisión explícita del promotor: a partir de ahora se trabaja **sobre
el VPS**, que pasa a ser el que registra datos reales y hace los
backups -- ya no es solo "entorno de pruebas mientras la Pi es lo
real", como se documentó unas horas antes esta misma noche. La Pi (y
el futuro SSD/hub externo) pasan a ser el **banco de pruebas de
concepto** -- donde se valida que algo funciona de verdad antes de
entregárselo a un cliente, nunca donde vive el dato de producción de
Engremiat mismo.

**Sigue sin ser el producto para un cliente real.** Cuando se hable de
oferta a FCAFA-TDAH u otro, el sistema tiene que vivir en hardware
propio del cliente o una nube que ellos controlen -- coherente con el
discurso de soberanía. Ni el VPS ni la Pi son ese destino final, los
dos siguen siendo infraestructura de Engremiat como operador.

## VPS de desarrollo: Hetzner (2026-08-31)

Ver `TELAR.md` para el análisis de mercado (Hetzner vs.
Contabo/DigitalOcean, y por qué no pay-per-use).

- **Proveedor**: Hetzner Cloud, proyecto `engremiat-dev`.
- **Servidor**: `ubuntu-4gb-hel1-2`, CX23 (2 vCPU, 4 GB RAM, 40 GB SSD),
  Helsinki (UE), Ubuntu 26.04 LTS. ~€7,25/mes con IP.
- **Acceso SSH**: clave dedicada `~/.ssh/id_ed25519_hetzner_engremiat`
  (generada esta noche, sin passphrase, solo para este servidor -- no
  reutilizar en ningún otro sitio). IP pública `2.29.22.181`, pero los
  servicios **no** están expuestos ahí -- ver Tailscale abajo.
- **Docker + Docker Compose**: instalados vía el script oficial de
  Docker.
- **Stack desplegado**: mismo `docker-compose.yml` que corre en la Pi
  (`n8n` + `baserow`, imágenes oficiales, sin Postgres externo --
  Baserow lo lleva embebido en su propio volumen). **Clonada la
  configuración, no los datos** -- el VPS arranca con Baserow y n8n
  vacíos. Migrar datos reales de la Pi es una decisión aparte, no
  hecha todavía.
- **Diferencia de seguridad real frente a la Pi**: en la Pi, los
  puertos 80/5678 están abiertos en `0.0.0.0` porque solo son
  alcanzables dentro de la LAN de casa. En el VPS, que sí tiene IP
  pública en internet, los mismos puertos están atados **solo a la IP
  de Tailscale** (`100.107.171.88`), nunca a `0.0.0.0` -- así nada es
  alcanzable desde fuera de la red privada, aunque la IP pública exista.

## Red privada: Tailscale

Red mallada gratuita (cuenta `sacandofilo@gmail.com`) que conecta el
VPS, este PC y la Pi, sin exponer nada a internet abierto.

- `engremiat-dev-hetzner` -- 100.107.171.88 (el VPS de arriba).
- `pc-operador-engremiat` -- 100.118.79.49 (este PC).
- `nodo-pi-engremiat` -- 100.125.52.52 (la Pi, instalada y conectada
  esta noche -- `sudo tailscale up` requiere contraseña de
  `nodo-admin`, ejecutado por el promotor directamente).
- `desktop-rfpg5f6`, `galaxy-a22-5g` -- dispositivos previos del
  promotor, desconectados desde hace 76-77 días, sin relación con
  Engremiat.

## Raspberry Pi (núcleo original)

Sigue siendo la instancia real con los datos de esta noche (`VIGILIA`,
`GASTO_API`, etc. -- todo lo documentado en `TELAR.md` y
`diario-navegacion/` se generó aquí, no en el VPS). Acceso: alias SSH
`nodo-pi` (usuario `nodo-admin`, clave `~/.ssh/id_ed25519_pi`),
`docker-compose.yml` en `/home/nodo-admin/nucleo/`. IP LAN
`192.168.8.230`, ahora también en Tailscale (100.125.52.52).

**Almacenamiento**: solo hay microSD (119 GB, `mmcblk0`) -- sistema y
backups en el mismo disco físico, sin aislamiento entre ambos. Hay un
disco externo Toshiba de 1 TB disponible para separar "lo nuclear" (SD)
de los backups/datos (externo), pero **no se detecta de forma estable
en la Pi** -- se vio una vez por `dmesg` y se desconectó solo
(`USB disconnect`); tras cambiar de puerto y de cable, cero eventos
nuevos en el log del kernel. Diagnóstico: probable problema de
alimentación -- un disco mecánico de 2,5"/1 TB puede no recibir
corriente suficiente directo de los puertos USB de la Pi. **Pendiente:
conseguir un hub USB alimentado (con fuente propia)** entre el disco y
la Pi antes de reintentarlo.

## Encendido/apagado seguro de la Pi + despertar el PC (2026-08-31)

**Permiso sudo limitado, no completo**: `/etc/sudoers.d/nodo-admin-engremiat`
da a `nodo-admin` permiso sin contraseña **solo** para `shutdown` y
`tailscale` -- nada más. Validado con `visudo -c` antes de aplicarse.

- **`~/apagar_pi_seguro.sh`** (en la Pi): hace `sudo shutdown -h now`
  con registro en `~/apagados.log`. Se dispara a mano (por SSH) cuando
  se termina de trabajar -- **todavía no hay detección automática de
  inactividad**, es un paso deliberado, no un temporizador.
- **Enchufe inteligente (Google Home, ya en propiedad del promotor)**:
  pendiente de programar horario/rutina en la app de Google Home --
  debe cortar corriente **varios minutos después** de lanzar el
  apagado seguro, nunca a la vez, para no cortar la Pi a mitad de
  apagarse y arriesgar la tarjeta SD.
- **`~/despertar_pc.sh`** (en la Pi): `wakeonlan 10:FF:E0:AA:EA:BC`
  (MAC real del PC operador, adaptador Realtek). Pensado para
  disparse desde la Pi (siempre en la misma LAN que el PC) cuando se
  necesite encenderlo estando fuera de casa, conectando primero a la
  Pi por Tailscale.
- **Lado del PC, verificado esta noche**: "Reactivar en Magic Packet"
  ya estaba activado en el adaptador de red. Se encontró y corrigió
  **Inicio rápido activado** (`HiberbootEnabled=1`), causa típica de
  que el WoL falle tras un apagado completo -- desactivado por el
  promotor (`powercfg /hibernate off` + registro puesto a `0`
  directamente, el primer comando no lo limpió por sí solo).
- **Pendiente, no verificable en remoto**: confirmar en la BIOS/UEFI
  del PC que "Wake on LAN"/"Power On By PCI-E" está activado --
  requiere entrar en la BIOS en el próximo reinicio natural.
- **Wake-on-LAN Pi→PC**: sigue sin probarse de extremo a extremo --
  probarlo significa apagar el PC de verdad y despertarlo desde la Pi,
  no se ha hecho esta noche para no cortar la propia sesión de
  trabajo.
- **Ciclo apagado/encendido de la Pi con el enchufe inteligente:
  probado con éxito (2026-08-31)**. Secuencia real: `apagar_pi_seguro.sh`
  → corte de corriente por el enchufe Google Home → reconexión →
  arranque automático → verificado por HTTP que n8n
  (`GET /healthz` → `{"status":"ok"}`) y Baserow (`GET /` → 302) vuelven
  solos, sin intervención manual -- los contenedores tienen
  `restart: unless-stopped` y arrancan con el propio Docker al boot.
  No hizo falta ni una sola contraseña ni comando de recuperación.
- **Webhook de apagado remoto -- construido y probado (2026-08-31)**:
  servicio `apagar-pi-webhook` en el VPS (`systemd`, Python
  `http.server`, atado solo a `100.107.171.88:8090`) -- una petición
  `GET http://100.107.171.88:8090/apagar-pi` desde el móvil (dentro de
  Tailscale) ejecuta el apagado seguro de la Pi sin que el promotor
  necesite terminal ni SSH. Usa una clave dedicada
  (`id_ed25519_apagar_pi`) con `command=` forzado en la Pi a **solo**
  `apagar_pi_seguro.sh` -- el mismo patrón de mínimo privilegio que la
  clave de backup.
- **Alimentación del enchufe inteligente: causa real identificada
  (2026-08-31)**. Tres ciclos de encendido el mismo día: dos con
  fallo real (ventilador gira, **ningún LED**, varios minutos sin
  arrancar) y uno limpio. La diferencia real entre los intentos: el
  enchufe estaba conectado **a través de un SAI**. Al quitar el SAI de
  en medio (enchufe directo a la pared), la Pi arrancó bien
  (`up 1 min`, n8n y Baserow sanos). Hipótesis más probable: el SAI
  introduce una caída de tensión o una onda de salida que no le sienta
  bien a la fuente conmutada de la Pi, no el enchufe inteligente en sí.
  **Recomendación**: no alimentar la Pi (ni el enchufe inteligente) a
  través del SAI hasta comprobarlo con más ciclos.
- **Webhook de despertar el PC -- construido y probado de extremo a
  extremo con éxito (2026-08-31)**: servicio `despertar-pc-webhook` en
  el VPS (mismo patrón que el de apagado, puerto
  `100.107.171.88:8091`, `GET /despertar-pc`) -- SSH con clave dedicada
  (`id_ed25519_despertar_pc`, `command=` forzado a **solo**
  `despertar_pc.sh`) hacia la Pi, que envía el paquete mágico WoL al
  PC operador. Confirmado por el promotor: **ciclo completo
  funcionando de punta a punta** -- enchufe enciende la Pi (sin SAI) →
  webhook de despertar-pc desde el móvil → PC operador arranca por WoL
  → trabajo por Chrome Remote Desktop → webhook de apagar-pi cuando se
  termina. Las piezas de encendido/apagado remoto de la infraestructura
  quedan cerradas.

## Backup real VPS→Pi (2026-08-31, construido y probado)

`/root/backup_to_pi.sh` en el VPS: empaqueta los volúmenes Docker de
`n8n` y `baserow` (`docker run` con `alpine` + `tar`, sin depender de
comandos internos de cada app) y los envía por `rsync` sobre Tailscale
a `~/backups/` en la Pi. Programado por `cron` a las **9:05** cada
mañana (`/root/backup.log` para revisar si falló).

**Ciclo completo con la Pi apagada por defecto -- diseñado y probado
en vivo (2026-08-31)**: como la Pi ya no está encendida todo el día
(ver ciclo de encendido/apagado remoto arriba), el script ahora:
1. Espera hasta 5 minutos a que la Pi responda por el puerto 22 --
   si no aparece en ese tiempo, **cancela el backup y lo deja escrito
   en el log**, nunca falla en silencio.
2. Hace el backup normal.
3. **Apaga la Pi él mismo al terminar** (misma clave restringida que
   el webhook de apagado), sin depender de un segundo horario en el
   enchufe para el apagado.

Solo hace falta programar **un** horario en el enchufe inteligente
(encendido, ej. 9:00-10:00) -- el resto se encadena solo. Probado en
vivo: arranque, backup y apagado automático completos en 45 segundos.

**Acceso restringido de verdad, no solo "clave SSH nueva"**: la clave
`id_ed25519_backup_to_pi` (generada en el VPS) está en el
`authorized_keys` de la Pi con un `command=` forzado que **solo**
permite `rsync` hacia `~/backups/` -- aunque esa clave se filtrara, no
sirve para nada más en la Pi (ni shell, ni otros directorios).

**Bug real encontrado y corregido en la propia construcción**: la
primera versión guardaba los archivos en una subcarpeta con fecha
(`~/backups/2026-08-31_1603/`), pero el `command=` forzado en la Pi
ignora la ruta de destino que pide el cliente y siempre escribe en
`~/backups/` a secas -- cada backup nuevo habría **sobrescrito** al
anterior en vez de acumular histórico. Corregido poniendo la fecha en
el nombre de archivo (`baserow_data_2026-08-31_1604.tgz`) en vez de en
una carpeta.

**Límite real, no resuelto todavía**: es un volcado completo de los
volúmenes (backup, ~86 MB), no una restauración -- restaurar desde uno
de estos `.tgz` a un contenedor vivo no se ha probado. Tampoco hay
rotación automática (los backups antiguos se acumulan sin borrarse).

## Límites y honestidad

- El VPS está probado y responde (n8n 200, Baserow 302 -- verificado
  desde este PC vía Tailscale), pero está vacío -- no hay ninguna
  Vigilia, tarea ni dato real ahí todavía.
- El enchufe inteligente para encender/apagar la Pi a demanda sigue sin
  resolver -- ver `PENDIENTES_JORNADA_2026-08-30-31.md`.
