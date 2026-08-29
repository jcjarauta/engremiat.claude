# Wrapper para la tarea programada "Engremiat - Chequeo libreria clientes".
# Actualiza el clon local antes de correr, para que la tarea programada
# nunca quede corriendo una version vieja del script sin que nadie lo note.
Set-Location "C:\Users\pc\Desktop\engremiat.claude"
git pull origin main --quiet
node tools\gobierno\chequear_libreria_clientes.mjs
