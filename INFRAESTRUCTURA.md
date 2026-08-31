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
VPS, este PC y (pendiente) la Pi, sin exponer nada a internet abierto.

- `engremiat-dev-hetzner` -- 100.107.171.88 (el VPS de arriba).
- `pc-operador-engremiat` -- 100.118.79.49 (este PC, instalado y
  conectado esta noche).
- `desktop-rfpg5f6`, `galaxy-a22-5g` -- dispositivos previos del
  promotor, desconectados desde hace 76-77 días, sin relación con
  Engremiat.
- **Pendiente**: instalar Tailscale en la Raspberry Pi para que forme
  parte de la misma red privada -- necesario antes de poder hacer
  backups automáticos VPS→Pi sin abrir puertos en el router de casa.

## Raspberry Pi (núcleo original)

Sigue siendo la instancia real con los datos de esta noche (`VIGILIA`,
`GASTO_API`, etc. -- todo lo documentado en `TELAR.md` y
`diario-navegacion/` se generó aquí, no en el VPS). Acceso: alias SSH
`nodo-pi` (usuario `nodo-admin`, clave `~/.ssh/id_ed25519_pi`),
`docker-compose.yml` en `/home/nodo-admin/nucleo/`. IP LAN
`192.168.8.230`, sin Tailscale todavía (pendiente, ver arriba).

## Límites y honestidad

- El VPS está probado y responde (n8n 200, Baserow 302 -- verificado
  desde este PC vía Tailscale), pero está vacío -- no hay ninguna
  Vigilia, tarea ni dato real ahí todavía.
- No hay backup automático VPS→Pi todavía -- diseñado en la
  conversación (pg_dump + export de workflows por SSH), no construido.
- El enchufe inteligente para encender/apagar la Pi a demanda sigue sin
  resolver -- ver `PENDIENTES_JORNADA_2026-08-30-31.md`.
