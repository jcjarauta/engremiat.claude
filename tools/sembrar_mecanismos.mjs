const TOKEN = 'Token 62HhkmjmvMSf7tPyIzFwYCoNphM3Sops';
const BASE = 'http://100.107.171.88';
const TABLA = 1038;

const mecanismos = [
  { NOMBRE: 'Lock de concurrencia Vigilia', TIPO: 'mecanismo_real', PROYECTO: 'Engremiat-nucleo', ESTADO: 'vigente', TEMA: 'Campo PROCESANDO_DESDE + nodo de bloqueo entre busqueda de pendientes y sintesis. Recupera solos tras 10 min si algo se cuelga.', HUECO_DETECTADO: 'Probado con una carrera real (dos disparos simultaneos, cada uno cogio un elemento distinto). No cubre fabricacion de contenido, solo evita procesar el mismo elemento dos veces.' },
  { NOMBRE: 'Verificador determinista de campos Baserow', TIPO: 'mecanismo_real', PROYECTO: 'Engremiat-nucleo', ESTADO: 'vigente', TEMA: 'Compara candidatos de campo/tabla en una respuesta de Concilio contra el esquema real de Baserow, acotado por tabla relevante (campo TABLA_RELEVANTE).', HUECO_DETECTADO: 'Solo detecta nombres de campo/tabla inventados. NO detecta afirmaciones de capacidad/arquitectura inventadas (ej. decir que existe sincronizacion en tiempo real cuando no existe). Tampoco detecta campos reales de una sola palabra (INC-0067).' },
  { NOMBRE: 'Acervo Prompter', TIPO: 'mecanismo_real', PROYECTO: 'Engremiat-nucleo', ESTADO: 'vigente', TEMA: 'Convierte una necesidad vaga + contexto real en una pregunta de Vigilia estructurada (meta-prompting), motor DeepSeek.', HUECO_DETECTADO: 'Probado una vez con un caso real (INC-0067). No probado a escala.' },
  { NOMBRE: 'Backup automatico VPS-Pi', TIPO: 'mecanismo_real', PROYECTO: 'Engremiat-nucleo', ESTADO: 'vigente', TEMA: 'Cron en el VPS que espera a que la Pi arranque, empaqueta volumenes Docker, envia por rsync/Tailscale, y apaga la Pi el mismo al terminar.', HUECO_DETECTADO: 'Probado en vivo, ciclo completo en 45s. Sin rotacion de backups antiguos.' },
  { NOMBRE: 'Webhook apagar-pi-webhook', TIPO: 'mecanismo_real', PROYECTO: 'Engremiat-nucleo', ESTADO: 'vigente', TEMA: 'Servicio systemd en el VPS, atado a Tailscale, dispara el apagado seguro de la Pi con una peticion GET desde el movil.', HUECO_DETECTADO: 'Ninguno detectado, probado varias veces con exito.' },
  { NOMBRE: 'Webhook despertar-pc-webhook', TIPO: 'mecanismo_real', PROYECTO: 'Engremiat-nucleo', ESTADO: 'vigente', TEMA: 'Servicio systemd en el VPS que envia el paquete magico WoL al PC operador via la Pi.', HUECO_DETECTADO: 'Probado de extremo a extremo con exito por el promotor.' },
  { NOMBRE: 'Migracion Baserow Pi-VPS', TIPO: 'mecanismo_real', PROYECTO: 'Engremiat-nucleo', ESTADO: 'vigente', TEMA: 'Volcado real del volumen de Baserow de la Pi al VPS, verificado con datos reales (VIGILIA_TAREA con filas reales tras la migracion).', HUECO_DETECTADO: 'Es una foto puntual, no sincronizacion continua -- Pi y VPS pueden divergir si ambos reciben escrituras.' },
  { NOMBRE: 'Puente Claude a 13_INCIDENCIAS', TIPO: 'mecanismo_real', PROYECTO: 'Engremiat-nucleo', ESTADO: 'vigente', TEMA: 'Protocolo (no automatizado): Claude registra hallazgos validados del laboratorio Baserow como incidencias reales en el Sheet, siguiendo PROMPT_EJECUTOR.md (el Ejecutor no tiene escritura en Sheets).', HUECO_DETECTADO: 'Probado una vez (INC-0067). Manual, no un pipeline automatico.' },
  { NOMBRE: 'DOCUMENTO_ENGREMIAT + vault Obsidian', TIPO: 'mecanismo_real', PROYECTO: 'Engremiat-nucleo', ESTADO: 'vigente', TEMA: 'Tabla Baserow que cataloga documentos y (desde ahora) mecanismos reales, con notas de Obsidian generadas desde ahi como vista de solo lectura.', HUECO_DETECTADO: 'Plugins de LLM local (Smart Connections, Copilot) sin instalar todavia.' },
  { NOMBRE: 'OLLAMA_NUM_PARALLEL=2', TIPO: 'mecanismo_real', PROYECTO: 'Engremiat-nucleo', ESTADO: 'vigente', TEMA: 'Variable de entorno que permite al worker local procesar 2 generaciones simultaneas en la misma GPU.', HUECO_DETECTADO: 'Confirmado con una prueba real de dos ejecuciones simultaneas correctas. No probado con mas de 2 en paralelo.' },
];

async function main() {
  // Marcar las 46 filas existentes como 'documento' si TIPO esta vacio
  const r = await fetch(BASE + '/api/database/rows/table/' + TABLA + '/?user_field_names=true&size=200', { headers: { Authorization: TOKEN } });
  const j = await r.json();
  let actualizados = 0;
  for (const row of j.results) {
    if (row.NOMBRE && !row.TIPO) {
      await fetch(BASE + '/api/database/rows/table/' + TABLA + '/' + row.id + '/?user_field_names=true', {
        method: 'PATCH', headers: { Authorization: TOKEN, 'Content-Type': 'application/json' },
        body: JSON.stringify({ TIPO: 'documento' })
      });
      actualizados++;
    }
  }
  console.log('filas existentes marcadas documento:', actualizados);

  for (const m of mecanismos) {
    const body = { ...m, SUPERADO_POR: '' };
    const resp = await fetch(BASE + '/api/database/rows/table/' + TABLA + '/?user_field_names=true', {
      method: 'POST', headers: { Authorization: TOKEN, 'Content-Type': 'application/json' }, body: JSON.stringify(body)
    });
    console.log(m.NOMBRE, resp.status);
    if (resp.status >= 300) console.log(await resp.text());
  }
}
main();
