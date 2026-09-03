// Mapea los ciclos reales de Engremiat, encontrados por revision completa (§8.49):
// 10 mecanismos de ciclo reales, de naturaleza distinta -- nunca forzados a un solo
// esquema. Deja fuera a proposito los "bucles estructurales" (ciclos de teoria de
// grafos encontrados por Tarjan/DFS en el censo, §8.23): esos no son procesos que
// se repiten en el tiempo, son dependencias circulares en el codigo -- ya viven en
// censo_entidades.json, meterlos aqui inventaria una recurrencia temporal que no
// existe.
//
// naturaleza real de cada Cycle:
//   jerarquia  -- anidamiento real (parentCycle), no temporal
//   ciclo_vida -- maquina de estados real, con ramas y reintentos reales
//   plantilla  -- patron reutilizable, no un ciclo concreto (otros lo instancian)
//   operativo  -- disparo->accion->verificacion->repeticion, sin jerarquia
//   fisico     -- infraestructura, no negocio
//
// Uso: node mapear_ciclos_reales.mjs [--salida <ruta.json>]
import fs from 'fs';
import path from 'path';

const DIR = 'C:/Users/pc/Desktop/engremiat.claude/tools/gobierno/graphify_visor';
const RAIZ = 'C:/Users/pc/Desktop/engremiat.claude';

function leerArgs() {
  const args = process.argv.slice(2);
  let salida = path.join(DIR, 'ciclos_reales.json');
  for (let i = 0; i < args.length; i++) if (args[i] === '--salida') salida = args[++i];
  return { salida };
}

const telarEstados = JSON.parse(fs.readFileSync(path.join(DIR, 'grafo_telar_estados.json'), 'utf8'));
const anatomia = JSON.parse(fs.readFileSync(path.join(DIR, 'anatomia_entidades.json'), 'utf8'));

