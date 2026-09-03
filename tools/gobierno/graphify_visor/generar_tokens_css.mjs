// Genera tokens.css a partir de design-tokens.json (§8.47) -- equivalente real, sin dependencia
// npm, a lo que haria Style Dictionary: JSON DTCG -> variables CSS reales. Deliberadamente
// pequeno y sin paquete externo, mismo criterio que el resto del proyecto (ningun script de
// tools/ instala nada -- solo Node built-in).
//
// Uso: node generar_tokens_css.mjs [--salida <ruta.css>]
import fs from 'fs';
import path from 'path';

const DIR = 'C:/Users/pc/Desktop/engremiat.claude/tools/gobierno/graphify_visor';

function leerArgs() {
  const args = process.argv.slice(2);
  let salida = path.join(DIR, 'tokens.css');
  for (let i = 0; i < args.length; i++) if (args[i] === '--salida') salida = args[++i];
  return { salida };
}

const tokens = JSON.parse(fs.readFileSync(path.join(DIR, 'design-tokens.json'), 'utf8'));

const lineas = [];
function recorrer(nodo, ruta) {
  if (nodo && typeof nodo === 'object' && '$value' in nodo) {
    const nombreVar = '--' + ruta.join('-');
    lineas.push(`  ${nombreVar}: ${nodo.$value};`);
    return;
  }
  if (nodo && typeof nodo === 'object') {
    for (const [clave, valor] of Object.entries(nodo)) {
      if (clave.startsWith('$')) continue; // metadato DTCG, no es un token
      recorrer(valor, [...ruta, clave]);
    }
  }
}
recorrer(tokens, []);

const { salida } = leerArgs();
const css = `/* Generado real desde design-tokens.json por generar_tokens_css.mjs -- no editar a mano, */
/* editar el JSON y volver a correr este script. §8.47. */
:root {
${lineas.join('\n')}
}
`;
fs.writeFileSync(salida, css);
console.log(`${lineas.length} tokens reales exportados a CSS.`);
console.log('Escrito en: ' + salida);
