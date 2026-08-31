# Infraestructura real de Engremiat

Registro de dónde vive cada pieza del sistema, con qué acceso, y qué es
entorno de desarrollo frente a lo que sería el producto real para un
cliente. Ver `PENDIENTES_JORNADA_2026-08-30-31.md` para el contexto de
por qué se creó esto.

## VPS de desarrollo: Hetzner (2026-08-31)

**Por qué existe**: mientras se trabaja en solitario probando el
sistema, mantener la Raspberry Pi encendida todo el tiempo no compensa
-- se decidió un VPS barato siempre disponible como entorno de
desarrollo, con la Pi como destino de backup/despliegue real más
adelante. Ver `TELAR.md` para el análisis de mercado (Hetzner vs.
Contabo/DigitalOcean, y por qué no pay-per-use).

**No es el producto.** Cuando se hable de oferta a un cliente real
(FCAFA-TDAH u otro), el sistema tiene que vivir en hardware del propio
cliente o una nube que ellos controlen -- coherente con el discurso de
soberanía. Este VPS es solo para probar mientras se construye.

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

## Backup real VPS→Pi (2026-08-31, construido y probado)

`/root/backup_to_pi.sh` en el VPS: empaqueta los volúmenes Docker de
`n8n` y `baserow` (`docker run` con `alpine` + `tar`, sin depender de
comandos internos de cada app) y los envía por `rsync` sobre Tailscale
a `~/backups/` en la Pi. Programado por `cron` a las 23:00 cada noche
(`/root/backup.log` para revisar si falló).

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
