import { useEffect, useState } from 'react'
import { Tldraw } from 'tldraw'
import { toRichText } from '@tldraw/tlschema'
import 'tldraw/tldraw.css'
import {
  ESPACIOS_REALES, REFERENCIAS_REALES, RELACIONES_REALES,
  CAPAS, VARIABILIDADES, TIPOS_RELACION, FAMILIAS_RELACION, LEYENDA_FIGURAS,
} from './datosNucleoReal'
import universoReal from './universo_real.json'
import './bocetador.css'

const W_ESPACIO = 260
const H_ESPACIO = 140
const W_REF = 200
const H_REF = 80

function centro(nodo, esReferencia) {
  const w = esReferencia ? W_REF : W_ESPACIO
  const h = esReferencia ? H_REF : H_ESPACIO
  return { x: nodo.x + w / 2, y: nodo.y + h / 2 }
}

// Crea una flecha real LIGADA a sus dos cajas (editor.createBindings, tipo
// 'arrow') -- no puntos fijos. Mover la caja de origen o destino mueve la
// flecha con ella, como cualquier flecha nativa de tldraw dibujada a mano.
// Devuelve { shape, bindings } -- el llamador acumula ambos y los crea juntos.
function crearRelacionLigada(id, origenShapeId, destinoShapeId, p1, p2, tipo, nota, extraProps = {}) {
  const arrowId = `shape:${id}`
  return {
    shape: {
      id: arrowId,
      type: 'arrow',
      x: 0,
      y: 0,
      props: { start: { x: p1.x, y: p1.y }, end: { x: p2.x, y: p2.y }, richText: toRichText(tipo), ...extraProps },
      meta: { engremiatType: 'relacion', id, origenId: origenShapeId.replace('shape:', ''), destinoId: destinoShapeId.replace('shape:', ''), tipo, nota: nota || '' },
    },
    bindings: [
      { type: 'arrow', fromId: arrowId, toId: origenShapeId, props: { terminal: 'start', normalizedAnchor: { x: 0.5, y: 0.5 }, isExact: false, isPrecise: false, snap: 'none' } },
      { type: 'arrow', fromId: arrowId, toId: destinoShapeId, props: { terminal: 'end', normalizedAnchor: { x: 0.5, y: 0.5 }, isExact: false, isPrecise: false, snap: 'none' } },
    ],
  }
}

function cargarNucleoReal(editor) {
  const shapes = []

  for (const e of ESPACIOS_REALES) {
    shapes.push({
      id: `shape:${e.id}`,
      type: 'geo',
      x: e.x,
      y: e.y,
      props: {
        geo: 'rectangle',
        w: W_ESPACIO,
        h: H_ESPACIO,
        color: e.capa === 'nucleo' ? 'blue' : 'violet',
        fill: 'semi',
        richText: toRichText(e.nombre),
      },
      meta: {
        engremiatType: 'espacio',
        id: e.id,
        nombre: e.nombre,
        capa: e.capa,
        variabilidad: e.variabilidad,
        proposito: e.proposito,
        resumen: '',
        moduloRequerido: e.moduloRequerido || '',
        gobernadoPor: '',
        estado: e.estado || 'sin_definir',
        vinculoReal: (e.vinculoReal || []).map(v => `${v.sistema}:${v.recordId}`).join(', '),
      },
    })
  }

  for (const r of REFERENCIAS_REALES) {
    shapes.push({
      id: `shape:${r.id}`,
      type: 'geo',
      x: r.x,
      y: r.y,
      props: {
        geo: 'rectangle',
        w: W_REF,
        h: H_REF,
        color: 'grey',
        dash: 'dashed',
        fill: 'none',
        richText: toRichText(r.nombre),
      },
      meta: {
        engremiatType: 'referencia',
        id: r.id,
        nombre: r.nombre,
        nota: r.nota,
      },
    })
  }

  const todos = [...ESPACIOS_REALES.map(e => ({ ...e, ref: false })), ...REFERENCIAS_REALES.map(r => ({ ...r, ref: true }))]
  const porId = Object.fromEntries(todos.map(n => [n.id, n]))

  const bindings = []
  for (const rel of RELACIONES_REALES) {
    const origen = porId[rel.origenId]
    const destino = porId[rel.destinoId]
    if (!origen || !destino) continue
    const p1 = centro(origen, origen.ref)
    const p2 = centro(destino, destino.ref)
    const { shape, bindings: bs } = crearRelacionLigada(rel.id, `shape:${rel.origenId}`, `shape:${rel.destinoId}`, p1, p2, rel.tipo, rel.nota)
    shapes.push(shape)
    bindings.push(...bs)
  }

  editor.createShapes(shapes)
  editor.createBindings(bindings)
  editor.zoomToFit()
}

