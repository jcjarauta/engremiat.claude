# Hallazgos pendientes — no bloqueantes

Registro de problemas reales encontrados durante el trabajo normal (no buscados a propósito),
que no bloquean lo que se está construyendo en el momento pero que habrá que resolver antes de
que el sistema crezca lo suficiente para que importen. Cada entrada dice qué se encontró, por
qué no bloquea hoy, y qué cambiaría eso.

No es un backlog de features (eso vive en `ROADMAP_BACKLOG_MEJORAS.md` para el Sheet) — es
específicamente para hallazgos de arquitectura/seguridad/deuda encontrados de pasada, para no
perderlos ni tener que recordarlos de memoria.

---

## 1. Webhook de Apps Script sin autenticación por acción (2026-09-04)

**Qué se encontró**: el dispatcher `doPost` (`src/WebhookTelegramService.js`) despacha por el
campo `accion` del JSON recibido sin comprobar ningún token/autenticación antes de ejecutar la
acción — verificado en real contra `crear_solicitud_montaje` (§8.71 de
`PROPUESTA_BASTIDOR_GESTOR_PROYECTOS_ENGREMIAT.md`): un `curl` sin credenciales, solo con la URL
de despliegue, escribió una fila real en `SOLICITUDES_MONTAJE` (`SOL-003`).

**Por qué no bloquea hoy**: la URL de despliegue (`AKfycbz1N-ZJRjjjZ1BRZJaXxPLaBHrVtPD1tRDl1wi8tHA3dW5AYMITX5z4AFEsPEluPjQ2`)
solo vive dentro del propio repositorio/código interno — no está publicada en ningún sitio
visitable, y las acciones expuestas hoy son de bajo riesgo real (`crear_solicitud_montaje` solo
escribe una fila `Pendiente`, nunca aprueba ni crea infraestructura real por sí sola — eso sigue
protegido por la columna `ESTADO`, editable solo por `EMAILS_AUTORIZADOS_MONTAJE`).

**Qué lo activaría**: en el momento en que esta URL viaje al navegador de un visitante (código
cliente, no servidor) o se publique en cualquier sitio externo, cualquiera podría disparar
`crear_solicitud_montaje` (o cualquier otra acción del dispatcher) a voluntad. Mientras Bastidor
llame a este webhook siempre server-to-server (`servidor_memoria.mjs`, URL guardada como secreto
de entorno, nunca en el HTML servido al navegador), el riesgo sigue contenido. Si en el futuro se
necesita exponer una acción de escritura más sensible, o si el volumen de solicitudes reales crece
lo suficiente para que un abuso sea costoso, hace falta añadir un secreto compartido real (ej. un
campo `token` en el cuerpo, comprobado en `doPost` antes de despachar).

---
