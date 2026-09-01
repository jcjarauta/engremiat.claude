# Equilibrio del recurso — Prometheus + Grafana

Panel vivo del gasto real registrado en `GASTO_API` (Baserow, tabla 285) — la pieza "operar"
del modelo de tiempo/recurso/equilibrio, complementaria a la representación fractal narrativa
del [Universo Engremiat](https://claude.ai/code/artifact/e90daef0-3c29-4447-858e-c9ec443d1695).

**V1, alcance real**: solo `GASTO_API` (Baserow). `TAREA_RECURSO` y `91_HISTORIAL` viven en el
otro continente de datos (Sheets/Apps Script, ver `MAPA_DOMINIOS_DATOS.md`) y quedan para una
segunda iteración — cruzar los dos continentes en un mismo panel es más trabajo del que esta
primera versión necesita, y el gasto real de API ya es una medida honesta de "energía" consumida.

## Qué hace cada pieza

- `exportador_prometheus_gasto.mjs` — lee `GASTO_API` en vivo vía la misma API REST de Baserow
  que ya usa `coordinador.mjs`, agrega coste 24h/7d/total y lo expone en `/metrics`.
- `docker-compose.yml` — exportador + Prometheus + Grafana, todo atado a la IP de Tailscale del
  VPS, nunca a `0.0.0.0` — mismo criterio de mínimo privilegio que el resto del VPS.
- `prometheus.yml` / `alertas.yml` — scrapea cada 5 min (el gasto real no cambia segundo a
  segundo); la alerta usa el tope real de $5/mes que `GASTO_API` ya aplica por diseño, no un
  número inventado para esta pieza.
- `grafana-provisioning/` — datasource y dashboard pre-cargados, sin clicar nada a mano al
  arrancar.

## Desplegar (requiere autorización explícita — Puerta Humana, como todo lo demás)

En el VPS, dentro de este directorio:

```bash
export BASEROW_TOKEN=<el token real que ya usan los scripts de tools/gobierno>
export GRAFANA_ADMIN_PASSWORD=<contraseña nueva, no reutilizar ninguna otra>
docker compose up -d
```

Grafana queda en `http://100.107.171.88:3001` (solo alcanzable dentro de Tailscale).
Verificar tras el primer `docker compose up -d`: `curl http://100.107.171.88:9310/metrics`
debe devolver métricas reales, no el aviso de `engremiat_gasto_api_exportador_ok 0`.

## Pendiente, no construido en esta versión

- Cruzar `TAREA_RECURSO`/`91_HISTORIAL` (Sheets) en el mismo panel.
- Registrar este stack en `92_BUS_TRABAJO` al desplegarlo, como ya hace `chequear_libreria_clientes.mjs`.
- Decidir si Grafana se expone también por el enchufe de encendido remoto o queda siempre activo.