const COLOR_POR_TIPO = { espacio: 'blue', recurso: 'yellow', modulo: 'red', personaje: 'green', oficio: 'orange', regla: 'grey' }
const COLUMNA_POR_TIPO = { espacio: 0, personaje: 1, recurso: 2, oficio: 3, regla: 4, modulo: 5 }
const ETIQUETA_COLUMNA = { espacio: 'ESPACIOS', personaje: 'PERSONAJES', recurso: 'RECURSOS', oficio: 'OFICIOS', regla: 'REGLAS', modulo: 'MÓDULOS' }
const ANCHO_COLUMNA = 820
const POR_FILA = 3
const W_NODO = 200
const H_NODO = 90
const GAP = 46
const Y_INICIO = 140

function cargarUniversoReal(editor) {
  const grupos = {
    espacio: universoReal.espacios, recurso: universoReal.recursos, modulo: universoReal.modulos,
    personaje: universoReal.personajes, oficio: universoReal.oficios, regla: universoReal.reglas,
  }
  const shapes = []
  const posiciones = {}

  for (const [tipo, nodos] of Object.entries(grupos)) {
    const colX = COLUMNA_POR_TIPO[tipo] * ANCHO_COLUMNA

    shapes.push({
      id: `shape:cabecera_${tipo}`,
      type: 'text',
      x: colX,
      y: 40,
      props: { richText: toRichText(`${ETIQUETA_COLUMNA[tipo]}  (${nodos.length})`), size: 'l', color: COLOR_POR_TIPO[tipo], font: 'sans' },
    })

    nodos.forEach((n, i) => {
      const fila = Math.floor(i / POR_FILA)
      const col = i % POR_FILA
      const x = colX + col * (W_NODO + GAP)
      const y = Y_INICIO + fila * (H_NODO + GAP)
      posiciones[n.id] = { x: x + W_NODO / 2, y: y + H_NODO / 2 }
      shapes.push({
        id: `shape:v_${n.id}`,
        type: 'geo',
        x, y,
        props: { geo: 'rectangle', w: W_NODO, h: H_NODO, color: COLOR_POR_TIPO[tipo], fill: 'semi', richText: toRichText(n.nombre) },
        meta: {
          engremiatType: tipo === 'espacio' ? 'espacio' : 'vaultNode',
          id: n.id, nombre: n.nombre, tipoVault: tipo,
          estado: n.estado, resumen: n.resumen || '',
          capa: 'nucleo', variabilidad: 'configurable', proposito: '', moduloRequerido: '', gobernadoPor: '', vinculoReal: '',
        },
      })
    })
  }

  let sinResolver = 0
  const bindings = []
  for (const rel of universoReal.relaciones) {
    const p1 = posiciones[rel.origenId]
    const p2 = posiciones[rel.destinoId]
    if (!p1 || !p2) { sinResolver++; continue }
    const { shape, bindings: bs } = crearRelacionLigada(
      `vr_${rel.id}`, `shape:v_${rel.origenId}`, `shape:v_${rel.destinoId}`, p1, p2, rel.tipo, '',
      { color: 'grey', size: 's', dash: 'dashed', arrowheadEnd: 'arrow' },
    )
    shape.opacity = 0.6
    shapes.push(shape)
    bindings.push(...bs)
  }

  editor.createShapes(shapes)
  editor.createBindings(bindings)
  editor.zoomToFit()
  return { total: shapes.length, sinResolver }
}

