# LT-CASE-003 — Prueba controlada Work-Codex

CASO_ID=LT-CASE-003
TIPO=FIXTURE_DOCUMENTAL_DESECHABLE
ENTORNO=LOCAL_ONLY
OBJETIVO=Validar una modificación documental mínima y reversible mediante Codex
ARCHIVO_PRODUCTIVO=false
BASELINE=false
PUBLICABLE=false
MARCA_CONTROL=WORK

REGLA_DE_CAMBIO=
Codex podrá modificar únicamente MARCA_CONTROL=WORK por MARCA_CONTROL=CODEX.

REGLA_DE_REVERSION=
Restaurar exactamente MARCA_CONTROL=WORK.
