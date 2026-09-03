// Puente de datos real (§8.47): convierte anatomia_entidades.json (grafo en bruto, pensado
// para calcular) en atlas_familias.json (datos ya aplanados, pensados para dibujar) -- ninguna
// herramienta grafica deberia tener que entender cabezas/columnas/aristas para pintar una
// constelacion de familias. Mismo principio que ya aplicamos en todo el proyecto: nunca mezclar
// la fuente de verdad con su vista.
//
// Un mismo personaje puede aparecer en mas de una familia si de verdad juega ese rol en mas
// de una fuente real (ej. Cliente es Compositor en Node y Esquema dependiente en Sheet/Baserow)
// -- no se fuerza a una sola familia por entidad, eso seria inventar una identidad unica donde
// el propio dato real dice que hay varias.
//
// Uso: node exportar_atlas_familias.mjs [--salida <ruta.json>]
import fs from 'fs';
import path from 'path';

const DIR = 'C:/Users/pc/Desktop/engremiat.claude/tools/gobierno/graphify_visor';

function leerArgs() {
  const args = process.argv.slice(2);
  let salida = path.join(DIR, 'atlas_familias.json');
  for (let i = 0; i < args.length; i++) if (args[i] === '--salida') salida = args[++i];
  return { salida };
}

const anatomia = JSON.parse(fs.readFileSync(path.join(DIR, 'anatomia_entidades.json'), 'utf8'));
const censo = JSON.parse(fs.readFileSync(path.join(DIR, 'censo_entidades.json'), 'utf8'));
const wikilinks = JSON.parse(fs.readFileSync(path.join(DIR, 'grafo_wikilinks.json'), 'utf8'));
const holon = JSON.parse(fs.readFileSync(path.join(DIR, 'grafo_holon.json'), 'utf8'));

const censoPorSlug = new Map(censo.entidades.map(e => [e.slug, e]));
const tipoPorSlug = new Map(wikilinks.nodos.map(n => [n.id, n.tipo]));
const equipoPorSlug = new Map(holon.nodos.filter(n => n.equipo).map(n => [n.id, n.equipo]));

function slugify(s) {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
}

// -- una entrada por (entidad, familia) real -- si dos fuentes de la misma entidad caen en la
// misma familia, se fusionan en una sola entrada (mismo miembro, no duplicado); si caen en
// familias distintas, la entidad aparece en cada una, honesto sobre sus varios roles reales --
const miembroPorFamiliaYSlug = new Map(); // "rol|slug" -> miembro

Object.entries(anatomia.entidades).forEach(([slug, e]) => {
  const c = censoPorSlug.get(slug);
  e.fuentes.forEach(f => {
    const clave = f.rol + '|' + slug;
    const existente = miembroPorFamiliaYSlug.get(clave);
    const tamanoCuerpo = f.nodos.length;
    if (existente) {
      existente.tamanoCuerpo = Math.max(existente.tamanoCuerpo, tamanoCuerpo);
      existente.agenciaReal = Math.max(existente.agenciaReal, f.agenciaReal);
      if (!existente.fuentes.includes(f.tipo)) existente.fuentes.push(f.tipo);
      return;
    }
    miembroPorFamiliaYSlug.set(clave, {
      nombre: e.nombre,
      slug,
      tipo: tipoPorSlug.get(slug) || null,
      equipo: equipoPorSlug.get(slug) || null,
      fuentes: [f.tipo],
      agenciaReal: f.agenciaReal,
      territorioPropio: f.territorioPropio ?? null,
      tamanoCuerpo,
      corroboracionCruzada: c ? c.corroboracionCruzada : null,
      centralidad: c ? c.centralidad : null,
    });
  });
});

const familiasMap = new Map();
miembroPorFamiliaYSlug.forEach((miembro, clave) => {
  const rol = clave.split('|')[0];
  if (!familiasMap.has(rol)) familiasMap.set(rol, []);
  familiasMap.get(rol).push(miembro);
});

const familias = [...familiasMap.entries()]
  .map(([rol, miembros]) => ({
    rol, slug: slugify(rol),
    miembros: miembros.sort((a, b) => b.agenciaReal - a.agenciaReal),
  }))
  .sort((a, b) => b.miembros.length - a.miembros.length);

const { salida } = leerArgs();
const out = {
  generadoEn: new Date().toISOString(),
  totalFamilias: familias.length,
  totalApariciones: [...miembroPorFamiliaYSlug.values()].length,
  familias,
};
fs.writeFileSync(salida, JSON.stringify(out, null, 1));

console.log('=== Atlas de familias real ===');
console.log(`${familias.length} familias reales, ${out.totalApariciones} apariciones de entidad (una entidad puede estar en varias familias si de verdad juega varios roles reales).`);
familias.forEach(f => console.log(`- ${f.rol}: ${f.miembros.length} miembros`));
console.log('Escrito en: ' + salida);
