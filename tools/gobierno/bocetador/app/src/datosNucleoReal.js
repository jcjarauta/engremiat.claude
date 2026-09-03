// Contenido real tomado literalmente de los fixtures verificados en
// tools/gobierno/bocetador/fixtures/ (4 Espacios + 3 Relaciones, ya
// validados con validar_bocetador.mjs) y de las coordenadas reales de
// Arquitectura_Nucleo.canvas. Las relaciones reales conectan Espacios
// con otros nodos del canvas que no son Espacios (Constitucion, Puerta
// Humana, Relevo) -- esos se cargan tambien, marcados como "referencia"
// (no exportables como Espacio, solo contexto visual).

export const ESPACIOS_REALES = [
  { id: 'espacio_consola', nombre: 'Consola', capa: 'nucleo', variabilidad: 'capacidad_de_nucleo', proposito: 'Gobernar permisos, módulos, recursos, riesgos y salud del universo.', moduloRequerido: null, estado: 'activo', x: 0, y: 200 },
  { id: 'espacio_telar', nombre: 'Telar', capa: 'nucleo', variabilidad: 'capacidad_de_nucleo', proposito: 'Deliberar, componer decisiones, preparar Compromisos, dejar la Huella.', moduloRequerido: null, estado: 'activo', vinculoReal: [{ sistema: 'repo', recordId: 'tools/gobierno/telar/' }], x: 340, y: 200 },
  { id: 'espacio_archivo_vivo', nombre: 'Archivo Vivo', capa: 'nucleo', variabilidad: 'capacidad_de_nucleo', proposito: 'Consultar evidencia, decisiones, versiones, Huellas y memoria.', moduloRequerido: null, estado: 'activo', x: 680, y: 200 },
  { id: 'espacio_taller', nombre: 'Taller', capa: 'especifico', variabilidad: 'modular', proposito: 'Espacio de trabajo especifico de un modulo con dominio propio -- no todo universo lo recibe.', moduloRequerido: 'modulo_ejemplo_a_confirmar', estado: 'sin_definir', x: 1020, y: 200 },
]

// Nodos reales del canvas que participan en las 3 relaciones fixture
// pero no son Espacios -- se cargan como cajas de referencia (grises,
// discontinuas), nunca como entidades Espacio exportables.
export const REFERENCIAS_REALES = [
  { id: 'constitucion', nombre: 'Constitución', nota: 'Ley del Núcleo -- no es un Espacio.', x: 340, y: 0 },
  { id: 'puerta_humana', nombre: 'Puerta Humana', nota: 'Ley/interfaz de autorización -- no es un Espacio.', x: 340, y: 400 },
  { id: 'relevo', nombre: 'Relevo', nota: 'Oficio -- no es un Espacio.', x: 680, y: 400 },
]

export const RELACIONES_REALES = [
  { id: 'e1', origenId: 'constitucion', destinoId: 'espacio_consola', tipo: 'gobierna', nota: 'Arista real e1 de Arquitectura_Nucleo.canvas.' },
  { id: 'e6', origenId: 'espacio_telar', destinoId: 'puerta_humana', tipo: 'aloja', nota: 'Arista real e6 de Arquitectura_Nucleo.canvas.' },
  { id: 'e12', origenId: 'relevo', destinoId: 'espacio_archivo_vivo', tipo: 'deja_huella', nota: 'Arista real e12 de Arquitectura_Nucleo.canvas.' },
]

export const CAPAS = ['nucleo', 'especifico']
export const VARIABILIDADES = ['invariante', 'capacidad_de_nucleo', 'configurable', 'modular', 'experimental']
// Union real de dos fuentes -- ver relacion.schema.json §tipo: las 8
// aristas de Arquitectura_Nucleo.canvas mas las 8 ya en uso real en
// 07_Holon_Relaciones/ del vault (mas ricas, descubiertas via
// cargar_desde_vault.mjs).
export const TIPOS_RELACION = [
  'gobierna', 'gobierna_permisos', 'aloja', 'opera_dentro_de',
  'entrada_de_necesidades', 'deja_huella', 'documenta', 'acompana',
  'activa_a', 'alimenta_a', 'corrige_a', 'depende_de', 'gobierna_a',
  'opera_en', 'parte_de', 'verifica_a',
]

// Leyenda real de cada figura base -- las 8 preguntas a las que responde
// cada una, para que un operador nuevo (humano o IA) sepa en que flujo
// encaja cada bloque de la paleta sin tener que leer los esquemas .json
// directamente. Texto derivado de las descripciones reales de cada
// schemas/*.json, nunca inventado aparte (§8.15).
export const LEYENDA_FIGURAS = {
  espacio: { pregunta: 'Dónde', esto: 'Un lugar del universo donde algo pasa -- gobernar, deliberar, consultar. Núcleo (todo universo lo recibe) o específico (solo si un módulo lo activa).', noEs: 'No es una entidad de negocio ni una persona -- si tiene coste o stock, es Recurso.' },
  personaje: { pregunta: 'Quién', esto: 'Quién actúa -- humano, IA o sistema. 5 familias reales (Vocal de contenido, Guardián, Gobierno-protocolo, Oficio, Acompañante), nunca una sexta inventada sobre la marcha.', noEs: 'No es un script -- si automatiza algo sin voz propia, es Herramienta.' },
  recurso: { pregunta: 'Cuánto', esto: 'Algo que se gasta, se agota o tiene coste -- operativo/de gobierno (presupuesto, cola de trabajo) o físico/de negocio (material, equipo).', noEs: 'No es un lugar -- si es donde pasa algo, es Espacio.' },
  modulo: { pregunta: 'Con qué', esto: 'Un interruptor real de código (MODULO_POR_ENTIDAD_MVP) que activa un conjunto de entidades del Sheet -- CORE siempre, los otros 11 solo si el cliente los contrata.', noEs: 'No es una pestaña del Sheet -- no tiene filas propias, etiqueta a otras.' },
  oficio: { pregunta: 'Cómo', esto: 'Un mecanismo automatizable con dueño y disparador real (manual, cron, trigger remoto, webhook, bus de trabajo).', noEs: 'No es un rol con voz narrativa -- si delibera o tiene personalidad, es Personaje-Oficio, no esto.' },
  regla: { pregunta: 'Por qué', esto: 'Un principio de gobierno del universo entero, de 03_Reglas/ -- por qué existe una restricción, no una decisión concreta de un proyecto.', noEs: 'No es una decisión de proyecto -- eso es 12_DECISIONES del Sheet, un primo lejano, no lo mismo.' },
}

// Mismos 16 tipos, agrupados por familia -- solo para la paleta (§8.9),
// no cambia el vocabulario cerrado del esquema, solo cómo se presenta.
export const FAMILIAS_RELACION = [
  { familia: 'Gobierno', tipos: ['gobierna', 'gobierna_a', 'gobierna_permisos'] },
  { familia: 'Estructura', tipos: ['aloja', 'opera_dentro_de', 'opera_en', 'parte_de'] },
  { familia: 'Flujo', tipos: ['alimenta_a', 'depende_de', 'entrada_de_necesidades'] },
  { familia: 'Verificación', tipos: ['verifica_a', 'corrige_a'] },
  { familia: 'Memoria', tipos: ['deja_huella', 'documenta'] },
  { familia: 'Acompañamiento', tipos: ['acompana', 'activa_a'] },
]
