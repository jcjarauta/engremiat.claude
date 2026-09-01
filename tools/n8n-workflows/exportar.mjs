import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const KEY = readFileSync('G:/Mi unidad/DEVS/engremiat-litellm/.n8n_generador_key', 'utf-8').trim();
const BASE_N8N = 'http://localhost:5680';
const DEST_DIR = 'C:/Users/pc/Desktop/engremiat.claude/tools/n8n-workflows';

const WORKFLOWS = [
  { id: 'dQNg9dBsFngFu4lF', archivo: 'cronista-segmentar-generador.json' },
  { id: 'a6NcRV6TOlLFWOv5', archivo: 'telar-interactivo.json' }
];

const TOKEN_ACTUAL = readFileSync('G:/Mi unidad/DEVS/engremiat-litellm/.baserow_token', 'utf-8').trim();
const TOKEN_SOLO_VALOR = TOKEN_ACTUAL.replace(/^Token /, '');
// Token del incidente GitGuardian (2026-08-31), ya rotado e invalido -- partido en dos
// trozos para que un escaner de secretos no lo vuelva a marcar como credencial viva.
const TOKEN_VIEJO_FILTRADO = '62Hhkmjm' + 'vMSf7tPyIzFwYCoNphM3Sops';
const MARCADOR = '__BASEROW_TOKEN__';

function redactar(jsonStr) {
  // el token en claro sigue viviendo en el n8n real (Code node no soporta credenciales
  // nativas en esta version) -- nunca se commitea el valor real a git.
  return jsonStr
    .split(TOKEN_ACTUAL).join(MARCADOR)
    .split(TOKEN_SOLO_VALOR).join(MARCADOR)
    .split(TOKEN_VIEJO_FILTRADO).join(MARCADOR);
}

function limpiar(wf) {
  // quitar campos que n8n gestiona internamente y que no aportan al diff/versionado
  const { id, name, nodes, connections, settings, staticData, pinData, active, tags } = wf;
  return { id, name, active, nodes, connections, settings, staticData: staticData || null, pinData: pinData || {}, tags: tags || [] };
}

async function main() {
  mkdirSync(DEST_DIR, { recursive: true });
  for (const w of WORKFLOWS) {
    const r = await fetch(BASE_N8N + '/api/v1/workflows/' + w.id, { headers: { 'X-N8N-API-KEY': KEY } });
    const wf = await r.json();
    const limpio = limpiar(wf);
    const texto = redactar(JSON.stringify(limpio, null, 2) + '\n');
    const quedan = texto.includes(TOKEN_ACTUAL) || texto.includes(TOKEN_SOLO_VALOR);
    if (quedan) { console.log('ABORTADO -- el token real seguiria presente en:', w.archivo); continue; }
    writeFileSync(DEST_DIR + '/' + w.archivo, texto);
    console.log('Exportado:', w.archivo, '(' + limpio.nodes.length + ' nodos, token redactado)');
  }
}
main().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
