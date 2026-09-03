#!/usr/bin/env node
/*
 * Dos grafos reales del Sheet, construidos desde datos_sheet_real.json
 * (ya leido en real via Sheets API en esta sesion -- 91_HISTORIAL,
 * 01_CAMPANAS...06_TAREAS). Ver PROPUESTA_BASTIDOR_GESTOR_PROYECTOS_
 * ENGREMIAT.md §8.22.
 *
 * 1. grafo_historial.json -- agrupa 91_HISTORIAL por CORRELATION_ID real:
 *    cada operacion real conecta a las entidades reales que toco de
 *    golpe. Responde "que paso cuando" con el dato real, no reconstruido.
 * 2. grafo_jerarquia.json -- arbol real Campaña->Proyecto->Producto->
 *    Proceso->Tarea, via las FK reales (CAMPANA_ID, PROYECTO_ID...).
 *
 * Solo lectura de un fichero local ya generado -- no llama a ninguna API.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const DIR = import.meta.dirname;
const datos = JSON.parse(readFileSync(join(DIR, 'datos_sheet_real.json'), 'utf-8'));

function construirHistorial() {
  const nodos = [];
  const aristas = [];
  const entidadesVistas = new Set();
  const porCorr = new Map();
  for (const h of datos.historial) {
    if (!porCorr.has(h.corr)) porCorr.set(h.corr, []);
    porCorr.get(h.corr).push(h);
  }
  for (const [corr, filas] of porCorr) {
    const idOp = 'op:' + corr;
    nodos.push({ id: idOp, tipo: 'operacion', nombre: filas[0].accion, ts: filas[0].ts, n: filas.length });
    for (const f of filas) {
      const idEnt = 'ent:' + f.entidad + ':' + f.registro;
      if (!entidadesVistas.has(idEnt)) { nodos.push({ id: idEnt, tipo: 'entidad', nombre: f.registro, entidad: f.entidad }); entidadesVistas.add(idEnt); }
      aristas.push({ source: idOp, target: idEnt });
    }
  }
  return { generadoEn: new Date().toISOString(), nodos, aristas };
}

function construirJerarquia() {
  const nodos = [];
  const aristas = [];
  for (const c of datos.campanas) nodos.push({ id: 'CAM:' + c.id, tipo: 'campana', nombre: c.nombre });
  for (const p of datos.proyectos) { nodos.push({ id: 'PRO:' + p.id, tipo: 'proyecto', nombre: p.nombre }); aristas.push({ source: 'CAM:' + p.campanaId, target: 'PRO:' + p.id }); }
  for (const pr of datos.productos) nodos.push({ id: 'PRD:' + pr.id, tipo: 'producto', nombre: pr.nombre });
  for (const pp of datos.proyectoProducto) aristas.push({ source: 'PRO:' + pp.proyectoId, target: 'PRD:' + pp.productoId });
  for (const pc of datos.procesos) { nodos.push({ id: 'PCS:' + pc.id, tipo: 'proceso', nombre: pc.nombre }); aristas.push({ source: 'PRD:' + pc.productoId, target: 'PCS:' + pc.id }); }
  for (const t of datos.tareas) { nodos.push({ id: 'TAR:' + t.id, tipo: 'tarea', nombre: t.nombre }); aristas.push({ source: 'PCS:' + t.procesoId, target: 'TAR:' + t.id }); }
  return { generadoEn: new Date().toISOString(), nodos, aristas };
}

const historial = construirHistorial();
writeFileSync(join(DIR, 'grafo_historial.json'), JSON.stringify(historial, null, 2));
console.log(`grafo_historial.json -- ${historial.nodos.filter(n=>n.tipo==='operacion').length} operaciones reales, ${historial.nodos.filter(n=>n.tipo==='entidad').length} entidades reales, ${historial.aristas.length} aristas.`);

const jerarquia = construirJerarquia();
writeFileSync(join(DIR, 'grafo_jerarquia.json'), JSON.stringify(jerarquia, null, 2));
console.log(`grafo_jerarquia.json -- ${jerarquia.nodos.length} nodos reales (Campaña→Proyecto→Producto→Proceso→Tarea), ${jerarquia.aristas.length} aristas.`);