function nuevoIdRelativo(prefijo) {
  return `${prefijo}_${Math.random().toString(36).slice(2, 8)}`
}

function PanelEspacio({ editor, shape }) {
  const m = shape.meta
  const set = (campo, valor) => {
    const meta = { ...m, [campo]: valor }
    editor.updateShapes([{ id: shape.id, type: shape.type, meta }])
    if (campo === 'nombre') {
      editor.updateShapes([{ id: shape.id, type: shape.type, props: { richText: toRichText(valor || '(sin nombre)') } }])
    }
  }
  return (
    <div className="panel-form">
      <h3>Espacio</h3>
      <p className="hint">Campos ordenados por las 8 preguntas reales de <code>00_Mapa.md</code> (Qué/Quién/Dónde/Con qué/Cuándo/Cómo/Cuánto/Por qué) -- espejo del front-matter real de <code>01_Mundo/Espacios/*.md</code>, no un formulario aparte.</p>

      <span className="pregunta-etiqueta">Qué</span>
      <label>Nombre
        <input value={m.nombre || ''} onChange={e => set('nombre', e.target.value)} />
      </label>
      <label>Resumen (espejo del cuerpo real de la ficha .md)
        <textarea rows={3} value={m.resumen || ''} onChange={e => set('resumen', e.target.value)} />
      </label>

      <span className="pregunta-etiqueta">Por qué</span>
      <label>Propósito -- para qué sirve, no qué es
        <textarea rows={2} value={m.proposito || ''} onChange={e => set('proposito', e.target.value)} />
      </label>

      <span className="pregunta-etiqueta">Quién</span>
      <label>Gobernado por (leyes reales de 03_Reglas/, separadas por coma)
        <input value={m.gobernadoPor || ''} onChange={e => set('gobernadoPor', e.target.value)} />
      </label>

      <span className="pregunta-etiqueta">Dónde</span>
      <label>Vínculo real (sistema:id, separados por coma -- ej. "Baserow:GASTO_API")
        <input value={m.vinculoReal || ''} onChange={e => set('vinculoReal', e.target.value)} />
      </label>

      <span className="pregunta-etiqueta">Cómo</span>
      <label>Capa
        <select value={m.capa} onChange={e => set('capa', e.target.value)}>
          {CAPAS.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </label>
      <label>Variabilidad
        <select value={m.variabilidad} onChange={e => set('variabilidad', e.target.value)}>
          {VARIABILIDADES.map(v => <option key={v} value={v}>{v}</option>)}
        </select>
      </label>

      <span className="pregunta-etiqueta">Con qué</span>
      <label>Módulo requerido (si es específico)
        <input value={m.moduloRequerido || ''} onChange={e => set('moduloRequerido', e.target.value)} />
      </label>

      <span className="pregunta-etiqueta">Cuándo</span>
      <label>Estado (espejo real del front-matter -- valores vistos: activo, sin_definir)
        <input value={m.estado || ''} onChange={e => set('estado', e.target.value)} />
      </label>
    </div>
  )
}

function PanelRelacion({ editor, shape }) {
  const m = shape.meta
  const set = (campo, valor) => {
    const meta = { ...m, [campo]: valor }
    editor.updateShapes([{ id: shape.id, type: shape.type, meta }])
    if (campo === 'tipo') {
      editor.updateShapes([{ id: shape.id, type: shape.type, props: { richText: toRichText(valor) } }])
    }
  }
  return (
    <div className="panel-form">
      <h3>Relación</h3>
      <label>Tipo
        <select value={m.tipo} onChange={e => set('tipo', e.target.value)}>
          {TIPOS_RELACION.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </label>
      <label>Nota
        <textarea rows={2} value={m.nota || ''} onChange={e => set('nota', e.target.value)} />
      </label>
      <p className="hint">origenId: {m.origenId} · destinoId: {m.destinoId}</p>
    </div>
  )
}

const ETIQUETA_TIPO_VAULT = { personaje: 'Personaje', oficio: 'Oficio', regla: 'Regla', recurso: 'Recurso', modulo: 'Módulo' }

function PanelNodoVault({ editor, shape }) {
  const m = shape.meta
  const set = (campo, valor) => {
    const meta = { ...m, [campo]: valor }
    editor.updateShapes([{ id: shape.id, type: shape.type, meta }])
    if (campo === 'nombre') {
      editor.updateShapes([{ id: shape.id, type: shape.type, props: { richText: toRichText(valor || '(sin nombre)') } }])
    }
  }
  return (
    <div className="panel-form">
      <h3>{ETIQUETA_TIPO_VAULT[m.tipoVault] || 'Nodo de la bóveda'}</h3>
      <p className="hint">Tomado de la bóveda real (02_Personajes/, 08_Oficios/ o 03_Reglas/) -- sin contrato JSON formal todavía, solo Espacio y Relación lo tienen (§8.2). Estado en el vault: {m.estado}.</p>
      <label>Nombre
        <input value={m.nombre || ''} onChange={e => set('nombre', e.target.value)} />
      </label>
      <label>Resumen
        <textarea rows={4} value={m.resumen || ''} onChange={e => set('resumen', e.target.value)} />
      </label>
    </div>
  )
}

function PanelConvertir({ editor, shape }) {
  const convertirEspacio = () => {
    editor.updateShapes([{
      id: shape.id, type: shape.type,
      meta: {
        engremiatType: 'espacio', id: nuevoIdRelativo('espacio'),
        nombre: 'Nuevo espacio', capa: 'nucleo', variabilidad: 'configurable',
        proposito: '', moduloRequerido: '', gobernadoPor: '',
      },
      props: { richText: toRichText('Nuevo espacio') },
    }])
  }
  const convertirRelacion = () => {
    editor.updateShapes([{
      id: shape.id, type: shape.type,
      meta: {
        engremiatType: 'relacion', id: nuevoIdRelativo('relacion'),
        origenId: '(arrastra sobre un Espacio de origen)', destinoId: '(arrastra sobre un Espacio de destino)',
        tipo: TIPOS_RELACION[0], nota: '',
      },
      props: { richText: toRichText(TIPOS_RELACION[0]) },
    }])
  }
  return (
    <div className="panel-form">
      <h3>Caja sin marcar</h3>
      <p className="hint">Esto todavía no es un Espacio ni una Relación real del contrato.</p>
      {shape.type === 'geo' && <button onClick={convertirEspacio}>Convertir en Espacio</button>}
      {shape.type === 'arrow' && <button onClick={convertirRelacion}>Convertir en Relación</button>}
      {shape.type !== 'geo' && shape.type !== 'arrow' && <p className="hint">Solo los rectángulos y las flechas se pueden convertir.</p>}
    </div>
  )
}

function exportar(editor) {
  const shapes = editor.getCurrentPageShapes()
  const espacios = []
  const relaciones = []
  const otrosNodos = []
  const errores = []

  for (const s of shapes) {
    const m = s.meta || {}
    if (m.engremiatType === 'espacio') {
      if (!m.nombre) errores.push(`Espacio ${m.id}: falta nombre`)
      if (!m.proposito) errores.push(`Espacio ${m.id}: falta propósito`)
      if (!m.estado) errores.push(`Espacio ${m.id}: falta estado`)
      espacios.push({
        id: m.id, nombre: m.nombre, capa: m.capa, variabilidad: m.variabilidad,
        proposito: m.proposito,
        resumen: m.resumen || '',
        estado: m.estado || '',
        moduloRequerido: m.moduloRequerido || null,
        gobernadoPor: (m.gobernadoPor || '').split(',').map(x => x.trim()).filter(Boolean),
        vinculoReal: (m.vinculoReal || '').split(',').map(x => x.trim()).filter(Boolean).map(par => {
          const [sistema, ...resto] = par.split(':')
          return { sistema: sistema?.trim(), recordId: resto.join(':').trim() }
        }),
      })
    } else if (m.engremiatType === 'relacion') {
      if (m.origenId?.startsWith('(') || m.destinoId?.startsWith('(')) {
        errores.push(`Relación ${m.id}: falta fijar origen/destino real`)
      }
      relaciones.push({ id: m.id, origenId: m.origenId, destinoId: m.destinoId, tipo: m.tipo, nota: m.nota || '' })
    } else if (m.engremiatType === 'vaultNode') {
      otrosNodos.push({ id: m.id, nombre: m.nombre, tipoVault: m.tipoVault, resumen: m.resumen || '' })
    }
  }

  return { json: JSON.stringify({ espacios, relaciones, otrosNodos }, null, 2), errores }
}

// Paleta -- una entrada por cada figura base real (§8.9 del documento de
// Bastidor). "Relación" no crea nada por su cuenta: se dibuja con la
// herramienta de flecha nativa de tldraw y se conecta arrastrando sus dos
// extremos sobre dos cajas -- tldraw la liga sola, mismo mecanismo que ya
// usa "Cargar Núcleo/Universo real" por código.
const PALETA = [
  { tipoVault: 'espacio', etiqueta: 'Espacio', color: 'blue' },
  { tipoVault: 'personaje', etiqueta: 'Personaje', color: 'green' },
  { tipoVault: 'recurso', etiqueta: 'Recurso', color: 'yellow' },
  { tipoVault: 'modulo', etiqueta: 'Módulo', color: 'red' },
  { tipoVault: 'oficio', etiqueta: 'Herramienta (Oficio)', color: 'orange' },
  { tipoVault: 'regla', etiqueta: 'Regla', color: 'grey' },
]

function crearDesdesPaleta(editor, entrada) {
  const centro = editor.getViewportPageBounds().center
  const id = `shape:paleta_${nuevoIdRelativo(entrada.tipoVault)}`
  const nombre = `Nuevo ${entrada.etiqueta.toLowerCase()}`
  if (entrada.tipoVault === 'espacio') {
    editor.createShape({
      id, type: 'geo', x: centro.x - W_NODO_PALETA / 2, y: centro.y - H_NODO_PALETA / 2,
      props: { geo: 'rectangle', w: W_NODO_PALETA, h: H_NODO_PALETA, color: entrada.color, fill: 'semi', richText: toRichText(nombre) },
      meta: { engremiatType: 'espacio', id: nuevoIdRelativo('espacio'), nombre, capa: 'nucleo', variabilidad: 'configurable', proposito: '', resumen: '', moduloRequerido: '', gobernadoPor: '', estado: 'sin_definir', vinculoReal: '' },
    })
  } else {
    editor.createShape({
      id, type: 'geo', x: centro.x - W_NODO_PALETA / 2, y: centro.y - H_NODO_PALETA / 2,
      props: { geo: 'rectangle', w: W_NODO_PALETA, h: H_NODO_PALETA, color: entrada.color, fill: 'semi', richText: toRichText(nombre) },
      meta: { engremiatType: 'vaultNode', id: nuevoIdRelativo(entrada.tipoVault), nombre, tipoVault: entrada.tipoVault, estado: 'nuevo', resumen: '' },
    })
  }
  editor.select(id)
}

const W_NODO_PALETA = 200
const H_NODO_PALETA = 90

function descargar(nombreFichero, texto) {
  const blob = new Blob([texto], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nombreFichero
  a.click()
  URL.revokeObjectURL(url)
}

export default function App() {
  const [editor, setEditor] = useState(null)
  const [seleccion, setSeleccion] = useState(null)
  const [resultado, setResultado] = useState(null)
  const [infoCarga, setInfoCarga] = useState(null)
  const [tipoRelacionArmado, setTipoRelacionArmado] = useState(null)

  useEffect(() => {
    if (!editor) return
    const actualizar = () => {
      const seleccionadas = editor.getSelectedShapes()
      setSeleccion(seleccionadas.length === 1 ? seleccionadas[0] : null)
    }
    actualizar()
    const cancelar = editor.store.listen(actualizar, { source: 'user', scope: 'all' })
    return () => cancelar()
  }, [editor])

  // Paleta de relaciones (respuesta a "podemos crear una paleta de recursos
  // relacionales"): elegir un tipo la arma; la siguiente flecha que el
  // usuario dibuje a mano y suelte sobre dos cajas se etiqueta sola con ese
  // tipo -- sin pasar por "Convertir en Relación" + desplegable a mano.
  useEffect(() => {
    if (!editor || !tipoRelacionArmado) return
    const cancelar = editor.store.listen((entry) => {
      for (const registro of Object.values(entry.changes.added)) {
        if (registro.typeName !== 'shape' || registro.type !== 'arrow' || registro.meta?.engremiatType) continue
        const bindings = editor.getBindingsFromShape(registro.id, 'arrow')
        const inicio = bindings.find(b => b.props.terminal === 'start')
        const fin = bindings.find(b => b.props.terminal === 'end')
        if (!inicio || !fin) continue // no se soltó sobre dos cajas reales -- se deja como figura sin marcar
        const origen = editor.getShape(inicio.toId)
        const destino = editor.getShape(fin.toId)
        const idRel = nuevoIdRelativo('relacion')
        editor.updateShapes([{
          id: registro.id, type: 'arrow',
          meta: { engremiatType: 'relacion', id: idRel, origenId: origen?.meta?.id || inicio.toId, destinoId: destino?.meta?.id || fin.toId, tipo: tipoRelacionArmado, nota: '' },
          props: { richText: toRichText(tipoRelacionArmado) },
        }])
      }
    }, { source: 'user', scope: 'all' })
    return () => cancelar()
  }, [editor, tipoRelacionArmado])

  const shapeSeleccionadaViva = seleccion && editor ? editor.getShape(seleccion.id) : null

  return (
    <div className="bocetador-layout">
      <div className="bocetador-canvas">
        <Tldraw onMount={setEditor} />
      </div>
      <aside className="bocetador-panel">
        <h2>Bocetador Engremiat</h2>
        <p className="hint">Herramienta interna de diseño -- no de producción. Ver PROPUESTA_BASTIDOR_GESTOR_PROYECTOS_ENGREMIAT.md §8.</p>

        <div className="botones-globales">
          <button onClick={() => editor && cargarNucleoReal(editor)}>Cargar Núcleo (canvas, 7 nodos)</button>
          <button onClick={() => editor && setInfoCarga(cargarUniversoReal(editor))} className="destacado">Cargar Universo real (bóveda, {universoReal.espacios.length + universoReal.recursos.length + universoReal.modulos.length + universoReal.personajes.length + universoReal.oficios.length + universoReal.reglas.length} nodos)</button>
          <button onClick={() => editor && setResultado(exportar(editor))}>Exportar y validar</button>
        </div>
        {infoCarga && (
          <p className="hint">Cargado: {infoCarga.total} figuras. {infoCarga.sinResolver > 0 ? `${infoCarga.sinResolver} relación(es) del vault referencian un grupo descriptivo ("N Acervos-o-mecanismos") sin caja propia -- omitidas, no es un error.` : 'Todas las relaciones reales se dibujaron.'}</p>
        )}

        <div className="paleta">
          <h3>Paleta -- crear una figura nueva</h3>
          <p className="hint">Cada botón coloca una caja en blanco en el centro de la vista, ya con el tipo correcto -- selecciónala para rellenarla en el panel de abajo. Una Relación no se crea aquí: dibuja una flecha con la herramienta de flecha y suéltala sobre dos cajas -- tldraw la liga sola.</p>
          <div className="paleta-botones">
            {PALETA.map(entrada => (
              <button key={entrada.tipoVault} className={`paleta-boton paleta-${entrada.color}`} onClick={() => editor && crearDesdesPaleta(editor, entrada)}>
                + {entrada.etiqueta}
              </button>
            ))}
          </div>
          <details className="leyenda">
            <summary>Leyenda -- qué es cada figura, qué no</summary>
            {PALETA.map(entrada => {
              const l = LEYENDA_FIGURAS[entrada.tipoVault]
              if (!l) return null
              return (
                <div key={entrada.tipoVault} className="leyenda-item">
                  <strong className={`leyenda-color-${entrada.color}`}>{entrada.etiqueta}</strong> <span className="pregunta-inline">({l.pregunta})</span>
                  <p>{l.esto}</p>
                  <p className="leyenda-noes">No es: {l.noEs}</p>
                </div>
              )
            })}
          </details>
        </div>

        <div className="paleta">
          <h3>Paleta de relaciones</h3>
          <p className="hint">
            {tipoRelacionArmado
              ? <>Armado: <strong>{tipoRelacionArmado}</strong>. Dibuja una flecha (tecla A) y suéltala sobre dos cajas -- se etiqueta sola. <button className="paleta-limpiar" onClick={() => setTipoRelacionArmado(null)}>Quitar</button></>
              : 'Elige un tipo antes de dibujar la flecha -- así no hace falta "Convertir en Relación" + desplegable después.'}
          </p>
          {FAMILIAS_RELACION.map(({ familia, tipos }) => (
            <div key={familia} className="familia-relacion">
              <span className="familia-etiqueta">{familia}</span>
              <div className="paleta-botones">
                {tipos.map(tipo => (
                  <button
                    key={tipo}
                    className={`paleta-boton paleta-relacion ${tipoRelacionArmado === tipo ? 'armado' : ''}`}
                    onClick={() => { setTipoRelacionArmado(tipo); editor && editor.setCurrentTool('arrow') }}
                  >
                    {tipo}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="seleccion">
          {!shapeSeleccionadaViva && <p className="hint">Dibuja un rectángulo o una flecha con las herramientas de la izquierda, o selecciona una caja ya creada, para editarla aquí.</p>}
          {shapeSeleccionadaViva && shapeSeleccionadaViva.meta?.engremiatType === 'espacio' && <PanelEspacio editor={editor} shape={shapeSeleccionadaViva} />}
          {shapeSeleccionadaViva && shapeSeleccionadaViva.meta?.engremiatType === 'relacion' && <PanelRelacion editor={editor} shape={shapeSeleccionadaViva} />}
          {shapeSeleccionadaViva && shapeSeleccionadaViva.meta?.engremiatType === 'vaultNode' && <PanelNodoVault editor={editor} shape={shapeSeleccionadaViva} />}
          {shapeSeleccionadaViva && shapeSeleccionadaViva.meta?.engremiatType === 'referencia' && (
            <div className="panel-form">
              <h3>Referencia (no es un Espacio)</h3>
              <p className="hint">{shapeSeleccionadaViva.meta.nota}</p>
            </div>
          )}
          {shapeSeleccionadaViva && !shapeSeleccionadaViva.meta?.engremiatType && <PanelConvertir editor={editor} shape={shapeSeleccionadaViva} />}
        </div>

        {resultado && (
          <div className="resultado">
            <h3>{resultado.errores.length === 0 ? 'Válido' : `${resultado.errores.length} aviso(s)`}</h3>
            {resultado.errores.map((e, i) => <p key={i} className="error">{e}</p>)}
            <textarea readOnly rows={12} value={resultado.json} />
            <button onClick={() => descargar('boceto.json', resultado.json)}>Descargar JSON</button>
          </div>
        )}
      </aside>
    </div>
  )
}