// -- 1. jerarquia: escala real de negocio, via ENTIDADES_MVP (src/Ids.js) --
// el propio numero de pestana (01,02,03,05,06) ya es la convencion real de orden
// upstream->downstream, la misma que uso extraer_anatomia_entidad.mjs para las FK
const idsJs = fs.readFileSync(path.join(RAIZ, 'src/Ids.js'), 'utf8');
const HOJA_POR_CLAVE = new Map(
  [...idsJs.match(/const ENTIDADES_MVP = Object\.freeze\(\{[\s\S]*?\n\}\);/)[0].matchAll(/\n  (\w+): Object\.freeze\(\{\s*hoja:\s*'([^']+)'/g)]
    .map(m => [m[1], m[2]])
);
const CADENA_JERARQUIA = ['CAMPANA', 'PROYECTO', 'PROYECTO_PRODUCTO', 'PRODUCTO', 'PROCESO', 'TAREA'];
const jerarquiaNegocio = {
  id: 'jerarquia_negocio', nombre: 'Campaña → Proyecto → Producto → Proceso → Tarea',
  naturaleza: 'jerarquia',
  fuente: 'src/Ids.js (ENTIDADES_MVP) -- orden real por numero de hoja: 01,02,04,03,05,06',
  fases: CADENA_JERARQUIA.filter(c => HOJA_POR_CLAVE.has(c)).map((clave, i, arr) => ({
    id: clave.toLowerCase(), nombre: clave, hoja: HOJA_POR_CLAVE.get(clave),
    parentCycle: i > 0 ? arr[i - 1].toLowerCase() : null,
  })),
};

// -- 2. ciclo_vida: Mision real (14 estados, B0), y ejecucion real de un workflow n8n --
const cicloVidaMision = {
  id: 'ciclo_vida_mision', nombre: 'Ciclo de vida de una Misión', naturaleza: 'ciclo_vida',
  fuente: 'grafo_telar_estados.json, validado en B0',
  instanciaDe: 'plantilla_telar',
  fases: telarEstados.nodos.map(n => ({ id: n.id, nombre: n.nombre, esMVP: n.esMVP ?? null })),
  transiciones: telarEstados.aristas.map(a => ({ source: a.source, target: a.target })),
  notas: telarEstados.notas || {},
};

function cicloVidaWorkflow(nombreEntidad) {
  const e = Object.values(anatomia.entidades).find(x => x.nombre === nombreEntidad);
  if (!e) return null;
  const f = e.fuentes.find(x => x.tipo === 'n8n');
  if (!f) return null;
  const idANombre = new Map(f.nodos.map(n => [n.id, n.nombre]));
  return {
    id: 'ciclo_vida_workflow_' + nombreEntidad.toLowerCase(),
    nombre: 'Ejecución real del workflow de ' + nombreEntidad, naturaleza: 'ciclo_vida',
    fuente: 'anatomia_entidades.json -- columna real (espina) de la fuente n8n',
    fases: f.espina.map(id => ({ id, nombre: (idANombre.get(id) || id).split('::').pop() })),
  };
}
const cicloVidaCronista = cicloVidaWorkflow('Cronista');

// -- 3. plantilla: el ciclo de trabajo del Telar, citado literalmente de su propia ficha --
const plantillaTelar = {
  id: 'plantilla_telar', nombre: 'Ciclo de trabajo del Telar', naturaleza: 'plantilla',
  fuente: 'Telar.md -- "Cuatro ciclos reales, validados dos veces, domain-agnostic"',
  fases: [
    { id: 'urdimbre', nombre: 'Urdimbre' },
    { id: 'trama', nombre: 'Trama' },
    { id: 'hilo_conductor', nombre: 'Hilo conductor' },
    { id: 'parte_de_vigilia_relevo', nombre: 'Parte de Vigilia/Relevo' },
  ],
};

// -- 4. operativo: disparo->accion->verificacion->repeticion --
const cicloAutonomo = {
  id: 'ciclo_autonomo', nombre: 'Ciclo autónomo de Vigilia', naturaleza: 'operativo',
  fuente: 'tools/ciclo_autonomo.mjs (comentario real de cabecera)',
  fases: [
    { id: 'disparar', nombre: 'Disparar webhook de Vigilia' },
    { id: 'esperar', nombre: 'Esperar' },
    { id: 'comprobar', nombre: 'Comprobar antigüedad real del lock en Baserow' },
    { id: 'limpiar', nombre: 'Limpiar solo los locks realmente estancados' },
    { id: 'reintentar', nombre: 'Reintentar hasta procesado o límite de tiempo' },
    { id: 'cerrar', nombre: 'Exportar resultados y llamar al Coordinador' },
  ],
};

const cicloAuditoria = {
  id: 'ciclo_auditoria', nombre: 'Ciclo de auditoría Engremiat', naturaleza: 'operativo',
  fuente: 'CICLO_AUDITORIA_ENGREMIAT.md',
  fases: [
    { id: 'codigo', nombre: 'Fase 1 -- Código' },
    { id: 'integracion', nombre: 'Fase 2 -- Integración entre módulos' },
    { id: 'comportamiento', nombre: 'Fase 3 -- Comportamiento con datos simulados' },
    { id: 'diseno', nombre: 'Fase 4 -- Diseño' },
    { id: 'triage', nombre: 'Triage común (después de las 4 fases)' },
  ],
};

const cicloFabricacion = {
  id: 'ciclo_fabricacion', nombre: 'Métrica de fabricación del Coordinador', naturaleza: 'operativo',
  fuente: 'Coordinador.md -- Baserow: METRICA_FABRICACION, agregado real de 99_TRIAGE_LOCAL',
  fases: [
    { id: 'total_respuestas', nombre: 'TOTAL_RESPUESTAS' },
    { id: 'corregidas_con_exito', nombre: 'CORREGIDAS_CON_EXITO' },
    { id: 'correccion_fallida_a_relevo', nombre: 'CORRECCION_FALLIDA_A_RELEVO' },
    { id: 'tasa_fabricacion', nombre: 'TASA_FABRICACION' },
  ],
};

const cicloCenso = {
  id: 'ciclo_censo', nombre: 'El propio censo del universo', naturaleza: 'operativo',
  fuente: 'PROPUESTA_BASTIDOR_GESTOR_PROYECTOS_ENGREMIAT.md -- "el ciclo que motivó todo el ejercicio"',
  fases: [
    { id: 'dato_real', nombre: 'Dato real' },
    { id: 'hueco_real', nombre: 'Hueco real' },
    { id: 'ficha_real', nombre: 'Ficha real' },
  ],
};

// -- 5. fisico: infraestructura, no negocio --
const cicloVidaRemoto = {
  id: 'ciclo_vida_remoto', nombre: 'El ciclo de vida remoto', naturaleza: 'fisico',
  fuente: 'El ciclo de vida remoto.md -- mismos IDs reales que usa Mensajero.md',
  fases: [
    { id: 'despertar', nombre: 'despertar-pc-webhook' },
    { id: 'operar', nombre: 'Operar' },
    { id: 'apagar', nombre: 'apagar-pi-webhook' },
  ],
};

const ciclos = [
  jerarquiaNegocio, cicloVidaMision, cicloVidaCronista, plantillaTelar,
  cicloAutonomo, cicloAuditoria, cicloFabricacion, cicloCenso, cicloVidaRemoto,
].filter(Boolean);

const { salida } = leerArgs();
const out = { generadoEn: new Date().toISOString(), totalCiclos: ciclos.length, ciclos };
fs.writeFileSync(salida, JSON.stringify(out, null, 1));

console.log('=== Ciclos reales de Engremiat (§8.49) ===');
console.log(`${ciclos.length} ciclos reales, por naturaleza:`);
const porNaturaleza = {};
ciclos.forEach(c => { porNaturaleza[c.naturaleza] = (porNaturaleza[c.naturaleza] || 0) + 1; });
console.log(porNaturaleza);
ciclos.forEach(c => console.log(`- [${c.naturaleza}] ${c.nombre} (${c.fases.length} fases)`));
console.log('Escrito en: ' + salida);
