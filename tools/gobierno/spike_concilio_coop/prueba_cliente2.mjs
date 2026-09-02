import WebSocket from 'ws';

function conectar(nombre, retrasoMs, textoAEnviar) {
  const ws = new WebSocket('ws://localhost:2567');
  ws.on('open', () => {
    console.log('[' + nombre + '] conectado.');
    if (textoAEnviar) setTimeout(() => ws.send(JSON.stringify({ tipo: 'proponer', texto: textoAEnviar })), retrasoMs);
  });
  ws.on('message', (data) => {
    const m = JSON.parse(data.toString());
    if (m.tipo === 'bienvenida') console.log('[' + nombre + '] BIENVENIDA: eres ' + m.acervo + ' (' + m.humanosConectados + ' humanos en sala)');
    else if (m.tipo === 'sistema') console.log('[' + nombre + '] SISTEMA: ' + m.texto);
    else if (m.tipo === 'mensaje') console.log('[' + nombre + '] ve -> [' + m.autor + (m.esIA ? ' IA' : '') + ']: ' + m.texto);
    else if (m.tipo === 'coste') console.log('[' + nombre + '] coste real: $' + m.costeTotalUsd.toFixed(6));
  });
  return ws;
}

const a = conectar('CLIENTE-A', 500, 'Propongo cerrar el Telar solo para historias, sin tocar proyectos reales de clientes.');
setTimeout(() => conectar('CLIENTE-B', 0, null), 300);

setTimeout(() => { console.log('\nFIN DE LA PRUEBA.'); process.exit(0); }, 45000);
