# Wrapper para la tarea programada "Engremiat - Regenerar grafos" (§8.93, TAR-0006).
# Mismo patron real ya probado en tools\gobierno\ejecutar_chequeo_libreria.ps1: git pull
# antes de correr, para que la tarea programada nunca quede ejecutando una version vieja
# del script sin que nadie lo note.
Set-Location "C:\Users\pc\Desktop\engremiat.claude"
git pull origin main --quiet
node tools\gobierno\graphify_visor\regenerar_grafos.mjs --desplegar
