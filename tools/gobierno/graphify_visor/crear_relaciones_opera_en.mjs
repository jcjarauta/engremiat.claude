#!/usr/bin/env node
/*
 * Las 13 aristas reales "opera_en" que faltaban (§8.33): de 19 Personajes
 * reales (sin contar Concilio), solo 5 respondian ya la pregunta "¿Donde?"
 * -- estas 13 cierran esa pregunta para el nucleo de Concilio y los dos
 * casos de Guardia/frontera con evidencia real ya escrita en otra ficha
 * (nunca inventada de cero). Pregonero/Narrador/Verificador de
 * Capacidades se quedan sin una -- honestamente, no hay todavia un
 * espacio real al que apunten.
 *
 * Mismo patron real que 07_Holon_Relaciones/ ya usa: frontmatter
 * title/tipo:relacion/tags/tipo_relacion/origen/estado/universo/publish +
 * cuerpo "# [[origen]] opera_en [[destino]]" + "## Por que".
 *
 * Uso: node crear_relaciones_opera_en.mjs [--aplicar]
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const RUTA_RELACIONES = 'G:\\Mi unidad\\engremiat.claude\\Obsidian-Engremiat\\Universos\\Engremiat\\07_Holon_Relaciones';

const RELACIONES = [
  { origen: 'Concilio', destino: 'Telar', porque: 'Telar.md ya lo dice: "Dentro de este espacio operan Concilio, los Acervos y Vigilia".' },
  { origen: 'Acervo Tecnico', destino: 'Telar', porque: 'Delibera dentro de Concilio, que opera dentro de Telar -- mismo taller real.' },
  { origen: 'Acervo Logico', destino: 'Telar', porque: 'Delibera dentro de Concilio, que opera dentro de Telar -- mismo taller real.' },
  { origen: 'Acervo Logistico', destino: 'Telar', porque: 'Delibera dentro de Concilio, que opera dentro de Telar -- mismo taller real.' },
  { origen: 'Acervo Narrativo', destino: 'Telar', porque: 'Delibera dentro de Concilio, que opera dentro de Telar -- mismo taller real.' },
  { origen: 'Acervo Filosofico', destino: 'Telar', porque: 'Delibera dentro de Concilio, que opera dentro de Telar -- mismo taller real.' },
  { origen: 'Acervo Usuario', destino: 'Telar', porque: 'Delibera dentro de Concilio, que opera dentro de Telar -- mismo taller real.' },
  { origen: 'Acervo Sociocracia', destino: 'Telar', porque: 'Delibera dentro de Concilio, que opera dentro de Telar -- mismo taller real.' },
  { origen: 'Acervo Prompter', destino: 'Telar', porque: 'Su propia ficha ya lo dice: "trabaja antes que ellos" -- antes de Concilio, dentro del mismo Telar.' },
  { origen: 'Coordinador', destino: '92_BUS_TRABAJO', porque: 'Coordinador.md ya lo dice: "el bus de eventos que reparte tareas entre DeepSeek, Claude... es la encarnación operativa de este mismo personaje, funcionando hoy mismo sobre datos reales".' },
  { origen: 'Relevo', destino: '92_BUS_TRABAJO', porque: 'Coordinador alimenta_a Relevo (relación real ya existente) sobre el mismo bus de eventos real.' },
  { origen: 'Verificador de Campos', destino: 'Baserow', porque: 'tools/verificador_determinista.mjs (su vinculoReal) "comprueba afirmaciones de campo de Baserow contra el esquema real".' },
  { origen: 'Acervo Usuario', destino: 'Zona de aterrizaje STG', porque: 'Su propio vinculoReal (src/PlantillaImportacionMasivaService.js) ya conecta este Acervo con la zona de aterrizaje STG y el mecanismo de escenarios.' },
  { origen: 'Verificador de Capacidades', destino: 'DOCUMENTO_ENGREMIAT', porque: 'tools/verificador_capacidades.mjs lo dice en su propio codigo: cargarCatalogoReal() consulta la tabla Baserow 1038 filtrada por TIPO=mecanismo_real -- la misma tabla real que DOCUMENTO_ENGREMIAT.md ya documenta (56 filas: 46 documentos + 10 mecanismos reales). Encontrado investigando el ultimo pendiente (§8.34), no adivinado.' },
];

function slugArchivo(nombre) {
  return nombre.replace(/[\\/:*?"<>|]/g, '').trim();
}

function main() {
  const aplicar = process.argv.includes('--aplicar');
  let nuevas = 0, saltadas = 0;

  for (const r of RELACIONES) {
    const nombreArchivo = `${r.origen} opera_en ${r.destino}`;
    const ruta = join(RUTA_RELACIONES, slugArchivo(nombreArchivo) + '.md');
    if (existsSync(ruta)) { saltadas++; console.log(`YA EXISTE  ${nombreArchivo}.md`); continue; }

    const texto = [
      '---',
      `title: ${nombreArchivo}`,
      'tipo: relacion',
      'tags: [historia]',
      'tipo_relacion: opera_en',
      `origen: "[[${r.origen}]]"`,
      'estado: activo',
      'universo: engremiat',
      'publish: false',
      '---',
      '',
      `# [[${r.origen}]] opera_en [[${r.destino}]]`,
      '',
      '## Por que',
      '',
      r.porque,
      '',
    ].join('\n');

    console.log(`${aplicar ? 'CREAR' : 'DRY-RUN CREAR'}  ${nombreArchivo}.md`);
    nuevas++;
    if (aplicar) writeFileSync(ruta, texto, 'utf-8');
  }

  console.log(`\n=== Resultado ===`);
  console.log(`${nuevas} relación(es) ${aplicar ? 'creadas de verdad' : 'listas para crear'}, ${saltadas} ya existían.`);
  if (!aplicar) console.log('(DRY-RUN -- añade --aplicar para escribir de verdad en la bóveda.)');
}

main();
